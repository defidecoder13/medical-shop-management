import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";
import Bill from "@/src/models/Bill";
import Settings from "@/src/models/Settings";
import { createSaleJournalEntry } from "@/src/lib/accounting";

export async function POST(req: Request) {
  // 🔁 Keep original batch states for rollback
  const updatedBatches: {
    _id: string;
    stock: number;
    totalTabletsInStock: number;
  }[] = [];

  try {
    await connectDB();

    const {
      items = [],
      printInvoice = false,
      discountPercent = 0,
      gstEnabled: reqGstEnabled,
      patientName,
      patientPhone,
      doctorName
    } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No bill items provided" },
        { status: 400 }
      );
    }

    const settings = await Settings.findOne();
    // Use request toggle if provided, otherwise fallback to settings
    const gstEnabled = reqGstEnabled !== undefined ? reqGstEnabled : (settings?.gstEnabled ?? false);

    let subTotal = 0;
    const billItems: any[] = [];

    for (const item of items) {
      // item.medicineId from the frontend is actually the Batch ID because of the flattened UI
      const requestedBatch = await MedicineBatch.findById(item.medicineId).populate('medicineId');

      if (!requestedBatch) {
        return NextResponse.json(
          { error: `Item/Batch not found: ${item.name}` },
          { status: 400 }
        );
      }

      const masterMedicine = requestedBatch.medicineId;

      // Calculate total tablets requested
      let tabletsRequested = 0;
      if (item.unitType === "strip") {
        tabletsRequested = item.qty * masterMedicine.tabletsPerStrip;
      } else {
        tabletsRequested = item.qty;
      }

      // Query all batches for this master medicine, sorted by expiry Date ascending (FEFO)
      const allBatches = await MedicineBatch.find({ 
        medicineId: masterMedicine._id, 
        totalTabletsInStock: { $gt: 0 } 
      }).sort({ expiryDate: 1 });

      const totalAvailable = allBatches.reduce((sum, b) => sum + b.totalTabletsInStock, 0);
      if (totalAvailable < tabletsRequested) {
        return NextResponse.json(
          { error: `Insufficient total stock for: ${masterMedicine.name}. Available: ${totalAvailable} tablets.` },
          { status: 400 }
        );
      }

      let remainingTabletsToDeduct = tabletsRequested;
      let totalCostAccumulated = 0;
      const batchesUsed = [];

      // 🔐 Apply FEFO (First Expire, First Out) Deduction
      for (const batch of allBatches) {
        if (remainingTabletsToDeduct <= 0) break;

        // Save state for rollback
        updatedBatches.push({
          _id: batch._id.toString(),
          stock: batch.stock,
          totalTabletsInStock: batch.totalTabletsInStock,
        });

        const tabletsToDeductFromThisBatch = Math.min(batch.totalTabletsInStock, remainingTabletsToDeduct);
        
        batch.totalTabletsInStock -= tabletsToDeductFromThisBatch;
        batch.stock = batch.totalTabletsInStock / masterMedicine.tabletsPerStrip;
        await batch.save();

        remainingTabletsToDeduct -= tabletsToDeductFromThisBatch;

        // Calculate cost for this portion
        const unitCostPerTablet = batch.buyingPricePerStrip / masterMedicine.tabletsPerStrip;
        totalCostAccumulated += (tabletsToDeductFromThisBatch * unitCostPerTablet);

        batchesUsed.push(batch.batchNumber);
      }

      const itemTotal = item.sellingPrice * item.qty;
      subTotal += itemTotal;

      // Calculate the average buying price per sold unit (strip or tablet)
      const avgBuyingPrice = item.unitType === "strip" 
        ? totalCostAccumulated / item.qty
        : totalCostAccumulated / item.qty;

      billItems.push({
        name: masterMedicine.name,
        brand: masterMedicine.brand,
        batchNumber: batchesUsed.join(", "), // Log all batches used in FEFO
        expiryDate: requestedBatch.expiryDate, 
        hsnCode: masterMedicine.hsnCode,
        unitType: item.unitType,
        qty: item.qty,
        sellingPrice: item.sellingPrice,
        buyingPrice: avgBuyingPrice,
        total: itemTotal,
      });
    }

    // Calculate discount (preserve decimals)
    const discountAmount = subTotal * (discountPercent / 100);
    const subTotalAfterDiscount = subTotal - discountAmount;

    const gstPercent = settings?.defaultGstPercent ?? 0; // Default to 0 if not set in settings
    const gstAmount = gstEnabled ? subTotalAfterDiscount * (gstPercent / 100) : 0;
    const grandTotal = subTotalAfterDiscount + gstAmount;

    // Round only the final totals for storage
    const roundedDiscountAmount = Math.round(discountAmount * 100) / 100;
    const roundedGstAmount = Math.round(gstAmount * 100) / 100;
    const roundedGrandTotal = Math.round(grandTotal * 100) / 100;

    // 💾 CREATE BILL
    const bill = await Bill.create({
      items: billItems,
      subTotal,
      discountPercent,
      discountAmount: roundedDiscountAmount,
      gstAmount: roundedGstAmount,
      gstPercent: gstEnabled ? gstPercent : 0,
      grandTotal: roundedGrandTotal,
      gstEnabled,
      printInvoice,
      patientName,
      patientPhone,
      doctorName,
    });

    // 🏦 ACCOUNTING: Create Double Entry Journal
    await createSaleJournalEntry(bill);

    // 🧑‍⚕️ PATIENT CRM: Update or Create Patient Record
    if (patientPhone) {
      // Lazy load to prevent cyclic dependencies if any
      const Patient = (await import("@/src/models/Patient")).default;
      
      let patient = await Patient.findOne({ phone: patientPhone });
      if (patient) {
        // Update total spent and latest doctor
        patient.totalSpent += roundedGrandTotal;
        if (patientName) patient.name = patientName;
        if (doctorName) patient.doctorName = doctorName;
        await patient.save();
      } else {
        // Create brand new profile
        await Patient.create({
          name: patientName || "Guest",
          phone: patientPhone,
          doctorName: doctorName || "",
          totalSpent: roundedGrandTotal
        });
      }
    }

    return NextResponse.json(bill);
  } catch (error) {
    // 🔁 ROLLBACK BATCH STOCK ON ERROR
    for (const b of updatedBatches) {
      await MedicineBatch.findByIdAndUpdate(b._id, {
        stock: b.stock,
        totalTabletsInStock: b.totalTabletsInStock,
      });
    }

    console.error("BILLING ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
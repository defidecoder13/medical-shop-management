import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";
import Bill from "@/src/models/Bill";
import Settings from "@/src/models/Settings";
import Medicine from "@/src/models/Medicine";
import mongoose from "mongoose";
import { deleteCache, setCache } from "@/src/lib/redis";

export async function POST(req: Request) {
  // 🔁 Keep original batch states for rollback
  const updatedBatches: {
    _id: string;
    stock: number;
    totalTabletsInStock: number;
  }[] = [];

  try {
    await connectDB();
    const session = await mongoose.startSession();
    
    let result: any;
    
    try {
      await session.withTransaction(async () => {

    const {
      items = [],
      printInvoice = false,
      discountPercent = 0,
      gstEnabled: reqGstEnabled,
      patientName,
      patientPhone,
      patientAddress,
      doctorName,
      paymentMethod = "Cash",
    } = await req.json();

    if (!items || items.length === 0) {
      throw new Error("No bill items provided");
    }

    const settings = await Settings.findOne();
    // Use request toggle if provided, otherwise fallback to settings
    const gstEnabled = reqGstEnabled !== undefined ? reqGstEnabled : (settings?.gstEnabled ?? false);

    let subTotal = 0;
    let accumulatedDiscountAmount = 0;
    let accumulatedGstAmount = 0;
    const billItems: any[] = [];

    // 🔥 BULK FETCH BATCHES FOR PERFORMANCE
    const batchIds = items.map((i: any) => i.medicineId);
    const requestedBatches = await MedicineBatch.find({ _id: { $in: batchIds } }).populate('medicineId').session(session);
    const batchMap = new Map(requestedBatches.map(b => [b._id.toString(), b]));

    const batchBulkOps = [];
    const medicineBulkOps = [];

    for (const item of items) {
      const requestedBatch = batchMap.get(item.medicineId);

      if (!requestedBatch) {
        throw new Error(`Item/Batch not found: ${item.name}`);
      }

      const masterMedicine = requestedBatch.medicineId;

      // Calculate total tablets requested
      let tabletsRequested = 0;
      if (item.unitType === "strip") {
        tabletsRequested = item.qty * masterMedicine.tabletsPerStrip;
      } else {
        tabletsRequested = item.qty;
      }

      // Enforce strict stock check on the selected batch
      if (requestedBatch.totalTabletsInStock < tabletsRequested) {
        throw new Error(`Insufficient stock in batch ${requestedBatch.batchNumber} for ${masterMedicine.name}. Available: ${requestedBatch.totalTabletsInStock} tablets.`);
      }

      // Save state for rollback
      updatedBatches.push({
        _id: requestedBatch._id.toString(),
        stock: requestedBatch.stock,
        totalTabletsInStock: requestedBatch.totalTabletsInStock,
      });

      // Update in-memory stock to catch duplicates in the same loop
      requestedBatch.totalTabletsInStock -= tabletsRequested;
      requestedBatch.stock = requestedBatch.totalTabletsInStock / masterMedicine.tabletsPerStrip;

      // Prepare bulk updates using $inc
      const stockDeduction = tabletsRequested / masterMedicine.tabletsPerStrip;
      
      batchBulkOps.push({
        updateOne: {
          filter: { _id: requestedBatch._id },
          update: { $inc: { stock: -stockDeduction, totalTabletsInStock: -tabletsRequested } }
        }
      });
      
      medicineBulkOps.push({
        updateOne: {
          filter: { _id: masterMedicine._id },
          update: { $inc: { stock: -stockDeduction } }
        }
      });

      // Calculate cost
      const unitCostPerTablet = requestedBatch.buyingPricePerStrip / masterMedicine.tabletsPerStrip;
      const totalCostAccumulated = tabletsRequested * unitCostPerTablet;

      const itemTotal = item.sellingPrice * item.qty;
      subTotal += itemTotal;

      const itemDiscountPercent = Number(item.discountPercent) || 0;
      const itemDiscountAmount = Math.round(itemTotal * (itemDiscountPercent / 100) * 100) / 100;
      accumulatedDiscountAmount += itemDiscountAmount;

      // Calculate item GST
      const itemTaxableValue = itemTotal - itemDiscountAmount;
      const itemGstPercent = masterMedicine.gstPercent || 0;
      const itemGstAmount = gstEnabled ? Math.round(itemTaxableValue * (itemGstPercent / 100) * 100) / 100 : 0;
      accumulatedGstAmount += itemGstAmount;

      // Calculate the average buying price per sold unit (strip or tablet)
      const avgBuyingPrice = item.unitType === "strip" 
        ? totalCostAccumulated / item.qty
        : totalCostAccumulated / item.qty;

      billItems.push({
        name: masterMedicine.name,
        brand: masterMedicine.brand,
        batchNumber: requestedBatch.batchNumber,
        expiryDate: requestedBatch.expiryDate, 
        hsnCode: masterMedicine.hsnCode,
        pack: item.pack,
        unitType: item.unitType,
        qty: item.qty,
        sellingPrice: item.sellingPrice,
        buyingPrice: avgBuyingPrice,
        total: itemTotal,
        discountPercent: itemDiscountPercent,
        discountAmount: itemDiscountAmount,
        gstPercent: itemGstPercent,
        gstAmount: itemGstAmount,
      });
    }

    // 🔥 EXECUTE BULK WRITES
    if (batchBulkOps.length > 0) {
      await MedicineBatch.bulkWrite(batchBulkOps, { session });
    }
    if (medicineBulkOps.length > 0) {
      await Medicine.bulkWrite(medicineBulkOps, { session });
    }

    // Calculate discount (preserve decimals)
    const discountAmount = accumulatedDiscountAmount;
    const subTotalAfterDiscount = subTotal - discountAmount;
    const gstAmount = accumulatedGstAmount;
    const grandTotal = subTotalAfterDiscount + gstAmount;

    // Round only the final totals for storage
    const roundedDiscountAmount = Math.round(discountAmount * 100) / 100;
    const roundedGstAmount = Math.round(gstAmount * 100) / 100;
    
    // Nearest Rupee rounding
    const finalGrandTotal = Math.round(grandTotal);
    const roundingAdjustment = Math.round((finalGrandTotal - grandTotal) * 100) / 100;

    const calculatedDiscountPercent = subTotal > 0 ? Math.round((roundedDiscountAmount / subTotal) * 100 * 100) / 100 : 0;
    const calculatedGstPercent = subTotalAfterDiscount > 0 ? Math.round((roundedGstAmount / subTotalAfterDiscount) * 100 * 100) / 100 : 0;

    // 💡 GENERATE INVOICE NUMBER
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // Count bills created today
    const todayCount = await Bill.countDocuments({ 
      createdAt: { $gte: startOfDay, $lte: endOfDay } 
    }).session(session);
    
    // Format: MS-YYMMDD-001
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const sequence = (todayCount + 1).toString().padStart(3, '0');
    const invoiceNumber = `MS-${dateStr}-${sequence}`;

    // 💾 CREATE BILL
    const bill = await Bill.create([{
      invoiceNumber,
      items: billItems,
      subTotal,
      discountPercent: calculatedDiscountPercent,
      discountAmount: roundedDiscountAmount,
      gstAmount: roundedGstAmount,
      gstPercent: gstEnabled ? calculatedGstPercent : 0,
      grandTotal: finalGrandTotal,
      roundingAdjustment: roundingAdjustment,
      gstEnabled,
      printInvoice,
      patientName,
      patientPhone,
      patientAddress,
      doctorName,
      paymentMethod,
    }], { session }).then(res => res[0]);


    // 🧑‍⚕️ PATIENT CRM: Update or Create Patient Record
    if (patientPhone) {
      // Lazy load to prevent cyclic dependencies if any
      const Patient = (await import("@/src/models/Patient")).default;
      
      let patient = await Patient.findOne({ phone: patientPhone }).session(session);
      if (patient) {
        // Update total spent and latest doctor
        patient.totalSpent += finalGrandTotal;
        if (patientName) patient.name = patientName;
        if (patientAddress) patient.address = patientAddress;
        if (doctorName) patient.doctorName = doctorName;
        await patient.save({ session });
      } else {
        // Create brand new profile
        await Patient.create([{
          name: patientName || "Guest",
          phone: patientPhone,
          address: patientAddress || "",
          doctorName: doctorName || "",
          totalSpent: finalGrandTotal
        }], { session });
      }
    }

    result = bill;
    }); // end withTransaction
    } finally {
      session.endSession();
    }
    
    // Invalidate Redis catalog cache to instantly reflect the new stock everywhere
    await deleteCache("catalog:all");
    await setCache("catalog:version", Date.now().toString(), 604800);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("BILLING ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bill" },
      { status: 500 }
    );
  }
}
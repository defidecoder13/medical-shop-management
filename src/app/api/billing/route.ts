import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import Bill from "@/src/models/Bill";
import Settings from "@/src/models/Settings";

export async function POST(req: Request) {
  // 🔁 Keep original medicine states for rollback
  const updatedMeds: {
    _id: string;
    stock: number;
    totalTabletsInStock: number;
  }[] = [];

  try {
    await connectDB();

    const { items = [], printInvoice = false, discountPercent = 0, gstEnabled: reqGstEnabled } = await req.json();

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
      const medicine = await Medicine.findById(item.medicineId);

      if (!medicine) {
        return NextResponse.json(
          { error: `Medicine not found: ${item.name}` },
          { status: 400 }
        );
      }

      // 🔐 Save state for rollback
      updatedMeds.push({
        _id: medicine._id.toString(),
        stock: medicine.stock,
        totalTabletsInStock: medicine.totalTabletsInStock,
      });

      // Check stock
      let stockToDeduct = 0;
      if (item.unitType === "strip") {
        stockToDeduct = item.qty;
      } else {
        stockToDeduct = item.qty / (medicine.tabletsPerStrip || 1);
      }

      if (medicine.stock < stockToDeduct) {
        return NextResponse.json(
          { error: `Insufficient stock for: ${item.name}` },
          { status: 400 }
        );
      }

      // Decrement stock
      medicine.stock -= stockToDeduct;
      // Also update totalTabletsInStock for consistency
      medicine.totalTabletsInStock = medicine.stock * (medicine.tabletsPerStrip || 1);
      await medicine.save();

      // Calculate Buying Price for this item (Unit Cost)
      let unitBuyingPrice = 0;
      if (item.unitType === "strip") {
        unitBuyingPrice = medicine.buyingPricePerStrip || 0;
      } else {
        // Cost per tablet
        unitBuyingPrice = (medicine.buyingPricePerStrip || 0) / (medicine.tabletsPerStrip || 1);
      }

      // Recalculate item total to be safe
      const itemTotal = item.sellingPrice * item.qty;
      subTotal += itemTotal;

      billItems.push({
        name: medicine.name, // Take from DB for absolute certainty
        batchNumber: medicine.batchNumber, // Take from DB for absolute certainty
        unitType: item.unitType,
        qty: item.qty,
        sellingPrice: item.sellingPrice,
        buyingPrice: unitBuyingPrice,
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
    });

    return NextResponse.json(bill);
  } catch (error) {
    // 🔁 ROLLBACK MEDICINE STOCK
    for (const m of updatedMeds) {
      await Medicine.findByIdAndUpdate(m._id, {
        stock: m.stock,
        totalTabletsInStock: m.totalTabletsInStock,
      });
    }

    console.error("BILLING ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
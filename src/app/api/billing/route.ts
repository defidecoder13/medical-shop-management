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

    const { items = [], printInvoice = false } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No bill items provided" },
        { status: 400 }
      );
    }

    const settings = await Settings.findOne();
    const gstEnabled = settings?.gstEnabled ?? false;

    let subTotal = 0;
    const billItems: any[] = [];

    for (const item of items) {
      const med = await Medicine.findById(item.medicineId);

      if (!med) {
        throw new Error("Medicine not found");
      }

      // 🔐 Save state for rollback
      updatedMeds.push({
        _id: med._id.toString(),
        stock: med.stock,
        totalTabletsInStock: med.totalTabletsInStock,
      });

      // 📉 Stock deduction
      if (item.unitType === "tablet") {
        if (med.totalTabletsInStock < item.qty) {
          throw new Error(`Insufficient tablets for ${med.name}`);
        }
        med.totalTabletsInStock -= item.qty;
      } else {
        const needed = item.qty * med.tabletsPerStrip;
        if (med.totalTabletsInStock < needed) {
          throw new Error(`Insufficient strips for ${med.name}`);
        }
        med.totalTabletsInStock -= needed;
      }

      // 🔄 Auto recalc strips
      med.stock = Math.floor(
        med.totalTabletsInStock / med.tabletsPerStrip
      );

      await med.save();

      const lineTotal = item.sellingPrice * item.qty;
      subTotal += lineTotal;

      billItems.push({
        name: med.name,
        batchNumber: med.batchNumber,
        unitType: item.unitType,
        qty: item.qty,
        sellingPrice: item.sellingPrice,
        total: lineTotal,
      });
    }

    const gstAmount = gstEnabled ? Math.round(subTotal * 0.05) : 0;
    const grandTotal = subTotal + gstAmount;

    // 💾 CREATE BILL (THIS WAS FAILING BEFORE)
    const bill = await Bill.create({
      items: billItems,
      subTotal,
      gstAmount,
      grandTotal,
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
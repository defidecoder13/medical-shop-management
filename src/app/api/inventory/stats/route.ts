import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";
import Medicine from "@/src/models/Medicine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // 1. Total Items (Unique Medicines in Master)
    const totalItems = await Medicine.countDocuments();

    // 2. Fetch all batches to calculate exact values
    const batches = await MedicineBatch.find({}).populate("medicineId").lean();

    let totalStockValue = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0;
    let outOfStockCount = 0;

    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    for (const batch of batches) {
      const medId = batch.medicineId?._id?.toString();
      if (!medId) continue;

      const stock = batch.stock || 0;
      const buyingPrice = batch.buyingPricePerStrip || 0;
      
      // Total Stock Value
      totalStockValue += (stock * buyingPrice);

      // Batch Status Counts (matches inventory table filters)
      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= 10) {
        lowStockCount++;
      }

      // Expiring Soon
      if (batch.expiryDate) {
        const expDate = new Date(batch.expiryDate);
        // If it's expiring within 30 days and not already expired long ago
        if (expDate <= next30Days && expDate >= today) {
          expiringSoonCount++;
        }
      }
    }

    return NextResponse.json({
      totalItems,
      totalStockValue,
      lowStockItems: lowStockCount,
      expiringSoon: expiringSoonCount,
      outOfStock: outOfStockCount
    });

  } catch (error) {
    console.error("INVENTORY STATS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory stats" },
      { status: 500 }
    );
  }
}

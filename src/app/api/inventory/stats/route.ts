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

    // Track total stock per medicine to determine "Out of Stock" correctly
    // (A medicine is out of stock ONLY if ALL its batches sum to 0)
    const medicineStockMap: Record<string, number> = {};
    const medicineMinStockMap: Record<string, number> = {};

    for (const batch of batches) {
      const medId = batch.medicineId?._id?.toString();
      if (!medId) continue;

      const stock = batch.stock || 0;
      const buyingPrice = batch.buyingPricePerStrip || 0;
      
      // Total Stock Value
      totalStockValue += (stock * buyingPrice);

      // Expiring Soon
      if (batch.expiryDate) {
        const expDate = new Date(batch.expiryDate);
        // If it's expiring within 30 days and not already expired long ago
        if (expDate <= next30Days && expDate >= today) {
          expiringSoonCount++;
        }
      }

      // Aggregate stock for master medicine
      if (medicineStockMap[medId] === undefined) {
        medicineStockMap[medId] = 0;
        medicineMinStockMap[medId] = batch.medicineId?.minStockLevel || 5;
      }
      medicineStockMap[medId] += stock;
    }

    // Process aggregated medicine stocks for Low Stock and Out of Stock
    for (const [medId, totalStock] of Object.entries(medicineStockMap)) {
      if (totalStock <= 0) {
        outOfStockCount++;
      } else if (totalStock <= medicineMinStockMap[medId]) {
        lowStockCount++;
      }
    }

    // In case there are Master Medicines with NO batches, they are also Out of Stock.
    // Let's get the master medicines that aren't in the medicineStockMap or have 0
    const allMedicines = await Medicine.find({}, '_id stock minStockLevel').lean();
    outOfStockCount = 0;
    lowStockCount = 0;

    for (const med of allMedicines) {
        const medId = med._id.toString();
        const totalStock = medicineStockMap[medId] || 0;
        const minStockLevel = med.minStockLevel || 5;

        if (totalStock <= 0) {
            outOfStockCount++;
        } else if (totalStock <= minStockLevel) {
            lowStockCount++;
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

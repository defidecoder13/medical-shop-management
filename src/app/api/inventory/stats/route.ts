import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";
import Medicine from "@/src/models/Medicine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const [totalItems, agg] = await Promise.all([
      Medicine.countDocuments(),
      MedicineBatch.aggregate([
        {
          $group: {
            _id: null,
            totalStockValue: {
              $sum: { $multiply: [{ $ifNull: ["$stock", 0] }, { $ifNull: ["$buyingPricePerStrip", 0] }] },
            },
            lowStockItems: {
              $sum: { $cond: [{ $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] }, 1, 0] },
            },
            outOfStock: { $sum: { $cond: [{ $lte: [{ $ifNull: ["$stock", 0] }, 0] }, 1, 0] } },
            expiringSoon: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$expiryDate", null] },
                      { $gte: ["$expiryDate", today] },
                      { $lte: ["$expiryDate", next30Days] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const stats = agg[0] || { totalStockValue: 0, lowStockItems: 0, outOfStock: 0, expiringSoon: 0 };

    return NextResponse.json(
      {
        totalItems,
        totalStockValue: stats.totalStockValue || 0,
        lowStockItems: stats.lowStockItems || 0,
        expiringSoon: stats.expiringSoon || 0,
        outOfStock: stats.outOfStock || 0,
      },
      { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" } }
    );

  } catch (error) {
    console.error("INVENTORY STATS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory stats" },
      { status: 500 }
    );
  }
}

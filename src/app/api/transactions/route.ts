import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import Medicine from "@/src/models/Medicine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const query = Bill.find(filter).sort({ createdAt: -1 });

    if (limit !== "none") {
      query.limit(100);
    }

    const bills = await query.lean();

    // Calculate profit for each bill
    const billsWithProfit = await Promise.all(bills.map(async (bill) => {
      let totalProfit = 0;

      // For each item in the bill, calculate profit based on buying price
      for (const item of bill.items) {
        // Find the medicine in inventory to get buying price
        const medicine = await Medicine.findOne({
          name: item.name,
          batchNumber: item.batchNumber
        }).lean();

        if (medicine && item.sellingPrice !== undefined && item.qty !== undefined) {
          // Calculate profit per unit
          const sellingPrice = item.sellingPrice || 0;
          const buyingPrice = medicine.buyingPrice || 0;
          const qty = item.qty || 0;

          // Calculate profit per unit
          const profitPerUnit = sellingPrice - buyingPrice;
          // Calculate total profit for this item
          totalProfit += profitPerUnit * qty;
        }
      }

      return {
        ...bill,
        _id: bill._id.toString(),
        profit: Math.max(0, totalProfit), // Ensure profit is not negative
      };
    }));

    return NextResponse.json(billsWithProfit);
  } catch (error) {
    console.error("TRANSACTIONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
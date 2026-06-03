import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import MedicineBatch from "@/src/models/MedicineBatch";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const page = parseInt(pageParam || "1");
    const pageSize = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const range = searchParams.get("range");
    const limit = searchParams.get("limit");
    const paymentMethod = searchParams.get("paymentMethod");
    const status = searchParams.get("status");

    const filter: any = {};
    if (range && range !== "all") {
      const end = new Date();
      const start = new Date();
      if (range === "1d") start.setHours(0, 0, 0, 0);
      else if (range === "7d") start.setDate(end.getDate() - 7);
      else if (range === "1m") start.setMonth(end.getMonth() - 1);
      filter.createdAt = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
        filter.$or = [
            { "items.name": { $regex: search, $options: "i" } },
            { patientName: { $regex: search, $options: "i" } },
            { patientPhone: { $regex: search, $options: "i" } },
            { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: search, options: "i" } } },
            { $expr: { $regexMatch: { input: { $toString: "$grandTotal" }, regex: search, options: "i" } } }
        ];
    }

    if (paymentMethod && paymentMethod !== "all") {
        filter.paymentMethod = paymentMethod;
    }

    if (status && status !== "all") {
        if (status === "completed") {
            filter.isReturn = false;
        } else if (status === "refunded") {
            filter.isReturn = true;
        }
    }

    const totalCount = await Bill.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);

    const [summaryResult] = await Bill.aggregate([
      { $match: filter },
      { $group: {
          _id: null,
          totalSales: { $sum: { $cond: [{ $eq: ["$isReturn", false] }, "$grandTotal", 0] } },
          totalSalesCount: { $sum: { $cond: [{ $eq: ["$isReturn", false] }, 1, 0] } },
          totalRefunds: { $sum: { $cond: [{ $eq: ["$isReturn", true] }, "$grandTotal", 0] } },
          totalRefundsCount: { $sum: { $cond: [{ $eq: ["$isReturn", true] }, 1, 0] } },
          totalItemsSold: {
            $sum: {
              $cond: [
                { $eq: ["$isReturn", false] },
                { $sum: "$items.qty" },
                0
              ]
            }
          }
      }}
    ]);

    const summary = summaryResult || {
      totalSales: 0,
      totalSalesCount: 0,
      totalRefunds: 0,
      totalRefundsCount: 0,
      totalItemsSold: 0
    };

    const query = Bill.find(filter).sort({ createdAt: -1 });

    if (limit !== "none") {
      query.skip((page - 1) * pageSize).limit(pageSize);
    }

    const bills = await query.lean();

    // Calculate profit for each bill
    const billsWithProfit = await Promise.all(bills.map(async (bill) => {
      let totalProfit = 0;

      if (bill.isReturn) {
        return {
          ...bill,
          _id: bill._id.toString(),
          profit: 0,
        };
      }

      // For each item in the bill, calculate profit based on buying price
      for (const item of bill.items) {
        const netQty = (item.qty || 0) - (item.returnedQty || 0);
        if (netQty <= 0) continue;

        const sellingPrice = item.sellingPrice || 0;
        let buyingPrice = 0;

        if (item.buyingPrice !== undefined && item.buyingPrice !== null) {
          // Best source: buying price stored on bill at time of sale
          buyingPrice = item.buyingPrice;
        } else if (item.batchNumber) {
          // Fallback: look up batch from inventory
          const batch = await MedicineBatch.findOne({
            batchNumber: item.batchNumber
          }).lean() as any;
          if (batch) {
            buyingPrice = item.unitType === 'strip'
              ? (batch.buyingPricePerStrip || 0)
              : (batch.buyingPricePerStrip || 0) / (batch.tabletsPerStrip || 1);
          }
        }

        const profitPerUnit = sellingPrice - buyingPrice;
        totalProfit += profitPerUnit * netQty;
      }

      return {
        ...bill,
        _id: bill._id.toString(),
        profit: totalProfit,
      };
    }));

    if (pageParam) {
      return NextResponse.json({
          data: billsWithProfit,
          summary,
          pagination: {
              totalCount,
              totalPages,
              currentPage: page,
              limit: pageSize
          }
      });
    } else {
      return NextResponse.json(billsWithProfit);
    }
  } catch (error) {
    console.error("TRANSACTIONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
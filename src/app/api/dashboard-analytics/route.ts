
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import MedicineBatch from "@/src/models/MedicineBatch";

export const dynamic = "force-dynamic";

import { getCache, setCache } from "@/src/lib/redis";

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';

        const cacheKey = `dashboard:stats:${range}`;
        const cachedData = await getCache<any>(cacheKey);
        if (cachedData) {
            return NextResponse.json(cachedData);
        }

        // Aggregated stats — no full collection scan in Node
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        const [salesAgg, stockAgg, expAgg] = await Promise.all([
          Bill.aggregate([
            { $match: { isReturn: { $ne: true } } },
            {
              $group: {
                _id: null,
                totalSales: { $sum: "$grandTotal" },
                totalOrders: { $sum: 1 },
                bills: { $push: { patientName: "$patientName", patientPhone: "$patientPhone", grandTotal: "$grandTotal", createdAt: "$createdAt", items: "$items", _id: "$_id" } },
              },
            },
          ]),
          MedicineBatch.aggregate([
            { $group: { _id: null, lowStockItems: { $sum: { $cond: [{ $lte: [{ $ifNull: ["$stock", 0] }, 10] }, 1, 0] } } } },
          ]),
          MedicineBatch.countDocuments({ expiryDate: { $gte: today, $lte: nextMonth } }),
        ]);

        const salesData = salesAgg[0] || { totalSales: 0, totalOrders: 0, bills: [] };
        const totalSales = salesData.totalSales || 0;
        const totalOrders = salesData.totalOrders || 0;
        const lowStockItems = stockAgg[0]?.lowStockItems || 0;
        const expiring = expAgg || 0;
        const billsForChart = (salesData.bills || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Unique customers from aggregated bills
        const uniqueCustomers = new Set<string>();
        for (const b of billsForChart as any[]) {
          if (b.patientName && String(b.patientName).trim()) uniqueCustomers.add(String(b.patientName).trim().toLowerCase());
          else if (b.patientPhone && String(b.patientPhone).trim()) uniqueCustomers.add(String(b.patientPhone).trim());
        }
        const saleBills: any[] = billsForChart;

        // 2. Prepare Chart Data based on Range
        let salesChart: { name: string; sales: number }[] = [];

        if (range === '1d') {
            // Last 24 Hours - Hourly Aggregation
            const hourlyMap: Record<string, number> = {};
            const now = new Date();

            // Initialize last 24 slots
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 60 * 60 * 1000);
                const hour = d.getHours();
                const label = `${hour}:00`;
                hourlyMap[label] = 0;
            }

            saleBills.forEach(bill => {
                const billDate = new Date(bill.createdAt);
                if (now.getTime() - billDate.getTime() <= 24 * 60 * 60 * 1000) {
                    const label = `${billDate.getHours()}:00`;
                    if (hourlyMap[label] !== undefined) {
                        hourlyMap[label] += bill.grandTotal || 0;
                    }
                }
            });

            salesChart = Object.entries(hourlyMap).map(([name, sales]) => ({ name, sales }));
        } else {
            // Daily Aggregation (7d or 30d)
            const daysToFetch = range === '30d' ? 30 : 7;
            const chartDataMap: Record<string, number> = {};
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

            // Initialize slots
            for (let i = daysToFetch - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const label = daysToFetch <= 7
                    ? days[d.getDay()]
                    : `${d.getDate()}/${d.getMonth() + 1}`;
                chartDataMap[label] = 0;
            }

            saleBills.forEach(bill => {
                const d = new Date(bill.createdAt);
                const diffTime = Math.abs(today.getTime() - d.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < daysToFetch) {
                    const label = daysToFetch <= 7
                        ? days[d.getDay()]
                        : `${d.getDate()}/${d.getMonth() + 1}`;
                    if (chartDataMap[label] !== undefined) {
                        chartDataMap[label] += bill.grandTotal || 0;
                    }
                }
            });

            // Maintain chronological order
            salesChart = [];
            for (let i = daysToFetch - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const label = daysToFetch <= 7
                    ? days[d.getDay()]
                    : `${d.getDate()}/${d.getMonth() + 1}`;
                salesChart.push({ name: label, sales: chartDataMap[label] });
            }
        }

        // 3. Recent Transactions (Top 5) — only sales, not returns
        const recentTransactions = saleBills.slice(0, 5).map(b => ({
            _id: b._id,
            grandTotal: b.grandTotal,
            items: b.items ? b.items.map((i: any) => ({ name: i.name, qty: i.qty })) : [],
            createdAt: b.createdAt
        }));

        const resData = {
            stats: {
                sales: `₹${totalSales.toFixed(2)}`,
                orders: totalOrders,
                customers: uniqueCustomers.size,
                lowStock: lowStockItems,
                expiring: expiring
            },
            salesChart,
            recentTransactions
        };

        await setCache(cacheKey, resData, 120); // Cache 2 mins (fresher than 5)

        return NextResponse.json(resData, {
          headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=60" },
        });

    } catch (error) {
        console.error("DASHBOARD STATS ERROR:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}

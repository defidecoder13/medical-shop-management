
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import MedicineBatch from "@/src/models/MedicineBatch";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';

        // Parallel Fetching
        const [bills, batches] = await Promise.all([
            Bill.find({}).sort({ createdAt: -1 }),
            MedicineBatch.find({})
        ]);

        // 1. Calculate Summary Stats (exclude return bills from all metrics)
        const saleBills = bills.filter(b => !b.isReturn);
        const totalSales = saleBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
        const totalOrders = saleBills.length;
        const lowStockItems = batches.filter(b => (b.stock || 0) <= 10).length;

        // Check expiry
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);

        let expiring = 0;
        batches.forEach(b => {
            if (b.expiryDate) {
                const exp = new Date(b.expiryDate);
                if (exp <= nextMonth) expiring++;
            }
        });

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

        return NextResponse.json({
            stats: {
                sales: `₹${totalSales.toLocaleString()}`,
                orders: totalOrders,
                lowStock: lowStockItems,
                expiring: expiring
            },
            salesChart,
            recentTransactions
        });

    } catch (error) {
        console.error("DASHBOARD STATS ERROR:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}

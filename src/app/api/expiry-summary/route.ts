import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";

export async function GET() {
  try {
    await connectDB();

    const batches = await MedicineBatch.find({});

    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Count expired items
    const expiredItems = batches.filter(b => new Date(b.expiryDate) < today);

    // Count items expiring this month
    const expiringThisMonth = batches.filter(b => {
      const expiryDate = new Date(b.expiryDate);
      return expiryDate >= today && expiryDate <= endOfMonth;
    });

    return NextResponse.json({
      expiringThisMonth: expiringThisMonth.length,
      expiredItems: expiredItems.length
    });
  } catch (error) {
    console.error("EXPIRY SUMMARY ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch expiry summary" },
      { status: 500 }
    );
  }
}
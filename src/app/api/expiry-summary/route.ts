import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";

export async function GET() {
  try {
    await connectDB();

    const medicines = await Medicine.find({});

    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Count expired items
    const expiredItems = medicines.filter(med => new Date(med.expiryDate) < today);

    // Count items expiring this month
    const expiringThisMonth = medicines.filter(med => {
      const expiryDate = new Date(med.expiryDate);
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
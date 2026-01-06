import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const bills = await Bill.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(); 


    const normalizedBills = bills.map((bill) => ({
      ...bill,
      _id: bill._id.toString(),
    }));

    return NextResponse.json(normalizedBills);
  } catch (error) {
    console.error("TRANSACTIONS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
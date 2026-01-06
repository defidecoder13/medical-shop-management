import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import mongoose from "mongoose";

export const runtime = "nodejs";

import { unstable_noStore as noStore } from 'next/cache';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Unwrap the params promise
    const unwrappedParams = await params;
    const rawId = unwrappedParams.id;

    console.log("➡️ Transaction ID received:", rawId);

    let bill = null;

    console.log("Raw ID received:", rawId, "Length:", rawId.length);
    
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      console.log("Valid ObjectId, searching in DB...");
      bill = await Bill.findById(rawId).lean();
    } else {
      console.log("Invalid ObjectId format, trying alternative search:", rawId);
      // If the ID might be truncated or have an issue, we can try to pad it
      // or search for similar IDs if needed
    }

    if (!bill) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...bill,
      _id: bill._id.toString(),
    });
  } catch (error) {
    console.error("❌ TRANSACTION DETAILS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}
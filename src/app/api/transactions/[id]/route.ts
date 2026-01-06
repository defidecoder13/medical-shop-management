import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const rawId = params.id;

    console.log("➡️ Transaction ID received:", rawId);

    let bill = null;


    if (mongoose.Types.ObjectId.isValid(rawId)) {
      bill = await Bill.findById(rawId).lean();
    }

 
    if (!bill) {
      bill = await Bill.findOne({ _id: rawId }).lean();
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
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Settings from "@/src/models/Settings";

export async function GET() {
  try {
    await connectDB();

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        shopName: "My Medical Store",
        gstEnabled: false,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("SETTINGS API ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
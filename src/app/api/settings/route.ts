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

export async function PUT(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(data);
    } else {
      // Update fields
      settings.shopName = data.shopName;
      settings.address = data.address;
      settings.phone = data.phone;
      settings.gstEnabled = data.gstEnabled;
      settings.gstNumber = data.gstNumber;
      settings.defaultGstPercent = data.defaultGstPercent;
      settings.invoiceFooter = data.invoiceFooter;
    }

    await settings.save();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("SETTINGS UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
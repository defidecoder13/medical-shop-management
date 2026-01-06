// app/api/inventory/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";

/**
 * GET /api/inventory
 * Search by name / brand / batch
 */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    let query: any = {};

    if (q) {
      query = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { brand: { $regex: q, $options: "i" } },
          { batchNumber: { $regex: q, $options: "i" } },
        ],
      };
    }

    const medicines = await Medicine.find(query).sort({ createdAt: -1 });
    return NextResponse.json(medicines);
  } catch (error) {
    console.error("INVENTORY GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory
 * Create medicine
 * RULES:
 * - stock = strips
 * - tabletsPerStrip = fixed
 * - totalTabletsInStock = stock × tabletsPerStrip
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const stock = Number(body.stock);
    const tabletsPerStrip = Number(body.tabletsPerStrip);
    const buyingPricePerStrip = Number(body.buyingPrice);

    const {
      name,
      brand,
      batchNumber,
      expiryDate,
      gstPercent,
    } = body;

    if (
      !name ||
      !batchNumber ||
      !expiryDate ||
      Number.isNaN(stock) ||
      Number.isNaN(tabletsPerStrip) ||
      Number.isNaN(buyingPricePerStrip)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing fields" },
        { status: 400 }
      );
    }

    if (stock <= 0 || tabletsPerStrip <= 0 || buyingPricePerStrip <= 0) {
      return NextResponse.json(
        { error: "Stock, tablets per strip and buying price must be > 0" },
        { status: 400 }
      );
    }

    // 🔐 Duplicate batch safety
    const existing = await Medicine.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      batchNumber: { $regex: `^${batchNumber}$`, $options: "i" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This batch already exists for this medicine" },
        { status: 400 }
      );
    }

    const totalTabletsInStock = stock * tabletsPerStrip;

    const medicine = await Medicine.create({
      name,
      brand,
      batchNumber,
      expiryDate,
      stock,
      tabletsPerStrip,
      totalTabletsInStock,
      buyingPricePerStrip,
      gstPercent,
    });

    return NextResponse.json(medicine);
  } catch (error) {
    console.error("INVENTORY POST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to add medicine" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory
 * SAFE UPDATE
 * RULES:
 * - tabletsPerStrip ❌ cannot change
 * - stock ✅ can change (recalculates tablets)
 * - totalTabletsInStock ❌ not directly editable
 */
export async function PUT(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { _id } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Medicine ID required" },
        { status: 400 }
      );
    }

    const med = await Medicine.findById(_id);

    if (!med) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    // ❌ tabletsPerStrip is IMMUTABLE
    if (
      body.tabletsPerStrip &&
      body.tabletsPerStrip !== med.tabletsPerStrip
    ) {
      return NextResponse.json(
        { error: "Tablets per strip cannot be changed" },
        { status: 400 }
      );
    }

    // ✅ Stock update → recalc tablets
    if (typeof body.stock === "number") {
      if (body.stock < 0) {
        return NextResponse.json(
          { error: "Stock cannot be negative" },
          { status: 400 }
        );
      }

      med.stock = body.stock;
      med.totalTabletsInStock =
        body.stock * med.tabletsPerStrip;
    }

    // ✅ Safe editable fields
    if (body.name !== undefined) med.name = body.name;
    if (body.brand !== undefined) med.brand = body.brand;
    if (body.batchNumber !== undefined)
      med.batchNumber = body.batchNumber;
    if (body.expiryDate !== undefined)
      med.expiryDate = body.expiryDate;
    if (typeof body.buyingPrice === "number")
      med.buyingPricePerStrip = body.buyingPrice;
    if (typeof body.gstPercent === "number")
      med.gstPercent = body.gstPercent;

    await med.save();

    return NextResponse.json(med);
  } catch (error) {
    console.error("INVENTORY PUT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}
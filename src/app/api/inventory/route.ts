import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    let batchQuery: any = {};
    let medicineQuery: any = {};

    if (q) {
      const regex = new RegExp(q, "i");
      medicineQuery = {
        $or: [
          { name: regex },
          { brand: regex },
          { composition: regex },
        ],
      };

      const matchingMedicines = await Medicine.find(medicineQuery).select("_id");
      const medicineIds = matchingMedicines.map(m => m._id);

      batchQuery = {
        $or: [
          { batchNumber: regex },
          { rackNumber: regex },
          { medicineId: { $in: medicineIds } },
        ],
      };
    }

    const batches = await MedicineBatch.find(batchQuery)
      .populate("medicineId")
      .sort({ createdAt: -1 })
      .lean();

    // Map to the flat structure expected by the frontend
    const safeBatches = batches.map((batch: any) => {
      const med = batch.medicineId || {};
      return {
        _id: batch._id,
        medicineId: med._id,
        name: med.name || "",
        brand: med.brand || "",
        batchNumber: batch.batchNumber || "",
        expiryDate: batch.expiryDate || "",
        stock: batch.stock || 0,
        tabletsPerStrip: med.tabletsPerStrip || 0,
        buyingPricePerStrip: batch.buyingPricePerStrip || 0,
        sellingPricePerStrip: batch.sellingPricePerStrip || 0,
        rackNumber: batch.rackNumber || "",
        composition: med.composition || "",
        hsnCode: med.hsnCode || "3004",
        gstPercent: med.gstPercent || 5,
        totalTabletsInStock: batch.totalTabletsInStock || 0,
      };
    });

    return NextResponse.json(safeBatches);
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
    const sellingPricePerStrip = Number(body.sellingPrice); 

    const {
      name,
      brand,
      batchNumber,
      expiryDate,
      gstPercent,
      rackNumber, 
      composition, 
      hsnCode, 
    } = body;

    if (
      !name ||
      !batchNumber ||
      !expiryDate ||
      Number.isNaN(stock) ||
      Number.isNaN(tabletsPerStrip) ||
      Number.isNaN(buyingPricePerStrip) ||
      Number.isNaN(sellingPricePerStrip)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing fields" },
        { status: 400 }
      );
    }

    // 1. Find or Create Medicine Master
    let medicine = await Medicine.findOne({
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (!medicine) {
      medicine = await Medicine.create({
        name,
        brand,
        tabletsPerStrip,
        composition: composition || "",
        hsnCode: hsnCode || "3004",
        gstPercent: gstPercent || 5,
      });
    }

    // 2. Prevent Duplicate Batch for the same medicine
    const existingBatch = await MedicineBatch.findOne({
      medicineId: medicine._id,
      batchNumber: { $regex: `^${batchNumber}$`, $options: "i" },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: "This batch already exists for this medicine" },
        { status: 400 }
      );
    }

    const totalTabletsInStock = stock * medicine.tabletsPerStrip; // Use master's tabletsPerStrip

    const batch = await MedicineBatch.create({
      medicineId: medicine._id,
      batchNumber,
      expiryDate,
      stock,
      totalTabletsInStock,
      buyingPricePerStrip,
      sellingPricePerStrip,
      rackNumber: rackNumber || "",
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("INVENTORY POST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to add medicine batch" },
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
    const { _id } = body; // This is the MedicineBatch _id

    if (!_id) {
      return NextResponse.json(
        { error: "Batch ID required" },
        { status: 400 }
      );
    }

    const batch = await MedicineBatch.findById(_id).populate('medicineId');

    if (!batch) {
      return NextResponse.json(
        { error: "Batch not found" },
        { status: 404 }
      );
    }

    const medicine = batch.medicineId;

    // UPDATE BATCH FIELDS
    if (typeof body.stock === "number" && body.stock >= 0) {
      batch.stock = body.stock;
      batch.totalTabletsInStock = body.stock * medicine.tabletsPerStrip;
    }
    
    if (body.batchNumber !== undefined) batch.batchNumber = body.batchNumber;
    if (body.expiryDate !== undefined) batch.expiryDate = body.expiryDate;
    if (body.rackNumber !== undefined) batch.rackNumber = body.rackNumber;

    if (typeof body.buyingPrice === "number" && body.buyingPrice > 0) {
      batch.buyingPricePerStrip = body.buyingPrice;
    }
    if (typeof body.sellingPrice === "number" && body.sellingPrice > 0) {
      batch.sellingPricePerStrip = body.sellingPrice;
    }

    // UPDATE MASTER MEDICINE FIELDS
    let masterChanged = false;
    if (body.name !== undefined && body.name !== medicine.name) { medicine.name = body.name; masterChanged = true; }
    if (body.brand !== undefined && body.brand !== medicine.brand) { medicine.brand = body.brand; masterChanged = true; }
    if (body.composition !== undefined && body.composition !== medicine.composition) { medicine.composition = body.composition; masterChanged = true; }
    if (body.hsnCode !== undefined && body.hsnCode !== medicine.hsnCode) { medicine.hsnCode = body.hsnCode; masterChanged = true; }
    if (typeof body.gstPercent === "number" && body.gstPercent !== medicine.gstPercent) { medicine.gstPercent = body.gstPercent; masterChanged = true; }

    await batch.save();
    if (masterChanged) {
      await medicine.save();
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("INVENTORY PUT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 }
    );
  }
}
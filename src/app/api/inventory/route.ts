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
    const idsParam = searchParams.get("ids"); // Comma-separated medicine IDs
    const inStock = searchParams.get("inStock"); // Filter out 0 qty items
    const pageParam = searchParams.get("page");
    const page = parseInt(pageParam || "1");
    const pageSize = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const status = searchParams.get("status");

    let batchQuery: any = {};
    let medicineQuery: any = {};

    if (idsParam) {
      const ids = idsParam.split(',').filter(id => id.trim() !== '');
      batchQuery = { medicineId: { $in: ids } };
    } else if (q) {
      const regex = new RegExp(q, "i");
      medicineQuery = {
        $or: [
          { name: regex },
          { brand: regex },
          { composition: regex },
          { barcode: q }, // NEW: Check if q is exactly a barcode
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

    if (category && category !== "All Categories") {
      medicineQuery.category = category;
    }

    if (company && company !== "All Companies") {
      medicineQuery.brand = company;
    }

    if (status && status !== "All Status") {
      if (status === "In Stock") batchQuery.stock = { $gt: 10 };
      else if (status === "Low Stock") batchQuery.stock = { $gt: 0, $lte: 10 };
      else if (status === "Out of Stock") batchQuery.stock = { $lte: 0 };
    }

    if (inStock === "true") {
      batchQuery.stock = { $gt: 0 };
    }

    // If we have medicine filters, we must apply them first and get the matching medicine IDs
    if (Object.keys(medicineQuery).length > 0 && !idsParam && !q) {
      const matchingMedicines = await Medicine.find(medicineQuery).select("_id");
      const medicineIds = matchingMedicines.map(m => m._id);
      batchQuery.medicineId = { $in: medicineIds };
    } else if (q && (category && category !== "All Categories" || company && company !== "All Companies")) {
      // If we had a q search AND filters, we need to ensure the previously found medicineIds 
      // from the q search ALSO match the category/company filters
      const matchingMedicines = await Medicine.find(medicineQuery).select("_id");
      const medicineIds = matchingMedicines.map(m => m._id);
      
      // Update batchQuery to only include batches that match BOTH the text search AND the filters
      batchQuery = {
        ...batchQuery,
        medicineId: { $in: medicineIds },
      };
    }

    let totalCount = 0;
    if (!idsParam) {
      totalCount = await MedicineBatch.countDocuments(batchQuery);
    } else {
      totalCount = idsParam.split(',').length; // approximation for IDs query
    }
    
    const totalPages = Math.ceil(totalCount / pageSize);

    const query = MedicineBatch.find(batchQuery)
      .populate("medicineId")
      .sort({ createdAt: -1 });

    if (!idsParam) {
       query.skip((page - 1) * pageSize).limit(pageSize);
    }

    const batches = await query.lean();

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
        discountPercent: batch.discountPercent || 0,
        supplierName: batch.supplierName || "Direct Purchase",
        purchaseInvoiceNumber: batch.purchaseInvoiceNumber || "",
        category: med.category || "Tablet",
        pack: batch.pack || med.pack || "",
      };
    });

    if (pageParam) {
      return NextResponse.json({
        data: safeBatches,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit: pageSize
        }
      });
    } else {
      return NextResponse.json(safeBatches);
    }
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
      barcode,
      batchNumber,
      expiryDate,
      gstPercent,
      rackNumber, 
      composition, 
      hsnCode, 
      discountPercent,
      supplierName,
      purchaseInvoiceNumber,
      category,
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
    const safeName = String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let medicine = await Medicine.findOne({
      name: { $regex: `^${safeName}$`, $options: "i" }
    });

    if (!medicine) {
      medicine = await Medicine.create({
        name,
        brand,
        barcode: barcode || "",
        tabletsPerStrip,
        composition: composition || "",
        hsnCode: hsnCode || "3004",
        gstPercent: gstPercent || 5,
        category: category || "Tablet",
      });
    } else {
      let changed = false;
      if (barcode && medicine.barcode !== barcode) {
        medicine.barcode = barcode;
        changed = true;
      }
      if (category && medicine.category !== category) {
        medicine.category = category;
        changed = true;
      }
      if (changed) {
        await medicine.save();
      }
    }

    // 2. Prevent Duplicate Batch for the same medicine
    const safeBatch = String(batchNumber).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingBatch = await MedicineBatch.findOne({
      medicineId: medicine._id,
      batchNumber: { $regex: `^${safeBatch}$`, $options: "i" },
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
      discountPercent: Number(discountPercent) || 0,
      supplierName: supplierName || "Direct Purchase",
      purchaseInvoiceNumber: purchaseInvoiceNumber || "",
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

    // Allow changing tabletsPerStrip if provided, because auto-import might have guessed it wrong
    let masterChanged = false;
    let currentTabletsPerStrip = medicine.tabletsPerStrip;
    if (typeof body.tabletsPerStrip === "number" && body.tabletsPerStrip > 0 && body.tabletsPerStrip !== medicine.tabletsPerStrip) {
      medicine.tabletsPerStrip = body.tabletsPerStrip;
      currentTabletsPerStrip = body.tabletsPerStrip;
      masterChanged = true;
    }

    // UPDATE BATCH FIELDS
    if (typeof body.stock === "number" && body.stock >= 0) {
      batch.stock = body.stock;
      batch.totalTabletsInStock = body.stock * currentTabletsPerStrip;
    } else if (masterChanged) {
      // If stock didn't change but tabletsPerStrip did, we must still recalculate totalTabletsInStock
      batch.totalTabletsInStock = batch.stock * currentTabletsPerStrip;
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
    if (body.discountPercent !== undefined) {
      batch.discountPercent = Number(body.discountPercent) || 0;
    }
    if (body.supplierName !== undefined) {
      batch.supplierName = body.supplierName || "Direct Purchase";
    }
    if (body.purchaseInvoiceNumber !== undefined) {
      batch.purchaseInvoiceNumber = body.purchaseInvoiceNumber || "";
    }
    if (body.pack !== undefined) {
      batch.pack = body.pack || "";
    }

    // UPDATE MASTER MEDICINE FIELDS
    if (body.name !== undefined && body.name !== medicine.name) { medicine.name = body.name; masterChanged = true; }
    if (body.brand !== undefined && body.brand !== medicine.brand) { medicine.brand = body.brand; masterChanged = true; }
    if (body.barcode !== undefined && body.barcode !== medicine.barcode) { medicine.barcode = body.barcode; masterChanged = true; }
    if (body.composition !== undefined && body.composition !== medicine.composition) { medicine.composition = body.composition; masterChanged = true; }
    if (body.hsnCode !== undefined && body.hsnCode !== medicine.hsnCode) { medicine.hsnCode = body.hsnCode; masterChanged = true; }
    if (typeof body.gstPercent === "number" && body.gstPercent !== medicine.gstPercent) { medicine.gstPercent = body.gstPercent; masterChanged = true; }
    if (body.category !== undefined && body.category !== medicine.category) { medicine.category = body.category; masterChanged = true; }
    if (body.pack !== undefined && body.pack !== medicine.pack) { medicine.pack = body.pack; masterChanged = true; }

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
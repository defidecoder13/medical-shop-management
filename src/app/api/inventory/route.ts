import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from 'next/cache';
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";
import Settings from "@/src/models/Settings";
import { getCache, setCache, redis, deleteCache } from "@/src/lib/redis";

export const dynamic = "force-dynamic";

// Global in-memory cache for ultra-fast Zero-Latency Search
let memoryCache: any[] | null = null;
let memoryCacheVersion: string | null = null;

export async function GET(req: Request) {
  noStore();
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const idsParam = searchParams.get("ids");
    const inStock = searchParams.get("inStock");
    const pageParam = searchParams.get("page");
    const page = parseInt(pageParam || "1");
    const pageSize = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const company = searchParams.get("company");
    const status = searchParams.get("status");

    // --------------------------------------------------------------------------------
    // 🔥 ZERO-LATENCY IN-MEMORY PIPELINE (Syncs via Redis Version)
    // --------------------------------------------------------------------------------
    if (!idsParam) {
      let allBatches = null;
      let currentVersion = "default";
      
      // 1. Fetch lightweight version string from Mongo (~10ms, safe from Next.js caching)
      const settings = await Settings.findOne({}).lean();
      if (settings?.catalogVersion) {
          currentVersion = String(settings.catalogVersion);
      }

      // 2. Check local memory cache (0ms latency!)
      if (memoryCache && memoryCacheVersion === currentVersion) {
          allBatches = memoryCache;
      }

      // 3. If memory cache miss or stale, fetch from Mongo directly (500ms)
      if (!allBatches) {
        const rawBatches = await MedicineBatch.find({}).populate("medicineId").lean();
        allBatches = rawBatches.map((batch: any) => {
          const med = batch.medicineId || {};
          return {
            _id: String(batch._id), // Pre-cast to string for localeCompare safety
            medicineId: String(med._id || ""),
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
        
        // Save to ultra-fast local memory
        memoryCache = allBatches;
        memoryCacheVersion = currentVersion;
      }

      // 3. Perform in-memory filtering (Instantaneous)
      let filteredBatches = allBatches;

      if (q) {
        const queryTerms = q.toLowerCase().split(/\\s+/).filter(Boolean);
        filteredBatches = filteredBatches.filter((b: any) => {
          const searchString = `${b.name} ${b.brand} ${b.composition} ${b.barcode || ''} ${b.batchNumber} ${b.rackNumber}`.toLowerCase();
          return queryTerms.every(term => searchString.includes(term));
        });
      }

      if (category && category !== "All Categories") {
        filteredBatches = filteredBatches.filter((b: any) => b.category === category);
      }

      if (company && company !== "All Companies") {
        filteredBatches = filteredBatches.filter((b: any) => b.brand === company);
      }

      if (status && status !== "All Status") {
        if (status === "In Stock") filteredBatches = filteredBatches.filter((b: any) => b.stock > 10);
        else if (status === "Low Stock") filteredBatches = filteredBatches.filter((b: any) => b.stock > 0 && b.stock <= 10);
        else if (status === "Out of Stock") filteredBatches = filteredBatches.filter((b: any) => b.stock <= 0);
      }

      if (inStock === "true") {
        filteredBatches = filteredBatches.filter((b: any) => b.stock > 0);
      }

      // Sort by expiry date or newly added
      // For simplicity in memory, we sort by _id string comparison (approximate creation time)
      filteredBatches.sort((a, b) => String(b._id).localeCompare(String(a._id)));

      const totalCount = filteredBatches.length;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Apply pagination limit to the array slice
      if (pageParam) {
        const paginatedBatches = filteredBatches.slice((page - 1) * pageSize, page * pageSize);
        return NextResponse.json({
          data: paginatedBatches,
          pagination: {
            totalCount,
            totalPages,
            currentPage: page,
            limit: pageSize
          }
        });
      } else if (q) {
         // If it's a search without pagination (like billing autocomplete), limit to 50
         return NextResponse.json(filteredBatches.slice(0, 50));
      } else {
         return NextResponse.json(filteredBatches);
      }
    }

    // --------------------------------------------------------------------------------
    // 🔥 FALLBACK FOR IDS LOOKUP (Because it targets exact batches, hit DB directly)
    // --------------------------------------------------------------------------------
    const ids = idsParam.split(',').filter((id: string) => id.trim() !== '');
    const batchQuery = { medicineId: { $in: ids } };
    const totalCount = ids.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    const query = MedicineBatch.find(batchQuery)
      .populate("medicineId")
      .sort({ createdAt: -1 });

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
      const resData = {
        data: safeBatches,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit: pageSize
        }
      };
      return NextResponse.json(resData);
    } else {
      return NextResponse.json(safeBatches);
    }
  } catch (error) {
    console.error("INVENTORY ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const stock = Number(body.stock);
    const tabletsPerStrip = Number(body.tabletsPerStrip);
    const buyingPricePerStrip = Number(body.buyingPrice); 
    const sellingPricePerStrip = Number(body.sellingPrice); 

    let {
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
    
    name = name || "Unknown Medicine";
    batchNumber = batchNumber || "";
    if (!expiryDate || expiryDate.trim() === "") {
        expiryDate = undefined; // Let Mongoose ignore it if empty
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
    let batchQuery: any = { medicineId: medicine._id };
    if (batchNumber && batchNumber !== "") {
        batchQuery.batchNumber = batchNumber;
    } else {
        // If no batch number, we won't try to find an exact duplicate to merge
        // We'll just create a new one every time, or we could group by empty batch
        batchQuery.batchNumber = "";
    }

    const existingBatch = await MedicineBatch.findOne(batchQuery);

    if (existingBatch) {
      return NextResponse.json(
        { error: "This batch already exists for this medicine" },
        { status: 400 }
      );
    }

    const newBatchData: any = {
      medicineId: medicine._id,
      batchNumber,
      stock: Number.isNaN(stock) ? 0 : stock,
      totalTabletsInStock: (Number.isNaN(stock) ? 0 : stock) * (Number.isNaN(tabletsPerStrip) ? 10 : tabletsPerStrip),
      buyingPricePerStrip: Number.isNaN(buyingPricePerStrip) ? 0 : buyingPricePerStrip,
      sellingPricePerStrip: Number.isNaN(sellingPricePerStrip) ? 0 : sellingPricePerStrip,
      rackNumber: rackNumber || "",
      discountPercent: discountPercent || 0,
      supplierName: supplierName || "Direct Purchase",
      purchaseInvoiceNumber: purchaseInvoiceNumber || "",
      pack: body.pack || "",
    };
    if (expiryDate !== undefined) {
      newBatchData.expiryDate = expiryDate;
    }
    const newBatch = await MedicineBatch.create(newBatchData);

    if (redis) {
      const keys = await redis.keys("inventory:get:*");
      keys.push("catalog:all"); // Legacy cleanup
      await redis.del(...keys);
      await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
      if (redis) await setCache("catalog:version", Date.now().toString(), 604800);
      memoryCache = null;
    }

    return NextResponse.json(newBatch);
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
    if (body.expiryDate !== undefined) {
        batch.expiryDate = body.expiryDate === "" ? undefined : body.expiryDate;
    }
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

    if (redis) {
      const keys = await redis.keys("inventory:get:*");
      keys.push("catalog:all"); // Legacy cleanup
      await redis.del(...keys);
      await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
      if (redis) await setCache("catalog:version", Date.now().toString(), 604800);
      memoryCache = null;
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
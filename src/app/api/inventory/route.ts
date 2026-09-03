import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from 'next/cache';
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";
import Settings from "@/src/models/Settings";
import { getCache, setCache, redis, deleteCache } from "@/src/lib/redis";

export const dynamic = "force-dynamic";

// Helper to build search $or for a single term
function buildTermOr(term: string) {
  const rx = { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  return [
    { "medicine.name": rx },
    { "medicine.brand": rx },
    { "medicine.composition": rx },
    { "medicine.barcode": rx },
    { batchNumber: rx },
    { rackNumber: rx },
    { supplierName: rx },
  ];
}

export async function GET(req: Request) {
  noStore();
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const idsParam = searchParams.get("ids");
    const inStock = searchParams.get("inStock");
    const pageParam = searchParams.get("page");
    const page = Math.max(1, parseInt(pageParam || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const category = searchParams.get("category");
    const supplier = searchParams.get("supplier");
    const status = searchParams.get("status");

    // IDS lookup — keep direct path (used by billing regular medicines)
    if (idsParam) {
      const ids = idsParam.split(',').filter((id: string) => id.trim() !== '');
      const batchQuery = { medicineId: { $in: ids } };
      const batches = await MedicineBatch.find(batchQuery).populate("medicineId").sort({ createdAt: -1 }).lean();
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
          purchaseDate: batch.purchaseDate ? batch.purchaseDate : "",
          createdAt: batch.createdAt,
        };
      });
      return NextResponse.json(safeBatches, {
        headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
      });
    }

    // Build aggregation pipeline for efficient DB-side filtering + pagination
    const match: any = {};
    const medicineMatch: any = {};

    // Stock filters on batch
    if (inStock === "true") {
      match.stock = { $gt: 0 };
    }
    if (status && status !== "All Status") {
      if (status === "In Stock") match.stock = { $gt: 10 };
      else if (status === "Low Stock") match.stock = { $gt: 0, $lte: 10 };
      else if (status === "Out of Stock") match.stock = { $lte: 0 };
    }
    if (supplier && supplier !== "All Suppliers") {
      match.supplierName = supplier;
    }

    if (category && category !== "All Categories") {
      medicineMatch["medicine.category"] = category;
    }

    // Fuzzy spaceless search: "pand" → "PAN D" / "PAN-D" (pharmacy shorthand)
    let searchAnd: any[] | null = null;
    if (q && q.trim()) {
      const rawTerms = q.trim().split(/\s+/).filter(Boolean);
      if (rawTerms.length > 0) {
        searchAnd = rawTerms.map((raw) => {
          const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
          const source = cleaned.length ? cleaned : raw;
          const fuzzy = source
            .split("")
            .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("[^a-zA-Z0-9]*");
          const rx = { $regex: fuzzy, $options: "i" };
          return {
            $or: [
              { "medicine.name": rx },
              { "medicine.brand": rx },
              { "medicine.composition": rx },
              { "medicine.barcode": rx },
              { batchNumber: rx },
              { rackNumber: rx },
              { supplierName: rx },
            ],
          };
        });
      }
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: Medicine.collection.name,
          localField: "medicineId",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },
    ];

    const andClauses: any[] = [];
    if (Object.keys(match).length > 0) andClauses.push(match);
    if (Object.keys(medicineMatch).length > 0) andClauses.push(medicineMatch);
    if (searchAnd) andClauses.push(...searchAnd);

    if (andClauses.length > 0) {
      pipeline.push({ $match: { $and: andClauses } });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    // Use facet to get paginated data + total count in one roundtrip
    const isPaginated = Boolean(pageParam);
    const isSearchWithoutPage = Boolean(q && !pageParam);

    if (isPaginated) {
      pipeline.push({
        $facet: {
          data: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            {
              $project: {
                _id: 1,
                medicineId: "$medicine._id",
                name: "$medicine.name",
                brand: "$medicine.brand",
                batchNumber: 1,
                expiryDate: 1,
                stock: 1,
                tabletsPerStrip: "$medicine.tabletsPerStrip",
                buyingPricePerStrip: 1,
                sellingPricePerStrip: 1,
                rackNumber: 1,
                composition: "$medicine.composition",
                hsnCode: "$medicine.hsnCode",
                gstPercent: "$medicine.gstPercent",
                totalTabletsInStock: 1,
                discountPercent: 1,
                supplierName: 1,
                purchaseInvoiceNumber: 1,
                category: "$medicine.category",
                pack: { $ifNull: ["$pack", "$medicine.pack"] },
                purchaseDate: 1,
                createdAt: 1,
                barcode: "$medicine.barcode",
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      });

      const [result] = await MedicineBatch.aggregate(pipeline);
      const data = result?.data || [];
      const totalCount = result?.totalCount?.[0]?.count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Normalize for frontend (ensure string _id, defaults)
      const normalized = data.map((b: any) => ({
        _id: String(b._id),
        medicineId: String(b.medicineId || ""),
        name: b.name || "",
        brand: b.brand || "",
        batchNumber: b.batchNumber || "",
        expiryDate: b.expiryDate || "",
        stock: b.stock || 0,
        tabletsPerStrip: b.tabletsPerStrip || 0,
        buyingPricePerStrip: b.buyingPricePerStrip || 0,
        sellingPricePerStrip: b.sellingPricePerStrip || 0,
        rackNumber: b.rackNumber || "",
        composition: b.composition || "",
        hsnCode: b.hsnCode || "3004",
        gstPercent: b.gstPercent ?? 5,
        totalTabletsInStock: b.totalTabletsInStock || 0,
        discountPercent: b.discountPercent || 0,
        supplierName: b.supplierName || "Direct Purchase",
        purchaseInvoiceNumber: b.purchaseInvoiceNumber || "",
        category: b.category || "Tablet",
        pack: b.pack || "",
        purchaseDate: b.purchaseDate || "",
        createdAt: b.createdAt,
        barcode: b.barcode || "",
      }));

      return NextResponse.json(
        {
          data: normalized,
          pagination: { totalCount, totalPages, currentPage: page, limit: pageSize },
        },
        { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" } }
      );
    }

    // Non-paginated but with q (billing autocomplete) → limit 50, no count needed
    if (isSearchWithoutPage) {
      pipeline.push({ $limit: 50 });
      pipeline.push({
        $project: {
          _id: 1,
          medicineId: "$medicine._id",
          name: "$medicine.name",
          brand: "$medicine.brand",
          batchNumber: 1,
          expiryDate: 1,
          stock: 1,
          tabletsPerStrip: "$medicine.tabletsPerStrip",
          buyingPricePerStrip: 1,
          sellingPricePerStrip: 1,
          rackNumber: 1,
          composition: "$medicine.composition",
          hsnCode: "$medicine.hsnCode",
          gstPercent: "$medicine.gstPercent",
          totalTabletsInStock: 1,
          discountPercent: 1,
          supplierName: 1,
          purchaseInvoiceNumber: 1,
          category: "$medicine.category",
          pack: { $ifNull: ["$pack", "$medicine.pack"] },
          purchaseDate: 1,
          createdAt: 1,
          barcode: "$medicine.barcode",
        },
      });
      const docs = await MedicineBatch.aggregate(pipeline);
      const normalized = docs.map((b: any) => ({
        _id: String(b._id),
        medicineId: String(b.medicineId || ""),
        name: b.name || "",
        brand: b.brand || "",
        batchNumber: b.batchNumber || "",
        expiryDate: b.expiryDate || "",
        stock: b.stock || 0,
        tabletsPerStrip: b.tabletsPerStrip || 0,
        buyingPricePerStrip: b.buyingPricePerStrip || 0,
        sellingPricePerStrip: b.sellingPricePerStrip || 0,
        rackNumber: b.rackNumber || "",
        composition: b.composition || "",
        hsnCode: b.hsnCode || "3004",
        gstPercent: b.gstPercent ?? 5,
        totalTabletsInStock: b.totalTabletsInStock || 0,
        discountPercent: b.discountPercent || 0,
        supplierName: b.supplierName || "Direct Purchase",
        purchaseInvoiceNumber: b.purchaseInvoiceNumber || "",
        category: b.category || "Tablet",
        pack: b.pack || "",
        purchaseDate: b.purchaseDate || "",
        createdAt: b.createdAt,
        barcode: b.barcode || "",
      }));
      return NextResponse.json(normalized, {
        headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
      });
    }

    // Default: no q, no pagination → return all matching (used by expiry/low-stock pages that need full list)
    // But cap to 5000 to avoid 10k payload, and let client handle in-stock filter already in match
    pipeline.push({ $limit: 5000 });
    pipeline.push({
      $project: {
        _id: 1,
        medicineId: "$medicine._id",
        name: "$medicine.name",
        brand: "$medicine.brand",
        batchNumber: 1,
        expiryDate: 1,
        stock: 1,
        tabletsPerStrip: "$medicine.tabletsPerStrip",
        buyingPricePerStrip: 1,
        sellingPricePerStrip: 1,
        rackNumber: 1,
        composition: "$medicine.composition",
        hsnCode: "$medicine.hsnCode",
        gstPercent: "$medicine.gstPercent",
        totalTabletsInStock: 1,
        discountPercent: 1,
        supplierName: 1,
        purchaseInvoiceNumber: 1,
        category: "$medicine.category",
        pack: { $ifNull: ["$pack", "$medicine.pack"] },
        purchaseDate: 1,
        createdAt: 1,
        barcode: "$medicine.barcode",
      },
    });
    const docs = await MedicineBatch.aggregate(pipeline);
    const normalized = docs.map((b: any) => ({
      _id: String(b._id),
      medicineId: String(b.medicineId || ""),
      name: b.name || "",
      brand: b.brand || "",
      batchNumber: b.batchNumber || "",
      expiryDate: b.expiryDate || "",
      stock: b.stock || 0,
      tabletsPerStrip: b.tabletsPerStrip || 0,
      buyingPricePerStrip: b.buyingPricePerStrip || 0,
      sellingPricePerStrip: b.sellingPricePerStrip || 0,
      rackNumber: b.rackNumber || "",
      composition: b.composition || "",
      hsnCode: b.hsnCode || "3004",
      gstPercent: b.gstPercent ?? 5,
      totalTabletsInStock: b.totalTabletsInStock || 0,
      discountPercent: b.discountPercent || 0,
      supplierName: b.supplierName || "Direct Purchase",
      purchaseInvoiceNumber: b.purchaseInvoiceNumber || "",
      category: b.category || "Tablet",
      pack: b.pack || "",
      purchaseDate: b.purchaseDate || "",
      createdAt: b.createdAt,
      barcode: b.barcode || "",
    }));
    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
    });
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
      purchaseDate,
    } = body;
    
    name = name || "Unknown Medicine";
    batchNumber = batchNumber || "";
    if (!expiryDate || expiryDate.trim() === "") {
        expiryDate = undefined;
    }

    let medicine = null;
    if (body.medicineId) {
      medicine = await Medicine.findById(body.medicineId);
      if (medicine && name && String(name).trim().toLowerCase() !== String(medicine.name || "").trim().toLowerCase()) {
        medicine = null;
      }
    }
    
    if (!medicine) {
      const safeName = String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      medicine = await Medicine.findOne({
        name: { $regex: `^${safeName}$`, $options: "i" }
      });
    }

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

    let batchQuery: any = { medicineId: medicine._id };
    if (batchNumber && batchNumber !== "") {
        batchQuery.batchNumber = batchNumber;
    } else {
        batchQuery.batchNumber = "";
    }

    let newBatch;
    const existingBatch = await MedicineBatch.findOne(batchQuery);

    if (existingBatch) {
      if (!Number.isNaN(stock) && stock > 0) {
        existingBatch.stock += stock;
        existingBatch.totalTabletsInStock = existingBatch.stock * (Number.isNaN(tabletsPerStrip) ? 10 : tabletsPerStrip);
      }
      if (!Number.isNaN(buyingPricePerStrip) && buyingPricePerStrip > 0) existingBatch.buyingPricePerStrip = buyingPricePerStrip;
      if (!Number.isNaN(sellingPricePerStrip) && sellingPricePerStrip > 0) existingBatch.sellingPricePerStrip = sellingPricePerStrip;
      if (rackNumber) existingBatch.rackNumber = rackNumber;
      if (discountPercent !== undefined) existingBatch.discountPercent = discountPercent;
      if (supplierName && supplierName !== "Direct Purchase") existingBatch.supplierName = supplierName;
      if (purchaseInvoiceNumber) existingBatch.purchaseInvoiceNumber = purchaseInvoiceNumber;
      if (body.pack) existingBatch.pack = body.pack;
      if (expiryDate !== undefined) existingBatch.expiryDate = expiryDate;
      if (purchaseDate !== undefined) existingBatch.purchaseDate = purchaseDate;
      
      await existingBatch.save();
      newBatch = existingBatch;
    } else {
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
      if (purchaseDate) {
        newBatchData.purchaseDate = purchaseDate;
      }
      if (expiryDate !== undefined) {
        newBatchData.expiryDate = expiryDate;
      }
      newBatch = await MedicineBatch.create(newBatchData);
    }

    await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
    if (redis) {
      const keys = await redis.keys("inventory:get:*");
      keys.push("catalog:all");
      await redis.del(...keys);
      await setCache("catalog:version", Date.now().toString(), 604800);
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

export async function PUT(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { _id } = body;

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

    let medicine = batch.medicineId;

    const batchesSharingMaster = await MedicineBatch.countDocuments({ medicineId: medicine._id });
    const newName = body.name !== undefined ? String(body.name).trim() : medicine.name;
    const nameChanged = newName.toLowerCase() !== (medicine.name || "").trim().toLowerCase();

    let targetMedicine = medicine;
    let masterChanged = false;

    if (nameChanged) {
      const safeName = newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingMaster = await Medicine.findOne({
        name: { $regex: `^${safeName}$`, $options: "i" }
      });

      if (existingMaster) {
        targetMedicine = existingMaster;
      } else if (batchesSharingMaster > 1) {
        targetMedicine = await Medicine.create({
          name: newName,
          brand: body.brand !== undefined ? body.brand : medicine.brand,
          barcode: body.barcode !== undefined ? body.barcode : medicine.barcode,
          tabletsPerStrip: typeof body.tabletsPerStrip === "number" && body.tabletsPerStrip > 0 ? body.tabletsPerStrip : medicine.tabletsPerStrip,
          composition: body.composition !== undefined ? body.composition : medicine.composition,
          hsnCode: body.hsnCode !== undefined ? body.hsnCode : medicine.hsnCode,
          gstPercent: typeof body.gstPercent === "number" ? body.gstPercent : medicine.gstPercent,
          category: body.category !== undefined ? body.category : medicine.category,
          pack: body.pack !== undefined ? body.pack : medicine.pack,
        });
      } else {
        targetMedicine.name = newName;
        masterChanged = true;
      }

      if (targetMedicine._id.toString() !== medicine._id.toString()) {
        batch.medicineId = targetMedicine._id;
        if (batchesSharingMaster === 1) {
          await Medicine.findByIdAndDelete(medicine._id);
        }
      }
    }

    let currentTabletsPerStrip = targetMedicine.tabletsPerStrip;
    if (typeof body.tabletsPerStrip === "number" && body.tabletsPerStrip > 0 && body.tabletsPerStrip !== targetMedicine.tabletsPerStrip) {
      if (batchesSharingMaster > 1 && targetMedicine._id.toString() === medicine._id.toString()) {
        currentTabletsPerStrip = body.tabletsPerStrip;
      } else {
        targetMedicine.tabletsPerStrip = body.tabletsPerStrip;
        currentTabletsPerStrip = body.tabletsPerStrip;
        masterChanged = true;
      }
    }

    if (typeof body.stock === "number" && body.stock >= 0) {
      batch.stock = body.stock;
      batch.totalTabletsInStock = body.stock * currentTabletsPerStrip;
    } else if (masterChanged || targetMedicine._id.toString() !== medicine._id.toString()) {
      batch.totalTabletsInStock = batch.stock * currentTabletsPerStrip;
    }
    
    if (body.batchNumber !== undefined) batch.batchNumber = body.batchNumber;
    if (body.expiryDate !== undefined) {
        batch.expiryDate = body.expiryDate === "" ? undefined : body.expiryDate;
    }
    if (body.rackNumber !== undefined) batch.rackNumber = body.rackNumber;
    if (body.purchaseDate !== undefined) batch.purchaseDate = body.purchaseDate ? body.purchaseDate : undefined;

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

    if (targetMedicine._id.toString() === medicine._id.toString() && batchesSharingMaster <= 1) {
      if (body.brand !== undefined && body.brand !== targetMedicine.brand) { targetMedicine.brand = body.brand; masterChanged = true; }
      if (body.barcode !== undefined && body.barcode !== targetMedicine.barcode) { targetMedicine.barcode = body.barcode; masterChanged = true; }
      if (body.composition !== undefined && body.composition !== targetMedicine.composition) { targetMedicine.composition = body.composition; masterChanged = true; }
      if (body.hsnCode !== undefined && body.hsnCode !== targetMedicine.hsnCode) { targetMedicine.hsnCode = body.hsnCode; masterChanged = true; }
      if (typeof body.gstPercent === "number" && body.gstPercent !== targetMedicine.gstPercent) { targetMedicine.gstPercent = body.gstPercent; masterChanged = true; }
      if (body.category !== undefined && body.category !== targetMedicine.category) { targetMedicine.category = body.category; masterChanged = true; }
      if (body.pack !== undefined && body.pack !== targetMedicine.pack) { targetMedicine.pack = body.pack; masterChanged = true; }
    } else if (targetMedicine._id.toString() !== medicine._id.toString()) {
      if (body.brand !== undefined) targetMedicine.brand = body.brand;
      if (body.barcode !== undefined) targetMedicine.barcode = body.barcode;
      if (body.composition !== undefined) targetMedicine.composition = body.composition;
      if (body.hsnCode !== undefined) targetMedicine.hsnCode = body.hsnCode;
      if (typeof body.gstPercent === "number") targetMedicine.gstPercent = body.gstPercent;
      if (body.category !== undefined) targetMedicine.category = body.category;
      if (body.pack !== undefined) targetMedicine.pack = body.pack;
      masterChanged = true;
    }

    await batch.save();
    if (masterChanged) {
      await targetMedicine.save();
    }

    await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
    if (redis) {
      const keys = await redis.keys("inventory:get:*");
      keys.push("catalog:all");
      await redis.del(...keys);
      await setCache("catalog:version", Date.now().toString(), 604800);
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

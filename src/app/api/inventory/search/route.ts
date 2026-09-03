import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    if (!q || q.length < 1) {
      return NextResponse.json([], {
        headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=30" },
      });
    }

    // Fuzzy spaceless search: "pand" matches "PAN D", "PAN-D" — perfect for fast billing
    const rawTerms = q.split(/\s+/).filter(Boolean);
    const andClauses = rawTerms.map((raw) => {
      const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
      const source = cleaned.length ? cleaned : raw;
      // p[^a-z0-9]*a[^a-z0-9]*n[^a-z0-9]*d → allows optional spaces/hyphens/dots between letters
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
        ],
      };
    });

    const pipeline: any[] = [
      { $match: { stock: { $gt: 0 } } },
      {
        $lookup: {
          from: Medicine.collection.name,
          localField: "medicineId",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },
      { $match: { $and: andClauses } },
      // Prefer batches that expire later and have stock; sort by relevance proxy (name starts with term)
      { $sort: { stock: -1, createdAt: -1 } },
      { $limit: limit },
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
          gstPercent: "$medicine.gstPercent",
          supplierName: 1,
          pack: { $ifNull: ["$pack", "$medicine.pack"] },
          barcode: "$medicine.barcode",
        },
      },
    ];

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
      gstPercent: b.gstPercent ?? 5,
      supplierName: b.supplierName || "Direct Purchase",
      pack: b.pack || "",
      barcode: b.barcode || "",
    }));

    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("INVENTORY SEARCH ERROR:", error);
    return NextResponse.json({ error: "Failed to search inventory" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { connectDB } from "@/src/lib/db";
import MasterMedicine from "@/src/models/MasterMedicine";

export const dynamic = "force-dynamic";

// Infer app Category (must match inventory form select values) from
// master name + pack label. `type` in CSV is always "allopathy" — useless.
function inferCategory(name: string, packLabel: string): string {
  const n = `${name} ${packLabel}`.toLowerCase();
  if (/\btablet|\btab\b/.test(n)) return "Tablet";
  if (/\bcapsule|\bcap\b/.test(n)) return "Capsule";
  if (/syrup|suspension|dry syrup|oral solution|tonic/.test(n)) return "Syrup";
  if (/drop/.test(n)) return "Drops";
  if (/ointment|cream|\bgel\b|lotion/.test(n)) return "Ointment";
  if (/injection|vial|ampoule|infusion|powder for injection|lyophilized/.test(n))
    return "Injection";
  if (/spray|inhaler|rotacap|respule|nebulis/.test(n)) return "Spray";
  if (/condom|device|kit|syringe|needle|glove|catheter/.test(n)) return "Device";
  if (/food|protein|supplement|energy drink|juice|oats/.test(n)) return "Food";
  // oral powder / sachet / soap / shampoo etc. fall through to Other
  return "Other";
}

// Parse "strip of 10 tablets" -> 10. Non strip categories -> 1.
function parseTabletsPerStrip(
  packLabel: string,
  category: string
): number {
  if (category !== "Tablet" && category !== "Capsule") return 1;
  const m =
    packLabel.match(/(\d+)\s*(tablets?|capsules?)/i) ||
    packLabel.match(/strip of\s*(\d+)/i);
  if (m) {
    const v = parseInt(m[1], 10);
    if (!isNaN(v) && v > 0 && v <= 100) return v;
  }
  return 10; // most common strip size
}

export async function GET(req: Request) {
  noStore();
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "8")));

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // Same fuzzy spaceless matching as billing/inventory search:
    // "dolo650" matches "DOLO 650", "Azithral" matches "Azithral 500".
    const rawTerms = q.split(/\s+/).filter(Boolean);
    const andClauses = rawTerms.map((raw) => {
      const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
      const source = cleaned.length ? cleaned : raw;
      const fuzzy = source
        .split("")
        .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^a-zA-Z0-9]*");
      const rx = { $regex: fuzzy, $options: "i" };
      return {
        $or: [
          { name: rx },
          { manufacturer_name: rx },
          { salt_composition: rx },
          { short_composition1: rx },
        ],
      };
    });

    const docs = await MasterMedicine.find({
      $and: [
        { Is_discontinued: { $in: ["FALSE", "False", "false", false, "", null] } },
        ...andClauses,
      ],
    })
      .select({
        name: 1,
        manufacturer_name: 1,
        salt_composition: 1,
        short_composition1: 1,
        short_composition2: 1,
        pack_size_label: 1,
        // NOTE: price deliberately never selected / never returned
      })
      .sort({ name: 1 })
      .limit(limit)
      .lean();

    const normalized = docs.map((d: any) => {
      const name = (d.name || "").trim();
      const packLabel = (d.pack_size_label || "").trim();
      const category = inferCategory(name, packLabel);
      const salt = (d.salt_composition || "").trim();
      const fallback = [d.short_composition1, d.short_composition2]
        .map((s: any) => (s || "").trim())
        .filter(Boolean)
        .join(" + ");
      return {
        _id: String(d._id),
        name,
        brand: (d.manufacturer_name || "").trim(),
        composition: salt || fallback || "",
        pack: packLabel,
        packLabel,
        category,
        tabletsPerStrip: parseTabletsPerStrip(packLabel, category),
      };
    });

    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("MASTER MEDICINE SEARCH ERROR:", error);
    return NextResponse.json({ error: "Failed to search master medicines" }, { status: 500 });
  }
}

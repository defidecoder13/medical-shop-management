import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Doctor from "@/src/models/Doctor";
import Patient from "@/src/models/Patient";
import Bill from "@/src/models/Bill";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10")));

    // Primary source: Doctor collection
    let doctors: any[] = [];
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Fuzzy spaceless: "drash" -> "dr" etc handled by same logic as inventory
      const cleaned = search.replace(/[^a-zA-Z0-9]/g, "");
      const source = cleaned.length ? cleaned : search;
      const fuzzy = source.split("").map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^a-zA-Z0-9]*");
      const rx = { $regex: fuzzy, $options: "i" };
      doctors = await Doctor.find({ name: rx as any }).sort({ name: 1 }).limit(limit).lean();
    } else {
      doctors = await Doctor.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
    }

    // Fallback: if Doctor collection empty or search yields nothing, distinct from Patient/Bill for backwards compat
    if (doctors.length === 0) {
      const patientNames: string[] = await Patient.distinct("doctorName") as any;
      const billNames: string[] = await Bill.distinct("doctorName") as any;
      const merged = Array.from(new Set([...(patientNames || []), ...(billNames || [])].filter(Boolean).map((s: string) => s.trim()).filter(Boolean)));
      let filtered = merged;
      if (search) {
        const cleaned = search.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const source = cleaned.length ? cleaned : search.toLowerCase();
        // simple fuzzy test for fallback
        filtered = merged.filter((name: string) => {
          const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
          // check if fuzzy pattern matches
          const fuzzy = source.split("").map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^a-z0-9]*");
          try { return new RegExp(fuzzy, "i").test(name); } catch { return cleanName.includes(source); }
        });
      }
      filtered.sort((a, b) => a.localeCompare(b));
      doctors = filtered.slice(0, limit).map((name) => ({ _id: name, name }));
    }

    return NextResponse.json(doctors, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("DOCTORS GET ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}

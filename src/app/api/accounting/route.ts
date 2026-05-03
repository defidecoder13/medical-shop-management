import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Account from "@/src/models/Account";
import JournalEntry from "@/src/models/JournalEntry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Fetch accounts and journals in parallel
    const [accounts, journals] = await Promise.all([
      Account.find({}).sort({ name: 1 }),
      JournalEntry.find({}).populate("entries.accountId").sort({ createdAt: -1 }).limit(50),
    ]);

    return NextResponse.json({ accounts, journals });
  } catch (error) {
    console.error("ACCOUNTING API ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch accounting data" }, { status: 500 });
  }
}

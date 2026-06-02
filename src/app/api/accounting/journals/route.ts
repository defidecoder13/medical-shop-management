import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import JournalEntry from "@/src/models/JournalEntry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get('page');
    const page = parseInt(pageParam || "1");
    const pageSize = parseInt(searchParams.get('limit') || "20");

    const totalCount = await JournalEntry.countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);

    const journals = await JournalEntry.find()
      .populate("entries.accountId", "name type")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    if (pageParam) {
      return NextResponse.json({
        data: journals,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit: pageSize
        }
      });
    } else {
      return NextResponse.json(journals);
    }
  } catch (error) {
    console.error("Failed to fetch journals:", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

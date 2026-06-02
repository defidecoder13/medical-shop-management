import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Account from "@/src/models/Account";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { type: { $regex: search, $options: "i" } },
        ],
      };
    }

    const queryObj = Account.find(query).sort({ type: 1, name: 1 });

    if (pageParam) {
      const page = parseInt(pageParam) || 1;
      const limit = parseInt(limitParam || "20");

      const totalCount = await Account.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);

      queryObj.skip((page - 1) * limit).limit(limit);
      const accounts = await queryObj.lean();

      return NextResponse.json({
        data: accounts,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit
        }
      });
    } else {
      const accounts = await queryObj.lean();
      return NextResponse.json(accounts);
    }
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

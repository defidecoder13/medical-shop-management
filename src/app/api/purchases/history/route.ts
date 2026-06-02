import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const page = parseInt(pageParam || "1");
    const pageSize = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const filter: any = {};
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { supplierName: { $regex: search, $options: "i" } }
      ];
    }

    const totalCount = await PurchaseInvoice.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);

    const invoices = await PurchaseInvoice.find(filter)
      .populate("supplierId", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    if (pageParam) {
      return NextResponse.json({
        data: invoices,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          limit: pageSize
        }
      });
    } else {
      return NextResponse.json(invoices);
    }
  } catch (error) {
    console.error("Failed to fetch purchase history:", error);
    return NextResponse.json({ error: "Failed to fetch purchase history" }, { status: 500 });
  }
}

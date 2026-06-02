import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const invoice = await PurchaseInvoice.findById(id).lean();
    if (!invoice) {
      return NextResponse.json({ error: "Purchase Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

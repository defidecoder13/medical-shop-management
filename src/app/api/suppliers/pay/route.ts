import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Supplier from "@/src/models/Supplier";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";
import { createSupplierPaymentEntry } from "@/src/lib/accounting";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await mongoose.startSession();
    
    let result: any;
    
    try {
      await session.withTransaction(async () => {
      
    const { supplierId, amount, method, reference } = await req.json();

    if (!supplierId || !amount || amount <= 0) {
      throw new Error("Invalid payment details");
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    if (supplier.outstandingBalance < amount) {
      throw new Error("Payment amount exceeds outstanding balance");
    }

    // 1. Deduct from outstanding balance
    supplier.outstandingBalance -= amount;
    await supplier.save({ session });

    // 2. Log Journal Entry for payment
    await createSupplierPaymentEntry({
      supplierName: supplier.name,
      amount,
      method: method || "Cash",
      referenceId: supplierId // Or a generated receipt ID
    }, session);

    // 3. Mark old invoices as Paid
    let remainingPayment = amount;
    const unpaidInvoices = await PurchaseInvoice.find({ 
      supplierId, 
      status: { $ne: "Paid" } 
    }).sort({ invoiceDate: 1 }).session(session); // Oldest first

    for (let inv of unpaidInvoices) {
      if (remainingPayment <= 0) break;
      
      const due = inv.grandTotal - (inv.amountPaid || 0);
      
      if (remainingPayment >= due) {
        inv.amountPaid = (inv.amountPaid || 0) + due;
        inv.status = "Paid";
        remainingPayment -= due;
      } else {
        inv.amountPaid = (inv.amountPaid || 0) + remainingPayment;
        inv.status = "Partial";
        remainingPayment = 0;
      }
      
      await inv.save({ session });
    }

    result = { success: true, outstandingBalance: supplier.outstandingBalance };
    }); // end withTransaction
    } finally {
        session.endSession();
    }
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Supplier Payment Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process payment" }, { status: 500 });
  }
}

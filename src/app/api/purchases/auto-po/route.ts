import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";
import Supplier from "@/src/models/Supplier";
import Medicine from "@/src/models/Medicine";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await mongoose.startSession();
    
    let result: any;
    
    try {
      await session.withTransaction(async () => {
        const body = await req.json();
        const { shortageItems } = body; // Array of { medicineId, reorderQty, supplierId, buyingPrice }

        if (!shortageItems || shortageItems.length === 0) {
            throw new Error("No items selected for Auto-PO");
        }

        // 1. Group by Supplier
        const supplierGroups: Record<string, any[]> = {};
        const unassignedItems: any[] = [];

        for (const item of shortageItems) {
            if (!item.supplierId) {
                unassignedItems.push(item);
                continue;
            }
            if (!supplierGroups[item.supplierId]) {
                supplierGroups[item.supplierId] = [];
            }
            supplierGroups[item.supplierId].push(item);
        }

        if (Object.keys(supplierGroups).length === 0) {
            throw new Error("All selected items are missing a default supplier. Please assign suppliers first.");
        }

        const generatedPOs = [];

        // 2. Generate Draft PO for each Supplier Group
        for (const [supplierId, items] of Object.entries(supplierGroups)) {
            const supplier = await Supplier.findById(supplierId).session(session);
            if (!supplier) continue;

            let subTotal = 0;
            const processedItems = [];

            for (const item of items) {
                const medicine = await Medicine.findById(item.medicineId).session(session);
                if (!medicine) continue;

                const qty = Number(item.reorderQty) || 0;
                const buyingPrice = Number(item.buyingPrice) || 0;
                const total = qty * buyingPrice;
                
                subTotal += total;

                processedItems.push({
                    medicineId: medicine._id,
                    name: medicine.name,
                    qty: qty,
                    buyingPrice: buyingPrice,
                    total: total,
                    // Empty fields since this is just a draft PO
                    batchNumber: "",
                    expiryDate: null,
                    pack: "",
                    freeQty: 0,
                    mrp: 0,
                    discountPercent: 0,
                    discountAmount: 0,
                    gstPercent: 0,
                    gstAmount: 0,
                });
            }

            if (processedItems.length === 0) continue;

            const poNumber = `PO-${Date.now().toString().slice(-6)}-${supplier.name.substring(0,3).toUpperCase()}`;

            const draftInvoice = await PurchaseInvoice.create([{
                supplierId: supplier._id,
                supplierName: supplier.name,
                invoiceNumber: poNumber,
                invoiceDate: new Date(), // Today
                items: processedItems,
                subTotal: subTotal,
                grandTotal: subTotal, // No tax/discount logic yet for drafts
                paymentMethod: "Credit",
                status: "Draft", // IMPORTANT: Draft status means it hasn't hit accounting or inventory yet
                amountPaid: 0
            }], { session }).then(res => res[0]);

            generatedPOs.push(draftInvoice);
        }

        result = { 
            success: true, 
            message: `Generated ${generatedPOs.length} Purchase Orders.`,
            pos: generatedPOs,
            unassignedCount: unassignedItems.length
        };
      }); // end withTransaction
      
      session.endSession();
      return NextResponse.json(result, { status: 201 });

    } catch (error: any) {
      console.error("Auto-PO Error:", error);
      return NextResponse.json({ error: error.message || "Failed to generate Purchase Orders" }, { status: 500 });
    }
  } catch (error: any) {
     return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}

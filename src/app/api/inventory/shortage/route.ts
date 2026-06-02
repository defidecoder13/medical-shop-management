import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";
import Supplier from "@/src/models/Supplier";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Fetch all medicines with populated supplier
    const allMedicines = await Medicine.find().populate("defaultSupplierId").lean();

    const shortages = [];

    for (const med of allMedicines) {
        // Fetch all batches for this medicine
        const batches = await MedicineBatch.find({ medicineId: med._id }).sort({ createdAt: -1 }).lean();
        
        // Calculate true stock from physical batches
        const trueStock = batches.reduce((sum, b) => sum + (b.stock || 0), 0);

        // If a medicine has absolutely no batches (never purchased, or explicitly deleted completely), we ignore it from shortages
        // unless you want to re-order things you've completely deleted. Let's assume deleted = no longer tracked.
        if (batches.length === 0) continue;

        const minStock = med.minStockLevel || 5;
        const maxStock = med.maxStockLevel || 50;

        // If it's physically low on stock
        if (trueStock <= minStock) {
            // Smart Supplier Detection:
            // 1. If assigned explicitly on Medicine, use it.
            // 2. Otherwise, look at the most recent purchase batch and grab the supplier name!
            let supplierName = med.defaultSupplierId ? (med.defaultSupplierId as any).name : null;
            let supplierId = med.defaultSupplierId ? (med.defaultSupplierId as any)._id : null;

            if (!supplierId && batches.length > 0 && batches[0].supplierName) {
                supplierName = batches[0].supplierName; // Infer from recent purchase
                // Lookup the Supplier ID so Auto-PO can group them
                const matchedSupplier = await Supplier.findOne({ name: supplierName }).lean();
                if (matchedSupplier) {
                    supplierId = matchedSupplier._id;
                }
            }

            shortages.push({
                _id: med._id,
                name: med.name,
                brand: med.brand,
                category: med.category,
                currentStock: trueStock,
                minStockLevel: minStock,
                maxStockLevel: maxStock,
                reorderQty: maxStock - trueStock,
                buyingPrice: med.buyingPrice || 0,
                supplier: supplierName || "Unassigned",
                supplierId: supplierId
            });
        }
    }

    // Sort by most severe shortage (lowest stock first)
    shortages.sort((a, b) => a.currentStock - b.currentStock);

    return NextResponse.json(shortages);
  } catch (error: any) {
    console.error("Failed to fetch shortages:", error);
    return NextResponse.json({ error: "Failed to fetch shortages" }, { status: 500 });
  }
}

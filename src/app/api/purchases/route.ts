import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";
import MedicineBatch from "@/src/models/MedicineBatch";
import Medicine from "@/src/models/Medicine";
import Supplier from "@/src/models/Supplier";
import { createPurchaseJournalEntry } from "@/src/lib/accounting";
import mongoose from "mongoose";

function determineCategoryAndPack(name: string, packStr: string = "") {
  const lower = name.toLowerCase();
  
  let numericPack = 0;
  if (packStr) {
    const match = packStr.match(/^(\d+)/);
    if (match) {
      numericPack = parseInt(match[1], 10);
    }
  }

  let category = 'Tablet';
  let defaultStrip = 10;

  if (lower.includes('syp') || lower.includes('syrup') || lower.includes('susp')) {
    category = 'Syrup'; defaultStrip = 1;
  } else if (lower.includes('inj') || lower.includes('vial') || lower.includes('amp')) {
    category = 'Injection'; defaultStrip = 1;
  } else if (lower.includes('drop')) {
    category = 'Drops'; defaultStrip = 1;
  } else if (lower.includes('gel') || lower.includes('cream') || lower.includes('oint') || lower.includes('lotion')) {
    category = 'Ointment'; defaultStrip = 1;
  } else if (lower.includes('cap') || lower.includes('capsule')) {
    category = 'Capsule'; defaultStrip = 10;
  } else if (lower.includes('condom') || lower.includes('device') || lower.includes('machine')) {
    category = 'Device'; defaultStrip = 1;
  } else if (lower.includes('spray') || lower.includes('inhaler')) {
    category = 'Spray'; defaultStrip = 1;
  }
  
  let finalStrip = defaultStrip;
  if (category === 'Tablet' || category === 'Capsule') {
    finalStrip = numericPack > 0 ? numericPack : defaultStrip;
  }
  
  return { 
    category, 
    tabletsPerStrip: finalStrip 
  };
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await mongoose.startSession();
    
    let result: any;
    
    try {
      await session.withTransaction(async () => {
      
    const body = await req.json();

    const {
      supplierId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      items,
      subTotal,
      discountAmount,
      gstAmount,
      grandTotal,
      paymentMethod,
    } = body;

    if (!supplierId || !invoiceNumber || !items || items.length === 0) {
      throw new Error("Missing required fields");
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Process items and create batches
    const processedItems = [];

    for (const item of items) {
      let medicineId = item.medicineId;

      // Auto-create basic medicine if it doesn't exist
      if (!medicineId) {
        if (!item.name) {
            throw new Error("Medicine name is required for unmatched items");
        }
        const heuristicInfo = determineCategoryAndPack(item.name, item.pack || "");
        
        const newMed = await Medicine.create([{
          name: item.name,
          brand: item.brand || supplier.name, // Use mapped brand or fallback
          hsnCode: item.hsnCode || "",
          pack: item.pack || "",
          category: heuristicInfo.category,
          tabletsPerStrip: heuristicInfo.tabletsPerStrip, 
          gstPercent: typeof item.gstPercent === 'number' ? item.gstPercent : 0,
        }], { session }).then(res => res[0]);
        medicineId = newMed._id;
      }

      const medicine = await Medicine.findById(medicineId).session(session);
      if (!medicine) continue;

      // Normalize Expiry Date (Assume MM/YY format if string)
      let parsedExpiry = new Date();
      if (typeof item.expiryDate === "string") {
         const parts = item.expiryDate.includes("-") ? item.expiryDate.split("-") : item.expiryDate.split("/");
         if (parts.length === 2) {
            const month = parseInt(parts[0], 10);
            const year = parseInt(parts[1], 10) + 2000;
            parsedExpiry = new Date(year, month, 0); // Last day of that month
         } else {
             parsedExpiry = new Date(item.expiryDate);
         }
      } else if (item.expiryDate) {
         parsedExpiry = new Date(item.expiryDate);
      } else {
         // Default to 1 year from now if totally missing
         parsedExpiry.setFullYear(parsedExpiry.getFullYear() + 1);
      }

      // Create Batch
      const totalUnits = (item.qty || 0) + (item.freeQty || 0);
      const newBatch = await MedicineBatch.create([{
        medicineId,
        batchNumber: item.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
        expiryDate: parsedExpiry,
        supplierName: supplier.name,
        purchaseInvoiceNumber: invoiceNumber,
        stock: totalUnits, // Base stock
        totalTabletsInStock: totalUnits * (medicine.tabletsPerStrip || 1),
        sellingPricePerStrip: item.mrp || medicine.mrp || 0,
        buyingPricePerStrip: item.buyingPrice || 0,
        rackNumber: item.rackNumber || "",
        pack: item.pack || "",
      }], { session }).then(res => res[0]);

      // Update Parent Medicine Stock
      medicine.stock += totalUnits;
      // Update MRP/Buying price to latest
      if (item.mrp) medicine.mrp = item.mrp;
      if (item.buyingPrice) medicine.buyingPrice = item.buyingPrice;
      if (item.brand && !medicine.brand) medicine.brand = item.brand;
      if (item.hsnCode && !medicine.hsnCode) medicine.hsnCode = item.hsnCode;
      if (item.pack && !medicine.pack) medicine.pack = item.pack;
      if (typeof item.gstPercent === 'number' && medicine.gstPercent !== item.gstPercent) {
        medicine.gstPercent = item.gstPercent;
      }
      await medicine.save({ session });

      processedItems.push({
        medicineId,
        name: medicine.name,
        batchNumber: newBatch.batchNumber,
        expiryDate: parsedExpiry,
        pack: item.pack || "",
        qty: item.qty || 0,
        freeQty: item.freeQty || 0,
        mrp: item.mrp || 0,
        buyingPrice: item.buyingPrice || 0,
        discountPercent: item.discountPercent || 0,
        discountAmount: item.discountAmount || 0,
        gstPercent: item.gstPercent || 0,
        gstAmount: item.gstAmount || 0,
        total: item.total || 0,
      });
    }

    // Create Purchase Invoice
    const purchaseInvoice = await PurchaseInvoice.create([{
      supplierId,
      supplierName: supplier.name,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      items: processedItems,
      subTotal: subTotal || 0,
      discountAmount: discountAmount || 0,
      gstAmount: gstAmount || 0,
      grandTotal: grandTotal || 0,
      paymentMethod: paymentMethod || "Credit",
      status: paymentMethod === "Cash" ? "Paid" : "Unpaid",
      amountPaid: paymentMethod === "Cash" ? grandTotal : 0
    }], { session }).then(res => res[0]);

    // Run Accounting Journal
    await createPurchaseJournalEntry(purchaseInvoice, session);

    // If Credit, update Supplier outstanding balance
    if (purchaseInvoice.status !== "Paid") {
       supplier.outstandingBalance = (supplier.outstandingBalance || 0) + (purchaseInvoice.grandTotal - purchaseInvoice.amountPaid);
       await supplier.save({ session });
    }

    result = { success: true, invoice: purchaseInvoice };
    }); // end withTransaction
    } finally {
        session.endSession();
    }
    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Purchase Creation Error:", error);
    // Handle Duplicate Invoice Error
    if (error.code === 11000) {
        return NextResponse.json({ error: "Invoice number already exists for this supplier." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create purchase invoice" }, { status: 500 });
  }
}

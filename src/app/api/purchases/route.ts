import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";
import MedicineBatch from "@/src/models/MedicineBatch";
import Medicine from "@/src/models/Medicine";
import Supplier from "@/src/models/Supplier";

import mongoose from "mongoose";

function determineCategoryAndPack(name: any, packStr: any = "") {
  const lower = String(name || "").toLowerCase();
  const safePackStr = String(packStr || "");
  
  let numericPack = 0;
  if (safePackStr) {
    const match = safePackStr.match(/^(\d+)/);
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
    
    const body = await req.json();
    let result: any;
    
    try {
      await session.withTransaction(async () => {
      
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

    if (!supplierId || !items || items.length === 0) {
      throw new Error("Missing required fields");
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Process items and create batches FAST using Bulk Operations
    const processedItems = [];
    const newBatchesToInsert = [];
    const medicineUpdates = new Map();
    const newMedicinesToInsert = [];
    
    // 1. Fetch existing medicines to avoid doing it sequentially in the loop
    const itemNames = items.filter((i: any) => i.name).map((i: any) => String(i.name).trim());
    const existingMedsList = await Medicine.find({ 
        name: { $in: itemNames.map((n: string) => new RegExp(`^${n.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i')) } 
    }).session(session);
    
    const medMap = new Map();
    existingMedsList.forEach((m: any) => medMap.set(m.name.toLowerCase(), m));

    let batchCounter = 0;

    for (const item of items) {
      let medicineId = item.medicineId;
      let medicine: any = null;
      const cleanName = String(item.name || "").trim();

      if (medicineId) {
          medicine = existingMedsList.find((m: any) => m._id.toString() === medicineId.toString());
          if (!medicine) {
              medicine = await Medicine.findById(medicineId).session(session);
              if (medicine) medMap.set(medicine.name.toLowerCase(), medicine);
          }
      } else if (cleanName) {
          medicine = medMap.get(cleanName.toLowerCase());
          
          if (!medicine) {
             const heuristicInfo = determineCategoryAndPack(cleanName, item.pack || "");
             medicine = new Medicine({
               _id: new mongoose.Types.ObjectId(),
               name: cleanName,
               brand: item.brand || supplier.name,
               hsnCode: item.hsnCode || "",
               pack: item.pack || "",
               category: heuristicInfo.category,
               tabletsPerStrip: heuristicInfo.tabletsPerStrip, 
               gstPercent: typeof item.gstPercent === 'number' ? item.gstPercent : 0,
               stock: 0,
             });
             newMedicinesToInsert.push(medicine);
             medMap.set(cleanName.toLowerCase(), medicine);
          }
      }

      if (!medicine) continue;

      // Normalize Expiry Date (Assume MM/YY format if string)
      let parsedExpiry = new Date();
      if (typeof item.expiryDate === "string" && item.expiryDate.trim() !== "") {
         const parts = item.expiryDate.includes("-") ? item.expiryDate.split("-") : item.expiryDate.split("/");
         if (parts.length === 2) {
            const month = parseInt(parts[0], 10);
            const year = parseInt(parts[1], 10) + 2000;
            parsedExpiry = new Date(year, month, 0); // Last day of that month
         } else {
             parsedExpiry = new Date(item.expiryDate);
         }
      } else if (item.expiryDate && item.expiryDate !== "") {
         parsedExpiry = new Date(item.expiryDate);
      } else {
         // Default to 1 year from now if totally missing
         parsedExpiry.setFullYear(parsedExpiry.getFullYear() + 1);
      }

      // Create Batch Object in memory
      const totalUnits = (item.qty || 0) + (item.freeQty || 0);
      const genBatchNumber = item.batchNumber || `B${Date.now().toString().slice(-6)}${batchCounter++}`;
      
      const newBatchObj = {
        _id: new mongoose.Types.ObjectId(),
        medicineId: medicine._id,
        batchNumber: genBatchNumber,
        expiryDate: parsedExpiry,
        supplierName: supplier.name,
        purchaseInvoiceNumber: invoiceNumber,
        stock: totalUnits, // Base stock
        totalTabletsInStock: totalUnits * (medicine.tabletsPerStrip || 1),
        sellingPricePerStrip: item.mrp || medicine.mrp || 0,
        buyingPricePerStrip: item.buyingPrice || 0,
        rackNumber: item.rackNumber || "",
        pack: item.pack || "",
        discountPercent: item.discountPercent || 0,
      };
      
      newBatchesToInsert.push(newBatchObj);

      // Track Parent Medicine Stock updates in memory
      if (!medicineUpdates.has(medicine._id.toString())) {
          medicineUpdates.set(medicine._id.toString(), { doc: medicine, stockToAdd: 0 });
      }
      const updateData = medicineUpdates.get(medicine._id.toString());
      updateData.stockToAdd += totalUnits;
      if (item.mrp) updateData.doc.mrp = item.mrp;
      if (item.buyingPrice) updateData.doc.buyingPrice = item.buyingPrice;
      if (item.brand && !updateData.doc.brand) updateData.doc.brand = item.brand;
      if (item.hsnCode && !updateData.doc.hsnCode) updateData.doc.hsnCode = item.hsnCode;
      if (item.pack && !updateData.doc.pack) updateData.doc.pack = item.pack;
      if (typeof item.gstPercent === 'number') updateData.doc.gstPercent = item.gstPercent;

      processedItems.push({
        medicineId: medicine._id,
        name: medicine.name,
        batchNumber: newBatchObj.batchNumber,
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

    // 2. Execute Bulk Writes OUTSIDE the loop for massive performance gain
    if (newMedicinesToInsert.length > 0) {
        await Medicine.insertMany(newMedicinesToInsert, { session });
    }
    
    if (newBatchesToInsert.length > 0) {
        await MedicineBatch.insertMany(newBatchesToInsert, { session });
    }
    
    const bulkOps = Array.from(medicineUpdates.values()).map(update => ({
        updateOne: {
            filter: { _id: update.doc._id },
            update: { 
                $set: { 
                    stock: (update.doc.stock || 0) + update.stockToAdd,
                    mrp: update.doc.mrp,
                    buyingPrice: update.doc.buyingPrice,
                    brand: update.doc.brand,
                    hsnCode: update.doc.hsnCode,
                    pack: update.doc.pack,
                    gstPercent: update.doc.gstPercent
                }
            }
        }
    }));
    
    if (bulkOps.length > 0) {
        await Medicine.bulkWrite(bulkOps, { session });
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
        return NextResponse.json({ error: `Duplicate key error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create purchase invoice" }, { status: 500 });
  }
}

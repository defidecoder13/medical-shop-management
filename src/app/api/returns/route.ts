import { NextResponse } from "next/server";
import Settings from "@/src/models/Settings";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import MedicineBatch from "@/src/models/MedicineBatch";
import Medicine from "@/src/models/Medicine";
import mongoose from "mongoose";
import { deleteCache, setCache } from "@/src/lib/redis";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        await connectDB();
        const session = await mongoose.startSession();
        
        let result: any;
        
        try {
          await session.withTransaction(async () => {
          
        const data = await req.json();
        const { originalBillId, returnedItems } = data; // { batchNumber, name, returnQty }[]

        if (!originalBillId || !returnedItems || returnedItems.length === 0) {
            throw new Error("Invalid payload");
        }

        const originalBill = await Bill.findById(originalBillId).session(session);
        if (!originalBill) {
            throw new Error("Original bill not found");
        }

        if (originalBill.returnStatus === 'Full') {
            throw new Error("Bill is already fully returned");
        }

        const newBillItems = [];
        let returnSubTotal = 0;

        // Process Return Updates
        for (const returnReq of returnedItems) {
            const returnQtyNum = Number(returnReq.returnQty);
            if (isNaN(returnQtyNum) || returnQtyNum <= 0) continue;

            const originalItem = typeof returnReq.itemIndex === 'number' && originalBill.items[returnReq.itemIndex]
                ? originalBill.items[returnReq.itemIndex]
                : originalBill.items.find((item: any) => 
                    item.batchNumber === returnReq.batchNumber && 
                    item.name === returnReq.name &&
                    (returnReq.unitType ? item.unitType === returnReq.unitType : true) &&
                    ((item.qty || 0) - (item.returnedQty || 0) >= returnQtyNum)
                  ) || originalBill.items.find((item: any) => 
                    item.batchNumber === returnReq.batchNumber && 
                    item.name === returnReq.name &&
                    (returnReq.unitType ? item.unitType === returnReq.unitType : true)
                  );

            if (!originalItem) continue;

            const maxReturnable = (originalItem.qty || 0) - (originalItem.returnedQty || 0);
            if (returnQtyNum > maxReturnable) {
                throw new Error(`Cannot return ${returnQtyNum} of ${originalItem.name} (${originalItem.unitType || 'strip'}). Maximum is ${maxReturnable}`);
            }

            // Math matches original billing structure exactly
            const itemSubTotalToReturn = (originalItem.sellingPrice || 0) * returnQtyNum;
            returnSubTotal += itemSubTotalToReturn;

            // Update original item tracker
            originalItem.returnedQty = (originalItem.returnedQty || 0) + returnQtyNum;

            // New Bill entry
            newBillItems.push({
                name: originalItem.name,
                brand: originalItem.brand,
                expiryDate: originalItem.expiryDate,
                batchNumber: originalItem.batchNumber,
                hsnCode: originalItem.hsnCode,
                unitType: originalItem.unitType,
                pack: originalItem.pack,
                qty: returnQtyNum,
                sellingPrice: originalItem.sellingPrice,
                buyingPrice: originalItem.buyingPrice,
                total: itemSubTotalToReturn, // Positive here, scaled negative at the Bill level
                returnedQty: 0
            });

            // Update Medicine Stock
            // originalItem.batchNumber might be a comma-separated list due to FEFO (e.g. "B1, B2")
            // We'll just return the physical stock to the first batch in the list for simplicity.
            const primaryBatchNum = originalItem.batchNumber?.split(',')[0].trim() || '';
            const medicine = await Medicine.findOne({ name: originalItem.name }).session(session);
            
            if (medicine) {
                const batch = await MedicineBatch.findOne({ 
                    medicineId: medicine._id, 
                    batchNumber: primaryBatchNum 
                }).populate('medicineId').session(session);
                
                if (batch) {
                    const masterMedicine = batch.medicineId as any;
                    const tabletsPerStrip = masterMedicine?.tabletsPerStrip || 1;
                    
                    let stockToAdd = 0;
                    if (originalItem.unitType === 'strip') {
                        stockToAdd = returnQtyNum;
                    } else {
                        stockToAdd = returnQtyNum / tabletsPerStrip;
                    }

                    batch.stock += stockToAdd;
                    batch.totalTabletsInStock = batch.stock * tabletsPerStrip;
                    await batch.save({ session });
                }
            }
        }

        if (newBillItems.length === 0) {
            throw new Error("No valid items to return");
        }

        // Determine return status on the original bill
        let allFullyReturned = true;
        let anyReturned = false;
        for (const item of originalBill.items) {
            if ((item.returnedQty || 0) > 0) anyReturned = true;
            if ((item.returnedQty || 0) < (item.qty || 0)) allFullyReturned = false;
        }

        originalBill.returnStatus = allFullyReturned ? 'Full' : (anyReturned ? 'Partial' : 'None');
        await originalBill.save({ session });

        // Scale discounts and taxes exactly identically to the original receipt
        const discountAmount = returnSubTotal * ((originalBill.discountPercent || 0) / 100);
        const subTotalAfterDiscount = returnSubTotal - discountAmount;

        const gstPercent = originalBill.gstPercent || 0;
        const gstAmount = originalBill.gstEnabled ? (subTotalAfterDiscount * (gstPercent / 100)) : 0;
        const grandTotal = subTotalAfterDiscount + gstAmount;

        // Negate the totals for the return ledger entry
        const roundedDiscountAmount = Math.round(discountAmount * 100) / 100;
        const roundedGstAmount = Math.round(gstAmount * 100) / 100;
        
        // Nearest Rupee rounding for returns
        const finalGrandTotal = Math.round(grandTotal);
        const roundingAdjustment = Math.round((finalGrandTotal - grandTotal) * 100) / 100;

        // Create the "Credit Note" Bill
        const returnBill = await Bill.create([{
            items: newBillItems,
            subTotal: -returnSubTotal,
            discountPercent: originalBill.discountPercent,
            discountAmount: -roundedDiscountAmount,
            gstAmount: -roundedGstAmount,
            gstPercent: originalBill.gstPercent,
            grandTotal: -finalGrandTotal,
            roundingAdjustment: -roundingAdjustment,
            gstEnabled: originalBill.gstEnabled,
            printInvoice: false,
            isReturn: true,
            originalBillId: originalBill._id,
            patientName: originalBill.patientName,
            patientPhone: originalBill.patientPhone,
            doctorName: originalBill.doctorName,
        }], { session }).then(res => res[0]);


        result = { success: true, returnBill, originalBill };
        
        }); // end withTransaction
        } finally {
            session.endSession();
            await deleteCache("catalog:all");
            await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            await setCache("catalog:version", Date.now().toString(), 604800);
        }
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("RETURN ERROR:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process return" },
            { status: 500 }
        );
    }
}

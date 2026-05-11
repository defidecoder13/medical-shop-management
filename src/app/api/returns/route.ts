import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import MedicineBatch from "@/src/models/MedicineBatch";
import { createReturnJournalEntry } from "@/src/lib/accounting";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();
        const { originalBillId, returnedItems } = data; // { batchNumber, name, returnQty }[]

        if (!originalBillId || !returnedItems || returnedItems.length === 0) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const originalBill = await Bill.findById(originalBillId);
        if (!originalBill) {
            return NextResponse.json({ error: "Original bill not found" }, { status: 404 });
        }

        if (originalBill.returnStatus === 'Full') {
            return NextResponse.json({ error: "Bill is already fully returned" }, { status: 400 });
        }

        const newBillItems = [];
        let returnSubTotal = 0;

        // Process Return Updates
        for (const returnReq of returnedItems) {
            const returnQtyNum = Number(returnReq.returnQty);
            if (isNaN(returnQtyNum) || returnQtyNum <= 0) continue;

            const originalItem = originalBill.items.find((item: any) => item.batchNumber === returnReq.batchNumber && item.name === returnReq.name);
            if (!originalItem) continue;

            const maxReturnable = (originalItem.qty || 0) - (originalItem.returnedQty || 0);
            if (returnQtyNum > maxReturnable) {
                return NextResponse.json({ error: `Cannot return ${returnQtyNum} of ${originalItem.name}. Maximum is ${maxReturnable}` }, { status: 400 });
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
            const batch = await MedicineBatch.findOne({ batchNumber: primaryBatchNum }).populate('medicineId');
            
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
                await batch.save();
            }
        }

        if (newBillItems.length === 0) {
            return NextResponse.json({ error: "No valid items to return" }, { status: 400 });
        }

        // Determine return status on the original bill
        let allFullyReturned = true;
        let anyReturned = false;
        for (const item of originalBill.items) {
            if ((item.returnedQty || 0) > 0) anyReturned = true;
            if ((item.returnedQty || 0) < (item.qty || 0)) allFullyReturned = false;
        }

        originalBill.returnStatus = allFullyReturned ? 'Full' : (anyReturned ? 'Partial' : 'None');
        await originalBill.save();

        // Scale discounts and taxes exactly identically to the original receipt
        const discountAmount = returnSubTotal * ((originalBill.discountPercent || 0) / 100);
        const subTotalAfterDiscount = returnSubTotal - discountAmount;

        const gstPercent = originalBill.gstPercent || 0;
        const gstAmount = originalBill.gstEnabled ? (subTotalAfterDiscount * (gstPercent / 100)) : 0;
        const grandTotal = subTotalAfterDiscount + gstAmount;

        // Negate the totals for the return ledger entry
        const roundedDiscountAmount = Math.round(discountAmount * 100) / 100;
        const roundedGstAmount = Math.round(gstAmount * 100) / 100;
        const roundedGrandTotal = Math.round(grandTotal * 100) / 100;

        // Create the "Credit Note" Bill
        const returnBill = await Bill.create({
            items: newBillItems,
            subTotal: -returnSubTotal,
            discountPercent: originalBill.discountPercent,
            discountAmount: -roundedDiscountAmount,
            gstAmount: -roundedGstAmount,
            gstPercent: originalBill.gstPercent,
            grandTotal: -roundedGrandTotal,
            gstEnabled: originalBill.gstEnabled,
            printInvoice: false,
            isReturn: true,
            originalBillId: originalBill._id,
            patientName: originalBill.patientName,
            patientPhone: originalBill.patientPhone,
            doctorName: originalBill.doctorName,
        });

        // 🏦 ACCOUNTING: Create Double Entry Journal
        await createReturnJournalEntry(returnBill);

        return NextResponse.json({ success: true, returnBill, originalBill });
    } catch (error) {
        console.error("RETURN ERROR:", error);
        return NextResponse.json(
            { error: "Failed to process return" },
            { status: 500 }
        );
    }
}

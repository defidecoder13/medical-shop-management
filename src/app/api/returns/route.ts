import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import Medicine from "@/src/models/Medicine";

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
            if (returnReq.returnQty <= 0) continue;

            const originalItem = originalBill.items.find((item: any) => item.batchNumber === returnReq.batchNumber && item.name === returnReq.name);
            if (!originalItem) continue;

            const maxReturnable = (originalItem.qty || 0) - (originalItem.returnedQty || 0);
            if (returnReq.returnQty > maxReturnable) {
                return NextResponse.json({ error: `Cannot return ${returnReq.returnQty} of ${originalItem.name}. Maximum is ${maxReturnable}` }, { status: 400 });
            }

            // Math matches original billing structure exactly
            const itemSubTotalToReturn = (originalItem.sellingPrice || 0) * returnReq.returnQty;
            returnSubTotal += itemSubTotalToReturn;

            // Update original item tracker
            originalItem.returnedQty = (originalItem.returnedQty || 0) + returnReq.returnQty;

            // New Bill entry
            newBillItems.push({
                name: originalItem.name,
                brand: originalItem.brand,
                expiryDate: originalItem.expiryDate,
                batchNumber: originalItem.batchNumber,
                hsnCode: originalItem.hsnCode,
                unitType: originalItem.unitType,
                qty: returnReq.returnQty,
                sellingPrice: originalItem.sellingPrice,
                buyingPrice: originalItem.buyingPrice,
                total: itemSubTotalToReturn, // Positive here, scaled negative at the Bill level
                returnedQty: 0
            });

            // Update Medicine Stock
            const medicine = await Medicine.findOne({ batchNumber: originalItem.batchNumber, name: originalItem.name });
            if (medicine) {
                let stockToAdd = 0;
                if (originalItem.unitType === 'strip') {
                    stockToAdd = returnReq.returnQty;
                } else {
                    stockToAdd = returnReq.returnQty / (medicine.tabletsPerStrip || 1);
                }

                medicine.stock += stockToAdd;
                medicine.totalTabletsInStock = medicine.stock * (medicine.tabletsPerStrip || 1);
                await medicine.save();
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

        return NextResponse.json({ success: true, returnBill, originalBill });
    } catch (error) {
        console.error("RETURN ERROR:", error);
        return NextResponse.json(
            { error: "Failed to process return" },
            { status: 500 }
        );
    }
}

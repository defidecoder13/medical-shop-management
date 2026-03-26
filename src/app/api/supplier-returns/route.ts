import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import SupplierReturn from "@/src/models/SupplierReturn";
import Medicine from "@/src/models/Medicine";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || '1m';

        const now = new Date();
        let startDate = new Date();
        if (range === '1d') startDate.setDate(now.getDate() - 1);
        else if (range === '7d') startDate.setDate(now.getDate() - 7);
        else if (range === '1m') startDate.setMonth(now.getMonth() - 1);
        else startDate.setMonth(now.getMonth() - 1);

        const returns = await SupplierReturn.find({
            createdAt: { $gte: startDate }
        }).sort({ createdAt: -1 });

        return NextResponse.json(returns);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const updatedMeds: any[] = [];
    try {
        await connectDB();
        const data = await req.json();
        const { supplierName, reason, items } = data;

        if (!supplierName || !items || items.length === 0) {
            return NextResponse.json({ error: "Invalid payload: Supplier and items required" }, { status: 400 });
        }

        let totalRefundAmount = 0;
        const returnItems = [];

        // Validations and calculations
        for (const item of items) {
            const medicine = await Medicine.findById(item.medicineId);
            if (!medicine) {
                return NextResponse.json({ error: `Medicine not found for ID: ${item.medicineId}` }, { status: 400 });
            }

            // Save state for rollback
            updatedMeds.push({
                _id: medicine._id.toString(),
                stock: medicine.stock,
                totalTabletsInStock: medicine.totalTabletsInStock,
            });

            let stockToDeduct = 0;
            let costPricePerUnit = 0;

            if (item.unitType === 'strip') {
                stockToDeduct = item.qty;
                costPricePerUnit = medicine.buyingPricePerStrip || 0;
            } else {
                const stripsEquivalent = item.qty / (medicine.tabletsPerStrip || 1);
                stockToDeduct = stripsEquivalent;
                costPricePerUnit = (medicine.buyingPricePerStrip || 0) / (medicine.tabletsPerStrip || 1);
            }

            if (medicine.stock < stockToDeduct) {
                return NextResponse.json({ error: `Insufficient stock to return ${item.name}. Available: ${medicine.stock} strips.` }, { status: 400 });
            }

            // Subtract the returned items from actual main inventory
            medicine.stock -= stockToDeduct;
            medicine.totalTabletsInStock = medicine.stock * (medicine.tabletsPerStrip || 1);
            await medicine.save();

            const itemTotal = item.qty * costPricePerUnit;
            totalRefundAmount += itemTotal;

            returnItems.push({
                medicineId: medicine._id,
                name: medicine.name,
                batchNumber: medicine.batchNumber,
                unitType: item.unitType,
                qty: item.qty,
                buyingPrice: costPricePerUnit,
                total: itemTotal
            });
        }

        const roundedTotal = Math.round(totalRefundAmount * 100) / 100;

        const supplierReturn = await SupplierReturn.create({
            supplierName,
            reason: reason || "Standard",
            items: returnItems,
            totalRefundAmount: roundedTotal
        });

        return NextResponse.json({ success: true, supplierReturn });
    } catch (error) {
        // Rollback
        for (const m of updatedMeds) {
            await Medicine.findByIdAndUpdate(m._id, { stock: m.stock, totalTabletsInStock: m.totalTabletsInStock });
        }
        console.error("SUPPLIER RETURN ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

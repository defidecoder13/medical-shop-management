import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import SupplierReturn from "@/src/models/SupplierReturn";
import MedicineBatch from "@/src/models/MedicineBatch";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || '1m';
        const pageParam = searchParams.get('page');
        const page = parseInt(pageParam || "1");
        const limit = parseInt(searchParams.get('limit') || "20");
        const search = searchParams.get('search') || "";

        const filter: any = {};
        
        if (range !== 'all') {
            const now = new Date();
            let startDate = new Date();
            if (range === '1d') startDate.setDate(now.getDate() - 1);
            else if (range === '7d') startDate.setDate(now.getDate() - 7);
            else if (range === '1m') startDate.setMonth(now.getMonth() - 1);
            else startDate.setMonth(now.getMonth() - 1);
            filter.createdAt = { $gte: startDate };
        }

        if (search) {
            filter.$or = [
                { supplierName: { $regex: search, $options: 'i' } },
                { 'items.name': { $regex: search, $options: 'i' } }
            ];
        }

        const totalCount = await SupplierReturn.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);

        const returns = await SupplierReturn.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        if (pageParam) {
            return NextResponse.json({
                data: returns,
                pagination: {
                    totalCount,
                    totalPages,
                    currentPage: page,
                    limit
                }
            });
        } else {
            return NextResponse.json(returns);
        }
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

        for (const item of items) {
            // In Supplier Returns, you return a specific batch, so item.medicineId is the Batch ID
            const batch = await MedicineBatch.findById(item.medicineId).populate('medicineId');
            if (!batch) {
                return NextResponse.json({ error: `Batch not found for ID: ${item.medicineId}` }, { status: 400 });
            }

            const masterMedicine = batch.medicineId;

            // Save state for rollback
            updatedMeds.push({
                _id: batch._id.toString(),
                stock: batch.stock,
                totalTabletsInStock: batch.totalTabletsInStock,
            });

            let stockToDeduct = 0;
            let costPricePerUnit = 0;

            if (item.unitType === 'strip') {
                stockToDeduct = item.qty;
                costPricePerUnit = batch.buyingPricePerStrip || 0;
            } else {
                const stripsEquivalent = item.qty / (masterMedicine.tabletsPerStrip || 1);
                stockToDeduct = stripsEquivalent;
                costPricePerUnit = (batch.buyingPricePerStrip || 0) / (masterMedicine.tabletsPerStrip || 1);
            }

            if (batch.stock < stockToDeduct) {
                return NextResponse.json({ error: `Insufficient stock to return ${item.name} from batch ${batch.batchNumber}. Available: ${batch.stock} strips.` }, { status: 400 });
            }

            // Subtract the returned items from actual main inventory
            batch.stock -= stockToDeduct;
            batch.totalTabletsInStock = batch.stock * (masterMedicine.tabletsPerStrip || 1);
            await batch.save();

            const itemTotal = item.qty * costPricePerUnit;
            totalRefundAmount += itemTotal;

            returnItems.push({
                medicineId: batch._id,
                name: masterMedicine.name,
                batchNumber: batch.batchNumber,
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
            await MedicineBatch.findByIdAndUpdate(m._id, { stock: m.stock, totalTabletsInStock: m.totalTabletsInStock });
        }
        console.error("SUPPLIER RETURN ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

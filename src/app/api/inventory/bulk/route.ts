import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        if (!Array.isArray(body) || body.length === 0) {
            return NextResponse.json({ error: "Invalid payload. Expected an array of medicines." }, { status: 400 });
        }

        let addedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < body.length; i++) {
            const item = body[i];
            const stock = Number(item.stock);
            const tabletsPerStrip = Number(item.tabletsPerStrip);
            const buyingPricePerStrip = Number(item.buyingPrice);
            const sellingPricePerStrip = Number(item.sellingPrice);

            const {
                name,
                brand,
                batchNumber,
                expiryDate,
                gstPercent = 5,
                rackNumber = "",
                composition = "",
                hsnCode = "3004"
            } = item;

            if (!name || !batchNumber || !expiryDate || Number.isNaN(stock) || Number.isNaN(tabletsPerStrip)) {
                errors.push(`Row ${i + 1} (${name || 'Unknown'}): Missing critical fields.`);
                continue;
            }

            if (stock < 0 || tabletsPerStrip <= 0) {
                errors.push(`Row ${i + 1} (${name}): Stock/Tablets must be > 0.`);
                continue;
            }

            // 1. Find or Create Medicine Master
            let medicine = await Medicine.findOne({
                name: { $regex: `^${name}$`, $options: "i" }
            });

            if (!medicine) {
                medicine = await Medicine.create({
                    name,
                    brand: brand || "",
                    tabletsPerStrip,
                    composition,
                    hsnCode,
                    gstPercent: Number.isNaN(Number(gstPercent)) ? 5 : Number(gstPercent),
                });
            } else {
                // Optionally update master fields if provided
                if (brand) medicine.brand = brand;
                if (composition) medicine.composition = composition;
                await medicine.save();
            }

            // 2. Find or Create MedicineBatch
            const existingBatch = await MedicineBatch.findOne({
                medicineId: medicine._id,
                batchNumber: { $regex: `^${batchNumber}$`, $options: "i" },
            });

            if (existingBatch) {
                // EXACT MATCH: Add Stock rather than overwrite
                existingBatch.stock += stock;
                existingBatch.totalTabletsInStock = existingBatch.stock * medicine.tabletsPerStrip;

                // Update prices only if explicitly provided in CSV greater than 0
                if (!Number.isNaN(buyingPricePerStrip) && buyingPricePerStrip > 0) {
                    existingBatch.buyingPricePerStrip = buyingPricePerStrip;
                }
                if (!Number.isNaN(sellingPricePerStrip) && sellingPricePerStrip > 0) {
                    existingBatch.sellingPricePerStrip = sellingPricePerStrip;
                }

                // Update optional fields if provided
                if (rackNumber) existingBatch.rackNumber = rackNumber;
                if (expiryDate) existingBatch.expiryDate = new Date(expiryDate);

                await existingBatch.save();
                updatedCount++;
            } else {
                // NEW BATCH
                const totalTabletsInStock = stock * medicine.tabletsPerStrip;
                await MedicineBatch.create({
                    medicineId: medicine._id,
                    batchNumber,
                    expiryDate: new Date(expiryDate),
                    stock,
                    totalTabletsInStock,
                    buyingPricePerStrip: Number.isNaN(buyingPricePerStrip) ? 0 : buyingPricePerStrip,
                    sellingPricePerStrip: Number.isNaN(sellingPricePerStrip) ? 0 : sellingPricePerStrip,
                    rackNumber,
                });
                addedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            added: addedCount,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("BULK INVENTORY POST ERROR:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process bulk upload" },
            { status: 500 }
        );
    }
}

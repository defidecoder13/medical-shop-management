import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";

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

            // Check if exact medicine and batch exists
            const existing = await Medicine.findOne({
                name: { $regex: `^${name}$`, $options: "i" },
                batchNumber: { $regex: `^${batchNumber}$`, $options: "i" },
            });

            if (existing) {
                // EXACT MATCH: Add Stock rather than overwrite
                existing.stock += stock;
                existing.totalTabletsInStock = existing.stock * existing.tabletsPerStrip; // Re-calc with existing tabletsPerStrip to be safe

                // Update prices only if explicitly provided in CSV greater than 0
                if (!Number.isNaN(buyingPricePerStrip) && buyingPricePerStrip > 0) {
                    existing.buyingPricePerStrip = buyingPricePerStrip;
                }
                if (!Number.isNaN(sellingPricePerStrip) && sellingPricePerStrip > 0) {
                    existing.sellingPricePerStrip = sellingPricePerStrip;
                }

                // Update optional fields if provided
                if (rackNumber) existing.rackNumber = rackNumber;
                if (composition) existing.composition = composition;
                if (brand) existing.brand = brand;

                await existing.save();
                updatedCount++;
            } else {
                // NEW BATCH
                const totalTabletsInStock = stock * tabletsPerStrip;
                await Medicine.create({
                    name,
                    brand: brand || "",
                    batchNumber,
                    expiryDate: new Date(expiryDate),
                    stock,
                    tabletsPerStrip,
                    totalTabletsInStock,
                    buyingPricePerStrip: Number.isNaN(buyingPricePerStrip) ? 0 : buyingPricePerStrip,
                    sellingPricePerStrip: Number.isNaN(sellingPricePerStrip) ? 0 : sellingPricePerStrip,
                    gstPercent: Number.isNaN(Number(gstPercent)) ? 5 : Number(gstPercent),
                    rackNumber,
                    composition,
                    hsnCode,
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

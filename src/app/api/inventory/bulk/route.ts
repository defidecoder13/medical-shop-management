import { NextResponse } from "next/server";
import Settings from "@/src/models/Settings";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";
import { redis } from "@/src/lib/redis";

export const dynamic = "force-dynamic";

const parseBackendExpiryDate = (expiryInput: any): Date | null => {
  if (!expiryInput) return null;
  
  // 1. Handle Excel Serial Numbers (e.g., 45231 or "45231")
  const numericVal = Number(expiryInput);
  if (!isNaN(numericVal) && numericVal > 20000 && numericVal < 100000) {
    return new Date(Math.round((numericVal - 25569) * 86400 * 1000));
  }

  const expiryStr = String(expiryInput).trim();
  
  // 2. Handle alphanumeric formats like "Sep-27" or "Sep 2027"
  const alphaMatch = expiryStr.match(/^([a-zA-Z]{3})[-/\s](\d{2,4})$/);
  if (alphaMatch) {
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthStr = alphaMatch[1].toLowerCase();
    const monthIndex = monthNames.indexOf(monthStr);
    if (monthIndex !== -1) {
      const month = monthIndex + 1;
      let year = parseInt(alphaMatch[2], 10);
      if (year < 100) year += 2000;
      return new Date(year, month, 0); // Last day of month
    }
  }

  // 3. Normalize delimiters and match MM/YY or MM/YYYY
  const cleanStr = expiryStr.replace(/[-.]/g, "/");
  const match = cleanStr.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    let year = parseInt(match[2], 10);
    if (month >= 1 && month <= 12) {
      if (year < 100) year += 2000;
      return new Date(year, month, 0);
    }
  }
  
  // 4. ISO or YYYY-MM-DD
  const fallbackDate = new Date(expiryStr);
  if (!isNaN(fallbackDate.getTime())) return fallbackDate;
  
  return null;
};

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
            const discountPercent = Number(item.discountPercent) || 0;
            const supplierName = item.supplierName || item["Supplier Name"] || "Direct Purchase";
            const purchaseInvoiceNumber = item.purchaseInvoiceNumber || item["Invoice Number"] || "";

            const category = item.category || item["Category"] || "Tablet";

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

            const parsedDate = parseBackendExpiryDate(expiryDate);
            if (!parsedDate || parsedDate.getFullYear() === 1970) {
                errors.push(`Row ${i + 1} (${name}): Invalid expiry date format (${expiryDate}).`);
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
                    category,
                });
            } else {
                // Optionally update master fields if provided
                if (brand) medicine.brand = brand;
                if (composition) medicine.composition = composition;
                if (category && medicine.category !== category) {
                    medicine.category = category;
                }
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
                if (parsedDate) existingBatch.expiryDate = parsedDate;
                if (discountPercent !== undefined) existingBatch.discountPercent = discountPercent;
                if (supplierName && supplierName !== "Direct Purchase") existingBatch.supplierName = supplierName;
                if (purchaseInvoiceNumber) existingBatch.purchaseInvoiceNumber = purchaseInvoiceNumber;

                await existingBatch.save();
                updatedCount++;
            } else {
                // NEW BATCH
                const totalTabletsInStock = stock * medicine.tabletsPerStrip;
                await MedicineBatch.create({
                    medicineId: medicine._id,
                    batchNumber,
                    expiryDate: parsedDate,
                    stock,
                    totalTabletsInStock,
                    buyingPricePerStrip: Number.isNaN(buyingPricePerStrip) ? 0 : buyingPricePerStrip,
                    sellingPricePerStrip: Number.isNaN(sellingPricePerStrip) ? 0 : sellingPricePerStrip,
                    rackNumber,
                    discountPercent,
                    supplierName,
                    purchaseInvoiceNumber,
                });
                addedCount++;
            }
        }

        if (redis) {
            const keys = await redis.keys("inventory:get:*");
            keys.push("catalog:all"); // Legacy cleanup
            await redis.del(...keys);
            await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            await redis.set("catalog:version", Date.now().toString());
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


import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";

export async function GET() {
    try {
        await connectDB();

        const medicines = await Medicine.find({});
        let updatedCount = 0;

        for (const med of medicines) {
            let needsUpdate = false;

            // Fix missing/NaN Cost Price
            if (med.buyingPrice === undefined || med.buyingPrice === null || isNaN(med.buyingPrice)) {
                med.buyingPrice = 0;
                needsUpdate = true;
            }

            // Fix missing/NaN Selling Price (MRP)
            if (med.mrp === undefined || med.mrp === null || isNaN(med.mrp)) {
                // Fallback to buying price if available, else 0
                med.mrp = med.buyingPrice > 0 ? med.buyingPrice : 0;
                needsUpdate = true;
            }


            // Fix missing tabletsPerStrip or invalid
            if (!med.tabletsPerStrip || med.tabletsPerStrip <= 0) {
                med.tabletsPerStrip = 10; // Default fallback
                needsUpdate = true;
            }

            if (needsUpdate) {
                await med.save();
                updatedCount++;
            }
        }

        return NextResponse.json({
            message: "Database sanitized successfully",
            totalChecked: medicines.length,
            updated: updatedCount
        });
    } catch (error) {
        console.error("DB FIX ERROR:", error);
        return NextResponse.json(
            { error: "Failed to sanitize database" },
            { status: 500 }
        );
    }
}

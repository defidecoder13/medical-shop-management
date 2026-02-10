
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";

export async function GET() {
    try {
        await connectDB();

        // Find medicines that don't have sellingPricePerStrip
        const needsMigration = await Medicine.find({
            $or: [
                { sellingPricePerStrip: { $exists: false } },
                { sellingPricePerStrip: null }
            ]
        });

        let count = 0;
        for (const med of needsMigration) {
            // The current 'buyingPricePerStrip' was actually used as Selling Price/MRP
            // So we move it to sellingPricePerStrip
            med.sellingPricePerStrip = med.buyingPricePerStrip;

            // We can initialize the NEW buyingPricePerStrip (Cost) to 0 or keep it as is.
            // Let's keep it as is for now so we don't lose the value, 
            // but the user will update it later to the real Cost Price.
            // med.buyingPricePerStrip = med.buyingPricePerStrip; 

            if (!med.rackNumber) med.rackNumber = ""; // Initialize empty rack number

            await med.save();
            count++;
        }

        return NextResponse.json({
            success: true,
            migrated: count,
            message: `Migrated ${count} medicines successfully`
        });

    } catch (error) {
        console.error("Migration Error:", error);
        return NextResponse.json(
            { error: "Migration failed", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

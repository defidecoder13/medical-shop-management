
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";

export async function GET() {
    try {
        await connectDB();

        const needsMigration = await Medicine.find({
            $or: [
                { mrp: { $exists: false } },
                { mrp: null }
            ]
        });

        let count = 0;
        for (const med of needsMigration) {
            med.mrp = med.buyingPrice || 0;
            med.buyingPrice = med.buyingPrice || 0;

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

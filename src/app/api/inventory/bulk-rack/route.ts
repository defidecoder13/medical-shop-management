import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";
import { redis } from "@/src/lib/redis";
import Settings from "@/src/models/Settings";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();

        const { rackNumber, medicineIds } = body;

        if (!rackNumber || typeof rackNumber !== 'string') {
            return NextResponse.json({ error: "Invalid or missing rackNumber." }, { status: 400 });
        }

        if (!Array.isArray(medicineIds) || medicineIds.length === 0) {
            return NextResponse.json({ error: "Invalid payload. Expected an array of medicineIds." }, { status: 400 });
        }

        // Update all batches for the selected medicines
        const result = await MedicineBatch.updateMany(
            { medicineId: { $in: medicineIds } },
            { $set: { rackNumber: rackNumber.trim() } }
        );

        // Invalidate Redis caches to ensure inventory reflects new rack numbers
        if (redis) {
            const keys = await redis.keys("inventory:get:*");
            keys.push("catalog:all");
            await redis.del(...keys);
            await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            await redis.set("catalog:version", Date.now().toString());
        }

        return NextResponse.json({
            success: true,
            updatedBatches: result.modifiedCount,
            message: `Successfully assigned Rack ${rackNumber} to ${result.modifiedCount} batches.`
        });

    } catch (error: any) {
        console.error("BULK RACK ASSIGNMENT ERROR:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process bulk rack assignment" },
            { status: 500 }
        );
    }
}

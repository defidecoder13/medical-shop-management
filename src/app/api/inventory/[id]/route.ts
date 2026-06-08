import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";
import Medicine from "@/src/models/Medicine";
import { redis, deleteCache } from "@/src/lib/redis";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();
        const batch = await MedicineBatch.findById(id).populate('medicineId');

        if (!batch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(batch);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch medicine batch" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();
        const body = await request.json();

        const updatedBatch = await MedicineBatch.findByIdAndUpdate(id, body, { new: true });

        if (!updatedBatch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        await deleteCache("catalog:all");
        await redis.set("catalog:version", Date.now().toString());

        return NextResponse.json(updatedBatch);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update medicine batch" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Batch ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const deletedBatch = await MedicineBatch.findByIdAndDelete(id);

        if (!deletedBatch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        // Clean up parent Medicine if this was the last batch
        if (deletedBatch.medicineId) {
            const remainingBatches = await MedicineBatch.countDocuments({ medicineId: deletedBatch.medicineId });
            if (remainingBatches === 0) {
                await Medicine.findByIdAndDelete(deletedBatch.medicineId);
            }
        }

        if (redis) {
            const keys = await redis.keys("inventory:get:*");
            if (keys.length > 0) await redis.del(...keys);
            await redis.set("catalog:version", Date.now().toString());
        }

        return NextResponse.json(
            { message: "Batch deleted successfully", id },
            { status: 200 }
        );
    } catch (error) {
        console.error("DELETE BATCH ERROR:", error);
        return NextResponse.json(
            { error: "Failed to delete medicine batch" },
            { status: 500 }
        );
    }
}

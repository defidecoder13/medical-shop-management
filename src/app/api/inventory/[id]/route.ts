import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from 'next/cache';
import { connectDB } from "@/src/lib/db";
import MedicineBatch from "@/src/models/MedicineBatch";
import Settings from "@/src/models/Settings";
import Medicine from "@/src/models/Medicine";
import { redis, deleteCache } from "@/src/lib/redis";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();
        const batch: any = await MedicineBatch.findById(id).populate('medicineId').lean();

        if (!batch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        const medObj = batch.medicineId || {};
        const formatted = {
            ...batch,
            _id: String(batch._id),
            medicineId: String(medObj._id || batch.medicineId || ""),
            name: medObj.name || batch.name || "",
            brand: medObj.brand || batch.brand || "",
            tabletsPerStrip: medObj.tabletsPerStrip || batch.tabletsPerStrip || 1,
            composition: medObj.composition || batch.composition || "",
            hsnCode: medObj.hsnCode || batch.hsnCode || "3004",
            gstPercent: medObj.gstPercent || batch.gstPercent || 5,
            category: medObj.category || batch.category || "Tablet",
            pack: batch.pack || medObj.pack || "",
        };

        return NextResponse.json(formatted);
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

        const updatedBatch: any = await MedicineBatch.findByIdAndUpdate(id, body, { new: true }).populate('medicineId').lean();

        if (!updatedBatch) {
            return NextResponse.json(
                { error: "Batch not found" },
                { status: 404 }
            );
        }

        await deleteCache("catalog:all");
        await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
        if (redis) {
            await redis.set("catalog:version", Date.now().toString());
        }

        const medObj = updatedBatch.medicineId || {};
        const formatted = {
            ...updatedBatch,
            _id: String(updatedBatch._id),
            medicineId: String(medObj._id || updatedBatch.medicineId || ""),
            name: medObj.name || updatedBatch.name || "",
            brand: medObj.brand || updatedBatch.brand || "",
            tabletsPerStrip: medObj.tabletsPerStrip || updatedBatch.tabletsPerStrip || 1,
            composition: medObj.composition || updatedBatch.composition || "",
            hsnCode: medObj.hsnCode || updatedBatch.hsnCode || "3004",
            gstPercent: medObj.gstPercent || updatedBatch.gstPercent || 5,
            category: medObj.category || updatedBatch.category || "Tablet",
            pack: updatedBatch.pack || medObj.pack || "",
        };

        return NextResponse.json(formatted);
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
        await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });

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

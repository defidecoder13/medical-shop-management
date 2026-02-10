
import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();
        const medicine = await Medicine.findById(id);

        if (!medicine) {
            return NextResponse.json(
                { error: "Medicine not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(medicine);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch medicine" },
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
                { error: "Medicine ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const deletedMedicine = await Medicine.findByIdAndDelete(id);

        if (!deletedMedicine) {
            return NextResponse.json(
                { error: "Medicine not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Medicine deleted successfully", id },
            { status: 200 }
        );
    } catch (error) {
        console.error("DELETE MEDICINE ERROR:", error);
        return NextResponse.json(
            { error: "Failed to delete medicine" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Patient from "@/src/models/Patient";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        let query = {};
        if (search) {
            // Search by name or phone
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const patients = await Patient.find(query).sort({ updatedAt: -1 }).limit(50);
        return NextResponse.json(patients);
    } catch (error) {
        console.error("FAILED TO FETCH PATIENTS:", error);
        return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();
        
        let patient = await Patient.findOne({ phone: data.phone });
        if (patient) {
            // Update existing
            if (data.name) patient.name = data.name;
            if (data.address) patient.address = data.address;
            if (data.doctorName) patient.doctorName = data.doctorName;
            
            // Handle regular medicines update if passed
            if (data.regularMedicines) {
                patient.regularMedicines = data.regularMedicines;
            }
            
            await patient.save();
        } else {
            // Create new
            patient = await Patient.create(data);
        }

        return NextResponse.json(patient);
    } catch (error) {
        console.error("FAILED TO SAVE PATIENT:", error);
        return NextResponse.json({ error: "Failed to save patient" }, { status: 500 });
    }
}

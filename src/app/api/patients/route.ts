import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Patient from "@/src/models/Patient";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

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

        const queryObj = Patient.find(query).sort({ updatedAt: -1 });

        if (pageParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam || "20");
            
            const totalCount = await Patient.countDocuments(query);
            const totalPages = Math.ceil(totalCount / limit);
            
            queryObj.skip((page - 1) * limit).limit(limit);
            const patients = await queryObj;
            
            return NextResponse.json({
                data: patients,
                pagination: {
                    totalCount,
                    totalPages,
                    currentPage: page,
                    limit
                }
            });
        } else {
            // Legacy backward-compatible response for autocomplete
            queryObj.limit(50);
            const patients = await queryObj;
            return NextResponse.json(patients);
        }
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

export async function PUT(req: Request) {
    try {
        await connectDB();
        const { _id, name, phone, address, doctorName } = await req.json();
        if (!_id) return NextResponse.json({ error: "_id required" }, { status: 400 });
        if (!name?.trim() || !phone?.trim()) return NextResponse.json({ error: "Name and phone required" }, { status: 400 });

        const patient = await Patient.findById(_id);
        if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

        // Phone uniqueness check if changed
        const cleanPhone = String(phone).trim();
        if (cleanPhone !== patient.phone) {
            const existing = await Patient.findOne({ phone: cleanPhone });
            if (existing) return NextResponse.json({ error: "Phone number already exists for another patient" }, { status: 409 });
            patient.phone = cleanPhone;
        }
        patient.name = String(name).trim();
        patient.address = address !== undefined ? String(address).trim() : patient.address;
        if (doctorName !== undefined) patient.doctorName = String(doctorName).trim();

        await patient.save();
        return NextResponse.json(patient);
    } catch (error: any) {
        console.error("FAILED TO UPDATE PATIENT:", error);
        if (error.code === 11000) return NextResponse.json({ error: "Phone number already exists" }, { status: 409 });
        return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const body = await req.json().catch(() => ({}));
        const targetId = id || body._id || body.id;
        if (!targetId) return NextResponse.json({ error: "Patient id required" }, { status: 400 });
        const deleted = await Patient.findByIdAndDelete(targetId);
        if (!deleted) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("FAILED TO DELETE PATIENT:", error);
        return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 });
    }
}

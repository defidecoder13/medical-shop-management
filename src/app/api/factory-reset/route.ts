import { NextResponse } from "next/server";
import Settings from "@/src/models/Settings";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";
import Patient from "@/src/models/Patient";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";
import SupplierReturn from "@/src/models/SupplierReturn";
import Supplier from "@/src/models/Supplier";
import { deleteCache, setCache } from "@/src/lib/redis";


export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectDB();

    // 1. Delete all transactional data
    await Bill.deleteMany({});
    await PurchaseInvoice.deleteMany({});
    await SupplierReturn.deleteMany({});

    
    // 2. Delete all entities
    await Patient.deleteMany({});
    await Supplier.deleteMany({});
    
    // 3. Delete all inventory
    await Medicine.deleteMany({});
    await MedicineBatch.deleteMany({});

    await deleteCache("catalog:all");
    await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            await setCache("catalog:version", Date.now().toString(), 604800);

    return NextResponse.json({ 
        message: "Factory Reset Successful! All transactional, inventory, and entity data has been permanently deleted.",
        success: true
    });
  } catch (error: any) {
    console.error("Factory reset failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

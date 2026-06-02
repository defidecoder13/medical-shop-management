import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Bill from "@/src/models/Bill";
import Medicine from "@/src/models/Medicine";
import MedicineBatch from "@/src/models/MedicineBatch";
import Patient from "@/src/models/Patient";
import PurchaseInvoice from "@/src/models/PurchaseInvoice";
import SupplierReturn from "@/src/models/SupplierReturn";
import Supplier from "@/src/models/Supplier";
import JournalEntry from "@/src/models/JournalEntry";
import Account from "@/src/models/Account";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await connectDB();

    // 1. Delete all transactional data
    await Bill.deleteMany({});
    await PurchaseInvoice.deleteMany({});
    await SupplierReturn.deleteMany({});
    await JournalEntry.deleteMany({});
    
    // 2. Delete all entities
    await Patient.deleteMany({});
    await Supplier.deleteMany({});
    
    // 3. Delete all inventory
    await Medicine.deleteMany({});
    await MedicineBatch.deleteMany({});

    // 4. Reset all accounting ledgers to 0 balance (don't delete the accounts themselves)
    await Account.updateMany({}, { balance: 0 });

    return NextResponse.json({ 
        message: "Factory Reset Successful! All transactional, inventory, and entity data has been permanently deleted. Ledgers have been reset to 0.",
        success: true
    });
  } catch (error: any) {
    console.error("Factory reset failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

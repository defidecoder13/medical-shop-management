import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import Medicine from "@/src/models/Medicine";
import User from "@/src/models/User";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const SEED_DATA = [
    {
        name: "Dolo 650",
        brand: "Micro Labs",
        composition: "Paracetamol 650mg",
        batchNumber: "BATCH001",
        expiryDate: "2025-12-31",
        stock: 50,
        tabletsPerStrip: 15,
        buyingPricePerStrip: 25.00,
        sellingPricePerStrip: 33.50, // MRP
        rackNumber: "A1",
        gstPercent: 12
    },
    {
        name: "Augmentin 625 Duo",
        brand: "GSK",
        composition: "Amoxicillin 500mg + Clavulanic Acid 125mg",
        batchNumber: "BATCH002",
        expiryDate: "2025-10-15",
        stock: 20,
        tabletsPerStrip: 10,
        buyingPricePerStrip: 180.00,
        sellingPricePerStrip: 223.50,
        rackNumber: "B3",
        gstPercent: 12
    },
    {
        name: "Pan 40",
        brand: "Alkem",
        composition: "Pantoprazole 40mg",
        batchNumber: "BATCH003",
        expiryDate: "2026-05-20",
        stock: 100,
        tabletsPerStrip: 15,
        buyingPricePerStrip: 130.00,
        sellingPricePerStrip: 168.00,
        rackNumber: "A2",
        gstPercent: 12
    },
    {
        name: "Montair LC",
        brand: "Cipla",
        composition: "Montelukast 10mg + Levocetirizine 5mg",
        batchNumber: "BATCH004",
        expiryDate: "2025-08-30",
        stock: 30,
        tabletsPerStrip: 10,
        buyingPricePerStrip: 190.00,
        sellingPricePerStrip: 245.00,
        rackNumber: "C1",
        gstPercent: 12
    },
    {
        name: "Ascoril LS Syrup",
        brand: "Glenmark",
        composition: "Levosalbutamol + Ambroxol + Guaiphenesin",
        batchNumber: "BATCH005",
        expiryDate: "2025-06-01",
        stock: 15,
        tabletsPerStrip: 1, // Synergy with "unit" but here logic is strips. For syrups, 1 strip = 1 bottle usually in this strict model or we treat stock as units.
        buyingPricePerStrip: 95.00, // Cost per bottle
        sellingPricePerStrip: 118.00, // MRP per bottle
        rackNumber: "S1", // S for Syrup rack
        gstPercent: 12
    },
    {
        name: "Shelcal 500",
        brand: "Torrent",
        composition: "Calcium 500mg + Vitamin D3",
        batchNumber: "BATCH006",
        expiryDate: "2026-03-10",
        stock: 40,
        tabletsPerStrip: 15,
        buyingPricePerStrip: 110.00,
        sellingPricePerStrip: 144.00,
        rackNumber: "V1", // V for Vitamin
        gstPercent: 12
    },
    {
        name: "Azithral 500",
        brand: "Alembic",
        composition: "Azithromycin 500mg",
        batchNumber: "BATCH007",
        expiryDate: "2025-09-25",
        stock: 25,
        tabletsPerStrip: 5,
        buyingPricePerStrip: 100.00,
        sellingPricePerStrip: 132.00,
        rackNumber: "B2",
        gstPercent: 12
    },
    {
        name: "Combiflam",
        brand: "Sanofi",
        composition: "Ibuprofen 400mg + Paracetamol 325mg",
        batchNumber: "BATCH008",
        expiryDate: "2025-11-15",
        stock: 60,
        tabletsPerStrip: 20,
        buyingPricePerStrip: 35.00,
        sellingPricePerStrip: 48.00,
        rackNumber: "A3",
        gstPercent: 12
    },
    {
        name: "Telma 40",
        brand: "Glenmark",
        composition: "Telmisartan 40mg",
        batchNumber: "BATCH009",
        expiryDate: "2026-01-20",
        stock: 45,
        tabletsPerStrip: 15,
        buyingPricePerStrip: 105.00,
        sellingPricePerStrip: 136.00,
        rackNumber: "H1", // Heart meds
        gstPercent: 12
    },
    {
        name: "Allegra 120",
        brand: "Sanofi",
        composition: "Fexofenadine 120mg",
        batchNumber: "BATCH010",
        expiryDate: "2025-12-05",
        stock: 35,
        tabletsPerStrip: 10,
        buyingPricePerStrip: 160.00,
        sellingPricePerStrip: 218.00,
        rackNumber: "A4",
        gstPercent: 12
    },
    {
        name: "Sinarest",
        brand: "Centaur",
        composition: "Paracetamol + Phenylephrine + Chlorpheniramine",
        batchNumber: "BATCH011",
        expiryDate: "2025-10-30",
        stock: 55,
        tabletsPerStrip: 10,
        buyingPricePerStrip: 45.00,
        sellingPricePerStrip: 62.00,
        rackNumber: "A2",
        gstPercent: 12
    },
    {
        name: "Volini Gel",
        brand: "Sun Pharma",
        composition: "Diclofenac Diethylamine",
        batchNumber: "BATCH012",
        expiryDate: "2025-07-15",
        stock: 20,
        tabletsPerStrip: 1, // Tube
        buyingPricePerStrip: 120.00,
        sellingPricePerStrip: 155.00,
        rackNumber: "O1", // Ointments
        gstPercent: 12
    },
    {
        name: "Neurobion Forte",
        brand: "P&G",
        composition: "Vitamin B Complex",
        batchNumber: "BATCH013",
        expiryDate: "2026-02-28",
        stock: 80,
        tabletsPerStrip: 30,
        buyingPricePerStrip: 32.00,
        sellingPricePerStrip: 42.00,
        rackNumber: "V2",
        gstPercent: 12
    },
    {
        name: "Thyronorm 50",
        brand: "Abbott",
        composition: "Thyroxine Sodium 50mcg",
        batchNumber: "BATCH014",
        expiryDate: "2025-11-20",
        stock: 30,
        tabletsPerStrip: 100, // Bottle of 100
        buyingPricePerStrip: 180.00,
        sellingPricePerStrip: 230.00,
        rackNumber: "T1",
        gstPercent: 12
    },
    {
        name: "Betadine Ointment",
        brand: "Win-Medicare",
        composition: "Povidone Iodine 5%",
        batchNumber: "BATCH015",
        expiryDate: "2025-06-30",
        stock: 25,
        tabletsPerStrip: 1,
        buyingPricePerStrip: 90.00,
        sellingPricePerStrip: 115.00,
        rackNumber: "O2",
        gstPercent: 12
    },
    {
        name: "Becosules Z",
        brand: "Pfizer",
        composition: "B Complex + Vitamin C + Zinc",
        batchNumber: "BATCH016",
        expiryDate: "2026-04-15",
        stock: 65,
        tabletsPerStrip: 20,
        buyingPricePerStrip: 40.00,
        sellingPricePerStrip: 55.00,
        rackNumber: "V1",
        gstPercent: 12
    },
    {
        name: "Metrogyl 400",
        brand: "J.B. Chemicals",
        composition: "Metronidazole 400mg",
        batchNumber: "BATCH017",
        expiryDate: "2025-12-10",
        stock: 40,
        tabletsPerStrip: 15,
        buyingPricePerStrip: 18.00,
        sellingPricePerStrip: 25.00,
        rackNumber: "B4",
        gstPercent: 12
    },
    {
        name: "Cheston Cold",
        brand: "Cipla",
        composition: "Cetirizine + Paracetamol + Phenylephrine",
        batchNumber: "BATCH018",
        expiryDate: "2025-09-05",
        stock: 50,
        tabletsPerStrip: 10,
        buyingPricePerStrip: 42.00,
        sellingPricePerStrip: 58.00,
        rackNumber: "A2",
        gstPercent: 12
    },
    {
        name: "Gelusil MPS",
        brand: "Pfizer",
        composition: "Antacid + Antigas",
        batchNumber: "BATCH019",
        expiryDate: "2026-08-01",
        stock: 30,
        tabletsPerStrip: 10, // Or bottle, let's assume chewable tabs strip
        buyingPricePerStrip: 20.00,
        sellingPricePerStrip: 28.00,
        rackNumber: "G1", // Gastric
        gstPercent: 12
    },
    {
        name: "Aciloc 150",
        brand: "Cadila",
        composition: "Ranitidine 150mg",
        batchNumber: "BATCH020",
        expiryDate: "2025-10-25",
        stock: 60,
        tabletsPerStrip: 30,
        buyingPricePerStrip: 35.00,
        sellingPricePerStrip: 48.00,
        rackNumber: "G2",
        gstPercent: 12
    }
];

export async function GET(req: Request) {
    try {
        await connectDB();

        // Clear existing data
        await Medicine.deleteMany({});

        let createdCount = 0;

        for (const med of SEED_DATA) {
            // Check duplicate
            const existing = await Medicine.findOne({
                name: { $regex: `^${med.name}$`, $options: "i" },
                batchNumber: { $regex: `^${med.batchNumber}$`, $options: "i" }
            });

            if (!existing) {
                await Medicine.create({
                    ...med,
                    totalTabletsInStock: med.stock * med.tabletsPerStrip
                });
                createdCount++;
            }
        }

        // Seed Admin User
        const adminEmail = "medsaathi@admin.com";
        const adminPassword = "himadri@26";

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await User.create({
                email: adminEmail,
                password: hashedPassword
            });
            console.log("Admin user created.");
        }

        return NextResponse.json({
            success: true,
            message: `Seeding complete. Added ${createdCount} new medicines and verified admin user.`
        });
    } catch (error) {
        console.error("SEED API ERROR:", error);
        return NextResponse.json(
            { error: "Failed to seed data" },
            { status: 500 }
        );
    }
}

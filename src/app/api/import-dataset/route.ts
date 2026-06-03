import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import GlobalMedicine from "@/src/models/GlobalMedicine";
import * as xlsx from "xlsx";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        await connectDB();

        // Path to the dataset file
        const filePath = path.join(process.cwd(), "dataset.csv");
        
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: "Could not find dataset.csv in the root folder of your project. Please rename your Kaggle CSV to dataset.csv and place it inside the medishop-admin folder." },
                { status: 400 }
            );
        }

        // Read the CSV file using xlsx
        const fileBuffer = fs.readFileSync(filePath);
        const wb = xlsx.read(fileBuffer, { type: "buffer" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to JSON
        const rawData = xlsx.utils.sheet_to_json(ws);
        
        if (rawData.length === 0) {
            return NextResponse.json({ error: "The CSV file is empty." }, { status: 400 });
        }

        // Map the columns from Kaggle to our schema
        const formattedData = rawData.map((row: any) => {
            const name = row["brand_name"] || row["name"] || row["Name"] || "Unknown";
            
            let composition = row["salt_composition"] || row["composition"] || row["Composition"];
            if (!composition) {
                const comp1 = row["short_composition1"] ? String(row["short_composition1"]).trim() : "";
                const comp2 = row["short_composition2"] ? String(row["short_composition2"]).trim() : "";
                if (comp1 && comp2) {
                    composition = `${comp1} + ${comp2}`;
                } else if (comp1) {
                    composition = comp1;
                } else {
                    composition = "Unknown";
                }
            }
            
            return {
                name: String(name).trim(),
                brand: row["manufacturer_name"] || "Kaggle Dataset",
                composition: String(composition).trim()
            };
        }).filter(item => item.name !== "Unknown");

        // Clear existing dataset
        await GlobalMedicine.deleteMany({});
        
        // Insert in batches of 5000 to prevent memory issues with 200k+ rows
        const batchSize = 5000;
        let insertedCount = 0;
        
        for (let i = 0; i < formattedData.length; i += batchSize) {
            const batch = formattedData.slice(i, i + batchSize);
            await GlobalMedicine.insertMany(batch);
            insertedCount += batch.length;
            console.log(`Inserted ${insertedCount} of ${formattedData.length}...`);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully imported ${insertedCount} medicines from your dataset!` 
        });

    } catch (error: any) {
        console.error("DATASET IMPORT ERROR:", error);
        return NextResponse.json(
            { error: "Failed to import dataset: " + error.message },
            { status: 500 }
        );
    }
}

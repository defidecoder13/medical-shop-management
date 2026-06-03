import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        const PDFParser = require("pdf2json");
        const pdfParser = new PDFParser(null, 1); // 1 = extract raw text
        
        return new Promise<Response>((resolve) => {
            pdfParser.on("pdfParser_dataError", (errData: any) => {
                console.error("PDF Parsing Error:", errData.parserError);
                resolve(NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 }));
            });
            
            pdfParser.on("pdfParser_dataReady", async () => {
                const text = pdfParser.getRawTextContent();
                const lines = text.split('\n');
                const items = [];

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx];
            const dateMatch = line.match(/\b(\d{2}[-/]\d{2,4})\b/);
            if (!dateMatch) continue;
            
            const parts = line.trim().split(/\s+/);
            const dateIndex = parts.findIndex((p: string) => p.includes(dateMatch[1]));
            if (dateIndex < 3) continue;

            const batch = parts[dateIndex - 1];
            let qty = parts[dateIndex - 2];
            if (isNaN(Number(qty))) qty = "0";

            const mrp = parts[dateIndex + 1] || "0";
            const buyingPrice = parts[dateIndex + 2] || "0";
            
            let nameParts = [];
            for (let i = 2; i <= dateIndex - 3; i++) {
                nameParts.push(parts[i]);
            }
            
            const fullName = nameParts.join(' ');
            let packStr = "";
            const packMatch = fullName.match(/\d+\s*[A-Z']+\d*$/i);
            if (packMatch) packStr = packMatch[0];
            
            let rawName = fullName.replace(/\d+\s*[A-Z']+\d*$/i, '').trim();
            if (!rawName) rawName = fullName.trim();

            items.push({
                "Medicine Name": rawName.trim(),
                "Pack": packStr.trim(),
                "Batch Number": batch,
                "Expiry Date": dateMatch[1],
                "Billed Qty": qty,
                "MRP": mrp,
                "Buying Price": buyingPrice
            });
        }

        if (items.length === 0) {
            resolve(NextResponse.json({ 
                error: "Could not auto-detect items in this PDF format. Please use Excel or check the file.",
                rawText: text.substring(0, 500) 
            }, { status: 422 }));
            return;
        }

        // Removed GlobalMedicine composition lookup
        for (let i = 0; i < items.length; i++) {
            (items[i] as any)["Composition"] = "";
        }

        const headers = ["Medicine Name", "Pack", "Batch Number", "Expiry Date", "Billed Qty", "MRP", "Buying Price", "Composition"];
        
        resolve(NextResponse.json({
            headers,
            rows: items
        }));
        });
        
        pdfParser.parseBuffer(buffer);
        });

    } catch (error: any) {
        console.error("PDF Parsing Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to parse PDF" },
            { status: 500 }
        );
    }
}

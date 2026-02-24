import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import GlobalMedicine from "@/src/models/GlobalMedicine";

export const dynamic = "force-dynamic";

const seedData = [
    { name: "Dolo 650", brand: "Micro Labs", composition: "Paracetamol 650mg" },
    { name: "Calpol 500", brand: "GSK", composition: "Paracetamol 500mg" },
    { name: "Crocin Advance", brand: "GSK", composition: "Paracetamol 500mg" },
    { name: "Azithral 500", brand: "Alembic", composition: "Azithromycin 500mg" },
    { name: "Azee 500", brand: "Cipla", composition: "Azithromycin 500mg" },
    { name: "Augmentin 625 Duo", brand: "GSK", composition: "Amoxicillin 500mg + Clavulanic Acid 125mg" },
    { name: "Moxikind-CV 625", brand: "Mankind", composition: "Amoxicillin 500mg + Clavulanic Acid 125mg" },
    { name: "Pantocid 40", brand: "Sun Pharma", composition: "Pantoprazole 40mg" },
    { name: "Pan 40", brand: "Alkem", composition: "Pantoprazole 40mg" },
    { name: "Omez 20", brand: "Dr. Reddy's", composition: "Omeprazole 20mg" },
    { name: "Aciloc 150", brand: "Cadila", composition: "Ranitidine 150mg" },
    { name: "Zinetac 150", brand: "GSK", composition: "Ranitidine 150mg" },
    { name: "Allegra 120", brand: "Sanofi", composition: "Fexofenadine 120mg" },
    { name: "Montair LC", brand: "Cipla", composition: "Montelukast 10mg + Levocetirizine 5mg" },
    { name: "Okacet", brand: "Cipla", composition: "Cetirizine 10mg" },
    { name: "Cheston Cold", brand: "Cipla", composition: "Cetirizine 5mg + Paracetamol 325mg + Phenylephrine 10mg" },
    { name: "Sinarest", brand: "Centaur", composition: "Chlorpheniramine 2mg + Paracetamol 500mg + Phenylephrine 10mg" },
    { name: "Combiflam", brand: "Sanofi", composition: "Ibuprofen 400mg + Paracetamol 325mg" },
    { name: "Flexon", brand: "Aristo", composition: "Ibuprofen 400mg + Paracetamol 325mg" },
    { name: "Voveran SR 100", brand: "Novartis", composition: "Diclofenac 100mg" },
    { name: "Zerodol-SP", brand: "Ipca", composition: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg" },
    { name: "Aldigesic-P", brand: "Alkem", composition: "Aceclofenac 100mg + Paracetamol 325mg" },
    { name: "Ecosprin 75", brand: "USV", composition: "Aspirin 75mg" },
    { name: "Clopilet 75", brand: "Sun Pharma", composition: "Clopidogrel 75mg" },
    { name: "Atorva 10", brand: "Zydus", composition: "Atorvastatin 10mg" },
    { name: "Storvas 10", brand: "Sun Pharma", composition: "Atorvastatin 10mg" },
    { name: "Rosuvas 10", brand: "Sun Pharma", composition: "Rosuvastatin 10mg" },
    { name: "Telma 40", brand: "Glenmark", composition: "Telmisartan 40mg" },
    { name: "Telmikind 40", brand: "Mankind", composition: "Telmisartan 40mg" },
    { name: "Amlokind-AT", brand: "Mankind", composition: "Amlodipine 5mg + Atenolol 50mg" },
    { name: "Glycomet 500 SR", brand: "USV", composition: "Metformin 500mg" },
    { name: "Zoryl-M 2", brand: "Intas", composition: "Glimepiride 2mg + Metformin 500mg" },
    { name: "Glimepiride 1", brand: "Various", composition: "Glimepiride 1mg" },
    { name: "Thyronorm 50", brand: "Abbott", composition: "Thyroxine 50mcg" },
    { name: "Shelcal 500", brand: "Torrent", composition: "Calcium Carbonate 500mg + Vitamin D3 250 IU" },
    { name: "Supradyn", brand: "Bayer", composition: "Multivitamins + Minerals" },
    { name: "Zincovit", brand: "Apex", composition: "Multivitamins + Multiminerals" },
    { name: "Becosules", brand: "Pfizer", composition: "Vitamin B Complex + Vitamin C" },
    { name: "Folvite 5", brand: "Pfizer", composition: "Folic Acid 5mg" },
    { name: "Sporlac DS", brand: "Sanzyme", composition: "Lactic Acid Bacillus" },
    { name: "Enterogermina", brand: "Sanofi", composition: "Bacillus clausii" },
    { name: "Eldoper", brand: "Micro Labs", composition: "Loperamide 2mg" },
    { name: "O2", brand: "Medley", composition: "Ofloxacin 200mg + Ornidazole 500mg" },
    { name: "Zenflox-OZ", brand: "Mankind", composition: "Ofloxacin 200mg + Ornidazole 500mg" },
    { name: "Cifran 500", brand: "Sun Pharma", composition: "Ciprofloxacin 500mg" },
    { name: "Betadine Ointment", brand: "Win-Medicare", composition: "Povidone Iodine 5%" },
    { name: "Soframycin", brand: "Sanofi", composition: "Framycetin Sulfate 1%" },
    { name: "Candid-B", brand: "Glenmark", composition: "Clotrimazole 1% + Beclomethasone 0.025%" },
    { name: "Quadriderm RF", brand: "MSD", composition: "Beclomethasone + Neomycin + Clotrimazole" },
    { name: "Volini Gel", brand: "Sun Pharma", composition: "Diclofenac Diethylamine + Linseed Oil + Menthol + Methyl Salicylate" }
];

export async function GET(req: Request) {
    try {
        await connectDB();

        // Check if seeding is needed
        const count = await GlobalMedicine.countDocuments();
        if (count === 0) {
            console.log("Seeding GlobalMedicines...");
            await GlobalMedicine.insertMany(seedData);
        }

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";

        if (!q || q.length < 2) {
            return NextResponse.json([]); // Don't return all, wait for 2+ chars
        }

        // Exact prefix match is usually better for autocomplete than full text search
        // But we'll support both for flexibility
        const query = {
            $or: [
                { name: { $regex: `^${q}`, $options: "i" } },
                { brand: { $regex: q, $options: "i" } },
                { composition: { $regex: q, $options: "i" } }
            ]
        };

        const suggestions = await GlobalMedicine.find(query).limit(10).lean();

        // Deduplicate if any exact name matches exist (just in case)
        const uniqueSuggestions = Array.from(new Map(suggestions.map(item => [item.name.toLowerCase(), item])).values());


        return NextResponse.json(uniqueSuggestions);
    } catch (error) {
        console.error("GLOBAL MEDICINE GET ERROR:", error);
        return NextResponse.json(
            { error: "Failed to fetch suggestions" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import GlobalMedicine from "@/src/models/GlobalMedicine";

export const dynamic = "force-dynamic";

const seedData = [
    // --- PAINKILLERS / NSAIDs ---
    { name: "Dolo 650", brand: "Micro Labs", composition: "Paracetamol 650mg" },
    { name: "Calpol 500", brand: "GSK", composition: "Paracetamol 500mg" },
    { name: "Crocin Advance", brand: "GSK", composition: "Paracetamol 500mg" },
    { name: "Combiflam", brand: "Sanofi", composition: "Ibuprofen 400mg + Paracetamol 325mg" },
    { name: "Flexon", brand: "Aristo", composition: "Ibuprofen 400mg + Paracetamol 325mg" },
    { name: "Voveran SR 100", brand: "Novartis", composition: "Diclofenac 100mg" },
    { name: "Zerodol-SP", brand: "Ipca", composition: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg" },
    { name: "Zerodol-P", brand: "Ipca", composition: "Aceclofenac 100mg + Paracetamol 325mg" },
    { name: "Aldigesic-P", brand: "Alkem", composition: "Aceclofenac 100mg + Paracetamol 325mg" },
    { name: "Etoricoxib 90", brand: "Various", composition: "Etoricoxib 90mg" },
    { name: "Nimesulide 100", brand: "Various", composition: "Nimesulide 100mg" },
    { name: "Meftal-Spas", brand: "Blue Cross", composition: "Mefenamic Acid 250mg + Dicyclomine 10mg" },
    { name: "Cyclopam", brand: "Indoco", composition: "Dicyclomine 20mg + Paracetamol 500mg" },
    { name: "Ultracet", brand: "Janssen", composition: "Tramadol 37.5mg + Paracetamol 325mg" },
    { name: "Ketorol DT", brand: "Dr. Reddy's", composition: "Ketorolac 10mg" },

    // --- ANTIBIOTICS ---
    { name: "Azithral 500", brand: "Alembic", composition: "Azithromycin 500mg" },
    { name: "Azee 500", brand: "Cipla", composition: "Azithromycin 500mg" },
    { name: "Augmentin 625 Duo", brand: "GSK", composition: "Amoxicillin 500mg + Clavulanic Acid 125mg" },
    { name: "Moxikind-CV 625", brand: "Mankind", composition: "Amoxicillin 500mg + Clavulanic Acid 125mg" },
    { name: "Clavam 625", brand: "Alkem", composition: "Amoxicillin 500mg + Clavulanic Acid 125mg" },
    { name: "Taxim-O 200", brand: "Alkem", composition: "Cefixime 200mg" },
    { name: "Zifi 200", brand: "FDC", composition: "Cefixime 200mg" },
    { name: "Mahacef 200", brand: "Mankind", composition: "Cefixime 200mg" },
    { name: "Monocef-O 200", brand: "Aristo", composition: "Cefpodoxime 200mg" },
    { name: "Gudcef 200", brand: "Mankind", composition: "Cefpodoxime 200mg" },
    { name: "Cifran 500", brand: "Sun Pharma", composition: "Ciprofloxacin 500mg" },
    { name: "Ciplox 500", brand: "Cipla", composition: "Ciprofloxacin 500mg" },
    { name: "O2", brand: "Medley", composition: "Ofloxacin 200mg + Ornidazole 500mg" },
    { name: "Zenflox-OZ", brand: "Mankind", composition: "Ofloxacin 200mg + Ornidazole 500mg" },
    { name: "Levomac 500", brand: "Macleods", composition: "Levofloxacin 500mg" },
    { name: "Lariago", brand: "Ipca", composition: "Chloroquine 250mg" },

    // --- ANTACIDS & GASTRO ---
    { name: "Pantocid 40", brand: "Sun Pharma", composition: "Pantoprazole 40mg" },
    { name: "Pan 40", brand: "Alkem", composition: "Pantoprazole 40mg" },
    { name: "Pantosec 40", brand: "Cipla", composition: "Pantoprazole 40mg" },
    { name: "Pan-D", brand: "Alkem", composition: "Pantoprazole 40mg + Domperidone 30mg" },
    { name: "Omez 20", brand: "Dr. Reddy's", composition: "Omeprazole 20mg" },
    { name: "Omee", brand: "Alkem", composition: "Omeprazole 20mg" },
    { name: "Rabemac 20", brand: "Macleods", composition: "Rabeprazole 20mg" },
    { name: "Rablet-D", brand: "Lupin", composition: "Rabeprazole 20mg + Domperidone 30mg" },
    { name: "Aciloc 150", brand: "Cadila", composition: "Ranitidine 150mg" },
    { name: "Zinetac 150", brand: "GSK", composition: "Ranitidine 150mg" },
    { name: "Digene Tablet", brand: "Abbott", composition: "Dried Aluminium Hydroxide + Magnesium Aluminium Silicate + Simethicone" },
    { name: "Gelusil MPS", brand: "Pfizer", composition: "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone" },
    { name: "Eldoper", brand: "Micro Labs", composition: "Loperamide 2mg" },
    { name: "Lomotil", brand: "RPG Life", composition: "Diphenoxylate 2.5mg + Atropine 0.025mg" },
    { name: "Enterogermina", brand: "Sanofi", composition: "Bacillus clausii" },
    { name: "Sporlac DS", brand: "Sanzyme", composition: "Lactic Acid Bacillus" },
    { name: "Ondem 4", brand: "Alkem", composition: "Ondansetron 4mg" },
    { name: "Vomikind 4", brand: "Mankind", composition: "Ondansetron 4mg" },
    { name: "Cremaffin", brand: "Abbott", composition: "Liquid Paraffin + Milk of Magnesia" },
    { name: "Dulcolax", brand: "Sanofi", composition: "Bisacodyl 5mg" },

    // --- COLD & ALLERGY ---
    { name: "Allegra 120", brand: "Sanofi", composition: "Fexofenadine 120mg" },
    { name: "Montair LC", brand: "Cipla", composition: "Montelukast 10mg + Levocetirizine 5mg" },
    { name: "Telekast-L", brand: "Lupin", composition: "Montelukast 10mg + Levocetirizine 5mg" },
    { name: "Okacet", brand: "Cipla", composition: "Cetirizine 10mg" },
    { name: "Cetzine", brand: "Dr. Reddy's", composition: "Cetirizine 10mg" },
    { name: "Levocet 5", brand: "Hetero", composition: "Levocetirizine 5mg" },
    { name: "Cheston Cold", brand: "Cipla", composition: "Cetirizine 5mg + Paracetamol 325mg + Phenylephrine 10mg" },
    { name: "Sinarest", brand: "Centaur", composition: "Chlorpheniramine 2mg + Paracetamol 500mg + Phenylephrine 10mg" },
    { name: "Solvin Cold", brand: "Ipca", composition: "Paracetamol 500mg + Phenylephrine 10mg + Chlorpheniramine 2mg" },
    { name: "Maxtra", brand: "Zuventus", composition: "Phenylephrine + Chlorpheniramine" },
    { name: "Ascoril LS", brand: "Glenmark", composition: "Ambroxol + Levosalbutamol + Guaiphenesin" },
    { name: "Grilinctus", brand: "Franco-Indian", composition: "Dextromethorphan + Chlorpheniramine + Guaifenesin + Ammonium Chloride" },
    { name: "Benadryl", brand: "Johnson & Johnson", composition: "Diphenhydramine + Ammonium Chloride + Sodium Citrate" },
    { name: "Corex DX", brand: "Pfizer", composition: "Chlorpheniramine + Dextromethorphan" },

    // --- CARDIAC & BP ---
    { name: "Ecosprin 75", brand: "USV", composition: "Aspirin 75mg" },
    { name: "Ecosprin 150", brand: "USV", composition: "Aspirin 150mg" },
    { name: "Clopilet 75", brand: "Sun Pharma", composition: "Clopidogrel 75mg" },
    { name: "Deplatt 75", brand: "Torrent", composition: "Clopidogrel 75mg" },
    { name: "Atorva 10", brand: "Zydus", composition: "Atorvastatin 10mg" },
    { name: "Atorva 20", brand: "Zydus", composition: "Atorvastatin 20mg" },
    { name: "Storvas 10", brand: "Sun Pharma", composition: "Atorvastatin 10mg" },
    { name: "Rosuvas 10", brand: "Sun Pharma", composition: "Rosuvastatin 10mg" },
    { name: "Rozavel 10", brand: "Sun Pharma", composition: "Rosuvastatin 10mg" },
    { name: "Telma 40", brand: "Glenmark", composition: "Telmisartan 40mg" },
    { name: "Telmikind 40", brand: "Mankind", composition: "Telmisartan 40mg" },
    { name: "Tazloc 40", brand: "USV", composition: "Telmisartan 40mg" },
    { name: "Telma H", brand: "Glenmark", composition: "Telmisartan 40mg + Hydrochlorothiazide 12.5mg" },
    { name: "Amlokind-AT", brand: "Mankind", composition: "Amlodipine 5mg + Atenolol 50mg" },
    { name: "Stamlo 5", brand: "Dr. Reddy's", composition: "Amlodipine 5mg" },
    { name: "Amlong 5", brand: "Micro Labs", composition: "Amlodipine 5mg" },
    { name: "Cilacar 10", brand: "J.B. Chemicals", composition: "Cilnidipine 10mg" },
    { name: "Concor 5", brand: "Merck", composition: "Bisoprolol 5mg" },

    // --- DIABETES ---
    { name: "Glycomet 500 SR", brand: "USV", composition: "Metformin 500mg" },
    { name: "Glycomet 1000 SR", brand: "USV", composition: "Metformin 1000mg" },
    { name: "Zoryl-M 2", brand: "Intas", composition: "Glimepiride 2mg + Metformin 500mg" },
    { name: "Amaryl 1", brand: "Sanofi", composition: "Glimepiride 1mg" },
    { name: "Amaryl 2", brand: "Sanofi", composition: "Glimepiride 2mg" },
    { name: "Glimestar M2", brand: "Mankind", composition: "Glimepiride 2mg + Metformin 500mg" },
    { name: "Teneligliptin 20", brand: "Various", composition: "Teneligliptin 20mg" },
    { name: "Janumet 50/500", brand: "MSD", composition: "Sitagliptin 50mg + Metformin 500mg" },
    { name: "Jalra-M 50/500", brand: "USV", composition: "Vildagliptin 50mg + Metformin 500mg" },
    { name: "Galvus Met 50/500", brand: "Novartis", composition: "Vildagliptin 50mg + Metformin 500mg" },
    { name: "Istamet 50/500", brand: "Sun Pharma", composition: "Sitagliptin 50mg + Metformin 500mg" },
    { name: "Dapagliflozin 10", brand: "Various", composition: "Dapagliflozin 10mg" },

    // --- THYROID ---
    { name: "Thyronorm 25", brand: "Abbott", composition: "Thyroxine 25mcg" },
    { name: "Thyronorm 50", brand: "Abbott", composition: "Thyroxine 50mcg" },
    { name: "Thyronorm 100", brand: "Abbott", composition: "Thyroxine 100mcg" },
    { name: "Eltroxin 50", brand: "GSK", composition: "Levothyroxine 50mcg" },

    // --- VITAMINS & SUPPLEMENTS ---
    { name: "Shelcal 500", brand: "Torrent", composition: "Calcium Carbonate 500mg + Vitamin D3 250 IU" },
    { name: "Shelcal HD", brand: "Torrent", composition: "Calcium 500mg + Vitamin D3 500 IU" },
    { name: "Supradyn", brand: "Bayer", composition: "Multivitamins + Minerals" },
    { name: "Zincovit", brand: "Apex", composition: "Multivitamins + Multiminerals" },
    { name: "Becosules", brand: "Pfizer", composition: "Vitamin B Complex + Vitamin C" },
    { name: "Becosules Z", brand: "Pfizer", composition: "Vitamin B Complex + Vitamin C + Zinc" },
    { name: "Folvite 5", brand: "Pfizer", composition: "Folic Acid 5mg" },
    { name: "Autrin", brand: "Pfizer", composition: "Iron + Folic Acid + Vitamin B12" },
    { name: "Dexorange", brand: "Franco-Indian", composition: "Iron + Folic Acid + Vitamin B12" },
    { name: "Neurobion Forte", brand: "Merck", composition: "Vitamin B1 + B6 + B12" },
    { name: "Evion 400", brand: "Merck", composition: "Vitamin E 400mg" },
    { name: "Uprise-D3 60K", brand: "Alkem", composition: "Cholecalciferol 60000 IU" },
    { name: "Calcirol Sachet", brand: "Cadila", composition: "Cholecalciferol 60000 IU" },
    { name: "Ostocalcium", brand: "GSK", composition: "Calcium + Vitamin D3" },
    { name: "Revital H", brand: "Sun Pharma", composition: "Ginseng + Multivitamins + Minerals" },

    // --- DERMA & TOPICALS ---
    { name: "Betadine Ointment", brand: "Win-Medicare", composition: "Povidone Iodine 5%" },
    { name: "Soframycin", brand: "Sanofi", composition: "Framycetin Sulfate 1%" },
    { name: "Candid-B", brand: "Glenmark", composition: "Clotrimazole 1% + Beclomethasone 0.025%" },
    { name: "Quadriderm RF", brand: "MSD", composition: "Beclomethasone + Neomycin + Clotrimazole" },
    { name: "Volini Gel", brand: "Sun Pharma", composition: "Diclofenac Diethylamine + Linseed Oil + Menthol + Methyl Salicylate" },
    { name: "Moov Cream", brand: "Reckitt Benckiser", composition: "Wintergreen Oil + Mint Extract + Turpentine Oil + Eucalyptus Oil" },
    { name: "Fourderm", brand: "Cipla", composition: "Chlorhexidine + Clobetasol + Miconazole + Neomycin" },
    { name: "Tenovate", brand: "GSK", composition: "Clobetasol 0.05%" },
    { name: "Betnovate-C", brand: "GSK", composition: "Betamethasone + Clioquinol" },
    { name: "Betnovate-N", brand: "GSK", composition: "Betamethasone + Neomycin" },
    { name: "Dermi 5", brand: "Universal Twin", composition: "Clobetasol + Gentamicin + Tolnaftate + Iodochlorhydroxyquinoline + Ketoconazole" },
    { name: "Itra 100", brand: "Various", composition: "Itraconazole 100mg" },
    { name: "Itra 200", brand: "Various", composition: "Itraconazole 200mg" },
    { name: "Candid Dusting Powder", brand: "Glenmark", composition: "Clotrimazole 1%" },

    // --- MISC ---
    { name: "Viagra 50", brand: "Pfizer", composition: "Sildenafil 50mg" },
    { name: "Manforce 50", brand: "Mankind", composition: "Sildenafil 50mg" },
    { name: "Tadalafil 20", brand: "Various", composition: "Tadalafil 20mg" },
    { name: "Unwanted-72", brand: "Mankind", composition: "Levonorgestrel 1.5mg" },
    { name: "i-Pill", brand: "Piramal", composition: "Levonorgestrel 1.5mg" },
    { name: "Zolpidem 10", brand: "Various", composition: "Zolpidem 10mg" },
    { name: "Alprax 0.25", brand: "Torrent", composition: "Alprazolam 0.25mg" },
    { name: "Ciplar-LA 40", brand: "Cipla", composition: "Propranolol 40mg" },
    { name: "Betacap TR 40", brand: "Sun Pharma", composition: "Propranolol 40mg" },
    { name: "Crocold", brand: "Various", composition: "Paracetamol + Cetirizine + Phenylephrine" },
];

export async function GET(req: Request) {
    try {
        await connectDB();

        // Check if seeding is needed or needs an upgrade (if length is less than 150)
        const count = await GlobalMedicine.countDocuments();
        if (count < 150) {
            console.log("Upgrading GlobalMedicines database with massive catalog...");
            await GlobalMedicine.deleteMany({});
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

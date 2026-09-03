"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, Save, FileText, Loader2 } from "@/src/components/icons";
import { apiClient } from "@/src/lib/apiClient";

export default function ImportPurchasePage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Step 2 State (Mapping)
  const [mapping, setMapping] = useState({
    name: "",
    batchNumber: "",
    expiryDate: "",
    qty: "",
    freeQty: "",
    mrp: "",
    buyingPrice: "",
    pack: "",
    brand: "",
    hsnCode: "",
    rackNumber: "",
  });

  // Step 3 State (Preview & Submit)
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [existingMedicines, setExistingMedicines] = useState<any[]>([]);

  // Fetch initial data
  useEffect(() => {
    apiClient.get("/api/suppliers").then(setSuppliers).catch(console.error);
    apiClient.get("/api/inventory").then((res: any) => {
        // Just cache names for fuzzy matching
        if (Array.isArray(res)) setExistingMedicines(res);
    }).catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
       setLoading(true);
       try {
           const formData = new FormData();
           formData.append("file", file);

           const res = await fetch("/api/purchases/parse-pdf", {
               method: "POST",
               body: formData
           });

           const data = await res.json();
           if (!res.ok) throw new Error(data.error || "Failed to parse PDF");

           setHeaders(data.headers);
           setFileData(data.rows);
           
           // Auto-map the known columns for PDFs
           setMapping(prev => ({
              ...prev,
              name: "Product Name",
              batchNumber: "Batch Number",
              expiryDate: "Expiry Date",
              qty: "Billed Qty",
              mrp: "MRP",
              buyingPrice: "Buying Price",
              pack: "Pack",
              rackNumber: "Rack No",
              composition: "Composition",
           }));

           setError(null);
       } catch (err: any) {
           setError(err.message);
       } finally {
           setLoading(false);
       }
       return;
    }

    // Existing Excel Logic
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length < 2) {
            setError("File is empty or invalid format.");
            return;
        }

        const parsedHeaders = data[0].map(String);
        const rows = XLSX.utils.sheet_to_json(ws);
        
        setHeaders(parsedHeaders);
        setFileData(rows as any[]);
        setError(null);
      } catch (err) {
        setError("Failed to parse file. Please upload a valid Excel or CSV.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProceedToMapping = () => {
    if (!supplierId || !invoiceDate) {
      setError("Please select a supplier and date.");
      return;
    }
    if (headers.length === 0) {
      setError("Please upload a file.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleProceedToPreview = () => {
    if (!mapping.name || !mapping.qty || !mapping.buyingPrice) {
      setError("Product Name, Quantity, and Buying Price must be mapped.");
      return;
    }

    const processed = fileData.map((row, index) => {
       const itemName = row[mapping.name] || "";
       // Try to find exact or lowercase match in DB
       const matchedMed = existingMedicines.find(m => m.name.toLowerCase() === String(itemName).toLowerCase());

       return {
         id: index,
         rawName: itemName,
         medicineId: matchedMed?._id || null,
         name: matchedMed ? matchedMed.name : itemName, // Will be used to create if missing
         batchNumber: mapping.batchNumber ? row[mapping.batchNumber] : "",
         expiryDate: mapping.expiryDate ? row[mapping.expiryDate] : "",
         qty: mapping.qty ? Number(row[mapping.qty]) : 0,
         freeQty: mapping.freeQty ? Number(row[mapping.freeQty]) : 0,
         mrp: mapping.mrp ? Number(row[mapping.mrp]) : 0,
         buyingPrice: mapping.buyingPrice ? Number(row[mapping.buyingPrice]) : 0,
         pack: mapping.pack ? row[mapping.pack] : "",
         brand: mapping.brand ? row[mapping.brand] : "",
         hsnCode: mapping.hsnCode ? row[mapping.hsnCode] : "",
         rackNumber: mapping.rackNumber ? row[mapping.rackNumber] : "",
         isMatched: !!matchedMed
       };
    }).filter(item => item.rawName && String(item.rawName).trim() !== ""); // Ignore empty rows, but allow 0/NaN qty for visibility

    setPreviewItems(processed);
    setError(null);
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        // Calculate totals for invoice
        let subTotal = 0;
        previewItems.forEach(item => {
            subTotal += (item.qty * item.buyingPrice);
        });

        const payload = {
            supplierId,
            invoiceNumber,
            invoiceDate,
            items: previewItems,
            subTotal,
            grandTotal: subTotal, // Not handling dynamic GST/Discount mapping in UI yet for simplicity
            paymentMethod: "Credit"
        };

        const res = await apiClient.post("/api/purchases", payload);
        
        router.push("/inventory");
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        {/* Labeled Stepper */}
        <div className="flex items-center gap-4 surface-card p-3 rounded-2xl">
           <div className={`flex items-center gap-2 ${step >= 1 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
             <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold ${step === 1 ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'bg-primary/10 text-primary'}`}>1</div>
             <span className="text-[11px] font-bold uppercase tracking-widest text-foreground hidden sm:block">Upload</span>
           </div>
           <div className="w-8 h-0.5 bg-border" />
           <div className={`flex items-center gap-2 ${step >= 2 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
             <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold ${step === 2 ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'bg-primary/10 text-primary'}`}>2</div>
             <span className="text-[11px] font-bold uppercase tracking-widest text-foreground hidden sm:block">Map Data</span>
           </div>
           <div className="w-8 h-0.5 bg-border" />
           <div className={`flex items-center gap-2 ${step >= 3 ? 'opacity-100' : 'opacity-40 grayscale'}`}>
             <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold ${step === 3 ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'bg-primary/10 text-primary'}`}>3</div>
             <span className="text-[11px] font-bold uppercase tracking-widest text-foreground hidden sm:block">Finalize</span>
           </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-fade-in">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="surface-card p-6 md:p-8 space-y-7 animate-fade-in">
          <div className="flex items-center gap-4 border-b border-border pb-5">
             <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
               <UploadCloud size={23} strokeWidth={2.3} />
             </div>
             <div>
                <h2 className="font-display text-lg font-extrabold text-foreground tracking-tight">Invoice Details & File Upload</h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Provide invoice meta data and upload the distributor invoice (PDF or Excel)</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="label">Supplier</label>
              <select 
                value={supplierId} 
                onChange={e => setSupplierId(e.target.value)}
                className="select"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Invoice Number (Optional)</label>
              <input 
                type="text" 
                value={invoiceNumber} 
                onChange={e => setInvoiceNumber(e.target.value)}
                className="input"
                placeholder="e.g. INV-2026-001"
              />
            </div>
            <div>
              <label className="label">Invoice Date</label>
              <input 
                type="date" 
                value={invoiceDate} 
                onChange={e => setInvoiceDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center bg-muted/40 hover:bg-muted/60 transition-colors relative">
             {loading ? <Loader2 size={40} className="text-primary animate-spin mb-3" /> : <FileText size={40} className="text-muted-foreground mb-3" strokeWidth={1.5} />}
             <p className="text-foreground font-semibold mb-4">Upload Supplier PDF, CSV or Excel file</p>
             <label className="btn-primary btn-md cursor-pointer">
                Browse File
                <input type="file" accept=".pdf, .csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
             </label>
             {headers.length > 0 && (
                <div className="mt-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 bg-success/12 px-3 py-1.5 rounded-lg text-sm font-bold">
                   <CheckCircle2 size={16} /> File Loaded: {fileData.length} rows found
                </div>
             )}
          </div>

          <div className="flex justify-end">
             <button 
                onClick={handleProceedToMapping}
                className="btn-primary btn-md"
             >
                Next: Map Columns <ArrowRight size={17} />
             </button>
          </div>
        </div>
      )}

      {/* STEP 2: MAPPING */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
             <h2 className="text-lg font-bold text-gray-900">2. Match Columns</h2>
             <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-400 hover:text-black">← Back</button>
          </div>
          
          <p className="text-sm text-gray-500 font-medium">Select which column in your uploaded file corresponds to the required Medishop field.</p>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
             {Object.keys(mapping).map((fieldKey) => (
                <div key={fieldKey} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                   <span className="text-[13px] font-bold text-gray-700 capitalize">{fieldKey.replace(/([A-Z])/g, ' $1').trim()}</span>
                   <select
                      value={(mapping as any)[fieldKey]}
                      onChange={e => setMapping(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#0047ab] w-[200px]"
                   >
                      <option value="">-- Ignore --</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                   </select>
                </div>
             ))}
          </div>

          <div className="flex justify-end pt-4">
             <button 
                onClick={handleProceedToPreview}
                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
             >
                Next: Preview Data <ArrowRight size={18} />
             </button>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & COMMIT */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
             <div>
                <h2 className="text-lg font-bold text-gray-900">3. Review & Commit</h2>
                <p className="text-sm text-gray-500 font-medium">{previewItems.length} valid items ready to be imported.</p>
             </div>
             <button onClick={() => setStep(2)} className="text-sm font-bold text-gray-400 hover:text-black">← Back to Mapping</button>
          </div>

          <div className="flex-1 overflow-auto p-0">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                   <tr>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Product Name</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Batch</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Qty</th>
                      <th className="py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Buying Price</th>
                   </tr>
                </thead>
                <tbody>
                   {previewItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                         <td className="py-3 px-4">
                            {item.isMatched ? (
                               <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md">Matched</span>
                            ) : (
                               <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-md">New Med</span>
                            )}
                         </td>
                         <td className="py-3 px-4 text-[13px] font-bold text-gray-900">{item.name}</td>
                         <td className="py-3 px-4 text-[12px] font-medium text-gray-600">{item.batchNumber || "-"}</td>
                         <td className="py-3 px-4 text-[13px] font-bold text-gray-900 text-center">{item.qty} + {item.freeQty}F</td>
                         <td className="py-3 px-4 text-[13px] font-bold text-gray-900 text-right text-green-600">₹{item.buyingPrice.toFixed(2)}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex items-center justify-between">
             <div className="text-sm font-bold text-gray-600">
                Total Value: <span className="text-lg text-black ml-2">₹{previewItems.reduce((acc, i) => acc + (i.qty * i.buyingPrice), 0).toFixed(2)}</span>
             </div>
             <button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#0047ab] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#003580] transition-all flex items-center gap-2 shadow-[0_4px_15px_rgba(0,71,171,0.3)] hover:shadow-[0_6px_20px_rgba(0,71,171,0.4)] disabled:opacity-50"
             >
                {loading ? "Processing Ledger & Stock..." : "Commit Purchase Invoice"}
                {!loading && <Save size={18} />}
             </button>
          </div>
        </div>
      )}

    </div>
  );
}

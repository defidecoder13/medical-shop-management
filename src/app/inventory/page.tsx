
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Filter, 
  Search, 
  Edit3, 
  MoreVertical, 
  Trash2, 
  ArrowUpDown,
  CheckCircle2,
  AlertCircle, 
  Loader2,
  Upload,
  Download,
  Package,
  Layers
} from "lucide-react";
import { useDebounce } from "@/src/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";
import { format } from "date-fns";
import * as xlsx from "xlsx";

type Medicine = {
  _id?: string;
  name: string;
  brand?: string;
  batchNumber: string;
  expiryDate: string;
  stock: number | "";
  tabletsPerStrip: number | "";
  buyingPrice: number | ""; // Cost Price
  sellingPrice: number | ""; // MRP
  rackNumber: string;
  composition: string;
  hsnCode?: string;
  gstPercent: number;
  totalTabletsInStock?: number;
  barcode?: string;
};

const emptyMedicine: Medicine = {
  name: "",
  brand: "",
  batchNumber: "",
  expiryDate: "",
  stock: "",
  tabletsPerStrip: "",
  buyingPrice: "",
  sellingPrice: "",
  rackNumber: "",
  composition: "",
  hsnCode: "3004",
  gstPercent: 5,
  barcode: "",
};

export default function InventoryPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Medicine>(emptyMedicine);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for auto-focus
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const batchNumberInputRef = useRef<HTMLInputElement>(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Medicine | 'none', direction: 'asc' | 'desc' }>({ key: 'none', direction: 'asc' });
  const [showSort, setShowSort] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) router.push('/login');
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const fetchMedicines = async () => {
    try {
      const data = await apiClient.get(`/api/inventory?q=${debouncedSearch}`);
      setMedicines(data.map((m: any) => ({
        _id: m._id,
        name: m.name,
        brand: m.brand,
        batchNumber: m.batchNumber,
        expiryDate: m.expiryDate,
        stock: m.stock,
        tabletsPerStrip: m.tabletsPerStrip,
        buyingPrice: m.buyingPricePerStrip, // Cost
        sellingPrice: m.sellingPricePerStrip, // MRP
        rackNumber: m.rackNumber,
        composition: m.composition,
        hsnCode: m.hsnCode,
        gstPercent: m.gstPercent,
        totalTabletsInStock: m.totalTabletsInStock
      })));
    } catch (error) {
      console.error("Failed to fetch medicines", error);
    }
  };

  const downloadTemplate = () => {
    const ws = xlsx.utils.json_to_sheet([{
      Name: "Dolo 650",
      Brand: "Micro Labs",
      "Batch Number": "BATCH123",
      "Expiry Date": "2026-12-31",
      "Strips Qty": 10,
      "Tablets Per Strip": 15,
      "Cost Price": 20.00,
      "MRP": 30.00,
      Rack: "A1",
      Composition: "Paracetamol 650mg",
      "HSN Code": "3004",
      "GST Percent": 5
    }]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");
    xlsx.writeFile(wb, "Purchase_Template.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws);

        if (data.length === 0) throw new Error("File is empty");

        const formattedPayload = data.map((row: any) => ({
          name: row["Name"] || "",
          brand: row["Brand"] || "",
          batchNumber: row["Batch Number"] || "",
          expiryDate: row["Expiry Date"] || "",
          stock: Number(row["Strips Qty"]) || 0,
          tabletsPerStrip: Number(row["Tablets Per Strip"]) || 0,
          buyingPrice: Number(row["Cost Price"]) || 0,
          sellingPrice: Number(row["MRP"]) || 0,
          rackNumber: row["Rack"] || "",
          composition: row["Composition"] || "",
          hsnCode: row["HSN Code"] || "3004",
          gstPercent: Number(row["GST Percent"]) || 5
        }));

        const res = await fetch("/api/inventory/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedPayload)
        });

        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || "Failed to upload file");

        let msg = `Successfully added ${result.added || 0} and updated ${result.updated || 0} items.`;
        if (result.errors && result.errors.length > 0) {
           msg += ` Experienced ${result.errors.length} errors.`;
           console.warn("Bulk Upload Errors:", result.errors);
        }

        setMessage({ text: msg, type: 'success' });
        fetchMedicines();
      } catch (err: any) {
         setMessage({ text: err.message || "Error parsing file", type: 'error' });
      } finally {
         setUploading(false);
         if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    fetchMedicines();
  }, [debouncedSearch]);

  // Handle Autocomplete Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMedicineNameChange = async (val: string) => {
    setForm({...form, name: val});
    
    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const data = await apiClient.get(`/api/global-medicines?q=${encodeURIComponent(val)}`);
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error("Autocomplete fetch error", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setForm({
      ...form,
      name: suggestion.name,
      brand: suggestion.brand || "",
      composition: suggestion.composition || "",
    });
    setShowSuggestions(false);
    
    // Jump focus to Batch Number input after brief delay to allow React state to settle
    setTimeout(() => {
      if (batchNumberInputRef.current) {
        batchNumberInputRef.current.focus();
      }
    }, 50);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const method = editingId ? "PUT" : "POST";
    const payload = {
      ...form,
      stock: Number(form.stock),
      tabletsPerStrip: Number(form.tabletsPerStrip),
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      totalTabletsInStock: Number(form.stock) * Number(form.tabletsPerStrip)
    };

    try {
      let data;
      if (editingId) {
        data = await apiClient.put("/api/inventory", { ...payload, _id: editingId });
      } else {
        data = await apiClient.post("/api/inventory", payload);
      }
      setLoading(false);

      setMessage({ 
        text: data.offlineQueued ? (editingId ? "Update queued for sync" : "Addition queued for sync") : (editingId ? "Medicine updated successfully" : "Medicine added successfully"), 
        type: 'success' 
      });
      setForm(emptyMedicine);
      setEditingId(null);
      setShowForm(false);
      fetchMedicines();

      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setLoading(false);
      setMessage({ text: err.message || "An error occurred", type: 'error' });
    }
  };

  const handleEdit = (med: Medicine) => {
    setForm({
      ...med,
      expiryDate: med.expiryDate ? med.expiryDate.slice(0, 10) : "",
    });
    setEditingId(med._id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this medicine? This action cannot be undone.")) {
      setLoading(true);
      try {
        const data = await apiClient.delete(`/api/inventory/${id}`);

        setMessage({ text: data.offlineQueued ? "Deletion queued for sync" : "Medicine deleted permanently", type: 'success' });
        fetchMedicines();
      } catch (error: any) {
        setMessage({ text: error.message || "Failed to delete", type: 'error' });
      } finally {
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const handleBarcodeChange = (val: string) => {
    let updatedForm = { ...form, barcode: val };

    // GS1 DataMatrix Parser (e.g., 01<14-GTIN>17<YYMMDD>10<BATCH>)
    if (val.startsWith("01") && val.length > 20) {
      try {
        const gtin = val.substring(2, 16);
        const expiryIndicator = val.substring(16, 18);
        
        if (expiryIndicator === "17") {
          const expiryYYMMDD = val.substring(18, 24);
          const yy = "20" + expiryYYMMDD.substring(0, 2);
          const mm = expiryYYMMDD.substring(2, 4);
          const dd = expiryYYMMDD.substring(4, 6);
          const formattedExpiry = `${yy}-${mm}-${dd}`;
          
          const batchIndicator = val.substring(24, 26);
          if (batchIndicator === "10") {
             const batchRaw = val.substring(26);
             const batchNumber = batchRaw.split(/\x1D/)[0]; // Split by GS separator if present
             
             updatedForm = {
               ...updatedForm,
               barcode: gtin,
               expiryDate: formattedExpiry,
               batchNumber: batchNumber
             };
          }
        }
      } catch (e) {
        console.error("GS1 Parse Error", e);
      }
    }
    
    setForm(updatedForm);
  };

  const filteredMeds = medicines
    .filter(m => {
       const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                           m.brand?.toLowerCase().includes(search.toLowerCase()) ||
                           m.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
                           m.composition?.toLowerCase().includes(search.toLowerCase());
       
       return matchesSearch;
    })
    .sort((a, b) => {
       if (sortConfig.key === 'none') return 0;
       
       const aValue = a[sortConfig.key as keyof Medicine];
       const bValue = b[sortConfig.key as keyof Medicine];

       if (aValue === undefined || bValue === undefined) return 0;

       if (sortConfig.key === 'expiryDate') {
          return sortConfig.direction === 'asc' 
             ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
             : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
       }

       if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
       }

       return sortConfig.direction === 'asc' 
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
    });

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-[#11327c] tracking-tight">Inventory Management</h2>
          <p className="text-[13px] text-gray-500 font-medium">Manage your medicine stock and pricing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={16} strokeWidth={2.5} />
            Template
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv, .xlsx, .xls" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-indigo-100 transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} strokeWidth={2.5} />}
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>

          <button 
            onClick={() => {
              setForm(emptyMedicine);
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 bg-[#11327c] text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider hover:bg-[#1e4db7] transition-all shadow-lg shadow-[#11327c]/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            {showForm ? "Cancel" : "Add Medicine"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl flex items-center gap-3 text-[13px] font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <AlertCircle size={18} strokeWidth={2.5} />}
          {message.text}
        </div>
      )}

      {/* Form Section */}
      <AnimatePresence>
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_20px_50px_-20px_rgba(17,50,124,0.12)]"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#11327c]/5 rounded-2xl flex items-center justify-center text-[#11327c]">
              <Edit3 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[18px] font-black text-[#11327c] tracking-tight">{editingId ? "Edit Medicine" : "Add New Medicine"}</h3>
              <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Update your catalog information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2 relative" ref={autocompleteRef}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Medicine Name</label>
              <div className="relative group">
                <input 
                  placeholder="Search and select name..." 
                  value={form.name}
                  onChange={e => handleMedicineNameChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
                  autoComplete="off"
                />
                {loadingSuggestions && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin text-[#11327c]" />
                  </div>
                )}
              </div>
              
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-50 top-full mt-2 w-[150%] sm:w-[200%] bg-white border border-gray-100 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden max-h-64 overflow-y-auto p-2"
                  >
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionSelect(s)}
                        className="w-full text-left px-4 py-3.5 hover:bg-[#f8fafc] rounded-xl transition-colors flex flex-col items-start gap-1 group/item"
                      >
                        <div className="flex justify-between w-full items-center">
                          <span className="font-black text-[13px] text-[#11327c] group-hover/item:text-[#11327c]">{s.name}</span>
                          <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-[#11327c] rounded-md uppercase tracking-wider">{s.brand}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium line-clamp-1">{s.composition}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand</label>
              <input 
                placeholder="e.g. Micro Labs" 
                value={form.brand}
                onChange={e => setForm({...form, brand: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Barcode</label>
              <input 
                placeholder="Scan barcode" 
                value={form.barcode || ''}
                onChange={e => handleBarcodeChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Batch Number</label>
              <input 
                ref={batchNumberInputRef}
                placeholder="e.g. BATCH123" 
                value={form.batchNumber}
                onChange={e => setForm({...form, batchNumber: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rack / Row</label>
              <input 
                placeholder="e.g. A1" 
                value={form.rackNumber}
                onChange={e => setForm({...form, rackNumber: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Composition</label>
              <input 
                placeholder="e.g. Paracetamol 500mg" 
                value={form.composition}
                onChange={e => setForm({...form, composition: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HSN Code</label>
              <input 
                placeholder="3004" 
                value={form.hsnCode}
                onChange={e => setForm({...form, hsnCode: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
              <input 
                type="date"
                value={form.expiryDate}
                onChange={e => setForm({...form, expiryDate: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Stock (Strips)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={form.stock}
                onChange={e => setForm({...form, stock: e.target.value === "" ? "" : Number(e.target.value)})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tablets / Strip</label>
              <input 
                type="number" 
                placeholder="0" 
                value={form.tabletsPerStrip}
                onChange={e => setForm({...form, tabletsPerStrip: e.target.value === "" ? "" : Number(e.target.value)})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.buyingPrice}
                  onChange={e => setForm({...form, buyingPrice: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">MRP / Selling Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.sellingPrice}
                  onChange={e => setForm({...form, sellingPrice: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#11327c] text-white font-black text-[12px] uppercase tracking-[0.15em] rounded-xl py-4 hover:bg-[#1e4db7] transition-all disabled:opacity-50 shadow-lg shadow-[#11327c]/20"
              >
                {loading ? "SAVING..." : "SAVE MEDICINE"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] transition-colors" size={18} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search by name, brand, batch or composition..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 relative">
          <div className="relative">
            <button 
              onClick={() => setShowSort(!showSort)}
              className={`flex items-center gap-2 px-5 py-3 border rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                sortConfig.key !== 'none' 
                ? 'bg-[#11327c] text-white border-[#11327c] shadow-lg shadow-[#11327c]/20' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ArrowUpDown size={16} strokeWidth={2.5} />
              Sort
            </button>

            <AnimatePresence>
            {showSort && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] z-50 p-2 overflow-hidden"
              >
                {[
                  { label: 'Name', key: 'name' },
                  { label: 'Expiry Date', key: 'expiryDate' },
                  { label: 'Stock Level', key: 'stock' },
                  { label: 'Selling Price', key: 'sellingPrice' }
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSortConfig({
                        key: s.key as any,
                        direction: sortConfig.key === s.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                      });
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-between hover:bg-[#f8fafc] transition-all ${
                      sortConfig.key === s.key ? 'text-[#11327c]' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                    {sortConfig.key === s.key && (
                      <ArrowUpDown size={12} className={sortConfig.direction === 'desc' ? 'rotate-180' : ''} strokeWidth={3} />
                    )}
                  </button>
                ))}
                <div className="h-px bg-gray-50 my-1 mx-2" />
                <button
                  onClick={() => { setSortConfig({ key: 'none', direction: 'asc' }); setShowSort(false); }}
                  className="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 transition-all"
                >
                  Reset Sort
                </button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#f8fafc] border-b border-gray-100 z-10">
              <tr>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Medicine Details</th>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Rack</th>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Strips</th>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Tablets</th>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Expiry</th>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Cost</th>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">MRP</th>
                <th className="px-7 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
              {filteredMeds.map((med, index) => (
                <motion.tr 
                  key={med._id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  className="hover:bg-[#f8fafc]/80 transition-colors group"
                >
                  <td className="px-7 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#11327c] shadow-sm">
                        <Package size={20} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="font-black text-[#11327c] uppercase text-[13px] tracking-tight mb-0.5">{med.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {med.brand} <span className="mx-1 opacity-20">/</span> <span className="font-mono text-gray-500">#{med.batchNumber}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-7 py-5">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-black tracking-tight">
                      {med.rackNumber || "-"}
                    </span>
                  </td>
                  <td className="px-7 py-5">
                    <div className={`text-[14px] font-black tracking-tight ${Number(med.stock) < 10 ? 'text-rose-600' : 'text-[#11327c]'}`}>
                      {med.stock}
                    </div>
                    {Number(med.stock) < 10 && (
                      <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5">Critical</div>
                    )}
                  </td>
                  <td className="px-7 py-5 text-[13px] font-bold text-gray-500">
                    {med.totalTabletsInStock || (Number(med.stock) * Number(med.tabletsPerStrip)) || 0}
                  </td>
                  <td className="px-7 py-5">
                    <div className={`text-[13px] font-black tracking-tight ${new Date(med.expiryDate) < new Date() ? 'text-rose-600' : 'text-gray-600'}`}>
                      {med.expiryDate ? format(new Date(med.expiryDate), "MMM yyyy") : "-"}
                    </div>
                  </td>
                  <td className="px-7 py-5 text-right text-[13px] font-bold text-gray-400">₹{Number(med.buyingPrice).toFixed(2)}</td>
                  <td className="px-7 py-5 text-right text-[15px] font-black text-[#11327c] tracking-tight">₹{Number(med.sellingPrice).toFixed(2)}</td>
                  <td className="px-7 py-5">
                    <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(med)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#11327c] hover:bg-[#11327c]/5 rounded-lg transition-all"
                      >
                        <Edit3 size={16} strokeWidth={2.5} />
                      </button>
                      <button 
                        onClick={() => handleDelete(med._id!)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              </AnimatePresence>
              {filteredMeds.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-7 py-24 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <Search size={48} strokeWidth={1} className="text-gray-400" />
                        <div className="space-y-1">
                          <p className="text-gray-600 font-black text-sm uppercase tracking-widest">No Products Found</p>
                          <p className="text-gray-400 font-medium text-xs">Try adjusting your search or filters</p>
                        </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-[#f8fafc]/50 border-t border-gray-100 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">
          <p>Total Catalog Size: <span className="text-[#11327c] ml-1">{filteredMeds.length} Items</span></p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm disabled:opacity-30" disabled>Previous</button>
            <button className="px-4 py-2 bg-[#11327c] text-white border border-[#11327c] rounded-xl shadow-md shadow-[#11327c]/20">1</button>
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
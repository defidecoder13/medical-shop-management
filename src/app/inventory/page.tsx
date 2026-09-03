
"use client";

import { useEffect, useState, useRef, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  X,
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
  Layers,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Clock,
  LayoutGrid,
  PackagePlus,
  ShoppingCart
} from "@/src/components/icons";
import { useDebounce } from "@/src/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";
import { format } from "date-fns";
import { StatCard } from "@/src/components/dashboard/stat-card";

const parseExpiryDate = (expiryInput: string | number): string => {
  if (!expiryInput) return "";
  
  // 1. Handle Excel Serial Numbers (e.g., 45231 or "45231")
  const numericVal = Number(expiryInput);
  // An excel serial number > 20000 represents dates after year 1954, avoiding collisions with MM/YY strings
  if (!isNaN(numericVal) && numericVal > 20000 && numericVal < 100000) {
    // Excel dates are days since Jan 1, 1900. 25569 is the offset to Unix epoch (Jan 1, 1970).
    const date = new Date(Math.round((numericVal - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }

  const expiryStr = String(expiryInput).trim();
  
  // 2. Handle alphanumeric formats like "Sep-27" or "Sep 2027"
  const alphaMatch = expiryStr.match(/^([a-zA-Z]{3})[-/\s](\d{2,4})$/);
  if (alphaMatch) {
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthStr = alphaMatch[1].toLowerCase();
    const monthIndex = monthNames.indexOf(monthStr);
    if (monthIndex !== -1) {
      const month = monthIndex + 1;
      let year = parseInt(alphaMatch[2], 10);
      if (year < 100) year += 2000;
      
      const lastDay = new Date(year, month, 0);
      const yyyy = lastDay.getFullYear();
      const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
      const dd = String(lastDay.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // 3. Normalize delimiters and match MM/YY or MM/YYYY
  const cleanStr = expiryStr.replace(/[-.]/g, "/");
  const match = cleanStr.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const month = parseInt(match[1], 10);
    let year = parseInt(match[2], 10);
    
    if (month < 1 || month > 12) return expiryStr; // Skip throw, return raw
    if (year < 100) year += 2000;
    
    const lastDay = new Date(year, month, 0);
    const yyyy = lastDay.getFullYear();
    const mm = String(lastDay.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDay.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  
  // 4. ISO or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
  if (/^\d{4}-\d{2}-\d{2}T/.test(cleanStr)) return cleanStr.slice(0, 10);
  
  return expiryStr;
};

const formatToMMYY = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.slice(0, 10).split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    return `${month}/${year.slice(-2)}`;
  }
  return dateStr;
};

const formatToYYYYMMDD = (val?: string | Date): string => {
  if (!val) return "";
  if (typeof val === "string") {
    if (val.includes("T")) return val.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) return val.trim();
  }
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
};

type Medicine = {
  _id?: string;
  medicineId?: string;
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
  pack?: string;
  discountPercent?: number | "";
  supplierName?: string;
  purchaseInvoiceNumber?: string;
  category?: string;
  purchaseDate?: string;
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
  pack: "",
  hsnCode: "3004",
  gstPercent: 5,
  barcode: "",
  discountPercent: 12,
  supplierName: "",
  purchaseInvoiceNumber: "",
  category: "Tablet",
  purchaseDate: "",
};

export default function InventoryPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterSupplier, setFilterSupplier] = useState("All Suppliers");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [hideZeroStock, setHideZeroStock] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Medicine>(emptyMedicine);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRestock, setIsRestock] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [stats, setStats] = useState<{ totalItems: number, totalStockValue: number, lowStockItems: number, expiringSoon: number, outOfStock: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.get('/api/inventory/stats');
        setStats(data);
      } catch (e) {
        console.error("Error fetching stats", e);
      }
    };
    fetchStats();
  }, []);

  const getLabels = (category: string) => {
    switch (category) {
      case "Syrup":
        return {
          stock: "Stock (Bottles)",
          cost: "Cost Price (per Bottle)",
          mrp: "MRP (per Bottle)",
          subUnit: "",
        };
      case "Drops":
        return {
          stock: "Stock (Vials)",
          cost: "Cost Price (per Vial)",
          mrp: "MRP (per Vial)",
          subUnit: "",
        };
      case "Ointment":
        return {
          stock: "Stock (Tubes)",
          cost: "Cost Price (per Tube)",
          mrp: "MRP (per Tube)",
          subUnit: "",
        };
      case "Injection":
        return {
          stock: "Stock (Vials/Ampoules)",
          cost: "Cost Price (per Vial/Ampoule)",
          mrp: "MRP (per Vial/Ampoule)",
          subUnit: "",
        };
      case "Device":
        return {
          stock: "Stock (Pcs)",
          cost: "Cost Price (per Piece)",
          mrp: "MRP (per Piece)",
          subUnit: "",
        };
      case "Spray":
        return {
          stock: "Stock (Bottles)",
          cost: "Cost Price (per Bottle)",
          mrp: "MRP (per Bottle)",
          subUnit: "",
        };
      case "Other":
        return {
          stock: "Stock (Packs/Qty)",
          cost: "Cost Price (per Pack/Qty)",
          mrp: "MRP (per Pack/Qty)",
          subUnit: "",
        };
      case "Capsule":
        return {
          stock: "Qty",
          cost: "Cost Price (per Strip)",
          mrp: "MRP (per Strip)",
          subUnit: "Capsules per Strip",
        };
      case "Tablet":
      default:
        return {
          stock: "Qty",
          cost: "Cost Price (per Strip)",
          mrp: "MRP (per Strip)",
          subUnit: "Tablets per Strip",
        };
    }
  };

  const labels = getLabels(form.category || "Tablet");
  const isMultiUnit = form.category === "Tablet" || form.category === "Capsule";

  // Removed autocomplete state

  // Refs for auto-focus
  const batchNumberInputRef = useRef<HTMLInputElement>(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Medicine | 'none', direction: 'asc' | 'desc' }>({ key: 'none', direction: 'asc' });
  const [showSort, setShowSort] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const fetchMedicines = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", "50");
      if (deferredSearch) params.append("q", deferredSearch);
      if (filterCategory !== "All Categories") params.append("category", filterCategory);
      if (filterSupplier !== "All Suppliers") params.append("supplier", filterSupplier);
      if (filterStatus !== "All Status") params.append("status", filterStatus);
      if (hideZeroStock) params.append("inStock", "true");

      const setMedsFromPayload = (res: any) => {
        if (signal?.aborted) return;
        // Paginated response: {data, pagination}
        const payload = res?.data ? res.data : (Array.isArray(res) ? res : []);
        const pagination = res?.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
        } else {
          // Fallback for non-paginated (should not happen now)
          setTotalPages(Math.max(1, Math.ceil(payload.length / 50)));
        }
        setMedicines(payload.map((m: any) => ({
          _id: m._id,
          name: m.name,
          brand: m.brand,
          batchNumber: m.batchNumber,
          expiryDate: m.expiryDate,
          stock: m.stock,
          tabletsPerStrip: m.tabletsPerStrip,
          buyingPrice: m.buyingPrice || m.buyingPricePerStrip || 0,
          sellingPrice: m.mrp || m.sellingPricePerStrip || 0,
          rackNumber: m.rackNumber,
          composition: m.composition || m.medicineId?.composition || "",
          pack: m.pack || "",
          hsnCode: m.hsnCode || m.medicineId?.hsnCode || "",
          gstPercent: m.gstPercent || m.medicineId?.gstPercent || 5,
          barcode: m.barcode || m.medicineId?.barcode || "",
          discountPercent: m.discountPercent || 0,
          supplierName: m.supplierName || "",
          purchaseInvoiceNumber: m.purchaseInvoiceNumber || "",
          category: m.category || m.medicineId?.category || "Tablet",
          purchaseDate: m.purchaseDate || "",
        })));
      };

      const res = await apiClient.get(`/api/inventory?${params.toString()}`, { signal } as any, (cachedData) => {
        setMedsFromPayload(cachedData);
      });
      setMedsFromPayload(res);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("Failed to fetch medicines", error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet([{
      Name: "Dolo 650",
      Brand: "Micro Labs",
      "Batch Number": "BATCH123",
      "Expiry Date": "2026-12-31",
      "Qty": 10,
      "Pack": 15,
      "Cost Price": 20.00,
      "MRP": 30.00,
      Rack: "A1",
      Composition: "Paracetamol 650mg",
      "HSN Code": "3004",
      "GST Percent": 5,
      "Discount Percent": 10,
      "Supplier Name": "Apex Distributors",
      "Invoice Number": "INV-101"
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
        const xlsx = await import("xlsx");
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
          expiryDate: parseExpiryDate(row["Expiry Date"] || row["Expiry"] || ""),
          stock: Number(row["Qty"]) || 0,
          tabletsPerStrip: Number(row["Pack"]) || 0,
          buyingPrice: Number(row["Cost Price"]) || 0,
          sellingPrice: Number(row["MRP"]) || 0,
          rackNumber: row["Rack"] || "",
          composition: row["Composition"] || "",
          hsnCode: row["HSN Code"] || "3004",
          gstPercent: Number(row["GST Percent"]) || 5,
          discountPercent: Number(row["Discount Percent"]) || 0,
          supplierName: row["Supplier Name"] || "Direct Purchase",
          purchaseInvoiceNumber: row["Invoice Number"] || ""
        }));

        const result = await apiClient.post("/api/inventory/bulk", formattedPayload);

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

  // Single debounced fetch with abort — covers page, filters, and search
  useEffect(() => {
    const controller = new AbortController();
    fetchMedicines(controller.signal);
    return () => controller.abort();
  }, [page, filterCategory, filterSupplier, filterStatus, hideZeroStock, deferredSearch]);

  useEffect(() => {
    setPage(1);
  }, [filterCategory, filterSupplier, filterStatus, hideZeroStock, deferredSearch]);

  // Batch initial stats/suppliers/settings in parallel
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [statsRes, suppliersRes, settingsRes] = await Promise.all([
          apiClient.get('/api/inventory/stats').catch(() => null),
          apiClient.get('/api/suppliers').catch(() => []),
          apiClient.get('/api/settings').catch(() => null),
        ]);
        if (ignore) return;
        if (statsRes) setStats(statsRes);
        if (suppliersRes) setSuppliers(suppliersRes || []);
        if (settingsRes) setGstEnabled(settingsRes.gstEnabled || false);
      } catch {}
    })();
    return () => { ignore = true; };
  }, []);


  const handleMedicineNameChange = async (val: string) => {
    setForm({...form, name: val});
  };

  const handleSubmit = async () => {
    let parsedExpiry = "";
    try {
      parsedExpiry = parseExpiryDate(form.expiryDate);
    } catch (e: any) {
      setMessage({ text: e.message || "Invalid expiry date format.", type: 'error' });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    const payload = {
      ...form,
      expiryDate: parsedExpiry,
      stock: Number(form.stock),
      tabletsPerStrip: Number(form.tabletsPerStrip),
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      totalTabletsInStock: Number(form.stock) * Number(form.tabletsPerStrip),
      discountPercent: Number(form.discountPercent) || 0
    };

    setIsSaving(true);
    try {
      let data;
      if (editingId) {
        data = await apiClient.put("/api/inventory", { ...payload, _id: editingId });
      } else {
        data = await apiClient.post("/api/inventory", payload);
      }

      setMessage({ 
        text: editingId ? "Product updated successfully" : "Product added successfully", 
        type: 'success' 
      });
      
      // Update UI only on successful database response
      setForm(emptyMedicine);
      setShowForm(false);
      setEditingId(null);
      setIsRestock(false);
      
      // Fetch in background to sync true IDs
      fetchMedicines();

      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || "An error occurred", type: 'error' });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (med: Medicine) => {
    setForm({
      ...med,
      purchaseDate: med.purchaseDate ? formatToYYYYMMDD(med.purchaseDate) : "",
      expiryDate: med.expiryDate ? formatToMMYY(med.expiryDate) : "",
    });
    setEditingId(med._id!);
    setIsRestock(false);
    setShowForm(true);
  };

  const handleRestock = (med: Medicine) => {
    setForm({
      ...emptyMedicine,
      medicineId: med.medicineId,
      name: med.name || "",
      brand: med.brand || "",
      composition: med.composition || "",
      hsnCode: med.hsnCode || "3004",
      category: med.category || "Tablet",
      gstPercent: med.gstPercent || 5,
      tabletsPerStrip: med.tabletsPerStrip || 10,
      pack: med.pack || "",
      purchaseDate: "",
      // Important: Leave these empty/0 for the user to fill
      stock: "",
      batchNumber: "",
      expiryDate: "",
      buyingPrice: "",
      sellingPrice: "",
      rackNumber: "",
      discountPercent: med.discountPercent || 12,
      supplierName: "Direct Purchase",
      purchaseInvoiceNumber: "",
      barcode: "",
    } as any);
    setEditingId(null);
    setIsRestock(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this medicine? This action cannot be undone.")) {
      try {
        setMedicines(prev => prev.filter(m => m._id !== id));
        const data = await apiClient.delete(`/api/inventory/${id}`);

        setMessage({ text: data.offlineQueued ? "Deletion queued for sync" : "Product deleted permanently", type: 'success' });
        fetchMedicines();
      } catch (error: any) {
        fetchMedicines();
        setMessage({ text: error.message || "Failed to delete", type: 'error' });
      } finally {
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

  const filteredMeds = [...medicines].sort((a, b) => {
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

  // Server paginates — no client slice needed
  const paginatedMeds = filteredMeds;

  const renderExpiry = (expiryDate: string) => {
    if (!expiryDate) return { date: "-", text: "", color: "text-gray-500" };
    const exp = new Date(expiryDate);
    const now = new Date();
    const diffMonths = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const formattedDate = format(exp, "MMM yyyy");
    
    if (diffMonths <= 0) {
      return { date: formattedDate, text: "(Expired)", color: "text-rose-600" };
    } else if (diffMonths < 6) {
      return { date: formattedDate, text: `(${Math.floor(diffMonths)} months left)`, color: "text-rose-500" };
    } else if (diffMonths < 12) {
      return { date: formattedDate, text: `(${Math.floor(diffMonths)} months left)`, color: "text-orange-500" };
    } else {
      const yrs = (diffMonths / 12).toFixed(1);
      return { date: formattedDate, text: `(${yrs} yrs left)`, color: "text-emerald-500" };
    }
  };

  const getCategoryStyles = (category: string) => {
    switch(category?.toLowerCase()) {
      case "pain relief": return "bg-indigo-50 text-indigo-600";
      case "antibiotic": return "bg-emerald-50 text-emerald-600";
      case "antihistamine": return "bg-purple-50 text-purple-600";
      case "wellness": return "bg-orange-50 text-orange-600";
      case "supplements": return "bg-fuchsia-50 text-fuchsia-600";
      case "gastric care": return "bg-teal-50 text-teal-600";
      default: return "bg-blue-50 text-blue-600";
    }
  };

  const getStatus = (stock: number, minStock: number = 10) => {
    if (stock <= 0) return { label: "Out of Stock", bg: "bg-rose-50 text-rose-600" };
    if (stock <= minStock) return { label: "Low Stock", bg: "bg-orange-50 text-orange-600" };
    return { label: "In Stock", bg: "bg-emerald-50 text-emerald-600" };
  };

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard title="Total Items" value={stats ? stats.totalItems : "..."} icon={Package} tone="brand" hint="All products in catalog" />
        <StatCard title="Stock Value" value={stats ? stats.totalStockValue : "..."} icon={TrendingUp} tone="success" hint="At purchase price" decimals={2} prefix="₹" />
        <StatCard title="Low Stock" value={stats ? stats.lowStockItems : "..."} icon={AlertTriangle} tone="warning" hint="Reorder soon" />
        <StatCard title="Expiring Soon" value={stats ? stats.expiringSoon : "..."} icon={Clock} tone="danger" hint="Within 6 months" />
        <StatCard title="Out of Stock" value={stats ? stats.outOfStock : "..."} icon={LayoutGrid} tone="neutral" hint="No units available" />
      </div>

      {message && (
        <div className={`fixed top-20 right-6 z-[200] px-4 py-3 rounded-xl flex items-center gap-3 text-[13.5px] font-bold shadow-pop animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900/60' : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-900/60'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={19} strokeWidth={2.5} /> : <AlertCircle size={19} strokeWidth={2.5} />}
          {message.text}
        </div>
      )}

      {/* Form Section */}
      <AnimatePresence>
      {showForm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 overflow-y-auto"
          onClick={() => { setForm(emptyMedicine); setEditingId(null); setIsRestock(false); setShowForm(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            className="bg-card p-6 md:p-7 rounded-xl border border-border shadow-pop max-w-5xl w-full my-auto"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-muted text-muted-foreground rounded-lg flex items-center justify-center">
              <Edit3 size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">{editingId ? "Edit Product" : isRestock ? "Restock Batch" : "Add New Product"}</h3>
              <p className="text-[12px] text-muted-foreground">Update catalog information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="flex flex-col gap-2 relative">
              <label className="label">Product Name</label>
              <input 
                autoFocus
                placeholder="e.g. Paracetamol 500mg" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Category</label>
              <select
                value={form.category || "Tablet"}
                onChange={e => {
                  const cat = e.target.value;
                  const isCatMulti = cat === "Tablet" || cat === "Capsule";
                  setForm({
                    ...form,
                    category: cat,
                    tabletsPerStrip: isCatMulti ? "" : 1
                  });
                }}
                className="select"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Drops">Drops</option>
                <option value="Ointment">Ointment</option>
                <option value="Injection">Injection</option>
                <option value="Spray">Spray</option>
                <option value="Device">Device / Condoms</option>
                <option value="Food">Food</option>
                <option value="Other">Other / Pieces</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">{labels.stock}</label>
              <input 
                type="number" 
                placeholder="0" 
                value={form.stock}
                onChange={e => setForm({...form, stock: e.target.value === "" ? "" : Number(e.target.value)})}
                className="input"
              />
            </div>

            {isMultiUnit && (
              <div className="flex flex-col gap-2">
                <label className="label">{labels.subUnit}</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={form.tabletsPerStrip}
                  onChange={e => setForm({...form, tabletsPerStrip: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="input"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="label">Batch Number</label>
              <input 
                ref={batchNumberInputRef}
                placeholder="e.g. BATCH123" 
                value={form.batchNumber}
                onChange={e => setForm({...form, batchNumber: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Purchase date</label>
              <input 
                type="date"
                value={formatToYYYYMMDD(form.purchaseDate)}
                onChange={e => setForm({...form, purchaseDate: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Expiry Date</label>
              <input 
                type="text"
                placeholder="MM/YY (e.g. 12/28)"
                value={form.expiryDate}
                onChange={e => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.length > 2) {
                    val = val.substring(0, 2) + '/' + val.substring(2, 4);
                  }
                  setForm({...form, expiryDate: val});
                }}
                maxLength={5}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">{labels.mrp}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.sellingPrice}
                  onChange={e => setForm({...form, sellingPrice: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="input pl-8"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">{labels.cost}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.buyingPrice}
                  onChange={e => setForm({...form, buyingPrice: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="input pl-8"
                />
              </div>
            </div>

            <div className="lg:col-span-4 h-px bg-gray-100 dark:bg-slate-800 my-2"></div>

            <div className="flex flex-col gap-2">
              <label className="label">Brand</label>
              <input 
                placeholder="e.g. Micro Labs" 
                value={form.brand}
                onChange={e => setForm({...form, brand: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={`label ${!gstEnabled ? 'opacity-40 line-through' : ''}`}>GST Slab (%)</label>
              <select
                disabled={!gstEnabled}
                value={form.gstPercent}
                onChange={e => setForm({...form, gstPercent: Number(e.target.value)})}
                className="select disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100/50 dark:disabled:bg-slate-900/50"
              >
                <option value="0">0% (Tax Free / Exempt)</option>
                <option value="5">5% (Insulin / Life Saving)</option>
                <option value="12">12% (General Formulations)</option>
                <option value="18">18% (Supplements, Devices, Cosmetics)</option>
                <option value="28">28% (Luxury / Special)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Barcode</label>
              <input 
                placeholder="Scan barcode" 
                value={form.barcode || ''}
                onChange={e => handleBarcodeChange(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Rack / Row</label>
              <input 
                placeholder="e.g. A1" 
                value={form.rackNumber}
                onChange={e => setForm({...form, rackNumber: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Pack Label</label>
              <input 
                type="text" 
                placeholder="e.g. 10 TAB" 
                value={form.pack}
                onChange={e => setForm({...form, pack: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Default Discount (%)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={form.discountPercent === 0 ? "" : form.discountPercent}
                onChange={e => setForm({...form, discountPercent: e.target.value === "" ? 0 : Number(e.target.value)})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Supplier Name</label>
              <select
                value={form.supplierName || "Direct Purchase"}
                onChange={e => setForm({...form, supplierName: e.target.value})}
                className="select"
              >
                <option value="Direct Purchase">Direct Purchase</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup.name}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="label">Invoice Number</label>
              <input 
                placeholder="e.g. INV-101" 
                value={form.purchaseInvoiceNumber || ""}
                onChange={e => setForm({...form, purchaseInvoiceNumber: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex flex-col gap-2 lg:col-span-3">
              <label className="label">Composition</label>
              <input 
                placeholder="e.g. Paracetamol 500mg" 
                value={form.composition}
                onChange={e => setForm({...form, composition: e.target.value})}
                className="input"
              />
            </div>

            <div className="flex items-end lg:col-span-4 gap-3 mt-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyMedicine);
                }}
                className="btn-outline btn-md flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="btn-primary btn-md flex-1"
              >
                {isSaving ? "Saving..." : editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 w-full mb-6 mt-6">
        <select 
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="select w-full sm:w-auto"
        >
           <option>All Categories</option>
           <option>Tablet</option>
           <option>Capsule</option>
           <option>Syrup</option>
           <option>Injection</option>
           <option>Drops</option>
           <option>Ointment</option>
           <option>Spray</option>
           <option>Food</option>
           <option>Device</option>
           <option>Other</option>
        </select>
        <select 
          value={filterSupplier}
          onChange={e => setFilterSupplier(e.target.value)}
          className="select w-full sm:w-[160px] shrink-0 truncate"
        >
           <option>All Suppliers</option>
           {suppliers.map((supplier: any) => (
             <option key={supplier.name} value={supplier.name}>{supplier.name}</option>
           ))}
        </select>
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="select w-full sm:w-[130px] shrink-0 truncate"
        >
           <option>All Status</option>
           <option>In Stock</option>
           <option>Low Stock</option>
           <option>Out of Stock</option>
        </select>
        <label className="flex items-center gap-2 px-3 h-9 bg-card border border-border rounded-lg text-[13px] font-medium text-foreground cursor-pointer shrink-0 hover:bg-accent transition-colors select-none">
           <input type="checkbox" checked={hideZeroStock} onChange={e => setHideZeroStock(e.target.checked)} className="w-3.5 h-3.5 rounded accent-primary" />
           Hide zero stock
        </label>
        <div className="relative flex-1 min-w-[260px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} strokeWidth={2} />
          <input 
            type="text" 
            placeholder="Search by name, composition, batch..."
            className="input h-9 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button 
           onClick={() => {
              setForm(emptyMedicine);
              setEditingId(null);
              setShowForm(!showForm);
           }}
           className="btn-primary btn-md shrink-0"
        >
           <Plus size={16} strokeWidth={2} /> Add Item
        </button>
      </div>

      {/* Data Table Container */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="table-shell">
            <thead className="sticky top-0 bg-card border-b border-border z-10">
              <tr>

                <th className="th w-12">#</th>
                <th className="th">Product Details</th>
                <th className="th">Category</th>
                <th className="th">Composition</th>
                <th className="th">Batch No.</th>
                <th className="th">Expiry Date</th>
                <th className="th text-right">MRP (₹)</th>
                <th className="th text-center">Stock</th>
                <th className="th text-right">Purchase (₹)</th>
                <th className="th text-right">Discount (%)</th>
                <th className="th text-center">Status</th>
                <th className="th text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedMeds.map((med, idx) => (
                <tr 
                  key={med._id} 
                  onClick={() => handleEdit(med)}
                  className="tbody-row group border-b border-border/60 cursor-pointer hover:bg-muted/40 transition-colors"
                >

                  <td className="td w-12 text-muted-foreground font-semibold">{(page - 1) * 50 + idx + 1}</td>
                  <td className="td">
                     <div>
                       <div className="font-bold text-foreground text-[13px] mb-0.5">{med.name}</div>
                       <div className="text-[11px] text-muted-foreground font-medium">
                         {med.rackNumber ? `Rack: ${med.rackNumber}` : ""}
                       </div>
                     </div>
                  </td>
                  <td className="td">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ring-black/5 dark:ring-white/10 ${getCategoryStyles(med.category || "Tablet")}`}>
                      {med.category || "Tablet"}
                    </span>
                  </td>
                  <td className="td text-[13px] font-medium text-foreground max-w-[180px] truncate" title={med.composition || "-"}>
                    {med.composition || "-"}
                  </td>
                  <td className="td font-mono text-[12.5px] font-medium text-foreground">
                    {med.batchNumber || "-"}
                  </td>
                  <td className="td">
                    <div className="text-[13px] font-medium text-foreground">{renderExpiry(med.expiryDate).date}</div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${renderExpiry(med.expiryDate).color}`}>
                      {renderExpiry(med.expiryDate).text}
                    </div>
                  </td>
                  <td className="td text-right tabular-nums">
                    {Number(med.sellingPrice).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`text-[13px] font-bold ${Number(med.stock) <= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {
                        Number(med.tabletsPerStrip) > 1 
                        ? (() => {
                            const tps = Number(med.tabletsPerStrip);
                            const totalTabs = Math.round(Number(med.stock || 0) * tps);
                            const strips = Math.floor(totalTabs / tps);
                            const tabs = totalTabs % tps;
                            if (strips > 0 && tabs > 0) return `${strips} S, ${tabs} T`;
                            if (strips > 0) return `${strips} Strips`;
                            if (tabs > 0) return `${tabs} Tabs`;
                            return `0 Strips`;
                          })()
                        : `${Math.round(Number(med.stock || 0))} Units`
                      }
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">
                      {med.pack || "Strip"} {Number(med.tabletsPerStrip) > 1 ? `(${med.tabletsPerStrip} Tabs/Strip)` : ""}
                    </div>
                  </td>
                  <td className="td text-right tabular-nums">
                    {Number(med.buyingPrice).toFixed(2)}
                  </td>
                  <td className="td text-right tabular-nums">
                    {med.discountPercent ? `${Number(med.discountPercent)}%` : "0%"}
                  </td>
                  <td className="td text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ring-black/5 dark:ring-white/10 ${getStatus(Number(med.stock)).bg}`}>
                      {getStatus(Number(med.stock)).label}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={(e) => { e.stopPropagation(); router.push(`/billing?add=${med._id}`); }}
                        className="btn-outline btn-sm text-primary border-primary/25 bg-primary/5 hover:bg-primary hover:text-primary-foreground"
                        title="Instantly Bill Product"
                      >
                        <ShoppingCart size={14} strokeWidth={2.5} />
                        + Bill
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); med._id && handleDelete(med._id); }}
                        className="btn-ghost btn-icon text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMeds.length === 0 && (
                <tr>
                   <td colSpan={12} className="px-7 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                          <Search size={28} strokeWidth={1.5} className="text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-foreground font-bold text-sm tracking-wide">No Products Found</p>
                          <p className="text-muted-foreground font-medium text-xs">Try adjusting your search or filters</p>
                        </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-muted/40 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[11px] font-medium text-muted-foreground">
          <p>{loading ? "Loading..." : `${paginatedMeds.length} items on this page`}</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="btn-outline btn-sm disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 text-foreground font-medium">Page {page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="btn-outline btn-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
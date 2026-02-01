"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  Calendar, 
  DollarSign, 
  Hash, 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  AlertCircle, 
  ChevronLeft,
  LayoutGrid,
  History,
  Tag,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info
} from "lucide-react";
import Link from "next/link";

type Medicine = {
  _id?: string;
  name: string;
  brand?: string;
  batchNumber: string;
  expiryDate: string;

  // stock = STRIPS
  stock: number | "";

  // tablets per strip (FIXED value)
  tabletsPerStrip: number | "";

  // derived & returned from backend
  totalTabletsInStock?: number;

  buyingPrice: number | "";
  gstPercent: number;
};

const emptyMedicine: Medicine = {
  name: "",
  brand: "",
  batchNumber: "",
  expiryDate: "",
  stock: "",
  tabletsPerStrip: "",
  buyingPrice: "",
  gstPercent: 5,
};

export default function InventoryPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [form, setForm] = useState<Medicine>(emptyMedicine);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const fetchMedicines = async () => {
    const res = await fetch(`/api/inventory?q=${search}`);
    const data = await res.json();
    setMedicines(data);
  };

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  const handleSubmit = async () => {
    setLoading(true);

    const method = editingId ? "PUT" : "POST";

    const payload = {
      ...form,
      ...(editingId
        ? {}
        : {
            totalTabletsInStock:
              typeof form.stock === "number" &&
              typeof form.tabletsPerStrip === "number"
                ? form.stock * form.tabletsPerStrip
                : 0,
          }),
    };

    try {
      const res = await fetch("/api/inventory", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, _id: editingId } : payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setMessage({ text: data.error || "Something went wrong", type: 'error' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      setMessage({ 
        text: editingId ? "✅ Medicine updated successfully" : "✅ Medicine added successfully", 
        type: 'success' 
      });
      setTimeout(() => setMessage(null), 3000);
      
      setForm(emptyMedicine);
      setEditingId(null);
      fetchMedicines();
    } catch (error) {
      setLoading(false);
      setMessage({ text: "An error occurred", type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleEdit = (med: Medicine) => {
    setForm({
      ...med,
      expiryDate: med.expiryDate.slice(0, 10),
      stock: med.stock ?? "",
      tabletsPerStrip: med.tabletsPerStrip ?? "",
      buyingPrice: med.buyingPrice ?? "",
    });
    setEditingId(med._id!);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const today = new Date().toISOString().slice(0, 10);

  const isFormValid =
    form.name.trim() !== "" &&
    form.batchNumber.trim() !== "" &&
    form.expiryDate !== "" &&
    form.stock !== "" &&
    form.tabletsPerStrip !== "" &&
    form.buyingPrice !== "";

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-emerald-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Boxes className="text-emerald-600 w-8 h-8" />
                Inventory Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage your medicine stock</p>
            </div>
          </div>

          {message && (
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' 
                : 'bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}
        </div>

        {/* Add / Edit Form - Glass Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Plus className="w-48 h-48" />
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
              {editingId ? <Edit className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingId ? "Edit Medicine Details" : "Register New Medicine"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Medicine Name</label>
              <div className="relative">
                <input
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="e.g. Paracetamol"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Package className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Brand / Manufacturer</label>
              <div className="relative">
                <input
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="e.g. GSK"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
                <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Batch Number</label>
              <div className="relative">
                <input
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="e.g. B-12345"
                  value={form.batchNumber}
                  onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                />
                <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Stock (Strips)</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value === "" ? "" : Number(e.target.value) })}
                />
                <Plus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Tablets per Strip</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="10"
                  value={form.tabletsPerStrip}
                  onChange={(e) => setForm({ ...form, tabletsPerStrip: e.target.value === "" ? "" : Number(e.target.value) })}
                />
                <LayoutGrid className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Buying Price (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="0.00"
                  value={form.buyingPrice}
                  onChange={(e) => setForm({ ...form, buyingPrice: e.target.value === "" ? "" : Number(e.target.value) })}
                />
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || loading}
                className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                  !isFormValid || loading
                    ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                }`}
              >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {editingId ? "Update Stock" : "Add to Stock"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Table Area */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-96">
                <input
                  placeholder="Search by name, brand or batch..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-10 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             </div>
             
             <div className="flex gap-2">
                <button 
                   onClick={() => setSearch("")}
                   className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors"
                >
                  Reset Filter
                </button>
                <div className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm">
                   <Boxes className="w-3.5 h-3.5 text-gray-400" />
                   Total Items: {medicines.length}
                </div>
             </div>
          </div>

          <div className="glass-panel rounded-3xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100/50 dark:border-emerald-800/30">
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Medicine Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Catalog Infomation</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Expiration</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Stock Levels</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {medicines.map((med, idx) => {
                    const expired = isExpired(med.expiryDate);
                    const lowStock = typeof med.stock === "number" && med.stock < 10;
                    
                    return (
                      <tr 
                        key={med._id} 
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${expired ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                               <Package className={`w-5 h-5 ${expired ? 'text-rose-600' : 'text-emerald-600'}`} />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{med.name}</div>
                              <div className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded mt-1 inline-block">
                                BATCH: {med.batchNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-sm">
                             <div className="font-semibold text-gray-700 dark:text-gray-300">{med.brand || "Generics"}</div>
                             <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                               <History className="w-3 h-3" />
                               Synced: {today}
                             </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className={`text-xs font-bold flex items-center gap-1.5 ${expired ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'}`}>
                              <Clock className="w-3 h-3" />
                              {med.expiryDate.slice(0, 10)}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                              expired 
                                ? 'bg-rose-500 text-white animate-pulse' 
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            }`}>
                              {expired ? 'Expired' : 'Valid'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <span className={`text-lg font-black ${lowStock ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                                  {med.stock}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Strips</span>
                             </div>
                             <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1.5 leading-none">
                               <Boxes className="w-3 h-3" />
                               {med.totalTabletsInStock ?? 0} total units
                             </div>
                             {lowStock && !expired && (
                               <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 animate-pulse">
                                 <AlertTriangle className="w-3 h-3" />
                                 Critical Level
                               </div>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button
                             onClick={() => handleEdit(med)}
                             className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                           >
                             <Edit className="w-5 h-5" />
                           </button>
                        </td>
                      </tr>
                    );
                  })}

                  {medicines.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Search className="w-12 h-12 mb-3" />
                          <p className="font-bold text-lg">No Items Found</p>
                          <p className="text-sm">Try adjusting your search filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
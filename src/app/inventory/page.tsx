
"use client";

import { useEffect, useState } from "react";
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
  Loader2
} from "lucide-react";
import { useDebounce } from "@/src/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";

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
  gstPercent: number;
  totalTabletsInStock?: number;
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
  gstPercent: 5,
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
    const res = await fetch(`/api/inventory?q=${debouncedSearch}&_t=${Date.now()}`);
    const data = await res.json();
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
      gstPercent: m.gstPercent,
      totalTabletsInStock: m.totalTabletsInStock
    })));
  };

  useEffect(() => {
    fetchMedicines();
  }, [debouncedSearch]);

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
      const res = await fetch("/api/inventory", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, _id: editingId } : payload),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setMessage({ text: data.error || "Something went wrong", type: 'error' });
      } else {
        setMessage({ 
          text: editingId ? "Medicine updated successfully" : "Medicine added successfully", 
          type: 'success' 
        });
        setForm(emptyMedicine);
        setEditingId(null);
        setShowForm(false);
        fetchMedicines();
      }
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setLoading(false);
      setMessage({ text: "An error occurred", type: 'error' });
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
        const res = await fetch(`/api/inventory/${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setMessage({ text: "Medicine deleted permanently", type: 'success' });
          fetchMedicines();
        } else {
          const data = await res.json();
          setMessage({ text: data.error || "Failed to delete", type: 'error' });
        }
      } catch (error) {
        setMessage({ text: "An error occurred", type: 'error' });
      } finally {
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
      }
    }
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
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-sm text-muted-foreground">Manage your medicine stock and pricing.</p>
        </div>
        <button 
          onClick={() => {
            setForm(emptyMedicine);
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={18} />
          {showForm ? "Cancel" : "Add New Medicine"}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-semibold text-foreground mb-4">{editingId ? "Edit Medicine" : "New Medicine Details"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Medicine Name</label>
              <input 
                placeholder="e.g. Dolo 650" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Brand</label>
              <input 
                placeholder="e.g. Micro Labs" 
                value={form.brand}
                onChange={e => setForm({...form, brand: e.target.value})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Batch Number</label>
              <input 
                placeholder="e.g. BATCH123" 
                value={form.batchNumber}
                onChange={e => setForm({...form, batchNumber: e.target.value})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Rack / Row</label>
              <input 
                placeholder="e.g. A1" 
                value={form.rackNumber}
                onChange={e => setForm({...form, rackNumber: e.target.value})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Composition (Generic)</label>
              <input 
                placeholder="e.g. Paracetamol 500mg" 
                value={form.composition}
                onChange={e => setForm({...form, composition: e.target.value})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Expiry Date</label>
              <input 
                type="date"
                value={form.expiryDate}
                onChange={e => setForm({...form, expiryDate: e.target.value})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Stock (Strips)</label>
              <input 
                type="number" 
                placeholder="0" 
                value={form.stock}
                onChange={e => setForm({...form, stock: e.target.value === "" ? "" : Number(e.target.value)})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tablets / Strip</label>
              <input 
                type="number" 
                placeholder="0" 
                value={form.tabletsPerStrip}
                onChange={e => setForm({...form, tabletsPerStrip: e.target.value === "" ? "" : Number(e.target.value)})}
                className="px-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Buying Price</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground text-sm">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.buyingPrice}
                  onChange={e => setForm({...form, buyingPrice: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="pl-7 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50 w-full"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Selling Price (MRP)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground text-sm">₹</span>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={form.sellingPrice}
                  onChange={e => setForm({...form, sellingPrice: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="pl-7 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground/50 w-full"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-medium rounded-lg py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? "Saving..." : "Save Medicine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, brand, batch or composition..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all text-foreground placeholder:text-muted-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 relative">
          
          {/* Sort Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setShowSort(!showSort); }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                sortConfig.key !== 'none' 
                ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                : 'border-border hover:bg-secondary text-foreground'
              }`}
            >
              <ArrowUpDown size={16} />
              Sort
            </button>

            {showSort && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
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
                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-between hover:bg-secondary transition-all ${
                      sortConfig.key === s.key ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                    {sortConfig.key === s.key && (
                      <ArrowUpDown size={12} className={sortConfig.direction === 'desc' ? 'rotate-180' : ''} />
                    )}
                  </button>
                ))}
                <button
                  onClick={() => { setSortConfig({ key: 'none', direction: 'asc' }); setShowSort(false); }}
                  className="w-full text-left px-4 py-2 rounded-lg text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all mt-1 border-t border-border"
                >
                  Reset Sort
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary/50 sticky top-0 border-b border-border z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Medicine Name</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Rack</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tablets</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Batch</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Cost</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">MRP</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence>
              {filteredMeds.map((med, index) => (
                <motion.tr 
                  key={med._id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="hover:bg-muted/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-semibold text-foreground text-sm">
                    {med.name}
                    <span className="block text-[10px] text-muted-foreground font-normal">{med.composition ? `${med.composition} • ` : ''}{med.brand}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{med.rackNumber || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-bold ${Number(med.stock) < 50 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                      {med.stock}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">STRIPS</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {med.totalTabletsInStock || (Number(med.stock) * Number(med.tabletsPerStrip)) || 0}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{med.batchNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={new Date(med.expiryDate) < new Date() ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-muted-foreground'}>
                      {med.expiryDate ? med.expiryDate.slice(0, 10) : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-muted-foreground">₹{Number(med.buyingPrice).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-right text-foreground">₹{Number(med.sellingPrice).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleEdit(med)}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(med._id!)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              </AnimatePresence>
              {filteredMeds.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No medicines found matching your search.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-secondary/30 border-t border-border flex items-center justify-between text-xs font-medium text-muted-foreground">
          <p>Showing {filteredMeds.length} medicines</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-card border border-border rounded shadow-sm disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 bg-primary text-primary-foreground border border-primary rounded shadow-sm">1</button>
            <button className="px-3 py-1 bg-card border border-border rounded shadow-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
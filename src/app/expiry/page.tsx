"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  ChevronLeft, 
  Calendar, 
  Package, 
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Clock,
  Hash
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { apiClient } from "@/src/lib/apiClient";

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
  category?: string;
  supplierName?: string;
  sellingPrice?: number;
  pack?: string;
  barcode?: string;
}

export default function ExpiryPage() {
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expired' | 'under30' | 'under60'>('expired');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  const handleToggleBatch = (batch: string) => {
    setSelectedBatches(prev => 
      prev.includes(batch) ? prev.filter(b => b !== batch) : [...prev, batch]
    );
  };

  const handleSelectAll = (batches: string[]) => {
    const allSelected = batches.length > 0 && batches.every(b => selectedBatches.includes(b));
    if (allSelected) {
      setSelectedBatches(prev => prev.filter(b => !batches.includes(b))); // deselect current tab's items
    } else {
      setSelectedBatches(prev => Array.from(new Set([...prev, ...batches]))); // select all in current tab, preserving others
    }
  };

  useEffect(() => {
    const fetchExpiryData = async () => {
      try {
        const handleData = (data: any) => {
          if (data) {
            const items = data?.data ? data.data : (Array.isArray(data) ? data : []);
            const validItems = items.filter((m: any) => m.expiryDate);
            setMedicines(validItems);
          }
          setLoading(false);
        };
        await apiClient.get('/api/inventory?limit=5000', {}, handleData).then(handleData);
      } catch (error) {
        console.error('Error fetching expiry data:', error);
        setLoading(false);
      }
    };
    fetchExpiryData();
  }, []);

  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  const sixtyDaysLater = new Date();
  sixtyDaysLater.setDate(today.getDate() + 60);

  const getCategoryStyles = (category?: string) => {
    switch(category?.toLowerCase()) {
      case "pain relief": return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40";
      case "antibiotic": return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40";
      case "antihistamine": return "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40";
      case "wellness": return "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-900/40";
      case "supplements": return "bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-300 border border-fuchsia-100 dark:border-fuchsia-900/40";
      case "gastric care": return "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 border border-teal-100 dark:border-teal-900/40";
      default: return "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40";
    }
  };

  const expiredItems = medicines.filter(med => new Date(med.expiryDate) < today);
  const under30Items = medicines.filter(med => {
    const date = new Date(med.expiryDate);
    return date >= today && date < thirtyDaysLater;
  });
  const under60Items = medicines.filter(med => {
    const date = new Date(med.expiryDate);
    return date >= today && date < sixtyDaysLater;
  });

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'expired': return expiredItems;
      case 'under30': return under30Items;
      case 'under60': return under60Items;
      default: return expiredItems;
    }
  };

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="skeleton w-11 h-11 rounded-2xl" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-44" />
            <div className="skeleton h-3.5 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        {/* Tab Switcher */}
        <div className="flex bg-muted/70 p-1 rounded-xl border border-border">
          {(['expired', 'under30', 'under60'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab 
                ? 'bg-card text-primary shadow-sm border border-border' 
                : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'expired' ? 'Expired' : tab === 'under30' ? '30 Days' : '60 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setActiveTab('expired')}
          className={`p-5 rounded-2xl border transition-all flex items-center gap-4 text-left group cursor-pointer ${
            activeTab === 'expired' 
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 shadow-card' 
            : 'surface-card surface-hover hover:border-red-200 dark:hover:border-red-900/60'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === 'expired' ? 'bg-gradient-to-br from-rose-500 to-red-400 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]' : 'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400'
          }`}>
             <AlertCircle size={23} strokeWidth={2.3} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Status: Expired</p>
            <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{expiredItems.length} Products</h2>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('under30')}
          className={`p-5 rounded-2xl border transition-all flex items-center gap-4 text-left group cursor-pointer ${
            activeTab === 'under30' 
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 shadow-card' 
            : 'surface-card surface-hover hover:border-amber-200 dark:hover:border-amber-900/60'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === 'under30' ? 'bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400'
          }`}>
             <Clock size={23} strokeWidth={2.3} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Status: &lt; 30 Days</p>
            <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{under30Items.length} Products</h2>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('under60')}
          className={`p-5 rounded-2xl border transition-all flex items-center gap-4 text-left group cursor-pointer ${
            activeTab === 'under60' 
            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 shadow-card' 
            : 'surface-card surface-hover hover:border-blue-200 dark:hover:border-blue-900/60'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
            activeTab === 'under60' ? 'bg-gradient-to-br from-[#11327c] to-[#1e58b8] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]' : 'bg-blue-50 dark:bg-blue-950/40 text-[#11327c] dark:text-blue-400'
          }`}>
             <Calendar size={23} strokeWidth={2.3} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Status: &lt; 60 Days</p>
            <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{under60Items.length} Products</h2>
          </div>
        </button>
      </div>

      {/* Main List Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-shell">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="th text-center w-12">
                   <div 
                      onClick={() => handleSelectAll(filteredItems.map(m => m.batchNumber))}
                      className="w-5 h-5 rounded border-2 border-input flex items-center justify-center cursor-pointer hover:border-primary transition-all bg-card mx-auto"
                   >
                     {filteredItems.length > 0 && filteredItems.every(m => selectedBatches.includes(m.batchNumber)) && <div className="w-2.5 h-2.5 bg-primary rounded-sm" />}
                     {filteredItems.length > 0 && !filteredItems.every(m => selectedBatches.includes(m.batchNumber)) && filteredItems.some(m => selectedBatches.includes(m.batchNumber)) && <div className="w-2.5 h-0.5 bg-primary rounded-sm" />}
                   </div>
                </th>
                <th className="th">Product Name & Pack</th>
                <th className="th">Category</th>
                <th className="th">Company / Supplier</th>
                <th className="th">Batch No.</th>
                <th className="th">Expiry Date</th>
                <th className="th text-right">MRP (₹)</th>
                <th className="th text-center">Physical Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length > 0 ? (
                filteredItems.map((med, idx) => {
                  const isExpired = new Date(med.expiryDate) < today;
                  return (
                    <tr key={med._id} className={`transition-all group ${selectedBatches.includes(med.batchNumber) ? 'bg-primary/5' : 'tbody-row'}`} style={{ animationDelay: `${idx * 20}ms` }}>
                      <td className="td text-center">
                         <div 
                            onClick={() => handleToggleBatch(med.batchNumber)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all mx-auto ${selectedBatches.includes(med.batchNumber) ? 'border-primary bg-primary' : 'border-input bg-card hover:border-primary'}`}
                         >
                           {selectedBatches.includes(med.batchNumber) && <CheckCircle2 size={14} className="text-white" strokeWidth={4} />}
                         </div>
                      </td>
                      <td className="td">
                         <div className="text-[13px] font-extrabold text-foreground tracking-tight mb-0.5 line-clamp-1">{med.name}</div>
                         <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{med.pack || 'Unit'} • {med.barcode || 'NO BARCODE'}</div>
                      </td>
                      <td className="td">
                         <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${getCategoryStyles(med.category || 'Tablet')}`}>
                           {med.category || 'Tablet'}
                         </span>
                      </td>
                      <td className="td">
                         <div className="text-[13px] font-bold text-foreground line-clamp-1">{med.brand || "Generics"}</div>
                         <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 line-clamp-1">{med.supplierName || "Direct"}</div>
                      </td>
                      <td className="td">
                         <span className="text-[12px] font-bold text-foreground font-mono tracking-wider bg-muted px-2 py-1 rounded border border-border">
                           {med.batchNumber}
                         </span>
                      </td>
                      <td className="td">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-orange-500'}`} />
                           <span className={`text-[13px] font-bold tracking-tight ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                             {format(new Date(med.expiryDate), "dd MMM, yyyy")}
                           </span>
                         </div>
                      </td>
                      <td className="td text-right tabular-nums">
                         <div className="text-[13px] font-bold text-foreground">{Number(med.sellingPrice || 0).toFixed(2)}</div>
                      </td>
                      <td className="td text-center">
                         <div className="inline-flex flex-col items-center justify-center bg-muted border border-border px-3 py-1.5 rounded-xl">
                           <span className="font-display text-[14px] font-extrabold text-foreground tracking-tighter leading-none">{med.stock}</span>
                           <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Units</span>
                         </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-24 text-center">
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                          <CheckCircle2 size={30} strokeWidth={2} className="text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-foreground font-bold text-sm tracking-wide">Healthy Inventory</p>
                          <p className="text-muted-foreground font-medium text-xs">No items detected in this category</p>
                        </div>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Button for Debit Note */}
      {selectedBatches.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-full shadow-pop flex items-center gap-5 animate-fade-in z-50 bg-[linear-gradient(160deg,oklch(0.24_0.09_262)_0%,oklch(0.33_0.12_262)_50%,oklch(0.44_0.19_255)_115%)] text-white">
           <div className="flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">{selectedBatches.length}</span>
             <span className="text-sm font-bold uppercase tracking-widest text-blue-100">Batches Selected</span>
           </div>
           <div className="w-px h-8 bg-white/20" />
           <button 
             onClick={() => router.push(`/supplier-returns/new?batches=${selectedBatches.join(',')}`)}
             className="flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:text-orange-400 transition-colors"
           >
             Create Debit Note <ArrowRight size={18} strokeWidth={3} />
           </button>
        </div>
      )}
    </div>
  );
}
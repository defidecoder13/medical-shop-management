"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, 
  PackageOpen, 
  ChevronLeft, 
  ArrowRight, 
  Package, 
  Tag, 
  Hash, 
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck
} from "@/src/components/icons";
import Link from "next/link";
import { apiClient } from "@/src/lib/apiClient";
import { format } from "date-fns";

// Safe date formatting: empty or invalid dates render as "N/A" instead of crashing.
const safeFormat = (date?: string, pattern = "MMM dd, yyyy") => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : format(d, pattern);
};

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
}

export default function LowStockPage() {
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockData = async () => {
      try {
        const handleData = (data: any) => {
          if (data && Array.isArray(data)) {
            // Dead stock = 0 or less (even 1 tablet = not dead). Hide dead everywhere.
            const lowStockItems = data.filter((med: Medicine) => Number(med.stock) > 0 && Number(med.stock) <= 10);
            setLowStockMedicines(lowStockItems);
          }
          setLoading(false);
        };
        // Hide dead stock at server too for speed
        await apiClient.get('/api/inventory?inStock=true', {}, handleData).then(handleData);
      } catch (error) {
        console.error('Error fetching low stock data:', error);
        setLoading(false);
      }
    };

    fetchLowStockData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-6">
          <div className="skeleton h-10 rounded-xl w-48" />
          <div className="skeleton h-28 rounded-2xl w-full" />
          <div className="space-y-3">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="skeleton h-14 rounded-xl w-full" />
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto">
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <div className="flex gap-3">
           <Link 
             href="/inventory"
             className="btn-primary btn-md"
           >
              <Layers className="w-4 h-4" strokeWidth={2.5} />
              Inventory Manager
           </Link>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-5 rounded-xl border flex items-center justify-between gap-4 ${lowStockMedicines.length > 0 ? 'bg-warning/10 border-warning/20' : 'bg-success/10 border-success/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${lowStockMedicines.length > 0 ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}`}>
            {lowStockMedicines.length > 0 ? <AlertTriangle size={18} strokeWidth={2} /> : <CheckCircle2 size={18} strokeWidth={2} />}
          </div>
          <div>
             <h2 className="text-[15px] font-semibold tracking-tight">
               {lowStockMedicines.length > 0 
                ? `${lowStockMedicines.length} items need restock` 
                : "All stock levels healthy"}
             </h2>
             <p className="text-[12px] text-muted-foreground">
               {lowStockMedicines.length > 0 ? 'Threshold: 10 units' : 'No action required'}
             </p>
          </div>
        </div>
        {lowStockMedicines.length > 0 && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-warning text-warning-foreground px-3 py-1 text-xs font-medium">Action needed</span>
        )}
      </div>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
           <h2 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="text-muted-foreground w-4 h-4" strokeWidth={2} />
              Low Stock List
           </h2>
           <div className="relative group w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                placeholder="Filter..."
                className="input h-9 pl-9 w-full sm:w-64"
              />
           </div>
        </div>

        {lowStockMedicines.length > 0 ? (
          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-shell">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="th">Medicine & Batch</th>
                    <th className="th">Manufacturer</th>
                    <th className="th text-center">Status</th>
                    <th className="th text-right">Available</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {lowStockMedicines.map((med) => (
                    <tr 
                      key={med._id} 
                      className="tbody-row group"
                    >
                      <td className="td">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                            med.stock <= 5 ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                          }`}>
                            <Package className="w-5.5 h-5.5" strokeWidth={2} />
                          </div>
                          <div>
                             <div className="font-extrabold text-foreground uppercase text-[13px] tracking-tight">{med.name}</div>
                             <div className="text-[10px] font-bold text-muted-foreground mt-1 flex items-center gap-2">
                               <Hash className="w-3 h-3" strokeWidth={2.5} />
                               Batch: <span className="text-foreground font-mono">{med.batchNumber}</span>
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                         <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-foreground uppercase">{med.brand || "Generics"}</span>
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 mt-1.5 uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5" />
                              Exp: {safeFormat(med.expiryDate)}
                            </span>
                         </div>
                      </td>
                      <td className="td text-center">
                         <span className={med.stock <= 5 ? "badge-danger" : "badge-warning"}>
                           {med.stock <= 5 ? "Critical" : "Warning"}
                         </span>
                      </td>
                      <td className="td text-right">
                         <div className="flex flex-col items-end">
                            <span className={`font-display text-2xl font-extrabold tracking-tighter leading-none ${med.stock <= 5 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                              {med.stock}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">Strips</span>
                         </div>
                      </td>
                      <td className="td text-right">
                         <Link 
                           href={`/billing?add=${med._id}`}
                           className="btn-outline btn-sm text-primary border-primary/25 bg-primary/5 hover:bg-primary hover:text-primary-foreground"
                         >
                           + Bill
                           <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.6} />
                         </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="surface-card p-16 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-success/10 rounded-3xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={2.4} />
             </div>
             <h3 className="font-display text-xl font-extrabold text-foreground tracking-tight">Catalog Optimized</h3>
             <p className="text-muted-foreground font-medium text-sm max-w-sm mt-3 leading-relaxed">Great news! All medicines are currently maintaining inventory levels above the warning threshold.</p>
             <Link 
               href="/inventory"
               className="btn-primary btn-lg mt-8"
             >
               View All Products
             </Link>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-center pt-6 pb-4">
         <div className="px-5 py-2.5 bg-muted/60 rounded-xl border border-border text-[11px] text-muted-foreground font-bold flex items-center gap-3 uppercase tracking-wider">
           <AlertCircle className="w-4 h-4 text-amber-400" />
           Threshold: <span className="text-foreground">10 Units</span> <span className="opacity-30">/</span> Smart Alerts <span className="text-emerald-500 dark:text-emerald-400">Active</span>
         </div>
      </div>
    </div>
  );
}
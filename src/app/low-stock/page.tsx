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
} from "lucide-react";
import Link from "next/link";

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

  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockData = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          // Filter for medicines with stock <= 10 (low stock threshold)
          const lowStockItems = data.filter((med: Medicine) => med.stock <= 10);
          setLowStockMedicines(lowStockItems);
        }
      } catch (error) {
        console.error('Error fetching low stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
            <div className="space-y-4">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-amber-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <PackageOpen className="text-amber-600 w-8 h-8" />
                Stock Alerts
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor items nearing depletion</p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <Link 
               href="/inventory"
               className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl font-bold transition-all border border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-900/50 shadow-sm"
             >
                <Layers className="w-4 h-4 text-amber-600" />
                Inventory Manager
             </Link>
          </div>
        </div>

        {/* Big Alert Hero */}
        <div className={`relative glass-panel p-8 md:p-12 rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-br transition-all duration-700 ${
          lowStockMedicines.length > 0 
          ? 'from-amber-600 to-amber-700 text-white' 
          : 'from-emerald-600 to-emerald-700 text-white'
        }`}>
          <div className="absolute -top-12 -right-12 p-12 opacity-10 pointer-events-none rotate-12">
            {lowStockMedicines.length > 0 ? <AlertTriangle className="w-64 h-64" /> : <CheckCircle2 className="w-64 h-64" />}
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-white/70 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                 {lowStockMedicines.length > 0 ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                 System Health Status
               </div>
               <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                 {lowStockMedicines.length > 0 
                  ? `${lowStockMedicines.length} Items Low on Stock` 
                  : "All Units Optimized"}
               </h2>
               <p className="text-lg text-white/80 font-medium max-w-xl">
                 {lowStockMedicines.length > 0 
                  ? "Immediate restock recommended for these critical items to avoid service disruption." 
                  : "Inventory levels are currently within safe operational thresholds. No action needed."}
               </p>
            </div>
            
            {lowStockMedicines.length > 0 && (
              <div className="bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/20 min-w-[200px] text-center">
                 <div className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Restock Priority</div>
                 <div className="text-4xl font-black">HIGH</div>
                 <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-white/80">
                    <Truck className="w-4 h-4" />
                    Pending Shipments: 0
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Medicines List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <AlertTriangle className="text-amber-500 w-6 h-6" />
                Critical Stock List
             </h2>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  placeholder="Filter alerts..."
                  className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
             </div>
          </div>

          {lowStockMedicines.length > 0 ? (
            <div className="glass-panel rounded-3xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100/50 dark:border-amber-800/30">
                      <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">Medicine & Batch</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">Catalog</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest text-right">Current Units</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {lowStockMedicines.map((med, idx) => (
                      <tr 
                        key={med._id} 
                        className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100/50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Package className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                               <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{med.name}</div>
                               <div className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1.5 leading-none">
                                 <Hash className="w-3 h-3" />
                                 {med.batchNumber}
                               </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-gray-600 dark:text-gray-400">
                           <div className="flex flex-col">
                              <span>{med.brand || "Generics"}</span>
                              <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                Exp: {new Date(med.expiryDate).toLocaleDateString()}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                             {med.stock <= 5 ? "Critical" : "Warning"}
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex flex-col items-end">
                              <span className={`text-xl font-black leading-none ${med.stock <= 5 ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`}>
                                {med.stock}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Strips LEFT</span>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <Link 
                             href="/inventory"
                             className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
                           >
                             Manage
                             <ArrowRight className="w-3.5 h-3.5" />
                           </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-[2.5rem] p-20 text-center border border-white/20 shadow-xl flex flex-col items-center">
               <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
               </div>
               <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Inventory Healthy</h3>
               <p className="text-gray-500 font-medium max-w-sm mt-2">All medicines are currently above the low stock threshold.</p>
               <Link 
                 href="/inventory"
                 className="mt-8 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all"
               >
                 View All Inventory
               </Link>
            </div>
          )}
        </div>

        {/* Action Footnote */}
        <div className="flex justify-center pt-4 pb-12">
           <p className="text-xs text-gray-400 font-medium flex items-center gap-2">
             <AlertCircle className="w-3.5 h-3.5" />
             Threshold is currently set to 10 strips. Adjust in settings if required.
           </p>
        </div>

      </div>
    </div>
  );
}
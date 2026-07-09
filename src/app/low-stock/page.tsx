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
import { apiClient } from "@/src/lib/apiClient";
import { format } from "date-fns";

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
            const lowStockItems = data.filter((med: Medicine) => med.stock <= 10);
            setLowStockMedicines(lowStockItems);
          }
          setLoading(false);
        };
        await apiClient.get('/api/inventory', {}, handleData).then(handleData);
      } catch (error) {
        console.error('Error fetching low stock data:', error);
        setLoading(false);
      }
    };

    fetchLowStockData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded-xl w-48"></div>
            <div className="h-32 bg-gray-200 rounded-3xl w-full"></div>
            <div className="space-y-4">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="h-16 bg-gray-200 rounded-2xl w-full"></div>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link 
            href="/"
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-[#11327c] hover:border-[#11327c]/20 transition-all shadow-sm group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-[28px] font-black text-[#11327c] tracking-tight">
              Stock Alerts
            </h1>
            <p className="text-[13px] text-gray-500 font-medium">Monitor items nearing depletion</p>
          </div>
        </div>
        
        <div className="flex gap-3">
           <Link 
             href="/inventory"
             className="flex items-center gap-2 px-6 py-3 bg-[#11327c] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-[#1e4db7] shadow-lg shadow-[#11327c]/20"
           >
              <Layers className="w-4 h-4" strokeWidth={2.5} />
              Inventory Manager
           </Link>
        </div>
      </div>

      {/* Minimal Status Banner */}
      <div className="relative p-8 rounded-[32px] border border-gray-100 shadow-[0_15px_45px_-15px_rgba(17,50,124,0.1)] overflow-hidden bg-white">
        <div className="absolute -right-6 -top-6 opacity-[0.03] pointer-events-none text-[#11327c]">
          {lowStockMedicines.length > 0 ? <AlertTriangle className="w-48 h-48" /> : <CheckCircle2 className="w-48 h-48" />}
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${lowStockMedicines.length > 0 ? 'bg-orange-50 text-orange-500' : 'bg-emerald-50 text-emerald-500'}`}>
              {lowStockMedicines.length > 0 ? <AlertTriangle className="w-8 h-8" strokeWidth={2.5} /> : <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />}
            </div>
            <div>
               <h2 className="text-3xl font-black text-[#11327c] tracking-tight">
                 {lowStockMedicines.length > 0 
                  ? `${lowStockMedicines.length} Critical Stock Alerts` 
                  : "Inventory Healthy"}
               </h2>
               <p className="text-[13px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                 System Status: <span className={lowStockMedicines.length > 0 ? 'text-orange-500' : 'text-emerald-500'}>
                   {lowStockMedicines.length > 0 ? 'Restock Required' : 'Optimal'}
                 </span>
               </p>
            </div>
          </div>
          
          {lowStockMedicines.length > 0 && (
            <div className="flex items-center gap-3 px-6 py-3 bg-[#f8fafc] rounded-2xl border border-gray-100">
               <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Priority:</div>
               <div className="text-sm font-black text-orange-600 uppercase">High</div>
            </div>
          )}
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2">
           <h2 className="text-[16px] sm:text-[18px] font-black text-[#11327c] uppercase tracking-widest flex items-center gap-3">
              <AlertCircle className="text-orange-500 w-5 h-5 shrink-0" strokeWidth={3} />
              Critical Shortage List
           </h2>
           <div className="relative group w-full sm:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#11327c] transition-colors" />
              <input 
                placeholder="Filter alerts..."
                className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all w-full sm:w-64 shadow-sm"
              />
           </div>
        </div>

        {lowStockMedicines.length > 0 ? (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-gray-50">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Medicine & Batch</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Manufacturer</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Available</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lowStockMedicines.map((med, idx) => (
                    <tr 
                      key={med._id} 
                      className="hover:bg-[#f8fafc]/50 transition-all group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                            med.stock <= 5 ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'
                          }`}>
                            <Package className="w-6 h-6" strokeWidth={2} />
                          </div>
                          <div>
                             <div className="font-black text-[#11327c] uppercase text-[13px] tracking-tight">{med.name}</div>
                             <div className="text-[10px] font-black text-gray-400 mt-1 flex items-center gap-2">
                               <Hash className="w-3 h-3" strokeWidth={2.5} />
                               BATCH: <span className="text-gray-500 font-mono">{med.batchNumber}</span>
                             </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className="text-[13px] font-black text-[#11327c]/70 uppercase">{med.brand || "Generics"}</span>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-2 mt-1.5 uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5" />
                              Exp: {format(new Date(med.expiryDate), "MMM dd, yyyy")}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                           med.stock <= 5 
                           ? 'bg-rose-50 text-rose-700 border-rose-100' 
                           : 'bg-orange-50 text-orange-700 border-orange-100'
                         }`}>
                           {med.stock <= 5 ? "Critical" : "Warning"}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex flex-col items-end">
                            <span className={`text-2xl font-black tracking-tighter leading-none ${med.stock <= 5 ? 'text-rose-600' : 'text-orange-600'}`}>
                              {med.stock}
                            </span>
                            <span className="text-[9px] font-black text-gray-300 uppercase mt-1 tracking-widest">Strips</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <Link 
                           href={`/billing?add=${med._id}`}
                           className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                         >
                           + Bill
                           <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
                         </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)] flex flex-col items-center">
             <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-8 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={2.5} />
             </div>
             <h3 className="text-2xl font-black text-[#11327c] uppercase tracking-tight">Catalog Optimized</h3>
             <p className="text-gray-400 font-medium text-sm max-w-sm mt-3 leading-relaxed">Great news! All medicines are currently maintaining inventory levels above the warning threshold.</p>
             <Link 
               href="/inventory"
               className="mt-10 px-10 py-4 bg-[#11327c] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-[#11327c]/20 hover:scale-105 active:scale-95 transition-all"
             >
               View All Products
             </Link>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-center pt-10 pb-6">
         <div className="px-5 py-2.5 bg-[#f8fafc] rounded-xl border border-gray-100 text-[11px] text-gray-400 font-bold flex items-center gap-3 uppercase tracking-wider">
           <AlertCircle className="w-4 h-4 text-orange-400" />
           Threshold: <span className="text-[#11327c]">10 Units</span> <span className="opacity-20">/</span> Smart Alerts <span className="text-emerald-500">Active</span>
         </div>
      </div>
    </div>
  );
}
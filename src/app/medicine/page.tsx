"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { 
  Package, 
  ChevronLeft, 
  FileSpreadsheet, 
  Download, 
  Tag, 
  Calendar, 
  Boxes, 
  CircleDollarSign,
  Search,
  History,
  Info
} from "lucide-react";
import Link from "next/link";

type Medicine = {
  _id: string;
  name: string;
  brand: string;
  batchNumber: string;
  expiryDate: string;
  stockQuantity: number;
  unitType: "strip" | "tablet" | "capsule";
  buyingPrice: number;
  sellingPrice: number;
};

export default function MedicineListPage() {
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => {
        setMedicines(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToExcel = () => {
    if (medicines.length === 0) return;
    
    const formattedMedicines = medicines.map(m => ({
      'Name': m.name,
      'Brand': m.brand,
      'Batch': m.batchNumber,
      'Expiry': new Date(m.expiryDate).toLocaleDateString(),
      'Stock': m.stockQuantity,
      'Unit Type': m.unitType,
      'Buying Price': `₹${m.buyingPrice}`,
      'Selling Price': `₹${m.sellingPrice}`
    }));
    
    const ws = XLSX.utils.json_to_sheet(formattedMedicines);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicines");
    XLSX.writeFile(wb, `Medicines_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8 animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Package className="text-blue-600 w-8 h-8" />
                Medicine Catalog
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and export your full inventory database</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input 
                placeholder="Search catalog..."
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 pl-10 pr-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={exportToExcel}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 group"
            >
              <FileSpreadsheet className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Database Export
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="glass-panel rounded-3xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100/50 dark:border-blue-800/30">
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest">Active Ingredient / Brand</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest text-center">Batch & Expiry</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest text-right">Available Stock</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest text-right">Pricing (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filteredMedicines.map((m, idx) => {
                   const isExpired = new Date(m.expiryDate) < new Date();
                   return (
                    <tr 
                      key={m._id} 
                      className="hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-blue-50 dark:bg-blue-900/20'} group-hover:scale-110 transition-transform`}>
                            <Boxes className={`w-5 h-5 ${isExpired ? 'text-rose-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                              {m.name}
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <Tag className="w-3 h-3" />
                              {m.brand || "Generics"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <div className="flex flex-col items-center">
                            <div className="text-xs font-black text-gray-700 dark:text-gray-300">
                               {m.batchNumber}
                            </div>
                            <div className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full ${isExpired ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>
                               <Calendar className="w-3 h-3" />
                               {new Date(m.expiryDate).toLocaleDateString()}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                               <span className={`text-lg font-black ${m.stockQuantity <= 10 ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                                 {m.stockQuantity}
                               </span>
                               <span className="text-[10px] font-bold text-gray-400 uppercase">{m.unitType}s</span>
                            </div>
                            {m.stockQuantity <= 10 && (
                               <div className="text-[9px] font-black text-amber-600 uppercase tracking-tighter animate-pulse flex items-center gap-1 pt-1">
                                  <Info className="w-2.5 h-2.5" />
                                  Replenish Required
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                               <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
                               <span className="text-base font-black text-gray-900 dark:text-white">
                                 {(m.sellingPrice || 0).toFixed(2)}
                               </span>
                            </div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest decoration-emerald-500/30">
                               Cost: ₹{(m.buyingPrice || 0).toFixed(2)}
                            </div>
                         </div>
                      </td>
                    </tr>
                   );
                })}

                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-24 text-center">
                       <div className="flex flex-col items-center opacity-30">
                          <Search className="w-12 h-12 mb-3" />
                          <p className="font-bold text-xl uppercase tracking-tighter">No Catalog Matches</p>
                          <p className="text-sm">Try using different search keywords</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Statistics */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Database Items: {medicines.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Sellable: {medicines.filter(m => m.stockQuantity > 0).length}</span>
              </div>
           </div>
           <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2 italic">
              <History className="w-3 h-3" />
              Catalog synced with central server last 5 mins ago
           </p>
        </div>

      </div>
    </div>
  );
}
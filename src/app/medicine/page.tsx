"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/src/lib/apiClient";
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
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleData = (data: any) => {
      setMedicines(data);
      setLoading(false);
    };
    apiClient.get("/api/inventory", {}, handleData)
      .then(handleData)
      .catch(() => setLoading(false));
  }, []);

  const filteredMedicines = medicines.filter(m => {
    if (!searchQuery) return true;
    const queryTerms = searchQuery.toLowerCase().split(/\s+/).map(t => t.replace(/[^a-z0-9]/g, "")).filter(Boolean);
    const rawSearchString = `${m.name} ${m.brand} ${m.batchNumber}`;
    const cleanSearchString = rawSearchString.toLowerCase().replace(/[^a-z0-9]/g, "");
    return queryTerms.every(term => cleanSearchString.includes(term));
  });

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
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="skeleton h-10 rounded-xl w-48" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Package size={22} strokeWidth={2.3} />
            </span>
            <div>
              <h1 className="font-display text-[22px] font-extrabold text-foreground tracking-tight">
                Medicine Catalog
              </h1>
              <p className="text-[13px] text-muted-foreground font-medium mt-0.5">Manage and export your full inventory database</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                placeholder="Search catalog..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={exportToExcel}
              className="btn-success btn-md w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Database Export
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="surface-card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="th">Active Ingredient / Brand</th>
                  <th className="th text-center">Batch & Expiry</th>
                  <th className="th text-right">Available Stock</th>
                  <th className="th text-right">Pricing (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredMedicines.map((m, idx) => {
                   const isExpired = new Date(m.expiryDate) < new Date();
                   return (
                    <tr 
                      key={m._id} 
                      className="tbody-row group"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td className="td">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-red-50 dark:bg-red-950/40' : 'bg-primary/10'} group-hover:scale-105 transition-transform`}>
                            <Boxes className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-primary'}`} />
                          </div>
                          <div>
                            <div className="font-bold text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                              {m.name}
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Tag className="w-3 h-3" />
                              {m.brand || "Generics"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="td text-center">
                         <div className="flex flex-col items-center">
                            <div className="text-xs font-bold text-foreground">
                               {m.batchNumber}
                            </div>
                            <div className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : 'bg-muted text-muted-foreground'}`}>
                               <Calendar className="w-3 h-3" />
                               {new Date(m.expiryDate).toLocaleDateString()}
                            </div>
                         </div>
                      </td>
                      <td className="td text-right">
                         <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                               <span className={`font-display text-lg font-extrabold ${m.stockQuantity <= 10 ? 'text-amber-500' : 'text-foreground'}`}>
                                 {m.stockQuantity}
                               </span>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">{m.unitType}s</span>
                            </div>
                            {m.stockQuantity <= 10 && (
                               <div className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter animate-pulse flex items-center gap-1 pt-1">
                                  <Info className="w-2.5 h-2.5" />
                                  Replenish Required
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="td text-right">
                         <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                               <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
                               <span className="font-display text-base font-extrabold text-foreground">
                                 {(m.sellingPrice || 0).toFixed(2)}
                               </span>
                            </div>
                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                               Cost: ₹{(m.buyingPrice || 0).toFixed(2)}
                            </div>
                         </div>
                      </td>
                    </tr>
                   );
                })}

                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                       <div className="flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                            <Search className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="font-bold text-lg tracking-tight text-foreground">No Catalog Matches</p>
                          <p className="text-sm text-muted-foreground font-medium">Try using different search keywords</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Statistics */}
        <div className="surface-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Database Items: {medicines.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Active Sellable: {medicines.filter(m => m.stockQuantity > 0).length}</span>
              </div>
           </div>
           <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
              <History className="w-3 h-3" />
              Catalog synced with central server last 5 mins ago
           </p>
        </div>

      </div>
    </div>
  );
}
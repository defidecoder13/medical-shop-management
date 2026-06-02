"use client";

import { useEffect, useState, Suspense } from "react";
import { AlertCircle, AlertTriangle, Printer, Loader2, PackageX, IndianRupee, TrendingDown, Search, X } from "lucide-react";
import { useDebounce } from "@/src/hooks/use-debounce";
import { apiClient } from "@/src/lib/apiClient";

export default function ShortagePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading Shortage Tracker...</div>}>
      <ShortageContent />
    </Suspense>
  );
}

function ShortageContent() {
  const [shortages, setShortages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    apiClient.get(`/api/inventory?q=${debouncedSearch}`)
      .then((res: any) => {
         // Handle both legacy array and new paginated object
         const data = Array.isArray(res) ? res : (res?.data || []);
         // Deduplicate medicines to just show master stock
         const uniqueMeds = new Map();
         data.forEach((batch: any) => {
             if (!uniqueMeds.has(batch.medicineId)) {
                 uniqueMeds.set(batch.medicineId, {
                     name: batch.name,
                     brand: batch.brand,
                     stock: batch.stock || 0
                 });
             } else {
                 uniqueMeds.get(batch.medicineId).stock += (batch.stock || 0);
             }
         });
         setSearchResults(Array.from(uniqueMeds.values()));
      })
      .catch((err) => console.error(err))
      .finally(() => setSearching(false));
  }, [debouncedSearch]);

  useEffect(() => {
    fetchShortages();
  }, []);

  const fetchShortages = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/inventory/shortage');
      if (Array.isArray(data)) {
          setShortages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const criticalCount = shortages.filter(s => s.currentStock <= 0).length;
  const estimatedCost = shortages.reduce((acc, s) => acc + (s.reorderQty * (s.buyingPrice || 0)), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto print:p-0 print:max-w-full">
      {/* Header - Hidden on Print */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Shortage Tracker</h1>
          <p className="text-gray-500 mt-1">Analytics and overview of your low stock medicines</p>
        </div>
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Check stock of any medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Autocomplete Dropdown */}
          {searchQuery.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-sm text-gray-500 flex justify-center items-center gap-2">
                   <Loader2 size={16} className="animate-spin" /> Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.brand}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Current Stock</div>
                        <div className={`font-bold text-lg ${item.stock <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                           {item.stock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">No medicines found.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Print Header - Visible only on Print */}
      <div className="hidden print:block mb-6 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-black uppercase text-center">Shortage Report</h1>
        <div className="flex justify-between mt-2 text-sm font-semibold">
           <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
           <span>Time: {new Date().toLocaleTimeString('en-IN')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:hidden">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
               <TrendingDown size={64} />
           </div>
           <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Shortages</p>
           <h3 className="text-4xl font-black text-gray-900">{shortages.length}</h3>
           <p className="text-xs text-gray-500 mt-2 font-medium">Items below minimum stock</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6 flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600">
               <AlertCircle size={64} />
           </div>
           <p className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-1">Critical Stock</p>
           <h3 className="text-4xl font-black text-red-700">{criticalCount}</h3>
           <p className="text-xs text-red-600 mt-2 font-medium">Items completely out of stock</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse print:border-[1.5px] print:border-black">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 print:bg-gray-200 print:border-black">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:py-2 print:border-[1.5px] print:border-black print:text-black">Medicine</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:py-2 print:border-[1.5px] print:border-black print:text-black">Current Stock</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:py-2 print:border-[1.5px] print:border-black print:text-black">Min Req.</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:px-2 print:py-2 print:border-[1.5px] print:border-black print:text-black">Rec. Order Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-black">
              {shortages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <PackageX size={48} className="mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">Inventory looks healthy!</p>
                      <p className="text-sm">No items are currently running low on stock.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                shortages.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 print:px-2 print:py-1 print:border-[1.5px] print:border-black">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.brand} • {item.category}</div>
                    </td>
                    <td className="px-6 py-4 print:px-2 print:py-1 print:border-[1.5px] print:border-black">
                      <div className="font-bold text-gray-900">
                        {item.currentStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 print:px-2 print:py-1 print:border-[1.5px] print:border-black">
                      <div className="font-medium text-gray-600">{item.minStockLevel}</div>
                    </td>
                    <td className="px-6 py-4 print:px-2 print:py-1 print:border-[1.5px] print:border-black">
                      <div className="font-bold text-blue-600">{item.reorderQty}</div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

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
    const checkAuth = async () => {
      try {
        const res = await apiClient.get('/api/auth/check');
        if (!res) router.push('/login');
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
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
        const data = await apiClient.get('/api/inventory?limit=5000');
        if (data) {
          const items = data?.data ? data.data : (Array.isArray(data) ? data : []);
          const validItems = items.filter((m: any) => m.expiryDate);
          setMedicines(validItems);
        }
      } catch (error) {
        console.error('Error fetching expiry data:', error);
      } finally {
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
      case "pain relief": return "bg-indigo-50 text-indigo-600 border border-indigo-100";
      case "antibiotic": return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "antihistamine": return "bg-purple-50 text-purple-600 border border-purple-100";
      case "wellness": return "bg-orange-50 text-orange-600 border border-orange-100";
      case "supplements": return "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100";
      case "gastric care": return "bg-teal-50 text-teal-600 border border-teal-100";
      default: return "bg-blue-50 text-blue-600 border border-blue-100";
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
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-[1400px] mx-auto px-6 space-y-8 animate-pulse">
          <div className="h-10 bg-gray-100 rounded-xl w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-24 bg-gray-100 rounded-[24px]"></div>
            <div className="h-24 bg-gray-100 rounded-[24px]"></div>
            <div className="h-24 bg-gray-100 rounded-[24px]"></div>
          </div>
          <div className="h-96 bg-gray-100 rounded-[40px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
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
            <h1 className="text-[28px] font-black text-[#11327c] tracking-tight">Expiry Tracker</h1>
            <p className="text-[13px] text-gray-500 font-medium">Proactively manage products nearing end-of-life</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
          {(['expired', 'under30', 'under60'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-[#11327c] text-white shadow-lg' 
                : 'text-gray-400 hover:text-[#11327c] hover:bg-white'
              }`}
            >
              {tab === 'expired' ? 'Expired' : tab === 'under30' ? '30 Days' : '60 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => setActiveTab('expired')}
          className={`p-6 rounded-[32px] border transition-all flex items-center gap-5 text-left group ${
            activeTab === 'expired' 
            ? 'bg-rose-50 border-rose-100 shadow-[0_15px_40px_-10px_rgba(225,29,72,0.1)]' 
            : 'bg-white border-gray-100 hover:border-rose-200'
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            activeTab === 'expired' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'
          }`}>
             <AlertCircle size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Status: Expired</p>
            <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{expiredItems.length} Products</h2>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('under30')}
          className={`p-6 rounded-[32px] border transition-all flex items-center gap-5 text-left group ${
            activeTab === 'under30' 
            ? 'bg-orange-50 border-orange-100 shadow-[0_15px_40px_-10px_rgba(249,115,22,0.1)]' 
            : 'bg-white border-gray-100 hover:border-orange-200'
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            activeTab === 'under30' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-500'
          }`}>
             <Clock size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Status: &lt; 30 Days</p>
            <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{under30Items.length} Products</h2>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('under60')}
          className={`p-6 rounded-[32px] border transition-all flex items-center gap-5 text-left group ${
            activeTab === 'under60' 
            ? 'bg-blue-50 border-blue-100 shadow-[0_15px_40px_-10px_rgba(30,58,138,0.1)]' 
            : 'bg-white border-gray-100 hover:border-blue-200'
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            activeTab === 'under60' ? 'bg-[#11327c] text-white' : 'bg-blue-50 text-[#11327c]'
          }`}>
             <Calendar size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Status: &lt; 60 Days</p>
            <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{under60Items.length} Products</h2>
          </div>
        </button>
      </div>

      {/* Main List Table */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8fafc] border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center w-12">
                   <div 
                      onClick={() => handleSelectAll(filteredItems.map(m => m.batchNumber))}
                      className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#11327c] transition-all bg-white mx-auto"
                   >
                     {filteredItems.length > 0 && filteredItems.every(m => selectedBatches.includes(m.batchNumber)) && <div className="w-2.5 h-2.5 bg-[#11327c] rounded-sm" />}
                     {filteredItems.length > 0 && !filteredItems.every(m => selectedBatches.includes(m.batchNumber)) && filteredItems.some(m => selectedBatches.includes(m.batchNumber)) && <div className="w-2.5 h-0.5 bg-[#11327c] rounded-sm" />}
                   </div>
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Medicine Name & Pack</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Company / Supplier</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Batch No.</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Expiry Date</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">MRP (₹)</th>
                <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Physical Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.length > 0 ? (
                filteredItems.map((med, idx) => {
                  const isExpired = new Date(med.expiryDate) < today;
                  return (
                    <tr key={med._id} className={`transition-all group animate-in fade-in slide-in-from-bottom-1 duration-300 ${selectedBatches.includes(med.batchNumber) ? 'bg-blue-50/50' : 'hover:bg-[#f8fafc]/50'}`} style={{ animationDelay: `${idx * 20}ms` }}>
                      <td className="px-5 py-4 text-center">
                         <div 
                            onClick={() => handleToggleBatch(med.batchNumber)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all mx-auto ${selectedBatches.includes(med.batchNumber) ? 'border-[#11327c] bg-[#11327c]' : 'border-gray-300 bg-white hover:border-[#11327c]'}`}
                         >
                           {selectedBatches.includes(med.batchNumber) && <CheckCircle2 size={14} className="text-white" strokeWidth={4} />}
                         </div>
                      </td>
                      <td className="px-4 py-4">
                         <div className="text-[13px] font-black text-[#11327c] uppercase tracking-tight mb-0.5 line-clamp-1">{med.name}</div>
                         <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{med.pack || 'Unit'} • {med.barcode || 'NO BARCODE'}</div>
                      </td>
                      <td className="px-4 py-4">
                         <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getCategoryStyles(med.category || 'Tablet')}`}>
                           {med.category || 'Tablet'}
                         </span>
                      </td>
                      <td className="px-4 py-4">
                         <div className="text-[13px] font-bold text-gray-800 line-clamp-1">{med.brand || "Generics"}</div>
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 line-clamp-1">{med.supplierName || "Direct"}</div>
                      </td>
                      <td className="px-4 py-4">
                         <span className="text-[12px] font-black text-gray-600 font-mono tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-100">
                           {med.batchNumber}
                         </span>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-orange-500'}`} />
                           <span className={`text-[13px] font-black tracking-tight ${isExpired ? 'text-rose-600' : 'text-gray-700'}`}>
                             {format(new Date(med.expiryDate), "dd MMM, yyyy")}
                           </span>
                         </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                         <div className="text-[13px] font-bold text-gray-800">{Number(med.sellingPrice || 0).toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <div className="inline-flex flex-col items-center justify-center bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                           <span className="text-[14px] font-black text-[#11327c] tracking-tighter leading-none">{med.stock}</span>
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Units</span>
                         </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-8 py-32 text-center">
                     <div className="flex flex-col items-center gap-4 opacity-20">
                        <CheckCircle2 size={56} strokeWidth={1} className="text-emerald-500" />
                        <div className="space-y-1">
                          <p className="text-[#11327c] font-black text-sm uppercase tracking-widest">Healthy Inventory</p>
                          <p className="text-gray-400 font-medium text-xs">No items detected in this category</p>
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
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#11327c] text-white px-8 py-4 rounded-full shadow-2xl shadow-[#11327c]/40 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 z-50 border border-white/10">
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
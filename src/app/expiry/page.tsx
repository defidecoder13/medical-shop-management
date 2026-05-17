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

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
}

export default function ExpiryPage() {
  const router = useRouter();

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

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expired' | 'under30' | 'under60'>('expired');

  useEffect(() => {
    const fetchExpiryData = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setMedicines(data);
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
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Batch Ident.</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Expiry Timeline</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Physical Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.length > 0 ? (
                filteredItems.map((med, idx) => {
                  const isExpired = new Date(med.expiryDate) < today;
                  return (
                    <tr key={med._id} className="hover:bg-[#f8fafc]/50 transition-all group animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: `${idx * 20}ms` }}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            isExpired ? 'bg-rose-50 text-rose-500' : 'bg-[#f8fafc] text-[#11327c]'
                          }`}>
                            <Package size={20} strokeWidth={2} />
                          </div>
                          <div>
                             <div className="text-[13px] font-black text-[#11327c] uppercase tracking-tight">{med.name}</div>
                             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{med.brand || "Generics"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                           <Hash size={14} className="text-gray-300" strokeWidth={3} />
                           <span className="text-[11px] font-black text-gray-500 font-mono tracking-wider">
                             {med.batchNumber}
                           </span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500 animate-pulse' : 'bg-orange-500'}`} />
                           <span className={`text-[13px] font-black tracking-tight ${isExpired ? 'text-rose-600' : 'text-gray-700'}`}>
                             {format(new Date(med.expiryDate), "dd MMM, yyyy")}
                           </span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex flex-col items-end">
                           <span className="text-lg font-black text-[#11327c] tracking-tighter">{med.stock} Units</span>
                           <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">In Stock</span>
                         </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-32 text-center">
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
    </div>
  );
}
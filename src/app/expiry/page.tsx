"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  History, 
  AlertCircle, 
  Clock, 
  ChevronLeft, 
  Calendar, 
  Package, 
  Tag, 
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowRight
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
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-8 animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950/50 py-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 hover:text-rose-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Expiry Tracker</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Proactively manage stock about to expire.</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-inner">
            <button
              onClick={() => setActiveTab('expired')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'expired' 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Expired
            </button>
            <button
              onClick={() => setActiveTab('under30')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'under30' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Within 30 Days
            </button>
            <button
              onClick={() => setActiveTab('under60')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'under60' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Within 60 Days
            </button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-3xl border border-rose-100/50 dark:border-rose-900/30 flex items-center gap-5 group cursor-pointer" onClick={() => setActiveTab('expired')}>
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/50 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform shadow-inner">
               <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-800/50 dark:text-rose-400/50">Already Expired</p>
              <h2 className="text-2xl font-black text-rose-900 dark:text-rose-100">{expiredItems.length} Items</h2>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-3xl border border-amber-100/50 dark:border-amber-900/30 flex items-center gap-5 group cursor-pointer" onClick={() => setActiveTab('under30')}>
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shadow-inner">
               <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-800/50 dark:text-amber-400/50">Under 30 Days</p>
              <h2 className="text-2xl font-black text-amber-900 dark:text-amber-100">{under30Items.length} Items</h2>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-3xl border border-blue-100/50 dark:border-blue-900/30 flex items-center gap-5 group cursor-pointer" onClick={() => setActiveTab('under60')}>
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-inner">
               <Calendar className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-800/50 dark:text-blue-400/50">Under 60 Days</p>
              <h2 className="text-2xl font-black text-blue-900 dark:text-blue-100">{under60Items.length} Items</h2>
            </div>
          </div>
        </div>

        {/* Main List Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Medicine Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Batch</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.length > 0 ? (
                  filteredItems.map((med) => {
                    const isExpired = new Date(med.expiryDate) < today;
                    return (
                      <tr key={med._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="px-8 py-6">
                           <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{med.name}</div>
                           <div className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 uppercase">{med.brand}</div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                             {med.batchNumber}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-amber-500'}`} />
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                               {new Date(med.expiryDate).toISOString().split('T')[0]}
                             </span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex flex-col items-end">
                             <span className="text-lg font-black text-slate-900 dark:text-white">{med.stock} Units</span>
                           </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center opacity-30">
                          <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                          <p className="font-bold text-lg text-slate-900 dark:text-white">Clean Sheet</p>
                          <p className="text-sm">No items found in this category.</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
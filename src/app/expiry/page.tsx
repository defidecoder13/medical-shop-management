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
        if (!res.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [expiringSoon, setExpiringSoon] = useState<Medicine[]>([]);
  const [expired, setExpired] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiryData = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          
          const today = new Date();
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          const expiringSoonList = data.filter((med: Medicine) => {
            const expiryDate = new Date(med.expiryDate);
            return expiryDate >= today && expiryDate <= endOfMonth;
          });

          const expiredList = data.filter((med: Medicine) => {
            const expiryDate = new Date(med.expiryDate);
            return expiryDate < today;
          });

          setExpiringSoon(expiringSoonList);
          setExpired(expiredList);
        }
      } catch (error) {
        console.error('Error fetching expiry data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiryData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
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
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-amber-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <History className="text-amber-600 w-8 h-8" />
              Expiry Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Identify and manage expiring stock</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Expiring Soon Card */}
          <div className="group relative glass-panel p-8 rounded-3xl border border-white/20 shadow-xl overflow-hidden bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <Clock className="w-32 h-32 text-amber-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider">Expiring Soon</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-amber-600 group-hover:scale-105 transition-transform inline-block">
                  {expiringSoon.length}
                </span>
                <span className="text-sm font-bold text-amber-800/60 dark:text-amber-200/40 uppercase">Medicines</span>
              </div>
              <p className="mt-4 text-sm text-amber-700/80 dark:text-amber-300/60 font-medium">Items set to expire within the current calendar month.</p>
            </div>
          </div>

          {/* Expired Card */}
          <div className="group relative glass-panel p-8 rounded-3xl border border-white/20 shadow-xl overflow-hidden bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-gray-900">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <AlertCircle className="w-32 h-32 text-rose-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h2 className="text-lg font-bold text-rose-900 dark:text-rose-100 uppercase tracking-wider">Dead Stock</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-rose-600 group-hover:scale-105 transition-transform inline-block">
                  {expired.length}
                </span>
                <span className="text-sm font-bold text-rose-800/60 dark:text-rose-200/40 uppercase">Expired Items</span>
              </div>
              <p className="mt-4 text-sm text-rose-700/80 dark:text-rose-300/60 font-medium">Critical: These items must be removed from circulation immediately.</p>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="space-y-12">
          
          {/* Expiring Soon Table */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <TrendingDown className="text-amber-500 w-6 h-6" />
                Critical Expiry Watchlist
              </h2>
               {expiringSoon.length > 0 && (
                <div className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                  Priority Action Required
                </div>
               )}
            </div>

            {expiringSoon.length > 0 ? (
              <div className="glass-panel rounded-3xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100/50 dark:border-amber-800/30">
                        <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">Medicine & Batch</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">Manufacturer</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest text-center">Expiry Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest text-right">Remaining Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {expiringSoon.map((med) => (
                        <tr key={med._id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-amber-100/50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{med.name}</div>
                                <div className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1.5 leading-none">
                                  <Tag className="w-3 h-3" />
                                  {med.batchNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{med.brand}</div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="inline-flex flex-col items-center">
                              <div className="text-xs font-black text-amber-600 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(med.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                              </div>
                              <span className="text-[10px] font-bold text-amber-800/40 dark:text-amber-400/40 mt-0.5">Expires soon</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{med.stock}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase mt-1">Strips LEFT</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center border border-white/20">
                <div className="flex flex-col items-center opacity-30">
                  <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                  <p className="font-bold text-xl text-gray-900 dark:text-white">All Clear</p>
                  <p className="text-sm">No medicines expiring this month</p>
                </div>
              </div>
            )}
          </section>

          {/* Expired Table */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <AlertCircle className="text-rose-500 w-6 h-6" />
                Expired Inventory List
              </h2>
               {expired.length > 0 && (
                <div className="text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-200/50 dark:border-rose-800/50 animate-pulse">
                  Immediate Removal Required
                </div>
               )}
            </div>

            {expired.length > 0 ? (
              <div className="glass-panel rounded-3xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-rose-50/50 dark:bg-rose-900/10 border-b border-rose-100/50 dark:border-rose-800/30">
                        <th className="px-6 py-4 text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-widest">Medicine & Batch</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-widest">Manufacturer</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-widest text-center">Expired Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-widest text-right">Stock Loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {expired.map((med) => (
                        <tr key={med._id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-rose-100/50 dark:bg-rose-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight line-through decoration-rose-500/30">{med.name}</div>
                                <div className="text-[10px] font-bold text-rose-400 mt-1 flex items-center gap-1.5 leading-none bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded w-fit">
                                  {med.batchNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{med.brand}</div>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <div className="inline-flex flex-col items-center">
                              <div className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(med.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                              </div>
                              <span className="text-[10px] font-bold text-rose-800/40 dark:text-rose-400/40 mt-0.5">Non-sellable</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex flex-col items-end">
                                <span className="text-lg font-black text-rose-700 dark:text-rose-500 leading-none">{med.stock}</span>
                                <span className="text-[10px] font-bold text-rose-400 uppercase mt-1">Dead Strips</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center border border-white/20">
                <div className="flex flex-col items-center opacity-30">
                  <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                  <p className="font-bold text-xl text-gray-900 dark:text-white">Clean Sheet</p>
                  <p className="text-sm">Zero expired items in stock</p>
                </div>
              </div>
            )}
          </section>

          {/* Action Links */}
          <div className="flex justify-center pt-8 pb-12 animate-in fade-in zoom-in duration-700">
             <Link 
               href="/inventory"
               className="group flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all active:scale-95"
             >
                <Package className="w-5 h-5" />
                Go to Inventory Manager
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
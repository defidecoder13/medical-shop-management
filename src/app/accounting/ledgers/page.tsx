"use client";

import { useEffect, useState } from "react";
import { Landmark, ArrowRight, Search } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";
import { useRouter } from "next/navigation";

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const handleData = (res: any) => {
          if (res?.data && Array.isArray(res.data)) {
            setAccounts(res.data);
            setTotalPages(res.pagination?.totalPages || 1);
          } else if (Array.isArray(res)) {
            setAccounts(res);
            setTotalPages(1);
          } else {
            setAccounts([]);
          }
          setLoading(false);
      };
      apiClient.get(`/api/accounting/ledgers?page=${page}&limit=20&search=${search}`, {}, handleData)
        .then(handleData)
        .catch(console.error);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search]);

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc: any, account: any) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  const getAccountColor = (type: string) => {
    switch(type) {
      case "Asset": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "Liability": return "text-rose-600 bg-rose-50 border-rose-100";
      case "Equity": return "text-purple-600 bg-purple-50 border-purple-100";
      case "Revenue": return "text-blue-600 bg-blue-50 border-blue-100";
      case "Expense": return "text-orange-600 bg-orange-50 border-orange-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#11327c] flex items-center gap-2 tracking-tight">
            <Landmark size={28} className="text-[#0047ab]" /> Chart of Accounts
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            The master list of all financial buckets in your pharmacy.
          </p>
        </div>
        
        <button 
          onClick={() => router.push('/accounting/trial-balance')}
          className="flex items-center gap-2 bg-[#0047ab] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-[#003580] transition-all shadow-md shadow-[#0047ab]/20 active:scale-95"
        >
          View Trial Balance <ArrowRight size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#11327c] flex items-center justify-center shrink-0">
             <Landmark size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Active Accounts</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{accounts.length} Buckets</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
             <Landmark size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Net Assets</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">₹{Math.abs(totalAssets).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
             <Landmark size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Liabilities</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">₹{Math.abs(totalLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
           </div>
        </div>
      </div>

      <div className="flex bg-white border border-gray-200 rounded-2xl shadow-sm max-w-sm">
        <div className="pl-4 flex items-center justify-center">
          <Search className="text-gray-400" size={18} />
        </div>
        <input
          type="text"
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-3 pr-4 py-3 bg-transparent text-sm font-bold focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-[#0047ab] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {accounts.map((acc: any) => (
                  <tr key={acc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-[14px] font-bold text-gray-900">{acc.name}</p>
                      {acc.description && <p className="text-[11px] text-gray-500 font-medium mt-0.5">{acc.description}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${getAccountColor(acc.type)}`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className={`text-[15px] font-black ${acc.balance < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                        ₹{Math.abs(acc.balance || 0).toFixed(2)}
                        {acc.balance < 0 && (acc.type === 'Asset' || acc.type === 'Expense') ? ' (Cr)' : ''}
                        {acc.balance < 0 && (acc.type === 'Liability' || acc.type === 'Revenue' || acc.type === 'Equity') ? ' (Dr)' : ''}
                      </p>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-400 font-bold text-sm">
                      No accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-sm text-gray-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

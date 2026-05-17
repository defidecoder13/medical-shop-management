"use client";

import { useState, useEffect } from "react";
import { Landmark, ArrowUpRight, ArrowDownRight, FileText, Download, ChevronLeft, Search, Calendar, History, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Account = {
  _id: string;
  name: string;
  type: string;
  balance: number;
};

type JournalEntry = {
  _id: string;
  description: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  entries: {
    accountId: { _id: string; name: string };
    type: "Debit" | "Credit";
    amount: number;
  }[];
};

export default function AccountingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportRange, setExportRange] = useState("1m");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiClient.get("/api/accounting");
        if (data) {
          setAccounts(data.accounts || []);
          setJournals(data.journals || []);
        }
      } catch (err) {
        console.error("Failed to load accounting data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = () => {
    window.location.href = `/api/accounting/export?range=${exportRange}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] opacity-20">
        <Loader2 className="animate-spin text-[#11327c] mb-4" size={48} strokeWidth={1.5} />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#11327c]">Syncing Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link 
            href="/"
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-[#11327c] transition-all shadow-sm group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-[28px] font-black text-[#11327c] tracking-tight uppercase">General Ledger</h1>
            <p className="text-[13px] text-gray-500 font-medium">Verified double-entry records generated from MedSathi operations.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <select 
              value={exportRange}
              onChange={(e) => setExportRange(e.target.value)}
              className="bg-gray-50 border border-gray-100 pl-9 pr-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#11327c] focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 transition-all appearance-none cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="1m">Last 1 Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="12m">Last 12 Months</option>
              <option value="all">Full History</option>
            </select>
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#11327c] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1e4db7] transition-all shadow-lg shadow-[#11327c]/20 active:scale-95"
          >
            <Download size={16} strokeWidth={2.5} />
            Export Intel
          </button>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {accounts.map((acc, idx) => (
            <motion.div 
              key={acc._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-[#11327c]/20 transition-all hover:shadow-xl hover:shadow-[#11327c]/5"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none transition-transform group-hover:scale-110 group-hover:opacity-[0.05] duration-500">
                <Landmark size={64} />
              </div>
              <div className="flex justify-between items-start">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{acc.type}</div>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${acc.balance >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                  {acc.balance >= 0 ? <ArrowUpRight size={16} strokeWidth={3} /> : <ArrowDownRight size={16} strokeWidth={3} />}
                </div>
              </div>
              <div>
                <div className="font-black text-[15px] text-[#11327c] uppercase tracking-tight truncate">{acc.name}</div>
                <div className="flex items-baseline gap-1.5 mt-3">
                  <span className="text-2xl font-black text-[#11327c] tabular-nums">
                    ₹{Math.abs(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${acc.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {acc.balance < 0 ? 'Credit' : 'Debit'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Journal Entries Ledger */}
      <div className="bg-white border border-gray-100 rounded-[40px] shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-[#f8fafc]/50">
          <h2 className="text-[14px] font-black text-[#11327c] uppercase tracking-[0.25em] flex items-center gap-4">
            <History size={22} className="text-orange-500" strokeWidth={2.5} />
            Immutable Audit Trail
          </h2>
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            {journals.length} Transactions Recorded
          </div>
        </div>
        
        <div className="divide-y divide-gray-50">
          {journals.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center opacity-20">
              <FileText size={64} strokeWidth={1} />
              <p className="mt-4 font-black uppercase tracking-widest">No entries found in current period</p>
            </div>
          ) : (
            journals.map((journal) => (
              <div key={journal._id} className="p-10 hover:bg-[#f8fafc] transition-all group">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="bg-[#11327c] text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{journal.referenceType}</span>
                       <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Calendar size={12} />
                         {new Date(journal.createdAt).toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' })}
                       </span>
                    </div>
                    <h3 className="font-black text-[#11327c] text-xl uppercase tracking-tight">{journal.description}</h3>
                  </div>
                  <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] font-mono group-hover:border-[#11327c]/20 transition-all">
                    TRX: {journal._id.slice(-12).toUpperCase()}
                  </div>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-[#f8fafc] text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                      <tr>
                        <th className="px-8 py-4">Financial Dimension</th>
                        <th className="px-8 py-4 text-right w-44">Debit (DR)</th>
                        <th className="px-8 py-4 text-right w-44">Credit (CR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[...journal.entries]
                        .sort((a, b) => (a.type === 'Debit' ? -1 : 1))
                        .map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className={`flex items-center gap-3 ${entry.type === 'Credit' ? "pl-8" : ""}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${entry.type === 'Debit' ? 'bg-[#11327c]' : 'bg-orange-400'}`} />
                              <span className="text-[14px] font-black text-[#11327c] uppercase tracking-tight">
                                {entry.accountId?.name || "Suspense Account"}
                              </span>
                            </div>
                          </td>
                          <td className={`px-8 py-5 text-right tabular-nums text-[14px] font-black ${entry.type === 'Debit' ? 'text-emerald-600' : 'text-gray-100'}`}>
                            {entry.type === 'Debit' ? `₹${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                          <td className={`px-8 py-5 text-right tabular-nums text-[14px] font-black ${entry.type === 'Credit' ? 'text-rose-600' : 'text-gray-100'}`}>
                            {entry.type === 'Credit' ? `₹${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

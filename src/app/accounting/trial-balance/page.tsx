"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Scale, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleData = (accounts: any) => {
      setAccounts(accounts);
      setLoading(false);
    };
    apiClient.get("/api/accounting/ledgers", {}, handleData)
      .then(handleData)
      .catch(console.error);
  }, []);

  let totalDebit = 0;
  let totalCredit = 0;

  const trialAccounts = accounts.map(acc => {
    let debit = 0;
    let credit = 0;

    // Normal Balance Rules
    if (acc.type === "Asset" || acc.type === "Expense") {
      if (acc.balance >= 0) debit = acc.balance;
      else credit = Math.abs(acc.balance);
    } else { // Liability, Revenue, Equity
      if (acc.balance >= 0) credit = acc.balance;
      else debit = Math.abs(acc.balance);
    }

    totalDebit += debit;
    totalCredit += credit;

    return { ...acc, debit, credit };
  });

  // Due to JS floating point precision, we use a small epsilon for equality
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-[#11327c] flex items-center gap-2 tracking-tight">
            <ArrowRightLeft size={28} className="text-[#0047ab]" /> Trial Balance
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Mathematical proof that your double-entry books are perfectly balanced.
          </p>
        </div>
        
        {!loading && (
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border shadow-sm ${
            isBalanced 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}>
             {isBalanced ? <CheckCircle2 size={20} strokeWidth={2.5}/> : <AlertCircle size={20} strokeWidth={2.5}/>}
             <span className="font-black text-sm tracking-wide uppercase">
               {isBalanced ? 'Books are Balanced' : 'Imbalance Detected'}
             </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#11327c] flex items-center justify-center shrink-0">
             <Scale size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Debit Volume</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">₹{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#11327c] flex items-center justify-center shrink-0">
             <Scale size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Credit Volume</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">₹{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isBalanced ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
             {isBalanced ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <AlertCircle size={28} strokeWidth={2.5} />}
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Discrepancy</p>
             <h2 className={`text-2xl font-black tracking-tighter ${isBalanced ? 'text-[#11327c]' : 'text-rose-500'}`}>
                ₹{Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
             </h2>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex justify-center items-center p-20">
            <div className="w-10 h-10 border-4 border-[#0047ab] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-4 px-8 text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">Account Name</th>
                    <th className="py-4 px-8 text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 w-32">Type</th>
                    <th className="py-4 px-8 text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right w-40">Debit (₹)</th>
                    <th className="py-4 px-8 text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right w-40">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {trialAccounts.filter(acc => acc.debit > 0 || acc.credit > 0).map((acc) => (
                    <tr key={acc._id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-8">
                        <p className="text-[14px] font-bold text-gray-900">{acc.name}</p>
                      </td>
                      <td className="py-4 px-8">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                           acc.type === 'Asset' ? 'bg-emerald-50 text-emerald-700' :
                           acc.type === 'Liability' ? 'bg-rose-50 text-rose-700' :
                           acc.type === 'Equity' ? 'bg-purple-50 text-purple-700' :
                           acc.type === 'Revenue' ? 'bg-blue-50 text-blue-700' :
                           'bg-orange-50 text-orange-700'
                        }`}>
                           {acc.type}
                        </span>
                      </td>
                      <td className="py-4 px-8 text-right">
                        <p className={`text-[15px] font-black tracking-tight ${acc.debit > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                          {acc.debit > 0 ? acc.debit.toFixed(2) : '-'}
                        </p>
                      </td>
                      <td className="py-4 px-8 text-right">
                        <p className={`text-[15px] font-black tracking-tight ${acc.credit > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                          {acc.credit > 0 ? acc.credit.toFixed(2) : '-'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

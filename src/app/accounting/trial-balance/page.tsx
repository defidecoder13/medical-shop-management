"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Scale, CheckCircle2, AlertCircle } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";

export default function TrialBalancePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/api/accounting/ledgers")
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false));
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
    <div className="p-6 max-w-5xl mx-auto space-y-8 flex flex-col h-[calc(100vh-2rem)]">
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

      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
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

            <div className={`px-8 py-6 border-t flex justify-between items-center shrink-0 ${isBalanced ? 'bg-gray-50 border-gray-200' : 'bg-rose-50 border-rose-200'}`}>
               <div className="flex items-center gap-3">
                  <Scale className={isBalanced ? "text-gray-400" : "text-rose-500"} size={24} />
                  <span className={`text-[14px] font-black uppercase tracking-widest ${isBalanced ? 'text-gray-600' : 'text-rose-700'}`}>
                     Grand Totals
                  </span>
               </div>
               <div className="flex gap-16 pr-8">
                  <div className="text-right w-32">
                     <p className={`text-xl font-black ${isBalanced ? 'text-gray-900' : 'text-rose-600'}`}>
                        ₹{totalDebit.toFixed(2)}
                     </p>
                  </div>
                  <div className="text-right w-32">
                     <p className={`text-xl font-black ${isBalanced ? 'text-gray-900' : 'text-rose-600'}`}>
                        ₹{totalCredit.toFixed(2)}
                     </p>
                  </div>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

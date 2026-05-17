"use client";

import Link from "next/link";
import { FileText, Eye } from "lucide-react";

interface Transaction {
  _id: string;
  grandTotal: number;
  items: { name: string; qty: number }[];
  createdAt: string;
}

interface RecentTransactionsProps {
  data: Transaction[];
}

export function RecentTransactions({ data }: RecentTransactionsProps) {
  const transactions = data || [];

  return (
    <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[17px] font-extrabold text-[#11327c] flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#11327c]" strokeWidth={2.5} />
          Recent Transactions
        </h3>
        <Link href="/transactions" className="text-[12px] font-bold border border-gray-200 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm uppercase tracking-wider">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-gray-100">
              <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] rounded-l-xl">Date & Time</th>
              <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Transaction ID</th>
              <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Medicines</th>
              <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Amount</th>
              <th className="px-5 py-4 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-center rounded-r-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <tr key={t._id} className="hover:bg-[#f8fafc]/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="text-[13px] font-black text-[#11327c]">
                      {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">
                      {new Date(t.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[11px] font-black font-mono tracking-wider">
                      #{t._id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {t.items && t.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-[13px] font-bold text-gray-700 leading-tight">
                          {item.name} <span className="text-[11px] text-gray-400 ml-1 font-black">× {item.qty}</span>
                        </div>
                      ))}
                      {t.items && t.items.length > 2 && (
                        <div className="text-[11px] font-black text-[#11327c] uppercase tracking-widest opacity-60">
                          + {t.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-[14px] font-black text-[#11327c] tracking-tight">
                      ₹{(t.grandTotal || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <Link
                        href={`/transactions/${t._id}`}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#11327c] hover:bg-[#11327c]/5 rounded-xl transition-all border border-transparent hover:border-[#11327c]/10 active:scale-95"
                        title="View Details"
                      >
                        <Eye size={18} strokeWidth={2.5} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 font-medium text-[13px]">
                  No recent transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

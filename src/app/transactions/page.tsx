"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { 
  History, 
  ChevronLeft, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Printer, 
  IndianRupee, 
  Calendar, 
  CreditCard, 
  Hash, 
  TrendingUp, 
  Search,
  Filter,
  CheckCircle2,
  Bookmark,
  ArrowUpRight
} from "lucide-react";

type Transaction = {
  _id: string;
  createdAt: string;
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  profit: number;
  gstEnabled: boolean;
  printInvoice?: boolean;
  items: Array<{
    name: string;
    batchNumber: string;
    unitType: "strip" | "tablet";
    qty: number;
    sellingPrice: number;
    total: number;
  }>;
};

export default function TransactionsPage() {
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredTransactions = transactions.filter(t => 
    t._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToExcel = () => {
    if (transactions.length === 0) return;
    
    const formattedTransactions = transactions.map(t => ({
      'Date': new Date(t.createdAt).toLocaleString(),
      'Bill ID': t._id.slice(-6),
      'Subtotal': `₹${t.subTotal ?? 0}`,
      'GST': `₹${t.gstAmount ?? 0}`,
      'Total': `₹${t.grandTotal ?? 0}`,
      'Profit': `₹${t.profit?.toFixed(2) ?? '0.00'}`,
      'Type': t.printInvoice ? "Printed" : "Saved",
    }));
    
    const ws = XLSX.utils.json_to_sheet(formattedTransactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8 animate-pulse">
           <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
           <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-violet-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <History className="text-violet-600 w-8 h-8" />
                Ledger Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Audit and manage historical billing data</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input 
                placeholder="Search Invoice ID..."
                className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 pl-10 pr-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={exportToExcel}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 group"
            >
              <FileSpreadsheet className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Statement Export
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="glass-panel rounded-3xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-violet-50/50 dark:bg-violet-900/10 border-b border-violet-100/50 dark:border-violet-800/30">
                  <th className="px-6 py-4 text-[10px] font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest">Temporal Log</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest">Reference</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest text-center">Financial Breakdown</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest text-center">Net Yield</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filteredTransactions.map((t, idx) => (
                  <tr 
                    key={t._id} 
                    className="hover:bg-violet-50/20 dark:hover:bg-violet-900/5 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CreditCard className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                            {new Date(t.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(t.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col">
                          <div className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5 text-violet-400" />
                            {t._id.slice(-8).toUpperCase()}
                          </div>
                          <div className={`text-[9px] font-black uppercase mt-1.5 px-2 py-0.5 rounded-full w-fit ${t.printInvoice ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                             {t.printInvoice ? 'Physical Invoice' : 'Digital Record'}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex flex-col items-center gap-1">
                          <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                            ₹{t.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex gap-2">
                             <span>Base: ₹{t.subTotal.toFixed(0)}</span>
                             <span>•</span>
                             <span>GST: ₹{t.gstAmount.toFixed(0)}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="inline-flex flex-col items-center p-2 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30">
                          <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                             <TrendingUp className="w-3.5 h-3.5" />
                             ₹{t.profit?.toFixed(2) ?? '0.00'}
                          </div>
                          <div className="text-[9px] font-bold text-emerald-800/40 dark:text-emerald-400/40 uppercase tracking-tighter mt-0.5">
                             Gross Margin
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/transactions/${t._id}`}
                            className="p-2.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-violet-600 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-violet-200 transition-all shadow-sm"
                            title="Audit Transaction"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => window.open(`/print/${t._id}`, '_blank')}
                            className="p-2.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-600 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-emerald-200 transition-all shadow-sm"
                            title="Generate Duplicate Invoice"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <div className="flex flex-col items-center opacity-30">
                          <Search className="w-12 h-12 mb-3" />
                          <p className="font-bold text-xl uppercase tracking-tighter">No Ledger History</p>
                          <p className="text-sm">Verify your invoice reference number</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Footnote */}
        <div className="flex justify-center pb-12">
           <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-widest bg-white dark:bg-gray-900 px-6 py-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
             <Bookmark className="w-3.5 h-3.5 text-violet-400" />
             End of primary transaction log
           </p>
        </div>

      </div>
    </div>
  );
}

const Clock = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

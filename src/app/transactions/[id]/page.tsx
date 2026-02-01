"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Printer, 
  Receipt, 
  Calendar, 
  CreditCard, 
  Hash, 
  CheckCircle2, 
  Package, 
  Layers, 
  Tag
} from "lucide-react";
import Link from "next/link";

export default function TransactionDetailsPage() {
  const params = useParams();
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

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/transactions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setBill(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-8 animate-pulse">
           <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
           <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (!bill || bill.error) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 flex items-center justify-center p-4">
         <div className="glass-panel p-8 rounded-3xl text-center max-w-md w-full">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <Receipt className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Transaction Not Found</h2>
            <p className="text-gray-500 mb-6">The requested invoice details could not be retrieved.</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Return to Ledger
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <button
             onClick={() => router.back()}
             className="flex items-center gap-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors group"
           >
             <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
               <ChevronLeft className="w-5 h-5" />
             </div>
             <span className="font-bold text-sm uppercase tracking-wide">Back to Ledger</span>
           </button>

           <div className="flex items-center gap-3">
             <div className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-widest flex items-center gap-2 ${
                bill.printInvoice 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
             }`}>
                {bill.printInvoice ? <Receipt className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {bill.printInvoice ? "Printed Invoice" : "Digital Record"}
             </div>
             
             <button
               onClick={() => window.open(`/print/${id}`, '_blank')}
               className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
             >
               <Printer className="w-4 h-4" />
               Print
             </button>
           </div>
        </div>

        {/* Main Content Card */}
        <div className="glass-panel rounded-3xl border border-white/20 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {/* Invoice Header */}
           <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center">
                          <Hash className="w-6 h-6 text-blue-600" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Transaction ID</p>
                          <h1 className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                             {typeof id === 'string' ? id.slice(-8).toUpperCase() : id}
                          </h1>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Date Issued
                       </p>
                       <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {new Date(bill.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                       </p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Payment Status
                       </p>
                       <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          Paid in Full
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Items Table */}
           <div className="p-8 bg-white dark:bg-gray-900 min-h-[300px]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Layers className="w-4 h-4" />
                 Purchased Items ({bill.items?.length || 0})
              </h3>

              {(!bill.items || bill.items.length === 0) ? (
                 <div className="text-center py-12 text-gray-400">No items in this transaction</div>
              ) : (
                 <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 dark:bg-gray-800/50">
                          <tr>
                             <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item Details</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Batch</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Qty</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Price</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Total</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {bill.items.map((item: any, i: number) => (
                             <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                         <Package className="w-4 h-4" />
                                      </div>
                                      <span className="font-bold text-gray-900 dark:text-white uppercase text-sm">
                                         {item.name}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono font-bold text-gray-500">
                                      <Hash className="w-3 h-3" />
                                      {item.batchNumber}
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className="font-bold text-gray-900 dark:text-white text-sm">
                                      {item.qty} <span className="text-gray-400 text-xs font-normal lowercase">{item.unitType}s</span>
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                                      ₹{item.sellingPrice}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <span className="font-bold text-gray-900 dark:text-white text-sm">
                                      ₹{item.total}
                                   </span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}
           </div>

           {/* Financial Summary */}
           <div className="bg-gray-50 dark:bg-gray-800/50 p-8 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row justify-end items-end gap-12">
                 
                 <div className="w-full sm:w-64 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-500 font-medium">Subtotal</span>
                       <span className="text-gray-900 dark:text-white font-bold">₹{bill.subTotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-500 font-medium">GST Amount</span>
                       <span className="text-gray-900 dark:text-white font-bold">₹{bill.gstAmount}</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>
                    <div className="flex justify-between items-center">
                       <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Grand Total</span>
                       <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                          ₹{bill.grandTotal}
                       </span>
                    </div>
                    <div className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                       Inclusive of all taxes
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
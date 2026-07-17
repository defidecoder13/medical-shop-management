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
  Tag,
  Undo2,
  X,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/src/lib/apiClient";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState("");

  const openReturnModal = () => {
     const initialReturnState = bill.items
        .map((item: any, idx: number) => ({
           id: Math.random().toString(), // local unique key
           itemIndex: idx,
           name: item.name,
           batchNumber: item.batchNumber,
           maxQty: item.qty - (item.returnedQty || 0),
           returnQty: 0,
           unitType: item.unitType,
           unitTotal: item.total / item.qty
        }))
        .filter((item: any) => item.maxQty > 0);
     setReturnItems(initialReturnState);
     setReturnError("");
     setShowReturnModal(true);
  };

  const handleReturnSubmit = async () => {
     const itemsToReturn = returnItems.filter(item => item.returnQty > 0);
     if (itemsToReturn.length === 0) {
        setReturnError("Please specify at least one item to return.");
        return;
     }

     setReturnLoading(true);
     setReturnError("");

     try {
        const payload = {
           originalBillId: bill._id,
           returnedItems: itemsToReturn.map(item => ({
              name: item.name,
              batchNumber: item.batchNumber,
              returnQty: Number(item.returnQty),
              unitType: item.unitType,
              itemIndex: item.itemIndex
           }))
        };

        const res = await apiClient.post('/api/returns', payload);
        if (res.error) {
           setReturnError(res.error);
        } else {
           setShowReturnModal(false);
           setLoading(true);
           const freshBill = await apiClient.get(`/api/transactions/${id}`);
           setBill(freshBill);
           setLoading(false);
        }
     } catch (err: any) {
        setReturnError(err.message || "Failed to process return.");
     } finally {
        setReturnLoading(false);
     }
  };

  useEffect(() => {
    if (!id) return;

    apiClient.get(`/api/transactions/${id}`)
      .then((data) => {
        setBill(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#11327c]/10 border-t-[#11327c] rounded-full animate-spin" />
        <p className="text-[13px] font-bold text-[#11327c] animate-pulse uppercase tracking-widest">Retrieving Invoice...</p>
      </div>
    );
  }

  if (!bill || bill.error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center p-4">
         <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] text-center max-w-md w-full border border-gray-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/40 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Receipt className="w-10 h-10 text-rose-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-[22px] font-black text-[#11327c] dark:text-blue-400 mb-2 tracking-tight">Invoice Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-8">The requested transaction details could not be retrieved from our servers.</p>
            <button
              onClick={() => router.push('/transactions')}
              className="w-full py-4 bg-[#11327c] hover:bg-[#1e4db7] text-white rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all shadow-lg shadow-[#11327c]/20"
            >
              Return to Ledger
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
           <button
             onClick={() => router.push('/transactions')}
             className="flex items-center gap-3 text-gray-400 hover:text-[#11327c] dark:hover:text-blue-400 transition-all group"
           >
             <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm group-hover:border-[#11327c]/20 transition-all">
               <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
             </div>
             <span className="font-black text-[11px] uppercase tracking-[0.2em] ml-1">Back to Ledger</span>
           </button>

           <div className="flex items-center gap-3">
             {!bill.isReturn && bill.returnStatus !== 'Full' && (
               <button
                 onClick={openReturnModal}
                 className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95 border border-rose-100 shadow-sm"
               >
                 <Undo2 className="w-4 h-4" strokeWidth={2.5} />
                 Return Items
               </button>
             )}

             <div className={`px-5 py-2.5 rounded-xl border font-black text-[11px] uppercase tracking-widest flex items-center gap-2.5 shadow-sm ${
                bill.printInvoice 
                ? 'bg-[#11327c]/5 text-[#11327c] border-[#11327c]/10'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
             }`}>
                {bill.printInvoice ? <Receipt className="w-4 h-4" strokeWidth={2.5} /> : <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />}
                {bill.printInvoice ? "Printed" : "Digital"}
             </div>
             
             <button
               onClick={() => window.open(`/print/${id}`, '_blank')}
               className="flex items-center gap-2 px-6 py-2.5 bg-[#11327c] hover:bg-[#1e4db7] text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[#11327c]/20 transition-all active:scale-95"
             >
               <Printer className="w-4 h-4" strokeWidth={2.5} />
               Print
             </button>
           </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-gray-100 dark:border-slate-800 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 transition-colors">
           
           {/* Invoice Header */}
           <div className="p-10 border-b border-gray-50 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-800/50">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="flex items-center gap-5">
                     <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner ${bill.isReturn ? 'bg-rose-100 dark:bg-rose-950/60' : 'bg-[#11327c]/5 dark:bg-blue-950/50'}`}>
                        {bill.isReturn ? <Undo2 className="w-7 h-7 text-rose-600 dark:text-rose-400" strokeWidth={2.5} /> : <Hash className="w-7 h-7 text-[#11327c] dark:text-blue-400" strokeWidth={2.5} />}
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${bill.isReturn ? 'text-rose-600 dark:text-rose-400' : 'text-[#11327c] dark:text-blue-400 opacity-80'}`}>
                             {bill.isReturn ? 'Credit Note' : 'Transaction ID'}
                          </p>
                          {bill.returnStatus === 'Full' && (
                             <span className="text-[9px] px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-md uppercase tracking-widest font-black border border-rose-100 dark:border-rose-800">Fully Returned</span>
                          )}
                          {bill.returnStatus === 'Partial' && (
                             <span className="text-[9px] px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-md uppercase tracking-widest font-black border border-amber-100 dark:border-amber-800">Partial Return</span>
                          )}
                        </div>
                        <h1 className="text-[28px] font-black text-[#11327c] dark:text-blue-400 font-mono tracking-tight leading-none">
                           #{bill.invoiceNumber || (typeof id === 'string' ? id.slice(-8).toUpperCase() : id)}
                        </h1>
                     </div>
                  </div>

                  <div className="flex flex-col items-end">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Date Issued
                     </p>
                     <p className="text-[16px] font-black text-[#11327c] dark:text-blue-300 tracking-tight">
                        {format(new Date(bill.createdAt), "EEEE, dd MMM yyyy")}
                     </p>
                  </div>
               </div>
           </div>

           {/* Items Section */}
           <div className="p-10 bg-white dark:bg-slate-900">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                 <Layers className="w-4 h-4 text-[#11327c] dark:text-blue-400" strokeWidth={2.5} />
                 Order Details <span className="text-[#11327c]/20 dark:text-slate-700">/</span> <span className="text-[#11327c] dark:text-blue-400">{bill.items?.length || 0} Products</span>
              </h3>

              {(!bill.items || bill.items.length === 0) ? (
                 <div className="text-center py-20 text-gray-300 dark:text-gray-600 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-gray-50 dark:border-slate-800 rounded-3xl">No items found</div>
              ) : (
                 <div className="overflow-hidden rounded-3xl border border-gray-50 dark:border-slate-800">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-[#f8fafc] dark:bg-slate-800 border-b border-gray-50 dark:border-slate-800">
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Information</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Quantity</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                             <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Subtotal</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                          {bill.items.map((item: any, i: number) => (
                             <tr key={i} className="group hover:bg-[#f8fafc]/50 dark:hover:bg-slate-800/50 transition-colors">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-[#11327c] dark:text-indigo-400 shadow-sm">
                                          <Package className="w-5 h-5" strokeWidth={2} />
                                       </div>
                                       <div>
                                          <div className="font-black text-[#11327c] dark:text-blue-300 uppercase text-[13px] tracking-tight mb-0.5">
                                             {item.name}
                                          </div>
                                          <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                                             Batch: <span className="text-gray-600 dark:text-gray-300">{item.batchNumber}</span>
                                          </div>
                                       </div>
                                    </div>
                                 </td>
                                <td className="px-8 py-6 text-center">
                                   <div className="flex flex-col items-center">
                                      <span className="font-black text-[#11327c] dark:text-blue-300 text-[14px]">
                                         {item.qty} <span className="text-gray-400 text-[10px] font-black uppercase ml-1 tracking-tighter">{item.unitType}s</span>
                                      </span>
                                      {item.returnedQty > 0 && (
                                         <span className="mt-1.5 text-[9px] font-black text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md uppercase tracking-wider border border-rose-100 dark:border-rose-800">
                                            {item.returnedQty} Returned
                                         </span>
                                      )}
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <span className="font-bold text-gray-500 dark:text-gray-400 text-[13px]">
                                      ₹{item.sellingPrice.toFixed(2)}
                                   </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <span className="font-black text-[#11327c] dark:text-blue-300 text-[14px]">
                                      ₹{(item.total - (item.discountAmount || 0)).toFixed(2)}
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
           <div className="bg-[#f8fafc] dark:bg-slate-800/50 p-10 flex flex-col sm:flex-row justify-between items-center gap-10 border-t border-gray-50 dark:border-slate-800">
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-800">
                    <CreditCard size={20} className="text-[#11327c] dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Billing Details</p>
                    <p className="text-[13px] font-bold text-[#11327c] dark:text-blue-300">Customer: {bill.patientName || "Walk-in Customer"}</p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{bill.patientPhone || "No Phone Provided"}</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full sm:w-80 space-y-4 bg-white dark:bg-slate-900 p-7 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-50 dark:border-slate-800">
                 <div className="flex justify-between items-center text-[13px] font-bold text-gray-500 dark:text-gray-400">
                    <span className="uppercase tracking-widest text-[10px] font-black">Subtotal</span>
                    <span className="text-[#11327c] dark:text-blue-300">₹{bill.subTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-[13px] font-bold text-gray-500 dark:text-gray-400">
                    <span className="uppercase tracking-widest text-[10px] font-black">GST Amount</span>
                    <span className="text-emerald-600 dark:text-emerald-400">+₹{bill.gstAmount.toFixed(2)}</span>
                 </div>
                 {bill.discountAmount > 0 && (
                   <div className="flex justify-between items-center text-[13px] font-bold text-rose-500 dark:text-rose-400">
                      <span className="uppercase tracking-widest text-[10px] font-black">Discount</span>
                      <span>-₹{bill.discountAmount.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="h-px bg-gray-100 dark:bg-slate-800 my-2"></div>
                 <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black text-[#11327c] dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Grand Total</span>
                    <span className="text-[32px] font-black text-[#11327c] dark:text-blue-400 leading-none tracking-tight">
                       ₹{bill.grandTotal.toFixed(2)}
                    </span>
                 </div>
              </div>
           </div>

        </div>
      </div>

      {/* Return Modal */}
      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#11327c]/20 dark:bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_40px_100px_-20px_rgba(17,50,124,0.4)] w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800"
            >
              <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center bg-[#f8fafc]/50 dark:bg-slate-800/80">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-800">
                    <Undo2 className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-black text-[#11327c] dark:text-blue-400 tracking-tight">Process Return</h3>
                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest">Select items and quantities</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReturnModal(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                  disabled={returnLoading}
                >
                  <X className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[50vh] bg-white dark:bg-slate-900 space-y-4">
                {returnError && (
                  <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 flex items-start gap-4 text-rose-600 dark:text-rose-400 text-[13px] font-bold animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                    <p>{returnError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {returnItems.map((item, index) => (
                    <div key={item.id} className="p-6 rounded-[28px] border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-[#f8fafc]/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-gray-100 dark:hover:shadow-none transition-all group">
                      <div className="flex-1">
                        <p className="font-black text-[#11327c] dark:text-blue-300 uppercase text-[13px] mb-1">{item.name}</p>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white dark:bg-slate-900 px-2 py-1 rounded-lg shadow-sm border border-gray-50 dark:border-slate-700">Batch: {item.batchNumber}</span>
                           <span className="text-[10px] font-black text-[#11327c]/60 dark:text-blue-400/80 uppercase tracking-widest">Max Return: {item.maxQty}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <div className="flex-1 md:flex-initial">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5 ml-1">Return Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={item.maxQty}
                            value={item.returnQty === 0 ? '' : item.returnQty}
                            onChange={(e) => {
                              let val = parseInt(e.target.value) || 0;
                              if (val > item.maxQty) val = item.maxQty;
                              if (val < 0) val = 0;
                              const newItems = [...returnItems];
                              newItems[index].returnQty = val;
                              setReturnItems(newItems);
                            }}
                            className="w-full md:w-28 px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-black text-[14px] text-[#11327c] dark:text-blue-300 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all shadow-sm"
                            placeholder="0"
                          />
                        </div>
                        <div className="text-right min-w-[80px]">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1.5">Refund</label>
                           <p className="font-black text-rose-600 dark:text-rose-400 text-[16px] tracking-tight">
                             ₹{(item.unitTotal * item.returnQty).toFixed(2)}
                           </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800/80 flex justify-end gap-4">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="px-8 py-3.5 rounded-2xl font-black text-[12px] text-gray-400 uppercase tracking-[0.15em] hover:text-[#11327c] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-900 transition-all"
                  disabled={returnLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnSubmit}
                  disabled={returnLoading}
                  className="px-10 py-3.5 rounded-2xl font-black text-[12px] uppercase tracking-[0.15em] bg-[#11327c] hover:bg-[#1e4db7] text-white shadow-[0_15px_30px_-10px_rgba(17,50,124,0.3)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {returnLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  )}
                  CONFIRM RETURN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
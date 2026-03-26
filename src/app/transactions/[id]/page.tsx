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

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiClient.get('/api/auth/check');
        if (!data) {
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

  // Return Modal State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState("");

  const openReturnModal = () => {
     const initialReturnState = bill.items
        .filter((item: any) => item.qty - (item.returnedQty || 0) > 0)
        .map((item: any) => ({
           id: Math.random().toString(), // local unique key
           name: item.name,
           batchNumber: item.batchNumber,
           maxQty: item.qty - (item.returnedQty || 0),
           returnQty: 0,
           unitType: item.unitType,
           unitTotal: item.total / item.qty
        }));
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
              returnQty: Number(item.returnQty)
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
              onClick={() => router.push('/transactions')}
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
             onClick={() => router.push('/transactions')}
             className="flex items-center gap-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors group"
           >
             <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
               <ChevronLeft className="w-5 h-5" />
             </div>
             <span className="font-bold text-sm uppercase tracking-wide">Back to Ledger</span>
           </button>

             <div className="flex items-center gap-3">
             {!bill.isReturn && bill.returnStatus !== 'Full' && (
               <button
                 onClick={openReturnModal}
                 className="flex items-center gap-2 px-5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 border border-rose-200 dark:border-rose-900/50"
               >
                 <Undo2 className="w-4 h-4" />
                 Return Items
               </button>
             )}

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
               className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-black/20 transition-all active:scale-95"
             >
               <Printer className="w-4 h-4" />
               Print Invoice
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
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bill.isReturn ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                           {bill.isReturn ? <Undo2 className="w-6 h-6 text-rose-600" /> : <Hash className="w-6 h-6 text-blue-600" />}
                        </div>
                        <div>
                           <p className={`text-xs font-bold uppercase tracking-widest ${bill.isReturn ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {bill.isReturn ? 'Credit Note (Return)' : 'Transaction ID'}
                           </p>
                           <h1 className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight flex items-center gap-3">
                              {typeof id === 'string' ? id.slice(-8).toUpperCase() : id}
                              {bill.returnStatus === 'Full' && (
                                 <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg uppercase tracking-widest font-bold">Fully Returned</span>
                              )}
                              {bill.returnStatus === 'Partial' && (
                                 <span className="text-[10px] px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg uppercase tracking-widest font-bold">Partially Returned</span>
                              )}
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
                                       <div className="font-bold text-gray-900 dark:text-white uppercase text-sm">
                                          {item.name}
                                       </div>
                                    </div>
                                 </td>
                                <td className="px-6 py-4 text-center">
                                   <div className="flex flex-col items-center">
                                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                                         {item.qty} <span className="text-gray-400 text-xs font-normal lowercase">{item.unitType}s</span>
                                      </span>
                                      {item.returnedQty > 0 && (
                                         <span className="mt-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full uppercase">
                                            {item.returnedQty} Returned
                                         </span>
                                      )}
                                   </div>
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

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 rounded-xl">
                  <Undo2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Process Return</h3>
                  <p className="text-xs text-gray-500 font-medium">Select quantities to return from this purchase.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReturnModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
                disabled={returnLoading}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-900">
              {returnError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-400 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{returnError}</p>
                </div>
              )}

              <div className="space-y-4">
                {returnItems.map((item, index) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50/30 dark:bg-gray-800/10">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-widest">
                        Batch: <span className="text-gray-900 dark:text-gray-300">{item.batchNumber}</span> • Max: {item.maxQty} {item.unitType}s
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex-1 sm:flex-initial">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Return Qty</label>
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
                          className="w-full sm:w-24 px-3 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-mono text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="w-24 text-right">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Est. Refund</label>
                         <p className="font-bold text-gray-900 dark:text-white font-mono">
                           ₹{(item.unitTotal * item.returnQty).toFixed(2)}
                         </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex justify-end gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
                disabled={returnLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={returnLoading}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {returnLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
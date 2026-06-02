"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Receipt, Search, FileSpreadsheet, Building2, Package } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";
import { useRouter } from "next/navigation";

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      apiClient.get(`/api/purchases/history?page=${page}&limit=20&search=${searchQuery}`)
        .then((res: any) => {
          if (res?.data && Array.isArray(res.data)) {
            setInvoices(res.data);
            setTotalPages(res.pagination?.totalPages || 1);
          } else if (Array.isArray(res)) {
            setInvoices(res);
            setTotalPages(1);
          } else {
            setInvoices([]);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [page, searchQuery]);

  const filteredInvoices = invoices;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-[#11327c] tracking-tight flex items-center gap-2">
            <Building2 className="text-[#0047ab]" size={28} />
            Purchase History
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            View all supplier invoices and imported stock records.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by invoice or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold w-[250px] focus:outline-none focus:ring-2 focus:ring-[#0047ab]/20 focus:border-[#0047ab] transition-all"
            />
          </div>
          <button 
            onClick={() => router.push('/purchases/import')}
            className="flex items-center gap-2 bg-[#0047ab] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-[#003580] transition-all shadow-md shadow-[#0047ab]/20"
          >
            <FileSpreadsheet size={18} />
            New Import
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10">
             <div className="w-10 h-10 border-4 border-[#0047ab] border-t-transparent rounded-full animate-spin mb-4" />
             <p className="text-gray-500 font-bold">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
             <div className="bg-gray-50 p-6 rounded-full mb-4">
               <Receipt size={40} className="text-gray-400" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-1">No Purchases Found</h3>
             <p className="text-gray-500 text-sm font-medium">You haven't imported any supplier invoices yet.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-0">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                   <tr>
                      <th className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Date</th>
                      <th className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Invoice No</th>
                      <th className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Supplier</th>
                      <th className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Items</th>
                      <th className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                      <th className="py-3 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Total Amount</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredInvoices.map((inv) => (
                      <React.Fragment key={inv._id}>
                      <tr 
                         onClick={() => setExpandedInvoice(expandedInvoice === inv._id ? null : inv._id)}
                         className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      >
                         <td className="py-4 px-6 whitespace-nowrap">
                            <p className="text-[13px] font-bold text-gray-900">{format(new Date(inv.invoiceDate || inv.createdAt), "dd MMM yyyy")}</p>
                            <p className="text-[11px] font-medium text-gray-400">{format(new Date(inv.createdAt), "hh:mm a")}</p>
                         </td>
                         <td className="py-4 px-6 whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                               <Receipt size={14} className="text-gray-500" />
                               <span className="text-[12px] font-bold text-gray-700 font-mono">{inv.invoiceNumber}</span>
                            </div>
                         </td>
                         <td className="py-4 px-6">
                            <p className="text-[13px] font-bold text-[#11327c]">{inv.supplierName}</p>
                         </td>
                         <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-[12px] font-bold">
                               <Package size={14} />
                               {inv.items?.length || 0}
                            </span>
                         </td>
                         <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                              inv.status === 'Paid' 
                                 ? 'bg-green-100 text-green-700' 
                                 : inv.status === 'Partial'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : inv.status === 'Draft'
                                       ? 'bg-orange-100 text-orange-700'
                                       : 'bg-red-100 text-red-700'
                           }`}>
                              {inv.status}
                           </span>
                         </td>
                         <td className="py-4 px-6 text-right">
                            <p className="text-[15px] font-black text-gray-900">₹{(inv.grandTotal || 0).toFixed(2)}</p>
                            {inv.status !== 'Paid' && inv.status !== 'Draft' && (
                               <p className="text-[11px] font-bold text-red-500 mt-0.5">
                                  Due: ₹{(inv.grandTotal - (inv.amountPaid || 0)).toFixed(2)}
                               </p>
                            )}
                         </td>
                       </tr>
                       {expandedInvoice === inv._id && (
                         <tr className="bg-slate-50/80 border-t border-gray-100">
                           <td colSpan={6} className="p-0">
                             <div className="px-8 py-6">
                               <h4 className="text-sm font-black text-[#11327c] mb-4 uppercase tracking-widest">Order Line Items</h4>
                               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                 <table className="w-full text-left border-collapse">
                                   <thead className="bg-gray-50/80">
                                     <tr>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200">Medicine Name</th>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200">Pack</th>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200">Batch</th>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 text-center">Expiry</th>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 text-center">Qty</th>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 text-right">Cost Price</th>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 text-right">MRP</th>
                                       <th className="py-2.5 px-4 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 text-right">GST</th>
                                     </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                     {inv.items?.map((item: any, idx: number) => (
                                       <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                         <td className="py-2.5 px-4 text-[13px] font-bold text-gray-900">{item.name}</td>
                                         <td className="py-2.5 px-4 text-[12px] font-bold text-gray-500">{item.pack || "-"}</td>
                                         <td className="py-2.5 px-4 text-[12px] font-medium text-gray-600 font-mono">{item.batchNumber || "-"}</td>
                                         <td className="py-2.5 px-4 text-[12px] font-medium text-gray-600 text-center">{item.expiryDate ? format(new Date(item.expiryDate), "MM/yy") : "-"}</td>
                                         <td className="py-2.5 px-4 text-[12px] font-bold text-gray-900 text-center">{item.qty} {item.freeQty ? <span className="text-emerald-600 text-[10px] ml-1">(+{item.freeQty} Free)</span> : ""}</td>
                                         <td className="py-2.5 px-4 text-[12px] font-bold text-gray-900 text-right">₹{(item.buyingPrice || 0).toFixed(2)}</td>
                                         <td className="py-2.5 px-4 text-[12px] font-bold text-gray-600 text-right">₹{(item.mrp || 0).toFixed(2)}</td>
                                         <td className="py-2.5 px-4 text-[12px] font-bold text-gray-600 text-right">{item.gstPercent || 0}%</td>
                                       </tr>
                                     ))}
                                     {(!inv.items || inv.items.length === 0) && (
                                       <tr>
                                         <td colSpan={8} className="py-4 text-center text-sm font-medium text-gray-500">No line items found for this invoice.</td>
                                       </tr>
                                     )}
                                   </tbody>
                                 </table>
                               </div>
                             </div>
                           </td>
                         </tr>
                       )}
                       </React.Fragment>
                   ))}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-xl">
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
    </div>
  );
}

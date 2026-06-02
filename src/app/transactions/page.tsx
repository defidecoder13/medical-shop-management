
"use client";

import React, { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { 
  History, 
  ChevronLeft, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Printer, 
  Search,
  CheckCircle2,
  FileText,
  RotateCcw,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";

type Transaction = {
  _id: string;
  createdAt: string;
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  profit: number;
  discountAmount?: number;
  gstPercent?: number;
  gstEnabled: boolean;
  printInvoice?: boolean;
  isReturn?: boolean;
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
        const data = await apiClient.get('/api/auth/check');
        if (!data) router.push('/login');
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"1d" | "7d" | "1m">("1m");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Return Logic State
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [returnItems, setReturnItems] = useState<{ [key: number]: number }>({});
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    setPage(1); // Reset page on filter/search change
  }, [searchQuery, dateFilter]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      apiClient.get(`/api/transactions?range=${dateFilter}&page=${page}&search=${searchQuery}`)
        .then((response: any) => {
          if (response?.data && Array.isArray(response.data)) {
            setTransactions(response.data);
            setTotalPages(response.pagination?.totalPages || 1);
          } else if (Array.isArray(response)) {
            setTransactions(response);
            setTotalPages(1);
          } else {
            setTransactions([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch transactions:", error);
          setTransactions([]);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [dateFilter, page, searchQuery]);

  // Return Logic Methods
  const handleToggleReturn = (billId: string) => {
    if (expandedBillId === billId) {
      setExpandedBillId(null);
    } else {
      setExpandedBillId(billId);
      setReturnItems({});
      setMessage(null);
    }
  };

  const handleReturnQtyChange = (idx: number, qty: string, maxQty: number) => {
    const num = Number(qty);
    if (num < 0 || num > maxQty) return;
    setReturnItems(prev => ({ ...prev, [idx]: num }));
  };

  const handleSubmitReturn = async (bill: Transaction) => {
    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([idxStr, qty]) => {
         const originalItem = bill.items[Number(idxStr)];
         return {
            batchNumber: originalItem.batchNumber,
            name: originalItem.name,
            returnQty: qty
         };
      });

    if (itemsToReturn.length === 0) {
       setMessage({ text: "Please specify return quantities", type: "error" });
       return;
    }

    setSubmittingReturn(true);
    setMessage(null);
    try {
       await apiClient.post('/api/returns', {
          originalBillId: bill._id,
          returnedItems: itemsToReturn
       });
       setMessage({ text: "Return processed successfully!", type: "success" });
       setTimeout(() => {
          setExpandedBillId(null);
          // Trigger a re-fetch to see the new return bill
          setPage(1); 
          setSearchQuery(""); // Optionally clear search to force refresh
          window.location.reload(); // Hard reload to ensure fresh data for now
       }, 1000);
    } catch (err: any) {
       console.error(err);
       setMessage({ text: err.message || "Failed to process return", type: "error" });
       setSubmittingReturn(false);
    }
  };

  const filteredTransactions = transactions;
  const exportToExcel = async () => {
    if (filteredTransactions.length === 0) return;
    
    setLoading(true);
    try {
      // For export, we use the already filtered and fetched transactions
      const allTransactions = filteredTransactions;

      // Sheet 1: Invoice Summary (GST Optimized)
      const invoiceData = allTransactions.map(t => ({
        'Date': format(new Date(t.createdAt), "dd-MM-yyyy HH:mm"),
        'Invoice ID': t._id.slice(-8).toUpperCase(),
        'Taxable Value': (t.subTotal - (t.discountAmount || 0)).toFixed(2),
        'GST %': t.gstPercent ? `${t.gstPercent}%` : 'N/A',
        'GST Amount': (t.gstAmount || 0).toFixed(2),
        'Discount': (t.discountAmount || 0).toFixed(2),
        'Grand Total': (t.grandTotal || 0).toFixed(2),
        'Profit': (t.profit || 0).toFixed(2),
        'Items Count': t.items.length
      }));

      // Sheet 2: Itemized Breakdown
      const itemizedData: any[] = [];
      allTransactions.forEach(t => {
        t.items.forEach(item => {
          // Calculate proportional discount for the item for tax accuracy
          const totalBeforeDiscount = t.subTotal;
          const discountRatio = t.discountAmount && totalBeforeDiscount > 0 
            ? t.discountAmount / totalBeforeDiscount 
            : 0;
          
          const itemOriginalTotal = item.total;
          const itemDiscount = itemOriginalTotal * discountRatio;
          const itemTaxableValue = itemOriginalTotal - itemDiscount;
          
          itemizedData.push({
            'Invoice Date': format(new Date(t.createdAt), "dd-MM-yyyy"),
            'Invoice ID': t._id.slice(-8).toUpperCase(),
            'Medicine Name': item.name,
            'Batch': item.batchNumber,
            'Unit': item.unitType,
            'Qty': item.qty,
            'Price/Unit': item.sellingPrice.toFixed(2),
            'Gross Total': itemOriginalTotal.toFixed(2),
            'Discount': itemDiscount.toFixed(2),
            'Taxable Value': itemTaxableValue.toFixed(2),
          });
        });
      });

      // Create Workbook
      const wb = XLSX.utils.book_new();
      
      const wsInvoices = XLSX.utils.json_to_sheet(invoiceData);
      const wsItems = XLSX.utils.json_to_sheet(itemizedData);
      
      // Auto-size columns (Simple implementation)
      const fitToColumn = (data: any[]) => {
        const columnWidths = Object.keys(data[0] || {}).map(key => ({
          wch: Math.max(key.length, ...data.map(obj => obj[key]?.toString().length || 0)) + 2
        }));
        return columnWidths;
      };

      wsInvoices['!cols'] = fitToColumn(invoiceData);
      wsItems['!cols'] = fitToColumn(itemizedData);

      XLSX.utils.book_append_sheet(wb, wsInvoices, "Invoices Summary");
      XLSX.utils.book_append_sheet(wb, wsItems, "Itemized Sales");
      
      XLSX.writeFile(wb, `Tax_Invoices_Filtered_Export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#11327c]/10 border-t-[#11327c] rounded-full animate-spin" />
        <p className="text-[13px] font-bold text-[#11327c] animate-pulse">Loading Transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-[#11327c] tracking-tight">Transaction History</h2>
          <p className="text-[13px] text-gray-500 font-medium">View and manage past sales records.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[12px] uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <FileSpreadsheet size={18} strokeWidth={2.5} />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] transition-colors" size={18} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search by ID, Date, Items, or Amount..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
          {(["1d", "7d", "1m"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateFilter(range)}
              className={`px-5 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                dateFilter === range
                  ? "bg-[#11327c] text-white shadow-md shadow-[#11327c]/20"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100">
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Date & Time</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Transaction ID</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Items</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Amount</th>
                <th className="px-7 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((t) => (
                <Fragment key={t._id}>
                <tr className={`hover:bg-[#f8fafc]/80 transition-colors group ${t.isReturn ? 'bg-rose-50/20' : ''}`}>
                  <td className="px-7 py-5">
                    <div className="flex flex-col gap-0.5">
                       <div className={`text-[13.5px] font-black tracking-tight ${t.isReturn ? 'text-rose-600' : 'text-[#11327c]'}`}>
                         {format(new Date(t.createdAt), "dd MMM, yyyy")}
                       </div>
                       <div className="flex items-center gap-2 mt-1">
                          <div className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                            {format(new Date(t.createdAt), "hh:mm a")}
                          </div>
                          {/* @ts-ignore - isUnsynced is custom property */}
                          {t.isUnsynced && (
                             <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 size={10} strokeWidth={3} />
                                Unsynced
                             </span>
                          )}
                          {t.isReturn && (
                             <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-wider">
                                Refund
                             </span>
                          )}
                       </div>
                    </div>
                  </td>
                  <td className="px-7 py-5">
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[11px] font-black font-mono tracking-wider">
                      #{t._id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-7 py-5">
                    <div className="flex flex-col gap-1.5">
                      {t.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-[13px] font-bold text-gray-700 leading-tight">
                          {item.name} <span className="text-[11px] text-gray-400 ml-1 font-black">× {item.qty}</span>
                        </div>
                      ))}
                      {t.items.length > 2 && (
                        <div className="text-[11px] font-black text-[#11327c] uppercase tracking-widest opacity-60">
                          + {t.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-7 py-5 text-right">
                    <div className={`text-[15px] font-black tracking-tight ${t.isReturn ? 'text-rose-600' : 'text-[#11327c]'}`}>
                      {t.isReturn ? '-' : ''}₹{Math.abs(t.grandTotal).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      Tax: ₹{Math.abs(t.gstAmount).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-7 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/transactions/${t._id}`}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#11327c] hover:bg-[#11327c]/5 rounded-xl transition-all border border-transparent hover:border-[#11327c]/10 active:scale-95"
                        title="View Details"
                      >
                        <Eye size={18} strokeWidth={2.5} />
                      </Link>
                      {!t.isReturn && (
                        <button
                          onClick={() => handleToggleReturn(t._id)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border active:scale-95 ${
                            expandedBillId === t._id 
                              ? 'text-rose-600 bg-rose-50 border-rose-200 shadow-inner' 
                              : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-100'
                          }`}
                          title="Process Return"
                        >
                          <RotateCcw size={16} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* INLINE RETURN UI */}
                {expandedBillId === t._id && (
                  <tr className="bg-rose-50/30 border-b border-rose-100/50">
                    <td colSpan={5} className="p-0">
                       <div className="px-7 py-6 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                          <div className="bg-white rounded-xl border border-rose-100 shadow-sm p-6 relative">
                             <button onClick={() => setExpandedBillId(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                               <X size={20} />
                             </button>
                             
                             <h3 className="text-[15px] font-black text-rose-800 tracking-tight flex items-center gap-2 mb-4">
                               <RotateCcw size={18} className="text-rose-600" />
                               Process Return for Invoice #{t._id.slice(-8).toUpperCase()}
                             </h3>
                             
                             <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                                <table className="w-full text-left">
                                   <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr>
                                         <th className="px-4 py-3 text-[11px] font-black text-gray-500 uppercase">Item</th>
                                         <th className="px-4 py-3 text-[11px] font-black text-gray-500 uppercase text-center">Purchased Qty</th>
                                         <th className="px-4 py-3 text-[11px] font-black text-gray-500 uppercase text-right">Return Qty</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                      {t.items.map((item, idx) => {
                                         // Mocked logic for maxQty, ideally backend would send how much was already returned.
                                         // For now, we assume max return is the original qty.
                                         const maxQty = item.qty;
                                         return (
                                            <tr key={idx}>
                                               <td className="px-4 py-3">
                                                  <div className="font-bold text-gray-900 text-[13px]">{item.name}</div>
                                                  <div className="text-[11px] text-gray-500 font-mono">Batch: {item.batchNumber}</div>
                                               </td>
                                               <td className="px-4 py-3 text-center font-black text-gray-700">{maxQty}</td>
                                               <td className="px-4 py-3 text-right">
                                                  <input
                                                     type="number"
                                                     min="0"
                                                     max={maxQty}
                                                     value={returnItems[idx] || ""}
                                                     onChange={(e) => handleReturnQtyChange(idx, e.target.value, maxQty)}
                                                     className="w-20 px-3 py-1.5 text-right border border-gray-300 rounded-md focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-bold text-rose-700"
                                                     placeholder="0"
                                                  />
                                               </td>
                                            </tr>
                                         );
                                      })}
                                   </tbody>
                                </table>
                             </div>

                             {message && (
                                <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 border ${
                                  message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                   {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                   <p className="text-sm font-semibold">{message.text}</p>
                                </div>
                             )}

                             <div className="flex justify-end gap-3">
                                <button
                                   onClick={() => setExpandedBillId(null)}
                                   className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                   Cancel
                                </button>
                                <button
                                   onClick={() => handleSubmitReturn(t)}
                                   disabled={submittingReturn}
                                   className="px-6 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-rose-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                   {submittingReturn && <Loader2 size={16} className="animate-spin" />}
                                   Confirm Refund
                                </button>
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-7 py-24 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        {transactions.length === 0 && !loading && (
                          <div className="p-12 text-center text-gray-500">
                            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-lg font-medium text-gray-900">No transactions found</p>
                            <p className="text-sm">Try adjusting your filters or search query.</p>
                          </div>
                        )}
                      </div>
                      

                   </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
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
        <div className="p-6 bg-[#f8fafc]/50 border-t border-gray-100 text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 flex justify-between items-center">
           <span>Sales: <span className="text-[#11327c] ml-1">{filteredTransactions.filter(t => !t.isReturn).length}</span></span>
           <span>Refunds: <span className="text-rose-500 ml-1">{filteredTransactions.filter(t => t.isReturn).length}</span></span>
        </div>
      </div>
    </div>
  );
}

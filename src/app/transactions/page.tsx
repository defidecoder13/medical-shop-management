
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
  X,
  TrendingUp,
  Undo,
  Receipt,
  ShoppingCart,
  Copy,
  MoreVertical,
  Banknote,
  CreditCard
} from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";

type Transaction = {
  _id: string;
  invoiceNumber?: string;
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
  patientName?: string;
  patientPhone?: string;
  paymentMethod?: string;
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
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"1d" | "7d" | "1m">("1m");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalSalesCount: 0,
    totalRefunds: 0,
    totalRefundsCount: 0,
    totalItemsSold: 0
  });

  // Return Logic State
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [returnItems, setReturnItems] = useState<{ [key: number]: number }>({});
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    setPage(1); // Reset page on filter/search change
  }, [searchQuery, dateFilter, paymentMethod, status]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const handleData = (response: any) => {
          if (response?.data && Array.isArray(response.data)) {
            setTransactions(response.data);
            setTotalPages(response.pagination?.totalPages || 1);
            if (response.summary) setSummary(response.summary);
          } else if (Array.isArray(response)) {
            setTransactions(response);
            setTotalPages(1);
          } else {
            setTransactions([]);
          }
          setLoading(false);
      };

      apiClient.get(`/api/transactions?range=${dateFilter}&page=${page}&search=${searchQuery}&paymentMethod=${paymentMethod}&status=${status}`, {}, handleData)
        .then(handleData)
        .catch((error) => {
          console.error("Failed to fetch transactions:", error);
          setTransactions([]);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [dateFilter, page, searchQuery, paymentMethod, status]);

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
  const expandedBill = transactions.find(t => t._id === expandedBillId);
  const exportToExcel = async () => {
    if (filteredTransactions.length === 0) return;
    
    setLoading(true);
    try {
      // For export, we use the already filtered and fetched transactions
      const allTransactions = filteredTransactions;

      // Sheet 1: Invoice Summary (GST Optimized)
      const invoiceData = allTransactions.map(t => ({
        'Date': format(new Date(t.createdAt), "dd-MM-yyyy HH:mm"),
        'Invoice ID': t.invoiceNumber || t._id.slice(-8).toUpperCase(),
        'Taxable Value': ((t.subTotal || 0) - (t.discountAmount || 0)).toFixed(2),
        'GST %': t.gstPercent ? `${t.gstPercent}%` : 'N/A',
        'GST Amount': (t.gstAmount || 0).toFixed(2),
        'Discount': (t.discountAmount || 0).toFixed(2),
        'Grand Total': (t.grandTotal || 0).toFixed(2),
        'Profit': (t.profit || 0).toFixed(2),
        'Items Count': t.items?.length || 0
      }));

      // Sheet 2: Itemized Breakdown
      const itemizedData: any[] = [];
      allTransactions.forEach(t => {
        t.items.forEach(item => {
          // Calculate proportional discount for the item for tax accuracy
          const totalBeforeDiscount = t.subTotal || 0;
          const discountRatio = t.discountAmount && totalBeforeDiscount > 0 
            ? t.discountAmount / totalBeforeDiscount 
            : 0;
          
          const itemOriginalTotal = item.total || 0;
          const itemDiscount = itemOriginalTotal * discountRatio;
          const itemTaxableValue = itemOriginalTotal - itemDiscount;
          
          itemizedData.push({
            'Invoice Date': format(new Date(t.createdAt), "dd-MM-yyyy"),
            'Invoice ID': t.invoiceNumber || t._id.slice(-8).toUpperCase(),
            'Medicine Name': item.name || 'Unknown',
            'Batch': item.batchNumber || 'N/A',
            'Unit': item.unitType || 'N/A',
            'Qty': item.qty || 0,
            'Price/Unit': (item.sellingPrice || 0).toFixed(2),
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
  
  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Receipt size={32} strokeWidth={2.5} className="text-[#11327c]" />
          <div>
            <h2 className="text-[28px] font-extrabold text-[#11327c] tracking-tight leading-tight">Transaction History</h2>
            <p className="text-[14px] text-gray-500 font-medium">View and manage all past sales transactions.</p>
          </div>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-6 py-3 bg-[#10b981] text-white rounded-lg font-bold text-[13px] uppercase tracking-wider hover:bg-[#059669] transition-all shadow-md active:scale-95"
        >
          <FileSpreadsheet size={18} strokeWidth={2.5} />
          Export to Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingCart size={28} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] text-gray-500 font-bold mb-1">Total Sales</div>
            <div className="text-[24px] font-black text-[#11327c] tracking-tight leading-none mb-2">₹{summary.totalSales.toFixed(2)}</div>
            <div className="text-[13px] font-black text-gray-400">{summary.totalSalesCount} Bills</div>
          </div>
        </div>
        
        {/* Total Items Sold */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={28} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] text-gray-500 font-bold mb-1">Total Items Sold</div>
            <div className="text-[24px] font-black text-emerald-600 tracking-tight leading-none mb-2">{summary.totalItemsSold}</div>
            <div className="text-[13px] font-black text-gray-400">Selected Period</div>
          </div>
        </div>
        
        {/* Total Refunds */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Undo size={28} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] text-gray-500 font-bold mb-1">Total Refunds</div>
            <div className="text-[24px] font-black text-orange-500 tracking-tight leading-none mb-2">₹{summary.totalRefunds.toFixed(2)}</div>
            <div className="text-[13px] font-black text-gray-400">{summary.totalRefundsCount} Refunds</div>
          </div>
        </div>

        {/* Avg. Bill Value */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Receipt size={28} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] text-gray-500 font-bold mb-1">Avg. Bill Value</div>
            <div className="text-[24px] font-black text-purple-600 tracking-tight leading-none mb-2">
              ₹{summary.totalSalesCount > 0 ? (summary.totalSales / summary.totalSalesCount).toFixed(2) : "0.00"}
            </div>
            <div className="text-[13px] font-black text-gray-400">Selected Period</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap xl:flex-nowrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] transition-colors" size={18} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search medicines, invoices, customers..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-gray-800 placeholder:text-gray-400 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <select 
            className="px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 min-w-[170px] shadow-sm appearance-none cursor-pointer"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>

          <select 
            className="px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 min-w-[130px] shadow-sm appearance-none cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>

          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shrink-0 shadow-sm">
            {(["1d", "7d", "1m"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-4 py-2.5 text-[12px] font-bold rounded-lg transition-all ${
                  dateFilter === range
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        <div className="overflow-x-auto relative">
          {loading && (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
               <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
             </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100">
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Date & Time</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Transaction ID</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Customer</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Items</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Amount</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Payment</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Status</th>
                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTransactions.map((t) => (
                <Fragment key={t._id}>
                <tr className="hover:bg-[#f8fafc] transition-colors group bg-white">
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        {t.isReturn ? <Undo size={14} strokeWidth={2.5} /> : <FileText size={14} strokeWidth={2.5} />}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-[13px] font-black text-[#11327c]">
                          {format(new Date(t.createdAt), "dd MMM, yyyy")}
                        </div>
                        <div className="text-[11px] font-bold text-gray-400">
                          {format(new Date(t.createdAt), "hh:mm a")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-blue-600">
                        #{t.invoiceNumber || t._id.slice(-8).toUpperCase()}
                      </span>
                      <button className="text-gray-300 hover:text-gray-500" onClick={() => navigator.clipboard.writeText(t.invoiceNumber || t._id.slice(-8).toUpperCase())}>
                        <Copy size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex flex-col">
                      <div className="text-[13px] font-bold text-gray-800">
                         {t.patientName || "Walk-in Customer"}
                      </div>
                      <div className="text-[11px] font-medium text-gray-500 mt-0.5">
                         {t.patientPhone ? `+91 ${t.patientPhone}` : "-"}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex flex-col gap-1 items-start">
                      {t.items.slice(0, 1).map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-gray-800">{item.name}</span>
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-1.5 py-0.5 rounded">× {item.qty}</span>
                        </div>
                      ))}
                      <div className="text-[11px] text-gray-400 font-medium">
                        {t.items.length} {t.items.length === 1 ? 'Item' : 'Items'}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex flex-col">
                      <div className="text-[14px] font-black text-blue-600">
                        ₹{Math.abs(t.grandTotal).toFixed(2)}
                      </div>
                      <div className="text-[11px] font-medium text-gray-400 mt-0.5">
                        Tax: ₹{Math.abs(t.gstAmount).toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-1.5">
                      {t.paymentMethod === 'Card' ? <CreditCard size={14} className="text-emerald-600" /> : <Banknote size={14} className="text-emerald-600" />}
                      <span className="text-[12px] font-bold text-gray-700">{t.paymentMethod || 'Cash'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    {t.isReturn ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-black">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Refunded
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-black">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/transactions/${t._id}`}
                        className="w-8 h-8 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={14} strokeWidth={2.5} />
                      </Link>
                      {!t.isReturn && (
                        <button
                          onClick={() => handleToggleReturn(t._id)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                            expandedBillId === t._id 
                              ? 'text-rose-600 bg-rose-50' 
                              : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Process Return"
                        >
                          <RotateCcw size={16} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                </Fragment>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-7 py-24 text-center">
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

      {/* MODAL RETURN UI */}
      {expandedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => setExpandedBillId(null)} />
          
          <div className="relative bg-white rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
             <div className="p-6">
                <button onClick={() => setExpandedBillId(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} strokeWidth={2.5} />
                </button>
                
                <h3 className="text-[17px] font-black text-[#e11d48] tracking-tight flex items-center gap-2 mb-6">
                  <RotateCcw size={20} className="text-[#e11d48]" strokeWidth={2.5} />
                  Process Return for Invoice #{expandedBill.invoiceNumber || expandedBill._id.slice(-8).toUpperCase()}
                </h3>
                
                <div className="border border-gray-100 rounded-xl overflow-hidden mb-6 shadow-sm">
                   <table className="w-full text-left">
                      <thead className="bg-[#f8fafc] border-b border-gray-100">
                         <tr>
                            <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Item</th>
                            <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Purchased Qty</th>
                            <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Return Qty</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {expandedBill.items.map((item, idx) => {
                            const maxQty = item.qty;
                            return (
                               <tr key={idx} className="bg-white">
                                  <td className="px-5 py-4">
                                     <div className="font-bold text-gray-800 text-[14px]">{item.name}</div>
                                     <div className="text-[11px] text-gray-400 font-mono mt-0.5">Batch: {item.batchNumber}</div>
                                  </td>
                                  <td className="px-5 py-4 text-center font-black text-gray-600 text-[15px]">{maxQty}</td>
                                  <td className="px-5 py-4 text-right">
                                     <input
                                        type="number"
                                        min="0"
                                        max={maxQty}
                                        value={returnItems[idx] || ""}
                                        onChange={(e) => handleReturnQtyChange(idx, e.target.value, maxQty)}
                                        className="w-24 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:border-[#e11d48] focus:ring-2 focus:ring-[#e11d48]/20 font-black text-[#e11d48] text-[15px] transition-all bg-gray-50 focus:bg-white mx-auto block mr-0"
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
                   <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 border ${
                     message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                   }`}>
                      {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      <p className="text-[13px] font-bold">{message.text}</p>
                   </div>
                )}

                <div className="flex justify-end gap-3 mt-8">
                   <button
                      onClick={() => setExpandedBillId(null)}
                      className="px-6 py-2.5 text-[13px] font-bold text-gray-600 hover:text-gray-900 bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-xl transition-colors"
                   >
                      Cancel
                   </button>
                   <button
                      onClick={() => handleSubmitReturn(expandedBill)}
                      disabled={submittingReturn}
                      className="px-6 py-2.5 bg-[#e11d48] text-white text-[13px] font-bold rounded-xl shadow-md hover:bg-[#be123c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                   >
                      {submittingReturn && <Loader2 size={16} className="animate-spin" />}
                      Confirm Refund
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

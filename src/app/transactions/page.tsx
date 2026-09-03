
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
  CreditCard,
  Send
} from "@/src/components/icons";
import { apiClient } from "@/src/lib/apiClient";
import { Badge } from "@/src/components/ui/badge";

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
  const [dateFilter, setDateFilter] = useState<"1d" | "7d" | "1m" | "all">("1m");
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
             returnQty: qty,
             unitType: originalItem.unitType,
             itemIndex: Number(idxStr)
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
            'Product Name': item.name || 'Unknown',
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
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <button
          onClick={exportToExcel}
          className="btn-success btn-md"
        >
          <FileSpreadsheet size={17} strokeWidth={2.4} />
          Export to Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#11327c] to-[#1e58b8] text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
            <ShoppingCart size={22} strokeWidth={2.3} />
          </div>
          <div>
            <div className="text-[12px] text-muted-foreground font-semibold mb-1">Total Sales</div>
            <div className="font-display text-[22px] font-extrabold text-foreground tracking-tight leading-none mb-1.5">₹{summary.totalSales.toFixed(2)}</div>
            <div className="text-[12px] font-bold text-muted-foreground/70">{summary.totalSalesCount} Bills</div>
          </div>
        </div>
        
        {/* Total Items Sold */}
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
            <TrendingUp size={22} strokeWidth={2.3} />
          </div>
          <div>
            <div className="text-[12px] text-muted-foreground font-semibold mb-1">Total Items Sold</div>
            <div className="font-display text-[22px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none mb-1.5">{summary.totalItemsSold}</div>
            <div className="text-[12px] font-bold text-muted-foreground/70">Selected Period</div>
          </div>
        </div>
        
        {/* Total Refunds */}
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
            <Undo size={22} strokeWidth={2.3} />
          </div>
          <div>
            <div className="text-[12px] text-muted-foreground font-semibold mb-1">Total Refunds</div>
            <div className="font-display text-[22px] font-extrabold text-orange-500 dark:text-orange-400 tracking-tight leading-none mb-1.5">₹{summary.totalRefunds.toFixed(2)}</div>
            <div className="text-[12px] font-bold text-muted-foreground/70">{summary.totalRefundsCount} Refunds</div>
          </div>
        </div>

        {/* Avg. Bill Value */}
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
            <Receipt size={22} strokeWidth={2.3} />
          </div>
          <div>
            <div className="text-[12px] text-muted-foreground font-semibold mb-1">Avg. Bill Value</div>
            <div className="font-display text-[22px] font-extrabold text-violet-600 dark:text-violet-400 tracking-tight leading-none mb-1.5">
              ₹{summary.totalSalesCount > 0 ? (summary.totalSales / summary.totalSalesCount).toFixed(2) : "0.00"}
            </div>
            <div className="text-[12px] font-bold text-muted-foreground/70">Selected Period</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap xl:flex-nowrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] dark:group-focus-within:text-blue-400 transition-colors" size={18} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search by customer name, phone, or invoice no..."
            className="input pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
          <select 
            className="select min-w-[170px]"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="all">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>

          <select 
            className="select min-w-[130px]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>

          <div className="flex bg-muted/70 p-1 rounded-xl border border-border shrink-0">
            {(["1d", "7d", "1m", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3.5 py-2 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                  dateFilter === range
                    ? "bg-card text-primary shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "all" ? "ALL TIME" : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className={`surface-card overflow-hidden transition-all duration-200 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        <div className="overflow-x-auto relative">
          {loading && (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
               <Loader2 className="w-8 h-8 text-primary animate-spin" />
             </div>
          )}
          <table className="table-shell">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="th">Date & Time</th>
                <th className="th">Transaction ID</th>
                <th className="th">Customer</th>
                <th className="th">Items</th>
                <th className="th">Amount</th>
                <th className="th">Payment</th>
                <th className="th">Status</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTransactions.map((t) => (
                <Fragment key={t._id}>
                <tr className="tbody-row group">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.isReturn ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400' : 'bg-primary/10 text-primary'}`}>
                        {t.isReturn ? <Undo size={14} strokeWidth={2.5} /> : <FileText size={14} strokeWidth={2.5} />}
                      </div>
                      <div className="flex flex-col">
                        <div className="text-[13px] font-bold text-foreground">
                          {format(new Date(t.createdAt), "dd MMM, yyyy")}
                        </div>
                        <div className="text-[11px] font-semibold text-muted-foreground">
                          {format(new Date(t.createdAt), "hh:mm a")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[12.5px] font-bold text-primary">
                        #{t.invoiceNumber || t._id.slice(-8).toUpperCase()}
                      </span>
                      <button className="text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer" aria-label="Copy invoice number" onClick={() => navigator.clipboard.writeText(t.invoiceNumber || t._id.slice(-8).toUpperCase())}>
                        <Copy size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col">
                      <div className="text-[13px] font-bold text-foreground">
                         {t.patientName || "Walk-in Customer"}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                         {t.patientPhone ? `+91 ${t.patientPhone}` : "-"}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1 items-start">
                      {t.items.slice(0, 1).map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-foreground">{item.name}</span>
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">× {item.qty}</span>
                        </div>
                      ))}
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {t.items.length} {t.items.length === 1 ? 'Item' : 'Items'}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col">
                      <div className="font-display text-[14px] font-extrabold text-foreground">
                        ₹{Math.abs(t.grandTotal).toFixed(2)}
                      </div>
                      <div className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        Tax: ₹{Math.abs(t.gstAmount).toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1.5">
                      {t.paymentMethod === 'Card' ? <CreditCard size={14} className="text-emerald-600 dark:text-emerald-400" /> : t.paymentMethod === 'UPI' ? <Send size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Banknote size={14} className="text-emerald-600 dark:text-emerald-400" />}
                      <span className="text-[12px] font-bold text-foreground">{t.paymentMethod || 'Cash'}</span>
                    </div>
                  </td>
                  <td className="td">
                    {t.isReturn ? (
                      <Badge variant="danger">Refunded</Badge>
                    ) : (
                      <Badge variant="success">Completed</Badge>
                    )}
                  </td>
                  <td className="td text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/transactions/${t._id}`}
                        className="btn-ghost btn-icon text-primary bg-primary/8 hover:bg-primary/15"
                        title="View Details"
                      >
                        <Eye size={15} strokeWidth={2.5} />
                      </Link>
                      {!t.isReturn && (
                        <button
                          onClick={() => handleToggleReturn(t._id)}
                          className={`btn-ghost btn-icon ${expandedBillId === t._id ? 'text-red-500 bg-red-50 dark:bg-red-950/40' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40'}`}
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
              {filteredTransactions.length === 0 && !loading && (
                <tr>
                   <td colSpan={8} className="px-7 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" strokeWidth={1.6} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-foreground font-bold text-[15px]">No transactions found</p>
                          <p className="text-muted-foreground text-[13px] font-medium">Try adjusting your filters or search query.</p>
                        </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/40 rounded-b-xl">
              <span className="text-[13px] text-muted-foreground font-semibold">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="btn-outline btn-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="btn-outline btn-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-5 bg-muted/40 border-t border-border text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex justify-between items-center">
           <span>Sales: <span className="text-primary ml-1">{filteredTransactions.filter(t => !t.isReturn).length}</span></span>
           <span>Refunds: <span className="text-red-500 ml-1">{filteredTransactions.filter(t => t.isReturn).length}</span></span>
        </div>
      </div>

      {/* MODAL RETURN UI */}
      {expandedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={() => setExpandedBillId(null)} />
          
          <div className="relative bg-card rounded-3xl shadow-pop w-full max-w-4xl overflow-hidden border border-border">
             <div className="p-6">
                <button onClick={() => setExpandedBillId(null)} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" aria-label="Close">
                  <X size={20} strokeWidth={2.5} />
                </button>
                
                <h3 className="font-display text-[17px] font-extrabold text-red-600 dark:text-red-400 tracking-tight flex items-center gap-2 mb-6">
                  <RotateCcw size={20} strokeWidth={2.5} />
                  Process Return for Invoice #{expandedBill.invoiceNumber || expandedBill._id.slice(-8).toUpperCase()}
                </h3>
                
                <div className="border border-border rounded-xl overflow-hidden mb-6 shadow-card">
                   <table className="table-shell">
                      <thead className="bg-muted/40 border-b border-border">
                         <tr>
                            <th className="th">Item</th>
                            <th className="th text-center">Purchased Qty</th>
                            <th className="th text-right">Return Qty</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                         {expandedBill.items.map((item, idx) => {
                            const maxQty = item.qty;
                            return (
                               <tr key={idx} className="tbody-row">
                                  <td className="td">
                                     <div className="font-bold text-foreground text-[14px]">{item.name}</div>
                                     <div className="text-[11px] text-muted-foreground font-mono mt-0.5">Batch: {item.batchNumber}</div>
                                  </td>
                                  <td className="td text-center font-bold text-foreground text-[15px]">{maxQty}</td>
                                  <td className="td text-right">
                                     <input
                                        type="number"
                                        min="0"
                                        max={maxQty}
                                        value={returnItems[idx] || ""}
                                        onChange={(e) => handleReturnQtyChange(idx, e.target.value, maxQty)}
                                        className="w-24 px-3 py-2 text-center border border-input rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 font-bold text-red-600 dark:text-red-400 text-[15px] transition-all bg-muted/50 focus:bg-card mx-auto block"
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
                     message.type === 'error' ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/50' : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50'
                   }`}>
                      {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      <p className="text-[13px] font-bold">{message.text}</p>
                   </div>
                )}

                <div className="flex justify-end gap-3 mt-8">
                   <button
                      onClick={() => setExpandedBillId(null)}
                      className="btn-outline btn-md"
                   >
                      Cancel
                   </button>
                   <button
                      onClick={() => handleSubmitReturn(expandedBill)}
                      disabled={submittingReturn}
                      className="btn-danger btn-md"
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

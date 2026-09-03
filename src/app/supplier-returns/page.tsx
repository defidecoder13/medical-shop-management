"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, 
  Search,
  CheckCircle2,
  Plus,
  IndianRupee,
  Package
} from "@/src/components/icons";
import { apiClient } from "@/src/lib/apiClient";
import { Badge } from "@/src/components/ui/badge";

type SupplierReturn = {
  _id: string;
  createdAt: string;
  supplierName: string;
  reason: string;
  totalRefundAmount: number;
  items: Array<{
    name: string;
    batchNumber: string;
    unitType: "strip" | "tablet";
    qty: number;
    buyingPrice: number;
    total: number;
  }>;
};

export default function SupplierReturnsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"1d" | "7d" | "1m" | "all">("1m");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, searchQuery]);

  useEffect(() => {
    setLoading(true);
    const timeoutId = setTimeout(() => {
      const handleData = (res: any) => {
          if (res?.data && Array.isArray(res.data)) {
            setReturns(res.data);
            setTotalPages(res.pagination?.totalPages || 1);
          } else if (Array.isArray(res)) {
            setReturns(res);
            setTotalPages(1);
          } else {
            setReturns([]);
          }
          setLoading(false);
      };
      apiClient.get(`/api/supplier-returns?range=${dateFilter}&page=${page}&limit=20&search=${searchQuery}`, {}, handleData)
        .then(handleData)
        .catch((error) => {
          console.error("Failed to fetch supplier returns:", error);
          setReturns([]);
          setLoading(false);
        });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [dateFilter, page, searchQuery]);

  const filteredReturns = returns;

  const totalRefund = returns.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0);
  const totalItems = returns.reduce((sum, r) => sum + (r.items?.length || 0), 0);

  const exportToExcel = async () => {
    if (filteredReturns.length === 0) return;
    setLoading(true);
    try {
      const exportData = filteredReturns.map(t => ({
        'Date': format(new Date(t.createdAt), "dd-MM-yyyy HH:mm"),
        'Return Note ID': t._id.slice(-8).toUpperCase(),
        'Supplier': t.supplierName,
        'Reason': t.reason,
        'Items Contained': t.items.length,
        'Total Debit Value': t.totalRefundAmount.toFixed(2),
      }));

      const itemizedData: any[] = [];
      filteredReturns.forEach(t => {
        t.items.forEach(item => {
          itemizedData.push({
            'Return Note ID': t._id.slice(-8).toUpperCase(),
            'Supplier': t.supplierName,
            'Reason': t.reason,
            'Product Name': item.name,
            'Batch': item.batchNumber,
            'Unit': item.unitType,
            'Qty': item.qty,
            'Cost Price': item.buyingPrice.toFixed(2),
            'Outflow Total': item.total.toFixed(2),
          });
        });
      });

      const wb = XLSX.utils.book_new();
      const wsInvoices = XLSX.utils.json_to_sheet(exportData);
      const wsItems = XLSX.utils.json_to_sheet(itemizedData);
      
      XLSX.utils.book_append_sheet(wb, wsInvoices, "Supplier Returns");
      XLSX.utils.book_append_sheet(wb, wsItems, "Itemized Returns");
      
      XLSX.writeFile(wb, `Supplier_Returns_Export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-primary/25 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      {/* Header Actions */}
      <div className="flex flex-wrap justify-end gap-2.5 mb-6">
          <button
            onClick={() => router.push('/supplier-returns/new')}
            className="btn-primary btn-md"
          >
            <Plus size={17} strokeWidth={2.4} />
            Create Return Note
          </button>
          <button
            onClick={exportToExcel}
            className="btn-outline btn-md"
          >
            <FileSpreadsheet size={17} strokeWidth={2.4} />
            Export Data
          </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-card surface-hover p-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#11327c] to-[#1e58b8] text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
             <FileSpreadsheet size={22} strokeWidth={2.3} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Total Returns</p>
             <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{returns.length} Notes</h2>
           </div>
        </div>

        <div className="surface-card surface-hover p-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
             <IndianRupee size={22} strokeWidth={2.3} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Total Refund Value</p>
             <h2 className="font-display text-[22px] font-extrabold text-red-600 dark:text-red-400 tracking-tighter">₹{totalRefund.toFixed(2)}</h2>
           </div>
        </div>

        <div className="surface-card surface-hover p-5 flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)]">
             <Package size={22} strokeWidth={2.3} />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Items Returned</p>
             <h2 className="font-display text-[22px] font-extrabold text-foreground tracking-tighter">{totalItems} Batches</h2>
           </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="surface-card p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} strokeWidth={2.4} />
          <input 
            type="text" 
            placeholder="Search by ID, Supplier, or Reason..."
            className="input pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-muted/70 p-1 rounded-xl border border-border shrink-0">
          {(["1d", "7d", "1m"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateFilter(range)}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                dateFilter === range
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-shell">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="th">Date & ID</th>
                <th className="th">Supplier Context</th>
                <th className="th">Itemized Return</th>
                <th className="th text-right">Debit Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredReturns.map((t, idx) => (
                <tr key={t._id} className="tbody-row group" style={{ animationDelay: `${idx * 30}ms` }}>
                  <td className="td">
                    <div className="text-[13px] font-bold text-foreground tracking-tight">
                      {format(new Date(t.createdAt), "dd MMM, yyyy")}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Badge variant="warning" className="text-[8px] px-1.5 py-0.5 uppercase">Debit Note</Badge>
                      #{t._id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="td">
                    <div className="font-display text-[14px] font-extrabold text-foreground tracking-tight">
                      {t.supplierName}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-2">
                      Reason: <span className="text-foreground/70 normal-case tracking-normal">{t.reason}</span>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-3">
                      {t.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 group/item">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover/item:bg-primary transition-colors" />
                          <span className="text-[11px] font-bold text-foreground/80 group-hover/item:text-primary transition-colors">{item.name}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">x{item.qty} {item.unitType}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="td text-right">
                    <div className="font-display text-[17px] font-extrabold text-foreground tracking-tighter tabular-nums">
                      ₹{t.totalRefundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Confirmed</p>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                          <FileSpreadsheet size={26} strokeWidth={1.6} className="text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-foreground font-bold text-sm tracking-wide">No Return Records</p>
                          <p className="text-muted-foreground font-medium text-xs">Debit note ledger is currently empty</p>
                        </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-5 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
           <span>Showing <span className="text-primary">{filteredReturns.length}</span> documented returns</span>
           
           {totalPages > 1 && (
             <div className="flex gap-2 items-center">
               <span className="mr-2 normal-case tracking-normal text-[13px] font-semibold">Page {page} of {totalPages}</span>
               <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="btn-outline btn-sm disabled:opacity-30"
               >
                 Prev
               </button>
               <button 
                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                 disabled={page === totalPages}
                 className="btn-outline btn-sm disabled:opacity-30"
               >
                 Next
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

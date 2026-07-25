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
} from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[26px] font-black text-[#11327c] tracking-tight">Supplier Returns</h2>
          <p className="text-[13px] text-gray-500 font-medium">Manage debit notes and stock outflows.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/supplier-returns/new')}
            className="flex items-center gap-2 px-5 py-3 bg-[#11327c] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-[#1e4db7] shadow-lg shadow-[#11327c]/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Create Return Note
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-5 py-3 bg-white text-gray-600 border border-gray-200 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-gray-50 shadow-sm active:scale-95"
          >
            <FileSpreadsheet size={18} strokeWidth={2.5} />
            Export Data
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#11327c] flex items-center justify-center shrink-0">
             <FileSpreadsheet size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Returns</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{returns.length} Notes</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
             <IndianRupee size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Refund Value</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">₹{totalRefund.toFixed(2)}</h2>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_15px_40px_-10px_rgba(17,50,124,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
             <Package size={28} strokeWidth={2.5} />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Items Returned</p>
             <h2 className="text-2xl font-black text-[#11327c] tracking-tighter">{totalItems} Batches</h2>
           </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] transition-colors" size={18} strokeWidth={2.5} />
          <input 
            type="text" 
            placeholder="Search by ID, Supplier, or Reason..."
            className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-[13px] font-bold focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50">
          {(["1d", "7d", "1m"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateFilter(range)}
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                dateFilter === range
                  ? "bg-[#11327c] text-white shadow-md"
                  : "text-gray-400 hover:text-[#11327c] hover:bg-white"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8fafc] border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date & ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Supplier Context</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Itemized Return</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Debit Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredReturns.map((t, idx) => (
                <tr key={t._id} className="hover:bg-[#f8fafc]/50 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 30}ms` }}>
                  <td className="px-8 py-6">
                    <div className="text-[13px] font-black text-[#11327c] tracking-tight">
                      {format(new Date(t.createdAt), "dd MMM, yyyy")}
                    </div>
                    <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5 mt-1">
                      <span className="text-orange-600 font-black uppercase tracking-wider text-[8px] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">DEBIT NOTE</span>
                      #{t._id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-[14px] font-black text-[#11327c] uppercase tracking-tight">
                      {t.supplierName}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                      REASON: <span className="text-[#11327c]/60">{t.reason}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-4 scrollbar-thin">
                      {t.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 group/item">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 group-hover/item:bg-[#11327c] transition-colors" />
                          <span className="text-[11px] font-bold text-gray-500 group-hover/item:text-[#11327c] transition-colors">{item.name}</span>
                          <span className="text-[10px] font-black text-gray-300 uppercase">x{item.qty} {item.unitType}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="text-[18px] font-black text-[#11327c] tracking-tighter">
                      ₹{t.totalRefundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Confirmed</p>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <FileSpreadsheet size={48} strokeWidth={1} className="text-gray-400" />
                        <div className="space-y-1">
                          <p className="text-gray-600 font-black text-sm uppercase tracking-widest">No Return Records</p>
                          <p className="text-gray-400 font-medium text-xs">Debit note ledger is currently empty</p>
                        </div>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 bg-[#f8fafc]/50 border-t border-gray-100 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">
           <span>Showing <span className="text-[#11327c]">{filteredReturns.length}</span> documented returns</span>
           
           {totalPages > 1 && (
             <div className="flex gap-2 items-center">
               <span className="mr-2 normal-case tracking-normal text-sm font-medium">Page {page} of {totalPages}</span>
               <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
               >
                 Prev
               </button>
               <button 
                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                 disabled={page === totalPages}
                 className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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

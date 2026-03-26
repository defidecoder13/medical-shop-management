"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, 
  Search,
  CheckCircle2,
  Plus
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

  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"1d" | "7d" | "1m">("1m");

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/api/supplier-returns?range=${dateFilter}`)
      .then((data) => {
        if (Array.isArray(data)) {
          let sortedData = [...data].sort((a: SupplierReturn, b: SupplierReturn) => {
             return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setReturns(sortedData);
        } else {
          setReturns([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch supplier returns:", error);
        setReturns([]);
        setLoading(false);
      });
  }, [dateFilter]);

  const filteredReturns = Array.isArray(returns) 
    ? returns.filter(t => {
        const searchLower = searchQuery.toLowerCase();
        const dateObj = new Date(t.createdAt);
        
        const dateVariations = [
          format(dateObj, "dd/MM/yyyy HH:mm"),
          format(dateObj, "d/M/yyyy"),
          dateObj.toLocaleDateString(),
        ].map(v => v.toLowerCase());

        const itemsStr = t.items.map(i => i.name).join(", ").toLowerCase();
        const amountStr = t.totalRefundAmount.toString();
        const idStr = t._id.slice(-8).toUpperCase().toLowerCase();
        const supplierStr = t.supplierName.toLowerCase();

        return idStr.includes(searchLower) || 
               supplierStr.includes(searchLower) ||
               dateVariations.some(v => v.includes(searchLower)) || 
               itemsStr.includes(searchLower) || 
               amountStr.includes(searchLower);
      })
    : [];

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
            'Medicine Name': item.name,
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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supplier Returns</h2>
          <p className="text-sm text-muted-foreground">Manage debit notes and stock outflows.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/supplier-returns/new')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Create Return Note
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={18} />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Supplier, or Cost Amount..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all text-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
          {(["1d", "7d", "1m"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateFilter(range)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                dateFilter === range
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary/50 sticky top-0 border-b border-border z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Note ID</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Supplier Context</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Items Sent</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Debit Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReturns.map((t) => (
                <tr key={t._id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="text-sm font-medium text-foreground">
                         {new Date(t.createdAt).toLocaleDateString()}
                       </div>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <span className="text-amber-600 dark:text-amber-500 font-bold uppercase tracking-wider text-[10px] bg-amber-50 dark:bg-amber-900/40 px-1 rounded">Debit Note</span>
                      {t._id.slice(-8).toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-foreground">
                      {t.supplierName}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      Reason: <span className="text-foreground">{t.reason}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                      {t.items.map((item, index) => (
                        <div key={index} className="text-sm text-foreground">
                          {item.name} <span className="text-xs text-muted-foreground">x{item.qty} {item.unitType}(s)</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-foreground">
                      ₹{t.totalRefundAmount.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="opacity-50" />
                        <p>No supplier returns found.</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-secondary/30 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
           <span>Showing {filteredReturns.length} records</span>
        </div>
      </div>
    </div>
  );
}

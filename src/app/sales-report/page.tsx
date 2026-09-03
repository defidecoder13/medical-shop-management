"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import * as XLSX from "xlsx";
import { 
  TrendingUp, 
  BarChart3, 
  FileSpreadsheet, 
  Download, 
  ChevronLeft, 
  CreditCard, 
  Wallet, 
  PieChart,
  Calendar,
  Medal,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  TrendingDown,
  Loader2,
  Trophy,
  AlertCircle
} from "@/src/components/icons";
import Link from "next/link";
import { apiClient } from "@/src/lib/apiClient";

type BillItem = {
  name: string;
  batchNumber: string;
  unitType: "strip" | "tablet";
  qty: number;
  sellingPrice: number;
  total: number;
};

type SalesReportData = {
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  mostSoldMedicine: { name: string; quantity: number } | null;
  leastSoldMedicine: { name: string; quantity: number } | null;
  topSellingMedicines: Array<{ name: string; quantity: number; revenue: number }>;
  leastSellingMedicines: Array<{ name: string; quantity: number; revenue: number }>;
  dailySales: Array<{ date: string; sales: number; profit: number }>;
};

export default function SalesReportPage() {
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"1d" | "7d" | "1m">("7d");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    let start = new Date();
    let end = new Date();
    switch (filter) {
      case "1d":
        start = startOfDay(new Date());
        end = endOfDay(new Date());
        break;
      case "7d":
        start = startOfDay(subDays(new Date(), 7));
        end = endOfDay(new Date());
        break;
      case "1m":
        start = startOfDay(subDays(new Date(), 30));
        end = endOfDay(new Date());
        break;
    }
    setDateRange({ start, end });
  }, [filter]);

  useEffect(() => {
    if (!dateRange) return;
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(
          `/api/sales-report?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`
        );
        if (data) {
          setReportData(data);
        }
      } catch (error) {
        console.error("Error fetching sales report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [dateRange]);

  const exportToExcel = () => {
    if (!reportData || !dateRange) return;
    
    const summaryData = [
      { 'Report Meta': 'Store Name', 'Value': 'MedSathi Admin' },
      { 'Report Meta': 'Period', 'Value': `${format(dateRange.start, "dd-MM-yyyy")} to ${format(dateRange.end, "dd-MM-yyyy")}` },
      {},
      { 'Report Meta': 'Total Gross Sales', 'Value': Number(reportData.totalSales.toFixed(2)) },
      { 'Report Meta': 'Total Net Profit', 'Value': Number(reportData.totalProfit.toFixed(2)) },
      { 'Report Meta': 'Total Transactions', 'Value': reportData.totalTransactions }
    ];

    const dailyData = reportData.dailySales.map(d => ({
      'Date': format(new Date(d.date), "dd-MM-yyyy"),
      'Revenue': Number(d.sales.toFixed(2)),
      'Profit': Number(d.profit.toFixed(2))
    }));

    const productData = reportData.topSellingMedicines.map((med, idx) => ({
      'Rank': idx + 1,
      'Medicine': med.name,
      'Units': med.quantity,
      'Revenue': Number(med.revenue.toFixed(2))
    }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyData), "Daily Trends");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productData), "Product Intelligence");
    XLSX.writeFile(wb, `MedSathi_Intelligence_${format(dateRange.start, "yyyy-MM-dd")}.xlsx`);
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="skeleton w-11 h-11 rounded-2xl" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-44" />
            <div className="skeleton h-3.5 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
          <div className="flex bg-muted/70 p-1 rounded-xl border border-border">
            {(["1d", "7d", "1m"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filter === option
                    ? "bg-card text-primary shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === '1d' ? 'Today' : option === '7d' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>

          <button
             onClick={exportToExcel}
             className="btn-success btn-md"
          >
            <FileSpreadsheet size={17} strokeWidth={2.4} />
            Export Intel
          </button>
      </div>

      {reportData && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative p-6 rounded-2xl text-white overflow-hidden shadow-pop bg-[linear-gradient(160deg,oklch(0.24_0.09_262)_0%,oklch(0.33_0.12_262)_50%,oklch(0.44_0.19_255)_115%)]">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Total Revenue</p>
                <h2 className="font-display text-[28px] font-extrabold tracking-tighter">₹{reportData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-white/10 ring-1 ring-white/20 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase">
                  <ArrowUpRight size={12} strokeWidth={3} className="text-emerald-400" /> Gross Intake
                </div>
              </div>
              <TrendingUp className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" strokeWidth={1} />
            </div>

            <div className="surface-card surface-hover p-5 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Net Profit</p>
                <h2 className="font-display text-[28px] font-extrabold text-foreground tracking-tighter">₹{reportData.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">
                  <Wallet size={12} strokeWidth={3} /> Post-Costing
                </div>
              </div>
              <PieChart className="absolute -right-4 -bottom-4 text-muted/20 w-24 h-24 -rotate-12" strokeWidth={1} />
            </div>

            <div className="surface-card surface-hover p-5 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Transactions</p>
                <h2 className="font-display text-[28px] font-extrabold text-foreground tracking-tighter">{reportData.totalTransactions}</h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  <CreditCard size={12} strokeWidth={3} /> Invoices
                </div>
              </div>
              <Activity className="absolute -right-4 -bottom-4 text-muted/20 w-24 h-24" strokeWidth={1} />
            </div>

            <div className="surface-card surface-hover p-5 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Avg. Ticket</p>
                <h2 className="font-display text-[28px] font-extrabold text-foreground tracking-tighter">
                  ₹{reportData.totalTransactions > 0 ? (reportData.totalSales / reportData.totalTransactions).toFixed(0) : '0'}
                </h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase text-rose-600 dark:text-rose-400">
                  <BarChart3 size={12} strokeWidth={3} /> Per Client
                </div>
              </div>
              <PieChart className="absolute -right-4 -bottom-4 text-muted/20 w-24 h-24" strokeWidth={1} />
            </div>
          </div>

          {/* Market Intelligence Chart */}
          <div className="surface-card p-6 md:p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
              <Activity size={320} strokeWidth={1} />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
              <div>
                <h2 className="font-display text-[17px] font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                  <TrendingUp className="text-amber-500" size={21} strokeWidth={2.5} />
                  Performance Trajectory
                </h2>
                <p className="text-[12px] text-muted-foreground font-medium mt-1">Revenue & Profit trend across the selected period</p>
              </div>
              <div className="flex gap-5 p-2.5 bg-muted/60 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Net Profit</span>
                </div>
              </div>
            </div>

            {reportData.dailySales.length > 0 ? (
              <div className="flex items-end justify-between h-64 gap-3 lg:gap-6 mt-8">
                {reportData.dailySales.map((day, i) => {
                  const maxVal = Math.max(...reportData.dailySales.map(d => d.sales || 1));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                      <div className="flex-1 w-full flex items-end justify-center gap-1 lg:gap-2">
                        <div 
                          className="w-1/2 bg-primary/20 group-hover:bg-primary transition-all rounded-t-xl relative group/val"
                          style={{ height: `${(day.sales / maxVal) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover/val:opacity-100 transition-all pointer-events-none shadow-lg">₹{day.sales.toLocaleString()}</div>
                        </div>
                        <div 
                          className="w-1/2 bg-amber-400/25 group-hover:bg-amber-400 transition-all rounded-t-xl relative group/prof"
                          style={{ height: `${(day.profit / maxVal) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover/prof:opacity-100 transition-all pointer-events-none shadow-lg">₹{day.profit.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter text-center group-hover:text-primary transition-colors">
                        {format(new Date(day.date), "EEE dd")}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center opacity-20">
                <Activity size={64} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">No trajectory data available</p>
              </div>
            )}
          </div>

          {/* Product Performance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="surface-card overflow-hidden">
               <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
                  <h3 className="font-display text-[14px] font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                    <Trophy size={17} className="text-amber-500" strokeWidth={2.5} />
                    High Velocity Products
                  </h3>
               </div>
               <div className="p-3">
                  <table className="table-shell">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="th">Medicine</th>
                        <th className="th text-center">Units Sold</th>
                        <th className="th text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {reportData.topSellingMedicines.slice(0, 5).map((med, idx) => (
                        <tr key={idx} className="tbody-row">
                          <td className="td text-[13px] font-bold text-foreground">{med.name}</td>
                          <td className="td text-center">
                            <span className="badge-warning">{med.quantity}</span>
                          </td>
                          <td className="td text-right font-bold text-foreground/70">₹{med.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>

            <div className="surface-card overflow-hidden">
               <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
                  <h3 className="font-display text-[14px] font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                    <AlertCircle size={17} className="text-rose-500" strokeWidth={2.5} />
                    Low Velocity (Dead Stock)
                  </h3>
               </div>
               <div className="p-3">
                  <table className="table-shell">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="th">Medicine</th>
                        <th className="th text-center">Units Sold</th>
                        <th className="th text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {reportData.leastSellingMedicines.slice(0, 5).map((med, idx) => (
                        <tr key={idx} className="tbody-row">
                          <td className="td text-[13px] font-bold text-foreground">{med.name}</td>
                          <td className="td text-center">
                            <span className="badge-neutral">{med.quantity}</span>
                          </td>
                          <td className="td text-right font-bold text-muted-foreground">₹{med.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
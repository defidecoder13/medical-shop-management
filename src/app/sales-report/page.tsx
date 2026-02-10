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
  TrendingDown
} from "lucide-react";
import Link from "next/link";

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
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"1d" | "7d" | "1m">("7d");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Calculate date range based on filter
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

  // Fetch report data when date range changes
  useEffect(() => {
    if (!dateRange) return;

    const fetchReportData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sales-report?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`
        );
        if (response.ok) {
          const data = await response.json();
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

  // Format date for display
  const formatDateDisplay = (date: Date) => format(date, "MMM dd, yyyy");

  // Function to export sales report to Excel
  const exportToExcel = () => {
    if (!reportData || !dateRange) return;
    
    // Sheet 1: Financial Summary
    const summaryData = [
      { 'Report Meta': 'Store Name', 'Value': 'MediShop Admin' },
      { 'Report Meta': 'Report Type', 'Value': 'Consolidated Sales Report' },
      { 'Report Meta': 'Generated On', 'Value': format(new Date(), "dd-MM-yyyy HH:mm") },
      { 'Report Meta': 'Period', 'Value': `${format(dateRange.start, "dd-MM-yyyy")} to ${format(dateRange.end, "dd-MM-yyyy")}` },
      {},
      { 'Report Meta': 'FINANCIAL METRICS', 'Value': '' },
      { 'Report Meta': 'Total Gross Sales', 'Value': Number(reportData.totalSales.toFixed(2)) },
      { 'Report Meta': 'Total Net Profit', 'Value': Number(reportData.totalProfit.toFixed(2)) },
      { 'Report Meta': 'Total Transactions', 'Value': reportData.totalTransactions },
      { 'Report Meta': 'Profit Margin (%)', 'Value': ((reportData.totalProfit / reportData.totalSales) * 100 || 0).toFixed(2) + '%' },
      { 'Report Meta': 'Avg Invoice Value', 'Value': (reportData.totalSales / (reportData.totalTransactions || 1)).toFixed(2) }
    ];

    // Sheet 2: Daily Trends
    const dailyData = reportData.dailySales.map(d => ({
      'Date': format(new Date(d.date), "dd-MM-yyyy (EEE)"),
      'Revenue (₹)': Number(d.sales.toFixed(2)),
      'Profit (₹)': Number(d.profit.toFixed(2)),
      'Margin %': ((d.profit / d.sales) * 100 || 0).toFixed(2) + '%'
    }));

    // Sheet 3: Product Intelligence
    const productData = reportData.topSellingMedicines.map((med, idx) => ({
      'Rank': idx + 1,
      'Medicine Name': med.name,
      'Units Sold': med.quantity,
      'Revenue Contribution (₹)': Number(med.revenue.toFixed(2)),
      'Est. Profit (₹)': Number((reportData.topSellingMedicines.find(m => m.name === med.name) as any)?.profit?.toFixed(2) || 0)
    }));
    
    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    const wsProducts = XLSX.utils.json_to_sheet(productData);
    
    // Formatting widths
    const colWidths = { wch: 25 };
    wsSummary['!cols'] = [colWidths, colWidths];
    wsDaily['!cols'] = [colWidths, colWidths, colWidths, colWidths];
    wsProducts['!cols'] = [{wch: 10}, colWidths, colWidths, colWidths, colWidths];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Financial Summary");
    XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Business Trend");
    XLSX.utils.book_append_sheet(wb, wsProducts, "Product Analytics");
    
    const startDate = format(dateRange.start, "yyyy-MM-dd");
    const endDate = format(dateRange.end, "yyyy-MM-dd");
    XLSX.writeFile(wb, `Business_Intelligence_${startDate}_to_${endDate}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
           <div className="animate-pulse space-y-8">
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-indigo-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="text-indigo-600 w-8 h-8" />
                Sales Intelligence
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {dateRange && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Insights from {formatDateDisplay(dateRange.start)} to {formatDateDisplay(dateRange.end)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="p-1 bg-white/50 dark:bg-gray-900/50 rounded-2xl glass-card border border-gray-100 dark:border-gray-800 flex shadow-sm">
              {(["1d", "7d", "1m"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setFilter(option)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    filter === option
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-gray-500 hover:text-indigo-600"
                  }`}
                >
                  {option === '1d' ? 'Today' : option === '7d' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>

            <button
               onClick={exportToExcel}
               className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 group"
            >
              <FileSpreadsheet className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Export Excel</span>
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {reportData && (
          <>
            {/* Top Row: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Revenue */}
              <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-gray-900 group">
                <div className="absolute -top-6 -right-6 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="w-24 h-24 text-indigo-600" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-indigo-800/60 dark:text-indigo-300/60 font-bold text-[10px] uppercase tracking-widest mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Total Revenue
                    </div>
                    <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                      ₹{reportData.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg w-fit">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Growth Sync
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 group">
                <div className="absolute -top-6 -right-6 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Wallet className="w-24 h-24 text-emerald-600" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-800/60 dark:text-emerald-300/60 font-bold text-[10px] uppercase tracking-widest mb-1">
                      <Wallet className="w-3 h-3" />
                      Net Profit
                    </div>
                    <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ₹{reportData.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-emerald-700/60 dark:text-emerald-400/60 uppercase">
                    After GST & Costs
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-gray-900 group">
                <div className="absolute -top-6 -right-6 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <CreditCard className="w-24 h-24 text-violet-600" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-violet-800/60 dark:text-violet-300/60 font-bold text-[10px] uppercase tracking-widest mb-1">
                      <Activity className="w-3 h-3" />
                      Invoices
                    </div>
                    <div className="text-4xl font-black text-violet-600 dark:text-violet-400 tabular-nums">
                      {reportData.totalTransactions}
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-violet-600/60 dark:text-violet-400/60 uppercase">
                    Verified Sales
                  </div>
                </div>
              </div>

              {/* Average Order */}
              <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-900 group">
                <div className="absolute -top-6 -right-6 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <PieChart className="w-24 h-24 text-amber-600" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-amber-800/60 dark:text-amber-300/60 font-bold text-[10px] uppercase tracking-widest mb-1">
                      <PieChart className="w-3 h-3" />
                      Avg. Invoice
                    </div>
                    <div className="text-4xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      ₹{reportData.totalTransactions > 0 
                        ? (reportData.totalSales / reportData.totalTransactions).toLocaleString('en-IN', { maximumFractionDigits: 0 }) 
                        : '0'}
                    </div>
                  </div>
                  <div className="mt-4 text-[10px] font-bold text-amber-700/60 dark:text-amber-400/60 uppercase">
                    Value Per Client
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Row: Market Trends (Main Feature) */}
            <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden group min-h-[400px]">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Activity className="w-96 h-96 text-indigo-600" />
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                       <Activity className="text-indigo-600 w-8 h-8" />
                       Market Intelligence
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Daily revenue vs profit elasticity analysis</p>
                  </div>
                  <div className="flex flex-wrap gap-4 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                     <div className="flex items-center gap-2 px-3 py-1">
                        <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</span>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Profit</span>
                     </div>
                  </div>
               </div>

               {reportData.dailySales.length > 0 ? (
                 <div className="space-y-6">
                   {/* Visualization Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-7 lg:grid-cols-14 gap-4">
                      {reportData.dailySales.map((day, i) => {
                        const prevDay = i > 0 ? reportData.dailySales[i-1] : null;
                        const salesDiff = prevDay ? ((day.sales - prevDay.sales) / (prevDay.sales || 1)) * 100 : 0;
                        const profitDiff = prevDay ? ((day.profit - prevDay.profit) / (prevDay.profit || 1)) * 100 : 0;
                        const maxSales = Math.max(...reportData.dailySales.map(d => d.sales || 1));
                        
                        return (
                          <div key={i} className="flex flex-col gap-3 group/day h-full">
                            <div className="flex-1 min-h-[140px] bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-2 flex flex-row items-end justify-center gap-1.5 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all hover:shadow-lg hover:bg-white dark:hover:bg-gray-800">
                               {/* Sales Bar */}
                               <div 
                                 className="w-full bg-indigo-600/40 group-hover/day:bg-indigo-600 transition-all duration-700 rounded-lg relative group/bar"
                                 style={{ height: `${Math.max(10, (day.sales / maxSales) * 100)}%` }}
                               >
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap font-bold pointer-events-none">
                                    ₹{day.sales.toLocaleString()}
                                  </div>
                               </div>
                               {/* Profit Bar */}
                               <div 
                                 className="w-full bg-emerald-500/40 group-hover/day:bg-emerald-500 transition-all duration-700 rounded-lg relative group/pbar"
                                 style={{ height: `${Math.max(5, (day.profit / maxSales) * 100)}%` }}
                               >
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/pbar:opacity-100 transition-opacity whitespace-nowrap font-bold pointer-events-none">
                                    ₹{day.profit.toLocaleString()}
                                  </div>
                               </div>
                            </div>
                            
                            <div className="space-y-1.5 text-center px-1">
                               <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate">
                                 {format(new Date(day.date), "EEE dd")}
                               </div>
                               
                               {/* Fluctuation Badges */}
                               <div className="flex flex-col gap-1 items-center">
                                 {i > 0 ? (
                                   <>
                                     <div className={`text-[8px] font-black flex items-center gap-0.5 ${salesDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                       {salesDiff >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                                       {Math.abs(salesDiff).toFixed(0)}%
                                     </div>
                                     <div className={`text-[8px] font-black flex items-center gap-0.5 opacity-60 ${profitDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                       {profitDiff >= 0 ? 'P:+' : 'P:-'}{Math.abs(profitDiff).toFixed(0)}%
                                     </div>
                                   </>
                                 ) : (
                                   <div className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Base</div>
                                 )}
                               </div>
                            </div>
                          </div>
                        );
                      })}
                   </div>

                 </div>
               ) : (
                 <div className="h-80 flex flex-col items-center justify-center text-gray-400 opacity-20 gap-4 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl py-20">
                    <PieChart className="w-16 h-16" />
                    <p className="font-black uppercase tracking-widest">No sequential market data found</p>
                 </div>
               )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
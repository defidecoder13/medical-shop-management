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
    
    const reportRows = [];
    
    // Add summary data
    reportRows.push({
      'Metric': 'Total Sales',
      'Value': `₹${reportData.totalSales.toFixed(2)}`
    });
    reportRows.push({
      'Metric': 'Total Profit',
      'Value': `₹${reportData.totalProfit.toFixed(2)}`
    });
    reportRows.push({
      'Metric': 'Total Transactions',
      'Value': reportData.totalTransactions
    });
    reportRows.push({
      'Metric': 'Average Transaction',
      'Value': `₹${reportData.totalTransactions > 0 
        ? (reportData.totalSales / reportData.totalTransactions).toFixed(2) 
        : '0.00'}`
    });
    
    if (reportData.mostSoldMedicine) {
      reportRows.push({
        'Metric': 'Most Sold Medicine',
        'Value': `${reportData.mostSoldMedicine.name} (${reportData.mostSoldMedicine.quantity})`
      });
    }
    
    if (reportData.leastSoldMedicine) {
      reportRows.push({
        'Metric': 'Least Sold Medicine',
        'Value': `${reportData.leastSoldMedicine.name} (${reportData.leastSoldMedicine.quantity})`
      });
    }
    
    // Add top selling medicines
    reportRows.push({}, {'Metric': 'Top Selling Medicines:', 'Value': ''});
    reportData.topSellingMedicines.forEach(med => {
      reportRows.push({
        'Metric': `  ${med.name}`,
        'Value': `Qty: ${med.quantity}, Revenue: ₹${med.revenue.toFixed(2)}`
      });
    });
    
    // Add least selling medicines
    reportRows.push({}, {'Metric': 'Least Selling Medicines:', 'Value': ''});
    reportData.leastSellingMedicines.forEach(med => {
      reportRows.push({
        'Metric': `  ${med.name}`,
        'Value': `Qty: ${med.quantity}, Revenue: ₹${med.revenue.toFixed(2)}`
      });
    });
    
    // Add daily sales data
    reportRows.push({}, {'Metric': 'Daily Sales:', 'Value': ''});
    reportData.dailySales.forEach(daily => {
      reportRows.push({
        'Metric': `  ${daily.date}`,
        'Value': `Sales: ₹${daily.sales.toFixed(2)}, Profit: ₹${daily.profit.toFixed(2)}`
      });
    });
    
    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    
    // Add date range to filename
    const startDate = format(dateRange.start, "yyyy-MM-dd");
    const endDate = format(dateRange.end, "yyyy-MM-dd");
    XLSX.writeFile(wb, `Sales_Report_${startDate}_to_${endDate}.xlsx`);
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

            {/* Middle Row: Product Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Best Performers */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Medal className="text-emerald-500 w-5 h-5" />
                    Top Performance
                  </h2>
                </div>
                
                <div className="glass-panel rounded-3xl p-6 border border-white/20 shadow-xl space-y-4 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                     <Medal className="w-32 h-32" />
                  </div>
                  {reportData.topSellingMedicines.length > 0 ? (
                    <div className="space-y-4">
                      {reportData.topSellingMedicines.slice(0, 5).map((med, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 hover:scale-[1.01] transition-transform group">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-xs font-black text-emerald-600">
                              {idx + 1}
                            </div>
                            <div>
                               <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{med.name}</div>
                               <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                                 <Package className="w-3 h-3" />
                                 {med.quantity} Units Sold
                               </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="font-black text-emerald-600 dark:text-emerald-400">₹{med.revenue.toLocaleString('en-IN')}</div>
                             <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Gross Revenue</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-30">
                      <Medal className="w-12 h-12 mb-3 mx-auto" />
                      <p className="font-bold">No Top Performers</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Underperformers */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingDown className="text-rose-500 w-5 h-5" />
                    Lowest Traction
                  </h2>
                </div>

                <div className="glass-panel rounded-3xl p-6 border border-white/20 shadow-xl space-y-4 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                     <TrendingDown className="w-32 h-32" />
                  </div>
                  {reportData.leastSellingMedicines.length > 0 ? (
                    <div className="space-y-4">
                      {reportData.leastSellingMedicines.slice(0, 5).map((med, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 group">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-xs font-black text-rose-600">
                              {idx + 1}
                            </div>
                            <div>
                               <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight line-through opacity-50">{med.name}</div>
                               <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1 mt-0.5">
                                 <Clock className="w-3 h-3" />
                                 {med.quantity} Units Sold
                               </div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="font-black text-rose-600 dark:text-rose-400">₹{med.revenue.toLocaleString('en-IN')}</div>
                             <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Stale Revenue</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-30">
                      <TrendingDown className="w-12 h-12 mb-3 mx-auto" />
                      <p className="font-bold">Consistent Performance</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Bottom Row: Insights Chart */}
            <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Activity className="w-64 h-64 text-indigo-600" />
               </div>
               
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                       <Activity className="text-indigo-600" />
                       Market Trends
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">Daily sales and profit fluctuation analysis</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Sales</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-600" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Profit</span>
                     </div>
                  </div>
               </div>

               {reportData.dailySales.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-7 lg:grid-cols-14 gap-px bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    {reportData.dailySales.map((day, i) => (
                      <div key={i} className="bg-white/50 dark:bg-gray-900/50 p-4 hover:bg-white dark:hover:bg-gray-800 transition-colors group/day">
                        <div className="text-[10px] font-black text-gray-400 uppercase mb-3 text-center">
                          {format(new Date(day.date), "EEE dd")}
                        </div>
                        <div className="flex flex-col gap-2">
                           <div className="relative h-20 w-full bg-gray-50 dark:bg-gray-950 rounded-lg overflow-hidden flex flex-col justify-end">
                              <div 
                                className="bg-indigo-600/20 group-hover/day:bg-indigo-600 transition-all duration-500 rounded-t-sm"
                                style={{ height: `${Math.min(100, (day.sales / Math.max(...reportData.dailySales.map(d => d.sales || 1))) * 100)}%` }}
                              />
                           </div>
                           <div className="text-[10px] font-black text-center text-indigo-600">₹{day.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="h-64 flex flex-col items-center justify-center text-gray-400 opacity-30 gap-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                    <PieChart className="w-12 h-12" />
                    <p className="font-bold">No sequential data available for this range</p>
                 </div>
               )}
               
               <div className="mt-8 flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                  <TrendingUp className="text-indigo-600 w-5 h-5 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                    Analysis suggests a {filter === '7d' ? 'weekly' : 'monthly'} transaction volume of <strong>{reportData.totalTransactions}</strong> invoices with a net margin of <strong>{((reportData.totalProfit / reportData.totalSales) * 100 || 0).toFixed(1)}%</strong>.
                  </p>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
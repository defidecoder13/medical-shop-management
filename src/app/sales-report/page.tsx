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
} from "lucide-react";
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
      <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-pulse">
        <div className="h-10 bg-gray-100 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-[24px]"></div>)}
        </div>
        <div className="h-96 bg-gray-100 rounded-[40px]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link 
            href="/"
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-[#11327c] transition-all shadow-sm group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-[28px] font-black text-[#11327c] tracking-tight">Sales Intelligence</h1>
            <p className="text-[13px] text-gray-500 font-medium">
              {dateRange && `Analytics from ${format(dateRange.start, "MMM dd")} to ${format(dateRange.end, "MMM dd, yyyy")}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
            {(["1d", "7d", "1m"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === option
                    ? "bg-[#11327c] text-white shadow-lg"
                    : "text-gray-400 hover:text-[#11327c] hover:bg-white"
                }`}
              >
                {option === '1d' ? 'Today' : option === '7d' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>

          <button
             onClick={exportToExcel}
             className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <FileSpreadsheet size={18} strokeWidth={2.5} />
            Export Intel
          </button>
        </div>
      </div>

      {reportData && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#11327c] p-6 rounded-[32px] text-white relative overflow-hidden group shadow-xl shadow-[#11327c]/20">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Revenue</p>
                <h2 className="text-3xl font-black tracking-tighter">₹{reportData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                  <ArrowUpRight size={12} strokeWidth={3} className="text-emerald-400" /> Gross Intake
                </div>
              </div>
              <TrendingUp className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" strokeWidth={1} />
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-all">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Net Profit</p>
                <h2 className="text-3xl font-black text-[#11327c] tracking-tighter">₹{reportData.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-orange-600">
                  <Wallet size={12} strokeWidth={3} /> Post-Costing
                </div>
              </div>
              <PieChart className="absolute -right-4 -bottom-4 text-gray-50 w-24 h-24 -rotate-12" strokeWidth={1} />
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Transactions</p>
                <h2 className="text-3xl font-black text-[#11327c] tracking-tighter">{reportData.totalTransactions}</h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-indigo-600">
                  <CreditCard size={12} strokeWidth={3} /> Invoices
                </div>
              </div>
              <Activity className="absolute -right-4 -bottom-4 text-gray-50 w-24 h-24" strokeWidth={1} />
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Avg. Ticket</p>
                <h2 className="text-3xl font-black text-[#11327c] tracking-tighter">
                  ₹{reportData.totalTransactions > 0 ? (reportData.totalSales / reportData.totalTransactions).toFixed(0) : '0'}
                </h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-rose-600">
                  <BarChart3 size={12} strokeWidth={3} /> Per Client
                </div>
              </div>
              <PieChart className="absolute -right-4 -bottom-4 text-gray-50 w-24 h-24" strokeWidth={1} />
            </div>
          </div>

          {/* Market Intelligence Chart */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
              <Activity size={320} strokeWidth={1} />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative z-10">
              <div>
                <h2 className="text-[20px] font-black text-[#11327c] uppercase tracking-widest flex items-center gap-3">
                  <TrendingUp className="text-orange-500" size={24} strokeWidth={3} />
                  Performance Trajectory
                </h2>
                <p className="text-[13px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Revenue & Profit Elasticity Analysis</p>
              </div>
              <div className="flex gap-6 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#11327c]" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Profit</span>
                </div>
              </div>
            </div>

            {reportData.dailySales.length > 0 ? (
              <div className="flex items-end justify-between h-64 gap-3 lg:gap-6 mt-10">
                {reportData.dailySales.map((day, i) => {
                  const maxVal = Math.max(...reportData.dailySales.map(d => d.sales || 1));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full">
                      <div className="flex-1 w-full flex items-end justify-center gap-1 lg:gap-2">
                        <div 
                          className="w-1/2 bg-[#11327c]/20 group-hover:bg-[#11327c] transition-all rounded-t-xl relative group/val"
                          style={{ height: `${(day.sales / maxVal) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#11327c] text-white text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover/val:opacity-100 transition-all pointer-events-none shadow-lg">₹{day.sales.toLocaleString()}</div>
                        </div>
                        <div 
                          className="w-1/2 bg-orange-400/20 group-hover:bg-orange-400 transition-all rounded-t-xl relative group/prof"
                          style={{ height: `${(day.profit / maxVal) * 100}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover/prof:opacity-100 transition-all pointer-events-none shadow-lg">₹{day.profit.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black text-gray-300 uppercase tracking-tighter text-center group-hover:text-[#11327c] transition-colors">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
               <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-[#f8fafc]/50">
                  <h3 className="text-[14px] font-black text-[#11327c] uppercase tracking-[0.15em] flex items-center gap-3">
                    <Trophy size={18} className="text-orange-500" strokeWidth={2.5} />
                    High Velocity Products
                  </h3>
               </div>
               <div className="p-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="px-4 py-4">Medicine</th>
                        <th className="px-4 py-4 text-center">Units Sold</th>
                        <th className="px-4 py-4 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportData.topSellingMedicines.slice(0, 5).map((med, idx) => (
                        <tr key={idx} className="hover:bg-[#f8fafc] transition-all group">
                          <td className="px-4 py-5 text-[13px] font-black text-[#11327c] uppercase tracking-tight">{med.name}</td>
                          <td className="px-4 py-5 text-center">
                            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-xl text-[11px] font-black">{med.quantity}</span>
                          </td>
                          <td className="px-4 py-5 text-right font-black text-[#11327c]/60 text-[13px]">₹{med.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
               <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-[#f8fafc]/50">
                  <h3 className="text-[14px] font-black text-[#11327c] uppercase tracking-[0.15em] flex items-center gap-3">
                    <AlertCircle size={18} className="text-rose-500" strokeWidth={2.5} />
                    Low Velocity (Dead Stock)
                  </h3>
               </div>
               <div className="p-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                        <th className="px-4 py-4">Medicine</th>
                        <th className="px-4 py-4 text-center">Units Sold</th>
                        <th className="px-4 py-4 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportData.leastSellingMedicines.slice(0, 5).map((med, idx) => (
                        <tr key={idx} className="hover:bg-[#f8fafc] transition-all group">
                          <td className="px-4 py-5 text-[13px] font-black text-[#11327c] uppercase tracking-tight">{med.name}</td>
                          <td className="px-4 py-5 text-center">
                            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-xl text-[11px] font-black">{med.quantity}</span>
                          </td>
                          <td className="px-4 py-5 text-right font-black text-gray-400 text-[13px]">₹{med.revenue.toLocaleString()}</td>
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
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
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
import { ReportTrajectoryChart } from "@/src/components/charts/report-trajectory-chart";

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

  const exportToExcel = async () => {
    if (!reportData || !dateRange) return;
    const XLSX = await import("xlsx");
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
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            {(["1d", "7d", "1m"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer ${
                  filter === option
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === '1d' ? 'Today' : option === '7d' ? '7 days' : '30 days'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="surface-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <TrendingUp size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-[18px] font-bold tracking-tight">₹{reportData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
            <div className="surface-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                <Wallet size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Net Profit</p>
                <p className="text-[18px] font-bold tracking-tight">₹{reportData.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
            <div className="surface-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                <CreditCard size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Transactions</p>
                <p className="text-[18px] font-bold tracking-tight">{reportData.totalTransactions}</p>
              </div>
            </div>
            <div className="surface-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/15 text-amber-600 flex items-center justify-center shrink-0">
                <BarChart3 size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Avg. Ticket</p>
                <p className="text-[18px] font-bold tracking-tight">₹{reportData.totalTransactions > 0 ? (reportData.totalSales / reportData.totalTransactions).toFixed(0) : '0'}</p>
              </div>
            </div>
          </div>

          {/* Market Intelligence Chart */}
          <div className="surface-card p-5 md:p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
                <TrendingUp className="w-4 h-4" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Performance Trajectory</h2>
                <p className="text-[12px] text-muted-foreground">Revenue & profit — {filter === "1d" ? "today" : filter === "7d" ? "last 7 days" : "last 30 days"}</p>
              </div>
            </div>
            {reportData.dailySales.length > 0 ? (
              <ReportTrajectoryChart dailySales={reportData.dailySales} />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <Activity size={32} strokeWidth={1.5} className="opacity-40 mb-2" />
                <p className="text-xs">No data for this period</p>
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
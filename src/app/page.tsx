
"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  ClipboardList, 
  Package, 
  AlertOctagon,
  IndianRupee,
  Percent,
  Calendar,
  Users,
  Pill,
  Activity,
  Zap,
  FileText,
  Plus,
  ArrowRight,
  Bell,
  Clock,
  ReceiptText
} from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StatsCard } from "@/src/components/dashboard/stats-card";
import { SalesChart } from "@/src/components/dashboard/sales-chart";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("7d");
  const [data, setData] = useState<any>({
    stats: { sales: "₹0", orders: 0, lowStock: 0, expiring: 0 },
    salesChart: [],
    recentTransactions: []
  });

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const analytics = await apiClient.get(
          `/api/dashboard-analytics?range=${chartRange}`,
          {},
          (cachedData) => {
            if (cachedData) {
              setData(cachedData);
              setLoading(false); // Instantly render cached data in 0ms!
            }
          }
        );
        
        if (analytics) {
          setData(analytics); // Update with fresh network data later
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [chartRange]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-bold" suppressHydrationWarning={true}>Loading dashboard...</div>;
  }

  // Format sales number
  const rawSales = data.stats.sales.replace(/[^0-9.]/g, '');
  const salesVal = rawSales ? parseFloat(rawSales) : 0;
  
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10 flex flex-col">
      {/* Metrics Row */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 order-2 lg:order-1">
        <StatsCard 
          title="Total Revenue" 
          value={`₹${salesVal >= 0 ? salesVal.toFixed(2) : "0.00"}`} 
          trend="12.5" 
          trendUp={true} 
          icon={IndianRupee}
          iconBgColor="bg-gradient-to-br from-[#11327c] to-[#1e58b8]"
          iconColor="text-white"
          chartColor="#11327c"
        />
        <StatsCard 
          title="Total Orders" 
          value={data.stats.orders ?? 0} 
          trend="10.0" 
          trendUp={true} 
          icon={ClipboardList}
          iconBgColor="bg-[#dcfce7]"
          iconColor="text-[#16a34a]"
          chartColor="#16a34a"
        />
        <StatsCard 
          title="Low Stock" 
          value={data.stats.lowStock ?? 0} 
          trend="25.0"
          trendUp={false} 
          icon={Package}
          iconBgColor="bg-[#ffedd5]"
          iconColor="text-[#f97316]"
          chartColor="#f97316"
        />
        <StatsCard 
          title="Expiring Soon" 
          value={data.stats.expiring ?? 0} 
          trend="0"
          trendUp={null} 
          icon={Clock}
          iconBgColor="bg-[#fee2e2]"
          iconColor="text-[#ef4444]"
          chartColor="#ef4444"
        />
        <StatsCard 
          title="Gross Profit" 
          value={salesVal > 0 ? "28.6%" : "0.0%"} 
          trend="8.4"
          trendUp={true} 
          icon={Percent}
          iconBgColor="bg-[#dcfce7]"
          iconColor="text-[#16a34a]"
          chartColor="#16a34a"
        />
      </div>

      {/* Row 2: Sales Chart */}
      <div className="order-1 lg:order-2">
        <SalesChart data={data.salesChart} range={chartRange} onRangeChange={setChartRange} />
      </div>

      {/* Row 3: Quick Actions */}
      <div className="order-3">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-colors">
          <h3 className="text-[17px] font-extrabold text-[#11327c] dark:text-blue-400 mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#11327c] dark:text-blue-400 fill-[#11327c] dark:fill-blue-400" strokeWidth={1} />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/billing" className="bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/60 text-[#11327c] dark:text-blue-300 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-sm h-[110px]">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[#11327c] dark:text-blue-300 shadow-sm"><FileText size={22} strokeWidth={2.5} /></div>
              <span className="text-[13px] font-extrabold tracking-wide">New Bill</span>
            </Link>
            <Link href="/inventory" className="bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-sm h-[110px]">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-sm"><Plus size={22} strokeWidth={3} /></div>
              <span className="text-[13px] font-extrabold tracking-wide">Add Medicine</span>
            </Link>
            <Link href="/transactions" className="bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100/70 dark:hover:bg-orange-900/60 border border-orange-200/60 dark:border-orange-800/60 text-orange-800 dark:text-orange-300 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-sm h-[110px]">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-300 shadow-sm"><ReceiptText size={22} strokeWidth={2.5} /></div>
              <span className="text-[13px] font-extrabold tracking-wide">Transactions History</span>
            </Link>
            <Link href="/low-stock" className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-800 dark:text-indigo-300 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-sm h-[110px]">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-sm"><AlertOctagon size={22} strokeWidth={2.5} /></div>
              <span className="text-[13px] font-extrabold tracking-wide">Low Stock</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

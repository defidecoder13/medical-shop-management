
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
import { RecentTransactions } from "@/src/components/dashboard/recent-transactions";

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

      {/* Row 2: Sales Chart & Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 order-1 lg:order-2">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <SalesChart data={data.salesChart} range={chartRange} onRangeChange={setChartRange} />
        </div>

        {/* Today's Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] h-full flex flex-col">
            <h3 className="text-[17px] font-extrabold text-[#11327c] mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#11327c]" strokeWidth={2.5} />
              Today's Summary
            </h3>
            
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[#11327c]"><IndianRupee size={16} strokeWidth={2.5} /></div>
                  <span className="text-gray-500 text-[13px] font-semibold">Total Sales</span>
                </div>
                <span className="text-gray-900 font-extrabold text-[16px]">₹{salesVal >= 0 ? salesVal.toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600"><ReceiptText size={16} strokeWidth={2.5} /></div>
                  <span className="text-gray-500 text-[13px] font-semibold">Total Orders</span>
                </div>
                <span className="text-gray-900 font-extrabold text-[16px]">{data.stats.orders ?? 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500"><Users size={16} strokeWidth={2.5} /></div>
                  <span className="text-gray-500 text-[13px] font-semibold">Unique Customers</span>
                </div>
                <span className="text-gray-900 font-extrabold text-[16px]">{data.stats.customers ?? 0}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><Activity size={16} strokeWidth={2.5} /></div>
                  <span className="text-gray-500 text-[13px] font-semibold">Avg. Order Value</span>
                </div>
                <span className="text-gray-900 font-extrabold text-[16px]">₹{data.stats.orders ? (salesVal / data.stats.orders).toFixed(2) : "0.00"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Quick Actions */}
      <div className="order-3">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
          <h3 className="text-[17px] font-extrabold text-[#11327c] mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#11327c] fill-[#11327c]" strokeWidth={1} />
            Quick Actions
          </h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/billing" className="bg-[#11327c] text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform shadow-[0_8px_15px_-5px_rgba(17,50,124,0.3)] h-[110px]">
                <FileText size={28} strokeWidth={2} />
                <span className="text-[13px] font-bold">New Bill</span>
              </Link>
              <Link href="/inventory" className="bg-[#16a34a] text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform shadow-[0_8px_15px_-5px_rgba(22,163,74,0.3)] h-[110px]">
                <Plus size={28} strokeWidth={3} />
                <span className="text-[13px] font-bold">Add Medicine</span>
              </Link>
              <Link href="/transactions" className="bg-[#f97316] text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform shadow-[0_8px_15px_-5px_rgba(249,115,22,0.3)] h-[110px]">
                <ReceiptText size={28} strokeWidth={2} />
                <span className="text-[13px] font-bold">Transactions History</span>
              </Link>
              <Link href="/low-stock" className="bg-[#6366f1] text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform shadow-[0_8px_15px_-5px_rgba(99,102,241,0.3)] h-[110px]">
                <AlertOctagon size={28} strokeWidth={2} />
                <span className="text-[13px] font-bold">Low Stock</span>
              </Link>
            </div>
          </div>
        </div>

      {/* Row 4: Transactions */}
      <div className="hidden md:grid grid-cols-1 gap-6 order-4">
        <div className="w-full">
          <RecentTransactions data={data.recentTransactions} />
        </div>
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  ReceiptText, 
  Package, 
  AlertOctagon 
} from "lucide-react";

import { StatsCard } from "@/src/components/dashboard/stats-card";
import { SalesChart } from "@/src/components/dashboard/sales-chart";
import { RecentTransactions } from "@/src/components/dashboard/recent-transactions";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("7d");
  const [data, setData] = useState<any>({
    stats: { sales: "₹0", orders: 0, lowStock: 0, expiring: 0 },
    salesChart: [],
    recentTransactions: []
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) {
          window.location.href = '/login';
        }
      } catch (error) {
        window.location.href = '/login';
      }
    };
    checkAuth();
  }, []);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`/api/dashboard-analytics?range=${chartRange}`, { cache: 'no-store' });
        if (res.ok) {
          const analytics = await res.json();
          setData(analytics);
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
    return <div className="p-8 text-center text-muted-foreground" suppressHydrationWarning={true}>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={`₹${data.stats.sales.replace(/[^0-9.]/g, '')}`} 
          trend="Total Lifetime" 
          trendUp={true} 
          icon={TrendingUp}
          color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
        />
        <StatsCard 
          title="Total Orders" 
          value={data.stats.orders} 
          trend="Total Processed" 
          trendUp={true} 
          icon={ReceiptText}
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
        />
        <StatsCard 
          title="Low Stock Items" 
          value={data.stats.lowStock} 
          trend={data.stats.lowStock > 0 ? "Action Needed" : "Stable"}
          trendUp={data.stats.lowStock === 0} 
          icon={Package}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" 
        />
        <StatsCard 
          title="Expiring Soon" 
          value={data.stats.expiring} 
          trend={data.stats.expiring > 0 ? "Review" : "Good"}
          trendUp={data.stats.expiring === 0} 
          icon={AlertOctagon}
          color="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400" 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Sales Chart - Takes up full width */}
        <div className="w-full">
          <SalesChart 
            data={data.salesChart} 
            range={chartRange}
            onRangeChange={setChartRange}
          />
        </div>
      </div>

      {/* Recent Transactions Table */}
      <RecentTransactions data={data.recentTransactions} />
    </div>
  );
}

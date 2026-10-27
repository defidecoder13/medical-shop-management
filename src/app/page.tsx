"use client";

import { useEffect, useState } from "react";
import {
  AlertOctagon,
  Zap,
  FileText,
  ReceiptText,
  PackagePlus,
  CalendarClock,
  BarChart3,
  Banknote,
  TrendingUp,
} from "@/src/components/icons";
import { apiClient } from "@/src/lib/apiClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StatCard } from "@/src/components/dashboard/stat-card";
import { SalesChart } from "@/src/components/dashboard/sales-chart";
import { MedRankingCard } from "@/src/components/charts/med-ranking-chart";
import { PageSkeleton } from "@/src/components/ui/skeleton";

const quickActions = [
  {
    label: "New Bill",
    desc: "Create sale invoice",
    href: "/billing",
    icon: FileText,
    tone: "mint" as const,
  },
  {
    label: "Add Stock",
    desc: "Record new inventory",
    href: "/inventory",
    icon: PackagePlus,
    tone: "lime" as const,
  },
  {
    label: "Expiry Tracker",
    desc: "Check expiring batches",
    href: "/expiry",
    icon: CalendarClock,
    tone: "lavender" as const,
  },
  {
    label: "Transactions",
    desc: "View sales history",
    href: "/transactions",
    icon: ReceiptText,
    tone: "coral" as const,
  },
  {
    label: "Low Stock",
    desc: "Critical shortages",
    href: "/low-stock",
    icon: AlertOctagon,
    tone: "coral" as const,
  },
  {
    label: "Reports",
    desc: "Sales & business insights",
    href: "/sales-report",
    icon: BarChart3,
    tone: "neutral" as const,
  },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("7d");
  const [data, setData] = useState<any>({
    stats: { sales: "₹0", orders: 0, lowStock: 0, expiring: 0, customers: 0 },
    salesChart: [],
    topSelling: [],
    leastSelling: [],
  });

  useEffect(() => {
    if (!document.cookie.includes("is_logged_in=1")) {
      router.push("/login");
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
              setLoading(false);
            }
          }
        );

        if (analytics) {
          setData(analytics);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [chartRange]);

  if (loading) {
    return <PageSkeleton />;
  }

  const toneClasses: Record<string, string> = {
    mint: "bg-[#9CD4D2]/40 text-[#062C2F] dark:bg-[#16403F] dark:text-[#9CD4D2]",
    lime: "bg-[#D6EDB3]/50 text-[#062C2F] dark:bg-[#1E3B24] dark:text-[#A7E8B8]",
    lavender: "bg-[#B2BCEE]/40 text-[#062C2F] dark:bg-[#1E274A] dark:text-[#BFDBFE]",
    coral: "bg-[#EDB2B7]/40 text-[#062C2F] dark:bg-[#3E1B21] dark:text-[#FCA5A5]",
    neutral: "bg-muted text-foreground",
  };

  return (
    <div className="space-y-5.5 max-w-[1400px] mx-auto pb-8 pt-1">
      {/* 4-Column Metric Grid as defined in DESIGN.md Section 8 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <StatCard
          title="Total Sales"
          value={data.stats?.sales ?? "₹0"}
          icon={Banknote}
          variant="lime"
          hint="Gross revenue"
        />
        <StatCard
          title="Invoices Generated"
          value={data.stats?.orders ?? 0}
          icon={ReceiptText}
          variant="mint"
          hint="Completed orders"
        />
        <StatCard
          title="Low Stock Alert"
          value={data.stats?.lowStock ?? 0}
          icon={AlertOctagon}
          variant="coral"
          hint="Needs reordering"
        />
        <StatCard
          title="Expiring Batches"
          value={data.stats?.expiring ?? 0}
          icon={CalendarClock}
          variant="lavender"
          hint="Within 6 months"
        />
      </div>

      {/* Quick Actions Panel */}
      <div className="surface-card p-5 md:p-6 rounded-[28px] md:rounded-[32px]">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center">
            <Zap className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            Quick Actions
          </h3>
          <span className="text-[11px] font-medium text-muted-foreground ml-auto hidden sm:block">
            Frequently Used
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 p-3 hover:bg-muted/50 hover:border-border transition-all duration-150"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${toneClasses[action.tone]}`}
              >
                <action.icon size={16} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground leading-tight truncate">
                  {action.label}
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
                  {action.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sales Performance Chart */}
      <SalesChart data={data.salesChart} range={chartRange} onRangeChange={setChartRange} />

      {/* Product Velocity — Most / Least Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MedRankingCard
          title="Most Selling"
          subtitle="Highest units sold"
          data={data.topSelling || []}
          variant="most"
        />
        <MedRankingCard
          title="Least Selling"
          subtitle="Lowest movers — review stock"
          data={data.leastSelling || []}
          variant="least"
        />
      </div>
    </div>
  );
}

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
} from "@/src/components/icons";
import { apiClient } from "@/src/lib/apiClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SalesChart } from "@/src/components/dashboard/sales-chart";
import { MedRankingCard } from "@/src/components/charts/med-ranking-chart";
import { PageSkeleton } from "@/src/components/ui/skeleton";

const quickActions = [
  {
    label: "New Bill",
    desc: "Create sale invoice",
    href: "/billing",
    icon: FileText,
    tone: "brand" as const,
  },
  {
    label: "Add Stock",
    desc: "Record new inventory",
    href: "/inventory",
    icon: PackagePlus,
    tone: "success" as const,
  },
  {
    label: "Expiry Tracker",
    desc: "Check expiring batches",
    href: "/expiry",
    icon: CalendarClock,
    tone: "info" as const,
  },
  {
    label: "Transactions",
    desc: "View sales history",
    href: "/transactions",
    icon: ReceiptText,
    tone: "warning" as const,
  },
  {
    label: "Low Stock",
    desc: "Critical shortages",
    href: "/low-stock",
    icon: AlertOctagon,
    tone: "danger" as const,
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
    brand: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/15 text-amber-600 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10 pt-1">
      {/* Quick Actions */}
      <div className="surface-card p-4 md:p-5">
        <div className="flex items-center gap-2.5 mb-3.5">
          <span className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
            <Zap className="w-[15px] h-[15px]" strokeWidth={2} />
          </span>
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
            Quick Actions
          </h3>
          <span className="text-[11px] text-muted-foreground ml-auto hidden sm:block">
            Shortcuts
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/50 hover:border-border transition-colors"
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${toneClasses[action.tone]}`}>
                <action.icon size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground leading-tight truncate">
                  {action.label}
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight truncate">
                  {action.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sales Performance */}
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

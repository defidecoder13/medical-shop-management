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
import { PageSkeleton } from "@/src/components/ui/skeleton";

const quickActions = [
  {
    label: "New Bill",
    desc: "Create sale invoice",
    href: "/billing",
    icon: FileText,
    tile: "from-blue-50 to-blue-100/40 dark:from-blue-950/40 dark:to-transparent",
    chip: "from-[#11327c] to-[#1e58b8]",
    hover: "hover:border-primary/25",
  },
  {
    label: "Add Stock",
    desc: "Record new inventory",
    href: "/inventory",
    icon: PackagePlus,
    tile: "from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40 dark:to-transparent",
    chip: "from-emerald-500 to-emerald-400",
    hover: "hover:border-success/25",
  },
  {
    label: "Expiry Tracker",
    desc: "Check expiring batches",
    href: "/expiry",
    icon: CalendarClock,
    tile: "from-sky-50 to-sky-100/40 dark:from-sky-950/40 dark:to-transparent",
    chip: "from-sky-500 to-cyan-400",
    hover: "hover:border-sky-500/25",
  },
  {
    label: "Transactions",
    desc: "View sales history",
    href: "/transactions",
    icon: ReceiptText,
    tile: "from-orange-50 to-amber-100/40 dark:from-orange-950/40 dark:to-transparent",
    chip: "from-orange-500 to-amber-400",
    hover: "hover:border-warning/30",
  },
  {
    label: "Low Stock",
    desc: "Critical shortages",
    href: "/low-stock",
    icon: AlertOctagon,
    tile: "from-rose-50 to-red-100/40 dark:from-rose-950/40 dark:to-transparent",
    chip: "from-rose-500 to-red-400",
    hover: "hover:border-destructive/25",
  },
  {
    label: "Reports",
    desc: "Sales & business insights",
    href: "/sales-report",
    icon: BarChart3,
    tile: "from-violet-50 to-violet-100/40 dark:from-violet-950/40 dark:to-transparent",
    chip: "from-violet-500 to-purple-400",
    hover: "hover:border-violet-500/25",
  },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chartRange, setChartRange] = useState("7d");
  const [data, setData] = useState<any>({
    stats: { sales: "₹0", orders: 0, lowStock: 0, expiring: 0, customers: 0 },
    salesChart: [],
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

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10 pt-1">
      {/* Quick Actions */}
      <div className="surface-card p-4 md:p-5">
        <div className="flex items-center gap-2.5 mb-3.5">
          <span className="w-7 h-7 rounded-lg bg-warning/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Zap className="w-[15px] h-[15px]" strokeWidth={2.4} />
          </span>
          <h3 className="font-display text-[15px] font-extrabold text-foreground">
            Quick Actions
          </h3>
          <span className="text-[11px] font-semibold text-muted-foreground/70 ml-auto hidden sm:block">
            One-tap shortcuts to your daily work
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${action.tile} p-3.5 flex flex-col justify-between gap-2.5 min-h-[84px] transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5 ${action.hover}`}
            >
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.chip} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
              >
                <action.icon size={16} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <div className="text-[12.5px] font-extrabold text-foreground leading-tight truncate">
                  {action.label}
                </div>
                <div className="text-[10.5px] font-medium text-muted-foreground leading-tight truncate">
                  {action.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sales Performance */}
      <SalesChart data={data.salesChart} range={chartRange} onRangeChange={setChartRange} />
    </div>
  );
}

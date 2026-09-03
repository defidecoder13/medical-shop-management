"use client";

import { cn } from "@/src/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "@/src/components/icons";
import { AnimatedNumber } from "@/src/components/ui/animated";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean | null;
  /** Tailwind gradient classes for the icon chip, e.g. "from-blue-600 to-blue-400" */
  iconGradient?: string;
  chartColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  iconGradient = "from-[#11327c] to-[#1e58b8]",
  chartColor = "#11327c",
}: StatsCardProps) {
  const gradientId = `spark-${title.replace(/[^a-zA-Z0-9]/g, "")}`;
  const isFlat = trendUp === null || trend === "0" || !trend;

  // Sparkline paths within a 0-32 viewBox
  const path = isFlat
    ? "M0,14 L16,12 L32,15 L48,13 L64,15 L80,14 L100,14"
    : trendUp
      ? "M0,22 C10,22 15,19 20,19 C25,19 30,22 35,20 C40,18 45,13 50,16 C55,19 60,13 65,10 C70,7 75,13 80,7 C85,2 90,10 100,6"
      : "M0,6 C10,6 15,9 20,11 C25,13 30,9 35,13 C40,17 45,24 50,20 C55,16 60,24 65,26 C70,28 75,22 80,28 C85,31 90,24 100,30";

  return (
    <div className="group relative bg-card rounded-2xl border border-border shadow-card p-5 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5 hover:border-primary/25">
      {/* Soft corner glow in the card's accent color */}
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-[0.08] group-hover:opacity-15 transition-opacity duration-300 blur-2xl",
          iconGradient
        )}
      />

      {/* Icon + trend */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div
          className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-6px_rgb(15_23_42/0.5)] transition-transform duration-300 group-hover:scale-105",
            iconGradient
          )}
        >
          <Icon size={19} strokeWidth={2.4} />
        </div>
        {isFlat ? (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-muted-foreground pt-0.5">
            <Minus size={12} strokeWidth={2.6} /> No change
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[12px] font-extrabold pt-0.5",
              trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            )}
          >
            {trendUp ? (
              <ArrowUpRight size={13} strokeWidth={2.6} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.6} />
            )}
            {trend}%
          </span>
        )}
      </div>

      {/* Label + value */}
      <div className="mt-4 relative z-10">
        <p className="text-muted-foreground text-[12px] font-semibold truncate">{title}</p>
        <p className="font-display text-foreground font-extrabold text-[27px] leading-none tracking-tight mt-1">
          {typeof value === "number" ? (
            <AnimatedNumber value={value} />
          ) : typeof value === "string" && !isNaN(Number(value.replace(/[^0-9.-]+/g, ""))) && value.replace(/[^0-9.-]+/g, "").length > 0 ? (
            <AnimatedNumber
              value={Number(value.replace(/[^0-9.-]+/g, ""))}
              prefix={value.trim().startsWith("₹") ? "₹" : ""}
              decimals={value.includes(".") ? 2 : 0}
            />
          ) : (
            value
          )}
        </p>
      </div>

      {/* Bottom row: caption + sparkline */}
      <div className="mt-auto pt-4 flex items-end justify-between gap-3 relative z-10">
        <span className="text-[11px] font-medium text-muted-foreground leading-none pb-0.5">
          vs last 7 days
        </span>
        <svg
          viewBox="0 0 100 32"
          preserveAspectRatio="none"
          className="h-[26px] w-[88px] -mb-0.5 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L100,32 L0,32 Z`} fill={`url(#${gradientId})`} />
          <path
            d={path}
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

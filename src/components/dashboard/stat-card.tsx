"use client";

import { cn } from "@/src/lib/utils";
import { AnimatedNumber } from "@/src/components/ui/animated";

export type StatCardVariant = "lime" | "mint" | "coral" | "lavender" | "pink" | "neutral";
export type StatCardTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

const toneToVariant: Record<StatCardTone, StatCardVariant> = {
  brand: "mint",
  success: "lime",
  warning: "coral",
  danger: "coral",
  info: "lavender",
  neutral: "neutral",
};

const variantClasses: Record<StatCardVariant, { card: string; icon: string; bars: string; text: string; subtext: string }> = {
  lime: {
    card: "bg-[#D6EDB3] dark:bg-[#1E3B24] border border-[#C5E49B] dark:border-[#2C5634]",
    icon: "bg-white/60 dark:bg-black/20 text-[#062C2F] dark:text-[#A7E8B8]",
    bars: "bg-[#062C2F]/15 dark:bg-[#A7E8B8]/20",
    text: "text-[#062C2F] dark:text-[#E9F6F6]",
    subtext: "text-[#47604B] dark:text-[#8BB392]",
  },
  mint: {
    card: "bg-[#9CD4D2] dark:bg-[#143D3F] border border-[#87C7C5] dark:border-[#1E5659]",
    icon: "bg-white/60 dark:bg-black/20 text-[#062C2F] dark:text-[#9CD4D2]",
    bars: "bg-[#062C2F]/15 dark:bg-[#9CD4D2]/20",
    text: "text-[#062C2F] dark:text-[#E9F6F6]",
    subtext: "text-[#3D6260] dark:text-[#88B8B6]",
  },
  coral: {
    card: "bg-[#EDB2B7] dark:bg-[#3D1A20] border border-[#E39DA3] dark:border-[#59262E]",
    icon: "bg-white/60 dark:bg-black/20 text-[#062C2F] dark:text-[#FCA5A5]",
    bars: "bg-[#062C2F]/15 dark:bg-[#FCA5A5]/20",
    text: "text-[#062C2F] dark:text-[#E9F6F6]",
    subtext: "text-[#6B3E43] dark:text-[#D18F96]",
  },
  lavender: {
    card: "bg-[#B2BCEE] dark:bg-[#1C2449] border border-[#9CA8E6] dark:border-[#2E3A73]",
    icon: "bg-white/60 dark:bg-black/20 text-[#062C2F] dark:text-[#BFDBFE]",
    bars: "bg-[#062C2F]/15 dark:bg-[#BFDBFE]/20",
    text: "text-[#062C2F] dark:text-[#E9F6F6]",
    subtext: "text-[#444E7A] dark:text-[#95A0D4]",
  },
  pink: {
    card: "bg-[#E5B1DB] dark:bg-[#3A1835] border border-[#DA9CCE] dark:border-[#572750]",
    icon: "bg-white/60 dark:bg-black/20 text-[#062C2F] dark:text-[#F5D0EE]",
    bars: "bg-[#062C2F]/15 dark:bg-[#F5D0EE]/20",
    text: "text-[#062C2F] dark:text-[#E9F6F6]",
    subtext: "text-[#663A60] dark:text-[#CF8DC3]",
  },
  neutral: {
    card: "bg-[#D9E7E6] dark:bg-[#133235] border border-[#C5D9D7] dark:border-[#1E484C]",
    icon: "bg-white/60 dark:bg-black/20 text-[#062C2F] dark:text-[#E9F6F6]",
    bars: "bg-[#062C2F]/15 dark:bg-[#E9F6F6]/15",
    text: "text-[#062C2F] dark:text-[#E9F6F6]",
    subtext: "text-[#506867] dark:text-[#92ADA9]",
  },
};

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
  tone?: StatCardTone;
  variant?: StatCardVariant;
  className?: string;
  decimals?: number;
  prefix?: string;
  trend?: string;
  trendUp?: boolean | null;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  tone,
  variant,
  className,
  decimals = 0,
  prefix,
  trend,
  trendUp,
}: StatCardProps) {
  const chosenVariant = variant ?? (tone ? toneToVariant[tone] : "mint");
  const styling = variantClasses[chosenVariant] || variantClasses.mint;

  const isNumeric = typeof value === "number";
  const numericString = typeof value === "string" ? value.replace(/[^0-9.-]+/g, "") : "";
  const isStringNumeric =
    typeof value === "string" && !isNaN(Number(numericString)) && numericString.length > 0;
  const hasRupee = typeof value === "string" && value.trim().startsWith("₹");
  const resolvedPrefix = prefix ?? (hasRupee ? "₹" : "");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[26px] md:rounded-[30px] p-4.5 flex flex-col justify-between min-h-[142px] transition-all duration-200 shadow-soft select-none",
        styling.card,
        className
      )}
    >
      {/* Decorative vertical bars in bottom-right corner as specified in DESIGN.md 8.5 */}
      <div
        className="absolute bottom-3 right-4 flex items-end gap-1.5 pointer-events-none opacity-40"
        aria-hidden="true"
      >
        <span className={cn("w-1.5 h-6 rounded-full", styling.bars)} />
        <span className={cn("w-1.5 h-11 rounded-full", styling.bars)} />
        <span className={cn("w-1.5 h-8 rounded-full", styling.bars)} />
        <span className={cn("w-1.5 h-14 rounded-full", styling.bars)} />
      </div>

      {/* Top row: Icon inside circular container + Trend badge */}
      <div className="flex items-center justify-between relative z-10">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs",
            styling.icon
          )}
        >
          <Icon size={17} strokeWidth={2.4} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/40 dark:bg-black/20",
              styling.text
            )}
          >
            {trendUp ? "↑" : trendUp === false ? "↓" : ""} {trend}
          </span>
        )}
      </div>

      {/* Middle & Bottom: Label, Value, Supporting Text */}
      <div className="mt-3 relative z-10">
        <p className={cn("text-[12px] font-medium tracking-tight truncate", styling.subtext)}>
          {title}
        </p>
        <p
          className={cn(
            "font-display text-[25px] sm:text-[27px] font-semibold leading-tight tracking-tight mt-0.5 truncate",
            styling.text
          )}
        >
          {isNumeric ? (
            <AnimatedNumber value={value as number} prefix={resolvedPrefix} decimals={decimals} />
          ) : isStringNumeric ? (
            <AnimatedNumber
              value={Number(numericString)}
              prefix={resolvedPrefix}
              decimals={decimals || (value.includes(".") ? 2 : 0)}
            />
          ) : (
            value
          )}
        </p>
        {hint && (
          <p className={cn("text-[11px] font-normal mt-1 truncate", styling.subtext)}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

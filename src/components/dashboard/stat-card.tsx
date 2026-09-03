"use client";

import { cn } from "@/src/lib/utils";
import { AnimatedNumber } from "@/src/components/ui/animated";

type StatCardTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

const toneMap: Record<StatCardTone, string> = {
  brand: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  neutral: "bg-muted text-muted-foreground",
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
  tone?: StatCardTone;
  className?: string;
  decimals?: number;
  prefix?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  tone = "brand",
  className,
  decimals = 0,
  prefix,
}: StatCardProps) {
  const isNumeric = typeof value === "number";
  const numericString = typeof value === "string" ? value.replace(/[^0-9.-]+/g, "") : "";
  const isStringNumeric = typeof value === "string" && !isNaN(Number(numericString)) && numericString.length > 0;
  const hasRupee = typeof value === "string" && value.trim().startsWith("₹");
  const resolvedPrefix = prefix ?? (hasRupee ? "₹" : "");

  return (
    <div className={cn("surface-card p-4 flex items-center gap-3.5", className)}>
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", toneMap[tone])}>
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground truncate">{title}</p>
        <p className="font-display text-[18px] font-bold tracking-tight text-foreground leading-none mt-1 truncate">
          {isNumeric ? (
            <AnimatedNumber value={value as number} prefix={resolvedPrefix} decimals={decimals} />
          ) : isStringNumeric ? (
            <AnimatedNumber value={Number(numericString)} prefix={resolvedPrefix} decimals={decimals || (value.includes(".") ? 2 : 0)} />
          ) : (
            value
          )}
        </p>
        {hint && <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{hint}</p>}
      </div>
    </div>
  );
}

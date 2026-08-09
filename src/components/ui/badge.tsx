import * as React from "react";
import { cn } from "@/src/lib/utils";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

const variantClass: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  neutral: "badge-neutral",
  brand: "badge-brand",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span className={cn(variantClass[variant], className)} {...props}>
      {children}
    </span>
  );
}

/** Small colored dot used to prefix badges with a status pulse. */
export function StatusDot({
  variant = "neutral",
  pulse = false,
}: {
  variant?: BadgeVariant;
  pulse?: boolean;
}) {
  const dotClass: Record<BadgeVariant, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    neutral: "bg-slate-400",
    brand: "bg-blue-600",
  };
  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full shrink-0",
        dotClass[variant],
        pulse && "animate-pulse"
      )}
    />
  );
}

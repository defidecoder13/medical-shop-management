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
    success: "bg-[#3B8A74]",
    warning: "bg-[#D9822B]",
    danger: "bg-[#C94A58]",
    info: "bg-[#3F7A9B]",
    neutral: "bg-[#819493]",
    brand: "bg-[#062C2F]",
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

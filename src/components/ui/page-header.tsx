import * as React from "react";
import { cn } from "@/src/lib/utils";
import { BrandMark } from "./brand-mark";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional leading icon element (e.g. BrandMark or a Lucide icon chip) */
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — consistent page title block used across every screen.
 * Styled with deep teal typography, rounded icon container, and compact actions.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5.5 animate-fade-in", className)}>
      <div className="flex items-center gap-3.5 min-w-0">
        {icon ?? <BrandMark size={40} />}
        <div className="min-w-0">
          <h1 className="font-display text-[24px] md:text-[27px] font-semibold tracking-tight text-foreground leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] font-normal text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
}

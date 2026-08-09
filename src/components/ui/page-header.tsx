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
 * Renders title + subtitle on the left and action buttons on the right.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 animate-fade-in", className)}>
      <div className="flex items-center gap-3.5 min-w-0">
        {icon ?? <BrandMark size={44} />}
        <div className="min-w-0">
          <h1 className="font-display text-[21px] md:text-[24px] font-extrabold tracking-tight text-foreground leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] font-medium text-muted-foreground mt-0.5 truncate">
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

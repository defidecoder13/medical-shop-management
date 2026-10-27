import * as React from "react";
import { cn } from "@/src/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("empty-state", className)}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4 shadow-xs">
          {icon}
        </div>
      )}
      <p className="font-display text-[16px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-[13px] font-normal text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableEmptyState({
  colSpan,
  title,
  description,
}: {
  colSpan: number;
  title: string;
  description?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState title={title} description={description} className="py-12" />
      </td>
    </tr>
  );
}

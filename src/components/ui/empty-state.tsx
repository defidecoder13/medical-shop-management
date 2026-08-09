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
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-bold text-foreground">{title}</p>
      {description && (
        <p className="text-[13px] font-medium text-muted-foreground mt-1 max-w-sm">
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

"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, PackageX } from "@/src/components/icons";
import { EmptyState } from "@/src/components/ui/empty-state";

interface StockAlertsProps {
  data: { name: string; stock: number; req: number }[];
}

export function StockAlerts({ data }: StockAlertsProps) {
  const alerts = data || [];
  const lowStockCount = alerts.length;

  return (
    <div className="surface-card p-6 h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-warning/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-[17px] h-[17px]" strokeWidth={2.4} />
          </span>
          <h3 className="font-display text-[16px] font-extrabold text-foreground">
            Stock Alerts
          </h3>
          {lowStockCount > 0 && (
            <span className="badge-danger">{lowStockCount}</span>
          )}
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {alerts.slice(0, 4).map((item, idx) => {
          const low = item.stock <= item.req * 0.5;
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/50 border border-border transition-colors hover:bg-accent/60 cursor-default"
            >
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">
                  In stock:{" "}
                  <span className={low ? "text-red-500 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                    {item.stock}
                  </span>{" "}
                  / Required: {item.req}
                </p>
              </div>
              <Link
                href="/inventory"
                className="btn-primary btn-sm shrink-0"
              >
                Reorder
              </Link>
            </div>
          );
        })}

        {lowStockCount === 0 && (
          <EmptyState
            icon={<PackageX size={24} strokeWidth={2} />}
            title="All stocked up"
            description="No items are currently running low. Nice work!"
            className="py-10"
          />
        )}

        {lowStockCount > 4 && (
          <div className="text-center text-[12px] font-bold text-muted-foreground pt-1">
            + {lowStockCount - 4} more items low on stock
          </div>
        )}
      </div>

      <Link
        href="/inventory"
        className="btn-outline btn-md w-full mt-5"
      >
        View All Stock <ArrowRight size={15} strokeWidth={2.4} />
      </Link>
    </div>
  );
}

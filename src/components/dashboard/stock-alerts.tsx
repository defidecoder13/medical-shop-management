
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StockAlertsProps {
  data: { name: string; stock: number; req: number }[];
}

export function StockAlerts({ data }: StockAlertsProps) {
  // Use passed data instead of internal state/fetch
  const alerts = data || [];
  const lowStockCount = alerts.length;

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm h-full flex flex-col">
      <h4 className="font-semibold text-card-foreground mb-4">Stock Alerts</h4>
      <div className="space-y-4 flex-1">
        {/* Dynamic alert items */}
        {alerts.slice(0, 3).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border transition-colors hover:bg-secondary">
            <div>
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Current: <span className="text-rose-500 font-semibold">{item.stock}</span> / Need: {item.req}</p>
            </div>
            <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 font-medium transition-colors shadow-sm">
              Order
            </button>
          </div>
        ))}
        
        {lowStockCount > 3 && (
           <div className="text-center text-xs text-muted-foreground py-2">
             + {lowStockCount - 3} more items low on stock
           </div>
        )}
      </div>
      
      <Link 
        href="/inventory"
        className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-sm text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors border border-primary/20 border-dashed"
      >
        View All Stock <ArrowRight size={14} />
      </Link>
    </div>
  );
}

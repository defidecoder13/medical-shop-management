
import { Card } from "@/src/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  trendUp?: boolean;
  color?: string; // e.g., "bg-indigo-50 text-indigo-600"
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  trendUp, 
  color = "bg-indigo-50 text-indigo-600" 
}: StatsCardProps) {
  return (
    <div className="bg-card p-5 rounded-xl border border-border shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon size={20} className="stroke-[2.5]" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center text-xs font-medium",
            trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

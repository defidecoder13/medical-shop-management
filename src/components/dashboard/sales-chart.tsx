"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { BarChart3 } from "@/src/components/icons";
import { useTheme } from "@/src/components/theme-provider";
import { cn } from "@/src/lib/utils";

interface SalesChartProps {
  data: { name: string; sales: number }[];
  range: string;
  onRangeChange: (range: string) => void;
}

const ranges = [
  { key: "1d", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
];

export function SalesChart({ data, range, onRangeChange }: SalesChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="surface-card p-5 md:p-6 h-full flex flex-col animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-[16px] font-extrabold text-foreground flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="w-[17px] h-[17px]" strokeWidth={2.4} />
            </span>
            Sales Performance
          </h3>
          <p className="text-[12px] font-medium text-muted-foreground mt-1.5">
            Daily revenue trend across the selected period
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted/70 rounded-xl p-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => onRangeChange(r.key)}
              className={cn(
                "relative px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none",
                range === r.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {range === r.key && (
                <motion.div
                  layoutId="activeChartRange"
                  transition={{ type: "spring", stiffness: 420, damping: 28 }}
                  className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border"
                />
              )}
              <span className="relative z-10">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-[210px] md:h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke={isDark ? "#1e293b" : "#e2e8f0"}
              opacity={0.6}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}
              dy={14}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}
              dx={-8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderRadius: "12px",
                border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                boxShadow: "0 10px 30px -8px rgba(15,23,42,0.25)",
                color: isDark ? "white" : "#0f172a",
                fontWeight: 700,
                fontSize: "13px",
                padding: "10px 14px",
              }}
              labelStyle={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: isDark ? "white" : "#0f172a", fontWeight: 800 }}
              cursor={{ stroke: isDark ? "#475569" : "#cbd5e1", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#2563eb"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSales)"
              activeDot={{ r: 6, fill: "#2563eb", stroke: isDark ? "#0f172a" : "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { BarChart3 } from "@/src/components/icons";
import { cn } from "@/src/lib/utils";
import { EChartsWrapper, useEchartsTheme } from "@/src/components/charts/echarts-wrapper";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";

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
  const t = useEchartsTheme();

  const option: EChartsOption = useMemo(
    () => ({
      grid: { left: 8, right: 8, top: 12, bottom: 0, containLabel: true },
      tooltip: {
        trigger: "axis",
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        borderWidth: 1,
        padding: [10, 14],
        extraCssText: "border-radius: 20px; box-shadow: 0 8px 24px rgba(6,44,47,0.18);",
        textStyle: { color: t.tooltipText, fontSize: 12, fontWeight: 500 },
        axisPointer: { type: "line", lineStyle: { color: t.primary, type: "dashed", width: 1.5, opacity: 0.6 } },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p) return "";
          return `<div style="min-width:100px"><div style="color:rgba(255,255,255,0.7);font-size:11px;margin-bottom:3px">${p.axisValue}</div><div style="font-weight:700;font-size:15px;color:#FFFFFF">₹${Number(p.value).toLocaleString("en-IN")}</div></div>`;
        },
      },
      xAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: t.axisColor, fontSize: 11, fontWeight: 500, margin: 12 },
        boundaryGap: false,
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: t.gridColor, type: "dashed", width: 1, opacity: 0.7 } },
        axisLabel: {
          color: t.axisColor,
          fontSize: 11,
          fontWeight: 500,
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
        },
      },
      series: [
        {
          type: "line",
          data: data.map((d) => d.sales),
          smooth: true,
          smoothMonotone: "x",
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: t.primary, borderColor: "#FFFFFF", borderWidth: 1.5 },
          lineStyle: { color: t.primary, width: 2.5 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: t.primaryArea },
                { offset: 1, color: "rgba(0,0,0,0)" },
              ],
            },
          },
          emphasis: { focus: "series" as const },
        },
      ],
    }),
    [data, t]
  );

  return (
    <div className="surface-card p-5 md:p-6 rounded-[28px] md:rounded-[32px] flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center">
              <BarChart3 className="w-4 h-4" strokeWidth={2.2} />
            </span>
            Sales Performance
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Revenue trend — {range === "1d" ? "last 24 hours" : range === "7d" ? "last 7 days" : "last 30 days"}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-full border border-border/60">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => onRangeChange(r.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150",
                range === r.key
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <EChartsWrapper option={option} height={260} />
    </div>
  );
}

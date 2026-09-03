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
        textStyle: { color: t.tooltipText, fontSize: 12, fontWeight: 600 },
        axisPointer: { type: "line", lineStyle: { color: t.gridColor, type: "dashed", width: 1 } },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p) return "";
          return `<div style="min-width:90px"><div style="color:${t.axisColor};font-size:11px;margin-bottom:4px">${p.axisValue}</div><div style="font-weight:700">₹${Number(p.value).toLocaleString("en-IN")}</div></div>`;
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
          symbol: "none",
          lineStyle: { color: t.primary, width: 2 },
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
    <div className="surface-card p-5 md:p-6 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
              <BarChart3 className="w-4 h-4" strokeWidth={2} />
            </span>
            Sales Performance
          </h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            Revenue trend — {range === "1d" ? "last 24 hours" : range === "7d" ? "last 7 days" : "last 30 days"}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 border border-border">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => onRangeChange(r.key)}
              className={cn(
                "relative px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors cursor-pointer select-none",
                range === r.key
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full h-[210px] md:h-[230px]">
        {data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="w-8 h-8 mb-2 opacity-40" strokeWidth={1.5} />
            <p className="text-xs">No sales data for this period</p>
          </div>
        ) : (
          <EChartsWrapper option={option} height={230} />
        )}
      </div>
    </div>
  );
}

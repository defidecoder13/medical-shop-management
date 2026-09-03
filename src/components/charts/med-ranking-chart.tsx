"use client";

import { EChartsWrapper, useEchartsTheme } from "@/src/components/charts/echarts-wrapper";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import { Trophy, TrendingDown } from "@/src/components/icons";

type RankItem = { name: string; quantity: number; revenue: number };

export function MedRankingCard({
  title,
  subtitle,
  data,
  variant,
}: {
  title: string;
  subtitle: string;
  data: RankItem[];
  variant: "most" | "least";
}) {
  const t = useEchartsTheme();
  const isMost = variant === "most";

  const option: EChartsOption = useMemo(() => {
    if (!data || data.length === 0) return {} as EChartsOption;
    // For least, show ascending (smallest at top) — reverse so smallest bar on top when inverse
    const sorted = [...data];
    const names = sorted.map((d) => (d.name.length > 18 ? d.name.slice(0, 18) + "…" : d.name));
    const values = sorted.map((d) => d.quantity);
    const color = isMost ? t.success : t.warning;
    const colorFaint = isMost ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)";
    return {
      grid: { left: 12, right: 36, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: isMost ? "rgba(16,185,129,0.06)" : "rgba(245,158,11,0.06)" } },
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: t.tooltipText, fontSize: 12 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const idx = p.dataIndex;
          const item = sorted[idx];
          return `<div style="min-width:140px"><div style="font-weight:600;margin-bottom:4px">${item.name}</div><div style="color:${t.axisColor}">Qty: <span style="color:${t.tooltipText};font-weight:700">${item.quantity}</span></div><div style="color:${t.axisColor}">Revenue: <span style="color:${t.tooltipText};font-weight:700">₹${item.revenue.toLocaleString()}</span></div></div>`;
        },
      },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: t.gridColor, type: "dashed", opacity: 0.6 } },
        axisLabel: { color: t.axisColor, fontSize: 11 },
      },
      yAxis: {
        type: "category",
        data: names,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: t.axisColor, fontSize: 11, fontWeight: 500, width: 90, overflow: "truncate" },
      },
      series: [
        {
          type: "bar",
          data: values,
          barCategoryGap: "32%",
          barWidth: 14,
          itemStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: color },
                { offset: 1, color: isMost ? "#34d399" : "#fbbf24" },
              ],
            },
            borderRadius: [0, 8, 8, 0] as any,
          },
          label: {
            show: true,
            position: "right",
            formatter: "{c}",
            color: t.axisColor,
            fontSize: 11,
            fontWeight: 600,
          },
          emphasis: { itemStyle: { shadowBlur: 8, shadowColor: colorFaint } },
        },
      ],
    } as EChartsOption;
  }, [data, isMost, t]);

  const hasData = data && data.length > 0;

  return (
    <div className="surface-card p-5 flex flex-col">
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`w-7 h-7 rounded-md flex items-center justify-center ${isMost ? "bg-success/10 text-success" : "bg-warning/15 text-amber-600 dark:text-amber-400"}`}>
          {isMost ? <Trophy className="w-4 h-4" strokeWidth={2} /> : <TrendingDown className="w-4 h-4" strokeWidth={2} />}
        </span>
        <div>
          <h3 className="text-[13px] font-semibold text-foreground leading-none">{title}</h3>
          <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <span className="ml-auto text-[11px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
          {isMost ? "Top 5" : "Bottom 5"}
        </span>
      </div>
      <div className="flex-1 min-h-[180px]">
        {hasData ? (
          <EChartsWrapper option={option} height={180 + Math.max(0, (data.length - 3) * 28)} />
        ) : (
          <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2">
              {isMost ? <Trophy className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <p className="text-xs">No sales in this period</p>
          </div>
        )}
      </div>
    </div>
  );
}

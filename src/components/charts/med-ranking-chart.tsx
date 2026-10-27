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
    const sorted = [...data];
    const names = sorted.map((d) => (d.name.length > 18 ? d.name.slice(0, 18) + "…" : d.name));
    const values = sorted.map((d) => d.quantity);
    const color = isMost ? t.mint : t.coral;
    const barTextColor = "#062C2F";

    return {
      grid: { left: 12, right: 36, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(6,44,47,0.04)" } },
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        borderWidth: 1,
        padding: [10, 14],
        extraCssText: "border-radius: 20px; box-shadow: 0 8px 24px rgba(6,44,47,0.18);",
        textStyle: { color: t.tooltipText, fontSize: 12 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const idx = p.dataIndex;
          const item = sorted[idx];
          return `<div style="min-width:140px"><div style="font-weight:600;font-size:13px;color:#FFFFFF;margin-bottom:4px">${item.name}</div><div style="color:rgba(255,255,255,0.7);font-size:11px">Qty: <span style="color:#FFFFFF;font-weight:700">${item.quantity}</span></div><div style="color:rgba(255,255,255,0.7);font-size:11px">Revenue: <span style="color:#9CD4D2;font-weight:700">₹${item.revenue.toLocaleString()}</span></div></div>`;
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
        axisLabel: { color: t.axisColor, fontSize: 11, fontWeight: 500 },
      },
      series: [
        {
          type: "bar",
          data: values,
          barMaxWidth: 14,
          itemStyle: {
            color: color,
            borderRadius: [0, 999, 999, 0] as any,
          },
          label: {
            show: true,
            position: "right",
            color: t.axisColor,
            fontSize: 11,
            fontWeight: 600,
            formatter: "{c}u",
          },
        },
      ],
    };
  }, [data, isMost, t]);

  return (
    <div className="surface-card p-5 md:p-6 rounded-[28px] md:rounded-[32px] flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center">
              {isMost ? (
                <Trophy className="w-4 h-4 text-[#3B8A74]" strokeWidth={2.2} />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#C94A58]" strokeWidth={2.2} />
              )}
            </span>
            {title}
          </h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      {data && data.length > 0 ? (
        <EChartsWrapper option={option} height={220} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground py-10">
          No sales data available yet
        </div>
      )}
    </div>
  );
}

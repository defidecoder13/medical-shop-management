"use client";

import { EChartsWrapper, useEchartsTheme } from "@/src/components/charts/echarts-wrapper";
import type { EChartsOption } from "echarts";
import { useMemo } from "react";
import { format } from "date-fns";

interface ReportTrajectoryProps {
  dailySales: Array<{ date: string; sales: number; profit: number }>;
}

export function ReportTrajectoryChart({ dailySales }: ReportTrajectoryProps) {
  const t = useEchartsTheme();

  const option: EChartsOption = useMemo(() => {
    const categories = dailySales.map((d) => format(new Date(d.date), "EEE dd"));
    const sales = dailySales.map((d) => d.sales);
    const profit = dailySales.map((d) => d.profit);

    return {
      grid: { left: 8, right: 12, top: 12, bottom: 0, containLabel: true },
      tooltip: {
        trigger: "axis",
        backgroundColor: t.tooltipBg,
        borderColor: t.tooltipBorder,
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: t.tooltipText, fontSize: 12 },
        axisPointer: { type: "shadow", shadowStyle: { color: t.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" } },
      },
      legend: {
        bottom: 0,
        data: ["Revenue", "Net Profit"],
        textStyle: { color: t.axisColor, fontSize: 11, fontWeight: 500 },
        itemWidth: 12,
        itemHeight: 6,
        icon: "roundRect",
        itemGap: 18,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: t.axisColor, fontSize: 11, fontWeight: 500 },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: t.gridColor, type: "dashed", opacity: 0.7 } },
        axisLabel: { color: t.axisColor, fontSize: 11, formatter: (v: number) => (v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)) },
      },
      series: [
        {
          name: "Revenue",
          type: "bar",
          data: sales,
          barMaxWidth: 18,
          itemStyle: { color: t.primary, borderRadius: [6, 6, 0, 0] as any },
          emphasis: { itemStyle: { color: t.primary } },
        },
        {
          name: "Net Profit",
          type: "bar",
          data: profit,
          barMaxWidth: 18,
          itemStyle: { color: t.warning, borderRadius: [6, 6, 0, 0] as any },
        },
      ],
    } as EChartsOption;
  }, [dailySales, t]);

  return <EChartsWrapper option={option} height={300} />;
}

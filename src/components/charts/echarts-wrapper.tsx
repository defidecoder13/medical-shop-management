"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/src/components/theme-provider";
import { useMemo } from "react";
import type { EChartsOption } from "echarts";

// Dynamic import to avoid SSR window issues
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export function useEchartsTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return useMemo(
    () => ({
      isDark,
      axisColor: isDark ? "#64748b" : "#94a3b8",
      gridColor: isDark ? "#1e293b" : "#e2e8f0",
      tooltipBg: isDark ? "#1e293b" : "#ffffff",
      tooltipBorder: isDark ? "#334155" : "#e2e8f0",
      tooltipText: isDark ? "#f1f5f9" : "#0f172a",
      primary: isDark ? "#60a5fa" : "#2563eb",
      primaryArea: isDark ? "rgba(96,165,250,0.15)" : "rgba(37,99,235,0.10)",
      success: isDark ? "#34d399" : "#10b981",
      warning: isDark ? "#fbbf24" : "#f59e0b",
      border: isDark ? "#334155" : "#e2e8f0",
    }),
    [isDark]
  );
}

interface EChartsWrapperProps {
  option: EChartsOption;
  height?: string | number;
  className?: string;
}

export function EChartsWrapper({ option, height = 240, className }: EChartsWrapperProps) {
  const themedOption = useMemo(() => {
    return {
      backgroundColor: "transparent",
      animationDuration: 400,
      animationEasing: "cubicOut" as const,
      ...option,
    } as EChartsOption;
  }, [option]);

  return (
    <ReactECharts
      option={themedOption}
      style={{ height, width: "100%" }}
      className={className}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
}

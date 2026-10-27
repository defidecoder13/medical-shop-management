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
      axisColor: isDark ? "#92ADA9" : "#506867",
      gridColor: isDark ? "#184144" : "#D7E6E5",
      // Deep teal tooltip with crisp white text as per DESIGN.md 9.4
      tooltipBg: isDark ? "#062C2F" : "#062C2F",
      tooltipBorder: isDark ? "#235458" : "#397F7C",
      tooltipText: "#FFFFFF",
      primary: isDark ? "#9CD4D2" : "#062C2F",
      primaryArea: isDark ? "rgba(156,212,210,0.22)" : "rgba(6,44,47,0.12)",
      mint: "#9CD4D2",
      lime: "#D6EDB3",
      coral: "#EDB2B7",
      lavender: "#B2BCEE",
      pink: "#E5B1DB",
      success: isDark ? "#6EE7B7" : "#3B8A74",
      warning: isDark ? "#FBBF24" : "#D9822B",
      border: isDark ? "#184144" : "#D7E6E5",
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

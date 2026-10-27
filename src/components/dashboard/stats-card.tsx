"use client";

import { StatCard, type StatCardVariant } from "./stat-card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean | null;
  variant?: StatCardVariant;
  className?: string;
  chartColor?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  variant = "mint",
  className,
}: StatsCardProps) {
  return (
    <StatCard
      title={title}
      value={value}
      icon={icon}
      trend={trend}
      trendUp={trendUp}
      variant={variant}
      className={className}
    />
  );
}

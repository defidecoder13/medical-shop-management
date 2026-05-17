
"use client";

import { cn } from "@/src/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean | null;
  iconBgColor?: string;
  iconColor?: string;
  chartColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  iconBgColor = "bg-[#dcfce7]",
  iconColor = "text-[#16a34a]",
  chartColor = "#16a34a"
}: StatsCardProps) {
  
  // Clean wavy path for the sparkline
  const getPath = () => {
    if (trendUp === null || trend === "0") return "M0,20 L20,18 L40,22 L60,19 L80,21 L100,20";
    if (trendUp) {
      return "M0,35 C10,35 15,30 20,30 C25,30 30,35 35,32 C40,29 45,20 50,25 C55,30 60,20 65,15 C70,10 75,20 80,10 C85,2 90,15 100,8";
    }
    return "M0,8 C10,8 15,12 20,15 C25,18 30,12 35,18 C40,22 45,35 50,28 C55,22 60,35 65,38 C70,42 75,32 80,40 C85,48 90,35 100,42";
  };

  const path = getPath();

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] flex flex-col h-[150px] relative overflow-hidden group">
      <div className="flex gap-4 relative z-10">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300",
          iconBgColor,
          iconColor
        )}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col pt-0.5">
          <span className="text-gray-500 text-[13px] font-semibold">{title}</span>
          <span className="text-gray-900 font-bold text-[22px] tracking-tight mt-0.5">{value}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 z-10 mt-3">
        {trendUp === null || trend === "0" || !trend ? (
          <span className="text-gray-400 text-[12px] font-bold">— No change</span>
        ) : (
          <>
            <span className={cn(
              "text-[12px] font-bold flex items-center gap-0.5", 
              trendUp ? "text-[#10b981]" : "text-[#ef4444]"
            )}>
              {trendUp ? '▲' : '▼'} {trend}%
            </span>
            <span className="text-gray-400 text-[11px] font-medium tracking-tight">vs last 7 days</span>
          </>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-[45px] pointer-events-none opacity-80 overflow-hidden">
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-full w-full">
           <defs>
            <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.1" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d={`${path} L100,50 L0,50 Z`} 
            fill={`url(#grad-${title.replace(/\s+/g, '')})`} 
          />
          <path 
            d={path} 
            fill="none" 
            stroke={chartColor} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
    </div>
  );
}

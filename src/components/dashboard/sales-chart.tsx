
"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useTheme } from '@/src/components/theme-provider';

interface SalesChartProps {
  data: { name: string; sales: number }[];
  range: string;
  onRangeChange: (range: string) => void;
}

export function SalesChart({ data, range, onRangeChange }: SalesChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] h-full flex flex-col transition-colors">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[17px] font-extrabold text-[#11327c] dark:text-blue-400 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#11327c] dark:text-blue-400" strokeWidth={2.5} />
          Sales Performance
        </h3>
        <select 
          className="text-[12px] font-bold border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-1.5 outline-none bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm focus:ring-2 focus:ring-[#11327c]/20"
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? '#1e293b' : '#e5e7eb'} opacity={0.6} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280', fontWeight: 600}} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: isDark ? '#94a3b8' : '#6b7280', fontWeight: 600}} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#1e293b' : '#11327c', 
                borderRadius: '12px', 
                border: isDark ? '1px solid #334155' : 'none', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                color: 'white',
                fontWeight: 'bold',
                padding: '8px 12px'
              }}
              itemStyle={{ color: 'white', fontWeight: 'bold' }}
              cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorSales)" 
              activeDot={{ r: 6, fill: '#11327c', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

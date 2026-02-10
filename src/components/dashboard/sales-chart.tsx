
"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface SalesChartProps {
  data: { name: string; sales: number }[];
  range: string;
  onRangeChange: (range: string) => void;
}

export function SalesChart({ data, range, onRangeChange }: SalesChartProps) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold text-card-foreground">Sales Performance</h4>
        <select 
          className="text-xs border border-border rounded px-2 py-1 outline-none bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80 transition-colors"
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--popover)', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                color: 'var(--popover-foreground)'
              }}
              itemStyle={{ color: 'var(--primary)' }}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="var(--primary)" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorSales)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

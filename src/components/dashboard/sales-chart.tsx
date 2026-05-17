
"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface SalesChartProps {
  data: { name: string; sales: number }[];
  range: string;
  onRangeChange: (range: string) => void;
}

export function SalesChart({ data, range, onRangeChange }: SalesChartProps) {
  return (
    <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[17px] font-extrabold text-[#11327c] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#11327c]" strokeWidth={2.5} />
          Sales Performance
        </h3>
        <select 
          className="text-[12px] font-bold border border-gray-200 rounded-lg px-3 py-1.5 outline-none bg-white text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm focus:ring-2 focus:ring-[#11327c]/20"
          value={range}
          onChange={(e) => onRangeChange(e.target.value)}
        >
          <option value="1d">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" opacity={0.6} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} 
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: '#6b7280', fontWeight: 600}} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#11327c', 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 25px -5px rgba(17,50,124,0.4)',
                color: 'white',
                fontWeight: 'bold',
                padding: '8px 12px'
              }}
              itemStyle={{ color: 'white', fontWeight: 'bold' }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
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

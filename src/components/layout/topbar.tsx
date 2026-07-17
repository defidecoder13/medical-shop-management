"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/src/components/theme-toggle";

export interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 z-50 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-2 text-[#11327c] dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 border border-gray-200 dark:border-slate-700"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
        )}
        <span className="font-black text-[15px] text-[#11327c] dark:text-blue-400 tracking-tight">MEDSATHI PHARMACY</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
};

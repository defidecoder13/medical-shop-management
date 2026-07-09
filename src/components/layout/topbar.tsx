"use client";

import { Menu } from "lucide-react";

export interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 z-50 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-2 text-[#11327c] hover:bg-gray-50 rounded-xl transition-colors shrink-0 border border-gray-200"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
        )}
        <span className="font-black text-[15px] text-[#11327c] tracking-tight">MEDSATHI PHARMACY</span>
      </div>
    </div>
  );
};

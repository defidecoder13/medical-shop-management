"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Home, 
  Receipt, 
  History, 
  Package, 
  CalendarClock, 
  BarChart3, 
  Settings,
  Users,
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  AlertTriangle,
  Truck,
  Building2,
  Landmark,
  Plus,
  X,
  BookOpen,
  ScrollText,
  ArrowRightLeft,
  FileSpreadsheet,
  Layers
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ThemeToggle } from "@/src/components/theme-toggle";

const navigationGroups = [
  {
    group: "MAIN MENU",
    routes: [
      { label: "Dashboard", icon: Home, href: "/" },
      { label: "New Bill", icon: Receipt, href: "/billing" },
      { label: "Transactions", icon: History, href: "/transactions" },
    ]
  },
  {
    group: "INVENTORY",
    routes: [
      { label: "Stock Items", icon: Package, href: "/inventory" },
      { label: "Expiry Tracker", icon: CalendarClock, href: "/expiry" },
    ]
  },
  {
    group: "DISTRIBUTORS",
    routes: [
      { label: "Suppliers List", icon: Building2, href: "/suppliers" },
      { label: "Auto Purchase Import", icon: FileSpreadsheet, href: "/purchases/import" },
      { label: "Supplier Returns", icon: Truck, href: "/supplier-returns" },
    ]
  },
  {
    group: "BUSINESS",
    routes: [
      { label: "Patients CRM", icon: Users, href: "/patients" },
      { label: "Reports", icon: BarChart3, href: "/sales-report" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ]
  },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isMobile = false, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isSidebarCollapsed = collapsed && !isMobile;

  return (
    <aside className={cn(
      "transition-all duration-300 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col z-20 h-screen shrink-0",
      isSidebarCollapsed ? "w-20" : "w-[240px]"
    )}>
      {/* App Branding */}
      <div className="h-20 flex items-center justify-between px-5 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="shrink-0">
             <Plus className="text-green-500 fill-green-500" size={28} strokeWidth={4} />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col ml-1">
              <span className="font-black text-[16px] tracking-tight leading-none">
                <span className="text-[#f97316]">MEDSATHI</span>
              </span>
              <span className="font-black text-[16px] tracking-tight leading-none text-[#11327c] dark:text-blue-400">
                PHARMACY
              </span>
            </div>
          )}
        </div>
        
        {isMobile && onClose && (
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-4 scrollbar-hide">
        {navigationGroups.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-[#11327c]/60 dark:text-blue-400/80">
                {section.group}
              </div>
            )}
            {section.routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-bold transition-all group",
                    isActive 
                      ? "bg-[#0047ab] shadow-sm shadow-[#0047ab]/20 text-white" 
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-[#11327c] dark:hover:text-blue-400"
                  )}
                  title={isSidebarCollapsed ? route.label : undefined}
                >
                  <route.icon 
                    size={18} 
                    strokeWidth={isActive ? 3 : 2.5}
                    className={cn(
                      "transition-colors",
                      isActive 
                        ? "text-white" 
                        : "text-gray-400 dark:text-gray-500 group-hover:text-[#11327c] dark:group-hover:text-blue-400"
                    )} 
                  />
                  {!isSidebarCollapsed && <span>{route.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 shrink-0 border-t border-gray-50 dark:border-slate-800 space-y-1">
        <ThemeToggle showLabel={!isSidebarCollapsed} />
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-[13.5px] font-bold transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        )}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-[13.5px] font-bold transition-colors"
        >
          <LogOut size={18} />
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

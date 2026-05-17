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
  Landmark,
  Plus
} from "lucide-react";
import { cn } from "@/src/lib/utils";

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
      { label: "Low Stock", icon: AlertTriangle, href: "/low-stock" },
      { label: "Supplier Returns", icon: Truck, href: "/supplier-returns" },
      { label: "Expiry Tracker", icon: CalendarClock, href: "/expiry" },
    ]
  },
  {
    group: "BUSINESS",
    routes: [
      { label: "Patients CRM", icon: Users, href: "/patients" },
      { label: "Reports", icon: BarChart3, href: "/sales-report" },
      { label: "Accounting", icon: Landmark, href: "/accounting" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ]
  }
];

export const Sidebar = () => {
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

  return (
    <aside className={cn(
      "transition-all duration-300 bg-white border-r border-gray-100 flex flex-col z-20 h-screen shrink-0",
      collapsed ? "w-20" : "w-[240px]"
    )}>
      {/* App Branding */}
      <div className="h-20 flex items-center px-5 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 w-full">
          <div className="shrink-0">
             <Plus className="text-[#ef4444] fill-[#ef4444]" size={28} strokeWidth={4} />
          </div>
          {!collapsed && (
            <div className="flex flex-col ml-1">
              <span className="font-black text-[16px] tracking-tight leading-none">
                <span className="text-[#f97316]">MEDSATHI</span>
              </span>
              <span className="font-black text-[16px] tracking-tight leading-none text-[#11327c]">
                PHARMACY
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-4 scrollbar-hide">
        {navigationGroups.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-[#11327c]/60">
                {section.group}
              </div>
            )}
            {section.routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-bold transition-all group",
                    isActive 
                      ? "bg-[#0047ab] shadow-sm shadow-[#0047ab]/20 text-white" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-[#11327c]"
                  )}
                  title={collapsed ? route.label : undefined}
                >
                  <route.icon 
                    size={18} 
                    strokeWidth={isActive ? 3 : 2.5}
                    className={cn(
                      "transition-colors",
                      isActive 
                        ? "text-white" 
                        : "text-gray-400 group-hover:text-[#11327c]"
                    )} 
                  />
                  {!collapsed && <span>{route.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 shrink-0 border-t border-gray-50 space-y-0.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-lg text-[13.5px] font-bold transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#ef4444] hover:bg-red-50 rounded-lg text-[13.5px] font-bold transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

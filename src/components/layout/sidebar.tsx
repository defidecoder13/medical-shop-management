
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Package, 
  CalendarClock, 
  BarChart3, 
  Settings,
  Users,
  ShoppingCart,
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Plus,
  AlertTriangle,
  Truck,
  Landmark
} from "lucide-react";
import { cn } from "@/src/lib/utils";

const navigationGroups = [
  {
    group: "Main Menu",
    routes: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "New Bill", icon: Receipt, href: "/billing" },
      { label: "Transactions", icon: History, href: "/transactions" },
    ]
  },
  {
    group: "Inventory",
    routes: [
      { label: "Stock Items", icon: Package, href: "/inventory" },
      { label: "Low Stock", icon: AlertTriangle, href: "/low-stock" },
      { label: "Supplier Returns", icon: Truck, href: "/supplier-returns" },
      { label: "Expiry Tracker", icon: CalendarClock, href: "/expiry" },
    ]
  },
  {
    group: "Business",
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
  const [shopName, setShopName] = useState("MedFlow Pro");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.shopName) {
          setShopName(data.shopName);
        }
      })
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

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
      "transition-all duration-300 bg-background border-r border-border flex flex-col z-20 h-screen",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* App Branding */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Plus className="text-primary-foreground font-bold" size={20} />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight whitespace-nowrap text-foreground">{shopName}</span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        {navigationGroups.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
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
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-indigo-600 shadow-md shadow-indigo-600/20 text-white" 
                      : "text-muted-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400"
                  )}
                  title={collapsed ? route.label : undefined}
                >
                  <route.icon 
                    size={18} 
                    className={cn(
                      "transition-colors",
                      isActive 
                        ? "text-white" 
                        : "text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    )} 
                  />
                  {!collapsed && <span>{route.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-secondary rounded-lg text-sm transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg text-sm transition-colors"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  FileSpreadsheet,
  X,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { BrandMark } from "@/src/components/ui/brand-mark";

const navigationGroups = [
  {
    group: "MAIN MENU",
    routes: [
      { label: "Dashboard", icon: Home, href: "/" },
      { label: "New Bill", icon: Receipt, href: "/billing" },
      { label: "Transactions", icon: History, href: "/transactions" },
    ],
  },
  {
    group: "INVENTORY",
    routes: [
      { label: "Stock Items", icon: Package, href: "/inventory" },
      { label: "Expiry Tracker", icon: CalendarClock, href: "/expiry" },
      { label: "Low Stock", icon: AlertTriangle, href: "/low-stock" },
    ],
  },
  {
    group: "DISTRIBUTORS",
    routes: [
      { label: "Suppliers", icon: Building2, href: "/suppliers" },
      { label: "Purchase Import", icon: FileSpreadsheet, href: "/purchases/import" },
      { label: "Supplier Returns", icon: Truck, href: "/supplier-returns" },
    ],
  },
  {
    group: "BUSINESS",
    routes: [
      { label: "Patients CRM", icon: Users, href: "/patients" },
      { label: "Reports", icon: BarChart3, href: "/sales-report" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
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

  // Close the confirm dialog on Escape
  useEffect(() => {
    if (!showLogoutConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogoutConfirm]);

  const isSidebarCollapsed = collapsed && !isMobile;

  return (
    <>
    <aside
      className={cn(
        "transition-all duration-300 ease-out bg-card border-r border-border flex flex-col z-20 h-screen shrink-0",
        isSidebarCollapsed ? "w-[76px]" : "w-[248px]"
      )}
    >
      {/* App Branding */}
      <div
        className={cn(
          "h-[68px] flex items-center gap-3 px-4 shrink-0 overflow-hidden border-b border-border/70",
          isSidebarCollapsed && "justify-center px-0"
        )}
      >
        <BrandMark size={isSidebarCollapsed ? 38 : 40} />
        {!isSidebarCollapsed && (
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-display font-extrabold text-[15px] tracking-tight text-warning">
              MEDSATHI
            </span>
            <span className="font-display font-extrabold text-[13px] tracking-[0.08em] text-brand mt-0.5">
              PHARMACY
            </span>
          </div>
        )}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navigationGroups.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.16em] text-muted-foreground/70">
                {section.group}
              </div>
            )}
            {section.routes.map((route) => {
              const isActive =
                pathname === route.href || pathname.startsWith(`${route.href}/`);
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={cn(
                    "relative w-full flex items-center gap-3 rounded-xl text-[13.5px] font-bold transition-all duration-200 group",
                    isSidebarCollapsed ? "px-0 justify-center py-2.5" : "px-3 py-2.5",
                    isActive
                      ? "bg-gradient-to-r from-primary/12 to-primary/5 text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_22%,transparent)]"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                  )}
                  title={isSidebarCollapsed ? route.label : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                  )}
                  <route.icon
                    size={18}
                    strokeWidth={isActive ? 2.6 : 2.2}
                    className={cn(
                      "transition-colors shrink-0",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground/70 group-hover:text-foreground"
                    )}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{route.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 shrink-0 border-t border-border/70 space-y-1">
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl text-[13.5px] font-bold transition-colors text-muted-foreground hover:bg-accent/70 hover:text-foreground",
              isSidebarCollapsed ? "justify-center py-2.5" : "px-3 py-2.5"
            )}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        )}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl text-[13.5px] font-bold transition-colors text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40",
            isSidebarCollapsed ? "justify-center py-2.5" : "px-3 py-2.5"
          )}
        >
          <LogOut size={18} strokeWidth={2.2} />
          {!isSidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>

    {/* Logout confirmation dialog (portal: escapes sidebar/drawer transforms) */}
    {showLogoutConfirm &&
      typeof document !== "undefined" &&
      createPortal(
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.18 }}
              role="dialog"
              aria-modal="true"
              aria-label="Confirm logout"
              className="relative w-[92vw] max-w-sm bg-card border border-border rounded-2xl shadow-pop p-6 text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-4">
                <LogOut size={22} strokeWidth={2.4} />
              </div>
              <h3 className="font-display text-[17px] font-extrabold text-foreground">
                Log out of Medsathi?
              </h3>
              <p className="text-[13px] text-muted-foreground font-medium mt-1.5">
                You will need to sign in again to manage your pharmacy.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-outline btn-md flex-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="btn-danger btn-md flex-1 cursor-pointer"
                >
                  Yes, Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
  </>
  );
};

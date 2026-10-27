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
  Loader2,
  Truck,
  Building2,
  FileSpreadsheet,
  X,
} from "@/src/components/icons";
import { cn } from "@/src/lib/utils";
import { BrandMark } from "@/src/components/ui/brand-mark";

const navigationGroups = [
  {
    group: "OVERVIEW",
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
    group: "MANAGEMENT",
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
  const [logoutBusy, setLogoutBusy] = useState(false);

  const handleLogout = async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLogoutBusy(false);
    }
  };

  useEffect(() => {
    if (!showLogoutConfirm || logoutBusy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLogoutConfirm, logoutBusy]);

  const isSidebarCollapsed = collapsed && !isMobile;

  return (
    <>
      <aside
        className={cn(
          "transition-all duration-300 ease-out bg-card/90 backdrop-blur-xs border-r border-border/70 flex flex-col z-20 h-full shrink-0 select-none",
          isSidebarCollapsed ? "w-[72px]" : "w-[236px]"
        )}
      >
        {/* Brand header */}
        <div
          className={cn(
            "h-[64px] flex items-center gap-3 px-4.5 shrink-0 overflow-hidden border-b border-border/60",
            isSidebarCollapsed && "justify-center px-0"
          )}
        >
          <BrandMark size={isSidebarCollapsed ? 34 : 36} />
          {!isSidebarCollapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-display font-semibold text-[15px] tracking-tight text-foreground truncate">
                MEDSATHI
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground truncate">
                Pharmacy OS
              </span>
            </div>
          )}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="ml-auto p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {navigationGroups.map((section, sectionIdx) => (
            <div key={sectionIdx} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/75 uppercase">
                  {section.group}
                </div>
              )}
              {section.routes.map((route) => {
                const isActive =
                  pathname === route.href ||
                  (route.href !== "/" && pathname.startsWith(`${route.href}/`));
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => {
                      if (isMobile && onClose) onClose();
                    }}
                    className={cn(
                      "relative w-full flex items-center gap-2.5 rounded-full text-[13.5px] font-medium transition-all duration-150 group select-none min-h-[42px]",
                      isSidebarCollapsed ? "px-0 justify-center" : "px-3 py-2",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    )}
                    title={isSidebarCollapsed ? route.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                        isActive
                          ? "bg-white/20 text-primary-foreground"
                          : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <route.icon
                        size={15}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="truncate">{route.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="p-3 shrink-0 border-t border-border/60 space-y-1">
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-full text-[12.5px] font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
                isSidebarCollapsed ? "justify-center py-2" : "px-3 py-2"
              )}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!collapsed && <span>Collapse Sidebar</span>}
            </button>
          )}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-full text-[12.5px] font-medium transition-colors text-[#C94A58] hover:bg-[#EDB2B7]/20",
              isSidebarCollapsed ? "justify-center py-2" : "px-3 py-2"
            )}
            title="Logout"
          >
            <LogOut size={16} strokeWidth={2.2} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Logout confirmation dialog */}
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
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "tween", ease: "easeOut", duration: 0.16 }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Confirm logout"
                  className="relative z-10 w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-pop text-card-foreground"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-full bg-[#EDB2B7]/30 text-[#C94A58] flex items-center justify-center shrink-0">
                      <LogOut size={18} strokeWidth={2.4} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold leading-tight text-foreground">
                        Sign Out
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        End your active pharmacy session
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
                    Are you sure you want to log out? Unsaved bill drafts in progress will remain in offline storage.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={logoutBusy}
                      onClick={() => setShowLogoutConfirm(false)}
                      className="btn btn-outline btn-sm px-4"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={logoutBusy}
                      onClick={handleLogout}
                      className="btn btn-danger btn-sm px-4 flex items-center gap-2"
                    >
                      {logoutBusy ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Signing out…</span>
                        </>
                      ) : (
                        <span>Yes, Sign Out</span>
                      )}
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, ChevronRight, Search } from "@/src/components/icons";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { BrandMark } from "@/src/components/ui/brand-mark";
import { cn } from "@/src/lib/utils";

const pageTitles: { match: string; title: string; crumb: string }[] = [
  { match: "/billing", title: "New Bill", crumb: "POS / Billing" },
  { match: "/inventory", title: "Stock Items", crumb: "Inventory" },
  { match: "/expiry", title: "Expiry Tracker", crumb: "Inventory" },
  { match: "/low-stock", title: "Low Stock Alerts", crumb: "Inventory" },
  { match: "/transactions", title: "Transactions", crumb: "Sales" },
  { match: "/patients", title: "Patients CRM", crumb: "Business" },
  { match: "/suppliers", title: "Suppliers", crumb: "Distributors" },
  { match: "/purchases/import", title: "Purchase Import", crumb: "Distributors" },
  { match: "/supplier-returns", title: "Supplier Returns", crumb: "Distributors" },
  { match: "/sales-report", title: "Sales Report", crumb: "Analytics" },
  { match: "/settings", title: "Settings", crumb: "System" },
  { match: "/", title: "Dashboard", crumb: "Overview" },
];

function usePageTitle() {
  const pathname = usePathname();
  const match = pageTitles.find((p) =>
    p.match === "/" ? pathname === "/" : pathname.startsWith(p.match)
  );
  return match ?? { title: "Medsathi", crumb: "Pharmacy" };
}

export interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const { title, crumb } = usePageTitle();

  return (
    <header className="shrink-0 z-30 bg-card/70 backdrop-blur-md border-b border-border/60">
      <div className="flex items-center justify-between px-4 md:px-6 h-[60px] gap-4">
        {/* Left: Mobile menu + Page breadcrumb & title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-foreground hover:bg-muted rounded-full transition-colors border border-border"
            aria-label="Open Navigation Menu"
          >
            <Menu size={18} strokeWidth={2.4} />
          </button>
          <div className="hidden sm:block lg:hidden">
            <BrandMark size={32} />
          </div>
          <div className="min-w-0">
            <div className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <span>{crumb}</span>
              <ChevronRight size={11} className="text-muted-foreground/60" />
            </div>
            <h1 className="font-display text-[16px] md:text-[18px] font-semibold tracking-tight text-foreground truncate leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Center: Search input as specified in Section 6.3 */}
        <div className="hidden xl:flex items-center flex-1 max-w-xs mx-auto">
          <div className="relative w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              strokeWidth={2}
            />
            <input
              type="text"
              placeholder="Search catalog, bills, patients…"
              className="w-full h-9 pl-9 pr-4 rounded-full border border-border bg-card/60 text-xs text-foreground placeholder:text-muted-foreground/75 focus:outline-none focus:border-[#397F7C] focus:ring-1 focus:ring-[#397F7C]/25 transition-all"
            />
          </div>
        </div>

        {/* Right: Actions, theme toggle, and profile */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/billing"
            className="btn btn-primary btn-sm hidden sm:inline-flex px-3.5 shadow-soft"
          >
            <Plus size={14} strokeWidth={2.6} />
            New Bill
          </Link>
          <ThemeToggle />
          <div className="flex items-center gap-2 pl-1 border-l border-border/60">
            <div className="w-8 h-8 rounded-full bg-[#D9E7E6] dark:bg-[#15383B] text-foreground font-semibold text-[11px] flex items-center justify-center border border-border shadow-xs select-none">
              MS
            </div>
            <div className="hidden 2xl:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-foreground">Pharmacist</span>
              <span className="text-[10px] text-muted-foreground">Main Store</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, ChevronRight } from "lucide-react";
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
  { match: "/sales-report", title: "Sales Report", crumb: "Business" },
  { match: "/settings", title: "Settings", crumb: "Business" },
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
    <header className="shrink-0 z-30 bg-card/85 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-foreground hover:bg-accent rounded-xl transition-colors border border-border"
            aria-label="Open Navigation Menu"
          >
            <Menu size={19} strokeWidth={2.4} />
          </button>
          <div className="hidden sm:block lg:hidden">
            <BrandMark size={34} />
          </div>
          <div className="min-w-0">
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
              <span>{crumb}</span>
              <ChevronRight size={12} className="text-muted-foreground/40" />
            </div>
            <h1 className="font-display text-[15px] md:text-[17px] font-extrabold tracking-tight text-foreground truncate leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: quick actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/billing"
            className={cn(
              "btn btn-primary btn-md hidden md:inline-flex"
            )}
          >
            <Plus size={16} strokeWidth={2.8} />
            New Bill
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

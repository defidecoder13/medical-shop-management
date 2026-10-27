"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPrintPage = pathname.startsWith("/print");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoginPage || isPrintPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#E4E6E5] dark:bg-[#031315] text-foreground font-sans p-0 xl:p-2.5 2xl:p-3.5 flex flex-col justify-center">
      <div className="flex h-screen xl:h-[calc(100vh-1.25rem)] 2xl:h-[calc(100vh-1.75rem)] w-full bg-background rounded-none xl:rounded-[36px] overflow-hidden border-0 xl:border xl:border-border/80 shadow-none xl:shadow-[0_8px_30px_rgba(6,44,47,0.05)]">
        {/* Desktop Sidebar (Left Panel) */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Drawer Navigation Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] lg:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", ease: "easeInOut", duration: 0.22 }}
                className="fixed inset-y-0 left-0 w-[260px] bg-card z-[110] lg:hidden shadow-2xl rounded-r-[32px] overflow-hidden"
              >
                <Sidebar isMobile={true} onClose={() => setMobileOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden w-full bg-background">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="page-glow min-h-full px-4 md:px-6 lg:px-7 py-5 md:py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
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
              className="fixed inset-0 bg-black z-[100] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.22 }}
              className="fixed inset-y-0 left-0 w-[272px] bg-card z-[110] lg:hidden shadow-2xl"
            >
              <Sidebar isMobile={true} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="page-glow min-h-full px-4 md:px-6 lg:px-7 py-6 md:py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

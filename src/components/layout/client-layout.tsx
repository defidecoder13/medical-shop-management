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
    <div className="flex h-screen bg-[#f8fafc] text-foreground font-sans overflow-hidden">
      {/* Desktop Sidebar (Left Panel) */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop Layer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-[100] lg:hidden"
            />
            {/* Slide-out Sidebar Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.25 }}
              className="fixed inset-y-0 left-0 w-[240px] bg-white z-[110] lg:hidden shadow-2xl"
            >
              <Sidebar isMobile={true} onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

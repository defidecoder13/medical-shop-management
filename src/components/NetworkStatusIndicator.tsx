"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useNetwork } from "@/src/hooks/useNetwork";
import { useEffect, useState } from "react";

export function NetworkStatusIndicator() {
  const { isOnline } = useNetwork();
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowOnline(true);
      const timer = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showOnline) return null;

  return (
    <div className={`no-print print:hidden fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300 font-semibold text-sm ${isOnline ? "bg-emerald-500 text-white" : "bg-red-500 text-white animate-pulse"}`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Back Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>You are offline</span>
        </>
      )}
    </div>
  );
}

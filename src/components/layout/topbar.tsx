
"use client";

import { 
  Search, 
  Bell, 
  BellOff, 
  HelpCircle, 
  AlertOctagon, 
  ArrowRight, 
  Package, 
  Clock, 
  Check, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Trash2,
  AlertTriangle,
  Menu
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDebounce } from "@/src/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { apiClient } from "@/src/lib/apiClient";

export interface AppNotification {
  id: string;
  type: 'low_stock' | 'near_expiry' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState<any>({ lowStock: 0, expiring: 0 });
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Persistent Smart Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isMuted, setIsMuted] = useState(false); // Global mute setting
  const [mutedTypes, setMutedTypes] = useState<string[]>([]); // Category-level mute

  // 1. Initial State Loading & Seeding
  useEffect(() => {
    // Notifications list
    const stored = localStorage.getItem("medisathi_notifications");
    if (stored) {
      setNotifications(JSON.parse(stored));
    } else {
      // Seed high-fidelity sample alerts on first-time usage
      const now = Date.now();
      const initial: AppNotification[] = [
        {
          id: `low-stock-seed-${now}`,
          type: 'low_stock',
          title: 'Inventory Alert: Low Stock',
          message: 'Dolo 650 & Paracetamol batches in Rack A1 are running critical (below 10 units threshold).',
          timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
          read: false
        },
        {
          id: `expiry-seed-${now}`,
          type: 'near_expiry',
          title: 'Clinical Notice: Near Expiry',
          message: 'Amoxicillin capsules in Rack B2 are expiring within the next 30 days.',
          timestamp: now - 6 * 60 * 60 * 1000, // 6 hours ago
          read: true
        }
      ];
      localStorage.setItem("medisathi_notifications", JSON.stringify(initial));
      setNotifications(initial);
    }

    // Muted configurations
    const globalMuted = localStorage.getItem("medisathi_notifications_muted");
    if (globalMuted === "true") setIsMuted(true);

    const categoryMuted = localStorage.getItem("medisathi_muted_types");
    if (categoryMuted) setMutedTypes(JSON.parse(categoryMuted));
  }, []);

  // 2. Fetch Stats for Alert Generation
  useEffect(() => {
    apiClient.get('/api/dashboard-analytics').then(data => {
      if (data && data.stats) {
        setStats(data.stats);
      }
    });
  }, []);

  // 3. Automatic 12-Hour Cycle Alert Checks
  useEffect(() => {
    if (!stats || (stats.lowStock === 0 && stats.expiring === 0)) return;

    const run12HourIntervalCheck = () => {
      const now = Date.now();
      const lastCheck = localStorage.getItem("medisathi_last_alert_check");
      const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0;
      
      const twelveHoursMs = 12 * 60 * 60 * 1000;
      
      // Execute alert sync only if 12 hours have elapsed (or no check exists)
      if (now - lastCheckTime >= twelveHoursMs || lastCheckTime === 0) {
        const stored = localStorage.getItem("medisathi_notifications");
        let currentList: AppNotification[] = stored ? JSON.parse(stored) : [];
        let created = false;

        // Low stock generation (if not muted)
        if (stats.lowStock > 0 && !mutedTypes.includes('low_stock')) {
          const duplicate = currentList.slice(0, 3).some(n => n.type === 'low_stock' && (now - n.timestamp < twelveHoursMs));
          if (!duplicate) {
            currentList.unshift({
              id: `low-stock-${now}`,
              type: 'low_stock',
              title: 'Critical Inventory Alert',
              message: `There are currently ${stats.lowStock} therapeutic items running low on stock.`,
              timestamp: now,
              read: false
            });
            created = true;
          }
        }

        // Near expiry generation (if not muted)
        if (stats.expiring > 0 && !mutedTypes.includes('near_expiry')) {
          const duplicate = currentList.slice(0, 3).some(n => n.type === 'near_expiry' && (now - n.timestamp < twelveHoursMs));
          if (!duplicate) {
            currentList.unshift({
              id: `near-expiry-${now}`,
              type: 'near_expiry',
              title: 'Clinical Expiry Alert',
              message: `${stats.expiring} inventory batches are reaching expiration in under 30 days.`,
              timestamp: now,
              read: false
            });
            created = true;
          }
        }

        if (created) {
          const capped = currentList.slice(0, 30);
          localStorage.setItem("medisathi_notifications", JSON.stringify(capped));
          localStorage.setItem("medisathi_last_alert_check", now.toString());
          setNotifications(capped);
        }
      }
    };

    run12HourIntervalCheck();
  }, [stats, mutedTypes]);

  useEffect(() => {
    if (debouncedSearchQuery.length > 1) {
      fetch(`/api/inventory?q=${debouncedSearchQuery}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setShowResults(true);
        })
        .catch(err => console.error(err));
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-group') && !target.closest('.notification-group')) {
        setShowResults(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to format time ago
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Toggle single notification read status
  const toggleRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: !n.read } : n);
    setNotifications(updated);
    localStorage.setItem("medisathi_notifications", JSON.stringify(updated));
  };

  // Toggle global mute
  const toggleGlobalMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("medisathi_notifications_muted", next ? "true" : "false");
  };

  // Toggle category mute
  const toggleCategoryMute = (type: string) => {
    let next: string[];
    if (mutedTypes.includes(type)) {
      next = mutedTypes.filter(t => t !== type);
    } else {
      next = [...mutedTypes, type];
    }
    setMutedTypes(next);
    localStorage.setItem("medisathi_muted_types", JSON.stringify(next));
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("medisathi_notifications", JSON.stringify(updated));
  };

  // Delete notification
  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("medisathi_notifications", JSON.stringify(updated));
  };

  // Simulate 12-hour sync instantly (developer trigger)
  const handleSimulate12Hour = () => {
    const now = Date.now();
    const currentList = [...notifications];

    const lowStockCount = stats.lowStock || 3;
    const expiringCount = stats.expiring || 2;

    currentList.unshift({
      id: `low-stock-sim-${now}`,
      type: 'low_stock',
      title: 'Sync Alert: Low Stock',
      message: `${lowStockCount} items require immediate procurement restocking.`,
      timestamp: now,
      read: false
    });

    currentList.unshift({
      id: `expiry-sim-${now}`,
      type: 'near_expiry',
      title: 'Sync Alert: Expiry Warning',
      message: `${expiringCount} therapeutic items are reaching critical expiration bounds.`,
      timestamp: now - 5000,
      read: false
    });

    const capped = currentList.slice(0, 30);
    localStorage.setItem("medisathi_notifications", JSON.stringify(capped));
    localStorage.setItem("medisathi_last_alert_check", now.toString());
    setNotifications(capped);
  };

  const unreadCount = notifications.filter(n => !n.read && !mutedTypes.includes(n.type)).length;
  const activeUnreadCount = isMuted ? 0 : unreadCount;

  const handleSelectMedicine = (id: string) => {
    setSearchQuery("");
    setShowResults(false);
    router.push(`/billing?add=${id}`);
  };
  
  const getPageTitle = (path: string) => {
    if (path === "/") return "Dashboard";
    const segment = path.split("/")[1];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ") : "Dashboard";
  };

  const isDashboard = pathname === "/";

  return (
    <div className="h-[88px] flex items-center justify-between px-4 md:px-8 bg-[#f8fafc] z-50 shrink-0 border-b border-gray-50">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 text-[#11327c] hover:bg-white rounded-xl transition-colors shrink-0 shadow-sm border border-gray-100/50 bg-white"
          >
            <Menu size={20} strokeWidth={2.5} />
          </button>
        )}
        <div className="flex flex-col">
          <h2 className="text-[20px] md:text-[26px] font-bold text-[#11327c] tracking-tight leading-tight">
            {getPageTitle(pathname)}
          </h2>
          {isDashboard && (
            <p className="text-[13px] text-gray-500 font-medium hidden md:block">
              Welcome back, Admin! Here's what's happening in your pharmacy today.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex relative search-group">
          <Search className="absolute left-4 top-[11px] text-gray-400" strokeWidth={2} size={18} />
          <input 
            type="text" 
            placeholder="Search medicines, invoices, customers..." 
            className="pl-11 pr-4 py-2.5 w-[320px] bg-white border border-gray-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[#11327c]/20 focus:border-[#11327c] transition-all text-gray-800 placeholder:text-gray-400 font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchResults.length > 0) setShowResults(true); }}
          />
          
          <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 max-h-80 overflow-y-auto"
            >
              <div className="p-2">
                {searchResults.map((med, index) => (
                  <motion.button
                    key={med._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectMedicine(med._id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#f8fafc] rounded-xl text-left transition-colors"
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{med.name}</div>
                      {med.composition && (
                        <div className="text-[11px] text-gray-500 truncate">{med.composition}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium text-gray-500">Stock: <span className={med.stock < 10 ? 'text-red-500' : 'text-green-600'}>{med.stock}</span></div>
                      <div className="text-[11px] font-medium text-gray-500">₹{med.mrp.toFixed(2)}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="relative notification-group">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "relative text-[#11327c] hover:bg-white p-2 rounded-full transition-colors",
                showNotifications && "bg-white shadow-sm"
              )}
            >
              {isMuted ? <BellOff size={20} strokeWidth={2} /> : <Bell size={20} strokeWidth={2} />}
              {activeUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full text-[9px] font-black w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {activeUnreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-[380px] bg-white border border-gray-100 rounded-3xl shadow-[0_25px_60px_-15px_rgba(17,50,124,0.18)] z-[60] overflow-hidden"
                >
                  <div className="p-5 border-b border-gray-50 bg-[#f8fafc]/50">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-black text-[#11327c] uppercase tracking-wider">System Alerts</h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md font-black text-[9px] uppercase tracking-wider">
                              {unreadCount} New
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Sync / Dev Simulation trigger */}
                          <button
                            onClick={handleSimulate12Hour}
                            title="Simulate 12-Hour Cycle Sync"
                            className="p-2 bg-indigo-50 text-[#11327c] hover:bg-[#11327c] hover:text-white rounded-xl transition-all"
                          >
                            <Sparkles size={14} />
                          </button>

                          {/* Global mute */}
                          <button
                            onClick={toggleGlobalMute}
                            title={isMuted ? "Unmute Alerts" : "Mute Alerts"}
                            className={`p-2 rounded-xl transition-all ${
                              isMuted 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-50 shadow-sm">
                        <button
                          onClick={handleMarkAllRead}
                          disabled={notifications.length === 0}
                          className="text-[10px] font-black text-[#11327c] uppercase tracking-wider hover:underline disabled:opacity-30"
                        >
                          Mark all read
                        </button>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={11} /> 12h Engine
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 max-h-[380px] overflow-y-auto space-y-2.5">
                    {notifications.length > 0 ? (
                      notifications.map((n) => {
                        const isTypeMuted = mutedTypes.includes(n.type);
                        return (
                          <div 
                            key={n.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                              n.read 
                              ? 'bg-white border-gray-100 opacity-60' 
                              : n.type === 'low_stock'
                              ? 'bg-rose-50/40 border-rose-100/60 shadow-sm shadow-rose-50'
                              : 'bg-amber-50/40 border-amber-100/60 shadow-sm shadow-amber-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                n.type === 'low_stock' 
                                ? 'bg-rose-100 text-rose-600' 
                                : 'bg-amber-100 text-amber-600'
                              }`}>
                                {n.type === 'low_stock' ? <Package size={16} /> : <Clock size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[12px] font-black text-[#11327c] uppercase tracking-tight truncate">
                                    {n.title}
                                  </p>
                                  {isTypeMuted && (
                                    <span className="text-[8px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                      Muted
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11.5px] text-gray-600 font-bold leading-normal mt-1">
                                  {n.message}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-gray-50/60 pt-2.5 mt-0.5">
                              <span className="text-[9px] font-bold text-gray-400">
                                {formatTimeAgo(n.timestamp)}
                              </span>

                              <div className="flex items-center gap-1">
                                {/* Toggle Read */}
                                <button
                                  onClick={() => toggleRead(n.id)}
                                  title={n.read ? "Mark Unread" : "Mark Read"}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    n.read 
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:text-[#11327c] hover:border-gray-300'
                                  }`}
                                >
                                  <Check size={12} strokeWidth={3} />
                                </button>

                                {/* Toggle Mute for this Category */}
                                <button
                                  onClick={() => toggleCategoryMute(n.type)}
                                  title={isTypeMuted ? "Unmute this alert category" : "Mute this alert category"}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    isTypeMuted 
                                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                    : 'bg-white border-gray-200 text-gray-400 hover:text-[#11327c] hover:border-gray-300'
                                  }`}
                                >
                                  {isTypeMuted ? <BellOff size={12} /> : <Bell size={12} />}
                                </button>

                                {/* Dismiss Notification */}
                                <button
                                  onClick={() => handleDeleteNotification(n.id)}
                                  title="Dismiss Alert"
                                  className="p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-rose-600 hover:border-rose-100 rounded-lg transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                        <AlertTriangle className="w-8 h-8 text-gray-300 mb-3" />
                        <h4 className="text-[12px] font-black text-[#11327c] uppercase tracking-wider">Operational Calm</h4>
                        <p className="text-[11px] text-gray-400 font-bold mt-1 max-w-[200px]">No alerts triggered. Restocking cycles are completely healthy.</p>
                      </div>
                    )}
                  </div>

                  {isMuted && (
                    <div className="bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider py-2.5 px-4 text-center border-t border-rose-100 flex items-center justify-center gap-2">
                      <VolumeX size={12} />
                      Global Mute Active: Badges Suspended
                    </div>
                  )}

                  <Link 
                    href="/low-stock" 
                    onClick={() => setShowNotifications(false)}
                    className="block w-full py-4 bg-[#f8fafc] hover:bg-[#11327c] hover:text-white text-center text-[11px] font-black uppercase tracking-widest text-[#11327c] transition-all border-t border-gray-100"
                  >
                    View Operational Manager
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

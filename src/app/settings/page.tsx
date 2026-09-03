"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Store, 
  MapPin, 
  Receipt, 
  Percent, 
  Save, 
  ShieldCheck, 
  Info, 
  CheckCircle2,
  AlertCircle,
  GanttChartSquare,
  Sparkles,
  Loader2,
  Lock,
  Globe,
  Database
} from "@/src/components/icons";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";

type SettingsData = {
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  dlNumber?: string;
  pharmacistName?: string;
  gstEnabled: boolean;
  gstNumber?: string | null;
  defaultGstPercent: number;
};

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
  }, [router]);

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    apiClient.get("/api/settings")
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await apiClient.put("/api/settings", settings);
      setMessage({ text: "Configurations synchronized successfully", type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ text: "System error during update", type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-primary mb-4" size={40} strokeWidth={1.5} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Loading Registry...</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-5 pb-10 max-w-[1000px] mx-auto">
      {/* Header Section */}
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        <AnimatePresence>
          {message && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className={`px-5 py-3 rounded-xl flex items-center gap-3 border shadow-card animate-fade-in ${
                 message.type === 'success' 
                   ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50' 
                   : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50'
               }`}
             >
               {message.type === 'success' ? <CheckCircle2 size={16} strokeWidth={2.6} /> : <AlertCircle size={16} strokeWidth={2.6} />}
               <span className="text-[10px] font-bold uppercase tracking-widest">{message.text}</span>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-8">
         
         {/* Establishment Section */}
         <div className="surface-card p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <Store size={220} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-4 relative z-10">
               <div className="w-9 h-9 bg-muted text-muted-foreground rounded-lg flex items-center justify-center">
                  <Store size={18} strokeWidth={2} />
               </div>
               <h2 className="text-[14px] font-semibold text-foreground">Pharmacy Details</h2>
            </div>

            <div className="space-y-8 max-w-2xl relative z-10">
               <div className="space-y-2">
                  <label className="label">Pharmacy Name</label>
                  <div className="relative group">
                     <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <input
                        className="input pl-11"
                        value={settings.shopName}
                        onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="label">Physical Location</label>
                  <div className="relative group">
                     <MapPin className="absolute left-5 top-5 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <textarea
                        rows={3}
                        className="input h-auto py-3 pl-11 resize-none"
                        value={settings.address || ""}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="label">Contact Phone</label>
                     <div className="relative group">
                        <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                        <input
                           placeholder="Phone Number"
                           className="input pl-11"
                           value={settings.phone || ""}
                           onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="label">Email Address</label>
                     <div className="relative group">
                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                        <input
                           placeholder="lowercase@email.com"
                           className="input pl-11 lowercase"
                           value={settings.email || ""}
                           onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                      <label className="label">Drug License (DL.NO)</label>
                      <div className="relative group">
                         <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                         <input
                            placeholder="D.L. Number"
                            className="input pl-11 uppercase"
                            value={settings.dlNumber || ""}
                            onChange={(e) => setSettings({ ...settings, dlNumber: e.target.value })}
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="label">Reg. Pharmacist</label>
                      <div className="relative group">
                         <Info className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                         <input
                            placeholder="Full Name"
                            className="input pl-11"
                            value={settings.pharmacistName || ""}
                            onChange={(e) => setSettings({ ...settings, pharmacistName: e.target.value })}
                         />
                      </div>
                   </div>
               </div>
            </div>
         </div>

         {/* Fiscal Section */}
         <div className="surface-card p-6 md:p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
               <Receipt size={200} strokeWidth={1} />
            </div>               <div className="flex items-center justify-between mb-6 border-b border-border pb-4 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted text-muted-foreground rounded-lg flex items-center justify-center">
                     <Receipt size={18} strokeWidth={2} />
                  </div>
                  <h2 className="text-[14px] font-semibold text-foreground">Tax Settings</h2>
               </div>
               
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                     type="checkbox" 
                     className="sr-only peer"
                     checked={settings.gstEnabled}
                     onChange={(e) => setSettings({ ...settings, gstEnabled: e.target.checked })}
                  />
                  <div className="w-16 h-8 bg-gray-100 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-7 after:transition-all peer-checked:bg-[#11327c] shadow-inner"></div>
                  <span className="ml-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">GST Protocol</span>
               </label>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl relative z-10 transition-all duration-500 ${settings.gstEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
               <div className="space-y-2">
                  <label className="label">GSTIN Identification</label>
                  <div className="relative group">
                     <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <input
                        placeholder="TRX Registry Code"
                        className="input pl-11 font-mono uppercase"
                        value={settings.gstNumber || ""}
                        onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="label">Default Tax Slab (%)</label>
                  <div className="relative group">
                     <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <input
                        type="number"
                        className="input pl-11"
                        value={settings.defaultGstPercent}
                        onChange={(e) => setSettings({ ...settings, defaultGstPercent: Number(e.target.value) })}
                     />
                  </div>
               </div>
               
               {!settings.gstEnabled && (
                  <div className="col-span-full flex items-center gap-4 p-5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                     <Lock className="w-5 h-5 text-amber-500" strokeWidth={2.5} />
                     <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold uppercase tracking-tight">Fiscal parameters are locked. Activate GST Protocol to modify these fields.</p>
                  </div>
               )}
            </div>
         </div>

          {/* Commit Action Bar */}
         <div className="surface-card p-4 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-3 text-muted-foreground">
               <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center">
                 <Database size={16} strokeWidth={2} />
               </div>
               <div>
                 <div className="text-[13px] font-medium text-foreground">Save changes</div>
                 <div className="text-[11px] text-muted-foreground">Updates apply to invoices and catalog</div>
               </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary btn-md ml-auto"
            >
              {saving ? (
                 <>
                    <Loader2 className="animate-spin" size={16} strokeWidth={2} />
                    Saving...
                 </>
              ) : (
                 <>
                    <Save size={16} strokeWidth={2} />
                    Save Settings
                 </>
              )}
            </button>
         </div>

         <div className="text-center pt-8 pb-12 opacity-30">
            <div className="flex items-center justify-center gap-3 text-[10px] font-black text-[#11327c] uppercase tracking-[0.3em]">
               <Sparkles size={14} className="text-orange-500" />
               MedSathi Core Intelligence v1.2.0
            </div>
         </div>
      </div>
    </div>
  );
}
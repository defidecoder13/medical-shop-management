"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
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
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";

type SettingsData = {
  shopName: string;
  address?: string;
  phone?: string;
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
      <div className="flex flex-col items-center justify-center h-[60vh] opacity-20">
        <Loader2 className="animate-spin text-[#11327c] mb-4" size={48} strokeWidth={1.5} />
        <p className="text-[10px] font-black uppercase tracking-widest text-[#11327c]">Loading Registry...</p>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8 pb-12 max-w-[1000px] mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Link 
            href="/"
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-gray-100 text-gray-400 hover:text-[#11327c] transition-all shadow-sm group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-[28px] font-black text-[#11327c] tracking-tight uppercase">Control Center</h1>
            <p className="text-[13px] text-gray-500 font-medium">Configure core registry parameters and medical establishment identity.</p>
          </div>
        </div>
        
        <AnimatePresence>
          {message && (
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className={`px-5 py-3 rounded-2xl flex items-center gap-3 border shadow-lg ${
                 message.type === 'success' 
                   ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                   : 'bg-rose-50 text-rose-800 border-rose-100'
               }`}
             >
               {message.type === 'success' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertCircle size={16} strokeWidth={3} />}
               <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-8">
         
         {/* Establishment Section */}
         <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <Store size={240} strokeWidth={1} />
            </div>
            
            <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6 relative z-10">
               <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[#11327c]">
                  <Store size={24} strokeWidth={2.5} />
               </div>
               <h2 className="text-[18px] font-black text-[#11327c] uppercase tracking-widest">Medical Establishment</h2>
            </div>

            <div className="space-y-8 max-w-2xl relative z-10">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pharmacy Name</label>
                  <div className="relative group">
                     <Store className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <input
                        className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-4 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-[14px] font-black text-[#11327c] placeholder:text-gray-300"
                        value={settings.shopName}
                        onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Physical Location</label>
                  <div className="relative group">
                     <MapPin className="absolute left-5 top-5 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <textarea
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-4 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-[14px] font-bold text-[#11327c] placeholder:text-gray-300 resize-none"
                        value={settings.address || ""}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Drug License (DL.NO)</label>
                      <div className="relative group">
                         <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                         <input
                            placeholder="D.L. Number"
                            className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-4 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-[14px] font-black text-[#11327c] uppercase tracking-widest placeholder:text-gray-300"
                            value={settings.dlNumber || ""}
                            onChange={(e) => setSettings({ ...settings, dlNumber: e.target.value })}
                         />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reg. Pharmacist</label>
                      <div className="relative group">
                         <Info className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                         <input
                            placeholder="Full Name"
                            className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-4 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-[14px] font-black text-[#11327c] placeholder:text-gray-300"
                            value={settings.pharmacistName || ""}
                            onChange={(e) => setSettings({ ...settings, pharmacistName: e.target.value })}
                         />
                      </div>
                   </div>
               </div>
            </div>
         </div>

         {/* Fiscal Section */}
         <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <Receipt size={240} strokeWidth={1} />
            </div>

            <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                     <Receipt size={24} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-[18px] font-black text-[#11327c] uppercase tracking-widest">Fiscal Protocol</h2>
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
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GSTIN Identification</label>
                  <div className="relative group">
                     <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <input
                        placeholder="TRX Registry Code"
                        className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-4 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-[14px] font-mono font-black text-[#11327c] uppercase tracking-widest placeholder:text-gray-300"
                        value={settings.gstNumber || ""}
                        onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Tax Slab (%)</label>
                  <div className="relative group">
                     <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#11327c] transition-colors" />
                     <input
                        type="number"
                        className="w-full bg-gray-50 border border-gray-100 pl-14 pr-6 py-4 rounded-[20px] focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-[14px] font-black text-[#11327c] placeholder:text-gray-300"
                        value={settings.defaultGstPercent}
                        onChange={(e) => setSettings({ ...settings, defaultGstPercent: Number(e.target.value) })}
                     />
                  </div>
               </div>
               
               {!settings.gstEnabled && (
                  <div className="col-span-full flex items-center gap-4 p-5 bg-orange-50 rounded-[20px] border border-orange-100">
                     <Lock className="w-5 h-5 text-orange-500" strokeWidth={2.5} />
                     <p className="text-[11px] text-orange-800 font-bold uppercase tracking-tight">Fiscal parameters are locked. Activate GST Protocol to modify these fields.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Commit Action Bar */}
         <div className="bg-[#11327c] p-6 rounded-[32px] shadow-2xl shadow-[#11327c]/30 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-5 text-white/50">
               <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white/80">
                 <Database size={20} strokeWidth={2.5} />
               </div>
               <div>
                 <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Registry Synchronizer</div>
                 <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">Ready to commit system-wide changes</div>
               </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 group ${
                saving 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20'
              }`}
            >
              {saving ? (
                 <>
                    <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                    Syncing Registry...
                 </>
              ) : (
                 <>
                    <CheckCircle2 size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                    Synchronize Config
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
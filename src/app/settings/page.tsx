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
  Sparkles
} from "lucide-react";
import Link from "next/link";

type SettingsData = {
  shopName: string;
  address?: string;
  gstEnabled: boolean;
  gstNumber?: string | null;
  defaultGstPercent: number;
};

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage({ text: "Configurations synchronized successfully", type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: "Failed to update configuration", type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      setMessage({ text: "System error during update", type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-8 animate-pulse text-center">
           <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-48 mx-auto"></div>
           <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
       <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Settings className="text-slate-600 w-8 h-8" />
                Control Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Configure system-wide parameters and shop identity</p>
            </div>
          </div>
          
          {message && (
             <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${
               message.type === 'success' 
                 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' 
                 : 'bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30'
             }`}>
               {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
               <span className="text-xs font-bold uppercase tracking-tight">{message.text}</span>
             </div>
          )}
        </div>

        {/* Settings Groups */}
        <div className="space-y-6">
           
           {/* Section: Shop Profile */}
           <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                 <Store className="w-32 h-32" />
              </div>
              
              <div className="flex items-center gap-3 mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                 <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-slate-600" />
                 </div>
                 <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Shop Identity</h2>
              </div>

              <div className="space-y-6 max-w-xl">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Establishment Name</label>
                    <div className="relative">
                       <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input
                          className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-bold"
                          value={settings.shopName}
                          onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational Address</label>
                    <div className="relative">
                       <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                       <textarea
                          rows={3}
                          className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-sm"
                          value={settings.address || ""}
                          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Section: Fiscal & GST */}
           <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                 <Receipt className="w-32 h-32" />
              </div>

              <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center">
                       <Receipt className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Fiscal Configuration</h2>
                 </div>
                 
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={settings.gstEnabled}
                       onChange={(e) => setSettings({ ...settings, gstEnabled: e.target.checked })}
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600 shadow-sm"></div>
                    <span className="ml-3 text-[10px] font-black uppercase text-gray-500 tracking-widest">Active</span>
                 </label>
              </div>

              <div className={`space-y-6 max-w-xl transition-all duration-500 ${settings.gstEnabled ? 'opacity-100 scale-100 h-auto' : 'opacity-20 pointer-events-none scale-[0.98] h-auto'}`}>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">GST Identification (GSTIN)</label>
                       <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                             placeholder="22AAAAA0000A1Z5"
                             className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono font-bold"
                             value={settings.gstNumber || ""}
                             onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Universal Tax Slab (%)</label>
                       <div className="relative">
                          <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                             type="number"
                             className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-black"
                             value={settings.defaultGstPercent}
                             onChange={(e) => setSettings({ ...settings, defaultGstPercent: Number(e.target.value) })}
                          />
                       </div>
                    </div>
                 </div>
                 
                 {!settings.gstEnabled && (
                    <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                       <Info className="w-5 h-5 text-orange-500 flex-shrink-0" />
                       <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">GST fields are locked because tax calculation is disabled. Toggle "Active" to unlock.</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Save Button Terminal */}
           <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl shadow-2xl animate-in zoom-in duration-500">
              <div className="flex items-center gap-4 text-white/50">
                 <GanttChartSquare className="w-5 h-5" />
                 <div className="text-[10px] font-black uppercase tracking-[0.2em]">Ready to commit changes</div>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-3 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${
                  saving 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-white text-slate-900 hover:bg-indigo-50 hover:text-indigo-600 shadow-xl'
                }`}
              >
                {saving ? (
                   <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                   </span>
                ) : (
                   <>
                      <Save className="w-4 h-4" />
                      Sync Registry
                   </>
                )}
              </button>
           </div>
        </div>

        {/* Footer Polish */}
        <div className="text-center py-8">
           <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-50">
              <Sparkles className="w-3 h-3" />
              MediShop Core Engine v1.0.4 Premium
           </div>
        </div>

       </div>
    </div>
  );
}
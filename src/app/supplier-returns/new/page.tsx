"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Calculator, 
  AlertCircle, 
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowLeft,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/src/components/ui/separator";
import { useDebounce } from "@/src/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";

type Medicine = {
  _id: string;
  name: string;
  batchNumber: string;
  stock: number;
  buyingPricePerStrip: number;
  tabletsPerStrip: number;
  expiryDate: string;
  rackNumber: string;
  composition?: string;
};

type CartItem = {
  medicineId: string;
  name: string;
  batchNumber: string;
  stripQty: number;
  tabletQty: number;
  stripBuyingPrice: number;
  tabletBuyingPrice: number;
  stock: number;
  rackNumber: string;
};

export default function NewSupplierReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReturnContent />
    </Suspense>
  );
}

function ReturnContent() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [supplierName, setSupplierName] = useState("");
  const [reason, setReason] = useState("Expired");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiClient.get('/api/auth/check');
        if (!data) router.push('/login');
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!debouncedSearch) {
      setMedicines([]);
      return;
    }
    apiClient.get(`/api/inventory?q=${debouncedSearch}`)
      .then(setMedicines)
      .catch((err) => console.error(err));
  }, [debouncedSearch]);

  useEffect(() => {
    const calculatedTotal = cart.reduce((sum, item) => {
      const stripTotal = item.stripBuyingPrice * item.stripQty;
      const tabletTotal = item.tabletBuyingPrice * item.tabletQty;
      return sum + stripTotal + tabletTotal;
    }, 0);
    
    setGrandTotal(Math.round(calculatedTotal * 100) / 100);
  }, [cart]);

  const addToCart = (med: Medicine) => {
    if (cart.find((c) => c.medicineId === med._id)) {
      setMessage({ text: `${med.name} is already in the list`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const buyingPrice = med.buyingPricePerStrip || 0;
    const tabletsPerStrip = med.tabletsPerStrip || 1;
    
    const tabletPrice = buyingPrice > 0 
      ? Number((buyingPrice / tabletsPerStrip).toFixed(2)) 
      : 0;

    setCart([
      ...cart,
      {
        medicineId: med._id,
        name: med.name,
        batchNumber: med.batchNumber,
        stripQty: 0,
        tabletQty: 0,
        stripBuyingPrice: buyingPrice,
        tabletBuyingPrice: tabletPrice,
        stock: med.stock,
        rackNumber: med.rackNumber || "",
      },
    ]);
    setSearch("");
  };

  const updateItem = (id: string, field: keyof CartItem, value: any) => {
    setCart(cart.map((item) => item.medicineId === id ? { ...item, [field]: value } : item));
  };
  
  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.medicineId !== id));
  };

  const submitReturn = async () => {
    if (cart.length === 0) return;
    if (!supplierName.trim()) {
        setMessage({text: "Supplier Name is required", type: "error"});
        setTimeout(() => setMessage(null), 3000);
        return;
    }

    if (
      cart.some(
        (i) => (i.stripQty > 0 || i.tabletQty > 0) ? false : true
      )
    ) {
      setMessage({text: "Enter valid quantity for all items", type: "error"});
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        supplierName,
        reason,
        items: cart.flatMap((c) => {
          const items = [];
          if (c.stripQty > 0) {
            items.push({
              medicineId: c.medicineId,
              name: c.name,
              batchNumber: c.batchNumber,
              unitType: 'strip',
              qty: c.stripQty,
            });
          }
          if (c.tabletQty > 0) {
            items.push({
              medicineId: c.medicineId,
              name: c.name,
              batchNumber: c.batchNumber,
              unitType: 'tablet',
              qty: c.tabletQty,
            });
          }
          return items;
        })
      };

      await apiClient.post("/api/supplier-returns", payload);

      setLoading(false);
      setMessage({text: "Debit note generated successfully", type: "success"});
      
      setTimeout(() => {
          router.push('/supplier-returns');
      }, 1500);

    } catch (err: any) {
      setLoading(false);
      setMessage({text: err.message || "An unexpected error occurred", type: "error"});
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 max-w-[1400px] mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/supplier-returns" className="inline-flex items-center text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#11327c] mb-3 transition-all group">
            <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
            Back to Ledger
          </Link>
          <h2 className="text-[28px] font-black text-[#11327c] tracking-tight">New Supplier Return</h2>
          <p className="text-[13px] text-gray-500 font-medium">Draft a debit note against inventory outflows.</p>
        </div>
        
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`px-5 py-3 rounded-2xl flex items-center gap-3 text-[13px] font-black uppercase tracking-wider shadow-sm border ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <XCircle size={18} strokeWidth={2.5} />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0">
        
        {/* Left Column: Search & Items */}
        <div className="lg:col-span-8 flex flex-col gap-8 min-h-0">
          
          {/* Search Area */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] relative">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <Search size={14} className="text-[#11327c]" strokeWidth={3} />
              Find Inventory to Return
            </h2>
            <div className="relative group">
              <input
                className="w-full bg-gray-50 border border-gray-200 pl-12 pr-6 py-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 focus:bg-white transition-all text-gray-800 font-bold placeholder:text-gray-400 text-sm"
                placeholder="Search by medicine name, brand or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#11327c] w-5 h-5 transition-colors" strokeWidth={2.5} />
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
              {medicines.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-30 max-h-80 overflow-y-auto p-2"
                >
                  {medicines.map((med, index) => (
                    <button
                      key={med._id}
                      onClick={() => addToCart(med)}
                      className="w-full flex justify-between items-center p-4 hover:bg-[#f8fafc] text-left transition-all rounded-2xl group/btn mb-1 last:mb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover/btn:bg-white transition-colors">
                          <Package className="w-5 h-5 text-[#11327c]/40 group-hover/btn:text-[#11327c]" strokeWidth={2} />
                        </div>
                        <div>
                          <div className="font-black text-[#11327c] uppercase text-[13px] tracking-tight">{med.name}</div>
                          <div className="text-[10px] text-gray-400 font-bold flex gap-3 mt-1 uppercase tracking-wider">
                            <span>BATCH: <span className="text-[#11327c]/60">{med.batchNumber}</span></span>
                            <span>STOCK: <span className="text-orange-600">{med.stock}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center bg-[#11327c] text-white rounded-lg opacity-0 group-hover/btn:opacity-100 transition-all transform translate-x-2 group-hover/btn:translate-x-0">
                        <Plus size={16} strokeWidth={3} />
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Area */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_30px_80px_-20px_rgba(17,50,124,0.12)] flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-[#f8fafc]/50">
              <h2 className="text-[16px] font-black text-[#11327c] uppercase tracking-widest flex items-center gap-3">
                <Truck size={20} className="text-orange-500" strokeWidth={2.5} />
                Return Draft Items 
                <span className="bg-white px-2 py-0.5 rounded-lg border border-gray-100 text-[10px] font-black text-gray-400 ml-2">{cart.length}</span>
              </h2>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 px-3 py-1.5 hover:bg-rose-50 rounded-xl"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 opacity-40">
                    <Package size={40} className="text-gray-400" strokeWidth={1} />
                  </div>
                  <p className="text-[#11327c] font-black text-sm uppercase tracking-widest opacity-30">Draft is empty</p>
                  <p className="text-gray-400 font-medium text-xs mt-2">Search inventory items to build your return note</p>
                </div>
              ) : (
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div 
                      key={item.medicineId} 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative p-6 rounded-3xl border border-gray-100 bg-white hover:border-[#11327c]/20 transition-all shadow-sm hover:shadow-[0_10px_30px_-10px_rgba(17,50,124,0.1)] flex flex-col gap-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#f8fafc] rounded-2xl flex items-center justify-center text-[#11327c]">
                            <Package size={24} strokeWidth={2} />
                          </div>
                          <div>
                            <div className="font-black text-[#11327c] uppercase text-[15px] tracking-tight">{item.name}</div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
                              <span>BATCH: <span className="text-[#11327c]/60">{item.batchNumber}</span></span>
                              <div className="w-1 h-1 rounded-full bg-gray-200" />
                              <span>STOCK: <span className="text-orange-600">{item.stock}</span></span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.medicineId)}
                          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                          title="Remove Item"
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Strip Input Container */}
                        <div className="p-5 rounded-2xl bg-[#f8fafc] border border-gray-100 group/input focus-within:border-[#11327c]/30 transition-all">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              Return Strips
                            </label>
                            <span className="text-[11px] font-black text-[#11327c] tabular-nums bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm">₹{item.stripBuyingPrice}/ea</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="00"
                              className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-lg font-black text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all tabular-nums placeholder:text-gray-200"
                              value={item.stripQty || ''}
                              onChange={(e) => updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)}
                            />
                            {item.stripQty > 0 && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                TOTAL: ₹{(item.stripQty * item.stripBuyingPrice).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Tablet Input Container */}
                        <div className="p-5 rounded-2xl bg-[#f8fafc] border border-gray-100 group/input focus-within:border-[#11327c]/30 transition-all">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              Return Tablets
                            </label>
                            <span className="text-[11px] font-black text-[#11327c] tabular-nums bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm">₹{item.tabletBuyingPrice}/ea</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="00"
                              className="w-full bg-white border border-gray-200 px-4 py-3 rounded-xl text-lg font-black text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all tabular-nums placeholder:text-gray-200"
                              value={item.tabletQty || ''}
                              onChange={(e) => updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)}
                            />
                            {item.tabletQty > 0 && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                TOTAL: ₹{(item.tabletQty * item.tabletBuyingPrice).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Context & Summary */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Note Context Card */}
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_15px_45px_-15px_rgba(0,0,0,0.05)]">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-8">Note Specifications</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Supplier Name *</label>
                <input 
                  type="text" 
                  placeholder="E.g., Global Pharma Dist." 
                  value={supplierName} 
                  onChange={(e) => setSupplierName(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all placeholder:text-gray-300" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#11327c] uppercase tracking-widest ml-1">Return Reason *</label>
                <select
                  className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-[14px] font-bold text-[#11327c] outline-none focus:ring-4 focus:ring-[#11327c]/5 focus:border-[#11327c]/20 transition-all appearance-none cursor-pointer"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="Expired">Expired Stock</option>
                  <option value="Damaged">Damaged in Transit</option>
                  <option value="Excess">Excess/Unsold Stock</option>
                  <option value="Recall">Product Recall</option>
                  <option value="Other">Other Reasons</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-[#11327c] p-8 rounded-[40px] shadow-[0_30px_60px_-15px_rgba(17,50,124,0.4)] text-white relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
              <Calculator size={120} />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-10">Debit Summary</h2>
              
              <div className="space-y-2 mb-10">
                <div className="text-[11px] font-black text-white/50 uppercase tracking-widest">Total Refund Value</div>
                <div className="text-[42px] font-black tracking-tighter leading-none">
                  ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.1em] mt-2 italic">Calculated at secure purchase cost price</p>
              </div>

              <button
                disabled={loading || cart.length === 0 || !supplierName.trim()}
                onClick={submitReturn}
                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-black text-[13px] uppercase tracking-[0.15em] transition-all shadow-xl shadow-orange-950/20 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    <CheckCircle2 size={20} strokeWidth={3} />
                    Confirm Return
                  </>
                )}
              </button>
              
              {cart.length > 0 && (
                <div className="mt-6 flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <AlertCircle size={16} className="text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-white/60 leading-relaxed uppercase tracking-wider">
                    Caution: Confirmed units will be automatically deducted from physical inventory stock.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

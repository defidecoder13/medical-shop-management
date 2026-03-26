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
  ArrowLeft
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
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/supplier-returns" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft size={16} className="mr-1" />
            Back to Ledger
          </Link>
          <h2 className="text-2xl font-bold text-foreground">New Supplier Return</h2>
          <p className="text-sm text-muted-foreground">Draft a debit note against inventory outflows.</p>
        </div>
        
        {message && (
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
        
        {/* Left Column: Search & Items */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm relative">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search size={16} className="text-primary" />
              Find Inventory to Return
            </h2>
            <div className="relative">
              <input
                className="w-full bg-secondary/50 border border-border px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                placeholder="Search by name, brand or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>

            {/* Results Dropdown */}
            {medicines.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto"
              >
                <AnimatePresence>
                {medicines.map((med, index) => (
                  <motion.button
                    key={med._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => addToCart(med)}
                    className="w-full flex justify-between items-center p-3 hover:bg-muted/50 text-left transition-colors border-b border-border last:border-0"
                  >
                    <div>
                      <div className="font-medium text-foreground">{med.name}</div>
                      {med.composition && (
                         <div className="text-[11px] text-muted-foreground italic truncate max-w-xs">{med.composition}</div>
                      )}
                      <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                        <span className="bg-secondary px-1.5 rounded">Rack: {med.rackNumber || 'N/A'}</span>
                        <span className="text-foreground font-medium flex gap-1 items-center">
                            Stock Available: <span className="font-bold text-primary">{med.stock} strips</span>
                        </span>
                      </div>
                    </div>
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                      <Plus size={16} />
                    </div>
                  </motion.button>
                ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Truck size={18} className="text-primary" />
                Return Draft Items <span className="text-muted-foreground text-sm font-normal">({cart.length})</span>
              </h2>
              {cart.length > 0 && (
                <button 
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center opacity-50">
                  <Package size={40} className="mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground font-medium text-sm">Draft is empty</p>
                  <p className="text-xs text-muted-foreground">Search inventory items to add</p>
                </div>
              ) : (
                <AnimatePresence>
                {cart.map((item) => (
                  <motion.div 
                    key={item.medicineId} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative p-4 rounded-xl border border-border bg-card hover:bg-accent/5 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col gap-3"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start pr-8">
                      <div className="space-y-1.5">
                        <div className="font-semibold text-foreground text-[15px] flex items-center gap-2">
                          {item.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted-foreground/80 font-medium">Batch: <span className="text-foreground">{item.batchNumber}</span></span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-muted-foreground/80 font-medium">
                            Stock Remaining: <span className="font-bold">{item.stock}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.medicineId)}
                        className="absolute right-3 top-4 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-1.5 rounded-md transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {/* Strip Input */}
                      <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
                            Return Strips
                          </label>
                          <span className="text-[11px] font-semibold text-foreground/80 tabular-nums">Cost: ₹{item.stripBuyingPrice}/ea</span>
                        </div>
                        <div className="relative flex items-center shadow-sm rounded-md overflow-hidden border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all bg-background">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            className="w-full bg-transparent px-3 py-1.5 text-sm outline-none text-foreground font-semibold placeholder:font-normal placeholder:text-muted-foreground/50 tabular-nums"
                            value={item.stripQty || ''}
                            onChange={(e) => updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)}
                          />
                          <AnimatePresence>
                            {item.stripQty > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-2 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 pointer-events-none tabular-nums"
                              >
                                ₹{(item.stripQty * item.stripBuyingPrice).toFixed(2)}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      {/* Tablet Input */}
                      <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Return Tablets
                          </label>
                          <span className="text-[11px] font-semibold text-foreground/80 tabular-nums">Cost: ₹{item.tabletBuyingPrice}/ea</span>
                        </div>
                        <div className="relative flex items-center shadow-sm rounded-md overflow-hidden border border-border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all bg-background">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            className="w-full bg-transparent px-3 py-1.5 text-sm outline-none text-foreground font-semibold placeholder:font-normal placeholder:text-muted-foreground/50 tabular-nums"
                            value={item.tabletQty || ''}
                            onChange={(e) => updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)}
                          />
                          <AnimatePresence>
                            {item.tabletQty > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="absolute right-2 px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 pointer-events-none tabular-nums"
                              >
                                ₹{(item.tabletQty * item.tabletBuyingPrice).toFixed(2)}
                              </motion.div>
                            )}
                          </AnimatePresence>
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

        {/* Right Column: Context & Calculations */}
        <div className="lg:col-span-4">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-primary" />
              Debit Note Summary
            </h2>

            <div className="space-y-4 mb-6 relative">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note Context</h3>
              
              <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Supplier/Distributor Name *</label>
                  <input 
                    type="text" 
                    placeholder="E.g., PharmaCorp Distributors" 
                    value={supplierName} 
                    onChange={(e) => setSupplierName(e.target.value)} 
                    className="w-full bg-background border border-border px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 text-foreground" 
                  />
              </div>

              <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Reason for Return *</label>
                  <select
                     className="w-full bg-background border border-border px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                  >
                        <option value="Expired">Expired Stock</option>
                        <option value="Damaged">Damaged in Transit</option>
                        <option value="Excess">Excess/Unsold Stock</option>
                        <option value="Recall">Product Recall</option>
                        <option value="Other">Other</option>
                  </select>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <Separator className="my-4" />

              <div className="flex justify-between items-end">
                <span className="font-bold text-foreground text-sm uppercase">Total Debit Value</span>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground text-right -mt-2">Extracted securely at purchase cost price.</p>
            </div>

            <div className="mt-8">
              <button
                disabled={loading || cart.length === 0 || !supplierName.trim()}
                onClick={submitReturn}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirm & Decrement Stock
                  </>
                )}
              </button>
            </div>
            
            {cart.length > 0 && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-lg flex gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p className="font-medium">WARNING: This securely removes exact physical units directly from your available inventory automatically.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

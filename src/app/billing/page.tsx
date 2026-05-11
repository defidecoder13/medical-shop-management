
"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FileText,
  Printer,
  ChevronLeft,
  Banknote
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/src/components/ui/separator";
import { useDebounce } from "@/src/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";
import { setApiCache } from "@/src/lib/localDb";

type Medicine = {
  _id: string;
  name: string;
  batchNumber: string;
  stock: number;
  sellingPricePerStrip: number;
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
  stripSellingPrice: number | "";
  tabletSellingPrice: number | "";
  mrp: number; // Added for reference
  stock: number;
  rackNumber: string;
};

export default function BillingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addId = searchParams.get('add');
  const processedAddId = useRef<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const debouncedPhone = useDebounce(patientPhone, 500);
  const [doctorName, setDoctorName] = useState("");
  const [regularMedicines, setRegularMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercent, setGstPercent] = useState(0);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('medishop_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('medishop_cart', JSON.stringify(cart));
  }, [cart]);

  // Keep a ref to cart for safe access in async auto-add
  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

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

  // Handle auto-add from URL
  useEffect(() => {
    if (addId && processedAddId.current !== addId) {
      processedAddId.current = addId; // Mark as processed immediately
      
      const fetchAndAdd = async () => {
          try {
          // Clear the param immediately to prevent any double-invocation issues
          router.replace('/billing');

          const med = await apiClient.get(`/api/inventory/${addId}`);
          if (med) {
            // Check usage using the ref to avoid stale closures or state logic issues
            const currentCart = cartRef.current;
            const exists = currentCart.find(c => c.medicineId === med._id);

            if (exists) {
              setMessage({ text: `${med.name} is already in the cart`, type: 'error' });
              setTimeout(() => setMessage(null), 3000);
              return;
            }
            
            const sellingPrice = med.sellingPricePerStrip || med.sellingPrice || 0;
            const tabletsPerStrip = med.tabletsPerStrip || 1;
            const tabletPrice = sellingPrice > 0 ? Number((sellingPrice / tabletsPerStrip).toFixed(2)) : 0;
            
            setMessage({ text: `${med.name} added to cart`, type: 'success' });
            setTimeout(() => setMessage(null), 3000);
            
            setCart(prevCart => [
              ...prevCart,
              {
                medicineId: med._id,
                name: med.name,
                batchNumber: med.batchNumber,
                stripQty: 0,
                tabletQty: 0,
                stripSellingPrice: sellingPrice,
                tabletSellingPrice: tabletPrice,
                mrp: sellingPrice,
                stock: med.stock,
                rackNumber: med.rackNumber || "",
              },
            ]);
          }
        } catch (error) {
          console.error("Failed to auto-add item", error);
        }
      };
      fetchAndAdd();
    }
  }, [addId, router]);



  useEffect(() => {
    if (!debouncedSearch) {
      setMedicines([]);
      return;
    }
    apiClient.get(`/api/inventory?q=${debouncedSearch}`)
      .then(setMedicines)
      .catch((err) => console.error(err));
  }, [debouncedSearch]);

  // Handle Patient Autofill
  useEffect(() => {
    if (!debouncedPhone || debouncedPhone.length < 5) {
      setRegularMedicines([]);
      return;
    }
    const fetchPatient = async () => {
      try {
        const patients = await apiClient.get(`/api/patients?search=${debouncedPhone}`);
        if (patients && patients.length > 0) {
           const p = patients[0];
           if (p.phone === debouncedPhone) {
              if (!patientName) setPatientName(p.name || "");
              if (!doctorName) setDoctorName(p.doctorName || "");
              if (p.regularMedicines?.length > 0) {
                 setRegularMedicines(p.regularMedicines);
              }
           }
        } else {
           setRegularMedicines([]);
        }
      } catch (err) {
        console.error("Failed to fetch patient details", err);
      }
    };
    fetchPatient();
  }, [debouncedPhone]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await apiClient.get('/api/settings');
        if (settings) {
          // Logic: Default Enabled if settings say so, but user can toggle later.
          setGstEnabled(settings.gstEnabled || false);
          setGstPercent(settings.defaultGstPercent || 0);
        }
      } catch {
        setGstEnabled(false);
      }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    const calculatedSubTotal = cart.reduce((sum, item) => {
      const stripTotal = typeof item.stripSellingPrice === 'number' && typeof item.stripQty === 'number' 
        ? item.stripSellingPrice * item.stripQty 
        : 0;
      const tabletTotal = typeof item.tabletSellingPrice === 'number' && typeof item.tabletQty === 'number' 
        ? item.tabletSellingPrice * item.tabletQty 
        : 0;
      return sum + stripTotal + tabletTotal;
    }, 0);
    
    setSubTotal(calculatedSubTotal);
    
    const dp = discountPercent === "" ? 0 : Number(discountPercent);
    const calculatedDiscount = calculatedSubTotal * (dp / 100);
    const roundedDiscount = Math.round(calculatedDiscount * 100) / 100;
    setDiscountAmount(roundedDiscount);
    
    const totalAfterDiscount = calculatedSubTotal - calculatedDiscount;
    const gstAmount = gstEnabled ? totalAfterDiscount * (gstPercent / 100) : 0;
    const finalTotal = totalAfterDiscount + gstAmount;
    const roundedFinalTotal = Math.round(finalTotal * 100) / 100;
    
    setGrandTotal(roundedFinalTotal);
  }, [cart, discountPercent, gstEnabled, gstPercent]);

  const handleBarcodeScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      e.preventDefault();
      try {
        setLoading(true);
        // Fast fetch bypasses debounce - perfectly suited for barcode scanners!
        const res = await apiClient.get(`/api/inventory?q=${search}`);
        if (res && res.length > 0) {
          // Find first valid batch (stock > 0, unexpired)
          const validBatch = res.find((b: any) => b.stock > 0 && new Date(b.expiryDate) > new Date());
          if (validBatch) {
             addToCart(validBatch);
          } else {
             setMessage({ text: 'Scanned item is out of stock or expired!', type: 'error' });
             setTimeout(() => setMessage(null), 3000);
          }
        } else {
          setMessage({ text: 'Barcode not found in inventory!', type: 'error' });
          setTimeout(() => setMessage(null), 3000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const addToCart = (med: Medicine) => {
    // 1. Check for Expiry (Emergency Mode)
    if (new Date(med.expiryDate) < new Date()) {
      setMessage({ text: `Cannot sell ${med.name}. ITEM EXPIRED!`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (cart.find((c) => c.medicineId === med._id)) {
      setMessage({ text: `${med.name} is already in the cart`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Safe calculation with fallbacks
    const sellingPrice = med.sellingPricePerStrip || 0;
    const tabletsPerStrip = med.tabletsPerStrip || 1; // Prevent division by zero
    
    const tabletPrice = sellingPrice > 0 
      ? Number((sellingPrice / tabletsPerStrip).toFixed(2)) 
      : 0;

    setCart([
      ...cart,
      {
        medicineId: med._id,
        name: med.name,
        batchNumber: med.batchNumber,
        stripQty: 0,
        tabletQty: 0,
        stripSellingPrice: sellingPrice,
        tabletSellingPrice: tabletPrice,
        mrp: sellingPrice,
        stock: med.stock,
        rackNumber: med.rackNumber || "",
      },
    ]);
    setSearch("");
  };

  const loadRegularMedicines = async () => {
    if (regularMedicines.length === 0) return;
    
    setLoading(true);
    try {
       const ids = regularMedicines.map(r => r.medicineId).join(',');
       const batches = await apiClient.get(`/api/inventory?ids=${ids}`);
       
       if (batches && batches.length > 0) {
          // Group by medicineId and pick the first available batch for each
          const uniqueMeds = new Map();
          for (const batch of batches) {
             if (!uniqueMeds.has(batch.medicineId) && batch.stock > 0 && new Date(batch.expiryDate) > new Date()) {
                uniqueMeds.set(batch.medicineId, batch);
             }
          }
          
          let addedCount = 0;
          const currentCartIds = new Set(cart.map(c => c.medicineId));
          const newItems: CartItem[] = [];

          uniqueMeds.forEach((med) => {
             if (!currentCartIds.has(med._id)) {
                const sellingPrice = med.sellingPricePerStrip || med.sellingPrice || 0;
                const tabletsPerStrip = med.tabletsPerStrip || 1;
                const tabletPrice = sellingPrice > 0 ? Number((sellingPrice / tabletsPerStrip).toFixed(2)) : 0;
                
                // Find dosage instructions if any
                const regData = regularMedicines.find(r => r.medicineId === med.medicineId);

                newItems.push({
                   medicineId: med._id,
                   name: med.name,
                   batchNumber: med.batchNumber,
                   stripQty: 1, // Default to 1 strip for regular medicines
                   tabletQty: 0,
                   stripSellingPrice: sellingPrice,
                   tabletSellingPrice: tabletPrice,
                   mrp: sellingPrice,
                   stock: med.stock,
                   rackNumber: med.rackNumber || "",
                });
                addedCount++;
             }
          });

          if (addedCount > 0) {
             setCart(prev => [...prev, ...newItems]);
             setMessage({ text: `Loaded ${addedCount} regular medicines`, type: 'info' });
          } else {
             setMessage({ text: "All active medicines are already in the cart or out of stock", type: 'error' });
          }
       }
    } catch (err) {
       setMessage({ text: "Failed to load medicines", type: 'error' });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const updateItem = (id: string, field: keyof CartItem, value: any) => {
    setCart(cart.map((item) => item.medicineId === id ? { ...item, [field]: value } : item));
  };
  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.medicineId !== id));
  };

  const submitBill = async () => {
    if (cart.length === 0) return;

    if (
      cart.some(
        (i) =>
          (typeof i.stripSellingPrice === 'number' && i.stripSellingPrice > 0 && i.stripQty > 0) ||
          (typeof i.tabletSellingPrice === 'number' && i.tabletSellingPrice > 0 && i.tabletQty > 0)
          ? false 
          : true
      )
    ) {
      setMessage({text: "Enter valid quantity and price for all items", type: "error"});
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const dp = discountPercent === "" ? 0 : Number(discountPercent);
    setLoading(true);

    try {
      const payload = {
        items: cart.flatMap((c) => {
          const items = [];
          if (c.stripQty > 0 && typeof c.stripSellingPrice === 'number') {
            items.push({
              medicineId: c.medicineId,
              name: c.name,
              batchNumber: c.batchNumber,
              unitType: 'strip',
              qty: c.stripQty,
              sellingPrice: c.stripSellingPrice,
            });
          }
          if (c.tabletQty > 0 && typeof c.tabletSellingPrice === 'number') {
            items.push({
              medicineId: c.medicineId,
              name: c.name,
              batchNumber: c.batchNumber,
              unitType: 'tablet',
              qty: c.tabletQty,
              sellingPrice: c.tabletSellingPrice,
            });
          }
          return items;
        }),
        discountPercent: dp,
        gstEnabled: gstEnabled, // Send toggle status
        patientName,
        patientPhone,
        doctorName,
        printInvoice: false, // Never print from here
      };

      const data = await apiClient.post("/api/billing", payload);

      // Construct Mock transaction for offline or use real data for online caching
      let txToCache;
      
      if (data.offlineQueued && data._id) {
         // Reconstruct the transaction locally for offline printing
         const processedItems = payload.items.map(item => ({
            ...item,
            total: item.qty * item.sellingPrice
         }));
         
         txToCache = {
            _id: data._id,
            createdAt: new Date().toISOString(),
            subTotal: subTotal,
            discountPercent: dp,
            discountAmount: discountAmount,
            gstPercent: gstPercent,
            gstEnabled: gstEnabled,
            gstAmount: gstEnabled ? (subTotal - discountAmount) * (gstPercent / 100) : 0,
            grandTotal: grandTotal,
            items: processedItems,
            printInvoice: false,
            patientName,
            patientPhone,
            doctorName,
            isUnsynced: true // Custom flag strictly for UI display
         };
      } else if (data._id) {
         txToCache = {
             ...data,
             isUnsynced: false
         };
      }

      if (txToCache && data._id) {
         // Inject the transaction into the local cache for immediate offline viewing/printing
         await setApiCache(`/api/billing/${data._id}`, txToCache);
         await setApiCache(`/api/transactions/${data._id}`, txToCache);
         
         // Try to inject it into the latest generic transactions cache list so it appears in the table offline
         try {
             const url1m = `/api/transactions?range=1m`;
             
             // Dynamic fetch from idb
             const idbData = await import("@/src/lib/localDb").then(m => m.getApiCache(url1m));
             if (idbData && Array.isArray(idbData)) {
                 await import("@/src/lib/localDb").then(m => m.setApiCache(url1m, [txToCache, ...idbData]));
             }
         } catch (e) {
             console.warn("Failed to inject to list cache", e);
         }
      }

      setLoading(false);

      setCart([]);
      localStorage.removeItem('medishop_cart');
      setSearch("");
      setDiscountPercent("");
      setPatientName("");
      setPatientPhone("");
      setDoctorName("");
      setMessage({text: data.offlineQueued ? "Bill saved offline (Unsynced)" : "Bill generated successfully", type: "success"});
      
      setTimeout(() => setMessage(null), 3000);
      
      // Prompt for printing
      if (data._id) {
         // Small delay so the success message renders before blocking the thread with confirm
         setTimeout(() => {
            if (window.confirm("Bill generated. Do you want to print the invoice now?")) {
               window.open(`/print/${data._id}`, '_blank');
            }
         }, 100);
      }
    } catch (err: any) {
      setLoading(false);
      setMessage({text: err.message || "An unexpected error occurred", type: "error"});
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">New Bill</h2>
          <p className="text-sm text-muted-foreground">Create new invoice.</p>
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
        
        {/* Left Column: Search & Cart */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          
          {/* Search Box */}
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm relative">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search size={16} className="text-primary" />
              Add Medicines
            </h2>
            <div className="relative">
              <input
                className="w-full bg-secondary/50 border border-border px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground placeholder:text-muted-foreground"
                placeholder="Scan Barcode or Search by name, brand, batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleBarcodeScan}
                autoFocus
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
                        <span className={med.stock < 10 ? 'text-rose-600 dark:text-rose-400 font-medium' : ''}>Stock: {med.stock}</span>
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

          {/* Cart Items */}
          <div className="bg-card rounded-xl border border-border shadow-sm flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart size={18} className="text-primary" />
                Cart Items <span className="text-muted-foreground text-sm font-normal">({cart.length})</span>
              </h2>
              {cart.length > 0 && (
                <button 
                  onClick={() => { setCart([]); localStorage.removeItem('medishop_cart'); }}
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
                  <ShoppingCart size={40} className="mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground font-medium text-sm">Cart is empty</p>
                  <p className="text-xs text-muted-foreground">Search items to add</p>
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
                    {/* Left Accent Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="font-bold text-foreground text-[15px] flex items-center gap-2">
                          {item.name}
                          {item.stock < 10 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[9px] font-bold uppercase tracking-wider">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground font-medium">Batch: <span className="text-foreground font-semibold">{item.batchNumber}</span></span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-muted-foreground font-medium">
                            Stock: <span className={item.stock < 10 ? "text-rose-500 font-bold" : "text-foreground font-semibold"}>{item.stock}</span>
                          </span>
                          {item.rackNumber && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded tracking-wide uppercase">
                                <Package size={10} strokeWidth={2.5} />
                                Rack {item.rackNumber}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.medicineId)}
                        className="text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 p-2 rounded-lg transition-colors flex-shrink-0"
                        title="Remove Item"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      {/* Strip Input Row */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-2 w-24">
                          <div className="w-1.5 h-1.5 rounded-sm bg-blue-500" />
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Strips</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              className="w-16 bg-background border border-border rounded-md px-2 py-1 text-sm font-semibold text-center focus:ring-2 focus:ring-primary outline-none tabular-nums"
                              value={item.stripQty || ''}
                              onChange={(e) => updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-16 text-right">
                             <span className="text-[11px] font-medium text-muted-foreground">x ₹{item.stripSellingPrice}</span>
                          </div>
                          <div className="w-20 text-right">
                             <span className="text-sm font-bold text-foreground">₹{((item.stripQty || 0) * (item.stripSellingPrice || 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tablet Input Row */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-2 w-24">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tablets</span>
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              className="w-16 bg-background border border-border rounded-md px-2 py-1 text-sm font-semibold text-center focus:ring-2 focus:ring-primary outline-none tabular-nums"
                              value={item.tabletQty || ''}
                              onChange={(e) => updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)}
                            />
                          </div>
                          <div className="w-16 text-right">
                             <span className="text-[11px] font-medium text-muted-foreground">x ₹{item.tabletSellingPrice}</span>
                          </div>
                          <div className="w-20 text-right">
                             <span className="text-sm font-bold text-foreground">₹{((item.tabletQty || 0) * (item.tabletSellingPrice || 0)).toFixed(2)}</span>
                          </div>
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

        {/* Right Column: Calculations */}
        <div className="lg:col-span-4">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm sticky top-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-primary" />
              Bill Summary
            </h2>

            {/* Customer & Prescription Details */}
            <div className="space-y-3 mb-6 bg-secondary/30 p-4 rounded-lg border border-border/50">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customer & Prescription (Optional)</h3>
              <input 
                type="text" 
                placeholder="Patient Name" 
                value={patientName} 
                onChange={(e) => setPatientName(e.target.value)} 
                className="w-full bg-background border border-border px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 text-foreground" 
              />
              <input 
                type="text" 
                placeholder="Doctor Name" 
                value={doctorName} 
                onChange={(e) => setDoctorName(e.target.value)} 
                className="w-full bg-background border border-border px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 text-foreground" 
              />
              <input 
                type="tel" 
                placeholder="Patient Phone (Auto-fills if exists)" 
                value={patientPhone} 
                onChange={(e) => setPatientPhone(e.target.value)} 
                className="w-full bg-background border border-border px-3 py-2 rounded-md text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 text-foreground" 
              />
              {regularMedicines.length > 0 && (
                 <button 
                   onClick={loadRegularMedicines}
                   disabled={loading}
                   className="w-full mt-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                 >
                    <Package size={14} />
                    Load Active Prescriptions ({regularMedicines.length})
                 </button>
              )}
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sub Total</span>
                <span className="font-medium text-foreground">₹{subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discount (%)</span>
                <div className="w-16 flex items-center border border-border rounded px-2 bg-secondary/50">
                  <input
                    type="number"
                    className="w-full bg-transparent text-right outline-none text-xs font-medium py-1 text-foreground"
                    placeholder="0"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount Amount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {/* GST Toggle and Display */}
              <div className="flex justify-between items-center py-1">
                 <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="gstToggle" 
                      checked={gstEnabled && gstPercent > 0} 
                      disabled={gstPercent === 0}
                      onChange={(e) => setGstEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="gstToggle" className={`text-sm cursor-pointer ${gstPercent === 0 ? 'text-muted-foreground/50' : 'text-muted-foreground select-none'}`}>
                      Apply GST {gstPercent > 0 ? `(@ ${gstPercent}%)` : '(N/A)'}
                    </label>
                 </div>
                 {gstEnabled && gstPercent > 0 && (
                    <span className="font-medium text-foreground">
                         ₹{((subTotal - discountAmount) * (gstPercent / 100)).toFixed(2)}
                    </span>
                 )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-end">
                <span className="font-bold text-foreground">Grand Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-8">
              <button
                disabled={loading || cart.length === 0}
                onClick={submitBill}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating..." : (
                  <>
                    <FileText size={18} />
                    Generate Bill
                  </>
                )}
              </button>
            </div>
            
            {cart.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg flex gap-2 text-xs text-blue-700 dark:text-blue-300">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>Quantities will be deducted from inventory immediately.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

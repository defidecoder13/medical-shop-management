
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
  Banknote,
  Users,
  Calendar,
  Receipt,
  Info,
  CreditCard,
  Send,
  Pill,
  Minus,
  Tag
} from "@/src/components/icons";
import Link from "next/link";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { useDebounce } from "@/src/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/src/lib/apiClient";
import { AnimatedNumber } from "@/src/components/ui/animated";
import { setApiCache } from "@/src/lib/localDb";
import { triggerPrintInvoice } from "@/src/lib/printHelper";

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
  discountPercent?: number;
  gstPercent?: number;
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
  discountPercent?: number | string;
  tabletsPerStrip: number;
  gstPercent: number;
  expiryDate?: string;
  composition?: string;
};

export default function BillingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingSearchInput({ onSearch, onBarcodeScan, clearTrigger }: any) {
  const [localSearch, setLocalSearch] = useState("");
  const debouncedValue = useDebounce(localSearch, 300);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  useEffect(() => {
    if (clearTrigger > 0) {
      setLocalSearch("");
    }
  }, [clearTrigger]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localSearch.trim() !== '') {
      e.preventDefault();
      onBarcodeScan(localSearch);
    }
  };

  return (
    <div className="relative">
      <input
        className="input h-12 pl-12 text-[13.5px]"
        placeholder="Scan barcode or search by name, brand, batch..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" strokeWidth={2} />
    </div>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addId = searchParams.get('add');
  const processedAddId = useRef<string | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [clearTrigger, setClearTrigger] = useState(0);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const debouncedName = useDebounce(patientName, 500);
  const [patientAddress, setPatientAddress] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [regularMedicines, setRegularMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [roundingAdjustment, setRoundingAdjustment] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercent, setGstPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedBillId, setGeneratedBillId] = useState<string | null>(null);

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
    if (!document.cookie.includes('is_logged_in=1')) {
      router.push('/login');
    }
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
            const medObj: any = med;
            const medName = med.name || (typeof medObj.medicineId === 'object' && medObj.medicineId?.name) || "Unknown Medicine";
            const tabletsPerStrip = med.tabletsPerStrip || (typeof medObj.medicineId === 'object' && medObj.medicineId?.tabletsPerStrip) || 1;
            const gstPercent = med.gstPercent || (typeof medObj.medicineId === 'object' && medObj.medicineId?.gstPercent) || 0;

            const currentCart = cartRef.current;
            const exists = currentCart.find(c => c.medicineId === med._id);

            if (exists) {
              setMessage({ text: `${medName} is already in the cart`, type: 'error' });
              setTimeout(() => setMessage(null), 3000);
              return;
            }
            
            const sellingPrice = med.sellingPricePerStrip || med.sellingPrice || 0;
            const tabletPrice = sellingPrice > 0 ? Number((sellingPrice / tabletsPerStrip).toFixed(2)) : 0;
            
            setMessage({ text: `${medName} added to cart`, type: 'success' });
            setTimeout(() => setMessage(null), 3000);
            
            setCart(prevCart => [
              ...prevCart,
              {
                medicineId: med._id,
                name: medName,
                batchNumber: med.batchNumber,
                stripQty: 0,
                tabletQty: 0,
                stripSellingPrice: sellingPrice,
                tabletSellingPrice: tabletPrice,
                mrp: sellingPrice,
                stock: med.stock,
                rackNumber: med.rackNumber || "",
                discountPercent: med.discountPercent || 0,
                tabletsPerStrip: tabletsPerStrip,
                gstPercent: gstPercent,
                expiryDate: med.expiryDate,
              },
            ]);
            setClearTrigger(prev => prev + 1);
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
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/api/inventory/search?q=${encodeURIComponent(debouncedSearch)}&limit=20`, { signal: controller.signal } as any);
        if (!cancelled && res) setMedicines(Array.isArray(res) ? res : res.data || []);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error(err);
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [debouncedSearch]);

  // Handle Patient Autofill — single fetch, abort-aware
  useEffect(() => {
    if (!debouncedName || debouncedName.length < 3) {
      setRegularMedicines([]);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      try {
        const res: any = await apiClient.get(`/api/patients?search=${debouncedName}`, { signal: controller.signal } as any);
        if (cancelled) return;
        const p = res?.data?.[0] || (Array.isArray(res) ? res[0] : null);
        if (p) {
          if (!patientPhone) setPatientPhone(p.phone || "");
          if (!doctorName) setDoctorName(p.doctorName || "");
          if (!patientAddress) setPatientAddress(p.address || "");
          if (p.regularMedicines?.length > 0) setRegularMedicines(p.regularMedicines);
          else setRegularMedicines([]);
        } else {
          setRegularMedicines([]);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch patient details", err);
      }
    })();
    return () => { cancelled = true; controller.abort(); };
  }, [debouncedName]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const handleSettings = (settings: any) => {
          if (settings) {
            setGstEnabled(settings.gstEnabled || false);
            setGstPercent(settings.defaultGstPercent || 0);
          }
        };
        await apiClient.get('/api/settings', {}, handleSettings).then(handleSettings);
      } catch {
        setGstEnabled(false);
      }
    };
    fetchSettings();
  }, []);
  
  useEffect(() => {
    let tempSubTotal = 0;
    let tempDiscountAmount = 0;
    let tempGstAmount = 0;

    cart.forEach((item) => {
      const stripTotal = typeof item.stripSellingPrice === 'number' && typeof item.stripQty === 'number' 
        ? item.stripSellingPrice * item.stripQty 
        : 0;
      const tabletTotal = typeof item.tabletSellingPrice === 'number' && typeof item.tabletQty === 'number' 
        ? item.tabletSellingPrice * item.tabletQty 
        : 0;
      const itemSubTotal = stripTotal + tabletTotal;
      const itemDiscountPercent = Number(item.discountPercent) || 0;
      const itemDiscount = itemSubTotal * (itemDiscountPercent / 100);
      const itemTaxableValue = itemSubTotal - itemDiscount;

      const itemGstPercent = typeof item.gstPercent === 'number' ? item.gstPercent : 0;
      const itemGst = gstEnabled ? itemTaxableValue * (itemGstPercent / 100) : 0;

      tempSubTotal += itemSubTotal;
      tempDiscountAmount += itemDiscount;
      tempGstAmount += itemGst;
    });

    setSubTotal(tempSubTotal);
    
    const roundedDiscount = Math.round(tempDiscountAmount * 100) / 100;
    setDiscountAmount(roundedDiscount);

    const roundedGst = Math.round(tempGstAmount * 100) / 100;
    setGstAmount(roundedGst);
    
    const totalAfterDiscount = tempSubTotal - roundedDiscount;
    const finalTotal = totalAfterDiscount + roundedGst;
    const roundedFinalTotal = Math.round(finalTotal);
    const rAdjustment = Math.round((roundedFinalTotal - finalTotal) * 100) / 100;
    
    setRoundingAdjustment(rAdjustment);
    setGrandTotal(roundedFinalTotal);
  }, [cart, gstEnabled]);

  const handleBarcodeScan = async (scannedValue: string) => {
    try {
        setLoading(true);
        const res = await apiClient.get(`/api/inventory/search?q=${encodeURIComponent(scannedValue)}&limit=10`);
        const list = Array.isArray(res) ? res : res.data || [];
        if (list.length > 0) {
          const validBatch = list.find((b: any) => b.stock > 0 && (!b.expiryDate || new Date(b.expiryDate) > new Date()));
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
      } catch (err: any) {
        setMessage({ text: "Failed to scan barcode", type: "error" });
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
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
    
    const medObj: any = med;
    const medName = med.name || (typeof medObj.medicineId === 'object' && medObj.medicineId?.name) || "Unknown Medicine";
    const tabletPrice = sellingPrice > 0 
      ? Number((sellingPrice / tabletsPerStrip).toFixed(2)) 
      : 0;

    setCart([
      ...cart,
      {
        medicineId: med._id,
        name: medName,
        batchNumber: med.batchNumber,
        stripQty: 0,
        tabletQty: 0,
        stripSellingPrice: sellingPrice,
        tabletSellingPrice: tabletPrice,
        mrp: sellingPrice,
        stock: med.stock,
        rackNumber: med.rackNumber || "",
        discountPercent: med.discountPercent || 0,
        tabletsPerStrip: tabletsPerStrip,
        gstPercent: med.gstPercent || 0,
        expiryDate: med.expiryDate,
      },
    ]);
    setClearTrigger(prev => prev + 1);
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
                   discountPercent: med.discountPercent || 0,
                   tabletsPerStrip: tabletsPerStrip,
                   gstPercent: med.gstPercent || 0,
                   expiryDate: med.expiryDate,
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
              discountPercent: Number(c.discountPercent) || 0,
              pack: `${c.tabletsPerStrip || 1}'S`,
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
              discountPercent: Number(c.discountPercent) || 0,
              pack: `${c.tabletsPerStrip || 1}'S`,
            });
          }
          return items;
        }),
        discountPercent: dp,
        gstEnabled: gstEnabled, // Send toggle status
        patientName,
        patientPhone,
        patientAddress,
        doctorName,
        paymentMethod,
        printInvoice: false, // Never print from here
      };

      const data = await apiClient.post("/api/billing", payload);

      // Construct Mock transaction for offline or use real data for online caching
      let txToCache;
      
      if (data.offlineQueued && data._id) {
         // Reconstruct the transaction locally for offline printing
          const processedItems = payload.items.map(item => {
             const itemDiscountPercent = Number(item.discountPercent) || 0;
             const itemTotal = item.qty * item.sellingPrice;
             return {
                ...item,
                total: itemTotal,
                discountPercent: itemDiscountPercent,
                discountAmount: Math.round(itemTotal * (itemDiscountPercent / 100) * 100) / 100,
             };
          });
         
         txToCache = {
            _id: data._id,
            createdAt: new Date().toISOString(),
            subTotal: subTotal,
            discountPercent: dp,
            discountAmount: discountAmount,
            gstPercent: gstPercent,
            gstEnabled: gstEnabled,
            gstAmount: gstAmount,
            grandTotal: grandTotal,
            items: processedItems,
            printInvoice: false,
            patientName,
            patientPhone,
            patientAddress,
            doctorName,
            paymentMethod: paymentMethod,
            roundingAdjustment: roundingAdjustment,
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
      setClearTrigger(prev => prev + 1);
      setDiscountPercent("");
      setPatientName("");
      setPatientPhone("");
      setPatientAddress("");
      setDoctorName("");
      setRegularMedicines([]);
      setPaymentMethod("Cash");
      setRoundingAdjustment(0);
      
      // Open our smart success modal
      if (data._id) {
        setGeneratedBillId(data._id);
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setLoading(false);
      setMessage({text: err.message || "An unexpected error occurred", type: "error"});
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.medicineId !== id));
  };

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      {/* Toast messages */}
      {message && (
        <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] font-bold shadow-card animate-fade-in w-fit ml-auto ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50' : message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50' : 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} strokeWidth={2.5} /> : message.type === 'info' ? <Info size={16} strokeWidth={2.5} /> : <XCircle size={16} strokeWidth={2.5} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Customer Details, Search & Cart */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Patient Details Card */}
          <div className="surface-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
                <Users size={15} strokeWidth={2} />
              </span>
              <h3 className="text-[13px] font-semibold text-foreground">
                Customer Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="label">Patient Name</label>
                <input
                  className="input"
                  placeholder="Full Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Doctor Name</label>
                <input
                  className="input"
                  placeholder="Dr. Name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  placeholder="10-digit number"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Patient Address</label>
                <input
                  className="input"
                  placeholder="Patient Address"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                />
              </div>
            </div>
            {regularMedicines.length > 0 && (
              <button
                onClick={loadRegularMedicines}
                disabled={loading}
                className="btn-outline btn-md w-full mt-4 text-primary border-primary/25 bg-primary/5 hover:bg-primary/10"
              >
                <Package size={16} strokeWidth={2.4} />
                Load Active Prescriptions ({regularMedicines.length})
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="surface-card p-5 relative group">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
                <Search size={15} strokeWidth={2} />
              </span>
              <h2 className="text-[13px] font-semibold text-foreground">
                Add Medicines
              </h2>
            </div>
            <BillingSearchInput
              onSearch={setDebouncedSearch}
              onBarcodeScan={handleBarcodeScan}
              clearTrigger={clearTrigger}
            />
            <p className="text-[11px] font-semibold text-muted-foreground mt-2.5 ml-1">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-bold">Enter</kbd> to scan a barcode directly
            </p>

            {/* Results Dropdown */}
            <AnimatePresence>
              {medicines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-pop z-20 max-h-80 overflow-y-auto p-1.5"
                >
                  {medicines.slice(0, 50).map((med) => (
                    <button
                      key={med._id}
                      onClick={() => addToCart(med)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left transition-colors rounded-lg group/item cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0 group-hover/item:bg-primary group-hover/item:text-primary-foreground transition-colors">
                        <Pill size={16} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-[13px] truncate">{med.name}</div>
                        {med.composition && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-sm">{med.composition}</div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5 text-[11px]">
                          <span className={med.stock < 10 ? "text-destructive font-medium" : "text-success font-medium"}>
                            Stock: {med.tabletsPerStrip > 1
                              ? (() => {
                                  const totalTabs = Math.round((med.stock || 0) * med.tabletsPerStrip);
                                  const strips = Math.floor(totalTabs / med.tabletsPerStrip);
                                  const tabs = totalTabs % med.tabletsPerStrip;
                                  if (strips > 0 && tabs > 0) return `${strips} Strips, ${tabs} Tabs`;
                                  if (strips > 0) return `${strips} Strips`;
                                  if (tabs > 0) return `${tabs} Tabs`;
                                  return `0 Strips`;
                                })()
                              : `${Math.round(med.stock || 0)} Units`}
                          </span>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="text-muted-foreground">Batch {med.batchNumber || "N/A"}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span className="text-muted-foreground">₹{(med.sellingPricePerStrip || 0).toFixed(2)}</span>
                          {med.rackNumber && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-muted-foreground">{med.rackNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-md shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <Plus size={14} strokeWidth={2.5} />
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Table View */}
          <div className="surface-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart size={16} strokeWidth={2} className="text-muted-foreground" />
                Selected Medicines
                <span className="ml-1 bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-full">{cart.length}</span>
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => { setCart([]); localStorage.removeItem('medishop_cart'); }}
                  className="text-[12px] text-muted-foreground hover:text-destructive font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} strokeWidth={2} />
                  Clear
                </button>
              )}
            </div>

            <div className="p-4 space-y-3.5">
              {cart.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <ShoppingCart size={28} strokeWidth={1.5} className="text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-bold text-sm tracking-tight">Your cart is empty</p>
                  <p className="text-[12px] text-muted-foreground font-medium mt-1">Search medicines above to start billing</p>
                </div>
              ) : (
                <AnimatePresence>
                  {cart.map((item) => {
                    const isMulti = item.tabletsPerStrip > 1;
                    return (
                       <div 
                        key={item.medicineId} 
                        className="group relative p-3 rounded-lg border border-border bg-card hover:border-border hover:bg-accent/30 transition-colors flex flex-col md:flex-row items-center gap-3"
                      >
                          {/* LEFT: Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center w-full">
                             <div className="font-semibold text-foreground text-[13px] truncate flex items-center gap-2">
                              {item.name}
                              {item.stock < 10 && <Badge variant="danger">Low</Badge>}
                             </div>
                             <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                 <span>Batch {item.batchNumber || '-'}</span>
                                 <span className="opacity-40">•</span>
                                 <span>Exp {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : "-"}</span>
                                 <span className="opacity-40">•</span>
                                 <span className={item.stock < 10 ? "text-destructive" : ""}>
                                  Stock {Math.round(item.stock || 0)}
                                 </span>
                             </div>
                          </div>

          {/* MIDDLE: Inputs */}
                          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border">
                              {/* STRIP */}
                              <div className="flex flex-col items-center">
                                 <span className="text-[10px] font-medium text-muted-foreground mb-1">{isMulti ? "Strips" : "Qty"} <span className="text-muted-foreground/60 ml-0.5">₹{item.stripSellingPrice}</span></span>
                                 <div className="flex items-center bg-card border border-border rounded-md h-7">
                                   <button onClick={() => updateItem(item.medicineId, "stripQty", Math.max(0, (item.stripQty || 0) - 1))} className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Minus size={12} strokeWidth={2} /></button>
                                   <input type="text" inputMode="numeric" className="w-9 text-[13px] font-semibold text-foreground text-center focus:outline-none bg-transparent appearance-none px-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" value={item.stripQty === 0 ? '' : item.stripQty} onChange={(e) => updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)} />
                                   <button onClick={() => updateItem(item.medicineId, "stripQty", (item.stripQty || 0) + 1)} className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus size={12} strokeWidth={2} /></button>
                                 </div>
                              </div>

                              {isMulti && (
                                <>
                                  <div className="w-px h-7 bg-border mx-1"></div>
                                  {/* TABLET */}
                                  <div className="flex flex-col items-center">
                                     <span className="text-[10px] font-medium text-muted-foreground mb-1">Tabs <span className="text-muted-foreground/60 ml-0.5">₹{item.tabletSellingPrice}</span></span>
                                     <div className="flex items-center bg-card border border-border rounded-md h-7">
                                       <button onClick={() => updateItem(item.medicineId, "tabletQty", Math.max(0, (item.tabletQty || 0) - 1))} className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Minus size={12} strokeWidth={2} /></button>
                                       <input type="text" inputMode="numeric" className="w-9 text-[13px] font-semibold text-foreground text-center focus:outline-none bg-transparent appearance-none px-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" value={item.tabletQty === 0 ? '' : item.tabletQty} onChange={(e) => updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)} />
                                       <button onClick={() => updateItem(item.medicineId, "tabletQty", (item.tabletQty || 0) + 1)} className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus size={12} strokeWidth={2} /></button>
                                     </div>
                                  </div>
                                </>
                              )}
                          </div>

                          {/* RIGHT: Price & Delete */}
                          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end md:justify-between">
                             <div className="flex flex-col items-center">
                                 <span className="text-[10px] font-medium text-muted-foreground mb-1">Disc %</span>
                                 <div className="flex items-center bg-card border border-border rounded-md h-7">
                                   <button onClick={() => updateItem(item.medicineId, "discountPercent", Math.max(0, Number((Number(item.discountPercent || 0) - 1).toFixed(2))))} className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Minus size={12} strokeWidth={2} /></button>
                                   <input type="text" inputMode="decimal" className="w-11 text-[12px] font-medium text-foreground text-center focus:outline-none bg-transparent appearance-none px-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" value={item.discountPercent === 0 ? '' : item.discountPercent} onChange={(e) => {
                                       const val = e.target.value;
                                       if (val === '') {
                                           updateItem(item.medicineId, "discountPercent", '');
                                       } else if (/^\d*\.?\d*$/.test(val)) {
                                           const num = Number(val);
                                           if (!isNaN(num) && num <= 100) {
                                               updateItem(item.medicineId, "discountPercent", val);
                                           }
                                       }
                                   }} />
                                   <button onClick={() => updateItem(item.medicineId, "discountPercent", Math.min(100, Number((Number(item.discountPercent || 0) + 1).toFixed(2))))} className="w-7 h-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><Plus size={12} strokeWidth={2} /></button>
                                 </div>
                             </div>

                            <div className="w-px h-7 bg-border hidden md:block mx-1"></div>

                             <div className="flex flex-col items-end w-20">
                                 <span className="text-[11px] text-muted-foreground mb-1">Total</span>
                                 <span className="text-[13px] font-semibold text-foreground tabular-nums">
                                    ₹{(((item.stripQty || 0) * (Number(item.stripSellingPrice) || 0) + (item.tabletQty || 0) * (Number(item.tabletSellingPrice) || 0)) * (1 - (Number(item.discountPercent) || 0) / 100)).toFixed(2)}
                                 </span>
                             </div>

                             <button onClick={() => removeFromCart(item.medicineId)} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors ml-1">
                                <Trash2 size={14} strokeWidth={2} />
                             </button>
                         </div>
                       </div>
                );
              })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">


          {/* Bill Summary Card — restrained, token-driven */}
          <div className="surface-card p-5 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                <Receipt size={16} strokeWidth={2} className="text-muted-foreground" />
                Invoice Summary
              </h3>
              {cart.length > 0 && (
                <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </span>
              )}
            </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span className="font-medium tabular-nums">₹{subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium tabular-nums text-destructive">-₹{discountAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-dashed border-border">
                  <label className="text-sm text-foreground cursor-pointer select-none" htmlFor="gstToggle">
                    Apply GST
                  </label>
                  <button
                    type="button"
                    onClick={() => setGstEnabled(!gstEnabled)}
                    aria-pressed={gstEnabled}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex items-center p-0.5 ${gstEnabled ? "bg-primary" : "bg-muted border border-border"}`}
                  >
                    <span className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${gstEnabled ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                {gstEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST</span>
                    <span className="font-medium tabular-nums">+₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                {roundingAdjustment !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rounding</span>
                    <span className="font-medium tabular-nums">{roundingAdjustment < 0 ? "-" : "+"}₹{Math.abs(roundingAdjustment).toFixed(2)}</span>
                  </div>
                )}

                {/* Payment method */}
                <div className="pt-2">
                  <div className="text-[11px] font-medium text-muted-foreground mb-2">
                    Payment Method
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Cash", "UPI", "Card"] as const).map((method) => {
                      const Icon = method === "Cash" ? Banknote : method === "UPI" ? Send : CreditCard;
                      const active = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg py-2.5 text-[12px] font-medium transition-colors cursor-pointer border ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          <Icon size={16} strokeWidth={2} />
                          <span>{method}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground">Grand Total</span>
                <span className="text-[26px] font-bold tracking-tight tabular-nums">
                  <AnimatedNumber value={grandTotal} prefix="₹" decimals={0} />
                </span>
              </div>
              <button
                disabled={loading || cart.length === 0}
                onClick={submitBill}
                className="w-full btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    <FileText size={16} strokeWidth={2} />
                    Finalize Bill
                  </>
                )}
              </button>

              {cart.length > 0 && (
                <div className="mt-2.5 flex gap-1.5 text-[11px] text-muted-foreground justify-center">
                  <AlertCircle size={12} strokeWidth={2} />
                  Stock will be deducted on submit
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-xl shadow-pop w-full max-w-[400px] overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-success/12 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-success/5">
                  <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2.4} />
                </div>
                <h3 className="font-display text-[22px] font-extrabold text-foreground mb-2 tracking-tight">
                  Bill Generated!
                </h3>
                <p className="text-muted-foreground font-semibold text-[14px] mb-8">
                  Your bill has been generated successfully and saved to your records.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (generatedBillId) {
                        triggerPrintInvoice(generatedBillId);
                      }
                    }}
                    className="btn-primary btn-lg w-full"
                  >
                    <Printer size={18} strokeWidth={2.5} />
                    Print Invoice
                  </button>
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="btn-outline btn-lg w-full"
                  >
                    OK, Got It
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

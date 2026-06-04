
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
  discountPercent?: number | "";
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
                discountPercent: med.discountPercent || 0,
                tabletsPerStrip: tabletsPerStrip,
                gstPercent: med.gstPercent || 0,
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
    const handleMeds = (res: any) => setMedicines(res);
    apiClient.get(`/api/inventory?q=${debouncedSearch}&inStock=true`, {}, handleMeds)
      .then(handleMeds)
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
        const handlePatient = (patients: any) => {
          if (patients && patients.length > 0) {
             const p = patients[0];
             if (p.phone === debouncedPhone) {
                if (!patientName) setPatientName(p.name || "");
                if (!doctorName) setDoctorName(p.doctorName || "");
                if (!patientAddress) setPatientAddress(p.address || "");
                if (p.regularMedicines?.length > 0) {
                   setRegularMedicines(p.regularMedicines);
                }
             }
          } else {
             setRegularMedicines([]);
          }
        };
        await apiClient.get(`/api/patients?search=${debouncedPhone}`, {}, handlePatient).then(handlePatient);
      } catch (err) {
        console.error("Failed to fetch patient details", err);
      }
    };
    fetchPatient();
  }, [debouncedPhone]);

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
      const itemDiscountPercent = typeof item.discountPercent === 'number' ? item.discountPercent : 0;
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
        discountPercent: med.discountPercent || 0,
        tabletsPerStrip: tabletsPerStrip,
        gstPercent: med.gstPercent || 0,
        expiryDate: med.expiryDate,
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
              discountPercent: c.discountPercent || 0,
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
              discountPercent: c.discountPercent || 0,
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
             const itemDiscountPercent = item.discountPercent || 0;
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
      setSearch("");
      setDiscountPercent("");
      setPatientName("");
      setPatientPhone("");
      setDoctorName("");
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
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-[#11327c] tracking-tight">New Bill</h2>
          <p className="text-[13px] text-gray-500 font-medium">Create and manage customer invoices.</p>
        </div>
        
        {message && (
          <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-[13px] font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} strokeWidth={2.5} /> : <XCircle size={16} strokeWidth={2.5} />}
            {message.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Search & Cart */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Search Box */}
          <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] relative group">
            <h2 className="text-[15px] font-extrabold text-[#11327c] mb-4 flex items-center gap-2">
              <Search size={18} className="text-[#11327c]" strokeWidth={2.5} />
              Add Medicines
            </h2>
            <div className="relative">
              <input
                className="w-full bg-white border border-gray-300 shadow-sm pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] transition-all text-gray-800 placeholder:text-gray-400 font-medium shadow-sm"
                placeholder="Scan Barcode or Search by name, brand, batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleBarcodeScan}
                autoFocus
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" strokeWidth={2} />
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
              {medicines.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] z-20 max-h-80 overflow-y-auto p-2"
                >
                  {medicines.map((med, index) => (
                    <motion.button
                      key={med._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => addToCart(med)}
                      className="w-full flex justify-between items-center p-3.5 hover:bg-[#f8fafc] text-left transition-colors rounded-xl border-b border-gray-50 last:border-0 group/item"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-[#11327c] text-sm group-hover/item:text-[#11327c] transition-colors">{med.name}</div>
                        {med.composition && (
                          <div className="text-[11px] text-gray-500 font-medium truncate max-w-sm mt-0.5">{med.composition}</div>
                        )}
                        <div className="text-[11px] text-gray-400 font-bold flex flex-wrap gap-x-3 gap-y-1 mt-1.5 uppercase tracking-tight">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Rack: {med.rackNumber || 'N/A'}</span>
                          <span className={med.stock < 10 ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded' : 'text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded'}>
                            Stock: {
                              med.tabletsPerStrip > 1 
                              ? (() => {
                                  const totalTabs = Math.round((med.stock || 0) * med.tabletsPerStrip);
                                  const strips = Math.floor(totalTabs / med.tabletsPerStrip);
                                  const tabs = totalTabs % med.tabletsPerStrip;
                                  if (strips > 0 && tabs > 0) return `${strips} Strips, ${tabs} Tabs`;
                                  if (strips > 0) return `${strips} Strips`;
                                  if (tabs > 0) return `${tabs} Tabs`;
                                  return `0 Strips`;
                                })()
                              : `${Math.round(med.stock || 0)} Units`
                            }
                          </span>
                          <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600">Batch: {med.batchNumber || 'N/A'}</span>
                          <span className="bg-amber-50 px-1.5 py-0.5 rounded text-amber-700">MRP: ₹{(med.sellingPricePerStrip || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="w-9 h-9 flex items-center justify-center bg-[#f0f2ff] text-[#11327c] rounded-lg group-hover/item:bg-[#11327c] group-hover/item:text-white transition-all shadow-sm">
                        <Plus size={18} strokeWidth={3} />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Table View */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-[#f8fafc]/50 flex items-center justify-between">
              <h3 className="text-[15px] font-extrabold text-[#11327c] flex items-center gap-2">
                <ShoppingCart size={18} strokeWidth={2.5} />
                Selected Medicines
                <span className="ml-2 bg-[#11327c]/10 text-[#11327c] text-[11px] font-black px-2 py-0.5 rounded-full">{cart.length} items</span>
              </h3>
              {cart.length > 0 && (
                <button 
                  onClick={() => { setCart([]); localStorage.removeItem('medishop_cart'); }}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                  Clear Cart
                </button>
              )}
            </div>
            
            <div className="p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                  <ShoppingCart size={48} strokeWidth={1} className="text-gray-400 mb-3" />
                  <p className="text-gray-500 font-bold text-sm tracking-tight">Your cart is empty</p>
                  <p className="text-[11px] text-gray-400 font-medium">Search items to start billing</p>
                </div>
              ) : (
                <AnimatePresence>
                  {cart.map((item) => {
                    const isMulti = item.tabletsPerStrip > 1;
                    return (
                      <motion.div 
                        key={item.medicineId} 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative p-5 rounded-2xl border border-gray-100 bg-white hover:border-[#11327c]/20 transition-all shadow-sm hover:shadow-md flex flex-col gap-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                              <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center">
                                <Pill size={24} className="text-blue-600 -rotate-45" strokeWidth={2} />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="font-black text-[#11327c] text-[20px] flex items-center gap-3 tracking-tight leading-none pt-1">
                                {item.name}
                                {item.stock < 10 && (
                                  <span className="px-2 py-0.5 rounded text-rose-500 bg-rose-50 border border-rose-100 text-[10px] font-black uppercase tracking-wider">
                                    Low Stock
                                  </span>
                                )}
                              </div>
                              <div className="text-[13px] text-gray-500 font-medium">
                                {item.composition || `${item.name} Tablets`}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold uppercase tracking-tight text-gray-400 mt-1">
                                <span>Batch: <span className="text-[#11327c]">{item.batchNumber}</span></span>
                                <span className="opacity-30">|</span>
                                <span>Exp: <span className="text-[#11327c]">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "-"}</span></span>
                                <span className="opacity-30">|</span>
                                <span>Stock: <span className={item.stock < 10 ? "text-rose-500" : "text-gray-600"}>
                                  {
                                    item.tabletsPerStrip > 1 
                                    ? (() => {
                                        const totalTabs = Math.round((item.stock || 0) * item.tabletsPerStrip);
                                        const strips = Math.floor(totalTabs / item.tabletsPerStrip);
                                        const tabs = totalTabs % item.tabletsPerStrip;
                                        if (strips > 0 && tabs > 0) return `${strips} Strips, ${tabs} Tabs`;
                                        if (strips > 0) return `${strips} Strips`;
                                        if (tabs > 0) return `${tabs} Tabs`;
                                        return `0 Strips`;
                                      })()
                                    : `${Math.round(item.stock || 0)} Units`
                                  }
                                </span></span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.medicineId)}
                            className="w-11 h-11 flex items-center justify-center text-rose-400 border border-gray-100 rounded-xl hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shrink-0"
                          >
                            <Trash2 size={20} strokeWidth={2} />
                          </button>
                        </div>
                        
                        <div className={`grid grid-cols-1 gap-4 mt-2 ${isMulti ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                          {/* Strip Input */}
                          <div className="flex flex-col p-4 rounded-xl bg-blue-50/30 border border-gray-100 hover:border-blue-200 transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[12px] font-black text-[#11327c] uppercase tracking-widest">
                                  {isMulti ? "Strips" : "Quantity"}
                                </span>
                              </div>
                              <span className="text-[15px] font-black text-[#11327c]">₹{((item.stripQty || 0) * (item.stripSellingPrice || 0)).toFixed(2)}</span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                                <button 
                                  onClick={() => updateItem(item.medicineId, "stripQty", Math.max(0, (item.stripQty || 0) - 1))}
                                  className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-12 bg-transparent text-[14px] font-bold text-center focus:outline-none text-gray-900 appearance-none"
                                  value={item.stripQty === 0 ? '' : item.stripQty}
                                  onChange={(e) => updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)}
                                />
                                <button 
                                  onClick={() => updateItem(item.medicineId, "stripQty", (item.stripQty || 0) + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                  <Plus size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                              <span className="text-[12px] font-bold text-gray-500">MRP: ₹{item.stripSellingPrice}</span>
                            </div>
                            
                            <div className="h-px w-full border-b border-dashed border-gray-200 mb-3" />
                            
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 text-gray-500">
                                  <Tag size={14} className="text-blue-500" strokeWidth={2} />
                                  <span className="text-[12px] font-semibold">{isMulti ? "Per Strip" : "Per Unit"}</span>
                               </div>
                               <span className="text-[13px] font-black text-blue-700">₹{item.stripSellingPrice}</span>
                            </div>
                          </div>
                          
                          {/* Tablet Input */}
                          {isMulti && (
                            <div className="flex flex-col p-4 rounded-xl bg-emerald-50/30 border border-gray-100 hover:border-emerald-200 transition-all">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="text-[12px] font-black text-emerald-700 uppercase tracking-widest">Tablets</span>
                                </div>
                                <span className="text-[15px] font-black text-emerald-700">₹{((item.tabletQty || 0) * (item.tabletSellingPrice || 0)).toFixed(2)}</span>
                              </div>
                              
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                                  <button 
                                    onClick={() => updateItem(item.medicineId, "tabletQty", Math.max(0, (item.tabletQty || 0) - 1))}
                                    className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                  >
                                    <Minus size={16} strokeWidth={2.5} />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-12 bg-transparent text-[14px] font-bold text-center focus:outline-none text-gray-900 appearance-none"
                                    value={item.tabletQty === 0 ? '' : item.tabletQty}
                                    onChange={(e) => updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)}
                                  />
                                  <button 
                                    onClick={() => updateItem(item.medicineId, "tabletQty", (item.tabletQty || 0) + 1)}
                                    className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                </div>
                                <span className="text-[12px] font-bold text-gray-500">MRP: ₹{item.tabletSellingPrice}</span>
                              </div>
                              
                              <div className="h-px w-full border-b border-dashed border-gray-200 mb-3" />
                              
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-gray-500">
                                    <Tag size={14} className="text-emerald-500" strokeWidth={2} />
                                    <span className="text-[12px] font-semibold">Per Tablet</span>
                                 </div>
                                 <span className="text-[13px] font-black text-emerald-700">₹{item.tabletSellingPrice}</span>
                              </div>
                            </div>
                          )}

                          {/* Discount Input */}
                          <div className="flex flex-col p-4 rounded-xl bg-orange-50/30 border border-gray-100 hover:border-orange-200 transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-[12px] font-black text-orange-600 uppercase tracking-widest">Discount</span>
                              </div>
                              <span className="text-[15px] font-black text-orange-600">
                                -₹{(((item.stripQty || 0) * (item.stripSellingPrice || 0) + (item.tabletQty || 0) * (item.tabletSellingPrice || 0)) * ((item.discountPercent || 0) / 100)).toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-16 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[14px] font-bold focus:ring-2 focus:ring-orange-500/10 outline-none text-gray-900 shadow-sm"
                                  value={item.discountPercent === 0 ? '' : item.discountPercent}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value)));
                                    updateItem(item.medicineId, "discountPercent", val);
                                  }}
                                />
                                <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[13px] font-bold text-gray-600 shadow-sm flex items-center gap-2">
                                   % <span className="text-[8px] opacity-50">▼</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="h-px w-full border-b border-dashed border-gray-200 mb-3" />
                            
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2 text-gray-500">
                                  <Tag size={14} className="text-orange-500" strokeWidth={2} />
                                  <span className="text-[12px] font-semibold">Amount</span>
                               </div>
                               <span className="text-[13px] font-black text-orange-600">
                                 -₹{(((item.stripQty || 0) * (item.stripSellingPrice || 0) + (item.tabletQty || 0) * (item.tabletSellingPrice || 0)) * ((item.discountPercent || 0) / 100)).toFixed(2)}
                               </span>
                            </div>
                          </div>
                        </div>
                  </motion.div>
                );
              })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Patient Details Card */}
          <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-[0_4px_20_rgba(0,0,0,0.06)]">
            <h3 className="text-[15px] font-extrabold text-[#11327c] mb-5 flex items-center gap-2">
              <Users size={18} strokeWidth={2.5} className="text-[#11327c]" />
              Customer Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Patient Name</label>
                <input
                  className="w-full bg-white border border-gray-300 shadow-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] transition-all text-[13px] font-bold text-gray-900"
                  placeholder="Full Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Doctor Name</label>
                <input
                  className="w-full bg-white border border-gray-300 shadow-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] transition-all text-[13px] font-bold text-gray-900"
                  placeholder="Dr. Name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input
                  className="w-full bg-white border border-gray-300 shadow-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] transition-all text-[13px] font-bold text-gray-900"
                  placeholder="10-digit number"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Patient Address</label>
                <input
                  className="w-full bg-white border border-gray-300 shadow-sm px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#11327c]/10 focus:border-[#11327c] transition-all text-[13px] font-bold text-gray-900"
                  placeholder="Patient Address"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                />
              </div>
              
              {regularMedicines.length > 0 && (
                 <button 
                   onClick={loadRegularMedicines}
                   disabled={loading}
                   className="w-full mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                 >
                    <Package size={16} strokeWidth={2.5} />
                    Active Prescriptions ({regularMedicines.length})
                 </button>
              )}
            </div>
          </div>

          {/* Bill Summary Card */}
          <div className="bg-[#052b82] p-7 rounded-[20px] shadow-[0_20px_50px_-15px_rgba(5,43,130,0.4)] text-white relative flex flex-col justify-between">
            <div>
              <h3 className="text-[16px] font-black tracking-wide mb-6 flex items-center gap-2">
                <Receipt size={20} strokeWidth={2.5} />
                Invoice Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-[13px] font-bold opacity-90">
                  <span>Sub Total</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-[13px] font-bold opacity-90">
                  <span>Weighted Discount (%)</span>
                  <span className="tabular-nums">{(subTotal > 0 ? (discountAmount / subTotal) * 100 : 0).toFixed(1)}%</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[13px] font-bold text-rose-300">
                    <span>Discount Savings</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="h-px w-full border-b border-dashed border-white/20 my-4" />

                {/* GST Section */}
                <div className="flex justify-between items-center pb-2">
                   <div className="flex items-center gap-2">
                      <label className="text-[13px] font-bold opacity-90 cursor-pointer select-none" htmlFor="gstToggle">Apply GST (Item-wise)</label>
                      <Info size={14} className="opacity-60" strokeWidth={2.5} />
                   </div>
                   <div 
                    onClick={() => setGstEnabled(!gstEnabled)}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer flex items-center p-1 ${gstEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-sm ${gstEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                   </div>
                </div>

                {gstEnabled && (
                  <div className="flex justify-between text-[13px] font-bold text-emerald-300 pb-2">
                      <span>GST Amount</span>
                      <span>+₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                {roundingAdjustment !== 0 && (
                  <div className={`flex justify-between text-[13px] font-bold pb-2 ${roundingAdjustment < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      <span>Rounding</span>
                      <span>{roundingAdjustment < 0 ? '-' : '+'}₹{Math.abs(roundingAdjustment).toFixed(2)}</span>
                  </div>
                )}

                <div className="h-px w-full border-b border-dashed border-white/20 mb-4 mt-2" />

                {/* Payment Mode Selector */}
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] opacity-80">Payment Method</span>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Cash")}
                      className={`py-3 rounded-2xl text-[12px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === "Cash"
                          ? "bg-white text-[#052b82] shadow-md"
                          : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
                      }`}
                    >
                      <Banknote size={16} strokeWidth={paymentMethod === "Cash" ? 3 : 2} />
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`py-3 rounded-2xl text-[12px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === "UPI"
                          ? "bg-white text-[#052b82] shadow-md"
                          : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
                      }`}
                    >
                      <Send size={16} strokeWidth={paymentMethod === "UPI" ? 3 : 2} className={paymentMethod === "UPI" ? "" : "-rotate-45"} />
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("Card")}
                      className={`py-3 rounded-2xl text-[12px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        paymentMethod === "Card"
                          ? "bg-white text-[#052b82] shadow-md"
                          : "bg-white/10 text-white border border-white/10 hover:bg-white/20"
                      }`}
                    >
                      <CreditCard size={16} strokeWidth={paymentMethod === "Card" ? 3 : 2} />
                      Card
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="h-px w-full border-b border-dashed border-white/20 mb-6" />
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-[14px] font-black uppercase tracking-widest opacity-90">Grand Total</span>
                <span className="text-[36px] font-black leading-none tracking-tight">₹{grandTotal.toFixed(2)}</span>
              </div>

              <button
                disabled={loading || cart.length === 0}
                onClick={submitBill}
                className="w-full bg-[#10b981] text-white py-4 rounded-[14px] font-black text-[14px] shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:bg-[#059669] hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? "GENERATING..." : (
                  <>
                    <FileText size={18} strokeWidth={2.5} />
                    FINALIZE BILL
                  </>
                )}
              </button>
              
              {cart.length > 0 && (
                <div className="mt-4 flex gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/40 justify-center">
                  <AlertCircle size={12} strokeWidth={3} />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#11327c]/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-[0_30px_70px_-15px_rgba(17,50,124,0.3)] w-full max-w-[400px] overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
                  <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2.5} />
                </div>
                <h3 className="text-[22px] font-black text-[#11327c] mb-2 tracking-tight">Success!</h3>
                <p className="text-gray-500 font-bold text-[14px] mb-8">
                  Your bill has been generated successfully and saved to your records.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      if (generatedBillId) {
                        window.open(`/print/${generatedBillId}`, '_blank');
                      }
                    }}
                    className="w-full bg-[#11327c] text-white py-4 rounded-2xl font-black text-[14px] shadow-lg shadow-[#11327c]/20 hover:bg-[#1e4db7] transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={18} strokeWidth={2.5} />
                    PRINT INVOICE
                  </button>
                  <button 
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full bg-gray-50 text-gray-500 py-4 rounded-2xl font-black text-[14px] hover:bg-gray-100 transition-all"
                  >
                    OK, GOT IT
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

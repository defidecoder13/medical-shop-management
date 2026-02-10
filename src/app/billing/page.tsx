
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
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
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
        const res = await fetch('/api/auth/check');
        if (!res.ok) router.push('/login');
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

          const res = await fetch(`/api/inventory/${addId}`);
          if (res.ok) {
            const med = await res.json();
            
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
    if (!search) {
      setMedicines([]);
      return;
    }
    fetch(`/api/inventory?q=${search}`)
      .then((res) => res.json())
      .then(setMedicines);
  }, [search]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
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
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          printInvoice: false, // Never print from here
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setMessage({text: data.error || "Billing failed", type: "error"});
      } else {
        setCart([]);
        localStorage.removeItem('medishop_cart');
        setSearch("");
        setDiscountPercent("");
        // Success popup logic - using the existing message state for now, 
        // user requested "success poppup", the current implementation uses a top-right toast-like message.
        // I will stick to the existing message system but ensure the text matches the request.
        setMessage({text: "Bill generated successfully", type: "success"});
      }
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setLoading(false);
      setMessage({text: "An unexpected error occurred", type: "error"});
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
                placeholder="Search by name, brand or batch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            </div>

            {/* Results Dropdown */}
            {medicines.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                {medicines.map((med) => (
                  <button
                    key={med._id}
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
                  </button>
                ))}
              </div>
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
                cart.map((item) => (
                  <div key={item.medicineId} className="p-4 rounded-lg border border-border bg-secondary/20 hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-foreground text-sm">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-[10px] text-muted-foreground bg-secondary/50 border border-border px-1.5 py-0.5 rounded">
                            Stock: {item.stock}
                          </div>
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded">
                            <Package size={10} />
                            Rack: {item.rackNumber || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.medicineId)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Strip */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-muted-foreground w-8">STRIP</label>
                        <div className="flex-1 flex shadow-sm rounded-md overflow-hidden border border-border">
                          <input
                            type="number"
                            placeholder="Qty"
                            className="flex-1 bg-background px-2 py-1 text-xs border-r border-border outline-none text-center text-foreground font-medium focus:bg-accent/50 transition-colors"
                            value={item.stripQty || ''}
                            onChange={(e) => updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)}
                          />
                          <div className="flex-1 bg-secondary px-2 py-1 text-xs outline-none text-muted-foreground flex items-center justify-center">
                            MRP: ₹{item.stripSellingPrice}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tablet */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-muted-foreground w-8">TAB</label>
                        <div className="flex-1 flex shadow-sm rounded-md overflow-hidden border border-border">
                          <input
                            type="number"
                            placeholder="Qty"
                            className="flex-1 bg-background px-2 py-1 text-xs border-r border-border outline-none text-center text-foreground font-medium focus:bg-accent/50 transition-colors"
                            value={item.tabletQty || ''}
                            onChange={(e) => updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)}
                          />
                          <div className="flex-1 bg-secondary px-2 py-1 text-xs outline-none text-muted-foreground flex items-center justify-center">
                            MRP: ₹{item.tabletSellingPrice}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
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

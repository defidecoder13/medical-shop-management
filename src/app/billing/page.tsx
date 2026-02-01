"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Calculator, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight, 
  Package,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  ChevronLeft,
  Info
} from "lucide-react";
import Link from "next/link";

type Medicine = {
  _id: string;
  name: string;
  batchNumber: string;
  stock: number;
};

type CartItem = {
  medicineId: string;
  name: string;
  batchNumber: string;
  stripQty: number;
  tabletQty: number;
  stripSellingPrice: number | "";
  tabletSellingPrice: number | "";
};

export default function BillingPage() {
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

  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  // Real-time calculation states
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);

  useEffect(() => {
    if (!search) {
      setMedicines([]);
      return;
    }

    fetch(`/api/inventory?q=${search}`)
      .then((res) => res.json())
      .then(setMedicines);
  }, [search]);

  // Fetch GST settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          setGstEnabled(settings.gstEnabled || false);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setGstEnabled(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Calculate totals in real-time
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
    const gstAmount = gstEnabled ? totalAfterDiscount * 0.05 : 0;
    const finalTotal = totalAfterDiscount + gstAmount;
    const roundedFinalTotal = Math.round(finalTotal * 100) / 100;
    
    setGrandTotal(roundedFinalTotal);
  }, [cart, discountPercent, gstEnabled]);

  const addToCart = (med: Medicine) => {
    if (cart.find((c) => c.medicineId === med._id)) {
      setMessage({ text: `${med.name} is already in the cart`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setCart([
      ...cart,
      {
        medicineId: med._id,
        name: med.name,
        batchNumber: med.batchNumber,
        stripQty: 0,
        tabletQty: 0,
        stripSellingPrice: "",
        tabletSellingPrice: "",
      },
    ]);
    setSearch(""); // Clear search after adding
  };

  const updateItem = (id: string, field: keyof CartItem, value: any) => {
    setCart(
      cart.map((item) =>
        item.medicineId === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.medicineId !== id));
  };

  const submitBill = async (print: boolean) => {
    if (cart.length === 0) return;

    if (
      cart.some(
        (i) =>
          (typeof i.stripSellingPrice === 'number' && i.stripSellingPrice > 0 && i.stripQty > 0) ||
          (typeof i.tabletSellingPrice === 'number' && i.tabletSellingPrice > 0 && i.tabletQty > 0)
          ? false 
          : !(typeof i.stripSellingPrice === 'number' && i.stripSellingPrice > 0 && i.stripQty > 0) &&
            !(typeof i.tabletSellingPrice === 'number' && i.tabletSellingPrice > 0 && i.tabletQty > 0)
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
            if (c.stripQty > 0 && typeof c.stripSellingPrice === 'number' && c.stripSellingPrice > 0) {
              items.push({
                medicineId: c.medicineId,
                unitType: 'strip',
                qty: c.stripQty,
                sellingPrice: c.stripSellingPrice,
              });
            }
            if (c.tabletQty > 0 && typeof c.tabletSellingPrice === 'number' && c.tabletSellingPrice > 0) {
              items.push({
                medicineId: c.medicineId,
                unitType: 'tablet',
                qty: c.tabletQty,
                sellingPrice: c.tabletSellingPrice,
              });
            }
            return items;
          }),
          discountPercent: dp,
          printInvoice: print,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setMessage({text: data.error || "Billing failed", type: "error"});
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      setCart([]);
      setSearch("");
      setDiscountPercent("");

      if (print) {
        router.push(`/print/${data._id}`);
        setMessage({text: "✅ Bill created and printed successfully", type: "success"});
      } else {
        setMessage({text: "✅ Bill saved successfully", type: "success"});
      }
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setLoading(false);
      setMessage({text: "An unexpected error occurred", type: "error"});
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 bg-white dark:bg-gray-900 rounded-xl glass-card border border-gray-100 dark:border-gray-800 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ShoppingCart className="text-blue-600 w-8 h-8" />
                Billing System
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage customer invoices</p>
            </div>
          </div>
          
          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' 
                : 'bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/30'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Search & Selection */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Search Glass Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Search className="w-32 h-32" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Add Medicines
              </h2>
              <div className="relative">
                <input
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 px-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg"
                  placeholder="Search by name, brand or batch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>

              {/* Search Results */}
              {medicines.length > 0 && (
                <div className="mt-4 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-50 dark:divide-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                  {medicines.map((med) => (
                    <div
                      key={med._id}
                      className="flex justify-between items-center p-4 bg-white/30 dark:bg-gray-900/30 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{med.name}</div>
                        <div className="flex gap-4 mt-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            Batch: {med.batchNumber}
                          </span>
                          <span className={`text-xs flex items-center gap-1 ${med.stock < 10 ? 'text-rose-500 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            <Package className="w-3 h-3" />
                            Stock: {med.stock} strips
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(med)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        title="Add to Cart"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-xl min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Cart Items ({cart.length})
                </h2>
                {cart.length > 0 && (
                  <button 
                    onClick={() => setCart([])}
                    className="text-sm text-gray-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                  <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Search and add medicines to start billing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.medicineId} className="group relative glass-card p-5 border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-bold uppercase tracking-wider">Batch: {item.batchNumber}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* Strip Group */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Strip</label>
                            <div className="flex shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                              <input
                                type="number"
                                placeholder="Qty"
                                className="w-14 bg-gray-50/50 dark:bg-gray-800/50 px-2 py-2 text-sm focus:outline-none"
                                value={item.stripQty || ''}
                                onChange={(e) => updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)}
                              />
                              <input
                                type="number"
                                placeholder="Price"
                                className="w-20 bg-white dark:bg-gray-900 px-2 py-2 text-sm border-l border-gray-200 dark:border-gray-800 focus:outline-none focus:bg-blue-50/30 dark:focus:bg-blue-900/20"
                                value={item.stripSellingPrice}
                                onChange={(e) => updateItem(item.medicineId, "stripSellingPrice", e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </div>
                          </div>
                          
                          {/* Tablet Group */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Tablet</label>
                            <div className="flex shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                              <input
                                type="number"
                                placeholder="Qty"
                                className="w-14 bg-gray-50/50 dark:bg-gray-800/50 px-2 py-2 text-sm focus:outline-none"
                                value={item.tabletQty || ''}
                                onChange={(e) => updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)}
                              />
                              <input
                                type="number"
                                placeholder="Price"
                                className="w-20 bg-white dark:bg-gray-900 px-2 py-2 text-sm border-l border-gray-200 dark:border-gray-800 focus:outline-none focus:bg-blue-50/30 dark:focus:bg-blue-900/20"
                                value={item.tabletSellingPrice}
                                onChange={(e) => updateItem(item.medicineId, "tabletSellingPrice", e.target.value === "" ? "" : Number(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.medicineId)}
                          className="self-center p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calculations & Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              
              {/* Summary Card */}
              <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-black">
                <div className="absolute -top-12 -right-12 p-8 opacity-5 pointer-events-none rotate-12">
                  <Calculator className="w-48 h-48" />
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                  <Calculator className="text-blue-600" />
                  Bill Summary
                </h2>

                <div className="space-y-5">
                  <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-sm">Sub Total</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {/* Discount Input */}
                  <div className="flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">Discount</span>
                      <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden h-8">
                         <input
                          type="number"
                          placeholder="0"
                          className="w-12 bg-transparent text-center text-xs font-bold focus:outline-none"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                        <span className="bg-gray-100 dark:bg-gray-800 px-1.5 text-[10px] font-bold">%</span>
                      </div>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {gstEnabled && (
                    <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-sm">GST (5%)</span>
                      <span className="font-bold text-gray-900 dark:text-white">₹{((subTotal - discountAmount) * 0.05 > 0 ? ((subTotal - discountAmount) * 0.05).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00')}</span>
                    </div>
                  )}

                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent my-6"></div>

                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                       <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest">Total Amount</span>
                       <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                         <Info className="w-3 h-3" />
                         Final price including taxes
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                         ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-3">
                  <button
                    disabled={loading || cart.length === 0}
                    onClick={() => submitBill(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Print & Save Invoice
                      </>
                    )}
                  </button>

                  <button
                    disabled={loading || cart.length === 0}
                    onClick={() => submitBill(false)}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-5 h-5" />
                    Save Without Printing
                  </button>
                </div>
                
                {cart.length > 0 && (
                  <div className="mt-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30">
                    <div className="flex gap-3 text-xs text-blue-800 dark:text-blue-300">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>Please double-check quantities and prices before finalizing the bill. This action will update inventory stock.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        // Default to false if there's an error
        setGstEnabled(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Calculate totals in real-time
  useEffect(() => {
    // Calculate subTotal
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
    
    // Calculate discount (preserve decimals)
    const dp = discountPercent === "" ? 0 : Number(discountPercent);
    const calculatedDiscount = calculatedSubTotal * (dp / 100);
    const roundedDiscount = Math.round(calculatedDiscount * 100) / 100;
    setDiscountAmount(roundedDiscount);
    
    // Calculate grand total (after discount)
    const totalAfterDiscount = calculatedSubTotal - calculatedDiscount;
    
    // Calculate GST if enabled
    const gstAmount = gstEnabled ? totalAfterDiscount * 0.05 : 0;
    const roundedGstAmount = Math.round(gstAmount * 100) / 100;
    const finalTotal = totalAfterDiscount + gstAmount;
    const roundedFinalTotal = Math.round(finalTotal * 100) / 100;
    
    setGrandTotal(roundedFinalTotal);
  }, [cart, discountPercent, gstEnabled]);

  const addToCart = (med: Medicine) => {
    if (cart.find((c) => c.medicineId === med._id)) return;

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
      // At least one of strip or tablet should have valid quantity and price
      ? false // If either is valid, return false (no error)
      : !(typeof i.stripSellingPrice === 'number' && i.stripSellingPrice > 0 && i.stripQty > 0) &&
        !(typeof i.tabletSellingPrice === 'number' && i.tabletSellingPrice > 0 && i.tabletQty > 0) // Both are invalid
  )
) {
  setMessage({text: "Enter valid quantity and price for all items", type: "error"});
  // Clear error message after 3 seconds
  setTimeout(() => {
    setMessage(null);
  }, 3000);
  return;
}

    const dp = discountPercent === "" ? 0 : Number(discountPercent);

    setLoading(true);

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
      // Clear error message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
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
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>
      
      {/* Message Display */}
      {message && (
        <div 
          className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {message.text}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          className="w-full border px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Search medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="absolute right-3 top-3 text-gray-400">
          🔍
        </div>
      </div>

      {/* Search Results */}
      {medicines.length > 0 && (
        <div className="border rounded">
          {medicines.map((med) => (
            <div
              key={med._id}
              className="flex justify-between items-center p-3 border-b"
            >
              <div>
                <div className="font-medium">{med.name}</div>
                <div className="text-sm text-gray-500">
                  Stock: {med.stock} strips
                </div>
              </div>
              <button
                onClick={() => addToCart(med)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bill Items */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="font-semibold text-lg">Bill Items</h2>

        {cart.map((item) => (
          <div key={item.medicineId} className="flex items-start gap-6">
            <div className="flex-1">
              <div>{item.name}</div>
              <div className="text-sm text-gray-500">
                Batch: {item.batchNumber}
              </div>
            </div>
            
            {/* Strip Group */}
            <div className="border rounded-lg p-2 min-w-[140px]">
              <div className="text-xs font-medium text-gray-700 mb-1">Strip</div>
              <div className="flex gap-2">
                <div className="flex flex-col text-xs">
                  <span className="text-gray-500">Qty</span>
                  <input
                    type="number"
                    min="0"
                    className="w-16 border px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={item.stripQty || ''}
                    onChange={(e) =>
                      updateItem(item.medicineId, "stripQty", Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex flex-col text-xs">
                  <span className="text-gray-500">Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-20 border px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={item.stripSellingPrice}
                    onChange={(e) =>
                      updateItem(
                        item.medicineId,
                        "stripSellingPrice",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>
            
            {/* Tablet Group */}
            <div className="border rounded-lg p-2 min-w-[140px]">
              <div className="text-xs font-medium text-gray-700 mb-1">Tablet</div>
              <div className="flex gap-2">
                <div className="flex flex-col text-xs">
                  <span className="text-gray-500">Qty</span>
                  <input
                    type="number"
                    min="0"
                    className="w-16 border px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={item.tabletQty || ''}
                    onChange={(e) =>
                      updateItem(item.medicineId, "tabletQty", Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex flex-col text-xs">
                  <span className="text-gray-500">Price</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-20 border px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={item.tabletSellingPrice}
                    onChange={(e) =>
                      updateItem(
                        item.medicineId,
                        "tabletSellingPrice",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={() => removeItem(item.medicineId)}
              className="text-red-600 text-xl hover:text-red-800 transition-colors duration-200 mt-3"
            >
              ×
            </button>
          </div>
        ))}

        {/* Discount */}
        <div className="flex flex-col text-sm">
          <span className="text-gray-600 mb-1">Discount %</span>
          <input
            type="number"
            placeholder="0"
            className="w-32 border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={discountPercent}
            onChange={(e) =>
              setDiscountPercent(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          />
        </div>
        
        {/* Real-time Totals */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-sm">
            <span className="text-gray-600">Sub Total:</span>
            <div className="font-semibold">₹{subTotal.toFixed(2)}</div>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Discount Amount:</span>
            <div className="font-semibold">-₹{discountAmount.toFixed(2)}</div>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Total After Discount:</span>
            <div className="font-semibold text-blue-600">₹{(subTotal - discountAmount).toFixed(2)}</div>
          </div>
          {gstEnabled && (
            <div className="text-sm">
              <span className="text-gray-600">GST (5%):</span>
              <div className="font-semibold">₹{((subTotal - discountAmount) * 0.05 > 0 ? ((subTotal - discountAmount) * 0.05).toFixed(2) : '0.00')}</div>
            </div>
          )}
          <div className="text-sm col-span-2">
            <span className="text-gray-600">Final Total:</span>
            <div className="font-semibold text-lg text-green-600">₹{grandTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            disabled={loading}
            onClick={() => submitBill(false)}
            className={`flex-1 py-3 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : 'Create Bill'}
          </button>

          <button
            disabled={loading}
            onClick={() => submitBill(true)}
            className={`flex-1 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : 'Print Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}

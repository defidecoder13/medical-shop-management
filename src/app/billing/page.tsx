"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Medicine = {
  _id: string;
  name: string;
  batchNumber: string;
};

type CartItem = {
  medicineId: string;
  name: string;
  batchNumber: string;
  unitType: "strip" | "tablet";
  qty: number;
  sellingPrice: number | "";
};

export default function BillingPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!search) {
      setMedicines([]);
      return;
    }

    fetch(`/api/inventory?q=${search}`)
      .then((res) => res.json())
      .then(setMedicines);
  }, [search]);

  const addToCart = (med: Medicine) => {
    if (cart.find((c) => c.medicineId === med._id)) return;

    setCart([
      ...cart,
      {
        medicineId: med._id,
        name: med.name,
        batchNumber: med.batchNumber,
        unitType: "strip",
        qty: 1,
        sellingPrice: "",
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
      typeof i.sellingPrice !== "number" ||
      i.sellingPrice <= 0 ||
      i.qty <= 0
  )
) {
  alert("Enter valid quantity and price for all items");
  return;
}

    const dp = discountPercent === "" ? 0 : Number(discountPercent);

    setLoading(true);

    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((c) => ({
          medicineId: c.medicineId,
          unitType: c.unitType,
          qty: c.qty,
          sellingPrice: c.sellingPrice,
        })),
        discountPercent: dp,
        printInvoice: print,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Billing failed");
      return;
    }

    setCart([]);
    setSearch("");
    setDiscountPercent("");

    if (print) {
      router.push(`/print/${data._id}`);
    } else {
      setMessage("✅ Bill saved successfully");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {/* Search */}
      <input
        className="w-full border px-3 py-2 rounded"
        placeholder="Search medicine..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
                  Batch: {med.batchNumber}
                </div>
              </div>
              <button
                onClick={() => addToCart(med)}
                className="bg-black text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bill Items */}
      <div className="border rounded p-4 space-y-4">
        <h2 className="font-semibold">Bill Items</h2>

        {cart.map((item) => (
          <div key={item.medicineId} className="flex items-center gap-3">
            <div className="flex-1">
              <div>{item.name}</div>
              <div className="text-sm text-gray-500">
                Batch: {item.batchNumber}
              </div>
            </div>

            {/* Unit */}
            <select
              className="border px-2 py-2 rounded text-sm"
              value={item.unitType}
              onChange={(e) =>
                updateItem(item.medicineId, "unitType", e.target.value)
              }
            >
              <option value="strip">Strip</option>
              <option value="tablet">Tablet / Capsule</option>
            </select>

            {/* Quantity */}
            <div className="flex flex-col text-xs">
              <span className="text-gray-500">Quantity</span>
              <input
                type="number"
                min={1}
                className="w-20 border px-2 py-2"
                value={item.qty}
                onChange={(e) =>
                  updateItem(item.medicineId, "qty", Number(e.target.value))
                }
              />
            </div>

            {/* Price per quantity */}
            <div className="flex flex-col text-xs">
              <span className="text-gray-500">Price / Qty</span>
              <input
                type="number"
                className="w-24 border px-2 py-2 "
                value={item.sellingPrice}
                onChange={(e) =>
                  updateItem(
                    item.medicineId,
                    "sellingPrice",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>

            <button
              onClick={() => removeItem(item.medicineId)}
              className="text-red-600 text-lg"
            >
              ×
            </button>
          </div>
        ))}

        {/* Discount */}
        <input
          type="number"
          placeholder="Discount %"
          className="w-32 border px-2 py-1 rounded"
          value={discountPercent}
          onChange={(e) =>
            setDiscountPercent(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />

        {/* Actions */}
        <div className="flex gap-4">
          <button
            disabled={loading}
            onClick={() => submitBill(false)}
            className="flex-1 py-2 rounded text-white bg-green-600"
          >
            Create Bill
          </button>

          <button
            disabled={loading}
            onClick={() => submitBill(true)}
            className="flex-1 py-2 rounded text-white bg-blue-600"
          >
            Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}

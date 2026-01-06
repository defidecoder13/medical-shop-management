"use client";

import { useEffect, useState } from "react";

type Medicine = {
  _id?: string;
  name: string;
  brand?: string;
  batchNumber: string;
  expiryDate: string;

  // stock = STRIPS
  stock: number | "";

  // tablets per strip (FIXED value)
  tabletsPerStrip: number | "";

  // derived & returned from backend
  totalTabletsInStock?: number;

  buyingPrice: number | "";
  gstPercent: number;
};

const emptyMedicine: Medicine = {
  name: "",
  brand: "",
  batchNumber: "",
  expiryDate: "",
  stock: "",
  tabletsPerStrip: "",
  buyingPrice: "",
  gstPercent: 5,
};

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [form, setForm] = useState<Medicine>(emptyMedicine);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMedicines = async () => {
    const res = await fetch(`/api/inventory?q=${search}`);
    const data = await res.json();
    setMedicines(data);
  };

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  const handleSubmit = async () => {
    setLoading(true);

    const method = editingId ? "PUT" : "POST";

    const payload = {
      ...form,
      ...(editingId
        ? {}
        : {
            totalTabletsInStock:
              typeof form.stock === "number" &&
              typeof form.tabletsPerStrip === "number"
                ? form.stock * form.tabletsPerStrip
                : 0,
          }),
    };

    const res = await fetch("/api/inventory", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...payload, _id: editingId } : payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Something went wrong");
      return;
    }

    setForm(emptyMedicine);
    setEditingId(null);
    fetchMedicines();
  };

  const handleEdit = (med: Medicine) => {
    setForm({
      ...med,
      expiryDate: med.expiryDate.slice(0, 10),
    });
    setEditingId(med._id!);
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const today = new Date().toISOString().slice(0, 10);

  const isFormValid =
    form.name.trim() !== "" &&
    form.batchNumber.trim() !== "" &&
    form.expiryDate !== "" &&
    form.stock !== "" &&
    form.tabletsPerStrip !== "" &&
    form.buyingPrice !== "";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Inventory Management</h1>

      {/* Add / Edit Form */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="font-semibold">
          {editingId ? "Edit Medicine" : "Add Medicine"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Medicine Name</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Brand</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Batch Number</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={form.batchNumber}
              onChange={(e) =>
                setForm({ ...form, batchNumber: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Expiry Date</label>
            <input
              type="date"
              className="border px-3 py-2 rounded w-full"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({ ...form, expiryDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Stock Quantity (Strips)</label>
            <input
              type="number"
              className="border px-3 py-2 rounded w-full"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Tablet/Capsule (per strip)
            </label>
            <input
              type="number"
              className="border px-3 py-2 rounded w-full"
              value={form.tabletsPerStrip}
              onChange={(e) =>
                setForm({
                  ...form,
                  tabletsPerStrip:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Buying Price (₹)</label>
            <input
              type="number"
              className="border px-3 py-2 rounded w-full"
              value={form.buyingPrice}
              onChange={(e) =>
                setForm({
                  ...form,
                  buyingPrice:
                    e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className={`px-6 py-2 rounded text-white transition ${
            !isFormValid || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"
          }`}
        >
          {loading
            ? "Saving..."
            : editingId
            ? "Update Medicine"
            : "Add Medicine"}
        </button>
      </div>

      {/* Search */}
      <input
        placeholder="Search by name, brand or batch..."
        className="border px-3 py-2 rounded w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Brand</th>
              <th className="border p-2">Batch</th>
              <th className="border p-2">Expiry</th>
              <th className="border p-2 text-center">
                <div className="flex flex-col text-xs">
                  <span>stock/strip</span>
                  <span>tablet/capsule</span>
                </div>
              </th>
              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((med) => (
              <tr
                key={med._id}
                className={
                  isExpired(med.expiryDate)
                    ? "bg-red-100"
                    : typeof med.stock === "number" && med.stock < 10
                    ? "bg-yellow-100"
                    : ""
                }
              >
                <td className="border p-2">{med.name}</td>
                <td className="border p-2 text-gray-600">{today}</td>
                <td className="border p-2">{med.brand}</td>
                <td className="border p-2">{med.batchNumber}</td>
                <td className="border p-2">
                  {med.expiryDate.slice(0, 10)}
                </td>
                <td className="border p-2">
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-gray-600">
                        Stock / Strip
                      </div>
                      <div className="font-medium">{med.stock}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600">
                        Tablet / Capsule
                      </div>
                      <div className="text-gray-800">
                        {med.totalTabletsInStock ?? 0}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleEdit(med)}
                    className="text-blue-600 underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {medicines.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  No medicines found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
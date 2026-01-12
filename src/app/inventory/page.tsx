"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="p-6 max-w-6xl mx-auto space-y-8 dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold dark:text-white">Inventory Management</h1>

      {/* Add / Edit Form */}
      <div className="border rounded-lg p-4 space-y-4 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="font-semibold dark:text-white">
          {editingId ? "Edit Medicine" : "Add Medicine"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 dark:text-white">Medicine Name</label>
            <input
              className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-white">Brand</label>
            <input
              className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-white">Batch Number</label>
            <input
              className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.batchNumber}
              onChange={(e) =>
                setForm({ ...form, batchNumber: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-white">Expiry Date</label>
            <input
              type="date"
              className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={form.expiryDate}
              onChange={(e) =>
                setForm({ ...form, expiryDate: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm mb-1 dark:text-white">Stock Quantity (Strips)</label>
            <input
              type="number"
              className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm mb-1 dark:text-white">
              Tablet/Capsule (per strip)
            </label>
            <input
              type="number"
              className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <label className="block text-sm mb-1 dark:text-white">Buying Price (₹)</label>
            <input
              type="number"
              className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              : "bg-black hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
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
        className="border px-3 py-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
            <tr>
              <th className="border p-2 dark:border-gray-600 dark:text-white">Name</th>
              <th className="border p-2 dark:border-gray-600 dark:text-white">Date</th>
              <th className="border p-2 dark:border-gray-600 dark:text-white">Brand</th>
              <th className="border p-2 dark:border-gray-600 dark:text-white">Batch</th>
              <th className="border p-2 dark:border-gray-600 dark:text-white">Expiry</th>
              <th className="border p-2 text-center dark:border-gray-600 dark:text-white">
                <div className="flex flex-col text-xs">
                  <span>stock/strip</span>
                  <span>tablet/capsule</span>
                </div>
              </th>
              <th className="border p-2 dark:border-gray-600 dark:text-white">Action</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((med) => (
              <tr
                key={med._id}
                className={`dark:bg-gray-800 ${
                  isExpired(med.expiryDate)
                    ? "bg-red-100 dark:bg-red-900/20"
                    : typeof med.stock === "number" && med.stock < 10
                    ? "bg-yellow-100 dark:bg-yellow-900/20"
                    : ""
                }`}
              >
                <td className="border p-2 dark:border-gray-600 dark:text-white">{med.name}</td>
                <td className="border p-2 text-gray-600 dark:border-gray-600 dark:text-gray-300">{today}</td>
                <td className="border p-2 dark:border-gray-600 dark:text-white">{med.brand}</td>
                <td className="border p-2 dark:border-gray-600 dark:text-white">{med.batchNumber}</td>
                <td className="border p-2 dark:border-gray-600 dark:text-white">
                  {med.expiryDate.slice(0, 10)}
                </td>
                <td className="border p-2 dark:border-gray-600 dark:text-white">
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Stock / Strip
                      </div>
                      <div className="font-medium dark:text-white">{med.stock}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Tablet / Capsule
                      </div>
                      <div className="text-gray-800 dark:text-white">
                        {med.totalTabletsInStock ?? 0}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="border p-2 dark:border-gray-600">
                  <button
                    onClick={() => handleEdit(med)}
                    className="text-blue-600 underline dark:text-blue-400"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {medicines.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-4 dark:text-gray-300">
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
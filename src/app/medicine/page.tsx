"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type Medicine = {
  _id: string;
  name: string;
  brand: string;
  batchNumber: string;
  expiryDate: string;
  stockQuantity: number;
  unitType: "strip" | "tablet" | "capsule";
  buyingPrice: number;
  sellingPrice: number;
};

export default function MedicineListPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => {
        setMedicines(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Function to export medicines to Excel
  const exportToExcel = () => {
    if (medicines.length === 0) return;
    
    const formattedMedicines = medicines.map(m => ({
      'Name': m.name,
      'Brand': m.brand,
      'Batch': m.batchNumber,
      'Expiry': new Date(m.expiryDate).toLocaleDateString(),
      'Stock': m.stockQuantity,
      'Unit Type': m.unitType,
      'Buying Price': `₹${m.buyingPrice}`,
      'Selling Price': `₹${m.sellingPrice}`
    }));
    
    const ws = XLSX.utils.json_to_sheet(formattedMedicines);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicines");
    XLSX.writeFile(wb, `Medicines_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Medicine List</h1>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export to Excel
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Brand</th>
                <th className="border p-2">Batch</th>
                <th className="border p-2">Expiry</th>
                <th className="border p-2">Stock</th>
                <th className="border p-2">Unit Type</th>
                <th className="border p-2">Buying Price</th>
                <th className="border p-2">Selling Price</th>
              </tr>
            </thead>

            <tbody>
              {medicines.map((m) => (
                <tr key={m._id}>
                  <td className="border p-2">{m.name}</td>
                  <td className="border p-2">{m.brand}</td>
                  <td className="border p-2">{m.batchNumber}</td>
                  <td className="border p-2">{new Date(m.expiryDate).toLocaleDateString()}</td>
                  <td className="border p-2">{m.stockQuantity}</td>
                  <td className="border p-2 capitalize">{m.unitType}</td>
                  <td className="border p-2">₹{m.buyingPrice}</td>
                  <td className="border p-2">₹{m.sellingPrice}</td>
                </tr>
              ))}

              {medicines.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center">
                    No medicines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
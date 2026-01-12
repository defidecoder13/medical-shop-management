"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
  tabletsPerStrip: number;
  totalTabletsInStock: number;
  buyingPricePerStrip: number;
  gstPercent: number;
}

export default function LowStockPage() {
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

  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStockData = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          // Filter for medicines with stock <= 10 (low stock threshold)
          const lowStockItems = data.filter((med: Medicine) => med.stock <= 10);
          setLowStockMedicines(lowStockItems);
        }
      } catch (error) {
        console.error('Error fetching low stock data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Low Stock Medicines</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold dark:text-white">Low Stock Medicines</h1>

      {/* Summary Card */}
      <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 dark:text-white">
        <h2 className="font-semibold text-lg text-orange-800 dark:text-orange-200 mb-2">Low Stock Summary</h2>
        <p className="text-sm text-orange-600 dark:text-orange-400">Medicines with stock level of 10 or less</p>
        <p className="text-xl font-bold mt-2 dark:text-white">{lowStockMedicines.length} items</p>
      </div>

      {/* Low Stock Medicines Table */}
      <div className="border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-orange-700 dark:text-orange-400">Low Stock Items</h2>
        {lowStockMedicines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
                <tr>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Name</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Brand</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Batch</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Expiry Date</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Stock</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Tablets/Strip</th>
                </tr>
              </thead>
              <tbody>
                {lowStockMedicines.map((med) => (
                  <tr key={med._id} className="bg-orange-50 dark:bg-gray-800">
                    <td className="border p-2 font-medium dark:border-gray-600 dark:text-white">{med.name}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.brand}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.batchNumber}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{new Date(med.expiryDate).toLocaleDateString()}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.stock}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.tabletsPerStrip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4 dark:text-gray-400">No low stock medicines</p>
        )}
      </div>
    </div>
  );
}
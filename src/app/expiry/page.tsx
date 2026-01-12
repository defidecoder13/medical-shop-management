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

export default function ExpiryPage() {
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
  const [expiringSoon, setExpiringSoon] = useState<Medicine[]>([]);
  const [expired, setExpired] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiryData = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setMedicines(data);

          const today = new Date();
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          const expiringSoonList = data.filter((med: Medicine) => {
            const expiryDate = new Date(med.expiryDate);
            return expiryDate >= today && expiryDate <= endOfMonth;
          });

          const expiredList = data.filter((med: Medicine) => {
            const expiryDate = new Date(med.expiryDate);
            return expiryDate < today;
          });

          setExpiringSoon(expiringSoonList);
          setExpired(expiredList);
        }
      } catch (error) {
        console.error('Error fetching expiry data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiryData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Expiry Summary</h1>
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
      <h1 className="text-2xl font-bold dark:text-white">Expiry Summary</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <h2 className="font-semibold text-lg text-yellow-800 dark:text-yellow-200 mb-2">Expiring Soon ({expiringSoon.length})</h2>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Medicines expiring within this month</p>
        </div>
        
        <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <h2 className="font-semibold text-lg text-red-800 dark:text-red-200 mb-2">Expired ({expired.length})</h2>
          <p className="text-sm text-red-600 dark:text-red-400">Medicines that have passed expiry date</p>
        </div>
      </div>

      {/* Expiring Soon Medicines */}
      <div className="border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-yellow-700 dark:text-yellow-400">Expiring Soon Medicines</h2>
        {expiringSoon.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
                <tr>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Name</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Brand</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Batch</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Expiry Date</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Stock</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoon.map((med) => (
                  <tr key={med._id} className="bg-yellow-50 dark:bg-gray-800">
                    <td className="border p-2 font-medium dark:border-gray-600 dark:text-white">{med.name}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.brand}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.batchNumber}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{new Date(med.expiryDate).toLocaleDateString()}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4 dark:text-gray-400">No medicines expiring soon</p>
        )}
      </div>

      {/* Expired Medicines */}
      <div className="border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-red-700 dark:text-red-400">Expired Medicines</h2>
        {expired.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
                <tr>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Name</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Brand</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Batch</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Expiry Date</th>
                  <th className="border p-2 dark:border-gray-600 dark:text-white">Stock</th>
                </tr>
              </thead>
              <tbody>
                {expired.map((med) => (
                  <tr key={med._id} className="bg-red-50 dark:bg-gray-800">
                    <td className="border p-2 font-medium dark:border-gray-600 dark:text-white">{med.name}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.brand}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.batchNumber}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{new Date(med.expiryDate).toLocaleDateString()}</td>
                    <td className="border p-2 dark:border-gray-600 dark:text-white">{med.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4 dark:text-gray-400">No expired medicines</p>
        )}
      </div>
    </div>
  );
}
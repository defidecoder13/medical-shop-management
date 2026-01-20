"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TransactionDetailsPage() {
  const params = useParams();
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

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/transactions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setBill(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6 text-gray-800 dark:text-white">Loading...</p>;
  if (!bill || bill.error)
    return <p className="p-6 text-gray-800 dark:text-white">Transaction not found</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-blue-600 underline dark:text-blue-400"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => window.open(`/print/${id}`, '_blank')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Print Invoice
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transaction Details</h1>

      <div className="border rounded p-4 space-y-2 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-800 dark:text-white"><b className="dark:text-white">Date:</b> {new Date(bill.createdAt).toLocaleString()}</p>
        <p className="text-gray-800 dark:text-white"><b className="dark:text-white">Subtotal:</b> ₹{bill.subTotal}</p>
        <p className="text-gray-800 dark:text-white"><b className="dark:text-white">GST:</b> ₹{bill.gstAmount}</p>
        <p className="text-gray-800 dark:text-white"><b className="dark:text-white">Total:</b> ₹{bill.grandTotal}</p>
        <p className="text-gray-800 dark:text-white"><b className="dark:text-white">Type:</b> {bill.printInvoice ? "Printed" : "Saved"}</p>
      </div>

      <div className="border rounded p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold mb-2 text-gray-800 dark:text-white">Items</h2>

        {bill.items?.length === 0 ? (
          <p className="text-gray-800 dark:text-white">No items found</p>
        ) : (
          <table className="w-full border text-sm dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700 dark:text-white">
              <tr>
                <th className="border p-2 dark:border-gray-600 dark:text-white">Name</th>
                <th className="border p-2 dark:border-gray-600 dark:text-white">Batch</th>
                <th className="border p-2 dark:border-gray-600 dark:text-white">Unit</th>
                <th className="border p-2 dark:border-gray-600 dark:text-white">Qty</th>
                <th className="border p-2 dark:border-gray-600 dark:text-white">Price</th>
                <th className="border p-2 dark:border-gray-600 dark:text-white">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2 dark:border-gray-600 dark:text-white">{item.name}</td>
                  <td className="border p-2 dark:border-gray-600 dark:text-white">{item.batchNumber}</td>
                  <td className="border p-2 dark:border-gray-600 dark:text-white">{item.unitType}</td>
                  <td className="border p-2 dark:border-gray-600 dark:text-white">{item.qty}</td>
                  <td className="border p-2 dark:border-gray-600 dark:text-white">₹{item.sellingPrice}</td>
                  <td className="border p-2 font-semibold dark:border-gray-600 dark:text-white">
                    ₹{item.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();

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

  if (loading) return <p className="p-6">Loading...</p>;
  if (!bill || bill.error)
    return <p className="p-6">Transaction not found</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-blue-600 underline"
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

      <h1 className="text-2xl font-bold">Transaction Details</h1>

      <div className="border rounded p-4 space-y-2">
        <p><b>Date:</b> {new Date(bill.createdAt).toLocaleString()}</p>
        <p><b>Subtotal:</b> ₹{bill.subTotal}</p>
        <p><b>GST:</b> ₹{bill.gstAmount}</p>
        <p><b>Total:</b> ₹{bill.grandTotal}</p>
        <p><b>Type:</b> {bill.printInvoice ? "Printed" : "Saved"}</p>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Items</h2>

        {bill.items?.length === 0 ? (
          <p>No items found</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Batch</th>
                <th className="border p-2">Unit</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.batchNumber}</td>
                  <td className="border p-2">{item.unitType}</td>
                  <td className="border p-2">{item.qty}</td>
                  <td className="border p-2">₹{item.sellingPrice}</td>
                  <td className="border p-2 font-semibold">
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
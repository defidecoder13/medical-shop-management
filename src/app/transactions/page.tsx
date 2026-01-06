"use client";

import { useEffect, useState } from "react";

type Transaction = {
  _id: string;
  createdAt: string;
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  profit: number;
  gstEnabled: boolean;
  printInvoice?: boolean;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Date</th>
                <th className="border p-2">Bill ID</th>
                <th className="border p-2">Subtotal</th>
                <th className="border p-2">GST</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Type</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td className="border p-2">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>

                  <td className="border p-2 font-mono text-xs">
                    {t._id.slice(-6)}
                  </td>

                  <td className="border p-2">₹{t.subTotal ?? 0}</td>

                  <td className="border p-2">₹{t.gstAmount ?? 0}</td>

                  <td className="border p-2 font-semibold">
                    ₹{t.grandTotal ?? 0}
                  </td>

                  <td className="border p-2">
                    {t.printInvoice ? "Printed" : "Saved"}
                  </td>

                  <td className="border p-2">
                    <a
                      href={`/transactions/${t._id}`}
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center">
                    No transactions found
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

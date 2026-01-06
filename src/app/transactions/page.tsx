"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type Transaction = {
  _id: string;
  createdAt: string;
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  profit: number;
  gstEnabled: boolean;
  printInvoice?: boolean;
  items: Array<{
    name: string;
    batchNumber: string;
    unitType: "strip" | "tablet";
    qty: number;
    sellingPrice: number;
    total: number;
  }>;
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

  // Function to export transactions to Excel
  const exportToExcel = () => {
    if (transactions.length === 0) return;
    
    const formattedTransactions = transactions.map(t => ({
      'Date': new Date(t.createdAt).toLocaleString(),
      'Bill ID': t._id.slice(-6),
      'Subtotal': `₹${t.subTotal ?? 0}`,
      'GST': `₹${t.gstAmount ?? 0}`,
      'Total': `₹${t.grandTotal ?? 0}`,
      'Profit': `₹${t.profit?.toFixed(2) ?? '0.00'}`,
      'Type': t.printInvoice ? "Printed" : "Saved",
    }));
    
    const ws = XLSX.utils.json_to_sheet(formattedTransactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Transactions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
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
                <th className="border p-2">Date</th>
                <th className="border p-2">Bill ID</th>
                <th className="border p-2">Subtotal</th>
                <th className="border p-2">GST</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Profit</th>
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

                  <td className="border p-2 font-semibold text-green-600">
                    ₹{t.profit?.toFixed(2) ?? '0.00'}
                  </td>

                  <td className="border p-2">
                    {t.printInvoice ? "Printed" : "Saved"}
                  </td>

                  <td className="border p-2">
                    <div className="flex space-x-2">
                      <a
                        href={`/transactions/${t._id}`}
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/print/${t._id}`, '_blank');
                        }}
                        className="text-green-600 underline"
                      >
                        Print
                      </button>
                    </div>
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

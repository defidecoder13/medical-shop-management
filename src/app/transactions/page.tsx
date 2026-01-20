"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transactions</h1>
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
        <p className="text-gray-800 dark:text-white">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800 dark:text-white">
              <tr>
                <th className="border p-2 dark:border-gray-700 dark:text-white">Date</th>
                <th className="border p-2 dark:border-gray-700 dark:text-white">Bill ID</th>
                <th className="border p-2 dark:border-gray-700 dark:text-white">Subtotal</th>
                <th className="border p-2 dark:border-gray-700 dark:text-white">GST</th>
                <th className="border p-2 dark:border-gray-700 dark:text-white">Total</th>
                <th className="border p-2 dark:border-gray-700 dark:text-white">Profit</th>
                <th className="border p-2 dark:border-gray-700 dark:text-white">Type</th>
                <th className="border p-2 dark:border-gray-700 dark:text-white">Action</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td className="border p-2 dark:border-gray-700 dark:text-white">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>

                  <td className="border p-2 font-mono text-xs dark:border-gray-700 dark:text-white">
                    {t._id.slice(-6)}
                  </td>

                  <td className="border p-2 dark:border-gray-700 dark:text-white">₹{t.subTotal ?? 0}</td>

                  <td className="border p-2 dark:border-gray-700 dark:text-white">₹{t.gstAmount ?? 0}</td>

                  <td className="border p-2 font-semibold dark:border-gray-700 dark:text-white">
                    ₹{t.grandTotal ?? 0}
                  </td>

                  <td className="border p-2 font-semibold text-green-600 dark:border-gray-700 dark:text-green-400">
                    ₹{t.profit?.toFixed(2) ?? '0.00'}
                  </td>

                  <td className="border p-2 dark:border-gray-700 dark:text-white">
                    {t.printInvoice ? "Printed" : "Saved"}
                  </td>

                  <td className="border p-2 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <Link
                        href={`/transactions/${t._id}`}
                        className="text-blue-600 underline dark:text-blue-400"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/print/${t._id}`, '_blank');
                        }}
                        className="text-green-600 underline dark:text-green-400"
                      >
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center dark:text-white">
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

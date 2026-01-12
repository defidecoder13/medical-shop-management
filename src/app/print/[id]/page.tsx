"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type BillItem = {
  name: string;
  batchNumber: string;
  unitType: "strip" | "tablet";
  qty: number;
  sellingPrice: number;
  total: number;
};

type Bill = {
  _id: string;
  items: BillItem[];
  subTotal: number;
  discountPercent: number;
  discountAmount: number;
  gstAmount: number;
  grandTotal: number;
  gstEnabled: boolean;
  createdAt: string;
};

export default function PrintInvoicePage() {
  const { id } = useParams();
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
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const res = await fetch(`/api/billing/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch bill");
        }
        const data = await res.json();
        setBill(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBill();
    }
  }, [id]);

  useEffect(() => {
    if (bill && !loading) {
      // Auto-print after the bill is loaded
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bill, loading]);

  // Handle print shortcut (Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading invoice...</div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-lg">Error: {error || "Bill not found"}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .invoice-container {
            box-shadow: none;
            border: none;
            margin: 0;
            padding: 0;
          }
        }
        @page {
          margin: 1cm;
        }
        
        /* Invoice styling */
        .invoice-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1rem;
        }
        
        .invoice-title {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
        }
        
        .invoice-subtitle {
          color: #6b7280;
          margin-top: 0.5rem;
        }
        
        .company-details {
          font-weight: 500;
        }
        
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        
        .invoice-table th {
          background-color: #f3f4f6;
          padding: 0.75rem;
          text-align: left;
          border: 1px solid #d1d5db;
          font-weight: 600;
        }
        
        .invoice-table td {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          vertical-align: top;
        }
        
        .invoice-table tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .totals-section {
          width: 300px;
          margin-left: auto;
          margin-top: 2rem;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
        }
        
        .grand-total {
          border-top: 2px solid #d1d5db;
          padding-top: 0.5rem;
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .invoice-footer {
          margin-top: 3rem;
          padding-top: 1rem;
          border-top: 1px solid #d1d5db;
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
        }
      `}</style>

      {/* Print Controls */}
      <div className="no-print mb-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Print Invoice
        </button>
      </div>

      {/* Invoice Content */}
      <div className="invoice-container bg-white border rounded-lg p-8 shadow-none">
        {/* Header */}
        <div className="invoice-header">
          <div className="text-center">
            <h1 className="invoice-title">MEDISHOP</h1>
            <p className="invoice-subtitle">Your trusted pharmacy</p>
          </div>
          
          <div className="mt-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">INVOICE</h2>
              <p className="text-gray-600">Invoice #: {bill._id}</p>
              <p className="text-gray-600">
                Date: {new Date(bill.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right company-details">
              <p className="font-medium">MediShop Pharmacy</p>
              <p>123 Healthcare Street</p>
              <p>Medical City, MC 12345</p>
              <p>Phone: (123) 456-7890</p>
            </div>
          </div>
        </div>

        {/* Bill Items Table */}
        <div>
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch</th>
                <th className="text-center">Type</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.batchNumber}</td>
                  <td className="text-center">{item.unitType}</td>
                  <td className="text-center">{item.qty}</td>
                  <td className="text-right">
                    ₹{item.sellingPrice.toFixed(2)}
                  </td>
                  <td className="text-right">
                    ₹{item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="totals-section">
          <div className="total-row">
            <span>Sub Total:</span>
            <span>₹{bill.subTotal.toFixed(2)}</span>
          </div>
          {bill.discountPercent > 0 && (
            <div className="total-row">
              <span>Discount ({bill.discountPercent}%):</span>
              <span>-₹{Math.abs(bill.discountAmount).toFixed(2)}</span>
            </div>
          )}
          {bill.gstEnabled && (
            <div className="total-row">
              <span>GST (5%):</span>
              <span>₹{bill.gstAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹{bill.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <p>Thank you for choosing MediShop Pharmacy!</p>
          <p className="mt-2">Please retain this invoice for your records.</p>
        </div>
      </div>
    </div>
  );
}
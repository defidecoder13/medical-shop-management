"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/src/lib/apiClient";

type PurchaseInvoice = {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  supplierName: string;
  status: string;
  subTotal: number;
  grandTotal: number;
  items: Array<{
    name: string;
    qty: number;
    buyingPrice: number;
    total: number;
  }>;
};

type Settings = {
  shopName: string;
  address?: string;
  phone?: string;
  gstNumber?: string;
};

export default function PrintPO() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-gray-500 font-mono">LOADING PO...</div>}>
      <PrintPOContent />
    </Suspense>
  );
}

function PrintPOContent() {
  const { id } = useParams();
  const router = useRouter();

  const [po, setPo] = useState<PurchaseInvoice | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poData, settingsData] = await Promise.all([
          apiClient.get(`/api/purchases/${id}`),
          apiClient.get(`/api/settings`)
        ]);

        setPo(poData);
        setSettings(settingsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (po && settings && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [po, settings, loading]);

  if (loading) return <div className="p-10 text-center font-bold text-gray-500 font-mono">GENERATING PO DOCUMENT...</div>;
  if (error || !po || !settings) return <div className="p-10 text-center text-red-500 font-bold uppercase">ERROR: {error || "RESOURCE_NOT_FOUND"}</div>;

  return (
    <div className={`bg-white text-black leading-tight max-w-[210mm] mx-auto p-8 font-sans`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        
        @media print {
          body { 
            background: white !important;
            margin: 0;
            padding: 0;
          }
          nav, header, footer, .sidebar, .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Header section */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-6">
         <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{settings.shopName}</h1>
            <p className="text-[13px] font-medium text-gray-600 mt-1 max-w-[300px]">{settings.address}</p>
            {settings.phone && <p className="text-[13px] font-bold text-gray-800 mt-1">Ph: {settings.phone}</p>}
            {settings.gstNumber && <p className="text-[13px] font-bold text-gray-800">GSTIN: {settings.gstNumber}</p>}
         </div>
         <div className="text-right">
            <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest leading-none">PURCHASE ORDER</h2>
            <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200 inline-block text-left">
                <div className="flex gap-8 mb-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">PO No.</span>
                    <span className="text-[14px] font-black text-gray-900">{po.invoiceNumber}</span>
                </div>
                <div className="flex gap-8">
                    <span className="text-[11px] font-bold text-gray-500 uppercase">Date</span>
                    <span className="text-[13px] font-bold text-gray-900">{new Date(po.invoiceDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</span>
                </div>
            </div>
         </div>
      </div>

      {/* Supplier info */}
      <div className="flex justify-between items-end mb-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
         <div>
            <p className="text-[11px] font-black text-blue-800 uppercase tracking-widest mb-1">Order To Supplier</p>
            <h3 className="text-xl font-black text-gray-900">{po.supplierName}</h3>
         </div>
         {po.status === 'Draft' && (
             <div className="border-2 border-orange-500 text-orange-600 px-4 py-1 font-black uppercase tracking-widest rounded text-[14px] rotate-[-5deg]">
                 DRAFT / UNCONFIRMED
             </div>
         )}
      </div>

      {/* Items Table */}
      <table className="w-full text-left border-collapse mb-8">
         <thead>
            <tr className="border-b-2 border-gray-900">
               <th className="py-2 text-[11px] font-black text-gray-500 uppercase w-12 text-center">S.No</th>
               <th className="py-2 text-[11px] font-black text-gray-500 uppercase">Description of Goods</th>
               <th className="py-2 text-[11px] font-black text-gray-500 uppercase text-center w-24">Order Qty</th>
               <th className="py-2 text-[11px] font-black text-gray-500 uppercase text-right w-32">Est. Rate</th>
               <th className="py-2 text-[11px] font-black text-gray-500 uppercase text-right w-32">Est. Amount</th>
            </tr>
         </thead>
         <tbody>
            {po.items.map((item, idx) => {
               const estRate = item.buyingPrice || 0;
               const estAmount = item.total || (item.qty * estRate) || 0;
               return (
                  <tr key={idx} className="border-b border-gray-100">
                     <td className="py-3 text-[13px] font-medium text-gray-600 text-center">{idx + 1}</td>
                     <td className="py-3">
                        <span className="text-[14px] font-bold text-gray-900">{item.name}</span>
                     </td>
                     <td className="py-3 text-[14px] font-black text-[#11327c] text-center bg-[#11327c]/5 rounded">{item.qty}</td>
                     <td className="py-3 text-[13px] font-medium text-gray-600 text-right">₹{estRate.toFixed(2)}</td>
                     <td className="py-3 text-[14px] font-bold text-gray-900 text-right">₹{estAmount.toFixed(2)}</td>
                  </tr>
               );
            })}
         </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mt-4 pt-4 border-t-2 border-gray-900">
         <div className="w-64">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[13px] font-bold text-gray-600">Total Items:</span>
               <span className="text-[14px] font-black text-gray-900">{po.items.length}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
               <span className="text-[15px] font-black text-gray-900 uppercase">Estimated Total</span>
               <span className="text-[18px] font-black text-[#11327c]">
                  ₹{po.grandTotal || po.items.reduce((acc, item) => acc + (item.total || (item.qty * (item.buyingPrice || 0)) || 0), 0).toFixed(2)}
               </span>
            </div>
         </div>
      </div>

      <div className="mt-16 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-6">
         This is a computer-generated Purchase Order.
      </div>
      
      <div className="no-print mt-8 flex justify-center gap-4">
         <button onClick={() => window.print()} className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-xl">Print to PDF</button>
         <button onClick={() => router.back()} className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-bold">Go Back</button>
      </div>
    </div>
  );
}

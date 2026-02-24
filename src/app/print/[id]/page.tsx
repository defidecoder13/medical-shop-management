"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type BillItem = {
  name: string;
  brand?: string;
  expiryDate?: string;
  batchNumber: string;
  hsnCode?: string;
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
  gstPercent: number;
  grandTotal: number;
  gstEnabled: boolean;
  createdAt: string;
};

type Settings = {
  shopName: string;
  address?: string;
  phone?: string;
  gstEnabled: boolean;
  gstNumber?: string;
  invoiceFooter?: string;
};

function PrintInvoiceContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const layout = searchParams.get("type") || "a4"; // a4 or thermal

  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billRes, settingsRes] = await Promise.all([
          fetch(`/api/billing/${id}`),
          fetch(`/api/settings`)
        ]);

        if (!billRes.ok || !settingsRes.ok) throw new Error("Failed to fetch data");

        const [billData, settingsData] = await Promise.all([
          billRes.json(),
          settingsRes.json()
        ]);

        setBill(billData);
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
    if (bill && settings && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [bill, settings, loading]);

  if (loading) return <div className="p-10 text-center font-bold text-gray-500 font-mono">GENERATING INVOICE...</div>;
  if (error || !bill || !settings) return <div className="p-10 text-center text-red-500 font-bold uppercase">ERROR: {error || "RESOURCE_NOT_FOUND"}</div>;

  const ITEMS_PER_PAGE = 13; // Set to 13 to allow ~13-14 items per page safely
  const chunks = [];
  for (let i = 0; i < bill.items.length; i += ITEMS_PER_PAGE) {
    chunks.push(bill.items.slice(i, i + ITEMS_PER_PAGE));
  }

  return (
    <div className={`bg-[#f3f4f6] text-black leading-tight max-w-[210mm] mx-auto p-0 min-h-screen`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        
        @media print {
          @page {
            size: A5 landscape;
            margin: 8mm;
          }
          body { 
            background: white; 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .print-page {
            page-break-after: always;
            box-sizing: border-box;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        }

        body {
          background-color: #f3f4f6;
          font-family: 'Inter', sans-serif;
        }

        .mono-font {
          font-family: 'IBM Plex Mono', monospace;
        }

        .border-soft {
          border-color: #e5e5e5;
        }

        .a5-table th {
          border-bottom: 1px solid #000;
          padding: 2px 4px;
        }
        
        .a5-table td {
          border-bottom: 1px solid #e5e5e5;
          padding: 2px 4px;
        }
        
        .a5-table tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
      `}</style>

      {/* Manual Controls - Hidden on Print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => router.push(`/transactions/${id}`)}
          className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-xs font-bold uppercase border border-gray-200 hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
        <button 
          onClick={() => window.print()} 
          className="bg-black text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-900 shadow-xl transition-all active:scale-95"
        >
          Print Invoice
        </button>
      </div>

      {chunks.map((chunkItems, pageIndex) => {
        const isLastPage = pageIndex === chunks.length - 1;

        return (
          <div key={pageIndex} className="print-page bg-white p-4 flex flex-col min-h-screen">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2">
               {/* Left: Store Details */}
               <div className="w-[45%]">
                  <h1 className="text-xl font-bold uppercase tracking-tight leading-none mb-1">{settings.shopName}</h1>
                  <p className="text-[10px] font-medium text-gray-600 uppercase max-w-[250px] leading-snug mb-1">{settings.address}</p>
                  <div className="flex flex-col gap-0.5">
                     {settings.phone && <div className="text-[10px] font-semibold">Ph: <span className="mono-font">{settings.phone}</span></div>}
                     {settings.gstEnabled && settings.gstNumber && (
                       <div className="text-[10px] font-bold">
                         GSTIN: <span className="mono-font">{settings.gstNumber}</span>
                       </div>
                     )}
                  </div>
               </div>
               
               {/* Center: Title */}
               <div className="w-[20%] text-center mt-2 flex flex-col items-center">
                  <div className="inline-block border border-black px-3 py-1 mb-1">
                     <h2 className="text-sm font-black uppercase tracking-widest">Tax Invoice</h2>
                  </div>
                  {chunks.length > 1 && (
                    <span className="text-[9px] font-semibold text-gray-500">Page {pageIndex + 1} of {chunks.length}</span>
                  )}
               </div>

               {/* Right: Invoice/Patient Details */}
               <div className="w-[35%] text-right flex flex-col items-end text-[10px]">
                  <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-left w-full max-w-[200px]">
                     <span className="font-semibold text-gray-500 uppercase">Invoice #</span>
                     <span className="font-bold mono-font text-[11px] text-right">{bill._id.slice(-8).toUpperCase()}</span>
                     
                     <span className="font-semibold text-gray-500 uppercase">Date</span>
                     <span className="font-medium mono-font text-right">
                        {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                     </span>
                     
                     <span className="font-semibold text-gray-500 uppercase">Time</span>
                     <span className="font-medium mono-font text-right">
                        {new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
               </div>
            </div>

            {/* Items Table */}
            <div className="flex-1">
               <table className="a5-table w-full border-collapse text-left">
                   <thead>
                     <tr>
                        <th className="w-[3%] text-center text-[9px] font-bold uppercase text-gray-600">Sr</th>
                        <th className="w-[20%] text-[9px] font-bold uppercase text-gray-600">Product</th>
                        <th className="w-[9%] text-[9px] font-bold uppercase text-gray-600">MFG</th>
                        <th className="w-[8%] text-center text-[9px] font-bold uppercase text-gray-600">HSN</th>
                        <th className="w-[10%] text-center text-[9px] font-bold uppercase text-gray-600">Batch</th>
                        <th className="w-[8%] text-center text-[9px] font-bold uppercase text-gray-600">Exp.</th>
                        <th className="w-[8%] text-center text-[9px] font-bold uppercase text-gray-600">Qty</th>
                        <th className="w-[7%] text-right text-[9px] font-bold uppercase text-gray-600">MRP</th>
                        <th className="w-[6%] text-right text-[9px] font-bold uppercase text-gray-600">Disc</th>
                        <th className="w-[6%] text-right text-[9px] font-bold uppercase text-gray-600">CGST</th>
                        <th className="w-[6%] text-right text-[9px] font-bold uppercase text-gray-600">SGST</th>
                        <th className="w-[9%] text-right text-[9px] font-bold uppercase text-gray-600">Amount</th>
                     </tr>
                  </thead>
                 <tbody>
                    {chunkItems.map((item, localIndex) => {
                      const absoluteIndex = pageIndex * ITEMS_PER_PAGE + localIndex;
                      const cgstPercent = bill.gstEnabled ? (bill.gstPercent / 2) : 0;
                      const sgstPercent = bill.gstEnabled ? (bill.gstPercent / 2) : 0;
                      
                      // Format Expiry MM/YY
                      let expStr = "-";
                      if (item.expiryDate) {
                         const d = new Date(item.expiryDate);
                         expStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                      }

                      // Format Mfg (first word)
                      let mfgStr = "-";
                      if (item.brand) {
                         mfgStr = item.brand.split(" ")[0].toUpperCase();
                      }

                      // Display Bill Discount
                      const discStr = bill.discountPercent > 0 ? `${bill.discountPercent}%` : "-";
                      
                      return (
                        <tr key={absoluteIndex} className="h-[22px]">
                          <td className="text-center mono-font text-[9px] text-gray-500">{absoluteIndex + 1}</td>
                          <td>
                            <div className="font-semibold text-[10px] leading-tight text-black truncate max-w-[120px] pr-1">{item.name}</div>
                          </td>
                          <td>
                             <div className="text-[9px] font-medium text-gray-600 truncate">{mfgStr}</div>
                          </td>
                          <td className="text-center font-medium mono-font text-[9px] text-gray-600">{item.hsnCode || "-"}</td>
                          <td className="text-center font-bold mono-font text-[9px] text-gray-800">{item.batchNumber}</td>
                          <td className="text-center font-medium mono-font text-[9px] text-gray-600">{expStr}</td>
                          <td className="text-center font-bold text-[10px]">
                            {item.qty} <span className="text-[8px] uppercase font-semibold text-gray-500">{item.unitType === 'strip' ? 'S' : 'T'}</span>
                          </td>
                          <td className="text-right mono-font text-[9px]">₹{item.sellingPrice.toFixed(2)}</td>
                          <td className="text-right mono-font text-[9px] text-gray-600">{discStr}</td>
                          <td className="text-right mono-font text-[9px] text-gray-600">{cgstPercent > 0 ? `${cgstPercent}%` : '-'}</td>
                          <td className="text-right mono-font text-[9px] text-gray-600">{sgstPercent > 0 ? `${sgstPercent}%` : '-'}</td>
                          <td className="text-right font-bold mono-font text-[10px]">₹{item.total.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
            </div>

            {/* Always push footer items to bottom of page */}
            <div className="flex-grow min-h-[10px]"></div>

            {/* Summary & Footer Section (ONLY ON LAST PAGE) */}
            {isLastPage ? (
              <div className="mt-2 border-t-2 border-black pt-2 flex justify-between items-end pb-1 shrink-0">
                 {/* Left: Notes & Terms */}
                 <div className="w-[55%] text-[9px] text-gray-600 leading-snug space-y-3">
                    <div>
                       <p className="font-medium text-gray-700 italic">"Medicines without original bill will not be accepted for return."</p>
                    </div>
                 </div>

                 {/* Right: Totals Grid */}
                 <div className="w-[40%] flex gap-4">
                     <div className="flex-1 text-[10px] border border-gray-200 p-2 space-y-1 bg-[#fafafa]">
                        <div className="flex justify-between">
                           <span className="font-medium text-gray-500 uppercase">Subtotal</span>
                           <span className="font-semibold mono-font">₹{bill.subTotal.toFixed(2)}</span>
                        </div>
                        {bill.gstEnabled && (
                          <>
                            <div className="flex justify-between">
                               <span className="font-medium text-gray-500 uppercase">CGST ({bill.gstPercent / 2}%)</span>
                               <span className="font-semibold mono-font">₹{((bill.gstAmount || 0) / 2).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                               <span className="font-medium text-gray-500 uppercase">SGST ({bill.gstPercent / 2}%)</span>
                               <span className="font-semibold mono-font">₹{((bill.gstAmount || 0) / 2).toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        {(bill.discountAmount > 0) && (
                          <div className="flex justify-between text-green-700">
                             <span className="font-medium uppercase">Discount</span>
                             <span className="font-semibold mono-font">-₹{bill.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                     </div>
                     
                     <div className="flex-1 flex flex-col justify-between items-end">
                        <div className="text-right w-full bg-black text-white px-3 py-2">
                           <div className="text-[10px] font-bold uppercase tracking-wide opacity-80 mb-0.5">Grand Total</div>
                           <div className="text-[18px] font-bold mono-font leading-none">₹{Math.round(bill.grandTotal).toFixed(2)}</div>
                        </div>
                        
                        <div className="mt-4 text-center w-full">
                           <div className="border-t border-gray-400 w-[80%] mx-auto mb-1"></div>
                           <div className="text-[9px] font-bold uppercase text-gray-500">Authorized Signatory</div>
                        </div>
                     </div>
                 </div>
              </div>
            ) : (
               <div className="mt-2 text-right shrink-0">
                 <span className="text-[9px] font-bold italic text-gray-400 border-t border-gray-200 pt-2 block w-full">Continued on Page {pageIndex + 2} ...</span>
               </div>
            )}
            
            <div className="text-center text-[8px] mt-2 font-medium text-gray-400 flex justify-between items-center no-print shrink-0">
              <span>For internal use only - Not final receipt</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PrintInvoicePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-gray-500 font-mono">LOADING PRINT ENGINE...</div>}>
      <PrintInvoiceContent />
    </Suspense>
  );
}
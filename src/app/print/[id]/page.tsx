"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/src/lib/apiClient";
import { User } from "lucide-react";

type BillItem = {
  name: string;
  brand?: string;
  expiryDate?: string;
  batchNumber: string;
  hsnCode?: string;
  pack?: string;
  unitType: "strip" | "tablet";
  qty: number;
  sellingPrice: number;
  total: number;
  discountPercent?: number;
  discountAmount?: number;
};

type Bill = {
  _id: string;
  invoiceNumber?: string;
  items: BillItem[];
  subTotal: number;
  discountPercent: number;
  discountAmount: number;
  gstAmount: number;
  gstPercent: number;
  grandTotal: number;
  gstEnabled: boolean;
  createdAt: string;
  patientName?: string;
  patientPhone?: string;
  patientAddress?: string;
  doctorName?: string;
  roundingAdjustment?: number;
};

type Settings = {
  shopName: string;
  address?: string;
  phone?: string;
  email?: string;
  dlNumber?: string;
  pharmacistName?: string;
  gstEnabled: boolean;
  gstNumber?: string;
  invoiceFooter?: string;
};

function PrintInvoiceContent() {
  const { id } = useParams();
  const router = useRouter();

  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billData, settingsData] = await Promise.all([
          apiClient.get(`/api/billing/${id}`),
          apiClient.get(`/api/settings`)
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f3f4f6]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
      <div className="text-center font-bold text-black font-mono tracking-widest uppercase">GENERATING INVOICE...</div>
    </div>
  );
  if (error || !bill || !settings) return <div className="p-10 text-center text-red-500 font-bold uppercase">ERROR: {error || "RESOURCE_NOT_FOUND"}</div>;

  const ITEMS_PER_PAGE = 14; // Adjusted for better page utilization
  const chunks = [];
  for (let i = 0; i < bill.items.length; i += ITEMS_PER_PAGE) {
    chunks.push(bill.items.slice(i, i + ITEMS_PER_PAGE));
  }

  return (
    <div className={`bg-[#f3f4f6] text-black leading-tight max-w-[210mm] mx-auto p-0`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        
        @media print {
          @page {
            size: A5 landscape; 
            margin: 5mm;
          }
          body { 
            background: white; 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .print-page {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            height: 100vh !important;
            max-height: 100vh !important;
            margin-bottom: 0 !important;
            border: none !important;
          }
        }

        body {
          background-color: #f3f4f6;
          font-family: 'Courier Prime', monospace;
        }

        .mono-font {
          font-family: 'Courier Prime', monospace;
        }

        /* Enforce A5 landscape boundaries in browser preview too */
        .print-page {
          height: 148mm;
          max-height: 148mm;
          width: 210mm;
          box-sizing: border-box;
          overflow: hidden;
          margin-bottom: 20px; /* Space between pages in preview */
        }
      `}</style>

      {/* Manual Controls */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={() => router.push(`/transactions/${id}`)}
          className="bg-gray-100 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase border border-gray-200 hover:bg-gray-200 transition-colors"
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
          <div 
             key={pageIndex} 
             className="print-page bg-white p-4 flex flex-col"
             style={{ 
               pageBreakAfter: isLastPage ? 'auto' : 'always',
               pageBreakInside: 'avoid'
             }}
          >
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-2">
              {/* Left Details */}
              <div className="w-[45%] flex flex-col">
                <h1 className="text-2xl font-bold uppercase tracking-tight text-black leading-none mb-0.5">{settings.shopName}</h1>
                <p className="text-[10px] font-medium text-black uppercase max-w-[250px] leading-tight mb-1">
                  {settings.address}
                </p>
                <div className="text-[10px] font-bold text-black flex flex-wrap gap-x-3 gap-y-1">
                  {settings.phone && <div>Ph: <span className="mono-font">{settings.phone}</span></div>}
                  {settings.gstEnabled && settings.gstNumber && <div>GSTIN: <span className="mono-font">{settings.gstNumber}</span></div>}
                </div>
                {settings.email && (
                  <div className="text-[10px] font-bold text-black mt-0.5 lowercase">
                    email: <span className="mono-font lowercase">{settings.email}</span>
                  </div>
                )}
              </div>

              {/* Center Tax Invoice Box */}
              <div className="w-[20%] flex justify-center items-center">
                <div className="border-[1.5px] border-black px-2 py-0.5">
                   <h2 className="text-[12px] font-bold uppercase tracking-widest text-black">
                     {settings.gstEnabled ? "TAX INVOICE" : "RETAIL INVOICE"}
                   </h2>
                </div>
              </div>

              {/* Right Details */}
              <div className="w-[45%] flex items-start border-[1px] border-black rounded-md p-2 gap-2 text-[10px] mr-2">
                 <div className="pt-0.5">
                    <User size={14} className="text-black stroke-[2]" />
                 </div>
                 <div className="grid grid-cols-[auto_auto_auto] gap-x-1.5 gap-y-0.5 w-full text-left">
                    <span className="font-semibold text-black">PATIENT NAME</span>
                    <span className="font-semibold text-black">:</span>
                    <span className="font-bold text-black text-left truncate max-w-[140px]">{bill.patientName || "-"}</span>

                    <span className="font-semibold text-black">PHONE NO</span>
                    <span className="font-semibold text-black">:</span>
                    <span className="font-bold mono-font text-black text-left">{bill.patientPhone || "-"}</span>

                    <span className="font-semibold text-black">ADDRESS</span>
                    <span className="font-semibold text-black">:</span>
                    <span className="font-bold text-black text-left truncate max-w-[140px]">{bill.patientAddress || "-"}</span>

                    <span className="font-semibold text-black">DOCTOR'S NAME</span>
                    <span className="font-semibold text-black">:</span>
                    <span className="font-bold text-black text-left truncate max-w-[140px]">{bill.doctorName ? `DR. ${bill.doctorName.toUpperCase()}` : "-"}</span>
                 </div>
              </div>
            </div>

            {/* Horizontal Info Strip */}
            <div className="flex justify-between items-center py-1 text-[10px] mb-0.5">
               <div className="flex gap-4">
                  {settings.dlNumber && <div className="font-bold text-black uppercase tracking-wider">D.L.No: <span className="mono-font text-black">{settings.dlNumber}</span></div>}
                  {settings.pharmacistName && <div className="font-bold text-black uppercase tracking-wider">Pharmacist: <span className="text-black">{settings.pharmacistName}</span></div>}
               </div>
               <div className="flex gap-4">
                  <div className="font-bold text-black uppercase tracking-wider">Invoice No : <span className="mono-font text-black">{bill.invoiceNumber || bill._id.slice(-8).toUpperCase()}</span></div>
                  <div className="font-bold text-black uppercase tracking-wider">Date: <span className="mono-font text-black">{new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                  <div className="font-bold text-black uppercase tracking-wider">Time: <span className="mono-font text-black">{new Date(bill.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }).toLowerCase()}</span></div>
               </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 flex flex-col relative">
              <table className="w-full h-full text-left border-collapse border-[1px] border-black flex-1">
                <thead>
                    <tr className="border-b-[1px] border-black">
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[5%] border-r-[1px] border-black text-center">QTY</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[35%] border-r-[1px] border-black">PRODUCT</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[6%] text-center border-r-[1px] border-black">PACK</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[10%] text-center border-r-[1px] border-black">MFG</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[14%] text-center border-r-[1px] border-black">BATCH</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[6%] text-center border-r-[1px] border-black">EXP.</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[9%] text-right border-r-[1px] border-black">MRP</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[5%] text-right border-r-[1px] border-black">DISC</th>
                        <th className="py-1 px-1 text-[12px] font-black text-black uppercase w-[10%] text-right">AMOUNT</th>
                    </tr>
                 </thead>
                 <tbody>
                    {chunkItems.map((item, localIndex) => {
                      const absoluteIndex = pageIndex * ITEMS_PER_PAGE + localIndex;
                      
                      let expStr = "-";
                      if (item.expiryDate) {
                         const d = new Date(item.expiryDate);
                         expStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
                      }

                      let mfgStr = "-";
                      if (item.brand) {
                         mfgStr = item.brand.split(" ")[0].toUpperCase().substring(0, 8);
                      }
                      
                      return (
                        <tr key={absoluteIndex} className="border-b-[1px] border-gray-300">
                          <td className="py-1 px-1 text-[10px] font-bold text-black mono-font text-center border-r-[1px] border-black">
                            {item.qty} <span className="text-[8px] font-bold text-black ml-0.5">{item.unitType === 'strip' ? 'S' : 'T'}</span>
                          </td>
                          <td className="py-1 px-1 text-[11px] font-bold text-black truncate border-r-[1px] border-black">{item.name}</td>
                          <td className="py-1 px-1 text-[9px] font-medium text-black mono-font text-center border-r-[1px] border-black">{item.pack || "-"}</td>
                          <td className="py-1 px-1 text-[9px] font-medium text-black text-center truncate border-r-[1px] border-black">{mfgStr}</td>
                          <td className="py-1 px-1 text-[10px] font-bold text-black uppercase mono-font text-center border-r-[1px] border-black">{item.batchNumber}</td>
                          <td className="py-1 px-1 text-[10px] font-medium text-black mono-font text-center border-r-[1px] border-black">{expStr}</td>
                          <td className="py-1 px-1 text-[10px] font-medium text-black mono-font text-right border-r-[1px] border-black">₹{item.sellingPrice.toFixed(2)}</td>
                          <td className="py-1 px-1 text-[9px] font-medium text-black mono-font text-right border-r-[1px] border-black">{item.discountPercent && item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td>
                          <td className="py-1 px-1 text-[11px] font-bold text-black mono-font text-right">₹{(item.total - (item.discountAmount || 0)).toFixed(2)}</td>
                        </tr>
                      )
                    })}
                    
                    {/* Empty filler row to extend vertical borders to the bottom */}
                     <tr className="border-0 h-full">
                       <td className="border-r-[1px] border-black"></td>
                       <td className="border-r-[1px] border-black"></td>
                       <td className="border-r-[1px] border-black"></td>
                       <td className="border-r-[1px] border-black"></td>
                       <td className="border-r-[1px] border-black"></td>
                       <td className="border-r-[1px] border-black"></td>
                       <td className="border-r-[1px] border-black"></td>
                       <td className="border-r-[1px] border-black"></td>
                       <td className=""></td>
                     </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Section */}
            {isLastPage ? (
              <div className="mt-auto border-t-[1.5px] border-black pt-1 flex justify-between items-start pb-1">
                
                {/* Left Side: Notes */}
                <div className="w-[50%] flex flex-col justify-end">
                   <p className="text-[11px] text-black font-bold leading-tight mb-2">
                     Please bring our bill while returning medicine within 7 days.<br/>
                     ৭ দিনের মধ্যে ওষুধ ফেরত দেওয়ার সময় অনুগ্রহ করে আমাদের বিলটি সাথে আনবেন।
                   </p>
                   <p className="text-[10px] text-black font-bold leading-tight uppercase">
                     E. & O.E.
                   </p>
                 </div>
                 
                {/* Right Side: Totals & Signatory */}
                <div className="w-[45%] flex gap-2">
                   <div className="flex-1 border border-gray-200 px-2 py-1 flex flex-col justify-center gap-0.5">
                      <div className="flex justify-between text-[12px]">
                         <span className="text-black font-bold uppercase">Subtotal</span>
                         <span className="font-bold text-black mono-font">₹{bill.subTotal.toFixed(2)}</span>
                      </div>
                      
                      {bill.gstEnabled && bill.gstAmount > 0 && (
                        <>
                          <div className="flex justify-between text-[10px]">
                             <span className="text-black font-medium">CGST ({bill.gstPercent / 2}%)</span>
                             <span className="font-bold text-black mono-font">₹{((bill.gstAmount || 0) / 2).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                             <span className="text-black font-medium">SGST ({bill.gstPercent / 2}%)</span>
                             <span className="font-bold text-black mono-font">₹{((bill.gstAmount || 0) / 2).toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      {bill.discountAmount > 0 && (
                        <div className="flex justify-between text-[10px]">
                           <span className="text-black font-medium">Discount</span>
                           <span className="font-bold text-black mono-font">-₹{bill.discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {bill.roundingAdjustment !== undefined && bill.roundingAdjustment !== 0 && (
                        <div className="flex justify-between text-[10px]">
                           <span className="text-black font-medium">Rounding</span>
                           <span className="font-bold text-black mono-font">
                             {bill.roundingAdjustment > 0 ? "+" : ""}
                             {bill.roundingAdjustment.toFixed(2)}
                           </span>
                        </div>
                      )}
                   </div>

                   <div className="w-[110px] flex flex-col justify-between">
                      <div className="bg-black text-white p-2 flex flex-col items-center justify-center">
                         <span className="text-[9px] font-bold uppercase tracking-widest opacity-90 mb-0.5">Grand Total</span>
                         <span className="text-[14px] font-bold mono-font leading-none">₹{Math.round(bill.grandTotal).toFixed(2)}</span>
                      </div>
                      
                      <div className="mt-2 text-center">
                         <span className="text-[9px] font-bold text-black uppercase tracking-widest leading-none">Signature</span>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="mt-auto pt-2 text-right text-[10px] font-bold text-black">
                Continued on Page {pageIndex + 2} ...
              </div>
            )}
            
            {/* Pagination helper - hidden on print */}
            <div className="text-center text-[10px] mt-2 font-medium text-black no-print">
               Page {pageIndex + 1} of {chunks.length}
            </div>

          </div>
        );
      })}
    </div>
  );
}

export default function PrintInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f3f4f6]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
        <div className="text-center font-bold text-black font-mono tracking-widest uppercase">LOADING PRINT ENGINE...</div>
      </div>
    }>
      <PrintInvoiceContent />
    </Suspense>
  );
}
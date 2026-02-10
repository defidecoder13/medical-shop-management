"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

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

  return (
    <div className={`bg-white text-black leading-tight ${layout === 'thermal' ? 'w-[80mm] p-0' : 'max-w-[210mm] mx-auto p-0 min-h-screen'}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Inter:wght@400;500;600;700;800&display=swap');
        
        @media print {
          @page {
            margin: 0;
            size: ${layout === 'thermal' ? '80mm auto' : 'A4 portrait'};
          }
          body { 
            background: white; 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
        }

        body {
          background-color: #f3f4f6;
        }

        .thermal-font {
          font-family: 'Courier Prime', monospace;
          font-size: 13px;
        }

        .a4-font {
          font-family: 'Inter', sans-serif;
        }

        .thermal-divider {
           border-top: 1px dashed black;
           margin: 6px 0;
        }

        .a4-table th, .a4-table td {
           border: 1px solid #000;
           padding: 8px 12px;
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

      {layout === 'thermal' ? (
        /* ================= THERMAL LAYOUT ================= */
        <div className="thermal-font p-3 bg-white mx-auto shadow-sm">
          <div className="text-center space-y-1">
             <div className="text-lg font-bold uppercase tracking-wide leading-none mb-1">{settings.shopName}</div>
             <div className="text-[10px] leading-tight uppercase px-4">{settings.address}</div>
             {settings.phone && <div className="text-[11px] font-bold mt-1">CONTACT: {settings.phone}</div>}
             {settings.gstEnabled && settings.gstNumber && <div className="text-[11px] font-bold">GSTIN: {settings.gstNumber}</div>}
          </div>

          <div className="thermal-divider" />
          <div className="flex justify-between text-[11px]">
             <div>BILL: #{bill._id.slice(-8).toUpperCase()}</div>
             <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="thermal-divider" />

          {/* Thermal Table-like Header */}
          <div className="flex justify-between font-bold text-[11px] mb-1">
             <span className="w-[50%]">ITEM</span>
             <span className="w-[15%] text-center">QTY</span>
             <span className="w-[15%] text-right">RATE</span>
             <span className="w-[20%] text-right">TOTAL</span>
          </div>
          <div className="thermal-divider" />

          <div className="space-y-3">
             {bill.items.map((item, i) => (
               <div key={i} className="text-[11px]">
                 <div className="font-bold uppercase mb-0.5">{item.name}</div>
                 <div className="flex justify-between items-baseline">
                   <span className="w-[50%] opacity-80 text-[10px]">BATCH: {item.batchNumber}</span>
                   <span className="w-[15%] text-center">{item.qty}{item.unitType === 'strip' ? 's' : 't'}</span>
                   <span className="w-[15%] text-right">₹{item.sellingPrice}</span>
                   <span className="w-[20%] text-right font-bold">₹{item.total}</span>
                 </div>
               </div>
             ))}
          </div>

          <div className="thermal-divider" />
          
          <div className="space-y-1 text-[11px]">
             <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>₹{bill.subTotal.toFixed(2)}</span>
             </div>
             
             <div className="flex justify-between">
                <span>GST {bill.gstEnabled ? `(${bill.gstPercent}%)` : ""}:</span>
                <span>₹{(bill.gstAmount || 0).toFixed(2)}</span>
             </div>

             <div className="flex justify-between">
                <span>DISCOUNT:</span>
                <span>₹{(bill.discountAmount || 0).toFixed(2)}</span>
             </div>

             <div className="thermal-divider" />
             <div className="flex justify-between text-[14px] font-bold">
                <span>GRAND TOTAL:</span>
                <span>₹{bill.grandTotal.toFixed(2)}</span>
             </div>
          </div>

          <div className="thermal-divider" />
          <div className="text-center text-[10px] mt-4 space-y-1 uppercase leading-tight font-bold">
             <div>{settings.invoiceFooter || "THANK YOU! GET WELL SOON."}</div>
             <div className="opacity-80">NO RETURN WITHOUT ORIGINAL BILL</div>
             <div className="pt-2 italic opacity-50 text-[8px]">POWERED BY MEDISAATHI CORE</div>
          </div>
        </div>
      ) : (
        /* ================= A4 LAYOUT ================= */
        <div className="a4-font bg-white shadow-2xl p-12 min-h-screen">
          
          {/* A4 Header Section */}
          <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
             <div className="space-y-4">
                <div>
                   <h1 className="text-4xl font-extrabold uppercase tracking-tighter leading-none mb-1">{settings.shopName}</h1>
                   <p className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">PHARMACY & HEALTHCARE SERVICES</p>
                </div>
                <div className="space-y-1">
                   <div className="text-xs font-medium max-w-[360px] leading-relaxed uppercase">{settings.address}</div>
                   {settings.phone && <div className="text-xs font-bold">PHONE: <span className="font-mono">{settings.phone}</span></div>}
                   {settings.gstEnabled && settings.gstNumber && (
                     <div className="text-xs font-black text-black mt-1">
                       GSTIN: <span className="font-mono tracking-wide">{settings.gstNumber}</span>
                     </div>
                   )}
                </div>
             </div>
             <div className="text-right flex flex-col items-end gap-2">
                <div className="bg-black text-white p-3 px-6 -mr-12">
                   <div className="text-2xl font-black uppercase tracking-widest">Tax Invoice</div>
                </div>
                <div className="mt-4 text-right">
                   <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Invoice Reference</div>
                   <div className="text-lg font-black font-mono tracking-tight leading-none">#{bill._id.toUpperCase()}</div>
                   <div className="text-[11px] font-bold mt-2 uppercase">Date & Time</div>
                   <div className="text-xs font-mono">{new Date(bill.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</div>
                </div>
             </div>
          </div>

          {/* A4 Items Table */}
          <table className="a4-table w-full border-collapse">
             <thead>
                <tr className="bg-gray-100">
                   <th className="w-[5%] text-center text-[11px] font-black uppercase">#</th>
                   <th className="w-[45%] text-left text-[11px] font-black uppercase tracking-wider">Item Description</th>
                   <th className="w-[15%] text-center text-[11px] font-black uppercase">Batch</th>
                   <th className="w-[10%] text-center text-[11px] font-black uppercase">Qty</th>
                   <th className="w-[10%] text-right text-[11px] font-black uppercase">Rate</th>
                   <th className="w-[15%] text-right text-[11px] font-black uppercase">Total</th>
                </tr>
             </thead>
             <tbody>
                {bill.items.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="text-center font-mono text-xs">{String(i + 1).padStart(2, '0')}</td>
                    <td className="font-bold text-[13px] uppercase tracking-tight">{item.name}</td>
                    <td className="text-center font-mono text-xs text-gray-600 italic uppercase">{item.batchNumber}</td>
                    <td className="text-center font-bold text-[13px]">
                       {item.qty} <span className="text-[9px] uppercase font-black text-gray-400">{item.unitType}</span>
                    </td>
                    <td className="text-right font-mono text-xs">₹{item.sellingPrice.toFixed(2)}</td>
                    <td className="text-right font-black text-[13px]">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
                {/* Empty rows to maintain structure if needed */}
                {Array.from({ length: Math.max(0, 10 - bill.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="h-10 opacity-25">
                    <td></td><td></td><td></td><td></td><td></td><td></td>
                  </tr>
                ))}
             </tbody>
          </table>

          {/* A4 Totals Section */}
          <div className="mt-10 flex justify-end">
             <div className="w-1/2 space-y-1">
                <div className="flex justify-between text-xs py-2 px-4 bg-gray-50 border border-black/5">
                   <span className="text-gray-500 font-black uppercase tracking-wider">Subtotal</span>
                   <span className="font-bold font-mono">₹{bill.subTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xs py-2 px-4 border border-black/5">
                   <span className="text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">
                      GST {bill.gstEnabled ? `(${bill.gstPercent}%)` : ""}
                   </span>
                   <span className="font-bold font-mono">₹{(bill.gstAmount || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs py-2 px-4 border border-black/5">
                   <span className="text-gray-500 font-bold uppercase tracking-wider">Discount</span>
                   <span className="font-bold font-mono">₹{(bill.discountAmount || 0).toFixed(2)}</span>
                </div>

                <div className="bg-black text-white mt-4 p-5 flex justify-between items-center shadow-lg">
                   <span className="text-[12px] font-black uppercase tracking-[0.3em]">Total Payable</span>
                   <span className="text-3xl font-black font-mono">₹{bill.grandTotal.toFixed(2)}</span>
                </div>
                <div className="text-right text-[9px] font-black uppercase text-gray-400 tracking-widest mt-2 px-1">
                   Net amount inclusive of all taxes
                </div>
             </div>
          </div>

          {/* A4 Footer */}
          <div className="mt-auto pt-20 pb-8 text-center border-t border-gray-100">
             <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-gray-300 mb-2">MedSaathi Pharmacy</p>
             <p className="text-[10px] font-bold text-gray-400 uppercase italic tracking-tighter">Stay healthy, Stay happy!</p>
          </div>
        </div>
      )}
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { 
  History, 
  ChevronLeft, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Printer, 
  Search,
  CheckCircle2,
  FileText
} from "lucide-react";

type Transaction = {
  _id: string;
  createdAt: string;
  subTotal: number;
  gstAmount: number;
  grandTotal: number;
  profit: number;
  discountAmount?: number;
  gstPercent?: number;
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
        if (!res.ok) router.push('/login');
      } catch {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"1d" | "7d" | "1m">("1m");

  const getDateRange = (filter: string) => {
    const end = new Date();
    const start = new Date();
    if (filter === "1d") {
      start.setHours(0, 0, 0, 0);
    } else if (filter === "7d") {
      start.setDate(end.getDate() - 7);
    } else if (filter === "1m") {
      start.setMonth(end.getMonth() - 1);
    }
    return { start, end };
  };

  useEffect(() => {
    const { start, end } = getDateRange(dateFilter);
    setLoading(true);
    fetch(`/api/transactions?startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          setTransactions([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        setLoading(false);
      });
  }, [dateFilter]);

  const filteredTransactions = Array.isArray(transactions) 
    ? transactions.filter(t => {
        const searchLower = searchQuery.toLowerCase();
        const dateObj = new Date(t.createdAt);
        
        // Generate flexible date variations
        const dateVariations = [
          format(dateObj, "dd/MM/yyyy HH:mm"),
          format(dateObj, "d/M/yyyy"),
          format(dateObj, "d/M"),
          format(dateObj, "dd/MM"),
          dateObj.toLocaleDateString(),
          format(dateObj, "MMM d"), // e.g., Feb 10
        ].map(v => v.toLowerCase());

        const itemsStr = t.items.map(i => i.name).join(", ").toLowerCase();
        const amountStr = t.grandTotal.toString();
        const idStr = t._id.slice(-8).toUpperCase().toLowerCase();

        return idStr.includes(searchLower) || 
               dateVariations.some(v => v.includes(searchLower)) || 
               itemsStr.includes(searchLower) || 
               amountStr.includes(searchLower);
      })
    : [];

  const exportToExcel = async () => {
    if (filteredTransactions.length === 0) return;
    
    setLoading(true);
    try {
      // For export, we use the already filtered and fetched transactions
      const allTransactions = filteredTransactions;

      // Sheet 1: Invoice Summary (GST Optimized)
      const invoiceData = allTransactions.map(t => ({
        'Date': format(new Date(t.createdAt), "dd-MM-yyyy HH:mm"),
        'Invoice ID': t._id.slice(-8).toUpperCase(),
        'Taxable Value': (t.subTotal - (t.discountAmount || 0)).toFixed(2),
        'GST %': t.gstPercent ? `${t.gstPercent}%` : 'N/A',
        'GST Amount': (t.gstAmount || 0).toFixed(2),
        'Discount': (t.discountAmount || 0).toFixed(2),
        'Grand Total': (t.grandTotal || 0).toFixed(2),
        'Profit': (t.profit || 0).toFixed(2),
        'Items Count': t.items.length
      }));

      // Sheet 2: Itemized Breakdown
      const itemizedData: any[] = [];
      allTransactions.forEach(t => {
        t.items.forEach(item => {
          // Calculate proportional discount for the item for tax accuracy
          const totalBeforeDiscount = t.subTotal;
          const discountRatio = t.discountAmount && totalBeforeDiscount > 0 
            ? t.discountAmount / totalBeforeDiscount 
            : 0;
          
          const itemOriginalTotal = item.total;
          const itemDiscount = itemOriginalTotal * discountRatio;
          const itemTaxableValue = itemOriginalTotal - itemDiscount;
          
          itemizedData.push({
            'Invoice Date': format(new Date(t.createdAt), "dd-MM-yyyy"),
            'Invoice ID': t._id.slice(-8).toUpperCase(),
            'Medicine Name': item.name,
            'Batch': item.batchNumber,
            'Unit': item.unitType,
            'Qty': item.qty,
            'Price/Unit': item.sellingPrice.toFixed(2),
            'Gross Total': itemOriginalTotal.toFixed(2),
            'Discount': itemDiscount.toFixed(2),
            'Taxable Value': itemTaxableValue.toFixed(2),
          });
        });
      });

      // Create Workbook
      const wb = XLSX.utils.book_new();
      
      const wsInvoices = XLSX.utils.json_to_sheet(invoiceData);
      const wsItems = XLSX.utils.json_to_sheet(itemizedData);
      
      // Auto-size columns (Simple implementation)
      const fitToColumn = (data: any[]) => {
        const columnWidths = Object.keys(data[0] || {}).map(key => ({
          wch: Math.max(key.length, ...data.map(obj => obj[key]?.toString().length || 0)) + 2
        }));
        return columnWidths;
      };

      wsInvoices['!cols'] = fitToColumn(invoiceData);
      wsItems['!cols'] = fitToColumn(itemizedData);

      XLSX.utils.book_append_sheet(wb, wsInvoices, "Invoices Summary");
      XLSX.utils.book_append_sheet(wb, wsItems, "Itemized Sales");
      
      XLSX.writeFile(wb, `Tax_Invoices_Filtered_Export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
          <p className="text-sm text-muted-foreground">View and manage past sales records.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet size={18} />
            Export to Excel
          </button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Date, Items, or Amount..."
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all text-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex bg-secondary/50 p-1 rounded-lg border border-border">
          {(["1d", "7d", "1m"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateFilter(range)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                dateFilter === range
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary/50 sticky top-0 border-b border-border z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((t) => (
                <tr key={t._id} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                    {t._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {t.items.map((item, index) => (
                        <div key={index} className="text-sm text-foreground">
                          {item.name} <span className="text-xs text-muted-foreground">x{item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-bold text-foreground">
                      ₹{t.grandTotal.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Tax: ₹{t.gstAmount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/transactions/${t._id}`}
                        className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10 transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={24} className="opacity-50" />
                        <p>No transactions found.</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-secondary/30 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
           <span>Showing {filteredTransactions.length} records</span>
        </div>
      </div>
    </div>
  );
}

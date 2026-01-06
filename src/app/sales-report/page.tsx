"use client";

import { useEffect, useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import * as XLSX from "xlsx";

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

type SalesReportData = {
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  mostSoldMedicine: { name: string; quantity: number } | null;
  leastSoldMedicine: { name: string; quantity: number } | null;
  topSellingMedicines: Array<{ name: string; quantity: number; revenue: number }>;
  leastSellingMedicines: Array<{ name: string; quantity: number; revenue: number }>;
  dailySales: Array<{ date: string; sales: number; profit: number }>;
};

export default function SalesReportPage() {
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"1d" | "7d" | "1m">("7d");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Calculate date range based on filter
  useEffect(() => {
    let start = new Date();
    let end = new Date();

    switch (filter) {
      case "1d":
        start = startOfDay(new Date());
        end = endOfDay(new Date());
        break;
      case "7d":
        start = startOfDay(subDays(new Date(), 7));
        end = endOfDay(new Date());
        break;
      case "1m":
        start = startOfDay(subDays(new Date(), 30));
        end = endOfDay(new Date());
        break;
    }

    setDateRange({ start, end });
  }, [filter]);

  // Fetch report data when date range changes
  useEffect(() => {
    if (!dateRange) return;

    const fetchReportData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sales-report?startDate=${dateRange.start.toISOString()}&endDate=${dateRange.end.toISOString()}`
        );
        if (response.ok) {
          const data = await response.json();
          setReportData(data);
        }
      } catch (error) {
        console.error("Error fetching sales report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange]);

  // Format date for display
  const formatDate = (date: Date) => format(date, "MMM dd, yyyy");

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Function to export sales report to Excel
  const exportToExcel = () => {
    if (!reportData || !dateRange) return;
    
    const reportRows = [];
    
    // Add summary data
    reportRows.push({
      'Metric': 'Total Sales',
      'Value': `₹${reportData.totalSales.toFixed(2)}`
    });
    reportRows.push({
      'Metric': 'Total Profit',
      'Value': `₹${reportData.totalProfit.toFixed(2)}`
    });
    reportRows.push({
      'Metric': 'Total Transactions',
      'Value': reportData.totalTransactions
    });
    reportRows.push({
      'Metric': 'Average Transaction',
      'Value': `₹${reportData.totalTransactions > 0 
        ? (reportData.totalSales / reportData.totalTransactions).toFixed(2) 
        : '0.00'}`
    });
    
    if (reportData.mostSoldMedicine) {
      reportRows.push({
        'Metric': 'Most Sold Medicine',
        'Value': `${reportData.mostSoldMedicine.name} (${reportData.mostSoldMedicine.quantity})`
      });
    }
    
    if (reportData.leastSoldMedicine) {
      reportRows.push({
        'Metric': 'Least Sold Medicine',
        'Value': `${reportData.leastSoldMedicine.name} (${reportData.leastSoldMedicine.quantity})`
      });
    }
    
    // Add top selling medicines
    reportRows.push({}, {'Metric': 'Top Selling Medicines:', 'Value': ''});
    reportData.topSellingMedicines.forEach(med => {
      reportRows.push({
        'Metric': `  ${med.name}`,
        'Value': `Qty: ${med.quantity}, Revenue: ₹${med.revenue.toFixed(2)}`
      });
    });
    
    // Add least selling medicines
    reportRows.push({}, {'Metric': 'Least Selling Medicines:', 'Value': ''});
    reportData.leastSellingMedicines.forEach(med => {
      reportRows.push({
        'Metric': `  ${med.name}`,
        'Value': `Qty: ${med.quantity}, Revenue: ₹${med.revenue.toFixed(2)}`
      });
    });
    
    // Add daily sales data
    reportRows.push({}, {'Metric': 'Daily Sales:', 'Value': ''});
    reportData.dailySales.forEach(daily => {
      reportRows.push({
        'Metric': `  ${daily.date}`,
        'Value': `Sales: ₹${daily.sales.toFixed(2)}, Profit: ₹${daily.profit.toFixed(2)}`
      });
    });
    
    const ws = XLSX.utils.json_to_sheet(reportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    
    // Add date range to filename
    const startDate = format(dateRange.start, "yyyy-MM-dd");
    const endDate = format(dateRange.end, "yyyy-MM-dd");
    XLSX.writeFile(wb, `Sales_Report_${startDate}_to_${endDate}.xlsx`);
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Sales Report</h1>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export to Excel
          </button>
          
          <span>Filter:</span>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {(["1d", "7d", "1m"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`px-3 py-1 rounded-md text-sm ${
                  filter === option
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {reportData && dateRange && (
        <>
          <div className="text-sm text-gray-600">
            Showing data from {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="text-gray-600 text-sm">Total Sales</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{reportData.totalSales.toFixed(2)}
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="text-gray-600 text-sm">Total Profit</div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{reportData.totalProfit.toFixed(2)}
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="text-gray-600 text-sm">Transactions</div>
              <div className="text-2xl font-bold text-purple-600">
                {reportData.totalTransactions}
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="text-gray-600 text-sm">Avg. Transaction</div>
              <div className="text-2xl font-bold text-orange-600">
                ₹{reportData.totalTransactions > 0 
                  ? (reportData.totalSales / reportData.totalTransactions).toFixed(2) 
                  : '0.00'}
              </div>
            </div>
          </div>

          {/* Most & Least Sold Medicines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Most Sold Medicine</h2>
              {reportData.mostSoldMedicine ? (
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {reportData.mostSoldMedicine.name}
                  </div>
                  <div className="text-gray-600">
                    Quantity: {reportData.mostSoldMedicine.quantity}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">No data available</div>
              )}
            </div>
            
            <div className="border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Least Sold Medicine</h2>
              {reportData.leastSoldMedicine ? (
                <div className="text-center">
                  <div className="text-xl font-bold text-red-600">
                    {reportData.leastSoldMedicine.name}
                  </div>
                  <div className="text-gray-600">
                    Quantity: {reportData.leastSoldMedicine.quantity}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">No data available</div>
              )}
            </div>
          </div>

          {/* Daily Sales Chart Placeholder */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Daily Sales Trend</h2>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Daily sales chart would appear here
            </div>
          </div>
        </>
      )}
    </div>
  );
}
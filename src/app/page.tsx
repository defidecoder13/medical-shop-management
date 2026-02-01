"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/src/components/theme-toggle";
import { 
  LayoutDashboard, 
  LogOut, 
  Settings, 
  CreditCard, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Pill, 
  AlertCircle,
  ArrowRight,
  History,
  Receipt
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [medicinesCount, setMedicinesCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringThisMonth, setExpiringThisMonth] = useState(0);
  const [expiredItems, setExpiredItems] = useState(0);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch medicines data
        const medicineResponse = await fetch('/api/inventory');
        if (medicineResponse.ok) {
          const medicines = await medicineResponse.json();
          setMedicinesCount(medicines.length);
          
          // Calculate low stock count (items with quantity <= 10)
          const lowStock = medicines.filter((med: any) => med.stock <= 10);
          setLowStockCount(lowStock.length);
        }
        
        // Fetch expiry summary data
        const expiryResponse = await fetch('/api/expiry-summary');
        if (expiryResponse.ok) {
          const expiryData = await expiryResponse.json();
          setExpiringThisMonth(expiryData.expiringThisMonth);
          setExpiredItems(expiryData.expiredItems);
        }

        // Fetch transactions data
        const transactionsResponse = await fetch('/api/transactions');
        if (transactionsResponse.ok) {
          const transactions = await transactionsResponse.json();
          setTransactionsCount(transactions.length);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const totalExpiryIssues = expiringThisMonth + expiredItems;
  
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-gray-50/0 to-gray-50/0 dark:from-blue-900/20 dark:via-gray-950/0 dark:to-gray-950/0" suppressHydrationWarning={true}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Medi<span className="text-blue-600 dark:text-blue-400">Shop</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/settings"
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Overview</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Here's what's happening in your shop today.</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-100">
          <Link
            href="/billing"
            className="group relative overflow-hidden p-6 rounded-2xl glass-card border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-950/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard className="w-24 h-24 text-blue-600 dark:text-blue-400 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">New Bill</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create invoice & checkout</p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                Start Billing <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="group relative overflow-hidden p-6 rounded-2xl glass-card border border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-900 dark:to-emerald-950/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package className="w-24 h-24 text-emerald-600 dark:text-emerald-400 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Inventory</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage stock & items</p>
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                View Stock <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link
            href="/expiry"
            className="group relative overflow-hidden p-6 rounded-2xl glass-card border border-amber-100 dark:border-amber-900/30 bg-gradient-to-br from-white to-amber-50/50 dark:from-gray-900 dark:to-amber-950/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-24 h-24 text-amber-600 dark:text-amber-400 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Expiry Check</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Monitor expiring items</p>
              <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium">
                Check Status <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link
            href="/sales-report"
            className="group relative overflow-hidden p-6 rounded-2xl glass-card border border-purple-100 dark:border-purple-900/30 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-950/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24 text-purple-600 dark:text-purple-400 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Sales Report</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Analytics & revenue</p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                View Reports <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Improved Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500 delay-200">
          {/* 1. Total Medicines */}
          <Link href="/medicine" className="group relative overflow-hidden glass-card p-5 border-indigo-100 dark:border-indigo-900/30 flex flex-col justify-between h-full bg-gradient-to-br from-indigo-50/30 to-white dark:from-indigo-950/10 dark:to-gray-950">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Pill className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">Catalog</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Medicines</p>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 leading-none">{medicinesCount}</p>
              )}
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Manage Medicines <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* 2. Low Stock */}
          <Link href="/low-stock" className="group relative overflow-hidden glass-card p-5 border-rose-100 dark:border-rose-900/30 flex flex-col justify-between h-full bg-gradient-to-br from-rose-50/30 to-white dark:from-rose-950/10 dark:to-gray-950">
             <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${lowStockCount > 0 ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-gray-100 dark:bg-gray-800/40'}`}>
                <AlertCircle className={`w-5 h-5 ${lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-gray-500'}`} />
              </div>
              {lowStockCount > 0 && (
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-rose-500 text-white animate-bounce">Warning</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-1"></div>
              ) : (
                <p className={`text-3xl font-bold mt-1 leading-none ${lowStockCount > 0 ? 'text-rose-600 dark:text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                  {lowStockCount}
                </p>
              )}
            </div>
             <div className="mt-4 flex items-center text-sm font-medium text-rose-600 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
               Restock Now <ArrowRight className="w-4 h-4 ml-1" />
             </div>
          </Link>



          {/* 4. Total Transactions (New) */}
          <Link href="/transactions" className="group relative overflow-hidden glass-card p-5 border-blue-100 dark:border-blue-900/30 flex flex-col justify-between h-full bg-gradient-to-br from-blue-50/30 to-white dark:from-blue-950/10 dark:to-gray-950">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">History</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 leading-none">{transactionsCount}</p>
              )}
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
              View Ledger <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
          
        </div>
        
        {/* Empty state or simple spacer since 'Recent Activity' is removed */}
        <div className="h-12"></div>
        
      </main>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Transaction {
  _id: string;
  grandTotal: number;
  items: { name: string; qty: number }[];
  createdAt: string;
}

interface RecentTransactionsProps {
  data: Transaction[];
}

export function RecentTransactions({ data }: RecentTransactionsProps) {
  // Use passed data
  const transactions = data || [];

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h4 className="font-semibold text-card-foreground">Recent Transactions</h4>
        <Link href="/transactions" className="text-sm text-primary font-medium hover:underline">
          View All
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Transaction ID</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <tr key={t._id} className="hover:bg-muted/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                    {t._id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    <div className="flex flex-col">
                      <span className="font-medium">{t.items?.[0]?.name || "Unknown Item"}</span>
                      {t.items && t.items.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          + {t.items.length - 1} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                    ₹{(t.grandTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                  No recent transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

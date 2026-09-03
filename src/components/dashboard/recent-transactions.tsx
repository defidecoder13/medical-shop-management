"use client";

import Link from "next/link";
import { FileText, Eye, ReceiptText } from "@/src/components/icons";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";

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
  const transactions = data || [];

  return (
    <div className="surface-card p-6 h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FileText className="w-[17px] h-[17px]" strokeWidth={2.4} />
          </span>
          <h3 className="font-display text-[16px] font-extrabold text-foreground">
            Recent Transactions
          </h3>
        </div>
        <Link
          href="/transactions"
          className="btn-outline btn-sm"
        >
          View All
        </Link>
      </div>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="table-shell">
          <thead>
            <tr className="border-b border-border">
              <th className="th">Date & Time</th>
              <th className="th">Bill No.</th>
              <th className="th">Items</th>
              <th className="th text-right">Amount</th>
              <th className="th text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {transactions.length > 0 ? (
              transactions.map((t) => (
                <tr key={t._id} className="tbody-row group">
                  <td className="td whitespace-nowrap">
                    <div className="text-[13px] font-bold text-foreground">
                      {new Date(t.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                      {new Date(t.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </td>
                  <td className="td">
                    <Badge variant="neutral" className="font-mono tracking-wide">
                      #{t._id.slice(-8).toUpperCase()}
                    </Badge>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-0.5">
                      {t.items && t.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-[13px] font-semibold text-foreground leading-tight">
                          {item.name}{" "}
                          <span className="text-[11px] text-muted-foreground font-bold ml-0.5">
                            × {item.qty}
                          </span>
                        </div>
                      ))}
                      {t.items && t.items.length > 2 && (
                        <div className="text-[11px] font-bold text-primary uppercase tracking-wider mt-0.5">
                          + {t.items.length - 2} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="td text-right">
                    <div className="font-display text-[14px] font-extrabold text-foreground tracking-tight whitespace-nowrap">
                      ₹{(t.grandTotal || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="td text-center">
                    <Link
                      href={`/transactions/${t._id}`}
                      className="btn-ghost btn-icon mx-auto text-muted-foreground"
                      title="View Details"
                      aria-label={`View transaction ${t._id.slice(-8).toUpperCase()}`}
                    >
                      <Eye size={17} strokeWidth={2.4} />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<ReceiptText size={24} strokeWidth={2} />}
                    title="No transactions yet"
                    description="Sales you record from the billing screen will appear here."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

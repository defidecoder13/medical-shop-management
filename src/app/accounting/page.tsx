"use client";

import { useState, useEffect } from "react";
import { Landmark, ArrowUpRight, ArrowDownRight, FileText, Download } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";

type Account = {
  _id: string;
  name: string;
  type: string;
  balance: number;
};

type JournalEntry = {
  _id: string;
  description: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  entries: {
    accountId: { _id: string; name: string };
    type: "Debit" | "Credit";
    amount: number;
  }[];
};

export default function AccountingPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportRange, setExportRange] = useState("1m");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiClient.get("/api/accounting");
        if (data) {
          setAccounts(data.accounts || []);
          setJournals(data.journals || []);
        }
      } catch (err) {
        console.error("Failed to load accounting data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = () => {
    // Let the browser handle the file download from our API
    window.location.href = `/api/accounting/export?range=${exportRange}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="text-primary" />
            General Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Double-entry accounting records automatically generated from your operations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={exportRange}
            onChange={(e) => setExportRange(e.target.value)}
            className="bg-secondary/50 border border-border px-3 py-2 rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="7d">Last 7 Days</option>
            <option value="1m">Last 1 Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {accounts.map((acc) => (
          <div key={acc._id} className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
              <Landmark size={48} />
            </div>
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{acc.type}</div>
            <div className="font-bold text-lg text-foreground truncate">{acc.name}</div>
            <div className="text-2xl font-bold mt-2 text-primary tabular-nums">
              ₹{Math.abs(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              {acc.balance < 0 && <span className="text-sm text-destructive ml-1">(CR)</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <FileText size={18} className="text-indigo-500" />
            Recent Journal Entries
          </h2>
        </div>
        
        <div className="divide-y divide-border">
          {journals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No journal entries found. Generate a bill to see entries here.</div>
          ) : (
            journals.map((journal) => (
              <div key={journal._id} className="p-6 hover:bg-secondary/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{journal.description}</h3>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{journal.referenceType}</span>
                      <span>{new Date(journal.createdAt).toLocaleString("en-IN", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    ID: {journal._id.slice(-8)}
                  </div>
                </div>

                <div className="bg-background rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Account</th>
                        <th className="px-4 py-2 font-semibold text-right w-32">Debit (DR)</th>
                        <th className="px-4 py-2 font-semibold text-right w-32">Credit (CR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {/* Sort so Debits come first */}
                      {[...journal.entries]
                        .sort((a, b) => (a.type === 'Debit' ? -1 : 1))
                        .map((entry, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 font-medium text-foreground">
                            <span className={entry.type === 'Credit' ? "ml-6" : ""}>
                              {entry.accountId?.name || "Unknown Account"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                            {entry.type === 'Debit' ? `₹${entry.amount.toFixed(2)}` : "-"}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-rose-600 dark:text-rose-400 font-medium">
                            {entry.type === 'Credit' ? `₹${entry.amount.toFixed(2)}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

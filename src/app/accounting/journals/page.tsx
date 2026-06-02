"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ScrollText, ArrowRightLeft } from "lucide-react";
import { apiClient } from "@/src/lib/apiClient";

export default function JournalEntriesPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/api/accounting/journals?page=${page}&limit=20`)
      .then((res: any) => {
        if (res?.data && Array.isArray(res.data)) {
          setJournals(res.data);
          setTotalPages(res.pagination?.totalPages || 1);
        } else if (Array.isArray(res)) {
          setJournals(res);
          setTotalPages(1);
        } else {
          setJournals([]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#11327c] flex items-center gap-2">
            <ScrollText size={28} /> Journal Entries
          </h1>
          <p className="text-gray-500 text-sm font-medium">The master ledger of all double-entry financial events.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 font-bold">Loading Ledger...</div>
        ) : journals.length === 0 ? (
          <div className="p-10 text-center text-gray-500 font-bold">No transactions found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {journals.map((journal) => (
              <div key={journal._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{journal.description}</h3>
                    <p className="text-[12px] font-bold text-gray-400">
                      {format(new Date(journal.createdAt), "dd MMM yyyy, hh:mm a")} • Ref: {journal.referenceType}
                    </p>
                  </div>
                  <div className="bg-[#11327c]/10 text-[#11327c] px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                    Balanced <CheckCircle2 size={12} className="inline ml-1" />
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-black text-[10px] uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-2">Account</th>
                        <th className="px-4 py-2 text-right">Debit (₹)</th>
                        <th className="px-4 py-2 text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {journal.entries.map((entry: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-bold text-gray-700">
                            {entry.accountId?.name || "Unknown"}
                            <span className="ml-2 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {entry.accountId?.type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">
                            {entry.type === "Debit" ? entry.amount.toFixed(2) : "-"}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">
                            {entry.type === "Credit" ? entry.amount.toFixed(2) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="text-sm text-gray-500 font-medium">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

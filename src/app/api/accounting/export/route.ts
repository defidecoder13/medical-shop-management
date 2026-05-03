import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";
import JournalEntry from "@/src/models/JournalEntry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '1m';

    const now = new Date();
    let startDate = new Date();
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '1m') startDate.setMonth(now.getMonth() - 1);
    else if (range === '3m') startDate.setMonth(now.getMonth() - 3);
    else if (range === '12m') startDate.setFullYear(now.getFullYear() - 1);
    else if (range === 'all') startDate = new Date(0); // Beginning of time
    else startDate.setMonth(now.getMonth() - 1); // Default to 1m

    // Fetch all journals in the date range
    const journals = await JournalEntry.find({
      createdAt: { $gte: startDate }
    })
    .populate("entries.accountId")
    .sort({ createdAt: 1 }); // Sort chronological for accounting

    // Build CSV
    // Essential tax fields: Date, Time, Transaction ID, Type, Description, Account Name, Account Type, Debit, Credit
    const headers = [
      "Date",
      "Time",
      "Transaction ID",
      "Reference Type",
      "Description",
      "Account Name",
      "Account Type",
      "Debit (INR)",
      "Credit (INR)"
    ];

    let csvRows = [headers.map(h => `"${h}"`).join(",")];

    for (const j of journals) {
      const dateObj = new Date(j.createdAt);
      const dateStr = dateObj.toLocaleDateString("en-IN");
      const timeStr = dateObj.toLocaleTimeString("en-IN");
      
      for (const e of j.entries) {
        if (!e.accountId) continue; // In case account was deleted

        const acc = e.accountId as any;
        const debit = e.type === 'Debit' ? e.amount.toFixed(2) : "";
        const credit = e.type === 'Credit' ? e.amount.toFixed(2) : "";

        const row = [
          dateStr,
          timeStr,
          j.referenceId?.toString() || j._id.toString(),
          j.referenceType,
          j.description,
          acc.name,
          acc.type,
          debit,
          credit
        ];

        // Escape quotes and wrap in quotes to handle commas in description
        const escapedRow = row.map(field => {
          const strField = String(field || "");
          return `"${strField.replace(/"/g, '""')}"`;
        });

        csvRows.push(escapedRow.join(","));
      }
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="general_ledger_${range}_${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });

  } catch (error) {
    console.error("ACCOUNTING EXPORT API ERROR:", error);
    return NextResponse.json({ error: "Failed to export accounting data" }, { status: 500 });
  }
}

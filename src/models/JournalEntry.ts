import mongoose from "mongoose";

const JournalEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    description: { type: String, required: true },
    referenceType: { 
      type: String, 
      enum: ['Bill', 'PurchaseOrder', 'SupplierReturn', 'Manual'],
      required: true 
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    entries: [
      {
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
        type: { type: String, enum: ['Debit', 'Credit'], required: true },
        amount: { type: Number, required: true },
      }
    ]
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.JournalEntry) {
  delete mongoose.models.JournalEntry;
}

export default mongoose.models.JournalEntry || mongoose.model("JournalEntry", JournalEntrySchema);

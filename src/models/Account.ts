import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "Cash", "Sales Revenue", "Inventory Asset", "Supplier XYZ"
    type: { 
      type: String, 
      enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'],
      required: true 
    },
    balance: { type: Number, default: 0 }, // Running balance
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Account) {
  delete mongoose.models.Account;
}

export default mongoose.models.Account || mongoose.model("Account", AccountSchema);

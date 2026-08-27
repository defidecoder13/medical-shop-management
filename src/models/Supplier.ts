import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    gstin: { type: String, default: "" },
  },
  { timestamps: true }
);

// Force Schema Reload in Dev
if (process.env.NODE_ENV !== "production") {
  if (mongoose.models.Supplier) {
    delete mongoose.models.Supplier;
  }
}

export default mongoose.models.Supplier || mongoose.model("Supplier", SupplierSchema);

import mongoose, { Schema } from "mongoose";

const PurchaseItemSchema = new Schema(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: "Medicine" },
    name: String,
    batchNumber: String,
    expiryDate: Date,
    pack: String, // e.g., "15'S"
    qty: Number, // Number of strips or packs purchased
    freeQty: { type: Number, default: 0 }, // Scheme items
    mrp: Number,
    buyingPrice: Number, // Price per unit
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: Number, // buyingPrice * qty - discount + gst
  },
  { _id: false }
);

const PurchaseInvoiceSchema = new Schema(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: String,
    invoiceNumber: { type: String },
    invoiceDate: { type: Date, required: true },
    dueDate: Date,
    
    items: [PurchaseItemSchema],
    
    subTotal: Number,
    discountAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: Number,
    roundingAdjustment: { type: Number, default: 0 },

    status: { type: String, enum: ["Draft", "Unpaid", "Partial", "Paid"], default: "Unpaid" },
    amountPaid: { type: Number, default: 0 },
    
    paymentMethod: { type: String, enum: ["Cash", "Bank Transfer", "UPI", "Cheque", "Credit"], default: "Credit" },
  },
  { timestamps: true }
);

// Removed unique index to allow duplicate/empty invoice numbers

// Force Schema Reload in Dev
if (process.env.NODE_ENV !== "production") {
  if (mongoose.models.PurchaseInvoice) {
    delete mongoose.models.PurchaseInvoice;
  }
}

export default mongoose.models.PurchaseInvoice || mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);

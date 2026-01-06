import mongoose, { Schema } from "mongoose";

const BillItemSchema = new Schema(
  {
    name: String,
    batchNumber: String,
    unitType: { type: String, enum: ["strip", "tablet"] },
    qty: Number,
    sellingPrice: Number,
    total: Number,
  },
  { _id: false }
);

const BillSchema = new Schema(
  {
    items: [BillItemSchema],
    subTotal: Number,
    gstAmount: Number,
    grandTotal: Number,
    gstEnabled: Boolean,
    printInvoice: Boolean,
  },
  { timestamps: true }
);

// 🔥 FORCE DELETE OLD MODEL (THIS IS THE KEY)
if (mongoose.models.Bill) {
  delete mongoose.models.Bill;
}

export default mongoose.model("Bill", BillSchema, "bills");
import mongoose, { Schema } from "mongoose";

const BillItemSchema = new Schema(
  {
    name: String,
    batchNumber: String,
    unitType: { type: String, enum: ["strip", "tablet"] },
    qty: Number,
    sellingPrice: Number, // MRP at time of sale
    buyingPrice: Number,  // Cost Price at time of sale
    total: Number,
  },
  { _id: false }
);

const BillSchema = new Schema(
  {
    items: [BillItemSchema],
    subTotal: Number,
    discountPercent: Number,
    discountAmount: Number,
    gstAmount: Number,
    gstPercent: Number, // Tax rate at time of sale
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
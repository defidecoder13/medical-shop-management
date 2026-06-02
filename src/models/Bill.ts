import mongoose, { Schema } from "mongoose";

const BillItemSchema = new Schema(
  {
    name: String,
    brand: String,
    expiryDate: Date,
    batchNumber: String,
    hsnCode: String,
    pack: String,
    unitType: { type: String, enum: ["strip", "tablet"] },
    qty: Number,
    sellingPrice: Number, // MRP at time of sale
    buyingPrice: Number,  // Cost Price at time of sale
    total: Number,
    returnedQty: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
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
    patientName: String,
    patientPhone: String,
    patientAddress: String,
    doctorName: String,
    isReturn: { type: Boolean, default: false },
    returnStatus: { type: String, enum: ["None", "Partial", "Full"], default: "None" },
    originalBillId: { type: Schema.Types.ObjectId, ref: "Bill" },
    paymentMethod: { type: String, enum: ["Cash", "UPI", "Card"], default: "Cash" },
    roundingAdjustment: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔥 FORCE DELETE OLD MODEL (THIS IS THE KEY)
if (mongoose.models.Bill) {
  delete mongoose.models.Bill;
}

export default mongoose.model("Bill", BillSchema, "bills");
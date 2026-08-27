import mongoose from "mongoose";

const MedicineBatchSchema = new mongoose.Schema(
  {
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    batchNumber: { type: String, default: "" },
    expiryDate: { type: Date },
    
    // STOCK LOGIC
    stock: { type: Number, default: 0 }, // STRIPS
    totalTabletsInStock: { type: Number, default: 0 }, // STRIPS * tabletsPerStrip
    
    buyingPricePerStrip: { type: Number, default: 0 }, // COST PRICE
    sellingPricePerStrip: { type: Number, default: 0 }, // MRP
    rackNumber: { type: String }, // Rack Number
    discountPercent: { type: Number, default: 0 }, // DEFAULT DISCOUNT
    supplierName: { type: String, default: "Direct Purchase" }, // Ties batch to distributor
    purchaseInvoiceNumber: { type: String, default: "" },       // Optional reference
    pack: { type: String }, // e.g. "10x10" from supplier bill
    purchaseDate: { type: Date }, // Date of purchase
  },
  { timestamps: true }
);

// Compound Index for Search Performance
MedicineBatchSchema.index({
  batchNumber: "text",
  rackNumber: "text"
});

// Prevent Mongoose overwrite warning
if (process.env.NODE_ENV !== "production" && mongoose.models.MedicineBatch) {
  delete mongoose.models.MedicineBatch;
}

export default mongoose.models.MedicineBatch || mongoose.model("MedicineBatch", MedicineBatchSchema);

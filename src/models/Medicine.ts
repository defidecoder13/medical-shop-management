import mongoose from "mongoose";


// Force Schema Reload
const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: String,
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },

    //  STOCK LOGIC
    stock: { type: Number, required: true }, // STRIPS
    tabletsPerStrip: { type: Number, required: true },

    // DERIVED & MUTATED ON SALE
    totalTabletsInStock: { type: Number, required: true },

    buyingPricePerStrip: { type: Number, required: true }, // COST PRICE
    sellingPricePerStrip: { type: Number, required: true }, // MRP (New Field)
    rackNumber: { type: String }, // New Field
    composition: { type: String }, // Generic Name / Salt
    gstPercent: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// Compound Index for Search Performance
MedicineSchema.index({
  name: "text",
  brand: "text",
  composition: "text",
  batchNumber: "text",
  rackNumber: "text"
});

// Prevent Mongoose overwrite warning & force new schema in dev
if (process.env.NODE_ENV !== "production" && mongoose.models.Medicine) {
  delete mongoose.models.Medicine;
}

export default mongoose.model("Medicine", MedicineSchema);
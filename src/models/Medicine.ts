import mongoose from "mongoose";

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

    buyingPricePerStrip: { type: Number, required: true },
    gstPercent: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export default mongoose.models.Medicine ||
  mongoose.model("Medicine", MedicineSchema);
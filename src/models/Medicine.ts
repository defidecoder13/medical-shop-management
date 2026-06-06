import mongoose from "mongoose";


// Force Schema Reload
const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Unknown Medicine" },
    brand: String,
    barcode: { type: String }, // NEW: Barcode Scanner Support
    
    // PACKAGING
    tabletsPerStrip: { type: Number, default: 10 },

    // INVENTORY & AUTO-PO LIMITS
    stock: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    buyingPrice: { type: Number, default: 0 },
    minStockLevel: { type: Number, default: 5 }, // Reorder point (default 5 strips)
    maxStockLevel: { type: Number, default: 50 }, // Target stock (default 50 strips)
    defaultSupplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // Primary distributor
    
    // GENERAL INFO
    composition: { type: String }, // Generic Name / Salt
    hsnCode: { type: String }, // HSN Code
    gstPercent: { type: Number, default: 5 },
    category: { type: String, default: "Tablet" },
    pack: { type: String }, // e.g. "10x10" or "1 VIAL"
  },
  { timestamps: true }
);

// Compound Index for Search Performance
MedicineSchema.index({
  name: "text",
  brand: "text",
  composition: "text"
});

// Prevent Mongoose overwrite warning & force new schema in dev
if (process.env.NODE_ENV !== "production" && mongoose.models.Medicine) {
  delete mongoose.models.Medicine;
}

export default mongoose.model("Medicine", MedicineSchema);
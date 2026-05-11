import mongoose from "mongoose";


// Force Schema Reload
const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: String,
    barcode: { type: String }, // NEW: Barcode Scanner Support
    
    // PACKAGING
    tabletsPerStrip: { type: Number, required: true },

    // GENERAL INFO
    composition: { type: String }, // Generic Name / Salt
    hsnCode: { type: String }, // HSN Code
    gstPercent: { type: Number, default: 5 },
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
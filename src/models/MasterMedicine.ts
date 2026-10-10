import mongoose from "mongoose";

// Read-only model over the CSV-imported collection `mastermedicines`.
// Imported via mongoimport — all fields are strings. No price exposure here
// by design (feature spec: autocomplete fills everything except price).
const MasterMedicineSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, index: true },
    manufacturer_name: { type: String, index: true },
    salt_composition: { type: String },
    short_composition1: { type: String },
    short_composition2: { type: String },
    pack_size_label: { type: String },
    Is_discontinued: { type: String, index: true },
    type: { type: String },
    medicine_desc: { type: String },
  },
  {
    collection: "mastermedicines",
    strict: false,
    id: false, // allow real `id` CSV field (disable virtual id getter clash)
    timestamps: false,
  }
);

// Fast prefix/text-ish lookups for typeahead (created on first use)
MasterMedicineSchema.index({ name: 1 });
MasterMedicineSchema.index({ manufacturer_name: 1 });
MasterMedicineSchema.index({
  name: "text",
  manufacturer_name: "text",
  salt_composition: "text",
});

export default mongoose.models.MasterMedicine ||
  mongoose.model("MasterMedicine", MasterMedicineSchema);

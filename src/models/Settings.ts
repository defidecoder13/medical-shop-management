import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    dlNumber: { type: String },
    pharmacistName: { type: String },

    gstEnabled: { type: Boolean, default: false },
    gstNumber: { type: String, default: null },
    defaultGstPercent: { type: Number, default: 5 },

    invoiceFooter: { type: String },

    catalogVersion: { type: String, default: "1" },
  },
  { timestamps: true }
);

if (mongoose.models.Settings) {
  delete mongoose.models.Settings;
}

export default mongoose.model("Settings", SettingsSchema);
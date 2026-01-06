import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true },
    address: { type: String },

    gstEnabled: { type: Boolean, default: false },
    gstNumber: { type: String, default: null },
    defaultGstPercent: { type: Number, default: 5 },

    invoiceFooter: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);
import mongoose from "mongoose";

const SupplierReturnItemSchema = new mongoose.Schema({
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    name: { type: String, required: true },
    batchNumber: { type: String, required: true },
    unitType: { type: String, enum: ['strip', 'tablet'], required: true },
    qty: { type: Number, required: true },
    buyingPrice: { type: Number, required: true }, // The cost price at time of return
    total: { type: Number, required: true },
});

const SupplierReturnSchema = new mongoose.Schema(
    {
        supplierName: { type: String, required: true },
        reason: { type: String, required: true }, // 'Expired', 'Damaged', 'Excess', etc.
        totalRefundAmount: { type: Number, required: true },
        items: [SupplierReturnItemSchema],
    },
    { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.SupplierReturn) {
    delete mongoose.models.SupplierReturn;
}

export default mongoose.models.SupplierReturn || mongoose.model("SupplierReturn", SupplierReturnSchema);

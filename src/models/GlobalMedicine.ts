import mongoose from "mongoose";

const GlobalMedicineSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        brand: { type: String, required: true },
        composition: { type: String, required: true },
    },
    { timestamps: true }
);

// Search Index
GlobalMedicineSchema.index({
    name: "text",
    brand: "text",
    composition: "text",
});

if (process.env.NODE_ENV !== "production" && mongoose.models.GlobalMedicine) {
    delete mongoose.models.GlobalMedicine;
}

export default mongoose.models.GlobalMedicine ||
    mongoose.model("GlobalMedicine", GlobalMedicineSchema);

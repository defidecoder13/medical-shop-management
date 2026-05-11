import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true }, // Phone acts as unique ID
    address: { type: String },
    doctorName: { type: String },
    
    // CRM Data
    totalSpent: { type: Number, default: 0 },
    
    // The "Regular Buying" List
    regularMedicines: [{
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        name: { type: String },
        dosageInstructions: { type: String }
    }]
  },
  { timestamps: true }
);

// Force Schema Reload in Dev
if (process.env.NODE_ENV !== "production") {
    if (mongoose.models.Patient) {
        delete mongoose.models.Patient;
    }
}

export default mongoose.models.Patient || mongoose.model("Patient", PatientSchema);

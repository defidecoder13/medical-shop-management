import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

// Text index for fast prefix search
DoctorSchema.index({ name: "text" });
DoctorSchema.index({ name: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Doctor) {
  delete mongoose.models.Doctor;
}

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);

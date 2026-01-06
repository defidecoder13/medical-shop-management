import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    console.log("🟡 Reusing DB:", mongoose.connection.name);
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI!);

  console.log("✅ Connected to DB:", mongoose.connection.name);
}
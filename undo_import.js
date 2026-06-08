const mongoose = require('mongoose');

const MONGODB_URI = "process.env.MONGODB_URI // cluster0.tzgh1r4.mongodb.net/medishop?appName=Cluster0";

const MedicineBatchSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
  batchNumber: { type: String, default: "" },
  expiryDate: { type: Date },
  stock: { type: Number, default: 0 },
}, { timestamps: true });

const MedicineBatch = mongoose.models.MedicineBatch || mongoose.model("MedicineBatch", MedicineBatchSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Delete all batches that have expiry year 1970
  // 1970 is between Jan 1 1970 and Jan 2 1970
  const start1970 = new Date("1970-01-01T00:00:00.000Z");
  const end1970 = new Date("1970-12-31T23:59:59.999Z");
  
  const result = await MedicineBatch.deleteMany({ 
    expiryDate: { $gte: start1970, $lte: end1970 } 
  });
  
  console.log(`Successfully deleted ${result.deletedCount} corrupted imported batches with 1970 expiry dates!`);

  process.exit(0);
}

run().catch(console.error);

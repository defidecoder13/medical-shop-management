const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://papu001:bingotingo@cluster0.tzgh1r4.mongodb.net/medishop?appName=Cluster0";

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

  // Find all batches that have an expiry year of 1970
  const start1970 = new Date("1970-01-01T00:00:00.000Z");
  const end1970 = new Date("1970-12-31T23:59:59.999Z");
  
  const corruptedBatches = await MedicineBatch.find({ 
    expiryDate: { $gte: start1970, $lte: end1970 } 
  });
  
  console.log(`Found ${corruptedBatches.length} corrupted batches from 1970.`);
  
  let fixedCount = 0;
  for (const batch of corruptedBatches) {
      // Extract the milliseconds which represents the hidden Excel number
      // e.g., 1970-01-01T00:00:46.109Z -> 46109
      const excelNumber = batch.expiryDate.getTime();
      
      if (excelNumber > 20000 && excelNumber < 100000) {
          // Convert Excel serial number to real date
          const realDate = new Date(Math.round((excelNumber - 25569) * 86400 * 1000));
          
          batch.expiryDate = realDate;
          await batch.save();
          fixedCount++;
      } else {
          console.log(`Skipped batch ${batch.batchNumber} (Invalid ms: ${excelNumber})`);
      }
  }

  console.log(`Successfully fixed and mathematically restored ${fixedCount} dates in the database!`);
  process.exit(0);
}

run().catch(console.error);

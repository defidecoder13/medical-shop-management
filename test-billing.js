require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Bill = require("./src/models/Bill");
  const MedicineBatch = require("./src/models/MedicineBatch");
  const Medicine = require("./src/models/Medicine");

  try {
    const batch = await MedicineBatch.findOne().populate("medicineId");
    if (!batch) return console.log("no batch");
    
    // Simulate the exact code from route.ts
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const batchBulkOps = [];
      batchBulkOps.push({
        updateOne: {
          filter: { _id: batch._id },
          update: { $inc: { stock: -1, totalTabletsInStock: -10 } }
        }
      });
      await MedicineBatch.bulkWrite(batchBulkOps, { session });
      console.log("Success");
    });
    session.endSession();
  } catch (e) {
    console.error("ERROR", e);
  }
  process.exit(0);
}
test();

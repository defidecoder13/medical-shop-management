require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const medicinesCol = db.collection("medicines");
  const batchesCol = db.collection("medicinebatches");

  const q = "para";
  const regex = new RegExp(q, "i");

  console.time("Mongo Search Query");
  
  // 1. Find matching medicines
  const matchingMeds = await medicinesCol.find({
    $or: [{ name: regex }, { brand: regex }, { composition: regex }]
  }).project({ _id: 1 }).toArray();
  
  const medIds = matchingMeds.map(m => m._id);

  // 2. Find matching batches
  const matchingBatches = await batchesCol.aggregate([
    {
      $match: {
        $or: [
          { medicineId: { $in: medIds } },
          { batchNumber: regex },
          { rackNumber: regex }
        ]
      }
    },
    {
      $lookup: {
        from: "medicines",
        localField: "medicineId",
        foreignField: "_id",
        as: "medicineId"
      }
    },
    { $unwind: "$medicineId" }
  ]).toArray();

  console.timeEnd("Mongo Search Query");
  console.log("Results count:", matchingBatches.length);
  process.exit(0);
}
test();

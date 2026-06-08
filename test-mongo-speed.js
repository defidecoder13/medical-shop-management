require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const MedicineBatch = require("./src/models/MedicineBatch.ts").default || require("./src/models/MedicineBatch.ts");
  // Mongoose models in Next.js might be a bit tricky to load purely from outside due to TS
  const db = mongoose.connection;
  const collection = db.collection("medicinebatches");
  
  console.time("Mongo Fetch All");
  const rawBatches = await collection.aggregate([
    {
      $lookup: {
        from: "medicines",
        localField: "medicineId",
        foreignField: "_id",
        as: "medicineId"
      }
    },
    { $unwind: { path: "$medicineId", preserveNullAndEmptyArrays: true } }
  ]).toArray();
  console.timeEnd("Mongo Fetch All");
  console.log("Count:", rawBatches.length);
  process.exit(0);
}
test();

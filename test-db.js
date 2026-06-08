require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const MedicineBatch = require("./src/models/MedicineBatch");
  const Medicine = require("./src/models/Medicine");

  const totalBatches = await MedicineBatch.countDocuments();
  console.log("Total Batches in DB:", totalBatches);
  
  process.exit(0);
}
test();

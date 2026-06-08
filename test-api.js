require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const MedicineBatch = mongoose.models.MedicineBatch || mongoose.model("MedicineBatch", new mongoose.Schema({}, { strict: false, collection: "medicinebatches" }));
  
  const batch = await MedicineBatch.findOne({ stock: { $gt: 10 } });
  if (!batch) {
    console.log("No batch found");
    process.exit(0);
  }
  
  console.log(batch._id.toString());
  process.exit(0);
}
test();

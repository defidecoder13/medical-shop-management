require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const meds = await db.collection("medicines").find({ name: /drotin/i }).toArray();
  console.log("Meds:", meds);
  process.exit(0);
}
test();

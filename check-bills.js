require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const bills = await db.collection("bills").find({}).toArray();
  console.log("Total bills:", bills.length);
  if (bills.length > 0) {
    console.log("Sample bill items:", JSON.stringify(bills[0].items, null, 2));
  }
  
  process.exit(0);
}
run();

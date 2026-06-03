const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const invs = await db.collection("purchaseinvoices").find().sort({_id: -1}).limit(5).toArray();
  console.log("Recent Invoices:", invs.map(i => ({ invoice: i.invoiceNumber, items: i.items?.length })));
  
  const batches = await db.collection("medicinebatches").countDocuments();
  console.log("Total Batches:", batches);
  process.exit(0);
}
run();

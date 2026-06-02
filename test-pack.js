require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const batches = await db.collection('medicinebatches').find({}).limit(5).toArray();
  console.log("Batches:", batches.map(b => ({ batchNumber: b.batchNumber, pack: b.pack })));
  const meds = await db.collection('medicines').find({}).limit(5).toArray();
  console.log("Medicines:", meds.map(m => ({ name: m.name, pack: m.pack })));
  process.exit(0);
}
test().catch(console.error);

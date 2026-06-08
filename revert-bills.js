require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const bills = await db.collection("bills").find({}).toArray();
  console.log(`Found ${bills.length} bills to revert.`);
  
  let totalRestoredItems = 0;
  
  for (const bill of bills) {
    console.log(`Reverting bill: ${bill.invoiceNumber || bill._id}`);
    
    // 1. Revert Stock
    for (const item of bill.items) {
      const safeName = String(item.name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const medicine = await db.collection("medicines").findOne({ name: { $regex: `^${safeName}$`, $options: "i" } });
      
      if (!medicine) {
        console.log(`  Warning: Medicine not found for ${item.name}. Skipping stock restore for this item.`);
        continue;
      }
      
      const batch = await db.collection("medicinebatches").findOne({ 
        medicineId: medicine._id, 
        batchNumber: item.batchNumber 
      });
      
      if (!batch) {
        console.log(`  Warning: Batch ${item.batchNumber} not found for ${item.name}. Skipping stock restore.`);
        continue;
      }
      
      const tabletsPerStrip = medicine.tabletsPerStrip || 10;
      let tabletsRestored = 0;
      if (item.unitType === "strip") {
        tabletsRestored = item.qty * tabletsPerStrip;
      } else {
        tabletsRestored = item.qty;
      }
      
      const stockToRestore = tabletsRestored / tabletsPerStrip;
      
      // Update Batch
      await db.collection("medicinebatches").updateOne(
        { _id: batch._id },
        { 
          $inc: { 
            stock: stockToRestore, 
            totalTabletsInStock: tabletsRestored 
          } 
        }
      );
      
      // Update Medicine
      await db.collection("medicines").updateOne(
        { _id: medicine._id },
        { $inc: { stock: stockToRestore } }
      );
      
      totalRestoredItems++;
    }
    
    // 2. Revert Patient Spend
    if (bill.patientPhone) {
      await db.collection("patients").updateOne(
        { phone: bill.patientPhone },
        { $inc: { totalSpent: -bill.grandTotal } }
      );
    }
    
    // 3. Delete Bill
    await db.collection("bills").deleteOne({ _id: bill._id });
  }
  
  console.log(`Successfully reverted ${bills.length} bills and restored stock for ${totalRestoredItems} items.`);
  process.exit(0);
}
run();

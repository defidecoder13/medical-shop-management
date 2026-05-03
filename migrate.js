const { MongoClient } = require('mongodb');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB for migration...");

    const db = client.db();
    const medicinesCollection = db.collection('medicines');
    const batchesCollection = db.collection('medicinebatches');
    const accountsCollection = db.collection('accounts');

    // 1. Migrate Medicines to Medicine + MedicineBatches
    const medicines = await medicinesCollection.find({}).toArray();
    console.log(`Found ${medicines.length} medicines to process.`);

    for (const med of medicines) {
      // Check if this medicine still has 'batchNumber' field indicating it hasn't been migrated
      if (med.batchNumber) {
        // Create Batch record
        const batch = {
          medicineId: med._id,
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          stock: med.stock,
          totalTabletsInStock: med.totalTabletsInStock,
          buyingPricePerStrip: med.buyingPricePerStrip,
          sellingPricePerStrip: med.sellingPricePerStrip,
          rackNumber: med.rackNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await batchesCollection.insertOne(batch);

        // Update Medicine master to unset batch-specific fields
        await medicinesCollection.updateOne(
          { _id: med._id },
          {
            $unset: {
              batchNumber: "",
              expiryDate: "",
              stock: "",
              totalTabletsInStock: "",
              buyingPricePerStrip: "",
              sellingPricePerStrip: "",
              rackNumber: ""
            }
          }
        );

        console.log(`Migrated batch ${batch.batchNumber} for ${med.name}`);
      }
    }
    
    console.log("Medicine batches migration completed.");

    // 2. Seed Default Accounts
    const defaultAccounts = [
      { name: "Cash", type: "Asset", balance: 0 },
      { name: "Accounts Receivable", type: "Asset", balance: 0 },
      { name: "Inventory Asset", type: "Asset", balance: 0 },
      { name: "Accounts Payable", type: "Liability", balance: 0 },
      { name: "Sales Revenue", type: "Revenue", balance: 0 },
      { name: "Cost of Goods Sold", type: "Expense", balance: 0 },
    ];

    for (const acc of defaultAccounts) {
      const exists = await accountsCollection.findOne({ name: acc.name });
      if (!exists) {
        await accountsCollection.insertOne({
          ...acc,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created default account: ${acc.name}`);
      }
    }

    console.log("Account seeding completed.");

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

migrate();

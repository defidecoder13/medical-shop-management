const { MongoClient, ObjectId } = require('mongodb');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding test data...");

    const db = client.db();
    
    // 1. Wipe everything clean
    console.log("Wiping collections...");
    await db.collection('medicines').deleteMany({});
    await db.collection('medicinebatches').deleteMany({});
    await db.collection('bills').deleteMany({});
    await db.collection('supplierreturns').deleteMany({});
    await db.collection('journalentries').deleteMany({});
    await db.collection('accounts').deleteMany({});

    // 2. Seed Default Accounts
    const accountsCollection = db.collection('accounts');
    const defaultAccounts = [
      { _id: new ObjectId(), name: "Cash", type: "Asset", balance: 0 },
      { _id: new ObjectId(), name: "Accounts Receivable", type: "Asset", balance: 0 },
      { _id: new ObjectId(), name: "Inventory Asset", type: "Asset", balance: 0 },
      { _id: new ObjectId(), name: "Accounts Payable", type: "Liability", balance: 0 },
      { _id: new ObjectId(), name: "Sales Revenue", type: "Revenue", balance: 0 },
      { _id: new ObjectId(), name: "Cost of Goods Sold", type: "Expense", balance: 0 },
    ];

    for (const acc of defaultAccounts) {
      await accountsCollection.insertOne({
        ...acc,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    console.log("Created 6 core accounts.");

    // 3. Seed Medicines (Masters)
    const medicinesCollection = db.collection('medicines');
    const masters = [
      {
        _id: new ObjectId(),
        name: "Paracetamol 500mg",
        brand: "Dolo",
        composition: "Paracetamol",
        hsnCode: "3004",
        tabletsPerStrip: 15,
        gstPercent: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Amoxicillin 250mg",
        brand: "Moxikind",
        composition: "Amoxicillin",
        hsnCode: "3004",
        tabletsPerStrip: 10,
        gstPercent: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: "Cough Syrup 100ml",
        brand: "Benadryl",
        composition: "Diphenhydramine",
        hsnCode: "3004",
        tabletsPerStrip: 1, // Liquid is usually 1 bottle = 1 unit
        gstPercent: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await medicinesCollection.insertMany(masters);
    console.log("Created 3 Master Medicines.");

    // 4. Seed Batches (To test FEFO)
    const batchesCollection = db.collection('medicinebatches');
    const today = new Date();
    
    // Paracetamol Batches
    const pcmMaster = masters[0];
    const pcmBatches = [
      {
        medicineId: pcmMaster._id,
        batchNumber: "PCM-OLD-01",
        expiryDate: new Date(today.getFullYear(), today.getMonth() + 1, 15), // Expiring next month
        stock: 5,
        totalTabletsInStock: 5 * pcmMaster.tabletsPerStrip,
        buyingPricePerStrip: 20,
        sellingPricePerStrip: 30,
        rackNumber: "A1",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        medicineId: pcmMaster._id,
        batchNumber: "PCM-MID-02",
        expiryDate: new Date(today.getFullYear(), today.getMonth() + 6, 10), // Expiring in 6 months
        stock: 10,
        totalTabletsInStock: 10 * pcmMaster.tabletsPerStrip,
        buyingPricePerStrip: 22,
        sellingPricePerStrip: 32,
        rackNumber: "A1",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        medicineId: pcmMaster._id,
        batchNumber: "PCM-NEW-03",
        expiryDate: new Date(today.getFullYear() + 2, today.getMonth(), 1), // Expiring in 2 years
        stock: 20,
        totalTabletsInStock: 20 * pcmMaster.tabletsPerStrip,
        buyingPricePerStrip: 25,
        sellingPricePerStrip: 35,
        rackNumber: "A2",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Amoxicillin Batches
    const amoxMaster = masters[1];
    const amoxBatches = [
      {
        medicineId: amoxMaster._id,
        batchNumber: "AMX-01",
        expiryDate: new Date(today.getFullYear() + 1, today.getMonth(), 1),
        stock: 15,
        totalTabletsInStock: 15 * amoxMaster.tabletsPerStrip,
        buyingPricePerStrip: 80,
        sellingPricePerStrip: 110,
        rackNumber: "B1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Cough Syrup Batches
    const syrupMaster = masters[2];
    const syrupBatches = [
      {
        medicineId: syrupMaster._id,
        batchNumber: "SYR-01",
        expiryDate: new Date(today.getFullYear() + 1, today.getMonth(), 1),
        stock: 8,
        totalTabletsInStock: 8 * syrupMaster.tabletsPerStrip,
        buyingPricePerStrip: 90,
        sellingPricePerStrip: 120,
        rackNumber: "C1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await batchesCollection.insertMany([...pcmBatches, ...amoxBatches, ...syrupBatches]);
    console.log("Created 5 Batches (including multi-batch FEFO testing scenario for Paracetamol).");

    // 5. Calculate initial inventory value and update Inventory Asset account
    let totalInventoryValue = 0;
    const allBatches = [...pcmBatches, ...amoxBatches, ...syrupBatches];
    for (const b of allBatches) {
      totalInventoryValue += (b.stock * b.buyingPricePerStrip);
    }
    
    await accountsCollection.updateOne(
      { name: "Inventory Asset" },
      { $set: { balance: totalInventoryValue } }
    );
    console.log(`Updated Inventory Asset starting balance to ₹${totalInventoryValue}`);

    console.log("✅ Database reset and seeded successfully!");

  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await client.close();
  }
}

seed();

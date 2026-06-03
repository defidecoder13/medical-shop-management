const mongoose = require('mongoose');

const uri = "mongodb+srv://papu001:7872184403@cluster0.tzgh1r4.mongodb.net/medishop?appName=Cluster0";

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const count = await db.collection('globalmedicines').countDocuments();
    console.log(`\n✅ SUCCESS! Found ${count} medicines in the globalmedicines collection!`);
    
    // Sample a random document
    if (count > 0) {
      const sample = await db.collection('globalmedicines').findOne({});
      console.log(`\nSample entry:`);
      console.log(`Name: ${sample.name}`);
      console.log(`Composition: ${sample.composition}`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

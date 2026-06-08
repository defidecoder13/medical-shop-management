const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

content = content.replace(/      \/\/ Fetch from Mongo directly \(Most reliable, no stale UI bugs\)\n      const rawBatches = await MedicineBatch\.find\(\{\}\)\.populate\("medicineId"\)\.lean\(\);\n        const rawBatches = await MedicineBatch\.find\(\{\}\)\.populate\("medicineId"\)\.lean\(\);\n        allBatches = rawBatches\.map\(\(batch: any\) => \{/g, 
`      // Fetch from Mongo directly (Most reliable, no stale UI bugs)
      const rawBatches = await MedicineBatch.find({}).populate("medicineId").lean();
      let allBatches = rawBatches.map((batch: any) => {`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

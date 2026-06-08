const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

content = content.replace(/      const rawBatches = await MedicineBatch\.find\(\{\}\)\.populate\("medicineId"\)\.lean\(\);/, 
`      const rawBatches = await MedicineBatch.find({}).populate("medicineId").lean();
      console.log(\`[GET /api/inventory] Found \${rawBatches.length} batches directly from Mongo\`);`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

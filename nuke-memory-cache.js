const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

// Completely rip out memory cache logic
content = content.replace(/let memoryCache: any\[\] \| null = null;\nlet memoryCacheVersion: string \| null = null;\n/g, '');

content = content.replace(/      let allBatches = null;\n      let currentVersion = "default";[\s\S]*?\/\/ 3\. If memory cache miss or stale, fetch from Mongo directly \(500ms\)\n      if \(!allBatches\) {/, `      // Fetch from Mongo directly (Most reliable, no stale UI bugs)
      const rawBatches = await MedicineBatch.find({}).populate("medicineId").lean();`);

content = content.replace(/\s+\/\/ Save to ultra-fast local memory\n\s+memoryCache = allBatches;\n\s+memoryCacheVersion = currentVersion;\n\s+}/g, '');

content = content.replace(/      memoryCache = null;\n/g, '');

fs.writeFileSync('src/app/api/inventory/route.ts', content);

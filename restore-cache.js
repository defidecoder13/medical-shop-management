const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

// 1. Restore global variables
content = content.replace('// Global in-memory cache for ultra-fast Zero-Latency Search', 
`// Global in-memory cache for ultra-fast Zero-Latency Search
let memoryCache: any[] | null = null;
let memoryCacheVersion: string | null = null;`);

// 2. Restore logic
content = content.replace(`    // --------------------------------------------------------------------------------
    // 🔥 ZERO-LATENCY IN-MEMORY PIPELINE (Syncs via Redis Version)
    // --------------------------------------------------------------------------------
    if (!idsParam) {
      // Fetch from Mongo directly (Most reliable, no stale UI bugs)
      const rawBatches = await MedicineBatch.find({}).populate("medicineId").lean();
      let allBatches = rawBatches.map((batch: any) => {`, `    // --------------------------------------------------------------------------------
    // 🔥 ZERO-LATENCY IN-MEMORY PIPELINE (Syncs via Redis Version)
    // --------------------------------------------------------------------------------
    if (!idsParam) {
      let allBatches = null;
      let currentVersion = "default";
      
      // 1. Fetch lightweight version string from Redis (~50ms)
      if (redis) {
          const v = await getCache("catalog:version");
          if (v) currentVersion = String(v); // Force string for safe comparison
      }

      // 2. Check local memory cache (0ms latency!)
      if (memoryCache && memoryCacheVersion === currentVersion) {
          allBatches = memoryCache;
      }

      // 3. If memory cache miss or stale, fetch from Mongo directly (500ms)
      if (!allBatches) {
        const rawBatches = await MedicineBatch.find({}).populate("medicineId").lean();
        allBatches = rawBatches.map((batch: any) => {`);

// 3. Restore saving logic
content = content.replace(/            pack: batch\.pack \|\| med\.pack \|\| "",\n          };\n        }\);\n\n      \/\/ 3\. Perform in-memory filtering \(Instantaneous\)/, `            pack: batch.pack || med.pack || "",
          };
        });

        // Save to ultra-fast local memory
        memoryCache = allBatches;
        memoryCacheVersion = currentVersion;
      }

      // 3. Perform in-memory filtering (Instantaneous)`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

// Add Settings import
if (!content.includes('import Settings from "@/src/models/Settings";')) {
    content = content.replace('import MedicineBatch from "@/src/models/MedicineBatch";', 
`import MedicineBatch from "@/src/models/MedicineBatch";
import Settings from "@/src/models/Settings";`);
}

// Replace version check
content = content.replace(/      \/\/ 1\. Fetch lightweight version string from Redis \(\~50ms\).*?if \(redis\) \{.*?const v = await getCache<string>\("catalog:version"\);.*?if \(v\) currentVersion = String\(v\); \/\/ Force to string to prevent Upstash Number\/String mismatches\n      \}/s,
`      // 1. Fetch lightweight version string from Mongo (~10ms, safe from Next.js caching)
      const settings = await Settings.findOne({}).lean();
      if (settings?.catalogVersion) {
          currentVersion = String(settings.catalogVersion);
      }`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

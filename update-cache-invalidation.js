const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

// The PUT method
content = content.replace(/keys\.push\("catalog:all"\);\s+\/\/ Legacy cleanup\s+await redis\.del\(\.\.\.keys\);\s+await setCache\("catalog:version", Date\.now\(\)\.toString\(\), 604800\);\s+\}/g, `keys.push("catalog:all"); // Legacy cleanup
      await redis.del(...keys);
      await setCache("catalog:version", Date.now().toString(), 604800);
    }
    memoryCache = null;`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

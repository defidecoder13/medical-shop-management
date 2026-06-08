const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

// Move Settings.findOneAndUpdate outside if (redis) for POST
content = content.replace(/    if \(redis\) \{\n      const keys = await redis\.keys\("inventory:get:\*"\);\n      keys\.push\("catalog:all"\); \/\/ Legacy cleanup\n      await redis\.del\(\.\.\.keys\);\n      await Settings\.findOneAndUpdate\(\{\}, \{ catalogVersion: Date\.now\(\)\.toString\(\) \}, \{ new: true, upsert: true \}\);\n      if \(redis\) await setCache\("catalog:version", Date\.now\(\)\.toString\(\), 604800\);\n      memoryCache = null;\n    \}/g,
`    await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
    memoryCache = null;
    if (redis) {
      const keys = await redis.keys("inventory:get:*");
      keys.push("catalog:all"); // Legacy cleanup
      await redis.del(...keys);
      await setCache("catalog:version", Date.now().toString(), 604800);
    }`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

// The PUT method
content = content.replace(/if \(redis\) \{\s+const keys = await redis\.keys\("inventory:get:\*"\);\s+keys\.push\("catalog:all"\);\s+await redis\.del\(\.\.\.keys\);\s+\}/g, `if (redis) {
      const keys = await redis.keys("inventory:get:*");
      keys.push("catalog:all"); // Legacy cleanup
      await redis.del(...keys);
      await setCache("catalog:version", Date.now().toString(), 604800);
    }`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

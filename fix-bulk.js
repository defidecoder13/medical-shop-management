const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/bulk/route.ts', 'utf8');

content = content.replace(/if \(redis\) \{\s+const keys = await redis\.keys\("inventory:get:\*"\);\s+keys\.push\("catalog:all"\);\s+await redis\.del\(\.\.\.keys\);\s+\}/g, `if (redis) {
            const keys = await redis.keys("inventory:get:*");
            keys.push("catalog:all"); // Legacy cleanup
            await redis.del(...keys);
            await redis.set("catalog:version", Date.now().toString());
        }`);

fs.writeFileSync('src/app/api/inventory/bulk/route.ts', content);

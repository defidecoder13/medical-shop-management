const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/[id]/route.ts', 'utf8');

// Replace PUT cache clearing
content = content.replace(/await deleteCache\("catalog:all"\);/g, `await deleteCache("catalog:all");
        await redis.set("catalog:version", Date.now().toString());`);

// Replace DELETE cache clearing
content = content.replace(/if \(keys\.length > 0\) await redis\.del\(\.\.\.keys\);\s+\}/g, `if (keys.length > 0) await redis.del(...keys);
            await redis.set("catalog:version", Date.now().toString());
        }`);

fs.writeFileSync('src/app/api/inventory/[id]/route.ts', content);

const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/[id]/route.ts', 'utf8');

content = content.replace(/if \(redis\) await Settings\.findOneAndUpdate\(\{\}, \{ catalogVersion: Date\.now\(\)\.toString\(\) \}, \{ new: true, upsert: true \}\);\n\s+await redis\.set\("catalog:version", Date\.now\(\)\.toString\(\)\);/g,
`if (redis) {
    await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
    await redis.set("catalog:version", Date.now().toString());
}`);

content = content.replace(/await Settings\.findOneAndUpdate\(\{\}, \{ catalogVersion: Date\.now\(\)\.toString\(\) \}, \{ new: true, upsert: true \}\);\n\s+await redis\.set\("catalog:version", Date\.now\(\)\.toString\(\)\);/g,
`await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            if (redis) await redis.set("catalog:version", Date.now().toString());`);

fs.writeFileSync('src/app/api/inventory/[id]/route.ts', content);

let routeContent = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');
routeContent = routeContent.replace(/await Settings\.findOneAndUpdate\(\{\}, \{ catalogVersion: Date\.now\(\)\.toString\(\) \}, \{ new: true, upsert: true \}\);\n\s+await setCache\("catalog:version", Date\.now\(\)\.toString\(\), 604800\);/g,
`await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
      if (redis) await setCache("catalog:version", Date.now().toString(), 604800);`);
fs.writeFileSync('src/app/api/inventory/route.ts', routeContent);

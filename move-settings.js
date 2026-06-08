const fs = require('fs');

let idContent = fs.readFileSync('src/app/api/inventory/[id]/route.ts', 'utf8');

idContent = idContent.replace(/        if \(redis\) \{\n    await Settings\.findOneAndUpdate\(\{\}, \{ catalogVersion: Date\.now\(\)\.toString\(\) \}, \{ new: true, upsert: true \}\);\n            if \(redis\) await redis\.set\("catalog:version", Date\.now\(\)\.toString\(\)\);\n\}/g,
`        await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
        if (redis) {
            await redis.set("catalog:version", Date.now().toString());
        }`);

idContent = idContent.replace(/            await Settings\.findOneAndUpdate\(\{\}, \{ catalogVersion: Date\.now\(\)\.toString\(\) \}, \{ new: true, upsert: true \}\);\n            if \(redis\) await redis\.set\("catalog:version", Date\.now\(\)\.toString\(\)\);\n        \}/g,
`            await redis.set("catalog:version", Date.now().toString());
        }
        await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });`);

fs.writeFileSync('src/app/api/inventory/[id]/route.ts', idContent);

let routeContent = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

routeContent = routeContent.replace(/      await Settings\.findOneAndUpdate\(\{\}, \{ catalogVersion: Date\.now\(\)\.toString\(\) \}, \{ new: true, upsert: true \}\);\n      if \(redis\) await setCache\("catalog:version", Date\.now\(\)\.toString\(\), 604800\);/g,
`      await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
      if (redis) await setCache("catalog:version", Date.now().toString(), 604800);`);

fs.writeFileSync('src/app/api/inventory/route.ts', routeContent);

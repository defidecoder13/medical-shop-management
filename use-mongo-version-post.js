const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

content = content.replace(/await setCache\("catalog:version", Date\.now\(\)\.toString\(\), 604800\);/g,
`await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
      await setCache("catalog:version", Date.now().toString(), 604800);`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

// Explicitly clear memory cache in POST and PUT to guarantee local invalidation
content = content.replace(/await setCache\("catalog:version", Date\.now\(\)\.toString\(\), 604800\);/g, `await setCache("catalog:version", Date.now().toString(), 604800);
      memoryCache = null;`);

fs.writeFileSync('src/app/api/inventory/route.ts', content);

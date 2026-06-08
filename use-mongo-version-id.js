const fs = require('fs');

let content = fs.readFileSync('src/app/api/inventory/[id]/route.ts', 'utf8');

if (!content.includes('import Settings from "@/src/models/Settings";')) {
    content = content.replace('import MedicineBatch from "@/src/models/MedicineBatch";', 
`import MedicineBatch from "@/src/models/MedicineBatch";
import Settings from "@/src/models/Settings";`);
}

content = content.replace(/await redis\.set\("catalog:version", Date\.now\(\)\.toString\(\)\);/g,
`await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            await redis.set("catalog:version", Date.now().toString());`);

fs.writeFileSync('src/app/api/inventory/[id]/route.ts', content);

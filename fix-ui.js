const fs = require('fs');
let content = fs.readFileSync('src/app/inventory/page.tsx', 'utf8');

content = content.replace(/\{med\.pack \|\| "Strip"\}/g, '{med.pack || "Strip"} {Number(med.tabletsPerStrip) > 1 ? `(${med.tabletsPerStrip} Tabs/Strip)` : ""}');

fs.writeFileSync('src/app/inventory/page.tsx', content);

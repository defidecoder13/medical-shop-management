const fs = require('fs');

const files = [
    'src/app/api/purchases/route.ts',
    'src/app/api/inventory/bulk/route.ts',
    'src/app/api/returns/route.ts',
    'src/app/api/billing/route.ts',
    'src/app/api/supplier-returns/route.ts',
    'src/app/api/factory-reset/route.ts'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    if (!content.includes('import Settings from "@/src/models/Settings";')) {
        content = content.replace(/import { NextResponse } from "next\/server";/,
            'import { NextResponse } from "next/server";\nimport Settings from "@/src/models/Settings";'
        );
    }

    content = content.replace(/if \(redis\).*?await redis\.set\("catalog:version".*?;/g, (match) => {
        return `await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            ${match}`;
    });

    content = content.replace(/await setCache\("catalog:version".*?;/g, (match) => {
        return `await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            ${match}`;
    });

    content = content.replace(/await redis\.set\("catalog:version".*?;/g, (match) => {
        if (!match.includes('if (redis)')) {
            return `await Settings.findOneAndUpdate({}, { catalogVersion: Date.now().toString() }, { new: true, upsert: true });
            ${match}`;
        }
        return match;
    });

    fs.writeFileSync(file, content);
}

const fs = require('fs');
let content = fs.readFileSync('src/app/inventory/page.tsx', 'utf8');

// Replace specific lines manually to avoid touching useEffects
content = content.replace(/setMessage\(\{ text: msg, type: 'success' \}\);\s+fetchMedicines\(\);/g, `setMessage({ text: msg, type: 'success' });
        setTimeout(() => fetchMedicines(), 500);`);

content = content.replace(/\/\/ Fetch in background to sync true IDs\s+fetchMedicines\(\);/g, `// Fetch in background to sync true IDs
      setTimeout(() => fetchMedicines(), 500);`);

content = content.replace(/\/\/ Revert optimistic update\s+fetchMedicines\(\);/g, `// Revert optimistic update
      setTimeout(() => fetchMedicines(), 500);`);

content = content.replace(/catch \(error: any\) \{\s+fetchMedicines\(\);/g, `catch (error: any) {
        setTimeout(() => fetchMedicines(), 500);`);

fs.writeFileSync('src/app/inventory/page.tsx', content);

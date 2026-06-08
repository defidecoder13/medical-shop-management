const fs = require('fs');
let content = fs.readFileSync('src/app/inventory/page.tsx', 'utf8');

content = content.replace(/try \{\s+const data = await apiClient\.delete\(`\/api\/inventory\/\$\{id\}`\);\s+setMessage\(\{ text: data\.offlineQueued \? "Deletion queued for sync" : "Medicine deleted permanently", type: 'success' \}\);\s+fetchMedicines\(\);\s+\} catch \(error: any\) \{/g, `try {
        setMedicines(prev => prev.filter(m => m._id !== id));
        const data = await apiClient.delete(\`/api/inventory/\${id}\`);

        setMessage({ text: data.offlineQueued ? "Deletion queued for sync" : "Medicine deleted permanently", type: 'success' });
        setTimeout(() => fetchMedicines(), 500);
      } catch (error: any) {
        fetchMedicines();`);

fs.writeFileSync('src/app/inventory/page.tsx', content);

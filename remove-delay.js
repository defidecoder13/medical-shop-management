const fs = require('fs');

function removeDelay(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace setTimeout(() => fetchMedicines(), 500); with fetchMedicines();
    content = content.replace(/setTimeout\(\(\) => (fetch[A-Za-z]+)\(\), 500\);/g, '$1();');
    
    fs.writeFileSync(file, content);
}

removeDelay('src/app/inventory/page.tsx');
removeDelay('src/app/suppliers/page.tsx');
removeDelay('src/app/patients/page.tsx');

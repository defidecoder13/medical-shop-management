const fs = require('fs');

function fixDeleteLoading(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    // Specifically target deletes to see if they use setLoading
    if (content.includes('setLoading(true)') && content.includes('delete')) {
        console.log(`Check ${file}`);
    }
}

fixDeleteLoading('src/app/suppliers/page.tsx');
fixDeleteLoading('src/app/patients/page.tsx');

const fs = require('fs');

let content = fs.readFileSync('src/app/inventory/page.tsx', 'utf8');

content = content.replace(`    if (window.confirm("Are you sure you want to permanently delete this medicine? This action cannot be undone.")) {
      setLoading(true);
      try {`, `    if (window.confirm("Are you sure you want to permanently delete this medicine? This action cannot be undone.")) {
      try {`);

content = content.replace(`      } finally {
        setLoading(false);
        setTimeout(() => setMessage(null), 3000);
      }`, `      } finally {
        setTimeout(() => setMessage(null), 3000);
      }`);

fs.writeFileSync('src/app/inventory/page.tsx', content);

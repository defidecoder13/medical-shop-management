const fs = require('fs');
let content = fs.readFileSync('src/app/suppliers/page.tsx', 'utf8');

content = content.replace(/setIsModalOpen\(false\);\s+fetchSuppliers\(\);/g, `setIsModalOpen(false);
      setTimeout(() => fetchSuppliers(), 500);`);

content = content.replace(/setIsPaymentModalOpen\(false\);\s+fetchSuppliers\(\);/g, `setIsPaymentModalOpen(false);
      setTimeout(() => fetchSuppliers(), 500);`);

content = content.replace(/showNotification\("Supplier deleted successfully", "success"\);\s+fetchSuppliers\(\);/g, `showNotification("Supplier deleted successfully", "success");
      setTimeout(() => fetchSuppliers(), 500);`);

fs.writeFileSync('src/app/suppliers/page.tsx', content);

const fs = require('fs');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace UI texts, being careful to only match English text
  content = content.replace(/Medicine Name/g, "Product Name");
  content = content.replace(/medicine name/ig, "product name");
  content = content.replace(/Add New Medicine/g, "Add New Product");
  content = content.replace(/Edit Medicine/g, "Edit Product");
  content = content.replace(/Restock Medicine Batch/g, "Restock Product Batch");
  content = content.replace(/Delete Medicine/g, "Delete Product");
  content = content.replace(/Medicine added successfully/g, "Product added successfully");
  content = content.replace(/Medicine updated/g, "Product updated");
  content = content.replace(/Medicine deleted/g, "Product deleted");
  content = content.replace(/Instantly Bill Medicine/g, "Instantly Bill Product");
  content = content.replace(/Medicine Details/g, "Product Details");
  content = content.replace(/All medicines in stock/g, "All products in stock");
  content = content.replace(/Search medicine/g, "Search product");
  content = content.replace(/Search by medicine/g, "Search by product");
  content = content.replace(/Medicine Database/g, "Product Database");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated", filePath);
  }
}

const files = [
  'src/app/inventory/page.tsx',
  'src/app/expiry/page.tsx',
  'src/app/transactions/page.tsx',
  'src/app/purchases/import/page.tsx',
  'src/app/supplier-returns/page.tsx',
  'src/app/supplier-returns/new/page.tsx',
  'src/app/api/purchases/parse-pdf/route.ts'
];

files.forEach(f => replaceInFile(f));
console.log("Done");

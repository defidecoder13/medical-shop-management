const XLSX = require('xlsx');
const wb = XLSX.readFile('public/Bill 1.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);
console.log(data.slice(0, 5));

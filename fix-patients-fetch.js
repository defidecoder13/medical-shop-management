const fs = require('fs');
let content = fs.readFileSync('src/app/patients/page.tsx', 'utf8');

content = content.replace(/setNewPatientForm\(\{ name: "", phone: "", doctorName: "", address: "" \}\);\s+fetchPatients\(\);/g, `setNewPatientForm({ name: "", phone: "", doctorName: "", address: "" });
            setTimeout(() => fetchPatients(), 500);`);

content = content.replace(/setMedResults\(\[\]\);\s+fetchPatients\(\);/g, `setMedResults([]);
            setTimeout(() => fetchPatients(), 500);`);

content = content.replace(/setSelectedPatient\(res\);\s+fetchPatients\(\);/g, `setSelectedPatient(res);
            setTimeout(() => fetchPatients(), 500);`);

fs.writeFileSync('src/app/patients/page.tsx', content);

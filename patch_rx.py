import re

with open('src/app/transactions/[id]/page.tsx', 'r') as f:
    content = f.read()

pattern = r'(Date Issued\s*</p>\s*<p className="text-sm font-bold text-gray-900 dark:text-white">\s*\{new Date\(bill\.createdAt\)\.toLocaleDateString[^\}]+\}\s*</p>\s*</div>)'

insert = """
                     {(bill.patientName || bill.patientPhone) && (
                       <div className="space-y-1 border-l border-gray-200 dark:border-gray-800 pl-6 ml-6">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                             Patient Details
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                             {bill.patientName || "N/A"} {bill.patientPhone && <span className="text-gray-500 font-medium text-xs ml-1 inline-flex">({bill.patientPhone})</span>}
                          </p>
                       </div>
                     )}
                     {bill.doctorName && (
                       <div className="space-y-1 border-l border-gray-200 dark:border-gray-800 pl-6 ml-6">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                             Prescribed By
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                             Dr. {bill.doctorName.replace(/^Dr\.?\s*/i, '')}
                          </p>
                       </div>
                     )}"""

new_content = re.sub(pattern, r'\1' + insert, content)
new_content = new_content.replace('<div className="flex items-center gap-8">', '<div className="flex items-center gap-6 flex-wrap mt-2">')

with open('src/app/transactions/[id]/page.tsx', 'w') as f:
    f.write(new_content)
print("Done")

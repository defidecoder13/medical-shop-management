const fs = require('fs');
let content = fs.readFileSync('src/app/transactions/[id]/page.tsx', 'utf8');

const anchor = '                        <p className="text-sm font-bold text-gray-900 dark:text-white">\n' +
'                           {new Date(bill.createdAt).toLocaleDateString(undefined, { weekday: \'short\', year: \'numeric\', month: \'short\', day: \'numeric\' })}\n' +
'                        </p>\n' +
'                     </div>\n' +
'                  </div>';

const replace = \`                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                           {new Date(bill.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                     </div>
                     {(bill.patientName || bill.patientPhone) && (
                       <div className="space-y-1 border-l border-gray-100 dark:border-gray-800 pl-8">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                             Passenger / Patient
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                             {bill.patientName || "N/A"} {bill.patientPhone && <span className="text-gray-500 font-medium text-xs ml-1 inline-flex">({bill.patientPhone})</span>}
                          </p>
                       </div>
                     )}
                     {bill.doctorName && (
                       <div className="space-y-1 border-l border-gray-100 dark:border-gray-800 pl-8">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                             Prescribed By
                          </p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                             Dr. {bill.doctorName.replace(/^Dr\\.?\\s*/i, '')}
                          </p>
                       </div>
                     )}
                  </div>\`;

const result = content.replace(anchor, replace).replace('<div className="flex items-center gap-8">', '<div className="flex items-center gap-8 flex-wrap">');
fs.writeFileSync('src/app/transactions/[id]/page.tsx', result);
console.log("Success:", content !== result);

const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/route.ts', 'utf8');

if (!content.includes('unstable_noStore')) {
    content = content.replace('import { NextResponse } from "next/server";', 
`import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from 'next/cache';`);
    
    content = content.replace('export async function GET(req: Request) {\n  try {', 
`export async function GET(req: Request) {
  noStore();
  try {`);
    
    fs.writeFileSync('src/app/api/inventory/route.ts', content);
}

const fs = require('fs');
let content = fs.readFileSync('src/app/api/inventory/[id]/route.ts', 'utf8');

if (!content.includes('unstable_noStore')) {
    content = content.replace('import { NextResponse } from "next/server";', 
`import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from 'next/cache';`);
    
    content = content.replace('export async function DELETE(req: Request, { params }: { params: { id: string } }) {', 
`export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    noStore();`);

    content = content.replace('export async function PUT(req: Request, { params }: { params: { id: string } }) {', 
`export async function PUT(req: Request, { params }: { params: { id: string } }) {
    noStore();`);
    
    fs.writeFileSync('src/app/api/inventory/[id]/route.ts', content);
}

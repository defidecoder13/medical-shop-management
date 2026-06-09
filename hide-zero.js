const fs = require('fs');

let content = fs.readFileSync('src/app/inventory/page.tsx', 'utf8');

if (!content.includes('const [hideZeroStock, setHideZeroStock] = useState(true);')) {
    content = content.replace('const [filterStatus, setFilterStatus] = useState("All Status");', 
`const [filterStatus, setFilterStatus] = useState("All Status");
  const [hideZeroStock, setHideZeroStock] = useState(true);`);
    
    content = content.replace('if (filterStatus !== "All Status") params.append("status", filterStatus);',
`if (filterStatus !== "All Status") params.append("status", filterStatus);
      if (hideZeroStock) params.append("inStock", "true");`);

    content = content.replace(/\]\);\n\n  useEffect\(\(\) => \{\n    setPage\(1\);\n  \}, \[filterCategory, filterCompany, filterStatus\]\);/g,
`]);

  useEffect(() => {
    setPage(1);
  }, [filterCategory, filterCompany, filterStatus, hideZeroStock]);`);

    content = content.replace(/  \}, \[page, filterCategory, filterCompany, filterStatus\]\);/g,
`  }, [page, filterCategory, filterCompany, filterStatus, hideZeroStock]);`);

    content = content.replace(/  \}, \[deferredSearch, filterCategory, filterCompany, filterStatus\]\);/g,
`  }, [deferredSearch, filterCategory, filterCompany, filterStatus, hideZeroStock]);`);

    content = content.replace(/<option>Out of Stock<\/option>\n        <\/select>/,
`<option>Out of Stock</option>
        </select>
        <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-800 cursor-pointer shrink-0 hover:bg-gray-50 transition-colors">
           <input type="checkbox" checked={hideZeroStock} onChange={e => setHideZeroStock(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#11327c] focus:ring-[#11327c]" />
           Hide Dead Stock
        </label>`);

    fs.writeFileSync('src/app/inventory/page.tsx', content);
}

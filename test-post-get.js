const { default: fetch } = require("node-fetch");
async function test() {
  const req = await fetch("http://localhost:3000/api/inventory?limit=10");
  const data1 = await req.json();
  const med = data1[0];
  
  // POST mock matching the exact medicine name to trigger a restock
  const postReq = await fetch("http://localhost:3000/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: med.name, 
        brand: med.brand,
        composition: med.composition,
        hsnCode: med.hsnCode,
        gstPercent: med.gstPercent,
        category: med.category,
        batchNumber: "NEW_RESTOCK_BATCH_1", 
        stock: 50, 
        expiryDate: "2028-12-31",
        buyingPrice: 100,
        sellingPrice: 120,
        tabletsPerStrip: med.tabletsPerStrip || 10
      })
  });
  const postRes = await postReq.json();
  console.log("Post response:", postReq.status, postRes);

  const req2 = await fetch("http://localhost:3000/api/inventory?limit=10000");
  const data2 = await req2.json();
  
  const found = data2.find(m => m.batchNumber === "NEW_RESTOCK_BATCH_1");
  console.log("Found in cache:", !!found);
}
test();

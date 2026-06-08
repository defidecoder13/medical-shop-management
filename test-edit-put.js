const { default: fetch } = require("node-fetch");
async function test() {
  const req = await fetch("http://localhost:3000/api/inventory?limit=10");
  const data1 = await req.json();
  const med = data1.find(m => m.name.toLowerCase().includes("drotin") || m.name.length > 0);
  console.log("Before edit:", med.name, "tabletsPerStrip:", med.tabletsPerStrip);
  
  const postReq = await fetch("http://localhost:3000/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        _id: med._id,
        tabletsPerStrip: 10
      })
  });
  const postRes = await postReq.json();
  console.log("Put status:", postReq.status, postRes.tabletsPerStrip, postRes.totalTabletsInStock);

  const req2 = await fetch("http://localhost:3000/api/inventory?limit=10");
  const data2 = await req2.json();
  const med2 = data2.find(m => m._id === med._id);
  console.log("After edit:", med2.name, "tabletsPerStrip:", med2.tabletsPerStrip);
}
test();

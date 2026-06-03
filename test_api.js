fetch("http://localhost:3000/api/purchases", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({})
}).then(async r => console.log(r.status, await r.text()))

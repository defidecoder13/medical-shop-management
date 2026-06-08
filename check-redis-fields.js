require("dotenv").config({ path: ".env.local" });
const { Redis } = require("@upstash/redis");

async function check() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const catalog = await redis.get("catalog:all");
  console.log("Total items:", catalog ? catalog.length : 0);
  if (!catalog) return;

  const badItems = catalog.filter(b => 
    b.name == null || typeof b.name !== 'string' ||
    b.brand == null || typeof b.brand !== 'string' ||
    b.composition == null || typeof b.composition !== 'string' ||
    b.batchNumber == null || typeof b.batchNumber !== 'string' ||
    b.rackNumber == null || typeof b.rackNumber !== 'string'
  );

  console.log("Bad items count:", badItems.length);
  if (badItems.length > 0) {
      console.log("Sample bad item:", badItems[0]);
  }
}
check();

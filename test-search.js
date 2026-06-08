require("dotenv").config({ path: ".env.local" });
const { Redis } = require("@upstash/redis");

async function test() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const catalog = await redis.get("catalog:all");
  const missingNames = catalog.filter(b => !b.name || b.name.trim() === "");
  console.log("Batches with missing names:", missingNames.length);
  if (missingNames.length > 0) {
      console.log(missingNames[0]);
  }
}
test();

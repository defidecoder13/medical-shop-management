require("dotenv").config({ path: ".env.local" });
const { Redis } = require("@upstash/redis");

async function run() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  await redis.del("catalog:all");
  console.log("Cleared catalog:all cache!");
  process.exit(0);
}
run();

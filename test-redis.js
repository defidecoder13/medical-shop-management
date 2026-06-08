require("dotenv").config({ path: ".env.local" });
const { Redis } = require("@upstash/redis");

async function test() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env.local");
    process.exit(1);
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    console.log("Setting test key...");
    await redis.set("system_test_key", "hello_upstash", { ex: 10 }); // expires in 10s
    console.log("Reading test key...");
    const val = await redis.get("system_test_key");
    
    if (val === "hello_upstash") {
      console.log("✅ SUCCESS: Upstash Redis is working perfectly!");
    } else {
      console.log("❌ FAILED: Key did not match. Got:", val);
    }
  } catch (error) {
    console.error("❌ ERROR connecting to Upstash Redis:", error.message);
  }
  process.exit(0);
}
test();

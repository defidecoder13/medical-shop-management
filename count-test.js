require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const { Redis } = require("@upstash/redis");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const MedicineBatch = mongoose.models.MedicineBatch || mongoose.model("MedicineBatch", new mongoose.Schema({}, { strict: false, collection: "medicinebatches" }));
  
  const mongoCount = await MedicineBatch.countDocuments();
  const catalog = await redis.get("catalog:all");
  const redisCount = catalog ? catalog.length : 0;

  console.log("Mongo Count:", mongoCount);
  console.log("Redis Count:", redisCount);
  process.exit(0);
}
run();

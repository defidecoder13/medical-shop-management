import { Redis } from '@upstash/redis';

// Initialize Redis only if URLs are provided (graceful degradation)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;

if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    console.log("Upstash Redis client initialized successfully");
  } catch (error) {
    console.warn("Failed to initialize Upstash Redis:", error);
  }
} else {
  console.warn("Upstash Redis credentials missing in .env.local. Caching is disabled.");
}

export const redis = redisClient;

/**
 * Helper to gracefully set cache data
 * @param key Cache key
 * @param data Data to cache
 * @param ttlSeconds Time to live in seconds (default: 5 minutes)
 */
export async function setCache(key: string, data: any, ttlSeconds: number = 300) {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error(`Redis Set Error [${key}]:`, error);
  }
}

/**
 * Helper to gracefully get cache data
 * @param key Cache key
 * @returns Parsed JSON data or null if not found/disabled
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<string>(key);
    // Upstash sometimes parses JSON automatically depending on content,
    // handle both stringified and auto-parsed cases.
    if (typeof data === 'string') {
        return JSON.parse(data) as T;
    }
    if (data) {
        return data as T;
    }
    return null;
  } catch (error) {
    console.error(`Redis Get Error [${key}]:`, error);
    return null;
  }
}

/**
 * Helper to gracefully delete cache keys
 * @param key Cache key or array of keys
 */
export async function deleteCache(key: string | string[]) {
  if (!redis) return;
  try {
    if (Array.isArray(key)) {
        await redis.del(...key);
    } else {
        await redis.del(key);
    }
  } catch (error) {
    console.error(`Redis Delete Error [${key}]:`, error);
  }
}

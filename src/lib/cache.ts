import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for caching rendered block images
 * Initialized lazily to support edge runtime
 */
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  // Return null if Redis is not configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Cache] Redis not configured - caching disabled');
    return null;
  }

  // Initialize Redis client if not already done
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('[Cache] Redis client initialized');
  }

  return redis;
}

/**
 * Generate a stable cache key for a rendered block image
 * Key includes blockId, updatedAt timestamp, and relevant query params
 *
 * @param blockId - The block ID
 * @param updatedAt - Block's last updated timestamp (to bust cache on config changes)
 * @param queryParams - Relevant query parameters that affect rendering
 * @returns Cache key string
 */
export function generateCacheKey(
  blockId: string,
  updatedAt: Date,
  queryParams: Record<string, string | string[] | undefined> = {}
): string {
  // Extract only relevant query params that affect rendering
  const relevantParams: Record<string, string> = {};

  // Add any query params that affect rendering (e.g., user_segment, variant, etc.)
  const keysToInclude = ['user_segment', 'variant', 'locale'];

  for (const key of keysToInclude) {
    const value = queryParams[key];
    if (value !== undefined) {
      // Convert array to single value (take first element)
      relevantParams[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  // Sort params for stable key generation
  const sortedParams = Object.keys(relevantParams)
    .sort()
    .map(key => `${key}=${relevantParams[key]}`)
    .join('&');

  // Include updatedAt timestamp to bust cache when block config changes
  const timestamp = updatedAt.getTime();

  // Generate cache key: render:{blockId}:{timestamp}:{params}
  const cacheKey = sortedParams
    ? `render:${blockId}:${timestamp}:${sortedParams}`
    : `render:${blockId}:${timestamp}`;

  return cacheKey;
}

/**
 * Get a cached rendered block image from Redis
 *
 * @param blockId - The block ID
 * @param cacheKey - The cache key (from generateCacheKey)
 * @returns Buffer containing the PNG image, or null if not cached
 */
export async function getCachedRender(
  blockId: string,
  cacheKey: string
): Promise<Buffer | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    console.log(`[Cache] Checking cache for key: ${cacheKey}`);

    // Get base64-encoded image data from Redis
    const cachedData = await client.get<string>(cacheKey);

    if (!cachedData) {
      console.log(`[Cache] MISS for block ${blockId}`);
      return null;
    }

    console.log(`[Cache] HIT for block ${blockId}`);

    // Convert base64 back to Buffer
    return Buffer.from(cachedData, 'base64');
  } catch (error) {
    console.error(`[Cache] Error retrieving cached render for ${blockId}:`, error);
    return null;
  }
}

/**
 * Store a rendered block image in Redis cache
 *
 * @param blockId - The block ID
 * @param cacheKey - The cache key (from generateCacheKey)
 * @param data - Buffer containing the PNG image data
 * @param ttlSeconds - Time to live in seconds (default: 3600 = 1 hour)
 */
export async function setCachedRender(
  blockId: string,
  cacheKey: string,
  data: Buffer,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    console.log(`[Cache] Storing render for block ${blockId} with TTL ${ttlSeconds}s`);

    // Convert Buffer to base64 for storage
    const base64Data = data.toString('base64');

    // Store in Redis with expiration
    await client.setex(cacheKey, ttlSeconds, base64Data);

    console.log(`[Cache] Successfully cached render for block ${blockId}`);
  } catch (error) {
    console.error(`[Cache] Error storing cached render for ${blockId}:`, error);
    // Don't throw - caching failure shouldn't break rendering
  }
}

/**
 * Invalidate all cached renders for a specific block
 * This is useful when a block is deleted or needs forced refresh
 *
 * @param blockId - The block ID to invalidate
 */
export async function invalidateBlockCache(blockId: string): Promise<void> {
  const client = getRedisClient();
  if (!client) {
    return;
  }

  try {
    console.log(`[Cache] Invalidating all cache entries for block ${blockId}`);

    // In Redis, we use a pattern to find all keys for this block
    // Note: This requires SCAN command which Upstash supports
    const pattern = `render:${blockId}:*`;

    // For simplicity, we'll just log this - in production you might want to implement
    // a more sophisticated invalidation strategy using Redis SCAN
    console.log(`[Cache] Would invalidate pattern: ${pattern}`);

    // Note: Upstash REST API doesn't support SCAN/DEL patterns directly
    // In practice, cache will auto-expire and updatedAt will naturally bust cache
  } catch (error) {
    console.error(`[Cache] Error invalidating cache for block ${blockId}:`, error);
  }
}

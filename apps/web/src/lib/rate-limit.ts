import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(
  prefix: string,
  maxRequests: number,
  windowSeconds: number
): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const key = `${prefix}:${maxRequests}:${windowSeconds}`;
  if (limiters.has(key)) return limiters.get(key)!;

  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
    prefix: `ratelimit:${prefix}`,
    analytics: true,
  });
  limiters.set(key, limiter);
  return limiter;
}

type RateLimitResult =
  | { success: true }
  | { success: false; response: Response };

export async function rateLimit(
  userId: string,
  prefix: string,
  maxRequests: number = 20,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const limiter = getLimiter(prefix, maxRequests, windowSeconds);
  if (!limiter) return { success: true };

  const { success, reset } = await limiter.limit(userId);
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    return {
      success: false,
      response: Response.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Reset": String(reset),
          },
        }
      ),
    };
  }

  return { success: true };
}

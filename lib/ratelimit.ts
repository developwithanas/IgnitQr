import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
// No retries: if Upstash is down we'd rather skip rate limiting than make users wait.
const redis = hasUpstash ? Redis.fromEnv({ retry: { retries: 0 } }) : null;

// When Upstash fails, stop calling it for a while so requests stay fast.
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;
let disabledUntil = 0;

// Allows 3 requests per 24 hours per user
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "24 h"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  : null;

type Window = `${number} ${"s" | "m" | "h" | "d"}`;
const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, limit: number, window: Window): Ratelimit | null {
  if (!redis) return null;
  const key = `${name}:${limit}:${window}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `insightqr:rl:${name}`,
      timeout: 1500, // allow the request if Upstash is slow
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Returns true if the request is allowed. Fails open (allows the request) if
 * Upstash is not configured or unreachable, so an outage never breaks the app.
 */
export async function checkRateLimit(
  req: Request,
  name: string,
  limit: number,
  window: Window
): Promise<boolean> {
  if (Date.now() < disabledUntil) return true;
  const limiter = getLimiter(name, limit, window);
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(getClientIp(req));
    return success;
  } catch (error) {
    disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
    console.error(
      `Rate limiting unavailable (Upstash unreachable) — skipping for 5 minutes. Check UPSTASH_REDIS_REST_URL. [${name}]`,
      error instanceof Error ? error.message : error
    );
    return true;
  }
}

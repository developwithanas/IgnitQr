import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Create a new ratelimiter that allows 3 requests per 24 hours per user
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "24 h"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

const uploadLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 d"),
      analytics: true,
      prefix: "crh:upload",
    })
  : null;

export async function checkUploadRateLimit(identifier: string): Promise<{ allowed: boolean; reason?: string }> {
  if (!uploadLimiter) {
    return { allowed: true };
  }

  const result = await uploadLimiter.limit(identifier);
  if (!result.success) {
    return {
      allowed: false,
      reason: "Daily upload limit reached. Please try again tomorrow.",
    };
  }

  return { allowed: true };
}

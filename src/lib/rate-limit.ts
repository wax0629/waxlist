/**
 * Simple in-memory sliding window rate limit (per process).
 * Good enough for single-node Beta.
 */

type Bucket = { timestamps: number[] };

const globalForRl = globalThis as unknown as {
  __bhRateLimit?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> =
  globalForRl.__bhRateLimit ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForRl.__bhRateLimit = buckets;
}

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  let b = buckets.get(opts.key);
  if (!b) {
    b = { timestamps: [] };
    buckets.set(opts.key, b);
  }
  b.timestamps = b.timestamps.filter((t) => t > windowStart);
  if (b.timestamps.length >= opts.limit) {
    const oldest = b.timestamps[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + opts.windowMs - now),
    };
  }
  b.timestamps.push(now);
  return {
    ok: true,
    remaining: opts.limit - b.timestamps.length,
    retryAfterMs: 0,
  };
}

export function clientKeyFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "local";
}

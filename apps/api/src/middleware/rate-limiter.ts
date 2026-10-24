import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  skipFailedRequests?: boolean;
}) {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;
  const store = new Map<string, RateLimitRecord>();

  // Periodically cleanup expired entries every 5 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Allow timer to not block process termination
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key based on user ID if authenticated, else IP address
    const key = (req.session as any)?.userId || req.ip || req.socket.remoteAddress || "anonymous";
    const now = Date.now();

    let record = store.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({
        error: {
          code: "TOO_MANY_REQUESTS",
          message,
          retryAfter: resetSeconds,
        },
      });
    }

    next();
  };
}

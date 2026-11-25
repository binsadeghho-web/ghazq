import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

let cachedRateLimitMaxAttempts = 5;

export function setCachedRateLimitMaxAttempts(attempts: number): void {
  if (Number.isFinite(attempts) && attempts > 0) {
    cachedRateLimitMaxAttempts = Math.round(attempts);
  }
}

export function rateLimitMiddleware(options?: {
  windowMs?: number;
  maxRequests?: number;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const windowMs = options?.windowMs || 60 * 1000; // 1 minute window
    const maxRequests = options?.maxRequests || Math.max(30, cachedRateLimitMaxAttempts * 12);

    const actorId = (req as any).user?.id || (req.headers['x-actor-id'] as string) || req.ip || 'anonymous';
    const key = `${actorId}:${req.baseUrl + req.path}`;
    const now = Date.now();

    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count++;
    buckets.set(key, bucket);

    const remaining = Math.max(0, maxRequests - bucket.count);
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', retryAfter);
      throw AppError.rateLimited(retryAfter);
    }

    next();
  };
}

export const generalRateLimiter = {
  middleware: (_prefix = 'general') => rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 120 })
};

export const authRateLimiter = {
  middleware: (_prefix = 'auth') => rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 10 })
};

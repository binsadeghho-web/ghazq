import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { logger } from './logger';

export interface IdempotencyRecord {
  requestHash: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: string;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const inFlightKeys = new Set<string>();

// Periodic cleanup of keys older than 72 hours (Section 6.1 & Item 8)
setInterval(() => {
  const cutoff = Date.now() - 72 * 3600 * 1000;
  for (const [key, record] of idempotencyStore.entries()) {
    if (new Date(record.createdAt).getTime() < cutoff) {
      idempotencyStore.delete(key);
    }
  }
}, 3600 * 1000); // Purge hourly

/**
 * Computes deterministic SHA-256 hash of the request body + method + path
 */
export function computeRequestHash(req: Request): string {
  const content = JSON.stringify({
    method: req.method,
    path: req.baseUrl + req.path,
    body: req.body || {},
  });
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Middleware enforcing Idempotency-Key contract (Section 6.1 & Item 8)
 * Table: idempotency_keys (user_id, key, request_hash, response, status_code, created_at)
 */
export function handleIdempotency(req: Request, res: Response, next: NextFunction): void {
  // Only applies to mutative operations (POST, PATCH)
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (!idempotencyKey) {
    return next();
  }

  const actorId = (req as any).user?.id || (req.headers['x-actor-id'] as string) || req.ip || 'anonymous';
  const compositeKey = `${actorId}:${idempotencyKey}`;
  const requestHash = computeRequestHash(req);

  // 1. Check for concurrent in-flight request with same key (Item 8: Return 409 Conflict)
  if (inFlightKeys.has(compositeKey)) {
    throw AppError.conflict(
      'عملیاتی با این کلید هم‌اکنون در حال پردازش در سرور است؛ لطفاً منتظر بمانید.',
      'CONCURRENT_IDEMPOTENCY_IN_FLIGHT'
    );
  }

  const existingRecord = idempotencyStore.get(compositeKey);

  if (existingRecord) {
    if (existingRecord.requestHash === requestHash) {
      logger.info(`Replaying cached idempotent response for key: ${idempotencyKey}`, {
        actorId,
        statusCode: existingRecord.statusCode,
      });

      res.setHeader('X-Idempotent-Replay', 'true');
      res.status(existingRecord.statusCode).json(existingRecord.responseBody);
      return;
    }

    throw AppError.unprocessable(
      'کلید تکرارناپذیری (Idempotency-Key) قبلاً برای درخواستی با بدنه متفاوت استفاده شده است. از کلید یکتای جدید استفاده فرمایید.',
      'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'
    );
  }

  // Mark in-flight
  inFlightKeys.add(compositeKey);

  // Intercept json output to save successful response and release in-flight lock
  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    inFlightKeys.delete(compositeKey);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(compositeKey, {
        requestHash,
        statusCode: res.statusCode,
        responseBody: body,
        createdAt: new Date().toISOString(),
      });
    }
    return originalJson(body);
  };

  res.on('close', () => {
    inFlightKeys.delete(compositeKey);
  });

  next();
}

// Support both `idempotencyMiddleware` and `idempotencyMiddleware()`
export const idempotencyMiddleware: any = (reqOrOpts?: any, res?: any, next?: any) => {
  if (res && next) {
    return handleIdempotency(reqOrOpts, res, next);
  }
  return handleIdempotency;
};

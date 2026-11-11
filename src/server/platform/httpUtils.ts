import { Request } from 'express';
import { AppError } from './errors';

/**
 * Extracts expectedVersion strictly from:
 * 1. HTTP header `If-Match` (e.g. `"2"`, `W/"2"`, or `2`)
 * 2. Request body `expectedVersion`
 * 3. Request body `version`
 *
 * If none is provided or invalid, throws AppError.badRequest with code 'VERSION_REQUIRED'
 * to strictly prevent bypassing Optimistic Concurrency Control (OCC).
 */
export function extractExpectedVersion(req: Request, required = true): number {
  const ifMatch = req.headers['if-match'];
  let rawVersion: any = undefined;

  if (ifMatch && typeof ifMatch === 'string') {
    // Strip weak prefix W/ and quotes
    const cleaned = ifMatch.replace(/^W\//i, '').replace(/["']/g, '').trim();
    if (cleaned && !isNaN(Number(cleaned))) {
      rawVersion = Number(cleaned);
    }
  }

  if (rawVersion === undefined) {
    if (req.body?.expectedVersion !== undefined && req.body?.expectedVersion !== null) {
      rawVersion = Number(req.body.expectedVersion);
    } else if (req.body?.version !== undefined && req.body?.version !== null) {
      rawVersion = Number(req.body.version);
    }
  }

  if (rawVersion === undefined || isNaN(rawVersion) || rawVersion <= 0) {
    if (required) {
      throw AppError.badRequest(
        'شناسه نسخه معتبر (فیلد expectedVersion در بدنه یا هدر If-Match) جهت کنترل هم‌زمانی الزامی است و نباید خالی باشد.',
        'VERSION_REQUIRED'
      );
    }
    return 1;
  }

  return rawVersion;
}

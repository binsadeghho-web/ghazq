import { Request, Response, NextFunction } from 'express';

/**
 * Persian and Arabic Character/Digit Normalizer (Item 9 & 11)
 * Enforces clean data entry across req.body, req.query, and req.params.
 * Explicitly skips sensitive security fields (password, tokens, hashes, files).
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

// Fields that must NEVER be altered (passwords, cryptographic tokens, hashes, binary content)
const SENSITIVE_KEY_REGEX = /^(password|pass|token|secret|otp|totp|recovery_code|file|content_base64|checksum|signature|hash|auth)/i;

/**
 * Converts Persian and Arabic numerals to standard Latin digits (0-9)
 */
export function normalizeDigits(input: string | undefined | null): string {
  if (!input) return '';
  let result = String(input);
  for (let i = 0; i < 10; i++) {
    result = result
      .replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i))
      .replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  return result.trim();
}

/**
 * Normalizes Persian text:
 * - Replaces Arabic 'ي' (\u064A) with Persian 'ی' (\u06CC)
 * - Replaces Arabic 'ك' (\u0643) with Persian 'ک' (\u06A9)
 * - Removes excessive duplicate whitespaces
 */
export function normalizePersianText(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/\u064A/g, '\u06CC') // Arabic Yeh to Persian Yeh
    .replace(/\u0643/g, '\u06A9') // Arabic Kaf to Persian Keheh
    .replace(/\u06C0/g, '\u0647\u0654') // Heh with yeh above
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deeply normalizes all string fields while bypassing sensitive credentials and files.
 */
export function normalizePayload(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(normalizePayload);
  }

  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // 1. Bypass sensitive credentials and security tokens
    if (SENSITIVE_KEY_REGEX.test(key)) {
      normalized[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      if (/nationalid|phone|mobile|price|amount|number|version|pin|count|quantity/i.test(key)) {
        normalized[key] = normalizeDigits(value);
      } else {
        // Also normalize digits if embedded in search queries or text
        normalized[key] = normalizePersianText(value);
      }
    } else if (typeof value === 'object') {
      normalized[key] = normalizePayload(value);
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

/**
 * Express middleware that normalizes req.body, req.query, and req.params
 */
export function persianNormalizerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = normalizePayload(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = normalizePayload(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = normalizePayload(req.params);
  }
  next();
}

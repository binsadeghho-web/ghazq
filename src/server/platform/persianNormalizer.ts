/**
 * Persian and Arabic Character/Digit Normalizer (Item 11)
 * Enforces clean data entry at the API boundary before validation and DB queries.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

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
 * - Replaces Arabic 'ي' with Persian 'ی'
 * - Replaces Arabic 'ك' with Persian 'ک'
 * - Removes duplicate whitespaces
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
 * Deeply normalizes all string fields in request body:
 * Numerals in nationalId/phone/price fields, and characters in search/titles.
 */
export function normalizePayload(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(normalizePayload);
  }

  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      if (/nationalid|phone|mobile|price|code|number|version|pin|otp/i.test(key)) {
        normalized[key] = normalizeDigits(value);
      } else {
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

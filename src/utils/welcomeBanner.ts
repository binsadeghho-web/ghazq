import { User } from '../types';

const LEGACY_PERSONAL_NAME_PATTERNS = [
  /خوش\s*آمدید\s*[،,:\-]?\s*(?:جناب\s*آقای\s*)?(?:دکتر\s*)?(?:علیرضا\s*)?میرزایی/gi,
  /(?:جناب\s*آقای\s*)?(?:دکتر\s*)?(?:علیرضا\s*)?میرزایی/gi,
];

const STATIC_GENERIC_TITLES = new Set([
  'سامانه و ویترین خدمات دانش‌آموختگان فقه و قضا',
]);

/**
 * Resolves the welcome banner heading dynamically for the currently logged-in user.
 * Supports `{name}`, `{fullName}`, and `{{name}}` tokens while automatically
 * migrating/replacing legacy hardcoded personal names (e.g. "دکتر میرزایی")
 * so every user always sees their own full name in the welcome banner.
 */
export function formatWelcomeBannerTitle(
  rawTitle: string | undefined | null,
  greetingPrefix: string | undefined | null,
  user: Pick<User, 'fullName'> | null | undefined
): string {
  const userName = user?.fullName?.trim() || 'دانش‌آموخته گرامی';
  const prefix = greetingPrefix?.trim() || 'خوش آمدید';
  let candidate = (rawTitle || '').trim();

  if (!candidate || STATIC_GENERIC_TITLES.has(candidate)) {
    return `${prefix}، ${userName}`;
  }

  // Substitute dynamic placeholder tokens if configured
  if (/\{+(?:name|fullName)\}+/i.test(candidate)) {
    return candidate.replace(/\{+(?:name|fullName)\}+/gi, userName);
  }

  // Sanitize any legacy hardcoded personal greeting saved in DB
  const hadLegacyName = LEGACY_PERSONAL_NAME_PATTERNS.some(rx => {
    rx.lastIndex = 0;
    return rx.test(candidate);
  });

  if (hadLegacyName) {
    return `${prefix}، ${userName}`;
  }

  // If the title already contains the active user's name, return as-is
  if (candidate.includes(userName)) {
    return candidate;
  }

  // If admin wrote a greeting without placeholder (e.g. "خوش آمدید، همکار گرامی"), ensure userName is prominently shown
  if (candidate.startsWith('خوش آمدید') || candidate.startsWith('سلام')) {
    return `${prefix}، ${userName}`;
  }

  return `${candidate} · ${prefix}، ${userName}`;
}

/**
 * Resolves the welcome banner subtitle dynamically for the current user.
 */
export function formatWelcomeBannerSubtitle(
  rawSubtitle: string | undefined | null,
  user: Pick<User, 'organization' | 'roleTitle'> | null | undefined
): string {
  const org = user?.organization?.trim() || 'مجمع دانش‌آموختگان فقه و قضا';
  const roleTitle = user?.roleTitle?.trim() || '';
  const dynamicDefault = `${org}${roleTitle ? ` · سمت: ${roleTitle}` : ''} · دسترسی سریع به کارتابل اداری، دوره‌های آموزشی، پژوهش و تالار آراء`;

  const candidate = (rawSubtitle || '').trim();
  if (!candidate) return dynamicDefault;

  // Replace legacy hardcoded personal subtitle from seed/DB
  if (
    candidate.includes('مستشار دادگاه تجدیدنظر') ||
    candidate.includes('دادگستری کل استان تهران') ||
    candidate.includes('میرزایی')
  ) {
    return dynamicDefault;
  }

  return candidate
    .replace(/\{+(?:organization|org)\}+/gi, org)
    .replace(/\{+(?:roleTitle|role)\}+/gi, roleTitle || 'عضو مجمع');
}

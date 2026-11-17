import { RulingTagDefinition } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

export const RULING_ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
export const MAX_VERDICT_UPLOAD_BYTES = 8 * 1024 * 1024;

export function isVerdictAllowedClientFile(file: File): { ok: boolean; error?: string } {
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  if (!RULING_ALLOWED_EXTS.includes(ext)) {
    return {
      ok: false,
      error: `فرمت «${ext || file.type || 'ناشناخته'}» مجاز نیست. صرفاً تصویر (JPG, PNG, WEBP)، فایل PDF و سند Word (DOC, DOCX) قابل پیوست است.`,
    };
  }
  if (file.size > MAX_VERDICT_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `حجم فایل «${file.name}» از سقف مجاز (۸ مگابایت) بیشتر است.`,
    };
  }
  if (file.size === 0) {
    return {
      ok: false,
      error: `فایل «${file.name}» خالی است.`,
    };
  }
  return { ok: true };
}

export function isRulingsOfficialRole(role?: string): boolean {
  return [
    'admin',
    'super_admin',
    'alumni_manager',
    'supervisor',
    'general_observer',
  ].includes(role || '');
}

export function canManageRulingsRole(role?: string): boolean {
  return ['admin', 'super_admin', 'alumni_manager', 'supervisor'].includes(role || '');
}

export const CASE_TYPE_OPTIONS: Array<{ value: 'commercial' | 'civil' | 'criminal' | 'family'; label: string }> = [
  { value: 'commercial', label: 'حقوقی و تجاری' },
  { value: 'civil', label: 'مدنی و قراردادها' },
  { value: 'criminal', label: 'کیفری و جزایی' },
  { value: 'family', label: 'امور حسبی و خانواده' },
];

export function getCaseTypeTitle(caseType: string): string {
  return CASE_TYPE_OPTIONS.find(o => o.value === caseType)?.label || 'حقوقی و تجاری';
}

export function formatPersianDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return toPersianNumbers(iso);
    const formatted = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
    return formatted;
  } catch {
    return toPersianNumbers(iso);
  }
}

export function extractAttachmentDisplayName(url: string, idx: number): string {
  try {
    const raw = decodeURIComponent((url || '').split('/').pop() || '');
    if (!raw) return `فایل پیوست ${toPersianNumbers(idx + 1)}`;
    // strip uuid prefix if present like verd_1700000_abcd_file.pdf or similar
    const ext = raw.includes('.') ? '.' + raw.split('.').pop() : '';
    return raw.length > 32 ? `پیوست ${toPersianNumbers(idx + 1)}${ext}` : raw;
  } catch {
    return `فایل پیوست ${toPersianNumbers(idx + 1)}`;
  }
}

export const TAG_COLOR_OPTIONS: Array<{
  value: RulingTagDefinition['colorScheme'];
  label: string;
  swatchClass: string;
}> = [
  { value: 'emerald', label: 'سبز زمردی', swatchClass: 'bg-emerald-600' },
  { value: 'amber', label: 'طلایی کهربایی', swatchClass: 'bg-amber-600' },
  { value: 'rose', label: 'قرمز زرشکی', swatchClass: 'bg-rose-600' },
  { value: 'indigo', label: 'نیلی', swatchClass: 'bg-indigo-600' },
  { value: 'sky', label: 'آبی فیروزه‌ای', swatchClass: 'bg-sky-600' },
  { value: 'purple', label: 'بنفش ارغوانی', swatchClass: 'bg-purple-600' },
  { value: 'slate', label: 'خاکستری کلاسیک', swatchClass: 'bg-slate-600' },
];

export const TAG_STYLE_OPTIONS: Array<{
  value: RulingTagDefinition['styleVariant'];
  label: string;
}> = [
  { value: 'solid', label: 'پررنگ (Solid)' },
  { value: 'soft', label: 'ملایم (Soft)' },
  { value: 'outline', label: 'حاشیه‌دار (Outline)' },
];

export function getRulingTagStyleClasses(
  label: string,
  definitions: RulingTagDefinition[] = [],
  fallbackScheme: RulingTagDefinition['colorScheme'] = 'slate'
): string {
  const def = definitions.find(d => d.label === label);
  const color = def?.colorScheme || fallbackScheme;
  const variant = def?.styleVariant || 'soft';

  const palette: Record<
    RulingTagDefinition['colorScheme'],
    Record<RulingTagDefinition['styleVariant'], string>
  > = {
    emerald: {
      solid: 'bg-emerald-700 text-white border border-emerald-800 shadow-2xs',
      soft: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
      outline: 'bg-transparent text-emerald-800 dark:text-emerald-300 border border-emerald-500/70',
    },
    amber: {
      solid: 'bg-amber-700 text-white border border-amber-800 shadow-2xs',
      soft: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800',
      outline: 'bg-transparent text-amber-800 dark:text-amber-300 border border-amber-500/70',
    },
    rose: {
      solid: 'bg-rose-700 text-white border border-rose-800 shadow-2xs',
      soft: 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800',
      outline: 'bg-transparent text-rose-800 dark:text-rose-300 border border-rose-500/70',
    },
    indigo: {
      solid: 'bg-indigo-700 text-white border border-indigo-800 shadow-2xs',
      soft: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800',
      outline: 'bg-transparent text-indigo-800 dark:text-indigo-300 border border-indigo-500/70',
    },
    sky: {
      solid: 'bg-sky-700 text-white border border-sky-800 shadow-2xs',
      soft: 'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800',
      outline: 'bg-transparent text-sky-800 dark:text-sky-300 border border-sky-500/70',
    },
    purple: {
      solid: 'bg-purple-700 text-white border border-purple-800 shadow-2xs',
      soft: 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800',
      outline: 'bg-transparent text-purple-800 dark:text-purple-300 border border-purple-500/70',
    },
    slate: {
      solid: 'bg-stone-800 text-white border border-stone-900 shadow-2xs',
      soft: 'bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-700',
      outline: 'bg-transparent text-stone-700 dark:text-slate-300 border border-stone-400 dark:border-slate-600',
    },
  };

  return palette[color]?.[variant] || palette.slate.soft;
}

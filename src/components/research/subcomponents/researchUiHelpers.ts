import { ResearchMentorship } from '../../../types';

export interface ResearchStatusMeta {
  key: string;
  label: string;
  dotColorClass: string;
  textColorClass: string;
  surfaceClass: string;
  isLockedForUser: boolean;
}

export function getResearchStatusMeta(rawStatus?: string): ResearchStatusMeta {
  switch (rawStatus) {
    case 'in_review':
    case 'under_review':
      return {
        key: 'in_review',
        label: 'در حال بررسی کارشناسی',
        dotColorClass: 'bg-sky-500',
        textColorClass: 'text-sky-700 dark:text-sky-300',
        surfaceClass: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
        isLockedForUser: true,
      };
    case 'approved':
    case 'active':
      return {
        key: 'approved',
        label: 'تایید نهایی درخواست',
        dotColorClass: 'bg-emerald-500',
        textColorClass: 'text-emerald-700 dark:text-emerald-300',
        surfaceClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
        isLockedForUser: true,
      };
    case 'rejected':
    case 'suspended':
      return {
        key: 'rejected',
        label: 'رد درخواست',
        dotColorClass: 'bg-rose-500',
        textColorClass: 'text-rose-700 dark:text-rose-300',
        surfaceClass: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
        isLockedForUser: true,
      };
    case 'completed':
      return {
        key: 'completed',
        label: 'تکمیل‌شده',
        dotColorClass: 'bg-indigo-500',
        textColorClass: 'text-indigo-700 dark:text-indigo-300',
        surfaceClass: 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
        isLockedForUser: true,
      };
    case 'pending':
    default:
      return {
        key: 'pending',
        label: 'در انتظار بررسی',
        dotColorClass: 'bg-amber-500',
        textColorClass: 'text-amber-700 dark:text-amber-300',
        surfaceClass: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
        isLockedForUser: false,
      };
  }
}

export function getResearchCategoryLabel(cat?: ResearchMentorship['researchCategory']): string {
  return cat === 'article' ? 'راهبری مقاله' : 'راهبری پایان‌نامه';
}

export function getServiceScopeLabel(scope?: ResearchMentorship['serviceScope']): string {
  return scope === 'partial_mentorship'
    ? 'مشورت و راهبری موردی (بخشی از اثر)'
    : 'پک کامل راهبری';
}

export function getDeliveryModeLabel(mode?: ResearchMentorship['deliveryMode']): string {
  return mode === 'online' ? 'آنلاین (غیرحضوری)' : 'حضوری';
}

export function formatResearchDateFa(raw?: string | null): string {
  if (!raw) return '—';
  const trimmed = String(raw).trim();
  if (/^۱۴\d{2}/.test(trimmed) || /^14\d{2}/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  try {
    return parsed.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return trimmed;
  }
}

export function formatResearchDateTimeFa(raw?: string | null): string {
  if (!raw) return '—';
  const parsed = new Date(String(raw));
  if (Number.isNaN(parsed.getTime())) return String(raw);
  try {
    return parsed.toLocaleString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(raw);
  }
}

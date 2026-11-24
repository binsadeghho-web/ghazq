/**
 * Exact Gregorian <-> Jalali (Persian) date utility & Asia/Tehran date calculations.
 * Based on the standard Borkowski / jalaali-js 2820-year cycle algorithm.
 */

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const JALALI_WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;
export const JALALI_WEEKDAY_FULL = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
] as const;

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] || d);
}

function div(a: number, b: number): number {
  return ~~(a / b);
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

const JAL_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

function jalCal(jy: number, withoutLeap = false): { leap: number; gy: number; march: number } {
  const bl = JAL_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JAL_BREAKS[0];
  let jm = 0;
  let jump = 0;

  if (jy < jp || jy >= JAL_BREAKS[bl - 1]) {
    throw new Error(`Invalid Jalali year: ${jy}`);
  }

  for (let i = 1; i < bl; i += 1) {
    jm = JAL_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (withoutLeap) return { leap: 0, gy, march };

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy, false).leap === 0;
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy, true);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    } else {
      k -= 186;
    }
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return d2j(g2d(gy, gm, gd));
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

export function isoToJalali(iso: string): { jy: number; jm: number; jd: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return gregorianToJalali(2025, 3, 21);
  return gregorianToJalali(y, m, d);
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  return `${String(gy).padStart(4, '0')}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

export function getTehranTodayIso(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    const now = new Date();
    const tehranOffsetMs = 3.5 * 60 * 60 * 1000;
    const d = new Date(now.getTime() + tehranOffsetMs);
    return d.toISOString().slice(0, 10);
  }
}

export function addDaysToIso(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function diffDaysIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.slice(0, 10).split('-').map(Number);
  const [ty, tm, td] = toIso.slice(0, 10).split('-').map(Number);
  const fromUtc = Date.UTC(fy, (fm || 1) - 1, fd || 1);
  const toUtc = Date.UTC(ty, (tm || 1) - 1, td || 1);
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}

/**
 * Returns 0 for Saturday (شنبه) ... 6 for Friday (جمعه)
 */
export function getPersianWeekdayIndex(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const jsDay = new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay(); // 0=Sun..6=Sat
  return (jsDay + 1) % 7;
}

export function formatIsoToJalali(iso: string, withWeekday = false): string {
  if (!iso) return '—';
  const { jy, jm, jd } = isoToJalali(iso);
  const mName = JALALI_MONTH_NAMES[jm - 1] || '';
  const base = `${toPersianDigits(jd)} ${mName} ${toPersianDigits(jy)}`;
  if (!withWeekday) return base;
  const wd = JALALI_WEEKDAY_FULL[getPersianWeekdayIndex(iso)] || '';
  return `${wd}، ${base}`;
}

export function formatIsoToJalaliNumeric(iso: string): string {
  if (!iso) return '—';
  const { jy, jm, jd } = isoToJalali(iso);
  return toPersianDigits(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
}

export interface JalaliCalendarCell {
  jy: number;
  jm: number;
  jd: number;
  iso: string;
  weekdayIndex: number; // 0 = Saturday .. 6 = Friday
  isDisabled: boolean;
  isToday: boolean;
}

export function getJalaliMonthGrid(
  jy: number,
  jm: number,
  minSelectableIso?: string
): { leadingEmptyCount: number; cells: JalaliCalendarCell[] } {
  const daysCount = getJalaliMonthDays(jy, jm);
  const firstIso = jalaliToIso(jy, jm, 1);
  const leadingEmptyCount = getPersianWeekdayIndex(firstIso);
  const todayIso = getTehranTodayIso();
  const minIso = minSelectableIso || todayIso;

  const cells: JalaliCalendarCell[] = [];
  for (let jd = 1; jd <= daysCount; jd += 1) {
    const iso = jalaliToIso(jy, jm, jd);
    cells.push({
      jy,
      jm,
      jd,
      iso,
      weekdayIndex: getPersianWeekdayIndex(iso),
      isToday: iso === todayIso,
      isDisabled: iso < minIso,
    });
  }

  return { leadingEmptyCount, cells };
}

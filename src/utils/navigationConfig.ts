import { CustomNavItemConfig, NavigationCustomizationConfig } from '../types';

export const DEFAULT_VERTICAL_NAV_ITEMS: CustomNavItemConfig[] = [
  { id: 'dashboard', label: 'داشبورد جامع', subtext: 'نمای کلی و درگاه‌های دسترسی', visible: true },
  { id: 'cartable', label: 'خدمات اداری و آموزشی', subtext: 'کارتابل درخواست‌های شغلی و استعلام‌ها', visible: true },
  { id: 'courses', label: 'دوره‌های تخصصی', subtext: 'آموزش‌های کاربردی فقه و قضا', visible: true },
  { id: 'products', label: 'کتاب و محصولات چند رسانه‌ای', subtext: 'کتب مرجع، نشست‌های علمی، درس‌گفتارها و فایل‌های دانلودی', visible: true },
  { id: 'counseling', label: 'خدمات روانشناختی و مشاوره', subtext: 'سلامت شغلی، تحکیم خانواده و سبک زندگی', visible: true },
  { id: 'specialized_counseling', label: 'مشاوره تخصصی شغلی قضا', subtext: 'هدایت شغلی-تحصیلی با قضات پیشکسوت دیوان عالی', visible: true },
  { id: 'research', label: 'راهبری پژوهش و مقاله (خدمات پژوهشی)', subtext: 'راهبری پایان‌نامه، مقاله، مشورت موردی و اسکان مطالعاتی', visible: true },
  { id: 'rulings', label: 'تالار رأی قضایی', subtext: 'آراء برگزیده محاکم و مباحثات فقهی', visible: true },
  { id: 'welfare', label: 'تسهیلات و رفاهیات', subtext: 'وام قرض‌الحسنه، اسکان زیارتی و اقلام معیشتی', visible: true },
  { id: 'synergy', label: 'دیوار هم‌افزایی', subtext: 'ارتباط مستقیم و تبادل تجارب اداری اعضا', visible: true },
  { id: 'finance', label: 'امور مالی و حسابداری', subtext: 'مدیریت درآمدها، تسویه‌حساب‌ها و آمار جامع مالی', visible: true },
  { id: 'alumni', label: 'دانش‌آموختگان', subtext: 'بانک جامع اطلاعات، سوابق قضایی و علمی دانش‌آموختگان', visible: true },
  { id: 'users', label: 'مدیریت کاربران و نقش‌ها', subtext: 'مدیریت حساب‌ها، ۹ نقش سازمانی و سطوح دسترسی', visible: true },
  { id: 'admin', label: 'مدیریت سایت و پایش امنیت', subtext: 'پایش امنیت پایگاه داده، زنجیره وقایع SHA-256 و عیب‌یابی آنی سامانه', visible: true },
];

export const DEFAULT_HORIZONTAL_NAV_ITEMS: CustomNavItemConfig[] = [
  { id: 'Dashboard', label: 'داشبورد', visible: true },
  { id: 'People', label: 'کارتابل', visible: true },
  { id: 'Courses', label: 'گالری دوره‌ها', visible: true },
  { id: 'Products', label: 'کتاب و محصولات چند رسانه‌ای', visible: true },
  { id: 'Counseling', label: 'مشاوره', visible: true },
  { id: 'Research', label: 'راهبری پژوهش و مقاله (خدمات پژوهشی)', visible: true },
  { id: 'Welfare', label: 'رفاهیات', visible: true },
  { id: 'Rulings', label: 'تالار آراء', visible: true },
  { id: 'Synergy', label: 'هم‌افزایی', visible: true },
  { id: 'Finance', label: 'امور مالی و حسابداری', visible: true },
  { id: 'Alumni', label: 'دانش‌آموختگان', visible: true },
  { id: 'Users', label: 'مدیریت کاربران و نقش‌ها', visible: true },
  { id: 'Admin', label: 'مدیریت سایت و پایش امنیت', visible: true },
  { id: 'Setting', label: 'تنظیمات', visible: true },
];

export const DEFAULT_SERVICES_MENU_TITLE = 'منو و خدمات سامانه';

export const DEFAULT_SERVICES_MENU_ITEMS: CustomNavItemConfig[] = [
  {
    id: 'People',
    label: 'کارتابل خدمات اداری و استعلامات',
    subtext: 'ثبت، گردش اسناد رسمی و استعلام پایه‌های قضایی با پاسخگویی دبیرخانه',
    badge: 'پرتال اداری',
    visible: true,
  },
  {
    id: 'SpecializedCounseling',
    label: 'مشاوره تخصصی شغلی و تحصیلی',
    subtext: 'هدایت مسیر نخبگانی قضایی، موفقیت در اختبار، ترفیع رتبه و مصاحبه‌ها',
    badge: 'هدایت شغلی',
    visible: true,
  },
  {
    id: 'CounselingGeneral',
    label: 'خدمات روانشناختی و مشاوره',
    subtext: 'روان‌شناختی، خانواده، زوج‌درمانی، تاب‌آوری شغلی و مدیریت اضطراب',
    badge: 'سلامت روان',
    visible: true,
  },
  {
    id: 'Courses',
    label: 'دوره‌ها و کارگاه‌های تخصصی',
    subtext: 'کارگاه‌های عالی فقه کاربردی، اسناد و آرشیو صوتی و تصویری جلسات',
    badge: 'آموزش عالی',
    visible: true,
  },
  {
    id: 'Research',
    label: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
    subtext: 'پک کامل یا مشورت موردی برای پایان‌نامه و مقاله، اساتید مجرب و اسکان مطالعاتی قم',
    badge: 'خدمات پژوهشی',
    visible: true,
  },
  {
    id: 'Rulings',
    label: 'تالار نقد و مباحثه آراء قضایی',
    subtext: 'نقد موشکافانه احکام توسط قضات تجدیدنظر و دیوان عالی کشور',
    badge: 'مباحثات فقهی',
    visible: true,
  },
  {
    id: 'Products',
    label: 'کتاب و محصولات چند رسانه‌ای',
    subtext: 'کتب مرجع، نشست‌های علمی صوتی/تصویری و درس‌گفتارها با دانلود پس از ثبت‌نام یا ارسال پستی',
    badge: 'انتشارات و رسانه',
    visible: true,
  },
  {
    id: 'Welfare',
    label: 'تسهیلات رفاهی و اقامتگاه‌ها',
    subtext: 'وام قرض‌الحسنه صندوق رفاه، اقامتگاه مشهد و قم، تعاونی مصرف',
    badge: 'صندوق رفاهی',
    visible: true,
  },
  {
    id: 'Synergy',
    label: 'دیوار هم‌افزایی شغلی و تجربیات',
    subtext: 'تبادل مستقیم تجارب اداری، رویه‌های قضایی شعب و استعلامات محلی',
    badge: 'شبکه همکاران',
    visible: true,
  },
  {
    id: 'Finance',
    label: 'امور مالی، حسابداری و درآمدها',
    subtext: 'مدیریت جامع درآمدها، فیش‌های واریزی و تسویه‌حساب‌ها',
    badge: 'امور مالی',
    visible: true,
  },
  {
    id: 'Alumni',
    label: 'بانک جامع دانش‌آموختگان',
    subtext: 'فهرست ۱,۰۰۰ دانش‌آموخته حوزوی و قضایی، سوابق علمی و تخصصی',
    badge: 'دایرکتوری',
    visible: true,
  },
  {
    id: 'Users',
    label: 'مدیریت کاربران، نقش‌ها و حساب‌ها',
    subtext: 'صدور حساب کاربری، مدیریت ۹ نقش سازمانی، ویترین مشتریان و ماتریس دسترسی',
    badge: 'کنترل دسترسی',
    visible: true,
  },
  {
    id: 'Admin',
    label: 'مرکز مدیریت و تنظیمات کلان',
    subtext: 'تنظیمات امنیتی، لاگ‌های سیستمی، نظارت بر کارتابل و تالارها',
    badge: 'مدیریت ارشد',
    visible: true,
  },
];

/**
 * Reconciles saved custom navigation items against canonical defaults:
 * - Preserves admin's saved ordering and custom labels/subtexts/badges/visibility.
 * - Appends any newly added canonical items not yet in saved list.
 * - Deduplicates by ID cleanly.
 */
export function reconcileCustomNavItems(
  saved: CustomNavItemConfig[] | undefined,
  defaults: CustomNavItemConfig[]
): CustomNavItemConfig[] {
  if (!Array.isArray(saved) || saved.length === 0) {
    return defaults.map(d => ({ ...d }));
  }

  const defaultsById = new Map(defaults.map(d => [d.id, d]));
  const seen = new Set<string>();
  const result: CustomNavItemConfig[] = [];

  for (const item of saved) {
    if (!item || !item.id || seen.has(item.id)) continue;
    const canonical = defaultsById.get(item.id);
    if (!canonical) continue;
    seen.add(item.id);
    result.push({
      id: item.id,
      label: item.label?.trim() ? item.label : canonical.label,
      subtext: item.subtext !== undefined ? item.subtext : canonical.subtext,
      badge: item.badge !== undefined ? item.badge : canonical.badge,
      visible: item.visible !== false,
    });
  }

  for (const canonical of defaults) {
    if (!seen.has(canonical.id)) {
      result.push({ ...canonical });
    }
  }

  return result;
}

/**
 * Applies saved ordering, custom labels, subtexts, badges, and visibility overrides
 * onto a list of runtime nav candidates that hold icons, counters, and sectionIds.
 */
export function applyNavigationCustomization<
  T extends { id: string; label?: string; title?: string; subtext?: string; badge?: string }
>(
  candidates: T[],
  customItems: CustomNavItemConfig[] | undefined,
  options?: {
    hideInvisible?: boolean;
    alwaysKeepVisibleIds?: string[];
  }
): T[] {
  if (!Array.isArray(customItems) || customItems.length === 0) {
    return candidates;
  }

  const hideInvisible = options?.hideInvisible ?? true;
  const keepSet = new Set(options?.alwaysKeepVisibleIds || ['dashboard', 'Dashboard']);
  const customMap = new Map(customItems.map((c, idx) => [c.id, { item: c, order: idx }]));

  const mapped: Array<{ candidate: T; order: number }> = [];

  candidates.forEach((cand, defaultIdx) => {
    const entry = customMap.get(cand.id);
    if (!entry) {
      mapped.push({ candidate: cand, order: 1000 + defaultIdx });
      return;
    }

    const custom = entry.item;
    if (hideInvisible && custom.visible === false && !keepSet.has(cand.id)) {
      return;
    }

    const patched: T = { ...cand };
    if (custom.label && custom.label.trim()) {
      if ('label' in patched && patched.label !== undefined) {
        (patched as any).label = custom.label.trim();
      }
      if ('title' in patched && patched.title !== undefined) {
        (patched as any).title = custom.label.trim();
      }
    }
    if (custom.subtext !== undefined && custom.subtext.trim() && 'subtext' in patched) {
      (patched as any).subtext = custom.subtext.trim();
    }
    if (custom.badge !== undefined && custom.badge.trim() && 'badge' in patched) {
      (patched as any).badge = custom.badge.trim();
    }

    mapped.push({ candidate: patched, order: entry.order });
  });

  mapped.sort((a, b) => a.order - b.order);
  return mapped.map(m => m.candidate);
}

export function getResolvedNavigationConfig(
  navConfig?: NavigationCustomizationConfig
): Required<NavigationCustomizationConfig> {
  return {
    verticalSidebar: reconcileCustomNavItems(navConfig?.verticalSidebar, DEFAULT_VERTICAL_NAV_ITEMS),
    horizontalNavbar: reconcileCustomNavItems(navConfig?.horizontalNavbar, DEFAULT_HORIZONTAL_NAV_ITEMS),
    servicesMenuTitle: navConfig?.servicesMenuTitle?.trim() || DEFAULT_SERVICES_MENU_TITLE,
    servicesMenuItems: reconcileCustomNavItems(navConfig?.servicesMenuItems, DEFAULT_SERVICES_MENU_ITEMS),
  };
}

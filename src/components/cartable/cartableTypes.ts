import { UserRole } from '../../types';

export interface CartableCategoryItem {
  id: string;
  key: string;
  title: string;
  assignedRole: string;
  assignedOfficialTitle: string;
  description: string;
  isActive?: boolean;
}

export interface CartableGuide {
  id?: string;
  title: string;
  content: string;
  steps: string[];
  tips: string[];
  updatedAt?: string;
  updatedBy?: string;
  enabled?: boolean;
}

export interface CartableFollowableTopic {
  id: string;
  title: string;
  description: string;
  departmentTitle?: string;
  categoryKey?: string;
  estimatedDays?: string;
  isActive?: boolean;
  order?: number;
}

export interface CartableFollowableTopicsConfig {
  enabled?: boolean;
  buttonLabel?: string;
  title: string;
  subtitle?: string;
  items: CartableFollowableTopic[];
  updatedAt?: string;
  updatedBy?: string;
}

export const CARTABLE_FILE_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx';
export const MAX_CARTABLE_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXT_SET = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx']);

export function validateCartableClientFile(file: File): { ok: boolean; error?: string } {
  const lowerName = (file.name || '').toLowerCase();
  const ext = lowerName.includes('.') ? '.' + lowerName.split('.').pop() : '';
  if (!ALLOWED_EXT_SET.has(ext)) {
    return {
      ok: false,
      error: `فرمت «${ext || file.type || 'ناشناخته'}» مجاز نیست. صرفاً تصویر (JPG, PNG, WEBP)، فایل PDF و سند Word (DOC, DOCX) مجاز است.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, error: `فایل «${file.name}» خالی است.` };
  }
  if (file.size > MAX_CARTABLE_FILE_BYTES) {
    return { ok: false, error: `حجم فایل «${file.name}» نباید بیشتر از ۸ مگابایت باشد.` };
  }
  return { ok: true };
}

export function isStaffRole(role?: UserRole | string | null): boolean {
  return (
    role === 'admin' ||
    role === 'supervisor' ||
    role === 'super_admin' ||
    role === 'alumni_manager' ||
    role === 'admin_finance_officer' ||
    role === 'education_deputy' ||
    role === 'cultural_educational_officer' ||
    role === 'research_deputy' ||
    role === 'general_observer'
  );
}

export function getAttachmentExtension(url: string): string {
  const clean = (url || '').split('?')[0].split('#')[0];
  const lastDot = clean.lastIndexOf('.');
  return lastDot >= 0 ? clean.slice(lastDot).toLowerCase() : '';
}

export function isImageAttachmentUrl(url: string): boolean {
  const ext = getAttachmentExtension(url);
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp';
}

export function getAttachmentFolderBadge(url: string): { label: string; isOfficialFile: boolean } | null {
  if (!url) return null;
  if (url.includes('/cartable_officials/')) {
    return { label: 'پیوست / گواهی مسئول', isOfficialFile: true };
  }
  if (url.includes('/cartable_alumni/')) {
    return { label: 'مدرک دانش‌آموخته', isOfficialFile: false };
  }
  return null;
}

export const DEFAULT_CATEGORIES: CartableCategoryItem[] = [
  {
    id: 'cat_admin',
    key: 'administrative',
    title: 'خدمات اداری (صدور گواهی، ریزنمرات و احکام)',
    assignedRole: 'admin_finance_officer',
    assignedOfficialTitle: 'مسئول اداری و مالی',
    description: 'صدور انواع گواهی اشتغال، احکام، تسویه‌حساب و مدارک رسمی اداری',
    isActive: true,
  },
  {
    id: 'cat_edu',
    key: 'educational',
    title: 'خدمات آموزشی (تطبیق واحدهای حوزوی و دانشگاهی)',
    assignedRole: 'education_deputy',
    assignedOfficialTitle: 'معاونت آموزش',
    description: 'ارزیابی پرونده تحصیلی، صدور معرفی‌نامه امتحانات و تطبیق دروس',
    isActive: true,
  },
  {
    id: 'cat_career',
    key: 'career',
    title: 'خدمات شغلی (جابه‌جایی، ارتقای رتبه و تسریع پرونده)',
    assignedRole: 'alumni_manager',
    assignedOfficialTitle: 'مدیر دانش‌آموختگان',
    description: 'تسریع فرایند استخدامی، معرفی‌نامه شغلی، ارتقای پایه و انتقال سازمانی',
    isActive: true,
  },
];

export const DEFAULT_GUIDE: CartableGuide = {
  id: 'guide_default',
  title: 'راهنمای جامع ثبت درخواست در کارتابل خدمات',
  content:
    'دانش‌آموختگان گرامی می‌توانند انواع درخواست‌های اداری، آموزشی، رفاهی و استعلامات رسمی خود را از این درگاه ثبت نمایند. بر اساس دسته‌بندی انتخابی، هر پرونده به صورت خودکار به مسئول مربوطه در سازمان ارجاع داده شده و کد رهگیری یکتا دریافت می‌کند.',
  steps: [
    'انتخاب دقیق دسته‌بندی موضوعی جهت ارجاع مستقیم به کارتابل مسئول مربوطه',
    'درج عنوان گویا و مستند همراه با شرح تفصیلی در متن درخواست',
    'تعیین اولویت رسیدگی (عادی یا فوری؛ درخواست‌های فوری شامل مواعد اداری حساس هستند)',
    'پیوست مدارک، اسناد، فیش‌ها و سوابق مورد نیاز جهت تسریع در فرآیند',
  ],
  tips: [
    'درخواست‌های عادی با دقت کامل توسط کارشناس رسیدگی و در موعد مقرر پاسخ داده می‌شوند.',
    'پس از ثبت، امکان گفت‌وگوی تعاملی و ارسال مدارک تکمیلی در طول رسیدگی پرونده فراهم است.',
    'تغییر وضعیت پرونده به صورت بلادرنگ در کارتابل شما منعکس و اطلاع‌رسانی می‌گردد.',
  ],
  enabled: true,
};

export const DEFAULT_FOLLOWABLE_TOPICS: CartableFollowableTopicsConfig = {
  enabled: true,
  buttonLabel: 'موارد قابل پیگیری از مرکز فقه و حقوق اسلامی',
  title: 'موارد قابل پیگیری از مرکز فقه و حقوق اسلامی',
  subtitle: 'فهرست خدمات، استعلامات و امور قابل پیگیری رسمی ویژه دانش‌آموختگان مرکز',
  items: [
    {
      id: 'ft_cert_grad',
      title: 'صدور گواهی فراغت از تحصیل و تاییدیه سوابق حوزوی و دانشگاهی',
      description: 'درخواست صدور گواهی رسمی پایان دوره، تاییدیه تحصیلی و استعلام مدارک برای مراجع قضایی و اداری.',
      departmentTitle: 'معاونت آموزش',
      categoryKey: 'educational',
      estimatedDays: '۳ تا ۵ روز کاری',
      isActive: true,
      order: 1,
    },
    {
      id: 'ft_intro_letter',
      title: 'صدور معرفی‌نامه شغلی، قضایی و سازمان‌های همکار',
      description: 'صدور نامه‌های رسمی معرفی به قوه قضائیه، مراکز داوری، شوراهای حل اختلاف و دستگاه‌های اجرایی.',
      departmentTitle: 'مدیر دانش‌آموختگان',
      categoryKey: 'career',
      estimatedDays: '۲ تا ۴ روز کاری',
      isActive: true,
      order: 2,
    },
    {
      id: 'ft_admin_clearance',
      title: 'امور اداری، احکام، تسویه‌حساب و گواهی اشتغال یا سوابق مالی',
      description: 'پیگیری مکاتبات اداری، سوابق همکاری پژوهشی، حق‌التدریس و گواهی‌های رسمی اداری.',
      departmentTitle: 'مسئول اداری و مالی',
      categoryKey: 'administrative',
      estimatedDays: '۳ روز کاری',
      isActive: true,
      order: 3,
    },
    {
      id: 'ft_research_support',
      title: 'معرفی استاد راهنما و پیگیری طرح‌های پژوهشی و چاپ آثار فقهی و حقوقی',
      description: 'درخواست حمایت، تخصیص مشاور علمی، تصویب پروپوزال و پیگیری مراحل انتشار کتب و مقالات.',
      departmentTitle: 'معاونت اجرایی و پژوهش',
      categoryKey: 'research',
      estimatedDays: '۵ تا ۷ روز کاری',
      isActive: true,
      order: 4,
    },
    {
      id: 'ft_welfare_consult',
      title: 'پیگیری خدمات رفاهی، تسهیلات و هماهنگی اسکان زیارتی و پژوهشی',
      description: 'استعلام وضعیت درخواست‌های اسکان قم/تهران/مشهد و پیگیری امور رفاهی و تعاونی اعضا.',
      departmentTitle: 'معاونت فرهنگی و رفاهی',
      categoryKey: 'welfare',
      estimatedDays: '۲ تا ۳ روز کاری',
      isActive: true,
      order: 5,
    },
  ],
};

export const OFFICIAL_ROLES_LIST = [
  { role: 'admin', title: 'مدیر ارشد سامانه' },
  { role: 'general_observer', title: 'ناظر کل سامانه' },
  { role: 'alumni_manager', title: 'مدیر دانش‌آموختگان' },
  { role: 'admin_finance_officer', title: 'مسئول اداری و مالی' },
  { role: 'education_deputy', title: 'معاونت آموزش' },
  { role: 'cultural_educational_officer', title: 'معاونت فرهنگی و رفاهی' },
  { role: 'research_deputy', title: 'معاونت اجرایی و پژوهش' },
];

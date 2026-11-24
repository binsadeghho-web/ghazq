import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import { adminSettingsRepo } from '../admin/adminSettingsRepository';
import {
  SpecializedCounselingPortalConfig,
  GeneralCounselingPortalConfig,
  CounselingFieldItem,
  GeneralCounselingTariffItem,
  CounselingGeneralShowcaseConfig,
} from '../../../types';

function sanitizeMediaOrExternalUrl(raw?: string): string | undefined {
  if (!raw || !String(raw).trim()) return undefined;
  const trimmed = String(raw).trim();
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/assets/') || trimmed.startsWith('/src/assets/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {}
  throw AppError.badRequest('لینک وارد شده معتبر نیست. صرفاً لینک‌های http://، https:// یا فایل بارگذاری‌شده در سامانه مجاز هستند.');
}

export const DEFAULT_GENERAL_SHOWCASE_CONFIG: CounselingGeneralShowcaseConfig = {
  sectionBadge: 'آرامش روانی، سلامت خانواده و توانمندسازی',
  sectionTitle: 'ویترین خدمات روانشناختی و مشاوره مرکز',
  sectionSubtitle: 'کارگاه‌های آموزشی، اطلاعیه‌های دوره‌های روان‌شناسی و معرفی مشاورین مرکز',
  displayMode: 'carousel',
  carouselAutoplay: true,
  carouselIntervalSeconds: 6,
  showcaseScale: 'normal',
  showcaseImageUrl: '',
  showShowcaseImage: true,
  workshopsDisplayMode: 'both',
  upcomingFields: {
    showImage: true,
    showPresenter: true,
    showSchedule: true,
    showDescription: true,
    showActionBadge: true,
  },
  archiveFields: {
    showImage: true,
    showPresenter: true,
    showSchedule: true,
    showDescription: false,
    showActionBadge: true,
  },
  showWorkshopsCard: true,
  showAnnouncementsCard: true,
  showFeaturedConsultantCard: true,
  workshopsCardTitle: 'کارگاه‌های آموزشی و آرشیو جلسات',
  workshopsCardSubtitle: 'شرکت در کارگاه‌های پیش‌رو و دانلود صوت یا ویدئوی نشست‌های برگزارشده',
  announcementsCardTitle: 'اطلاعیه‌های دوره‌های روان‌شناسی',
  announcementsCardSubtitle: 'فراخوان دوره‌های تخصصی روان‌شناسی درون‌مرکزی و برون‌مرکزی',
  consultantCardTitle: 'مشاورین مرکز',
  consultantCardCtaLabel: 'رزرو وقت مشاوره',
  featuredConsultantIds: [],
  workshops: [
    {
      id: 'ws_sample_upcoming_1',
      title: 'کارگاه مهارت‌های گفت‌وگو و حل تعارض در خانواده',
      mode: 'upcoming',
      presenter: 'دکتر محمدحسین رضایی',
      topic: 'تحکیم خانواده و زوج‌درمانی',
      scheduleText: 'پنج‌شنبه · ساعت ۱۶:۰۰ تا ۱۸:۰۰',
      description: 'بررسی الگوهای ارتباطی موثر در خانواده و روش‌های عملی کاهش تنش‌های روزمره برای خانواده‌های طلاب و قضات.',
      capacityLabel: 'ظرفیت محدود · حضوری و برخط',
      isActive: true,
      displayOrder: 1,
      mediaFiles: [],
    },
    {
      id: 'ws_sample_archive_1',
      title: 'نشست پیشگیری از فرسودگی شغلی و مدیریت استرس قضایی',
      mode: 'archive',
      presenter: 'دکتر سارا کریمی',
      topic: 'سلامت روان شغلی',
      scheduleText: 'آرشیو جلسه برگزارشده · ۹۰ دقیقه',
      description: 'مجموعه صوت و جزوه کارگاه برگزارشده ویژه قضات و پژوهشگران پرکار.',
      isActive: true,
      displayOrder: 2,
      mediaFiles: [],
    },
  ],
  announcements: [
    {
      id: 'ann_sample_1',
      title: 'فراخوان دوره تربیت مشاور و مهارت‌های فرزندپروری آگاهانه',
      subtitle: 'ویژه خانواده‌های دانش‌آموختگان با گواهی معتبر',
      organizerType: 'internal',
      organizerName: 'کلینیک مشاوره مرکز فقه و قضا',
      scheduleText: 'شروع دوره: نیمه دوم ماه جاری',
      description: 'دوره کاربردی ۶ جلسه‌ای با رویکرد تلفیقی روان‌شناسی تحولی و آموزه‌های تربیتی اسلام.',
      topics: [
        'روان‌شناسی رشد و نیازهای عاطفی کودک و نوجوان',
        'اصول ارتباط بدون تنش در محیط خانه',
        'شناخت اختلالات رایج و راهکار ارجاع به‌موقع',
      ],
      bannerUrl: '/assets/showcase/counseling-general-fallback.jpg',
      isActive: true,
      displayOrder: 1,
    },
  ],
};

export const DEFAULT_OTHER_COUNSELING_CITIES: string[] = [
  'تهران',
  'مشهد',
  'اصفهان',
  'شیراز',
  'تبریز',
  'کرج',
  'رشت',
];

export const DEFAULT_SPECIALIZED_PORTAL_CONFIG: SpecializedCounselingPortalConfig = {
  sectionTitle: 'مشاوره تخصصی شغلی و تحصیلی',
  sectionSubtitle: 'هدایت گام‌به‌گام مسیر حرفه‌ای، پژوهشی و انتخاب گرایش تخصصی دانش‌آموختگان',
  headerBadgeLabel: 'واحد تخصصی هدایت شغلی و تحصیلی',
  tabRequestLabel: 'ثبت درخواست و محورها',
  tabConsultantsLabel: 'مشاوران تخصصی',
  tabHistoryLabel: 'سوابق درخواست‌ها',
  heroBadgeLabel: 'مشاوره تخصصی نخبگانی و قضایی',
  landingIntroTitle: 'راهنمای جامع مشاوره تخصصی شغلی و تحصیلی مرکز',
  landingIntroBody: 'در این بخش می‌توانید با بهره‌گیری از تجربه مشاوران تخصصی مرکز، برای مسیر ارتقای شغلی، انتخاب گرایش علمی، ادامه تحصیل در مقاطع تکمیلی و برنامه‌ریزی حرفه‌ای نوبت مشاوره ثبت نمایید. تمامی درخواست‌ها با محرمانگی کامل بررسی و زمان‌بندی می‌شوند.',
  heroHistoryButtonLabel: 'سوابق درخواست‌های من',
  calloutBadgeLabel: 'تکمیل مرحله‌به‌مرحله درخواست با راهنمای دائمی',
  landingCalloutTitle: 'آماده برنامه‌ریزی دقیق برای مسیر شغلی یا تحصیلی خود هستید؟',
  landingCalloutSubtitle: 'با کلیک بر روی دکمه زیر وارد مراحل کوتاه و ساختاریافته ثبت درخواست مشاوره خواهید شد.',
  ctaButtonLabel: 'در خواست مشاوره تخصصی شغلی/تحصیلی دارم',
  calloutSecondaryLinkLabel: 'مشاهده توضیحات پیش از شروع',
  fieldsShowcaseBadgeLabel: 'محورهای تخصصی هدایت شغلی و تحصیلی',
  fieldsSectionTitle: 'زمینه‌های مشاوره تخصصی',
  fieldsSectionSubtitle: 'حوزه‌هایی که مشاوران تخصصی مرکز در آن‌ها آماده راهنمایی شما هستند',
  fieldsShowcaseHelperText: 'روی هر زمینه کلیک کنید تا فرم ثبت درخواست با همان محور باز شود',
  fieldsCardCtaLabel: 'ثبت درخواست در این زمینه',
  fieldsShowcaseEmptyText: 'هنوز زمینه مشاوره‌ای برای این بخش تعریف نشده است.',
  landingInfoCardsTitle: '',
  landingInfoCardsSubtitle: '',
  landingInfoCards: [],
  descriptionButtonLabel: 'توضیحات',
  descriptionModalTitle: 'توضیحات و شیوه‌نامه مشاوره تخصصی شغلی / تحصیلی',
  descriptionModalBody: '۱. پس از ثبت درخواست، پرونده شما توسط دبیرخانه مشاوره تخصصی بررسی و متناسب‌ترین مشاور معرفی می‌گردد.\n۲. جلسات به صورت حضوری در مرکز، برخط تصویری یا تلفنی قابل برگزاری است.\n۳. زمان و محل دقیق برگزاری پس از تایید از طریق همین کارتابل به اطلاع شما خواهد رسید.',
  showAdvisorsToStudents: true,
  showFieldsSelectionStep: true,
  wizardFieldStepTitle: 'گام اول: انتخاب زمینه مشاوره',
  wizardFieldStepSubtitle: 'انتخاب زمینه به کارشناسان کمک می‌کند درخواست شما به مرتبط‌ترین متخصص ارجاع شود.',
  wizardFieldNotice: 'لطفاً زمینه مشاوره مورد نظر خود را انتخاب کنید:',
  fieldSelectionOptional: false,
  skipFieldSelectionLabel: 'ادامه بدون انتخاب زمینه',
  otherCities: [...DEFAULT_OTHER_COUNSELING_CITIES],
  includeFinalReviewStep: true,
  showPhoneFieldInWizard: true,
  showConsultantsInWizard: true,
  submitButtonLabel: 'تایید و ثبت قطعی درخواست',
  nextButtonLabel: 'ادامه و مرحله بعد',
  prevButtonLabel: 'مرحله قبل',
  submissionSuccessTitle: 'درخواست شما با موفقیت ثبت گردید',
  submissionSuccessMessage: 'درخواست مشاوره تخصصی شغلی/تحصیلی شما با موفقیت در سامانه ثبت شد. همکاران مرکز پس از بررسی، زمان و نحوه جلسه را در همین بخش اطلاع‌رسانی می‌نمایند.',
  wizardSteps: [
    {
      id: 'spec_step_1',
      title: 'نوع نیاز و اولویت جلسه',
      subtitle: 'مشخص فرمایید مشاوره شما بیشتر متمرکز بر کدام هدف است.',
      enabled: true,
      order: 1,
      fields: [
        {
          id: 'sf_goal',
          key: 'primaryGoal',
          label: 'هدف اصلی درخواست مشاوره تخصصی',
          type: 'radio',
          options: ['مشاوره ارتقا و مسیر شغلی', 'مشاوره ادامه تحصیل و مقطع دکتری/سطح ۴', 'راه‌اندازی دفتر تخصصی یا داوری', 'سایر موارد ترکیبی'],
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'sf_urgency',
          key: 'urgencyLevel',
          label: 'اولویت زمانی رسیدگی',
          type: 'select',
          options: ['عادی (برنامه‌ریزی هفتگی)', 'فوری (نیاز به تصمیم‌گیری در چند روز آینده)'],
          required: true,
          enabled: true,
          order: 2,
        },
      ],
    },
    {
      id: 'spec_step_2',
      title: 'شرح مسئله و سوابق مرتبط',
      subtitle: 'ارائه خلاصه وضعیت فعلی به مشاور کمک می‌کند جلسه پربارتری داشته باشید.',
      enabled: true,
      order: 2,
      fields: [
        {
          id: 'sf_background',
          key: 'currentStatus',
          label: 'وضعیت فعلی شغلی یا تحصیلی',
          type: 'text',
          placeholder: 'مثال: دانش‌آموخته پایه قضایی / دانشجوی سطح ۳ / وکیل پایه یک...',
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'sf_question',
          key: 'keyQuestions',
          label: 'سوالات کلیدی و چالش‌هایی که می‌خواهید بررسی شود',
          type: 'textarea',
          placeholder: 'لطفاً دغدغه اصلی، محدودیت‌ها یا گزینه‌های پیش رو را به صورت خلاصه بنویسید...',
          required: true,
          enabled: true,
          order: 2,
        },
      ],
    },
    {
      id: 'spec_step_3',
      title: 'شیوه و زمان پیشنهادی برگزاری',
      subtitle: 'شیوه مطلوب ارتباط با مشاور را مشخص نمایید.',
      enabled: true,
      order: 3,
      fields: [
        {
          id: 'sf_mode',
          key: 'meetingMode',
          label: 'نحوه برگزاری جلسه',
          type: 'radio',
          options: ['حضوری', 'برخط (تصویری امن)', 'تلفنی'],
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'sf_time_pref',
          key: 'preferredDays',
          label: 'روزها و بازه زمانی مناسب شما',
          type: 'checkbox',
          options: ['شنبه تا دوشنبه (صبح)', 'شنبه تا دوشنبه (عصر)', 'سه‌شنبه و چهارشنبه (صبح)', 'سه‌شنبه و چهارشنبه (عصر)'],
          required: false,
          enabled: true,
          order: 2,
        },
      ],
    },
  ],
  version: 1,
};

export const DEFAULT_GENERAL_PORTAL_CONFIG: GeneralCounselingPortalConfig = {
  sectionTitle: 'خدمات روانشناختی و مشاوره مرکز',
  sectionSubtitle: 'خدمات تخصصی روان‌شناسی، خانواده، تاب‌آوری شغلی و سنجش‌های روان‌شناختی با حفظ محرمانگی کامل',
  headerBadgeLabel: 'بخش مستقل خدمات روان‌شناسی و سلامت روان مرکز',
  tabRequestLabel: 'رزرو وقت و زمینه‌های مشاوره',
  tabConsultantsLabel: 'روان‌شناسان مرکز',
  tabTariffsLabel: 'نرخ‌نامه',
  tabTestsLabel: 'تست‌ها',
  tabHistoryLabel: 'سوابق مشاوره',
  heroBadgeLabel: 'بخش روان‌شناسان و خدمات روانشناختی و مشاوره مرکز',
  landingIntroTitle: 'آشنایی با مرکز مشاوره و خدمات روان‌شناختی',
  landingIntroBody: 'این بخش منحصراً توسط روان‌شناسان مجرب مرکز برای حمایت از سلامت روان، آرامش خانواده، پیشگیری از فرسودگی شغلی و تحلیل آزمون‌های استاندارد روان‌شناختی راه‌اندازی شده است. تمامی اطلاعات و گفتگوها کاملاً محرمانه می‌مانند.',
  heroHistoryButtonLabel: 'سوابق درخواست‌های من',
  calloutBadgeLabel: 'تکمیل مرحله‌به‌مرحله درخواست با راهنمای دائمی',
  landingCalloutTitle: 'نیاز به گفت‌وگوی تخصصی با روان‌شناسان مرکز دارید؟',
  landingCalloutSubtitle: 'برای ثبت نوبت جدید روی دکمه رزرو وقت مشاوره کلیک کرده و مراحل کوتاه را تکمیل فرمایید.',
  ctaButtonLabel: 'رزرو وقت مشاوره',
  calloutSecondaryLinkLabel: 'مشاهده توضیحات پیش از شروع',
  fieldsShowcaseBadgeLabel: 'حوزه‌های خدمات روان‌شناختی',
  fieldsSectionTitle: 'زمینه‌های خدمات روانشناختی و مشاوره',
  fieldsSectionSubtitle: 'محورهای تخصصی خدمات روان‌شناختی و خانواده در مرکز',
  fieldsShowcaseHelperText: 'روی هر زمینه کلیک کنید تا فرم ثبت درخواست با همان محور باز شود',
  fieldsCardCtaLabel: 'انتخاب و رزرو وقت',
  fieldsShowcaseEmptyText: 'هنوز زمینه مشاوره‌ای برای این بخش تعریف نشده است.',
  landingInfoCardsTitle: '',
  landingInfoCardsSubtitle: '',
  landingInfoCards: [],
  descriptionButtonLabel: 'توضیحات',
  descriptionModalTitle: 'راهنما و منشور محرمانگی مشاوره روان‌شناختی',
  descriptionModalBody: '۱. پرونده‌های روان‌شناختی و نتایج تست‌ها تنها برای روان‌شناس متخصص پرونده قابل رویت است.\n۲. در صورت صلاح‌دید روان‌شناس، تست‌های تکمیلی در بخش «تست‌ها» برای شما فعال می‌گردد.\n۳. تعرفه‌ها با یارانه ویژه اعضای مرکز محاسبه می‌شوند.',
  showFieldsSelectionStep: true,
  wizardFieldStepTitle: 'انتخاب زمینه مشاوره',
  wizardFieldStepSubtitle: '',
  wizardFieldNotice: 'در صورت تمایل زمینه مشاوره را انتخاب کنید (اطلاعات شما کاملاً محرمانه می‌ماند)',
  fieldSelectionOptional: true,
  skipFieldSelectionLabel: 'انتخاب نمی‌کنم / ادامه بدون انتخاب زمینه',
  otherCities: [...DEFAULT_OTHER_COUNSELING_CITIES],
  includeFinalReviewStep: false,
  showPhoneFieldInWizard: true,
  showConsultantsInWizard: false,
  submitButtonLabel: 'ثبت درخواست مشاوره',
  nextButtonLabel: 'ادامه و مرحله بعد',
  prevButtonLabel: 'مرحله قبل',
  showRatesInWizardEnd: true,
  ratesButtonLabel: 'اطلاع از نرخ نامه مشاوره مرکز',
  submissionSuccessTitle: 'درخواست شما ثبت شد',
  submissionSuccessMessage: 'درخواست شما ثبت شد و مشاوران مرکز با شما تماس خواهند گرفت',
  wizardSteps: [
    {
      id: 'gen_step_location_time',
      title: 'انتخاب مکان و زمان مشاوره',
      subtitle: 'لطفاً شهر و بازه زمانی مناسب خود را مشخص کرده و درخواست را ثبت نمایید.',
      enabled: true,
      order: 1,
      fields: [
        {
          id: 'gf_location',
          key: 'counselingLocation',
          label: 'مکان برگزاری مشاوره',
          type: 'location_city',
          primaryCityLabel: 'قم',
          otherCitiesLabel: 'سایر شهرها',
          options: [...DEFAULT_OTHER_COUNSELING_CITIES],
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'gf_time_slot',
          key: 'counselingTimePreference',
          label: 'زمان مناسب جهت مشاوره',
          type: 'time_preference',
          dayTimeOptions: ['صبح', 'عصر'],
          weekPeriodOptions: ['وسط هفته', 'آخر هفته'],
          undecidedLabel: 'فعلاً مشخص نیست',
          required: true,
          enabled: true,
          order: 2,
        },
      ],
    },
  ],
  version: 1,
};

function mapFieldRow(row: any): CounselingFieldItem {
  return {
    id: fromIdBuffer(row.id),
    counselingType: row.counseling_type === 'specialized_career' ? 'specialized_career' : 'general',
    title: row.title,
    subtitle: row.subtitle || '',
    description: row.description || '',
    iconName: row.icon_name || 'sparkles',
    accentColor: row.accent_color || 'emerald',
    isActive: Boolean(row.is_active),
    displayOrder: Number(row.display_order || 1),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

function mapTariffRow(row: any): GeneralCounselingTariffItem {
  return {
    id: fromIdBuffer(row.id),
    serviceTitle: row.service_title,
    sessionDurationMinutes: Number(row.session_duration_minutes || 45),
    meetingMode: row.meeting_mode || 'همه روش‌ها',
    standardFee: Number(row.standard_fee || 0),
    alumniSubsidizedFee: Number(row.alumni_subsidized_fee || 0),
    notes: row.notes || '',
    isActive: Boolean(row.is_active),
    displayOrder: Number(row.display_order || 1),
    version: Number(row.version || 1),
  };
}

export function registerCounselingConfigRoutes(router: Router): void {
  // 1. Portal Config (Specialized & General)
  router.get('/config/:type', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const type = req.params.type === 'specialized_career' ? 'specialized_career' : 'general';
      const key =
        type === 'specialized_career'
          ? 'specialized_counseling_portal_config'
          : 'general_counseling_portal_config';
      const defaultCfg =
        type === 'specialized_career' ? DEFAULT_SPECIALIZED_PORTAL_CONFIG : DEFAULT_GENERAL_PORTAL_CONFIG;

      const record = await adminSettingsRepo.getRecord<any>(key);
      if (!record) {
        res.json({ ...defaultCfg, version: 1 });
        return;
      }

      res.json({
        ...defaultCfg,
        ...(record.value || {}),
        version: Number(record.version || 1),
      });
    } catch (err) {
      next(err);
    }
  });

  router.put('/config/:type', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ویرایش تنظیمات مشاوره نیست.');
      }
      const type = req.params.type === 'specialized_career' ? 'specialized_career' : 'general';
      if (u.role === 'psychologist_counselor' && type === 'specialized_career') {
        throw AppError.forbidden('نقش روانشناس و مشاور مرکز صرفاً مجاز به مدیریت بخش خدمات روانشناختی و مشاوره است.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        type === 'general'
          ? ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer', 'psychologist_counselor']
          : ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']
      );
      const key =
        type === 'specialized_career'
          ? 'specialized_counseling_portal_config'
          : 'general_counseling_portal_config';
      const defaultCfg =
        type === 'specialized_career' ? DEFAULT_SPECIALIZED_PORTAL_CONFIG : DEFAULT_GENERAL_PORTAL_CONFIG;

      const expectedVersion = extractExpectedVersion(req, false);
      const existing = await adminSettingsRepo.getRecord<any>(key);

      if (existing && expectedVersion !== undefined && Number(existing.version) !== Number(expectedVersion)) {
        throw AppError.conflict(
          'تنظیمات این بخش مشاوره هم‌زمان توسط مدیر دیگری تغییر یافته است.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const body = { ...(req.body || {}) };
      delete body.version;
      delete body._baseVersion;
      delete body.expectedVersion;

      // Sync otherCities with any location_city field in wizardSteps cleanly
      if (Array.isArray(body.otherCities) && Array.isArray(body.wizardSteps)) {
        const cleanCities = body.otherCities.map((c: any) => String(c || '').trim()).filter(Boolean);
        body.otherCities = cleanCities;
        body.wizardSteps = body.wizardSteps.map((st: any) => ({
          ...st,
          fields: Array.isArray(st.fields)
            ? st.fields.map((fl: any) =>
                fl.type === 'location_city' ? { ...fl, options: cleanCities } : fl
              )
            : [],
        }));
      }

      const nextConfig = {
        ...defaultCfg,
        ...(existing?.value || {}),
        ...body,
      };

      let finalVersion = 1;
      if (existing) {
        const baseVer = expectedVersion !== undefined ? Number(expectedVersion) : Number(existing.version);
        const upd = await adminSettingsRepo.updateOptimistic(key, nextConfig, baseVer, u.fullName);
        finalVersion = upd.newVersion;
      } else {
        await adminSettingsRepo.saveSetting(key, nextConfig, `Counseling portal config (${type})`, u.fullName);
        finalVersion = 1;
      }

      const payload = { ...nextConfig, version: finalVersion };

      outbox.enqueue('counseling.portal_config_updated', {
        id: key,
        resourceId: key,
        counselingType: type,
        version: finalVersion,
        config: payload,
        updates: { counselingType: type, config: payload },
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(payload);
    } catch (err) {
      next(err);
    }
  });

  // 2. Counseling Fields (زمینه‌های مشاوره)
  router.get('/fields', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const typeFilter = req.query.type as string | undefined;
      const includeInactive = req.query.includeInactive === 'true';

      let sql = `SELECT * FROM counseling_fields WHERE deleted_at IS NULL`;
      const params: any[] = [];
      if (typeFilter === 'general' || typeFilter === 'specialized_career') {
        sql += ` AND counseling_type = ?`;
        params.push(typeFilter);
      }
      if (!includeInactive) {
        sql += ` AND is_active = 1`;
      }
      sql += ` ORDER BY display_order ASC, created_at ASC`;

      const rows = await selectWithTimeout<any>(sql, params, 3000);
      res.json((rows || []).map(mapFieldRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/fields', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ایجاد زمینه مشاوره نیست.');
      }
      const { counselingType, title, subtitle, description, iconName, accentColor, isActive, displayOrder } = req.body || {};
      const type = counselingType === 'specialized_career' ? 'specialized_career' : 'general';
      if (u.role === 'psychologist_counselor' && type === 'specialized_career') {
        throw AppError.forbidden('نقش روانشناس و مشاور مرکز مجاز به تغییر زمینه‌های مشاوره تخصصی شغلی نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer', 'psychologist_counselor']
      );

      if (!title || !String(title).trim()) {
        throw AppError.badRequest('عنوان زمینه مشاوره الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();

      await p.query(
        `INSERT INTO counseling_fields (id, counseling_type, title, subtitle, description, icon_name, accent_color, is_active, display_order, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          type,
          String(title).trim(),
          subtitle ? String(subtitle).trim() : null,
          String(description || '').trim(),
          iconName || 'sparkles',
          accentColor || 'emerald',
          isActive !== false ? 1 : 0,
          Number(displayOrder || 1),
        ]
      );

      const rows = await selectWithTimeout<any>(`SELECT * FROM counseling_fields WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapFieldRow(rows[0]);

      outbox.enqueue('counseling.field_created', {
        id,
        resourceId: id,
        version: 1,
        updates: created,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/fields/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ویرایش زمینه مشاوره نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer', 'psychologist_counselor']
      );

      const expectedVersion = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM counseling_fields WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('زمینه مشاوره');
      }
      const ex = existingRows[0];
      if (u.role === 'psychologist_counselor' && ex.counseling_type === 'specialized_career') {
        throw AppError.forbidden('نقش روانشناس و مشاور مرکز مجاز به ویرایش زمینه‌های مشاوره تخصصی نیست.');
      }
      const b = req.body || {};

      const [upd]: any = await p.query(
        `UPDATE counseling_fields
         SET title = ?, subtitle = ?, description = ?, icon_name = ?, accent_color = ?, is_active = ?, display_order = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
        [
          b.title !== undefined ? String(b.title).trim() : ex.title,
          b.subtitle !== undefined ? (b.subtitle ? String(b.subtitle).trim() : null) : ex.subtitle,
          b.description !== undefined ? String(b.description).trim() : ex.description,
          b.iconName !== undefined ? b.iconName : ex.icon_name,
          b.accentColor !== undefined ? b.accentColor : ex.accent_color,
          b.isActive !== undefined ? (b.isActive ? 1 : 0) : ex.is_active,
          b.displayOrder !== undefined ? Number(b.displayOrder) : ex.display_order,
          idBuf,
          req.params.id,
          expectedVersion,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('زمینه مشاوره هم‌زمان ویرایش شده است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const refreshed = await selectWithTimeout<any>(
        `SELECT * FROM counseling_fields WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      const updated = mapFieldRow(refreshed[0]);

      outbox.enqueue('counseling.field_updated', {
        id: updated.id,
        resourceId: updated.id,
        version: updated.version,
        updates: updated,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/fields/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به حذف زمینه مشاوره نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer', 'psychologist_counselor']
      );

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      if (u.role === 'psychologist_counselor') {
        const chk = await selectWithTimeout<any>(
          `SELECT counseling_type FROM counseling_fields WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
          [idBuf, req.params.id],
          3000
        );
        if (chk?.[0]?.counseling_type === 'specialized_career') {
          throw AppError.forbidden('نقش روانشناس و مشاور مرکز مجاز به حذف زمینه‌های مشاوره تخصصی نیست.');
        }
      }
      const [upd]: any = await p.query(
        `UPDATE counseling_fields SET deleted_at = NOW(3), is_active = 0, version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
        [idBuf, req.params.id]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.notFound('زمینه مشاوره');
      }

      outbox.enqueue('counseling.field_deleted', {
        id: req.params.id,
        resourceId: req.params.id,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // 3. Counseling Tariffs (نرخ‌نامه مشاوره عمومی)
  router.get('/tariffs', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const includeInactive = req.query.includeInactive === 'true';
      const sql = includeInactive
        ? `SELECT * FROM counseling_tariffs WHERE deleted_at IS NULL ORDER BY display_order ASC, created_at ASC`
        : `SELECT * FROM counseling_tariffs WHERE deleted_at IS NULL AND is_active = 1 ORDER BY display_order ASC, created_at ASC`;

      const rows = await selectWithTimeout<any>(sql, [], 3000);
      res.json((rows || []).map(mapTariffRow));
    } catch (err) {
      next(err);
    }
  });

  router.post('/tariffs', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ثبت نرخ‌نامه نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'admin_finance_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const b = req.body || {};
      if (!b.serviceTitle || !String(b.serviceTitle).trim()) {
        throw AppError.badRequest('عنوان خدمت مشاوره برای درج در نرخ‌نامه الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();

      await p.query(
        `INSERT INTO counseling_tariffs (id, service_title, session_duration_minutes, meeting_mode, standard_fee, alumni_subsidized_fee, notes, is_active, display_order, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          String(b.serviceTitle).trim(),
          Number(b.sessionDurationMinutes || 45),
          b.meetingMode || 'همه روش‌ها',
          Number(b.standardFee || 0),
          Number(b.alumniSubsidizedFee || 0),
          b.notes ? String(b.notes).trim() : null,
          b.isActive !== false ? 1 : 0,
          Number(b.displayOrder || 1),
        ]
      );

      const rows = await selectWithTimeout<any>(`SELECT * FROM counseling_tariffs WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapTariffRow(rows[0]);

      outbox.enqueue('counseling.tariff_created', {
        id,
        resourceId: id,
        version: 1,
        updates: created,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/tariffs/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ویرایش نرخ‌نامه نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'admin_finance_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const expectedVersion = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM counseling_tariffs WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('ردیف نرخ‌نامه');
      }
      const ex = existingRows[0];
      const b = req.body || {};

      const [upd]: any = await p.query(
        `UPDATE counseling_tariffs
         SET service_title = ?, session_duration_minutes = ?, meeting_mode = ?, standard_fee = ?, alumni_subsidized_fee = ?, notes = ?, is_active = ?, display_order = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
        [
          b.serviceTitle !== undefined ? String(b.serviceTitle).trim() : ex.service_title,
          b.sessionDurationMinutes !== undefined ? Number(b.sessionDurationMinutes) : ex.session_duration_minutes,
          b.meetingMode !== undefined ? b.meetingMode : ex.meeting_mode,
          b.standardFee !== undefined ? Number(b.standardFee) : ex.standard_fee,
          b.alumniSubsidizedFee !== undefined ? Number(b.alumniSubsidizedFee) : ex.alumni_subsidized_fee,
          b.notes !== undefined ? (b.notes ? String(b.notes).trim() : null) : ex.notes,
          b.isActive !== undefined ? (b.isActive ? 1 : 0) : ex.is_active,
          b.displayOrder !== undefined ? Number(b.displayOrder) : ex.display_order,
          idBuf,
          req.params.id,
          expectedVersion,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این ردیف نرخ‌نامه هم‌زمان ویرایش شده است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const refreshed = await selectWithTimeout<any>(
        `SELECT * FROM counseling_tariffs WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      const updated = mapTariffRow(refreshed[0]);

      outbox.enqueue('counseling.tariff_updated', {
        id: updated.id,
        resourceId: updated.id,
        version: updated.version,
        updates: updated,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/tariffs/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به حذف نرخ‌نامه نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'admin_finance_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE counseling_tariffs SET deleted_at = NOW(3), is_active = 0, version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
        [idBuf, req.params.id]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.notFound('ردیف نرخ‌نامه');
      }

      outbox.enqueue('counseling.tariff_deleted', {
        id: req.params.id,
        resourceId: req.params.id,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // 4. General Psychological Counseling 3-Card Showcase (Reform 66)
  router.get('/general-showcase', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = (req as any).user;
      const record = await adminSettingsRepo.getRecord<any>('counseling_general_showcase_config');
      const base: CounselingGeneralShowcaseConfig = {
        ...DEFAULT_GENERAL_SHOWCASE_CONFIG,
        ...(record?.value || {}),
        version: Number(record?.version || 1),
      };

      const countMap = new Map<string, number>();
      const myWorkshopIds: string[] = [];
      try {
        const countRows = await selectWithTimeout<any>(
          `SELECT workshop_id, COUNT(*) AS cnt FROM counseling_workshop_registrations WHERE deleted_at IS NULL GROUP BY workshop_id`,
          [],
          2500
        );
        for (const r of countRows || []) {
          countMap.set(String(r.workshop_id), Number(r.cnt || 0));
        }
        if (u?.id) {
          const myRows = await selectWithTimeout<any>(
            `SELECT workshop_id FROM counseling_workshop_registrations WHERE user_id = ? AND deleted_at IS NULL`,
            [String(u.id)],
            2500
          );
          for (const r of myRows || []) {
            myWorkshopIds.push(String(r.workshop_id));
          }
        }
      } catch {}

      res.json({
        ...base,
        workshops: (base.workshops || []).map(w => ({
          ...w,
          registrationsCount: countMap.get(w.id) || 0,
        })),
        myRegisteredWorkshopIds: myWorkshopIds,
      });
    } catch (err) {
      next(err);
    }
  });

  router.put('/general-showcase', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ویرایش ویترین مشاوره نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer', 'psychologist_counselor']
      );

      const key = 'counseling_general_showcase_config';
      const expectedVersion = extractExpectedVersion(req, false);
      const existing = await adminSettingsRepo.getRecord<any>(key);

      if (existing && expectedVersion !== undefined && Number(existing.version) !== Number(expectedVersion)) {
        throw AppError.conflict(
          'تنظیمات ویترین خدمات روانشناختی و مشاوره هم‌زمان توسط مدیر دیگری تغییر یافته است.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const raw = req.body || {};
      const sanitizedWorkshops = (Array.isArray(raw.workshops) ? raw.workshops : DEFAULT_GENERAL_SHOWCASE_CONFIG.workshops).map(
        (ws: any, idx: number) => ({
          id: String(ws.id || generateUUIDv7()),
          title: String(ws.title || 'کارگاه روان‌شناسی').trim(),
          mode: ws.mode === 'archive' ? 'archive' : 'upcoming',
          presenter: ws.presenter ? String(ws.presenter).trim() : '',
          topic: ws.topic ? String(ws.topic).trim() : '',
          scheduleText: ws.scheduleText ? String(ws.scheduleText).trim() : '',
          description: ws.description ? String(ws.description).trim() : '',
          bannerUrl: sanitizeMediaOrExternalUrl(ws.bannerUrl) || '',
          registrationUrl: sanitizeMediaOrExternalUrl(ws.registrationUrl) || '',
          registrationNote: ws.registrationNote ? String(ws.registrationNote).trim() : '',
          capacityLabel: ws.capacityLabel ? String(ws.capacityLabel).trim() : '',
          isActive: ws.isActive !== false,
          displayOrder: Number(ws.displayOrder ?? idx + 1),
          mediaFiles: (Array.isArray(ws.mediaFiles) ? ws.mediaFiles : []).map((mf: any) => ({
            id: String(mf.id || generateUUIDv7()),
            title: String(mf.title || 'فایل جلسه').trim(),
            mediaType: mf.mediaType === 'audio' || mf.mediaType === 'file' ? mf.mediaType : 'video',
            url: sanitizeMediaOrExternalUrl(mf.url) || '',
            sourceType: mf.sourceType === 'disk' ? 'disk' : 'external',
            durationOrSize: mf.durationOrSize ? String(mf.durationOrSize).trim() : '',
          })).filter((mf: any) => Boolean(mf.url)),
        })
      );

      const sanitizedAnnouncements = (Array.isArray(raw.announcements) ? raw.announcements : DEFAULT_GENERAL_SHOWCASE_CONFIG.announcements).map(
        (ann: any, idx: number) => ({
          id: String(ann.id || generateUUIDv7()),
          title: ann.title ? String(ann.title).trim() : '',
          subtitle: ann.subtitle ? String(ann.subtitle).trim() : '',
          organizerType: ann.organizerType === 'external' ? 'external' : 'internal',
          organizerName: ann.organizerName ? String(ann.organizerName).trim() : '',
          scheduleText: ann.scheduleText ? String(ann.scheduleText).trim() : '',
          description: ann.description ? String(ann.description).trim() : '',
          topics: Array.isArray(ann.topics)
            ? ann.topics.map((t: any) => String(t || '').trim()).filter(Boolean)
            : [],
          bannerUrl: sanitizeMediaOrExternalUrl(ann.bannerUrl) || '/assets/showcase/counseling-general-fallback.jpg',
          externalUrl: sanitizeMediaOrExternalUrl(ann.externalUrl) || '',
          isActive: ann.isActive !== false,
          displayOrder: Number(ann.displayOrder ?? idx + 1),
        })
      );

      const sanitizeFields = (f: any, def: NonNullable<CounselingGeneralShowcaseConfig['upcomingFields']>) => ({
        showImage: f?.showImage !== undefined ? Boolean(f.showImage) : Boolean(def.showImage),
        showPresenter: f?.showPresenter !== undefined ? Boolean(f.showPresenter) : Boolean(def.showPresenter),
        showSchedule: f?.showSchedule !== undefined ? Boolean(f.showSchedule) : Boolean(def.showSchedule),
        showDescription: f?.showDescription !== undefined ? Boolean(f.showDescription) : Boolean(def.showDescription),
        showActionBadge: f?.showActionBadge !== undefined ? Boolean(f.showActionBadge) : Boolean(def.showActionBadge),
      });

      const validScales = new Set(['micro', 'compact', 'normal', 'expanded']);
      const validWorkshopModes = new Set(['both', 'upcoming_only', 'archive_only']);

      const merged: CounselingGeneralShowcaseConfig = {
        sectionBadge: raw.sectionBadge !== undefined ? String(raw.sectionBadge).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.sectionBadge,
        sectionTitle: raw.sectionTitle !== undefined ? String(raw.sectionTitle).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.sectionTitle,
        sectionSubtitle: raw.sectionSubtitle !== undefined ? String(raw.sectionSubtitle).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.sectionSubtitle,
        displayMode: raw.displayMode === 'grid' ? 'grid' : 'carousel',
        carouselAutoplay: raw.carouselAutoplay !== false,
        carouselIntervalSeconds: Math.min(30, Math.max(3, Number(raw.carouselIntervalSeconds) || 6)),
        showcaseScale: validScales.has(raw.showcaseScale) ? raw.showcaseScale : 'normal',
        showcaseImageUrl: raw.showcaseImageUrl ? (sanitizeMediaOrExternalUrl(raw.showcaseImageUrl) || '') : '',
        showShowcaseImage: raw.showShowcaseImage !== false,
        workshopsDisplayMode: validWorkshopModes.has(raw.workshopsDisplayMode) ? raw.workshopsDisplayMode : 'both',
        upcomingFields: sanitizeFields(raw.upcomingFields, DEFAULT_GENERAL_SHOWCASE_CONFIG.upcomingFields!),
        archiveFields: sanitizeFields(raw.archiveFields, DEFAULT_GENERAL_SHOWCASE_CONFIG.archiveFields!),
        showWorkshopsCard: raw.showWorkshopsCard !== false,
        showAnnouncementsCard: raw.showAnnouncementsCard !== false,
        showFeaturedConsultantCard: raw.showFeaturedConsultantCard !== false,
        workshopsCardTitle: raw.workshopsCardTitle !== undefined ? String(raw.workshopsCardTitle).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.workshopsCardTitle,
        workshopsCardSubtitle: raw.workshopsCardSubtitle !== undefined ? String(raw.workshopsCardSubtitle).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.workshopsCardSubtitle,
        announcementsCardTitle: raw.announcementsCardTitle !== undefined ? String(raw.announcementsCardTitle).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.announcementsCardTitle,
        announcementsCardSubtitle: raw.announcementsCardSubtitle !== undefined ? String(raw.announcementsCardSubtitle).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.announcementsCardSubtitle,
        consultantCardTitle: raw.consultantCardTitle !== undefined ? String(raw.consultantCardTitle).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.consultantCardTitle,
        consultantCardCtaLabel: raw.consultantCardCtaLabel !== undefined ? String(raw.consultantCardCtaLabel).trim() : DEFAULT_GENERAL_SHOWCASE_CONFIG.consultantCardCtaLabel,
        featuredConsultantIds: Array.isArray(raw.featuredConsultantIds)
          ? raw.featuredConsultantIds.map((idVal: any) => String(idVal)).filter(Boolean)
          : [],
        workshops: sanitizedWorkshops,
        announcements: sanitizedAnnouncements,
      };

      let finalVersion = 1;
      if (existing) {
        const baseVer = expectedVersion !== undefined ? Number(expectedVersion) : Number(existing.version);
        const upd = await adminSettingsRepo.updateOptimistic(key, merged, baseVer, u.fullName);
        finalVersion = upd.newVersion;
      } else {
        await adminSettingsRepo.saveSetting(key, merged, 'Counseling general showcase 3-card config', u.fullName);
        finalVersion = 1;
      }
      const saved = { ...merged, version: finalVersion };

      outbox.enqueue('counseling.general_showcase_updated', {
        version: saved.version,
        config: saved,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(saved);
    } catch (err) {
      next(err);
    }
  });

  // Register current user in an upcoming workshop
  router.post('/workshops/:workshopId/register', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل صرفاً جهت مشاهده است و امکان ثبت‌نام ندارد.');
      }

      const workshopId = String(req.params.workshopId || '').trim();
      const record = await adminSettingsRepo.getRecord<any>('counseling_general_showcase_config');
      const showcase: CounselingGeneralShowcaseConfig = {
        ...DEFAULT_GENERAL_SHOWCASE_CONFIG,
        ...(record?.value || {}),
      };
      const ws = (showcase.workshops || []).find(w => w.id === workshopId && w.isActive);
      if (!ws) {
        throw AppError.notFound('کارگاه آموزشی');
      }

      const p = getPool();
      const existingReg = await selectWithTimeout<any>(
        `SELECT id, workshop_id, workshop_title, user_id, user_name, user_phone, created_at
         FROM counseling_workshop_registrations
         WHERE workshop_id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
        [workshopId, u.id],
        2500
      );

      let phone = '';
      try {
        const uRows = await selectWithTimeout<any>(
          `SELECT phone FROM users WHERE id = ? OR id = ? LIMIT 1`,
          [toIdBuffer(u.id), String(u.id)],
          2000
        );
        phone = uRows?.[0]?.phone ? String(uRows[0].phone) : '';
      } catch {}

      if (!existingReg || existingReg.length === 0) {
        const regId = toIdBuffer(generateUUIDv7());
        await p.query(
          `INSERT INTO counseling_workshop_registrations (id, workshop_id, workshop_title, user_id, user_name, user_phone, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE deleted_at = NULL, workshop_title = VALUES(workshop_title), user_name = VALUES(user_name), user_phone = VALUES(user_phone)`,
          [regId, workshopId, ws.title, u.id, u.fullName, phone || null, req.body?.notes ? String(req.body.notes).trim() : null]
        );
      }

      const countRows = await selectWithTimeout<any>(
        `SELECT COUNT(*) AS cnt FROM counseling_workshop_registrations WHERE workshop_id = ? AND deleted_at IS NULL`,
        [workshopId],
        2500
      );
      const count = Number(countRows?.[0]?.cnt || 1);

      outbox.enqueue('counseling.workshop_registered', {
        workshopId,
        userId: u.id,
        registrationsCount: count,
      });

      res.status(201).json({
        success: true,
        workshopId,
        workshopTitle: ws.title,
        registrationsCount: count,
      });
    } catch (err) {
      next(err);
    }
  });

  // View registrations for a workshop (minimal PII: fullName + phone only)
  router.get('/workshops/:workshopId/registrations', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer', 'psychologist_counselor', 'general_observer']
      );

      const rows = await selectWithTimeout<any>(
        `SELECT id, workshop_id, workshop_title, user_id, user_name, user_phone, notes, created_at
         FROM counseling_workshop_registrations
         WHERE workshop_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 500`,
        [String(req.params.workshopId)],
        3000
      );

      res.json(
        (rows || []).map((r: any) => ({
          id: fromIdBuffer(r.id),
          workshopId: String(r.workshop_id),
          workshopTitle: r.workshop_title,
          userId: String(r.user_id),
          fullName: r.user_name,
          phone: r.user_phone || '',
          notes: r.notes || '',
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        }))
      );
    } catch (err) {
      next(err);
    }
  });
}

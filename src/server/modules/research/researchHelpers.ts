import { getPool, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { fromIdBuffer } from '../../platform/uuidv7';
import {
  ResearchCategory,
  ResearchMentorship,
  ResearchMessage,
  ResearchPillarCardConfig,
  ResearchPortalConfig,
} from '../../../types';

export const DEFAULT_RESEARCH_PILLAR_CARDS: ResearchPillarCardConfig[] = [
  {
    id: 'thesis',
    indexLabel: '۰۱',
    badgeText: 'پک کامل و راهبری موردی',
    title: 'راهبری پایان‌نامه‌ها و رساله‌ها',
    subtitle:
      'همراهی جامع از ایده‌پردازی، انتخاب موضوع نوآورانه و تصویب پروپوزال تا تدوین فصول، نقد علمی، آماده‌سازی دفاع و تسهیل اسکان مطالعاتی در قم.',
    highlights: [
      'پک کامل راهبری یا مشورت موردی تخصصی',
      'انتصاب استاد راهنمای برجسته حوزه و دانشگاه',
      'امکان درخواست اسکان مطالعاتی قم (حضوری)',
    ],
    ctaLabel: 'ثبت درخواست راهبری پایان‌نامه',
    enabled: true,
  },
  {
    id: 'article',
    indexLabel: '۰۲',
    badgeText: 'نگارش تا چاپ علمی‌پژوهشی',
    title: 'همکاری در مقاله و کمک به انتشار',
    subtitle:
      'تمامی خدمات پیشین تدوین، ساختار و نقد علمی مقاله به همراه پشتیبانی تخصصی برای معرفی نشریات معتبر، استانداردسازی و کمک در ارسال و انتشار مقاله.',
    highlights: [
      'کمک در انتخاب موضوع، ساختار و نقد علمی مقاله',
      'کمک در انتشار و ارسال به نشریات علمی‌پژوهشی',
      'همراهی در پاسخ به داوران تا پذیرش نهایی',
    ],
    ctaLabel: 'ثبت درخواست همکاری در مقاله',
    enabled: true,
  },
  {
    id: 'session_proposal',
    indexLabel: '۰۳',
    badgeText: 'پیشنهاد موضوع نشست علمی',
    title: 'پیشنهاد برگزاری نشست علمی',
    subtitle:
      'پیشنهاد موضوعات به‌روز فقهی و حقوقی برای برگزاری نشست‌های علمی، کرسی‌های ترویجی و میزگردهای تخصصی مرکز با حضور صاحب‌نظران و اساتید.',
    highlights: [
      'پیشنهاد عنوان، محورهای کلیدی و ضرورت نشست',
      'معرفی سخنرانان یا اساتید پیشنهادی و مخاطبان',
      'انتخاب شیوه برگزاری حضوری، آنلاین یا ترکیبی',
    ],
    ctaLabel: 'پیشنهاد برگزاری نشست علمی',
    enabled: true,
  },
];

export const DEFAULT_RESEARCH_PORTAL_CONFIG: ResearchPortalConfig = {
  sectionTitle: 'پژوهش، مقاله و نشست‌های علمی',
  sectionSubtitle:
    'سه مسیر تخصصی معاونت پژوهش: راهبری پایان‌نامه‌ها، همکاری در نگارش و انتشار مقالات، و پیشنهاد برگزاری نشست‌های علمی',
  landingIntroTitle: 'میز یکپارچه خدمات پژوهشی مرکز فقه و حقوق اسلامی',
  landingIntroBody:
    'تمامی خدمات پژوهشی این بخش در سه محور تخصصی متمرکز شده است: راهبری جامع یا موردی پایان‌نامه‌ها و رساله‌ها، همکاری علمی در تدوین و انتشار مقالات پژوهشی، و دریافت پیشنهادهای شما برای برگزاری نشست‌های علمی و میزگردهای تخصصی قضایی.',
  landingCalloutTitle: 'مسیر پژوهشی متناسب با نیاز خود را از سه کارت زیر انتخاب کنید',
  landingCalloutSubtitle:
    'با انتخاب هر کارت، فرم تخصصی همان بخش بدون مراحل اضافه باز شده و تمامی پرونده‌ها و پیشنهادهای شما در همین صفحه قابل پیگیری خواهد بود.',
  ctaButtonLabel: 'ثبت درخواست یا پیشنهاد پژوهشی',
  guidanceNotesTitle: 'توضیحات، ضوابط و راهنمای کامل بخش پژوهش',
  guidanceNotesBody:
    '۱. بخش پژوهش شامل سه محور مستقل است: راهبری پایان‌نامه‌ها، همکاری در مقاله (شامل کمک در نگارش تا انتشار علمی) و پیشنهاد برگزاری نشست علمی.\n۲. پس از ثبت درخواست یا پیشنهاد نشست، پرونده شما با وضعیت «در انتظار بررسی» برای شورای پژوهشی مرکز ارسال می‌شود.\n۳. تا پیش از ورود درخواست به وضعیت «در حال بررسی»، امکان ویرایش یا حذف درخواست برای شما فعال است؛ پس از آغاز بررسی کارشناسی، اطلاعات پرونده قفل می‌شود.\n۴. در تمامی مراحل می‌توانید از طریق بخش گفت‌وگوی پرونده با مسئول پژوهش در ارتباط مستقیم باشید و تسهیلات اسکان قم برای متقاضیان پک کامل حضوری فعال است.',
  contactCenterTitle: 'راه‌های ارتباطی و پشتیبانی دبیرخانه پژوهش',
  contactPhone: '۰۲۵-۳۷۷۴۱۲۹۰',
  contactExtension: 'داخلی ۲۰۲ و ۲۰۵',
  contactMobileOrMessenger: '۰۹۱۲۰۵۸۴۱۲۰ (ایتا و پیام‌رسان بله)',
  contactHours: 'شنبه تا چهارشنبه، ساعت ۸:۳۰ الی ۱۴:۳۰',
  contactAddress: 'قم، خیابان معلم، مجتمع علمی مرکز فقه و حقوق اسلامی، طبقه سوم، معاونت پژوهش',
  accommodationEnabledInWizard: true,
  accommodationCityLabel: 'اسکان موقت مطالعاتی در شهر مقدس قم',
  submissionSuccessMessage:
    'درخواست یا پیشنهاد شما با موفقیت ثبت شد. کارشناسان معاونت پژوهش پرونده را بررسی کرده و نتیجه در همین صفحه و از طریق تماس با شما اطلاع‌رسانی می‌شود.',
  pillarCards: DEFAULT_RESEARCH_PILLAR_CARDS,
  wizardConfig: {
    step1Title: 'نوع خدمت یا پیشنهاد پژوهشی مورد نظر خود را انتخاب نمایید:',
    step1Options: [
      {
        id: 'thesis',
        label: 'راهبری پایان‌نامه',
        description: 'هدایت تخصصی پایان‌نامه کارشناسی ارشد، سطح ۳ و ۴ حوزوی و رساله دکتری',
        enabled: true,
      },
      {
        id: 'article',
        label: 'همکاری در مقاله و انتشار',
        description: 'نگارش، ساختاربندی، نقد علمی و کمک در ارسال و انتشار مقالات علمی‌پژوهشی',
        enabled: true,
      },
      {
        id: 'session_proposal',
        label: 'پیشنهاد برگزاری نشست علمی',
        description: 'پیشنهاد موضوع، محورها و سخنرانان برای برگزاری نشست یا میزگرد علمی در مرکز',
        enabled: true,
      },
    ],
    step2Title: 'سطح خدمات و همراهی مورد نیاز شما چیست؟',
    step2Options: [
      {
        id: 'full_pack',
        label: 'نیاز به پک کامل راهبری دارم',
        description: 'همراهی جامع از انتخاب موضوع و پروپوزال تا تکمیل، بازبینی نهایی و هدایت گام‌به‌گام',
        enabled: true,
      },
      {
        id: 'partial_mentorship',
        label: 'نیاز به مشورت و یا همکاری موردی دارم (بخشی از اثر یا انتشار)',
        description: 'همکاری متمرکز در یک یا چند بخش مشخص (موضوع، ساختار، نقد علمی یا کمک در انتشار)',
        enabled: true,
      },
    ],
    fullPackDeliveryTitle: 'شیوه برگزاری جلسات پک کامل راهبری را انتخاب فرمایید:',
    fullPackInPersonLabel: 'راهبری حضوری می‌خواهم',
    fullPackOnlineLabel: 'راهبری آنلاین می‌خواهم',
    accommodationQuestionLabel: 'آیا در طول جلسات راهبری حضوری، نیاز به اسکان موقت در قم دارید؟',
    briefSummaryLabel: 'شرح مختصر درخواست (موضوع، هدف، و در صورت مقاله نام نشریه یا نهاد هدف)',
    briefSummaryPlaceholder:
      'لطفاً موضوع یا ایده مد نظر، وضعیت فعلی اثر و در صورت نیاز دانشگاه، حوزه یا نشریه علمی مقصد را به اختصار بنویسید...',
    partialTopicsTitle: 'در کدام بخش‌ها نیاز به مشورت، همکاری یا کمک در انتشار دارید؟',
    partialTopics: [
      { id: 'topic_selection', label: 'انتخاب موضوع نوآورانه و مسئله‌محور', enabled: true },
      { id: 'proposal_writing', label: 'نوشتن پروپوزال و تصویب عنوان', enabled: true },
      { id: 'structure_outline', label: 'تدوین ساختار و فصل‌بندی مقاله / پایان‌نامه', enabled: true },
      { id: 'scientific_review', label: 'درخواست بازبینی، نقد علمی و بررسی متن دارم', enabled: true },
      {
        id: 'article_publication',
        label: 'کمک در انتشار مقاله، معرفی نشریه معتبر و فرآیند ارسال و داوری',
        enabled: true,
      },
    ],
    partialDeliveryTitle: 'امکان حضور شما در جلسات مشورت و همکاری چگونه است؟',
    partialInPersonLabel: 'امکان حضور دارم',
    partialOnlineLabel: 'امکان حضور ندارم (آنلاین)',
    reviewStepTitle: 'بازبینی مشخصات هویتی و جزئیات درخواست پیش از ثبت نهایی',
  },
  version: 1,
};

export function parseJsonSafe<T>(val: any, fallback: T): T {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return (parsed ?? fallback) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof val === 'object') return val as T;
  return fallback;
}

export function normalizeResearchStatus(
  rawStatus?: string | null
): ResearchMentorship['status'] {
  const val = String(rawStatus || '').trim();
  if (val === 'approved' || val === 'تایید شده' || val === 'active') return 'approved';
  if (val === 'rejected' || val === 'رد شده' || val === 'suspended') return 'rejected';
  if (val === 'in_review' || val === 'در حال بررسی' || val === 'under_review') return 'in_review';
  if (val === 'completed' || val === 'آماده دفاع') return 'completed';
  return 'pending';
}

export function mapResearchMessageRow(row: any): ResearchMessage {
  return {
    id: fromIdBuffer(row.id),
    requestId: fromIdBuffer(row.request_id),
    senderId: fromIdBuffer(row.sender_id),
    senderName: row.sender_name || 'کاربر سامانه',
    senderRole: row.sender_role || 'alumni',
    isOfficial: Boolean(row.is_official),
    message: row.message || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export function mapResearchMentorshipRow(
  row: any,
  messages: ResearchMessage[] = [],
  includeApplicantProfile = false
): ResearchMentorship & { version: number } {
  const status = normalizeResearchStatus(row.status);
  const stage: ResearchMentorship['stage'] =
    status === 'pending'
      ? 'proposal'
      : status === 'in_review'
      ? 'supervisor_matching'
      : status === 'approved'
      ? 'drafting'
      : status === 'completed'
      ? 'defense_prep'
      : 'proposal';

  const progressPercent =
    status === 'pending'
      ? 15
      : status === 'in_review'
      ? 35
      : status === 'approved'
      ? 70
      : status === 'completed'
      ? 100
      : 10;

  const researchCategory: ResearchCategory =
    row.research_category === 'session_proposal'
      ? 'session_proposal'
      : row.research_category === 'article'
      ? 'article'
      : 'thesis';
  const serviceScope: 'full_pack' | 'partial_mentorship' | 'session_proposal' =
    researchCategory === 'session_proposal' || row.service_scope === 'session_proposal'
      ? 'session_proposal'
      : row.service_scope === 'partial_mentorship'
      ? 'partial_mentorship'
      : 'full_pack';
  const deliveryMode: 'in_person' | 'online' | 'hybrid' =
    row.delivery_mode === 'hybrid'
      ? 'hybrid'
      : row.delivery_mode === 'online'
      ? 'online'
      : 'in_person';

  const selectedPartialTopics = parseJsonSafe<string[]>(row.selected_partial_topics, []);

  const isSessionProposal = researchCategory === 'session_proposal';
  const defaultStageTitle = isSessionProposal
    ? status === 'pending'
      ? 'پیشنهاد نشست ثبت شد — در انتظار بررسی شورا'
      : status === 'in_review'
      ? 'در حال بررسی موضوع و زمان‌بندی نشست'
      : status === 'approved'
      ? 'پیشنهاد تایید شد — در حال برنامه‌ریزی برگزاری نشست'
      : status === 'rejected'
      ? 'نیازمند بازنگری / عدم تصویب نشست'
      : 'نشست علمی برگزار / تکمیل شد'
    : status === 'pending'
    ? 'ثبت‌شده — در انتظار بررسی معاونت پژوهش'
    : status === 'in_review'
    ? 'در حال بررسی کارشناسی و تطبیق استاد'
    : status === 'approved'
    ? 'تایید نهایی — در حال راهبری فعال'
    : status === 'rejected'
    ? 'نیازمند بازنگری / رد درخواست'
    : 'تکمیل‌شده';

  const milestones = isSessionProposal
    ? [
        {
          title: 'ثبت پیشنهاد برگزاری نشست علمی در سامانه',
          isDone: true,
          date: row.created_at ? new Date(row.created_at).toLocaleDateString('fa-IR') : 'ثبت‌شده',
        },
        {
          title: 'ارزیابی موضوع و ضرورت در شورای پژوهشی',
          isDone: status === 'in_review' || status === 'approved' || status === 'completed',
          date: status === 'pending' ? 'در انتظار' : 'انجام شده',
        },
        {
          title: 'تصویب نشست و هماهنگی با سخنرانان',
          isDone: status === 'approved' || status === 'completed',
          date: status === 'approved' || status === 'completed' ? 'مصوب' : 'در نوبت',
        },
        {
          title: 'برگزاری نشست علمی و انتشار گزارش',
          isDone: status === 'completed',
          date: status === 'completed' ? 'برگزار شده' : 'آتی',
        },
      ]
    : [
        {
          title: 'ثبت درخواست در سامانه و دریافت مشخصات پژوهش',
          isDone: true,
          date: row.created_at ? new Date(row.created_at).toLocaleDateString('fa-IR') : 'ثبت‌شده',
        },
        {
          title: 'بررسی شورای پژوهشی و تخصیص استاد / همکار',
          isDone: status === 'in_review' || status === 'approved' || status === 'completed',
          date: status === 'pending' ? 'در انتظار' : 'انجام شده',
        },
        {
          title:
            serviceScope === 'full_pack'
              ? researchCategory === 'article'
                ? 'اجرای راهبری کامل و همراهی تا انتشار مقاله'
                : 'اجرای پک کامل راهبری و نقد فصول/بخش‌ها'
              : researchCategory === 'article'
              ? 'انجام جلسات همکاری موردی یا پشتیبانی انتشار مقاله'
              : 'انجام جلسات مشورت و راهبری موردی',
          isDone: status === 'approved' || status === 'completed',
          date: status === 'approved' || status === 'completed' ? 'فعال' : 'در نوبت',
        },
        {
          title: researchCategory === 'article' ? 'تکمیل و انتشار نهایی مقاله' : 'تکمیل و جمع‌بندی نهایی پژوهش',
          isDone: status === 'completed',
          date: status === 'completed' ? 'تکمیل‌شده' : 'آتی',
        },
      ];

  const mapped: ResearchMentorship & { version: number } = {
    id: fromIdBuffer(row.id),
    applicantId: fromIdBuffer(row.applicant_id),
    applicantName: row.u_full_name || row.applicant_name || '',
    researchCategory,
    serviceScope,
    selectedPartialTopics: Array.isArray(selectedPartialTopics) ? selectedPartialTopics : [],
    deliveryMode,
    thesisTitle: row.thesis_title || '',
    field: row.field || 'فقه و حقوق اسلامی',
    briefSummary: row.brief_summary || row.description || '',
    targetInstitution: row.target_institution || undefined,
    stage,
    stageTitle: row.description || defaultStageTitle,
    progressPercent,
    assignedSupervisor: row.supervisor_professor || undefined,
    accommodationRequested: Boolean(row.accommodation_requested),
    accommodationCity: row.accommodation_city || (row.accommodation_requested ? 'قم' : undefined),
    status,
    adminNote: row.admin_note || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    milestones,
    messages,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };

  if (includeApplicantProfile) {
    mapped.applicantProfile = {
      fullName: row.u_full_name || row.applicant_name || '',
      phone: row.u_phone || '',
      nationalId: row.u_national_id || '',
      email: row.u_email || undefined,
      city: row.u_city || undefined,
      roleTitle: row.u_role_title || 'دانش‌آموخته',
      university: row.u_university || undefined,
      major: row.u_major || undefined,
      bio: row.u_bio || undefined,
    };
  }

  return mapped;
}

export async function loadResearchPortalConfig(): Promise<ResearchPortalConfig> {
  ensureDatabaseConnection();
  await ensureDomainTablesAndIndexes();
  const p = getPool();
  const [rows]: any = await p.query(
    `SELECT setting_value, version FROM system_settings WHERE setting_key = 'research_portal_config' LIMIT 1`
  );
  if (!rows || rows.length === 0) {
    await p.query(
      `INSERT IGNORE INTO system_settings (setting_key, setting_value, description, version)
       VALUES ('research_portal_config', ?, 'تنظیمات و ساختار الگوریتم بخش راهبری پژوهش و مقاله', 1)`,
      [JSON.stringify(DEFAULT_RESEARCH_PORTAL_CONFIG)]
    );
    return { ...DEFAULT_RESEARCH_PORTAL_CONFIG, version: 1 };
  }

  const parsed = parseJsonSafe<Partial<ResearchPortalConfig>>(rows[0].setting_value, {});

  const storedStep1 =
    Array.isArray(parsed.wizardConfig?.step1Options) && parsed.wizardConfig!.step1Options.length > 0
      ? parsed.wizardConfig!.step1Options
      : DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.step1Options;
  const step1Options = storedStep1.some(o => o.id === 'session_proposal')
    ? storedStep1
    : [...storedStep1, DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.step1Options[2]];

  const storedPartial =
    Array.isArray(parsed.wizardConfig?.partialTopics) && parsed.wizardConfig!.partialTopics.length > 0
      ? parsed.wizardConfig!.partialTopics
      : DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.partialTopics;
  const articlePubDefault = DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.partialTopics.find(
    o => o.id === 'article_publication'
  );
  const partialTopics =
    articlePubDefault && !storedPartial.some(o => o.id === 'article_publication')
      ? [...storedPartial, articlePubDefault]
      : storedPartial;

  const storedPillars = Array.isArray(parsed.pillarCards) && parsed.pillarCards.length > 0
    ? parsed.pillarCards
    : DEFAULT_RESEARCH_PILLAR_CARDS;
  const pillarCards = DEFAULT_RESEARCH_PILLAR_CARDS.map(defCard => {
    const match = storedPillars.find(c => c.id === defCard.id);
    return match ? { ...defCard, ...match } : defCard;
  });

  return {
    ...DEFAULT_RESEARCH_PORTAL_CONFIG,
    ...parsed,
    pillarCards,
    wizardConfig: {
      ...DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig,
      ...(parsed.wizardConfig || {}),
      step1Options,
      step2Options:
        Array.isArray(parsed.wizardConfig?.step2Options) && parsed.wizardConfig!.step2Options.length > 0
          ? parsed.wizardConfig!.step2Options
          : DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.step2Options,
      partialTopics,
    },
    version: Number(rows[0].version || 1),
  };
}

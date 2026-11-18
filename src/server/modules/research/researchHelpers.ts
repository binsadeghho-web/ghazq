import { getPool, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { fromIdBuffer } from '../../platform/uuidv7';
import {
  ResearchMentorship,
  ResearchMessage,
  ResearchPortalConfig,
} from '../../../types';

export const DEFAULT_RESEARCH_PORTAL_CONFIG: ResearchPortalConfig = {
  sectionTitle: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
  sectionSubtitle:
    'همراهی گام‌به‌گام اساتید و پژوهشگران برجسته مرکز در تدوین پایان‌نامه، رساله و مقالات علمی‌پژوهشی',
  landingIntroTitle: 'در کلینیک راهبری پژوهش و مقاله مرکز فقه و حقوق اسلامی چه خدماتی ارائه می‌شود؟',
  landingIntroBody:
    'این مرکز ویژه دانش‌آموختگان و پژوهشگران عرصه فقه و حقوق اسلامی راه‌اندازی شده است تا از نخستین گام پژوهش تا مرحله دفاع یا انتشار علمی همراه شما باشد. خدمات شامل مشاوره انتخاب موضوع نوآورانه، نگارش و تصویب پروپوزال، تعیین ساختار و فصل‌بندی علمی، انتصاب استاد راهنما و ناظر، نقد و بازبینی فصول و مقالات، و همچنین تسهیل اسکان مطالعاتی در شهر مقدس قم (برای بسته‌های کامل حضوری) است.',
  landingCalloutTitle: 'آماده شروع یا ارتقای پژوهش علمی خود هستید؟',
  landingCalloutSubtitle:
    'اگر نیاز به کمک و راهبری در انجام پایان‌نامه یا مقاله دارید، روی دکمه ثبت درخواست راهبری کلیک کنید تا الگوریتم هوشمند خدمات پژوهش متناسب با نیاز شما فعال شود.',
  ctaButtonLabel: 'ثبت درخواست راهبری',
  guidanceNotesTitle: 'توضیحات، ضوابط و راهنمای کامل راهبری پژوهش',
  guidanceNotesBody:
    '۱. پس از ثبت درخواست، پرونده شما با وضعیت «در انتظار بررسی» برای شورای پژوهشی مرکز ارسال می‌شود.\n۲. تا پیش از ورود درخواست به وضعیت «در حال بررسی»، امکان ویرایش یا حذف درخواست برای شما فعال است؛ پس از آغاز بررسی کارشناسی، اطلاعات پرونده قفل می‌شود.\n۳. در تمامی مراحل (انتظار، در حال بررسی، تایید یا نیاز به تکمیل)، می‌توانید از طریق بخش گفت‌وگوی پرونده با مسئول پژوهش در ارتباط مستقیم باشید.\n۴. تسهیلات اسکان موقت مطالعاتی در قم منحصراً برای متقاضیان «پک کامل راهبری حضوری» (در صورت فعال بودن سهمیه اسکان) در دسترس است.',
  contactCenterTitle: 'راه‌های ارتباطی و پشتیبانی دبیرخانه راهبری پژوهش',
  contactPhone: '۰۲۵-۳۷۷۴۱۲۹۰',
  contactExtension: 'داخلی ۲۰۲ و ۲۰۵',
  contactMobileOrMessenger: '۰۹۱۲۰۵۸۴۱۲۰ (ایتا و پیام‌رسان بله)',
  contactHours: 'شنبه تا چهارشنبه، ساعت ۸:۳۰ الی ۱۴:۳۰',
  contactAddress: 'قم، خیابان معلم، مجتمع علمی مرکز فقه و حقوق اسلامی، طبقه سوم، معاونت پژوهش',
  accommodationEnabledInWizard: true,
  accommodationCityLabel: 'اسکان موقت مطالعاتی در شهر مقدس قم',
  submissionSuccessMessage:
    'درخواست راهبری پژوهش شما با موفقیت ثبت شد. کارشناسان معاونت پژوهش پرونده را بررسی کرده و با شما تماس گرفته می‌شود.',
  wizardConfig: {
    step1Title: 'نوع پژوهش مورد نظر خود را انتخاب نمایید:',
    step1Options: [
      {
        id: 'thesis',
        label: 'راهبری پایان‌نامه',
        description: 'هدایت تخصصی پایان‌نامه کارشناسی ارشد، سطح ۳ و ۴ حوزوی و رساله دکتری',
        enabled: true,
      },
      {
        id: 'article',
        label: 'راهبری مقاله',
        description: 'نگارش، ساختاربندی، ویراستاری علمی و آماده‌سازی مقالات علمی‌پژوهشی و ترویجی',
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
        label: 'نیاز به مشورت و یا راهبری موردی دارم (بخشی از پایان‌نامه / مقاله)',
        description: 'راهبری متمرکز در یک یا چند بخش مشخص (مانند موضوع، پروپوزال، ساختار یا بازبینی)',
        enabled: true,
      },
    ],
    fullPackDeliveryTitle: 'شیوه برگزاری جلسات پک کامل راهبری را انتخاب فرمایید:',
    fullPackInPersonLabel: 'راهبری حضوری می‌خواهم',
    fullPackOnlineLabel: 'راهبری آنلاین می‌خواهم',
    accommodationQuestionLabel: 'آیا در طول جلسات راهبری حضوری، نیاز به اسکان موقت در قم دارید؟',
    briefSummaryLabel: 'شرح مختصر از درخواست راهبری (عنوان، هدف از پژوهش، برای ارائه به کدام نهاد)',
    briefSummaryPlaceholder:
      'لطفاً عنوان احتمالی یا موضوع مد نظر، هدف اصلی پژوهش و نام دانشگاه، حوزه علمیه یا نهاد/نشریه مقصد را به اختصار بنویسید...',
    partialTopicsTitle: 'در کدام بخش‌ها نیاز به مشورت یا راهبری موردی دارید؟',
    partialTopics: [
      { id: 'topic_selection', label: 'انتخاب موضوع نوآورانه و مسئله‌محور', enabled: true },
      { id: 'proposal_writing', label: 'نوشتن پروپوزال و تصویب عنوان', enabled: true },
      { id: 'structure_outline', label: 'تدوین ساختار و فصل‌بندی مقاله / پایان‌نامه', enabled: true },
      { id: 'scientific_review', label: 'درخواست بازبینی، نقد علمی و بررسی متن دارم', enabled: true },
    ],
    partialDeliveryTitle: 'امکان حضور شما در جلسات مشورت و راهبری چگونه است؟',
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

  const researchCategory: 'thesis' | 'article' =
    row.research_category === 'article' ? 'article' : 'thesis';
  const serviceScope: 'full_pack' | 'partial_mentorship' =
    row.service_scope === 'partial_mentorship' ? 'partial_mentorship' : 'full_pack';
  const deliveryMode: 'in_person' | 'online' =
    row.delivery_mode === 'online' ? 'online' : 'in_person';

  const selectedPartialTopics = parseJsonSafe<string[]>(row.selected_partial_topics, []);

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
    stageTitle:
      row.description ||
      (status === 'pending'
        ? 'ثبت‌شده — در انتظار بررسی معاونت پژوهش'
        : status === 'in_review'
        ? 'در حال بررسی کارشناسی و تطبیق استاد'
        : status === 'approved'
        ? 'تایید نهایی — در حال راهبری فعال'
        : status === 'rejected'
        ? 'نیازمند بازنگری / رد درخواست'
        : 'تکمیل‌شده'),
    progressPercent,
    assignedSupervisor: row.supervisor_professor || undefined,
    accommodationRequested: Boolean(row.accommodation_requested),
    accommodationCity: row.accommodation_city || (row.accommodation_requested ? 'قم' : undefined),
    status,
    adminNote: row.admin_note || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    milestones: [
      {
        title: 'ثبت درخواست در سامانه و دریافت مشخصات پژوهش',
        isDone: true,
        date: row.created_at ? new Date(row.created_at).toLocaleDateString('fa-IR') : 'ثبت‌شده',
      },
      {
        title: 'بررسی شورای پژوهشی و تخصیص استاد راهبر',
        isDone: status === 'in_review' || status === 'approved' || status === 'completed',
        date: status === 'pending' ? 'در انتظار' : 'انجام شده',
      },
      {
        title:
          serviceScope === 'full_pack'
            ? 'اجرای پک کامل راهبری و نقد فصول/بخش‌ها'
            : 'انجام جلسات مشورت و راهبری موردی',
        isDone: status === 'approved' || status === 'completed',
        date: status === 'approved' || status === 'completed' ? 'فعال' : 'در نوبت',
      },
      {
        title: 'تکمیل و جمع‌بندی نهایی پژوهش',
        isDone: status === 'completed',
        date: status === 'completed' ? 'تکمیل‌شده' : 'آتی',
      },
    ],
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
  return {
    ...DEFAULT_RESEARCH_PORTAL_CONFIG,
    ...parsed,
    wizardConfig: {
      ...DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig,
      ...(parsed.wizardConfig || {}),
      step1Options:
        Array.isArray(parsed.wizardConfig?.step1Options) && parsed.wizardConfig!.step1Options.length > 0
          ? parsed.wizardConfig!.step1Options
          : DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.step1Options,
      step2Options:
        Array.isArray(parsed.wizardConfig?.step2Options) && parsed.wizardConfig!.step2Options.length > 0
          ? parsed.wizardConfig!.step2Options
          : DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.step2Options,
      partialTopics:
        Array.isArray(parsed.wizardConfig?.partialTopics) && parsed.wizardConfig!.partialTopics.length > 0
          ? parsed.wizardConfig!.partialTopics
          : DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig.partialTopics,
    },
    version: Number(rows[0].version || 1),
  };
}

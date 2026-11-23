import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  Consultant,
  CounselingRequest,
  SpecializedCounselingPortalConfig,
  GeneralCounselingPortalConfig,
  CounselingFieldItem,
  GeneralCounselingTariffItem,
  PsychologicalTest,
  PsychologicalTestAssignment,
  PsychologicalTestResult,
} from '../types';
import { api } from '../services/apiClient';

const STAFF_ROLES = new Set([
  'admin',
  'super_admin',
  'general_observer',
  'alumni_manager',
  'admin_finance_officer',
  'education_deputy',
  'cultural_educational_officer',
  'research_deputy',
  'supervisor',
]);

function notifyToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  }
}

export const INITIAL_OTHER_COUNSELING_CITIES: string[] = [
  'تهران',
  'مشهد',
  'اصفهان',
  'شیراز',
  'تبریز',
  'کرج',
  'رشت',
];

export const INITIAL_SPECIALIZED_COUNSELING_CONFIG: SpecializedCounselingPortalConfig = {
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
  otherCities: [...INITIAL_OTHER_COUNSELING_CITIES],
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

export const INITIAL_GENERAL_COUNSELING_CONFIG: GeneralCounselingPortalConfig = {
  sectionTitle: 'مشاوره عمومی و روان‌شناسان مرکز',
  sectionSubtitle: 'خدمات تخصصی روان‌شناسی، خانواده، تاب‌آوری شغلی و سنجش‌های روان‌شناختی با حفظ محرمانگی کامل',
  headerBadgeLabel: 'بخش مستقل خدمات روان‌شناسی و سلامت روان مرکز',
  tabRequestLabel: 'رزرو وقت و زمینه‌های مشاوره',
  tabConsultantsLabel: 'روان‌شناسان مرکز',
  tabTariffsLabel: 'نرخ‌نامه',
  tabTestsLabel: 'تست‌ها',
  tabHistoryLabel: 'سوابق مشاوره',
  heroBadgeLabel: 'بخش روان‌شناسان و مشاوره عمومی مرکز',
  landingIntroTitle: 'آشنایی با مرکز مشاوره و خدمات روان‌شناختی',
  landingIntroBody: 'این بخش منحصراً توسط روان‌شناسان مجرب مرکز برای حمایت از سلامت روان، آرامش خانواده، پیشگیری از فرسودگی شغلی و تحلیل آزمون‌های استاندارد روان‌شناختی راه‌اندازی شده است. تمامی اطلاعات و گفتگوها کاملاً محرمانه می‌مانند.',
  heroHistoryButtonLabel: 'سوابق درخواست‌های من',
  calloutBadgeLabel: 'تکمیل مرحله‌به‌مرحله درخواست با راهنمای دائمی',
  landingCalloutTitle: 'نیاز به گفت‌وگوی تخصصی با روان‌شناسان مرکز دارید؟',
  landingCalloutSubtitle: 'برای ثبت نوبت جدید روی دکمه رزرو وقت مشاوره کلیک کرده و مراحل کوتاه را تکمیل فرمایید.',
  ctaButtonLabel: 'رزرو وقت مشاوره',
  calloutSecondaryLinkLabel: 'مشاهده توضیحات پیش از شروع',
  fieldsShowcaseBadgeLabel: 'حوزه‌های خدمات روان‌شناختی',
  fieldsSectionTitle: 'زمینه‌های مشاوره عمومی و روان‌شناختی',
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
  otherCities: [...INITIAL_OTHER_COUNSELING_CITIES],
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
          options: [...INITIAL_OTHER_COUNSELING_CITIES],
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

export interface CounselingContextType {
  consultants: Consultant[];
  counselingRequests: CounselingRequest[];
  specializedConfig: SpecializedCounselingPortalConfig;
  generalConfig: GeneralCounselingPortalConfig;
  counselingFields: CounselingFieldItem[];
  counselingTariffs: GeneralCounselingTariffItem[];
  psychologicalTests: PsychologicalTest[];
  testAssignments: PsychologicalTestAssignment[];
  testResults: PsychologicalTestResult[];
  feedbackMessage: { text: string; type: 'success' | 'error' } | null;
  clearFeedbackMessage: () => void;
  bookCounseling: (data: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateCounselingStatus: (
    requestId: string,
    status: CounselingRequest['status'],
    scheduledDate?: string,
    counselorNotes?: string,
    scheduledTime?: string,
    venueDetails?: string,
    meetingMode?: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    preferredConsultantId?: string,
    preferredConsultantName?: string
  ) => Promise<void>;
  updateCounselingRequest: (requestId: string, updates: Partial<CounselingRequest>) => Promise<CounselingRequest | null>;
  deleteCounselingRequest: (requestId: string) => Promise<void>;
  updateConsultant: (consultantId: string, updates: Partial<Consultant>) => Promise<void>;
  addConsultant: (consultantData: Omit<Consultant, 'id'>) => Promise<void>;
  deleteConsultant: (consultantId: string) => Promise<void>;
  updateSpecializedConfig: (updates: Partial<SpecializedCounselingPortalConfig>) => Promise<SpecializedCounselingPortalConfig | null>;
  updateGeneralConfig: (updates: Partial<GeneralCounselingPortalConfig>) => Promise<GeneralCounselingPortalConfig | null>;
  createCounselingField: (data: Omit<CounselingFieldItem, 'id' | 'version'>) => Promise<CounselingFieldItem | null>;
  updateCounselingField: (id: string, updates: Partial<CounselingFieldItem>) => Promise<CounselingFieldItem | null>;
  deleteCounselingField: (id: string) => Promise<void>;
  createCounselingTariff: (data: Omit<GeneralCounselingTariffItem, 'id' | 'version'>) => Promise<GeneralCounselingTariffItem | null>;
  updateCounselingTariff: (id: string, updates: Partial<GeneralCounselingTariffItem>) => Promise<GeneralCounselingTariffItem | null>;
  deleteCounselingTariff: (id: string) => Promise<void>;
  createPsychologicalTest: (data: Omit<PsychologicalTest, 'id' | 'version'>) => Promise<PsychologicalTest | null>;
  updatePsychologicalTest: (id: string, updates: Partial<PsychologicalTest>) => Promise<PsychologicalTest | null>;
  deletePsychologicalTest: (id: string) => Promise<void>;
  assignPsychologicalTest: (data: {
    testId: string;
    userId: string;
    userName: string;
    userNationalId?: string;
    requestId?: string;
    adminNote?: string;
  }) => Promise<PsychologicalTestAssignment | null>;
  submitPsychologicalTest: (
    assignmentId: string,
    answers: Array<{ questionId: string; questionText: string; answer: string }>,
    scoreSummary?: string
  ) => Promise<PsychologicalTestResult | null>;
  reviewPsychologicalTestResult: (
    resultId: string,
    data: { psychologistNotes?: string; scoreSummary?: string }
  ) => Promise<PsychologicalTestResult | null>;
  refreshCounseling: () => Promise<void>;
}

const CounselingContext = createContext<CounselingContextType | undefined>(undefined);

export const CounselingProvider: React.FC<{ children: React.ReactNode; currentUser?: User | null }> = ({
  children,
  currentUser,
}) => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [counselingRequests, setCounselingRequests] = useState<CounselingRequest[]>([]);
  const [specializedConfig, setSpecializedConfig] = useState<SpecializedCounselingPortalConfig>(
    INITIAL_SPECIALIZED_COUNSELING_CONFIG
  );
  const [generalConfig, setGeneralConfig] = useState<GeneralCounselingPortalConfig>(
    INITIAL_GENERAL_COUNSELING_CONFIG
  );
  const [counselingFields, setCounselingFields] = useState<CounselingFieldItem[]>([]);
  const [counselingTariffs, setCounselingTariffs] = useState<GeneralCounselingTariffItem[]>([]);
  const [psychologicalTests, setPsychologicalTests] = useState<PsychologicalTest[]>([]);
  const [testAssignments, setTestAssignments] = useState<PsychologicalTestAssignment[]>([]);
  const [testResults, setTestResults] = useState<PsychologicalTestResult[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const clearFeedbackMessage = useCallback(() => setFeedbackMessage(null), []);

  const showFeedback = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    notifyToast(text, type);
  }, []);

  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;

  const refreshCounseling = useCallback(async () => {
    if (!currentUserId || !currentUserRole) {
      setConsultants([]);
      setCounselingRequests([]);
      setCounselingFields([]);
      setCounselingTariffs([]);
      setPsychologicalTests([]);
      setTestAssignments([]);
      setTestResults([]);
      return;
    }

    const isStaff = STAFF_ROLES.has(currentUserRole);

    try {
      const results = await Promise.allSettled([
        api.getConsultants(),
        api.getCounselingRequests(),
        api.getCounselingPortalConfig('specialized_career'),
        api.getCounselingPortalConfig('general'),
        api.getCounselingFields(undefined, isStaff),
        api.getCounselingTariffs(isStaff),
        api.getPsychologicalTests(),
        api.getPsychologicalTestAssignments(),
        api.getPsychologicalTestResults(),
      ]);

      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) setConsultants(results[0].value);
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) setCounselingRequests(results[1].value);
      if (results[2].status === 'fulfilled' && results[2].value) setSpecializedConfig(results[2].value);
      if (results[3].status === 'fulfilled' && results[3].value) setGeneralConfig(results[3].value);
      if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) setCounselingFields(results[4].value);
      if (results[5].status === 'fulfilled' && Array.isArray(results[5].value)) setCounselingTariffs(results[5].value);
      if (results[6].status === 'fulfilled' && Array.isArray(results[6].value)) setPsychologicalTests(results[6].value);
      if (results[7].status === 'fulfilled' && Array.isArray(results[7].value)) setTestAssignments(results[7].value);
      if (results[8].status === 'fulfilled' && Array.isArray(results[8].value)) setTestResults(results[8].value);
    } catch {}
  }, [currentUserId, currentUserRole]);

  useEffect(() => {
    refreshCounseling();
    if (!currentUserId) return;

    const unsubscribe = api.subscribeToEvents(event => {
      if (!event.type.startsWith('counseling.')) return;
      const rawData = event.data?.data ?? event.data ?? (event as any).payload;
      if (!rawData) {
        refreshCounseling();
        return;
      }

      if (event.type === 'counseling.requested' && rawData.request) {
        const incoming = rawData.request as CounselingRequest;
        setCounselingRequests(prev =>
          prev.some(r => r.id === incoming.id)
            ? prev.map(r => (r.id === incoming.id ? incoming : r))
            : [incoming, ...prev]
        );
      } else if ((event.type === 'counseling.updated' || event.type === 'counseling.identity_toggled') && rawData.request) {
        const updated = rawData.request as CounselingRequest;
        setCounselingRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      } else if (event.type === 'counseling.deleted' && (rawData.requestId || rawData.id)) {
        const delId = rawData.requestId || rawData.id;
        setCounselingRequests(prev => prev.filter(r => r.id !== delId));
      } else if (event.type === 'counseling.consultant_created' && rawData.consultant) {
        const incoming = rawData.consultant as Consultant;
        setConsultants(prev =>
          prev.some(c => c.id === incoming.id)
            ? prev.map(c => (c.id === incoming.id ? incoming : c))
            : [incoming, ...prev]
        );
      } else if (event.type === 'counseling.consultant_updated' && rawData.consultant) {
        const updated = rawData.consultant as Consultant;
        setConsultants(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      } else if (event.type === 'counseling.consultant_deleted' && rawData.consultantId) {
        setConsultants(prev => prev.filter(c => c.id !== rawData.consultantId));
      } else if (event.type === 'counseling.portal_config_updated' && rawData.config) {
        if (rawData.counselingType === 'specialized_career') {
          setSpecializedConfig(rawData.config);
        } else if (rawData.counselingType === 'general') {
          setGeneralConfig(rawData.config);
        }
      } else if (event.type === 'counseling.field_created' && rawData.updates) {
        const incoming = rawData.updates as CounselingFieldItem;
        setCounselingFields(prev =>
          prev.some(f => f.id === incoming.id) ? prev : [...prev, incoming]
        );
      } else if (event.type === 'counseling.field_updated' && rawData.updates) {
        const updated = rawData.updates as CounselingFieldItem;
        setCounselingFields(prev => prev.map(f => (f.id === updated.id ? updated : f)));
      } else if (event.type === 'counseling.field_deleted' && rawData.resourceId) {
        setCounselingFields(prev => prev.filter(f => f.id !== rawData.resourceId));
      } else if (event.type === 'counseling.tariff_created' && rawData.updates) {
        const incoming = rawData.updates as GeneralCounselingTariffItem;
        setCounselingTariffs(prev =>
          prev.some(t => t.id === incoming.id) ? prev : [...prev, incoming]
        );
      } else if (event.type === 'counseling.tariff_updated' && rawData.updates) {
        const updated = rawData.updates as GeneralCounselingTariffItem;
        setCounselingTariffs(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      } else if (event.type === 'counseling.tariff_deleted' && rawData.resourceId) {
        setCounselingTariffs(prev => prev.filter(t => t.id !== rawData.resourceId));
      } else if (event.type === 'counseling.test_created' && rawData.updates) {
        const incoming = rawData.updates as PsychologicalTest;
        setPsychologicalTests(prev =>
          prev.some(t => t.id === incoming.id) ? prev : [incoming, ...prev]
        );
      } else if (event.type === 'counseling.test_updated' && rawData.updates) {
        const updated = rawData.updates as PsychologicalTest;
        setPsychologicalTests(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      } else if (event.type === 'counseling.test_deleted' && rawData.resourceId) {
        setPsychologicalTests(prev => prev.filter(t => t.id !== rawData.resourceId));
      } else if (event.type === 'counseling.test_assigned' && rawData.updates) {
        const incoming = rawData.updates as PsychologicalTestAssignment;
        setTestAssignments(prev =>
          prev.some(a => a.id === incoming.id) ? prev : [incoming, ...prev]
        );
      } else if (event.type === 'counseling.test_submitted' && rawData.updates) {
        const result = rawData.updates as PsychologicalTestResult;
        setTestResults(prev =>
          prev.some(r => r.id === result.id) ? prev : [result, ...prev]
        );
        if (rawData.assignmentId) {
          setTestAssignments(prev =>
            prev.map(a =>
              a.id === rawData.assignmentId
                ? { ...a, status: 'completed', resultId: result.id, scoreSummary: result.scoreSummary }
                : a
            )
          );
        }
      } else if (event.type === 'counseling.test_reviewed' && rawData.updates) {
        const reviewed = rawData.updates as PsychologicalTestResult;
        setTestResults(prev => prev.map(r => (r.id === reviewed.id ? reviewed : r)));
        setTestAssignments(prev =>
          prev.map(a =>
            a.id === reviewed.assignmentId ? { ...a, status: 'reviewed', scoreSummary: reviewed.scoreSummary } : a
          )
        );
      } else {
        refreshCounseling();
      }
    });
    return () => unsubscribe();
  }, [currentUser, refreshCounseling]);

  const bookCounseling = useCallback(async (data: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const created = await api.bookCounseling(data);
      setCounselingRequests(prev =>
        prev.some(r => r.id === created.id)
          ? prev.map(r => (r.id === created.id ? created : r))
          : [created, ...prev]
      );
      showFeedback('درخواست مشاوره با حفظ محرمانگی کامل در سامانه ثبت شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت درخواست مشاوره: ${err.message}`, 'error');
      throw err;
    }
  }, [showFeedback]);

  const updateCounselingStatus = useCallback(async (
    requestId: string,
    status: CounselingRequest['status'],
    scheduledDate?: string,
    counselorNotes?: string,
    scheduledTime?: string,
    venueDetails?: string,
    meetingMode?: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    preferredConsultantId?: string,
    preferredConsultantName?: string
  ) => {
    try {
      const existing = counselingRequests.find(r => r.id === requestId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const updated = await api.updateCounselingStatus(requestId, {
        status,
        scheduledDate,
        counselorNotes,
        scheduledTime,
        venueDetails,
        meetingMode,
        preferredConsultantId,
        preferredConsultantName,
        expectedVersion,
      });
      setCounselingRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
      showFeedback('وضعیت درخواست مشاوره در پایگاه داده به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در به‌روزرسانی وضعیت مشاوره: ${err.message}`, 'error');
      throw err;
    }
  }, [counselingRequests, refreshCounseling, showFeedback]);

  const updateCounselingRequest = useCallback(async (requestId: string, updates: Partial<CounselingRequest>) => {
    try {
      const existing = counselingRequests.find(r => r.id === requestId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const updated = await api.updateCounselingRequest(requestId, { ...updates, expectedVersion });
      setCounselingRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
      showFeedback('اطلاعات درخواست مشاوره با موفقیت به‌روزرسانی شد.', 'success');
      return updated;
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ویرایش درخواست مشاوره: ${err.message}`, 'error');
      return null;
    }
  }, [counselingRequests, refreshCounseling, showFeedback]);

  const deleteCounselingRequest = useCallback(async (requestId: string) => {
    try {
      await api.deleteCounselingRequest(requestId);
      setCounselingRequests(prev => prev.filter(r => r.id !== requestId));
      showFeedback('درخواست مشاوره از سامانه حذف گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف درخواست مشاوره: ${err.message}`, 'error');
      throw err;
    }
  }, [showFeedback]);

  const updateConsultant = useCallback(async (consultantId: string, updates: Partial<Consultant>) => {
    try {
      const existing = consultants.find(c => c.id === consultantId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const updated = await api.updateConsultant(consultantId, { ...updates, expectedVersion });
      setConsultants(prev => prev.map(c => (c.id === consultantId ? updated : c)));
      showFeedback('اطلاعات مشاور با موفقیت در پایگاه داده ذخیره شد.', 'success');
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ویرایش اطلاعات مشاور: ${err.message}`, 'error');
      throw err;
    }
  }, [consultants, refreshCounseling, showFeedback]);

  const addConsultant = useCallback(async (consultantData: Omit<Consultant, 'id'>) => {
    try {
      const created = await api.createConsultant(consultantData);
      setConsultants(prev =>
        prev.some(c => c.id === created.id)
          ? prev.map(c => (c.id === created.id ? created : c))
          : [created, ...prev]
      );
      showFeedback('مشاور جدید با موفقیت در پایگاه داده ثبت شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت مشاور جدید: ${err.message}`, 'error');
      throw err;
    }
  }, [showFeedback]);

  const deleteConsultant = useCallback(async (consultantId: string) => {
    try {
      await api.deleteConsultant(consultantId);
      setConsultants(prev => prev.filter(c => c.id !== consultantId));
      showFeedback('مشاور از پایگاه داده حذف گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف مشاور: ${err.message}`, 'error');
      throw err;
    }
  }, [showFeedback]);

  const updateSpecializedConfig = useCallback(async (updates: Partial<SpecializedCounselingPortalConfig>) => {
    try {
      const merged = { ...specializedConfig, ...updates };
      const saved = await api.updateCounselingPortalConfig(
        'specialized_career',
        merged,
        Number(specializedConfig.version || 1)
      );
      setSpecializedConfig(saved);
      showFeedback('تنظیمات و ساختار فرم مشاوره تخصصی با موفقیت ذخیره شد.', 'success');
      return saved;
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ذخیره تنظیمات مشاوره تخصصی: ${err.message}`, 'error');
      return null;
    }
  }, [specializedConfig, refreshCounseling, showFeedback]);

  const updateGeneralConfig = useCallback(async (updates: Partial<GeneralCounselingPortalConfig>) => {
    try {
      const merged = { ...generalConfig, ...updates };
      const saved = await api.updateCounselingPortalConfig(
        'general',
        merged,
        Number(generalConfig.version || 1)
      );
      setGeneralConfig(saved);
      showFeedback('تنظیمات و ساختار فرم مشاوره عمومی با موفقیت ذخیره شد.', 'success');
      return saved;
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ذخیره تنظیمات مشاوره عمومی: ${err.message}`, 'error');
      return null;
    }
  }, [generalConfig, refreshCounseling, showFeedback]);

  const createCounselingField = useCallback(async (data: Omit<CounselingFieldItem, 'id' | 'version'>) => {
    try {
      const created = await api.createCounselingField(data);
      setCounselingFields(prev => (prev.some(f => f.id === created.id) ? prev : [...prev, created]));
      showFeedback('زمینه مشاوره جدید با موفقیت اضافه شد.', 'success');
      return created;
    } catch (err: any) {
      showFeedback(`خطا در افزودن زمینه مشاوره: ${err.message}`, 'error');
      return null;
    }
  }, [showFeedback]);

  const updateCounselingField = useCallback(async (id: string, updates: Partial<CounselingFieldItem>) => {
    try {
      const existing = counselingFields.find(f => f.id === id);
      const updated = await api.updateCounselingField(id, updates, Number(existing?.version ?? 1));
      setCounselingFields(prev => prev.map(f => (f.id === id ? updated : f)));
      showFeedback('زمینه مشاوره به‌روزرسانی شد.', 'success');
      return updated;
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ویرایش زمینه مشاوره: ${err.message}`, 'error');
      return null;
    }
  }, [counselingFields, refreshCounseling, showFeedback]);

  const deleteCounselingField = useCallback(async (id: string) => {
    try {
      await api.deleteCounselingField(id);
      setCounselingFields(prev => prev.filter(f => f.id !== id));
      showFeedback('زمینه مشاوره حذف شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف زمینه مشاوره: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const createCounselingTariff = useCallback(async (data: Omit<GeneralCounselingTariffItem, 'id' | 'version'>) => {
    try {
      const created = await api.createCounselingTariff(data);
      setCounselingTariffs(prev => (prev.some(t => t.id === created.id) ? prev : [...prev, created]));
      showFeedback('ردیف نرخ‌نامه جدید ثبت شد.', 'success');
      return created;
    } catch (err: any) {
      showFeedback(`خطا در ثبت نرخ‌نامه: ${err.message}`, 'error');
      return null;
    }
  }, [showFeedback]);

  const updateCounselingTariff = useCallback(async (id: string, updates: Partial<GeneralCounselingTariffItem>) => {
    try {
      const existing = counselingTariffs.find(t => t.id === id);
      const updated = await api.updateCounselingTariff(id, updates, Number(existing?.version ?? 1));
      setCounselingTariffs(prev => prev.map(t => (t.id === id ? updated : t)));
      showFeedback('ردیف نرخ‌نامه ویرایش شد.', 'success');
      return updated;
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ویرایش نرخ‌نامه: ${err.message}`, 'error');
      return null;
    }
  }, [counselingTariffs, refreshCounseling, showFeedback]);

  const deleteCounselingTariff = useCallback(async (id: string) => {
    try {
      await api.deleteCounselingTariff(id);
      setCounselingTariffs(prev => prev.filter(t => t.id !== id));
      showFeedback('ردیف نرخ‌نامه حذف شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف نرخ‌نامه: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const createPsychologicalTest = useCallback(async (data: Omit<PsychologicalTest, 'id' | 'version'>) => {
    try {
      const created = await api.createPsychologicalTest(data);
      setPsychologicalTests(prev => (prev.some(t => t.id === created.id) ? prev : [created, ...prev]));
      showFeedback('آزمون روان‌شناختی جدید با موفقیت ثبت شد.', 'success');
      return created;
    } catch (err: any) {
      showFeedback(`خطا در ثبت آزمون: ${err.message}`, 'error');
      return null;
    }
  }, [showFeedback]);

  const updatePsychologicalTest = useCallback(async (id: string, updates: Partial<PsychologicalTest>) => {
    try {
      const existing = psychologicalTests.find(t => t.id === id);
      const updated = await api.updatePsychologicalTest(id, updates, Number(existing?.version ?? 1));
      setPsychologicalTests(prev => prev.map(t => (t.id === id ? updated : t)));
      showFeedback('آزمون روان‌شناختی ویرایش شد.', 'success');
      return updated;
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ویرایش آزمون: ${err.message}`, 'error');
      return null;
    }
  }, [psychologicalTests, refreshCounseling, showFeedback]);

  const deletePsychologicalTest = useCallback(async (id: string) => {
    try {
      await api.deletePsychologicalTest(id);
      setPsychologicalTests(prev => prev.filter(t => t.id !== id));
      showFeedback('آزمون از فهرست فعال حذف شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف آزمون: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const assignPsychologicalTest = useCallback(async (data: {
    testId: string;
    userId: string;
    userName: string;
    userNationalId?: string;
    requestId?: string;
    adminNote?: string;
  }) => {
    try {
      const created = await api.assignPsychologicalTest(data);
      setTestAssignments(prev => (prev.some(a => a.id === created.id) ? prev : [created, ...prev]));
      showFeedback(`آزمون برای «${data.userName}» با موفقیت باز و فعال شد.`, 'success');
      return created;
    } catch (err: any) {
      showFeedback(`خطا در باز کردن آزمون برای دانش‌آموخته: ${err.message}`, 'error');
      return null;
    }
  }, [showFeedback]);

  const submitPsychologicalTest = useCallback(async (
    assignmentId: string,
    answers: Array<{ questionId: string; questionText: string; answer: string }>,
    scoreSummary?: string
  ) => {
    try {
      const result = await api.submitPsychologicalTest(assignmentId, answers, scoreSummary);
      setTestResults(prev => (prev.some(r => r.id === result.id) ? prev : [result, ...prev]));
      setTestAssignments(prev =>
        prev.map(a =>
          a.id === assignmentId
            ? { ...a, status: 'completed', resultId: result.id, scoreSummary: result.scoreSummary }
            : a
        )
      );
      showFeedback('پاسخ‌نامه آزمون شما با موفقیت ثبت و برای روان‌شناس مرکز ارسال شد.', 'success');
      return result;
    } catch (err: any) {
      showFeedback(`خطا در ثبت پاسخ‌نامه آزمون: ${err.message}`, 'error');
      return null;
    }
  }, [showFeedback]);

  const reviewPsychologicalTestResult = useCallback(async (
    resultId: string,
    data: { psychologistNotes?: string; scoreSummary?: string }
  ) => {
    try {
      const existing = testResults.find(r => r.id === resultId);
      const updated = await api.reviewPsychologicalTestResult(resultId, {
        ...data,
        expectedVersion: Number(existing?.version ?? 1),
      });
      setTestResults(prev => prev.map(r => (r.id === resultId ? updated : r)));
      setTestAssignments(prev =>
        prev.map(a =>
          a.id === updated.assignmentId ? { ...a, status: 'reviewed', scoreSummary: updated.scoreSummary } : a
        )
      );
      showFeedback('تحلیل و یادداشت بالینی روان‌شناس ذخیره شد.', 'success');
      return updated;
    } catch (err: any) {
      if (err.status === 409) await refreshCounseling();
      showFeedback(`خطا در ثبت تحلیل نتیجه آزمون: ${err.message}`, 'error');
      return null;
    }
  }, [testResults, refreshCounseling, showFeedback]);

  const value = useMemo<CounselingContextType>(
    () => ({
      consultants,
      counselingRequests,
      specializedConfig,
      generalConfig,
      counselingFields,
      counselingTariffs,
      psychologicalTests,
      testAssignments,
      testResults,
      feedbackMessage,
      clearFeedbackMessage,
      bookCounseling,
      updateCounselingStatus,
      updateCounselingRequest,
      deleteCounselingRequest,
      updateConsultant,
      addConsultant,
      deleteConsultant,
      updateSpecializedConfig,
      updateGeneralConfig,
      createCounselingField,
      updateCounselingField,
      deleteCounselingField,
      createCounselingTariff,
      updateCounselingTariff,
      deleteCounselingTariff,
      createPsychologicalTest,
      updatePsychologicalTest,
      deletePsychologicalTest,
      assignPsychologicalTest,
      submitPsychologicalTest,
      reviewPsychologicalTestResult,
      refreshCounseling,
    }),
    [
      consultants,
      counselingRequests,
      specializedConfig,
      generalConfig,
      counselingFields,
      counselingTariffs,
      psychologicalTests,
      testAssignments,
      testResults,
      feedbackMessage,
      clearFeedbackMessage,
      bookCounseling,
      updateCounselingStatus,
      updateCounselingRequest,
      deleteCounselingRequest,
      updateConsultant,
      addConsultant,
      deleteConsultant,
      updateSpecializedConfig,
      updateGeneralConfig,
      createCounselingField,
      updateCounselingField,
      deleteCounselingField,
      createCounselingTariff,
      updateCounselingTariff,
      deleteCounselingTariff,
      createPsychologicalTest,
      updatePsychologicalTest,
      deletePsychologicalTest,
      assignPsychologicalTest,
      submitPsychologicalTest,
      reviewPsychologicalTestResult,
      refreshCounseling,
    ]
  );

  return <CounselingContext.Provider value={value}>{children}</CounselingContext.Provider>;
};

export const useCounseling = (): CounselingContextType => {
  const context = useContext(CounselingContext);
  if (!context) {
    throw new Error('useCounseling must be used within a CounselingProvider');
  }
  return context;
};

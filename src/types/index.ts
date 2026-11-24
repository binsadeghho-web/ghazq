/**
 * Data structures and types for the Fiqh & Judiciary Alumni Portal
 */

export type UserRole =
  | 'admin'
  | 'super_admin'
  | 'general_observer'
  | 'alumni_manager'
  | 'admin_finance_officer'
  | 'education_deputy'
  | 'cultural_educational_officer'
  | 'research_deputy'
  | 'psychologist_counselor'
  | 'supervisor'
  | 'alumni'
  | 'customer';

export interface UserSession {
  id: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: string;
  isCurrent: boolean;
  familyId: string;
}

export type AppSectionId = 
  | 'dashboard'
  | 'cartable'
  | 'courses'
  | 'products'
  | 'counseling'
  | 'specialized_counseling'
  | 'research'
  | 'rulings'
  | 'welfare'
  | 'synergy'
  | 'alumni'
  | 'users'
  | 'finance'
  | 'admin';

export type PermissionAccessLevel =
  | 'none'          // عدم دسترسی (مخفی‌سازی کامل از منو و مسدود در سرور)
  | 'view_all'      // فقط مشاهده (کل اطلاعات - بدون حق ویرایش)
  | 'manage_all'    // مشاهده و ویرایش (کل اطلاعات)
  | 'view_own'      // منحصراً فقط مشاهده اطلاعات خود
  | 'manage_own';   // مشاهده و ویرایش مستقل اطلاعات خود

export type UserSectionPermissions = Partial<Record<AppSectionId, PermissionAccessLevel>>;

export interface RoleSubSectionPermissions {
  welfare_loans?: boolean;
  welfare_accommodations?: boolean;
  welfare_cooperative?: boolean;
}

export interface RoleAccessPolicy {
  roleId: UserRole;
  roleTitle: string;
  description: string;
  badgeColor: string;
  isReadOnlyRole?: boolean;
  sectionPermissions: UserSectionPermissions;
  subSectionPermissions?: RoleSubSectionPermissions;
  version?: number;
  updatedBy?: string;
  updatedAt?: string;
}

export interface UserPermissions {
  canSubmitRuling: boolean;
  canBookCounseling: boolean;
  canRequestLoan: boolean;
  canBuyCooperative: boolean;
  canAccessCartable: boolean;
}

export interface User {
  id: string;
  nationalId: string; // کد ملی (شناسه ورود)
  centerCode?: string; // کد مرکز اختصاصی دانش‌آموخته (ویرایش فقط توسط مدیر/ادمین)
  username?: string; // نام کاربری (پیش‌فرض کد ملی)
  password?: string; // رمز عبور (پیش‌فرض شماره موبایل)
  password_hash?: string; // هش ذخیره‌شده در دیتابیس
  fullName: string;
  phone: string;
  role: UserRole;
  roleTitle: string; // e.g. "مدیر ارشد سامانه", "مسئول خدمات و کارتابل", "مستشار دادگاه تجدیدنظر"
  siteTitle?: string; // عنوان در سایت (مثال: "پژوهشگر ارشد فقه القضاء", "مستشار عالی دیوان")
  profilePictureUrl?: string; // آدرس عکس پروفایل ذخیره‌شده در پوشه PROFILE_PICTURE
  organization: string; // e.g. "قوه قضائیه - دادگستری کل استان", "پژوهشکده فقه و حقوق"
  graduationYear: string;
  avatarText: string;
  isActive: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lockExpiresAt?: string;
  tokenVersion: number;
  mustChangePassword?: boolean;
  sessions: UserSession[];
  hasAccount?: boolean; // نشان‌دهنده وجود یا عدم وجود حساب کاربری فعال
  version?: number;
  deletedAt?: string; // تاریخ و زمان حذف نرم کاربر
  status?: 'active' | 'locked' | 'suspended' | 'archived'; // وضعیت کاربر (شامل بایگانی/حذف نرم)
  
  // دسترسی‌های ریز و ماتریسی بخش‌های نرم‌افزار
  sectionPermissions?: UserSectionPermissions;

  // سربرگ ۱: اطلاعات هویتی و فردی
  birthDate?: string;
  fatherName?: string;
  idNumber?: string;
  maritalStatus?: 'مجرد' | 'متاهل';
  childrenCount?: number;
  residentialAddress?: string;

  // سربرگ ۲: سوابق حوزوی و دانشگاهی
  academicDegree?: string; // سطح ۴ حوزه، دکتری، کارشناسی ارشد
  thesisTitle?: string;
  supervisorProfessor?: string;
  seminaryLevel?: string; // سطح ۲، ۳، ۴ یا درس خارج
  seminarySchool?: string; // حوزه علمیه قم، تهران، مشهد و ...
  universityDegree?: string;
  universityName?: string;
  fieldOfStudy?: string;
  academicHonors?: string;

  // سربرگ ۳: سوابق در مجموعه و مرکز دانش‌آموختگان
  associationMembershipDate?: string;
  associationResponsibility?: string; // عضو هیئت اندیشه‌ورز، مسئول کارگروه، مجمع عمومی
  associationContributions?: string[]; // فعالیت‌ها و طرح‌های ارائه‌شده در مرکز
  membershipStatus?: 'active' | 'honorary' | 'alumni_council';
  internalNotes?: string;

  // سربرگ ۴: اطلاعات شغلی و قضایی
  personnelId?: string;
  judicialGrade?: number; // پایه ۱ تا ۱۱ قضایی
  courtBranch?: string;
  province?: string;
  email?: string;
  employmentStatus?: 'شاغل قضایی' | 'مستشار' | 'بازپرس' | 'دادیار' | 'قاضی بازنشسته' | 'عضو هیئت علمی';
  currentJudicialPost?: string;
  serviceYears?: number;
  judicialSpecialty?: string; // کیفری، حقوقی، خانواده، اقتصادی، اداری
  
  permissions?: UserPermissions;
}

export interface CrextioBentoCardConfig {
  id: string;
  order: number;
  title: string;
  subtext: string;
  badge: string;
  size: '1-col' | '2-col' | '3-col' | 'full';
  subServices: string[];
  isVisible?: boolean;
  accentColor?: string;
}

export interface CrextioHeroStatItem {
  id: string;
  label: string;
  val: number;
  trend: string;
  icon: 'users' | 'graduation' | 'scale' | 'book' | 'award' | 'sparkles' | 'activity' | 'gift' | 'shield';
  color: string;
  isVisible?: boolean;
}

export interface CrextioDashboardConfig {
  _baseVersion?: number;
  showHeroBanner: boolean;
  showCourseShowcase: boolean;
  courseShowcaseMode: 'carousel' | 'grid' | 'compact';
  showKpiRow: boolean;
  showProfileCard: boolean;
  showPerformanceCard: boolean;
  showPublicationsGallery: boolean;
  publicationsMode: 'cards' | 'list';
  showCartableSnippet: boolean;
  showQuickActions: boolean;
  showRulingsSnippet: boolean;
  canvasTheme: 'warm_ivory' | 'royal_emerald' | 'pure_minimal';
  heroTitle?: string;
  heroSubtitle?: string;
  showShowcaseSection?: boolean;
  showcaseTitle?: string;
  showcaseSubtitle?: string;
  showcaseAlumniCount?: string;
  showcaseCoursesCount?: string;
  showcaseRulingsCount?: string;
  showcaseSatisfactionRate?: string;
  bentoCardsConfig?: CrextioBentoCardConfig[];
  heroStatsConfig?: CrextioHeroStatItem[];
  // ویترین دوره‌ها و کارگاه‌های آموزشی
  courseShowcaseTitle?: string;
  courseShowcaseSubtitle?: string;
  courseShowcaseBadge?: string;
  courseShowcaseCtaText?: string;
  courseShowcaseInterval?: number;
  courseShowcaseAutoplay?: boolean;
  courseShowcaseShowPrice?: boolean;
  courseShowcaseSelectedIds?: string[];
  courseShowcaseCustomData?: Record<string, Partial<Course>>;

  // ویترین خدمات مشاوره نخبگان
  showCounselingPromo?: boolean;
  counselingPromoTitle?: string;
  counselingPromoSubtitle?: string;
  counselingPromoBadge?: string;
  counselingPromoSpecializedTitle?: string;
  counselingPromoSpecializedDesc?: string;
  counselingPromoSpecializedBadge?: string;
  counselingPromoSpecializedBtnText?: string;
  counselingPromoGeneralTitle?: string;
  counselingPromoGeneralDesc?: string;
  counselingPromoGeneralBadge?: string;
  counselingPromoGeneralBtnText?: string;
  counselingPromoCustomData?: {
    specBadge?: string;
    specHeading?: string;
    specDesc?: string;
    specBullets?: string[];
    genBadge?: string;
    genHeading?: string;
    genDesc?: string;
    genBullets?: string[];
    consultantOverrides?: Record<
      string,
      {
        name?: string;
        title?: string;
        specialty?: string;
        experienceYears?: number;
        avatarUrl?: string;
      }
    >;
    coverImage?: string;
  };

  // ویترین مستقل خدمات روانشناختی و مشاوره و خانواده
  showCounselingGeneralShowcase?: boolean;
  counselingGeneralShowcaseTitle?: string;
  counselingGeneralShowcaseSubtitle?: string;
  counselingGeneralShowcaseBadge?: string;
  counselingGeneralShowcaseDesc?: string;
  counselingGeneralShowcaseBtnText?: string;
  counselingGeneralShowcaseBullets?: string[];
  counselingGeneralShowcaseConfig?: CounselingGeneralShowcaseConfig;

  // ویترین خدمات رفاهی و تسهیلات
  showWelfareShowcase?: boolean;
  welfareShowcaseTitle?: string;
  welfareShowcaseSubtitle?: string;
  welfareShowcaseBadge?: string;
  welfareShowcaseCtaText?: string;
  welfareShowcaseLoanAmount?: string;
  welfareShowcaseCards?: Array<{
    id: string;
    title: string;
    amount?: string;
    subtitle?: string;
    subtext?: string;
    tag: string;
    icon?: string;
    iconId?: string;
    badge?: string;
    accent?: string;
    bgClass?: string;
    imageUrl?: string;
  }>;

  // ویترین کتاب و محصولات چند رسانه‌ای
  showProductsMiniPromo?: boolean;
  booksShowcaseTitle?: string;
  booksShowcaseSubtitle?: string;
  booksShowcaseBadge?: string;
  booksShowcaseCtaText?: string;
  booksShowcaseDiscountNotice?: string;
  booksShowcaseSelectedCategories?: Array<'book' | 'multimedia' | 'audio_series'>;
  booksShowcaseSelectedProductIds?: string[];
  booksCustomItems?: Array<{
    id: string;
    productId?: string;
    format?: 'book' | 'multimedia' | 'audio_series';
    title: string;
    author: string;
    price: number;
    physicalPrice?: number;
    supportsDigital?: boolean;
    supportsPhysical?: boolean;
    discountPercent: number;
    coverImage: string;
    tag: string;
    shortDescription?: string;
  }>;

  // ویترین درس‌گفتارها و چندرسانه‌ای
  showMultimediaShowcase?: boolean;
  multimediaShowcaseTitle?: string;
  multimediaShowcaseSubtitle?: string;
  multimediaShowcaseBadge?: string;
  multimediaShowcaseCtaText?: string;
  multimediaLecturesCount?: string;
  multimediaCustomCards?: Array<{
    id: string;
    title: string;
    instructor: string;
    sessions: string;
    type: string;
    tag: string;
    accent: string;
    cover: string;
  }>;

  // ویترین هیرو، برند هدر، ویجت‌ها و بنر خوش‌آمدگویی
  heroBadgeText?: string;
  heroGreetingPrefix?: string;
  showHeroStats?: boolean;
  heroBannerScale?: 'micro' | 'compact' | 'normal' | 'expanded';
  showHeroPortrait?: boolean;
  heroRightSlotMode?: 'stats' | 'quick_actions' | 'both' | 'none';
  heroQuickButtons?: Array<{
    id: string;
    label: string;
    targetNav: string;
    visible: boolean;
  }>;
  navigationConfig?: NavigationCustomizationConfig;
  brandMainTitle?: string;
  brandBadgeText?: string;
  brandSubtitleText?: string;
  theme2TopBarTitle?: string;
  heroPortraitBadgeText?: string;
  heroPortraitVerifiedText?: string;
  heroPortraitRoleLabelAlumni?: string;
  heroPortraitRoleLabelStaff?: string;
  heroSchemeLabel?: string;
  heroDomainLabel?: string;
  statusWidgetTitle?: string;
  statusWidgetSubtitle?: string;
  eventsCalendarTitle?: string;
  eventsCalendarSubtitle?: string;
  bentoSectionTitle?: string;
  bentoSectionSubtitle?: string;
  bentoHoverHintText?: string;
  bentoCardCtaText?: string;
  bentoCardSchemeText?: string;
  minimalBoxOverrides?: Record<
    string,
    {
      kicker?: string;
      title?: string;
      description?: string;
      ctaLabel?: string;
    }
  >;

  // ویترین تالار نقد و مناظره آراء قضایی
  showRulingsShowcase?: boolean;
  rulingsShowcaseMode?: 'summary_carousel' | 'expanded' | 'compact';
  rulingsShowcaseContentMode?: 'title_only' | 'title_summary' | 'tabbed';
  rulingsShowcaseVisibleTabs?: Array<'summary' | 'principles' | 'fullText' | 'discussions'>;
  rulingsShowcaseTabLabels?: {
    summary?: string;
    principles?: string;
    fullText?: string;
    discussions?: string;
  };
  rulingsShowLikesInShowcase?: boolean;
  rulingsShowDislikesInShowcase?: boolean;
  rulingsShowCommentsInShowcase?: boolean;
  rulingsShowcaseIntervalSeconds?: number;
  rulingsSummaryAutoplay?: boolean;
  rulingsSelectedIds?: string[];
  rulingsShowcaseBgImage?: string;
  rulingsShowcaseTitle?: string;
  rulingsShowcaseSubtitle?: string;
  rulingsShowcaseBadge?: string;
  rulingsPrimaryBtnText?: string;
  rulingsShowcaseSectionTitle?: string;
  rulingsCustomList?: JudicialRuling[];

  // ویترین تبلیغی و ترغیبی راهبری پژوهش و رساله‌ها
  showResearchPromoShowcase?: boolean;
  researchPromoTitle?: string;
  researchPromoSubtitle?: string;
  researchPromoBadge?: string;
  researchPromoGrantAmount?: string;
  researchPromoBgImage?: string;
  researchPromoPrimaryBtnText?: string;
  researchPromoPrimaryAction?: 'quick_modal' | 'navigate_research' | 'external_link';
  researchPromoPrimaryActionUrl?: string;
  researchPromoSecondaryBtnText?: string;
  researchPromoSecondaryAction?: 'navigate_research' | 'quick_modal' | 'external_link';
  researchPromoSecondaryActionUrl?: string;
  researchPromoCards?: {
    id: string;
    title: string;
    desc: string;
    tag: string;
    icon?: string;
    clickAction?: 'quick_modal' | 'navigate_research' | 'external_link' | 'none';
    actionUrl?: string;
  }[];

  // سامانه اختصاصی تغییر اندازه فونت‌های ویترین‌ها به تفکیک نوع متن (اصلاح ۴)
  fontSizes?: {
    heroTitle?: 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl';
    heroSubtitle?: 'text-[11px]' | 'text-xs' | 'text-sm' | 'text-base';
    rulingsTitle?: 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl';
    rulingsBody?: 'text-[10px]' | 'text-[11px]' | 'text-xs' | 'text-sm';
    researchTitle?: 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl';
    researchBody?: 'text-[10px]' | 'text-[11px]' | 'text-xs' | 'text-sm';
    cardTitles?: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg';
    cardSubtitles?: 'text-[10px]' | 'text-[11px]' | 'text-xs';
  };

  dashboardSectionOrder?: string[];
  hiddenDashboardSections?: Record<string, boolean>;
  dashboardSectionLayouts?: Record<
    string,
    {
      span?: 'full' | 'half';
      density?: 'full' | 'minimal';
      scale?: 'micro' | 'compact' | 'normal' | 'expanded';
      showImage?: boolean;
    }
  >;
  defaultAlumniTheme?: 'crextio' | 'minimal';

  // تنظیمات تصاویر باکس‌های ساده/مینیمال و کلیه ویترین‌ها
  showShowcaseImagesInMinimal?: boolean;
  showcaseImageOverrides?: Record<string, string>;

  // ویترین افتخارات و انتصابات (مشترک در تم ۲ و تم ۳ - تمام‌عرض و نصف‌عرض)
  showHonorsShowcase?: boolean;
  honorsShowcaseTitle?: string;
  honorsShowcaseSubtitle?: string;
  honorsAutoplaySeconds?: number;
  honorsItems?: HonorAppointmentItem[];

  // ویترین جامع یکپارچه (شامل ویترین‌های منتخب تم ۲)
  showUnifiedShowcase?: boolean;
  unifiedShowcaseTitle?: string;
  unifiedShowcaseSubtitle?: string;
  unifiedShowcaseIncludedKeys?: string[];
  unifiedShowcaseStyle?: 'cinematic' | 'tabbed_grid';
  unifiedShowcaseAutoplay?: boolean;
  unifiedShowcaseAutoplaySeconds?: number;

  // تنظیمات اختصاصی نسخه موبایل داشبورد (ذخیره دائم در system_settings)
  mobileConfig?: CrextioMobileConfig;
}

export type MobileSectionId =
  | 'hero'
  | 'quick_dock'
  | 'status_ledger'
  | 'honors_showcase'
  | 'services_showcase'
  | 'services_list';

export type MobileServiceShowcaseId =
  | 'counseling'
  | 'counseling_specialized'
  | 'courses'
  | 'rulings'
  | 'research'
  | 'welfare'
  | 'products';

export type MobileServiceListTabId =
  | 'courses'
  | 'counseling'
  | 'specialized_counseling'
  | 'rulings'
  | 'research'
  | 'welfare'
  | 'products'
  | 'cartable'
  | 'synergy';

export interface CrextioMobileConfig {
  showHeroBanner?: boolean;
  showWelcomeQuickButtons?: boolean;
  showHeroStats?: boolean;
  showHeroPortrait?: boolean;
  showQuickDock?: boolean;
  showStatusLedger?: boolean;
  showHonorsShowcase?: boolean;
  separateHonorsShowcase?: boolean;
  honorsShowcaseTitle?: string;
  showServicesShowcase?: boolean;
  servicesShowcaseTitle?: string;
  showcaseOrder?: MobileServiceShowcaseId[];
  hiddenShowcases?: Record<string, boolean>;
  showServicesList?: boolean;
  servicesListTitle?: string;
  servicesListOrder?: MobileServiceListTabId[];
  hiddenServicesListItems?: Record<string, boolean>;
  mobileSectionOrder?: MobileSectionId[];
}

export interface CustomNavItemConfig {
  id: string;
  label: string;
  subtext?: string;
  badge?: string;
  visible?: boolean;
}

export interface NavigationCustomizationConfig {
  verticalSidebar?: CustomNavItemConfig[];
  horizontalNavbar?: CustomNavItemConfig[];
  servicesMenuTitle?: string;
  servicesMenuItems?: CustomNavItemConfig[];
}

export interface HonorAppointmentItem {
  id: string;
  category: string;
  title: string;
  honoreeName: string;
  positionOrAchievement: string;
  description?: string;
  dateOrLocation?: string;
  imageUrl: string;
  textPosition?: 'bottom_right' | 'center' | 'bottom_bar';
  scrimStrength?: 'soft' | 'medium' | 'strong';
  ctaLabel?: string;
  ctaAction?: 'none' | 'navigate_alumni' | 'navigate_rulings' | 'navigate_research' | 'external_link';
  ctaUrl?: string;
}

export type NavTabId =
  | 'dashboard'
  | 'cartable'
  | 'courses'
  | 'products'
  | 'counseling'
  | 'specialized_counseling'
  | 'research'
  | 'rulings'
  | 'welfare'
  | 'synergy'
  | 'alumni'
  | 'users'
  | 'finance'
  | 'admin';

export type DesignThemeType = 'portal' | 'crextio';

export interface MizanDashboardConfig {
  showHeroSeal: boolean;
  showBentoGrid: boolean;
  showStoriesSlider: boolean;
  showRulingsShelf?: boolean;
  showRulingsPicks?: boolean;
  rulingsShelfContentMode?: 'title_only' | 'title_summary' | 'tabbed';
  rulingsShowLikesInShowcase?: boolean;
  rulingsShowDislikesInShowcase?: boolean;
  rulingsShowCommentsInShowcase?: boolean;
  showSynergyHighlights?: boolean;
  showImpactSection: boolean;
  showPublicationsShelf?: boolean;
  publicationsShelfTitle?: string;
  publicationsShelfSubtitle?: string;
  publicationsShelfSelectedCategories?: Array<'book' | 'multimedia' | 'audio_series'>;
  publicationsShelfSelectedIds?: string[];
  heroSealBadge?: string;
  heroTitle?: string;
  heroGreeting?: string;
  heroSubtitle?: string;
  heroPrimaryActionText?: string;
  impactAlumniCount: string;
  impactAlumniSource: string;
  impactCoursesCount: string;
  impactCoursesSource: string;
  impactRulingsCount: string;
  impactRulingsSource: string;
  impactSatisfactionRate: string;
  impactSatisfactionSource: string;
  brandHue: 'sedr' | 'turquoise' | 'amber';
  borderRadius: 'sharp' | 'soft' | 'rounded';
  motionLevel: 'full' | 'reduced' | 'off';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILED' 
    | 'ACCOUNT_LOCKED' 
    | 'ACCOUNT_UNLOCKED'
    | 'SESSION_REVOKED' 
    | 'GLOBAL_LOGOUT'
    | 'ROLE_CHANGED' 
    | 'CARTABLE_STATUS_CHANGE'
    | 'RULING_APPROVED'
    | 'SYSTEM_CONFIG_UPDATED'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'PASSWORD_CHANGED'
    | 'REFRESH_TOKEN_REUSED'
    | 'REFRESH_TOKEN_REVOKED'
    | 'AUDIT_ACTION_ROLLED_BACK'
    | 'MAINTENANCE_MODE_TOGGLED'
    | 'IP_BLOCKED'
    | 'IP_UNBLOCKED';
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  ip: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  isRollbackable?: boolean;
  isRolledBack?: boolean;
  rolledBackBy?: string;
  rolledBackAt?: string;
}

export interface ErrorLogItem {
  id: string;
  level: 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  source?: string;
  requestId?: string;
  userId?: string;
  userName?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface SecurityAlertItem {
  id: string;
  type: 'AFTER_HOURS_ACTIVITY' | 'UNUSUAL_VOLUME' | 'FAILED_LOGIN_BURST' | 'SUSPICIOUS_IP' | 'DATA_MUTATION';
  userId?: string;
  userName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  status: 'unreviewed' | 'reviewed' | 'dismissed';
  isSpecialMonitoring?: boolean;
  createdAt: string;
}

export interface BlockedIpItem {
  ip: string;
  reason: string;
  blockedBy: string;
  blockedUntil?: string;
  createdAt: string;
}

export interface OpsMaintenanceConfig {
  globalMaintenance: boolean;
  moduleMaintenance: Record<string, boolean>;
  message: string;
  estimatedReturnTime?: string;
}

export type CartableCategory = 'career' | 'administrative' | 'educational' | 'welfare' | 'research' | 'general' | string;
export type RequestPriority = 'normal' | 'urgent' | 'instant';
export type RequestStatus = 'pending' | 'in_progress' | 'need_info' | 'rejected' | 'completed' | 'archived';

export interface CartableApplicantProfile {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string;
  roleTitle: string;
  organization?: string;
  province?: string;
  graduationYear?: string;
  academicDegree?: string;
  currentJudicialPost?: string;
  email?: string;
  personnelId?: string;
}

export interface CartableCategoryConfigItem {
  id: string;
  key: string;
  title: string;
  assignedRole: string;
  assignedOfficialTitle: string;
  description: string;
  isActive?: boolean;
}

export interface CartableFollowableTopic {
  id: string;
  title: string;
  description: string;
  categoryKey?: string;
  departmentTitle?: string;
  estimatedDays?: string;
  isActive: boolean;
  order: number;
}

export interface CartableFollowableTopicsConfig {
  enabled?: boolean;
  buttonLabel?: string;
  title: string;
  subtitle: string;
  items: CartableFollowableTopic[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface CartableMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  attachments?: string[];
}

export interface CartableRequest {
  id: string;
  trackingNumber: string;
  category: CartableCategory;
  categoryTitle: string;
  title: string;
  description: string;
  applicantId: string;
  applicantName: string;
  applicantRoleTitle: string;
  applicantProfile?: CartableApplicantProfile;
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  messages: CartableMessage[];
  hasUnreadSupervisor?: boolean;
  hasUnreadApplicant?: boolean;
  referredDepartment?: string;
  assignedOfficialRole?: string;
  internalReferralNote?: string;
  slaDeadlineHours?: number;
  attachments?: string[];
  version?: number;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'pdf' | 'doc';
  url: string;
  size?: string;
  sessionNumber?: number;
}

export interface CourseCustomField {
  id: string;
  label: string;
  value: string;
  fieldType?: 'text' | 'textarea' | 'date' | 'link' | 'badge';
  visible?: boolean;
}

export interface CourseInstallmentPlanItem {
  installmentNumber: number;
  title: string;
  percentage?: number;
  fixedAmount?: number;
  dueDateJalali: string;
  dueDateIso: string;
  autoOpenGateway?: boolean;
}

export interface CourseInstallmentPlan {
  enabled: boolean;
  count: number;
  allowReceiptUpload?: boolean;
  allowOnlineGateway?: boolean;
  autoOpenOnDueDate?: boolean;
  items: CourseInstallmentPlanItem[];
}

export interface CourseInstallmentRecord {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseTitle?: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userNationalId?: string;
  installmentNumber: number;
  title: string;
  amount: number;
  dueDateIso: string;
  dueDateJalali: string;
  status: 'pending' | 'awaiting_verification' | 'paid' | 'rejected' | 'overdue';
  paymentMethod?: 'online_gateway' | 'bank_receipt';
  trackingCode?: string;
  receiptFileUrl?: string;
  receiptBankName?: string;
  receiptDate?: string;
  paidAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNote?: string;
  isDueNow?: boolean;
  version: number;
}

export type CourseDiscountCategory =
  | 'percentage'
  | 'fixed_amount'
  | 'single_course'
  | 'multi_course'
  | 'all_courses'
  | 'audience_specific'
  | 'user_specific'
  | 'early_bird';

export type CourseScope = 'specialized' | 'counseling_workshop';

export interface CourseDiscountUsage {
  id: string;
  discountId: string;
  code: string;
  courseId: string;
  courseTitle: string;
  enrollmentId?: string;
  userId: string;
  userName: string;
  userNationalId?: string;
  userPhone?: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  usedAt: string;
}

export interface CourseDiscountCode {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountCategory: CourseDiscountCategory;
  valueType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minPurchaseAmount?: number;
  courseId?: string | null;
  courseIds?: string[];
  targetAudiences?: string[];
  allowedNationalIds?: string[];
  maxUses?: number | null;
  perUserLimit?: number;
  usedCount: number;
  remainingUses?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  startsAtJalali?: string;
  expiresAtJalali?: string;
  isActive: boolean;
  createdByName?: string;
  createdAt?: string;
  version: number;
  scope?: CourseScope;
  usages?: CourseDiscountUsage[];
}

export interface CourseCertificateItem {
  id: string;
  certificateNumber: string;
  courseId: string;
  courseTitle: string;
  instructor: string;
  hours: number;
  userId: string;
  userName: string;
  userNationalId?: string;
  certificateFileUrl?: string;
  certificateFileName?: string;
  uploadedByName?: string;
  gradeText?: string;
  issuedAt: string;
  version: number;
}

export interface CourseInstructorItem {
  id: string;
  fullName: string;
  title?: string;
  roleLabel?: string;
  avatarUrl?: string;
  resume?: string;
  isPrimary?: boolean;
}

export type CourseSessionPresenterMode =
  | 'course_instructor'
  | 'custom_presenter'
  | 'unspecified'
  | 'panel';

export interface CourseSessionItem {
  id: string;
  sessionNumber: number;
  title: string;
  presenterMode: CourseSessionPresenterMode;
  presenterInstructorId?: string;
  presenterName?: string;
  presenterTitle?: string;
  sessionDate?: string;
  startTime?: string;
  durationMinutes?: number;
  holdingType?: 'online' | 'in_person' | 'hybrid' | 'offline_recorded';
  meetingLink?: string;
  description?: string;
}

export interface CourseAttendanceRecord {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  sessionNumber: number;
  sessionTitle?: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  note?: string;
  recordedBy?: string;
  version?: number;
  updatedAt?: string;
}

export interface Course {
  id: string;
  courseScope?: CourseScope;
  title: string;
  instructor: string;
  instructorTitle?: string;
  instructorResume?: string; // رزومه علمی و حرفه‌ای استاد
  instructorAvatarUrl?: string; // تصویر استاد ذخیره شده روی دیسک
  instructors?: CourseInstructorItem[]; // لیست چند مدرس و ارائه‌دهنده دوره
  sessions?: CourseSessionItem[]; // برنامه جلسات دوره به همراه مدرس/ارائه‌دهنده هر جلسه
  draftFolderKey?: string; // کلید موقت پوشه فایل‌ها در هنگام ساخت دوره جدید
  category?: string; // فقه القضاء، داوری تجاری، جزا و جرم‌شناسی، مهارت‌های قضایی، حقوق خصوصی
  level: string;
  hours: number;
  capacity: number;
  enrolledCount: number;
  remainingCapacity?: number; // تعداد باقی‌مانده ظرفیت
  schedule: string;
  holdingTime?: string; // ساعت برگزاری دوره
  startDate?: string;
  endDate?: string;
  holdingFormat: 'online' | 'in_person' | 'hybrid';
  venueAddress?: string; // آدرس محل برگزاری حضوری
  meetingLink: string; // لینک ورود به کلاس برخط
  meetingAccessGuide?: string; // راهنمای ورود، رمز عبور یا شناسه اسکای‌روم
  coverImage?: string; // آدرس عکس یا بنر دوره
  price: number;
  hasInstallments: boolean;
  installmentDetails?: string; // مثلاً دو قسط ۵۰٪
  installmentPlan?: CourseInstallmentPlan;
  hasCertificate: boolean;
  certificateDetails?: string; // گواهی رسمی پایان دوره ممهور به مهر مرکز
  prerequisites?: string; // پیش‌نیازهای دوره
  necessity?: string; // ضرورت‌های اجرای دوره
  targetAudiences?: string[]; // مخاطبین دوره: طلاب، قضات، وکلا و موارد سفارشی
  managerNotes?: string; // توضیحات اضافی مدیر
  customFields?: CourseCustomField[]; // فیلدهای سفارشی اضافه‌شده توسط ادمین
  hiddenFields?: string[]; // فیلدهایی که ادمین کسر/مخفی کرده است
  description: string;
  topics: string[];
  status: 'enrolling' | 'ongoing' | 'completed';
  archiveAccess: 'all' | 'enrolled_only' | 'restricted';
  archiveResources?: CourseResource[];
  allowedPaymentMethod?: 'both' | 'gateway_only' | 'receipt_only';
  customTags?: string[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  isEnrolled?: boolean;
  enrollmentStatus?: 'pending_review' | 'confirmed' | 'rejected';
  classStatus?: 'active' | 'removed';
  hasArchiveAccess?: boolean;
  archiveNotes?: string;

  // تنظیمات اختصاصی پنل مدیریت دوره و محتوای پس از ثبت‌نام دانش‌آموختگان
  deliveryMode?: 'online' | 'offline'; // حالت برخط با جلسه و وبینار یا آفلاین با پکیج دانلودی
  studentWelcomeMessage?: string; // پیام تشکر و خوش‌آمدگویی پس از ثبت‌نام
  studentNoticeBox?: {
    enabled?: boolean;
    title?: string;
    content?: string;
    fontSize?: 'sm' | 'base' | 'lg' | 'xl';
    fontColor?: string;
    bannerUrl?: string; // بنر اطلاعیه یا پیام تبریک
  };
  onlineSessionDate?: string; // تاریخ و ساعت شروع جلسه آنلاین
  onlineSessionTopic?: string; // موضوع جلسه
  onlineReminderNotes?: string; // یادآوری‌های پیش از ورود به کلاس
  offlineDownloadDescription?: string; // توضیحات فایل‌ها و شیوه مطالعه
  offlineBannerUrl?: string; // بنر ویژه دانلود دوره آفلاین
  postEnrollmentBanner?: string; // بنر اختصاصی داخل دوره بعد از تایید
  postEnrollmentMessage?: string; // پیام خوش‌آمد و یادآوری (مثلاً: ضمن تشکر از ثبت‌نام شما، دوره فلان...)
  welcomeBoxFontSize?: 'sm' | 'base' | 'lg' | 'xl'; // اندازه فونت باکس پیام
  welcomeBoxBgColor?: 'emerald' | 'amber' | 'slate' | 'indigo' | 'rose'; // تم رنگی باکس پیام
  reminderDate?: string; // تاریخ برگزاری یا شروع جلسه آنلاین
  reminderSchedule?: string; // روزها و ساعت دقیق برگزاری جلسه
  offlineDownloadUrl?: string; // آدرس لینک دانلود فایل‌های دوره آفلاین
  offlineDownloadGuide?: string; // توضیحات و راهنمای دانلود فایل‌ها و اسلایدهای دوره آفلاین
  offlineDownloadFiles?: Array<{
    id: string;
    title: string;
    url?: string;
    downloadUrl?: string;
    size?: string;
    fileSizeBytes?: number;
    fileType?: string;
    format?: string;
    description?: string;
    sessionNumber?: number;
    sourceType?: 'upload' | 'disk' | 'external';
    filename?: string;
  }>;
  visibleToCustomer?: boolean;
  sessionsCount?: number;
  waitlistEnabled?: boolean;
  version?: number;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userNationalId: string;
  userPhone: string;
  userRoleTitle: string;
  enrolledAt: string;
  paymentMethod: 'online_gateway' | 'bank_receipt';
  paymentStatus: 'pending_review' | 'confirmed' | 'rejected';
  classStatus?: 'active' | 'removed';
  removedAt?: string;
  removedBy?: string;
  removalReason?: string;
  paymentPlanType?: 'full' | 'installment';
  discountCode?: string;
  discountAmount?: number;
  originalAmount?: number;
  finalTotalAmount?: number;
  amountPaid: number;
  trackingCode: string;
  receiptFileUrl?: string;
  receiptBankName?: string;
  receiptDate?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  installments?: CourseInstallmentRecord[];
  version?: number;
}

export interface ProductDeliveryOption {
  enabled: boolean;
  fee: number;
  label?: string;
  notice?: string;
}

export interface ProductDeliveryOptionsMap {
  complexPickup: ProductDeliveryOption;
  postal: ProductDeliveryOption;
  courier: ProductDeliveryOption;
}

export interface ProductPaymentGateway {
  id: string;
  name: string;
  providerCode: string;
  description?: string;
  badge?: string;
  isActive: boolean;
}

export interface ProductMediaSession {
  id: string;
  title: string;
  mediaType: 'audio' | 'video' | 'document' | 'file';
  downloadUrl: string;
  durationOrSize?: string;
  description?: string;
}

export interface ProductCategoryConfig {
  id: string;
  label: string;
  shortLabel?: string;
  kind: 'book' | 'session' | 'lecture' | 'multimedia' | 'custom';
  isEnabled: boolean;
  isBuiltIn?: boolean;
}

export interface ProductsStoreConfig {
  isStoreEnabled: boolean;
  disabledNotice?: string;
  enabledCategories: Record<string, boolean>;
  customCategories?: ProductCategoryConfig[];
  storeTitle: string;
  storeSubtitle: string;
  gateways: ProductPaymentGateway[];
  bankCardNumber?: string;
  bankAccountHolder?: string;
  bankSheba?: string;
  bankName?: string;
  defaultDeliveryOptions: ProductDeliveryOptionsMap;
  version?: number;
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  subjectIndex?: string;
  authorOrPresenter: string;
  presenters?: string[];
  format: string;
  formatTitle: string;
  price: number;
  supportsDigital?: boolean;
  digitalPrice?: number;
  digitalFormatLabel?: string;
  supportsPhysical?: boolean;
  physicalPrice?: number;
  physicalFormatLabel?: string;
  deliveryOptions?: ProductDeliveryOptionsMap;
  description: string;
  pagesOrDuration: string;
  publishedYear: string;
  publisher?: string;
  isbn?: string;
  coverImage?: string;
  galleryImages?: string[];
  downloadLink?: string;
  mediaSessions?: ProductMediaSession[];
  hasLockedMedia?: boolean;
  allowedPaymentMethod?: 'both' | 'gateway_only' | 'receipt_only';
  shippingMode?: 'postal_only' | 'pickup_only' | 'both';
  shippingCostType?: 'free' | 'fixed' | 'calculated_later';
  shippingFixedFee?: number;
  pickupAddressNotice?: string;
  isAvailable: boolean;
  showInShowcase?: boolean;
  stock?: number;
  displayOrder?: number;
  badgeText?: string;
  isOwned?: boolean;
  ownedFormats?: Array<'digital' | 'physical'>;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  visibleToCustomer?: boolean;
  version?: number;
}

export interface ProductOrder {
  id: string;
  productId: string;
  productTitle: string;
  productFormat: string;
  purchaseFormat?: 'digital' | 'physical';
  deliveryMethod?: 'complex_pickup' | 'postal' | 'courier' | 'digital_instant';
  userId: string;
  userName: string;
  userPhone: string;
  userNationalId: string;
  userRoleTitle: string;
  orderedAt: string;
  baseAmount?: number;
  amountPaid: number;
  paymentMethod: 'online_gateway' | 'bank_receipt';
  gatewayId?: string;
  gatewayName?: string;
  paymentStatus: 'pending_review' | 'confirmed' | 'rejected';
  trackingCode: string;
  receiptFileUrl?: string;
  receiptBankName?: string;
  receiptDate?: string;
  fulfillmentChoice?: 'postal' | 'pickup' | 'courier';
  shippingFee?: number;
  shippingNotice?: string;
  shippingAddress?: string;
  postalTrackingCode?: string;
  shippingStatus?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version?: number;
}

export type CounselingCategory = 
  | 'individual' 
  | 'family' 
  | 'personality' 
  | 'marriage' 
  | 'academic' 
  | 'judicial_career';

export interface Consultant {
  id: string;
  name: string;
  title: string;
  specialty: string;
  specialties?: string[];
  bio: string;
  experienceYears: number;
  availability: string;
  scheduleSlots?: string[];
  avatarUrl?: string;
  academicRank?: string;
  resumeDetails?: string[];
  isActive?: boolean;
  counselingType?: 'general' | 'specialized_career';
  fee?: number;
  subsidyNotice?: string;
  version?: number;
}

export interface CounselingRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  hideIdentity?: boolean;
  userPhone?: string;
  userNationalId?: string;
  userRoleTitle?: string;
  category: CounselingCategory;
  categoryTitle: string;
  counselingType?: 'general' | 'specialized_career';
  selectedFieldId?: string;
  selectedFieldTitle?: string;
  formResponses?: Record<string, string | string[]>;
  preferredConsultantId?: string;
  preferredConsultantName?: string;
  description: string;
  status: 'pending' | 'scheduled' | 'attended' | 'completed' | 'cancelled' | 'absent';
  sessionStatus?: 'upcoming' | 'attended' | 'cancelled' | 'absent';
  scheduledDate?: string;
  scheduledTime?: string;
  meetingMode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
  venueDetails?: string;
  counselorNotes?: string;
  fee?: number;
  subsidyNotice?: string;
  paymentStatus?: 'pending_review' | 'confirmed' | 'waived' | 'free';
  reviewedBy?: string;
  reviewedAt?: string;
  version?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AlumniProfileSettingsConfig {
  allowAlumniProfileCompletion: boolean;
  noticeText?: string;
  updatedBy?: string;
  updatedAt?: string;
  version: number;
}

export interface CounselingFieldItem {
  id: string;
  counselingType: 'general' | 'specialized_career';
  title: string;
  subtitle?: string;
  description: string;
  iconName?: string;
  accentColor?: string;
  isActive: boolean;
  displayOrder: number;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export type DynamicWizardFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'location_city'
  | 'time_preference';

export interface DynamicWizardField {
  id: string;
  key: string;
  label: string;
  type: DynamicWizardFieldType;
  placeholder?: string;
  helperText?: string;
  options?: string[];
  primaryCityLabel?: string;
  otherCitiesLabel?: string;
  dayTimeOptions?: string[];
  weekPeriodOptions?: string[];
  undecidedLabel?: string;
  required: boolean;
  enabled: boolean;
  order: number;
}

export interface DynamicWizardStep {
  id: string;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  fields: DynamicWizardField[];
}

export interface CounselingLandingInfoCard {
  id: string;
  title: string;
  body: string;
  badge?: string;
  enabled: boolean;
}

export interface SpecializedCounselingPortalConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  headerBadgeLabel?: string;
  tabRequestLabel?: string;
  tabConsultantsLabel?: string;
  tabHistoryLabel?: string;
  heroBadgeLabel?: string;
  landingIntroTitle: string;
  landingIntroBody: string;
  heroHistoryButtonLabel?: string;
  calloutBadgeLabel?: string;
  landingCalloutTitle: string;
  landingCalloutSubtitle: string;
  ctaButtonLabel: string;
  calloutSecondaryLinkLabel?: string;
  fieldsShowcaseBadgeLabel?: string;
  fieldsSectionTitle: string;
  fieldsSectionSubtitle: string;
  fieldsShowcaseHelperText?: string;
  fieldsCardCtaLabel?: string;
  fieldsShowcaseEmptyText?: string;
  landingInfoCardsTitle?: string;
  landingInfoCardsSubtitle?: string;
  landingInfoCards?: CounselingLandingInfoCard[];
  descriptionButtonLabel: string;
  descriptionModalTitle: string;
  descriptionModalBody: string;
  showAdvisorsToStudents: boolean;
  showFieldsSelectionStep?: boolean;
  wizardFieldStepTitle?: string;
  wizardFieldStepSubtitle?: string;
  wizardFieldNotice?: string;
  fieldSelectionOptional?: boolean;
  skipFieldSelectionLabel?: string;
  otherCities?: string[];
  includeFinalReviewStep?: boolean;
  showPhoneFieldInWizard?: boolean;
  showConsultantsInWizard?: boolean;
  submitButtonLabel?: string;
  nextButtonLabel?: string;
  prevButtonLabel?: string;
  submissionSuccessTitle?: string;
  submissionSuccessMessage: string;
  wizardSteps: DynamicWizardStep[];
  version: number;
}

export interface GeneralCounselingPortalConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  headerBadgeLabel?: string;
  tabRequestLabel?: string;
  tabConsultantsLabel?: string;
  tabTariffsLabel?: string;
  tabTestsLabel?: string;
  tabHistoryLabel?: string;
  heroBadgeLabel?: string;
  landingIntroTitle: string;
  landingIntroBody: string;
  heroHistoryButtonLabel?: string;
  calloutBadgeLabel?: string;
  landingCalloutTitle: string;
  landingCalloutSubtitle: string;
  ctaButtonLabel: string;
  calloutSecondaryLinkLabel?: string;
  fieldsShowcaseBadgeLabel?: string;
  fieldsSectionTitle: string;
  fieldsSectionSubtitle: string;
  fieldsShowcaseHelperText?: string;
  fieldsCardCtaLabel?: string;
  fieldsShowcaseEmptyText?: string;
  landingInfoCardsTitle?: string;
  landingInfoCardsSubtitle?: string;
  landingInfoCards?: CounselingLandingInfoCard[];
  descriptionButtonLabel: string;
  descriptionModalTitle: string;
  descriptionModalBody: string;
  showFieldsSelectionStep?: boolean;
  wizardFieldStepTitle?: string;
  wizardFieldStepSubtitle?: string;
  wizardFieldNotice?: string;
  fieldSelectionOptional?: boolean;
  skipFieldSelectionLabel?: string;
  otherCities?: string[];
  includeFinalReviewStep?: boolean;
  showPhoneFieldInWizard?: boolean;
  showConsultantsInWizard?: boolean;
  submitButtonLabel?: string;
  nextButtonLabel?: string;
  prevButtonLabel?: string;
  showRatesInWizardEnd: boolean;
  ratesButtonLabel: string;
  submissionSuccessTitle?: string;
  submissionSuccessMessage: string;
  wizardSteps: DynamicWizardStep[];
  version: number;
}

export interface GeneralCounselingTariffItem {
  id: string;
  serviceTitle: string;
  sessionDurationMinutes: number;
  meetingMode: 'حضوری' | 'برخط' | 'تلفنی' | 'همه روش‌ها';
  standardFee: number;
  alumniSubsidizedFee: number;
  notes?: string;
  isActive: boolean;
  displayOrder: number;
  version: number;
}

export interface PsychologicalTestQuestion {
  id: string;
  prompt: string;
  type: 'single_choice' | 'scale' | 'text';
  options?: string[];
  required?: boolean;
}

export interface PsychologicalTest {
  id: string;
  title: string;
  category: string;
  description: string;
  estimatedMinutes: number;
  instructions?: string;
  questions: PsychologicalTestQuestion[];
  isActive: boolean;
  version: number;
  createdAt?: string;
}

export interface PsychologicalTestAssignment {
  id: string;
  testId?: string;
  testTitle?: string;
  testCategory?: string;
  testDescription?: string;
  estimatedMinutes?: number;
  instructions?: string;
  questions?: PsychologicalTestQuestion[];
  externalTestUrl?: string;
  externalTestTitle?: string;
  isVisibleToUser?: boolean;
  userId: string;
  userName: string;
  userPhone?: string;
  userNationalId?: string;
  assignedById?: string;
  assignedByName: string;
  requestId?: string;
  status: 'unlocked' | 'in_progress' | 'completed' | 'reviewed';
  adminNote?: string;
  resultId?: string;
  scoreSummary?: string;
  version: number;
  assignedAt: string;
  completedAt?: string;
}

export interface CounselingBasicClient {
  id: string;
  fullName: string;
  phone: string;
}

export interface CounselingWorkshopMediaFile {
  id: string;
  title: string;
  mediaType: 'video' | 'audio' | 'file';
  url: string;
  sourceType: 'disk' | 'external';
  durationOrSize?: string;
}

export interface CounselingWorkshopItem {
  id: string;
  title: string;
  mode: 'upcoming' | 'archive';
  presenter?: string;
  topic?: string;
  scheduleText?: string;
  description?: string;
  bannerUrl?: string;
  registrationUrl?: string;
  registrationNote?: string;
  capacityLabel?: string;
  isActive: boolean;
  displayOrder: number;
  mediaFiles: CounselingWorkshopMediaFile[];
  registrationsCount?: number;
}

export interface CounselingAnnouncementItem {
  id: string;
  title?: string;
  subtitle?: string;
  organizerType: 'internal' | 'external';
  organizerName?: string;
  scheduleText?: string;
  description?: string;
  topics?: string[];
  bannerUrl: string;
  externalUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CounselingGeneralShowcaseFieldVisibility {
  showImage?: boolean;
  showPresenter?: boolean;
  showSchedule?: boolean;
  showDescription?: boolean;
  showActionBadge?: boolean;
}

export interface CounselingGeneralShowcaseConfig {
  sectionBadge?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  displayMode?: 'carousel' | 'grid';
  carouselAutoplay?: boolean;
  carouselIntervalSeconds?: number;
  showcaseScale?: 'micro' | 'compact' | 'normal' | 'expanded';
  showcaseImageUrl?: string;
  showShowcaseImage?: boolean;
  workshopsDisplayMode?: 'both' | 'upcoming_only' | 'archive_only';
  upcomingFields?: CounselingGeneralShowcaseFieldVisibility;
  archiveFields?: CounselingGeneralShowcaseFieldVisibility;
  showWorkshopsCard: boolean;
  showAnnouncementsCard: boolean;
  showFeaturedConsultantCard: boolean;
  workshopsCardTitle: string;
  workshopsCardSubtitle?: string;
  announcementsCardTitle: string;
  announcementsCardSubtitle?: string;
  consultantCardTitle: string;
  consultantCardCtaLabel: string;
  featuredConsultantIds: string[];
  workshops: CounselingWorkshopItem[];
  announcements: CounselingAnnouncementItem[];
  myRegisteredWorkshopIds?: string[];
  version?: number;
}

export interface PsychologicalTestResult {
  id: string;
  assignmentId: string;
  testId: string;
  testTitle?: string;
  userId: string;
  userName: string;
  userNationalId?: string;
  answers: Array<{ questionId: string; prompt?: string; questionText?: string; answer: string | number }>;
  rawScore?: number;
  scoreSummary: string;
  psychologistNotes?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  version: number;
  submittedAt: string;
}

export interface ResearchMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  isOfficial: boolean;
  message: string;
  createdAt: string;
}

export interface ResearchWizardOption {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface ResearchPortalConfig {
  sectionTitle: string;
  sectionSubtitle: string;
  landingIntroTitle: string;
  landingIntroBody: string;
  landingCalloutTitle: string;
  landingCalloutSubtitle: string;
  ctaButtonLabel: string;
  guidanceNotesTitle: string;
  guidanceNotesBody: string;
  contactCenterTitle: string;
  contactPhone: string;
  contactExtension?: string;
  contactMobileOrMessenger?: string;
  contactHours?: string;
  contactAddress?: string;
  accommodationEnabledInWizard: boolean;
  accommodationCityLabel: string;
  submissionSuccessMessage: string;
  wizardConfig: {
    step1Title: string;
    step1Options: ResearchWizardOption[];
    step2Title: string;
    step2Options: ResearchWizardOption[];
    fullPackDeliveryTitle: string;
    fullPackInPersonLabel: string;
    fullPackOnlineLabel: string;
    accommodationQuestionLabel: string;
    briefSummaryLabel: string;
    briefSummaryPlaceholder: string;
    partialTopicsTitle: string;
    partialTopics: ResearchWizardOption[];
    partialDeliveryTitle: string;
    partialInPersonLabel: string;
    partialOnlineLabel: string;
    reviewStepTitle: string;
  };
  version?: number;
}

export interface ResearchApplicantProfile {
  fullName: string;
  phone: string;
  nationalId: string;
  email?: string;
  city?: string;
  roleTitle?: string;
  university?: string;
  major?: string;
  bio?: string;
}

export interface ResearchMentorship {
  id: string;
  applicantId: string;
  applicantName: string;
  researchCategory?: 'thesis' | 'article';
  serviceScope?: 'full_pack' | 'partial_mentorship';
  selectedPartialTopics?: string[];
  deliveryMode?: 'in_person' | 'online';
  thesisTitle: string;
  field: string;
  briefSummary?: string;
  targetInstitution?: string;
  stage: 'proposal' | 'supervisor_matching' | 'scientific_critique' | 'drafting' | 'defense_prep';
  stageTitle: string;
  progressPercent: number;
  assignedSupervisor?: string;
  accommodationRequested: boolean;
  accommodationCity?: 'قم' | 'تهران' | 'مشهد';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'active' | 'under_review' | 'completed' | 'suspended';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  milestones: { title: string; isDone: boolean; date: string }[];
  messages?: ResearchMessage[];
  applicantProfile?: ResearchApplicantProfile;
  version?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface RulingTagDefinition {
  id: string;
  label: string;
  colorScheme: 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky' | 'slate' | 'purple';
  styleVariant: 'solid' | 'soft' | 'outline';
  scope: 'internal' | 'public';
}

export interface RulingDiscussionItem {
  id: string;
  authorId?: string;
  authorName: string;
  authorRoleTitle: string;
  comment: string;
  timestamp: string;
  isFeatured?: boolean;
  editedAt?: string;
}

export interface RulingsPortalConfig {
  layoutMode: 'editorial_split' | 'magazine_grid' | 'archive_list';
  globalCommentsEnabled: boolean;
  showCreatedAt: boolean;
  showReviewedAt: boolean;
  showKeywords: boolean;
  showPrinciples: boolean;
  showSummary: boolean;
  showAttachments: boolean;
  portalTitle: string;
  portalSubtitle: string;
  internalTagDefinitions: RulingTagDefinition[];
  publicLabelDefinitions: RulingTagDefinition[];
  version?: number;
}

export interface JudicialRuling {
  id: string;
  title: string;
  courtBranch: string;
  judgeName: string;
  rulingDate: string;
  caseType: 'criminal' | 'civil' | 'commercial' | 'family';
  caseTypeTitle: string;
  summary: string;
  legalPrinciples: string[];
  keywords?: string[];
  attachments?: string[];
  adminTags?: string[];
  publicLabels?: string[];
  isSystemPick?: boolean;
  isVisibleToAlumni?: boolean;
  commentsEnabled?: boolean;
  displayOrder?: number;
  fullRulingText: string;
  status: 'pending_review' | 'selected';
  submittedById: string;
  submittedByName: string;
  likesCount: number;
  likedBy: string[];
  dislikesCount: number;
  dislikedBy: string[];
  internalReviewNote?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  updatedAt?: string;
  highlights?: any[];
  version?: number;
  discussions: RulingDiscussionItem[];
}

export interface WelfareRequest {
  id: string;
  type: 'loan' | 'accommodation';
  typeTitle: string;
  applicantId: string;
  applicantName: string;
  title: string;
  requestedValue: string; // e.g. "وام ۱۰۰ میلیون تومانی" or "اسکان ۴ روزه مشهد مقدس"
  status: 'pending' | 'approved' | 'disbursed' | 'rejected';
  description: string;
  rulesAcknowledged: boolean;
  adminNote?: string;
  createdAt: string;
}

export interface ConsumableItem {
  id: string;
  title: string;
  name?: string;
  category: string;
  cooperativePrice: number;
  memberPrice?: number;
  marketPrice: number;
  unit: string;
  stock: number;
  description: string;
  brand?: string;
  discountPercent?: number;
  rating?: number;
  imageUrl?: string;
  visibleToCustomer?: boolean;
}

export interface ConsumableOrder {
  id: string;
  applicantId: string;
  applicantName: string;
  items: {
    itemId: string;
    title: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalAmount: number;
  deliveryAddress: string;
  status: 'registered' | 'prepared' | 'dispatched' | 'delivered' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface SynergyPost {
  id: string;
  authorId?: string;
  authorPseudonym: string; // Protects actual identity (e.g. "قاضی شعبه ۱۰ تجدیدنظر"، "پژوهشگر فقه اقتصادی")
  isAnonymous: boolean;
  title: string;
  content: string;
  provinceOrCity: string;
  category: 'administrative_help' | 'legal_consultation' | 'empathy_need';
  categoryTitle: string;
  isEmpathy: boolean; // دیوار همدلی
  urgency: 'عادی' | 'فوری';
  status: 'open' | 'resolved';
  createdAt: string;
  responses: {
    id: string;
    responderId?: string;
    responderPseudonym: string;
    message: string;
    isPrivate: boolean;
    contactShared?: string;
    timestamp: string;
  }[];
}

export interface MemberProductProposal {
  id: string;
  proposerId: string;
  proposerName: string;
  productName: string;
  offeredPrice: number;
  marketPrice: number;
  supplierDetails: string;
  description: string;
  status: 'under_evaluation' | 'approved_for_procurement' | 'rejected';
  createdAt: string;
}

export interface SystemSecurityConfig {
  rateLimitMaxAttempts: number;
  lockoutDurationMinutes: number;
  constantTimeDelayMs: number;
  maintenanceMode: boolean;
  autoSessionTimeoutMinutes: number;
  version?: number;
}

export * from './welfare';

/**
 * Data structures and types for the Fiqh & Judiciary Alumni Portal
 */

export type UserRole = 'admin' | 'supervisor' | 'alumni';

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
  | 'research'
  | 'rulings'
  | 'welfare'
  | 'synergy'
  | 'alumni'
  | 'users';

export type PermissionAccessLevel =
  | 'none'          // عدم دسترسی
  | 'view_all'      // فقط مشاهده (کل اطلاعات)
  | 'manage_all'    // مشاهده و ویرایش (کل اطلاعات)
  | 'view_own'      // منحصراً فقط مشاهده اطلاعات خود
  | 'manage_own';   // مشاهده و ویرایش مستقل اطلاعات خود

export type UserSectionPermissions = Partial<Record<AppSectionId, PermissionAccessLevel>>;

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
  username?: string; // نام کاربری (پیش‌فرض کد ملی)
  password?: string; // رمز عبور (پیش‌فرض شماره موبایل)
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
  showCounselingPromo?: boolean;
  counselingPromoTitle?: string;
  counselingPromoSubtitle?: string;
  showProductsMiniPromo?: boolean;
  booksShowcaseTitle?: string;
  booksShowcaseSubtitle?: string;
  welfareShowcaseTitle?: string;
  welfareShowcaseSubtitle?: string;
  multimediaShowcaseTitle?: string;
  multimediaShowcaseSubtitle?: string;
  // ویترین تالار نقد و مناظره آراء قضایی
  showRulingsShowcase?: boolean;
  rulingsShowcaseMode?: 'expanded' | 'compact';
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
}

export interface MizanDashboardConfig {
  showHeroSeal: boolean;
  showBentoGrid: boolean;
  showStoriesSlider: boolean;
  showRulingsShelf?: boolean;
  showRulingsPicks?: boolean;
  showSynergyHighlights?: boolean;
  showImpactSection: boolean;
  showPublicationsShelf?: boolean;
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
    | 'PASSWORD_CHANGED';
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  ip: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export type CartableCategory = 'career' | 'administrative' | 'educational';
export type RequestPriority = 'normal' | 'urgent' | 'instant';
export type RequestStatus = 'pending' | 'in_progress' | 'need_info' | 'rejected' | 'completed' | 'archived';

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
  priority: RequestPriority;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  messages: CartableMessage[];
  hasUnreadSupervisor?: boolean;
  hasUnreadApplicant?: boolean;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'pdf' | 'doc';
  url: string;
  size?: string;
  sessionNumber?: number;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorTitle?: string;
  category?: string; // فقه القضاء، داوری تجاری، جزا و جرم‌شناسی، مهارت‌های قضایی، حقوق خصوصی
  level: string;
  hours: number;
  capacity: number;
  enrolledCount: number;
  schedule: string;
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
  hasCertificate: boolean;
  certificateDetails?: string; // گواهی رسمی پایان دوره ممهور به مهر مرکز
  prerequisites?: string; // پیش‌نیازهای دوره
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
    fileType?: string;
    format?: string;
    description?: string;
  }>;
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
  amountPaid: number;
  trackingCode: string;
  receiptFileUrl?: string;
  receiptBankName?: string;
  receiptDate?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version?: number;
}

export interface Product {
  id: string;
  title: string;
  subtitle?: string;
  authorOrPresenter: string;
  format: 'book' | 'multimedia' | 'audio_series';
  formatTitle: string;
  price: number;
  description: string;
  pagesOrDuration: string;
  publishedYear: string;
  publisher?: string;
  isbn?: string;
  coverImage?: string;
  downloadLink?: string;
  allowedPaymentMethod?: 'both' | 'gateway_only' | 'receipt_only';
  shippingMode?: 'postal_only' | 'pickup_only' | 'both';
  shippingCostType?: 'free' | 'fixed' | 'calculated_later';
  shippingFixedFee?: number;
  pickupAddressNotice?: string;
  isAvailable: boolean;
  badgeText?: string;
  isOwned?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  version?: number;
}

export interface ProductOrder {
  id: string;
  productId: string;
  productTitle: string;
  productFormat: 'book' | 'multimedia' | 'audio_series';
  userId: string;
  userName: string;
  userPhone: string;
  userNationalId: string;
  userRoleTitle: string;
  orderedAt: string;
  amountPaid: number;
  paymentMethod: 'online_gateway' | 'bank_receipt';
  paymentStatus: 'pending_review' | 'confirmed' | 'rejected';
  trackingCode: string;
  receiptFileUrl?: string;
  receiptBankName?: string;
  receiptDate?: string;
  fulfillmentChoice?: 'postal' | 'pickup';
  shippingFee?: number;
  shippingNotice?: string;
  shippingAddress?: string;
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
  avatarUrl?: string;
  academicRank?: string;
  resumeDetails?: string[];
  isActive?: boolean;
  counselingType?: 'general' | 'specialized_career';
  fee?: number;
  subsidyNotice?: string;
}

export interface CounselingRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  userPhone?: string;
  userNationalId?: string;
  userRoleTitle?: string;
  category: CounselingCategory;
  categoryTitle: string;
  counselingType?: 'general' | 'specialized_career';
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
  createdAt: string;
}

export interface ResearchMentorship {
  id: string;
  applicantId: string;
  applicantName: string;
  thesisTitle: string;
  field: string;
  stage: 'proposal' | 'supervisor_matching' | 'scientific_critique' | 'drafting' | 'defense_prep';
  stageTitle: string;
  progressPercent: number;
  assignedSupervisor?: string;
  accommodationRequested: boolean;
  accommodationCity?: 'قم' | 'تهران' | 'مشهد';
  status: 'active' | 'under_review' | 'completed' | 'pending' | 'suspended';
  milestones: { title: string; isDone: boolean; date: string }[];
  createdAt: string;
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
  fullRulingText: string;
  status: 'pending_review' | 'selected';
  submittedById: string;
  submittedByName: string;
  likesCount: number;
  likedBy: string[];
  discussions: {
    id: string;
    authorName: string;
    authorRoleTitle: string;
    comment: string;
    timestamp: string;
  }[];
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
  category: string;
  cooperativePrice: number;
  marketPrice: number;
  unit: string;
  stock: number;
  description: string;
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
  status: 'registered' | 'prepared' | 'dispatched' | 'delivered';
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

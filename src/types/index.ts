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
  organization: string; // e.g. "قوه قضائیه - دادگستری کل استان", "پژوهشکده فقه و حقوق"
  graduationYear: string;
  avatarText: string;
  isActive: boolean;
  isLocked: boolean;
  failedAttempts: number;
  lockExpiresAt?: string;
  tokenVersion: number;
  sessions: UserSession[];
  hasAccount?: boolean; // نشان‌دهنده وجود یا عدم وجود حساب کاربری فعال
  
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
    | 'RULING_APPROVED';
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
  isAvailable: boolean;
  badgeText?: string;
  isOwned?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  version?: number;
}

export type CounselingCategory = 'individual' | 'family' | 'academic' | 'personality' | 'judicial_career';

export interface Consultant {
  id: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  experienceYears: number;
  availability: string;
}

export interface CounselingRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  category: CounselingCategory;
  categoryTitle: string;
  preferredConsultantId?: string;
  preferredConsultantName?: string;
  description: string;
  status: 'pending' | 'scheduled' | 'completed';
  scheduledDate?: string;
  meetingMode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
  counselorNotes?: string;
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
  status: 'active' | 'under_review' | 'completed';
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
  authorId: string;
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
    responderId: string;
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
}

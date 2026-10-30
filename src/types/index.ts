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

export interface User {
  id: string;
  nationalId: string; // Identifier for login
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
export type RequestStatus = 'pending' | 'in_progress' | 'need_info' | 'completed';

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
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  level: string;
  hours: number;
  capacity: number;
  enrolledCount: number;
  schedule: string;
  description: string;
  topics: string[];
  meetingLink: string;
  price: number;
  isEnrolled?: boolean;
  hasArchiveAccess?: boolean;
  archiveNotes?: string;
  status: 'enrolling' | 'ongoing' | 'completed';
}

export interface Product {
  id: string;
  title: string;
  authorOrPresenter: string;
  format: 'book' | 'multimedia' | 'audio_series';
  formatTitle: string;
  price: number;
  description: string;
  pagesOrDuration: string;
  publishedYear: string;
  isAvailable: boolean;
  badgeText?: string;
  isOwned?: boolean;
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

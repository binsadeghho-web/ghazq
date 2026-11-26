export type WelfareModuleKey =
  | 'emergency_loan'
  | 'qarzolhasaneh_fund'
  | 'accommodation'
  | 'consumables'
  | 'installment_sales'
  | 'recreation_tourism';

export type DeliveryMethodType = 'in_person' | 'post' | 'courier';

export interface WelfareModulePortalConfig {
  enabled: boolean;
  showInMobileShowcase: boolean;
  title: string;
  subtitle: string;
}

export interface WelfareAccommodationCityDetail {
  description: string;
  imageUrl?: string;
  gallery?: string[];
}

export interface WelfareContactsConfig {
  phone: string;
  extension?: string;
  messengerOrMobile?: string;
  workingHours: string;
  address?: string;
  noticeText?: string;
}

export interface WelfareFundConfig {
  fundTitle: string;
  charterText: string;
  presetTiers: number[];
  minCustomAmount: number;
  maxCustomAmount: number;
}

export interface WelfarePortalConfig {
  modulesConfig: Record<WelfareModuleKey, WelfareModulePortalConfig>;
  emergencyLoanDescription: string;
  emergencyLoanMaxAmountLabel?: string;
  contactsConfig: WelfareContactsConfig;
  accommodationCities: string[];
  accommodationCityDetails?: Record<string, WelfareAccommodationCityDetail>;
  accommodationMaxNights: number;
  accommodationMinLeadDays: number;
  fundConfig: WelfareFundConfig;
}

export type RecreationRegistrationMethod =
  | 'direct_free'
  | 'online_gateway'
  | 'bank_receipt'
  | 'both';

export interface WelfareRecreationProgram {
  id: string;
  title: string;
  programType: string;
  destination: string;
  summary: string;
  description: string;
  scheduleText: string;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  capacity: number;
  registeredCount: number;
  remainingCapacity: number | null;
  isFree: boolean;
  feeAmount: number;
  registrationMethod: RecreationRegistrationMethod;
  paymentInstructions?: string;
  cardNumber?: string;
  coverImage?: string;
  gallery?: string[];
  isActive: boolean;
  displayOrder: number;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WelfareRecreationRegistration {
  id: string;
  programId: string;
  programTitle: string;
  destination?: string;
  scheduleText?: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userNationalId?: string;
  companionsCount: number;
  seatsReserved: number;
  totalAmount: number;
  paymentMethod: 'free' | 'online_gateway' | 'bank_receipt';
  trackingCode: string;
  receiptUrl?: string;
  notes?: string;
  status: 'pending_review' | 'confirmed' | 'rejected' | 'cancelled';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
}

export interface WelfareFundMembership {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userNationalId?: string;
  monthlyFeeAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version: number;
  createdAt: string;
  updatedAt?: string;
}

export interface WelfareFundPayment {
  id: string;
  membershipId: string;
  userId: string;
  userName: string;
  amount: number;
  periodLabel: string;
  paymentMethod: string;
  trackingCode: string;
  receiptUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  version: number;
  createdAt: string;
}

export interface WelfareInstallmentPartner {
  id: string;
  name: string;
  tagline: string;
  description: string;
  maxCreditLimit: number;
  creditLimitDisplay: string;
  installmentTerms: string;
  durationMonths: number;
  logoUrl?: string;
  isActive: boolean;
  displayOrder: number;
  version: number;
  createdAt?: string;
}

export interface WelfareInstallmentRequest {
  id: string;
  partnerId: string;
  partnerName: string;
  applicantId: string;
  applicantName: string;
  applicantPhone?: string;
  requestedAmount: number;
  months: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  attachments?: Array<{ url: string; name: string; size?: number }>;
  version: number;
  createdAt: string;
}

export interface WelfareSectionConfig {
  id: string; // 'financial_loans' | 'accommodations' | 'cooperative_groceries' | 'health_insurance' | string
  title: string;
  subtitle: string;
  icon: string; // 'CreditCard' | 'Home' | 'ShoppingBag' | 'Heart' | 'Gift' | 'Building2' | 'ShieldCheck'
  badge?: string;
  isEnabled: boolean;
  displayOrder: number;
  description?: string;
}

export interface WelfareLoanTermsAndRules {
  fundName: string;
  maxLoanAmount: number;
  maxLoanAmountDisplay: string;
  loanCommissionRate: number; // درصد کارمزد صندوق قرض‌الحسنه
  maxInstallments: number; // حداکثر تعداد اقساط ماهانه
  installmentGracePeriodMonths: number; // دوره تنفس بازپرداخت اقساط
  guarantorsRequired: number; // تعداد ضامنین الزامی
  guarantorConditionText: string; // شرایط ضامن یا کسر از حقوق
  disbursementCycleDays: number; // مدت زمان واریز پس از تصویب
  eligibilityCriteria: string[]; // شرایط احراز متقاضی
  requiredDocuments: string[]; // مدارک و مستندات الزامی بارگذاری
  officialCharterText: string; // متن کامل آیین‌نامه و ضوابط مصوب هیئت امنا
  specialLoanTiers: Array<{
    id: string;
    title: string;
    amount: string;
    installments: string;
    targetGroup: string;
  }>;
}

export interface CooperativeSectionInfo {
  title: string;
  subtitle: string;
  notice: string;
}

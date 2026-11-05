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

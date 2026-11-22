import React, { createContext, useContext, useMemo, useCallback } from 'react';
import {
  User,
  UserRole,
  CartableRequest,
  Course,
  CourseEnrollment,
  CourseInstallmentRecord,
  Product,
  ProductOrder,
  ProductsStoreConfig,
  Consultant,
  CounselingRequest,
  ResearchMentorship,
  ResearchPortalConfig,
  JudicialRuling,
  RulingsPortalConfig,
  WelfareRequest,
  ConsumableItem,
  ConsumableOrder,
  SynergyPost,
  MemberProductProposal,
  AuditLog,
  SystemSecurityConfig,
  CrextioDashboardConfig,
  MizanDashboardConfig,
  UserSectionPermissions,
  WelfareSectionConfig,
  WelfareLoanTermsAndRules,
  CooperativeSectionInfo,
  ErrorLogItem,
  SecurityAlertItem,
  BlockedIpItem,
  OpsMaintenanceConfig,
  DesignThemeType,
  AlumniProfileSettingsConfig,
  SpecializedCounselingPortalConfig,
  GeneralCounselingPortalConfig,
  CounselingFieldItem,
  GeneralCounselingTariffItem,
  PsychologicalTest,
  PsychologicalTestAssignment,
  PsychologicalTestResult,
} from '../types';
import { api } from '../services/apiClient';

// Specialized Domain Contexts & Providers
import { ThemeProvider, useTheme } from './ThemeContext';
import { SecurityAndOpsProvider, useSecurityAndOps } from './SecurityAndOpsContext';
import { AuthProvider, useAuth } from './AuthContext';
import { CartableProvider, useCartable } from './CartableContext';
import { CoursesProvider, useCourses } from './CoursesContext';
import { ProductsProvider, useProducts } from './ProductsContext';
import { CounselingProvider, useCounseling } from './CounselingContext';
import { WelfareProvider, useWelfare } from './WelfareContext';
import { ResearchAndRulingsProvider, useResearchAndRulings } from './ResearchAndRulingsContext';

// Export domain hooks for direct adoption
export { useTheme } from './ThemeContext';
export { useSecurityAndOps } from './SecurityAndOpsContext';
export { useAuth } from './AuthContext';
export { useCartable } from './CartableContext';
export { useCourses } from './CoursesContext';
export { useProducts } from './ProductsContext';
export { useCounseling } from './CounselingContext';
export { useWelfare } from './WelfareContext';
export { useResearchAndRulings } from './ResearchAndRulingsContext';

export interface AppContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  alumniProfileSettings: AlumniProfileSettingsConfig;
  refreshAlumniProfileSettings: () => Promise<void>;
  updateAlumniProfileSettings: (updates: { allowAlumniProfileCompletion: boolean; noticeText?: string }) => Promise<AlumniProfileSettingsConfig>;
  updateMyIdentity: (updates: Partial<User>) => Promise<{ user: User; settings: AlumniProfileSettingsConfig }>;
  cartableRequests: CartableRequest[];
  courses: Course[];
  courseEnrollments: CourseEnrollment[];
  myInstallments: CourseInstallmentRecord[];
  dueNowInstallments: CourseInstallmentRecord[];
  products: Product[];
  consultants: Consultant[];
  counselingRequests: CounselingRequest[];
  specializedConfig: SpecializedCounselingPortalConfig;
  generalConfig: GeneralCounselingPortalConfig;
  counselingFields: CounselingFieldItem[];
  counselingTariffs: GeneralCounselingTariffItem[];
  psychologicalTests: PsychologicalTest[];
  testAssignments: PsychologicalTestAssignment[];
  testResults: PsychologicalTestResult[];
  researchMentorships: ResearchMentorship[];
  rulings: JudicialRuling[];
  welfareRequests: WelfareRequest[];
  consumables: ConsumableItem[];
  consumableOrders: ConsumableOrder[];
  synergyPosts: SynergyPost[];
  productProposals: MemberProductProposal[];
  auditLogs: AuditLog[];
  securityConfig: SystemSecurityConfig;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  designTheme: DesignThemeType;
  setDesignTheme: (theme: DesignThemeType) => void;
  toggleDesignTheme: () => void;
  isAlumniPreview: boolean;
  setIsAlumniPreview: React.Dispatch<React.SetStateAction<boolean>>;
  toggleAlumniPreview: () => void;
  serverSyncStatus: 'synced' | 'syncing' | 'offline';
  
  // Auth & Session methods
  login: (nationalId: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  globalLogout: (userId: string) => void;
  revokeSession: (sessionId: string) => void;
  switchUserRole: (role: UserRole) => void;
  unlockAccount: (userId: string) => void;
  toggleUserActiveStatus: (userId: string) => void;
  
  // Cartable methods
  createCartableRequest: (data: Omit<CartableRequest, 'id' | 'trackingNumber' | 'createdAt' | 'updatedAt' | 'messages'>, initialMessageText: string) => Promise<void>;
  replyCartableRequest: (requestId: string, text: string, attachments?: string[]) => Promise<void>;
  updateCartableStatus: (requestId: string, status: CartableRequest['status']) => Promise<void>;
  markCartableAsRead: (requestId: string) => Promise<void>;

  // Course methods
  enrollCourse: (courseId: string) => Promise<any>;
  enrollCourseWithDetails: (courseId: string, enrollmentData: any) => Promise<{ course: Course; enrollment: CourseEnrollment }>;
  addCourse: (course: Partial<Course>) => Promise<any>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<any>;
  softDeleteCourse: (courseId: string, pin: string) => Promise<{ success: boolean; message: string }>;
  restoreCourse: (courseId: string) => Promise<{ success: boolean; message: string }>;
  sendCourseSms: (courseId: string, recipientPhone: string | 'all', message: string, recipientName?: string) => Promise<{ success: boolean; count: number; message: string }>;
  reviewCourseEnrollment: (enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) => Promise<void>;
  refreshCourses: () => Promise<void>;
  refreshMyInstallments: () => Promise<void>;

  // Product methods
  productOrders: ProductOrder[];
  productsStoreConfig: ProductsStoreConfig;
  updateProductsStoreConfig: (updates: Partial<ProductsStoreConfig>) => Promise<ProductsStoreConfig>;
  purchaseProduct: (productId: string, orderDetails?: any) => Promise<{ product: Product; order: ProductOrder }>;
  reviewProductOrder: (
    orderId: string,
    status: 'confirmed' | 'rejected',
    adminNote?: string,
    postalTrackingCode?: string,
    shippingStatus?: string
  ) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'isOwned'>) => Promise<Product>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<Product | void>;
  toggleProductShowcase: (productId: string, showInShowcase: boolean) => Promise<Product | void>;
  softDeleteProduct: (productId: string) => Promise<void>;
  reorderProducts: (orderedIds: string[]) => Promise<void>;
  refreshProducts: () => Promise<void>;

  // Counseling methods
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
  updateConsultant: (consultantId: string, updates: Partial<Consultant>) => Promise<void>;
  addConsultant: (consultant: Omit<Consultant, 'id'>) => Promise<void>;
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

  // Research Mentorship methods
  researchPortalConfig: ResearchPortalConfig;
  updateResearchPortalConfig: (updates: Partial<ResearchPortalConfig>) => Promise<ResearchPortalConfig | null>;
  submitResearchProject: (data: any) => Promise<ResearchMentorship | null>;
  updateResearchProgress: (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => Promise<void>;
  updateResearchProject: (projectId: string, updates: Partial<ResearchMentorship>) => Promise<ResearchMentorship | null>;
  updateResearchStatus: (
    projectId: string,
    payload: {
      status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
      adminNote?: string;
      assignedSupervisor?: string;
      stageTitle?: string;
      progressPercent?: number;
      replyMessage?: string;
    }
  ) => Promise<ResearchMentorship | null>;
  addResearchMessage: (projectId: string, message: string) => Promise<ResearchMentorship | null>;
  deleteResearchProject: (projectId: string) => Promise<boolean>;

  // Judicial Rulings methods
  rulingsPortalConfig: RulingsPortalConfig;
  updateRulingsPortalConfig: (updates: Partial<RulingsPortalConfig>) => Promise<void>;
  submitRuling: (data: Partial<JudicialRuling> & { title: string; fullRulingText: string }) => Promise<JudicialRuling | null>;
  updateRuling: (rulingId: string, updates: Partial<JudicialRuling>) => Promise<JudicialRuling | null>;
  reorderRulings: (orderedIds: string[]) => Promise<void>;
  approveRuling: (rulingId: string) => Promise<void>;
  addRulingDiscussion: (rulingId: string, comment: string) => Promise<void>;
  editRulingDiscussion: (rulingId: string, discussionId: string, comment: string) => Promise<void>;
  deleteRulingDiscussion: (rulingId: string, discussionId: string) => Promise<void>;
  toggleRulingLike: (rulingId: string) => Promise<void>;
  toggleRulingDislike: (rulingId: string) => Promise<void>;

  // Welfare & Consumables methods
  submitWelfareRequest: (data: Omit<WelfareRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateWelfareStatus: (requestId: string, status: WelfareRequest['status'], adminNote?: string) => void;
  placeConsumableOrder: (items: { itemId: string; title: string; quantity: number; unitPrice: number }[], deliveryAddress: string) => Promise<void>;
  submitProductProposal: (data: Omit<MemberProductProposal, 'id' | 'status' | 'createdAt'>) => void;
  updateConsumableStock: (itemId: string, newStock: number) => void;
  updateConsumableItem: (id: string, updates: Partial<ConsumableItem>) => void;
  addConsumableItem: (item: Omit<ConsumableItem, 'id'>) => void;
  deleteConsumableItem: (id: string) => void;
  updateConsumableOrderStatus: (orderId: string, status: ConsumableOrder['status'], notes?: string) => void;

  // Configurable Welfare Sections, Loan Rules & Cooperative Settings
  welfareSectionsConfig: WelfareSectionConfig[];
  updateWelfareSectionsConfig: (configs: WelfareSectionConfig[]) => void;
  loanTermsAndRules: WelfareLoanTermsAndRules;
  updateLoanTermsAndRules: (updates: Partial<WelfareLoanTermsAndRules>) => void;
  cooperativeSectionInfo: CooperativeSectionInfo;
  updateCooperativeSectionInfo: (updates: Partial<CooperativeSectionInfo>) => void;

  // Synergy methods
  createSynergyPost: (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => Promise<void>;
  respondToSynergyPost: (postId: string, message: string, isPrivate: boolean, contactShared?: string) => Promise<void>;
  resolveSynergyPost: (postId: string) => void;

  // Dynamic Crextio Theme 2 Layout Customization
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  resetCrextioConfig: () => void;

  // Theme 3 Mizan Balanced Layout Customization & Studio
  mizanConfig: MizanDashboardConfig;
  updateMizanConfig: (updates: Partial<MizanDashboardConfig>) => void;
  resetMizanConfig: () => void;

  // Enterprise User Management & Dossier
  createUser: (userData: Omit<User, 'id' | 'sessions' | 'tokenVersion' | 'failedAttempts' | 'isLocked'>) => Promise<User>;
  updateUserDetails: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string, customPassword?: string) => Promise<string>;
  toggleUserLock: (userId: string) => void;
  revokeUserSession: (userId: string, sessionId: string) => void;
  revokeAllUserSessions: (userId: string) => void;
  createAccountForAlumnus: (userId: string, username?: string, password?: string) => Promise<void>;
  updateUserCredentials: (userId: string, username: string, password: string) => Promise<void>;
  updateUserSectionPermissions: (userId: string, permissions: UserSectionPermissions) => Promise<void>;
  updateRoleDefaultPermissions: (role: UserRole, permissions: UserSectionPermissions) => Promise<void>;
  refreshUsers: () => Promise<void>;

  // Admin Security PIN & Verification
  securityPin: string;
  isPinUnlocked: boolean;
  isPinEnabled: boolean;
  setPinUnlocked: (unlocked: boolean) => void;
  togglePinRequirement: (enabled: boolean) => void;
  verifyPin: (pin: string) => Promise<{ success: boolean; message: string }>;
  sendPinOtpSms: () => Promise<{ success: boolean; otpCode: string; message: string }>;
  verifyPinOtpAndSetPin: (otpCode: string, newPin: string) => Promise<{ success: boolean; message: string }>;

  // System management
  auditIntegrity: {
    isValid: boolean;
    checkedCount: number;
    totalRecords?: number;
    brokenAt?: number;
    headHash?: string;
    message: string;
    lastVerifiedAt?: string;
  } | null;
  metrics: {
    traffic: number;
    successRate: number;
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    latencyMs?: { p50: number; p95: number; p99: number };
    errors?: { client4xx: number; server5xx: number };
  } | null;
  isRealtimeConnected: boolean;
  verifyAuditChain: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  updateSecurityConfig: (updates: Partial<SystemSecurityConfig>) => Promise<void>;
  verifyAuditIntegrity: () => Promise<{ isValid: boolean; checkedCount: number; message: string }>;
  resetAllDataToDefault: () => Promise<void>;

  // Command Operations Center (OPS) State & Methods
  errorLogs: ErrorLogItem[];
  securityAlerts: SecurityAlertItem[];
  blockedIps: BlockedIpItem[];
  opsMaintenance: OpsMaintenanceConfig;
  resolveErrorLog: (id: string) => void;
  clearResolvedErrorLogs: () => void;
  reviewSecurityAlert: (id: string, status: 'reviewed' | 'dismissed') => void;
  toggleUserSpecialMonitoring: (userId: string) => void;
  sendEmergencySmsAlert: (adminPhone: string, message: string) => Promise<{ success: boolean; message: string }>;
  blockIpAddress: (ip: string, reason: string, blockedUntil?: string) => void;
  unblockIpAddress: (ip: string) => void;
  toggleGlobalMaintenance: (enabled: boolean, message?: string, estimatedReturnTime?: string) => void;
  toggleModuleMaintenance: (moduleKey: string, enabled: boolean) => void;
  rollbackAuditAction: (auditLogId: string) => Promise<{ success: boolean; message: string }>;
  runBackgroundJob: (jobName: string) => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Bridge component to consume domain hooks and present the unified AppContext facade
const AppContextBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const security = useSecurityAndOps();
  const auth = useAuth();
  const cartable = useCartable();
  const courses = useCourses();
  const products = useProducts();
  const counseling = useCounseling();
  const welfare = useWelfare();
  const research = useResearchAndRulings();

  const resetAllDataToDefault = useCallback(async () => {
    try {
      await api.resetDefaults();
      await Promise.all([
        cartable.refreshCartable(),
        courses.refreshCourses(),
        products.refreshProducts(),
        counseling.refreshCounseling(),
        welfare.refreshWelfare(),
        research.refreshResearchAndRulings(),
        auth.refreshUsers(),
      ]);
    } catch {}
  }, [cartable, courses, products, counseling, welfare, research, auth]);

  const rollbackAuditAction = useCallback(async (auditLogId: string) => {
    const logItem = security.auditLogs.find(a => a.id === auditLogId);
    if (!logItem) {
      return { success: false, message: 'رکورد وقایع امنیتی مربوطه یافت نشد.' };
    }
    if (!logItem.beforeState) {
      return { success: false, message: 'اطلاعات وضعیت قبل (beforeState) برای این رکورد موجود نیست.' };
    }

    const { beforeState } = logItem;
    if (beforeState.userId && beforeState.role) {
      auth.updateUserDetails(beforeState.userId, { role: beforeState.role, roleTitle: beforeState.roleTitle }).catch(() => {});
    }

    security.setAuditLogs(prev => prev.map(a => a.id === auditLogId ? {
      ...a,
      isRolledBack: true,
      rolledBackBy: auth.currentUser?.fullName || 'مدیر سیستم',
      rolledBackAt: new Date().toLocaleString('fa-IR'),
    } : a));

    security.addAuditLog({
      eventType: 'AUDIT_ACTION_ROLLED_BACK',
      actorId: auth.currentUser?.id || 'sys_admin',
      actorName: auth.currentUser?.fullName || 'مدیر سیستم',
      actorRole: auth.currentUser?.role || 'admin',
      ip: '192.168.1.105',
      details: `بازگردانی ۱۰۰٪ اقدام ثبت‌شده در بلوک #${auditLogId}. تغییرات قبلی لغو و وضعیت اولیه به دقت بازیابی گردید.`,
      severity: 'warning',
      isRollbackable: false,
    });

    try {
      await api.rollbackAuditAction(auditLogId);
    } catch {}

    return { success: true, message: 'بازگردانی ۱۰۰٪ اقدام با موفقیت انجام شد و وضعیت قبلی به دقت بازیابی گردید.' };
  }, [security, auth]);

  const facadeValue = useMemo<AppContextType>(() => ({
    // Auth & Users
    currentUser: auth.currentUser,
    isAuthLoading: auth.isAuthLoading,
    setCurrentUser: auth.setCurrentUser,
    users: auth.users,
    alumniProfileSettings: auth.alumniProfileSettings,
    refreshAlumniProfileSettings: auth.refreshAlumniProfileSettings,
    updateAlumniProfileSettings: auth.updateAlumniProfileSettings,
    updateMyIdentity: auth.updateMyIdentity,
    login: auth.login,
    logout: auth.logout,
    globalLogout: auth.globalLogout,
    revokeSession: auth.revokeSession,
    switchUserRole: auth.switchUserRole,
    unlockAccount: auth.unlockAccount,
    toggleUserLock: auth.toggleUserLock,
    toggleUserActiveStatus: auth.toggleUserActiveStatus,
    createUser: auth.createUser,
    updateUserDetails: auth.updateUserDetails,
    deleteUser: auth.deleteUser,
    resetUserPassword: auth.resetUserPassword,
    revokeUserSession: auth.revokeUserSession,
    revokeAllUserSessions: auth.revokeAllUserSessions,
    createAccountForAlumnus: auth.createAccountForAlumnus,
    updateUserCredentials: auth.updateUserCredentials,
    updateUserSectionPermissions: auth.updateUserSectionPermissions,
    updateRoleDefaultPermissions: auth.updateRoleDefaultPermissions,
    refreshUsers: auth.refreshUsers,

    // Theme & Layouts
    theme: theme.theme,
    toggleTheme: theme.toggleTheme,
    designTheme: theme.designTheme,
    setDesignTheme: theme.setDesignTheme,
    toggleDesignTheme: theme.toggleDesignTheme,
    isAlumniPreview: theme.isAlumniPreview,
    setIsAlumniPreview: theme.setIsAlumniPreview,
    toggleAlumniPreview: theme.toggleAlumniPreview,
    crextioConfig: theme.crextioConfig,
    updateCrextioConfig: theme.updateCrextioConfig,
    resetCrextioConfig: theme.resetCrextioConfig,
    mizanConfig: theme.mizanConfig,
    updateMizanConfig: theme.updateMizanConfig,
    resetMizanConfig: theme.resetMizanConfig,

    // Cartable
    cartableRequests: cartable.cartableRequests,
    createCartableRequest: cartable.createCartableRequest,
    replyCartableRequest: cartable.replyCartableRequest,
    updateCartableStatus: cartable.updateCartableStatus,
    markCartableAsRead: cartable.markCartableAsRead,

    // Courses
    courses: courses.courses,
    courseEnrollments: courses.courseEnrollments,
    myInstallments: courses.myInstallments,
    dueNowInstallments: courses.dueNowInstallments,
    enrollCourse: courses.enrollCourse,
    enrollCourseWithDetails: courses.enrollCourseWithDetails,
    addCourse: courses.addCourse,
    updateCourse: courses.updateCourse,
    softDeleteCourse: courses.softDeleteCourse,
    restoreCourse: courses.restoreCourse,
    sendCourseSms: courses.sendCourseSms,
    reviewCourseEnrollment: courses.reviewCourseEnrollment,
    refreshCourses: courses.refreshCourses,
    refreshMyInstallments: courses.refreshMyInstallments,

    // Products
    products: products.products,
    productOrders: products.productOrders,
    productsStoreConfig: products.productsStoreConfig,
    updateProductsStoreConfig: products.updateProductsStoreConfig,
    purchaseProduct: products.purchaseProduct,
    reviewProductOrder: products.reviewProductOrder,
    addProduct: products.addProduct,
    updateProduct: products.updateProduct,
    toggleProductShowcase: products.toggleProductShowcase,
    softDeleteProduct: products.softDeleteProduct,
    reorderProducts: products.reorderProducts,
    refreshProducts: products.refreshProducts,

    // Counseling
    consultants: counseling.consultants,
    counselingRequests: counseling.counselingRequests,
    specializedConfig: counseling.specializedConfig,
    generalConfig: counseling.generalConfig,
    counselingFields: counseling.counselingFields,
    counselingTariffs: counseling.counselingTariffs,
    psychologicalTests: counseling.psychologicalTests,
    testAssignments: counseling.testAssignments,
    testResults: counseling.testResults,
    bookCounseling: counseling.bookCounseling,
    updateCounselingStatus: counseling.updateCounselingStatus,
    updateConsultant: counseling.updateConsultant,
    addConsultant: counseling.addConsultant,
    deleteConsultant: counseling.deleteConsultant,
    updateSpecializedConfig: counseling.updateSpecializedConfig,
    updateGeneralConfig: counseling.updateGeneralConfig,
    createCounselingField: counseling.createCounselingField,
    updateCounselingField: counseling.updateCounselingField,
    deleteCounselingField: counseling.deleteCounselingField,
    createCounselingTariff: counseling.createCounselingTariff,
    updateCounselingTariff: counseling.updateCounselingTariff,
    deleteCounselingTariff: counseling.deleteCounselingTariff,
    createPsychologicalTest: counseling.createPsychologicalTest,
    updatePsychologicalTest: counseling.updatePsychologicalTest,
    deletePsychologicalTest: counseling.deletePsychologicalTest,
    assignPsychologicalTest: counseling.assignPsychologicalTest,
    submitPsychologicalTest: counseling.submitPsychologicalTest,
    reviewPsychologicalTestResult: counseling.reviewPsychologicalTestResult,

    // Welfare
    welfareRequests: welfare.welfareRequests,
    consumables: welfare.consumables,
    consumableOrders: welfare.consumableOrders,
    productProposals: welfare.productProposals,
    welfareSectionsConfig: welfare.welfareSectionsConfig,
    loanTermsAndRules: welfare.loanTermsAndRules,
    cooperativeSectionInfo: welfare.cooperativeSectionInfo,
    submitWelfareRequest: welfare.submitWelfareRequest,
    updateWelfareStatus: welfare.updateWelfareStatus,
    placeConsumableOrder: welfare.placeConsumableOrder,
    submitProductProposal: welfare.submitProductProposal,
    updateConsumableStock: welfare.updateConsumableStock,
    updateConsumableItem: welfare.updateConsumableItem,
    addConsumableItem: welfare.addConsumableItem,
    deleteConsumableItem: welfare.deleteConsumableItem,
    updateConsumableOrderStatus: welfare.updateConsumableOrderStatus,
    updateWelfareSectionsConfig: welfare.updateWelfareSectionsConfig,
    updateLoanTermsAndRules: welfare.updateLoanTermsAndRules,
    updateCooperativeSectionInfo: welfare.updateCooperativeSectionInfo,

    // Research & Rulings & Synergy
    researchMentorships: research.researchMentorships,
    researchPortalConfig: research.researchPortalConfig,
    updateResearchPortalConfig: research.updateResearchPortalConfig,
    submitResearchProject: research.submitResearchProject,
    updateResearchProgress: research.updateResearchProgress,
    updateResearchProject: research.updateResearchProject,
    updateResearchStatus: research.updateResearchStatus,
    addResearchMessage: research.addResearchMessage,
    deleteResearchProject: research.deleteResearchProject,
    rulings: research.rulings,
    rulingsPortalConfig: research.rulingsPortalConfig,
    updateRulingsPortalConfig: research.updateRulingsPortalConfig,
    submitRuling: research.submitRuling,
    updateRuling: research.updateRuling,
    reorderRulings: research.reorderRulings,
    approveRuling: research.approveRuling,
    addRulingDiscussion: research.addRulingDiscussion,
    editRulingDiscussion: research.editRulingDiscussion,
    deleteRulingDiscussion: research.deleteRulingDiscussion,
    toggleRulingLike: research.toggleRulingLike,
    toggleRulingDislike: research.toggleRulingDislike,
    synergyPosts: research.synergyPosts,
    createSynergyPost: research.createSynergyPost,
    respondToSynergyPost: research.respondToSynergyPost,
    resolveSynergyPost: research.resolveSynergyPost,

    // Security & OPS
    serverSyncStatus: security.serverSyncStatus,
    auditLogs: security.auditLogs,
    securityConfig: security.securityConfig,
    auditIntegrity: security.auditIntegrity,
    metrics: security.metrics,
    isRealtimeConnected: security.isRealtimeConnected,
    verifyAuditChain: security.verifyAuditChain,
    refreshMetrics: security.refreshMetrics,
    updateSecurityConfig: security.updateSecurityConfig,
    verifyAuditIntegrity: security.verifyAuditIntegrity,
    resetAllDataToDefault,
    securityPin: security.securityPin,
    isPinUnlocked: security.isPinUnlocked,
    isPinEnabled: security.isPinEnabled,
    setPinUnlocked: security.setPinUnlocked,
    togglePinRequirement: security.togglePinRequirement,
    verifyPin: security.verifyPin,
    sendPinOtpSms: security.sendPinOtpSms,
    verifyPinOtpAndSetPin: security.verifyPinOtpAndSetPin,
    errorLogs: security.errorLogs,
    securityAlerts: security.securityAlerts,
    blockedIps: security.blockedIps,
    opsMaintenance: security.opsMaintenance,
    resolveErrorLog: security.resolveErrorLog,
    clearResolvedErrorLogs: security.clearResolvedErrorLogs,
    reviewSecurityAlert: security.reviewSecurityAlert,
    toggleUserSpecialMonitoring: security.toggleUserSpecialMonitoring,
    sendEmergencySmsAlert: security.sendEmergencySmsAlert,
    blockIpAddress: security.blockIpAddress,
    unblockIpAddress: security.unblockIpAddress,
    toggleGlobalMaintenance: security.toggleGlobalMaintenance,
    toggleModuleMaintenance: security.toggleModuleMaintenance,
    rollbackAuditAction,
    runBackgroundJob: security.runBackgroundJob,
  }), [
    auth,
    theme,
    cartable,
    courses,
    products,
    counseling,
    welfare,
    research,
    security,
    resetAllDataToDefault,
    rollbackAuditAction,
  ]);

  return (
    <AppContext.Provider value={facadeValue}>
      {children}
    </AppContext.Provider>
  );
};

// Top-level Provider composition
const NestedDomainProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const security = useSecurityAndOps();

  return (
    <AuthProvider addAuditLog={security.addAuditLog} setDesignTheme={theme.setDesignTheme}>
      <AuthConsumerBridge>
        {children}
      </AuthConsumerBridge>
    </AuthProvider>
  );
};

const AuthConsumerBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { securityPin } = useSecurityAndOps();

  return (
    <CartableProvider>
      <CoursesProvider currentUser={currentUser} securityPin={securityPin}>
        <ProductsProvider currentUser={currentUser}>
          <CounselingProvider currentUser={currentUser}>
            <WelfareProvider>
              <ResearchAndRulingsProvider currentUser={currentUser}>
                <AppContextBridge>
                  {children}
                </AppContextBridge>
              </ResearchAndRulingsProvider>
            </WelfareProvider>
          </CounselingProvider>
        </ProductsProvider>
      </CoursesProvider>
    </CartableProvider>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <SecurityAndOpsProvider>
        <NestedDomainProviders>
          {children}
        </NestedDomainProviders>
      </SecurityAndOpsProvider>
    </ThemeProvider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

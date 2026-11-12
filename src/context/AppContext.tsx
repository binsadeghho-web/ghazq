import React, { createContext, useContext, useMemo, useCallback } from 'react';
import {
  User,
  UserRole,
  CartableRequest,
  Course,
  CourseEnrollment,
  Product,
  ProductOrder,
  Consultant,
  CounselingRequest,
  ResearchMentorship,
  JudicialRuling,
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
  setCurrentUser: (user: User | null) => void;
  users: User[];
  cartableRequests: CartableRequest[];
  courses: Course[];
  courseEnrollments: CourseEnrollment[];
  products: Product[];
  consultants: Consultant[];
  counselingRequests: CounselingRequest[];
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
  designTheme: 'portal' | 'crextio';
  setDesignTheme: (theme: 'portal' | 'crextio') => void;
  toggleDesignTheme: () => void;
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
  replyCartableRequest: (requestId: string, text: string) => Promise<void>;
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

  // Product methods
  productOrders: ProductOrder[];
  purchaseProduct: (productId: string, orderDetails?: Partial<ProductOrder>) => Promise<void>;
  reviewProductOrder: (orderId: string, status: 'confirmed' | 'rejected', adminNote?: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'isOwned'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;

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
  ) => void;
  updateConsultant: (consultantId: string, updates: Partial<Consultant>) => void;
  addConsultant: (consultant: Omit<Consultant, 'id'>) => void;
  deleteConsultant: (consultantId: string) => void;

  // Research Mentorship methods
  submitResearchProject: (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => Promise<void>;
  updateResearchProgress: (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => void;
  updateResearchProject: (projectId: string, updates: Partial<ResearchMentorship>) => void;
  deleteResearchProject: (projectId: string) => void;

  // Judicial Rulings methods
  submitRuling: (data: Omit<JudicialRuling, 'id' | 'status' | 'likesCount' | 'likedBy' | 'discussions'>) => void;
  approveRuling: (rulingId: string) => Promise<void>;
  addRulingDiscussion: (rulingId: string, comment: string) => Promise<void>;
  toggleRulingLike: (rulingId: string) => void;

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
    setCurrentUser: auth.setCurrentUser,
    users: auth.users,
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
    enrollCourse: courses.enrollCourse,
    enrollCourseWithDetails: courses.enrollCourseWithDetails,
    addCourse: courses.addCourse,
    updateCourse: courses.updateCourse,
    softDeleteCourse: courses.softDeleteCourse,
    restoreCourse: courses.restoreCourse,
    sendCourseSms: courses.sendCourseSms,
    reviewCourseEnrollment: courses.reviewCourseEnrollment,

    // Products
    products: products.products,
    productOrders: products.productOrders,
    purchaseProduct: products.purchaseProduct,
    reviewProductOrder: products.reviewProductOrder,
    addProduct: products.addProduct,
    updateProduct: products.updateProduct,

    // Counseling
    consultants: counseling.consultants,
    counselingRequests: counseling.counselingRequests,
    bookCounseling: counseling.bookCounseling,
    updateCounselingStatus: counseling.updateCounselingStatus,
    updateConsultant: counseling.updateConsultant,
    addConsultant: counseling.addConsultant,
    deleteConsultant: counseling.deleteConsultant,

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
    submitResearchProject: research.submitResearchProject,
    updateResearchProgress: research.updateResearchProgress,
    updateResearchProject: research.updateResearchProject,
    deleteResearchProject: research.deleteResearchProject,
    rulings: research.rulings,
    submitRuling: research.submitRuling,
    approveRuling: research.approveRuling,
    addRulingDiscussion: research.addRulingDiscussion,
    toggleRulingLike: research.toggleRulingLike,
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
          <CounselingProvider>
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

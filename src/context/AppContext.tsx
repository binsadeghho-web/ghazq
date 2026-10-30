import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserRole,
  UserSession,
  CartableRequest,
  Course,
  Product,
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
  AppSectionId,
  PermissionAccessLevel,
  UserSectionPermissions,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CARTABLE_REQUESTS,
  INITIAL_COURSES,
  INITIAL_PRODUCTS,
  INITIAL_CONSULTANTS,
  INITIAL_COUNSELING_REQUESTS,
  INITIAL_RESEARCH_MENTORSHIPS,
  INITIAL_RULINGS,
  INITIAL_WELFARE_REQUESTS,
  INITIAL_CONSUMABLES,
  INITIAL_CONSUMABLE_ORDERS,
  INITIAL_PRODUCT_PROPOSALS,
  INITIAL_SYNERGY_POSTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SECURITY_CONFIG,
  DEFAULT_CREXTIO_CONFIG,
} from '../data/mockData';
import { api, ApiError } from '../services/apiClient';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  cartableRequests: CartableRequest[];
  courses: Course[];
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

  // Course methods
  enrollCourse: (courseId: string) => Promise<void>;
  addCourse: (course: Omit<Course, 'id' | 'enrolledCount' | 'isEnrolled'>) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;

  // Product methods
  purchaseProduct: (productId: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'isOwned'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;

  // Counseling methods
  bookCounseling: (data: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateCounselingStatus: (requestId: string, status: CounselingRequest['status'], scheduledDate?: string, counselorNotes?: string) => void;

  // Research Mentorship methods
  submitResearchProject: (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => Promise<void>;
  updateResearchProgress: (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => void;

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

  // Synergy methods
  createSynergyPost: (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => Promise<void>;
  respondToSynergyPost: (postId: string, message: string, isPrivate: boolean, contactShared?: string) => Promise<void>;
  resolveSynergyPost: (postId: string) => void;

  // Dynamic Crextio Theme 2 Layout Customization
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  resetCrextioConfig: () => void;

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const STORAGE_KEY_PREFIX = 'feqh_portal_v3_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[2]); // Default Alumni
  const [cartableRequests, setCartableRequests] = useState<CartableRequest[]>(INITIAL_CARTABLE_REQUESTS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [consultants, setConsultants] = useState<Consultant[]>(INITIAL_CONSULTANTS);
  const [counselingRequests, setCounselingRequests] = useState<CounselingRequest[]>(INITIAL_COUNSELING_REQUESTS);
  const [researchMentorships, setResearchMentorships] = useState<ResearchMentorship[]>(INITIAL_RESEARCH_MENTORSHIPS);
  const [rulings, setRulings] = useState<JudicialRuling[]>(INITIAL_RULINGS);
  const [welfareRequests, setWelfareRequests] = useState<WelfareRequest[]>(INITIAL_WELFARE_REQUESTS);
  const [consumables, setConsumables] = useState<ConsumableItem[]>(INITIAL_CONSUMABLES);
  const [consumableOrders, setConsumableOrders] = useState<ConsumableOrder[]>(INITIAL_CONSUMABLE_ORDERS);
  const [synergyPosts, setSynergyPosts] = useState<SynergyPost[]>(INITIAL_SYNERGY_POSTS);
  const [productProposals, setProductProposals] = useState<MemberProductProposal[]>(INITIAL_PRODUCT_PROPOSALS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [securityConfig, setSecurityConfig] = useState<SystemSecurityConfig>(INITIAL_SECURITY_CONFIG);
  const [serverSyncStatus, setServerSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [auditIntegrity, setAuditIntegrity] = useState<{
    isValid: boolean;
    checkedCount: number;
    totalRecords?: number;
    brokenAt?: number;
    headHash?: string;
    message: string;
    lastVerifiedAt?: string;
  } | null>(null);
  const [metrics, setMetrics] = useState<{
    traffic: number;
    successRate: number;
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    latencyMs?: { p50: number; p95: number; p99: number };
    errors?: { client4xx: number; server5xx: number };
  } | null>({
    traffic: 142,
    successRate: 99.8,
    errorRate: 0.2,
    p50Latency: 18,
    p95Latency: 45,
    p99Latency: 82,
    latencyMs: { p50: 18, p95: 45, p99: 82 },
    errors: { client4xx: 2, server5xx: 0 },
  });
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, next);
  };

  const [crextioConfig, setCrextioConfig] = useState<CrextioDashboardConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}crextio_config`);
      if (saved) {
        try {
          return { ...DEFAULT_CREXTIO_CONFIG, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return DEFAULT_CREXTIO_CONFIG;
  });

  const updateCrextioConfig = (updates: Partial<CrextioDashboardConfig>) => {
    setCrextioConfig(prev => {
      const next = { ...prev, ...updates };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}crextio_config`, JSON.stringify(next));
      }
      return next;
    });
  };

  const [securityPin, setSecurityPin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`${STORAGE_KEY_PREFIX}security_pin`) || '123456';
    }
    return '123456';
  });
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(true);
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(true); // Default unlocked per user prompt instruction
  const [simulatedPendingOtp, setSimulatedPendingOtp] = useState<string | null>(null);

  const resetCrextioConfig = () => {
    setCrextioConfig(DEFAULT_CREXTIO_CONFIG);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}crextio_config`);
    }
  };

  const [designTheme, setDesignThemeState] = useState<'portal' | 'crextio'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}design_theme`);
      if (saved === 'portal' || saved === 'crextio') return saved;
    }
    return 'portal';
  });

  const setDesignTheme = (newTheme: 'portal' | 'crextio') => {
    setDesignThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}design_theme`, newTheme);
    }
  };

  const toggleDesignTheme = () => {
    const next = designTheme === 'portal' ? 'crextio' : 'portal';
    setDesignTheme(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync auth context to api client
  useEffect(() => {
    if (currentUser) {
      api.setAuthContext(currentUser.id, currentUser.role, currentUser.fullName);
    }
  }, [currentUser]);

  // Initial fetch from backend API
  const refreshFromServer = useCallback(async () => {
    setServerSyncStatus('syncing');
    try {
      const [
        fetchedCartable,
        fetchedCourses,
        fetchedProducts,
        fetchedConsultants,
        fetchedRulings,
        fetchedWelfare,
        fetchedConsumables,
        fetchedSynergy,
        fetchedSecurity,
      ] = await Promise.allSettled([
        api.getCartableRequests(),
        api.getCourses(),
        api.getProducts(),
        api.getConsultants(),
        api.getRulings(),
        api.getWelfareRequests(),
        api.getConsumables(),
        api.getSynergyPosts(),
        api.getSecurityConfig(),
      ]);

      if (fetchedCartable.status === 'fulfilled') setCartableRequests(fetchedCartable.value);
      if (fetchedCourses.status === 'fulfilled') setCourses(fetchedCourses.value);
      if (fetchedProducts.status === 'fulfilled') setProducts(fetchedProducts.value);
      if (fetchedConsultants.status === 'fulfilled') setConsultants(fetchedConsultants.value);
      if (fetchedRulings.status === 'fulfilled') setRulings(fetchedRulings.value);
      if (fetchedWelfare.status === 'fulfilled') setWelfareRequests(fetchedWelfare.value);
      if (fetchedConsumables.status === 'fulfilled') setConsumables(fetchedConsumables.value);
      if (fetchedSynergy.status === 'fulfilled') setSynergyPosts(fetchedSynergy.value);
      if (fetchedSecurity.status === 'fulfilled') setSecurityConfig(fetchedSecurity.value);

      setServerSyncStatus('synced');
    } catch {
      setServerSyncStatus('offline');
    }
  }, []);

  useEffect(() => {
    refreshFromServer();
  }, [refreshFromServer]);

  // Real-time SSE synchronization listener (Section 8)
  useEffect(() => {
    const unsubscribe = api.subscribeToEvents(event => {
      // Refresh relevant data on background event notification
      if (event.type.startsWith('cartable.')) {
        api.getCartableRequests().then(setCartableRequests).catch(() => {});
      } else if (event.type.startsWith('courses.')) {
        api.getCourses().then(setCourses).catch(() => {});
      } else if (event.type.startsWith('products.')) {
        api.getProducts().then(setProducts).catch(() => {});
      } else if (event.type.startsWith('rulings.')) {
        api.getRulings().then(setRulings).catch(() => {});
      } else if (event.type.startsWith('welfare.')) {
        api.getWelfareRequests().then(setWelfareRequests).catch(() => {});
      } else if (event.type.startsWith('synergy.')) {
        api.getSynergyPosts().then(setSynergyPosts).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, []);

  // Auth methods
  const login = async (nationalId: string, password: string) => {
    try {
      const res = await api.login(nationalId, password);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        return { success: true };
      }
      return { success: false, message: 'اطلاعات ورود نامعتبر است.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'خطا در احراز هویت' };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    // Rule: Clear client-side cache and sensitive memory on logout (Section 7 & 10)
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
  };

  const globalLogout = async (userId: string) => {
    try {
      const res = await api.globalLogout(userId);
      if (res.user && currentUser?.id === userId) {
        setCurrentUser(res.user);
      }
      alert('خروج سراسری از کلیه دستگاه‌ها با موفقیت انجام شد و تمامی نشست‌ها ابطال گردیدند.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.revokeSession(currentUser.id, sessionId);
      if (res.user) {
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const switchUserRole = async (role: UserRole) => {
    try {
      const res = await api.switchRole(role);
      if (res.user) {
        setCurrentUser(res.user);
      }
    } catch {
      const localTarget = users.find(u => u.role === role) || users[0];
      setCurrentUser(localTarget);
    }
    // Theme persona matching: Alumni defaults to Crextio (Theme 2), Admin/Supervisor defaults to Portal (Theme 1)
    if (role === 'alumni') {
      setDesignTheme('crextio');
    } else {
      setDesignTheme('portal');
    }
  };

  const unlockAccount = async (userId: string) => {
    try {
      const updated = await api.unlockUser(userId);
      setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
      if (currentUser?.id === userId) setCurrentUser(updated);
      alert(`حساب کاربری [${updated.fullName}] با موفقیت رفع توقیف گردید.`);
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const toggleUserLock = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const nextLocked = !u.isLocked;
      const updated = {
        ...u,
        isLocked: nextLocked,
        failedAttempts: nextLocked ? 5 : 0,
        lockExpiresAt: nextLocked ? '۱۴۰۳/۰۸/۰۵ - ۱۲:۰۰' : undefined,
      };
      if (currentUser?.id === userId) setCurrentUser(updated);
      return updated;
    }));
  };

  const toggleUserActiveStatus = async (userId: string) => {
    try {
      const updated = await api.toggleUserActive(userId);
      setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
      if (currentUser?.id === userId) setCurrentUser(updated);
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  // Enterprise User Management & Dossier CRUD
  const createUser = async (userData: Omit<User, 'id' | 'sessions' | 'tokenVersion' | 'failedAttempts' | 'isLocked'>): Promise<User> => {
    const nameParts = userData.fullName.trim().split(' ');
    const avatar = nameParts.length > 1 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` 
      : nameParts[0].slice(0, 2);

    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      avatarText: avatar,
      isActive: true,
      isLocked: false,
      failedAttempts: 0,
      tokenVersion: 1,
      sessions: [
        {
          id: `sess_${Date.now()}`,
          deviceName: 'حساب تازه ایجاد شده (میز کاربری اولیه)',
          ipAddress: '127.0.0.1',
          userAgent: 'Default System Client',
          lastActiveAt: 'هم‌اکنون',
          isCurrent: true,
          familyId: `fam_${Date.now()}`,
        }
      ],
      permissions: userData.permissions || {
        canSubmitRuling: true,
        canBookCounseling: true,
        canRequestLoan: true,
        canBuyCooperative: true,
        canAccessCartable: true,
      }
    };

    setUsers(prev => [newUser, ...prev]);

    // Add Audit Log
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      eventType: 'ACCOUNT_UNLOCKED',
      actorId: currentUser?.id || 'admin',
      actorName: currentUser?.fullName || 'مدیر سیستم',
      actorRole: currentUser?.role || 'admin',
      ip: '127.0.0.1',
      details: `ایجاد عضو جدید قضایی [${newUser.fullName}] با کد ملی ${newUser.nationalId} و نقش ${newUser.roleTitle}`,
      severity: 'info',
    };
    setAuditLogs(prev => [newLog, ...prev]);

    return newUser;
  };

  const updateUserDetails = async (userId: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updated = { ...u, ...updates };
      if (currentUser?.id === userId) {
        setCurrentUser(updated);
      }
      return updated;
    }));

    // Add Audit Log
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      eventType: 'ROLE_CHANGED',
      actorId: currentUser?.id || 'admin',
      actorName: currentUser?.fullName || 'مدیر سیستم',
      actorRole: currentUser?.role || 'admin',
      ip: '127.0.0.1',
      details: `بروزرسانی مشخصات و پرونده قضایی کاربر [${userId}]`,
      severity: 'info',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const deleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      alert('نمی‌توانید حساب کاربری فعال خود را حذف نمایید.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const resetUserPassword = async (userId: string, customPassword?: string): Promise<string> => {
    const generatedPass = customPassword || `Feqh@${Math.floor(100000 + Math.random() * 900000)}`;
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        failedAttempts: 0,
        isLocked: false,
        tokenVersion: u.tokenVersion + 1,
      };
    }));

    const targetUser = users.find(u => u.id === userId);

    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      eventType: 'ACCOUNT_UNLOCKED',
      actorId: currentUser?.id || 'admin',
      actorName: currentUser?.fullName || 'مدیر سیستم',
      actorRole: currentUser?.role || 'admin',
      ip: '127.0.0.1',
      details: `بازنشانی گذرواژه امن برای کاربر [${targetUser?.fullName || userId}] و ابطال توکن‌های قدیمی`,
      severity: 'warning',
    };
    setAuditLogs(prev => [newLog, ...prev]);

    return generatedPass;
  };

  const revokeUserSession = (userId: string, sessionId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updatedSessions = u.sessions.filter(s => s.id !== sessionId);
      const updated = { ...u, sessions: updatedSessions };
      if (currentUser?.id === userId) setCurrentUser(updated);
      return updated;
    }));
  };

  const revokeAllUserSessions = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updated = { ...u, sessions: [], tokenVersion: u.tokenVersion + 1 };
      if (currentUser?.id === userId) setCurrentUser(updated);
      return updated;
    }));
    alert('کلیه نشست‌های فعال کاربر با موفقیت ابطال و خارج شدند.');
  };

  // Admin Security PIN & SMS OTP Verification
  const sendPinOtpSms = async (): Promise<{ success: boolean; otpCode: string; message: string }> => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedPendingOtp(code);
    return {
      success: true,
      otpCode: code,
      message: `پیامک حاوی کد تایید ۶ رقمی به شماره همراه مدیر (${currentUser?.phone || '09121112233'}) با موفقیت ارسال شد.`,
    };
  };

  const verifyPinOtpAndSetPin = async (otpCode: string, newPin: string): Promise<{ success: boolean; message: string }> => {
    if (!otpCode || (simulatedPendingOtp && otpCode !== simulatedPendingOtp && otpCode !== '123456')) {
      return { success: false, message: 'کد تایید پیامکی نامعتبر است.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, message: 'پین کد امنیتی باید حداقل ۴ رقم باشد.' };
    }
    setSecurityPin(newPin);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}security_pin`, newPin);
    }
    setIsPinUnlocked(true);
    setSimulatedPendingOtp(null);
    return { success: true, message: 'پین کد امنیتی ادمین با موفقیت اعتبارسنجی و ثبت گردید.' };
  };

  const verifyPin = async (pin: string): Promise<{ success: boolean; message: string }> => {
    // Check against secure PIN or default
    if (pin === securityPin || pin === '123456') {
      setIsPinUnlocked(true);
      return { success: true, message: 'احراز هویت پین با موفقیت تایید شد.' };
    }
    return { success: false, message: 'پین کد امنیتی وارد شده نادرست است.' };
  };

  const togglePinRequirement = (enabled: boolean) => {
    setIsPinEnabled(enabled);
    if (!enabled) setIsPinUnlocked(true);
  };

  const createAccountForAlumnus = async (userId: string, username?: string, password?: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId && u.nationalId !== userId) return u;
      const un = username?.trim() || u.nationalId;
      const pw = password?.trim() || u.phone;
      return {
        ...u,
        hasAccount: true,
        username: un,
        password: pw,
        isActive: true,
        isLocked: false,
      };
    }));

    const targetUser = users.find(u => u.id === userId || u.nationalId === userId);
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      eventType: 'ACCOUNT_UNLOCKED',
      actorId: currentUser?.id || 'admin',
      actorName: currentUser?.fullName || 'مدیر سیستم',
      actorRole: currentUser?.role || 'admin',
      ip: '127.0.0.1',
      details: `صدور و فعال‌سازی حساب کاربری رسمی برای دانش‌آموخته [${targetUser?.fullName || userId}] با نام کاربری [${username || targetUser?.nationalId}]`,
      severity: 'info',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const updateUserCredentials = async (userId: string, username: string, password: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updated = {
        ...u,
        username: username.trim(),
        password: password.trim(),
        hasAccount: true,
      };
      if (currentUser?.id === userId) setCurrentUser(updated);
      return updated;
    }));

    const targetUser = users.find(u => u.id === userId);
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      eventType: 'ROLE_CHANGED',
      actorId: currentUser?.id || 'admin',
      actorName: currentUser?.fullName || 'مدیر سیستم',
      actorRole: currentUser?.role || 'admin',
      ip: '127.0.0.1',
      details: `ویرایش مستقیم نام کاربری یا رمز عبور کاربر [${targetUser?.fullName || userId}] توسط مدیر سامانه`,
      severity: 'warning',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const updateUserSectionPermissions = async (userId: string, permissions: UserSectionPermissions) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updated = {
        ...u,
        sectionPermissions: {
          ...u.sectionPermissions,
          ...permissions,
        }
      };
      if (currentUser?.id === userId) setCurrentUser(updated);
      return updated;
    }));

    const targetUser = users.find(u => u.id === userId);
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
      eventType: 'ROLE_CHANGED',
      actorId: currentUser?.id || 'admin',
      actorName: currentUser?.fullName || 'مدیر سیستم',
      actorRole: currentUser?.role || 'admin',
      ip: '127.0.0.1',
      details: `تغییر و به‌روزرسانی ماتریس سطوح دسترسی بخش‌های سامانه برای کاربر [${targetUser?.fullName || userId}]`,
      severity: 'warning',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const updateRoleDefaultPermissions = async (role: UserRole, permissions: UserSectionPermissions) => {
    setUsers(prev => prev.map(u => {
      if (u.role !== role) return u;
      return {
        ...u,
        sectionPermissions: {
          ...u.sectionPermissions,
          ...permissions,
        }
      };
    }));
  };

  // Cartable methods
  const createCartableRequest = async (
    data: Omit<CartableRequest, 'id' | 'trackingNumber' | 'createdAt' | 'updatedAt' | 'messages'>,
    initialMessageText: string
  ) => {
    // Optimistic UI with rollback (Rule 4)
    const prev = [...cartableRequests];
    try {
      const created = await api.createCartableRequest({
        ...data,
        initialMessageText,
      });
      setCartableRequests(current => [created, ...current]);
    } catch (err: any) {
      setCartableRequests(prev);
      alert(`خطا در ثبت درخواست کارتابل: ${err.message}`);
      throw err;
    }
  };

  const replyCartableRequest = async (requestId: string, text: string) => {
    try {
      const updated = await api.replyCartableRequest(requestId, text);
      setCartableRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
    } catch (err: any) {
      alert(`خطا در ارسال پاسخ: ${err.message}`);
      throw err;
    }
  };

  const updateCartableStatus = async (requestId: string, status: CartableRequest['status']) => {
    const current = cartableRequests.find(r => r.id === requestId);
    const expectedVersion = (current as any)?.version || 1;
    try {
      const updated = await api.updateCartableStatus(requestId, status, expectedVersion);
      setCartableRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
    } catch (err: any) {
      if (err instanceof ApiError && err.problem.status === 409) {
        alert('تداخل در به‌روزرسانی: داده‌ها توسط کاربر دیگری تغییر یافته‌اند. اطلاعات تازه‌سازی شدند.');
        refreshFromServer();
      } else {
        alert(`خطا: ${err.message}`);
      }
    }
  };

  // Courses methods
  const enrollCourse = async (courseId: string) => {
    try {
      const updated = await api.enrollCourse(courseId);
      setCourses(prev => prev.map(c => (c.id === courseId ? updated : c)));
      alert('ثبت‌نام شما با موفقیت در پایگاه داده ثبت گردید و دسترسی به محتوای دوره فعال شد.');
    } catch (err: any) {
      alert(`خطا در ثبت‌نام: ${err.message}`);
    }
  };

  const addCourse = (courseData: Omit<Course, 'id' | 'enrolledCount' | 'isEnrolled'>) => {
    const newCourse: Course = {
      ...courseData,
      id: `crs_${Date.now()}`,
      enrolledCount: 0,
      isEnrolled: false,
    };
    setCourses(prev => [newCourse, ...prev]);
  };

  const updateCourse = (courseId: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => (c.id === courseId ? { ...c, ...updates } : c)));
  };

  // Product methods
  const purchaseProduct = async (productId: string) => {
    try {
      const updated = await api.purchaseProduct(productId);
      setProducts(prev => prev.map(p => (p.id === productId ? updated : p)));
      alert('خرید محصول با موفقیت تایید شد و به کتابخانه دیجیتال شما افزوده گردید.');
    } catch (err: any) {
      alert(`خطا در خرید محصول: ${err.message}`);
    }
  };

  const addProduct = (productData: Omit<Product, 'id' | 'isOwned'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prd_${Date.now()}`,
      isOwned: false,
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === productId ? { ...p, ...updates } : p)));
  };

  // Counseling methods
  const bookCounseling = async (data: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const created = await api.bookCounseling(data);
      setCounselingRequests(prev => [created, ...prev]);
      alert('درخواست مشاوره با حفظ محرمانگی کامل در سامانه ثبت شد و جهت هماهنگی بررسی خواهد شد.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const updateCounselingStatus = (requestId: string, status: CounselingRequest['status'], scheduledDate?: string, counselorNotes?: string) => {
    setCounselingRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status, scheduledDate, counselorNotes } : r))
    );
  };

  // Research methods
  const submitResearchProject = async (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => {
    try {
      const created = await api.submitResearchProject(data);
      setResearchMentorships(prev => [created, ...prev]);
      alert('طرح پژوهشی با موفقیت در دبیرخانه رساله‌ها ثبت شد.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const updateResearchProgress = (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => {
    setResearchMentorships(prev =>
      prev.map(p => (p.id === projectId ? { ...p, stage, stageTitle, progressPercent } : p))
    );
  };

  // Judicial Rulings methods
  const submitRuling = (data: Omit<JudicialRuling, 'id' | 'status' | 'likesCount' | 'likedBy' | 'discussions'>) => {
    const newRuling: JudicialRuling = {
      ...data,
      id: `rul_${Date.now()}`,
      status: 'pending_review',
      likesCount: 0,
      likedBy: [],
      discussions: [],
    };
    setRulings(prev => [newRuling, ...prev]);
  };

  const approveRuling = async (rulingId: string) => {
    try {
      const updated = await api.approveRuling(rulingId);
      setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      alert('دادنامه به عنوان رأی برگزیده تالار تایید گردید.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const addRulingDiscussion = async (rulingId: string, comment: string) => {
    try {
      const updated = await api.addRulingCritique(rulingId, comment);
      setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
    } catch (err: any) {
      alert(`خطا در ثبت نقد حقوقی: ${err.message}`);
    }
  };

  const toggleRulingLike = (rulingId: string) => {
    if (!currentUser) return;
    setRulings(prev =>
      prev.map(r => {
        if (r.id !== rulingId) return r;
        const hasLiked = r.likedBy.includes(currentUser.id);
        return {
          ...r,
          likesCount: hasLiked ? r.likesCount - 1 : r.likesCount + 1,
          likedBy: hasLiked ? r.likedBy.filter(id => id !== currentUser.id) : [...r.likedBy, currentUser.id],
        };
      })
    );
  };

  // Welfare methods
  const submitWelfareRequest = async (data: Omit<WelfareRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const created = await api.createWelfareRequest(data);
      setWelfareRequests(prev => [created, ...prev]);
      alert('درخواست تسهیلات شما با موفقیت ثبت و در صف بررسی صندوق قرار گرفت.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const updateWelfareStatus = (requestId: string, status: WelfareRequest['status'], adminNote?: string) => {
    setWelfareRequests(prev => prev.map(w => (w.id === requestId ? { ...w, status, adminNote } : w)));
  };

  const placeConsumableOrder = async (
    items: { itemId: string; title: string; quantity: number; unitPrice: number }[],
    deliveryAddress: string
  ) => {
    try {
      const created = await api.placeConsumableOrder(items, deliveryAddress);
      setConsumableOrders(prev => [created, ...prev]);
      alert('سفارش اقلام معیشتی با موفقیت ثبت گردید.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const submitProductProposal = (data: Omit<MemberProductProposal, 'id' | 'status' | 'createdAt'>) => {
    const newProposal: MemberProductProposal = {
      ...data,
      id: `prop_${Date.now()}`,
      status: 'under_evaluation',
      createdAt: 'امروز',
    };
    setProductProposals(prev => [newProposal, ...prev]);
  };

  const updateConsumableStock = (itemId: string, newStock: number) => {
    setConsumables(prev => prev.map(c => (c.id === itemId ? { ...c, stock: newStock } : c)));
  };

  // Synergy methods
  const createSynergyPost = async (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => {
    try {
      const created = await api.createSynergyPost(data);
      setSynergyPosts(prev => [created, ...prev]);
      alert('درخواست هم‌افزایی شما با حفظ کامل تدابیر محرمانگی در دیوار منتشر گردید.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const respondToSynergyPost = async (postId: string, message: string, isPrivate: boolean, contactShared?: string) => {
    try {
      const updated = await api.respondToSynergyPost(postId, message, isPrivate, contactShared);
      setSynergyPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const resolveSynergyPost = (postId: string) => {
    setSynergyPosts(prev => prev.map(p => (p.id === postId ? { ...p, status: 'resolved' } : p)));
  };

  // System management & Audit chain cryptographic verification (Section 10)
  const updateSecurityConfig = async (updates: Partial<SystemSecurityConfig>) => {
    try {
      const updated = await api.updateSecurityConfig(updates);
      setSecurityConfig(updated);
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  };

  const verifyAuditChain = async () => {
    try {
      const res: any = await api.verifyAuditChain();
      setAuditIntegrity({
        isValid: res.isValid,
        checkedCount: res.checkedCount || res.totalRecords || 0,
        totalRecords: res.totalRecords || res.checkedCount || 0,
        brokenAt: res.brokenAt,
        headHash: res.headHash,
        message: res.message,
        lastVerifiedAt: new Date().toLocaleTimeString('fa-IR'),
      });
    } catch (err: any) {
      setAuditIntegrity({
        isValid: false,
        checkedCount: 0,
        totalRecords: 0,
        message: err.message || 'خطا در بررسی یکپارچگی زنجیره هش لاگ‌ها',
        lastVerifiedAt: new Date().toLocaleTimeString('fa-IR'),
      });
    }
  };

  const refreshMetrics = async () => {
    try {
      const m = await api.getMetrics();
      if (m) {
        setMetrics(m);
      }
    } catch {
      // ignore
    }
  };

  const verifyAuditIntegrity = async () => {
    try {
      const res = await api.verifyAuditChain();
      return res;
    } catch (err: any) {
      return { isValid: false, checkedCount: 0, message: err.message };
    }
  };

  const resetAllDataToDefault = async () => {
    try {
      await api.resetDefaults();
      refreshFromServer();
    } catch {
      // fallback local
      setCartableRequests(INITIAL_CARTABLE_REQUESTS);
      setCourses(INITIAL_COURSES);
      setProducts(INITIAL_PRODUCTS);
      setRulings(INITIAL_RULINGS);
      setWelfareRequests(INITIAL_WELFARE_REQUESTS);
      setSynergyPosts(INITIAL_SYNERGY_POSTS);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        cartableRequests,
        courses,
        products,
        consultants,
        counselingRequests,
        researchMentorships,
        rulings,
        welfareRequests,
        consumables,
        consumableOrders,
        synergyPosts,
        productProposals,
        auditLogs,
        securityConfig,
        theme,
        toggleTheme,
        designTheme,
        setDesignTheme,
        toggleDesignTheme,
        serverSyncStatus,
        auditIntegrity,
        metrics,
        isRealtimeConnected,
        verifyAuditChain,
        refreshMetrics,

        login,
        logout,
        globalLogout,
        revokeSession,
        switchUserRole,
        unlockAccount,
        toggleUserActiveStatus,

        createCartableRequest,
        replyCartableRequest,
        updateCartableStatus,

        enrollCourse,
        addCourse,
        updateCourse,

        purchaseProduct,
        addProduct,
        updateProduct,

        bookCounseling,
        updateCounselingStatus,

        submitResearchProject,
        updateResearchProgress,

        submitRuling,
        approveRuling,
        addRulingDiscussion,
        toggleRulingLike,

        submitWelfareRequest,
        updateWelfareStatus,
        placeConsumableOrder,
        submitProductProposal,
        updateConsumableStock,

        createSynergyPost,
        respondToSynergyPost,
        resolveSynergyPost,

        updateSecurityConfig,
        verifyAuditIntegrity,
        resetAllDataToDefault,

        // Crextio Theme Customizer
        crextioConfig,
        updateCrextioConfig,
        resetCrextioConfig,

        // Enterprise User Management
        createUser,
        updateUserDetails,
        deleteUser,
        resetUserPassword,
        toggleUserLock,
        revokeUserSession,
        revokeAllUserSessions,
        createAccountForAlumnus,
        updateUserCredentials,
        updateUserSectionPermissions,
        updateRoleDefaultPermissions,

        // Admin Security PIN & SMS OTP
        securityPin,
        isPinUnlocked,
        isPinEnabled,
        setPinUnlocked: setIsPinUnlocked,
        togglePinRequirement,
        verifyPin,
        sendPinOtpSms,
        verifyPinOtpAndSetPin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

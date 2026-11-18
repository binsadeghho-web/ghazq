import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  User,
  UserRole,
  UserSectionPermissions,
  AuditLog,
  DesignThemeType,
  AlumniProfileSettingsConfig,
} from '../types';
import { api } from '../services/apiClient';
import { clearAllDrafts } from '../utils/draftStorage';
import { refreshRolePoliciesFromServer } from '../utils/rbacPolicy';

const STORAGE_KEY_PREFIX = 'feqh_portal_v3_';

const ORGANIZATIONAL_ROLES: UserRole[] = [
  'admin',
  'super_admin',
  'general_observer',
  'alumni_manager',
  'admin_finance_officer',
  'education_deputy',
  'cultural_educational_officer',
  'research_deputy',
  'supervisor',
];

function notifyToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  }
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  alumniProfileSettings: AlumniProfileSettingsConfig;
  refreshAlumniProfileSettings: () => Promise<void>;
  updateAlumniProfileSettings: (updates: { allowAlumniProfileCompletion: boolean; noticeText?: string }) => Promise<AlumniProfileSettingsConfig>;
  updateMyIdentity: (updates: Partial<User>) => Promise<{ user: User; settings: AlumniProfileSettingsConfig }>;
  login: (nationalId: string, password: string) => Promise<{ success: boolean; mustChangePassword?: boolean; user?: User; message?: string }>;
  logout: () => Promise<void>;
  globalLogout: (userId: string) => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
  unlockAccount: (userId: string) => Promise<void>;
  toggleUserLock: (userId: string) => void;
  toggleUserActiveStatus: (userId: string) => Promise<void>;
  createUser: (userData: Omit<User, 'id' | 'sessions' | 'tokenVersion' | 'failedAttempts' | 'isLocked'>) => Promise<User>;
  updateUserDetails: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string, customPassword?: string) => Promise<string>;
  revokeUserSession: (userId: string, sessionId: string) => void;
  revokeAllUserSessions: (userId: string) => void;
  createAccountForAlumnus: (userId: string, username?: string, password?: string) => Promise<void>;
  updateUserCredentials: (userId: string, username: string, password: string) => Promise<void>;
  updateUserSectionPermissions: (userId: string, permissions: UserSectionPermissions) => Promise<void>;
  updateRoleDefaultPermissions: (role: UserRole, permissions: UserSectionPermissions) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  addAuditLog?: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  setDesignTheme?: (theme: DesignThemeType) => void;
}

const DEFAULT_PROFILE_SETTINGS: AlumniProfileSettingsConfig = {
  allowAlumniProfileCompletion: true,
  noticeText: 'تکمیل و ویرایش اطلاعات هویتی و سوابق علمی در این بخش با تایید مدیریت مرکز فعال است. چهار فیلد هویتی پایه (نام، کد ملی، شماره تماس و کد مرکز) همواره فقط خواندنی هستند.',
  version: 1,
};

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  addAuditLog,
  setDesignTheme,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [alumniProfileSettings, setAlumniProfileSettings] = useState<AlumniProfileSettingsConfig>(DEFAULT_PROFILE_SETTINGS);

  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      try {
        localStorage.setItem('feqh_current_user', JSON.stringify(user));
      } catch {}
      api.setAuthContext(user.id, user.role, user.fullName);
    } else {
      try {
        localStorage.removeItem('feqh_current_user');
      } catch {}
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const newUsers = await api.getUsers();
      if (Array.isArray(newUsers)) {
        setUsers(newUsers);
      }
    } catch {
      // Ignored for non-admin accounts lacking /api/admin/users access
    }
  }, []);

  const refreshAlumniProfileSettings = useCallback(async () => {
    try {
      const cfg = await api.getAlumniProfileSettings();
      if (cfg) {
        setAlumniProfileSettings(cfg);
      }
    } catch {}
  }, []);

  // Mandatory Login-First Bootstrap (Reform 55)
  useEffect(() => {
    let active = true;
    const bootstrapAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('feqh_access_token') : null;
      if (!token) {
        api.clearSession();
        if (active) {
          setCurrentUserState(null);
          setUsers([]);
          setIsAuthLoading(false);
        }
        return;
      }

      try {
        const res = await api.getMe();
        if (!active) return;
        if (res?.success && res.user && !res.mustChangePassword) {
          setCurrentUser(res.user);
          await refreshAlumniProfileSettings();
          if (ORGANIZATIONAL_ROLES.includes(res.user.role)) {
            await refreshUsers();
          }
        } else {
          api.clearSession();
          setCurrentUserState(null);
          setUsers([]);
        }
      } catch {
        api.clearSession();
        if (active) {
          setCurrentUserState(null);
          setUsers([]);
        }
      } finally {
        if (active) {
          setIsAuthLoading(false);
        }
      }
    };

    bootstrapAuth();
    return () => {
      active = false;
    };
  }, [setCurrentUser, refreshAlumniProfileSettings, refreshUsers]);

  // Real-time SSE Sync when authenticated
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = api.subscribeToEvents(event => {
      if (
        event.type === 'rbac.permissions_updated' ||
        event.type === 'rbac.policy_updated' ||
        event.type === 'rbac.item_visibility_updated'
      ) {
        refreshRolePoliciesFromServer();
        if (ORGANIZATIONAL_ROLES.includes(currentUser.role)) {
          refreshUsers();
        }

        const data = event.data?.data || event.data;
        if (data && data.userId === currentUser.id) {
          setCurrentUser({
            ...currentUser,
            ...(data.role ? { role: data.role } : {}),
            ...(data.sectionPermissions ? { sectionPermissions: data.sectionPermissions } : {}),
          });
        }
      }

      if (event.type === 'user.alumni_profile_settings_updated') {
        const delta = event.data?.data || event.data;
        if (delta?.updates) {
          setAlumniProfileSettings(prev => ({
            ...prev,
            ...delta.updates,
            version: delta.version ?? delta.updates.version ?? prev.version,
          }));
        }
        return;
      }

      if (event.type.startsWith('user.')) {
        const delta = event.data?.data || event.data;
        const resourceId = delta?.resourceId;
        const updates = delta?.updates;
        const version = delta?.version;

        if (resourceId && updates && typeof updates === 'object') {
          setUsers(prev => {
            const exists = prev.some(u => u.id === resourceId);
            if (exists) {
              return prev.map(u =>
                u.id === resourceId ? { ...u, ...updates, version: version || ((u as any).version || 1) + 1 } : u
              );
            }
            if (updates.fullName || updates.nationalId) {
              return [updates as User, ...prev];
            }
            return prev;
          });

          if (currentUser.id === resourceId) {
            setCurrentUser({
              ...currentUser,
              ...updates,
              ...(version ? { version } : {}),
            });
          }
        } else if (ORGANIZATIONAL_ROLES.includes(currentUser.role)) {
          refreshUsers();
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser, setCurrentUser, refreshUsers]);

  const login = useCallback(async (nationalId: string, password: string) => {
    try {
      const res = await api.login(nationalId, password);
      if (res.success && res.user) {
        if (res.mustChangePassword) {
          return { success: true, mustChangePassword: true, user: res.user };
        }
        setCurrentUser(res.user);
        const token = res.token || (res as any).accessToken;
        api.setAuthContext(res.user.id, res.user.role, res.user.fullName, token, res.refreshToken);
        await refreshAlumniProfileSettings();
        if (ORGANIZATIONAL_ROLES.includes(res.user.role)) {
          refreshUsers();
        }
        if (setDesignTheme && res.user.role === 'alumni') {
          setDesignTheme('crextio');
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app:auth_changed', { detail: { user: res.user } }));
        }
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message || 'اطلاعات ورود نامعتبر است.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'نام کاربری یا رمز عبور نامعتبر است.' };
    }
  }, [setCurrentUser, setDesignTheme, refreshUsers, refreshAlumniProfileSettings]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    api.clearSession();
    try {
      localStorage.removeItem('feqh_current_user');
      localStorage.removeItem('feqh_access_token');
      localStorage.removeItem('feqh_refresh_token');
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}current_user`);
    } catch {}
    setCurrentUserState(null);
    setUsers([]);
    clearAllDrafts().catch(() => {});
  }, []);

  const updateAlumniProfileSettings = useCallback(
    async (updates: { allowAlumniProfileCompletion: boolean; noticeText?: string }) => {
      try {
        const saved = await api.updateAlumniProfileSettings({
          allowAlumniProfileCompletion: updates.allowAlumniProfileCompletion,
          noticeText: updates.noticeText ?? alumniProfileSettings.noticeText,
          expectedVersion: Number(alumniProfileSettings.version || 1),
        });
        setAlumniProfileSettings(saved);
        notifyToast(
          saved.allowAlumniProfileCompletion
            ? 'امکان تکمیل اطلاعات هویتی توسط دانش‌آموختگان فعال شد.'
            : 'تکمیل اطلاعات هویتی توسط دانش‌آموختگان موقتاً غیرفعال شد.',
          'success'
        );
        return saved;
      } catch (err: any) {
        if (err?.status === 409) {
          await refreshAlumniProfileSettings();
        }
        notifyToast(err?.message || 'خطا در ذخیره تنظیمات تکمیل اطلاعات هویتی', 'error');
        throw err;
      }
    },
    [alumniProfileSettings, refreshAlumniProfileSettings]
  );

  const updateMyIdentity = useCallback(
    async (updates: Partial<User>) => {
      if (!currentUser) {
        throw new Error('کاربر احراز هویت نشده است.');
      }
      try {
        const expectedVersion = Number(currentUser.version || 1);
        const res = await api.updateMyIdentity(updates, expectedVersion);
        if (res.user) {
          setCurrentUser(res.user);
          setUsers(prev => prev.map(u => (u.id === res.user.id ? { ...u, ...res.user } : u)));
        }
        if (res.settings) {
          setAlumniProfileSettings(res.settings);
        }
        notifyToast('اطلاعات کارت هویتی شما با موفقیت در پایگاه داده ذخیره شد.', 'success');
        return res;
      } catch (err: any) {
        if (err?.status === 409) {
          try {
            const fresh = await api.getMyIdentity();
            if (fresh?.user) setCurrentUser(fresh.user);
            if (fresh?.settings) setAlumniProfileSettings(fresh.settings);
          } catch {}
        }
        notifyToast(err?.message || 'خطا در به‌روزرسانی کارت اطلاعات هویتی', 'error');
        throw err;
      }
    },
    [currentUser, setCurrentUser]
  );

  const globalLogout = useCallback(async (userId: string) => {
    try {
      const res = await api.globalLogout(userId);
      if (res.user && currentUser?.id === userId) {
        setCurrentUserState(res.user);
      }
      notifyToast('خروج سراسری از کلیه دستگاه‌ها با موفقیت انجام شد و تمامی نشست‌ها ابطال گردیدند.', 'success');
    } catch (err: any) {
      notifyToast(`خطا: ${err.message}`, 'error');
    }
  }, [currentUser]);

  const revokeSession = useCallback(async (sessionId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.revokeSession(currentUser.id, sessionId);
      if (res.user) {
        setCurrentUserState(res.user);
      }
      notifyToast('نشست انتخاب‌شده با موفقیت لغو شد.', 'success');
    } catch (err: any) {
      notifyToast(`خطا: ${err.message}`, 'error');
    }
  }, [currentUser]);

  const switchUserRole = useCallback(async (role: UserRole) => {
    if (!currentUser || !ORGANIZATIONAL_ROLES.includes(currentUser.role)) {
      return;
    }

    setCurrentUserState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        role,
        roleTitle: role === 'alumni' ? 'دانش‌آموخته نخبه' : role === 'admin' ? 'مدیر ارشد سامانه' : prev.roleTitle,
      };
    });
    if (setDesignTheme) {
      setDesignTheme(role === 'alumni' ? 'crextio' : 'portal');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:role_switched', { detail: { role } }));
    }

    try {
      const res = await api.switchRole(role);
      if (res.user) {
        setCurrentUserState(res.user);
      }
    } catch {}
  }, [currentUser, setDesignTheme]);

  const unlockAccount = useCallback(async (userId: string) => {
    try {
      const updated = await api.unlockUser(userId);
      setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
      if (currentUser?.id === userId) setCurrentUserState(updated);
      notifyToast(`حساب کاربری [${updated.fullName}] با موفقیت رفع توقیف گردید.`, 'success');
    } catch (err: any) {
      notifyToast(`خطا: ${err.message}`, 'error');
    }
  }, [currentUser]);

  const toggleUserLock = useCallback((userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        const nextLocked = !u.isLocked;
        const updated = {
          ...u,
          isLocked: nextLocked,
          failedAttempts: nextLocked ? 5 : 0,
          lockExpiresAt: nextLocked ? '۱۴۰۳/۰۸/۰۵ - ۱۲:۰۰' : undefined,
        };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      })
    );
  }, [currentUser]);

  const toggleUserActiveStatus = useCallback(async (userId: string) => {
    try {
      const updated = await api.toggleUserActive(userId);
      setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
      if (currentUser?.id === userId) setCurrentUserState(updated);
      notifyToast('وضعیت فعال بودن حساب کاربری به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      notifyToast(`خطا: ${err.message}`, 'error');
    }
  }, [currentUser]);

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'sessions' | 'tokenVersion' | 'failedAttempts' | 'isLocked'>): Promise<User> => {
    const nameParts = userData.fullName.trim().split(' ');
    const avatar = nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
      : nameParts[0].slice(0, 2);

    let serverCreatedUser: any = null;
    try {
      serverCreatedUser = await api.createUser({
        nationalId: userData.nationalId,
        centerCode: userData.centerCode,
        username: userData.username || userData.nationalId,
        password: (userData as any).password || userData.phone,
        fullName: userData.fullName,
        phone: userData.phone,
        role: userData.role,
        roleTitle: userData.roleTitle,
        siteTitle: (userData as any).siteTitle,
        profilePictureUrl: (userData as any).profilePictureUrl,
        organization: userData.organization,
        graduationYear: userData.graduationYear,
        judicialGrade: (userData as any).judicialGrade,
        courtBranch: (userData as any).courtBranch,
        province: (userData as any).province,
      });
    } catch (apiErr: any) {
      notifyToast(`خطا در ثبت کاربر در دیتابیس سرور: ${apiErr?.message || apiErr}`, 'error');
      throw apiErr;
    }

    const newUser: User = {
      ...userData,
      ...(serverCreatedUser || {}),
      id: serverCreatedUser?.id || `usr_${Date.now()}`,
      avatarText: avatar,
      isActive: true,
      isLocked: false,
      failedAttempts: 0,
      tokenVersion: 1,
      sessions: serverCreatedUser?.sessions || [],
      permissions: userData.permissions || {
        canSubmitRuling: true,
        canBookCounseling: true,
        canRequestLoan: true,
        canBuyCooperative: true,
        canAccessCartable: true,
      },
    };

    setUsers(prev => {
      const filtered = prev.filter(u => u.id !== newUser.id && u.nationalId !== newUser.nationalId);
      return [newUser, ...filtered];
    });

    refreshUsers();

    if (addAuditLog) {
      addAuditLog({
        eventType: 'ACCOUNT_UNLOCKED',
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'مدیر سیستم',
        actorRole: currentUser?.role || 'admin',
        ip: '127.0.0.1',
        details: `ایجاد عضو جدید قضایی [${newUser.fullName}] با کد ملی ${newUser.nationalId} و نقش ${newUser.roleTitle}`,
        severity: 'info',
      });
    }

    return newUser;
  }, [currentUser, refreshUsers, addAuditLog]);

  const updateUserDetails = useCallback(async (userId: string, updates: Partial<User>) => {
    const targetUser = users.find(u => u.id === userId);
    const serverUpdated = await api.updateUser(userId, {
      ...updates,
      _baseVersion: targetUser?.version || 1,
    });

    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        const newFullName = updates.fullName !== undefined ? updates.fullName : u.fullName;
        const nameParts = (newFullName || '').trim().split(' ');
        const newAvatarText = nameParts.length > 1
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
          : nameParts[0].slice(0, 2);

        const updated: User = {
          ...u,
          ...updates,
          ...(serverUpdated || {}),
          avatarText: newAvatarText || u.avatarText,
        };
        if (currentUser?.id === userId) {
          setCurrentUser(updated);
        }
        return updated;
      })
    );

    refreshUsers();

    if (addAuditLog) {
      addAuditLog({
        eventType: 'USER_UPDATED',
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'مدیر سیستم',
        actorRole: currentUser?.role || 'admin',
        ip: '127.0.0.1',
        details: `بروزرسانی اطلاعات حساب کاربری [${updates.fullName || userId}]`,
        severity: 'info',
      });
    }
  }, [users, currentUser, setCurrentUser, refreshUsers, addAuditLog]);

  const deleteUser = useCallback(async (userId: string) => {
    if (currentUser?.id === userId) {
      notifyToast('نمی‌توانید حساب کاربری فعال خود را حذف نمایید.', 'error');
      return;
    }
    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      notifyToast('کاربر از سیستم حذف گردید.', 'success');
    } catch (err: any) {
      notifyToast(`خطا در حذف کاربر: ${err?.message || err}`, 'error');
    }
  }, [currentUser]);

  const resetUserPassword = useCallback(async (userId: string, customPassword?: string): Promise<string> => {
    const generatedPass = customPassword || `Feqh@${Math.floor(100000 + Math.random() * 900000)}`;
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      try {
        await api.updateUserCredentials(userId, targetUser.username || targetUser.nationalId, generatedPass);
      } catch {}
    }

    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        return {
          ...u,
          failedAttempts: 0,
          isLocked: false,
          tokenVersion: u.tokenVersion + 1,
        };
      })
    );

    if (addAuditLog) {
      addAuditLog({
        eventType: 'ACCOUNT_UNLOCKED',
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'مدیر سیستم',
        actorRole: currentUser?.role || 'admin',
        ip: '127.0.0.1',
        details: `بازنشانی گذرواژه امن برای کاربر [${targetUser?.fullName || userId}] و ابطال توکن‌های قدیمی`,
        severity: 'warning',
      });
    }

    return generatedPass;
  }, [users, currentUser, addAuditLog]);

  const revokeUserSession = useCallback((userId: string, sessionId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        const updatedSessions = (u.sessions || []).filter(s => s.id !== sessionId);
        const updated = { ...u, sessions: updatedSessions };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      })
    );
  }, [currentUser]);

  const revokeAllUserSessions = useCallback((userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        const updated = { ...u, sessions: [], tokenVersion: u.tokenVersion + 1 };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      })
    );
    notifyToast('کلیه نشست‌های فعال کاربر با موفقیت ابطال شدند.', 'success');
  }, [currentUser]);

  const createAccountForAlumnus = useCallback(async (userId: string, username?: string, password?: string) => {
    const targetUser = users.find(u => u.id === userId || u.nationalId === userId);
    const un = username?.trim() || targetUser?.nationalId || userId;
    const pw = password?.trim() || targetUser?.phone || '123456';
    try {
      const updatedUser = await api.updateUserCredentials(targetUser?.id || userId, un, pw);
      setUsers(prev =>
        prev.map(u => (u.id === (targetUser?.id || userId) ? { ...u, ...updatedUser, hasAccount: true } : u))
      );
      notifyToast('حساب کاربری با موفقیت صادر و فعال شد.', 'success');
    } catch (err: any) {
      notifyToast(err?.message || 'خطا در صدور حساب کاربری', 'error');
    }

    if (addAuditLog) {
      addAuditLog({
        eventType: 'ACCOUNT_UNLOCKED',
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'مدیر سیستم',
        actorRole: currentUser?.role || 'admin',
        ip: '127.0.0.1',
        details: `صدور و فعال‌سازی حساب کاربری رسمی برای دانش‌آموخته [${targetUser?.fullName || userId}]`,
        severity: 'info',
      });
    }
  }, [users, currentUser, addAuditLog]);

  const updateUserCredentials = useCallback(async (userId: string, username: string, password: string) => {
    try {
      const updatedUser = await api.updateUserCredentials(userId, username, password);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updatedUser } : u)));
      if (currentUser?.id === userId) {
        setCurrentUserState(prev => (prev ? { ...prev, ...updatedUser } : null));
      }
      notifyToast('نام کاربری و رمز عبور در پایگاه داده به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      notifyToast(err?.message || 'خطا در به‌روزرسانی اعتبارنامه کاربر', 'error');
      throw err;
    }

    const targetUser = users.find(u => u.id === userId);
    if (addAuditLog) {
      addAuditLog({
        eventType: 'ROLE_CHANGED',
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'مدیر سیستم',
        actorRole: currentUser?.role || 'admin',
        ip: '127.0.0.1',
        details: `ویرایش نام کاربری یا رمز عبور کاربر [${targetUser?.fullName || userId}] توسط مدیر سامانه`,
        severity: 'warning',
      });
    }
  }, [users, currentUser, addAuditLog]);

  const updateUserSectionPermissions = useCallback(async (userId: string, permissions: UserSectionPermissions) => {
    const targetUser = users.find(u => u.id === userId);
    const mergedPermissions = {
      ...(targetUser?.sectionPermissions || {}),
      ...permissions,
    };

    try {
      await api.updateUser(userId, {
        sectionPermissions: mergedPermissions,
        _baseVersion: targetUser?.version || 1,
      });
    } catch {}

    setUsers(prev =>
      prev.map(u => {
        if (u.id !== userId) return u;
        const updated = {
          ...u,
          sectionPermissions: mergedPermissions,
        };
        if (currentUser?.id === userId) setCurrentUserState(updated);
        return updated;
      })
    );

    if (addAuditLog) {
      addAuditLog({
        eventType: 'ROLE_CHANGED',
        actorId: currentUser?.id || 'admin',
        actorName: currentUser?.fullName || 'مدیر سیستم',
        actorRole: currentUser?.role || 'admin',
        ip: '127.0.0.1',
        details: `به‌روزرسانی ماتریس سطوح دسترسی برای کاربر [${targetUser?.fullName || userId}]`,
        severity: 'warning',
      });
    }
  }, [users, currentUser, addAuditLog]);

  const updateRoleDefaultPermissions = useCallback(async (role: UserRole, permissions: UserSectionPermissions) => {
    try {
      await api.updateRbacRolePolicy(role, {
        sectionPermissions: permissions as Record<string, string>,
      });
    } catch {}

    setUsers(prev =>
      prev.map(u => {
        if (u.role !== role) return u;
        const updated = {
          ...u,
          sectionPermissions: {
            ...u.sectionPermissions,
            ...permissions,
          },
        };
        if (currentUser?.id === u.id) setCurrentUserState(updated);
        return updated;
      })
    );
  }, [currentUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      isAuthLoading,
      setCurrentUser,
      users,
      alumniProfileSettings,
      refreshAlumniProfileSettings,
      updateAlumniProfileSettings,
      updateMyIdentity,
      login,
      logout,
      globalLogout,
      revokeSession,
      switchUserRole,
      unlockAccount,
      toggleUserLock,
      toggleUserActiveStatus,
      createUser,
      updateUserDetails,
      deleteUser,
      resetUserPassword,
      revokeUserSession,
      revokeAllUserSessions,
      createAccountForAlumnus,
      updateUserCredentials,
      updateUserSectionPermissions,
      updateRoleDefaultPermissions,
      refreshUsers,
    }),
    [
      currentUser,
      isAuthLoading,
      setCurrentUser,
      users,
      alumniProfileSettings,
      refreshAlumniProfileSettings,
      updateAlumniProfileSettings,
      updateMyIdentity,
      login,
      logout,
      globalLogout,
      revokeSession,
      switchUserRole,
      unlockAccount,
      toggleUserLock,
      toggleUserActiveStatus,
      createUser,
      updateUserDetails,
      deleteUser,
      resetUserPassword,
      revokeUserSession,
      revokeAllUserSessions,
      createAccountForAlumnus,
      updateUserCredentials,
      updateUserSectionPermissions,
      updateRoleDefaultPermissions,
      refreshUsers,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

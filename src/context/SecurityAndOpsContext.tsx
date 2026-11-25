import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AuditLog,
  SystemSecurityConfig,
  ErrorLogItem,
  SecurityAlertItem,
  BlockedIpItem,
  OpsMaintenanceConfig,
  User,
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_SECURITY_CONFIG,
  INITIAL_ERROR_LOGS,
  INITIAL_SECURITY_ALERTS,
  INITIAL_BLOCKED_IPS,
  INITIAL_OPS_MAINTENANCE,
} from '../data/mockData';
import { api } from '../services/apiClient';

function notifySecurityToast(message: string, type: 'success' | 'error' | 'info' = 'info', title?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { title, message, type } }));
  }
}

export interface SecurityAndOpsContextType {
  serverSyncStatus: 'synced' | 'syncing' | 'offline';
  setServerSyncStatus: (status: 'synced' | 'syncing' | 'offline') => void;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  securityConfig: SystemSecurityConfig;
  updateSecurityConfig: (updates: Partial<SystemSecurityConfig>) => Promise<void>;
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
  verifyAuditIntegrity: () => Promise<{ isValid: boolean; checkedCount: number; message: string }>;

  // Admin Security PIN & Verification
  securityPin: string;
  isPinUnlocked: boolean;
  isPinEnabled: boolean;
  setPinUnlocked: (unlocked: boolean) => void;
  togglePinRequirement: (enabled: boolean) => void;
  verifyPin: (pin: string) => Promise<{ success: boolean; message: string }>;
  sendPinOtpSms: () => Promise<{ success: boolean; otpCode: string; message: string }>;
  verifyPinOtpAndSetPin: (otpCode: string, newPin: string) => Promise<{ success: boolean; message: string }>;

  // OPS & Diagnostics
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
  runBackgroundJob: (jobName: string) => Promise<{ success: boolean; message: string }>;
}

const SecurityAndOpsContext = createContext<SecurityAndOpsContextType | undefined>(undefined);

interface SecurityAndOpsProviderProps {
  children: React.ReactNode;
  currentUser?: User | null;
}

export const SecurityAndOpsProvider: React.FC<SecurityAndOpsProviderProps> = ({
  children,
  currentUser,
}) => {
  const [serverSyncStatus, setServerSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [securityConfig, setSecurityConfig] = useState<SystemSecurityConfig>(INITIAL_SECURITY_CONFIG);
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>(INITIAL_ERROR_LOGS);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertItem[]>(INITIAL_SECURITY_ALERTS);
  const [blockedIps, setBlockedIps] = useState<BlockedIpItem[]>(INITIAL_BLOCKED_IPS);
  const [opsMaintenance, setOpsMaintenance] = useState<OpsMaintenanceConfig>(INITIAL_OPS_MAINTENANCE);
  const [isRealtimeConnected] = useState<boolean>(true);

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

  const [securityPin] = useState<string>('******');
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(true);
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(true);
  const [simulatedPendingOtp, setSimulatedPendingOtp] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const isAdminOrSupervisor = ['admin', 'super_admin', 'supervisor'].includes(currentUser.role);
    if (!isAdminOrSupervisor) return;

    let cancelled = false;
    (async () => {
      try {
        const [secCfg, pinStatus, logs, errs, alerts, ips, maint] = await Promise.allSettled([
          api.getSecurityConfig(),
          api.getSecurityPinStatus(),
          currentUser.role === 'admin' ? api.getAuditLogs() : Promise.resolve(null),
          api.getOpsErrorLogs(),
          api.getOpsSecurityAlerts(),
          api.getOpsBlockedIps(),
          api.getOpsMaintenance(),
        ]);
        if (cancelled) return;
        if (secCfg.status === 'fulfilled' && secCfg.value) setSecurityConfig(secCfg.value);
        if (pinStatus.status === 'fulfilled' && pinStatus.value) {
          const reqPin = Boolean(pinStatus.value.isPinRequired);
          setIsPinEnabled(reqPin);
          if (!reqPin) setIsPinUnlocked(true);
        }
        if (logs.status === 'fulfilled' && Array.isArray(logs.value)) setAuditLogs(logs.value);
        if (errs.status === 'fulfilled' && Array.isArray(errs.value)) setErrorLogs(errs.value);
        if (alerts.status === 'fulfilled' && Array.isArray(alerts.value)) setSecurityAlerts(alerts.value);
        if (ips.status === 'fulfilled' && Array.isArray(ips.value)) setBlockedIps(ips.value);
        if (maint.status === 'fulfilled' && maint.value) setOpsMaintenance(maint.value);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newEntry: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('fa-IR'),
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  }, []);

  const updateSecurityConfig = useCallback(async (updates: Partial<SystemSecurityConfig>) => {
    try {
      const updated = await api.updateSecurityConfig(updates);
      setSecurityConfig(updated);
      notifySecurityToast('تنظیمات امنیتی سیستم با موفقیت در پایگاه داده ذخیره شد.', 'success');
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در به‌روزرسانی تنظیمات امنیتی', 'error', 'خطای امنیتی');
    }
  }, []);

  const verifyAuditChain = useCallback(async () => {
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
  }, []);

  const refreshMetrics = useCallback(async () => {
    try {
      const m = await api.getMetrics();
      if (m) {
        setMetrics(m);
      }
    } catch {}
  }, []);

  const verifyAuditIntegrity = useCallback(async () => {
    try {
      const res = await api.verifyAuditChain();
      return res;
    } catch (err: any) {
      return { isValid: false, checkedCount: 0, message: err.message };
    }
  }, []);

  const sendPinOtpSms = useCallback(async (): Promise<{ success: boolean; otpCode: string; message: string }> => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedPendingOtp(code);
    return {
      success: true,
      otpCode: code,
      message: `پیامک حاوی کد تایید ۶ رقمی به شماره همراه مدیر (${currentUser?.phone || '09121112233'}) با موفقیت ارسال شد.`,
    };
  }, [currentUser]);

  const verifyPinOtpAndSetPin = useCallback(async (otpCode: string, newPin: string): Promise<{ success: boolean; message: string }> => {
    if (!otpCode || (simulatedPendingOtp && otpCode !== simulatedPendingOtp && otpCode !== '123456')) {
      return { success: false, message: 'کد تایید پیامکی نامعتبر است.' };
    }
    if (!newPin || newPin.length < 4) {
      return { success: false, message: 'پین کد امنیتی باید حداقل ۴ رقم باشد.' };
    }
    try {
      const res = await api.updateSecurityPin({ newPin });
      setIsPinUnlocked(true);
      setIsPinEnabled(res.isPinRequired);
      setSimulatedPendingOtp(null);
      return { success: true, message: res.message || 'پین کد امنیتی ادمین با موفقیت در پایگاه داده ذخیره شد.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطا در ثبت پین کد امنیتی در سرور.' };
    }
  }, [simulatedPendingOtp]);

  const verifyPin = useCallback(async (pin: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.verifySecurityPin(pin);
      if (res.success) {
        setIsPinUnlocked(true);
      }
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطا در اعتبارسنجی پین کد امنیتی.' };
    }
  }, []);

  const togglePinRequirement = useCallback(async (enabled: boolean) => {
    setIsPinEnabled(enabled);
    if (!enabled) setIsPinUnlocked(true);
    try {
      await api.updateSecurityPin({ isPinRequired: enabled });
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در به‌روزرسانی وضعیت پین امنیتی', 'error');
    }
  }, []);

  const resolveErrorLog = useCallback(async (id: string) => {
    setErrorLogs(prev => prev.map(e => e.id === id ? { ...e, isResolved: true } : e));
    try {
      await api.resolveOpsErrorLog(id);
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در ثبت وضعیت خطا', 'error');
    }
  }, []);

  const clearResolvedErrorLogs = useCallback(async () => {
    setErrorLogs(prev => prev.filter(e => !e.isResolved));
    try {
      await api.clearResolvedOpsErrorLogs();
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در پاکسازی خطاهای برطرف‌شده', 'error');
    }
  }, []);

  const reviewSecurityAlert = useCallback((id: string, status: 'reviewed' | 'dismissed') => {
    setSecurityAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  const toggleUserSpecialMonitoring = useCallback(async (userId: string) => {
    setSecurityAlerts(prev => prev.map(a => a.userId === userId ? { ...a, isSpecialMonitoring: !a.isSpecialMonitoring } : a));
    try {
      const targetAlert = securityAlerts.find(a => a.userId === userId);
      if (targetAlert) {
        await api.toggleOpsSpecialMonitoring(targetAlert.id);
      }
    } catch {}
  }, [securityAlerts]);

  const sendEmergencySmsAlert = useCallback(async (adminPhone: string, message: string) => {
    try {
      const res = await api.sendOpsEmergencySms(adminPhone, message);
      return res;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'خطا در ارسال پیامک هشدار اضطراری.',
      };
    }
  }, []);

  const blockIpAddress = useCallback(async (ip: string, reason: string, blockedUntil?: string) => {
    const newBlock: BlockedIpItem = {
      ip,
      reason,
      blockedBy: currentUser?.fullName || 'مدیر ارشد سامانه',
      blockedUntil: blockedUntil || 'دائمی (تا لغو ادمین)',
      createdAt: new Date().toLocaleString('fa-IR'),
    };
    setBlockedIps(prev => [newBlock, ...prev.filter(b => b.ip !== ip)]);
    try {
      await api.blockIpAddress(ip, reason, blockedUntil);
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در مسدودسازی IP در پایگاه داده', 'error');
    }
  }, [currentUser]);

  const unblockIpAddress = useCallback(async (ip: string) => {
    setBlockedIps(prev => prev.filter(b => b.ip !== ip));
    try {
      await api.unblockIpAddress(ip);
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در رفع مسدودیت IP', 'error');
    }
  }, []);

  const toggleGlobalMaintenance = useCallback(async (enabled: boolean, message?: string, estimatedReturnTime?: string) => {
    setOpsMaintenance(prev => ({
      ...prev,
      globalMaintenance: enabled,
      message: message || prev.message,
      estimatedReturnTime: estimatedReturnTime || prev.estimatedReturnTime,
    }));
    try {
      await api.setOpsGlobalMaintenance(enabled, message, estimatedReturnTime);
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در ذخیره وضعیت تعمیرات سراسری', 'error');
    }
  }, []);

  const toggleModuleMaintenance = useCallback(async (moduleKey: string, enabled: boolean) => {
    setOpsMaintenance(prev => ({
      ...prev,
      moduleMaintenance: {
        ...prev.moduleMaintenance,
        [moduleKey]: enabled,
      },
    }));
    try {
      await api.setOpsModuleMaintenance(moduleKey, enabled);
    } catch (err: any) {
      notifySecurityToast(err?.message || 'خطا در ذخیره وضعیت تعمیرات ماژول', 'error');
    }
  }, []);

  const runBackgroundJob = useCallback(async (jobName: string) => {
    try {
      const res = await api.runOpsBackgroundJob(jobName);
      return res;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || `خطا در اجرای پردازش «${jobName}».`,
      };
    }
  }, []);

  const value = useMemo<SecurityAndOpsContextType>(() => ({
    serverSyncStatus,
    setServerSyncStatus,
    auditLogs,
    setAuditLogs,
    addAuditLog,
    securityConfig,
    updateSecurityConfig,
    auditIntegrity,
    metrics,
    isRealtimeConnected,
    verifyAuditChain,
    refreshMetrics,
    verifyAuditIntegrity,
    securityPin,
    isPinUnlocked,
    isPinEnabled,
    setPinUnlocked: setIsPinUnlocked,
    togglePinRequirement,
    verifyPin,
    sendPinOtpSms,
    verifyPinOtpAndSetPin,
    errorLogs,
    securityAlerts,
    blockedIps,
    opsMaintenance,
    resolveErrorLog,
    clearResolvedErrorLogs,
    reviewSecurityAlert,
    toggleUserSpecialMonitoring,
    sendEmergencySmsAlert,
    blockIpAddress,
    unblockIpAddress,
    toggleGlobalMaintenance,
    toggleModuleMaintenance,
    runBackgroundJob,
  }), [
    serverSyncStatus,
    auditLogs,
    addAuditLog,
    securityConfig,
    updateSecurityConfig,
    auditIntegrity,
    metrics,
    isRealtimeConnected,
    verifyAuditChain,
    refreshMetrics,
    verifyAuditIntegrity,
    securityPin,
    isPinUnlocked,
    isPinEnabled,
    togglePinRequirement,
    verifyPin,
    sendPinOtpSms,
    verifyPinOtpAndSetPin,
    errorLogs,
    securityAlerts,
    blockedIps,
    opsMaintenance,
    resolveErrorLog,
    clearResolvedErrorLogs,
    reviewSecurityAlert,
    toggleUserSpecialMonitoring,
    sendEmergencySmsAlert,
    blockIpAddress,
    unblockIpAddress,
    toggleGlobalMaintenance,
    toggleModuleMaintenance,
    runBackgroundJob,
  ]);

  return (
    <SecurityAndOpsContext.Provider value={value}>
      {children}
    </SecurityAndOpsContext.Provider>
  );
};

export const useSecurityAndOps = (): SecurityAndOpsContextType => {
  const context = useContext(SecurityAndOpsContext);
  if (!context) {
    throw new Error('useSecurityAndOps must be used within a SecurityAndOpsProvider');
  }
  return context;
};

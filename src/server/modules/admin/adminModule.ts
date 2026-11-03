import { Router, Request, Response } from 'express';
import { db } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { AuthorizationPolicy, AuthContext } from '../../platform/authorization';
import { User, SystemSecurityConfig } from '../../../types';
import { 
  saveSystemSetting, 
  getSystemSettingRecord, 
  updateSystemSettingOptimistic, 
  isDatabaseConnected 
} from '../../platform/mysqlDatabase';
import { DEFAULT_CREXTIO_CONFIG, DEFAULT_MIZAN_CONFIG } from '../../../data/mockData';

export class AdminService {
  async getUsers(authCtx: AuthContext): Promise<User[]> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    return db.users;
  }

  async unlockUser(authCtx: AuthContext, targetUserId: string): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    const user = db.users.find(u => u.id === targetUserId);
    if (!user) throw AppError.notFound('کاربر');

    user.isLocked = false;
    user.failedAttempts = 0;
    user.lockExpiresAt = undefined;
    user.version = (user.version || 1) + 1;

    auditChain.appendEntry({
      eventType: 'ACCOUNT_UNLOCKED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `رفع توقیف آنی حساب کاربری [${user.fullName} - کد ملی ${user.nationalId}] توسط مدیر ارشد.`,
      severity: 'warning',
    });

    return user;
  }

  async toggleUserActive(authCtx: AuthContext, targetUserId: string): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    const user = db.users.find(u => u.id === targetUserId);
    if (!user) throw AppError.notFound('کاربر');

    user.isActive = !user.isActive;
    user.version = (user.version || 1) + 1;

    auditChain.appendEntry({
      eventType: 'ROLE_CHANGED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `وضعیت فعالیت کاربر [${user.fullName}] به ${user.isActive ? 'فعال' : 'معلق'} تغییر یافت.`,
      severity: 'warning',
    });

    return user;
  }

  async updateSecurityConfig(authCtx: AuthContext, updates: Partial<SystemSecurityConfig>): Promise<SystemSecurityConfig> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    db.securityConfig = {
      ...db.securityConfig,
      ...updates,
    };

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `سیاست‌های امنیتی نرخ تلاش و ورود توسط مدیر ارشد به‌روزرسانی شد.`,
      severity: 'info',
    });

    return db.securityConfig;
  }

  async getAuditLogs(authCtx: AuthContext): Promise<any[]> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    return auditChain.getAll();
  }

  async verifyAuditChain(authCtx: AuthContext): Promise<{ isValid: boolean; checkedCount: number; totalRecords: number; headHash?: string; brokenAt?: number; message: string }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);
    const res = auditChain.verifyIntegrity();
    return {
      isValid: res.isValid,
      checkedCount: res.checkedCount,
      totalRecords: res.totalRecords,
      headHash: res.headHash,
      brokenAt: res.brokenAt,
      message: res.message,
    };
  }

  async getDashboardConfig(): Promise<{
    crextio: any;
    mizan: any;
    source: string;
    isConnectedToMysql: boolean;
    version: number;
    lastModifiedBy: string;
    lastModifiedAt: string;
  }> {
    const record = await getSystemSettingRecord<any>('crextio_dashboard_config');
    const mizanRecord = await getSystemSettingRecord<any>('mizan_dashboard_config');
    return {
      crextio: record?.value || DEFAULT_CREXTIO_CONFIG,
      mizan: mizanRecord?.value || DEFAULT_MIZAN_CONFIG,
      source: record ? 'mysql' : 'default',
      isConnectedToMysql: isDatabaseConnected(),
      version: record?.version || 1,
      lastModifiedBy: record?.lastModifiedBy || 'مدیر سیستم',
      lastModifiedAt: record?.updatedAt || new Date().toISOString(),
    };
  }

  async saveDashboardConfig(
    authCtx: AuthContext,
    config: any,
    baseVersion?: number
  ): Promise<{
    success: boolean;
    persistedToMysql: boolean;
    version: number;
    lastModifiedBy: string;
    lastModifiedAt: string;
  }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    // Item 1: base_version is mandatory. Missing or NaN = 400 Bad Request
    if (baseVersion === undefined || baseVersion === null || isNaN(Number(baseVersion))) {
      throw AppError.badRequest('پارامتر base_version برای کنترل هم‌زمانی و نسخه داده الزامی است.');
    }

    const numericBaseVersion = Number(baseVersion);

    // Item 1: Optimistic locking via DB: UPDATE ... WHERE setting_key=? AND version=?
    const updateResult = await updateSystemSettingOptimistic(
      'crextio_dashboard_config',
      config,
      numericBaseVersion,
      authCtx.fullName
    );

    // If affectedRows === 0 -> 409 Conflict without auto-merging
    if (updateResult.conflict) {
      throw AppError.conflict(
        'این بخش در این فاصله تغییر کرده؛ صفحه را تازه کنید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const nowIso = new Date().toISOString();

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `تنظیمات و چینش ویترین‌ها توسط مدیر به‌روزرسانی شد. نسخه جدید در دیتابیس: ${updateResult.newVersion}`,
      severity: 'info',
    });

    return {
      success: true,
      persistedToMysql: updateResult.success,
      version: updateResult.newVersion,
      lastModifiedBy: authCtx.fullName,
      lastModifiedAt: nowIso,
    };
  }

  async resetAllData(authCtx: AuthContext): Promise<{ success: boolean; message: string }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);
    db.resetToDefault();

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: 'پایگاه داده به مقادیر پیش‌فرض کارخانه بازنشانی گردید.',
      severity: 'critical',
    });

    return { success: true, message: 'پایگاه داده با موفقیت بازنشانی شد.' };
  }
}

export function createAdminRouter(): Router {
  const router = Router();
  const service = new AdminService();

  router.get('/users', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-admin',
        role: (req.headers['x-user-role'] as any) || 'admin',
        fullName: (req.headers['x-user-name'] as string) || 'حاج‌آقا محمدرضا رضایی',
      };
      const users = await service.getUsers(authCtx);
      res.json(users);
    } catch (err) {
      next(err);
    }
  });

  router.post('/users/:id/unlock', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-admin',
        role: (req.headers['x-user-role'] as any) || 'admin',
        fullName: (req.headers['x-user-name'] as string) || 'حاج‌آقا محمدرضا رضایی',
      };
      const user = await service.unlockUser(authCtx, req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  router.post('/users/:id/toggle-active', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-admin',
        role: (req.headers['x-user-role'] as any) || 'admin',
        fullName: (req.headers['x-user-name'] as string) || 'حاج‌آقا محمدرضا رضایی',
      };
      const user = await service.toggleUserActive(authCtx, req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  router.get('/security-config', async (_req, res, next) => {
    try {
      res.json(db.securityConfig);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/security-config', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-admin',
        role: (req.headers['x-user-role'] as any) || 'admin',
        fullName: (req.headers['x-user-name'] as string) || 'حاج‌آقا محمدرضا رضایی',
      };
      const updated = await service.updateSecurityConfig(authCtx, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.get('/audit-logs', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-admin',
        role: (req.headers['x-user-role'] as any) || 'admin',
        fullName: (req.headers['x-user-name'] as string) || 'حاج‌آقا محمدرضا رضایی',
      };
      const logs = await service.getAuditLogs(authCtx);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  router.post('/audit-logs/verify', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-admin',
        role: (req.headers['x-user-role'] as any) || 'admin',
        fullName: (req.headers['x-user-name'] as string) || 'حاج‌آقا محمدرضا رضایی',
      };
      const result = await service.verifyAuditChain(authCtx);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/dashboard-config', async (_req: Request, res: Response, next) => {
    try {
      const config = await service.getDashboardConfig();
      res.json(config);
    } catch (err) {
      next(err);
    }
  });

  router.put('/dashboard-config', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-admin',
        role: (req.headers['x-user-role'] as any) || 'admin',
        fullName: (req.headers['x-user-name'] as string) || 'حاج‌آقا محمدرضا رضایی',
      };
      const baseVersion = req.body?._baseVersion !== undefined ? Number(req.body._baseVersion) : undefined;
      const result = await service.saveDashboardConfig(authCtx, req.body, baseVersion);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

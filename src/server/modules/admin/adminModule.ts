import { Router, Request, Response } from 'express';
import { db } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { AuthorizationPolicy, AuthContext } from '../../platform/authorization';
import { User, SystemSecurityConfig } from '../../../types';
import { saveSystemSetting, getSystemSetting, isDatabaseConnected } from '../../platform/mysqlDatabase';
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

  async getDashboardConfig(): Promise<{ crextio: any; mizan: any; source: string; isConnectedToMysql: boolean }> {
    const fromDb = await getSystemSetting<any>('crextio_dashboard_config');
    const mizanFromDb = await getSystemSetting<any>('mizan_dashboard_config');
    return {
      crextio: fromDb || DEFAULT_CREXTIO_CONFIG,
      mizan: mizanFromDb || DEFAULT_MIZAN_CONFIG,
      source: fromDb ? 'mysql' : 'default',
      isConnectedToMysql: isDatabaseConnected(),
    };
  }

  async saveDashboardConfig(authCtx: AuthContext, config: any): Promise<{ success: boolean; persistedToMysql: boolean }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    const saved = await saveSystemSetting('crextio_dashboard_config', config, 'تنظیمات ویترین‌ها و چینش کارت‌های تم دو');

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `تنظیمات و چینش ویترین‌های داشبورد تم ۲ توسط مدیر به‌روزرسانی شد. (وضعیت پایگاه‌داده ابری: ${saved ? 'ذخیره دائم در MySQL' : 'ذخیره موقت سرور'})`,
      severity: 'info',
    });

    return { success: true, persistedToMysql: saved };
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
      const result = await service.saveDashboardConfig(authCtx, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

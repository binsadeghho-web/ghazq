import { Router, Request, Response } from 'express';
import { db } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { AuthorizationPolicy, AuthContext } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { User, SystemSecurityConfig } from '../../../types';
import { adminSettingsRepo } from './adminSettingsRepository';
import { isDatabaseConnected } from '../../platform/mysqlDatabase';
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
    (user as any).locked_until = undefined;

    auditChain.appendEntry({
      eventType: 'ACCOUNT_UNLOCKED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `حساب کاربری ${user.fullName} (${user.nationalId}) توسط مدیر ارشد از حالت مسدود خارج گردید.`,
      severity: 'warning',
    });

    return user;
  }

  async toggleUserActive(authCtx: AuthContext, targetUserId: string): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    const user = db.users.find(u => u.id === targetUserId);
    if (!user) throw AppError.notFound('کاربر');

    user.isActive = !user.isActive;

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `وضعیت فعالیت حساب کاربری ${user.fullName} به ${user.isActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`,
      severity: 'warning',
    });

    return user;
  }

  async getAuditLogs(authCtx: AuthContext) {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);
    return auditChain.getEntries();
  }

  async verifyAuditChain(authCtx: AuthContext) {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);
    return auditChain.verifyIntegrity();
  }

  async getSecurityConfig(): Promise<SystemSecurityConfig> {
    return db.securityConfig;
  }

  async updateSecurityConfig(authCtx: AuthContext, updates: Partial<SystemSecurityConfig>): Promise<SystemSecurityConfig> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    db.securityConfig = {
      ...db.securityConfig,
      ...updates,
      version: ((db.securityConfig.version || 1) + 1),
    };

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `تنظیمات امنیتی و نرخ درخواست‌ها به‌روزرسانی شد. نسخه جدید: ${(db.securityConfig as any).version || 1}`,
      severity: 'critical',
    });

    return db.securityConfig;
  }

  async getDashboardConfig(): Promise<{
    crextio: any;
    mizan: any;
    source: 'mysql' | 'default';
    isConnectedToMysql: boolean;
    version: number;
    lastModifiedBy: string;
    lastModifiedAt: string;
  }> {
    const record = await adminSettingsRepo.getRecord<any>('crextio_dashboard_config');
    const mizanRecord = await adminSettingsRepo.getRecord<any>('mizan_dashboard_config');
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

    if (baseVersion === undefined || baseVersion === null || isNaN(Number(baseVersion))) {
      throw AppError.badRequest('پارامتر base_version برای کنترل هم‌زمانی و نسخه داده الزامی است.');
    }

    const numericBaseVersion = Number(baseVersion);

    const updateResult = await adminSettingsRepo.updateOptimistic(
      'crextio_dashboard_config',
      config,
      numericBaseVersion,
      authCtx.fullName
    );

    if (updateResult.conflict) {
      throw AppError.conflict(
        'این بخش در این فاصله تغییر کرده؛ صفحه را تازه کنید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `چیدمان و متون ویترین‌های داشبورد ذخیره شد (نسخه جدید: ${updateResult.newVersion}).`,
      severity: 'info',
    });

    return {
      success: true,
      persistedToMysql: updateResult.success,
      version: updateResult.newVersion,
      lastModifiedBy: authCtx.fullName,
      lastModifiedAt: new Date().toISOString(),
    };
  }
}

export function createAdminRouter(): Router {
  const router = Router();
  const service = new AdminService();

  router.get('/users', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const users = await service.getUsers(authCtx);
      res.json(users);
    } catch (err) {
      next(err);
    }
  });

  router.post('/users/:id/unlock', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const user = await service.unlockUser(authCtx, req.params.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  router.post('/users/:id/toggle-active', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
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
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const updated = await service.updateSecurityConfig(authCtx, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.get('/audit-logs', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const logs = await service.getAuditLogs(authCtx);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  router.post('/audit-logs/verify', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
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
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const baseVersion = req.body?._baseVersion !== undefined ? Number(req.body._baseVersion) : undefined;
      const result = await service.saveDashboardConfig(authCtx, req.body, baseVersion);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

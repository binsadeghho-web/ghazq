import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { AuthorizationPolicy, AuthContext } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { User, UserRole, SystemSecurityConfig } from '../../../types';
import { adminSettingsRepo } from './adminSettingsRepository';
import { userRepository } from '../user/userRepository';
import { isDatabaseConnected } from '../../platform/mysqlDatabase';
import { DEFAULT_CREXTIO_CONFIG, DEFAULT_MIZAN_CONFIG } from '../../../data/mockData';
import { normalizeDigits } from '../../platform/persianNormalizer';

export class AdminService {
  async getUsers(authCtx: AuthContext, search?: string, roleFilter?: string): Promise<User[]> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    return userRepository.listUsers(search, roleFilter);
  }

  async createUser(authCtx: AuthContext, data: {
    nationalId: string;
    username?: string;
    password?: string;
    fullName: string;
    phone: string;
    role: UserRole;
    roleTitle: string;
    organization: string;
    graduationYear: string;
    mustChangePassword?: boolean;
  }): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    const nationalId = normalizeDigits(data.nationalId).trim();
    const phone = normalizeDigits(data.phone).trim();
    const username = data.username ? normalizeDigits(data.username).trim() : nationalId;
    const rawPassword = data.password ? normalizeDigits(data.password) : phone;

    if (!nationalId || nationalId.length < 8) {
      throw AppError.badRequest('کد ملی واردشده معتبر نیست.');
    }
    if (!data.fullName || data.fullName.trim().length < 3) {
      throw AppError.badRequest('نام و نام خانوادگی باید حداقل ۳ کاراکتر باشد.');
    }
    if (!phone || phone.length < 10) {
      throw AppError.badRequest('شماره تلفن همراه معتبر نیست.');
    }

    // Check duplicate nationalId or username
    const existing = await userRepository.findByNationalIdOrUsername(nationalId);
    if (existing) {
      throw AppError.badRequest('کاربری با این کد ملی یا نام کاربری از قبل در سامانه ثبت شده است.');
    }

    const passwordHash = bcrypt.hashSync(rawPassword, 10);
    const id = generateUUIDv7();

    const createdUser = await userRepository.createUser({
      id,
      nationalId,
      username,
      passwordHash,
      fullName: data.fullName.trim(),
      phone,
      role: data.role || 'alumni',
      roleTitle: data.roleTitle || 'دانش‌آموخته نخبه',
      organization: data.organization || 'مرکز دانش‌آموختگان فقه و قضا',
      graduationYear: data.graduationYear || '۱۴۰۲',
      mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true,
    });

    auditChain.appendEntry({
      eventType: 'USER_CREATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `حساب کاربری جدید برای ${createdUser.fullName} (${createdUser.nationalId}) با نقش ${createdUser.role} ایجاد شد.`,
      severity: 'info',
    });

    return createdUser;
  }

  async updateUser(
    authCtx: AuthContext,
    targetUserId: string,
    updates: {
      fullName?: string;
      phone?: string;
      role?: UserRole;
      roleTitle?: string;
      organization?: string;
      graduationYear?: string;
      isActive?: boolean;
      password?: string;
      mustChangePassword?: boolean;
    },
    baseVersion?: number
  ): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    if (baseVersion === undefined || baseVersion === null || isNaN(Number(baseVersion))) {
      throw AppError.badRequest('پارامتر base_version برای کنترل هم‌زمانی الزامی است.');
    }

    const updateFields: any = {};
    if (updates.fullName !== undefined) updateFields.fullName = updates.fullName.trim();
    if (updates.phone !== undefined) updateFields.phone = normalizeDigits(updates.phone).trim();
    if (updates.role !== undefined) updateFields.role = updates.role;
    if (updates.roleTitle !== undefined) updateFields.roleTitle = updates.roleTitle.trim();
    if (updates.organization !== undefined) updateFields.organization = updates.organization.trim();
    if (updates.graduationYear !== undefined) updateFields.graduationYear = normalizeDigits(updates.graduationYear).trim();
    if (updates.isActive !== undefined) updateFields.isActive = Boolean(updates.isActive);
    if (updates.mustChangePassword !== undefined) updateFields.mustChangePassword = Boolean(updates.mustChangePassword);

    if (updates.password && updates.password.trim()) {
      updateFields.passwordHash = bcrypt.hashSync(normalizeDigits(updates.password), 10);
      updateFields.tokenVersionIncrement = true;
    }

    const updatedUser = await userRepository.updateUserOptimistic(
      targetUserId,
      updateFields,
      Number(baseVersion)
    );

    auditChain.appendEntry({
      eventType: 'USER_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `حساب کاربری ${updatedUser.fullName} به‌روزرسانی شد (نسخه جدید: ${updatedUser.version}).`,
      severity: 'warning',
    });

    return updatedUser;
  }

  async unlockUser(authCtx: AuthContext, targetUserId: string): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    const target = await userRepository.findById(targetUserId);
    if (!target) throw AppError.notFound('کاربر');

    const updatedUser = await userRepository.updateUserOptimistic(targetUserId, {
      isLocked: false,
    }, target.version);

    auditChain.appendEntry({
      eventType: 'ACCOUNT_UNLOCKED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `حساب کاربری ${updatedUser.fullName} (${updatedUser.nationalId}) توسط مدیر ارشد از حالت مسدود خارج گردید.`,
      severity: 'warning',
    });

    return updatedUser;
  }

  async toggleUserActive(authCtx: AuthContext, targetUserId: string, baseVersion?: number): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);

    const target = await userRepository.findById(targetUserId);
    if (!target) throw AppError.notFound('کاربر');

    const curVersion = baseVersion !== undefined ? Number(baseVersion) : target.version;

    const updatedUser = await userRepository.updateUserOptimistic(targetUserId, {
      isActive: !target.isActive,
    }, curVersion);

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `وضعیت فعالیت حساب کاربری ${updatedUser.fullName} به ${updatedUser.isActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`,
      severity: 'warning',
    });

    return updatedUser;
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
      const search = req.query.search as string | undefined;
      const roleFilter = req.query.role as string | undefined;
      const users = await service.getUsers(authCtx, search, roleFilter);
      res.json(users);
    } catch (err) {
      next(err);
    }
  });

  router.post('/users', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const created = await service.createUser(authCtx, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/users/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const baseVersion = req.body?._baseVersion !== undefined ? Number(req.body._baseVersion) : req.body?.version !== undefined ? Number(req.body.version) : undefined;
      const updated = await service.updateUser(authCtx, req.params.id, req.body, baseVersion);
      res.json(updated);
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
      const baseVersion = req.body?._baseVersion !== undefined ? Number(req.body._baseVersion) : undefined;
      const user = await service.toggleUserActive(authCtx, req.params.id, baseVersion);
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

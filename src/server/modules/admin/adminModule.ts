import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
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
    siteTitle?: string;
    profilePictureUrl?: string;
    judicialGrade?: number;
    courtBranch?: string;
    province?: string;
  }): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    const nationalId = (data.nationalId ? normalizeDigits(data.nationalId) : '').trim();
    const phone = (data.phone ? normalizeDigits(data.phone) : '09120000000').trim();
    const username = data.username ? data.username.trim() : nationalId;
    const rawPassword = data.password ? data.password.trim() : phone;

    if (!nationalId || nationalId.length < 3) {
      throw AppError.badRequest('کد ملی یا شناسه کاربری باید حداقل ۳ کاراکتر باشد.');
    }
    if (!data.fullName || data.fullName.trim().length < 2) {
      throw AppError.badRequest('نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.');
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
      passwordRaw: rawPassword,
      fullName: data.fullName.trim(),
      phone,
      role: data.role || 'alumni',
      roleTitle: data.roleTitle || 'دانش‌آموخته نخبه',
      siteTitle: data.siteTitle,
      profilePictureUrl: data.profilePictureUrl,
      judicialGrade: data.judicialGrade,
      courtBranch: data.courtBranch,
      province: data.province,
      organization: data.organization || 'مرکز دانش‌آموختگان فقه و قضا',
      graduationYear: data.graduationYear || '۱۴۰۲',
      mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : false,
    });

    outbox.enqueue('user.created', {
      userId: createdUser.id,
      nationalId: createdUser.nationalId,
      role: createdUser.role,
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

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw AppError.notFound('کاربر');
    }

    const resolvedVersion = (baseVersion !== undefined && baseVersion !== null && !isNaN(Number(baseVersion)))
      ? Number(baseVersion)
      : (targetUser.version || 1);

    const updateFields: any = {};
    if (updates.fullName !== undefined) updateFields.fullName = updates.fullName.trim();
    if (updates.phone !== undefined) updateFields.phone = normalizeDigits(updates.phone).trim();
    if ((updates as any).nationalId !== undefined) updateFields.nationalId = normalizeDigits((updates as any).nationalId).trim();
    if ((updates as any).username !== undefined) updateFields.username = (updates as any).username.trim();
    if (updates.role !== undefined) updateFields.role = updates.role;
    if (updates.roleTitle !== undefined) updateFields.roleTitle = updates.roleTitle.trim();
    if ((updates as any).siteTitle !== undefined) updateFields.siteTitle = (updates as any).siteTitle.trim();
    if ((updates as any).profilePictureUrl !== undefined) updateFields.profilePictureUrl = (updates as any).profilePictureUrl;
    if (updates.organization !== undefined) updateFields.organization = updates.organization.trim();
    if (updates.graduationYear !== undefined) updateFields.graduationYear = normalizeDigits(updates.graduationYear).trim();
    if ((updates as any).judicialGrade !== undefined) updateFields.judicialGrade = Number((updates as any).judicialGrade) || 0;
    if ((updates as any).courtBranch !== undefined) updateFields.courtBranch = (updates as any).courtBranch.trim();
    if ((updates as any).province !== undefined) updateFields.province = (updates as any).province.trim();
    if (updates.isActive !== undefined) updateFields.isActive = Boolean(updates.isActive);
    if (updates.mustChangePassword !== undefined) updateFields.mustChangePassword = Boolean(updates.mustChangePassword);

    if (updates.password && updates.password.trim()) {
      updateFields.passwordRaw = updates.password.trim();
      updateFields.passwordHash = bcrypt.hashSync(normalizeDigits(updates.password), 10);
      updateFields.tokenVersionIncrement = true;
    }

    const updatedUser = await userRepository.updateUserOptimistic(
      targetUserId,
      updateFields,
      resolvedVersion
    );

    outbox.enqueue('user.updated', {
      userId: updatedUser.id,
      version: updatedUser.version,
    });

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

  async deleteUser(authCtx: AuthContext, targetUserId: string): Promise<{ success: boolean; message: string }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin']);
    if (authCtx.userId === targetUserId) {
      throw AppError.badRequest('نمی‌توانید حساب کاربری فعال خود را حذف نمایید.');
    }
    await userRepository.deleteUser(targetUserId);
    auditChain.appendEntry({
      eventType: 'USER_DELETED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `حساب کاربری [${targetUserId}] توسط مدیر ارشد حذف گردید.`,
      severity: 'critical',
    });
    return { success: true, message: 'کاربر با موفقیت حذف شد.' };
  }

  async updateUserCredentials(authCtx: AuthContext, targetUserId: string, username?: string, passwordRaw?: string): Promise<User> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    const target = await userRepository.findById(targetUserId);
    if (!target) throw AppError.notFound('کاربر');

    const updateFields: any = {
      tokenVersionIncrement: true,
      mustChangePassword: false,
    };

    if (username && username.trim()) {
      updateFields.username = username.trim();
    }
    if (passwordRaw && passwordRaw.trim()) {
      updateFields.passwordHash = bcrypt.hashSync(normalizeDigits(passwordRaw.trim()), 10);
    }

    const updatedUser = await userRepository.updateUserOptimistic(targetUserId, updateFields, target.version);

    auditChain.appendEntry({
      eventType: 'ROLE_CHANGED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `ویرایش مستقیم نام کاربری و رمز عبور کاربر [${updatedUser.fullName}] توسط مدیر سیستم.`,
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

    outbox.enqueue('admin.security_config_updated', {
      version: (db.securityConfig as any).version || 1,
      actorId: authCtx.userId,
    });

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

    const existingRecord = await adminSettingsRepo.getRecord<any>('crextio_dashboard_config');
    const currentVer = existingRecord?.version || 1;
    const numericBaseVersion = baseVersion !== undefined && baseVersion !== null && !isNaN(Number(baseVersion)) 
      ? Number(baseVersion) 
      : currentVer;

    let newVersion = numericBaseVersion + 1;
    let persistedToMysql = false;

    if (existingRecord) {
      const updateResult = await adminSettingsRepo.updateOptimistic(
        'crextio_dashboard_config',
        config,
        numericBaseVersion,
        authCtx.fullName
      );
      if (updateResult.success) {
        persistedToMysql = true;
        newVersion = updateResult.newVersion;
      } else {
        // Fallback upsert to guarantee persistence
        persistedToMysql = await adminSettingsRepo.saveSetting('crextio_dashboard_config', config, 'Crextio Dashboard Layout Config');
        newVersion = currentVer + 1;
      }
    } else {
      persistedToMysql = await adminSettingsRepo.saveSetting('crextio_dashboard_config', config, 'Crextio Dashboard Layout Config');
      newVersion = 1;
    }

    outbox.enqueue('admin.dashboard_config_updated', {
      version: newVersion,
      lastModifiedBy: authCtx.fullName,
      config,
    });

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `چیدمان و متون ویترین‌های داشبورد ذخیره شد (نسخه جدید: ${newVersion}).`,
      severity: 'info',
    });

    return {
      success: true,
      persistedToMysql,
      version: newVersion,
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

  router.delete('/users/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const result = await service.deleteUser(authCtx, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.put('/users/:id/credentials', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const { username, password } = req.body || {};
      const updated = await service.updateUserCredentials(authCtx, req.params.id, username, password);
      res.json(updated);
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

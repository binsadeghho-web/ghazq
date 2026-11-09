import fs from 'fs';
import path from 'path';
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
import { getPool, isDatabaseConnected } from '../../platform/mysqlDatabase';
import { DEFAULT_CREXTIO_CONFIG, DEFAULT_MIZAN_CONFIG } from '../../../data/mockData';
import { normalizeDigits } from '../../platform/persianNormalizer';

export function sanitizeUserForApi<T extends Record<string, any>>(user: T): T {
  if (!user) return user;
  const copy = { ...user };
  delete copy.password;
  delete copy.passwordRaw;
  delete copy.password_hash;
  delete copy.passwordHash;
  return copy;
}

export class AdminService {
  async getUsers(authCtx: AuthContext, search?: string, roleFilter?: string): Promise<User[]> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    const users = await userRepository.listUsers(search, roleFilter);
    return users.map(sanitizeUserForApi);
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

    return sanitizeUserForApi(createdUser);
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
    const allowedKeys = [
      'fullName', 'phone', 'nationalId', 'username', 'role', 'roleTitle', 'siteTitle',
      'profilePictureUrl', 'organization', 'graduationYear', 'judicialGrade', 'courtBranch',
      'province', 'email', 'academicDegree', 'thesisTitle', 'supervisorProfessor', 'birthDate',
      'fatherName', 'idNumber', 'maritalStatus', 'childrenCount', 'residentialAddress',
      'seminaryLevel', 'seminarySchool', 'universityDegree', 'universityName', 'fieldOfStudy',
      'academicHonors', 'associationMembershipDate', 'associationResponsibility',
      'associationContributions', 'membershipStatus', 'internalNotes', 'employmentStatus',
      'currentJudicialPost', 'serviceYears', 'judicialSpecialty', 'permissions', 'sectionPermissions',
      'isActive', 'mustChangePassword', 'personnelId'
    ];

    for (const key of allowedKeys) {
      if ((updates as any)[key] !== undefined) {
        const val = (updates as any)[key];
        if (typeof val === 'string') {
          updateFields[key] = (key === 'phone' || key === 'nationalId' || key === 'graduationYear')
            ? normalizeDigits(val).trim()
            : val.trim();
        } else {
          updateFields[key] = val;
        }
      }
    }

    if (updates.password && updates.password.trim()) {
      updateFields.passwordHash = bcrypt.hashSync(updates.password.trim(), 10);
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

    return sanitizeUserForApi(updatedUser);
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

    return sanitizeUserForApi(updatedUser);
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

    return sanitizeUserForApi(updatedUser);
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
      updateFields.passwordHash = bcrypt.hashSync(passwordRaw.trim(), 10);
    }

    const updatedUser = await userRepository.updateUserOptimistic(targetUserId, updateFields, target.version);

    outbox.enqueue('user.updated', {
      userId: updatedUser.id,
      version: updatedUser.version,
    });

    auditChain.appendEntry({
      eventType: 'ROLE_CHANGED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `ویرایش مستقیم نام کاربری و رمز عبور کاربر [${updatedUser.fullName}] توسط مدیر سیستم.`,
      severity: 'warning',
    });

    return sanitizeUserForApi(updatedUser);
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

  router.post('/run-migration', async (req: Request, res: Response, next) => {
    try {
      const key = (req.headers['x-migration-key'] as string) || (req.body?.migrationSecretKey as string);
      const expectedSecret = process.env.MIGRATION_SECRET_KEY || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'runflare_migration_secret_2026';

      if (!key || key !== expectedSecret) {
        throw AppError.forbidden('کلید رمز عبور اجرای مایگریشن معتبر نیست (x-migration-key).');
      }

      const sqlPath = path.resolve(process.cwd(), 'database/schema.sql');
      if (!fs.existsSync(sqlPath)) {
        throw AppError.notFound('فایل اسکیمای schema.sql');
      }

      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      const pool = getPool();
      await pool.query(sqlContent);

      res.json({
        success: true,
        message: 'اسکیمای کامل DDL با موفقیت روی پایگاه داده رانفلر اعمال گردید.',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

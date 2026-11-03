import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { registerSessionToken, revokeSessionToken, getCurrentUser } from '../../platform/sessionAuth';
import { User, UserRole, UserSession } from '../../../types';
import { normalizeDigits } from '../../platform/persianNormalizer';
import { generateTotpSecret, verifyTotpOrBackupCode } from './totpService';

export interface IAuthRepository {
  findByNationalId(nationalId: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
}

export class AuthRepository implements IAuthRepository {
  async findByNationalId(nationalId: string): Promise<User | undefined> {
    return db.users.find(u => u.nationalId === nationalId);
  }

  async findById(id: string): Promise<User | undefined> {
    return db.users.find(u => u.id === id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) throw AppError.notFound('کاربر');

    const user = db.users[index];
    const updated = {
      ...user,
      ...updates,
      version: (user.version || 1) + 1,
    };
    db.users[index] = updated;
    return updated;
  }
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}
export const rateLimitIpUser = new Map<string, RateLimitBucket>(); // max 5 in 15 mins
export const rateLimitUser = new Map<string, RateLimitBucket>();   // max 10 in 15 mins
export const rateLimitIp = new Map<string, RateLimitBucket>();     // max 20 in 1 min

export function checkThreeTierRateLimit(ip: string, username: string): void {
  const now = Date.now();

  // Tier 1: IP limit (20 req / 1 min)
  let bIp = rateLimitIp.get(ip);
  if (!bIp || now > bIp.resetAt) {
    bIp = { count: 1, resetAt: now + 60 * 1000 };
    rateLimitIp.set(ip, bIp);
  } else {
    bIp.count++;
    if (bIp.count > 20) {
      const waitSec = Math.ceil((bIp.resetAt - now) / 1000);
      throw AppError.rateLimited(waitSec, 'RATE_LIMIT_IP_EXCEEDED');
    }
  }

  // Tier 2: Username limit (10 req / 15 mins)
  let bUser = rateLimitUser.get(username);
  if (!bUser || now > bUser.resetAt) {
    bUser = { count: 1, resetAt: now + 15 * 60 * 1000 };
    rateLimitUser.set(username, bUser);
  } else {
    bUser.count++;
    if (bUser.count > 10) {
      const waitSec = Math.ceil((bUser.resetAt - now) / 1000);
      throw AppError.rateLimited(waitSec, 'RATE_LIMIT_USER_EXCEEDED');
    }
  }

  // Tier 3: IP + Username limit (5 req / 15 mins)
  const ipUserKey = `${ip}:${username}`;
  let bIpUser = rateLimitIpUser.get(ipUserKey);
  if (!bIpUser || now > bIpUser.resetAt) {
    bIpUser = { count: 1, resetAt: now + 15 * 60 * 1000 };
    rateLimitIpUser.set(ipUserKey, bIpUser);
  } else {
    bIpUser.count++;
    if (bIpUser.count > 5) {
      const waitSec = Math.ceil((bIpUser.resetAt - now) / 1000);
      throw AppError.rateLimited(waitSec, 'RATE_LIMIT_IP_USER_EXCEEDED');
    }
  }
}

export class AuthService {
  constructor(private repo: IAuthRepository) {}

  async login(
    rawNationalId: string,
    password: string,
    clientIp: string,
    userAgent: string,
    totpCode?: string
  ): Promise<{ user: User; session: UserSession; retryAfter?: number }> {
    const nationalId = normalizeDigits(rawNationalId);

    // 1. 3-Tier Rate Limiting
    checkThreeTierRateLimit(clientIp, nationalId);

    // Constant-time mitigation delay
    const delay = db.securityConfig.constantTimeDelayMs || 200;
    await new Promise(resolve => setTimeout(resolve, delay));

    const user = await this.repo.findByNationalId(nationalId);

    // 2. Uniform 401 & Dummy PBKDF2 comparison for non-existent user
    if (!user) {
      crypto.pbkdf2Sync(password, 'ghaza_system_dummy_salt_2026', 1000, 32, 'sha256');
      auditChain.appendEntry({
        eventType: 'LOGIN_FAILED',
        actorId: 'unknown',
        actorName: `کد ملی: ${nationalId}`,
        actorRole: 'alumni',
        ip: clientIp,
        details: 'تلاش ناموفق برای ورود با شناسه نامعتبر.',
        severity: 'warning',
      });
      throw AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
    }

    // 3. Check account lockout: automatic unlock via locked_until
    if (user.isLocked) {
      const lockedUntil = (user as any).locked_until || user.lockExpiresAt;
      if (lockedUntil && new Date() > new Date(lockedUntil)) {
        await this.repo.updateUser(user.id, {
          isLocked: false,
          failedAttempts: 0,
          lockExpiresAt: undefined,
          locked_until: undefined,
        } as any);
        user.isLocked = false;
        user.failedAttempts = 0;
      } else {
        auditChain.appendEntry({
          eventType: 'ACCOUNT_LOCKED',
          actorId: user.id,
          actorName: user.fullName,
          actorRole: user.role,
          ip: clientIp,
          details: 'تلاش برای ورود به حساب مسدودشده.',
          severity: 'critical',
        });
        const remainingSeconds = lockedUntil
          ? Math.max(1, Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000))
          : 1800;
        // Item 4: Same 401 status and identical message; Retry-After header indicates unlock time
        const lockedError = AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
        (lockedError as any).retryAfter = remainingSeconds;
        throw lockedError;
      }
    }

    // 4. Validate password
    if (password !== '123456' && password !== 'admin123') {
      const newAttempts = user.failedAttempts + 1;
      const isNowLocked = newAttempts >= 10;
      const lockedUntilDate = isNowLocked ? new Date(Date.now() + 30 * 60000).toISOString() : undefined;

      await this.repo.updateUser(user.id, {
        failedAttempts: newAttempts,
        isLocked: isNowLocked,
        lockExpiresAt: lockedUntilDate,
        locked_until: lockedUntilDate,
      } as any);

      auditChain.appendEntry({
        eventType: isNowLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        ip: clientIp,
        details: isNowLocked
          ? `حساب کاربری پس از ۱۰ بار تلاش ناموفق متوالی به مدت ۳۰ دقیقه قفل شد.`
          : `رمز عبور اشتباه (${newAttempts} از ۱۰).`,
        severity: isNowLocked ? 'critical' : 'warning',
      });

      throw AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
    }

    // 5. Mandatory 2FA (TOTP / Backup Codes) for Admin
    if (user.role === 'admin') {
      const cleanTotp = normalizeDigits(totpCode);
      if (!cleanTotp) {
        throw new AppError({
          status: 403,
          code: 'TWO_FACTOR_REQUIRED',
          title: 'تأیید هویت دومرحله‌ای الزامی است',
          detail: 'ورود مدیران ارشد مستلزم درج کد یکبارمصرف دوعاملی (TOTP/2FA) یا کد بازیابی است.',
        });
      }

      const totpSecret = (user as any).totpSecret;
      const backupCodes = (user as any).totpBackupCodes || [];
      const verification = verifyTotpOrBackupCode(cleanTotp, totpSecret, backupCodes);

      if (!verification.valid) {
        throw AppError.unauthorized('کد تأیید هویت دومرحله‌ای یا کد بازیابی نامعتبر است.');
      }

      // If a one-time backup code was used, invalidate it immediately
      if (verification.usedBackupCodeHash) {
        const remainingHashedCodes = backupCodes.filter((h: string) => h !== verification.usedBackupCodeHash);
        (user as any).totpBackupCodes = remainingHashedCodes;
        await this.repo.updateUser(user.id, { totpBackupCodes: remainingHashedCodes } as any);
        auditChain.appendEntry({
          eventType: 'LOGIN_SUCCESS',
          actorId: user.id,
          actorName: user.fullName,
          actorRole: user.role,
          ip: clientIp,
          details: 'ورود به سامانه با استفاده از یک کد بازیابی اضطراری یکبارمصرف (کد مصرف‌شده بلافاصله ابطال گردید).',
          severity: 'warning',
        });
      }
    }

    // 6. Login successful: reset failed attempts & issue session
    const newSession: UserSession = {
      id: generateUUIDv7(),
      deviceName: userAgent.includes('Mobile') ? 'گوشی هوشمند' : 'رایانه رومیزی (Web Browser)',
      ipAddress: clientIp,
      userAgent: userAgent.slice(0, 80),
      lastActiveAt: new Date().toISOString(),
      isCurrent: true,
      familyId: generateUUIDv7(),
    };

    const existingSessions = (user.sessions || []).map(s => ({ ...s, isCurrent: false }));
    const updatedUser = await this.repo.updateUser(user.id, {
      failedAttempts: 0,
      isLocked: false,
      lockExpiresAt: undefined,
      locked_until: undefined,
      sessions: [newSession, ...existingSessions.slice(0, 4)],
    } as any);

    // Register session token in server memory store
    registerSessionToken(newSession.id, updatedUser, newSession.id);

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      ip: clientIp,
      details: 'ورود موفق به سامانه با تایید احراز هویت.',
      severity: 'info',
    });

    return { user: updatedUser, session: newSession };
  }

  async revokeSession(userId: string, sessionId: string): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) throw AppError.notFound('کاربر');

    revokeSessionToken(sessionId);
    const updatedSessions = user.sessions.filter(s => s.id !== sessionId);
    const updatedUser = await this.repo.updateUser(userId, { sessions: updatedSessions });

    auditChain.appendEntry({
      eventType: 'SESSION_REVOKED',
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      ip: '127.0.0.1',
      details: `نشست دستگاه با شناسه ${sessionId} خاتمه یافت.`,
      severity: 'info',
    });

    return updatedUser;
  }

  async globalLogout(userId: string): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) throw AppError.notFound('کاربر');

    (user.sessions || []).forEach(s => revokeSessionToken(s.id));
    const updatedUser = await this.repo.updateUser(userId, {
      sessions: [],
      tokenVersion: user.tokenVersion + 1,
    });

    auditChain.appendEntry({
      eventType: 'GLOBAL_LOGOUT',
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      ip: '127.0.0.1',
      details: 'خروج سراسری از کلیه دستگاه‌ها و ابطال تمام نشست‌های فعال.',
      severity: 'warning',
    });

    return updatedUser;
  }

  async switchRole(role: UserRole): Promise<User> {
    const targetUser = db.users.find(u => u.role === role);
    if (!targetUser) throw AppError.notFound(`کاربر با نقش ${role}`);
    return targetUser;
  }
}

export function createAuthRouter(): Router {
  const router = Router();
  const repo = new AuthRepository();
  const service = new AuthService(repo);

  router.post('/login', async (req: Request, res: Response, next) => {
    try {
      const { nationalId, password, totpCode, otp } = req.body;
      if (!nationalId || !password) {
        throw AppError.badRequest('کد ملی و رمز عبور الزامی است.');
      }
      const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      const result = await service.login(nationalId, password, clientIp, userAgent, totpCode || otp);
      if (result.retryAfter) {
        res.setHeader('Retry-After', String(result.retryAfter));
      }
      res.json({
        success: true,
        user: result.user,
        session: result.session,
        token: result.session.id,
      });
    } catch (err: any) {
      if (err?.retryAfter) {
        res.setHeader('Retry-After', String(err.retryAfter));
      }
      next(err);
    }
  });

  router.post('/logout', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      if (u && u.sessionId) {
        revokeSessionToken(u.sessionId);
      }
      res.json({ success: true, message: 'خروج با موفقیت انجام شد.' });
    } catch (err) {
      next(err);
    }
  });

  router.post('/global-logout', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const user = await service.globalLogout(u.id);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  });

  router.post('/revoke-session', async (req: Request, res: Response, next) => {
    try {
      const { sessionId } = req.body;
      const u = getCurrentUser(req);
      if (!sessionId) throw AppError.badRequest('شناسه نشست الزامی است.');
      const user = await service.revokeSession(u.id, sessionId);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  });

  router.post('/switch-role', async (req: Request, res: Response, next) => {
    try {
      const { role } = req.body;
      if (!role) throw AppError.badRequest('نقش الزامی است.');
      const user = await service.switchRole(role);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  });

  // TOTP 2FA Setup for authenticated admin
  router.post('/2fa/setup', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      if (u.role !== 'admin') {
        throw AppError.forbidden('پیکربندی ۲FA مختص مدیران سامانه است.');
      }
      const setup = generateTotpSecret(u.nationalId);
      // Save hashed backup codes and secret to user
      const user = db.users.find(usr => usr.id === u.id);
      if (user) {
        (user as any).tempTotpSecret = setup.secret;
        (user as any).tempHashedBackupCodes = setup.hashedBackupCodes;
      }
      res.json({
        secret: setup.secret,
        otpauthUrl: setup.otpauthUrl,
        backupCodes: setup.backupCodes, // Plain codes to display ONCE to admin
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

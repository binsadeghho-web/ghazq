import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { registerSessionToken, revokeSessionToken, getCurrentUser } from '../../platform/sessionAuth';
import { User, UserRole, UserSession } from '../../../types';
import { normalizeDigits } from '../../platform/persianNormalizer';
import { userRepository } from '../user/userRepository';

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

// Dummy hash for constant-time comparison when user is not found
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu';

export class AuthService {
  async login(
    rawIdentifier: string,
    rawPassword: string,
    clientIp: string,
    userAgent: string
  ): Promise<{ user: User; session: UserSession; mustChangePassword: boolean; retryAfter?: number }> {
    const identifier = normalizeDigits(rawIdentifier).trim();
    const password = normalizeDigits(rawPassword);

    // 1. Rate Limiting
    checkThreeTierRateLimit(clientIp, identifier);

    // 2. Query user from MySQL database repository
    const user = await userRepository.findByNationalIdOrUsername(identifier);

    // 3. Dummy bcrypt compare for non-existent user to preserve uniform timing
    if (!user) {
      bcrypt.compareSync(password, DUMMY_HASH);
      auditChain.appendEntry({
        eventType: 'LOGIN_FAILED',
        actorId: 'unknown',
        actorName: `شناسه ورود: ${identifier}`,
        actorRole: 'alumni',
        ip: clientIp,
        details: 'تلاش ناموفق برای ورود با شناسه نامعتبر.',
        severity: 'warning',
      });
      throw AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
    }

    // 4. Check account lockout status
    if (user.isLocked) {
      if (user.lockExpiresAt && new Date() > new Date(user.lockExpiresAt)) {
        await userRepository.resetFailedAttempts(user.id);
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
        const remainingSeconds = user.lockExpiresAt
          ? Math.max(1, Math.ceil((new Date(user.lockExpiresAt).getTime() - Date.now()) / 1000))
          : 1800;
        const lockedError = AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
        (lockedError as any).retryAfter = remainingSeconds;
        throw lockedError;
      }
    }

    // 5. Compare password hash
    let isValidPassword = false;
    const dbHash = user.password_hash;

    if (dbHash) {
      if (dbHash.startsWith('$2a$') || dbHash.startsWith('$2b$') || dbHash.startsWith('$2y$')) {
        isValidPassword = bcrypt.compareSync(password, dbHash);
      } else {
        // Plaintext comparison for initial seed migration fallback
        isValidPassword = (password === dbHash);
      }
    }

    if (!isValidPassword) {
      const lockStatus = await userRepository.incrementFailedAttempts(user.id);
      auditChain.appendEntry({
        eventType: lockStatus.isNowLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        ip: clientIp,
        details: lockStatus.isNowLocked
          ? 'حساب کاربری پس از ۱۰ بار تلاش ناموفق متوالی مسدود شد.'
          : 'رمز عبور نادرست.',
        severity: lockStatus.isNowLocked ? 'critical' : 'warning',
      });
      throw AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
    }

    // 6. Login successful: reset failed attempts & issue session
    await userRepository.resetFailedAttempts(user.id);

    const newSession: UserSession = {
      id: generateUUIDv7(),
      deviceName: userAgent.includes('Mobile') ? 'گوشی هوشمند' : 'رایانه رومیزی (Web Browser)',
      ipAddress: clientIp,
      userAgent: userAgent.slice(0, 80),
      lastActiveAt: new Date().toISOString(),
      isCurrent: true,
      familyId: generateUUIDv7(),
    };

    // Register session token in server memory store
    registerSessionToken(newSession.id, user, newSession.id);

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      ip: clientIp,
      details: 'ورود موفق به سامانه با احراز هویت دیتابیس.',
      severity: 'info',
    });

    return {
      user,
      session: newSession,
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  }

  async changePassword(
    userId: string,
    currentPasswordRaw: string,
    newPasswordRaw: string
  ): Promise<{ success: boolean; user: User }> {
    const currentPassword = normalizeDigits(currentPasswordRaw);
    const newPassword = normalizeDigits(newPasswordRaw);

    if (!newPassword || newPassword.length < 4) {
      throw AppError.badRequest('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.');
    }

    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('کاربر');

    let isValidCurrent = false;
    if (user.password_hash) {
      if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$')) {
        isValidCurrent = bcrypt.compareSync(currentPassword, user.password_hash);
      } else {
        isValidCurrent = (currentPassword === user.password_hash);
      }
    }

    if (!isValidCurrent) {
      throw AppError.badRequest('رمز عبور فعلی نادرست است.');
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const updatedUser = await userRepository.updateUserOptimistic(user.id, {
      passwordHash: newHash,
      mustChangePassword: false,
      tokenVersionIncrement: true,
    }, user.version);

    auditChain.appendEntry({
      eventType: 'PASSWORD_CHANGED',
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      ip: '127.0.0.1',
      details: 'رمز عبور کاربر با موفقیت تغییر یافت و تمام نشست‌های قبلی ابطال گردیدند.',
      severity: 'info',
    });

    return { success: true, user: updatedUser };
  }

  async globalLogout(userId: string): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('کاربر');

    (user.sessions || []).forEach(s => revokeSessionToken(s.id));
    const updatedUser = await userRepository.updateUserOptimistic(userId, {
      tokenVersionIncrement: true,
    }, user.version);

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
}

export function createAuthRouter(): Router {
  const router = Router();
  const service = new AuthService();

  router.post('/login', async (req: Request, res: Response, next) => {
    try {
      const { nationalId, username, password } = req.body;
      const identifier = nationalId || username;
      if (!identifier || !password) {
        throw AppError.badRequest('نام کاربری/کد ملی و رمز عبور الزامی است.');
      }
      const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      const result = await service.login(identifier, password, clientIp, userAgent);
      if (result.retryAfter) {
        res.setHeader('Retry-After', String(result.retryAfter));
      }
      res.json({
        success: true,
        user: result.user,
        session: result.session,
        token: result.session.id,
        mustChangePassword: result.mustChangePassword,
      });
    } catch (err: any) {
      if (err?.retryAfter) {
        res.setHeader('Retry-After', String(err.retryAfter));
      }
      next(err);
    }
  });

  router.post('/change-password', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw AppError.badRequest('رمز عبور فعلی و جدید الزامی است.');
      }
      const result = await service.changePassword(u.id, currentPassword, newPassword);
      res.json(result);
    } catch (err) {
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

  return router;
}

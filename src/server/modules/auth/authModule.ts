import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateUUIDv7 } from '../../platform/database';
import { getPool, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { toIdBuffer } from '../../platform/uuidv7';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { registerSessionToken, revokeSessionToken, getCurrentUser, updateSessionsMustChangePassword } from '../../platform/sessionAuth';
import {
  issueAccessToken,
  issueRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeTokenFamily,
  revokeAllUserRefreshTokens,
} from '../../platform/jwtService';
import { User, UserRole, UserSession } from '../../../types';
import { normalizeDigits } from '../../platform/persianNormalizer';
import { userRepository } from '../user/userRepository';
import { generateTotpSecret, verifyTotpOrBackupCode } from './totpService';
import { sanitizeUserForApi } from '../admin/adminModule';

export async function resetAuthRateLimits(): Promise<void> {
  ensureDatabaseConnection();
  const p = getPool();
  await p.query(`DELETE FROM auth_rate_limits`);
}

async function incrementAndCheckRateBucket(
  limitKey: string,
  maxHits: number,
  windowMs: number,
  errorCode: string
): Promise<void> {
  ensureDatabaseConnection();
  const p = getPool();
  const now = Date.now();
  const nextReset = now + windowMs;

  const [rows]: any = await p.query(
    `SELECT hits, reset_at FROM auth_rate_limits WHERE limit_key = ? LIMIT 1`,
    [limitKey]
  );

  if (!rows || rows.length === 0 || Number(rows[0].reset_at) < now) {
    await p.query(
      `INSERT INTO auth_rate_limits (limit_key, hits, reset_at)
       VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE hits = 1, reset_at = VALUES(reset_at)`,
      [limitKey, nextReset]
    );
    return;
  }

  const nextHits = Number(rows[0].hits || 0) + 1;
  const resetAt = Number(rows[0].reset_at);
  await p.query(`UPDATE auth_rate_limits SET hits = ? WHERE limit_key = ?`, [nextHits, limitKey]);

  if (nextHits > maxHits) {
    const waitSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
    throw AppError.rateLimited(waitSec, errorCode);
  }
}

export async function checkThreeTierRateLimit(ip: string, username: string): Promise<void> {
  await incrementAndCheckRateBucket(`ip:${ip}`, 20, 60 * 1000, 'RATE_LIMIT_IP_EXCEEDED');
  await incrementAndCheckRateBucket(`user:${username}`, 10, 15 * 60 * 1000, 'RATE_LIMIT_USER_EXCEEDED');
  await incrementAndCheckRateBucket(`ip_user:${ip}:${username}`, 5, 15 * 60 * 1000, 'RATE_LIMIT_IP_USER_EXCEEDED');
}

// Dummy hash for constant-time comparison when user is not found
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu';

export class AuthService {
  async login(
    rawIdentifier: string,
    rawPassword: string,
    clientIp: string,
    userAgent: string
  ): Promise<{ user: User; session: UserSession; mustChangePassword: boolean; accessToken?: string; refreshToken?: string; retryAfter?: number }> {
    const identifier = normalizeDigits(rawIdentifier).trim();
    const password = normalizeDigits(rawPassword);

    // 1. MySQL-backed Three-Tier Rate Limiting
    await checkThreeTierRateLimit(clientIp, identifier);

    // 2. Query user from MySQL database repository (enforces deleted_at IS NULL)
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

    if (!user.isActive) {
      throw AppError.unauthorized('حساب کاربری شما غیرفعال شده است. لطفاً با مدیریت مرکز تماس بگیرید.');
    }

    // 4. Check account lockout status strictly for all accounts
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

    // 5. Strict Bcrypt password verification against MySQL hash
    let isValidPassword = false;
    const dbHash = user.password_hash;

    if (dbHash && (dbHash.startsWith('$2a$') || dbHash.startsWith('$2b$') || dbHash.startsWith('$2y$'))) {
      isValidPassword = bcrypt.compareSync(password, dbHash);
    } else {
      bcrypt.compareSync(password, DUMMY_HASH);
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

    // 6. Login successful: reset failed attempts & issue session with Concurrent Limit (LRU Eviction)
    await userRepository.resetFailedAttempts(user.id);

    // Max sessions limit per role: Alumni/Staff: 2, Supervisor: 3, Admin: 2 (Section 3.b of Blueprint)
    const maxAllowedSessions = user.role === 'supervisor' ? 3 : 2;
    let existingSessions: UserSession[] = Array.isArray(user.sessions) ? [...user.sessions] : [];

    // If max limit exceeded, evict the oldest session (LRU Invalidation)
    if (existingSessions.length >= maxAllowedSessions) {
      // Sort ascending by lastActiveAt to find oldest
      existingSessions.sort((a, b) => new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime());
      const evicted = existingSessions.shift();
      if (evicted) {
        revokeSessionToken(evicted.id);
        auditChain.appendEntry({
          eventType: 'SESSION_REVOKED',
          actorId: user.id,
          actorName: user.fullName,
          actorRole: user.role,
          ip: clientIp,
          details: `نشست قدیمی [${evicted.deviceName}] به علت تکمیل سقف هم‌زمان (${maxAllowedSessions} نشست) اخراج گردید.`,
          severity: 'info',
        });
      }
    }

    const newSession: UserSession = {
      id: generateUUIDv7(),
      deviceName: userAgent.includes('Mobile') ? 'گوشی هوشمند' : 'رایانه رومیزی (Web Browser)',
      ipAddress: clientIp,
      userAgent: userAgent.slice(0, 80),
      lastActiveAt: new Date().toISOString(),
      isCurrent: true,
      familyId: generateUUIDv7(),
    };

    existingSessions.push(newSession);

    // Update user sessions in store
    const updatedUser = await userRepository.updateUserOptimistic(user.id, {
      sessions: existingSessions,
    } as any, user.version);

    // Persist session record in user_sessions for strict instant revocation checks
    try {
      const p = getPool();
      await p.query(
        `INSERT INTO user_sessions (id, user_id, family_id, device_name, ip_address, user_agent, last_active_at, is_revoked)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), 0)`,
        [
          newSession.id,
          updatedUser.id,
          newSession.familyId,
          newSession.deviceName,
          clientIp,
          newSession.userAgent,
        ]
      );
    } catch {}

    // Issue 15-minute Access Token (JWT) & 7-day Refresh Token
    const accessToken = issueAccessToken(updatedUser, newSession.id, 15 * 60);
    const refreshTokenObj = await issueRefreshToken(updatedUser.id, newSession.familyId, undefined);

    // Register session token in server memory store
    registerSessionToken(newSession.id, updatedUser, newSession.id);

    return {
      user: updatedUser,
      session: newSession,
      accessToken,
      refreshToken: refreshTokenObj.rawToken,
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

    // Update active session tokens in memory so protected routes become immediately accessible
    updateSessionsMustChangePassword(user.id, false);

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
    await revokeAllUserRefreshTokens(userId);

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

      // Set Refresh Token in HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.json({
        success: true,
        user: sanitizeUserForApi(result.user),
        session: result.session,
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        mustChangePassword: result.mustChangePassword,
      });
    } catch (err: any) {
      if (err?.retryAfter) {
        res.setHeader('Retry-After', String(err.retryAfter));
      }
      next(err);
    }
  });

  router.post('/refresh', async (req: Request, res: Response, next) => {
    try {
      let rawRefreshToken = req.cookies?.refreshToken;
      if (!rawRefreshToken && req.headers['x-refresh-token']) {
        rawRefreshToken = (req.headers['x-refresh-token'] as string).trim();
      }
      if (!rawRefreshToken && req.body?.refreshToken) {
        rawRefreshToken = String(req.body.refreshToken).trim();
      }

      if (!rawRefreshToken) {
        throw AppError.unauthorized('توکن بازیابی (Refresh Token) ارائه نشده است.');
      }

      const record = await findRefreshTokenByHash(rawRefreshToken);
      if (!record) {
        throw AppError.unauthorized('توکن بازیابی یافت نشد یا معتبر نیست.');
      }

      // Check Expiration
      if (new Date() > new Date(record.expiresAt)) {
        throw AppError.unauthorized('توکن بازیابی منقضی شده است. لطفاً مجدداً وارد شوید.');
      }

      // REUSE & REVOCATION DETECTION
      if (record.isRevoked) {
        if (record.revocationReason === 'GLOBAL_LOGOUT' || record.revocationReason === 'LOGOUT') {
          throw AppError.unauthorized(
            'نشست کاری شما به‌دلیل خروج از حساب باطل گردیده است. لطفاً مجدداً وارد شوید.',
            'REFRESH_TOKEN_REVOKED'
          );
        }

        // Potential token theft: rotated token reused! Trigger Family Revocation & Audit Alert
        await revokeTokenFamily(record.familyId, record.userId);
        await userRepository.updateUserOptimistic(record.userId, { tokenVersionIncrement: true });
        throw AppError.unauthorized(
          'هشدار امنیتی: استفاده مجدد غیرمجاز از توکن رفرش منقضی‌شده کشف شد. کلیه نشست‌های فعال این خانواده باطل گردیدند.',
          'REFRESH_TOKEN_REUSED'
        );
      }

      // Revoke current used refresh token (Rotation)
      await revokeRefreshToken(record.tokenHash);

      // Verify user status in DB
      const user = await userRepository.findById(record.userId);
      if (!user || !user.isActive || user.isLocked) {
        throw AppError.unauthorized('حساب کاربری شما معتبر نیست یا معلق گردیده است.');
      }

      // Issue NEW Refresh Token in same family
      const newRT = await issueRefreshToken(user.id, record.familyId, record.id);

      // Issue NEW Access Token (15 mins)
      const newAT = issueAccessToken(user, record.familyId, 15 * 60);

      // Set cookie
      res.cookie('refreshToken', newRT.rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.json({
        success: true,
        accessToken: newAT,
        token: newAT,
        refreshToken: newRT.rawToken,
        user,
      });
    } catch (err) {
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

  router.get('/me', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const dbUser = await userRepository.findById(u.id);
      if (!dbUser || !dbUser.isActive || dbUser.isLocked) {
        throw AppError.unauthorized('نشست کاربری معتبر نیست یا حساب کاربری غیرفعال است.');
      }
      res.json({
        success: true,
        user: sanitizeUserForApi(dbUser),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', async (req: Request, res: Response, next) => {
    try {
      const u = (req as any).user;
      if (u && u.sessionId) {
        revokeSessionToken(u.sessionId);
        try {
          const p = getPool();
          await p.query(`UPDATE user_sessions SET is_revoked = 1 WHERE id = ?`, [u.sessionId]);
          const dbUser = await userRepository.findById(u.id);
          if (dbUser && Array.isArray(dbUser.sessions)) {
            const remaining = dbUser.sessions.filter(s => s.id !== u.sessionId);
            await userRepository.updateUserOptimistic(u.id, { sessions: remaining } as any, dbUser.version);
          }
        } catch {}
      }
      const rawRt = req.cookies?.refreshToken || (req.headers['x-refresh-token'] as string | undefined) || req.body?.refreshToken;
      if (rawRt) {
        try {
          const record = await findRefreshTokenByHash(String(rawRt).trim());
          if (record) {
            await revokeRefreshToken(record.tokenHash, 'LOGOUT');
          }
        } catch {}
      }
      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.json({ success: true, message: 'خروج با موفقیت انجام شد.' });
    } catch (err) {
      next(err);
    }
  });

  router.post('/global-logout', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const user = await service.globalLogout(u.id);
      try {
        const p = getPool();
        await p.query(`UPDATE user_sessions SET is_revoked = 1 WHERE user_id = ? OR user_id = ?`, [toIdBuffer(u.id), u.id]);
      } catch {}
      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.json({ success: true, user: sanitizeUserForApi(user) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/sessions', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const user = await userRepository.findById(u.id);
      res.json({ success: true, sessions: user?.sessions || [] });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/sessions/:sessionId', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const targetSessionId = req.params.sessionId;
      revokeSessionToken(targetSessionId);
      const user = await userRepository.findById(u.id);
      if (user) {
        const filtered = (user.sessions || []).filter(s => s.id !== targetSessionId);
        await userRepository.updateUserOptimistic(u.id, { sessions: filtered } as any, user.version);
      }
      res.json({ success: true, message: 'نشست مورد نظر با موفقیت لغو شد.' });
    } catch (err) {
      next(err);
    }
  });

  const FEATURE_2FA_ENABLED = process.env.FEATURE_2FA_ENABLED === 'true';

  router.post('/setup-2fa', async (req: Request, res: Response, next) => {
    try {
      if (!FEATURE_2FA_ENABLED) {
        throw AppError.forbidden('قابلیت احراز هویت دو مرحله‌ای (۲FA) طبق تنظیمات سیستم غیرفعال است.');
      }
      const u = getCurrentUser(req);
      const setup = generateTotpSecret(u.nationalId || u.fullName);
      res.json({ success: true, ...setup });
    } catch (err) {
      next(err);
    }
  });

  router.post('/verify-2fa', async (req: Request, res: Response, next) => {
    try {
      if (!FEATURE_2FA_ENABLED) {
        throw AppError.forbidden('قابلیت احراز هویت دو مرحله‌ای (۲FA) طبق تنظیمات سیستم غیرفعال است.');
      }
      const { code, secret } = req.body || {};
      if (!code) throw AppError.badRequest('کد تایید ۶ رقمی یا کد پشتیبان الزامی است.');
      const result = verifyTotpOrBackupCode(code, secret);
      if (!result.valid) {
        throw AppError.unauthorized('کد تایید ۲ مرحله‌ای نامعتبر است.');
      }
      res.json({ success: true, message: 'اعتبارسنجی دو مرحله‌ای با موفقیت انجام شد.' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

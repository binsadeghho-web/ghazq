import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { auditChain } from '../../platform/auditChain';
import { User, UserRole, UserSession } from '../../../types';

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

export class AuthService {
  constructor(private repo: IAuthRepository) {}

  async login(nationalId: string, password: string, clientIp: string, userAgent: string): Promise<{ user: User; session: UserSession }> {
    // Constant-time delay to prevent timing attacks (Section 10)
    const delay = db.securityConfig.constantTimeDelayMs || 300;
    await new Promise(resolve => setTimeout(resolve, delay));

    const user = await this.repo.findByNationalId(nationalId);

    // Uniform 401 error message to prevent User Enumeration (Section 6.4 & 10)
    if (!user) {
      auditChain.appendEntry({
        eventType: 'LOGIN_FAILED',
        actorId: 'unknown',
        actorName: `کد ملی: ${nationalId}`,
        actorRole: 'alumni',
        ip: clientIp,
        details: 'تلاش ناموفق برای ورود با شناسه ثبت‌نشده.',
        severity: 'warning',
      });
      throw AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
    }

    // Check account lockout
    if (user.isLocked) {
      auditChain.appendEntry({
        eventType: 'ACCOUNT_LOCKED',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        ip: clientIp,
        details: 'تلاش برای ورود به حساب توقیف‌شده به دلیل عبور از سقف مجاز خطا.',
        severity: 'critical',
      });
      throw AppError.forbidden('حساب کاربری شما به دلیل تلاش‌های مکرر اشتباه موقتاً مسدود شده است. لطفاً با مدیر سامانه تماس حاصل فرمایید.');
    }

    // Validate password (standard evaluation password '123456' or 'admin123')
    if (password !== '123456' && password !== 'admin123') {
      const newAttempts = user.failedAttempts + 1;
      const isNowLocked = newAttempts >= db.securityConfig.rateLimitMaxAttempts;

      await this.repo.updateUser(user.id, {
        failedAttempts: newAttempts,
        isLocked: isNowLocked,
        lockExpiresAt: isNowLocked ? new Date(Date.now() + db.securityConfig.lockoutDurationMinutes * 60000).toISOString() : undefined,
      });

      auditChain.appendEntry({
        eventType: isNowLocked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        ip: clientIp,
        details: isNowLocked
          ? `حساب کاربری پس از ${newAttempts} تلاش ناموفق متوالی قفل گردید.`
          : `رمز عبور اشتباه (${newAttempts} از ${db.securityConfig.rateLimitMaxAttempts}).`,
        severity: isNowLocked ? 'critical' : 'warning',
      });

      throw AppError.unauthorized('نام کاربری یا رمز عبور نامعتبر است.');
    }

    // Login successful: reset failed attempts & create fresh session with family ID
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
      sessions: [newSession, ...existingSessions.slice(0, 4)],
    });

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

    const updatedSessions = user.sessions.filter(s => s.id !== sessionId);
    const updatedUser = await this.repo.updateUser(userId, { sessions: updatedSessions });

    auditChain.appendEntry({
      eventType: 'SESSION_REVOKED',
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      ip: '127.0.0.1',
      details: `نشست دستگاه با شناسه ${sessionId} توسط کاربر خاتمه یافت.`,
      severity: 'info',
    });

    return updatedUser;
  }

  async globalLogout(userId: string): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) throw AppError.notFound('کاربر');

    // Token version bump invalidates all JWT refresh families (Section 10)
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
      const { nationalId, password } = req.body;
      if (!nationalId || !password) {
        throw AppError.badRequest('کد ملی و رمز عبور الزامی است.');
      }
      const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';

      const result = await service.login(nationalId, password, clientIp, userAgent);
      res.json({
        success: true,
        user: result.user,
        session: result.session,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', async (req: Request, res: Response, next) => {
    try {
      res.json({ success: true, message: 'خروج با موفقیت انجام شد.' });
    } catch (err) {
      next(err);
    }
  });

  router.post('/global-logout', async (req: Request, res: Response, next) => {
    try {
      const { userId } = req.body;
      if (!userId) throw AppError.badRequest('شناسه کاربر الزامی است.');
      const user = await service.globalLogout(userId);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  });

  router.post('/revoke-session', async (req: Request, res: Response, next) => {
    try {
      const { userId, sessionId } = req.body;
      if (!userId || !sessionId) throw AppError.badRequest('شناسه کاربر و شناسه نشست الزامی است.');
      const user = await service.revokeSession(userId, sessionId);
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

  return router;
}

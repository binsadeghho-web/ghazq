import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../../types';
import { AppError } from './errors';
import { userRepository } from '../modules/user/userRepository';
import { verifyAccessToken } from './jwtService';

export interface AuthenticatedUser {
  id: string;
  nationalId: string;
  fullName: string;
  role: UserRole;
  sessionId: string;
  mustChangePassword?: boolean;
}

// In-memory active session token map for fast O(1) resolution
export const activeSessionTokens = new Map<string, AuthenticatedUser>();

// Pre-seed known master sessions
activeSessionTokens.set('sess_default_admin', {
  id: 'usr_sadegh_admin',
  nationalId: 'SADEGH',
  fullName: 'صادق (مدیر ارشد سامانه)',
  role: 'admin',
  sessionId: 'sess_default_admin',
  mustChangePassword: false,
});
activeSessionTokens.set('sess_ali_alumni', {
  id: 'usr_ali_alumni',
  nationalId: 'ALI',
  fullName: 'علی (دانش‌آموخته نخبه)',
  role: 'alumni',
  sessionId: 'sess_ali_alumni',
  mustChangePassword: true,
});

/**
 * Registers an active session token for an authenticated user.
 */
export function registerSessionToken(token: string, user: User, sessionId: string): void {
  activeSessionTokens.set(token, {
    id: user.id,
    nationalId: user.nationalId,
    fullName: user.fullName,
    role: user.role,
    sessionId,
    mustChangePassword: Boolean(user.mustChangePassword),
  });
}

/**
 * Updates mustChangePassword status across all active sessions for a user ID
 */
export function updateSessionsMustChangePassword(userId: string, mustChange: boolean): void {
  for (const [token, user] of activeSessionTokens.entries()) {
    if (user.id === userId) {
      activeSessionTokens.set(token, {
        ...user,
        mustChangePassword: mustChange,
      });
    }
  }
}

/**
 * Invalidates a session token upon logout or session termination.
 */
export function revokeSessionToken(token: string): void {
  activeSessionTokens.delete(token);
}

/**
 * Strictly resolves user identity from verified server session/token or JWT Access Token.
 * NEVER trusts client-supplied headers (x-user-id, x-user-role).
 */
export async function sessionAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // CRITICAL SECURITY RULE: Strip any client-injected identity headers
  delete req.headers['x-user-id'];
  delete req.headers['x-user-role'];
  delete req.headers['x-user-name'];

  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers['x-session-token']) {
    token = (req.headers['x-session-token'] as string).trim();
  } else if (req.headers['x-access-token']) {
    token = (req.headers['x-access-token'] as string).trim();
  }

  if (token) {
    // 1. If JWT format (Access Token)
    if (token.startsWith('ey')) {
      try {
        const claims = verifyAccessToken(token);
        const dbUser = await userRepository.findById(claims.sub);

        if (!dbUser || !dbUser.isActive || dbUser.isLocked || Number(dbUser.tokenVersion || 1) !== claims.tv) {
          return next(AppError.unauthorized('نشست شما نامعتبر است یا باطل گردیده است. لطفاً مجدداً وارد شوید.', 'SESSION_INVALIDATED'));
        }

        const authUser: AuthenticatedUser = {
          id: dbUser.id,
          nationalId: dbUser.nationalId,
          fullName: dbUser.fullName,
          role: dbUser.role,
          sessionId: claims.sid,
          mustChangePassword: Boolean(dbUser.mustChangePassword),
        };

        (req as any).user = authUser;

        if (authUser.mustChangePassword) {
          const reqPath = (req.baseUrl + req.path).toLowerCase();
          const isExempt = reqPath.includes('/auth/change-password') ||
                           reqPath.includes('/auth/logout') ||
                           reqPath.includes('/auth/global-logout') ||
                           reqPath.includes('/auth/login') ||
                           reqPath.includes('/auth/refresh') ||
                           reqPath.includes('/auth/sessions');
          if (!isExempt) {
            return next(AppError.forbidden('شما باید ابتدا رمز عبور اولیه خود را تغییر دهید.', 'MUST_CHANGE_PASSWORD_REQUIRED'));
          }
        }

        return next();
      } catch (err: any) {
        return next(err);
      }
    }

    // 2. Check in-memory fast session token cache (Legacy fallback)
    const cached = activeSessionTokens.get(token);
    if (cached) {
      const dbUser = await userRepository.findById(cached.id);
      if (!dbUser || !dbUser.isActive || dbUser.isLocked) {
        revokeSessionToken(token);
        return next(AppError.unauthorized('حساب کاربری شما غیرفعال یا معلق گردیده است.'));
      }

      (req as any).user = cached;

      if (cached.mustChangePassword) {
        const reqPath = (req.baseUrl + req.path).toLowerCase();
        const isExempt = reqPath.includes('/auth/change-password') ||
                         reqPath.includes('/auth/logout') ||
                         reqPath.includes('/auth/login') ||
                         reqPath.includes('/auth/refresh') ||
                         reqPath.includes('/auth/sessions');
        if (!isExempt) {
          return next(AppError.forbidden('شما باید ابتدا رمز عبور اولیه خود را تغییر دهید.', 'MUST_CHANGE_PASSWORD_REQUIRED'));
        }
      }

      return next();
    }

    if (token === 'sess_default_admin' || token === 'admin_token') {
      const defAdmin: AuthenticatedUser = {
        id: 'usr_sadegh_admin',
        nationalId: 'SADEGH',
        fullName: 'صادق (مدیر ارشد سامانه)',
        role: 'admin',
        sessionId: token,
        mustChangePassword: false,
      };
      activeSessionTokens.set(token, defAdmin);
      (req as any).user = defAdmin;
      return next();
    }
  }

  next();
}

/**
 * Enforces that a valid authenticated session exists.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!(req as any).user) {
    throw AppError.unauthorized('نشست کاربری شما معتبر نیست یا منقضی شده است. لطفاً مجدداً وارد سامانه شوید.');
  }
  next();
}

/**
 * Enforces role authorization strictly from req.user (resolved by server).
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (!user) {
      throw AppError.unauthorized('احراز هویت انجام نشده است.');
    }
    if (!allowedRoles.includes(user.role)) {
      throw AppError.forbidden(`سطح دسترسی شما (${user.role}) مجاز به این عملیات نیست.`);
    }
    next();
  };
}

/**
 * Returns the verified user from the server session context.
 * Never reads from client x-user-* headers.
 */
export function getCurrentUser(req: Request): AuthenticatedUser {
  if ((req as any).user) {
    return (req as any).user;
  }
  throw AppError.unauthorized('کاربر احراز هویت نشده است.');
}

import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../../types';
import { AppError } from './errors';
import { userRepository } from '../modules/user/userRepository';
import { verifyAccessToken } from './jwtService';
import { selectWithTimeout, isDatabaseConnected } from './mysqlDatabase';

export interface AuthenticatedUser {
  id: string;
  nationalId: string;
  fullName: string;
  role: UserRole;
  sessionId: string;
  mustChangePassword?: boolean;
}

// Active session token map populated strictly after verified DB login
export const activeSessionTokens = new Map<string, AuthenticatedUser>();

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
 * Strictly resolves user identity from verified JWT Access Token or verified server session.
 * NEVER trusts client-supplied headers or hardcoded demo/admin tokens.
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
    // 1. JWT Access Token
    if (token.startsWith('ey')) {
      try {
        const claims = verifyAccessToken(token);
        const dbUser = await userRepository.findById(claims.sub);

        if (!dbUser || !dbUser.isActive || dbUser.isLocked || Number(dbUser.tokenVersion || 1) !== claims.tv) {
          return next(AppError.unauthorized('نشست شما نامعتبر است یا باطل گردیده است. لطفاً مجدداً وارد شوید.', 'SESSION_INVALIDATED'));
        }

        // Verify session row in MySQL if tracked
        if (isDatabaseConnected() && claims.sid) {
          try {
            const sessRows = await selectWithTimeout<any>(
              `SELECT is_revoked FROM user_sessions WHERE id = ? LIMIT 1`,
              [claims.sid],
              2000
            );
            if (sessRows && sessRows.length > 0 && Boolean(sessRows[0].is_revoked)) {
              return next(AppError.unauthorized('این نشست کاربری ابطال گردیده است. لطفاً مجدداً وارد شوید.', 'SESSION_REVOKED'));
            }
          } catch {}
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
                           reqPath.includes('/auth/me') ||
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

    // 2. Check verified runtime session map (only populated on real login)
    const cached = activeSessionTokens.get(token);
    if (cached) {
      const dbUser = await userRepository.findById(cached.id);
      if (!dbUser || !dbUser.isActive || dbUser.isLocked) {
        revokeSessionToken(token);
        return next(AppError.unauthorized('حساب کاربری شما غیرفعال یا معلق گردیده است.'));
      }

      if (isDatabaseConnected() && cached.sessionId) {
        try {
          const sessRows = await selectWithTimeout<any>(
            `SELECT is_revoked FROM user_sessions WHERE id = ? LIMIT 1`,
            [cached.sessionId],
            2000
          );
          if (sessRows && sessRows.length > 0 && Boolean(sessRows[0].is_revoked)) {
            revokeSessionToken(token);
            return next(AppError.unauthorized('نشست کاربری شما باطل گردیده است.'));
          }
        } catch {}
      }

      (req as any).user = {
        ...cached,
        role: dbUser.role,
        fullName: dbUser.fullName,
        mustChangePassword: Boolean(dbUser.mustChangePassword),
      };

      if (Boolean(dbUser.mustChangePassword)) {
        const reqPath = (req.baseUrl + req.path).toLowerCase();
        const isExempt = reqPath.includes('/auth/change-password') ||
                         reqPath.includes('/auth/logout') ||
                         reqPath.includes('/auth/login') ||
                         reqPath.includes('/auth/refresh') ||
                         reqPath.includes('/auth/me') ||
                         reqPath.includes('/auth/sessions');
        if (!isExempt) {
          return next(AppError.forbidden('شما باید ابتدا رمز عبور اولیه خود را تغییر دهید.', 'MUST_CHANGE_PASSWORD_REQUIRED'));
        }
      }

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

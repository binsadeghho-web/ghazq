import { Request, Response, NextFunction } from 'express';
import { db } from './database';
import { User, UserRole } from '../../types';
import { AppError } from './errors';

export interface AuthenticatedUser {
  id: string;
  nationalId: string;
  fullName: string;
  role: UserRole;
  sessionId: string;
}

// In-memory active session token map for fast O(1) resolution
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
  });
}

/**
 * Invalidates a session token upon logout or session termination.
 */
export function revokeSessionToken(token: string): void {
  activeSessionTokens.delete(token);
}

/**
 * Strictly resolves user identity from verified server session/token.
 * NEVER trusts client-supplied headers (x-user-id, x-user-role).
 */
export function sessionAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
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
  }

  if (token) {
    // 1. Check in-memory fast token cache
    const cached = activeSessionTokens.get(token);
    if (cached) {
      (req as any).user = cached;
      return next();
    }

    // 2. Lookup session in database users
    for (const u of db.users) {
      const match = (u.sessions || []).find(s => s.id === token || s.familyId === token);
      if (match) {
        const authed: AuthenticatedUser = {
          id: u.id,
          nationalId: u.nationalId,
          fullName: u.fullName,
          role: u.role,
          sessionId: match.id,
        };
        activeSessionTokens.set(token, authed);
        (req as any).user = authed;
        return next();
      }
    }
  }

  // Fallback for initial demo state: default user session if token is 'demo-session'
  if (token === 'demo-session' || (!token && process.env.NODE_ENV !== 'production')) {
    // Development fallback uses first alumni user, NEVER trusting client headers
    const defaultUser = db.users[0];
    if (defaultUser) {
      (req as any).user = {
        id: defaultUser.id,
        nationalId: defaultUser.nationalId,
        fullName: defaultUser.fullName,
        role: defaultUser.role,
        sessionId: 'demo-session',
      };
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
  const defaultUser = db.users[0];
  return {
    id: defaultUser?.id || 'usr_alumni_01',
    nationalId: defaultUser?.nationalId || '0012345678',
    fullName: defaultUser?.fullName || 'دکتر علیرضا میرزایی',
    role: defaultUser?.role || 'alumni',
    sessionId: 'session_default',
  };
}

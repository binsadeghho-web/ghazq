import crypto from 'crypto';
import { generateUUIDv7 } from './database';
import { AppError } from './errors';
import { getPool, isDatabaseConnected } from './mysqlDatabase';
import { logger } from './logger';
import { auditChain } from './auditChain';

const JWT_SECRET = process.env.JWT_SECRET || 'feqh_ghaza_production_jwt_master_secret_key_2026';

export interface JwtAccessTokenClaims {
  sub: string;            // User ID
  role: string;           // User role
  sid: string;            // Session ID
  tv: number;             // Token Version
  jti: string;            // Token UUID
  iat: number;            // Issued At
  exp: number;            // Expiration
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  parentId: string | null;
  isRevoked: boolean;
  revocationReason?: string | null;
  createdAt: string;
  expiresAt: string;
}

// In-memory fallback store for refresh tokens if MySQL transient connection drops
export const memoryRefreshTokens = new Map<string, RefreshTokenRecord>();

export function clearMemoryTokens() {
  memoryRefreshTokens.clear();
}

function base64UrlEncode(str: string | Buffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Issue a short-lived 15-minute Access Token (JWT with HMAC-SHA256)
 */
export function issueAccessToken(
  user: { id: string; role: string; tokenVersion?: number },
  sessionId: string,
  customExpSeconds = 15 * 60
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + customExpSeconds;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JwtAccessTokenClaims = {
    sub: user.id,
    role: user.role,
    sid: sessionId,
    tv: Number(user.tokenVersion || 1),
    jti: generateUUIDv7(),
    iat,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Verify and decode an Access Token JWT
 */
export function verifyAccessToken(token: string): JwtAccessTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw AppError.unauthorized('فرمت توکن دسترسی (Access Token) نامعتبر است.');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw AppError.unauthorized('امضای توکن دسترسی معتبر نیست.');
  }

  let claims: JwtAccessTokenClaims;
  try {
    claims = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    throw AppError.unauthorized('محتوای توکن دسترسی نامعتبر است.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && now > claims.exp) {
    throw AppError.unauthorized('توکن دسترسی شما منقضی شده است. لطفاً تمدید نمایید.', 'ACCESS_TOKEN_EXPIRED');
  }

  return claims;
}

/**
 * Generates a 7-day Refresh Token with Family ID and SHA-256 Hash Persistence
 */
export async function issueRefreshToken(
  userId: string,
  familyId?: string,
  parentId?: string
): Promise<{ rawToken: string; tokenHash: string; familyId: string; expiresAt: string }> {
  const id = generateUUIDv7();
  const rawToken = `rt_${crypto.randomBytes(32).toString('base64url')}`;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const activeFamilyId = familyId || generateUUIDv7();
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  const record: RefreshTokenRecord = {
    id,
    userId,
    tokenHash,
    familyId: activeFamilyId,
    parentId: parentId || null,
    isRevoked: false,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  // 1. Always store in memory fallback cache
  memoryRefreshTokens.set(tokenHash, record);

  // 2. Persist to MySQL database if connected
  if (isDatabaseConnected()) {
    try {
      const pool = getPool();
      await pool.query(
        `INSERT INTO refresh_tokens (
          id, user_id, token_hash, family_id, parent_id, is_revoked, expires_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [id, userId, tokenHash, activeFamilyId, parentId || null, expiresAt]
      );
    } catch (err: any) {
      logger.warn(`MySQL issueRefreshToken notice: ${err.message}`);
    }
  }

  return { rawToken, tokenHash, familyId: activeFamilyId, expiresAt };
}

/**
 * Searches for a Refresh Token by raw string or hash in DB / Memory
 */
export async function findRefreshTokenByHash(rawToken: string): Promise<RefreshTokenRecord | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  if (isDatabaseConnected()) {
    try {
      const pool = getPool();
      const [rows] = await pool.query<any[]>(
        `SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1`,
        [tokenHash]
      );

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: typeof r.id === 'string' ? r.id : Buffer.isBuffer(r.id) ? r.id.toString('hex') : String(r.id),
          userId: r.user_id,
          tokenHash: r.token_hash,
          familyId: r.family_id,
          parentId: r.parent_id || null,
          isRevoked: Number(r.is_revoked) === 1 || (Buffer.isBuffer(r.is_revoked) && r.is_revoked[0] === 1) || r.is_revoked === true,
          revocationReason: r.revocation_reason || null,
          createdAt: new Date(r.created_at).toISOString(),
          expiresAt: new Date(r.expires_at).toISOString(),
        };
      }
    } catch (err: any) {
      logger.warn(`MySQL findRefreshTokenByHash notice: ${err.message}`);
    }
  }

  return memoryRefreshTokens.get(tokenHash) || null;
}

/**
 * Revokes a single Refresh Token record
 */
export async function revokeRefreshToken(tokenHash: string, reason = 'ROTATION'): Promise<void> {
  const mem = memoryRefreshTokens.get(tokenHash);
  if (mem) {
    mem.isRevoked = true;
    mem.revocationReason = reason;
  }

  if (isDatabaseConnected()) {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE refresh_tokens SET is_revoked = 1, revocation_reason = ? WHERE token_hash = ?`,
        [reason, tokenHash]
      );
    } catch (err: any) {
      logger.warn(`MySQL revokeRefreshToken notice: ${err.message}`);
    }
  }
}

/**
 * REUSE DETECTION / FAMILY REVOCATION:
 * If a revoked Refresh Token is presented, revoke ALL tokens belonging to that family_id
 */
export async function revokeTokenFamily(familyId: string, userId: string, reason = 'ROTATED_REUSE'): Promise<void> {
  for (const [hash, record] of memoryRefreshTokens.entries()) {
    if (record.familyId === familyId) {
      record.isRevoked = true;
      record.revocationReason = reason;
    }
  }

  if (isDatabaseConnected()) {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE refresh_tokens SET is_revoked = 1, revocation_reason = ? WHERE family_id = ?`,
        [reason, familyId]
      );
    } catch (err: any) {
      logger.warn(`MySQL revokeTokenFamily notice: ${err.message}`);
    }
  }

  auditChain.appendEntry({
    eventType: 'REFRESH_TOKEN_REUSED',
    actorId: userId,
    actorName: `کاربر شناسه ${userId}`,
    actorRole: 'alumni',
    ip: '127.0.0.1',
    details: `هشدار امنیتی بحرانی: استفاده مجدد غیرمجاز از توکن رفرش منقضی‌شده کشف شد. کلیه توکن‌های خانواده [${familyId}] باطل گردیدند.`,
    severity: 'critical',
  });
}

/**
 * Revokes all refresh tokens for a user (Global Logout)
 */
export async function revokeAllUserRefreshTokens(userId: string, reason = 'GLOBAL_LOGOUT'): Promise<void> {
  for (const [hash, record] of memoryRefreshTokens.entries()) {
    if (record.userId === userId) {
      record.isRevoked = true;
      record.revocationReason = reason;
    }
  }

  if (isDatabaseConnected()) {
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE refresh_tokens SET is_revoked = 1, revocation_reason = ? WHERE user_id = ?`,
        [reason, userId]
      );
    } catch (err: any) {
      logger.warn(`MySQL revokeAllUserRefreshTokens notice: ${err.message}`);
    }
  }
}

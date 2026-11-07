import { getPool, selectWithTimeout, isDatabaseConnected } from '../../platform/mysqlDatabase';
import { User, UserRole } from '../../../types';
import { AppError } from '../../platform/errors';
import { db } from '../../platform/database';
import { logger } from '../../platform/logger';

export interface UserDbRow {
  id: string;
  national_id: string;
  username: string | null;
  password_hash: string | null;
  full_name: string;
  phone: string;
  role: UserRole;
  role_title: string;
  organization: string;
  graduation_year: string;
  avatar_text: string;
  is_active: number;
  is_locked: number;
  failed_attempts: number;
  locked_until: string | Date | null;
  token_version: number;
  must_change_password: number;
  has_account: number;
  version: number;
  sessions?: string | object | null;
  section_permissions?: string | object | null;
  created_at: string | Date;
  updated_at: string | Date;
}

export function mapRowToUser(row: UserDbRow): User & { password_hash?: string; version: number } {
  let sessions = [];
  try {
    if (typeof row.sessions === 'string') {
      sessions = JSON.parse(row.sessions);
    } else if (Array.isArray(row.sessions)) {
      sessions = row.sessions;
    }
  } catch {}

  let sectionPermissions = undefined;
  try {
    if (typeof row.section_permissions === 'string') {
      sectionPermissions = JSON.parse(row.section_permissions);
    } else if (typeof row.section_permissions === 'object') {
      sectionPermissions = row.section_permissions;
    }
  } catch {}

  return {
    id: typeof row.id === 'string' ? row.id : Buffer.isBuffer(row.id) ? (row.id as Buffer).toString('hex') : String(row.id),
    nationalId: row.national_id,
    username: row.username || row.national_id,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    roleTitle: row.role_title,
    organization: row.organization,
    graduationYear: row.graduation_year,
    avatarText: row.avatar_text || row.full_name.slice(0, 2),
    isActive: Boolean(row.is_active),
    isLocked: Boolean(row.is_locked),
    failedAttempts: Number(row.failed_attempts || 0),
    lockExpiresAt: row.locked_until ? new Date(row.locked_until).toISOString() : undefined,
    tokenVersion: Number(row.token_version || 1),
    mustChangePassword: Boolean(row.must_change_password),
    hasAccount: Boolean(row.has_account),
    version: Number(row.version || 1),
    sessions,
    sectionPermissions,
    password_hash: row.password_hash || undefined,
  } as User & { password_hash?: string; version: number };
}

export class UserRepository {
  async findByNationalIdOrUsername(identifier: string): Promise<(User & { password_hash?: string; version: number }) | undefined> {
    const rawId = (identifier || '').trim();
    const lowerId = rawId.toLowerCase();

    // 1. If MySQL is connected, try querying with graceful error handling
    if (isDatabaseConnected()) {
      try {
        const rows = await selectWithTimeout<UserDbRow>(
          `SELECT * FROM users WHERE national_id = ? OR username = ? OR LOWER(national_id) = ? OR LOWER(username) = ? LIMIT 1`,
          [rawId, rawId, lowerId, lowerId],
          3000
        );

        if (rows && rows.length > 0) {
          return mapRowToUser(rows[0]);
        }
      } catch (err: any) {
        logger.warn(`MySQL findByNationalIdOrUsername failed: ${err.message}. Using fallback engine.`);
      }
    }

    // 2. Persistent in-memory database engine fallback
    const found = db.users.find(u => {
      const uNat = (u.nationalId || '').toLowerCase();
      const uName = (u.username || '').toLowerCase();
      return uNat === lowerId || uName === lowerId || u.nationalId === rawId || u.username === rawId;
    });

    if (!found) return undefined;

    const pwHash = (found as any).password_hash || (found as any).password;
    return {
      ...found,
      password_hash: pwHash,
      version: (found as any).version || 1,
    } as any;
  }

  async findById(id: string): Promise<(User & { password_hash?: string; version: number }) | undefined> {
    if (isDatabaseConnected()) {
      try {
        const rows = await selectWithTimeout<UserDbRow>(
          `SELECT * FROM users WHERE id = ? LIMIT 1`,
          [id],
          3000
        );

        if (rows && rows.length > 0) {
          return mapRowToUser(rows[0]);
        }
      } catch (err: any) {
        logger.warn(`MySQL findById failed: ${err.message}. Using fallback engine.`);
      }
    }

    const found = db.users.find(u => u.id === id);
    if (!found) return undefined;
    const pwHash = (found as any).password_hash || (found as any).password;
    return {
      ...found,
      password_hash: pwHash,
      version: (found as any).version || 1,
    } as any;
  }

  async createUser(user: {
    id: string;
    nationalId: string;
    username?: string;
    passwordHash: string;
    passwordRaw?: string;
    fullName: string;
    phone: string;
    role: UserRole;
    roleTitle: string;
    organization: string;
    graduationYear: string;
    avatarText?: string;
    isActive?: boolean;
    mustChangePassword?: boolean;
    siteTitle?: string;
    profilePictureUrl?: string;
    judicialGrade?: number;
    courtBranch?: string;
    province?: string;
  }): Promise<User> {
    const avatarText = user.avatarText || user.fullName.slice(0, 2);
    const isActive = user.isActive !== undefined ? user.isActive : true;
    const mustChangePassword = user.mustChangePassword !== undefined ? user.mustChangePassword : true;
    const username = user.username || user.nationalId;

    // 1. Always write to in-memory database engine for instantaneous availability
    const newUser: User = {
      id: user.id,
      nationalId: user.nationalId,
      username,
      password: user.passwordRaw,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      roleTitle: user.roleTitle,
      siteTitle: user.siteTitle,
      profilePictureUrl: user.profilePictureUrl,
      organization: user.organization,
      graduationYear: user.graduationYear,
      avatarText,
      isActive,
      isLocked: false,
      failedAttempts: 0,
      tokenVersion: 1,
      mustChangePassword: Boolean(mustChangePassword),
      hasAccount: true,
      judicialGrade: user.judicialGrade,
      courtBranch: user.courtBranch,
      province: user.province,
      sessions: [],
      version: 1,
    } as any;

    (newUser as any).password_hash = user.passwordHash;

    const existingIdx = db.users.findIndex(u => u.id === user.id || u.nationalId === user.nationalId || (u.username && u.username === username));
    if (existingIdx !== -1) {
      db.users[existingIdx] = newUser as any;
    } else {
      db.users.unshift(newUser as any);
    }

    // 2. If MySQL is connected, insert or update asynchronously
    if (isDatabaseConnected()) {
      try {
        const pool = getPool();
        await pool.query(
          `INSERT INTO users (
            id, national_id, username, password_hash, full_name, phone, role, role_title,
            organization, graduation_year, avatar_text, is_active, is_locked, failed_attempts,
            token_version, must_change_password, has_account, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, 1, 1)
          ON DUPLICATE KEY UPDATE
            password_hash = VALUES(password_hash),
            full_name = VALUES(full_name),
            phone = VALUES(phone),
            role = VALUES(role),
            role_title = VALUES(role_title)`,
          [
            user.id,
            user.nationalId,
            username,
            user.passwordHash,
            user.fullName,
            user.phone,
            user.role,
            user.roleTitle,
            user.organization,
            user.graduationYear,
            avatarText,
            isActive ? 1 : 0,
            mustChangePassword ? 1 : 0,
          ]
        );
      } catch (err: any) {
        logger.warn(`MySQL createUser warning: ${err.message}. Saved to in-memory store.`);
      }
    }

    return newUser;
  }

  async updateUserOptimistic(
    id: string,
    updates: {
      fullName?: string;
      phone?: string;
      role?: UserRole;
      roleTitle?: string;
      organization?: string;
      graduationYear?: string;
      isActive?: boolean;
      isLocked?: boolean;
      passwordHash?: string;
      mustChangePassword?: boolean;
      tokenVersionIncrement?: boolean;
    },
    expectedVersion?: number
  ): Promise<User> {
    // 1. Always update in-memory
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const current = db.users[idx];
      const updated = {
        ...current,
        ...updates,
        version: (current.version || 1) + 1,
      };
      if (updates.passwordHash) (updated as any).password_hash = updates.passwordHash;
      if (updates.tokenVersionIncrement) updated.tokenVersion = (updated.tokenVersion || 1) + 1;
      db.users[idx] = updated;
    }

    // 2. Update MySQL if connected
    if (isDatabaseConnected()) {
      try {
        const current = await this.findById(id);
        if (current) {
          const fields: string[] = [];
          const params: any[] = [];

          if (updates.fullName !== undefined) { fields.push('full_name = ?'); params.push(updates.fullName); }
          if (updates.phone !== undefined) { fields.push('phone = ?'); params.push(updates.phone); }
          if (updates.role !== undefined) { fields.push('role = ?'); params.push(updates.role); }
          if (updates.roleTitle !== undefined) { fields.push('role_title = ?'); params.push(updates.roleTitle); }
          if (updates.organization !== undefined) { fields.push('organization = ?'); params.push(updates.organization); }
          if (updates.graduationYear !== undefined) { fields.push('graduation_year = ?'); params.push(updates.graduationYear); }
          if (updates.isActive !== undefined) { fields.push('is_active = ?'); params.push(updates.isActive ? 1 : 0); }
          if (updates.isLocked !== undefined) {
            fields.push('is_locked = ?');
            params.push(updates.isLocked ? 1 : 0);
            if (!updates.isLocked) {
              fields.push('failed_attempts = 0', 'locked_until = NULL');
            }
          }
          if (updates.passwordHash !== undefined) {
            fields.push('password_hash = ?');
            params.push(updates.passwordHash);
          }
          if (updates.mustChangePassword !== undefined) {
            fields.push('must_change_password = ?');
            params.push(updates.mustChangePassword ? 1 : 0);
          }
          if (updates.tokenVersionIncrement) {
            fields.push('token_version = token_version + 1');
          }

          fields.push('version = version + 1');

          if (fields.length > 1) {
            params.push(id);
            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            const pool = getPool();
            await pool.query(sql, params);
          }
        }
      } catch (err: any) {
        logger.warn(`MySQL updateUserOptimistic warning: ${err.message}`);
      }
    }

    const res = await this.findById(id);
    if (!res) throw AppError.notFound('کاربر');
    return res;
  }

  async incrementFailedAttempts(id: string): Promise<{ isNowLocked: boolean; remainingAttempts: number }> {
    const u = db.users.find(usr => usr.id === id);
    if (u) {
      u.failedAttempts = (u.failedAttempts || 0) + 1;
      if (u.failedAttempts >= 10) {
        u.isLocked = true;
      }
    }

    if (isDatabaseConnected()) {
      try {
        const pool = getPool();
        await pool.query(
          `UPDATE users 
           SET failed_attempts = failed_attempts + 1,
               is_locked = IF(failed_attempts + 1 >= 10, TRUE, is_locked),
               locked_until = IF(failed_attempts + 1 >= 10, DATE_ADD(NOW(), INTERVAL 30 MINUTE), locked_until)
           WHERE id = ?`,
          [id]
        );
      } catch (err: any) {
        logger.warn(`MySQL incrementFailedAttempts notice: ${err.message}`);
      }
    }

    const user = await this.findById(id);
    if (!user) return { isNowLocked: false, remainingAttempts: 9 };
    return {
      isNowLocked: user.isLocked,
      remainingAttempts: Math.max(0, 10 - user.failedAttempts),
    };
  }

  async resetFailedAttempts(id: string): Promise<void> {
    const u = db.users.find(usr => usr.id === id);
    if (u) {
      u.failedAttempts = 0;
      u.isLocked = false;
      u.lockExpiresAt = undefined;
    }

    if (isDatabaseConnected()) {
      try {
        const pool = getPool();
        await pool.query(
          `UPDATE users SET failed_attempts = 0, is_locked = FALSE, locked_until = NULL WHERE id = ?`,
          [id]
        );
      } catch (err: any) {
        logger.warn(`MySQL resetFailedAttempts notice: ${err.message}`);
      }
    }
  }

  async listUsers(search?: string, roleFilter?: string): Promise<User[]> {
    if (isDatabaseConnected()) {
      try {
        let sql = `SELECT * FROM users WHERE 1=1`;
        const params: any[] = [];

        if (roleFilter && roleFilter !== 'all') {
          sql += ` AND role = ?`;
          params.push(roleFilter);
        }

        if (search && search.trim()) {
          const term = `%${search.trim()}%`;
          sql += ` AND (full_name LIKE ? OR national_id LIKE ? OR username LIKE ? OR phone LIKE ? OR organization LIKE ?)`;
          params.push(term, term, term, term, term);
        }

        sql += ` ORDER BY created_at DESC LIMIT 200`;

        const rows = await selectWithTimeout<UserDbRow>(sql, params, 3000);
        if (rows && rows.length > 0) {
          return rows.map(mapRowToUser);
        }
      } catch (err: any) {
        logger.warn(`MySQL listUsers failed: ${err.message}. Using fallback engine.`);
      }
    }

    return db.users.filter(u => {
      if (roleFilter && roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return u.fullName.toLowerCase().includes(s) || u.nationalId.includes(s) || (u.username && u.username.toLowerCase().includes(s));
      }
      return true;
    });
  }
}

export const userRepository = new UserRepository();

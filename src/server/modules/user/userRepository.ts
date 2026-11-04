import { getPool, selectWithTimeout, isDatabaseConnected } from '../../platform/mysqlDatabase';
import { User, UserRole } from '../../../types';
import { AppError } from '../../platform/errors';
import { db } from '../../platform/database';

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
    if (!isDatabaseConnected()) {
      // Memory fallback for offline test suites
      const found = db.users.find(u => u.nationalId === identifier || u.username === identifier);
      if (!found) return undefined;
      return { ...found, version: (found as any).version || 1 } as any;
    }

    const rows = await selectWithTimeout<UserDbRow>(
      `SELECT * FROM users WHERE national_id = ? OR username = ? LIMIT 1`,
      [identifier, identifier],
      3000
    );

    if (!rows || rows.length === 0) return undefined;
    return mapRowToUser(rows[0]);
  }

  async findById(id: string): Promise<(User & { password_hash?: string; version: number }) | undefined> {
    if (!isDatabaseConnected()) {
      const found = db.users.find(u => u.id === id);
      if (!found) return undefined;
      return { ...found, version: (found as any).version || 1 } as any;
    }

    const rows = await selectWithTimeout<UserDbRow>(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [id],
      3000
    );

    if (!rows || rows.length === 0) return undefined;
    return mapRowToUser(rows[0]);
  }

  async createUser(user: {
    id: string;
    nationalId: string;
    username?: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    role: UserRole;
    roleTitle: string;
    organization: string;
    graduationYear: string;
    avatarText?: string;
    isActive?: boolean;
    mustChangePassword?: boolean;
  }): Promise<User> {
    const avatarText = user.avatarText || user.fullName.slice(0, 2);
    const isActive = user.isActive !== undefined ? user.isActive : true;
    const mustChangePassword = user.mustChangePassword ? 1 : 0;
    const username = user.username || user.nationalId;

    if (!isDatabaseConnected()) {
      const newUser: User = {
        id: user.id,
        nationalId: user.nationalId,
        username,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        roleTitle: user.roleTitle,
        organization: user.organization,
        graduationYear: user.graduationYear,
        avatarText,
        isActive,
        isLocked: false,
        failedAttempts: 0,
        tokenVersion: 1,
        mustChangePassword: Boolean(mustChangePassword),
        sessions: [],
        version: 1,
      } as any;
      (newUser as any).password_hash = user.passwordHash;
      db.users.push(newUser as any);
      return newUser;
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO users (
        id, national_id, username, password_hash, full_name, phone, role, role_title,
        organization, graduation_year, avatar_text, is_active, is_locked, failed_attempts,
        token_version, must_change_password, has_account, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, 1, 1)`,
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
        mustChangePassword,
      ]
    );

    const created = await this.findById(user.id);
    if (!created) throw AppError.internal('خطا در ایجاد کاربر در دیتابیس.');
    return created;
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
    if (!isDatabaseConnected()) {
      const idx = db.users.findIndex(u => u.id === id);
      if (idx === -1) throw AppError.notFound('کاربر');
      const current = db.users[idx];
      if (expectedVersion !== undefined && current.version !== expectedVersion) {
        throw AppError.conflict('اطلاعات کاربر در این فاصله تغییر کرده است.');
      }
      const updated = {
        ...current,
        ...updates,
        version: current.version + 1,
      };
      if (updates.passwordHash) (updated as any).password_hash = updates.passwordHash;
      if (updates.tokenVersionIncrement) updated.tokenVersion += 1;
      db.users[idx] = updated;
      return updated;
    }

    const current = await this.findById(id);
    if (!current) throw AppError.notFound('کاربر');

    const curVer = current.version;
    if (expectedVersion !== undefined && curVer !== expectedVersion) {
      throw AppError.conflict(
        `تداخل در همزمانی داده‌ها (نسخه کنونی: ${curVer}، نسخه ارسالی: ${expectedVersion}).`
      );
    }

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

    if (updates.tokenVersionIncrement || updates.role !== undefined || updates.isActive !== undefined || updates.passwordHash !== undefined) {
      fields.push('token_version = token_version + 1');
    }

    fields.push('version = version + 1');

    params.push(id);
    let sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    if (expectedVersion !== undefined) {
      sql += ` AND version = ?`;
      params.push(expectedVersion);
    }

    const pool = getPool();
    const [res] = await pool.query<any>(sql, params);

    if (res.affectedRows === 0) {
      throw AppError.conflict('ویرایش ناموفق بود؛ نسخه داده تغییر کرده است.');
    }

    const updated = await this.findById(id);
    if (!updated) throw AppError.notFound('کاربر پس از به‌روزرسانی یافت نشد.');
    return updated;
  }

  async incrementFailedAttempts(id: string): Promise<{ isNowLocked: boolean; remainingAttempts: number }> {
    if (!isDatabaseConnected()) {
      const u = db.users.find(usr => usr.id === id);
      if (u) {
        u.failedAttempts += 1;
        if (u.failedAttempts >= 10) {
          u.isLocked = true;
        }
        return { isNowLocked: u.isLocked, remainingAttempts: Math.max(0, 10 - u.failedAttempts) };
      }
      return { isNowLocked: false, remainingAttempts: 9 };
    }

    const pool = getPool();
    await pool.query(
      `UPDATE users 
       SET failed_attempts = failed_attempts + 1,
           is_locked = IF(failed_attempts + 1 >= 10, TRUE, is_locked),
           locked_until = IF(failed_attempts + 1 >= 10, DATE_ADD(NOW(), INTERVAL 30 MINUTE), locked_until)
       WHERE id = ?`,
      [id]
    );

    const user = await this.findById(id);
    if (!user) return { isNowLocked: false, remainingAttempts: 9 };
    return {
      isNowLocked: user.isLocked,
      remainingAttempts: Math.max(0, 10 - user.failedAttempts),
    };
  }

  async resetFailedAttempts(id: string): Promise<void> {
    if (!isDatabaseConnected()) {
      const u = db.users.find(usr => usr.id === id);
      if (u) {
        u.failedAttempts = 0;
        u.isLocked = false;
        u.lockExpiresAt = undefined;
      }
      return;
    }

    const pool = getPool();
    await pool.query(
      `UPDATE users SET failed_attempts = 0, is_locked = FALSE, locked_until = NULL WHERE id = ?`,
      [id]
    );
  }

  async listUsers(search?: string, roleFilter?: string): Promise<User[]> {
    if (!isDatabaseConnected()) {
      return db.users.filter(u => {
        if (roleFilter && roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (search) {
          const s = search.toLowerCase();
          return u.fullName.toLowerCase().includes(s) || u.nationalId.includes(s) || (u.username && u.username.toLowerCase().includes(s));
        }
        return true;
      });
    }

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
    return rows.map(mapRowToUser);
  }
}

export const userRepository = new UserRepository();

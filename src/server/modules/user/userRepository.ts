import { getPool, selectWithTimeout, isDatabaseConnected, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { User, UserRole } from '../../../types';
import { AppError } from '../../platform/errors';
import { db } from '../../platform/database';
import { logger } from '../../platform/logger';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';

export interface UserDbRow {
  id: string;
  national_id: string;
  username: string | null;
  password_hash: string | null;
  full_name: string;
  phone: string;
  role: UserRole;
  role_title: string;
  site_title: string | null;
  profile_picture_url: string | null;
  personnel_id: string | null;
  judicial_grade: number | null;
  court_branch: string | null;
  province: string | null;
  email: string | null;
  academic_degree: string | null;
  thesis_title: string | null;
  supervisor_professor: string | null;
  birth_date: string | null;
  father_name: string | null;
  id_number: string | null;
  marital_status: string | null;
  children_count: number | null;
  residential_address: string | null;
  seminary_level: string | null;
  seminary_school: string | null;
  university_degree: string | null;
  university_name: string | null;
  field_of_study: string | null;
  academic_honors: string | null;
  association_membership_date: string | null;
  association_responsibility: string | null;
  association_contributions: string | object | null;
  membership_status: string | null;
  internal_notes: string | null;
  employment_status: string | null;
  current_judicial_post: string | null;
  service_years: number | null;
  judicial_specialty: string | null;
  permissions: string | object | null;
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
  deleted_at?: string | Date | null;
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

  let permissions = undefined;
  try {
    if (typeof row.permissions === 'string') {
      permissions = JSON.parse(row.permissions);
    } else if (typeof row.permissions === 'object') {
      permissions = row.permissions;
    }
  } catch {}

  let associationContributions = undefined;
  try {
    if (typeof row.association_contributions === 'string') {
      associationContributions = JSON.parse(row.association_contributions);
    } else if (Array.isArray(row.association_contributions)) {
      associationContributions = row.association_contributions;
    }
  } catch {}

  const userObj: any = {
    id: fromIdBuffer(row.id),
    nationalId: row.national_id,
    username: row.username || row.national_id,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    roleTitle: row.role_title,
    siteTitle: row.site_title || undefined,
    profilePictureUrl: row.profile_picture_url || undefined,
    personnelId: row.personnel_id || undefined,
    judicialGrade: row.judicial_grade !== null ? Number(row.judicial_grade) : 0,
    courtBranch: row.court_branch || undefined,
    province: row.province || undefined,
    email: row.email || undefined,
    academicDegree: row.academic_degree || undefined,
    thesisTitle: row.thesis_title || undefined,
    supervisorProfessor: row.supervisor_professor || undefined,
    birthDate: row.birth_date || undefined,
    fatherName: row.father_name || undefined,
    idNumber: row.id_number || undefined,
    maritalStatus: row.marital_status as any,
    childrenCount: row.children_count !== null ? Number(row.children_count) : 0,
    residentialAddress: row.residential_address || undefined,
    seminaryLevel: row.seminary_level || undefined,
    seminarySchool: row.seminary_school || undefined,
    universityDegree: row.university_degree || undefined,
    universityName: row.university_name || undefined,
    fieldOfStudy: row.field_of_study || undefined,
    academicHonors: row.academic_honors || undefined,
    associationMembershipDate: row.association_membership_date || undefined,
    associationResponsibility: row.association_responsibility || undefined,
    associationContributions,
    membershipStatus: row.membership_status as any,
    internalNotes: row.internal_notes || undefined,
    employmentStatus: row.employment_status as any,
    currentJudicialPost: row.current_judicial_post || undefined,
    serviceYears: row.service_years !== null ? Number(row.service_years) : 0,
    judicialSpecialty: row.judicial_specialty || undefined,
    permissions,
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
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : undefined,
    status: row.deleted_at ? 'archived' : (row.is_locked ? 'locked' : (row.is_active ? 'active' : 'suspended')),
    sessions,
    sectionPermissions,
    password_hash: row.password_hash || undefined,
  };

  delete userObj.password;
  delete userObj.passwordRaw;

  return userObj;
}

export class UserRepository {
  async findByNationalIdOrUsername(identifier: string, includeArchived = false): Promise<(User & { password_hash?: string; version: number }) | undefined> {
    const rawId = (identifier || '').trim();
    const lowerId = rawId.toLowerCase();

    ensureDatabaseConnection();
    try {
      const sql = includeArchived
        ? `SELECT * FROM users WHERE (national_id = ? OR username = ? OR LOWER(national_id) = ? OR LOWER(username) = ?) LIMIT 1`
        : `SELECT * FROM users WHERE (national_id = ? OR username = ? OR LOWER(national_id) = ? OR LOWER(username) = ?) AND deleted_at IS NULL LIMIT 1`;
      const rows = await selectWithTimeout<UserDbRow>(
        sql,
        [rawId, rawId, lowerId, lowerId],
        3000
      );

      if (rows && rows.length > 0) {
        return mapRowToUser(rows[0]);
      }
      return undefined;
    } catch (err: any) {
      logger.error(`MySQL findByNationalIdOrUsername error: ${err.message}`);
      throw AppError.serviceUnavailable('پایگاه داده در دسترس نیست یا با خطا مواجه شد.');
    }
  }

  async findById(id: string, includeArchived = false): Promise<(User & { password_hash?: string; version: number }) | undefined> {
    ensureDatabaseConnection();
    try {
      const sql = includeArchived
        ? `SELECT * FROM users WHERE id = ? LIMIT 1`
        : `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`;
      const rows = await selectWithTimeout<UserDbRow>(
        sql,
        [id],
        3000
      );

      if (rows && rows.length > 0) {
        return mapRowToUser(rows[0]);
      }
      return undefined;
    } catch (err: any) {
      logger.error(`MySQL findById error: ${err.message}`);
      throw AppError.serviceUnavailable('پایگاه داده در دسترس نیست یا با خطا مواجه شد.');
    }
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
    siteTitle?: string;
    profilePictureUrl?: string;
    personnelId?: string;
    judicialGrade?: number;
    courtBranch?: string;
    province?: string;
    email?: string;
    academicDegree?: string;
    thesisTitle?: string;
    supervisorProfessor?: string;
    birthDate?: string;
    fatherName?: string;
    idNumber?: string;
    maritalStatus?: string;
    childrenCount?: number;
    residentialAddress?: string;
    seminaryLevel?: string;
    seminarySchool?: string;
    universityDegree?: string;
    universityName?: string;
    fieldOfStudy?: string;
    academicHonors?: string;
    associationMembershipDate?: string;
    associationResponsibility?: string;
    associationContributions?: string[];
    membershipStatus?: string;
    internalNotes?: string;
    employmentStatus?: string;
    currentJudicialPost?: string;
    serviceYears?: number;
    judicialSpecialty?: string;
    permissions?: any;
    sectionPermissions?: any;
  }): Promise<User> {
    const avatarText = user.avatarText || user.fullName.slice(0, 2);
    const isActive = user.isActive !== undefined ? user.isActive : true;
    const mustChangePassword = user.mustChangePassword !== undefined ? user.mustChangePassword : true;
    const username = user.username || user.nationalId;

    const newUser: User = {
      id: user.id,
      nationalId: user.nationalId,
      username,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      roleTitle: user.roleTitle,
      siteTitle: user.siteTitle,
      profilePictureUrl: user.profilePictureUrl,
      personnelId: user.personnelId,
      judicialGrade: user.judicialGrade || 0,
      courtBranch: user.courtBranch,
      province: user.province,
      email: user.email,
      academicDegree: user.academicDegree,
      thesisTitle: user.thesisTitle,
      supervisorProfessor: user.supervisorProfessor,
      birthDate: user.birthDate,
      fatherName: user.fatherName,
      idNumber: user.idNumber,
      maritalStatus: user.maritalStatus as any,
      childrenCount: user.childrenCount || 0,
      residentialAddress: user.residentialAddress,
      seminaryLevel: user.seminaryLevel,
      seminarySchool: user.seminarySchool,
      universityDegree: user.universityDegree,
      universityName: user.universityName,
      fieldOfStudy: user.fieldOfStudy,
      academicHonors: user.academicHonors,
      associationMembershipDate: user.associationMembershipDate,
      associationResponsibility: user.associationResponsibility,
      associationContributions: user.associationContributions,
      membershipStatus: user.membershipStatus as any,
      internalNotes: user.internalNotes,
      employmentStatus: user.employmentStatus as any,
      currentJudicialPost: user.currentJudicialPost,
      serviceYears: user.serviceYears || 0,
      judicialSpecialty: user.judicialSpecialty,
      permissions: user.permissions,
      sectionPermissions: user.sectionPermissions,
      organization: user.organization,
      graduationYear: user.graduationYear,
      avatarText,
      isActive,
      isLocked: false,
      failedAttempts: 0,
      tokenVersion: 1,
      mustChangePassword: Boolean(mustChangePassword),
      hasAccount: true,
      sessions: [],
      version: 1,
    };

    ensureDatabaseConnection();
    const pool = getPool();

    try {
      await pool.query(
        `INSERT INTO users (
          id, national_id, username, password_hash, full_name, phone, role, role_title,
          site_title, profile_picture_url, personnel_id, judicial_grade, court_branch, province,
          email, academic_degree, thesis_title, supervisor_professor, birth_date, father_name,
          id_number, marital_status, children_count, residential_address, seminary_level,
          seminary_school, university_degree, university_name, field_of_study, academic_honors,
          association_membership_date, association_responsibility, association_contributions,
          membership_status, internal_notes, employment_status, current_judicial_post,
          service_years, judicial_specialty, permissions, organization, graduation_year,
          avatar_text, is_active, is_locked, failed_attempts, token_version, must_change_password,
          has_account, version, sessions, section_permissions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, 1, 1, '[]', ?)
        ON DUPLICATE KEY UPDATE
          password_hash = VALUES(password_hash),
          full_name = VALUES(full_name),
          phone = VALUES(phone),
          role = VALUES(role),
          role_title = VALUES(role_title),
          site_title = VALUES(site_title),
          profile_picture_url = VALUES(profile_picture_url),
          personnel_id = VALUES(personnel_id),
          judicial_grade = VALUES(judicial_grade),
          court_branch = VALUES(court_branch),
          province = VALUES(province),
          email = VALUES(email),
          academic_degree = VALUES(academic_degree),
          thesis_title = VALUES(thesis_title),
          supervisor_professor = VALUES(supervisor_professor),
          birth_date = VALUES(birth_date),
          father_name = VALUES(father_name),
          id_number = VALUES(id_number),
          marital_status = VALUES(marital_status),
          children_count = VALUES(children_count),
          residential_address = VALUES(residential_address),
          seminary_level = VALUES(seminary_level),
          seminary_school = VALUES(seminary_school),
          university_degree = VALUES(university_degree),
          university_name = VALUES(university_name),
          field_of_study = VALUES(field_of_study),
          academic_honors = VALUES(academic_honors),
          association_membership_date = VALUES(association_membership_date),
          association_responsibility = VALUES(association_responsibility),
          association_contributions = VALUES(association_contributions),
          membership_status = VALUES(membership_status),
          internal_notes = VALUES(internal_notes),
          employment_status = VALUES(employment_status),
          current_judicial_post = VALUES(current_judicial_post),
          service_years = VALUES(service_years),
          judicial_specialty = VALUES(judicial_specialty),
          permissions = VALUES(permissions),
          organization = VALUES(organization),
          graduation_year = VALUES(graduation_year),
          avatar_text = VALUES(avatar_text),
          is_active = VALUES(is_active)`,
        [
          user.id,
          user.nationalId,
          username,
          user.passwordHash,
          user.fullName,
          user.phone,
          user.role,
          user.roleTitle,
          user.siteTitle || null,
          user.profilePictureUrl || null,
          user.personnelId || null,
          Number(user.judicialGrade) || 0,
          user.courtBranch || null,
          user.province || null,
          user.email || null,
          user.academicDegree || null,
          user.thesisTitle || null,
          user.supervisorProfessor || null,
          user.birthDate || null,
          user.fatherName || null,
          user.idNumber || null,
          user.maritalStatus || null,
          Number(user.childrenCount) || 0,
          user.residentialAddress || null,
          user.seminaryLevel || null,
          user.seminarySchool || null,
          user.universityDegree || null,
          user.universityName || null,
          user.fieldOfStudy || null,
          user.academicHonors || null,
          user.associationMembershipDate || null,
          user.associationResponsibility || null,
          user.associationContributions ? JSON.stringify(user.associationContributions) : null,
          user.membershipStatus || null,
          user.internalNotes || null,
          user.employmentStatus || null,
          user.currentJudicialPost || null,
          Number(user.serviceYears) || 0,
          user.judicialSpecialty || null,
          user.permissions ? JSON.stringify(user.permissions) : null,
          user.organization,
          user.graduationYear,
          avatarText,
          isActive ? 1 : 0,
          mustChangePassword ? 1 : 0,
          user.sectionPermissions ? JSON.stringify(user.sectionPermissions) : null,
        ]
      );
    } catch (err: any) {
      logger.error(`MySQL createUser error: ${err.message}`);
      throw AppError.serviceUnavailable('ثبت کاربر در پایگاه داده با خطا مواجه شد.');
    }

    const created = await this.findById(user.id);
    if (!created) {
      throw AppError.internal('خطا در بازخوانی حساب کاربر ایجاد شده');
    }
    return created;
  }

  async updateUserOptimistic(
    id: string,
    updates: Record<string, any>,
    expectedVersion?: number
  ): Promise<User> {
    ensureDatabaseConnection();

    // 1. Dynamic Uniqueness check ONLY for fields explicitly supplied in updates
    const checkConds: string[] = [];
    const checkParams: any[] = [];

    if (updates.nationalId !== undefined && updates.nationalId !== null && String(updates.nationalId).trim() !== '') {
      checkConds.push('national_id = ?');
      checkParams.push(String(updates.nationalId).trim());
    }
    if (updates.username !== undefined && updates.username !== null && String(updates.username).trim() !== '') {
      checkConds.push('username = ?');
      checkParams.push(String(updates.username).trim());
    }

    if (checkConds.length > 0) {
      const pool = getPool();
      const sql = `SELECT id FROM users WHERE (${checkConds.join(' OR ')}) AND id != ? AND deleted_at IS NULL LIMIT 1`;
      checkParams.push(id);

      const [existing]: any = await pool.query(sql, checkParams);
      if (existing && existing.length > 0) {
        throw AppError.conflict('کد ملی یا نام کاربری وارد شده متعلق به کاربر دیگری است.');
      }
    }

    // 2. Security impact flag (role change, account block/lock, password change, token version increment)
    const isSecurityImpacted =
      updates.role !== undefined ||
      updates.isActive === false ||
      updates.isLocked === true ||
      updates.passwordHash !== undefined ||
      Boolean(updates.tokenVersionIncrement);

    try {
      await withTx(async (conn) => {
        const fields: string[] = [];
        const params: any[] = [];

        const colMap: Record<string, string> = {
          fullName: 'full_name',
          nationalId: 'national_id',
          username: 'username',
          phone: 'phone',
          role: 'role',
          roleTitle: 'role_title',
          siteTitle: 'site_title',
          profilePictureUrl: 'profile_picture_url',
          personnelId: 'personnel_id',
          judicialGrade: 'judicial_grade',
          courtBranch: 'court_branch',
          province: 'province',
          email: 'email',
          academicDegree: 'academic_degree',
          thesisTitle: 'thesis_title',
          supervisorProfessor: 'supervisor_professor',
          birthDate: 'birth_date',
          fatherName: 'father_name',
          idNumber: 'id_number',
          maritalStatus: 'marital_status',
          childrenCount: 'children_count',
          residentialAddress: 'residential_address',
          seminaryLevel: 'seminary_level',
          seminarySchool: 'seminary_school',
          universityDegree: 'university_degree',
          universityName: 'university_name',
          fieldOfStudy: 'field_of_study',
          academicHonors: 'academic_honors',
          associationMembershipDate: 'association_membership_date',
          associationResponsibility: 'association_responsibility',
          membershipStatus: 'membership_status',
          internalNotes: 'internal_notes',
          employmentStatus: 'employment_status',
          currentJudicialPost: 'current_judicial_post',
          serviceYears: 'service_years',
          judicialSpecialty: 'judicial_specialty',
          organization: 'organization',
          graduationYear: 'graduation_year',
          avatarText: 'avatar_text',
        };

        for (const [key, col] of Object.entries(colMap)) {
          if (updates[key] !== undefined) {
            fields.push(`${col} = ?`);
            params.push(updates[key]);
          }
        }

        if (updates.associationContributions !== undefined) {
          fields.push(`association_contributions = ?`);
          params.push(updates.associationContributions ? JSON.stringify(updates.associationContributions) : null);
        }
        if (updates.permissions !== undefined) {
          fields.push(`permissions = ?`);
          params.push(updates.permissions ? JSON.stringify(updates.permissions) : null);
        }
        if (updates.sectionPermissions !== undefined) {
          fields.push(`section_permissions = ?`);
          params.push(updates.sectionPermissions ? JSON.stringify(updates.sectionPermissions) : null);
        }
        if (updates.isActive !== undefined) {
          fields.push('is_active = ?');
          params.push(updates.isActive ? 1 : 0);
        }
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

        if (isSecurityImpacted) {
          fields.push('token_version = token_version + 1');
        }

        fields.push('version = version + 1');

        if (fields.length > 0) {
          let sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
          params.push(id);

          if (expectedVersion !== undefined && expectedVersion !== null && !isNaN(Number(expectedVersion))) {
            sql += ` AND version = ?`;
            params.push(Number(expectedVersion));
          }

          logger.info(`[SQL UPDATE users OCC] SQL: ${sql} | Params: ${JSON.stringify(params)}`);
          const [res]: any = await conn.query(sql, params);
          if (res && res.affectedRows === 0) {
            throw AppError.conflict('اطلاعات کاربر توسط کاربر یا مدیر دیگری هم‌زمان تغییر یافته است. لطفاً صفحه را بازخوانی فرمایید.');
          }
        }

        if (isSecurityImpacted) {
          // Instant revocation of all user sessions & refresh tokens
          await conn.query(`UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = ?`, [id]);
          await conn.query(`UPDATE refresh_tokens SET is_revoked = TRUE, revocation_reason = 'SECURITY_CHANGE' WHERE user_id = ?`, [id]);
        }
      });
    } catch (err: any) {
      logger.error(`MySQL updateUserOptimistic error: ${err.message}`);
      if (err instanceof AppError) throw err;
      throw AppError.serviceUnavailable('ویرایش اطلاعات کاربر در پایگاه داده با خطا مواجه شد.');
    }

    const res = await this.findById(id);
    if (!res) throw AppError.notFound('کاربر');
    delete (res as any).password;
    delete (res as any).passwordRaw;
    return res;
  }

  async incrementFailedAttempts(id: string): Promise<{ isNowLocked: boolean; remainingAttempts: number }> {
    ensureDatabaseConnection();
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE users 
         SET failed_attempts = failed_attempts + 1,
             is_locked = IF(failed_attempts + 1 >= 10, TRUE, is_locked),
             locked_until = IF(failed_attempts + 1 >= 10, DATE_ADD(NOW(), INTERVAL 30 MINUTE), locked_until)
         WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );
      const updated = await this.findById(id);
      const attempts = updated ? updated.failedAttempts || 0 : 0;
      const isLocked = updated ? Boolean(updated.isLocked) : false;
      return { isNowLocked: isLocked, remainingAttempts: Math.max(0, 10 - attempts) };
    } catch (err: any) {
      logger.error(`MySQL incrementFailedAttempts error: ${err.message}`);
      throw AppError.serviceUnavailable('بررسی نرخ تلاش‌های ورود با خطا مواجه شد.');
    }
  }

  async resetFailedAttempts(id: string): Promise<void> {
    ensureDatabaseConnection();
    try {
      const pool = getPool();
      await pool.query(
        `UPDATE users SET failed_attempts = 0, is_locked = FALSE, locked_until = NULL WHERE id = ? AND deleted_at IS NULL`,
        [id]
      );
    } catch (err: any) {
      logger.error(`MySQL resetFailedAttempts error: ${err.message}`);
      throw AppError.serviceUnavailable('بازنشانی تلاش‌های ناموفق با خطا مواجه شد.');
    }
  }

  async deleteUser(id: string): Promise<void> {
    ensureDatabaseConnection();
    try {
      await withTx(async (conn) => {
        // 1. Soft Delete user
        const [res]: any = await conn.query(
          `UPDATE users 
           SET deleted_at = NOW(3), 
               status = 'archived',
               is_active = FALSE, 
               token_version = token_version + 1,
               version = version + 1
           WHERE id = ? AND deleted_at IS NULL`,
          [id]
        );
        if (!res || res.affectedRows === 0) {
          throw AppError.notFound('کاربر مورد نظر یا یافت نشد یا قبلاً حذف نرم شده است.');
        }

        // 2. Revoke all active sessions
        await conn.query(
          `UPDATE user_sessions SET is_revoked = TRUE WHERE user_id = ?`,
          [id]
        );

        // 3. Revoke all refresh tokens
        await conn.query(
          `UPDATE refresh_tokens SET is_revoked = TRUE, revocation_reason = 'USER_DELETED' WHERE user_id = ?`,
          [id]
        );
      });
    } catch (err: any) {
      logger.error(`MySQL deleteUser (Soft Delete) error: ${err.message}`);
      if (err instanceof AppError) throw err;
      throw AppError.serviceUnavailable('حذف نرم کاربر با خطا مواجه شد.');
    }
  }

  async listUsers(search?: string, roleFilter?: string, includeArchived = false): Promise<User[]> {
    ensureDatabaseConnection();
    try {
      let sql = `SELECT * FROM users WHERE 1=1`;
      const params: any[] = [];

      if (!includeArchived) {
        sql += ` AND deleted_at IS NULL`;
      }

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
      return (rows || []).map(r => mapRowToUser(r));
    } catch (err: any) {
      logger.error(`MySQL listUsers error: ${err.message}`);
      throw AppError.serviceUnavailable('پایگاه داده در دسترس نیست یا با خطا مواجه شد.');
    }
  }
}

export const userRepository = new UserRepository();

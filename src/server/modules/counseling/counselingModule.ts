import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AuthContext, AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Consultant, CounselingRequest, CounselingCategory } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { registerCounselingDossierRoutes } from './counselingDossierRoutes';
import { registerCounselingConfigRoutes } from './counselingConfigRoutes';
import { registerCounselingTestsRoutes } from './counselingTestsRoutes';

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

function mapConsultantRow(row: any): Consultant & { version: number; scheduleSlots?: string[] } {
  return {
    id: fromIdBuffer(row.id),
    name: row.name,
    title: row.title,
    specialty: row.specialty,
    specialties: parseJsonSafe(row.specialties, []),
    bio: row.bio || '',
    experienceYears: Number(row.experience_years ?? row.experienceYears ?? 0),
    availability: row.availability || '',
    scheduleSlots: parseJsonSafe(row.schedule_slots, []),
    avatarUrl: row.avatar_url || row.avatarUrl || undefined,
    academicRank: row.academic_rank || undefined,
    resumeDetails: parseJsonSafe(row.resume_details, []),
    counselingType: row.counseling_type === 'specialized_career' ? 'specialized_career' : 'general',
    fee: row.fee !== null && row.fee !== undefined ? Number(row.fee) : 0,
    subsidyNotice: row.subsidy_notice || undefined,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    version: Number(row.version || 1),
  };
}

function mapCounselingRequestRow(row: any): CounselingRequest & { version: number; updatedAt?: string; hideIdentity?: boolean } {
  const consultantIdRaw = row.preferred_consultant_id || row.consultant_id;
  const hideIdentity = Boolean(row.hide_identity);
  return {
    id: fromIdBuffer(row.id),
    applicantId: fromIdBuffer(row.applicant_id),
    applicantName: row.applicant_name || '',
    hideIdentity,
    userPhone: row.user_phone || undefined,
    userNationalId: row.user_national_id || undefined,
    userRoleTitle: row.user_role_title || undefined,
    category: row.category || 'individual',
    categoryTitle: row.category_title || 'مشاوره',
    counselingType: row.counseling_type === 'specialized_career' ? 'specialized_career' : 'general',
    selectedFieldId: row.selected_field_id || undefined,
    selectedFieldTitle: row.selected_field_title || undefined,
    formResponses: parseJsonSafe(row.form_responses, {}),
    preferredConsultantId: consultantIdRaw ? fromIdBuffer(consultantIdRaw) : undefined,
    preferredConsultantName: row.preferred_consultant_name || row.consultant_name || undefined,
    description: row.description || '',
    meetingMode: row.meeting_mode || 'حضوری',
    status: row.status || 'pending',
    scheduledDate: row.scheduled_date || undefined,
    scheduledTime: row.scheduled_time || undefined,
    venueDetails: row.venue_details || undefined,
    counselorNotes: row.counselor_notes || undefined,
    fee: row.fee !== null && row.fee !== undefined ? Number(row.fee) : 0,
    subsidyNotice: row.subsidy_notice || undefined,
    paymentStatus: row.payment_status || 'free',
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

let counselingRequestsSchemaEnsured = false;

async function ensureCounselingRequestsSchema(): Promise<void> {
  if (counselingRequestsSchemaEnsured) return;
  const p = getPool();
  const alters = [
    `ADD COLUMN hide_identity TINYINT(1) NOT NULL DEFAULT 0`,
    `ADD COLUMN counseling_type ENUM('general', 'specialized_career') NOT NULL DEFAULT 'general'`,
    `ADD COLUMN selected_field_id VARCHAR(64) NULL`,
    `ADD COLUMN selected_field_title VARCHAR(255) NULL`,
    `ADD COLUMN form_responses JSON NULL`,
    `ADD COLUMN preferred_consultant_id BINARY(16) NULL`,
    `ADD COLUMN preferred_consultant_name VARCHAR(255) NULL`,
    `ADD COLUMN user_phone VARCHAR(32) NULL`,
    `ADD COLUMN user_national_id VARCHAR(32) NULL`,
    `ADD COLUMN user_role_title VARCHAR(128) NULL`,
    `ADD COLUMN venue_details VARCHAR(512) NULL`,
    `ADD COLUMN fee BIGINT NOT NULL DEFAULT 0`,
    `ADD COLUMN subsidy_notice VARCHAR(512) NULL`,
    `ADD COLUMN payment_status VARCHAR(32) NULL DEFAULT 'free'`,
    `ADD COLUMN reviewed_by VARCHAR(128) NULL`,
    `ADD COLUMN reviewed_at DATETIME(3) NULL`,
    `ADD COLUMN deleted_at DATETIME(3) NULL DEFAULT NULL`,
    `ADD COLUMN version INT NOT NULL DEFAULT 1`,
    `ADD COLUMN updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`,
    `MODIFY COLUMN category VARCHAR(64) NOT NULL DEFAULT 'individual'`,
    `MODIFY COLUMN category_title VARCHAR(255) NOT NULL DEFAULT 'مشاوره'`,
    `MODIFY COLUMN meeting_mode VARCHAR(64) NOT NULL DEFAULT 'حضوری'`,
    `MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'pending'`,
  ];
  for (const clause of alters) {
    try {
      await p.query(`ALTER TABLE counseling_requests ${clause};`);
    } catch {}
  }
  counselingRequestsSchemaEnsured = true;
}

export class CounselingService {
  async getConsultants(typeFilter?: string): Promise<Array<Consultant & { version: number }>> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    await ensureCounselingRequestsSchema();
    let sql = `SELECT * FROM consultants WHERE deleted_at IS NULL AND is_active = 1`;
    const params: any[] = [];
    if (typeFilter === 'general' || typeFilter === 'specialized_career') {
      sql += ` AND counseling_type = ?`;
      params.push(typeFilter);
    }
    sql += ` ORDER BY name ASC`;
    const rows = await selectWithTimeout<any>(sql, params, 3000);
    return (rows || []).map(mapConsultantRow);
  }

  async getConsultantById(id: string): Promise<(Consultant & { version: number }) | undefined> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM consultants WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
      [idBuf, id],
      3000
    );
    if (!rows || rows.length === 0) return undefined;
    return mapConsultantRow(rows[0]);
  }

  async createConsultant(authCtx: AuthContext, dto: Omit<Consultant, 'id'>): Promise<Consultant & { version: number }> {
    if (authCtx.role === 'general_observer') {
      throw AppError.forbidden('نقش ناظر کل مجاز به ثبت یا ویرایش مشاور نیست.');
    }
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    if (!dto.name || !dto.specialty) {
      throw AppError.badRequest('نام و تخصص مشاور الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const p = getPool();
    const cType = dto.counselingType === 'specialized_career' ? 'specialized_career' : 'general';

    await p.query(
      `INSERT INTO consultants (
        id, name, title, specialty, specialties, bio, experience_years, availability, schedule_slots,
        avatar_url, academic_rank, resume_details, fee, subsidy_notice, counseling_type, is_active, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        idBuf,
        dto.name.trim(),
        (dto.title || 'مشاور ارشد').trim(),
        dto.specialty.trim(),
        JSON.stringify(Array.isArray(dto.specialties) ? dto.specialties : []),
        (dto.bio || '').trim(),
        Number(dto.experienceYears || 5),
        (dto.availability || 'دوشنبه و چهارشنبه').trim(),
        JSON.stringify(Array.isArray(dto.scheduleSlots) ? dto.scheduleSlots : []),
        dto.avatarUrl || null,
        dto.academicRank ? dto.academicRank.trim() : null,
        JSON.stringify(Array.isArray(dto.resumeDetails) ? dto.resumeDetails : []),
        Number(dto.fee || 0),
        dto.subsidyNotice ? dto.subsidyNotice.trim() : null,
        cType,
        dto.isActive !== false ? 1 : 0,
      ]
    );

    const created = await this.getConsultantById(id);
    if (!created) throw AppError.internal('خطا در بازخوانی مشاور ایجاد شده');

    outbox.enqueue('counseling.consultant_created', {
      id,
      resourceId: id,
      version: 1,
      updates: created,
      consultant: created,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return created;
  }

  async updateConsultant(
    authCtx: AuthContext,
    id: string,
    updates: Partial<Consultant>,
    expectedVersion: number
  ): Promise<Consultant & { version: number }> {
    if (authCtx.role === 'general_observer') {
      throw AppError.forbidden('نقش ناظر کل مجاز به ویرایش مشاور نیست.');
    }
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const existing = await this.getConsultantById(id);
    if (!existing) throw AppError.notFound(`مشاور با شناسه ${id}`);

    const idBuf = toIdBuffer(id);
    const p = getPool();

    const name = updates.name !== undefined ? updates.name.trim() : existing.name;
    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const specialty = updates.specialty !== undefined ? updates.specialty.trim() : existing.specialty;
    const specialties = updates.specialties !== undefined ? updates.specialties : (existing.specialties || []);
    const bio = updates.bio !== undefined ? updates.bio.trim() : existing.bio;
    const expYears = updates.experienceYears !== undefined ? Number(updates.experienceYears) : existing.experienceYears;
    const availability = updates.availability !== undefined ? updates.availability.trim() : existing.availability;
    const scheduleSlots = updates.scheduleSlots !== undefined ? updates.scheduleSlots : (existing.scheduleSlots || []);
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl;
    const academicRank = updates.academicRank !== undefined ? updates.academicRank : existing.academicRank;
    const resumeDetails = updates.resumeDetails !== undefined ? updates.resumeDetails : (existing.resumeDetails || []);
    const fee = updates.fee !== undefined ? Number(updates.fee) : (existing.fee || 0);
    const subsidyNotice = updates.subsidyNotice !== undefined ? updates.subsidyNotice : existing.subsidyNotice;
    const counselingType = updates.counselingType !== undefined
      ? (updates.counselingType === 'specialized_career' ? 'specialized_career' : 'general')
      : (existing.counselingType || 'general');
    const isActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);

    const [res]: any = await p.query(
      `UPDATE consultants
       SET name = ?, title = ?, specialty = ?, specialties = ?, bio = ?, experience_years = ?,
           availability = ?, schedule_slots = ?, avatar_url = ?, academic_rank = ?, resume_details = ?,
           fee = ?, subsidy_notice = ?, counseling_type = ?, is_active = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
      [
        name,
        title,
        specialty,
        JSON.stringify(specialties),
        bio,
        expYears,
        availability,
        JSON.stringify(scheduleSlots),
        avatarUrl || null,
        academicRank || null,
        JSON.stringify(resumeDetails),
        fee,
        subsidyNotice || null,
        counselingType,
        isActive,
        idBuf,
        id,
        expectedVersion,
      ]
    );

    if (res && res.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این مشاور توسط مدیر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const updated = await this.getConsultantById(id);
    if (!updated) throw AppError.internal('خطا در بارگذاری مجدد اطلاعات مشاور');

    outbox.enqueue('counseling.consultant_updated', {
      id,
      resourceId: id,
      version: updated.version,
      updates: updated,
      consultant: updated,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return updated;
  }

  async deleteConsultant(authCtx: AuthContext, id: string): Promise<{ success: boolean; id: string }> {
    if (authCtx.role === 'general_observer') {
      throw AppError.forbidden('نقش ناظر کل مجاز به حذف مشاور نیست.');
    }
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const idBuf = toIdBuffer(id);
    const p = getPool();

    const [res]: any = await p.query(
      `UPDATE consultants SET is_active = 0, deleted_at = NOW(3), version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
      [idBuf, id]
    );

    if (res && res.affectedRows === 0) {
      throw AppError.notFound('مشاور');
    }

    outbox.enqueue('counseling.consultant_deleted', {
      id,
      resourceId: id,
      consultantId: id,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return { success: true, id };
  }

  async getRequests(authCtx: AuthContext, typeFilter?: string): Promise<Array<CounselingRequest & { version: number }>> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    await ensureCounselingRequestsSchema();
    let sql = `SELECT * FROM counseling_requests WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (typeFilter === 'general' || typeFilter === 'specialized_career') {
      sql += ` AND counseling_type = ?`;
      params.push(typeFilter);
    }

    if (authCtx.role === 'alumni' || authCtx.role === 'customer') {
      sql += ` AND (applicant_id = ? OR applicant_id = ?)`;
      params.push(toIdBuffer(authCtx.userId), authCtx.userId);
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = await selectWithTimeout<any>(sql, params, 4000);
    return (rows || []).map(mapCounselingRequestRow);
  }

  async getRequestById(authCtx: AuthContext, id: string): Promise<(CounselingRequest & { version: number }) | undefined> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    await ensureCounselingRequestsSchema();
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM counseling_requests WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
      [idBuf, id],
      3000
    );
    if (!rows || rows.length === 0) return undefined;
    const item = mapCounselingRequestRow(rows[0]);
    if (authCtx.role === 'alumni' || authCtx.role === 'customer') {
      AuthorizationPolicy.assertOwnership(authCtx, item.applicantId, 'درخواست مشاوره');
    }
    return item;
  }

  async updateRequest(
    authCtx: AuthContext,
    id: string,
    updates: {
      categoryTitle?: string;
      description?: string;
      meetingMode?: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
      preferredConsultantId?: string;
      preferredConsultantName?: string;
      status?: CounselingRequest['status'];
      scheduledDate?: string;
      scheduledTime?: string;
      venueDetails?: string;
      counselorNotes?: string;
      selectedFieldId?: string;
      selectedFieldTitle?: string;
      formResponses?: Record<string, any>;
    },
    expectedVersion: number
  ): Promise<CounselingRequest & { version: number }> {
    if (authCtx.role === 'general_observer') {
      throw AppError.forbidden('نقش ناظر کل مجاز به تغییر وضعیت درخواست مشاوره نیست.');
    }
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    await ensureCounselingRequestsSchema();
    const idBuf = toIdBuffer(id);
    const p = getPool();

    const existing = await this.getRequestById(authCtx, id);
    if (!existing) throw AppError.notFound(`درخواست مشاوره با شناسه ${id}`);

    if (authCtx.role === 'alumni' || authCtx.role === 'customer') {
      AuthorizationPolicy.assertOwnership(authCtx, existing.applicantId, 'درخواست مشاوره');
    }

    const catTitle = updates.categoryTitle !== undefined ? updates.categoryTitle.trim() : existing.categoryTitle;
    const desc = updates.description !== undefined ? updates.description.trim() : existing.description;
    const mode = updates.meetingMode !== undefined ? updates.meetingMode : existing.meetingMode;
    const consultantId = updates.preferredConsultantId !== undefined ? updates.preferredConsultantId : existing.preferredConsultantId;
    const consultantBuf = consultantId ? toIdBuffer(consultantId) : null;
    const consultantName = updates.preferredConsultantName !== undefined ? updates.preferredConsultantName.trim() : existing.preferredConsultantName;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const scheduledDate = updates.scheduledDate !== undefined ? updates.scheduledDate : existing.scheduledDate;
    const scheduledTime = updates.scheduledTime !== undefined ? updates.scheduledTime : existing.scheduledTime;
    const venueDetails = updates.venueDetails !== undefined ? updates.venueDetails : existing.venueDetails;
    const counselorNotes = updates.counselorNotes !== undefined ? updates.counselorNotes : existing.counselorNotes;
    const selectedFieldId = updates.selectedFieldId !== undefined ? updates.selectedFieldId : existing.selectedFieldId;
    const selectedFieldTitle = updates.selectedFieldTitle !== undefined ? updates.selectedFieldTitle : existing.selectedFieldTitle;
    const formResponses = updates.formResponses !== undefined ? updates.formResponses : (existing.formResponses || {});

    const [res]: any = await p.query(
      `UPDATE counseling_requests
       SET category_title = ?, description = ?, meeting_mode = ?, preferred_consultant_id = ?, preferred_consultant_name = ?,
           status = ?, scheduled_date = ?, scheduled_time = ?, venue_details = ?, counselor_notes = ?,
           selected_field_id = ?, selected_field_title = ?, form_responses = ?,
           reviewed_by = ?, reviewed_at = NOW(3), version = version + 1
       WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
      [
        catTitle,
        desc,
        mode,
        consultantBuf,
        consultantName || null,
        status,
        scheduledDate || null,
        scheduledTime || null,
        venueDetails || null,
        counselorNotes || null,
        selectedFieldId || null,
        selectedFieldTitle || null,
        JSON.stringify(formResponses),
        authCtx.fullName,
        idBuf,
        id,
        expectedVersion,
      ]
    );

    if (res && res.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این درخواست مشاوره توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const updated = await this.getRequestById(authCtx, id);
    if (!updated) throw AppError.internal('خطا در بارگذاری مجدد درخواست');

    outbox.enqueue('counseling.updated', {
      requestId: id,
      resourceId: id,
      applicantId: updated.applicantId,
      version: updated.version,
      updates: updated,
      request: updated,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return updated;
  }

  async deleteRequest(authCtx: AuthContext, id: string): Promise<{ success: boolean; id: string }> {
    if (authCtx.role === 'general_observer') {
      throw AppError.forbidden('نقش ناظر کل مجاز به حذف درخواست مشاوره نیست.');
    }
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'super_admin', 'supervisor', 'alumni_manager', 'cultural_educational_officer']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    await ensureCounselingRequestsSchema();

    const idBuf = toIdBuffer(id);
    const p = getPool();
    const [res]: any = await p.query(
      `UPDATE counseling_requests SET deleted_at = NOW(3), version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
      [idBuf, id]
    );

    if (res && res.affectedRows === 0) {
      throw AppError.notFound('درخواست مشاوره');
    }

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `درخواست مشاوره با شناسه ${id} توسط مدیر حذف نرم شد.`,
      severity: 'info',
    });

    outbox.enqueue('counseling.deleted', {
      id,
      requestId: id,
      resourceId: id,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return { success: true, id };
  }

  async book(
    authCtx: AuthContext,
    dto: {
      category?: CounselingCategory;
      categoryTitle?: string;
      counselingType?: 'general' | 'specialized_career';
      selectedFieldId?: string;
      selectedFieldTitle?: string;
      formResponses?: Record<string, string | string[]>;
      userPhone?: string;
      userNationalId?: string;
      userRoleTitle?: string;
      description?: string;
      meetingMode?: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
      preferredConsultantId?: string;
      preferredConsultantName?: string;
      fee?: number;
      subsidyNotice?: string;
    }
  ): Promise<CounselingRequest & { version: number }> {
    if (authCtx.role === 'general_observer') {
      throw AppError.forbidden('نقش ناظر کل مجاز به ثبت درخواست مشاوره نیست.');
    }
    const hasFormResponses = Boolean(dto.formResponses && Object.keys(dto.formResponses).length > 0);
    if (!dto.description && !hasFormResponses && !dto.userPhone) {
      throw AppError.badRequest('تکمیل اطلاعات درخواست مشاوره الزامی است.');
    }
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    await ensureCounselingRequestsSchema();

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const applicantBuf = toIdBuffer(authCtx.userId);
    const consultantBuf = dto.preferredConsultantId ? toIdBuffer(dto.preferredConsultantId) : null;
    const p = getPool();
    const cType: 'general' | 'specialized_career' =
      dto.counselingType === 'specialized_career' ? 'specialized_career' : 'general';
    const category = dto.category || (cType === 'specialized_career' ? 'academic' : 'individual');
    const cleanSelectedFieldTitle = dto.selectedFieldTitle ? String(dto.selectedFieldTitle).trim() : '';
    const categoryTitle =
      (dto.categoryTitle && String(dto.categoryTitle).trim()) ||
      cleanSelectedFieldTitle ||
      (cType === 'specialized_career' ? 'مشاوره تخصصی شغلی و تحصیلی' : 'مشاوره عمومی و روان‌شناختی');
    const meetingMode = dto.meetingMode || 'حضوری';
    const descriptionText = (dto.description || '').trim() || categoryTitle || 'ثبت درخواست مشاوره';

    await p.query(
      `INSERT INTO counseling_requests (
        id, applicant_id, applicant_name, user_phone, user_national_id, user_role_title,
        category, category_title, counseling_type, selected_field_id, selected_field_title, form_responses,
        preferred_consultant_id, preferred_consultant_name, description, status, meeting_mode,
        fee, subsidy_notice, payment_status, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 'free', 1)`,
      [
        idBuf,
        applicantBuf,
        authCtx.fullName,
        dto.userPhone || null,
        dto.userNationalId || null,
        dto.userRoleTitle || null,
        category,
        categoryTitle,
        cType,
        dto.selectedFieldId || null,
        dto.selectedFieldTitle || null,
        JSON.stringify(dto.formResponses || {}),
        consultantBuf,
        dto.preferredConsultantName || null,
        descriptionText,
        meetingMode,
        Number(dto.fee || 0),
        dto.subsidyNotice || null,
      ]
    );

    auditChain.appendEntry({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `درخواست مشاوره [${cType === 'specialized_career' ? 'تخصصی شغلی/تحصیلی' : 'عمومی/روان‌شناسی'} - ${categoryTitle}] با موفقیت ثبت گردید.`,
      severity: 'info',
    });

    const created = await this.getRequestById(authCtx, id);
    if (!created) throw AppError.internal('خطا در بازخوانی درخواست ثبت‌شده');

    outbox.enqueue('counseling.requested', {
      requestId: id,
      resourceId: id,
      counselingType: cType,
      category,
      applicantId: authCtx.userId,
      version: 1,
      updates: created,
      request: created,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return created;
  }
}

export function createCounselingRouter(): Router {
  const router = Router();
  const service = new CounselingService();

  router.get('/consultants', async (req: Request, res: Response, next) => {
    try {
      const typeFilter = req.query.type as string | undefined;
      const items = await service.getConsultants(typeFilter);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.post('/consultants', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.createConsultant(authCtx, req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  router.put('/consultants/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = extractExpectedVersion(req, true);
      const item = await service.updateConsultant(authCtx, req.params.id, req.body, expectedVersion);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/consultants/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const resData = await service.deleteConsultant(authCtx, req.params.id);
      res.json(resData);
    } catch (err) {
      next(err);
    }
  });

  router.get('/requests', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const typeFilter = req.query.type as string | undefined;
      const items = await service.getRequests(authCtx, typeFilter);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get('/requests/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.getRequestById(authCtx, req.params.id);
      if (!item) throw AppError.notFound('درخواست مشاوره');
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/requests', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.book(authCtx, req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  router.put('/requests/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = extractExpectedVersion(req, true);
      const item = await service.updateRequest(authCtx, req.params.id, req.body, expectedVersion);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/requests/:id/status', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = extractExpectedVersion(req, true);
      const item = await service.updateRequest(authCtx, req.params.id, req.body, expectedVersion);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/requests/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const resData = await service.deleteRequest(authCtx, req.params.id);
      res.json(resData);
    } catch (err) {
      next(err);
    }
  });

  registerCounselingDossierRoutes(router);
  registerCounselingConfigRoutes(router);
  registerCounselingTestsRoutes(router);

  return router;
}

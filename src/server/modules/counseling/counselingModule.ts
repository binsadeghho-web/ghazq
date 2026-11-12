import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AuthContext, AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Consultant, CounselingRequest, CounselingCategory } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';

function mapConsultantRow(row: any): Consultant & { version: number; scheduleSlots?: string[] } {
  let scheduleSlots: string[] = [];
  try {
    if (typeof row.schedule_slots === 'string') scheduleSlots = JSON.parse(row.schedule_slots);
    else if (Array.isArray(row.schedule_slots)) scheduleSlots = row.schedule_slots;
  } catch {}

  return {
    id: fromIdBuffer(row.id),
    name: row.name,
    title: row.title,
    specialty: row.specialty,
    bio: row.bio || '',
    experienceYears: Number(row.experience_years ?? row.experienceYears ?? 0),
    availability: row.availability || '',
    scheduleSlots,
    avatarUrl: row.avatar_url || row.avatarUrl || undefined,
    counselingType: row.counseling_type || row.counselingType || 'general',
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
    category: row.category || 'family',
    categoryTitle: row.category_title || 'مشاوره خانواده',
    preferredConsultantId: consultantIdRaw ? fromIdBuffer(consultantIdRaw) : undefined,
    preferredConsultantName: row.preferred_consultant_name || row.consultant_name || undefined,
    description: row.description || '',
    meetingMode: row.meeting_mode || 'حضوری',
    status: row.status || 'pending',
    scheduledDate: row.scheduled_date || undefined,
    scheduledTime: row.scheduled_time || undefined,
    venueDetails: row.venue_details || undefined,
    counselorNotes: row.counselor_notes || undefined,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export class CounselingService {
  async getConsultants(): Promise<Array<Consultant & { version: number }>> {
    ensureDatabaseConnection();
    const rows = await selectWithTimeout<any>(`SELECT * FROM consultants WHERE is_active = 1 ORDER BY name ASC`, [], 3000);
    return (rows || []).map(mapConsultantRow);
  }

  async getConsultantById(id: string): Promise<(Consultant & { version: number }) | undefined> {
    ensureDatabaseConnection();
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM consultants WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, id],
      3000
    );
    if (!rows || rows.length === 0) return undefined;
    return mapConsultantRow(rows[0]);
  }

  async createConsultant(authCtx: AuthContext, dto: Omit<Consultant, 'id'>): Promise<Consultant & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();

    if (!dto.name || !dto.specialty) {
      throw AppError.badRequest('نام و تخصص مشاور الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const p = getPool();

    await p.query(
      `INSERT INTO consultants (
        id, name, title, specialty, bio, experience_years, availability, avatar_url, counseling_type, is_active, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        idBuf,
        dto.name.trim(),
        (dto.title || 'مشاور ارشد').trim(),
        dto.specialty.trim(),
        (dto.bio || '').trim(),
        Number(dto.experienceYears || 5),
        (dto.availability || 'دوشنبه و چهارشنبه').trim(),
        dto.avatarUrl || null,
        dto.counselingType || 'general',
        dto.isActive !== false ? 1 : 0,
      ]
    );

    const created: Consultant & { version: number } = {
      id,
      name: dto.name.trim(),
      title: (dto.title || 'مشاور ارشد').trim(),
      specialty: dto.specialty.trim(),
      bio: (dto.bio || '').trim(),
      experienceYears: Number(dto.experienceYears || 5),
      availability: (dto.availability || 'دوشنبه و چهارشنبه').trim(),
      avatarUrl: dto.avatarUrl,
      counselingType: dto.counselingType || 'general',
      isActive: dto.isActive !== false,
      version: 1,
    };

    outbox.enqueue('counseling.consultant_created', {
      id,
      resourceId: id,
      version: 1,
      updates: created,
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
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();

    const existing = await this.getConsultantById(id);
    if (!existing) throw AppError.notFound(`مشاور با شناسه ${id}`);

    const idBuf = toIdBuffer(id);
    const p = getPool();

    const name = updates.name !== undefined ? updates.name.trim() : existing.name;
    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const specialty = updates.specialty !== undefined ? updates.specialty.trim() : existing.specialty;
    const bio = updates.bio !== undefined ? updates.bio.trim() : existing.bio;
    const expYears = updates.experienceYears !== undefined ? Number(updates.experienceYears) : existing.experienceYears;
    const availability = updates.availability !== undefined ? updates.availability.trim() : existing.availability;
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl;
    const isActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);

    const [res]: any = await p.query(
      `UPDATE consultants
       SET name = ?, title = ?, specialty = ?, bio = ?, experience_years = ?, availability = ?, avatar_url = ?, is_active = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND version = ?`,
      [name, title, specialty, bio, expYears, availability, avatarUrl || null, isActive, idBuf, id, expectedVersion]
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
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return updated;
  }

  async deleteConsultant(authCtx: AuthContext, id: string): Promise<{ success: boolean; id: string }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();

    const idBuf = toIdBuffer(id);
    const p = getPool();

    await p.query(
      `UPDATE consultants SET is_active = 0, version = version + 1 WHERE id = ? OR id = ?`,
      [idBuf, id]
    );

    outbox.enqueue('counseling.consultant_deleted', {
      id,
      resourceId: id,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return { success: true, id };
  }

  async getRequests(authCtx: AuthContext): Promise<Array<CounselingRequest & { version: number }>> {
    ensureDatabaseConnection();
    let sql = `SELECT * FROM counseling_requests WHERE 1=1`;
    const params: any[] = [];

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
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM counseling_requests WHERE id = ? OR id = ? LIMIT 1`,
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
    },
    expectedVersion: number
  ): Promise<CounselingRequest & { version: number }> {
    ensureDatabaseConnection();
    const idBuf = toIdBuffer(id);
    const p = getPool();

    const existing = await this.getRequestById(authCtx, id);
    if (!existing) throw AppError.notFound(`درخواست مشاوره با شناسه ${id}`);

    if (authCtx.role === 'alumni') {
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
    const counselorNotes = updates.counselorNotes !== undefined ? updates.counselorNotes : existing.counselorNotes;

    const [res]: any = await p.query(
      `UPDATE counseling_requests
       SET category_title = ?, description = ?, meeting_mode = ?, preferred_consultant_id = ?, preferred_consultant_name = ?,
           status = ?, scheduled_date = ?, scheduled_time = ?, counselor_notes = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND version = ?`,
      [
        catTitle,
        desc,
        mode,
        consultantBuf,
        consultantName || null,
        status,
        scheduledDate || null,
        scheduledTime || null,
        counselorNotes || null,
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
    if (updates.venueDetails) {
      updated.venueDetails = updates.venueDetails;
    }

    outbox.enqueue('counseling.updated', {
      requestId: id,
      resourceId: id,
      applicantId: updated.applicantId,
      version: updated.version,
      updates: updated,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return updated;
  }

  async book(
    authCtx: AuthContext,
    dto: {
      category: CounselingCategory;
      categoryTitle: string;
      description: string;
      meetingMode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
      preferredConsultantId?: string;
      preferredConsultantName?: string;
    }
  ): Promise<CounselingRequest & { version: number }> {
    if (!dto.description) throw AppError.badRequest('شرح درخواست مشاوره الزامی است.');
    ensureDatabaseConnection();

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const applicantBuf = toIdBuffer(authCtx.userId);
    const consultantBuf = dto.preferredConsultantId ? toIdBuffer(dto.preferredConsultantId) : null;
    const p = getPool();
    const now = new Date().toISOString();

    await p.query(
      `INSERT INTO counseling_requests (
        id, applicant_id, applicant_name, category, category_title, counseling_type,
        preferred_consultant_id, preferred_consultant_name, description, status, meeting_mode, version
      ) VALUES (?, ?, ?, ?, ?, 'general', ?, ?, ?, 'pending', ?, 1)`,
      [
        idBuf,
        applicantBuf,
        authCtx.fullName,
        dto.category,
        dto.categoryTitle,
        consultantBuf,
        dto.preferredConsultantName || null,
        dto.description,
        dto.meetingMode,
      ]
    );

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `درخواست مشاوره [${dto.categoryTitle}] با موفقیت ثبت گردید.`,
      severity: 'info',
    });

    const created: CounselingRequest & { version: number } = {
      id,
      applicantId: authCtx.userId,
      applicantName: authCtx.fullName,
      category: dto.category,
      categoryTitle: dto.categoryTitle,
      preferredConsultantId: dto.preferredConsultantId,
      preferredConsultantName: dto.preferredConsultantName,
      description: dto.description,
      meetingMode: dto.meetingMode,
      status: 'pending',
      createdAt: now,
      version: 1,
    };

    outbox.enqueue('counseling.requested', {
      requestId: id,
      resourceId: id,
      category: dto.category,
      applicantId: authCtx.userId,
      version: 1,
      updates: created,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return created;
  }
}

export function createCounselingRouter(): Router {
  const router = Router();
  const service = new CounselingService();

  router.get('/consultants', async (_req, res, next) => {
    try {
      const items = await service.getConsultants();
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
      const items = await service.getRequests(authCtx);
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

  registerCounselingDossierRoutes(router);

  return router;
}
import { registerCounselingDossierRoutes } from './counselingDossierRoutes';


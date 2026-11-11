import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AuthContext, AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Consultant, CounselingRequest, CounselingCategory } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';

function mapConsultantRow(row: any): Consultant {
  return {
    id: fromIdBuffer(row.id),
    name: row.name,
    title: row.title,
    specialty: row.specialty,
    bio: row.bio,
    experienceYears: Number(row.experience_years || 0),
    availability: row.availability,
    avatarUrl: row.avatar_url || undefined,
    counselingType: row.counseling_type,
    isActive: Boolean(row.is_active),
  };
}

function mapCounselingRequestRow(row: any): CounselingRequest & { version: number } {
  return {
    id: fromIdBuffer(row.id),
    applicantId: fromIdBuffer(row.applicant_id),
    applicantName: row.applicant_name,
    category: row.category,
    categoryTitle: row.category_title,
    preferredConsultantId: row.preferred_consultant_id ? fromIdBuffer(row.preferred_consultant_id) : undefined,
    preferredConsultantName: row.preferred_consultant_name || undefined,
    description: row.description,
    meetingMode: row.meeting_mode,
    status: row.status,
    scheduledDate: row.scheduled_date || undefined,
    scheduledTime: row.scheduled_time || undefined,
    counselorNotes: row.counselor_notes || undefined,
    version: 1,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export class CounselingService {
  async getConsultants(): Promise<Consultant[]> {
    ensureDatabaseConnection();
    const rows = await selectWithTimeout<any>(`SELECT * FROM consultants WHERE is_active = 1 ORDER BY name ASC`, [], 3000);
    return (rows || []).map(mapConsultantRow);
  }

  async getRequests(authCtx: AuthContext): Promise<Array<CounselingRequest & { version: number }>> {
    ensureDatabaseConnection();
    let sql = `SELECT * FROM counseling_requests WHERE 1=1`;
    const params: any[] = [];

    if (authCtx.role === 'alumni') {
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
    if (authCtx.role === 'alumni') {
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
      preferredConsultantName?: string;
    },
    expectedVersion = 1
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
    const consultantName = updates.preferredConsultantName !== undefined ? updates.preferredConsultantName.trim() : existing.preferredConsultantName;

    await p.query(
      `UPDATE counseling_requests
       SET category_title = ?, description = ?, meeting_mode = ?, preferred_consultant_name = ?
       WHERE id = ? OR id = ?`,
      [catTitle, desc, mode, consultantName || null, idBuf, id]
    );

    const updated = await this.getRequestById(authCtx, id);
    if (!updated) throw AppError.internal('خطا در بارگذاری مجدد درخواست');
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
        preferred_consultant_id, preferred_consultant_name, description, status, meeting_mode
      ) VALUES (?, ?, ?, ?, ?, 'general', ?, ?, ?, 'pending', ?)`,
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

    outbox.enqueue('counseling.requested', {
      requestId: id,
      category: dto.category,
      applicantId: authCtx.userId,
    });

    return {
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
      const expectedVersion = Number(req.body.expectedVersion || req.body._baseVersion || 1);
      const item = await service.updateRequest(authCtx, req.params.id, req.body, expectedVersion);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

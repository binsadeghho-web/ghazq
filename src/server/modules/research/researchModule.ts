import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { AuthorizationPolicy } from '../../platform/authorization';
import { ResearchMentorship } from '../../../types';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';

export const researchRouter = Router();
export function createResearchRouter(): Router {
  return researchRouter;
}

function mapResearchMentorshipRow(row: any): ResearchMentorship & { version: number } {
  return {
    id: fromIdBuffer(row.id),
    applicantId: fromIdBuffer(row.applicant_id),
    applicantName: row.applicant_name,
    thesisTitle: row.thesis_title,
    field: row.field,
    stage: row.status === 'در حال بررسی' ? 'proposal' : row.status === 'تایید شده' ? 'drafting' : 'defense_prep',
    stageTitle: row.description || 'تصویب پروپوزال و تعیین استاد',
    progressPercent: 25,
    assignedSupervisor: row.supervisor_professor,
    accommodationRequested: false,
    status: row.status === 'در حال بررسی' ? 'active' : row.status === 'تایید شده' ? 'completed' : 'suspended',
    milestones: [
      { title: 'نگارش و ثبت طرح‌نامه (پروپوزال)', isDone: true, date: '۱۴۰۳/۰۴/۱۵' },
      { title: 'تأیید کمیته علمی و صدور ابلاغ استاد ناظر', isDone: true, date: '۱۴۰۳/۰۵/۲۰' },
      { title: 'تدوین فصل‌های نخستین و منابع فقهی', isDone: false, date: '۱۴۰۳/۰۸/۳۰' },
      { title: 'پیش‌دفاع و بررسی نهایی رساله', isDone: false, date: '۱۴۰۳/۱۱/۱۵' },
    ],
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

researchRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    let sql = `SELECT * FROM research_mentorships WHERE 1=1`;
    const params: any[] = [];

    if (currentUser.role === 'alumni') {
      sql += ` AND (applicant_id = ? OR applicant_id = ?)`;
      params.push(toIdBuffer(currentUser.id), currentUser.id);
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = await selectWithTimeout<any>(sql, params, 4000);
    res.json((rows || []).map(mapResearchMentorshipRow));
  } catch (err) {
    next(err);
  }
});

researchRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const idBuf = toIdBuffer(req.params.id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM research_mentorships WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!rows || rows.length === 0) throw AppError.notFound('طرح پژوهشی');
    const existing = mapResearchMentorshipRow(rows[0]);

    AuthorizationPolicy.assertCanAccessResource({ userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName }, { applicantId: existing.applicantId }, 'طرح پژوهشی');
    res.json(existing);
  } catch (err) {
    next(err);
  }
});

researchRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { thesisTitle, field, stageTitle, assignedSupervisor, advisorProfessor, grantAmount } = req.body;

    if (!thesisTitle || !field) {
      throw AppError.badRequest('عنوان رساله و رشته تخصصی الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();
    const now = new Date().toISOString();

    const supervisor = assignedSupervisor || 'دکتر سید محمدمهدی میرباقری';

    await p.query(
      `INSERT INTO research_mentorships (
        id, applicant_id, applicant_name, thesis_title, field, supervisor_professor, advisor_professor, grant_amount, status, description, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'در حال بررسی', ?, 1)`,
      [
        idBuf,
        uBuf,
        currentUser.fullName,
        thesisTitle,
        field,
        supervisor,
        advisorProfessor || null,
        Number(grantAmount || 0),
        stageTitle || 'تصویب پروپوزال و تعیین استاد',
      ]
    );

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت طرح پژوهشی رساله: ${thesisTitle}`,
      severity: 'info',
    });

    outbox.enqueue('research.created', {
      projectId: id,
      applicantId: currentUser.id,
    });

    const newMentorship: ResearchMentorship & { version: number } = {
      id,
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      thesisTitle,
      field,
      stage: 'proposal',
      stageTitle: stageTitle || 'تصویب پروپوزال و تعیین استاد',
      progressPercent: 20,
      assignedSupervisor: supervisor,
      accommodationRequested: false,
      status: 'active',
      milestones: [
        { title: 'نگارش و ثبت طرح‌نامه (پروپوزال)', isDone: true, date: '۱۴۰۳/۰۴/۱۵' },
        { title: 'تأیید کمیته علمی و صدور ابلاغ استاد ناظر', isDone: true, date: '۱۴۰۳/۰۵/۲۰' },
        { title: 'تدوین فصل‌های نخستین و منابع فقهی', isDone: false, date: '۱۴۰۳/۰۸/۳۰' },
        { title: 'پیش‌دفاع و بررسی نهایی رساله', isDone: false, date: '۱۴۰۳/۱۱/۱۵' },
      ],
      version: 1,
      createdAt: now,
    };

    res.status(201).json(newMentorship);
  } catch (err) {
    next(err);
  }
});

researchRouter.put('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { thesisTitle, field, assignedSupervisor, stageTitle } = req.body;
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM research_mentorships WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('طرح پژوهشی');
    const existing = mapResearchMentorshipRow(existingRows[0]);

    AuthorizationPolicy.assertCanAccessResource({ userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName }, { applicantId: existing.applicantId }, 'طرح پژوهشی');

    const newTitle = thesisTitle !== undefined ? thesisTitle.trim() : existing.thesisTitle;
    const newField = field !== undefined ? field.trim() : existing.field;
    const newSup = assignedSupervisor !== undefined ? assignedSupervisor.trim() : existing.assignedSupervisor;
    const newStageTitle = stageTitle !== undefined ? stageTitle.trim() : existing.stageTitle;

    await p.query(
      `UPDATE research_mentorships
       SET thesis_title = ?, field = ?, supervisor_professor = ?, description = ?, version = version + 1
       WHERE id = ? OR id = ?`,
      [newTitle, newField, newSup, newStageTitle, idBuf, req.params.id]
    );

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM research_mentorships WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    res.json(mapResearchMentorshipRow(updatedRows[0]));
  } catch (err) {
    next(err);
  }
});

researchRouter.patch('/:id/progress', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { stage, stageTitle, progressPercent } = req.body;
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM research_mentorships WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('طرح پژوهشی');
    const existing = mapResearchMentorshipRow(existingRows[0]);

    AuthorizationPolicy.assertCanAccessResource({ userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName }, { applicantId: existing.applicantId }, 'طرح پژوهشی');

    await p.query(
      `UPDATE research_mentorships
       SET description = ?, version = version + 1
       WHERE id = ? OR id = ?`,
      [stageTitle || existing.stageTitle, idBuf, req.params.id]
    );

    outbox.enqueue('research.progress_updated', {
      projectId: existing.id,
      stage,
      progressPercent,
    });

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM research_mentorships WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    res.json({ success: true, mentorship: mapResearchMentorshipRow(updatedRows[0]) });
  } catch (err) {
    next(err);
  }
});

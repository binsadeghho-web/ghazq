import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { AuthorizationPolicy } from '../../platform/authorization';
import { User, JudicialRuling } from '../../../types';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';

export const rulingsRouter = Router();
export function createRulingsRouter(): Router {
  return rulingsRouter;
}

function mapRulingRow(row: any, discussions: any[] = []): JudicialRuling & { version: number } {
  let legalPrinciples: string[] = [];
  try {
    if (typeof row.legal_principles === 'string') legalPrinciples = JSON.parse(row.legal_principles);
    else if (Array.isArray(row.legal_principles)) legalPrinciples = row.legal_principles;
  } catch {}

  let likedBy: string[] = [];
  try {
    if (typeof row.liked_by === 'string') likedBy = JSON.parse(row.liked_by);
    else if (Array.isArray(row.liked_by)) likedBy = row.liked_by;
  } catch {}

  return {
    id: fromIdBuffer(row.id),
    title: row.title,
    courtBranch: row.court_branch,
    judgeName: row.judge_name,
    rulingDate: row.ruling_date,
    caseType: row.case_type,
    caseTypeTitle: row.case_type_title,
    summary: row.summary,
    legalPrinciples: legalPrinciples.length > 0 ? legalPrinciples : ['اصل صحت قراردادها'],
    fullRulingText: row.full_ruling_text,
    status: row.status,
    submittedById: fromIdBuffer(row.submitted_by_id),
    submittedByName: row.submitted_by_name,
    likesCount: Number(row.likes_count || 0),
    likedBy,
    discussions,
    version: Number(row.version || 1),
  };
}

function mapDiscussionRow(row: any) {
  return {
    id: fromIdBuffer(row.id),
    authorName: row.author_name,
    authorRoleTitle: row.author_role_title,
    comment: row.comment,
    timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

rulingsRouter.get('/', async (_req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const p = getPool();
    const rows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings ORDER BY created_at DESC`, [], 4000);
    const rulings: Array<JudicialRuling & { version: number }> = [];

    for (const r of rows || []) {
      const rIdBuf = toIdBuffer(r.id);
      const [discRows] = await p.query<any[]>(
        `SELECT * FROM ruling_discussions WHERE ruling_id = ? OR ruling_id = ? ORDER BY created_at ASC`,
        [rIdBuf, fromIdBuffer(r.id)]
      );
      rulings.push(mapRulingRow(r, (discRows || []).map(mapDiscussionRow)));
    }
    res.json(rulings);
  } catch (err) {
    next(err);
  }
});

rulingsRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const p = getPool();
    const idBuf = toIdBuffer(req.params.id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');

    const [discRows] = await p.query<any[]>(
      `SELECT * FROM ruling_discussions WHERE ruling_id = ? OR ruling_id = ? ORDER BY created_at ASC`,
      [idBuf, req.params.id]
    );
    res.json(mapRulingRow(rows[0], (discRows || []).map(mapDiscussionRow)));
  } catch (err) {
    next(err);
  }
});

rulingsRouter.put('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const { title, courtBranch, judgeName, summary, fullRulingText } = req.body;
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('دادنامه');
    const existing = mapRulingRow(existingRows[0]);

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newCourt = courtBranch !== undefined ? courtBranch.trim() : existing.courtBranch;
    const newJudge = judgeName !== undefined ? judgeName.trim() : existing.judgeName;
    const newSummary = summary !== undefined ? summary.trim() : existing.summary;
    const newFullText = fullRulingText !== undefined ? fullRulingText.trim() : existing.fullRulingText;

    const expVer = req.body.expectedVersion ?? req.body.version ?? existing.version;

    let sql = `UPDATE judicial_rulings
       SET title = ?, court_branch = ?, judge_name = ?, summary = ?, full_ruling_text = ?, version = version + 1
       WHERE (id = ? OR id = ?)`;
    const params: any[] = [newTitle, newCourt, newJudge, newSummary, newFullText, idBuf, req.params.id];

    if (expVer !== undefined && expVer !== null && !isNaN(Number(expVer))) {
      sql += ` AND version = ?`;
      params.push(Number(expVer));
    }

    const [res]: any = await p.query(sql, params);
    if (res && res.affectedRows === 0) {
      throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [discRows] = await p.query<any[]>(`SELECT * FROM ruling_discussions WHERE ruling_id = ? OR ruling_id = ?`, [idBuf, req.params.id]);
    res.json(mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow)));
  } catch (err) {
    next(err);
  }
});

rulingsRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { title, courtBranch, judgeName, rulingDate, caseType, caseTypeTitle, summary, legalPrinciples, fullRulingText } = req.body;

    if (!title || !courtBranch || !summary || !fullRulingText) {
      throw AppError.badRequest('عنوان، شعبه صادرکننده، چکیده و متن کامل دادنامه الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();
    const status = currentUser.role === 'admin' ? 'selected' : 'pending_review';

    const principles = legalPrinciples && legalPrinciples.length > 0 ? legalPrinciples : ['اصل صحت قراردادها', 'قاعده لاضرر'];

    await p.query(
      `INSERT INTO judicial_rulings (
        id, title, court_branch, judge_name, ruling_date, case_type, case_type_title, summary, legal_principles,
        full_ruling_text, status, submitted_by_id, submitted_by_name, likes_count, liked_by, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '[]', 1)`,
      [
        idBuf,
        title,
        courtBranch,
        judgeName || currentUser.fullName,
        rulingDate || '۱۴۰۳/۰۷/۰۱',
        caseType || 'commercial',
        caseTypeTitle || 'حقوقی و تجاری',
        summary,
        JSON.stringify(principles),
        fullRulingText,
        status,
        uBuf,
        currentUser.fullName,
      ]
    );

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت دادنامه جدید در تالار رأی قضایی: ${title}`,
      severity: 'info',
    });

    outbox.enqueue('rulings.created', {
      rulingId: id,
      submittedById: currentUser.id,
    });

    res.status(201).json({
      id,
      title,
      courtBranch,
      judgeName: judgeName || currentUser.fullName,
      rulingDate: rulingDate || '۱۴۰۳/۰۷/۰۱',
      caseType: caseType || 'commercial',
      caseTypeTitle: caseTypeTitle || 'حقوقی و تجاری',
      summary,
      legalPrinciples: principles,
      fullRulingText,
      status,
      submittedById: currentUser.id,
      submittedByName: currentUser.fullName,
      likesCount: 0,
      likedBy: [],
      discussions: [],
      version: 1,
    });
  } catch (err) {
    next(err);
  }
});

rulingsRouter.post('/:id/approve', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    AuthorizationPolicy.assertRole({ userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName }, ['admin', 'supervisor']);

    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const rows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');

    const expVer = req.body?.expectedVersion ?? req.body?.version ?? rows[0].version;

    let sql = `UPDATE judicial_rulings SET status = 'selected', version = version + 1 WHERE (id = ? OR id = ?)`;
    const params: any[] = [idBuf, req.params.id];

    if (expVer !== undefined && expVer !== null && !isNaN(Number(expVer))) {
      sql += ` AND version = ?`;
      params.push(Number(expVer));
    }

    const [res]: any = await p.query(sql, params);
    if (res && res.affectedRows === 0) {
      throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    auditChain.appendEntry({
      eventType: 'RULING_APPROVED',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `تأیید نهایی و انتشار عمومی دادنامه در تالار برگزیدگان: ${rows[0].title}`,
      severity: 'info',
    });

    outbox.enqueue('rulings.approved', { rulingId: req.params.id });

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [discRows] = await p.query<any[]>(`SELECT * FROM ruling_discussions WHERE ruling_id = ? OR ruling_id = ?`, [idBuf, req.params.id]);
    res.json({ success: true, ruling: mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow)) });
  } catch (err) {
    next(err);
  }
});

rulingsRouter.post('/:id/discussion', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      throw AppError.badRequest('متن نقد یا تحلیل فقهی-حقوقی الزامی است.');
    }

    const idBuf = toIdBuffer(req.params.id);
    const commentId = generateUUIDv7();
    const commentBuf = toIdBuffer(commentId);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();

    const rows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');

    await p.query(
      `INSERT INTO ruling_discussions (id, ruling_id, author_id, author_name, author_role_title, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [commentBuf, idBuf, uBuf, currentUser.fullName, currentUser.role === 'admin' ? 'مدیر سامانه' : 'دانش‌آموخته نخبه', comment.trim()]
    );

    await p.query(`UPDATE judicial_rulings SET version = version + 1 WHERE id = ? OR id = ?`, [idBuf, req.params.id]);

    outbox.enqueue('rulings.critique_added', {
      rulingId: req.params.id,
      commentId,
      authorId: currentUser.id,
    });

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [discRows] = await p.query<any[]>(`SELECT * FROM ruling_discussions WHERE ruling_id = ? OR ruling_id = ? ORDER BY created_at ASC`, [idBuf, req.params.id]);
    res.json({ success: true, ruling: mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow)) });
  } catch (err) {
    next(err);
  }
});

rulingsRouter.post('/:id/like', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const rows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');

    let likedBy: string[] = [];
    try {
      if (typeof rows[0].liked_by === 'string') likedBy = JSON.parse(rows[0].liked_by);
      else if (Array.isArray(rows[0].liked_by)) likedBy = rows[0].liked_by;
    } catch {}

    const alreadyLiked = likedBy.includes(currentUser.id);
    if (alreadyLiked) {
      likedBy = likedBy.filter(id => id !== currentUser.id);
    } else {
      likedBy.push(currentUser.id);
    }

    await p.query(
      `UPDATE judicial_rulings
       SET liked_by = ?, likes_count = ?, version = version + 1
       WHERE id = ? OR id = ?`,
      [JSON.stringify(likedBy), likedBy.length, idBuf, req.params.id]
    );

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [discRows] = await p.query<any[]>(`SELECT * FROM ruling_discussions WHERE ruling_id = ? OR ruling_id = ?`, [idBuf, req.params.id]);
    res.json({ success: true, ruling: mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow)) });
  } catch (err) {
    next(err);
  }
});

import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { AuthorizationPolicy, isOrganizationalUserRole } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';
import {
  loadRulingsPortalConfig,
  mapDiscussionRow,
  mapRulingRow,
  parseJsonArray,
} from './rulingHelpers';
import { registerRulingAdminAndInteractionsRoutes } from './rulingAdminAndInteractionsRoutes';
import { registerRulingHighlightsAndPinRoutes } from './rulingHighlightsAndPinRoutes';

export const rulingsRouter = Router();
export function createRulingsRouter(): Router {
  return rulingsRouter;
}

// Mount static-segment routes FIRST (/portal-config, /reorder) so /:id never shadows them
registerRulingAdminAndInteractionsRoutes(rulingsRouter);

// GET /api/rulings — Officials see all rulings + adminTags; Alumni ONLY see visible published rulings without adminTags
rulingsRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = (req as any).user;
    const isOfficial = isOrganizationalUserRole(currentUser?.role);

    const p = getPool();
    const whereClause = isOfficial
      ? ''
      : `WHERE status = 'selected' AND is_visible_to_alumni = 1`;

    const rows = await selectWithTimeout<any>(
      `SELECT * FROM judicial_rulings ${whereClause} ORDER BY display_order ASC, created_at DESC`,
      [],
      5000
    );

    const rulings = [];
    for (const r of rows || []) {
      const rIdBuf = toIdBuffer(r.id);
      const [discRows]: any = await p.query(
        `SELECT * FROM ruling_discussions
         WHERE (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [rIdBuf, fromIdBuffer(r.id)]
      );
      rulings.push(mapRulingRow(r, (discRows || []).map(mapDiscussionRow), isOfficial));
    }

    res.json(rulings);
  } catch (err) {
    next(err);
  }
});

// GET /api/rulings/:id
rulingsRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = (req as any).user;
    const isOfficial = isOrganizationalUserRole(currentUser?.role);

    const p = getPool();
    const idBuf = toIdBuffer(req.params.id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');

    const row = rows[0];
    const isVisible = row.status === 'selected' && Boolean(row.is_visible_to_alumni);
    if (!isOfficial && !isVisible) {
      throw AppError.forbidden('این دادنامه هنوز برای نمایش عمومی به دانش‌آموختگان منتشر نشده است.');
    }

    const [discRows]: any = await p.query(
      `SELECT * FROM ruling_discussions
       WHERE (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [idBuf, req.params.id]
    );
    res.json(mapRulingRow(row, (discRows || []).map(mapDiscussionRow), isOfficial));
  } catch (err) {
    next(err);
  }
});

// PUT /api/rulings/:id — Comprehensive Official Review, Completion, Curation & Strict OCC
rulingsRouter.put('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    AuthorizationPolicy.assertRole(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      ['admin', 'supervisor']
    );

    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('دادنامه');
    const existing = mapRulingRow(existingRows[0], [], true);

    const expVer = extractExpectedVersion(req, true);
    const body = req.body || {};

    const newTitle = body.title !== undefined ? String(body.title).trim() : existing.title;
    const newCourt = body.courtBranch !== undefined ? String(body.courtBranch).trim() : existing.courtBranch;
    const newJudge = body.judgeName !== undefined ? String(body.judgeName).trim() : existing.judgeName;
    const newRulingDate = body.rulingDate !== undefined ? String(body.rulingDate).trim() : existing.rulingDate;
    const newCaseType = body.caseType !== undefined ? body.caseType : existing.caseType;
    const newCaseTypeTitle = body.caseTypeTitle !== undefined ? String(body.caseTypeTitle).trim() : existing.caseTypeTitle;
    const newSummary = body.summary !== undefined ? String(body.summary).trim() : existing.summary;
    const newFullText = body.fullRulingText !== undefined ? String(body.fullRulingText).trim() : existing.fullRulingText;

    const newPrinciples = body.legalPrinciples !== undefined
      ? (Array.isArray(body.legalPrinciples) ? body.legalPrinciples.map((s: any) => String(s).trim()).filter(Boolean) : [])
      : existing.legalPrinciples;

    const newKeywords = body.keywords !== undefined
      ? (Array.isArray(body.keywords) ? body.keywords.map((s: any) => String(s).trim()).filter(Boolean) : [])
      : (existing.keywords || []);

    const newAttachments = body.attachments !== undefined
      ? (Array.isArray(body.attachments) ? body.attachments.map((s: any) => String(s).trim()).filter(Boolean) : [])
      : (existing.attachments || []);

    const newAdminTags = body.adminTags !== undefined
      ? (Array.isArray(body.adminTags) ? body.adminTags.map((s: any) => String(s).trim()).filter(Boolean) : [])
      : (existing.adminTags || []);

    const newPublicLabels = body.publicLabels !== undefined
      ? (Array.isArray(body.publicLabels) ? body.publicLabels.map((s: any) => String(s).trim()).filter(Boolean) : [])
      : (existing.publicLabels || []);

    const newIsSystemPick = body.isSystemPick !== undefined ? Boolean(body.isSystemPick) : Boolean(existing.isSystemPick);
    const newIsVisible = body.isVisibleToAlumni !== undefined
      ? Boolean(body.isVisibleToAlumni)
      : Boolean(existing.isVisibleToAlumni);
    const newCommentsEnabled = body.commentsEnabled !== undefined
      ? Boolean(body.commentsEnabled)
      : (existing.commentsEnabled !== false);
    const newDisplayOrder = body.displayOrder !== undefined
      ? Number(body.displayOrder)
      : Number(existing.displayOrder || 0);
    const newStatus = body.status !== undefined
      ? body.status
      : (newIsVisible ? 'selected' : existing.status);
    const newInternalNote = body.internalReviewNote !== undefined
      ? (body.internalReviewNote ? String(body.internalReviewNote).trim() : null)
      : (existing.internalReviewNote || null);

    const [updRes]: any = await p.query(
      `UPDATE judicial_rulings
       SET title = ?, court_branch = ?, judge_name = ?, ruling_date = ?,
           case_type = ?, case_type_title = ?, summary = ?, legal_principles = ?,
           keywords = ?, attachments = ?, admin_tags = ?, public_labels = ?,
           is_system_pick = ?, is_visible_to_alumni = ?, comments_enabled = ?,
           display_order = ?, status = ?, full_ruling_text = ?, internal_review_note = ?,
           reviewed_at = CURRENT_TIMESTAMP(3), reviewed_by_name = ?,
           version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ?`,
      [
        newTitle,
        newCourt,
        newJudge,
        newRulingDate,
        newCaseType,
        newCaseTypeTitle,
        newSummary,
        JSON.stringify(newPrinciples),
        JSON.stringify(newKeywords),
        JSON.stringify(newAttachments),
        JSON.stringify(newAdminTags),
        JSON.stringify(newPublicLabels),
        newIsSystemPick ? 1 : 0,
        newIsVisible ? 1 : 0,
        newCommentsEnabled ? 1 : 0,
        newDisplayOrder,
        newStatus,
        newFullText,
        newInternalNote,
        currentUser.fullName,
        idBuf,
        req.params.id,
        expVer,
      ]
    );

    if (updRes && updRes.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این دادنامه توسط مدیر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const updatedRows = await selectWithTimeout<any>(
      `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id]
    );
    const [discRows]: any = await p.query(
      `SELECT * FROM ruling_discussions WHERE (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL ORDER BY created_at ASC`,
      [idBuf, req.params.id]
    );
    const finalRuling = mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow), true);

    auditChain.appendEntry({
      eventType: 'RULING_APPROVED',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `بررسی و تکمیل اطلاعات دادنامه در تالار رأی: ${newTitle} (نمایش به دانش‌آموختگان: ${newIsVisible ? 'فعال' : 'غیرفعال'})`,
      severity: 'info',
    });

    outbox.enqueue('rulings.updated', {
      id: finalRuling.id,
      resourceId: finalRuling.id,
      rulingId: finalRuling.id,
      version: finalRuling.version,
      ruling: finalRuling,
      updates: finalRuling,
    });

    res.json(finalRuling);
  } catch (err) {
    next(err);
  }
});

// POST /api/rulings — Reform 11: Minimal alumni upload (title + fullRulingText + optional attachments + optional keywords)
// Officials may also supply full fields directly if desired.
rulingsRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isOfficial = isOrganizationalUserRole(currentUser.role);
    const body = req.body || {};

    const title = String(body.title || '').trim();
    const fullRulingText = String(body.fullRulingText || '').trim();

    if (!title || !fullRulingText) {
      throw AppError.badRequest('عنوان رأی و متن کامل دادنامه الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();

    const keywords: string[] = Array.isArray(body.keywords)
      ? body.keywords.map((k: any) => String(k).trim()).filter(Boolean)
      : [];
    const attachments: string[] = Array.isArray(body.attachments)
      ? body.attachments.map((a: any) => String(a).trim()).filter(Boolean)
      : [];

    // Alumni submissions strictly start in pending_review and hidden from public alumni view until approved/selected
    const status = isOfficial && body.status === 'selected' ? 'selected' : 'pending_review';
    const isVisibleToAlumni = isOfficial && body.isVisibleToAlumni === true ? 1 : 0;

    const courtBranch = isOfficial && body.courtBranch ? String(body.courtBranch).trim() : 'در انتظار تکمیل دبیرخانه';
    const judgeName = isOfficial && body.judgeName ? String(body.judgeName).trim() : 'ثبت‌نشده (در انتظار بررسی)';
    const rulingDate = isOfficial && body.rulingDate ? String(body.rulingDate).trim() : new Date().toLocaleDateString('fa-IR');
    const caseType = body.caseType || 'commercial';
    const caseTypeTitle = body.caseTypeTitle || 'حقوقی و تجاری';
    const summary = isOfficial && body.summary ? String(body.summary).trim() : '';
    const legalPrinciples =
      isOfficial && Array.isArray(body.legalPrinciples)
        ? body.legalPrinciples.map((s: any) => String(s).trim()).filter(Boolean)
        : [];
    const adminTags = isOfficial && Array.isArray(body.adminTags) ? body.adminTags : [];
    const publicLabels = isOfficial && Array.isArray(body.publicLabels) ? body.publicLabels : [];
    const isSystemPick = isOfficial && Boolean(body.isSystemPick) ? 1 : 0;
    const commentsEnabled = body.commentsEnabled === false && isOfficial ? 0 : 1;

    await p.query(
      `INSERT INTO judicial_rulings (
        id, title, court_branch, judge_name, ruling_date, case_type, case_type_title,
        summary, legal_principles, keywords, attachments, admin_tags, public_labels,
        is_system_pick, is_visible_to_alumni, comments_enabled, display_order,
        full_ruling_text, status, submitted_by_id, submitted_by_name,
        likes_count, liked_by, dislikes_count, disliked_by,
        reviewed_at, reviewed_by_name, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, '[]', 0, '[]', ?, ?, 1)`,
      [
        idBuf,
        title,
        courtBranch,
        judgeName,
        rulingDate,
        caseType,
        caseTypeTitle,
        summary,
        JSON.stringify(legalPrinciples),
        JSON.stringify(keywords),
        JSON.stringify(attachments),
        JSON.stringify(adminTags),
        JSON.stringify(publicLabels),
        isSystemPick,
        isVisibleToAlumni,
        commentsEnabled,
        fullRulingText,
        status,
        uBuf,
        currentUser.fullName,
        isOfficial && status === 'selected' ? new Date() : null,
        isOfficial && status === 'selected' ? currentUser.fullName : null,
      ]
    );

    const insertedRows = await selectWithTimeout<any>(
      `SELECT * FROM judicial_rulings WHERE id = ? LIMIT 1`,
      [idBuf],
      3000
    );
    const createdForStaff = mapRulingRow(insertedRows[0], [], true);
    const createdForClient = mapRulingRow(insertedRows[0], [], isOfficial);

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `بارگذاری رأی جدید در تالار رأی قضایی: ${title}`,
      severity: 'info',
    });

    outbox.enqueue('rulings.created', {
      id,
      resourceId: id,
      rulingId: id,
      submittedById: currentUser.id,
      version: 1,
      ruling: createdForStaff,
      updates: createdForStaff,
    });

    res.status(201).json(createdForClient);
  } catch (err) {
    next(err);
  }
});

// POST /api/rulings/:id/approve — Approve & mark visible to alumni with review timestamp
rulingsRouter.post('/:id/approve', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    AuthorizationPolicy.assertRole(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      ['admin', 'supervisor']
    );

    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const rows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');

    const expVer = extractExpectedVersion(req, true);

    const [updateRes]: any = await p.query(
      `UPDATE judicial_rulings
       SET status = 'selected', is_visible_to_alumni = 1,
           reviewed_at = CURRENT_TIMESTAMP(3), reviewed_by_name = ?,
           version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ?`,
      [currentUser.fullName, idBuf, req.params.id, expVer]
    );

    if (updateRes && updateRes.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
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

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [discRows]: any = await p.query(
      `SELECT * FROM ruling_discussions WHERE (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL ORDER BY created_at ASC`,
      [idBuf, req.params.id]
    );
    const finalRuling = mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow), true);

    outbox.enqueue('rulings.approved', {
      id: finalRuling.id,
      resourceId: finalRuling.id,
      rulingId: finalRuling.id,
      version: finalRuling.version,
      ruling: finalRuling,
      updates: finalRuling,
    });

    res.json({ success: true, ruling: finalRuling });
  } catch (err) {
    next(err);
  }
});

// POST /api/rulings/:id/discussion & /critique — Enforces global & per-ruling commentsEnabled!
const handleAddDiscussion = async (req: Request, res: Response, next: any) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isOfficial = isOrganizationalUserRole(currentUser.role);
    const { comment } = req.body;

    if (!comment || !String(comment).trim()) {
      throw AppError.badRequest('متن نقد یا تحلیل فقهی-حقوقی الزامی است.');
    }

    const portalCfg = await loadRulingsPortalConfig();
    if (!portalCfg.globalCommentsEnabled && !isOfficial) {
      throw AppError.forbidden('امکان ثبت دیدگاه و کامنت در حال حاضر توسط مدیریت تالار غیرفعال شده است.');
    }

    const idBuf = toIdBuffer(req.params.id);
    const commentId = generateUUIDv7();
    const commentBuf = toIdBuffer(commentId);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();

    const rows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');
    const row = rows[0];

    const isVisible = row.status === 'selected' && Boolean(row.is_visible_to_alumni);
    if (!isOfficial && !isVisible) {
      throw AppError.forbidden('امکان ثبت دیدگاه برای دادنامه منتشرنشده وجود ندارد.');
    }

    const rulingCommentsEnabled =
      row.comments_enabled === undefined || row.comments_enabled === null
        ? true
        : Boolean(row.comments_enabled);

    if ((!portalCfg.globalCommentsEnabled || !rulingCommentsEnabled) && !isOfficial) {
      throw AppError.forbidden('ثبت دیدگاه برای این رأی توسط مدیریت بسته شده است.');
    }

    const roleTitleMap: Record<string, string> = {
      super_admin: 'مدیرکل سیستم',
      admin: 'مدیر کل سامانه',
      alumni_manager: 'مدیر دانش‌آموختگان',
      supervisor: 'ناظر علمی و پژوهشی',
      alumni: 'دانش‌آموخته نخبه',
    };
    const roleTitle = roleTitleMap[currentUser.role] || (isOfficial ? 'عضو هیئت ممیزی و مدیریت' : 'دانش‌آموخته نخبه');

    await p.query(
      `INSERT INTO ruling_discussions (id, ruling_id, author_id, author_name, author_role_title, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [commentBuf, idBuf, uBuf, currentUser.fullName, roleTitle, String(comment).trim()]
    );

    await p.query(`UPDATE judicial_rulings SET version = version + 1 WHERE id = ? OR id = ?`, [idBuf, req.params.id]);

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [discRows]: any = await p.query(
      `SELECT * FROM ruling_discussions WHERE (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL ORDER BY created_at ASC`,
      [idBuf, req.params.id]
    );
    const finalForStaff = mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow), true);
    const finalForClient = mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow), isOfficial);

    outbox.enqueue('rulings.critique_added', {
      id: finalForStaff.id,
      resourceId: finalForStaff.id,
      rulingId: finalForStaff.id,
      commentId,
      authorId: currentUser.id,
      version: finalForStaff.version,
      ruling: finalForStaff,
      updates: finalForStaff,
    });

    res.json({ success: true, ruling: finalForClient });
  } catch (err) {
    next(err);
  }
};

rulingsRouter.post('/:id/discussion', handleAddDiscussion);
rulingsRouter.post('/:id/critique', handleAddDiscussion);

// POST /api/rulings/:id/like — Mutually exclusive with dislikedBy inside transaction + post-commit read
rulingsRouter.post('/:id/like', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isOfficial = isOrganizationalUserRole(currentUser.role);
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    await withTx(async (conn) => {
      const [rows]: any = await conn.query(
        `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1 FOR UPDATE`,
        [idBuf, req.params.id]
      );
      if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');
      const row = rows[0];

      const isVisible = row.status === 'selected' && Boolean(row.is_visible_to_alumni);
      if (!isOfficial && !isVisible) {
        throw AppError.forbidden('امکان واکنش به دادنامه‌های منتشرنشده وجود ندارد.');
      }

      let likedBy = parseJsonArray<string>(row.liked_by, []);
      let dislikedBy = parseJsonArray<string>(row.disliked_by, []);

      const alreadyLiked = likedBy.includes(currentUser.id);
      if (alreadyLiked) {
        likedBy = likedBy.filter(id => id !== currentUser.id);
      } else {
        likedBy.push(currentUser.id);
        dislikedBy = dislikedBy.filter(id => id !== currentUser.id);
      }

      await conn.query(
        `UPDATE judicial_rulings
         SET liked_by = ?, likes_count = ?, disliked_by = ?, dislikes_count = ?, version = version + 1
         WHERE id = ? OR id = ?`,
        [
          JSON.stringify(likedBy),
          likedBy.length,
          JSON.stringify(dislikedBy),
          dislikedBy.length,
          idBuf,
          req.params.id,
        ]
      );
    });

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const [discRows]: any = await p.query(
      `SELECT * FROM ruling_discussions WHERE (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL ORDER BY created_at ASC`,
      [idBuf, req.params.id]
    );
    const finalForStaff = mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow), true);
    const finalForClient = mapRulingRow(updatedRows[0], (discRows || []).map(mapDiscussionRow), isOfficial);

    outbox.enqueue('rulings.liked', {
      id: finalForStaff.id,
      resourceId: finalForStaff.id,
      rulingId: finalForStaff.id,
      version: finalForStaff.version,
      ruling: finalForStaff,
      updates: finalForStaff,
    });

    res.json({ success: true, ruling: finalForClient });
  } catch (err) {
    next(err);
  }
});

registerRulingHighlightsAndPinRoutes(rulingsRouter);

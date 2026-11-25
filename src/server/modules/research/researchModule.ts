import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import {
  AuthorizationPolicy,
  isOrganizationalUserRole,
} from '../../platform/authorization';
import {
  ResearchMentorship,
  ResearchMessage,
  ResearchPortalConfig,
} from '../../../types';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';
import {
  DEFAULT_RESEARCH_PORTAL_CONFIG,
  loadResearchPortalConfig,
  mapResearchMentorshipRow,
  mapResearchMessageRow,
  normalizeResearchStatus,
} from './researchHelpers';

export const researchRouter = Router();
export function createResearchRouter(): Router {
  return researchRouter;
}

const SELECT_WITH_USER_JOIN = `
  SELECT r.*,
         u.full_name AS u_full_name,
         u.phone AS u_phone,
         u.national_id AS u_national_id,
         u.email AS u_email,
         u.province AS u_city,
         u.role_title AS u_role_title,
         COALESCE(u.university_name, u.organization) AS u_university,
         COALESCE(u.field_of_study, u.academic_degree) AS u_major,
         u.academic_degree AS u_bio
  FROM research_mentorships r
  LEFT JOIN users u ON (r.applicant_id = u.id)
`;

async function fetchMessagesForRequestIds(requestIds: string[]): Promise<Map<string, ResearchMessage[]>> {
  const map = new Map<string, ResearchMessage[]>();
  if (requestIds.length === 0) return map;

  const p = getPool();
  const idBuffers = requestIds.map(id => toIdBuffer(id));
  const [msgRows]: any = await p.query(
    `SELECT * FROM research_messages
     WHERE request_id IN (?) AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [idBuffers]
  );

  for (const row of msgRows || []) {
    const reqId = fromIdBuffer(row.request_id);
    if (!map.has(reqId)) map.set(reqId, []);
    map.get(reqId)!.push(mapResearchMessageRow(row));
  }
  return map;
}

async function fetchSingleMentorship(
  id: string,
  includeApplicantProfile: boolean
): Promise<(ResearchMentorship & { version: number }) | null> {
  const idBuf = toIdBuffer(id);
  const rows = await selectWithTimeout<any>(
    `${SELECT_WITH_USER_JOIN}
     WHERE (r.id = ? OR r.id = ?) AND r.deleted_at IS NULL
     LIMIT 1`,
    [idBuf, id],
    3500
  );
  if (!rows || rows.length === 0) return null;

  const canonicalId = fromIdBuffer(rows[0].id);
  const msgMap = await fetchMessagesForRequestIds([canonicalId]);
  return mapResearchMentorshipRow(
    rows[0],
    msgMap.get(canonicalId) || [],
    includeApplicantProfile
  );
}

// ---------------------------------------------------------------------------
// 1. Portal & Dynamic Wizard Config (Reforms 32, 33, 36, 37)
// ---------------------------------------------------------------------------
researchRouter.get('/config', async (_req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const config = await loadResearchPortalConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
});

researchRouter.put('/config', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    AuthorizationPolicy.requireRole(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      ['admin', 'supervisor']
    );

    const currentCfg = await loadResearchPortalConfig();
    const expectedVersion = extractExpectedVersion(req, true);
    const incoming = req.body?.config || req.body || {};
    const { version: _v, expectedVersion: _ev, ...clean } = incoming;

    const merged: ResearchPortalConfig = {
      ...DEFAULT_RESEARCH_PORTAL_CONFIG,
      ...currentCfg,
      ...clean,
      wizardConfig: {
        ...DEFAULT_RESEARCH_PORTAL_CONFIG.wizardConfig,
        ...(currentCfg.wizardConfig || {}),
        ...(clean.wizardConfig || {}),
      },
    };
    delete (merged as any).version;

    const p = getPool();
    const [updRes]: any = await p.query(
      `UPDATE system_settings
       SET setting_value = ?, last_modified_by = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE setting_key = 'research_portal_config' AND version = ?`,
      [JSON.stringify(merged), currentUser.fullName, expectedVersion]
    );

    if (updRes && updRes.affectedRows === 0) {
      throw AppError.conflict(
        'تنظیمات بخش راهبری پژوهش و مقاله توسط مدیر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کنید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const freshConfig = await loadResearchPortalConfig();

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: 'به‌روزرسانی تنظیمات، مراحل الگوریتم، توضیحات یا اطلاعات تماس بخش راهبری پژوهش و مقاله.',
      severity: 'info',
    });

    outbox.enqueue('research.config_updated', {
      id: 'research_portal_config',
      resourceId: 'research_portal_config',
      version: freshConfig.version,
      config: freshConfig,
      updates: freshConfig,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.json({ success: true, config: freshConfig });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 2. List & Get Research Mentorship Requests (Reform 38: Full Applicant Info for Officials)
// ---------------------------------------------------------------------------
researchRouter.get('/', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isOfficial = isOrganizationalUserRole(currentUser.role);

    let sql = `${SELECT_WITH_USER_JOIN} WHERE r.deleted_at IS NULL`;
    const params: any[] = [];

    if (!isOfficial) {
      sql += ` AND (r.applicant_id = ? OR r.applicant_id = ?)`;
      params.push(toIdBuffer(currentUser.id), currentUser.id);
    }
    sql += ` ORDER BY r.created_at DESC`;

    const rows = await selectWithTimeout<any>(sql, params, 4500);
    const requestIds = (rows || []).map(r => fromIdBuffer(r.id));
    const msgMap = await fetchMessagesForRequestIds(requestIds);

    const mapped = (rows || []).map(row => {
      const id = fromIdBuffer(row.id);
      return mapResearchMentorshipRow(row, msgMap.get(id) || [], true);
    });

    res.json(mapped);
  } catch (err) {
    next(err);
  }
});

researchRouter.get('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const existing = await fetchSingleMentorship(req.params.id, true);
    if (!existing) throw AppError.notFound('درخواست راهبری پژوهش');

    AuthorizationPolicy.assertCanAccessResource(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      { applicantId: existing.applicantId },
      'درخواست راهبری پژوهش'
    );

    res.json(existing);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 3. Submit New Research Guidance Request via Wizard (Reforms 33)
// ---------------------------------------------------------------------------
researchRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const portalCfg = await loadResearchPortalConfig();

    const {
      researchCategory: rawCat,
      serviceScope: rawScope,
      selectedPartialTopics,
      deliveryMode: rawDelivery,
      accommodationRequested: rawAcc,
      accommodationCity: rawCity,
      thesisTitle,
      briefSummary,
      targetInstitution,
      field,
      stageTitle,
      attachments: rawAttachments,
    } = req.body || {};

    const cleanAttachments = Array.isArray(rawAttachments)
      ? rawAttachments
          .filter((a: any) => a && typeof a.url === 'string' && a.url.trim())
          .map((a: any) => ({
            url: String(a.url).trim(),
            name: String(a.name || 'فایل پیوست').trim().slice(0, 180),
            ...(typeof a.size === 'number' ? { size: a.size } : {}),
          }))
      : [];

    const researchCategory: 'thesis' | 'article' | 'session_proposal' =
      rawCat === 'session_proposal'
        ? 'session_proposal'
        : rawCat === 'article'
        ? 'article'
        : 'thesis';
    const serviceScope: 'full_pack' | 'partial_mentorship' | 'session_proposal' =
      researchCategory === 'session_proposal'
        ? 'session_proposal'
        : rawScope === 'partial_mentorship'
        ? 'partial_mentorship'
        : 'full_pack';
    const deliveryMode: 'in_person' | 'online' | 'hybrid' =
      rawDelivery === 'hybrid' ? 'hybrid' : rawDelivery === 'online' ? 'online' : 'in_person';

    const cleanSummary = String(briefSummary || '').trim();
    const cleanTitle = String(thesisTitle || cleanSummary.split('\n')[0] || '').trim().slice(0, 240);
    if (!cleanTitle || cleanSummary.length < 5) {
      throw AppError.badRequest(
        researchCategory === 'session_proposal'
          ? 'لطفاً عنوان پیشنهادی نشست و شرح ضرورت و اهداف برگزاری را تکمیل فرمایید.'
          : 'لطفاً شرح مختصر درخواست راهبری (شامل عنوان، هدف پژوهش و نهاد مقصد) را تکمیل فرمایید.'
      );
    }

    const partialTopicsList = Array.isArray(selectedPartialTopics)
      ? selectedPartialTopics.map((t: any) => String(t).trim()).filter(Boolean)
      : [];

    if (researchCategory !== 'session_proposal' && serviceScope === 'partial_mentorship' && partialTopicsList.length === 0) {
      throw AppError.badRequest('لطفاً حداقل یک بخش مورد نیاز برای همکاری یا راهبری موردی را انتخاب نمایید.');
    }

    // Reform 33: Accommodation only applies in Path A (full_pack) + In-Person + enabled by Admin
    const accommodationRequested =
      researchCategory !== 'session_proposal' &&
      serviceScope === 'full_pack' &&
      deliveryMode === 'in_person' &&
      portalCfg.accommodationEnabledInWizard &&
      Boolean(rawAcc);

    const accommodationCity = accommodationRequested
      ? (rawCity || 'قم')
      : null;

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();

    const modeLabel =
      deliveryMode === 'hybrid' ? 'ترکیبی (حضوری و آنلاین)' : deliveryMode === 'online' ? 'آنلاین' : 'حضوری';
    const categoryLabel =
      researchCategory === 'session_proposal'
        ? 'پیشنهاد برگزاری نشست علمی'
        : researchCategory === 'article'
        ? 'همکاری در مقاله'
        : 'راهبری پایان‌نامه';
    const defaultStageDesc =
      stageTitle ||
      (researchCategory === 'session_proposal'
        ? `پیشنهاد برگزاری نشست علمی (${modeLabel}) — در انتظار بررسی شورا`
        : serviceScope === 'full_pack'
        ? `${categoryLabel} · پک کامل (${modeLabel})`
        : `${categoryLabel} · همکاری موردی (${modeLabel})`);

    await p.query(
      `INSERT INTO research_mentorships (
        id, applicant_id, applicant_name, research_category, service_scope,
        selected_partial_topics, delivery_mode, thesis_title, field,
        brief_summary, target_institution, supervisor_professor,
        accommodation_requested, accommodation_city, attachments, status, description, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 1)`,
      [
        idBuf,
        uBuf,
        currentUser.fullName,
        researchCategory,
        serviceScope,
        JSON.stringify(partialTopicsList),
        deliveryMode,
        cleanTitle,
        String(field || 'فقه و حقوق اسلامی').trim(),
        cleanSummary,
        targetInstitution ? String(targetInstitution).trim() : null,
        researchCategory === 'session_proposal'
          ? 'در انتظار بررسی شورای علمی نشست‌ها'
          : 'در انتظار تعیین توسط شورای پژوهشی',
        accommodationRequested ? 1 : 0,
        accommodationCity,
        JSON.stringify(cleanAttachments),
        defaultStageDesc,
      ]
    );

    const created = await fetchSingleMentorship(id, true);
    if (!created) throw AppError.internal('خطا در بازیابی درخواست ثبت‌شده');

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details:
        researchCategory === 'session_proposal'
          ? `ثبت پیشنهاد برگزاری نشست علمی (${modeLabel}): ${cleanTitle}`
          : `ثبت درخواست ${categoryLabel} (${serviceScope === 'full_pack' ? 'پک کامل' : 'موردی'}): ${cleanTitle}`,
      severity: 'info',
    });

    outbox.enqueue('research.created', {
      id: created.id,
      resourceId: created.id,
      projectId: created.id,
      applicantId: currentUser.id,
      version: created.version,
      mentorship: created,
      updates: created,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 4. Edit Request (Reform 35 Lock: Applicant blocked once status leaves 'pending')
// ---------------------------------------------------------------------------
researchRouter.put('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isOfficial = isOrganizationalUserRole(currentUser.role);
    const portalCfg = await loadResearchPortalConfig();

    const existing = await fetchSingleMentorship(req.params.id, true);
    if (!existing) throw AppError.notFound('درخواست راهبری پژوهش');

    AuthorizationPolicy.assertCanAccessResource(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      { applicantId: existing.applicantId },
      'درخواست راهبری پژوهش'
    );

    if (!isOfficial && existing.status !== 'pending') {
      throw AppError.forbidden(
        'این درخواست وارد مرحله بررسی کارشناسی شده است و دیگر امکان ویرایش آن توسط متقاضی وجود ندارد.',
        'REQUEST_LOCKED_IN_REVIEW'
      );
    }

    const expVer = extractExpectedVersion(req, true);
    const body = req.body || {};

    const nextCategory =
      body.researchCategory === 'session_proposal' ||
      body.researchCategory === 'article' ||
      body.researchCategory === 'thesis'
        ? body.researchCategory
        : existing.researchCategory || 'thesis';
    const nextScope =
      nextCategory === 'session_proposal'
        ? 'session_proposal'
        : body.serviceScope === 'partial_mentorship' || body.serviceScope === 'full_pack'
        ? body.serviceScope
        : existing.serviceScope || 'full_pack';
    const nextDelivery =
      body.deliveryMode === 'hybrid' ||
      body.deliveryMode === 'online' ||
      body.deliveryMode === 'in_person'
        ? body.deliveryMode
        : existing.deliveryMode || 'in_person';
    const nextPartialTopics = Array.isArray(body.selectedPartialTopics)
      ? body.selectedPartialTopics.map((t: any) => String(t).trim()).filter(Boolean)
      : existing.selectedPartialTopics || [];
    const nextBrief =
      body.briefSummary !== undefined ? String(body.briefSummary).trim() : existing.briefSummary || '';
    const nextTitle =
      body.thesisTitle !== undefined
        ? String(body.thesisTitle).trim()
        : nextBrief
        ? nextBrief.split('\n')[0].slice(0, 240)
        : existing.thesisTitle;
    const nextField = body.field !== undefined ? String(body.field).trim() : existing.field;
    const nextTargetInst =
      body.targetInstitution !== undefined
        ? body.targetInstitution || null
        : existing.targetInstitution || null;

    const nextAcc =
      nextCategory !== 'session_proposal' &&
      nextScope === 'full_pack' &&
      nextDelivery === 'in_person' &&
      portalCfg.accommodationEnabledInWizard
        ? body.accommodationRequested !== undefined
          ? Boolean(body.accommodationRequested)
          : Boolean(existing.accommodationRequested)
        : false;
    const nextCity = nextAcc ? body.accommodationCity || existing.accommodationCity || 'قم' : null;

    const nextSupervisor = isOfficial && body.assignedSupervisor !== undefined
      ? String(body.assignedSupervisor).trim()
      : existing.assignedSupervisor || 'در انتظار تعیین توسط شورای پژوهشی';
    const nextStageTitle =
      body.stageTitle !== undefined ? String(body.stageTitle).trim() : existing.stageTitle;
    const nextStatus =
      isOfficial && body.status !== undefined
        ? normalizeResearchStatus(body.status)
        : existing.status;

    const nextAttachments = Array.isArray(body.attachments)
      ? body.attachments
          .filter((a: any) => a && typeof a.url === 'string' && a.url.trim())
          .map((a: any) => ({
            url: String(a.url).trim(),
            name: String(a.name || 'فایل پیوست').trim().slice(0, 180),
            ...(typeof a.size === 'number' ? { size: a.size } : {}),
          }))
      : existing.attachments || [];

    const idBuf = toIdBuffer(existing.id);
    const p = getPool();
    const [updateRes]: any = await p.query(
      `UPDATE research_mentorships
       SET research_category = ?, service_scope = ?, selected_partial_topics = ?,
           delivery_mode = ?, thesis_title = ?, field = ?, brief_summary = ?,
           target_institution = ?, accommodation_requested = ?, accommodation_city = ?,
           attachments = ?, supervisor_professor = ?, description = ?, status = ?,
           version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
      [
        nextCategory,
        nextScope,
        JSON.stringify(nextPartialTopics),
        nextDelivery,
        nextTitle,
        nextField,
        nextBrief,
        nextTargetInst,
        nextAcc ? 1 : 0,
        nextCity,
        JSON.stringify(nextAttachments),
        nextSupervisor,
        nextStageTitle,
        nextStatus,
        idBuf,
        existing.id,
        expVer,
      ]
    );

    if (updateRes && updateRes.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این پرونده توسط کاربر یا مدیر دیگری هم‌زمان تغییر یافته است. لطفاً صفحه را بازخوانی کنید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const finalItem = await fetchSingleMentorship(existing.id, true);
    if (!finalItem) throw AppError.internal('خطا در بازیابی درخواست ویرایش‌شده');

    outbox.enqueue('research.updated', {
      id: finalItem.id,
      resourceId: finalItem.id,
      projectId: finalItem.id,
      applicantId: finalItem.applicantId,
      version: finalItem.version,
      mentorship: finalItem,
      updates: finalItem,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.json(finalItem);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 5. Official Status Transitions: in_review / approved / rejected / completed (Reform 34)
// ---------------------------------------------------------------------------
researchRouter.patch('/:id/status', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    AuthorizationPolicy.requireRole(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      ['admin', 'supervisor']
    );

    const existing = await fetchSingleMentorship(req.params.id, true);
    if (!existing) throw AppError.notFound('درخواست راهبری پژوهش');

    const expVer = extractExpectedVersion(req, true);
    const { status, adminNote, assignedSupervisor, stageTitle, replyMessage } = req.body || {};

    if (!['pending', 'in_review', 'approved', 'rejected', 'completed'].includes(status)) {
      throw AppError.badRequest('وضعیت انتخابی نامعتبر است.');
    }

    const idBuf = toIdBuffer(existing.id);
    const p = getPool();

    const defaultStageLabel =
      status === 'in_review'
        ? 'در حال بررسی توسط کارشناس پژوهش'
        : status === 'approved'
        ? 'تایید نهایی و آغاز فرآیند راهبری'
        : status === 'rejected'
        ? 'درخواست تایید نشد'
        : status === 'completed'
        ? 'فرآیند راهبری تکمیل شد'
        : 'در انتظار بررسی';

    const [updRes]: any = await p.query(
      `UPDATE research_mentorships
       SET status = ?,
           admin_note = COALESCE(?, admin_note),
           supervisor_professor = COALESCE(?, supervisor_professor),
           description = ?,
           reviewed_by = ?,
           reviewed_at = CURRENT_TIMESTAMP(3),
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
      [
        status,
        adminNote !== undefined ? adminNote : null,
        assignedSupervisor || null,
        stageTitle || defaultStageLabel,
        currentUser.fullName,
        idBuf,
        existing.id,
        expVer,
      ]
    );

    if (updRes && updRes.affectedRows === 0) {
      throw AppError.conflict(
        'وضعیت این پرونده توسط مدیر دیگری تغییر یافته است. لطفاً دوباره تلاش کنید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    // If manager also included a reply message along with status change, store it in research_messages
    if (replyMessage && String(replyMessage).trim()) {
      const msgId = generateUUIDv7();
      await p.query(
        `INSERT INTO research_messages (id, request_id, sender_id, sender_name, sender_role, is_official, message)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [
          toIdBuffer(msgId),
          idBuf,
          toIdBuffer(currentUser.id),
          currentUser.fullName,
          currentUser.role,
          String(replyMessage).trim(),
        ]
      );
    }

    const updated = await fetchSingleMentorship(existing.id, true);
    if (!updated) throw AppError.internal('خطا در بازیابی وضعیت جدید');

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `تغییر وضعیت درخواست پژوهش (${existing.thesisTitle}) به [${status}]`,
      severity: 'info',
    });

    outbox.enqueue('research.updated', {
      id: updated.id,
      resourceId: updated.id,
      projectId: updated.id,
      applicantId: updated.applicantId,
      version: updated.version,
      mentorship: updated,
      updates: updated,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.json({ success: true, mentorship: updated });
  } catch (err) {
    next(err);
  }
});

researchRouter.patch('/:id/progress', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    AuthorizationPolicy.requireRole(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      ['admin', 'supervisor']
    );

    const { stage, stageTitle } = req.body;
    const existing = await fetchSingleMentorship(req.params.id, true);
    if (!existing) throw AppError.notFound('طرح پژوهشی');

    const expVer = extractExpectedVersion(req, true);
    const nextStatus =
      stage === 'proposal' ? 'in_review' : stage === 'drafting' ? 'approved' : 'completed';
    const idBuf = toIdBuffer(existing.id);
    const p = getPool();

    const [updateRes]: any = await p.query(
      `UPDATE research_mentorships
       SET description = ?, status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3), version = version + 1
       WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
      [stageTitle || existing.stageTitle, nextStatus, currentUser.fullName, idBuf, existing.id, expVer]
    );

    if (updateRes && updateRes.affectedRows === 0) {
      throw AppError.conflict(
        'وضعیت پیشرفت این پژوهش تغییر یافته است. لطفاً صفحه را بازخوانی کنید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const finalItem = await fetchSingleMentorship(existing.id, true);
    outbox.enqueue('research.progress_updated', {
      id: finalItem!.id,
      resourceId: finalItem!.id,
      projectId: finalItem!.id,
      applicantId: finalItem!.applicantId,
      version: finalItem!.version,
      mentorship: finalItem,
      updates: finalItem,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.json({ success: true, mentorship: finalItem });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 6. Two-Way Messaging Thread in All Statuses (Reform 34)
// ---------------------------------------------------------------------------
researchRouter.post('/:id/messages', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isOfficial = isOrganizationalUserRole(currentUser.role);

    const existing = await fetchSingleMentorship(req.params.id, true);
    if (!existing) throw AppError.notFound('درخواست راهبری پژوهش');

    AuthorizationPolicy.assertCanAccessResource(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      { applicantId: existing.applicantId },
      'درخواست راهبری پژوهش'
    );

    const text = String(req.body?.message || '').trim();
    if (!text) {
      throw AppError.badRequest('متن پیام نمی‌تواند خالی باشد.');
    }

    const msgId = generateUUIDv7();
    const p = getPool();
    await p.query(
      `INSERT INTO research_messages (id, request_id, sender_id, sender_name, sender_role, is_official, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        toIdBuffer(msgId),
        toIdBuffer(existing.id),
        toIdBuffer(currentUser.id),
        currentUser.fullName,
        currentUser.role,
        isOfficial ? 1 : 0,
        text,
      ]
    );

    const updated = await fetchSingleMentorship(existing.id, true);
    if (!updated) throw AppError.internal('خطا در بازیابی پیام‌های پرونده');

    outbox.enqueue('research.message_added', {
      id: updated.id,
      resourceId: updated.id,
      projectId: updated.id,
      applicantId: updated.applicantId,
      version: updated.version,
      mentorship: updated,
      updates: updated,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.status(201).json({ success: true, mentorship: updated });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// 7. Soft Delete with Reform 35 Lock & OCC
// ---------------------------------------------------------------------------
researchRouter.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isOfficial = isOrganizationalUserRole(currentUser.role);

    const existing = await fetchSingleMentorship(req.params.id, false);
    if (!existing) throw AppError.notFound('درخواست راهبری پژوهش');

    AuthorizationPolicy.assertCanAccessResource(
      { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
      { applicantId: existing.applicantId },
      'درخواست راهبری پژوهش'
    );

    // Reform 35: Block applicant deletion once request enters in_review / approved / rejected
    if (!isOfficial && existing.status !== 'pending') {
      throw AppError.forbidden(
        'این درخواست وارد مرحله بررسی شده و دیگر امکان حذف آن توسط متقاضی وجود ندارد.',
        'REQUEST_LOCKED_IN_REVIEW'
      );
    }

    const expVer = extractExpectedVersion(req, true);
    const idBuf = toIdBuffer(existing.id);
    const p = getPool();

    const [delRes]: any = await p.query(
      `UPDATE research_mentorships
       SET deleted_at = CURRENT_TIMESTAMP(3), deleted_by = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
      [currentUser.fullName, idBuf, existing.id, expVer]
    );

    if (delRes && delRes.affectedRows === 0) {
      throw AppError.conflict(
        'درخواست یافت نشد یا نسخه آن تغییر یافته است.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `حذف نرم درخواست راهبری پژوهش: ${existing.thesisTitle}`,
      severity: 'warning',
    });

    outbox.enqueue('research.deleted', {
      id: existing.id,
      resourceId: existing.id,
      projectId: existing.id,
      mentorshipId: existing.id,
      applicantId: existing.applicantId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.json({ success: true, id: existing.id });
  } catch (err) {
    next(err);
  }
});

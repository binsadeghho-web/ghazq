import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy, isOrganizationalUserRole } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { toIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';
import {
  DEFAULT_RULINGS_PORTAL_CONFIG,
  loadRulingsPortalConfig,
  mapDiscussionRow,
  mapRulingRow,
  parseJsonArray,
  sanitizePortalConfigForAlumni,
} from './rulingHelpers';

export function registerRulingAdminAndInteractionsRoutes(router: Router): void {
  // 1. Get Rulings Portal Config (layoutMode, globalCommentsEnabled, tags/labels definitions)
  router.get('/portal-config', async (req: Request, res: Response, next) => {
    try {
      const currentUser = getCurrentUser(req);
      const isOfficial = isOrganizationalUserRole(currentUser?.role);
      const config = await loadRulingsPortalConfig();
      res.json(isOfficial ? config : sanitizePortalConfigForAlumni(config));
    } catch (err) {
      next(err);
    }
  });

  // 2. Update Rulings Portal Config (Admin / Alumni Manager / Supervisor) with Strict OCC
  router.put('/portal-config', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      AuthorizationPolicy.assertRole(
        { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
        ['admin', 'supervisor']
      );

      const currentConfig = await loadRulingsPortalConfig();
      const expVer = extractExpectedVersion(req, true);
      const incoming = req.body?.config || req.body || {};
      const { version: _v, expectedVersion: _ev, ...cleanUpdates } = incoming;

      const merged = {
        ...DEFAULT_RULINGS_PORTAL_CONFIG,
        ...currentConfig,
        ...cleanUpdates,
      };
      delete (merged as any).version;

      const p = getPool();
      const [updRes]: any = await p.query(
        `UPDATE system_settings
         SET setting_value = ?, last_modified_by = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
         WHERE setting_key = 'rulings_portal_config' AND version = ?`,
        [JSON.stringify(merged), currentUser.fullName, expVer]
      );

      if (updRes && updRes.affectedRows === 0) {
        throw AppError.conflict(
          'تنظیمات تالار رأی توسط مدیر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کنید.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const fresh = await loadRulingsPortalConfig();
      outbox.enqueue('rulings.portal_config_updated', {
        id: 'rulings_portal_config',
        version: fresh.version,
        config: fresh,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
      });

      res.json({ success: true, config: fresh });
    } catch (err) {
      next(err);
    }
  });

  // 3. Reorder Rulings (Display Order Management - Officials Only)
  router.put('/reorder', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      AuthorizationPolicy.assertRole(
        { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
        ['admin', 'supervisor']
      );

      const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
      if (orderedIds.length === 0) {
        throw AppError.badRequest('لیست ترتیب آراء ارسال نشده است.');
      }

      await withTx(async (conn) => {
        for (let idx = 0; idx < orderedIds.length; idx++) {
          const rId = String(orderedIds[idx]);
          const rBuf = toIdBuffer(rId);
          await conn.query(
            `UPDATE judicial_rulings SET display_order = ?, version = version + 1 WHERE id = ? OR id = ?`,
            [idx + 1, rBuf, rId]
          );
        }
      });

      outbox.enqueue('rulings.reordered', {
        orderedIds,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
      });

      res.json({ success: true, orderedIds });
    } catch (err) {
      next(err);
    }
  });

  // 4. Toggle Dislike Reaction (Mutually exclusive with Like, withTx + post-commit read)
  router.post('/:id/dislike', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const isOfficial = isOrganizationalUserRole(currentUser.role);
      const idBuf = toIdBuffer(req.params.id);

      await withTx(async (conn) => {
        const [rows]: any = await conn.query(
          `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1 FOR UPDATE`,
          [idBuf, req.params.id]
        );
        if (!rows || rows.length === 0) throw AppError.notFound('دادنامه');
        const row = rows[0];

        const isPublicVisible = row.status === 'selected' && Boolean(row.is_visible_to_alumni);
        if (!isOfficial && !isPublicVisible) {
          throw AppError.forbidden('امکان واکنش به دادنامه‌های منتشرنشده وجود ندارد.');
        }

        let likedBy = parseJsonArray<string>(row.liked_by, []);
        let dislikedBy = parseJsonArray<string>(row.disliked_by, []);

        const alreadyDisliked = dislikedBy.includes(currentUser.id);
        if (alreadyDisliked) {
          dislikedBy = dislikedBy.filter(uid => uid !== currentUser.id);
        } else {
          dislikedBy.push(currentUser.id);
          likedBy = likedBy.filter(uid => uid !== currentUser.id);
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

      const p = getPool();
      const updatedRows = await selectWithTimeout<any>(
        `SELECT * FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id]
      );
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

  // 5. Edit a Ruling Discussion Comment (Officials Only)
  router.patch('/:id/discussions/:discussionId', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      AuthorizationPolicy.assertRole(
        { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
        ['admin', 'supervisor']
      );

      const commentText = String(req.body?.comment || '').trim();
      if (!commentText) {
        throw AppError.badRequest('متن جدید نظر نمی‌تواند خالی باشد.');
      }

      const idBuf = toIdBuffer(req.params.id);
      const discBuf = toIdBuffer(req.params.discussionId);
      const p = getPool();

      const [updRes]: any = await p.query(
        `UPDATE ruling_discussions
         SET comment = ?, edited_at = CURRENT_TIMESTAMP(3)
         WHERE (id = ? OR id = ?) AND (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL`,
        [commentText, discBuf, req.params.discussionId, idBuf, req.params.id]
      );

      if (updRes && updRes.affectedRows === 0) {
        throw AppError.notFound('دیدگاه مورد نظر');
      }

      await p.query(
        `UPDATE judicial_rulings SET version = version + 1 WHERE id = ? OR id = ?`,
        [idBuf, req.params.id]
      );

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
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `ویرایش دیدگاه در تالار رأی (شناسه رأی: ${req.params.id})`,
        severity: 'info',
      });

      outbox.enqueue('rulings.critique_updated', {
        id: finalRuling.id,
        resourceId: finalRuling.id,
        rulingId: finalRuling.id,
        discussionId: req.params.discussionId,
        version: finalRuling.version,
        ruling: finalRuling,
        updates: finalRuling,
      });

      res.json({ success: true, ruling: finalRuling });
    } catch (err) {
      next(err);
    }
  });

  // 6. Soft-Delete a Ruling Discussion Comment (Officials Only - Zero Hard Delete)
  router.delete('/:id/discussions/:discussionId', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      AuthorizationPolicy.assertRole(
        { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
        ['admin', 'supervisor']
      );

      const idBuf = toIdBuffer(req.params.id);
      const discBuf = toIdBuffer(req.params.discussionId);
      const p = getPool();

      const [delRes]: any = await p.query(
        `UPDATE ruling_discussions
         SET deleted_at = CURRENT_TIMESTAMP(3)
         WHERE (id = ? OR id = ?) AND (ruling_id = ? OR ruling_id = ?) AND deleted_at IS NULL`,
        [discBuf, req.params.discussionId, idBuf, req.params.id]
      );

      if (delRes && delRes.affectedRows === 0) {
        throw AppError.notFound('دیدگاه مورد نظر');
      }

      await p.query(
        `UPDATE judicial_rulings SET version = version + 1 WHERE id = ? OR id = ?`,
        [idBuf, req.params.id]
      );

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
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `حذف نرم دیدگاه در تالار رأی (شناسه رأی: ${req.params.id})`,
        severity: 'warning',
      });

      outbox.enqueue('rulings.critique_deleted', {
        id: finalRuling.id,
        resourceId: finalRuling.id,
        rulingId: finalRuling.id,
        discussionId: req.params.discussionId,
        version: finalRuling.version,
        ruling: finalRuling,
        updates: finalRuling,
      });

      res.json({ success: true, ruling: finalRuling });
    } catch (err) {
      next(err);
    }
  });
}

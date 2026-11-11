import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';

export function registerRulingHighlightsAndPinRoutes(router: Router): void {
  // Save / Update Text Highlights on a Ruling (Strict OCC)
  router.put('/:id/highlights', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      if (!user) throw AppError.unauthorized('احراز هویت الزامی است.');

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const { highlights } = req.body;
      const safeHighlights = Array.isArray(highlights) ? highlights : [];
      const p = getPool();

      const [upd]: any = await p.query(
        `UPDATE judicial_rulings
         SET highlights = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [JSON.stringify(safeHighlights), idBuf, req.params.id, expVer]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این دادنامه توسط کاربر دیگری تغییر یافته است. لطفاً بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const rows = await selectWithTimeout<any>(`SELECT version FROM judicial_rulings WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id], 3000);
      const newVer = Number(rows?.[0]?.version || expVer + 1);

      outbox.enqueue('rulings.highlights_updated', {
        rulingId: req.params.id,
        highlights: safeHighlights,
        version: newVer,
      });

      res.json({
        success: true,
        rulingId: req.params.id,
        highlights: safeHighlights,
        version: newVer,
      });
    } catch (err) {
      next(err);
    }
  });

  // Pin / Unpin Featured Critique ("نقد برگزیده") (Admin/Supervisor Only)
  router.patch('/:id/discussions/:discussionId/feature', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const dBuf = toIdBuffer(req.params.discussionId);
      const isFeatured = Boolean(req.body.isFeatured);
      const p = getPool();

      await p.query(
        `UPDATE ruling_discussions SET is_featured = ? WHERE id = ? OR id = ?`,
        [isFeatured ? 1 : 0, dBuf, req.params.discussionId]
      );

      outbox.enqueue('rulings.critique_featured', {
        rulingId: req.params.id,
        discussionId: req.params.discussionId,
        isFeatured,
      });

      res.json({
        success: true,
        rulingId: req.params.id,
        discussionId: req.params.discussionId,
        isFeatured,
      });
    } catch (err) {
      next(err);
    }
  });
}

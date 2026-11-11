import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';

export function registerCartableReferralRoutes(router: Router): void {
  // Internal Referral & SLA Note Update (Admin / Supervisor Only, Strict OCC)
  router.patch('/:id/referral', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const { referredDepartment, internalReferralNote, status } = req.body;

      if (!referredDepartment) {
        throw AppError.badRequest('واحد مقصد جهت ارجاع داخلی الزامی است.');
      }

      const p = getPool();
      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM cartable_requests WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('درخواست کارتابل');
      }
      const existing = existingRows[0];
      const nextStatus = status || (existing.status === 'pending' ? 'in_progress' : existing.status);

      const [upd]: any = await p.query(
        `UPDATE cartable_requests
         SET referred_department = ?, internal_referral_note = ?, status = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [
          referredDepartment.trim(),
          internalReferralNote ? internalReferralNote.trim() : null,
          nextStatus,
          idBuf,
          req.params.id,
          expVer,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این پرونده توسط مسئول دیگری تغییر یافته است. لطفاً بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const newVer = Number(existing.version || 1) + 1;
      const payload = {
        requestId: fromIdBuffer(existing.id),
        applicantId: fromIdBuffer(existing.applicant_id),
        referredDepartment: referredDepartment.trim(),
        internalReferralNote: internalReferralNote ? internalReferralNote.trim() : '',
        status: nextStatus,
        version: newVer,
      };

      outbox.enqueue('cartable.referred', {
        resourceId: payload.requestId,
        updates: payload,
        version: newVer,
      });

      res.json({
        success: true,
        ...payload,
      });
    } catch (err) {
      next(err);
    }
  });

  // Append Disk File Attachment to Cartable Request (Strict OCC)
  router.post('/:id/attachments', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const idBuf = toIdBuffer(req.params.id);
      const { fileUrl } = req.body;

      if (!fileUrl || typeof fileUrl !== 'string') {
        throw AppError.badRequest('آدرس فایل پیوست معتبر نیست.');
      }

      const p = getPool();
      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM cartable_requests WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('درخواست کارتابل');
      }
      const existing = existingRows[0];
      const ownerId = fromIdBuffer(existing.applicant_id);
      AuthorizationPolicy.assertOwnership(
        { userId: user.id, role: user.role, fullName: user.fullName },
        ownerId,
        'درخواست کارتابل',
        true
      );

      let currentAttachments: string[] = [];
      try {
        if (existing.attachments) {
          currentAttachments = typeof existing.attachments === 'string'
            ? JSON.parse(existing.attachments)
            : existing.attachments;
        }
      } catch {
        currentAttachments = [];
      }
      if (!Array.isArray(currentAttachments)) currentAttachments = [];
      const nextAttachments = [...currentAttachments, fileUrl];

      await p.query(
        `UPDATE cartable_requests SET attachments = ?, version = version + 1 WHERE id = ? OR id = ?`,
        [JSON.stringify(nextAttachments), idBuf, req.params.id]
      );

      const newVer = Number(existing.version || 1) + 1;
      const resourceId = fromIdBuffer(existing.id);

      outbox.enqueue('cartable.attachment_added', {
        resourceId,
        updates: { attachments: nextAttachments },
        version: newVer,
      });

      res.json({
        id: resourceId,
        attachments: nextAttachments,
        version: newVer,
      });
    } catch (err) {
      next(err);
    }
  });
}

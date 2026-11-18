import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, withTx, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { CourseInstallmentRecord } from '../../../types';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function mapInstallmentRow(row: any): CourseInstallmentRecord {
  const today = todayIsoDate();
  const dueIso = String(row.due_date_iso || '').slice(0, 10);
  const rawStatus = row.status || 'pending';
  const isOverdue = (rawStatus === 'pending' || rawStatus === 'overdue') && dueIso && dueIso < today;
  const effectiveStatus = isOverdue ? 'overdue' : rawStatus;
  const isDueNow =
    (effectiveStatus === 'pending' || effectiveStatus === 'overdue' || effectiveStatus === 'rejected') &&
    (!dueIso || dueIso <= today);

  return {
    id: fromIdBuffer(row.id),
    enrollmentId: fromIdBuffer(row.enrollment_id),
    courseId: fromIdBuffer(row.course_id),
    courseTitle: row.course_title,
    userId: fromIdBuffer(row.user_id),
    userName: row.user_name,
    userPhone: row.user_phone || undefined,
    userNationalId: row.user_national_id || undefined,
    installmentNumber: Number(row.installment_number || 1),
    title: row.title,
    amount: Number(row.amount || 0),
    dueDateIso: dueIso,
    dueDateJalali: row.due_date_jalali || dueIso,
    status: effectiveStatus,
    paymentMethod: row.payment_method || undefined,
    trackingCode: row.tracking_code || undefined,
    receiptFileUrl: row.receipt_file_url || undefined,
    receiptBankName: row.receipt_bank_name || undefined,
    receiptDate: row.receipt_date || undefined,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    adminNote: row.admin_note || undefined,
    isDueNow,
    version: Number(row.version || 1),
  };
}

export function registerCourseInstallmentsRoutes(router: Router): void {
  // Current user's installments & auto-due installments for automatic gateway trigger
  router.get('/installments/my', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const uBuf = toIdBuffer(user.id);

      const rows = await selectWithTimeout<any>(
        `SELECT * FROM course_installments
         WHERE (user_id = ? OR user_id = ?) AND deleted_at IS NULL
         ORDER BY due_date_iso ASC, installment_number ASC`,
        [uBuf, user.id],
        4000
      );

      const items = (rows || []).map(mapInstallmentRow);
      const dueNow = items.filter(i => i.isDueNow);
      res.json({
        items,
        dueNow,
      });
    } catch (err) {
      next(err);
    }
  });

  // Admin: comprehensive installments overview & filterable list
  router.get('/installments/admin', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const courseId = req.query.courseId as string | undefined;
      const status = req.query.status as string | undefined;
      const search = (req.query.search as string | undefined)?.trim();

      let sql = `SELECT * FROM course_installments WHERE deleted_at IS NULL`;
      const params: any[] = [];

      if (courseId && courseId !== 'all') {
        sql += ` AND (course_id = ? OR course_id = ?)`;
        params.push(toIdBuffer(courseId), courseId);
      }

      if (status && status !== 'all' && status !== 'overdue') {
        sql += ` AND status = ?`;
        params.push(status);
      }

      if (search) {
        const like = `%${search}%`;
        sql += ` AND (user_name LIKE ? OR user_national_id LIKE ? OR user_phone LIKE ? OR tracking_code LIKE ? OR course_title LIKE ?)`;
        params.push(like, like, like, like, like);
      }

      sql += ` ORDER BY due_date_iso ASC, installment_number ASC LIMIT 1000`;

      const rows = await selectWithTimeout<any>(sql, params, 4000);
      let items = (rows || []).map(mapInstallmentRow);

      if (status === 'overdue') {
        items = items.filter(i => i.status === 'overdue');
      }

      const uniqueStudents = new Set(items.map(i => i.userId)).size;
      const paidTotal = items.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
      const pendingTotal = items.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
      const awaitingCount = items.filter(i => i.status === 'awaiting_verification').length;
      const overdueCount = items.filter(i => i.status === 'overdue').length;

      res.json({
        items,
        summary: {
          totalRecords: items.length,
          uniqueStudents,
          paidTotal,
          pendingTotal,
          awaitingCount,
          overdueCount,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // Pay an installment (Student: Online Gateway instant confirm OR Private Disk Receipt upload)
  router.post('/installments/:installmentId/pay', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const installmentId = req.params.installmentId;
      const iBuf = toIdBuffer(installmentId);
      const expVer = extractExpectedVersion(req, true);

      const { paymentMethod, trackingCode, receiptFileUrl, receiptBankName, receiptDate } = req.body || {};
      if (paymentMethod !== 'online_gateway' && paymentMethod !== 'bank_receipt') {
        throw AppError.badRequest('شیوه پرداخت قسط نامعتبر است.', 'INVALID_PAYMENT_METHOD');
      }

      if (paymentMethod === 'bank_receipt') {
        if (!receiptFileUrl || !String(receiptFileUrl).startsWith('/api/storage/private/course_receipts/')) {
          throw AppError.badRequest('بارگذاری تصویر معتبر فیش واریزی در حافظه امن دیسک الزامی است.', 'INVALID_RECEIPT_FILE');
        }
      }

      const rows = await selectWithTimeout<any>(
        `SELECT * FROM course_installments WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [iBuf, installmentId],
        3000
      );
      if (!rows || rows.length === 0) throw AppError.notFound('قسط آموزشی');
      const existing = mapInstallmentRow(rows[0]);

      const isAdmin = user.role === 'admin' || user.role === 'supervisor';
      if (!isAdmin && existing.userId !== user.id) {
        throw AppError.forbidden('شما مجاز به پرداخت قسط کاربر دیگری نیستید.');
      }
      if (existing.status === 'paid') {
        throw AppError.conflict('این قسط قبلاً تسویه و تایید شده است.', 'INSTALLMENT_ALREADY_PAID');
      }

      const newStatus = paymentMethod === 'online_gateway' ? 'paid' : 'awaiting_verification';
      const finalTracking =
        trackingCode || (paymentMethod === 'online_gateway' ? `SHP-INST-${Date.now().toString().slice(-6)}` : `TRX-INST-${Date.now().toString().slice(-6)}`);

      const updated = await withTx(async (conn) => {
        const [upd]: any = await conn.query(
          `UPDATE course_installments
           SET status = ?, payment_method = ?, tracking_code = ?, receipt_file_url = ?,
               receipt_bank_name = ?, receipt_date = ?, paid_at = CURRENT_TIMESTAMP(3),
               version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
           WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
          [
            newStatus,
            paymentMethod,
            finalTracking,
            receiptFileUrl || null,
            receiptBankName || (paymentMethod === 'online_gateway' ? 'درگاه پرداخت شاپرک' : 'بانک مبدأ'),
            receiptDate || new Date().toLocaleDateString('fa-IR'),
            iBuf,
            installmentId,
            expVer,
          ]
        );

        if (!upd || upd.affectedRows === 0) {
          throw AppError.conflict('وضعیت این قسط هم‌زمان تغییر یافته است. لطفاً بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
        }

        if (newStatus === 'paid') {
          await conn.query(
            `UPDATE course_enrollments
             SET amount_paid = amount_paid + ?, version = version + 1
             WHERE id = ? OR id = ?`,
            [existing.amount, toIdBuffer(existing.enrollmentId), existing.enrollmentId]
          );
        }

        const [refreshed]: any = await conn.query(
          `SELECT * FROM course_installments WHERE id = ? OR id = ? LIMIT 1`,
          [iBuf, installmentId]
        );
        return mapInstallmentRow(refreshed[0]);
      });

      auditChain.appendEntry({
        eventType: 'LOGIN_SUCCESS',
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        ip: '127.0.0.1',
        details: `ثبت پرداخت قسط [${updated.title}] دوره [${updated.courseTitle}] به مبلغ ${updated.amount} تومان (${newStatus}).`,
        severity: 'info',
      });

      outbox.enqueue('courses.installment_updated', {
        installmentId: updated.id,
        courseId: updated.courseId,
        userId: updated.userId,
        installment: updated,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Admin: Review (confirm/reject) or reschedule an installment (Strict OCC)
  router.patch('/installments/:installmentId/review', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const installmentId = req.params.installmentId;
      const iBuf = toIdBuffer(installmentId);
      const expVer = extractExpectedVersion(req, true);
      const { status, adminNote, dueDateIso, dueDateJalali, amount } = req.body || {};

      const rows = await selectWithTimeout<any>(
        `SELECT * FROM course_installments WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [iBuf, installmentId],
        3000
      );
      if (!rows || rows.length === 0) throw AppError.notFound('قسط آموزشی');
      const existing = mapInstallmentRow(rows[0]);

      const nextStatus = status || existing.status;
      const nextDueIso = dueDateIso !== undefined ? String(dueDateIso).slice(0, 10) : existing.dueDateIso;
      const nextDueJalali = dueDateJalali !== undefined ? String(dueDateJalali) : existing.dueDateJalali;
      const nextAmount = amount !== undefined ? Math.max(0, Number(amount)) : existing.amount;
      const nextNote = adminNote !== undefined ? adminNote : existing.adminNote;

      const updated = await withTx(async (conn) => {
        const [upd]: any = await conn.query(
          `UPDATE course_installments
           SET status = ?, due_date_iso = ?, due_date_jalali = ?, amount = ?, admin_note = ?,
               reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3),
               version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
           WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
          [nextStatus, nextDueIso, nextDueJalali, nextAmount, nextNote || null, user.fullName, iBuf, installmentId, expVer]
        );

        if (!upd || upd.affectedRows === 0) {
          throw AppError.conflict('اطلاعات این قسط توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
        }

        if (nextStatus === 'paid' && existing.status !== 'paid') {
          await conn.query(
            `UPDATE course_enrollments SET amount_paid = amount_paid + ?, version = version + 1 WHERE id = ? OR id = ?`,
            [nextAmount, toIdBuffer(existing.enrollmentId), existing.enrollmentId]
          );
        }

        const [refreshed]: any = await conn.query(
          `SELECT * FROM course_installments WHERE id = ? OR id = ? LIMIT 1`,
          [iBuf, installmentId]
        );
        return mapInstallmentRow(refreshed[0]);
      });

      outbox.enqueue('courses.installment_updated', {
        installmentId: updated.id,
        courseId: updated.courseId,
        userId: updated.userId,
        installment: updated,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
}

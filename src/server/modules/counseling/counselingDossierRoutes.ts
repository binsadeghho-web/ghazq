import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';

export function registerCounselingDossierRoutes(router: Router): void {
  // Get Counseling Session Dossiers (Filtered for Alumni or Full for Admin/Supervisor with Identity Privacy Toggle)
  router.get('/dossiers', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const isStaff = user.role === 'admin' || user.role === 'supervisor';

      let sql = `SELECT * FROM counseling_session_dossiers WHERE 1=1`;
      const params: any[] = [];

      if (!isStaff) {
        sql += ` AND (applicant_id = ? OR applicant_id = ?)`;
        params.push(toIdBuffer(user.id), user.id);
      }

      if (req.query.requestId) {
        sql += ` AND (request_id = ? OR request_id = ?)`;
        params.push(toIdBuffer(String(req.query.requestId)), String(req.query.requestId));
      }

      sql += ` ORDER BY session_number ASC, created_at DESC LIMIT 200`;
      const rows = await selectWithTimeout<any>(sql, params, 3000);

      res.json((rows || []).map((r: any) => {
        const hideIdentity = Boolean(r.hide_applicant_identity);
        return {
          id: fromIdBuffer(r.id),
          requestId: fromIdBuffer(r.request_id),
          applicantId: fromIdBuffer(r.applicant_id),
          applicantName: hideIdentity ? `پرونده محرمانه #${fromIdBuffer(r.request_id).slice(-5)}` : r.applicant_name,
          rawApplicantName: isStaff ? r.applicant_name : undefined,
          consultantName: r.consultant_name,
          sessionNumber: Number(r.session_number || 1),
          sessionDate: r.session_date,
          summaryNotes: r.summary_notes,
          nextSteps: r.next_steps || '',
          hideApplicantIdentity: hideIdentity,
          version: Number(r.version || 1),
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        };
      }));
    } catch (err) {
      next(err);
    }
  });

  // Create Counseling Session Dossier Entry (Admin/Supervisor)
  router.post('/dossiers', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const { requestId, applicantId, applicantName, consultantName, sessionNumber, sessionDate, summaryNotes, nextSteps, hideApplicantIdentity } = req.body;
      if (!requestId || !summaryNotes) {
        throw AppError.badRequest('شناسه درخواست مشاوره و خلاصه پرونده جلسه الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const reqBuf = toIdBuffer(requestId);
      const appBuf = toIdBuffer(applicantId || user.id);
      const p = getPool();

      await p.query(
        `INSERT INTO counseling_session_dossiers (
          id, request_id, applicant_id, applicant_name, consultant_name, session_number, session_date, summary_notes, next_steps, hide_applicant_identity, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          reqBuf,
          appBuf,
          applicantName || 'دانش‌آموخته',
          consultantName || 'مشاور مرکز',
          Number(sessionNumber || 1),
          sessionDate || '۱۴۰۵/۰۲/۱۵',
          summaryNotes.trim(),
          nextSteps ? nextSteps.trim() : null,
          hideApplicantIdentity ? 1 : 0,
        ]
      );

      const created = {
        id,
        requestId,
        applicantId: applicantId || user.id,
        applicantName: hideApplicantIdentity ? `پرونده محرمانه #${String(requestId).slice(-5)}` : (applicantName || 'دانش‌آموخته'),
        rawApplicantName: applicantName || 'دانش‌آموخته',
        consultantName: consultantName || 'مشاور مرکز',
        sessionNumber: Number(sessionNumber || 1),
        sessionDate: sessionDate || '۱۴۰۵/۰۲/۱۵',
        summaryNotes: summaryNotes.trim(),
        nextSteps: nextSteps ? nextSteps.trim() : '',
        hideApplicantIdentity: Boolean(hideApplicantIdentity),
        version: 1,
        createdAt: new Date().toISOString(),
      };

      outbox.enqueue('counseling.dossier_created', {
        id,
        dossier: created,
        version: 1,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // Toggle Applicant Identity Visibility on Counseling Request & Dossiers (Admin Only, Strict OCC)
  router.patch('/requests/:id/identity-visibility', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const hideIdentity = Boolean(req.body.hideIdentity);
      const p = getPool();

      const [upd]: any = await p.query(
        `UPDATE counseling_requests SET hide_identity = ?, version = version + 1 WHERE (id = ? OR id = ?) AND version = ?`,
        [hideIdentity ? 1 : 0, idBuf, req.params.id, expVer]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این درخواست مشاوره توسط مدیر دیگری ویرایش شده است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      await p.query(
        `UPDATE counseling_session_dossiers SET hide_applicant_identity = ?, version = version + 1 WHERE request_id = ? OR request_id = ?`,
        [hideIdentity ? 1 : 0, idBuf, req.params.id]
      );

      outbox.enqueue('counseling.identity_toggled', {
        requestId: req.params.id,
        hideIdentity,
      });

      res.json({ success: true, requestId: req.params.id, hideIdentity });
    } catch (err) {
      next(err);
    }
  });

  // Update Consultant Availability Calendar Slots (Admin Only, Strict OCC)
  router.put('/consultants/:id/schedule', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const { scheduleSlots, availability } = req.body;
      const p = getPool();

      const [upd]: any = await p.query(
        `UPDATE consultants
         SET schedule_slots = ?, availability = COALESCE(?, availability), version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [
          JSON.stringify(Array.isArray(scheduleSlots) ? scheduleSlots : []),
          availability || null,
          idBuf,
          req.params.id,
          expVer,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('تقویم حضور این مشاور توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      outbox.enqueue('counseling.schedule_updated', {
        consultantId: req.params.id,
        scheduleSlots: Array.isArray(scheduleSlots) ? scheduleSlots : [],
        availability,
      });

      res.json({
        success: true,
        consultantId: req.params.id,
        scheduleSlots: Array.isArray(scheduleSlots) ? scheduleSlots : [],
        availability,
      });
    } catch (err) {
      next(err);
    }
  });
}

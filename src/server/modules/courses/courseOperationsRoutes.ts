import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';

export function registerCourseOperationsRoutes(router: Router): void {
  // Get Course Operations Data (Attendance, Waitlist, Certificates, Sessions Count & Waitlist Enabled)
  router.get('/:courseId/operations', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);

      const [courseRows, attRows, waitRows, certRows] = await Promise.all([
        selectWithTimeout<any>(`SELECT id, title, instructor, hours, sessions_count, waitlist_enabled, version FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId], 3000),
        selectWithTimeout<any>(`SELECT * FROM course_attendance WHERE course_id = ? OR course_id = ? ORDER BY session_number ASC`, [cBuf, courseId], 3000),
        selectWithTimeout<any>(`SELECT * FROM course_waitlist WHERE course_id = ? OR course_id = ? ORDER BY created_at ASC`, [cBuf, courseId], 3000),
        selectWithTimeout<any>(`SELECT * FROM course_certificates WHERE course_id = ? OR course_id = ? ORDER BY issued_at DESC`, [cBuf, courseId], 3000),
      ]);

      if (!courseRows || courseRows.length === 0) {
        throw AppError.notFound('دوره آموزشی');
      }
      const cRow = courseRows[0];

      res.json({
        courseId: fromIdBuffer(cRow.id),
        sessionsCount: Number(cRow.sessions_count || 4),
        waitlistEnabled: cRow.waitlist_enabled !== undefined ? Boolean(cRow.waitlist_enabled) : true,
        version: Number(cRow.version || 1),
        attendance: (attRows || []).map((r: any) => ({
          id: fromIdBuffer(r.id),
          courseId: fromIdBuffer(r.course_id),
          userId: fromIdBuffer(r.user_id),
          userName: r.user_name,
          sessionNumber: Number(r.session_number),
          sessionTitle: r.session_title || `جلسه ${r.session_number}`,
          status: r.status,
          recordedBy: r.recorded_by || undefined,
          version: Number(r.version || 1),
          updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
        })),
        waitlist: (waitRows || []).map((w: any) => ({
          id: fromIdBuffer(w.id),
          courseId: fromIdBuffer(w.course_id),
          courseTitle: w.course_title,
          userId: fromIdBuffer(w.user_id),
          userName: w.user_name,
          userPhone: w.user_phone,
          status: w.status,
          version: Number(w.version || 1),
          createdAt: w.created_at ? new Date(w.created_at).toISOString() : new Date().toISOString(),
        })),
        certificates: (certRows || []).map((cert: any) => ({
          id: fromIdBuffer(cert.id),
          certificateNumber: cert.certificate_number,
          courseId: fromIdBuffer(cert.course_id),
          courseTitle: cert.course_title,
          instructor: cert.instructor,
          hours: Number(cert.hours || 0),
          userId: fromIdBuffer(cert.user_id),
          userName: cert.user_name,
          userNationalId: cert.user_national_id || '',
          issuedAt: cert.issued_at ? new Date(cert.issued_at).toISOString() : new Date().toISOString(),
          version: Number(cert.version || 1),
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  // Update Course Sessions Count & Waitlist Enabled Toggle (Admin Only, Strict OCC)
  router.patch('/:courseId/operations-settings', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);
      const p = getPool();

      const rows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId], 3000);
      if (!rows || rows.length === 0) throw AppError.notFound('دوره آموزشی');
      const existing = rows[0];

      const sessionsCount = req.body.sessionsCount !== undefined ? Math.max(1, Math.min(50, Number(req.body.sessionsCount))) : Number(existing.sessions_count || 4);
      const waitlistEnabled = req.body.waitlistEnabled !== undefined ? (req.body.waitlistEnabled ? 1 : 0) : Number(existing.waitlist_enabled ?? 1);

      const [upd]: any = await p.query(
        `UPDATE courses
         SET sessions_count = ?, waitlist_enabled = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [sessionsCount, waitlistEnabled, cBuf, courseId, expVer]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('تنظیمات این دوره توسط مدیر دیگری تغییر یافته است. لطفاً بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const newVer = Number(existing.version || 1) + 1;
      outbox.enqueue('courses.operations_updated', {
        courseId,
        sessionsCount,
        waitlistEnabled: Boolean(waitlistEnabled),
        version: newVer,
      });

      res.json({
        courseId,
        sessionsCount,
        waitlistEnabled: Boolean(waitlistEnabled),
        version: newVer,
      });
    } catch (err) {
      next(err);
    }
  });

  // Record / Update Multi-Session Attendance
  router.post('/:courseId/attendance', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);
      const { userId, userName, sessionNumber, sessionTitle, status } = req.body;

      if (!userId || !sessionNumber) {
        throw AppError.badRequest('شناسه دانش‌آموخته و شماره جلسه الزامی است.');
      }

      const uBuf = toIdBuffer(userId);
      const p = getPool();
      const id = generateUUIDv7();

      await p.query(
        `INSERT INTO course_attendance (id, course_id, user_id, user_name, session_number, session_title, status, recorded_by, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE status = VALUES(status), session_title = VALUES(session_title), recorded_by = VALUES(recorded_by), version = version + 1, updated_at = CURRENT_TIMESTAMP(3)`,
        [
          toIdBuffer(id),
          cBuf,
          uBuf,
          userName || 'دانش‌آموخته',
          Number(sessionNumber),
          sessionTitle || `جلسه ${sessionNumber}`,
          status || 'present',
          user.fullName,
        ]
      );

      outbox.enqueue('courses.attendance_updated', {
        courseId,
        userId,
        sessionNumber: Number(sessionNumber),
        status: status || 'present',
      });

      res.json({
        success: true,
        courseId,
        userId,
        sessionNumber: Number(sessionNumber),
        status: status || 'present',
      });
    } catch (err) {
      next(err);
    }
  });

  // Join Course Waitlist (Only when waitlist_enabled is true)
  router.post('/:courseId/waitlist', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);
      const uBuf = toIdBuffer(user.id);
      const p = getPool();

      const cRows = await selectWithTimeout<any>(`SELECT title, waitlist_enabled FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId], 3000);
      if (!cRows || cRows.length === 0) throw AppError.notFound('دوره آموزشی');
      const course = cRows[0];

      if (course.waitlist_enabled !== undefined && !Boolean(course.waitlist_enabled)) {
        throw AppError.badRequest('لیست انتظار برای این دوره توسط مدیریت غیرفعال شده است.');
      }

      const id = generateUUIDv7();
      await p.query(
        `INSERT INTO course_waitlist (id, course_id, course_title, user_id, user_name, user_phone, status, version)
         VALUES (?, ?, ?, ?, ?, ?, 'waiting', 1)
         ON DUPLICATE KEY UPDATE status = 'waiting', version = version + 1`,
        [toIdBuffer(id), cBuf, course.title, uBuf, user.fullName, (user as any).phone || '09120000000']
      );

      outbox.enqueue('courses.waitlist_updated', {
        courseId,
        userId: user.id,
        userName: user.fullName,
        status: 'waiting',
      });

      res.status(201).json({
        success: true,
        courseId,
        userId: user.id,
        userName: user.fullName,
        status: 'waiting',
      });
    } catch (err) {
      next(err);
    }
  });

  // Update Waitlist Item Status (Admin Only)
  router.patch('/:courseId/waitlist/:waitlistId', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const wBuf = toIdBuffer(req.params.waitlistId);
      const p = getPool();

      const [upd]: any = await p.query(
        `UPDATE course_waitlist SET status = ?, version = version + 1 WHERE (id = ? OR id = ?) AND version = ?`,
        [req.body.status || 'notified', wBuf, req.params.waitlistId, expVer]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('وضعیت لیست انتظار توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      outbox.enqueue('courses.waitlist_updated', {
        courseId: req.params.courseId,
        waitlistId: req.params.waitlistId,
        status: req.body.status,
      });

      res.json({ success: true, id: req.params.waitlistId, status: req.body.status });
    } catch (err) {
      next(err);
    }
  });

  // Issue Official Course Certificate
  router.post('/:courseId/certificates', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);
      const p = getPool();

      const cRows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId], 3000);
      if (!cRows || cRows.length === 0) throw AppError.notFound('دوره آموزشی');
      const course = cRows[0];

      const targetUserId = (currentUser.role === 'admin' || currentUser.role === 'supervisor') && req.body.userId
        ? req.body.userId
        : currentUser.id;
      const targetUserName = req.body.userName || currentUser.fullName;
      const targetNationalId = req.body.userNationalId || currentUser.nationalId || '';

      const uBuf = toIdBuffer(targetUserId);
      const existingCert = await selectWithTimeout<any>(
        `SELECT * FROM course_certificates WHERE (course_id = ? OR course_id = ?) AND (user_id = ? OR user_id = ?) LIMIT 1`,
        [cBuf, courseId, uBuf, targetUserId],
        3000
      );

      if (existingCert && existingCert.length > 0) {
        const c = existingCert[0];
        return res.json({
          id: fromIdBuffer(c.id),
          certificateNumber: c.certificate_number,
          courseId: fromIdBuffer(c.course_id),
          courseTitle: c.course_title,
          instructor: c.instructor,
          hours: Number(c.hours || course.hours || course.duration_hours || 16),
          userId: fromIdBuffer(c.user_id),
          userName: c.user_name,
          userNationalId: c.user_national_id || '',
          issuedAt: c.issued_at ? new Date(c.issued_at).toISOString() : new Date().toISOString(),
        });
      }

      const id = generateUUIDv7();
      const certNum = `CERT-FQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const hours = Number(course.hours || course.duration_hours || 16);

      await p.query(
        `INSERT INTO course_certificates (id, certificate_number, course_id, course_title, instructor, hours, user_id, user_name, user_national_id, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [toIdBuffer(id), certNum, cBuf, course.title, course.instructor, hours, uBuf, targetUserName, targetNationalId]
      );

      const certObj = {
        id,
        certificateNumber: certNum,
        courseId,
        courseTitle: course.title,
        instructor: course.instructor,
        hours,
        userId: targetUserId,
        userName: targetUserName,
        userNationalId: targetNationalId,
        issuedAt: new Date().toISOString(),
      };

      outbox.enqueue('courses.certificate_issued', {
        courseId,
        certificate: certObj,
      });

      res.status(201).json(certObj);
    } catch (err) {
      next(err);
    }
  });
}

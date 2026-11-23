import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getPool, selectWithTimeout, withTx, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { storageConfig } from '../../platform/storage';
import { outbox } from '../../platform/outbox';
import {
  normalizeCourseScope,
  canManageCourseScope,
  isWorkshopOnlyManager,
  assertCanManageCourseScope,
  assertCanManageCourseId,
  redactNationalIdForUser,
} from './courseScopeAuth';

function formatReadableBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '۰ بایت';
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} مگابایت`;
}

function resolveCourseDiskFolderName(rawCourseId: string): string {
  const clean = String(rawCourseId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!clean) {
    throw AppError.badRequest('شناسه دوره یا پوشه نامعتبر است.');
  }
  return clean.startsWith('draft_') || clean.startsWith('course_') ? clean : `course_${clean}`;
}

export function registerCourseOperationsRoutes(router: Router): void {
  // Scan / list physical files in a course's dedicated disk folder (`course_files/course_<id>/`)
  router.get('/:courseId/disk-files', async (req: Request, res: Response, next) => {
    try {
      const user = getCurrentUser(req);
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };

      const folderName = resolveCourseDiskFolderName(req.params.courseId);
      if (folderName.startsWith('draft_')) {
        if (!canManageCourseScope(authCtx, 'counseling_workshop') && !canManageCourseScope(authCtx, 'specialized')) {
          throw AppError.forbidden('سطح دسترسی شما مجاز به مشاهده فایل‌های پیش‌نویس نیست.');
        }
      } else {
        const cleanCourseId = folderName.startsWith('course_') ? folderName.slice('course_'.length) : folderName;
        await assertCanManageCourseId(authCtx, cleanCourseId);
      }

      const baseDir = path.resolve(storageConfig.categories.course_file.path);
      const targetDir = path.resolve(baseDir, folderName);
      if (!targetDir.startsWith(baseDir + path.sep)) {
        throw AppError.forbidden('مسیر پوشه غیرمجاز است.');
      }

      await fs.promises.mkdir(targetDir, { recursive: true, mode: 0o755 });
      const entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
      const files: Array<{
        filename: string;
        sizeBytes: number;
        sizeLabel: string;
        format: string;
        url: string;
        modifiedAt: string;
      }> = [];

      for (const entry of entries) {
        if (!entry.isFile() || entry.name.startsWith('.')) continue;
        const full = path.join(targetDir, entry.name);
        const st = await fs.promises.stat(full);
        const ext = path.extname(entry.name).replace('.', '').toUpperCase() || 'FILE';
        files.push({
          filename: entry.name,
          sizeBytes: st.size,
          sizeLabel: formatReadableBytes(st.size),
          format: ext,
          url: `/api/storage/private/${storageConfig.categories.course_file.folderName}/${folderName}/${encodeURIComponent(entry.name)}`,
          modifiedAt: st.mtime.toISOString(),
        });
      }

      files.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

      res.json({
        courseId: req.params.courseId,
        folderName,
        relativeDiskPath: `storage/uploads/${storageConfig.categories.course_file.folderName}/${folderName}`,
        files,
      });
    } catch (err) {
      next(err);
    }
  });

  // Delete a specific file from the course's dedicated disk folder
  router.delete('/:courseId/disk-files/:filename', async (req: Request, res: Response, next) => {
    try {
      const user = getCurrentUser(req);
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };

      const folderName = resolveCourseDiskFolderName(req.params.courseId);
      if (folderName.startsWith('draft_')) {
        if (!canManageCourseScope(authCtx, 'counseling_workshop') && !canManageCourseScope(authCtx, 'specialized')) {
          throw AppError.forbidden('سطح دسترسی شما مجاز به حذف فایل‌های پیش‌نویس نیست.');
        }
      } else {
        const cleanCourseId = folderName.startsWith('course_') ? folderName.slice('course_'.length) : folderName;
        await assertCanManageCourseId(authCtx, cleanCourseId);
      }
      const safeFilename = path.basename(decodeURIComponent(req.params.filename || ''));
      if (!safeFilename || safeFilename.includes('..')) {
        throw AppError.badRequest('نام فایل نامعتبر است.');
      }

      const baseDir = path.resolve(storageConfig.categories.course_file.path);
      const targetFile = path.resolve(baseDir, folderName, safeFilename);
      if (!targetFile.startsWith(baseDir + path.sep)) {
        throw AppError.forbidden('مسیر فایل غیرمجاز است.');
      }

      await fs.promises.unlink(targetFile).catch((err: any) => {
        if (err?.code !== 'ENOENT') throw err;
      });

      if (!folderName.startsWith('draft_')) {
        const cleanCourseId = folderName.startsWith('course_') ? folderName.slice('course_'.length) : folderName;
        const p = getPool();
        await p.query(
          `UPDATE course_files SET deleted_at = CURRENT_TIMESTAMP(3)
           WHERE (course_id = ? OR course_id = ?) AND filename = ? AND deleted_at IS NULL`,
          [toIdBuffer(cleanCourseId), cleanCourseId, safeFilename]
        ).catch(() => {});
      }

      res.json({ success: true, filename: safeFilename });
    } catch (err) {
      next(err);
    }
  });

  // Get Course Operations Data (Attendance, Waitlist, Certificates, Sessions & Waitlist Enabled)
  router.get('/:courseId/operations', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };
      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);

      const [courseRows, attRows, waitRows, certRows] = await Promise.all([
        selectWithTimeout<any>(`SELECT id, title, instructor, hours, sessions_count, sessions, waitlist_enabled, course_scope, version FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId], 3000),
        selectWithTimeout<any>(`SELECT * FROM course_attendance WHERE course_id = ? OR course_id = ? ORDER BY session_number ASC`, [cBuf, courseId], 3000),
        selectWithTimeout<any>(`SELECT * FROM course_waitlist WHERE course_id = ? OR course_id = ? ORDER BY created_at ASC`, [cBuf, courseId], 3000),
        selectWithTimeout<any>(`SELECT * FROM course_certificates WHERE (course_id = ? OR course_id = ?) AND deleted_at IS NULL ORDER BY issued_at DESC`, [cBuf, courseId], 3000),
      ]);

      if (!courseRows || courseRows.length === 0) {
        throw AppError.notFound('دوره آموزشی');
      }
      const cRow = courseRows[0];
      const courseScope = normalizeCourseScope(cRow.course_scope);
      if (isWorkshopOnlyManager(authCtx) && courseScope !== 'counseling_workshop') {
        throw AppError.forbidden('دسترسی مسئول مشاوره صرفاً به کارگاه‌های آموزشی مجاز است.');
      }
      const isWorkshopMgr = canManageCourseScope(authCtx, courseScope);
      let parsedSessions: any[] = [];
      try {
        parsedSessions = typeof cRow.sessions === 'string' ? JSON.parse(cRow.sessions) : Array.isArray(cRow.sessions) ? cRow.sessions : [];
      } catch {}

      const isEndUserOnly = user.role === 'alumni' || user.role === 'customer' || (!isWorkshopMgr && user.role !== 'general_observer' && !canManageCourseScope(authCtx, 'specialized'));

      res.json({
        courseId: fromIdBuffer(cRow.id),
        courseScope,
        sessionsCount: parsedSessions.length > 0 ? parsedSessions.length : Number(cRow.sessions_count || 4),
        sessions: parsedSessions,
        waitlistEnabled: cRow.waitlist_enabled !== undefined ? Boolean(cRow.waitlist_enabled) : true,
        version: Number(cRow.version || 1),
        attendance: (attRows || [])
          .filter((r: any) => !isEndUserOnly || fromIdBuffer(r.user_id) === user.id)
          .map((r: any) => ({
            id: fromIdBuffer(r.id),
            courseId: fromIdBuffer(r.course_id),
            userId: fromIdBuffer(r.user_id),
            userName: r.user_name,
            sessionNumber: Number(r.session_number),
            sessionTitle: r.session_title || `جلسه ${r.session_number}`,
            status: r.status,
            note: r.note || undefined,
            recordedBy: r.recorded_by || undefined,
            version: Number(r.version || 1),
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
          })),
        waitlist: (waitRows || [])
          .filter((w: any) => !isEndUserOnly || fromIdBuffer(w.user_id) === user.id)
          .map((w: any) => ({
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
        certificates: (certRows || [])
          .filter((cert: any) => !isEndUserOnly || fromIdBuffer(cert.user_id) === user.id)
          .map((cert: any) => redactNationalIdForUser(authCtx, {
            id: fromIdBuffer(cert.id),
            certificateNumber: cert.certificate_number,
            courseId: fromIdBuffer(cert.course_id),
            courseTitle: cert.course_title,
            instructor: cert.instructor,
            hours: Number(cert.hours || 0),
            userId: fromIdBuffer(cert.user_id),
            userName: cert.user_name,
            userNationalId: cert.user_national_id || '',
            certificateFileUrl: cert.certificate_file_url || undefined,
            certificateFileName: cert.certificate_file_name || undefined,
            uploadedByName: cert.uploaded_by_name || undefined,
            gradeText: cert.grade_text || undefined,
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
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };

      const expVer = extractExpectedVersion(req, true);
      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);
      const p = getPool();

      const rows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId], 3000);
      if (!rows || rows.length === 0) throw AppError.notFound('دوره آموزشی');
      const existing = rows[0];
      const courseScope = normalizeCourseScope(existing.course_scope);
      assertCanManageCourseScope(authCtx, courseScope);

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
        courseScope,
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

  // Record / Update Single Attendance
  router.post('/:courseId/attendance', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };

      const courseId = req.params.courseId;
      const courseScope = await assertCanManageCourseId(authCtx, courseId);
      const cBuf = toIdBuffer(courseId);
      const { userId, userName, sessionNumber, sessionTitle, status, note, sessionId } = req.body;

      if (!userId || !sessionNumber) {
        throw AppError.badRequest('شناسه دانش‌آموخته و شماره جلسه الزامی است.');
      }

      const validStatuses = new Set(['present', 'absent', 'excused', 'late']);
      const normalizedStatus = validStatuses.has(status) ? status : 'present';

      const uBuf = toIdBuffer(userId);
      const p = getPool();
      const id = generateUUIDv7();

      await p.query(
        `INSERT INTO course_attendance (id, course_id, user_id, user_name, session_number, session_title, status, note, session_id, recorded_by, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           session_title = VALUES(session_title),
           note = VALUES(note),
           session_id = VALUES(session_id),
           recorded_by = VALUES(recorded_by),
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP(3)`,
        [
          toIdBuffer(id),
          cBuf,
          uBuf,
          userName || 'دانش‌آموخته',
          Number(sessionNumber),
          sessionTitle || `جلسه ${sessionNumber}`,
          normalizedStatus,
          note || null,
          sessionId || null,
          user.fullName,
        ]
      );

      outbox.enqueue('courses.attendance_updated', {
        courseId,
        courseScope,
        userId,
        sessionNumber: Number(sessionNumber),
        status: normalizedStatus,
      });

      res.json({
        success: true,
        courseId,
        userId,
        sessionNumber: Number(sessionNumber),
        status: normalizedStatus,
        note: note || undefined,
      });
    } catch (err) {
      next(err);
    }
  });

  // Bulk Record / Update Attendance for a Session (or multiple records) in a single transaction
  router.post('/:courseId/attendance/bulk', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };

      const courseId = req.params.courseId;
      const courseScope = await assertCanManageCourseId(authCtx, courseId);
      const cBuf = toIdBuffer(courseId);
      const records = Array.isArray(req.body?.records) ? req.body.records : [];
      if (records.length === 0) {
        throw AppError.badRequest('لیست رکوردهای حضور و غیاب خالی است.');
      }

      const validStatuses = new Set(['present', 'absent', 'excused', 'late']);
      await withTx(async (conn) => {
        for (const rec of records) {
          if (!rec.userId || !rec.sessionNumber) continue;
          const normalizedStatus = validStatuses.has(rec.status) ? rec.status : 'present';
          await conn.query(
            `INSERT INTO course_attendance (id, course_id, user_id, user_name, session_number, session_title, status, note, session_id, recorded_by, version)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE
               status = VALUES(status),
               session_title = VALUES(session_title),
               note = VALUES(note),
               session_id = VALUES(session_id),
               recorded_by = VALUES(recorded_by),
               version = version + 1,
               updated_at = CURRENT_TIMESTAMP(3)`,
            [
              toIdBuffer(generateUUIDv7()),
              cBuf,
              toIdBuffer(rec.userId),
              rec.userName || 'دانش‌آموخته',
              Number(rec.sessionNumber),
              rec.sessionTitle || `جلسه ${rec.sessionNumber}`,
              normalizedStatus,
              rec.note || null,
              rec.sessionId || null,
              user.fullName,
            ]
          );
        }
      });

      outbox.enqueue('courses.attendance_updated', {
        courseId,
        courseScope,
        bulkCount: records.length,
      });

      res.json({ success: true, count: records.length });
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
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };
      const courseScope = await assertCanManageCourseId(authCtx, req.params.courseId);

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
        courseScope,
        waitlistId: req.params.waitlistId,
        status: req.body.status,
      });

      res.json({ success: true, id: req.params.waitlistId, status: req.body.status });
    } catch (err) {
      next(err);
    }
  });

  // Issue or Attach Uploaded Certificate File (stored per course in dedicated disk folder)
  router.post('/:courseId/certificates', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      const authCtx = { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName, sectionPermissions: (currentUser as any).sectionPermissions };
      const courseId = req.params.courseId;
      const cBuf = toIdBuffer(courseId);
      const p = getPool();

      const cRows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId], 3000);
      if (!cRows || cRows.length === 0) throw AppError.notFound('دوره آموزشی');
      const course = cRows[0];
      const courseScope = normalizeCourseScope(course.course_scope);

      const isAdmin = canManageCourseScope(authCtx, courseScope);
      if (isWorkshopOnlyManager(authCtx) && courseScope !== 'counseling_workshop') {
        throw AppError.forbidden('دسترسی مسئول مشاوره صرفاً به کارگاه‌های آموزشی مجاز است.');
      }
      const targetUserId = isAdmin && req.body.userId ? req.body.userId : currentUser.id;
      const targetUserName = req.body.userName || currentUser.fullName;
      const targetNationalId = req.body.userNationalId || (currentUser as any).nationalId || '';
      const certFileUrl = req.body.certificateFileUrl || null;
      const certFileName = req.body.certificateFileName || null;
      const gradeText = req.body.gradeText || null;

      if (certFileUrl && !String(certFileUrl).startsWith('/api/storage/private/course_certificates/')) {
        throw AppError.badRequest('مسیر فایل گواهی نامعتبر است و باید در پوشه اختصاصی گواهی دوره ذخیره شود.', 'INVALID_CERT_FILE_URL');
      }

      const uBuf = toIdBuffer(targetUserId);
      const existingCert = await selectWithTimeout<any>(
        `SELECT * FROM course_certificates WHERE (course_id = ? OR course_id = ?) AND (user_id = ? OR user_id = ?) LIMIT 1`,
        [cBuf, courseId, uBuf, targetUserId],
        3000
      );

      if (existingCert && existingCert.length > 0) {
        const c = existingCert[0];
        if (certFileUrl || gradeText || c.deleted_at) {
          await p.query(
            `UPDATE course_certificates
             SET certificate_file_url = COALESCE(?, certificate_file_url),
                 certificate_file_name = COALESCE(?, certificate_file_name),
                 grade_text = COALESCE(?, grade_text),
                 uploaded_by_name = ?,
                 deleted_at = NULL,
                 version = version + 1
             WHERE id = ?`,
            [certFileUrl, certFileName, gradeText, currentUser.fullName, c.id]
          );
        }
        const refreshed = await selectWithTimeout<any>(`SELECT * FROM course_certificates WHERE id = ? LIMIT 1`, [c.id], 3000);
        const r = refreshed[0];
        const rawCertObj = {
          id: fromIdBuffer(r.id),
          certificateNumber: r.certificate_number,
          courseId: fromIdBuffer(r.course_id),
          courseTitle: r.course_title,
          instructor: r.instructor,
          hours: Number(r.hours || course.hours || course.duration_hours || 16),
          userId: fromIdBuffer(r.user_id),
          userName: r.user_name,
          userNationalId: r.user_national_id || '',
          certificateFileUrl: r.certificate_file_url || undefined,
          certificateFileName: r.certificate_file_name || undefined,
          uploadedByName: r.uploaded_by_name || undefined,
          gradeText: r.grade_text || undefined,
          issuedAt: r.issued_at ? new Date(r.issued_at).toISOString() : new Date().toISOString(),
          version: Number(r.version || 1),
        };
        const certObj = redactNationalIdForUser(authCtx, rawCertObj);
        outbox.enqueue('courses.certificate_issued', { courseId, courseScope, certificate: certObj });
        return res.json(certObj);
      }

      const id = generateUUIDv7();
      const certNum = `CERT-FQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const hours = Number(course.hours || course.duration_hours || 16);

      await p.query(
        `INSERT INTO course_certificates (
          id, certificate_number, course_id, course_title, instructor, hours,
          user_id, user_name, user_national_id, certificate_file_url, certificate_file_name,
          uploaded_by_name, grade_text, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          toIdBuffer(id),
          certNum,
          cBuf,
          course.title,
          course.instructor,
          hours,
          uBuf,
          targetUserName,
          targetNationalId,
          certFileUrl,
          certFileName,
          certFileUrl ? currentUser.fullName : null,
          gradeText,
        ]
      );

      const rawCertObj = {
        id,
        certificateNumber: certNum,
        courseId,
        courseTitle: course.title,
        instructor: course.instructor,
        hours,
        userId: targetUserId,
        userName: targetUserName,
        userNationalId: targetNationalId,
        certificateFileUrl: certFileUrl || undefined,
        certificateFileName: certFileName || undefined,
        uploadedByName: certFileUrl ? currentUser.fullName : undefined,
        gradeText: gradeText || undefined,
        issuedAt: new Date().toISOString(),
        version: 1,
      };
      const certObj = redactNationalIdForUser(authCtx, rawCertObj);

      outbox.enqueue('courses.certificate_issued', {
        courseId,
        courseScope,
        certificate: certObj,
      });

      res.status(201).json(certObj);
    } catch (err) {
      next(err);
    }
  });

  // Soft-delete uploaded certificate (Admin Only)
  router.delete('/:courseId/certificates/:certId', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      const user = getCurrentUser(req);
      const authCtx = { userId: user.id, role: user.role, fullName: user.fullName, sectionPermissions: (user as any).sectionPermissions };
      const courseScope = await assertCanManageCourseId(authCtx, req.params.courseId);

      const certBuf = toIdBuffer(req.params.certId);
      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE course_certificates SET deleted_at = CURRENT_TIMESTAMP(3), version = version + 1 WHERE id = ? OR id = ?`,
        [certBuf, req.params.certId]
      );
      if (!upd || upd.affectedRows === 0) throw AppError.notFound('گواهی دوره');

      outbox.enqueue('courses.certificate_issued', { courseId: req.params.courseId, courseScope, removedCertId: req.params.certId });
      res.json({ success: true, id: req.params.certId });
    } catch (err) {
      next(err);
    }
  });
}

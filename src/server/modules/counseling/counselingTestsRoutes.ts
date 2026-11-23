import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy, isOrganizationalUserRole } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';
import { PsychologicalTest, PsychologicalTestAssignment, PsychologicalTestResult } from '../../../types';

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

function validateSafeExternalUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    throw AppError.badRequest('آدرس لینک تست روان‌شناختی الزامی است.');
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw AppError.badRequest('فرمت لینک تست معتبر نیست. لینک باید با https:// یا http:// شروع شود.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw AppError.badRequest('فقط لینک‌های با پروتکل امن http:// یا https:// مجاز هستند.');
  }
  return parsed.toString();
}

async function getUserPhoneMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await selectWithTimeout<any>(`SELECT id, phone FROM users`, [], 2500);
    for (const r of rows || []) {
      const uid = fromIdBuffer(r.id);
      if (uid && r.phone) map.set(uid, String(r.phone));
    }
  } catch {}
  return map;
}

function mapTestRow(row: any): PsychologicalTest {
  return {
    id: fromIdBuffer(row.id),
    title: row.title,
    category: row.category || 'شخصیت‌شناسی',
    description: row.description || '',
    estimatedMinutes: Number(row.estimated_minutes || 15),
    instructions: row.instructions || '',
    questions: parseJsonSafe(row.questions, []),
    isActive: Boolean(row.is_active),
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

function mapAssignmentRow(row: any, redactNationalId = false): PsychologicalTestAssignment {
  return {
    id: fromIdBuffer(row.id),
    testId: row.test_id ? fromIdBuffer(row.test_id) : undefined,
    testTitle: row.external_test_title || row.test_title || (row.external_test_url ? 'تست اختصاصی روان‌شناختی' : undefined),
    testCategory: row.test_category || (row.external_test_url ? 'آزمون بیرونی' : undefined),
    testDescription: row.test_description || undefined,
    estimatedMinutes: row.estimated_minutes !== undefined && row.estimated_minutes !== null ? Number(row.estimated_minutes) : undefined,
    instructions: row.test_instructions || undefined,
    questions: row.test_questions ? parseJsonSafe(row.test_questions, []) : undefined,
    externalTestUrl: row.external_test_url || undefined,
    externalTestTitle: row.external_test_title || undefined,
    isVisibleToUser: row.is_visible_to_user !== undefined && row.is_visible_to_user !== null ? Boolean(row.is_visible_to_user) : true,
    userId: String(row.user_id),
    userName: row.user_name,
    userPhone: row.user_phone || row.account_phone || undefined,
    userNationalId: redactNationalId ? undefined : (row.user_national_id || undefined),
    assignedById: row.assigned_by_id || undefined,
    assignedByName: row.assigned_by_name,
    requestId: row.request_id || undefined,
    status: row.status || 'unlocked',
    adminNote: row.admin_note || undefined,
    resultId: row.result_id ? fromIdBuffer(row.result_id) : undefined,
    scoreSummary: row.score_summary || undefined,
    version: Number(row.version || 1),
    assignedAt: row.assigned_at ? new Date(row.assigned_at).toISOString() : new Date().toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
  };
}

function mapResultRow(row: any, redactNationalId = false): PsychologicalTestResult {
  return {
    id: fromIdBuffer(row.id),
    assignmentId: fromIdBuffer(row.assignment_id),
    testId: fromIdBuffer(row.test_id),
    testTitle: row.test_title || undefined,
    userId: String(row.user_id),
    userName: row.user_name,
    userNationalId: redactNationalId ? undefined : (row.user_national_id || undefined),
    answers: parseJsonSafe(row.answers, []),
    rawScore: row.raw_score !== null && row.raw_score !== undefined ? Number(row.raw_score) : undefined,
    scoreSummary: row.score_summary || '',
    psychologistNotes: row.psychologist_notes || undefined,
    reviewedByName: row.reviewed_by_name || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    version: Number(row.version || 1),
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : new Date().toISOString(),
  };
}

export function registerCounselingTestsRoutes(router: Router): void {
  // List Test Catalog
  router.get('/tests', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const isStaff = isOrganizationalUserRole(user.role);

      const sql = isStaff
        ? `SELECT * FROM psychological_tests WHERE deleted_at IS NULL ORDER BY created_at DESC`
        : `SELECT * FROM psychological_tests WHERE deleted_at IS NULL AND is_active = 1 ORDER BY created_at DESC`;

      const rows = await selectWithTimeout<any>(sql, [], 3000);
      res.json((rows || []).map(mapTestRow));
    } catch (err) {
      next(err);
    }
  });

  // Create Psychological Test (Admin / Psychologist)
  router.post('/tests', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ایجاد آزمون نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'cultural_educational_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const b = req.body || {};
      if (!b.title || !String(b.title).trim()) {
        throw AppError.badRequest('عنوان تست روان‌شناختی الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();

      await p.query(
        `INSERT INTO psychological_tests (id, title, category, description, estimated_minutes, instructions, questions, is_active, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          idBuf,
          String(b.title).trim(),
          b.category ? String(b.category).trim() : 'شخصیت‌شناسی',
          String(b.description || '').trim(),
          Number(b.estimatedMinutes || 15),
          b.instructions ? String(b.instructions).trim() : null,
          JSON.stringify(Array.isArray(b.questions) ? b.questions : []),
          b.isActive !== false ? 1 : 0,
        ]
      );

      const rows = await selectWithTimeout<any>(`SELECT * FROM psychological_tests WHERE id = ? LIMIT 1`, [idBuf], 3000);
      const created = mapTestRow(rows[0]);

      outbox.enqueue('counseling.test_created', {
        id,
        resourceId: id,
        version: 1,
        updates: created,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // Update Psychological Test (Strict OCC)
  router.put('/tests/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ویرایش آزمون نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'cultural_educational_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const expectedVersion = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM psychological_tests WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('آزمون روان‌شناختی');
      }
      const ex = existingRows[0];
      const b = req.body || {};

      const [upd]: any = await p.query(
        `UPDATE psychological_tests
         SET title = ?, category = ?, description = ?, estimated_minutes = ?, instructions = ?, questions = ?, is_active = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
        [
          b.title !== undefined ? String(b.title).trim() : ex.title,
          b.category !== undefined ? String(b.category).trim() : ex.category,
          b.description !== undefined ? String(b.description).trim() : ex.description,
          b.estimatedMinutes !== undefined ? Number(b.estimatedMinutes) : ex.estimated_minutes,
          b.instructions !== undefined ? (b.instructions ? String(b.instructions).trim() : null) : ex.instructions,
          b.questions !== undefined ? JSON.stringify(Array.isArray(b.questions) ? b.questions : []) : (typeof ex.questions === 'string' ? ex.questions : JSON.stringify(ex.questions || [])),
          b.isActive !== undefined ? (b.isActive ? 1 : 0) : ex.is_active,
          idBuf,
          req.params.id,
          expectedVersion,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این آزمون هم‌زمان ویرایش شده است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const refreshed = await selectWithTimeout<any>(
        `SELECT * FROM psychological_tests WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      const updated = mapTestRow(refreshed[0]);

      outbox.enqueue('counseling.test_updated', {
        id: updated.id,
        resourceId: updated.id,
        version: updated.version,
        updates: updated,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Soft Delete Psychological Test
  router.delete('/tests/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به حذف آزمون نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'cultural_educational_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE psychological_tests SET deleted_at = NOW(3), is_active = 0, version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
        [idBuf, req.params.id]
      );
      if (upd && upd.affectedRows === 0) {
        throw AppError.notFound('آزمون روان‌شناختی');
      }

      outbox.enqueue('counseling.test_deleted', {
        id: req.params.id,
        resourceId: req.params.id,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // List Test Assignments (Personalized external test links & unlocked tests per alumnus)
  router.get('/test-assignments', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      const isStaff = isOrganizationalUserRole(user.role);
      const redactNationalId = user.role === 'psychologist_counselor';

      let sql = `
        SELECT a.*,
               t.title AS test_title, t.category AS test_category, t.description AS test_description,
               t.estimated_minutes AS estimated_minutes, t.instructions AS test_instructions, t.questions AS test_questions,
               r.id AS result_id, r.score_summary AS score_summary
        FROM psychological_test_assignments a
        LEFT JOIN psychological_tests t ON t.id = a.test_id
        LEFT JOIN psychological_test_results r ON r.assignment_id = a.id AND r.deleted_at IS NULL
        WHERE a.deleted_at IS NULL
      `;
      const params: any[] = [];

      if (!isStaff) {
        sql += ` AND a.user_id = ? AND a.is_visible_to_user = 1`;
        params.push(user.id);
      } else if (req.query.userId) {
        sql += ` AND a.user_id = ?`;
        params.push(String(req.query.userId));
      }

      sql += ` ORDER BY a.assigned_at DESC LIMIT 300`;
      const [rows, phoneMap] = await Promise.all([
        selectWithTimeout<any>(sql, params, 4000),
        isStaff ? getUserPhoneMap() : Promise.resolve(new Map<string, string>()),
      ]);
      res.json(
        (rows || []).map((r: any) =>
          mapAssignmentRow(
            { ...r, account_phone: phoneMap.get(String(r.user_id)) },
            redactNationalId
          )
        )
      );
    } catch (err) {
      next(err);
    }
  });

  // Unlock / Assign Test or Personalized External Test Link to Specific Alumnus
  router.post('/test-assignments', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به تخصیص یا ارسال لینک تست نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'cultural_educational_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const {
        testId,
        externalTestUrl,
        externalTestTitle,
        isVisibleToUser,
        userId,
        userName,
        userNationalId,
        requestId,
        adminNote,
      } = req.body || {};

      if (!userId || !userName) {
        throw AppError.badRequest('انتخاب دانش‌آموخته / مراجع الزامی است.');
      }

      let testIdBuf: Buffer | null = null;
      let cleanExternalUrl: string | null = null;
      let cleanExternalTitle: string | null = externalTestTitle ? String(externalTestTitle).trim() : null;

      if (externalTestUrl && String(externalTestUrl).trim()) {
        cleanExternalUrl = validateSafeExternalUrl(String(externalTestUrl));
        if (!cleanExternalTitle) {
          cleanExternalTitle = 'تست روان‌شناختی اختصاصی';
        }
      } else if (testId) {
        const testBuf = toIdBuffer(String(testId));
        const testRows = await selectWithTimeout<any>(
          `SELECT * FROM psychological_tests WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
          [testBuf, testId],
          3000
        );
        if (!testRows || testRows.length === 0) {
          throw AppError.notFound('آزمون انتخاب‌شده');
        }
        testIdBuf = testRows[0].id;
      } else {
        throw AppError.badRequest('وارد کردن لینک اختصاصی تست یا انتخاب آزمون الزامی است.');
      }

      const id = generateUUIDv7();
      const idBuf = toIdBuffer(id);
      const p = getPool();
      const visibleFlag = isVisibleToUser === false ? 0 : 1;
      const redactNationalId = u.role === 'psychologist_counselor';

      await p.query(
        `INSERT INTO psychological_test_assignments (
          id, test_id, external_test_url, external_test_title, is_visible_to_user,
          user_id, user_name, user_national_id, assigned_by_id, assigned_by_name, request_id, status, admin_note, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unlocked', ?, 1)`,
        [
          idBuf,
          testIdBuf,
          cleanExternalUrl,
          cleanExternalTitle,
          visibleFlag,
          String(userId),
          String(userName).trim(),
          redactNationalId ? null : (userNationalId ? String(userNationalId).trim() : null),
          u.id,
          u.fullName,
          requestId ? String(requestId) : null,
          adminNote ? String(adminNote).trim() : null,
        ]
      );

      const [rows, phoneMap] = await Promise.all([
        selectWithTimeout<any>(
          `SELECT a.*,
                  t.title AS test_title, t.category AS test_category, t.description AS test_description,
                  t.estimated_minutes AS estimated_minutes, t.instructions AS test_instructions, t.questions AS test_questions
           FROM psychological_test_assignments a
           LEFT JOIN psychological_tests t ON t.id = a.test_id
           WHERE a.id = ? LIMIT 1`,
          [idBuf],
          3000
        ),
        getUserPhoneMap(),
      ]);
      const created = mapAssignmentRow(
        { ...rows[0], account_phone: phoneMap.get(String(rows[0]?.user_id)) },
        redactNationalId
      );

      outbox.enqueue('counseling.test_assigned', {
        id,
        resourceId: id,
        userId: String(userId),
        applicantId: String(userId),
        version: 1,
        updates: created,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  // Toggle "Show to Alumnus" (نمایش به دانش‌آموخته) / Update External Link
  router.patch('/test-assignments/:id/visibility', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به تغییر وضعیت نمایش لینک نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'cultural_educational_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      const isVisible = Boolean(req.body?.isVisibleToUser);
      const cleanUrl = req.body?.externalTestUrl !== undefined
        ? (req.body.externalTestUrl ? validateSafeExternalUrl(String(req.body.externalTestUrl)) : null)
        : undefined;
      const cleanTitle = req.body?.externalTestTitle !== undefined
        ? String(req.body.externalTestTitle || '').trim()
        : undefined;

      const [upd]: any = await p.query(
        `UPDATE psychological_test_assignments
         SET is_visible_to_user = ?,
             external_test_url = COALESCE(?, external_test_url),
             external_test_title = COALESCE(?, external_test_title),
             version = version + 1
         WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
        [
          isVisible ? 1 : 0,
          cleanUrl !== undefined ? cleanUrl : null,
          cleanTitle !== undefined ? cleanTitle : null,
          idBuf,
          req.params.id,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.notFound('تخصیص لینک تست');
      }

      const redactNationalId = u.role === 'psychologist_counselor';
      const [rows, phoneMap] = await Promise.all([
        selectWithTimeout<any>(
          `SELECT a.*,
                  t.title AS test_title, t.category AS test_category, t.description AS test_description,
                  t.estimated_minutes AS estimated_minutes, t.instructions AS test_instructions, t.questions AS test_questions
           FROM psychological_test_assignments a
           LEFT JOIN psychological_tests t ON t.id = a.test_id
           WHERE (a.id = ? OR a.id = ?) LIMIT 1`,
          [idBuf, req.params.id],
          3000
        ),
        getUserPhoneMap(),
      ]);
      const updated = mapAssignmentRow(
        { ...rows[0], account_phone: phoneMap.get(String(rows[0]?.user_id)) },
        redactNationalId
      );

      outbox.enqueue('counseling.test_assigned', {
        id: updated.id,
        resourceId: updated.id,
        userId: updated.userId,
        applicantId: updated.userId,
        version: updated.version,
        updates: updated,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  // Soft Delete Test Assignment / External Link
  router.delete('/test-assignments/:id', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به حذف لینک تست نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'cultural_educational_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE psychological_test_assignments SET deleted_at = NOW(3), version = version + 1 WHERE (id = ? OR id = ?) AND deleted_at IS NULL`,
        [idBuf, req.params.id]
      );
      if (upd && upd.affectedRows === 0) {
        throw AppError.notFound('تخصیص لینک تست');
      }

      outbox.enqueue('counseling.test_assignment_deleted', {
        id: req.params.id,
        resourceId: req.params.id,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  // Submit Test Answers (Assigned Alumnus)
  router.post('/test-assignments/:id/submit', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      const assignmentBuf = toIdBuffer(req.params.id);

      const existingRows = await selectWithTimeout<any>(
        `SELECT a.*, t.title AS test_title
         FROM psychological_test_assignments a
         LEFT JOIN psychological_tests t ON t.id = a.test_id
         WHERE (a.id = ? OR a.id = ?) AND a.deleted_at IS NULL LIMIT 1`,
        [assignmentBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) {
        throw AppError.notFound('تخصیص آزمون');
      }
      const assignRow = existingRows[0];

      if (String(assignRow.user_id) !== String(u.id) && !isOrganizationalUserRole(u.role)) {
        throw AppError.forbidden('این آزمون برای حساب کاربری شما فعال نشده است.');
      }

      if (assignRow.status === 'completed' || assignRow.status === 'reviewed') {
        throw AppError.badRequest('پاسخ‌نامه این آزمون قبلاً ثبت نهایی شده است.');
      }

      const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
      if (answers.length === 0) {
        throw AppError.badRequest('لطفاً حداقل به یکی از سوالات آزمون پاسخ دهید.');
      }

      const numericVals = answers
        .map((a: any) => Number(a?.answer))
        .filter((n: number) => !isNaN(n) && isFinite(n));
      const rawScore = numericVals.length > 0 ? numericVals.reduce((acc: number, v: number) => acc + v, 0) : null;
      const scoreSummary =
        req.body?.scoreSummary ||
        (rawScore !== null
          ? `تکمیل شده با امتیاز عددی ${rawScore} (${answers.length} پاسخ ثبت‌شده)`
          : `تکمیل شده با ${answers.length} پاسخ تشریحی/گزینه‌ای`);

      const resultId = generateUUIDv7();
      const resultBuf = toIdBuffer(resultId);

      await withTx(async (conn) => {
        await conn.query(
          `INSERT INTO psychological_test_results (id, assignment_id, test_id, user_id, user_name, answers, raw_score, score_summary, version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            resultBuf,
            assignRow.id,
            assignRow.test_id,
            assignRow.user_id,
            assignRow.user_name,
            JSON.stringify(answers),
            rawScore,
            scoreSummary,
          ]
        );

        await conn.query(
          `UPDATE psychological_test_assignments
           SET status = 'completed', completed_at = NOW(3), version = version + 1
           WHERE id = ? AND deleted_at IS NULL`,
          [assignRow.id]
        );
      });

      const [resRows]: any = await selectWithTimeout<any>(
        `SELECT r.*, t.title AS test_title
         FROM psychological_test_results r
         LEFT JOIN psychological_tests t ON t.id = r.test_id
         WHERE r.id = ? LIMIT 1`,
        [resultBuf],
        3000
      );
      const createdResult = mapResultRow(resRows, u.role === 'psychologist_counselor');

      outbox.enqueue('counseling.test_submitted', {
        id: resultId,
        resourceId: resultId,
        assignmentId: fromIdBuffer(assignRow.id),
        userId: String(assignRow.user_id),
        applicantId: String(assignRow.user_id),
        version: 1,
        updates: createdResult,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.status(201).json(createdResult);
    } catch (err) {
      next(err);
    }
  });

  // List Test Results (Psychologist sees all / filtered; Alumnus sees own)
  router.get('/test-results', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      const isStaff = isOrganizationalUserRole(u.role);

      let sql = `
        SELECT r.*, t.title AS test_title
        FROM psychological_test_results r
        LEFT JOIN psychological_tests t ON t.id = r.test_id
        WHERE r.deleted_at IS NULL
      `;
      const params: any[] = [];

      if (!isStaff) {
        sql += ` AND r.user_id = ?`;
        params.push(u.id);
      } else {
        if (req.query.userId) {
          sql += ` AND r.user_id = ?`;
          params.push(String(req.query.userId));
        }
        if (req.query.testId) {
          sql += ` AND (r.test_id = ? OR r.test_id = ?)`;
          params.push(toIdBuffer(String(req.query.testId)), String(req.query.testId));
        }
      }

      sql += ` ORDER BY r.submitted_at DESC LIMIT 300`;
      const redactNationalId = u.role === 'psychologist_counselor';
      const rows = await selectWithTimeout<any>(sql, params, 4000);
      res.json((rows || []).map((r: any) => mapResultRow(r, redactNationalId)));
    } catch (err) {
      next(err);
    }
  });

  // Psychologist Review & Clinical Notes on Test Result (Strict OCC)
  router.patch('/test-results/:id/review', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const u = getCurrentUser(req);
      if (u.role === 'general_observer') {
        throw AppError.forbidden('نقش ناظر کل مجاز به ثبت نظر بالینی نیست.');
      }
      AuthorizationPolicy.requireRole(
        { userId: u.id, role: u.role, fullName: u.fullName },
        ['admin', 'super_admin', 'supervisor', 'cultural_educational_officer', 'alumni_manager', 'psychologist_counselor']
      );

      const expectedVersion = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const p = getPool();

      const { psychologistNotes, scoreSummary } = req.body || {};
      const [upd]: any = await p.query(
        `UPDATE psychological_test_results
         SET psychologist_notes = COALESCE(?, psychologist_notes),
             score_summary = COALESCE(?, score_summary),
             reviewed_by_name = ?,
             reviewed_at = NOW(3),
             version = version + 1
         WHERE (id = ? OR id = ?) AND deleted_at IS NULL AND version = ?`,
        [
          psychologistNotes !== undefined ? String(psychologistNotes).trim() : null,
          scoreSummary !== undefined ? String(scoreSummary).trim() : null,
          u.fullName,
          idBuf,
          req.params.id,
          expectedVersion,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('نتیجه این آزمون هم‌زمان توسط روان‌شناس دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const rows = await selectWithTimeout<any>(
        `SELECT r.*, t.title AS test_title
         FROM psychological_test_results r
         LEFT JOIN psychological_tests t ON t.id = r.test_id
         WHERE (r.id = ? OR r.id = ?) AND r.deleted_at IS NULL LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      const updated = mapResultRow(rows[0], u.role === 'psychologist_counselor');

      await p.query(
        `UPDATE psychological_test_assignments SET status = 'reviewed', version = version + 1 WHERE id = ? AND deleted_at IS NULL`,
        [toIdBuffer(updated.assignmentId)]
      );

      outbox.enqueue('counseling.test_reviewed', {
        id: updated.id,
        resourceId: updated.id,
        userId: updated.userId,
        applicantId: updated.userId,
        version: updated.version,
        updates: updated,
        actorId: u.id,
        actorName: u.fullName,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  });
}

import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, withTx, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthContext, AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Course, CourseEnrollment, CourseCustomField, CourseInstallmentPlan, CourseInstallmentRecord, CourseInstructorItem, CourseSessionItem } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { deleteCourseImageIfUnreferenced, promoteDraftCourseFilesFolder } from '../../platform/storageCleanup';
import { registerCourseOperationsRoutes } from './courseOperationsRoutes';
import { registerCourseDiscountsRoutes, validateDiscountForCourse } from './courseDiscountsRoutes';
import { registerCourseInstallmentsRoutes, mapInstallmentRow } from './courseInstallmentsRoutes';
import {
  normalizeCourseScope,
  canReadAdminCourseScope,
  isWorkshopOnlyManager,
  assertCanManageCourseScope,
  assertCanManageCourseId,
  redactNationalIdForUser,
} from './courseScopeAuth';

function parseJsonField<T>(val: any, fallback: T): T {
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

function normalizeCourseInstructors(
  inputInstructors: CourseInstructorItem[] | undefined,
  fallbackName?: string,
  fallbackTitle?: string,
  fallbackAvatarUrl?: string,
  fallbackResume?: string
): CourseInstructorItem[] {
  let list = Array.isArray(inputInstructors)
    ? inputInstructors
        .filter(item => item && String(item.fullName || '').trim())
        .map((item, idx) => ({
          id: item.id || `inst_${Date.now()}_${idx}`,
          fullName: String(item.fullName).trim(),
          title: item.title ? String(item.title).trim() : undefined,
          roleLabel: item.roleLabel ? String(item.roleLabel).trim() : undefined,
          avatarUrl: item.avatarUrl ? String(item.avatarUrl).trim() : undefined,
          resume: item.resume ? String(item.resume).trim() : undefined,
          isPrimary: Boolean(item.isPrimary),
        }))
    : [];

  if (list.length === 0 && fallbackName && fallbackName.trim()) {
    list = [
      {
        id: 'inst_primary',
        fullName: fallbackName.trim(),
        title: fallbackTitle || undefined,
        roleLabel: 'مدرس اصلی دوره',
        avatarUrl: fallbackAvatarUrl || undefined,
        resume: fallbackResume || undefined,
        isPrimary: true,
      },
    ];
  }

  if (list.length > 0 && !list.some(i => i.isPrimary)) {
    list[0] = { ...list[0], isPrimary: true };
  }

  return list;
}

function normalizeCourseSessions(
  inputSessions: CourseSessionItem[] | undefined,
  instructors: CourseInstructorItem[]
): CourseSessionItem[] {
  if (!Array.isArray(inputSessions)) return [];
  const instMap = new Map(instructors.map(i => [i.id, i]));
  const validModes = new Set(['course_instructor', 'custom_presenter', 'unspecified', 'panel']);

  return inputSessions
    .filter(s => s && String(s.title || '').trim())
    .map((s, idx) => {
      const mode = validModes.has(s.presenterMode) ? s.presenterMode : 'course_instructor';
      const linkedInst = s.presenterInstructorId ? instMap.get(s.presenterInstructorId) : undefined;
      let presenterName = s.presenterName ? String(s.presenterName).trim() : undefined;
      let presenterTitle = s.presenterTitle ? String(s.presenterTitle).trim() : undefined;
      if (mode === 'course_instructor' && linkedInst) {
        presenterName = linkedInst.fullName;
        presenterTitle = linkedInst.title;
      } else if (mode === 'unspecified') {
        presenterName = undefined;
        presenterTitle = undefined;
      }

      return {
        id: s.id || `sess_${idx + 1}`,
        sessionNumber: Number(s.sessionNumber) > 0 ? Number(s.sessionNumber) : idx + 1,
        title: String(s.title).trim(),
        presenterMode: mode,
        presenterInstructorId: mode === 'course_instructor' ? s.presenterInstructorId : undefined,
        presenterName,
        presenterTitle,
        sessionDate: s.sessionDate ? String(s.sessionDate).trim() : undefined,
        startTime: s.startTime ? String(s.startTime).trim() : undefined,
        durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : undefined,
        holdingType: s.holdingType || undefined,
        meetingLink: s.meetingLink ? String(s.meetingLink).trim() : undefined,
        description: s.description ? String(s.description).trim() : undefined,
      };
    });
}

async function syncCourseNormalizedRelations(
  conn: any,
  courseId: string,
  instructors: CourseInstructorItem[],
  sessions: CourseSessionItem[],
  offlineFiles: any[],
  actorName: string
): Promise<void> {
  const cBuf = toIdBuffer(courseId);

  // 1. Sync normalized course_instructors table
  await conn.query(`DELETE FROM course_instructors WHERE course_id = ?`, [cBuf]);
  for (let i = 0; i < instructors.length; i++) {
    const inst = instructors[i];
    await conn.query(
      `INSERT INTO course_instructors (
        id, course_id, instructor_key, sort_order, full_name, title, role_label, avatar_url, resume, is_primary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toIdBuffer(generateUUIDv7()),
        cBuf,
        inst.id || `inst_${i + 1}`,
        i,
        inst.fullName,
        inst.title || null,
        inst.roleLabel || null,
        inst.avatarUrl || null,
        inst.resume || null,
        inst.isPrimary ? 1 : 0,
      ]
    );
  }

  // 2. Sync normalized course_sessions table
  await conn.query(`DELETE FROM course_sessions WHERE course_id = ?`, [cBuf]);
  for (let i = 0; i < sessions.length; i++) {
    const sess = sessions[i];
    await conn.query(
      `INSERT INTO course_sessions (
        id, course_id, session_key, session_number, title, presenter_mode, presenter_instructor_key,
        presenter_name, presenter_title, session_date, start_time, duration_minutes, holding_type, meeting_link, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toIdBuffer(generateUUIDv7()),
        cBuf,
        sess.id || `sess_${i + 1}`,
        sess.sessionNumber || i + 1,
        sess.title,
        sess.presenterMode || 'course_instructor',
        sess.presenterInstructorId || null,
        sess.presenterName || null,
        sess.presenterTitle || null,
        sess.sessionDate || null,
        sess.startTime || null,
        sess.durationMinutes || null,
        sess.holdingType || null,
        sess.meetingLink || null,
        sess.description || null,
      ]
    );
  }

  // 3. Sync normalized course_files table (preserving soft-deleted audit history)
  await conn.query(`DELETE FROM course_files WHERE course_id = ? AND deleted_at IS NULL`, [cBuf]);
  for (let i = 0; i < (offlineFiles || []).length; i++) {
    const f = offlineFiles[i];
    const url = String(f.url || f.downloadUrl || '').trim();
    if (!url) continue;
    const sourceType =
      f.sourceType === 'disk' || f.sourceType === 'external' || f.sourceType === 'upload'
        ? f.sourceType
        : url.startsWith('/api/storage/private/course_files/')
        ? 'upload'
        : 'external';
    await conn.query(
      `INSERT INTO course_files (
        id, course_id, file_key, session_number, title, url, filename, file_size, size_label, format, source_type, description, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        toIdBuffer(generateUUIDv7()),
        cBuf,
        String(f.id || `file_${i + 1}`),
        f.sessionNumber ? Number(f.sessionNumber) : null,
        String(f.title || f.filename || 'فایل آموزشی'),
        url,
        f.filename || null,
        f.fileSizeBytes ? Number(f.fileSizeBytes) : null,
        f.size || null,
        f.format || f.fileType || null,
        sourceType,
        f.description || null,
        actorName,
      ]
    );
  }
}

function mapCourseRow(row: any): Course & { version: number } {
  const topics = parseJsonField<string[]>(row.topics, []);
  const archiveResources = parseJsonField<any[]>(row.archive_resources, []);
  const targetAudiences = parseJsonField<string[]>(row.target_audiences, []);
  const customTags = parseJsonField<string[]>(row.custom_tags, []);
  const customFields = parseJsonField<CourseCustomField[]>(row.custom_fields, []);
  const hiddenFields = parseJsonField<string[]>(row.hidden_fields, []);
  const installmentPlan = parseJsonField<CourseInstallmentPlan | undefined>(row.installment_plan, undefined);
  const offlineDownloadFiles = parseJsonField<any[]>(row.offline_download_files, []);
  const rawInstructors = parseJsonField<CourseInstructorItem[]>(row.instructors, []);
  const instructors = normalizeCourseInstructors(
    rawInstructors,
    row.instructor,
    row.instructor_title,
    row.instructor_avatar_url,
    row.instructor_resume
  );
  const sessions = parseJsonField<CourseSessionItem[]>(row.sessions, []);

  const capacity = Number(row.capacity || 0);
  const enrolledCount = Number(row.enrolled_count || 0);
  const remainingCapacity = Math.max(0, capacity - enrolledCount);
  const primaryInst = instructors.find(i => i.isPrimary) || instructors[0];

  return {
    id: fromIdBuffer(row.id),
    courseScope: normalizeCourseScope(row.course_scope),
    title: row.title,
    instructor: primaryInst?.fullName || row.instructor,
    instructorTitle: primaryInst?.title || row.instructor_title || undefined,
    instructorResume: primaryInst?.resume || row.instructor_resume || undefined,
    instructorAvatarUrl: primaryInst?.avatarUrl || row.instructor_avatar_url || undefined,
    instructors,
    sessions,
    category: row.category || 'فقه القضاء',
    level: row.level || 'پیشرفته',
    hours: Number(row.hours ?? row.duration_hours ?? 0),
    capacity,
    enrolledCount,
    remainingCapacity,
    schedule: row.schedule || 'پنج‌شنبه‌ها',
    holdingTime: row.holding_time || undefined,
    price: Number(row.price || 0),
    startDate: row.start_date || '',
    endDate: row.end_date || undefined,
    holdingFormat: row.holding_format || 'online',
    venueAddress: row.venue_address || undefined,
    meetingLink: row.meeting_link || '',
    meetingAccessGuide: row.meeting_access_guide || undefined,
    hasInstallments: row.has_installments !== undefined ? Boolean(row.has_installments) : Boolean(installmentPlan?.enabled),
    installmentDetails: row.installment_details || undefined,
    installmentPlan,
    hasCertificate: row.has_certificate !== undefined ? Boolean(row.has_certificate) : true,
    certificateDetails: row.certificate_details || undefined,
    prerequisites: row.prerequisites || undefined,
    necessity: row.necessity || undefined,
    targetAudiences,
    managerNotes: row.manager_notes || undefined,
    customTags,
    customFields,
    hiddenFields,
    description: row.description || row.title,
    status: row.status,
    topics: topics.length > 0 ? topics : ['مباحث نظری و فقهی', 'تحلیل رویه قضایی'],
    coverImage: row.cover_image || row.cover_image_url || undefined,
    allowedPaymentMethod: row.allowed_payment_method || 'both',
    archiveAccess: row.archive_access || 'enrolled_only',
    archiveResources,
    postEnrollmentBanner: row.post_enrollment_banner || undefined,
    postEnrollmentMessage: row.post_enrollment_message || undefined,
    welcomeBoxFontSize: (row.welcome_box_font_size || 'base') as any,
    welcomeBoxBgColor: (row.welcome_box_bg_color || 'emerald') as any,
    reminderDate: row.reminder_date || undefined,
    reminderSchedule: row.reminder_schedule || undefined,
    offlineDownloadUrl: row.offline_download_url || undefined,
    offlineDownloadGuide: row.offline_download_guide || undefined,
    offlineDownloadFiles,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : undefined,
    deletedBy: row.deleted_by || undefined,
    sessionsCount: sessions.length > 0 ? sessions.length : Number(row.sessions_count || 4),
    waitlistEnabled: row.waitlist_enabled !== undefined ? Boolean(row.waitlist_enabled) : true,
    visibleToCustomer: row.visible_to_customer !== undefined ? Boolean(row.visible_to_customer) : true,
    version: Number(row.version || 1),
  };
}

function mapEnrollmentRow(row: any): CourseEnrollment & { version: number } {
  return {
    id: fromIdBuffer(row.id),
    courseId: fromIdBuffer(row.course_id),
    courseTitle: row.course_title,
    userId: fromIdBuffer(row.user_id),
    userName: row.user_name,
    userNationalId: row.user_national_id,
    userPhone: row.user_phone,
    userRoleTitle: row.user_role_title,
    enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : new Date().toISOString(),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    classStatus: (row.class_status || 'active') as 'active' | 'removed',
    removedAt: row.removed_at ? new Date(row.removed_at).toISOString() : undefined,
    removedBy: row.removed_by || undefined,
    removalReason: row.removal_reason || undefined,
    paymentPlanType: (row.payment_plan_type || 'full') as 'full' | 'installment',
    discountCode: row.discount_code || undefined,
    discountAmount: Number(row.discount_amount || 0),
    originalAmount: Number(row.original_amount || row.amount_paid || 0),
    finalTotalAmount: Number(row.final_total_amount || row.amount_paid || 0),
    amountPaid: Number(row.amount_paid || 0),
    trackingCode: row.tracking_code,
    receiptBankName: row.receipt_bank_name || undefined,
    receiptDate: row.receipt_date || undefined,
    receiptFileUrl: row.receipt_file_url || undefined,
    adminNote: row.admin_note || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    version: Number(row.version || 1),
  };
}

export class CoursesService {
  async getAll(authCtx?: AuthContext, includeDeleted = false, scopeFilter?: string): Promise<Array<Course & { version: number }>> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const p = getPool();
    const userId = authCtx?.userId;
    const isStaff = authCtx?.role !== 'alumni' && authCtx?.role !== 'customer';

    let sql = `SELECT * FROM courses WHERE 1=1`;
    const params: any[] = [];
    if (scopeFilter === 'specialized' || scopeFilter === 'counseling_workshop') {
      sql += ` AND course_scope = ?`;
      params.push(scopeFilter);
    }
    if (!includeDeleted || !isStaff) {
      sql += ` AND is_deleted = 0`;
    } else if (includeDeleted && authCtx && isWorkshopOnlyManager(authCtx)) {
      // Workshop-only managers can inspect soft-deleted items ONLY inside counseling_workshop scope
      sql += ` AND (is_deleted = 0 OR course_scope = 'counseling_workshop')`;
    }
    if (authCtx?.role === 'customer') {
      sql += ` AND (visible_to_customer = 1 OR visible_to_customer IS NULL)`;
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = await selectWithTimeout<any>(sql, params, 4000);
    const courses = (rows || []).map(mapCourseRow);

    if (courses.length === 0) return [];

    const userEnrollmentsMap: Map<string, CourseEnrollment> = new Map();
    if (userId) {
      const uBuf = toIdBuffer(userId);
      const [eRows] = await p.query<any[]>(
        `SELECT * FROM course_enrollments WHERE user_id = ? OR user_id = ?`,
        [uBuf, userId]
      );
      (eRows || []).map(mapEnrollmentRow).forEach(e => {
        userEnrollmentsMap.set(e.courseId, e);
      });
    }

    return courses.map(course => {
      const userEnrollment = userEnrollmentsMap.get(course.id);
      const isRemovedFromClass = userEnrollment?.classStatus === 'removed';
      const isEnrolled = Boolean(
        userEnrollment && userEnrollment.paymentStatus !== 'rejected' && !isRemovedFromClass
      );
      const enrollmentStatus = userEnrollment?.paymentStatus;

      let hasArchiveAccess = false;
      if (course.archiveAccess === 'all') {
        hasArchiveAccess = true;
      } else if (isStaff) {
        hasArchiveAccess = true;
      } else if (userEnrollment?.paymentStatus === 'confirmed' && !isRemovedFromClass) {
        hasArchiveAccess = true;
      }

      return {
        ...course,
        isEnrolled,
        enrollmentStatus,
        classStatus: userEnrollment?.classStatus,
        hasArchiveAccess,
      };
    });
  }

  async getEnrollments(authCtx: AuthContext, courseId?: string): Promise<Array<CourseEnrollment & { version: number }>> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const workshopOnly = isWorkshopOnlyManager(authCtx);

    if (workshopOnly && courseId) {
      const cRows = await selectWithTimeout<any>(
        `SELECT course_scope FROM courses WHERE id = ? OR id = ? LIMIT 1`,
        [toIdBuffer(courseId), courseId],
        3000
      );
      if (cRows.length > 0 && normalizeCourseScope(cRows[0].course_scope) !== 'counseling_workshop') {
        throw AppError.forbidden('دسترسی مسئول مشاوره صرفاً به کارگاه‌های آموزشی مجاز است.');
      }
    }

    let sql = `SELECT ce.* FROM course_enrollments ce INNER JOIN courses c ON c.id = ce.course_id WHERE 1=1`;
    const params: any[] = [];

    if (authCtx.role === 'alumni' || authCtx.role === 'customer') {
      sql += ` AND (ce.user_id = ? OR ce.user_id = ?)`;
      params.push(toIdBuffer(authCtx.userId), authCtx.userId);
    } else if (workshopOnly) {
      sql += ` AND c.course_scope = 'counseling_workshop'`;
    } else if (!canReadAdminCourseScope(authCtx, 'specialized') && !canReadAdminCourseScope(authCtx, 'counseling_workshop')) {
      sql += ` AND (ce.user_id = ? OR ce.user_id = ?)`;
      params.push(toIdBuffer(authCtx.userId), authCtx.userId);
    }

    if (courseId) {
      sql += ` AND (ce.course_id = ? OR ce.course_id = ?)`;
      params.push(toIdBuffer(courseId), courseId);
    }

    sql += ` ORDER BY ce.enrolled_at DESC`;

    const rows = await selectWithTimeout<any>(sql, params, 4000);
    const enrollments = (rows || []).map(mapEnrollmentRow).map(e => redactNationalIdForUser(authCtx, e));

    if (enrollments.length > 0) {
      let instSql = `SELECT ci.* FROM course_installments ci INNER JOIN courses c ON c.id = ci.course_id WHERE ci.deleted_at IS NULL`;
      const instParams: any[] = [];
      if (authCtx.role === 'alumni' || authCtx.role === 'customer') {
        instSql += ` AND (ci.user_id = ? OR ci.user_id = ?)`;
        instParams.push(toIdBuffer(authCtx.userId), authCtx.userId);
      } else if (workshopOnly) {
        instSql += ` AND c.course_scope = 'counseling_workshop'`;
      }
      if (courseId) {
        instSql += ` AND (ci.course_id = ? OR ci.course_id = ?)`;
        instParams.push(toIdBuffer(courseId), courseId);
      }
      instSql += ` ORDER BY ci.installment_number ASC`;
      const instRows = await selectWithTimeout<any>(instSql, instParams, 4000);
      const byEnr = new Map<string, CourseInstallmentRecord[]>();
      for (const ir of instRows || []) {
        const mapped = redactNationalIdForUser(authCtx, mapInstallmentRow(ir));
        const list = byEnr.get(mapped.enrollmentId) || [];
        list.push(mapped);
        byEnr.set(mapped.enrollmentId, list);
      }
      enrollments.forEach(enr => {
        enr.installments = byEnr.get(enr.id) || [];
      });
    }

    return enrollments;
  }

  async enroll(
    authCtx: AuthContext & { nationalId?: string; phone?: string },
    courseId: string,
    dto: {
      paymentMethod: 'online_gateway' | 'bank_receipt';
      paymentPlanType?: 'full' | 'installment';
      discountCode?: string;
      trackingCode?: string;
      receiptBankName?: string;
      receiptDate?: string;
      receiptFileUrl?: string;
      amountPaid?: number;
    }
  ): Promise<{ course: Course; enrollment: CourseEnrollment }> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const p = getPool();
    const cBuf = toIdBuffer(courseId);
    const uBuf = toIdBuffer(authCtx.userId);

    const coursesRows = await selectWithTimeout<any>(
      `SELECT * FROM courses WHERE (id = ? OR id = ?) AND is_deleted = 0 LIMIT 1`,
      [cBuf, courseId],
      3000
    );
    if (!coursesRows || coursesRows.length === 0) {
      throw AppError.notFound(`دوره با شناسه ${courseId}`);
    }
    const course = mapCourseRow(coursesRows[0]);

    if (authCtx.role === 'customer' && course.visibleToCustomer === false) {
      throw AppError.forbidden('این دوره آموزشی برای کاربران مشتری در دسترس نیست.');
    }

    if (course.enrolledCount >= course.capacity) {
      throw AppError.conflict('ظرفیت دوره تکمیل شده است.', 'COURSE_CAPACITY_EXCEEDED');
    }

    const [existingRows] = await p.query<any[]>(
      `SELECT * FROM course_enrollments WHERE (course_id = ? OR course_id = ?) AND (user_id = ? OR user_id = ?) AND payment_status != 'rejected'`,
      [cBuf, courseId, uBuf, authCtx.userId]
    );

    if (existingRows && existingRows.length > 0) {
      if (existingRows[0].class_status === 'removed') {
        throw AppError.forbidden(
          'دسترسی شما به کلاس این دوره توسط مدیر آموزش لغو شده است. جهت بازگردانی با واحد آموزش تماس بگیرید.',
          'ENROLLMENT_REMOVED_FROM_CLASS'
        );
      }
      throw AppError.conflict('شما قبلاً در این دوره ثبت‌نام کرده‌اید.');
    }

    if (dto.paymentMethod === 'bank_receipt' && dto.receiptFileUrl) {
      const urlStr = String(dto.receiptFileUrl);
      if (
        !urlStr.startsWith('/api/storage/private/course_receipts/') &&
        !urlStr.startsWith('/uploads/')
      ) {
        throw AppError.badRequest('فیش واریزی باید در پوشه امن دیسک بارگذاری شود.', 'INVALID_RECEIPT_STORAGE');
      }
    }

    const originalAmount = Math.max(0, Number(course.price || 0));
    let discountAmount = 0;
    let appliedDiscountId: string | null = null;
    let appliedDiscountCode: string | undefined = undefined;

    if (dto.discountCode && dto.discountCode.trim()) {
      const valRes = await validateDiscountForCourse({
        code: dto.discountCode.trim(),
        courseId: course.id,
        courseScope: course.courseScope,
        coursePrice: originalAmount,
        courseTargetAudiences: course.targetAudiences,
        userId: authCtx.userId,
        userNationalId: authCtx.nationalId,
        userRole: authCtx.role,
      });
      discountAmount = valRes.discountAmount;
      appliedDiscountId = valRes.discountCode.id;
      appliedDiscountCode = valRes.discountCode.code;
    }

    const finalTotalAmount = Math.max(0, originalAmount - discountAmount);
    const useInstallment =
      dto.paymentPlanType === 'installment' &&
      course.hasInstallments &&
      finalTotalAmount > 0 &&
      course.installmentPlan?.enabled !== false;

    const planItems =
      course.installmentPlan?.items && course.installmentPlan.items.length > 0
        ? course.installmentPlan.items
        : [
            {
              installmentNumber: 1,
              title: 'قسط اول (پیش‌پرداخت ثبت‌نام)',
              percentage: 50,
              dueDateIso: new Date().toISOString().slice(0, 10),
              dueDateJalali: new Date().toLocaleDateString('fa-IR'),
            },
            {
              installmentNumber: 2,
              title: 'قسط دوم (تسویه شهریه)',
              percentage: 50,
              dueDateIso: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
              dueDateJalali: new Date(Date.now() + 30 * 86400000).toLocaleDateString('fa-IR'),
            },
          ];

    // Calculate amounts for each installment summing strictly to finalTotalAmount
    const computedInstallments = useInstallment
      ? planItems.map((item, idx) => {
          const isLast = idx === planItems.length - 1;
          let amt = 0;
          if (!isLast) {
            if (item.fixedAmount && item.fixedAmount > 0) {
              amt = Math.min(finalTotalAmount, item.fixedAmount);
            } else {
              const pct = item.percentage || Math.round(100 / planItems.length);
              amt = Math.round((finalTotalAmount * pct) / 100);
            }
          }
          return { ...item, computedAmount: amt };
        })
      : [];

    if (computedInstallments.length > 0) {
      const priorSum = computedInstallments.slice(0, -1).reduce((s, x) => s + x.computedAmount, 0);
      computedInstallments[computedInstallments.length - 1].computedAmount = Math.max(0, finalTotalAmount - priorSum);
    }

    const initialDueAmount = useInstallment ? computedInstallments[0].computedAmount : finalTotalAmount;
    const now = new Date().toISOString();
    const trackingCode =
      dto.trackingCode || (dto.paymentMethod === 'online_gateway' ? `SHP-${Date.now().toString().slice(-7)}` : `TRX-${Date.now().toString().slice(-7)}`);
    const paymentStatus: CourseEnrollment['paymentStatus'] =
      dto.paymentMethod === 'online_gateway' || finalTotalAmount === 0 ? 'confirmed' : 'pending_review';
    const enrollmentId = generateUUIDv7();
    const eBuf = toIdBuffer(enrollmentId);
    const userNationalId = authCtx.nationalId || '0019988776';
    let resolvedPhone = authCtx.phone || '';
    if (!resolvedPhone) {
      const userRows = await selectWithTimeout<any>(
        `SELECT phone FROM users WHERE (id = ? OR id = ?) AND deleted_at IS NULL LIMIT 1`,
        [uBuf, authCtx.userId],
        2000
      );
      resolvedPhone = userRows?.[0]?.phone || '';
    }
    const userPhone = resolvedPhone || '09120000000';
    const userRoleTitle = authCtx.role === 'alumni' ? 'دانش‌آموخته' : authCtx.role === 'customer' ? 'کاربر مشتری' : 'عضو هیئت علمی / مسئول';

    const createdInstallments: CourseInstallmentRecord[] = [];

    return await withTx(async (conn) => {
      // Atomic Conditional Capacity Increment in MySQL
      const [capRes]: any = await conn.query(
        `UPDATE courses 
         SET enrolled_count = enrolled_count + 1, version = version + 1 
         WHERE (id = ? OR id = ?) AND enrolled_count < capacity`,
        [cBuf, courseId]
      );

      if (!capRes || capRes.affectedRows === 0) {
        throw AppError.conflict('ظرفیت دوره تکمیل شده است.', 'COURSE_CAPACITY_EXCEEDED');
      }

      // Atomic Discount Code Redemption if provided
      if (appliedDiscountId && appliedDiscountCode) {
        const dBuf = toIdBuffer(appliedDiscountId);
        const [dUpd]: any = await conn.query(
          `UPDATE course_discount_codes
           SET used_count = used_count + 1, version = version + 1
           WHERE id = ? AND is_active = 1 AND deleted_at IS NULL AND (max_uses IS NULL OR used_count < max_uses)`,
          [dBuf]
        );
        if (!dUpd || dUpd.affectedRows === 0) {
          throw AppError.conflict('ظرفیت کد تخفیف هم‌زمان تکمیل یا غیرفعال شده است.', 'DISCOUNT_CONFLICT');
        }
        await conn.query(
          `INSERT INTO course_discount_usages (
            id, discount_id, code, course_id, course_title, enrollment_id,
            user_id, user_name, user_national_id, user_phone,
            original_amount, discount_amount, final_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            toIdBuffer(generateUUIDv7()),
            dBuf,
            appliedDiscountCode,
            cBuf,
            course.title,
            eBuf,
            uBuf,
            authCtx.fullName,
            userNationalId,
            userPhone,
            originalAmount,
            discountAmount,
            finalTotalAmount,
          ]
        );
      }

      await conn.query(
        `INSERT INTO course_enrollments (
          id, course_id, course_title, user_id, user_name, user_national_id, user_phone, user_role_title,
          payment_method, payment_status, payment_plan_type, discount_code, discount_amount,
          original_amount, final_total_amount, amount_paid, tracking_code, receipt_bank_name, receipt_date, receipt_file_url, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          eBuf,
          cBuf,
          course.title,
          uBuf,
          authCtx.fullName,
          userNationalId,
          userPhone,
          userRoleTitle,
          dto.paymentMethod,
          paymentStatus,
          useInstallment ? 'installment' : 'full',
          appliedDiscountCode || null,
          discountAmount,
          originalAmount,
          finalTotalAmount,
          paymentStatus === 'confirmed' ? initialDueAmount : initialDueAmount,
          trackingCode,
          dto.receiptBankName || (dto.paymentMethod === 'online_gateway' ? 'درگاه پرداخت شاپرک' : 'بانک ملی ایران'),
          dto.receiptDate || new Date().toLocaleDateString('fa-IR'),
          dto.receiptFileUrl || null,
        ]
      );

      // Insert scheduled installments when installment plan chosen
      if (useInstallment && computedInstallments.length > 0) {
        for (let idx = 0; idx < computedInstallments.length; idx++) {
          const item = computedInstallments[idx];
          const instId = generateUUIDv7();
          const isFirst = idx === 0;
          const instStatus = isFirst
            ? dto.paymentMethod === 'online_gateway'
              ? 'paid'
              : 'awaiting_verification'
            : 'pending';

          await conn.query(
            `INSERT INTO course_installments (
              id, enrollment_id, course_id, course_title, user_id, user_name, user_phone, user_national_id,
              installment_number, title, amount, due_date_iso, due_date_jalali, status,
              payment_method, tracking_code, receipt_file_url, receipt_bank_name, receipt_date, paid_at, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              toIdBuffer(instId),
              eBuf,
              cBuf,
              course.title,
              uBuf,
              authCtx.fullName,
              userPhone,
              userNationalId,
              item.installmentNumber || idx + 1,
              item.title || `قسط ${idx + 1}`,
              item.computedAmount,
              item.dueDateIso || new Date(Date.now() + idx * 30 * 86400000).toISOString().slice(0, 10),
              item.dueDateJalali || new Date(Date.now() + idx * 30 * 86400000).toLocaleDateString('fa-IR'),
              instStatus,
              isFirst ? dto.paymentMethod : null,
              isFirst ? trackingCode : null,
              isFirst ? dto.receiptFileUrl || null : null,
              isFirst ? dto.receiptBankName || null : null,
              isFirst ? dto.receiptDate || null : null,
              isFirst && instStatus === 'paid' ? new Date() : null,
            ]
          );

          createdInstallments.push({
            id: instId,
            enrollmentId,
            courseId: course.id,
            courseTitle: course.title,
            userId: authCtx.userId,
            userName: authCtx.fullName,
            userPhone,
            userNationalId,
            installmentNumber: item.installmentNumber || idx + 1,
            title: item.title || `قسط ${idx + 1}`,
            amount: item.computedAmount,
            dueDateIso: item.dueDateIso || new Date(Date.now() + idx * 30 * 86400000).toISOString().slice(0, 10),
            dueDateJalali: item.dueDateJalali || new Date(Date.now() + idx * 30 * 86400000).toLocaleDateString('fa-IR'),
            status: instStatus as any,
            paymentMethod: isFirst ? dto.paymentMethod : undefined,
            trackingCode: isFirst ? trackingCode : undefined,
            receiptFileUrl: isFirst ? dto.receiptFileUrl : undefined,
            version: 1,
          });
        }
      }

      const enrollment: CourseEnrollment & { version: number } = {
        id: enrollmentId,
        courseId: course.id,
        courseTitle: course.title,
        userId: authCtx.userId,
        userName: authCtx.fullName,
        userNationalId,
        userPhone,
        userRoleTitle,
        enrolledAt: now,
        paymentMethod: dto.paymentMethod,
        paymentStatus,
        paymentPlanType: useInstallment ? 'installment' : 'full',
        discountCode: appliedDiscountCode,
        discountAmount,
        originalAmount,
        finalTotalAmount,
        amountPaid: initialDueAmount,
        trackingCode,
        receiptBankName: dto.receiptBankName || (dto.paymentMethod === 'online_gateway' ? 'درگاه پرداخت شاپرک' : 'بانک ملی ایران'),
        receiptDate: dto.receiptDate || new Date().toLocaleDateString('fa-IR'),
        receiptFileUrl: dto.receiptFileUrl,
        installments: createdInstallments,
        version: 1,
      };

      auditChain.appendEntry({
        eventType: 'LOGIN_SUCCESS',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `ثبت‌نام ${dto.paymentMethod === 'online_gateway' ? 'آنلاین قطعی' : 'با ارسال فیش واریزی'} (${useInstallment ? 'اقساطی' : 'نقدی'}) در دوره [${course.title}] با شماره پیگیری ${trackingCode}${appliedDiscountCode ? ` و کد تخفیف ${appliedDiscountCode}` : ''}.`,
        severity: 'info',
      });

      outbox.enqueue('courses.enrolled', {
        courseId,
        courseScope: course.courseScope || 'specialized',
        userId: authCtx.userId,
        title: course.title,
        paymentStatus,
        trackingCode,
      });

      const [updatedCourses]: any = await conn.query(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId]);
      const updatedCourse = mapCourseRow(updatedCourses[0]);
      updatedCourse.isEnrolled = true;
      updatedCourse.enrollmentStatus = paymentStatus;
      updatedCourse.hasArchiveAccess = paymentStatus === 'confirmed';

      return { course: updatedCourse, enrollment };
    });
  }

  async reviewEnrollment(
    authCtx: AuthContext,
    enrollmentId: string,
    status: 'confirmed' | 'rejected',
    adminNote?: string,
    expectedVersion?: number
  ): Promise<CourseEnrollment & { version: number }> {
    ensureDatabaseConnection();

    const eBuf = toIdBuffer(enrollmentId);
    const eRows = await selectWithTimeout<any>(
      `SELECT * FROM course_enrollments WHERE id = ? OR id = ? LIMIT 1`,
      [eBuf, enrollmentId],
      3000
    );
    if (!eRows || eRows.length === 0) {
      throw AppError.notFound(`ثبت‌نام با شناسه ${enrollmentId}`);
    }
    const enrollment = mapEnrollmentRow(eRows[0]);
    const cBuf = toIdBuffer(enrollment.courseId);
    const courseScope = await assertCanManageCourseId(authCtx, enrollment.courseId);

    return await withTx(async (conn) => {
      const prevStatus = enrollment.paymentStatus;
      const note = adminNote || (status === 'confirmed' ? 'مستندات واریز تایید و ثبت‌نام قطعی شد.' : 'رسید واریزی مورد تایید قرار نگرفت.');

      if (expectedVersion === undefined || expectedVersion === null || isNaN(Number(expectedVersion))) {
        throw AppError.badRequest(
          'شناسه نسخه معتبر (expectedVersion یا هدر If-Match) جهت بررسی ثبت‌نام الزامی است.',
          'VERSION_REQUIRED'
        );
      }
      const expVer = Number(expectedVersion);

      const [res]: any = await conn.query(
        `UPDATE course_enrollments
         SET payment_status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3), version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [status, note, authCtx.fullName, eBuf, enrollmentId, expVer]
      );

      if (res && res.affectedRows === 0) {
        throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      if (status === 'confirmed' && prevStatus !== 'confirmed') {
        await conn.query(`UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ? OR id = ?`, [cBuf, enrollment.courseId]);
      } else if (status === 'rejected' && prevStatus === 'confirmed') {
        await conn.query(`UPDATE courses SET enrolled_count = GREATEST(0, enrolled_count - 1) WHERE id = ? OR id = ?`, [cBuf, enrollment.courseId]);
      }

      // Sync installment #1 status if enrollment is confirmed or rejected
      if (status === 'confirmed') {
        await conn.query(
          `UPDATE course_installments
           SET status = 'paid', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3), version = version + 1
           WHERE (enrollment_id = ? OR enrollment_id = ?) AND installment_number = 1 AND status = 'awaiting_verification'`,
          [authCtx.fullName, eBuf, enrollmentId]
        );
      } else if (status === 'rejected') {
        await conn.query(
          `UPDATE course_installments
           SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3), version = version + 1
           WHERE (enrollment_id = ? OR enrollment_id = ?) AND installment_number = 1 AND status = 'awaiting_verification'`,
          [note, authCtx.fullName, eBuf, enrollmentId]
        );
      }

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `تغییر وضعیت ثبت‌نام متقاضی [${enrollment.userName}] در دوره [${enrollment.courseTitle}] به '${status}'.`,
        severity: 'info',
      });

      outbox.enqueue('courses.enrollment_reviewed', {
        enrollmentId,
        courseId: enrollment.courseId,
        courseScope,
        userId: enrollment.userId,
        status,
      });

      const [updatedRows]: any = await conn.query(`SELECT * FROM course_enrollments WHERE id = ? OR id = ? LIMIT 1`, [eBuf, enrollmentId]);
      return redactNationalIdForUser(authCtx, mapEnrollmentRow(updatedRows[0]));
    });
  }

  async createCourse(
    authCtx: AuthContext,
    data: Partial<Course>
  ): Promise<Course & { version: number }> {
    const scope = normalizeCourseScope(data.courseScope);
    assertCanManageCourseScope(authCtx, scope);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const newId = generateUUIDv7();
    const idBuf = toIdBuffer(newId);

    const topics = data.topics && data.topics.length > 0 ? data.topics : ['مباحث نظری و فقهی', 'تحلیل رویه قضایی'];
    const archiveResources = data.archiveResources || [];

    const instructors = normalizeCourseInstructors(
      data.instructors,
      data.instructor || 'استاد محترم',
      data.instructorTitle,
      data.instructorAvatarUrl,
      data.instructorResume
    );
    const primaryInst = instructors.find(i => i.isPrimary) || instructors[0];
    const sessions = normalizeCourseSessions(data.sessions, instructors);
    const effectiveSessionsCount = sessions.length > 0 ? sessions.length : Math.max(1, Number(data.sessionsCount || 4));

    const promotedOfflineFiles = data.draftFolderKey
      ? await promoteDraftCourseFilesFolder(data.draftFolderKey, newId, data.offlineDownloadFiles || [])
      : (data.offlineDownloadFiles || []);

    await withTx(async (conn) => {
      await conn.query(
        `INSERT INTO courses (
          id, title, instructor, instructor_title, instructor_resume, instructor_avatar_url,
          category, level, hours, capacity, enrolled_count, price, start_date, end_date,
          holding_time, schedule, holding_format, venue_address, meeting_link, meeting_access_guide,
          prerequisites, necessity, description, manager_notes,
          target_audiences, custom_tags, custom_fields, hidden_fields,
          has_installments, installment_details, installment_plan,
          has_certificate, certificate_details,
          status, topics, cover_image, allowed_payment_method, archive_access, archive_resources,
          offline_download_url, offline_download_guide, offline_download_files,
          instructors, sessions, sessions_count, course_scope,
          is_deleted, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
        [
          idBuf,
          data.title || (scope === 'counseling_workshop' ? 'کارگاه آموزشی جدید' : 'دوره جدید'),
          primaryInst?.fullName || data.instructor || 'استاد محترم',
          primaryInst?.title || data.instructorTitle || null,
          primaryInst?.resume || data.instructorResume || null,
          primaryInst?.avatarUrl || data.instructorAvatarUrl || null,
          data.category || (scope === 'counseling_workshop' ? 'کارگاه‌های روان‌شناسی و مشاوره' : 'فقه القضاء'),
          data.level || 'تخصصی عالی',
          data.hours || 0,
          data.capacity || 0,
          data.price || 0,
          data.startDate || '',
          data.endDate || null,
          data.holdingTime || null,
          data.schedule || 'پنج‌شنبه‌ها',
          data.holdingFormat || 'online',
          data.venueAddress || null,
          data.meetingLink || '',
          data.meetingAccessGuide || null,
          data.prerequisites || null,
          data.necessity || null,
          data.description || data.title || '',
          data.managerNotes || null,
          JSON.stringify(data.targetAudiences || ['طلاب', 'قضات', 'وکلا']),
          JSON.stringify(data.customTags || []),
          JSON.stringify(data.customFields || []),
          JSON.stringify(data.hiddenFields || []),
          data.hasInstallments ? 1 : 0,
          data.installmentDetails || null,
          data.installmentPlan ? JSON.stringify(data.installmentPlan) : null,
          data.hasCertificate !== false ? 1 : 0,
          data.certificateDetails || null,
          data.status || 'enrolling',
          JSON.stringify(topics),
          data.coverImage || null,
          data.allowedPaymentMethod || 'both',
          data.archiveAccess || 'enrolled_only',
          JSON.stringify(archiveResources),
          data.offlineDownloadUrl || null,
          data.offlineDownloadGuide || null,
          JSON.stringify(promotedOfflineFiles),
          JSON.stringify(instructors),
          JSON.stringify(sessions),
          effectiveSessionsCount,
          scope,
        ]
      );

      await syncCourseNormalizedRelations(conn, newId, instructors, sessions, promotedOfflineFiles, authCtx.fullName);
    });

    auditChain.appendEntry({
      eventType: 'RULING_APPROVED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `${scope === 'counseling_workshop' ? 'کارگاه آموزشی' : 'دوره تخصصی'} جدید [${data.title}] با ${instructors.length} مدرس و ${sessions.length} جلسه تعریف و منتشر گردید.`,
      severity: 'info',
    });

    const rows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? LIMIT 1`, [idBuf]);
    const created = mapCourseRow(rows[0]);

    outbox.enqueue('courses.created', {
      courseId: newId,
      courseScope: scope,
      resourceId: newId,
      updates: created,
    });

    return created;
  }

  async updateCourse(
    authCtx: AuthContext,
    courseId: string,
    updates: Partial<Course> & { expectedVersion?: number; version?: number }
  ): Promise<Course & { version: number }> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const cBuf = toIdBuffer(courseId);

    const rows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId]);
    if (!rows || rows.length === 0) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    const existing = mapCourseRow(rows[0]);
    const existingScope = normalizeCourseScope(existing.courseScope);
    assertCanManageCourseScope(authCtx, existingScope);

    const rawVersion = updates.expectedVersion !== undefined ? updates.expectedVersion : updates.version;
    if (rawVersion === undefined || rawVersion === null || isNaN(Number(rawVersion))) {
      throw AppError.badRequest(
        'شناسه نسخه معتبر (expectedVersion یا هدر If-Match) جهت ویرایش اطلاعات دوره الزامی است.',
        'VERSION_REQUIRED'
      );
    }
    const expVer = Number(rawVersion);

    // Collect old image URLs before applying updates so replaced images are removed from disk safely
    const oldImageUrls = new Set<string>();
    if (existing.coverImage) oldImageUrls.add(existing.coverImage);
    if (existing.instructorAvatarUrl) oldImageUrls.add(existing.instructorAvatarUrl);
    if (existing.postEnrollmentBanner) oldImageUrls.add(existing.postEnrollmentBanner);
    (existing.instructors || []).forEach(inst => {
      if (inst.avatarUrl) oldImageUrls.add(inst.avatarUrl);
    });

    // Resolve instructors & sessions keeping full sync
    let nextInstructors: CourseInstructorItem[];
    if (updates.instructors !== undefined) {
      nextInstructors = normalizeCourseInstructors(
        updates.instructors,
        updates.instructor ?? existing.instructor,
        updates.instructorTitle ?? existing.instructorTitle,
        updates.instructorAvatarUrl !== undefined ? updates.instructorAvatarUrl : existing.instructorAvatarUrl,
        updates.instructorResume ?? existing.instructorResume
      );
    } else {
      const existingList = [...(existing.instructors || [])];
      if (existingList.length > 0) {
        const primaryIdx = Math.max(0, existingList.findIndex(i => i.isPrimary));
        existingList[primaryIdx] = {
          ...existingList[primaryIdx],
          fullName: updates.instructor !== undefined ? updates.instructor : existingList[primaryIdx].fullName,
          title: updates.instructorTitle !== undefined ? updates.instructorTitle : existingList[primaryIdx].title,
          avatarUrl: updates.instructorAvatarUrl !== undefined ? updates.instructorAvatarUrl : existingList[primaryIdx].avatarUrl,
          resume: updates.instructorResume !== undefined ? updates.instructorResume : existingList[primaryIdx].resume,
        };
      }
      nextInstructors = normalizeCourseInstructors(
        existingList,
        updates.instructor ?? existing.instructor,
        updates.instructorTitle ?? existing.instructorTitle,
        updates.instructorAvatarUrl !== undefined ? updates.instructorAvatarUrl : existing.instructorAvatarUrl,
        updates.instructorResume ?? existing.instructorResume
      );
    }

    const primaryInst = nextInstructors.find(i => i.isPrimary) || nextInstructors[0];
    const nextSessions = updates.sessions !== undefined
      ? normalizeCourseSessions(updates.sessions, nextInstructors)
      : normalizeCourseSessions(existing.sessions, nextInstructors);

    const nextSessionsCount =
      updates.sessions !== undefined
        ? (nextSessions.length > 0 ? nextSessions.length : Number(updates.sessionsCount || existing.sessionsCount || 4))
        : updates.sessionsCount !== undefined
        ? Number(updates.sessionsCount)
        : existing.sessionsCount || 4;

    const next = {
      title: updates.title !== undefined ? updates.title : existing.title,
      instructor: primaryInst?.fullName || (updates.instructor !== undefined ? updates.instructor : existing.instructor),
      instructorTitle: primaryInst?.title ?? (updates.instructorTitle !== undefined ? updates.instructorTitle : existing.instructorTitle),
      instructorResume: primaryInst?.resume ?? (updates.instructorResume !== undefined ? updates.instructorResume : existing.instructorResume),
      instructorAvatarUrl: primaryInst?.avatarUrl ?? (updates.instructorAvatarUrl !== undefined ? updates.instructorAvatarUrl : existing.instructorAvatarUrl),
      instructors: nextInstructors,
      sessions: nextSessions,
      sessionsCount: nextSessionsCount,
      category: updates.category !== undefined ? updates.category : existing.category,
      level: updates.level !== undefined ? updates.level : existing.level,
      hours: updates.hours !== undefined ? updates.hours : existing.hours,
      capacity: updates.capacity !== undefined ? updates.capacity : existing.capacity,
      price: updates.price !== undefined ? updates.price : existing.price,
      startDate: updates.startDate !== undefined ? updates.startDate : existing.startDate,
      endDate: updates.endDate !== undefined ? updates.endDate : existing.endDate,
      holdingTime: updates.holdingTime !== undefined ? updates.holdingTime : existing.holdingTime,
      schedule: updates.schedule !== undefined ? updates.schedule : existing.schedule,
      holdingFormat: updates.holdingFormat !== undefined ? updates.holdingFormat : existing.holdingFormat,
      venueAddress: updates.venueAddress !== undefined ? updates.venueAddress : existing.venueAddress,
      meetingLink: updates.meetingLink !== undefined ? updates.meetingLink : existing.meetingLink,
      meetingAccessGuide: updates.meetingAccessGuide !== undefined ? updates.meetingAccessGuide : existing.meetingAccessGuide,
      prerequisites: updates.prerequisites !== undefined ? updates.prerequisites : existing.prerequisites,
      necessity: updates.necessity !== undefined ? updates.necessity : existing.necessity,
      description: updates.description !== undefined ? updates.description : existing.description,
      managerNotes: updates.managerNotes !== undefined ? updates.managerNotes : existing.managerNotes,
      targetAudiences: updates.targetAudiences !== undefined ? updates.targetAudiences : (existing.targetAudiences || []),
      customTags: updates.customTags !== undefined ? updates.customTags : (existing.customTags || []),
      customFields: updates.customFields !== undefined ? updates.customFields : (existing.customFields || []),
      hiddenFields: updates.hiddenFields !== undefined ? updates.hiddenFields : (existing.hiddenFields || []),
      hasInstallments: updates.hasInstallments !== undefined ? updates.hasInstallments : existing.hasInstallments,
      installmentDetails: updates.installmentDetails !== undefined ? updates.installmentDetails : existing.installmentDetails,
      installmentPlan: updates.installmentPlan !== undefined ? updates.installmentPlan : existing.installmentPlan,
      hasCertificate: updates.hasCertificate !== undefined ? updates.hasCertificate : existing.hasCertificate,
      certificateDetails: updates.certificateDetails !== undefined ? updates.certificateDetails : existing.certificateDetails,
      status: updates.status !== undefined ? updates.status : existing.status,
      topics: updates.topics !== undefined ? updates.topics : existing.topics,
      coverImage: updates.coverImage !== undefined ? updates.coverImage : existing.coverImage,
      allowedPaymentMethod: updates.allowedPaymentMethod !== undefined ? updates.allowedPaymentMethod : existing.allowedPaymentMethod,
      archiveAccess: updates.archiveAccess !== undefined ? updates.archiveAccess : existing.archiveAccess,
      archiveResources: updates.archiveResources !== undefined ? updates.archiveResources : (existing.archiveResources || []),
      postEnrollmentBanner: updates.postEnrollmentBanner !== undefined ? updates.postEnrollmentBanner : existing.postEnrollmentBanner,
      postEnrollmentMessage: updates.postEnrollmentMessage !== undefined ? updates.postEnrollmentMessage : existing.postEnrollmentMessage,
      welcomeBoxFontSize: updates.welcomeBoxFontSize !== undefined ? updates.welcomeBoxFontSize : existing.welcomeBoxFontSize,
      welcomeBoxBgColor: updates.welcomeBoxBgColor !== undefined ? updates.welcomeBoxBgColor : existing.welcomeBoxBgColor,
      reminderDate: updates.reminderDate !== undefined ? updates.reminderDate : existing.reminderDate,
      reminderSchedule: updates.reminderSchedule !== undefined ? updates.reminderSchedule : existing.reminderSchedule,
      offlineDownloadUrl: updates.offlineDownloadUrl !== undefined ? updates.offlineDownloadUrl : existing.offlineDownloadUrl,
      offlineDownloadGuide: updates.offlineDownloadGuide !== undefined ? updates.offlineDownloadGuide : existing.offlineDownloadGuide,
      offlineDownloadFiles: updates.offlineDownloadFiles !== undefined ? updates.offlineDownloadFiles : (existing.offlineDownloadFiles || []),
    };

    await withTx(async (conn) => {
      const [res]: any = await conn.query(
        `UPDATE courses
         SET title = ?, instructor = ?, instructor_title = ?, instructor_resume = ?, instructor_avatar_url = ?,
             category = ?, level = ?, hours = ?, capacity = ?, price = ?, start_date = ?, end_date = ?,
             holding_time = ?, schedule = ?, holding_format = ?, venue_address = ?, meeting_link = ?, meeting_access_guide = ?,
             prerequisites = ?, necessity = ?, description = ?, manager_notes = ?,
             target_audiences = ?, custom_tags = ?, custom_fields = ?, hidden_fields = ?,
             has_installments = ?, installment_details = ?, installment_plan = ?,
             has_certificate = ?, certificate_details = ?,
             status = ?, topics = ?, cover_image = ?, allowed_payment_method = ?, archive_access = ?, archive_resources = ?,
             post_enrollment_banner = ?, post_enrollment_message = ?, welcome_box_font_size = ?, welcome_box_bg_color = ?,
             reminder_date = ?, reminder_schedule = ?, offline_download_url = ?, offline_download_guide = ?, offline_download_files = ?,
             instructors = ?, sessions = ?, sessions_count = ?,
             version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
         WHERE (id = ? OR id = ?) AND version = ?`,
        [
          next.title,
          next.instructor,
          next.instructorTitle || null,
          next.instructorResume || null,
          next.instructorAvatarUrl || null,
          next.category || null,
          next.level || null,
          next.hours,
          next.capacity,
          next.price,
          next.startDate || '',
          next.endDate || null,
          next.holdingTime || null,
          next.schedule || null,
          next.holdingFormat || 'online',
          next.venueAddress || null,
          next.meetingLink || null,
          next.meetingAccessGuide || null,
          next.prerequisites || null,
          next.necessity || null,
          next.description || null,
          next.managerNotes || null,
          JSON.stringify(next.targetAudiences),
          JSON.stringify(next.customTags),
          JSON.stringify(next.customFields),
          JSON.stringify(next.hiddenFields),
          next.hasInstallments ? 1 : 0,
          next.installmentDetails || null,
          next.installmentPlan ? JSON.stringify(next.installmentPlan) : null,
          next.hasCertificate ? 1 : 0,
          next.certificateDetails || null,
          next.status,
          JSON.stringify(next.topics),
          next.coverImage || null,
          next.allowedPaymentMethod,
          next.archiveAccess,
          JSON.stringify(next.archiveResources),
          next.postEnrollmentBanner || null,
          next.postEnrollmentMessage || null,
          next.welcomeBoxFontSize || null,
          next.welcomeBoxBgColor || null,
          next.reminderDate || null,
          next.reminderSchedule || null,
          next.offlineDownloadUrl || null,
          next.offlineDownloadGuide || null,
          JSON.stringify(next.offlineDownloadFiles),
          JSON.stringify(next.instructors),
          JSON.stringify(next.sessions),
          next.sessionsCount,
          cBuf,
          courseId,
          expVer,
        ]
      );

      if (res && res.affectedRows === 0) {
        throw AppError.conflict(
          'اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      await syncCourseNormalizedRelations(
        conn,
        existing.id,
        next.instructors,
        next.sessions,
        next.offlineDownloadFiles,
        authCtx.fullName
      );
    });

    // Clean up replaced or cleared old images from disk safely after commit
    const retainedImages = new Set<string>();
    if (next.coverImage) retainedImages.add(next.coverImage);
    if (next.instructorAvatarUrl) retainedImages.add(next.instructorAvatarUrl);
    if (next.postEnrollmentBanner) retainedImages.add(next.postEnrollmentBanner);
    (next.instructors || []).forEach(inst => {
      if (inst.avatarUrl) retainedImages.add(inst.avatarUrl);
    });
    for (const oldUrl of oldImageUrls) {
      if (!retainedImages.has(oldUrl)) {
        await deleteCourseImageIfUnreferenced(oldUrl, existing.id);
      }
    }

    auditChain.appendEntry({
      eventType: 'ROLE_CHANGED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `تنظیمات و اطلاعات دوره [${next.title}] توسط مسئول آموزش بروزرسانی شد.`,
      severity: 'info',
    });

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId]);
    const finalCourse = mapCourseRow(updatedRows[0]);

    outbox.enqueue('courses.updated', {
      courseId,
      courseScope: existingScope,
      resourceId: courseId,
      title: finalCourse.title,
      version: finalCourse.version,
      updates: finalCourse,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return finalCourse;
  }

  async softDeleteCourse(
    authCtx: AuthContext,
    courseId: string,
    pin: string
  ): Promise<{ success: boolean; message: string }> {
    ensureDatabaseConnection();

    if (!pin || pin.trim().length < 4) {
      throw AppError.forbidden('ورود کد امنیتی / پین پیامکی ۶ رقمی الزامی است.');
    }

    const cBuf = toIdBuffer(courseId);
    const p = getPool();

    const rows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId]);
    if (!rows || rows.length === 0) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    const course = mapCourseRow(rows[0]);
    const courseScope = normalizeCourseScope(course.courseScope);
    assertCanManageCourseScope(authCtx, courseScope);

    await p.query(
      `UPDATE courses
       SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP(3), deleted_by = ?, version = version + 1
       WHERE id = ? OR id = ?`,
      [authCtx.fullName, cBuf, courseId]
    );

    auditChain.appendEntry({
      eventType: 'ROLE_CHANGED',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `حذف منطقی امن (Soft Delete) ${courseScope === 'counseling_workshop' ? 'کارگاه آموزشی' : 'دوره'} [${course.title}] با تایید هویت دوعاملی توسط ${authCtx.fullName}.`,
      severity: 'warning',
    });

    outbox.enqueue('courses.deleted', {
      courseId,
      courseScope,
      title: course.title,
      deletedBy: authCtx.fullName,
    });

    return {
      success: true,
      message: `${courseScope === 'counseling_workshop' ? 'کارگاه' : 'دوره'} [${course.title}] با موفقیت حذف منطقی گردید و به بخش بایگانی امن انتقال یافت.`,
    };
  }

  async restoreCourse(
    authCtx: AuthContext,
    courseId: string
  ): Promise<{ success: boolean; message: string }> {
    ensureDatabaseConnection();

    const cBuf = toIdBuffer(courseId);
    const p = getPool();

    const rows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId]);
    if (!rows || rows.length === 0) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    const course = mapCourseRow(rows[0]);
    const courseScope = normalizeCourseScope(course.courseScope);
    assertCanManageCourseScope(authCtx, courseScope);

    await p.query(
      `UPDATE courses
       SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, version = version + 1
       WHERE id = ? OR id = ?`,
      [cBuf, courseId]
    );

    outbox.enqueue('courses.restored', {
      courseId,
      courseScope,
      title: course.title,
    });

    return {
      success: true,
      message: `${courseScope === 'counseling_workshop' ? 'کارگاه' : 'دوره'} [${course.title}] با موفقیت از بایگانی بازیابی شد.`,
    };
  }

  async sendCourseSms(
    authCtx: AuthContext,
    courseId: string,
    dto: { recipientPhone: string | 'all'; message: string; recipientName?: string }
  ): Promise<{ success: boolean; count: number; message: string }> {
    ensureDatabaseConnection();

    const cBuf = toIdBuffer(courseId);
    const rows = await selectWithTimeout<any>(`SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`, [cBuf, courseId]);
    if (!rows || rows.length === 0) throw AppError.notFound(`دوره با شناسه ${courseId}`);
    const course = mapCourseRow(rows[0]);
    assertCanManageCourseScope(authCtx, normalizeCourseScope(course.courseScope));

    if (!dto.message || !dto.message.trim()) {
      throw AppError.unprocessable('متن پیامک ارسالی نمی‌تواند خالی باشد.');
    }

    const enrollments = await this.getEnrollments(authCtx, courseId);
    let targetPhones: string[] = [];

    if (dto.recipientPhone === 'all') {
      targetPhones = Array.from(new Set(enrollments.map(e => e.userPhone).filter(Boolean)));
    } else {
      targetPhones = [dto.recipientPhone];
    }

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `ارسال پیامک اطلاع‌رسانی دوره [${course.title}] به ${targetPhones.length} نفر.`,
      severity: 'info',
    });

    return {
      success: true,
      count: targetPhones.length,
      message: `پیامک با موفقیت به ${targetPhones.length} شماره همراه تحویل داده شد.`,
    };
  }

  /**
   * Removes an enrolled/confirmed student from class access while strictly preserving all financial
   * transaction records, installment schedules, payment amounts, and bank receipts.
   */
  async removeEnrollmentFromClass(
    authCtx: AuthContext,
    courseId: string,
    enrollmentId: string,
    reason?: string,
    expectedVersion?: number
  ): Promise<{ enrollment: CourseEnrollment & { version: number }; course: Course & { version: number } }> {
    const courseScope = await assertCanManageCourseId(authCtx, courseId);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const cBuf = toIdBuffer(courseId);
    const eBuf = toIdBuffer(enrollmentId);

    const eRows = await selectWithTimeout<any>(
      `SELECT * FROM course_enrollments WHERE (id = ? OR id = ?) AND (course_id = ? OR course_id = ?) LIMIT 1`,
      [eBuf, enrollmentId, cBuf, courseId],
      3000
    );
    if (!eRows || eRows.length === 0) {
      throw AppError.notFound(`ثبت‌نام با شناسه ${enrollmentId}`);
    }
    const existing = mapEnrollmentRow(eRows[0]);
    if (existing.classStatus === 'removed') {
      throw AppError.conflict('این شرکت‌کننده پیش‌تر از کلاس حذف شده است.', 'ALREADY_REMOVED_FROM_CLASS');
    }

    if (expectedVersion === undefined || expectedVersion === null || isNaN(Number(expectedVersion))) {
      throw AppError.badRequest(
        'شناسه نسخه معتبر (expectedVersion یا هدر If-Match) الزامی است.',
        'VERSION_REQUIRED'
      );
    }

    const removalReason = (reason && reason.trim()) || 'حذف شرکت‌کننده از کلاس توسط مدیر آموزش (با حفظ کامل سوابق و تراکنش‌های مالی)';

    return await withTx(async (conn) => {
      const [res]: any = await conn.query(
        `UPDATE course_enrollments
         SET class_status = 'removed',
             removed_at = CURRENT_TIMESTAMP(3),
             removed_by = ?,
             removal_reason = ?,
             version = version + 1
         WHERE (id = ? OR id = ?) AND (course_id = ? OR course_id = ?) AND version = ?`,
        [authCtx.fullName, removalReason, eBuf, enrollmentId, cBuf, courseId, Number(expectedVersion)]
      );

      if (!res || res.affectedRows === 0) {
        throw AppError.conflict('اطلاعات ثبت‌نام توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      if (existing.paymentStatus === 'confirmed' || existing.paymentStatus === 'pending_review') {
        await conn.query(
          `UPDATE courses SET enrolled_count = GREATEST(0, enrolled_count - 1), version = version + 1 WHERE id = ? OR id = ?`,
          [cBuf, courseId]
        );
      }

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `حذف شرکت‌کننده [${existing.userName}] از کلاس دوره [${existing.courseTitle}] بدون حذف تراکنش‌های مالی (کد پیگیری: ${existing.trackingCode}). علت: ${removalReason}`,
        severity: 'warning',
      });

      const [updatedEnrRows]: any = await conn.query(
        `SELECT * FROM course_enrollments WHERE id = ? OR id = ? LIMIT 1`,
        [eBuf, enrollmentId]
      );
      const [updatedCourseRows]: any = await conn.query(
        `SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`,
        [cBuf, courseId]
      );
      const updatedEnrollment = redactNationalIdForUser(authCtx, mapEnrollmentRow(updatedEnrRows[0]));
      const updatedCourse = mapCourseRow(updatedCourseRows[0]);

      outbox.enqueue('courses.enrollment_removed', {
        courseId,
        courseScope,
        enrollmentId,
        userId: updatedEnrollment.userId,
        classStatus: 'removed',
      });

      return { enrollment: updatedEnrollment, course: updatedCourse };
    });
  }

  /**
   * Restores a previously removed participant back into the active class roster and capacity count.
   */
  async restoreEnrollmentToClass(
    authCtx: AuthContext,
    courseId: string,
    enrollmentId: string,
    expectedVersion?: number
  ): Promise<{ enrollment: CourseEnrollment & { version: number }; course: Course & { version: number } }> {
    const courseScope = await assertCanManageCourseId(authCtx, courseId);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const cBuf = toIdBuffer(courseId);
    const eBuf = toIdBuffer(enrollmentId);

    const eRows = await selectWithTimeout<any>(
      `SELECT * FROM course_enrollments WHERE (id = ? OR id = ?) AND (course_id = ? OR course_id = ?) LIMIT 1`,
      [eBuf, enrollmentId, cBuf, courseId],
      3000
    );
    if (!eRows || eRows.length === 0) {
      throw AppError.notFound(`ثبت‌نام با شناسه ${enrollmentId}`);
    }
    const existing = mapEnrollmentRow(eRows[0]);
    if (existing.classStatus !== 'removed') {
      throw AppError.conflict('این شرکت‌کننده در وضعیت فعال کلاس قرار دارد.', 'ALREADY_ACTIVE_IN_CLASS');
    }

    if (expectedVersion === undefined || expectedVersion === null || isNaN(Number(expectedVersion))) {
      throw AppError.badRequest(
        'شناسه نسخه معتبر (expectedVersion یا هدر If-Match) الزامی است.',
        'VERSION_REQUIRED'
      );
    }

    return await withTx(async (conn) => {
      const [res]: any = await conn.query(
        `UPDATE course_enrollments
         SET class_status = 'active',
             removed_at = NULL,
             removed_by = NULL,
             removal_reason = NULL,
             version = version + 1
         WHERE (id = ? OR id = ?) AND (course_id = ? OR course_id = ?) AND version = ?`,
        [eBuf, enrollmentId, cBuf, courseId, Number(expectedVersion)]
      );

      if (!res || res.affectedRows === 0) {
        throw AppError.conflict('اطلاعات ثبت‌نام توسط مدیر دیگری تغییر یافته است.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      if (existing.paymentStatus === 'confirmed' || existing.paymentStatus === 'pending_review') {
        await conn.query(
          `UPDATE courses SET enrolled_count = enrolled_count + 1, version = version + 1 WHERE id = ? OR id = ?`,
          [cBuf, courseId]
        );
      }

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `بازگردانی شرکت‌کننده [${existing.userName}] به کلاس فعال دوره [${existing.courseTitle}].`,
        severity: 'info',
      });

      const [updatedEnrRows]: any = await conn.query(
        `SELECT * FROM course_enrollments WHERE id = ? OR id = ? LIMIT 1`,
        [eBuf, enrollmentId]
      );
      const [updatedCourseRows]: any = await conn.query(
        `SELECT * FROM courses WHERE id = ? OR id = ? LIMIT 1`,
        [cBuf, courseId]
      );
      const updatedEnrollment = redactNationalIdForUser(authCtx, mapEnrollmentRow(updatedEnrRows[0]));
      const updatedCourse = mapCourseRow(updatedCourseRows[0]);

      outbox.enqueue('courses.enrollment_restored', {
        courseId,
        courseScope,
        enrollmentId,
        userId: updatedEnrollment.userId,
        classStatus: 'active',
      });

      return { enrollment: updatedEnrollment, course: updatedCourse };
    });
  }
}

function buildAuthCtx(u: any): AuthContext {
  return {
    userId: u.id,
    role: u.role,
    fullName: u.fullName,
    sectionPermissions: u.sectionPermissions,
  };
}

export function createCoursesRouter(): Router {
  const router = Router();
  const service = new CoursesService();

  // Register static-prefix sub-routers BEFORE parameterized /:id routes
  registerCourseDiscountsRoutes(router);
  registerCourseInstallmentsRoutes(router);

  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const includeDeleted = req.query.includeDeleted === 'true';
      const scopeFilter = req.query.scope as string | undefined;
      const items = await service.getAll(authCtx, includeDeleted, scopeFilter);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get('/enrollments', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const courseId = req.query.courseId as string | undefined;
      const items = await service.getEnrollments(authCtx, courseId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/enroll', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = { ...buildAuthCtx(u), nationalId: u.nationalId };
      const result = await service.enroll(authCtx, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const created = await service.createCourse(authCtx, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const expectedVersion = extractExpectedVersion(req, true);
      const updated = await service.updateCourse(authCtx, req.params.id, {
        ...req.body,
        expectedVersion,
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const pin = req.body?.pin || (req.headers['x-security-pin'] as string);
      const result = await service.softDeleteCourse(authCtx, req.params.id, pin);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/restore', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const result = await service.restoreCourse(authCtx, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/sms', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const result = await service.sendCourseSms(authCtx, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/enrollments/:id/status', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const { status, adminNote } = req.body;
      const expectedVersion = extractExpectedVersion(req, true);
      const updated = await service.reviewEnrollment(authCtx, req.params.id, status, adminNote, expectedVersion);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/enrollments/:enrollmentId/remove-from-class', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const expectedVersion = extractExpectedVersion(req, true);
      const result = await service.removeEnrollmentFromClass(
        authCtx,
        req.params.id,
        req.params.enrollmentId,
        req.body?.reason,
        expectedVersion
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/enrollments/:enrollmentId/restore-to-class', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx = buildAuthCtx(u);
      const expectedVersion = extractExpectedVersion(req, true);
      const result = await service.restoreEnrollmentToClass(
        authCtx,
        req.params.id,
        req.params.enrollmentId,
        expectedVersion
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  registerCourseOperationsRoutes(router);

  return router;
}

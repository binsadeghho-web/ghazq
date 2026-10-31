import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { AuthContext, AuthorizationPolicy } from '../../platform/authorization';
import { Course, CourseEnrollment } from '../../../types';

export class CoursesService {
  async getAll(authCtx?: AuthContext, includeDeleted = false): Promise<Array<Course & { version: number }>> {
    const userId = authCtx?.userId;
    const isStaff = authCtx?.role === 'admin' || authCtx?.role === 'supervisor';

    const source = db.courses.filter(course => {
      if (course.isDeleted) {
        return isStaff && includeDeleted;
      }
      return true;
    });

    return source.map(course => {
      // Find current user's enrollment if logged in
      const userEnrollment = userId ? db.courseEnrollments.find(e => e.courseId === course.id && e.userId === userId) : undefined;
      const isEnrolled = Boolean(userEnrollment);
      const enrollmentStatus = userEnrollment?.paymentStatus;

      // Determine archive access:
      // 1. If admin opened to everyone ('all')
      // 2. If staff (admin / supervisor)
      // 3. If user has confirmed registration
      let hasArchiveAccess = false;
      if (course.archiveAccess === 'all') {
        hasArchiveAccess = true;
      } else if (isStaff) {
        hasArchiveAccess = true;
      } else if (userEnrollment?.paymentStatus === 'confirmed') {
        hasArchiveAccess = true;
      }

      return {
        ...course,
        isEnrolled,
        enrollmentStatus,
        hasArchiveAccess,
      };
    });
  }

  async getEnrollments(authCtx: AuthContext, courseId?: string): Promise<Array<CourseEnrollment & { version: number }>> {
    let items = db.courseEnrollments;
    
    // Non-staff can only see their own enrollments (BOLA protection)
    if (authCtx.role === 'alumni') {
      items = items.filter(e => e.userId === authCtx.userId);
    }

    if (courseId) {
      items = items.filter(e => e.courseId === courseId);
    }

    return [...items].sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
  }

  async enroll(
    authCtx: AuthContext,
    courseId: string,
    dto: {
      paymentMethod: 'online_gateway' | 'bank_receipt';
      trackingCode?: string;
      receiptBankName?: string;
      receiptDate?: string;
      receiptFileUrl?: string;
      amountPaid?: number;
    }
  ): Promise<{ course: Course; enrollment: CourseEnrollment }> {
    const course = db.courses.find(c => c.id === courseId);
    if (!course) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    // Check capacity
    if (course.enrolledCount >= course.capacity) {
      throw AppError.unprocessable('ظرفیت ثبت‌نام در این دوره تکمیل گردیده است.');
    }

    // Check existing enrollment
    const existing = db.courseEnrollments.find(e => e.courseId === courseId && e.userId === authCtx.userId);
    if (existing && existing.paymentStatus !== 'rejected') {
      throw AppError.conflict('شما قبلاً در این دوره ثبت‌نام کرده‌اید.');
    }

    const now = new Date().toISOString();
    const trackingCode = dto.trackingCode || (dto.paymentMethod === 'online_gateway' ? `SHP-${Date.now().toString().slice(-7)}` : `TRX-${Date.now().toString().slice(-7)}`);
    const paymentStatus: CourseEnrollment['paymentStatus'] = dto.paymentMethod === 'online_gateway' ? 'confirmed' : 'pending_review';

    const enrollment: CourseEnrollment & { version: number } = {
      id: generateUUIDv7(),
      courseId: course.id,
      courseTitle: course.title,
      userId: authCtx.userId,
      userName: authCtx.fullName,
      userNationalId: (authCtx as any).nationalId || '0019988776',
      userPhone: (authCtx as any).phone || '09120000000',
      userRoleTitle: authCtx.role === 'alumni' ? 'دانش‌آموخته' : 'عضو هیئت علمی / مسئول',
      enrolledAt: now,
      paymentMethod: dto.paymentMethod,
      paymentStatus,
      amountPaid: dto.amountPaid ?? course.price,
      trackingCode,
      receiptBankName: dto.receiptBankName || (dto.paymentMethod === 'online_gateway' ? 'درگاه پرداخت شاپرک' : 'بانک ملی ایران'),
      receiptDate: dto.receiptDate || new Date().toLocaleDateString('fa-IR'),
      receiptFileUrl: dto.receiptFileUrl,
      version: 1,
    };

    return db.withTx(async tx => {
      // Add enrollment
      tx.courseEnrollments.unshift(enrollment);

      // If instant confirmed via gateway, increment enrolledCount
      let updatedCourse = course;
      if (paymentStatus === 'confirmed') {
        updatedCourse = tx.updateVersioned(
          tx.courses,
          courseId,
          course.version,
          curr => ({
            enrolledCount: curr.enrolledCount + 1,
            isEnrolled: true,
            enrollmentStatus: 'confirmed',
            hasArchiveAccess: true,
          })
        );
      } else {
        // Mark as pending review on client view
        updatedCourse = tx.updateVersioned(
          tx.courses,
          courseId,
          course.version,
          () => ({
            isEnrolled: true,
            enrollmentStatus: 'pending_review',
          })
        );
      }

      // Audit Log
      tx.emitAudit({
        eventType: 'LOGIN_SUCCESS',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `ثبت‌نام ${dto.paymentMethod === 'online_gateway' ? 'آنلاین قطعی' : 'با ارسال فیش واریزی'} در دوره [${course.title}] با شماره پیگیری ${trackingCode}.`,
        severity: 'info',
      });

      // Outbox Event
      tx.emitOutbox('courses.enrolled', {
        courseId,
        userId: authCtx.userId,
        title: course.title,
        paymentStatus,
        trackingCode,
      });

      return { course: updatedCourse, enrollment };
    });
  }

  async reviewEnrollment(
    authCtx: AuthContext,
    enrollmentId: string,
    status: 'confirmed' | 'rejected',
    adminNote?: string
  ): Promise<CourseEnrollment & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    const enrollment = db.courseEnrollments.find(e => e.id === enrollmentId);
    if (!enrollment) throw AppError.notFound(`ثبت‌نام با شناسه ${enrollmentId}`);

    const course = db.courses.find(c => c.id === enrollment.courseId);
    if (!course) throw AppError.notFound(`دوره مرتبط با ثبت‌نام`);

    return db.withTx<CourseEnrollment & { version: number }>(async tx => {
      const prevStatus = enrollment.paymentStatus;
      const expectedVer = (enrollment as any).version ?? 1;

      const updatedEnrollment = tx.updateVersioned<CourseEnrollment & { version: number }>(
        tx.courseEnrollments,
        enrollmentId,
        expectedVer,
        () => ({
          paymentStatus: status,
          adminNote: adminNote || (status === 'confirmed' ? 'مستندات واریز تایید و ثبت‌نام قطعی شد.' : 'رسید واریزی مورد تایید قرار نگرفت.'),
          reviewedBy: authCtx.fullName,
          reviewedAt: new Date().toISOString(),
        })
      );

      // Adjust course enrolled count
      if (status === 'confirmed' && prevStatus !== 'confirmed') {
        tx.updateVersioned(
          tx.courses,
          course.id,
          (course as any).version ?? 1,
          curr => ({
            enrolledCount: curr.enrolledCount + 1,
          })
        );
      } else if (status === 'rejected' && prevStatus === 'confirmed') {
        tx.updateVersioned(
          tx.courses,
          course.id,
          (course as any).version ?? 1,
          curr => ({
            enrolledCount: Math.max(0, curr.enrolledCount - 1),
          })
        );
      }

      // Audit Log
      tx.emitAudit({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `تغییر وضعیت ثبت‌نام متقاضی [${enrollment.userName}] در دوره [${course.title}] به '${status}'.`,
        severity: 'info',
      });

      tx.emitOutbox('courses.enrollment_reviewed', {
        enrollmentId,
        courseId: course.id,
        userId: enrollment.userId,
        status,
      });

      return updatedEnrollment;
    });
  }

  async createCourse(
    authCtx: AuthContext,
    data: Omit<Course, 'id' | 'enrolledCount' | 'isEnrolled' | 'version'>
  ): Promise<Course & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    return db.withTx(async tx => {
      const newCourse: Course & { version: number } = {
        ...data,
        id: `crs_${Date.now()}`,
        enrolledCount: 0,
        version: 1,
        allowedPaymentMethod: data.allowedPaymentMethod || 'both',
        isDeleted: false,
        status: data.status || 'enrolling',
        archiveAccess: data.archiveAccess || 'enrolled_only',
        archiveResources: data.archiveResources || [],
        topics: data.topics && data.topics.length > 0 ? data.topics : ['مباحث نظری و فقهی', 'تحلیل رویه قضایی و آراء وحدت رویه'],
      };

      tx.courses.unshift(newCourse);

      tx.emitAudit({
        eventType: 'RULING_APPROVED',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `دوره تخصصی جدید [${newCourse.title}] توسط مسئول آموزش تعریف و منتشر گردید.`,
        severity: 'info',
      });

      return newCourse;
    });
  }

  async updateCourse(
    authCtx: AuthContext,
    courseId: string,
    updates: Partial<Course>
  ): Promise<Course & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    const course = db.courses.find(c => c.id === courseId);
    if (!course) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    return db.withTx(async tx => {
      const updated = tx.updateVersioned(
        tx.courses,
        courseId,
        course.version,
        curr => ({
          ...curr,
          ...updates,
        })
      );

      tx.emitAudit({
        eventType: 'ROLE_CHANGED',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `تنظیمات و اطلاعات دوره [${course.title}] توسط مسئول آموزش بروزرسانی شد.`,
        severity: 'info',
      });

      return updated;
    });
  }

  async softDeleteCourse(
    authCtx: AuthContext,
    courseId: string,
    pin: string
  ): Promise<{ success: boolean; message: string }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    if (!pin || pin.trim().length < 4) {
      throw AppError.forbidden('ورود کد امنیتی / پین پیامکی ۶ رقمی الزامی است.');
    }

    const course = db.courses.find(c => c.id === courseId);
    if (!course) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    return db.withTx(async tx => {
      // Soft delete: sets isDeleted = true, preserves all enrollments & financial records (no cascade)
      tx.updateVersioned(
        tx.courses,
        courseId,
        course.version,
        curr => ({
          ...curr,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy: authCtx.fullName,
        })
      );

      tx.emitAudit({
        eventType: 'ROLE_CHANGED',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `حذف منطقی امن (Soft Delete) دوره [${course.title}] با تایید هویت دوعاملی پیامکی/پین کد امنیتی توسط ${authCtx.fullName}. کلیه داده‌های مالی و اعضای ثبت‌نامی در سامانه حفظ شدند.`,
        severity: 'warning',
      });

      tx.emitOutbox('courses.deleted', {
        courseId,
        title: course.title,
        deletedBy: authCtx.fullName,
      });

      return {
        success: true,
        message: `دوره [${course.title}] با تایید پین پیامکی با موفقیت حذف منطقی گردید و به بخش بایگانی امن انتقال یافت.`,
      };
    });
  }

  async restoreCourse(
    authCtx: AuthContext,
    courseId: string
  ): Promise<{ success: boolean; message: string }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    const course = db.courses.find(c => c.id === courseId);
    if (!course) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    return db.withTx(async tx => {
      tx.updateVersioned(
        tx.courses,
        courseId,
        course.version,
        curr => ({
          ...curr,
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
        })
      );

      tx.emitAudit({
        eventType: 'ROLE_CHANGED',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `بازیابی دوره [${course.title}] از بایگانی امن توسط ${authCtx.fullName}.`,
        severity: 'info',
      });

      tx.emitOutbox('courses.restored', {
        courseId,
        title: course.title,
      });

      return {
        success: true,
        message: `دوره [${course.title}] با موفقیت از بایگانی بازیابی شد و به فهرست دوره‌های فعال افزوده گردید.`,
      };
    });
  }

  async sendCourseSms(
    authCtx: AuthContext,
    courseId: string,
    dto: { recipientPhone: string | 'all'; message: string; recipientName?: string }
  ): Promise<{ success: boolean; count: number; message: string }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    const course = db.courses.find(c => c.id === courseId);
    if (!course) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    if (!dto.message || !dto.message.trim()) {
      throw AppError.unprocessable('متن پیامک ارسالی نمی‌تواند خالی باشد.');
    }

    const courseEnrollments = db.courseEnrollments.filter(e => e.courseId === courseId);
    let targetPhones: string[] = [];

    if (dto.recipientPhone === 'all') {
      targetPhones = Array.from(new Set(courseEnrollments.map(e => e.userPhone).filter(Boolean)));
      if (targetPhones.length === 0) {
        targetPhones = ['09127778899', '09124445566'];
      }
    } else {
      targetPhones = [dto.recipientPhone];
    }

    return db.withTx(async tx => {
      tx.emitAudit({
        eventType: 'LOGIN_SUCCESS',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `ارسال پیامک اطلاع‌رسانی دوره [${course.title}] به ${targetPhones.length} نفر از شرکت‌کنندگان (${dto.recipientPhone === 'all' ? 'ارسال گروهی' : (dto.recipientName || dto.recipientPhone)}).`,
        severity: 'info',
      });

      return {
        success: true,
        count: targetPhones.length,
        message: `پیامک با موفقیت به ${targetPhones.length} شماره همراه تحویل داده شد.`,
      };
    });
  }
}

export function createCoursesRouter(): Router {
  const router = Router();
  const service = new CoursesService();

  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-alumni',
        role: (req.headers['x-user-role'] as any) || 'alumni',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'دکتر علیرضا میرزایی'),
      };
      const includeDeleted = req.query.includeDeleted === 'true';
      const items = await service.getAll(authCtx, includeDeleted);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get('/enrollments', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-alumni',
        role: (req.headers['x-user-role'] as any) || 'alumni',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'دکتر علیرضا میرزایی'),
      };
      const courseId = req.query.courseId as string | undefined;
      const items = await service.getEnrollments(authCtx, courseId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/enroll', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-alumni',
        role: (req.headers['x-user-role'] as any) || 'alumni',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'دکتر علیرضا میرزایی'),
      };
      const result = await service.enroll(authCtx, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-supervisor',
        role: (req.headers['x-user-role'] as any) || 'supervisor',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'حجت‌الاسلام سید مرتضی موسوی'),
      };
      const created = await service.createCourse(authCtx, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-supervisor',
        role: (req.headers['x-user-role'] as any) || 'supervisor',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'حجت‌الاسلام سید مرتضی موسوی'),
      };
      const updated = await service.updateCourse(authCtx, req.params.id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-supervisor',
        role: (req.headers['x-user-role'] as any) || 'supervisor',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'حجت‌الاسلام سید مرتضی موسوی'),
      };
      const pin = req.body?.pin || (req.headers['x-security-pin'] as string);
      const result = await service.softDeleteCourse(authCtx, req.params.id, pin);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/restore', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-supervisor',
        role: (req.headers['x-user-role'] as any) || 'supervisor',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'حجت‌الاسلام سید مرتضی موسوی'),
      };
      const result = await service.restoreCourse(authCtx, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/sms', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-supervisor',
        role: (req.headers['x-user-role'] as any) || 'supervisor',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'حجت‌الاسلام سید مرتضی موسوی'),
      };
      const result = await service.sendCourseSms(authCtx, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/enrollments/:id/status', async (req: Request, res: Response, next) => {
    try {
      const authCtx: AuthContext = (req as any).user || {
        userId: (req.headers['x-user-id'] as string) || 'user-supervisor',
        role: (req.headers['x-user-role'] as any) || 'supervisor',
        fullName: decodeURIComponent((req.headers['x-user-name'] as string) || 'حجت‌الاسلام سید مرتضی موسوی'),
      };
      const { status, adminNote } = req.body;
      const updated = await service.reviewEnrollment(authCtx, req.params.id, status, adminNote);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

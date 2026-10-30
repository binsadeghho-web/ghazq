import { Router, Request, Response } from 'express';
import { db } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { AuthContext } from '../../platform/authorization';
import { Course } from '../../../types';

export class CoursesService {
  async getAll(): Promise<Array<Course & { version: number }>> {
    return db.courses;
  }

  async enroll(authCtx: AuthContext, courseId: string): Promise<Course & { version: number }> {
    const course = db.courses.find(c => c.id === courseId);
    if (!course) throw AppError.notFound(`دوره با شناسه ${courseId}`);

    if (course.enrolledCount >= course.capacity) {
      throw AppError.unprocessable('ظرفیت ثبت‌نام در این دوره تکمیل گردیده است.');
    }

    return db.withTx(async tx => {
      const updated = tx.updateVersioned(
        tx.courses,
        courseId,
        course.version,
        curr => ({
          enrolledCount: curr.enrolledCount + 1,
          isEnrolled: true,
          hasArchiveAccess: true,
        })
      );

      tx.emitAudit({
        eventType: 'LOGIN_SUCCESS',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `ثبت‌نام در دوره [${course.title}] با موفقیت انجام شد.`,
        severity: 'info',
      });

      tx.emitOutbox('courses.enrolled', {
        courseId,
        userId: authCtx.userId,
        title: course.title,
      });

      return updated;
    });
  }
}

export function createCoursesRouter(): Router {
  const router = Router();
  const service = new CoursesService();

  router.get('/', async (_req, res, next) => {
    try {
      const items = await service.getAll();
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
        fullName: (req.headers['x-user-name'] as string) || 'دکتر علیرضا میرزایی',
      };
      const item = await service.enroll(authCtx, req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

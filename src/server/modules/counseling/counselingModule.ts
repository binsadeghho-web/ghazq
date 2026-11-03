import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { outbox } from '../../platform/outbox';
import { auditChain } from '../../platform/auditChain';
import { AuthContext } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Consultant, CounselingRequest, CounselingCategory } from '../../../types';

export class CounselingService {
  async getConsultants(): Promise<Consultant[]> {
    return db.consultants;
  }

  async getRequests(authCtx: AuthContext): Promise<Array<CounselingRequest & { version: number }>> {
    const list = db.counselingRequests;
    if (authCtx.role === 'alumni') {
      return list.filter(r => r.applicantId === authCtx.userId);
    }
    return list;
  }

  async book(
    authCtx: AuthContext,
    dto: {
      category: CounselingCategory;
      categoryTitle: string;
      description: string;
      meetingMode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
      preferredConsultantId?: string;
      preferredConsultantName?: string;
    }
  ): Promise<CounselingRequest & { version: number }> {
    if (!dto.description) throw AppError.badRequest('شرح درخواست مشاوره الزامی است.');

    const id = generateUUIDv7();
    const newRequest: CounselingRequest & { version: number } = {
      id,
      applicantId: authCtx.userId,
      applicantName: authCtx.fullName,
      category: dto.category,
      categoryTitle: dto.categoryTitle,
      preferredConsultantId: dto.preferredConsultantId,
      preferredConsultantName: dto.preferredConsultantName,
      description: dto.description,
      meetingMode: dto.meetingMode,
      status: 'pending',
      createdAt: new Date().toISOString(),
      version: 1,
    };

    db.counselingRequests.unshift(newRequest);

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `درخواست مشاوره [${dto.categoryTitle}] با موفقیت ثبت گردید.`,
      severity: 'info',
    });

    outbox.enqueue('counseling.requested', {
      requestId: id,
      category: dto.category,
      applicantId: authCtx.userId,
    });

    return newRequest;
  }
}

export function createCounselingRouter(): Router {
  const router = Router();
  const service = new CounselingService();

  router.get('/consultants', async (_req, res, next) => {
    try {
      const items = await service.getConsultants();
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get('/requests', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const items = await service.getRequests(authCtx);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.post('/requests', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.book(authCtx, req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

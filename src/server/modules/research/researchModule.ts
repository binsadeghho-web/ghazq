import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { AuthorizationPolicy } from '../../platform/authorization';
import { User, ResearchMentorship } from '../../../types';

export const researchRouter = Router();
export function createResearchRouter(): Router {
  return researchRouter;
}

import { getCurrentUser } from '../../platform/sessionAuth';

function getAuthenticatedUser(req: Request): User {
  const u = getCurrentUser(req);
  const found = db.getState().users.find(user => user.id === u.id);
  return found || (u as any);
}

researchRouter.get('/', (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const state = db.getState();

  let mentorships = state.researchMentorships;
  if (currentUser.role === 'alumni') {
    mentorships = mentorships.filter(m => m.applicantId === currentUser.id);
  }

  res.json(mentorships);
});

researchRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { thesisTitle, field, stage, stageTitle, accommodationRequested, accommodationCity, assignedSupervisor } = req.body;

  if (!thesisTitle || !field) {
    throw AppError.badRequest('عنوان رساله و رشته تخصصی الزامی است.');
  }

  const id = generateUUIDv7();
  const now = new Date().toISOString();

  const newMentorship: ResearchMentorship & { version: number } = {
    id,
    applicantId: currentUser.id,
    applicantName: currentUser.fullName,
    thesisTitle,
    field,
    stage: stage || 'proposal',
    stageTitle: stageTitle || 'تصویب پروپوزال و تعیین استاد',
    progressPercent: 20,
    assignedSupervisor: assignedSupervisor || 'دکتر سید محمدمهدی میرباقری',
    accommodationRequested: Boolean(accommodationRequested),
    accommodationCity: accommodationCity || undefined,
    status: 'active',
    milestones: [
      { title: 'نگارش و ثبت طرح‌نامه (پروپوزال)', isDone: true, date: '۱۴۰۳/۰۴/۱۵' },
      { title: 'تأیید کمیته علمی و صدور ابلاغ استاد ناظر', isDone: true, date: '۱۴۰۳/۰۵/۲۰' },
      { title: 'تدوین فصل‌های نخستین و منابع فقهی', isDone: false, date: '۱۴۰۳/۰۸/۳۰' },
      { title: 'پیش‌دفاع و بررسی نهایی رساله', isDone: false, date: '۱۴۰۳/۱۱/۱۵' },
    ],
    version: 1,
    createdAt: now,
  };

  await db.withTx(async tx => {
    tx.researchMentorships.unshift(newMentorship);

    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت طرح پژوهشی رساله: ${thesisTitle}`,
      severity: 'info',
    });

    tx.emitOutbox('research.created', {
      projectId: id,
      applicantId: currentUser.id,
    });
  });

  res.status(201).json(newMentorship);
});

researchRouter.patch('/:id/progress', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { stage, stageTitle, progressPercent, expectedVersion } = req.body;

  let updatedRecord: any;

  await db.withTx(async tx => {
    const existing = tx.researchMentorships.find(m => m.id === req.params.id);
    if (!existing) throw AppError.notFound('طرح پژوهشی');

    AuthorizationPolicy.assertCanAccessResource(currentUser, { applicantId: existing.applicantId }, 'طرح پژوهشی');

    const targetVersion = typeof expectedVersion === 'number' ? expectedVersion : existing.version;

    updatedRecord = tx.updateVersioned(tx.researchMentorships, existing.id, targetVersion, () => ({
      stage,
      stageTitle,
      progressPercent,
    }));

    tx.emitOutbox('research.progress_updated', {
      projectId: existing.id,
      stage,
      progressPercent,
    });
  });

  res.json({ success: true, mentorship: updatedRecord });
});

import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { AuthorizationPolicy } from '../../platform/authorization';
import { User, JudicialRuling } from '../../../types';

export const rulingsRouter = Router();
export function createRulingsRouter(): Router {
  return rulingsRouter;
}

function getAuthenticatedUser(req: Request): User {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getState().users.find(u => u.id === userId);
  return user || db.getState().users[0];
}

rulingsRouter.get('/', (_req: Request, res: Response) => {
  res.json(db.rulings);
});

rulingsRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { title, courtBranch, judgeName, rulingDate, caseType, caseTypeTitle, summary, legalPrinciples, fullRulingText } = req.body;

  if (!title || !courtBranch || !summary || !fullRulingText) {
    throw AppError.badRequest('عنوان، شعبه صادرکننده، چکیده و متن کامل دادنامه الزامی است.');
  }

  const id = generateUUIDv7();
  const newRuling: JudicialRuling & { version: number } = {
    id,
    title,
    courtBranch,
    judgeName: judgeName || currentUser.fullName,
    rulingDate: rulingDate || '۱۴۰۳/۰۷/۰۱',
    caseType: caseType || 'commercial',
    caseTypeTitle: caseTypeTitle || 'حقوقی و تجاری',
    summary,
    legalPrinciples: legalPrinciples || ['اصل صحت قراردادها', 'قاعده لاضرر'],
    fullRulingText,
    status: currentUser.role === 'admin' ? 'selected' : 'pending_review',
    submittedById: currentUser.id,
    submittedByName: currentUser.fullName,
    likesCount: 0,
    likedBy: [],
    discussions: [],
    version: 1,
  };

  await db.withTx(async tx => {
    tx.rulings.unshift(newRuling);

    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت دادنامه جدید در تالار رأی قضایی: ${title}`,
      severity: 'info',
    });

    tx.emitOutbox('rulings.created', {
      rulingId: id,
      submittedById: currentUser.id,
    });
  });

  res.status(201).json(newRuling);
});

rulingsRouter.post('/:id/approve', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  AuthorizationPolicy.assertRole(currentUser, ['admin', 'supervisor']);

  let approvedRuling: any;

  await db.withTx(async tx => {
    const ruling = tx.rulings.find(r => r.id === req.params.id);
    if (!ruling) throw AppError.notFound('دادنامه');

    ruling.status = 'selected';
    ruling.version = (ruling.version || 1) + 1;

    tx.emitAudit({
      eventType: 'RULING_APPROVED',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `تأیید نهایی و انتشار عمومی دادنامه در تالار برگزیدگان: ${ruling.title}`,
      severity: 'info',
    });

    tx.emitOutbox('rulings.approved', {
      rulingId: ruling.id,
    });

    approvedRuling = ruling;
  });

  res.json({ success: true, ruling: approvedRuling });
});

rulingsRouter.post('/:id/discussion', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { comment } = req.body;

  if (!comment || !comment.trim()) {
    throw AppError.badRequest('متن نقد یا تحلیل فقهی-حقوقی الزامی است.');
  }

  const commentId = generateUUIDv7();
  const timestamp = new Date().toISOString();

  let updatedRuling: any;

  await db.withTx(async tx => {
    const ruling = tx.rulings.find(r => r.id === req.params.id);
    if (!ruling) throw AppError.notFound('دادنامه');

    const newDiscussion = {
      id: commentId,
      authorName: currentUser.fullName,
      authorRoleTitle: currentUser.roleTitle,
      comment: comment.trim(),
      timestamp,
    };

    ruling.discussions.push(newDiscussion);
    ruling.version = (ruling.version || 1) + 1;

    tx.emitOutbox('rulings.critique_added', {
      rulingId: ruling.id,
      commentId,
      authorId: currentUser.id,
    });

    updatedRuling = ruling;
  });

  res.json({ success: true, ruling: updatedRuling });
});

rulingsRouter.post('/:id/like', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);

  let updatedRuling: any;

  await db.withTx(async tx => {
    const ruling = tx.rulings.find(r => r.id === req.params.id);
    if (!ruling) throw AppError.notFound('دادنامه');

    const alreadyLiked = ruling.likedBy.includes(currentUser.id);
    if (alreadyLiked) {
      ruling.likedBy = ruling.likedBy.filter(id => id !== currentUser.id);
      ruling.likesCount = Math.max(0, ruling.likesCount - 1);
    } else {
      ruling.likedBy.push(currentUser.id);
      ruling.likesCount += 1;
    }
    ruling.version = (ruling.version || 1) + 1;

    updatedRuling = ruling;
  });

  res.json({ success: true, ruling: updatedRuling });
});

import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { User, SynergyPost } from '../../../types';

export const synergyRouter = Router();
export function createSynergyRouter(): Router {
  return synergyRouter;
}

function getAuthenticatedUser(req: Request): User {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getState().users.find(u => u.id === userId);
  return user || db.getState().users[0];
}

synergyRouter.get('/', (_req: Request, res: Response) => {
  res.json(db.synergyPosts);
});

synergyRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { title, content, provinceOrCity, category, categoryTitle, isEmpathy, urgency, isAnonymous } = req.body;

  if (!title || !content) {
    throw AppError.badRequest('عنوان و شرح درخواست هم‌افزایی الزامی است.');
  }

  const id = generateUUIDv7();
  const randCode = Math.floor(100 + Math.random() * 899);
  const pseudonym = isAnonymous ? `همکار قضایی (کد پیگیری: ${randCode})` : currentUser.fullName;
  const now = new Date().toISOString();

  const newPost: SynergyPost & { version: number } = {
    id,
    authorId: currentUser.id,
    authorPseudonym: pseudonym,
    isAnonymous: Boolean(isAnonymous),
    title,
    content,
    provinceOrCity: provinceOrCity || 'سراسری',
    category: category || 'administrative_help',
    categoryTitle: categoryTitle || 'همکاری و استعلام اداری-قضایی',
    isEmpathy: Boolean(isEmpathy),
    urgency: urgency || 'عادی',
    status: 'open',
    responses: [],
    version: 1,
    createdAt: now,
  };

  await db.withTx(async tx => {
    tx.synergyPosts.unshift(newPost);

    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: isAnonymous ? pseudonym : currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `انتشار در دیوار هم‌افزایی/همدلی (${isAnonymous ? 'ناشناس' : 'علنی'}): ${title}`,
      severity: 'info',
    });

    tx.emitOutbox('synergy.posted', {
      postId: id,
      isEmpathy: newPost.isEmpathy,
      provinceOrCity: newPost.provinceOrCity,
    });
  });

  res.status(201).json(newPost);
});

synergyRouter.post('/:id/respond', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { message, isPrivate, contactShared } = req.body;

  if (!message || !message.trim()) {
    throw AppError.badRequest('متن پیام الزامی است.');
  }

  const responseId = generateUUIDv7();
  const timestamp = new Date().toISOString();

  let updatedPost: any;

  await db.withTx(async tx => {
    const post = tx.synergyPosts.find(p => p.id === req.params.id);
    if (!post) throw AppError.notFound('درخواست هم‌افزایی');

    const randCode = Math.floor(100 + Math.random() * 899);
    const responderPseudonym = `همکار پاسخگو (${randCode})`;

    const responseItem = {
      id: responseId,
      responderId: currentUser.id,
      responderPseudonym,
      message: message.trim(),
      isPrivate: Boolean(isPrivate),
      contactShared: contactShared || undefined,
      timestamp,
    };

    post.responses.push(responseItem);
    post.version = (post.version || 1) + 1;

    tx.emitOutbox('synergy.responded', {
      postId: post.id,
      responseId,
    });

    updatedPost = post;
  });

  res.json({ success: true, post: updatedPost });
});

import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { getCurrentUser } from '../../platform/sessionAuth';
import { wallOwnershipRepo } from './wallOwnershipRepository';
import { SynergyPost } from '../../../types';

export const synergyRouter = Router();
export function createSynergyRouter(): Router {
  return synergyRouter;
}

// 1. Get public synergy wall posts (never returns authorId or personal identity)
synergyRouter.get('/', (_req: Request, res: Response) => {
  const sanitized = db.synergyPosts.map(p => {
    const { authorId: _strip, ...publicFields } = p as any;
    return publicFields;
  });
  res.json(sanitized);
});

// 2. Get "My Posts" - queried strictly through WallOwnershipRepository without joining public tables
synergyRouter.get('/my-posts', async (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const myPostIds = await wallOwnershipRepo.findPostIdsByUserId(currentUser.id);
  const myPosts = db.synergyPosts.filter(p => myPostIds.includes(p.id));
  res.json(myPosts);
});

// 3. Create Synergy Post (Records ownership in isolated wall_ownership table)
synergyRouter.post('/', idempotencyMiddleware, async (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { title, content, provinceOrCity, category, categoryTitle, isEmpathy, urgency, isAnonymous } = req.body;

  if (!title || !content) {
    throw AppError.badRequest('عنوان و شرح درخواست هم‌افزایی الزامی است.');
  }

  const id = generateUUIDv7();
  const randCode = Math.floor(100 + Math.random() * 899);
  const pseudonym = isAnonymous ? `همکار قضایی (کد پیگیری: ${randCode})` : currentUser.fullName;
  const now = new Date().toISOString();

  // Public post object: authorId is omitted
  const newPost: SynergyPost & { version: number } = {
    id,
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

    // Record ownership in isolated repository (Item 7)
    await wallOwnershipRepo.recordOwnership(id, currentUser.id);

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

// 4. Respond to Post (Anonymized responses with pseudonym)
synergyRouter.post('/:id/respond', async (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
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

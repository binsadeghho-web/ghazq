import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { User, WelfareRequest, ConsumableOrder, MemberProductProposal } from '../../../types';

export const welfareRouter = Router();
export function createWelfareRouter(): Router {
  return welfareRouter;
}

function getAuthenticatedUser(req: Request): User {
  const userId = req.headers['x-user-id'] as string;
  const user = db.getState().users.find(u => u.id === userId);
  return user || db.getState().users[0];
}

welfareRouter.get('/requests', (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  let requests = db.welfareRequests;
  if (currentUser.role === 'alumni') {
    requests = requests.filter(r => r.applicantId === currentUser.id);
  }
  res.json(requests);
});

welfareRouter.get('/consumables', (_req: Request, res: Response) => {
  res.json(db.consumables);
});

welfareRouter.get('/orders', (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  let orders = db.consumableOrders;
  if (currentUser.role === 'alumni') {
    orders = orders.filter(o => o.applicantId === currentUser.id);
  }
  res.json(orders);
});

welfareRouter.get('/proposals', (_req: Request, res: Response) => {
  res.json(db.productProposals);
});

welfareRouter.post('/requests', idempotencyMiddleware, async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { type, typeTitle, title, requestedValue, description } = req.body;

  if (!title || !requestedValue) {
    throw AppError.badRequest('عنوان تسهیلات و مقدار درخواستی الزامی است.');
  }

  const id = generateUUIDv7();
  const now = new Date().toISOString();

  const newRequest: WelfareRequest & { version: number } = {
    id,
    type: type || 'loan',
    typeTitle: typeTitle || 'وام قرض‌الحسنه',
    applicantId: currentUser.id,
    applicantName: currentUser.fullName,
    title,
    requestedValue,
    description: description || '',
    rulesAcknowledged: true,
    status: 'pending',
    version: 1,
    createdAt: now,
  };

  await db.withTx(async tx => {
    tx.welfareRequests.unshift(newRequest);

    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت تقاضای تسهیلات رفاهی: ${title} (${requestedValue})`,
      severity: 'info',
    });

    tx.emitOutbox('welfare.requested', {
      requestId: id,
      applicantId: currentUser.id,
      type: newRequest.type,
    });
  });

  res.status(201).json(newRequest);
});

welfareRouter.post('/orders', idempotencyMiddleware, async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { items, totalAmount, deliveryAddress } = req.body;

  if (!items || !items.length || !deliveryAddress) {
    throw AppError.badRequest('سبد اقلام و نشانی تحویل الزامی است.');
  }

  const id = generateUUIDv7();
  const now = new Date().toISOString();

  const newOrder: ConsumableOrder & { version: number } = {
    id,
    applicantId: currentUser.id,
    applicantName: currentUser.fullName,
    items,
    totalAmount: Math.round(Number(totalAmount) || 0),
    deliveryAddress,
    status: 'registered',
    version: 1,
    createdAt: now,
  };

  await db.withTx(async tx => {
    tx.consumableOrders.unshift(newOrder);

    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت سفارش تعاونی مصرف به مبلغ ${newOrder.totalAmount} تومان`,
      severity: 'info',
    });

    tx.emitOutbox('welfare.order_placed', {
      orderId: id,
      userId: currentUser.id,
      totalAmount: newOrder.totalAmount,
    });
  });

  res.status(201).json(newOrder);
});

welfareRouter.post('/proposals', idempotencyMiddleware, async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { productName, offeredPrice, marketPrice, supplierDetails, description } = req.body;

  if (!productName || !offeredPrice) {
    throw AppError.badRequest('نام محصول و قیمت پیشنهادی الزامی است.');
  }

  const id = generateUUIDv7();
  const now = new Date().toISOString();

  const newProposal: MemberProductProposal & { version: number } = {
    id,
    proposerId: currentUser.id,
    proposerName: currentUser.fullName,
    productName,
    offeredPrice: Math.round(Number(offeredPrice) || 0),
    marketPrice: Math.round(Number(marketPrice) || 0),
    supplierDetails: supplierDetails || '',
    description: description || '',
    status: 'under_evaluation',
    version: 1,
    createdAt: now,
  };

  await db.withTx(async tx => {
    tx.productProposals.unshift(newProposal);

    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `پیشنهاد عرضه محصول در تعاونی دانش‌آموختگان: ${productName}`,
      severity: 'info',
    });

    tx.emitOutbox('welfare.proposal_submitted', {
      proposalId: id,
      proposerId: currentUser.id,
    });
  });

  res.status(201).json(newProposal);
});

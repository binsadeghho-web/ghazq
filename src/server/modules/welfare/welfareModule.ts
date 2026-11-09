import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { User, WelfareRequest, ConsumableOrder, MemberProductProposal } from '../../../types';

export const welfareRouter = Router();
export function createWelfareRouter(): Router {
  return welfareRouter;
}

import { getCurrentUser } from '../../platform/sessionAuth';

function getAuthenticatedUser(req: Request): User {
  const u = getCurrentUser(req);
  const found = db.getState().users.find(user => user.id === u.id);
  return found || (u as any);
}

welfareRouter.get('/requests', (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  let requests = db.welfareRequests;
  if (currentUser.role === 'alumni') {
    requests = requests.filter(r => r.applicantId === currentUser.id);
  }
  res.json(requests);
});

welfareRouter.get('/requests/:id', (req: Request, res: Response) => {
  const item = db.welfareRequests.find(r => r.id === req.params.id);
  if (!item) throw AppError.notFound('درخواست تسهیلات');
  res.json(item);
});

welfareRouter.put('/requests/:id', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  const { title, requestedValue, description, typeTitle, expectedVersion, _baseVersion } = req.body;

  let updatedRecord: any;

  await db.withTx(async tx => {
    const existing = tx.welfareRequests.find(r => r.id === req.params.id);
    if (!existing) throw AppError.notFound('درخواست تسهیلات');

    const targetVersion = typeof expectedVersion === 'number' ? expectedVersion : typeof _baseVersion === 'number' ? _baseVersion : existing.version;

    updatedRecord = tx.updateVersioned(tx.welfareRequests, existing.id, targetVersion, current => ({
      ...current,
      title: title !== undefined ? title.trim() : current.title,
      requestedValue: requestedValue !== undefined ? requestedValue.trim() : current.requestedValue,
      description: description !== undefined ? description.trim() : current.description,
      typeTitle: typeTitle !== undefined ? typeTitle.trim() : current.typeTitle,
    }));
  });

  res.json(updatedRecord);
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

welfareRouter.post('/consumables', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw AppError.forbidden('فقط ادمین می‌تواند کالای جدید تعریف کند.');
  }
  const id = generateUUIDv7();
  const newItem = {
    ...req.body,
    id,
    version: 1,
  };
  await db.withTx(async tx => {
    tx.consumables.unshift(newItem);
    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `افزودن کالای تعاونی: ${newItem.title}`,
      severity: 'info',
    });
  });
  res.status(201).json(newItem);
});

welfareRouter.put('/consumables/:id', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw AppError.forbidden('فقط ادمین می‌تواند کالای تعاونی را ویرایش کند.');
  }
  const { id } = req.params;
  let updatedItem: any = null;
  await db.withTx(async tx => {
    const idx = tx.consumables.findIndex(c => c.id === id);
    if (idx === -1) throw AppError.notFound('کالای مورد نظر یافت نشد.');
    tx.consumables[idx] = {
      ...tx.consumables[idx],
      ...req.body,
      id,
      version: (tx.consumables[idx].version || 1) + 1,
    };
    updatedItem = tx.consumables[idx];
    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ویرایش کالای تعاونی: ${updatedItem.title}`,
      severity: 'info',
    });
  });
  res.json(updatedItem);
});

welfareRouter.delete('/consumables/:id', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw AppError.forbidden('فقط ادمین می‌تواند کالای تعاونی را حذف کند.');
  }
  const { id } = req.params;
  await db.withTx(async tx => {
    const idx = tx.consumables.findIndex(c => c.id === id);
    if (idx !== -1) {
      const removed = tx.consumables.splice(idx, 1)[0];
      tx.emitAudit({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        ip: req.ip || '127.0.0.1',
        details: `حذف کالای تعاونی: ${removed.title}`,
        severity: 'info',
      });
    }
  });
  res.json({ success: true });
});

welfareRouter.patch('/orders/:id/status', async (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw AppError.forbidden('فقط ادمین می‌تواند وضعیت سفارش را تغییر دهد.');
  }
  const { id } = req.params;
  const { status, notes } = req.body;
  let updatedOrder: any = null;
  await db.withTx(async tx => {
    const idx = tx.consumableOrders.findIndex(o => o.id === id);
    if (idx === -1) throw AppError.notFound('سفارش یافت نشد.');
    tx.consumableOrders[idx] = {
      ...tx.consumableOrders[idx],
      status: status || tx.consumableOrders[idx].status,
      notes: notes !== undefined ? notes : (tx.consumableOrders[idx] as any).notes,
      version: (tx.consumableOrders[idx].version || 1) + 1,
    };
    updatedOrder = tx.consumableOrders[idx];
    tx.emitAudit({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `تغییر وضعیت سفارش تعاونی ${id} به ${status}`,
      severity: 'info',
    });
  });
  res.json(updatedOrder);
});

// GET & PUT welfare sections configuration
welfareRouter.get('/sections-config', (_req: Request, res: Response) => {
  res.json(db.welfareSectionsConfig);
});

welfareRouter.put('/sections-config', (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw AppError.forbidden('تنها مدیر می‌تواند دسته‌بندی‌ها و بخش‌های رفاهیات را ویرایش کند.');
  }
  const configs = req.body;
  if (!Array.isArray(configs)) {
    throw AppError.badRequest('پیکربندی بخش‌ها باید به صورت آرایه باشد.');
  }
  db.welfareSectionsConfig = configs;
  res.json({ success: true, data: db.welfareSectionsConfig });
});

// GET & PUT loan fund terms & rules
welfareRouter.get('/loan-rules', (_req: Request, res: Response) => {
  res.json(db.loanTermsAndRules);
});

welfareRouter.put('/loan-rules', (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw AppError.forbidden('تنها مدیر سامانه مجاز به ویرایش اساسنامه و شرایط تسهیلات است.');
  }
  const rules = req.body;
  if (!rules || !rules.fundName) {
    throw AppError.badRequest('اطلاعات ضوابط و اساسنامه نامعتبر است.');
  }
  db.loanTermsAndRules = rules;
  res.json({ success: true, data: db.loanTermsAndRules });
});

// GET & PUT cooperative section info
welfareRouter.get('/cooperative-info', (_req: Request, res: Response) => {
  res.json(db.cooperativeSectionInfo);
});

welfareRouter.put('/cooperative-info', (req: Request, res: Response) => {
  const currentUser = getAuthenticatedUser(req);
  if (currentUser.role !== 'admin' && currentUser.role !== 'supervisor') {
    throw AppError.forbidden('تنها مدیر سامانه مجاز به تغییر اطلاعات ویترین تعاونی است.');
  }
  const info = req.body;
  if (!info || !info.title) {
    throw AppError.badRequest('اطلاعات تعاونی ناقص است.');
  }
  db.cooperativeSectionInfo = info;
  res.json({ success: true, data: db.cooperativeSectionInfo });
});

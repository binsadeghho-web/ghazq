import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, withTx, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { idempotencyMiddleware } from '../../platform/idempotency';
import { WelfareRequest, ConsumableOrder, MemberProductProposal, ConsumableItem } from '../../../types';
import { getCurrentUser } from '../../platform/sessionAuth';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { adminSettingsRepo } from '../admin/adminSettingsRepository';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { isOrganizationalUserRole } from '../../platform/authorization';
import { registerWelfareExtendedRoutes } from './welfareExtendedRoutes';

export const welfareRouter = Router();
export function createWelfareRouter(): Router {
  return welfareRouter;
}

function safeParseJson<T>(raw: any, fallback: T): T {
  if (raw === undefined || raw === null) return fallback;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function mapWelfareRequestRow(row: any): WelfareRequest & { version: number; updatedAt?: string } {
  const metadata = safeParseJson<Record<string, any> | undefined>(row.metadata, undefined);
  return {
    id: fromIdBuffer(row.id),
    type: row.type || 'loan',
    typeTitle: row.type_title || row.typeTitle || 'تسهیلات',
    applicantId: fromIdBuffer(row.applicant_id || row.applicantId),
    applicantName: row.applicant_name || row.applicantName || '',
    title: row.title || '',
    requestedValue: row.requested_value || row.requestedValue || '',
    description: row.description || '',
    rulesAcknowledged: row.rules_acknowledged !== undefined ? Boolean(row.rules_acknowledged) : true,
    status: row.status || 'pending',
    adminNote: row.admin_note || row.adminNote || undefined,
    metadata,
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapConsumableRow(row: any): ConsumableItem & { version: number; lowStockThreshold?: number } {
  const price = Number(row.price ?? row.cooperative_price ?? row.cooperativePrice ?? 0);
  const parsedDelivery = safeParseJson<Array<'in_person' | 'post' | 'courier'>>(
    row.allowed_delivery_methods,
    ['in_person', 'post', 'courier']
  );
  return {
    id: fromIdBuffer(row.id),
    title: row.title || '',
    name: row.title || '',
    category: row.category || 'عمومی',
    cooperativePrice: price,
    memberPrice: price,
    marketPrice: Number(row.market_price ?? row.marketPrice ?? Math.round(price * 1.2)),
    unit: row.unit || 'عدد',
    stock: Number(row.stock || 0),
    lowStockThreshold: Number(row.low_stock_threshold ?? 5),
    imageUrl: row.image_url || row.imageUrl || undefined,
    description: row.description || '',
    visibleToCustomer: row.visible_to_customer !== undefined ? Boolean(row.visible_to_customer) : true,
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
    showAsSoldOutInShowcase: row.show_as_sold_out_in_showcase !== undefined ? Boolean(row.show_as_sold_out_in_showcase) : false,
    allowedDeliveryMethods: Array.isArray(parsedDelivery) && parsedDelivery.length > 0 ? parsedDelivery : ['in_person', 'post', 'courier'],
    version: Number(row.version || 1),
  };
}

function mapConsumableOrderRow(row: any): ConsumableOrder & { version: number; trackingCode?: string; postalTrackingCode?: string; shippingStatus?: string; paymentStatus?: string } {
  const items = safeParseJson<any[]>(row.items, []);
  let mappedStatus: ConsumableOrder['status'] = 'prepared';
  if (row.status === 'ثبت شده' || row.status === 'registered') mappedStatus = 'registered';
  else if (row.status === 'تحویل داده شد' || row.status === 'delivered') mappedStatus = 'delivered';
  else if (row.status === 'ارسال شده' || row.status === 'dispatched') mappedStatus = 'dispatched';
  else if (row.status === 'لغو شده' || row.status === 'cancelled') mappedStatus = 'cancelled';

  return {
    id: fromIdBuffer(row.id),
    applicantId: fromIdBuffer(row.user_id || row.applicant_id || row.applicantId),
    applicantName: row.user_name || row.applicant_name || row.applicantName || '',
    items,
    totalAmount: Math.round(Number(row.total_price ?? row.totalAmount ?? 0)),
    deliveryAddress: row.delivery_address || row.deliveryAddress || '',
    deliveryMethod: (row.delivery_method || 'post') as any,
    status: mappedStatus,
    notes: row.payment_status || row.notes || undefined,
    paymentStatus: row.payment_status || 'در انتظار پرداخت',
    trackingCode: row.tracking_code || row.trackingCode || undefined,
    postalTrackingCode: row.postal_tracking_code || undefined,
    shippingStatus: row.shipping_status || 'در حال آماده‌سازی',
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

function mapProductProposalRow(row: any): MemberProductProposal & { version: number } {
  return {
    id: fromIdBuffer(row.id),
    proposerId: fromIdBuffer(row.applicant_id || row.proposer_id || row.proposerId),
    proposerName: row.applicant_name || row.proposer_name || row.proposerName || '',
    productName: row.title || row.product_name || row.productName || '',
    offeredPrice: Number(row.offered_price ?? row.offeredPrice ?? 0),
    marketPrice: Number(row.market_price ?? row.marketPrice ?? 0),
    supplierDetails: row.author_or_translator || row.supplier_details || row.supplierDetails || '',
    description: row.description || '',
    status: row.status === 'در حال بررسی' || row.status === 'under_evaluation' ? 'under_evaluation' : row.status === 'تایید شده' || row.status === 'approved_for_procurement' ? 'approved_for_procurement' : 'rejected',
    version: Number(row.version || 1),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

welfareRouter.get('/requests', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    let sql = `SELECT * FROM welfare_requests WHERE 1=1`;
    const params: any[] = [];

    if (currentUser.role === 'alumni' || currentUser.role === 'customer') {
      sql += ` AND (applicant_id = ? OR applicant_id = ?)`;
      params.push(toIdBuffer(currentUser.id), currentUser.id);
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = await selectWithTimeout<any>(sql, params, 4000);
    res.json((rows || []).map(mapWelfareRequestRow));
  } catch (err) {
    next(err);
  }
});

welfareRouter.get('/requests/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const idBuf = toIdBuffer(req.params.id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM welfare_requests WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!rows || rows.length === 0) throw AppError.notFound('درخواست تسهیلات');
    res.json(mapWelfareRequestRow(rows[0]));
  } catch (err) {
    next(err);
  }
});

welfareRouter.put('/requests/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const { title, requestedValue, description, typeTitle, status, adminNote } = req.body || {};
    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM welfare_requests WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('درخواست تسهیلات');
    const existing = mapWelfareRequestRow(existingRows[0]);

    const isAdmin = isOrganizationalUserRole(currentUser.role);
    if ((status !== undefined || adminNote !== undefined) && !isAdmin) {
      throw AppError.forbidden('فقط مدیر سامانه مجاز به تغییر وضعیت یا ثبت نظر کارشناسی است.');
    }
    if (!isAdmin && existing.applicantId !== currentUser.id) {
      throw AppError.forbidden('فقط مالک درخواست مجاز به ویرایش درخواست خود است.');
    }

    const newTitle = title !== undefined ? String(title).trim() : existing.title;
    const newReqVal = requestedValue !== undefined ? String(requestedValue).trim() : existing.requestedValue;
    const newDesc = description !== undefined ? String(description).trim() : existing.description;
    const newTypeTitle = typeTitle !== undefined ? String(typeTitle).trim() : existing.typeTitle;
    const newStatus = status !== undefined ? status : existing.status;
    const newAdminNote = adminNote !== undefined ? (adminNote ? String(adminNote).trim() : null) : (existing.adminNote || null);

    const hasExplicitVersion =
      req.body?.expectedVersion !== undefined ||
      req.body?.version !== undefined ||
      Boolean(req.headers['if-match']);
    const expVer = hasExplicitVersion ? extractExpectedVersion(req, true) : existing.version;

    const [result]: any = await p.query(
      `UPDATE welfare_requests
       SET title = ?, requested_value = ?, description = ?, type_title = ?, status = ?, admin_note = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ?`,
      [newTitle, newReqVal, newDesc, newTypeTitle, newStatus, newAdminNote, idBuf, req.params.id, expVer]
    );

    if (result && result.affectedRows === 0) {
      throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    const updatedRows = await selectWithTimeout<any>(`SELECT * FROM welfare_requests WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const finalReq = mapWelfareRequestRow(updatedRows[0]);

    outbox.enqueue('welfare.updated', {
      id: finalReq.id,
      resourceId: finalReq.id,
      requestId: finalReq.id,
      version: finalReq.version,
      updates: finalReq,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
    });

    res.json(finalReq);
  } catch (err) {
    next(err);
  }
});

welfareRouter.get('/consumables', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const isAdmin = isOrganizationalUserRole(currentUser.role);
    let sql = `SELECT * FROM consumables WHERE 1=1`;
    if (!isAdmin) {
      sql += ` AND (is_active = 1 OR is_active IS NULL)`;
    }
    if (currentUser.role === 'customer') {
      sql += ` AND (visible_to_customer = 1 OR visible_to_customer IS NULL)`;
    }
    sql += ` ORDER BY created_at DESC`;
    const rows = await selectWithTimeout<any>(sql, [], 3000);
    res.json((rows || []).map(mapConsumableRow));
  } catch (err) {
    next(err);
  }
});

welfareRouter.get('/orders', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    let sql = `SELECT * FROM consumable_orders WHERE 1=1`;
    const params: any[] = [];

    if (currentUser.role === 'alumni' || currentUser.role === 'customer') {
      sql += ` AND (user_id = ? OR user_id = ?)`;
      params.push(toIdBuffer(currentUser.id), currentUser.id);
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = await selectWithTimeout<any>(sql, params, 4000);
    res.json((rows || []).map(mapConsumableOrderRow));
  } catch (err) {
    next(err);
  }
});

welfareRouter.get('/proposals', async (_req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const rows = await selectWithTimeout<any>(`SELECT * FROM product_proposals ORDER BY created_at DESC`, [], 3000);
    res.json((rows || []).map(mapProductProposalRow));
  } catch (err) {
    next(err);
  }
});

welfareRouter.post('/requests', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const { type, typeTitle, title, requestedValue, description, metadata } = req.body;

    if (!title || !requestedValue) {
      throw AppError.badRequest('عنوان تسهیلات و مقدار درخواستی الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();
    const now = new Date().toISOString();

    await p.query(
      `INSERT INTO welfare_requests (
        id, type, type_title, applicant_id, applicant_name, title, requested_value, description, metadata, rules_acknowledged, status, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', 1)`,
      [
        idBuf,
        type || 'emergency_loan',
        typeTitle || 'تسهیلات اضطراری',
        uBuf,
        currentUser.fullName,
        String(title).trim(),
        String(requestedValue).trim(),
        description ? String(description).trim() : '',
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت تقاضای تسهیلات رفاهی: ${title} (${requestedValue})`,
      severity: 'info',
    });

    outbox.enqueue('welfare.requested', {
      requestId: id,
      applicantId: currentUser.id,
      type: type || 'emergency_loan',
    });

    const newRequest: WelfareRequest & { version: number } = {
      id,
      type: type || 'emergency_loan',
      typeTitle: typeTitle || 'تسهیلات اضطراری',
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      title: String(title).trim(),
      requestedValue: String(requestedValue).trim(),
      description: description ? String(description).trim() : '',
      metadata: metadata || undefined,
      rulesAcknowledged: true,
      status: 'pending',
      version: 1,
      createdAt: now,
    };

    res.status(201).json(newRequest);
  } catch (err) {
    next(err);
  }
});

welfareRouter.post('/orders', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    const { items, totalAmount, deliveryAddress, deliveryMethod } = req.body;

    const cleanDeliveryMethod =
      deliveryMethod === 'in_person' || deliveryMethod === 'courier' || deliveryMethod === 'post'
        ? deliveryMethod
        : 'post';
    const resolvedAddress =
      String(deliveryAddress || '').trim() ||
      (cleanDeliveryMethod === 'in_person' ? 'تحویل حضوری در دفتر امور رفاهی مجتمع' : '');

    if (!items || !items.length || !resolvedAddress) {
      throw AppError.badRequest('سبد اقلام و نشانی تحویل الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const uBuf = toIdBuffer(currentUser.id);
    const trackingCode = `ORD-${Date.now().toString().slice(-7)}`;
    const now = new Date().toISOString();

    const computedTotal = items.reduce(
      (sum: number, it: any) => sum + Number(it.unitPrice || it.price || 0) * Number(it.quantity || 1),
      0
    );
    const price = Math.round(Number(totalAmount) || computedTotal || 0);

    await withTx(async (conn) => {
      for (const orderItem of items) {
        const itemId = orderItem.itemId || orderItem.id;
        const qty = Math.max(1, Number(orderItem.quantity || 1));
        if (itemId) {
          const itemBuf = toIdBuffer(itemId);
          const [stockDec]: any = await conn.query(
            `UPDATE consumables
             SET stock = stock - ?, version = version + 1
             WHERE (id = ? OR id = ?)
               AND stock >= ?
               AND (is_active = 1 OR is_active IS NULL)
               AND (show_as_sold_out_in_showcase = 0 OR show_as_sold_out_in_showcase IS NULL)`,
            [qty, itemBuf, itemId, qty]
          );
          if (!stockDec || stockDec.affectedRows === 0) {
            const title = orderItem.title || orderItem.name || 'کالای انتخابی';
            throw AppError.conflict(
              `موجودی کالا به پایان رسیده یا غیرفعال است (کالای «${title}»).`,
              'CONSUMABLE_OUT_OF_STOCK'
            );
          }
        }
      }

      await conn.query(
        `INSERT INTO consumable_orders (
          id, user_id, user_name, user_phone, items, total_price, delivery_address, delivery_method, status, payment_status, tracking_code, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ثبت شده', 'در انتظار تایید و تحویل', ?, 1)`,
        [
          idBuf,
          uBuf,
          currentUser.fullName,
          (currentUser as any).phone || '09120000000',
          JSON.stringify(items),
          price,
          resolvedAddress,
          cleanDeliveryMethod,
          trackingCode,
        ]
      );
    });

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ثبت سفارش اقلام مصرفی به مبلغ ${price} تومان (${cleanDeliveryMethod})`,
      severity: 'info',
    });

    outbox.enqueue('welfare.order_placed', {
      orderId: id,
      userId: currentUser.id,
      totalAmount: price,
    });

    const newOrder: ConsumableOrder & { version: number } = {
      id,
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      items,
      totalAmount: price,
      deliveryAddress: resolvedAddress,
      deliveryMethod: cleanDeliveryMethod,
      trackingCode,
      shippingStatus: 'در حال آماده‌سازی',
      paymentStatus: 'در انتظار تایید و تحویل',
      status: 'registered',
      version: 1,
      createdAt: now,
    };

    res.status(201).json(newOrder);
  } catch (err) {
    next(err);
  }
});

welfareRouter.post('/proposals', idempotencyMiddleware, async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    const currentUser = getCurrentUser(req);
    const { productName, offeredPrice, marketPrice, supplierDetails, description } = req.body;

    if (!productName) {
      throw AppError.badRequest('نام محصول الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const uBuf = toIdBuffer(currentUser.id);
    const p = getPool();
    const now = new Date().toISOString();

    await p.query(
      `INSERT INTO product_proposals (
        id, applicant_id, applicant_name, title, author_or_translator, description, status, version
      ) VALUES (?, ?, ?, ?, ?, ?, 'در حال بررسی', 1)`,
      [
        idBuf,
        uBuf,
        currentUser.fullName,
        productName,
        supplierDetails || 'پیشنهاد اعضا',
        description || '',
      ]
    );

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `پیشنهاد عرضه محصول در تعاونی دانش‌آموختگان: ${productName}`,
      severity: 'info',
    });

    outbox.enqueue('welfare.proposal_submitted', {
      proposalId: id,
      proposerId: currentUser.id,
    });

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

    res.status(201).json(newProposal);
  } catch (err) {
    next(err);
  }
});

welfareRouter.post('/consumables', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    if (!isOrganizationalUserRole(currentUser.role)) {
      throw AppError.forbidden('فقط ادمین می‌تواند کالای جدید تعریف کند.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const p = getPool();
    const priceVal = Number(req.body.cooperativePrice ?? req.body.price ?? 0);
    const marketVal = Number(req.body.marketPrice ?? Math.round(priceVal * 1.25));
    const allowedMethods = Array.isArray(req.body.allowedDeliveryMethods) && req.body.allowedDeliveryMethods.length > 0
      ? req.body.allowedDeliveryMethods
      : ['in_person', 'post', 'courier'];

    await p.query(
      `INSERT INTO consumables (
        id, title, price, market_price, unit, stock, low_stock_threshold, category, image_url, description,
        visible_to_customer, is_active, show_as_sold_out_in_showcase, allowed_delivery_methods, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        idBuf,
        String(req.body.title || '').trim(),
        priceVal,
        marketVal,
        req.body.unit || 'عدد',
        Math.max(0, Number(req.body.stock || 0)),
        Math.max(1, Number(req.body.lowStockThreshold || 5)),
        req.body.category || 'عمومی',
        req.body.imageUrl || null,
        req.body.description || null,
        req.body.visibleToCustomer !== false ? 1 : 0,
        req.body.isActive !== false ? 1 : 0,
        req.body.showAsSoldOutInShowcase ? 1 : 0,
        JSON.stringify(allowedMethods),
      ]
    );

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `افزودن کالای مصرفی: ${req.body.title}`,
      severity: 'info',
    });

    const rows = await selectWithTimeout<any>(`SELECT * FROM consumables WHERE id = ? LIMIT 1`, [idBuf], 3000);
    const createdItem = mapConsumableRow(rows[0]);
    outbox.enqueue('welfare.consumable_updated', { id: createdItem.id, updates: createdItem });
    res.status(201).json(createdItem);
  } catch (err) {
    next(err);
  }
});

welfareRouter.put('/consumables/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    if (!isOrganizationalUserRole(currentUser.role)) {
      throw AppError.forbidden('فقط ادمین می‌تواند کالای تعاونی را ویرایش کند.');
    }

    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();
    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM consumables WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('کالای مصرفی');
    const prev = mapConsumableRow(existingRows[0]);

    const hasExplicitVersion =
      req.body?.expectedVersion !== undefined ||
      req.body?.version !== undefined ||
      Boolean(req.headers['if-match']);
    const expVer = hasExplicitVersion ? extractExpectedVersion(req, true) : prev.version;

    const priceVal =
      req.body.cooperativePrice !== undefined || req.body.price !== undefined
        ? Number(req.body.cooperativePrice ?? req.body.price ?? 0)
        : prev.cooperativePrice;
    const marketVal = req.body.marketPrice !== undefined ? Number(req.body.marketPrice) : prev.marketPrice;
    const allowedMethods =
      Array.isArray(req.body.allowedDeliveryMethods) && req.body.allowedDeliveryMethods.length > 0
        ? req.body.allowedDeliveryMethods
        : prev.allowedDeliveryMethods || ['in_person', 'post', 'courier'];

    const [updateRes]: any = await p.query(
      `UPDATE consumables
       SET title = ?, price = ?, market_price = ?, unit = ?, stock = ?, low_stock_threshold = ?,
           category = ?, image_url = ?, description = ?, visible_to_customer = ?,
           is_active = ?, show_as_sold_out_in_showcase = ?, allowed_delivery_methods = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND version = ?`,
      [
        req.body.title !== undefined ? String(req.body.title).trim() : prev.title,
        priceVal,
        marketVal,
        req.body.unit !== undefined ? req.body.unit : prev.unit,
        req.body.stock !== undefined ? Math.max(0, Number(req.body.stock)) : prev.stock,
        req.body.lowStockThreshold !== undefined ? Math.max(1, Number(req.body.lowStockThreshold)) : (prev.lowStockThreshold || 5),
        req.body.category !== undefined ? req.body.category : prev.category,
        req.body.imageUrl !== undefined ? (req.body.imageUrl || null) : (prev.imageUrl || null),
        req.body.description !== undefined ? (req.body.description || null) : (prev.description || null),
        req.body.visibleToCustomer !== undefined ? (req.body.visibleToCustomer ? 1 : 0) : (prev.visibleToCustomer !== false ? 1 : 0),
        req.body.isActive !== undefined ? (req.body.isActive ? 1 : 0) : (prev.isActive !== false ? 1 : 0),
        req.body.showAsSoldOutInShowcase !== undefined ? (req.body.showAsSoldOutInShowcase ? 1 : 0) : (prev.showAsSoldOutInShowcase ? 1 : 0),
        JSON.stringify(allowedMethods),
        idBuf,
        req.params.id,
        expVer,
      ]
    );

    if (updateRes && updateRes.affectedRows === 0) {
      throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `ویرایش کالای مصرفی: ${req.body.title || prev.title}`,
      severity: 'info',
    });

    const rows = await selectWithTimeout<any>(`SELECT * FROM consumables WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const finalItem = mapConsumableRow(rows[0]);

    outbox.enqueue('welfare.consumable_updated', {
      id: finalItem.id,
      resourceId: finalItem.id,
      version: finalItem.version,
      updates: finalItem,
    });

    res.json(finalItem);
  } catch (err) {
    next(err);
  }
});

welfareRouter.delete('/consumables/:id', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    if (!isOrganizationalUserRole(currentUser.role)) {
      throw AppError.forbidden('فقط ادمین می‌تواند کالای تعاونی را حذف کند.');
    }

    const idBuf = toIdBuffer(req.params.id);
    const p = getPool();

    await p.query(`DELETE FROM consumables WHERE id = ? OR id = ?`, [idBuf, req.params.id]);

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `حذف کالای تعاونی: ${req.params.id}`,
      severity: 'info',
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

welfareRouter.patch('/orders/:id/status', async (req: Request, res: Response, next) => {
  try {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const currentUser = getCurrentUser(req);
    if (!isOrganizationalUserRole(currentUser.role)) {
      throw AppError.forbidden('فقط ادمین می‌تواند وضعیت سفارش را تغییر دهد.');
    }

    const idBuf = toIdBuffer(req.params.id);
    const { status, notes } = req.body;
    const p = getPool();

    const existingRows = await selectWithTimeout<any>(
      `SELECT * FROM consumable_orders WHERE id = ? OR id = ? LIMIT 1`,
      [idBuf, req.params.id],
      3000
    );
    if (!existingRows || existingRows.length === 0) throw AppError.notFound('سفارش کالا');
    const existingVer = Number(existingRows[0].version || 1);

    const dbStatus =
      status === 'registered'
        ? 'ثبت شده'
        : status === 'delivered'
          ? 'تحویل داده شد'
          : status === 'dispatched'
            ? 'ارسال شده'
            : status === 'cancelled'
              ? 'لغو شده'
              : 'در حال پردازش';

    const hasExplicitVersion =
      req.body?.expectedVersion !== undefined ||
      req.body?.version !== undefined ||
      Boolean(req.headers['if-match']);
    const expVer = hasExplicitVersion ? extractExpectedVersion(req, true) : existingVer;

    const [updRes]: any = await p.query(
      `UPDATE consumable_orders
       SET status = ?, payment_status = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND version = ?`,
      [dbStatus, notes || 'به‌روزرسانی شده', idBuf, req.params.id, expVer]
    );

    if (updRes && updRes.affectedRows === 0) {
      throw AppError.conflict('اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      ip: req.ip || '127.0.0.1',
      details: `تغییر وضعیت سفارش تعاونی ${req.params.id} به ${status}`,
      severity: 'info',
    });

    const rows = await selectWithTimeout<any>(`SELECT * FROM consumable_orders WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id]);
    const finalOrder = mapConsumableOrderRow(rows[0]);
    outbox.enqueue('welfare.order_updated', { id: finalOrder.id, resourceId: finalOrder.id, updates: finalOrder });
    res.json(finalOrder);
  } catch (err) {
    next(err);
  }
});

// GET & PUT welfare sections configuration
welfareRouter.get('/sections-config', async (_req: Request, res: Response, next) => {
  try {
    const rec = await adminSettingsRepo.getRecord<any>('welfare_sections_config');
    res.json(rec?.value || []);
  } catch (err) {
    next(err);
  }
});

welfareRouter.put('/sections-config', async (req: Request, res: Response, next) => {
  try {
    const currentUser = getCurrentUser(req);
    if (!isOrganizationalUserRole(currentUser.role)) {
      throw AppError.forbidden('تنها مدیر می‌تواند دسته‌بندی‌ها و بخش‌های رفاهیات را ویرایش کند.');
    }
    const configs = req.body;
    if (!Array.isArray(configs)) {
      throw AppError.badRequest('پیکربندی بخش‌ها باید به صورت آرایه باشد.');
    }
    await adminSettingsRepo.saveSetting('welfare_sections_config', configs, 'تنظیمات بخش‌های امور رفاهی');
    res.json({ success: true, data: configs });
  } catch (err) {
    next(err);
  }
});

// GET & PUT loan fund terms & rules
welfareRouter.get('/loan-rules', async (_req: Request, res: Response, next) => {
  try {
    const rec = await adminSettingsRepo.getRecord<any>('loan_terms_rules');
    res.json(rec?.value || {});
  } catch (err) {
    next(err);
  }
});

welfareRouter.put('/loan-rules', async (req: Request, res: Response, next) => {
  try {
    const currentUser = getCurrentUser(req);
    if (!isOrganizationalUserRole(currentUser.role)) {
      throw AppError.forbidden('تنها مدیر سامانه مجاز به ویرایش اساسنامه و شرایط تسهیلات است.');
    }
    const rules = req.body;
    if (!rules) {
      throw AppError.badRequest('اطلاعات ضوابط و اساسنامه نامعتبر است.');
    }
    await adminSettingsRepo.saveSetting('loan_terms_rules', rules, 'قوانین و شرایط وام');
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
});

// GET & PUT cooperative section info
welfareRouter.get('/cooperative-info', async (_req: Request, res: Response, next) => {
  try {
    const rec = await adminSettingsRepo.getRecord<any>('cooperative_info');
    res.json(rec?.value || {});
  } catch (err) {
    next(err);
  }
});

welfareRouter.put('/cooperative-info', async (req: Request, res: Response, next) => {
  try {
    const currentUser = getCurrentUser(req);
    if (!isOrganizationalUserRole(currentUser.role)) {
      throw AppError.forbidden('تنها مدیر سامانه مجاز به تغییر اطلاعات ویترین تعاونی است.');
    }
    const info = req.body;
    if (!info) {
      throw AppError.badRequest('اطلاعات تعاونی ناقص است.');
    }
    await adminSettingsRepo.saveSetting('cooperative_info', info, 'اطلاعات ویترین تعاونی');
    res.json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
});

import { registerWelfareInventoryAndPostalRoutes } from './welfareInventoryAndPostalRoutes';
registerWelfareInventoryAndPostalRoutes(welfareRouter);
registerWelfareExtendedRoutes(welfareRouter);

import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { extractExpectedVersion } from '../../platform/httpUtils';
import { outbox } from '../../platform/outbox';

export function registerWelfareInventoryAndPostalRoutes(router: Router): void {
  // 1. Update Postal Tracking Code & Shipping Status on Cooperative Order (Admin Only, Strict OCC)
  router.patch('/orders/:id/postal-tracking', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const { postalTrackingCode, shippingStatus, status } = req.body;

      const p = getPool();
      const existingRows = await selectWithTimeout<any>(
        `SELECT * FROM consumable_orders WHERE id = ? OR id = ? LIMIT 1`,
        [idBuf, req.params.id],
        3000
      );
      if (!existingRows || existingRows.length === 0) throw AppError.notFound('سفارش تعاونی');
      const existing = existingRows[0];

      const nextStatus = status || (postalTrackingCode ? 'dispatched' : existing.status);
      const nextShippingStatus = shippingStatus || (postalTrackingCode ? 'تحویل به پست جمهوری اسلامی ایران' : (existing.shipping_status || 'در حال آماده‌سازی'));

      const [upd]: any = await p.query(
        `UPDATE consumable_orders
         SET postal_tracking_code = ?, shipping_status = ?, status = ?, version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [
          postalTrackingCode ? String(postalTrackingCode).trim() : null,
          nextShippingStatus,
          nextStatus,
          idBuf,
          req.params.id,
          expVer,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('این سفارش توسط مدیر دیگری ویرایش شده است. لطفاً بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const newVer = Number(existing.version || 1) + 1;
      const payload = {
        orderId: fromIdBuffer(existing.id),
        postalTrackingCode: postalTrackingCode ? String(postalTrackingCode).trim() : '',
        shippingStatus: nextShippingStatus,
        status: nextStatus,
        version: newVer,
      };

      outbox.enqueue('welfare.order_postal_updated', payload);

      res.json({
        success: true,
        ...payload,
      });
    } catch (err) {
      next(err);
    }
  });

  // 2. Admin Inventory Stock & Low-Stock Warning Threshold Control (Strict OCC)
  router.patch('/consumables/:id/inventory', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const user = getCurrentUser(req);
      AuthorizationPolicy.requireRole({ userId: user.id, role: user.role, fullName: user.fullName }, ['admin', 'supervisor']);

      const expVer = extractExpectedVersion(req, true);
      const idBuf = toIdBuffer(req.params.id);
      const { stock, lowStockThreshold } = req.body;

      if (stock === undefined || Number(stock) < 0) {
        throw AppError.badRequest('مقدار موجودی کالا باید عددی نامنفی باشد.');
      }

      const p = getPool();
      const [upd]: any = await p.query(
        `UPDATE consumables
         SET stock = ?, low_stock_threshold = COALESCE(?, low_stock_threshold), version = version + 1
         WHERE (id = ? OR id = ?) AND version = ?`,
        [
          Math.max(0, Number(stock)),
          lowStockThreshold !== undefined ? Math.max(1, Number(lowStockThreshold)) : null,
          idBuf,
          req.params.id,
          expVer,
        ]
      );

      if (upd && upd.affectedRows === 0) {
        throw AppError.conflict('موجودی این کالا هم‌زمان تغییر کرده است. لطفاً بازخوانی نمایید.', 'CONCURRENT_MODIFICATION_CONFLICT');
      }

      const rows = await selectWithTimeout<any>(`SELECT * FROM consumables WHERE id = ? OR id = ? LIMIT 1`, [idBuf, req.params.id], 3000);
      const r = rows[0];
      const updatedItem = {
        id: fromIdBuffer(r.id),
        title: r.title,
        name: r.title,
        category: r.category,
        cooperativePrice: Number(r.cooperative_price || 0),
        memberPrice: Number(r.cooperative_price || 0),
        marketPrice: Number(r.market_price || 0),
        unit: r.unit,
        stock: Number(r.stock || 0),
        lowStockThreshold: Number(r.low_stock_threshold ?? 5),
        description: r.description,
        version: Number(r.version || 1),
      };

      outbox.enqueue('welfare.consumable_updated', {
        id: updatedItem.id,
        consumable: updatedItem,
        version: updatedItem.version,
      });

      res.json(updatedItem);
    } catch (err) {
      next(err);
    }
  });
}

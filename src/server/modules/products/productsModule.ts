import { Router, Request, Response } from 'express';
import { db } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { AuthContext } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Product } from '../../../types';

export class ProductsService {
  async getAll(): Promise<Array<Product & { version: number }>> {
    return db.products;
  }

  async purchase(authCtx: AuthContext, productId: string): Promise<Product & { version: number }> {
    const product = db.products.find(p => p.id === productId);
    if (!product) throw AppError.notFound(`اثر یا کتاب با شناسه ${productId}`);

    return db.withTx(async tx => {
      const updated = tx.updateVersioned(
        tx.products,
        productId,
        product.version,
        () => ({
          isOwned: true,
        })
      );

      // Audit ledger in same transaction (Section 5 & 10)
      tx.emitAudit({
        eventType: 'LOGIN_SUCCESS',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `خریداری محصول [${product.title}] به مبلغ ${product.price} تومان با موفقیت ثبت شد.`,
        severity: 'info',
      });

      tx.emitOutbox('products.purchased', {
        productId,
        userId: authCtx.userId,
        priceTomans: product.price,
      });

      return updated;
    });
  }
}

export function createProductsRouter(): Router {
  const router = Router();
  const service = new ProductsService();

  router.get('/', async (_req, res, next) => {
    try {
      const items = await service.getAll();
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/purchase', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.purchase(authCtx, req.params.id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

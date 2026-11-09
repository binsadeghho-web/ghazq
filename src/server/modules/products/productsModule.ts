import { Router, Request, Response } from 'express';
import { db, generateUUIDv7 } from '../../platform/database';
import { AppError } from '../../platform/errors';
import { AuthContext, AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Product } from '../../../types';

export class ProductsService {
  async getAll(): Promise<Array<Product & { version: number }>> {
    return db.products;
  }

  async getById(id: string): Promise<(Product & { version: number }) | undefined> {
    return db.products.find(p => p.id === id);
  }

  async createProduct(
    authCtx: AuthContext,
    dto: {
      title: string;
      format?: Product['format'];
      formatTitle?: string;
      price: number;
      description: string;
      authorOrPresenter?: string;
      publishedYear?: string;
      stock?: number;
    }
  ): Promise<Product & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    if (!dto.title || dto.price === undefined || !dto.description) {
      throw AppError.badRequest('عنوان، قیمت و شرح محصول الزامی است.');
    }

    const id = generateUUIDv7();
    const newProduct: Product & { version: number } = {
      id,
      title: dto.title.trim(),
      authorOrPresenter: dto.authorOrPresenter || 'استاد مدعو مرکز فقه و قضا',
      format: dto.format || 'book',
      formatTitle: dto.formatTitle || 'کتاب چاپی',
      price: Number(dto.price),
      description: dto.description.trim(),
      publishedYear: dto.publishedYear || '۱۴۰۳',
      pagesOrDuration: (dto as any).pagesOrDuration || '۳۵۰ صفحه',
      isAvailable: true,
      isOwned: false,
      version: 1,
    };

    db.products.unshift(newProduct);
    return newProduct;
  }

  async updateProduct(
    authCtx: AuthContext,
    id: string,
    updates: {
      title?: string;
      price?: number;
      stock?: number;
      description?: string;
      publishedYear?: string;
    },
    expectedVersion = 1
  ): Promise<Product & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);

    const existing = db.products.find(p => p.id === id);
    if (!existing) throw AppError.notFound(`محصول با شناسه ${id}`);

    const updated = db.updateWithOptimisticLock(
      db.products,
      id,
      expectedVersion,
      current => ({
        ...current,
        title: updates.title !== undefined ? updates.title.trim() : current.title,
        price: updates.price !== undefined ? Number(updates.price) : current.price,
        description: updates.description !== undefined ? updates.description.trim() : current.description,
        publishedYear: updates.publishedYear !== undefined ? updates.publishedYear.trim() : current.publishedYear,
      })
    );

    return updated;
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

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await service.getById(req.params.id);
      if (!item) throw AppError.notFound('محصول');
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const created = await service.createProduct(authCtx, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = Number(req.body.expectedVersion || req.body._baseVersion || 1);
      const updated = await service.updateProduct(authCtx, req.params.id, req.body, expectedVersion);
      res.json(updated);
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

import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { AppError } from '../../platform/errors';
import { AuthContext, AuthorizationPolicy } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Product } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';

function mapProductRow(row: any, isOwned = false): Product & { version: number } {
  return {
    id: fromIdBuffer(row.id),
    title: row.title,
    authorOrPresenter: row.author_or_presenter,
    format: row.format,
    formatTitle: row.format_title,
    price: Number(row.price || 0),
    description: row.description,
    pagesOrDuration: row.pages_or_duration,
    publishedYear: row.published_year,
    coverImage: row.cover_image || undefined,
    isAvailable: Boolean(row.is_available),
    isOwned,
    badgeText: row.badge_text || undefined,
    version: Number(row.version || 1),
  };
}

export class ProductsService {
  async getAll(authCtx?: AuthContext): Promise<Array<Product & { version: number }>> {
    ensureDatabaseConnection();
    const p = getPool();
    const rows = await selectWithTimeout<any>(`SELECT * FROM products WHERE is_available = 1 ORDER BY created_at DESC`, [], 4000);
    const products = (rows || []).map(r => mapProductRow(r, false));

    if (authCtx?.userId && products.length > 0) {
      const uBuf = toIdBuffer(authCtx.userId);
      const [orderRows] = await p.query<any[]>(
        `SELECT DISTINCT product_id FROM product_orders WHERE (user_id = ? OR user_id = ?) AND payment_status = 'confirmed'`,
        [uBuf, authCtx.userId]
      );
      const ownedIds = new Set((orderRows || []).map(r => fromIdBuffer(r.product_id)));
      return products.map(p => ({
        ...p,
        isOwned: ownedIds.has(p.id),
      }));
    }

    return products;
  }

  async getById(id: string, authCtx?: AuthContext): Promise<(Product & { version: number }) | undefined> {
    ensureDatabaseConnection();
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(`SELECT * FROM products WHERE id = ? OR id = ? LIMIT 1`, [idBuf, id], 3000);
    if (!rows || rows.length === 0) return undefined;

    let isOwned = false;
    if (authCtx?.userId) {
      const uBuf = toIdBuffer(authCtx.userId);
      const p = getPool();
      const [orderRows] = await p.query<any[]>(
        `SELECT id FROM product_orders WHERE (product_id = ? OR product_id = ?) AND (user_id = ? OR user_id = ?) AND payment_status = 'confirmed' LIMIT 1`,
        [idBuf, id, uBuf, authCtx.userId]
      );
      isOwned = Boolean(orderRows && orderRows.length > 0);
    }

    return mapProductRow(rows[0], isOwned);
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
    ensureDatabaseConnection();

    if (!dto.title || dto.price === undefined || !dto.description) {
      throw AppError.badRequest('عنوان، قیمت و شرح محصول الزامی است.');
    }

    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const p = getPool();

    const title = dto.title.trim();
    const author = dto.authorOrPresenter || 'استاد مدعو مرکز فقه و قضا';
    const fmt = dto.format || 'book';
    const fmtTitle = dto.formatTitle || 'کتاب چاپی';
    const price = Number(dto.price);
    const desc = dto.description.trim();
    const year = dto.publishedYear || '۱۴۰۳';
    const pages = (dto as any).pagesOrDuration || '۳۵۰ صفحه';

    await p.query(
      `INSERT INTO products (
        id, title, author_or_presenter, format, format_title, price, description, pages_or_duration, published_year, is_available, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [idBuf, title, author, fmt, fmtTitle, price, desc, pages, year]
    );

    auditChain.appendEntry({
      eventType: 'LOGIN_SUCCESS',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `ایجاد و انتشار اثر انتشارات: ${title}`,
      severity: 'info',
    });

    return {
      id,
      title,
      authorOrPresenter: author,
      format: fmt,
      formatTitle: fmtTitle,
      price,
      description: desc,
      pagesOrDuration: pages,
      publishedYear: year,
      isAvailable: true,
      isOwned: false,
      version: 1,
    };
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
    ensureDatabaseConnection();

    const idBuf = toIdBuffer(id);
    const existing = await this.getById(id, authCtx);
    if (!existing) throw AppError.notFound(`محصول با شناسه ${id}`);

    const p = getPool();
    const title = updates.title !== undefined ? updates.title.trim() : existing.title;
    const price = updates.price !== undefined ? Number(updates.price) : existing.price;
    const desc = updates.description !== undefined ? updates.description.trim() : existing.description;
    const year = updates.publishedYear !== undefined ? updates.publishedYear.trim() : existing.publishedYear;

    await p.query(
      `UPDATE products
       SET title = ?, price = ?, description = ?, published_year = ?, version = version + 1
       WHERE id = ? OR id = ?`,
      [title, price, desc, year, idBuf, id]
    );

    const updated = await this.getById(id, authCtx);
    if (!updated) throw AppError.internal('خطا در به‌روزرسانی محصول');
    return updated;
  }

  async purchase(authCtx: AuthContext, productId: string): Promise<Product & { version: number }> {
    ensureDatabaseConnection();
    const product = await this.getById(productId, authCtx);
    if (!product) throw AppError.notFound(`اثر یا کتاب با شناسه ${productId}`);

    const pBuf = toIdBuffer(productId);
    const uBuf = toIdBuffer(authCtx.userId);
    const orderId = generateUUIDv7();
    const oBuf = toIdBuffer(orderId);
    const trackingCode = `PRD-${Date.now().toString().slice(-7)}`;

    return await withTx(async (conn) => {
      await conn.query(
        `INSERT INTO product_orders (
          id, product_id, product_title, user_id, user_name, user_phone, amount_paid, payment_status, tracking_code, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 1)`,
        [oBuf, pBuf, product.title, uBuf, authCtx.fullName, '09120000000', product.price, trackingCode]
      );

      auditChain.appendEntry({
        eventType: 'LOGIN_SUCCESS',
        actorId: authCtx.userId,
        actorName: authCtx.fullName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `خریداری محصول [${product.title}] به مبلغ ${product.price} تومان با موفقیت ثبت شد.`,
        severity: 'info',
      });

      outbox.enqueue('products.purchased', {
        productId,
        userId: authCtx.userId,
        priceTomans: product.price,
      });

      return {
        ...product,
        isOwned: true,
      };
    });
  }
}

export function createProductsRouter(): Router {
  const router = Router();
  const service = new ProductsService();

  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const items = await service.getAll(authCtx);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const item = await service.getById(req.params.id, authCtx);
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

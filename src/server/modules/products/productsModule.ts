import { Router, Request, Response } from 'express';
import { getPool, selectWithTimeout, ensureDatabaseConnection, withTx } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { AppError } from '../../platform/errors';
import { AuthContext, AuthorizationPolicy, isOrganizationalUserRole } from '../../platform/authorization';
import { getCurrentUser } from '../../platform/sessionAuth';
import { Product, ProductOrder, ProductsStoreConfig } from '../../../types';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../../platform/uuidv7';
import { auditChain } from '../../platform/auditChain';
import { outbox } from '../../platform/outbox';
import { extractExpectedVersion } from '../../platform/httpUtils';
import {
  DEFAULT_DELIVERY_OPTIONS,
  DEFAULT_PRODUCTS_STORE_CONFIG,
  getDefaultDigitalLabel,
  getDefaultFormatTitle,
  getDefaultPhysicalLabel,
  loadProductsStoreConfig,
  mapProductOrderRow,
  mapProductRow,
  normalizeCustomCategories,
  normalizeDeliveryOptions,
  sanitizeMediaSessions,
  sanitizeMediaUrl,
  sanitizePresentersList,
} from './productHelpers';

export interface PurchaseProductDto {
  purchaseFormat?: 'digital' | 'physical';
  deliveryMethod?: 'complex_pickup' | 'postal' | 'courier' | 'digital_instant';
  paymentMethod?: 'online_gateway' | 'bank_receipt';
  gatewayId?: string;
  shippingAddress?: string;
  receiptFileUrl?: string;
  receiptBankName?: string;
  receiptTrackingCode?: string;
}

export class ProductsService {
  async getAll(authCtx?: AuthContext): Promise<Array<Product & { version: number }>> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const p = getPool();
    const isOfficial = isOrganizationalUserRole(authCtx?.role);
    const storeConfig = await loadProductsStoreConfig();

    // Non-official users see nothing if whole store is disabled
    if (!isOfficial && !storeConfig.isStoreEnabled) {
      return [];
    }

    let sql = `SELECT * FROM products WHERE is_available = 1 AND (is_deleted = 0 OR is_deleted IS NULL) AND deleted_at IS NULL`;
    if (authCtx?.role === 'customer') {
      sql += ` AND (visible_to_customer = 1 OR visible_to_customer IS NULL)`;
    }
    sql += ` ORDER BY display_order ASC, created_at DESC`;

    const rows = await selectWithTimeout<any>(sql, [], 4000);
    let filteredRows = rows || [];

    // Filter disabled categories for non-officials
    if (!isOfficial) {
      filteredRows = filteredRows.filter(r => {
        const fmt = String(r.format || 'book').trim() || 'book';
        return storeConfig.enabledCategories[fmt] !== false;
      });
    }

    const ownedMap = new Map<string, Set<'digital' | 'physical'>>();
    if (authCtx?.userId && filteredRows.length > 0) {
      const uBuf = toIdBuffer(authCtx.userId);
      const [orderRows] = await p.query<any[]>(
        `SELECT product_id, purchase_format FROM product_orders
         WHERE (user_id = ? OR user_id = ?) AND payment_status = 'confirmed' AND deleted_at IS NULL`,
        [uBuf, authCtx.userId]
      );
      for (const row of orderRows || []) {
        const pid = fromIdBuffer(row.product_id);
        if (!ownedMap.has(pid)) ownedMap.set(pid, new Set());
        const fmt = row.purchase_format === 'physical' ? 'physical' : 'digital';
        ownedMap.get(pid)!.add(fmt);
      }
    }

    return filteredRows.map(r => {
      const pid = fromIdBuffer(r.id);
      const ownedSet = ownedMap.get(pid);
      const isOwned = Boolean(ownedSet && ownedSet.size > 0);
      const ownedFormats = ownedSet ? Array.from(ownedSet) : [];
      return mapProductRow(r, isOwned, ownedFormats, isOfficial || isOwned);
    });
  }

  async getById(id: string, authCtx?: AuthContext): Promise<(Product & { version: number }) | undefined> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const isOfficial = isOrganizationalUserRole(authCtx?.role);
    const idBuf = toIdBuffer(id);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM products WHERE (id = ? OR id = ?) AND (is_deleted = 0 OR is_deleted IS NULL) AND deleted_at IS NULL LIMIT 1`,
      [idBuf, id],
      3000
    );
    if (!rows || rows.length === 0) return undefined;

    if (authCtx?.role === 'customer' && rows[0].visible_to_customer === 0) {
      return undefined;
    }

    const ownedFormats: Array<'digital' | 'physical'> = [];
    if (authCtx?.userId) {
      const uBuf = toIdBuffer(authCtx.userId);
      const p = getPool();
      const [orderRows] = await p.query<any[]>(
        `SELECT purchase_format FROM product_orders
         WHERE (product_id = ? OR product_id = ?) AND (user_id = ? OR user_id = ?)
           AND payment_status = 'confirmed' AND deleted_at IS NULL`,
        [idBuf, id, uBuf, authCtx.userId]
      );
      for (const o of orderRows || []) {
        const f = o.purchase_format === 'physical' ? 'physical' : 'digital';
        if (!ownedFormats.includes(f)) ownedFormats.push(f);
      }
    }

    const isOwned = ownedFormats.length > 0;
    return mapProductRow(rows[0], isOwned, ownedFormats, isOfficial || isOwned);
  }

  async createProduct(authCtx: AuthContext, dto: any): Promise<Product & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const title = String(dto.title || '').trim();
    const presenters = sanitizePresentersList(dto.presenters, dto.authorOrPresenter);
    const author = presenters.length > 0
      ? presenters.join('، ')
      : String(dto.authorOrPresenter || '').trim();
    const desc = String(dto.description || '').trim();

    if (!title || !author || !desc) {
      throw AppError.badRequest('عنوان، پدیدآورنده/ارائه‌دهنده و شرح محصول الزامی است.');
    }

    const rawFormat = String(dto.format || 'book').trim().replace(/[^\w\u0600-\u06FF-]/g, '');
    const format: string = (rawFormat || 'book').slice(0, 64);
    const supportsDigital = dto.supportsDigital !== undefined ? Boolean(dto.supportsDigital) : true;
    const supportsPhysical = dto.supportsPhysical !== undefined ? Boolean(dto.supportsPhysical) : format === 'book';

    if (!supportsDigital && !supportsPhysical) {
      throw AppError.badRequest('حداقل یکی از شیوه‌های فروش (دیجیتال یا فیزیکی) باید فعال باشد.');
    }

    const digitalPrice = Math.max(0, Number(dto.digitalPrice ?? dto.price ?? 0));
    const physicalPrice = Math.max(0, Number(dto.physicalPrice ?? dto.price ?? 0));
    const effectiveBasePrice = supportsPhysical ? physicalPrice : digitalPrice;

    const galleryImages: string[] = Array.isArray(dto.galleryImages)
      ? dto.galleryImages.map((g: any) => String(g).trim()).filter(Boolean)
      : dto.coverImage
      ? [String(dto.coverImage).trim()]
      : [];
    const coverImage = dto.coverImage ? String(dto.coverImage).trim() : galleryImages[0] || null;
    if (coverImage && !galleryImages.includes(coverImage)) {
      galleryImages.unshift(coverImage);
    }

    const deliveryOptions = normalizeDeliveryOptions(dto.deliveryOptions || DEFAULT_DELIVERY_OPTIONS);
    const mediaSessions = sanitizeMediaSessions(dto.mediaSessions);
    const id = generateUUIDv7();
    const idBuf = toIdBuffer(id);
    const p = getPool();

    const fmtTitle =
      String(dto.formatTitle || '').trim() || getDefaultFormatTitle(format);
    const shortDesc = String(dto.shortDescription || desc.slice(0, 140)).trim();
    const subjectIndex = dto.subjectIndex ? String(dto.subjectIndex).trim() : null;
    const isbn = dto.isbn ? String(dto.isbn).trim() : null;
    const year = String(dto.publishedYear || '۱۴۰۴').trim();
    const pages = String(
      dto.pagesOrDuration ||
        (format === 'audio_series'
          ? '۱۰ جلسه'
          : format === 'multimedia'
          ? 'نشست علمی'
          : '۳۵۰ صفحه')
    ).trim();
    const publisher = String(dto.publisher || 'انتشارات مرکز فقه و حقوق اسلامی').trim();
    const stock = Math.max(0, Number(dto.stock !== undefined ? dto.stock : 25));
    const displayOrder = Number(dto.displayOrder || 0);
    const allowedPaymentMethod = dto.allowedPaymentMethod || 'both';
    const downloadLink = sanitizeMediaUrl(dto.downloadLink) || null;
    const badgeText = dto.badgeText ? String(dto.badgeText).trim() : null;
    const visibleToCustomer = dto.visibleToCustomer !== undefined ? Boolean(dto.visibleToCustomer) : true;
    const showInShowcase = dto.showInShowcase !== undefined ? Boolean(dto.showInShowcase) : true;

    await p.query(
      `INSERT INTO products (
        id, title, subtitle, short_description, subject_index, author_or_presenter, presenters,
        format, format_title, price, supports_digital, digital_price, digital_format_label,
        supports_physical, physical_price, physical_format_label, delivery_options,
        allowed_payment_method, description, pages_or_duration, published_year, publisher,
        isbn, cover_image, gallery_images, download_link, media_sessions, badge_text, stock,
        display_order, visible_to_customer, show_in_showcase, is_available, is_deleted, version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 1)`,
      [
        idBuf,
        title,
        dto.subtitle || null,
        shortDesc,
        subjectIndex,
        author,
        JSON.stringify(presenters.length > 0 ? presenters : [author]),
        format,
        fmtTitle,
        effectiveBasePrice,
        supportsDigital ? 1 : 0,
        digitalPrice,
        dto.digitalFormatLabel || getDefaultDigitalLabel(format),
        supportsPhysical ? 1 : 0,
        physicalPrice,
        dto.physicalFormatLabel || getDefaultPhysicalLabel(format),
        JSON.stringify(deliveryOptions),
        allowedPaymentMethod,
        desc,
        pages,
        year,
        publisher,
        isbn,
        coverImage,
        JSON.stringify(galleryImages),
        downloadLink,
        JSON.stringify(mediaSessions),
        badgeText,
        stock,
        displayOrder,
        visibleToCustomer ? 1 : 0,
        showInShowcase ? 1 : 0,
      ]
    );

    const created = await this.getById(id, authCtx);
    if (!created) throw AppError.internal('خطا در ایجاد محصول');

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `ایجاد و انتشار محصول جدید در بخش کتاب و محصولات چند رسانه‌ای: ${title}`,
      severity: 'info',
    });

    // Note: strip protected media urls from public SSE payload unless client refetches or is official
    outbox.enqueue('products.created', {
      id: created.id,
      resourceId: created.id,
      productId: created.id,
      version: created.version,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return created;
  }

  async updateProduct(
    authCtx: AuthContext,
    id: string,
    updates: any,
    expectedVersion?: number
  ): Promise<Product & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const idBuf = toIdBuffer(id);
    const existing = await this.getById(id, authCtx);
    if (!existing) throw AppError.notFound(`محصول با شناسه ${id}`);

    const rawVersion = expectedVersion ?? updates.expectedVersion ?? updates.version;
    if (rawVersion === undefined || rawVersion === null || isNaN(Number(rawVersion))) {
      throw AppError.badRequest(
        'شناسه نسخه معتبر (expectedVersion یا هدر If-Match) جهت ویرایش محصول الزامی است.',
        'VERSION_REQUIRED'
      );
    }
    const expVer = Number(rawVersion);

    const rawFormat = updates.format !== undefined
      ? String(updates.format || '').trim().replace(/[^\w\u0600-\u06FF-]/g, '').slice(0, 64)
      : existing.format;
    const format: string = rawFormat || existing.format;

    const supportsDigital =
      updates.supportsDigital !== undefined ? Boolean(updates.supportsDigital) : Boolean(existing.supportsDigital);
    const supportsPhysical =
      updates.supportsPhysical !== undefined ? Boolean(updates.supportsPhysical) : Boolean(existing.supportsPhysical);

    if (!supportsDigital && !supportsPhysical) {
      throw AppError.badRequest('حداقل یکی از شیوه‌های فروش (دیجیتال یا فیزیکی) باید فعال باشد.');
    }

    const digitalPrice =
      updates.digitalPrice !== undefined ? Math.max(0, Number(updates.digitalPrice)) : Number(existing.digitalPrice ?? existing.price);
    const physicalPrice =
      updates.physicalPrice !== undefined ? Math.max(0, Number(updates.physicalPrice)) : Number(existing.physicalPrice ?? existing.price);
    const price = updates.price !== undefined ? Number(updates.price) : supportsPhysical ? physicalPrice : digitalPrice;

    const galleryImages: string[] = Array.isArray(updates.galleryImages)
      ? updates.galleryImages.map((g: any) => String(g).trim()).filter(Boolean)
      : existing.galleryImages || [];
    const coverImage =
      updates.coverImage !== undefined
        ? updates.coverImage || null
        : existing.coverImage || galleryImages[0] || null;
    if (coverImage && !galleryImages.includes(coverImage)) {
      galleryImages.unshift(coverImage);
    }

    const deliveryOptions =
      updates.deliveryOptions !== undefined
        ? normalizeDeliveryOptions(updates.deliveryOptions)
        : existing.deliveryOptions || DEFAULT_DELIVERY_OPTIONS;

    const presenters =
      updates.presenters !== undefined || updates.authorOrPresenter !== undefined
        ? sanitizePresentersList(
            updates.presenters,
            updates.authorOrPresenter ?? existing.authorOrPresenter
          )
        : existing.presenters || sanitizePresentersList(undefined, existing.authorOrPresenter);
    const authorOrPresenter =
      updates.authorOrPresenter !== undefined && String(updates.authorOrPresenter).trim()
        ? String(updates.authorOrPresenter).trim()
        : presenters.join('، ') || existing.authorOrPresenter;

    const mediaSessions =
      updates.mediaSessions !== undefined
        ? sanitizeMediaSessions(updates.mediaSessions)
        : existing.mediaSessions || [];

    const downloadLink =
      updates.downloadLink !== undefined
        ? sanitizeMediaUrl(updates.downloadLink) || null
        : existing.downloadLink || null;

    const showInShowcase =
      updates.showInShowcase !== undefined
        ? Boolean(updates.showInShowcase)
        : existing.showInShowcase !== false;

    const p = getPool();
    const [res]: any = await p.query(
      `UPDATE products
       SET title = ?, subtitle = ?, short_description = ?, subject_index = ?,
           author_or_presenter = ?, presenters = ?, format = ?, format_title = ?, price = ?,
           supports_digital = ?, digital_price = ?, digital_format_label = ?,
           supports_physical = ?, physical_price = ?, physical_format_label = ?,
           delivery_options = ?, allowed_payment_method = ?, description = ?,
           pages_or_duration = ?, published_year = ?, publisher = ?, isbn = ?,
           cover_image = ?, gallery_images = ?, download_link = ?, media_sessions = ?,
           badge_text = ?, stock = ?, display_order = ?, visible_to_customer = ?,
           show_in_showcase = ?, is_available = ?,
           version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?) AND version = ? AND (is_deleted = 0 OR is_deleted IS NULL) AND deleted_at IS NULL`,
      [
        updates.title !== undefined ? String(updates.title).trim() : existing.title,
        updates.subtitle !== undefined ? updates.subtitle || null : existing.subtitle || null,
        updates.shortDescription !== undefined ? String(updates.shortDescription).trim() : existing.shortDescription || null,
        updates.subjectIndex !== undefined ? updates.subjectIndex || null : existing.subjectIndex || null,
        authorOrPresenter,
        JSON.stringify(presenters),
        format,
        updates.formatTitle !== undefined ? String(updates.formatTitle).trim() || getDefaultFormatTitle(format) : existing.formatTitle,
        price,
        supportsDigital ? 1 : 0,
        digitalPrice,
        updates.digitalFormatLabel !== undefined ? updates.digitalFormatLabel : existing.digitalFormatLabel || getDefaultDigitalLabel(format),
        supportsPhysical ? 1 : 0,
        physicalPrice,
        updates.physicalFormatLabel !== undefined ? updates.physicalFormatLabel : existing.physicalFormatLabel || getDefaultPhysicalLabel(format),
        JSON.stringify(deliveryOptions),
        updates.allowedPaymentMethod !== undefined ? updates.allowedPaymentMethod : existing.allowedPaymentMethod || 'both',
        updates.description !== undefined ? String(updates.description).trim() : existing.description,
        updates.pagesOrDuration !== undefined ? String(updates.pagesOrDuration).trim() : existing.pagesOrDuration,
        updates.publishedYear !== undefined ? String(updates.publishedYear).trim() : existing.publishedYear,
        updates.publisher !== undefined ? updates.publisher || null : existing.publisher || null,
        updates.isbn !== undefined ? updates.isbn || null : existing.isbn || null,
        coverImage,
        JSON.stringify(galleryImages),
        downloadLink,
        JSON.stringify(mediaSessions),
        updates.badgeText !== undefined ? updates.badgeText || null : existing.badgeText || null,
        updates.stock !== undefined ? Math.max(0, Number(updates.stock)) : Number(existing.stock ?? 20),
        updates.displayOrder !== undefined ? Number(updates.displayOrder) : Number(existing.displayOrder ?? 0),
        updates.visibleToCustomer !== undefined ? (updates.visibleToCustomer ? 1 : 0) : existing.visibleToCustomer !== false ? 1 : 0,
        showInShowcase ? 1 : 0,
        updates.isAvailable !== undefined ? (updates.isAvailable ? 1 : 0) : existing.isAvailable ? 1 : 0,
        idBuf,
        id,
        expVer,
      ]
    );

    if (res && res.affectedRows === 0) {
      throw AppError.conflict(
        'اطلاعات این محصول توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const updated = await this.getById(id, authCtx);
    if (!updated) throw AppError.internal('خطا در به‌روزرسانی محصول');

    outbox.enqueue('products.updated', {
      id: updated.id,
      resourceId: updated.id,
      productId: updated.id,
      version: updated.version,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return updated;
  }

  async toggleShowcase(
    authCtx: AuthContext,
    id: string,
    showInShowcase: boolean,
    expectedVersion?: number
  ): Promise<Product & { version: number }> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const idBuf = toIdBuffer(id);
    const p = getPool();
    const params: any[] = [showInShowcase ? 1 : 0, idBuf, id];
    let versionClause = '';
    if (expectedVersion !== undefined && !isNaN(Number(expectedVersion))) {
      versionClause = ' AND version = ?';
      params.push(Number(expectedVersion));
    }

    const [res]: any = await p.query(
      `UPDATE products
       SET show_in_showcase = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
       WHERE (id = ? OR id = ?)${versionClause} AND (is_deleted = 0 OR is_deleted IS NULL) AND deleted_at IS NULL`,
      params
    );

    if (res && res.affectedRows === 0) {
      throw AppError.conflict(
        'محصول یافت نشد یا نسخه آن تغییر یافته است.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    const updated = await this.getById(id, authCtx);
    if (!updated) throw AppError.notFound(`محصول با شناسه ${id}`);

    outbox.enqueue('products.updated', {
      id: updated.id,
      resourceId: updated.id,
      productId: updated.id,
      version: updated.version,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });

    return updated;
  }

  async softDeleteProduct(authCtx: AuthContext, id: string, expectedVersion: number): Promise<void> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const idBuf = toIdBuffer(id);
    const p = getPool();
    const [res]: any = await p.query(
      `UPDATE products
       SET is_deleted = 1, is_available = 0, deleted_at = CURRENT_TIMESTAMP(3), deleted_by = ?, version = version + 1
       WHERE (id = ? OR id = ?) AND version = ? AND (is_deleted = 0 OR is_deleted IS NULL) AND deleted_at IS NULL`,
      [authCtx.fullName, idBuf, id, expectedVersion]
    );

    if (res && res.affectedRows === 0) {
      throw AppError.conflict(
        'محصول یافت نشد یا هم‌زمان توسط مدیر دیگری تغییر یافته است.',
        'CONCURRENT_MODIFICATION_CONFLICT'
      );
    }

    auditChain.appendEntry({
      eventType: 'CARTABLE_STATUS_CHANGE',
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
      actorRole: authCtx.role,
      ip: '127.0.0.1',
      details: `حذف نرم محصول در بخش کتاب و محصولات چند رسانه‌ای (شناسه: ${id})`,
      severity: 'warning',
    });

    outbox.enqueue('products.deleted', {
      id,
      resourceId: id,
      productId: id,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });
  }

  async reorderProducts(authCtx: AuthContext, orderedIds: string[]): Promise<void> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    await withTx(async (conn) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const rId = String(orderedIds[i]);
        const rBuf = toIdBuffer(rId);
        await conn.query(
          `UPDATE products SET display_order = ?, version = version + 1 WHERE (id = ? OR id = ?) AND (is_deleted = 0 OR is_deleted IS NULL)`,
          [i + 1, rBuf, rId]
        );
      }
    });

    outbox.enqueue('products.reordered', {
      orderedIds,
      actorId: authCtx.userId,
      actorName: authCtx.fullName,
    });
  }

  async getOrders(authCtx: AuthContext): Promise<ProductOrder[]> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const isOfficial = isOrganizationalUserRole(authCtx.role);

    if (isOfficial) {
      const rows = await selectWithTimeout<any>(
        `SELECT * FROM product_orders WHERE deleted_at IS NULL ORDER BY ordered_at DESC LIMIT 300`,
        [],
        4000
      );
      return (rows || []).map(mapProductOrderRow);
    }

    const uBuf = toIdBuffer(authCtx.userId);
    const rows = await selectWithTimeout<any>(
      `SELECT * FROM product_orders WHERE (user_id = ? OR user_id = ?) AND deleted_at IS NULL ORDER BY ordered_at DESC LIMIT 200`,
      [uBuf, authCtx.userId],
      4000
    );
    return (rows || []).map(mapProductOrderRow);
  }

  async reviewOrderStatus(
    authCtx: AuthContext,
    orderId: string,
    status: 'confirmed' | 'rejected',
    expectedVersion: number,
    adminNote?: string,
    postalTrackingCode?: string,
    shippingStatus?: string
  ): Promise<ProductOrder> {
    AuthorizationPolicy.requireRole(authCtx, ['admin', 'supervisor']);
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();

    const oBuf = toIdBuffer(orderId);
    const p = getPool();
    const noteText = adminNote || (status === 'confirmed' ? 'پرداخت و فیش سفارش تایید شد.' : 'فیش ارسالی مورد تایید قرار نگرفت.');

    const [res]: any = await p.query(
      `UPDATE product_orders
       SET payment_status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP(3),
           postal_tracking_code = COALESCE(?, postal_tracking_code),
           shipping_status = COALESCE(?, shipping_status),
           version = version + 1
       WHERE (id = ? OR id = ?) AND version = ? AND deleted_at IS NULL`,
      [status, noteText, authCtx.fullName, postalTrackingCode || null, shippingStatus || null, oBuf, orderId, expectedVersion]
    );

    if (res && res.affectedRows === 0) {
      throw AppError.conflict('سفارش یافت نشد یا نسخه آن تغییر کرده است.', 'CONCURRENT_MODIFICATION_CONFLICT');
    }

    const rows = await selectWithTimeout<any>(
      `SELECT * FROM product_orders WHERE id = ? OR id = ? LIMIT 1`,
      [oBuf, orderId]
    );
    const updatedOrder = mapProductOrderRow(rows[0]);

    outbox.enqueue('products.order_updated', {
      id: updatedOrder.id,
      resourceId: updatedOrder.id,
      orderId: updatedOrder.id,
      version: updatedOrder.version,
      order: updatedOrder,
      updates: updatedOrder,
      actorId: authCtx.userId,
    });

    return updatedOrder;
  }

  async purchase(
    authCtx: AuthContext,
    productId: string,
    dto: PurchaseProductDto = {}
  ): Promise<{ product: Product & { version: number }; order: ProductOrder }> {
    ensureDatabaseConnection();
    await ensureDomainTablesAndIndexes();
    const isOfficial = isOrganizationalUserRole(authCtx.role);
    const storeConfig = await loadProductsStoreConfig();

    // Enforce master store toggle & category toggle
    if (!isOfficial && !storeConfig.isStoreEnabled) {
      throw AppError.forbidden(
        storeConfig.disabledNotice || 'بخش کتاب و محصولات چند رسانه‌ای موقتاً توسط مدیریت غیرفعال است.',
        'PRODUCT_SECTION_DISABLED'
      );
    }

    const product = await this.getById(productId, authCtx);
    if (!product) throw AppError.notFound(`اثر با شناسه ${productId}`);

    if (!isOfficial && storeConfig.enabledCategories[product.format] === false) {
      throw AppError.forbidden(
        'فروش این دسته‌بندی از محصولات موقتاً توسط مدیریت غیرفعال شده است.',
        'PRODUCT_CATEGORY_DISABLED'
      );
    }

    if (authCtx.role === 'customer' && product.visibleToCustomer === false) {
      throw AppError.forbidden('امکان خرید این اثر برای کاربران مشتری وجود ندارد.');
    }

    const purchaseFormat: 'digital' | 'physical' =
      dto.purchaseFormat === 'physical'
        ? 'physical'
        : dto.purchaseFormat === 'digital'
        ? 'digital'
        : product.supportsDigital
        ? 'digital'
        : 'physical';

    if (purchaseFormat === 'digital' && !product.supportsDigital) {
      throw AppError.badRequest('نسخه دیجیتال برای این محصول فعال نیست.');
    }
    if (purchaseFormat === 'physical' && !product.supportsPhysical) {
      throw AppError.badRequest('نسخه فیزیکی برای این محصول فعال نیست.');
    }

    // Server-authoritative base price calculation
    const baseAmount =
      purchaseFormat === 'digital'
        ? Math.max(0, Number(product.digitalPrice ?? product.price ?? 0))
        : Math.max(0, Number(product.physicalPrice ?? product.price ?? 0));

    let deliveryMethod: 'complex_pickup' | 'postal' | 'courier' | 'digital_instant' = 'digital_instant';
    let shippingFee = 0;
    let shippingNotice = 'دسترسی و دانلود آنی فایل‌ها و جلسات محصول در کتابخانه من';
    let shippingAddress: string | null = null;

    if (purchaseFormat === 'physical') {
      const opts = product.deliveryOptions || storeConfig.defaultDeliveryOptions || DEFAULT_DELIVERY_OPTIONS;
      const requestedDelivery = dto.deliveryMethod;
      if (requestedDelivery !== 'complex_pickup' && requestedDelivery !== 'postal' && requestedDelivery !== 'courier') {
        throw AppError.badRequest('در خرید فیزیکی، انتخاب روش تحویل (تحویل در مجتمع، پست یا پیک) الزامی است.');
      }

      const selectedOpt =
        requestedDelivery === 'complex_pickup'
          ? opts.complexPickup
          : requestedDelivery === 'postal'
          ? opts.postal
          : opts.courier;

      if (!selectedOpt?.enabled) {
        throw AppError.badRequest('روش تحویل انتخاب‌شده برای این محصول فعال نیست.');
      }

      deliveryMethod = requestedDelivery;
      shippingFee = Math.max(0, Number(selectedOpt.fee || 0));
      shippingNotice =
        selectedOpt.notice ||
        selectedOpt.label ||
        (deliveryMethod === 'complex_pickup'
          ? 'تحویل حضوری در مجتمع'
          : deliveryMethod === 'postal'
          ? 'ارسال با پست پیشتاز'
          : 'ارسال با پیک');

      if (deliveryMethod === 'postal' || deliveryMethod === 'courier') {
        const addr = String(dto.shippingAddress || '').trim();
        if (addr.length < 6) {
          throw AppError.badRequest('لطفاً نشانی دقیق تحویل (شهر، خیابان، پلاک) را وارد نمایید.');
        }
        shippingAddress = addr;
      }
    }

    const totalAmount = baseAmount + shippingFee;
    const paymentPolicy = product.allowedPaymentMethod || 'both';
    const paymentMethod: 'online_gateway' | 'bank_receipt' =
      dto.paymentMethod === 'bank_receipt' ? 'bank_receipt' : 'online_gateway';

    if (paymentPolicy === 'gateway_only' && paymentMethod !== 'online_gateway') {
      throw AppError.badRequest('برای این محصول صرفاً پرداخت از طریق درگاه آنلاین مجاز است.');
    }
    if (paymentPolicy === 'receipt_only' && paymentMethod !== 'bank_receipt') {
      throw AppError.badRequest('برای این محصول صرفاً بارگذاری تصویر فیش بانکی مجاز است.');
    }

    let gatewayId: string | null = null;
    let gatewayName: string | null = null;
    let receiptFileUrl: string | null = null;
    let receiptBankName: string | null = null;
    let paymentStatus: ProductOrder['paymentStatus'] = 'confirmed';

    if (paymentMethod === 'online_gateway') {
      const activeGateways = (storeConfig.gateways || []).filter(g => g.isActive);
      const chosenGw = activeGateways.find(g => g.id === dto.gatewayId) || activeGateways[0];
      if (!chosenGw) {
        throw AppError.badRequest('هیچ درگاه پرداخت فعالی در تنظیمات فروشگاه تعریف نشده است.');
      }
      gatewayId = chosenGw.id;
      gatewayName = chosenGw.name;
      receiptBankName = chosenGw.name;
      paymentStatus = 'confirmed';
    } else {
      const receiptUrl = String(dto.receiptFileUrl || '').trim();
      if (!receiptUrl || !receiptUrl.startsWith('/api/storage/private/product_receipts/')) {
        throw AppError.badRequest('در پرداخت با فیش بانکی، بارگذاری تصویر فیش معتبر الزامی است.');
      }
      receiptFileUrl = receiptUrl;
      receiptBankName = String(dto.receiptBankName || storeConfig.bankName || 'بانک ملی ایران').trim();
      paymentStatus = 'pending_review';
    }

    const pBuf = toIdBuffer(productId);
    const uBuf = toIdBuffer(authCtx.userId);
    const orderId = generateUUIDv7();
    const oBuf = toIdBuffer(orderId);
    const trackingCode = `PRD-${Date.now().toString().slice(-7)}`;

    const p = getPool();
    const [userRows]: any = await p.query(
      `SELECT phone, national_id, role_title, full_name FROM users WHERE id = ? LIMIT 1`,
      [uBuf]
    );
    const userRow = userRows?.[0] || {};
    const buyerName = userRow.full_name || authCtx.fullName;
    const buyerPhone = userRow.phone || '09120000000';
    const buyerNationalId = userRow.national_id || '';
    const buyerRoleTitle = userRow.role_title || 'دانش‌آموخته';

    return await withTx(async (conn) => {
      if (purchaseFormat === 'physical') {
        const [stockRes]: any = await conn.query(
          `UPDATE products
           SET stock = stock - 1, version = version + 1
           WHERE (id = ? OR id = ?) AND stock >= 1`,
          [pBuf, productId]
        );
        if (!stockRes || stockRes.affectedRows === 0) {
          throw AppError.conflict('موجودی نسخه فیزیکی این محصول به پایان رسیده است.', 'PRODUCT_OUT_OF_STOCK');
        }
      }

      await conn.query(
        `INSERT INTO product_orders (
          id, product_id, product_title, product_format, purchase_format, delivery_method,
          user_id, user_name, user_phone, user_national_id, user_role_title,
          base_amount, shipping_fee, amount_paid, payment_method, gateway_id, gateway_name,
          payment_status, tracking_code, receipt_file_url, receipt_bank_name,
          shipping_address, shipping_notice, shipping_status, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          oBuf,
          pBuf,
          product.title,
          product.format,
          purchaseFormat,
          deliveryMethod,
          uBuf,
          buyerName,
          buyerPhone,
          buyerNationalId,
          buyerRoleTitle,
          baseAmount,
          shippingFee,
          totalAmount,
          paymentMethod,
          gatewayId,
          gatewayName,
          paymentStatus,
          trackingCode,
          receiptFileUrl,
          receiptBankName,
          shippingAddress,
          shippingNotice,
          purchaseFormat === 'digital' ? 'تحویل دیجیتال آماده' : 'در حال آماده‌سازی ارسال',
        ]
      );

      const [insertedOrderRows]: any = await conn.query(
        `SELECT * FROM product_orders WHERE id = ? LIMIT 1`,
        [oBuf]
      );
      const createdOrder = mapProductOrderRow(insertedOrderRows[0]);

      // Fetch fresh raw product row inside the transaction so confirmed buyers get unlocked downloadLink & mediaSessions immediately
      const [freshProdRows]: any = await conn.query(
        `SELECT * FROM products WHERE id = ? OR id = ? LIMIT 1`,
        [pBuf, productId]
      );

      auditChain.appendEntry({
        eventType: 'CARTABLE_STATUS_CHANGE',
        actorId: authCtx.userId,
        actorName: buyerName,
        actorRole: authCtx.role,
        ip: '127.0.0.1',
        details: `ثبت سفارش [${product.title}] (${purchaseFormat === 'digital' ? 'نسخه دیجیتال' : 'نسخه فیزیکی'}) به مبلغ ${totalAmount} تومان با کد رهگیری ${trackingCode}.`,
        severity: 'info',
      });

      const updatedOwnedFormats: Array<'digital' | 'physical'> = Array.from(
        new Set([...(product.ownedFormats || []), ...(paymentStatus === 'confirmed' ? [purchaseFormat] : [])])
      );
      const isNowOwned = Boolean(paymentStatus === 'confirmed' || product.isOwned);
      const includeProtectedMedia = isOfficial || isNowOwned;

      const updatedProduct: Product & { version: number } = freshProdRows?.[0]
        ? mapProductRow(freshProdRows[0], isNowOwned, updatedOwnedFormats, includeProtectedMedia)
        : {
            ...product,
            stock: purchaseFormat === 'physical' ? Math.max(0, (product.stock || 1) - 1) : product.stock,
            isOwned: isNowOwned,
            ownedFormats: updatedOwnedFormats,
            version: (product.version || 1) + (purchaseFormat === 'physical' ? 1 : 0),
          };

      outbox.enqueue('products.purchased', {
        id: productId,
        resourceId: productId,
        productId,
        userId: authCtx.userId,
        orderId,
        order: createdOrder,
        priceTomans: totalAmount,
      });

      return {
        product: updatedProduct,
        order: createdOrder,
      };
    });
  }
}

export function createProductsRouter(): Router {
  const router = Router();
  const service = new ProductsService();

  // Static paths MUST precede /:id parameterized routes
  router.get('/store-config', async (_req: Request, res: Response, next) => {
    try {
      const cfg = await loadProductsStoreConfig();
      res.json(cfg);
    } catch (err) {
      next(err);
    }
  });

  router.put('/store-config', async (req: Request, res: Response, next) => {
    try {
      ensureDatabaseConnection();
      await ensureDomainTablesAndIndexes();
      const currentUser = getCurrentUser(req);
      AuthorizationPolicy.requireRole(
        { userId: currentUser.id, role: currentUser.role, fullName: currentUser.fullName },
        ['admin', 'supervisor']
      );

      const currentCfg = await loadProductsStoreConfig();
      const expVer = extractExpectedVersion(req, true);
      const incoming = req.body?.config || req.body || {};
      const { version: _v, expectedVersion: _ev, ...clean } = incoming;

      const mergedEnabled: Record<string, boolean> = {
        ...DEFAULT_PRODUCTS_STORE_CONFIG.enabledCategories,
        ...(currentCfg.enabledCategories || {}),
        ...(clean.enabledCategories || {}),
      };

      const rawCategories =
        clean.customCategories !== undefined
          ? clean.customCategories
          : currentCfg.customCategories;
      const customCategories = normalizeCustomCategories(rawCategories, mergedEnabled);
      for (const cat of customCategories) {
        if (mergedEnabled[cat.id] === undefined) {
          mergedEnabled[cat.id] = cat.isEnabled;
        }
      }

      const merged: ProductsStoreConfig = {
        ...DEFAULT_PRODUCTS_STORE_CONFIG,
        ...currentCfg,
        ...clean,
        enabledCategories: mergedEnabled,
        customCategories,
        defaultDeliveryOptions: {
          complexPickup: {
            ...DEFAULT_DELIVERY_OPTIONS.complexPickup,
            ...(currentCfg.defaultDeliveryOptions?.complexPickup || {}),
            ...(clean.defaultDeliveryOptions?.complexPickup || {}),
          },
          postal: {
            ...DEFAULT_DELIVERY_OPTIONS.postal,
            ...(currentCfg.defaultDeliveryOptions?.postal || {}),
            ...(clean.defaultDeliveryOptions?.postal || {}),
          },
          courier: {
            ...DEFAULT_DELIVERY_OPTIONS.courier,
            ...(currentCfg.defaultDeliveryOptions?.courier || {}),
            ...(clean.defaultDeliveryOptions?.courier || {}),
          },
        },
      };
      delete (merged as any).version;

      const p = getPool();
      const [updRes]: any = await p.query(
        `UPDATE system_settings
         SET setting_value = ?, last_modified_by = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP(3)
         WHERE setting_key = 'products_store_config' AND version = ?`,
        [JSON.stringify(merged), currentUser.fullName, expVer]
      );

      if (updRes && updRes.affectedRows === 0) {
        throw AppError.conflict(
          'تنظیمات بخش کتاب و محصولات چند رسانه‌ای توسط مدیر دیگری تغییر یافته است.',
          'CONCURRENT_MODIFICATION_CONFLICT'
        );
      }

      const fresh = await loadProductsStoreConfig();
      outbox.enqueue('products.store_config_updated', {
        id: 'products_store_config',
        version: fresh.version,
        config: fresh,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
      });

      res.json({ success: true, config: fresh });
    } catch (err) {
      next(err);
    }
  });

  router.put('/reorder', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
      if (orderedIds.length === 0) {
        throw AppError.badRequest('لیست ترتیب محصولات ارسال نشده است.');
      }
      await service.reorderProducts(authCtx, orderedIds);
      res.json({ success: true, orderedIds });
    } catch (err) {
      next(err);
    }
  });

  router.get('/orders', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const orders = await service.getOrders(authCtx);
      res.json(orders);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/orders/:orderId/status', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = extractExpectedVersion(req, true);
      const { status, adminNote, postalTrackingCode, shippingStatus } = req.body || {};
      if (status !== 'confirmed' && status !== 'rejected') {
        throw AppError.badRequest('وضعیت سفارش باید confirmed یا rejected باشد.');
      }
      const updated = await service.reviewOrderStatus(
        authCtx,
        req.params.orderId,
        status,
        expectedVersion,
        adminNote,
        postalTrackingCode,
        shippingStatus
      );
      res.json({ success: true, order: updated });
    } catch (err) {
      next(err);
    }
  });

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
      const expectedVersion = extractExpectedVersion(req, true);
      const updated = await service.updateProduct(authCtx, req.params.id, req.body, expectedVersion);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/showcase', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const showInShowcase = Boolean(req.body?.showInShowcase);
      const hasExplicitVersion =
        req.headers['if-match'] !== undefined ||
        (req.body?.expectedVersion !== undefined && req.body?.expectedVersion !== null) ||
        (req.body?.version !== undefined && req.body?.version !== null);
      const expectedVersion = hasExplicitVersion ? extractExpectedVersion(req, false) : undefined;
      const updated = await service.toggleShowcase(authCtx, req.params.id, showInShowcase, expectedVersion);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const expectedVersion = extractExpectedVersion(req, true);
      await service.softDeleteProduct(authCtx, req.params.id, expectedVersion);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/purchase', async (req: Request, res: Response, next) => {
    try {
      const u = getCurrentUser(req);
      const authCtx: AuthContext = { userId: u.id, role: u.role, fullName: u.fullName };
      const result = await service.purchase(authCtx, req.params.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

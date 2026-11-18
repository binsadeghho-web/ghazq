import { getPool, ensureDatabaseConnection } from '../../platform/mysqlDatabase';
import { ensureDomainTablesAndIndexes } from '../../platform/domainTablesSetup';
import { fromIdBuffer } from '../../platform/uuidv7';
import {
  Product,
  ProductDeliveryOptionsMap,
  ProductOrder,
  ProductsStoreConfig,
} from '../../../types';

export const DEFAULT_DELIVERY_OPTIONS: ProductDeliveryOptionsMap = {
  complexPickup: {
    enabled: true,
    fee: 0,
    label: 'تحویل حضوری در مجتمع',
    notice: 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه انتشارات (شنبه تا چهارشنبه ۸ الی ۱۴:۳۰)',
  },
  postal: {
    enabled: true,
    fee: 65000,
    label: 'ارسال با پست پیشتاز',
    notice: 'ارسال سراسری با بسته‌بندی ایمن و صدور کد رهگیری مرسوله پستی',
  },
  courier: {
    enabled: true,
    fee: 95000,
    label: 'ارسال با پیک اختصاصی',
    notice: 'تحویل سریع درب منزل یا محل کار توسط پیک (قم و تهران)',
  },
};

export const DEFAULT_PRODUCTS_STORE_CONFIG: ProductsStoreConfig = {
  isStoreEnabled: true,
  disabledNotice: 'بخش کتاب و محصولات چند رسانه‌ای موقتاً توسط مدیریت سامانه در حال به‌روزرسانی است.',
  enabledCategories: {
    book: true,
    multimedia: true,
    audio_series: true,
  },
  storeTitle: 'کتاب و محصولات چند رسانه‌ای',
  storeSubtitle:
    'عرضه تخصصی کتب مرجع، بسته‌های چندرسانه‌ای و درس‌گفتارهای صوتی مرکز فقه و حقوق اسلامی با امکان انتخاب نسخه دیجیتال یا فیزیکی و پرداخت امن',
  gateways: [
    {
      id: 'gw_zarinpal',
      name: 'درگاه امن زرین‌پال (شتاب)',
      providerCode: 'zarinpal',
      description: 'پرداخت آنی با کلیه کارت‌های عضو شبکه شتاب و تایید لحظه‌ای سفارش',
      badge: 'پیشنهادی',
      isActive: true,
    },
    {
      id: 'gw_behpardakht',
      name: 'درگاه شاپرک (به‌پرداخت ملت)',
      providerCode: 'behpardakht',
      description: 'درگاه رسمی بانک ملت ویژه تراکنش‌های انتشارات و مؤسسات علمی',
      badge: 'رسمی',
      isActive: true,
    },
  ],
  bankCardNumber: '۶۰۳۷-۹۹۷۵-۹۵۰۰-۱۴۰۳',
  bankAccountHolder: 'مرکز نخبگان فقه و قضا (بخش انتشارات)',
  bankSheba: 'IR450170000000112233445566',
  bankName: 'بانک ملی ایران',
  defaultDeliveryOptions: DEFAULT_DELIVERY_OPTIONS,
  version: 1,
};

export function parseJsonValue<T>(val: any, fallback: T): T {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return (parsed ?? fallback) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof val === 'object') return val as T;
  return fallback;
}

export function normalizeDeliveryOptions(
  raw: any,
  legacyRow?: any
): ProductDeliveryOptionsMap {
  const parsed = parseJsonValue<Partial<ProductDeliveryOptionsMap> | null>(raw, null);
  if (parsed && parsed.complexPickup && parsed.postal && parsed.courier) {
    return {
      complexPickup: {
        enabled: Boolean(parsed.complexPickup.enabled),
        fee: Math.max(0, Number(parsed.complexPickup.fee || 0)),
        label: parsed.complexPickup.label || DEFAULT_DELIVERY_OPTIONS.complexPickup.label,
        notice: parsed.complexPickup.notice || legacyRow?.pickup_address_notice || DEFAULT_DELIVERY_OPTIONS.complexPickup.notice,
      },
      postal: {
        enabled: Boolean(parsed.postal.enabled),
        fee: Math.max(0, Number(parsed.postal.fee || 0)),
        label: parsed.postal.label || DEFAULT_DELIVERY_OPTIONS.postal.label,
        notice: parsed.postal.notice || DEFAULT_DELIVERY_OPTIONS.postal.notice,
      },
      courier: {
        enabled: Boolean(parsed.courier.enabled),
        fee: Math.max(0, Number(parsed.courier.fee || 0)),
        label: parsed.courier.label || DEFAULT_DELIVERY_OPTIONS.courier.label,
        notice: parsed.courier.notice || DEFAULT_DELIVERY_OPTIONS.courier.notice,
      },
    };
  }

  const shippingMode = legacyRow?.shipping_mode || 'both';
  const costType = legacyRow?.shipping_cost_type || 'free';
  const fixedFee = costType === 'fixed' ? Math.max(0, Number(legacyRow?.shipping_fixed_fee || 50000)) : 0;

  return {
    complexPickup: {
      enabled: shippingMode === 'both' || shippingMode === 'pickup_only',
      fee: 0,
      label: DEFAULT_DELIVERY_OPTIONS.complexPickup.label,
      notice: legacyRow?.pickup_address_notice || DEFAULT_DELIVERY_OPTIONS.complexPickup.notice,
    },
    postal: {
      enabled: shippingMode === 'both' || shippingMode === 'postal_only',
      fee: fixedFee,
      label: DEFAULT_DELIVERY_OPTIONS.postal.label,
      notice: DEFAULT_DELIVERY_OPTIONS.postal.notice,
    },
    courier: {
      enabled: shippingMode === 'both',
      fee: DEFAULT_DELIVERY_OPTIONS.courier.fee,
      label: DEFAULT_DELIVERY_OPTIONS.courier.label,
      notice: DEFAULT_DELIVERY_OPTIONS.courier.notice,
    },
  };
}

export function getDefaultDigitalLabel(format: Product['format']): string {
  if (format === 'book') return 'نسخه الکترونیک (PDF)';
  if (format === 'audio_series') return 'فایل صوتی دیجیتال (MP3)';
  return 'بسته دیجیتال چندرسانه‌ای (دانلودی/برخط)';
}

export function getDefaultPhysicalLabel(format: Product['format']): string {
  if (format === 'book') return 'نسخه چاپی فیزیکی (جلد گالینگور)';
  if (format === 'audio_series') return 'پکیج فیزیکی لوح/فلش صوتی';
  return 'پکیج فیزیکی لوح فشرده / حافظه چندرسانه‌ای';
}

export function mapProductRow(
  row: any,
  isOwned = false,
  ownedFormats: Array<'digital' | 'physical'> = []
): Product & { version: number } {
  const format: Product['format'] =
    row.format === 'multimedia' || row.format === 'audio_series' ? row.format : 'book';
  const basePrice = Number(row.price || 0);
  const gallery = parseJsonValue<string[]>(row.gallery_images, []);
  const coverImage = row.cover_image || gallery[0] || undefined;
  const mergedGallery = coverImage && !gallery.includes(coverImage)
    ? [coverImage, ...gallery]
    : gallery;

  const supportsDigital =
    row.supports_digital === undefined || row.supports_digital === null
      ? true
      : Boolean(row.supports_digital);
  const supportsPhysical =
    row.supports_physical === undefined || row.supports_physical === null
      ? format === 'book'
      : Boolean(row.supports_physical);

  const digitalPrice =
    row.digital_price !== undefined && row.digital_price !== null
      ? Number(row.digital_price)
      : format === 'book'
      ? Math.round(basePrice * 0.6)
      : basePrice;
  const physicalPrice =
    row.physical_price !== undefined && row.physical_price !== null
      ? Number(row.physical_price)
      : format === 'book'
      ? basePrice
      : basePrice + 120000;

  return {
    id: fromIdBuffer(row.id),
    title: row.title || '',
    subtitle: row.subtitle || undefined,
    shortDescription: row.short_description || (row.description ? String(row.description).slice(0, 140) : ''),
    subjectIndex: row.subject_index || undefined,
    authorOrPresenter: row.author_or_presenter || '',
    format,
    formatTitle: row.format_title || (format === 'book' ? 'کتاب' : format === 'multimedia' ? 'محصول چندرسانه‌ای' : 'صوت'),
    price: supportsDigital && !supportsPhysical ? digitalPrice : supportsPhysical ? physicalPrice : basePrice,
    supportsDigital,
    digitalPrice,
    digitalFormatLabel: row.digital_format_label || getDefaultDigitalLabel(format),
    supportsPhysical,
    physicalPrice,
    physicalFormatLabel: row.physical_format_label || getDefaultPhysicalLabel(format),
    deliveryOptions: normalizeDeliveryOptions(row.delivery_options, row),
    description: row.description || '',
    pagesOrDuration: row.pages_or_duration || '',
    publishedYear: row.published_year || '۱۴۰۳',
    publisher: row.publisher || 'انتشارات مرکز فقه و حقوق اسلامی',
    isbn: row.isbn || undefined,
    coverImage,
    galleryImages: mergedGallery,
    downloadLink: row.download_link || undefined,
    allowedPaymentMethod: (row.allowed_payment_method as any) || 'both',
    shippingMode: (row.shipping_mode as any) || 'both',
    shippingCostType: (row.shipping_cost_type as any) || 'free',
    shippingFixedFee: Number(row.shipping_fixed_fee || 0),
    pickupAddressNotice: row.pickup_address_notice || DEFAULT_DELIVERY_OPTIONS.complexPickup.notice,
    isAvailable: row.is_available !== undefined ? Boolean(row.is_available) : true,
    stock: Number(row.stock !== undefined && row.stock !== null ? row.stock : 20),
    displayOrder: Number(row.display_order || 0),
    badgeText: row.badge_text || undefined,
    isOwned,
    ownedFormats,
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at ? new Date(row.deleted_at).toISOString() : undefined,
    deletedBy: row.deleted_by || undefined,
    visibleToCustomer: row.visible_to_customer !== undefined && row.visible_to_customer !== null ? Boolean(row.visible_to_customer) : true,
    version: Number(row.version || 1),
  };
}

export function mapProductOrderRow(row: any): ProductOrder {
  const deliveryMethod = (row.delivery_method || 'digital_instant') as ProductOrder['deliveryMethod'];
  const fulfillmentChoice: ProductOrder['fulfillmentChoice'] =
    deliveryMethod === 'complex_pickup'
      ? 'pickup'
      : deliveryMethod === 'courier'
      ? 'courier'
      : deliveryMethod === 'postal'
      ? 'postal'
      : undefined;

  return {
    id: fromIdBuffer(row.id),
    productId: fromIdBuffer(row.product_id),
    productTitle: row.product_title || '',
    productFormat: (row.product_format as ProductOrder['productFormat']) || 'book',
    purchaseFormat: (row.purchase_format as 'digital' | 'physical') || 'digital',
    deliveryMethod,
    userId: fromIdBuffer(row.user_id),
    userName: row.user_name || '',
    userPhone: row.user_phone || '',
    userNationalId: row.user_national_id || '',
    userRoleTitle: row.user_role_title || 'دانش‌آموخته',
    orderedAt: row.ordered_at ? new Date(row.ordered_at).toISOString() : new Date().toISOString(),
    baseAmount: Number(row.base_amount || row.amount_paid || 0),
    amountPaid: Number(row.amount_paid || 0),
    paymentMethod: (row.payment_method as 'online_gateway' | 'bank_receipt') || 'online_gateway',
    gatewayId: row.gateway_id || undefined,
    gatewayName: row.gateway_name || undefined,
    paymentStatus: (row.payment_status as ProductOrder['paymentStatus']) || 'pending_review',
    trackingCode: row.tracking_code || '',
    receiptFileUrl: row.receipt_file_url || undefined,
    receiptBankName: row.receipt_bank_name || undefined,
    fulfillmentChoice,
    shippingFee: Number(row.shipping_fee || 0),
    shippingNotice: row.shipping_notice || undefined,
    shippingAddress: row.shipping_address || undefined,
    postalTrackingCode: row.postal_tracking_code || undefined,
    shippingStatus: row.shipping_status || undefined,
    adminNote: row.admin_note || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
    version: Number(row.version || 1),
  };
}

export async function loadProductsStoreConfig(): Promise<ProductsStoreConfig> {
  ensureDatabaseConnection();
  await ensureDomainTablesAndIndexes();
  const p = getPool();
  const [rows]: any = await p.query(
    `SELECT setting_value, version FROM system_settings WHERE setting_key = 'products_store_config' LIMIT 1`
  );
  if (!rows || rows.length === 0) {
    await p.query(
      `INSERT IGNORE INTO system_settings (setting_key, setting_value, description, version)
       VALUES ('products_store_config', ?, 'تنظیمات بخش کتاب و محصولات چند رسانه‌ای، درگاه‌ها و ارسال', 1)`,
      [JSON.stringify(DEFAULT_PRODUCTS_STORE_CONFIG)]
    );
    return { ...DEFAULT_PRODUCTS_STORE_CONFIG, version: 1 };
  }

  const parsed = parseJsonValue<Partial<ProductsStoreConfig>>(rows[0].setting_value, {});
  return {
    ...DEFAULT_PRODUCTS_STORE_CONFIG,
    ...parsed,
    enabledCategories: {
      ...DEFAULT_PRODUCTS_STORE_CONFIG.enabledCategories,
      ...(parsed.enabledCategories || {}),
    },
    gateways:
      Array.isArray(parsed.gateways) && parsed.gateways.length > 0
        ? parsed.gateways
        : DEFAULT_PRODUCTS_STORE_CONFIG.gateways,
    defaultDeliveryOptions: {
      complexPickup: {
        ...DEFAULT_DELIVERY_OPTIONS.complexPickup,
        ...(parsed.defaultDeliveryOptions?.complexPickup || {}),
      },
      postal: {
        ...DEFAULT_DELIVERY_OPTIONS.postal,
        ...(parsed.defaultDeliveryOptions?.postal || {}),
      },
      courier: {
        ...DEFAULT_DELIVERY_OPTIONS.courier,
        ...(parsed.defaultDeliveryOptions?.courier || {}),
      },
    },
    version: Number(rows[0].version || 1),
  };
}

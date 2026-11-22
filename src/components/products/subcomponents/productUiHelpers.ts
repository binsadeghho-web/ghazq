import {
  Product,
  ProductCategoryConfig,
  ProductDeliveryOptionsMap,
  ProductMediaSession,
  ProductOrder,
  ProductsStoreConfig,
} from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';

export type ProductShelfKey = string;

export const BUILT_IN_PRODUCT_CATEGORIES: ProductCategoryConfig[] = [
  {
    id: 'book',
    label: 'کتب و منشورات علمی',
    shortLabel: 'کتب',
    kind: 'book',
    isEnabled: true,
    isBuiltIn: true,
  },
  {
    id: 'multimedia',
    label: 'نشست‌های علمی (صوتی و تصویری)',
    shortLabel: 'نشست‌ها',
    kind: 'session',
    isEnabled: true,
    isBuiltIn: true,
  },
  {
    id: 'audio_series',
    label: 'درس‌گفتارها و سلسله مباحث',
    shortLabel: 'درس‌گفتارها',
    kind: 'lecture',
    isEnabled: true,
    isBuiltIn: true,
  },
];

export const PRODUCT_FORMAT_LABELS: Record<string, string> = {
  book: 'کتب و منشورات علمی',
  multimedia: 'نشست‌های علمی (صوتی و تصویری)',
  audio_series: 'درس‌گفتارها و سلسله مباحث',
};

export const PRODUCT_FORMAT_SHORT_LABELS: Record<string, string> = {
  book: 'کتب',
  multimedia: 'نشست‌ها',
  audio_series: 'درس‌گفتارها',
};

export const MEDIA_TYPE_LABELS: Record<ProductMediaSession['mediaType'], string> = {
  audio: 'فایل صوتی نشست / جلسه',
  video: 'فایل ویدئویی جلسه',
  document: 'جزوه / فایل PDF',
  file: 'فایل ضمیمه',
};

export const CATEGORY_KIND_LABELS: Record<ProductCategoryConfig['kind'], string> = {
  book: 'کتاب / اثر مکتوب',
  session: 'نشست صوتی و تصویری',
  lecture: 'درس‌گفتار / سلسله جلسات',
  multimedia: 'محصول چندرسانه‌ای',
  custom: 'عنوان ارائه جدید / سفارشی',
};

export const DELIVERY_METHOD_LABELS: Record<NonNullable<ProductOrder['deliveryMethod']>, string> = {
  digital_instant: 'دانلود / دسترسی آنی دیجیتال',
  complex_pickup: 'تحویل حضوری در مجتمع',
  postal: 'ارسال با پست پیشتاز',
  courier: 'ارسال با پیک اختصاصی',
};

export const PAYMENT_STATUS_LABELS: Record<ProductOrder['paymentStatus'], string> = {
  confirmed: 'تایید و قطعی‌شده',
  pending_review: 'در انتظار تایید فیش',
  rejected: 'ردشده / نیازمند بررسی',
};

export function getAllProductCategories(storeConfig?: ProductsStoreConfig | null): ProductCategoryConfig[] {
  const enabledMap = storeConfig?.enabledCategories || {};
  const byId = new Map<string, ProductCategoryConfig>();

  for (const def of BUILT_IN_PRODUCT_CATEGORIES) {
    byId.set(def.id, {
      ...def,
      isEnabled: enabledMap[def.id] !== undefined ? Boolean(enabledMap[def.id]) : def.isEnabled,
    });
  }

  const saved = Array.isArray(storeConfig?.customCategories) ? storeConfig.customCategories : [];
  for (const cat of saved) {
    if (!cat || !cat.id || !cat.label) continue;
    const existing = byId.get(cat.id);
    byId.set(cat.id, {
      id: cat.id,
      label: cat.label,
      shortLabel: cat.shortLabel || existing?.shortLabel || cat.label,
      kind: cat.kind || existing?.kind || 'custom',
      isEnabled:
        enabledMap[cat.id] !== undefined
          ? Boolean(enabledMap[cat.id])
          : cat.isEnabled !== undefined
          ? Boolean(cat.isEnabled)
          : true,
      isBuiltIn: existing?.isBuiltIn || Boolean(cat.isBuiltIn),
    });
  }

  return Array.from(byId.values());
}

export function getProductCategoryLabel(
  format?: string,
  formatTitle?: string,
  storeConfig?: ProductsStoreConfig | null
): string {
  const fmt = String(format || '').trim();
  const matched = getAllProductCategories(storeConfig).find(c => c.id === fmt);
  if (matched) return matched.label;
  if (formatTitle && formatTitle.trim()) return formatTitle.trim();
  return PRODUCT_FORMAT_LABELS[fmt] || 'محصول علمی و رسانه‌ای';
}

export function getPresentersList(product?: Partial<Product> | null): string[] {
  if (!product) return [];
  if (Array.isArray(product.presenters) && product.presenters.length > 0) {
    const cleaned = product.presenters.map(p => String(p || '').trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }
  const raw = String(product.authorOrPresenter || '').trim();
  if (!raw) return [];
  return raw
    .split(/[،,;؛\n]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function formatPresentersText(product?: Partial<Product> | null): string {
  const list = getPresentersList(product);
  if (list.length > 0) return list.join('، ');
  return String(product?.authorOrPresenter || 'مرکز فقه و حقوق اسلامی');
}

export function isSafeMediaUrl(url?: string | null): boolean {
  const raw = String(url || '').trim();
  if (!raw) return false;
  if (
    raw.startsWith('/uploads/') ||
    raw.startsWith('/api/storage/private/') ||
    raw.startsWith('/assets/')
  ) {
    return true;
  }
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function triggerSafeMediaDownload(
  url: string,
  suggestedName?: string
): Promise<void> {
  if (!isSafeMediaUrl(url)) {
    throw new Error('نشانی فایل معتبر یا مجاز نیست.');
  }
  if (url.startsWith('/api/storage/private/')) {
    await api.downloadPrivateFile(url, suggestedName);
    return;
  }
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  if (suggestedName) {
    link.download = suggestedName;
  }
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function resolvePlayableMediaUrl(url: string): Promise<{ src: string; revoke?: () => void }> {
  if (!isSafeMediaUrl(url)) {
    throw new Error('نشانی رسانه معتبر نیست.');
  }
  if (url.startsWith('/api/storage/private/')) {
    const { blob } = await api.fetchPrivateFileBlob(url);
    const objectUrl = URL.createObjectURL(blob);
    return {
      src: objectUrl,
      revoke: () => URL.revokeObjectURL(objectUrl),
    };
  }
  return { src: url };
}

export function formatTomans(amount?: number): string {
  const num = Math.max(0, Number(amount || 0));
  if (num === 0) return 'رایگان';
  return `${toPersianNumbers(num.toLocaleString('fa-IR'))} تومان`;
}

export function getDisplayPriceRange(product: Product): {
  primaryPrice: number;
  secondaryPrice?: number;
  modeLabel: string;
} {
  const hasDig = product.supportsDigital !== false;
  const hasPhys = Boolean(product.supportsPhysical);
  const dPrice = Math.max(0, Number(product.digitalPrice ?? product.price ?? 0));
  const pPrice = Math.max(0, Number(product.physicalPrice ?? product.price ?? 0));

  if (hasDig && hasPhys) {
    return {
      primaryPrice: Math.min(dPrice, pPrice),
      secondaryPrice: Math.max(dPrice, pPrice),
      modeLabel: 'دیجیتال / فیزیکی',
    };
  }
  if (hasPhys) {
    return {
      primaryPrice: pPrice,
      modeLabel: 'نسخه فیزیکی',
    };
  }
  return {
    primaryPrice: dPrice,
    modeLabel: 'نسخه دیجیتال',
  };
}

export function getEffectiveDeliveryOptions(
  product: Product,
  defaults: ProductDeliveryOptionsMap
): ProductDeliveryOptionsMap {
  return {
    complexPickup: {
      ...defaults.complexPickup,
      ...(product.deliveryOptions?.complexPickup || {}),
    },
    postal: {
      ...defaults.postal,
      ...(product.deliveryOptions?.postal || {}),
    },
    courier: {
      ...defaults.courier,
      ...(product.deliveryOptions?.courier || {}),
    },
  };
}

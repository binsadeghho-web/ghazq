import { Product, ProductDeliveryOptionsMap, ProductOrder } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';

export type ProductShelfKey = 'all' | 'book' | 'multimedia' | 'audio_series' | 'my_library' | 'orders';

export const PRODUCT_FORMAT_LABELS: Record<Product['format'], string> = {
  book: 'کتاب',
  multimedia: 'محصولات چندرسانه‌ای',
  audio_series: 'صوت و درس‌گفتار',
};

export const PRODUCT_FORMAT_SHORT_LABELS: Record<Product['format'], string> = {
  book: 'کتاب',
  multimedia: 'چندرسانه‌ای',
  audio_series: 'صوت',
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

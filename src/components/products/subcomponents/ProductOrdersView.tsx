import React, { useState } from 'react';
import { Product, ProductOrder, ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatTomans,
  getProductCategoryLabel,
  isSafeMediaUrl,
  triggerSafeMediaDownload,
} from './productUiHelpers';
import {
  PackageCheck,
  Truck,
  FileImage,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  MapPin,
  CreditCard,
  Download,
  Loader2,
} from 'lucide-react';

interface ProductOrdersViewProps {
  orders: ProductOrder[];
  products?: Product[];
  storeConfig?: ProductsStoreConfig;
  isOfficial: boolean;
  onReviewOrder: (
    orderId: string,
    status: 'confirmed' | 'rejected',
    adminNote?: string,
    postalTrackingCode?: string,
    shippingStatus?: string
  ) => Promise<void>;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

export const ProductOrdersView: React.FC<ProductOrdersViewProps> = ({
  orders,
  products = [],
  storeConfig,
  isOfficial,
  onReviewOrder,
  onNotify,
}) => {
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [postalInputs, setPostalInputs] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [receiptPreview, setReceiptPreview] = useState<{ url: string; title: string } | null>(null);

  const handleOpenReceipt = async (order: ProductOrder) => {
    if (!order.receiptFileUrl) return;
    try {
      const { blob } = await api.fetchPrivateFileBlob(order.receiptFileUrl);
      const objectUrl = URL.createObjectURL(blob);
      setReceiptPreview({
        url: objectUrl,
        title: `فیش سفارش ${order.trackingCode} — ${order.userName}`,
      });
    } catch (err: any) {
      onNotify(err?.message || 'امکان نمایش تصویر فیش وجود ندارد.', 'error');
    }
  };

  const handleDownloadOrderMedia = async (key: string, url: string, title: string) => {
    try {
      setDownloadingKey(key);
      await triggerSafeMediaDownload(url, title);
    } catch (err: any) {
      onNotify(err?.message || 'امکان دریافت فایل وجود ندارد.', 'error');
    } finally {
      setDownloadingKey(null);
    }
  };

  const closePreview = () => {
    if (receiptPreview?.url) {
      URL.revokeObjectURL(receiptPreview.url);
    }
    setReceiptPreview(null);
  };

  const handleAction = async (order: ProductOrder, status: 'confirmed' | 'rejected') => {
    try {
      setReviewingId(order.id);
      const postal = postalInputs[order.id]?.trim() || order.postalTrackingCode;
      const note = noteInputs[order.id]?.trim() || undefined;
      const shippingStatus =
        status === 'confirmed'
          ? postal
            ? 'تحویل داده شده به پست / در مسیر ارسال'
            : order.purchaseFormat === 'digital'
            ? 'تحویل دیجیتال فعال شد'
            : 'تایید و آماده ارسال'
          : 'ردشده توسط واحد مالی';
      await onReviewOrder(order.id, status, note, postal, shippingStatus);
      onNotify(
        status === 'confirmed'
          ? `سفارش ${order.trackingCode} تایید و وضعیت ارسال به‌روزرسانی شد.`
          : `سفارش ${order.trackingCode} رد شد.`
      );
    } catch (err: any) {
      onNotify(err?.message || 'خطا در به‌روزرسانی سفارش', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-14 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-black text-slate-700 dark:text-slate-200">
          هنوز سفارشی در این بخش ثبت نشده است.
        </p>
        <p className="text-xs text-slate-500">
          پس از ثبت سفارش کتاب، نشست علمی، درس‌گفتار یا محصول، کد رهگیری و سوابق پرداخت اینجا نمایش داده می‌شود.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {orders.map(order => {
          const matchedProduct = products.find(p => p.id === order.productId);
          const unlockedSessions =
            order.paymentStatus === 'confirmed' && matchedProduct
              ? (matchedProduct.mediaSessions || []).filter(s => isSafeMediaUrl(s.downloadUrl))
              : [];
          const hasMainDownload =
            order.paymentStatus === 'confirmed' &&
            matchedProduct &&
            isSafeMediaUrl(matchedProduct.downloadLink);

          const statusTone =
            order.paymentStatus === 'confirmed'
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
              : order.paymentStatus === 'rejected'
              ? 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25'
              : 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25';

          return (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      کد رهگیری: {toPersianNumbers(order.trackingCode)}
                    </span>
                    <span>·</span>
                    <span>{getProductCategoryLabel(order.productFormat, undefined, storeConfig)}</span>
                    <span>·</span>
                    <span>
                      {order.purchaseFormat === 'physical' ? 'نسخه فیزیکی' : 'نسخه دیجیتال / فایل'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {order.productTitle}
                  </h4>
                </div>

                <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 self-start md:self-center ${statusTone}`}>
                  {order.paymentStatus === 'confirmed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : order.paymentStatus === 'rejected' ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">خریدار و مشخصات:</span>
                  <strong className="text-slate-900 dark:text-white font-bold block mt-0.5">
                    {order.userName}
                  </strong>
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums block">
                    {toPersianNumbers(order.userPhone)}
                    {order.userNationalId ? ` · کدملی ${toPersianNumbers(order.userNationalId)}` : ''}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">جزئیات پرداخت:</span>
                  <strong className="text-slate-900 dark:text-white font-black tabular-nums block mt-0.5">
                    {formatTomans(order.amountPaid)}
                  </strong>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <CreditCard className="w-3 h-3 text-amber-500" />
                    {order.paymentMethod === 'online_gateway'
                      ? order.gatewayName || 'درگاه پرداخت آنلاین'
                      : `فیش بانکی (${order.receiptBankName || 'بانک'})`}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">نحوه تحویل / ارسال:</span>
                  <strong className="text-slate-900 dark:text-white font-bold flex items-center gap-1 mt-0.5">
                    <Truck className="w-3.5 h-3.5 text-sky-500" />
                    <span>
                      {DELIVERY_METHOD_LABELS[order.deliveryMethod || 'digital_instant']}
                    </span>
                  </strong>
                  <span className="text-[11px] text-slate-500 tabular-nums block mt-0.5">
                    {order.shippingFee && order.shippingFee > 0
                      ? `هزینه ارسال: ${formatTomans(order.shippingFee)}`
                      : 'هزینه ارسال: رایگان / بدون هزینه'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">وضعیت مرسوله / یادداشت:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold block mt-0.5">
                    {order.shippingStatus || (order.purchaseFormat === 'digital' ? 'آماده دریافت دیجیتال' : 'ثبت در صف آماده‌سازی')}
                  </strong>
                  {order.postalTrackingCode && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 block">
                      رهگیری پستی: {toPersianNumbers(order.postalTrackingCode)}
                    </span>
                  )}
                </div>
              </div>

              {(hasMainDownload || unlockedSessions.length > 0) && matchedProduct && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-black text-emerald-800 dark:text-emerald-300">
                    <Download className="w-3.5 h-3.5" />
                    <span>فایل‌ها و لینک‌های دانلود فعال‌شده برای این سفارش:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hasMainDownload && matchedProduct.downloadLink && (
                      <button
                        type="button"
                        disabled={downloadingKey === `${order.id}_main`}
                        onClick={() =>
                          handleDownloadOrderMedia(`${order.id}_main`, matchedProduct.downloadLink!, matchedProduct.title)
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {downloadingKey === `${order.id}_main` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>دانلود فایل اصلی</span>
                      </button>
                    )}
                    {unlockedSessions.map((session, sIdx) => (
                      <button
                        key={session.id}
                        type="button"
                        disabled={downloadingKey === `${order.id}_${session.id}`}
                        onClick={() =>
                          handleDownloadOrderMedia(`${order.id}_${session.id}`, session.downloadUrl, session.title)
                        }
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800 disabled:opacity-50"
                      >
                        {downloadingKey === `${order.id}_${session.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>
                          {toPersianNumbers(sIdx + 1)}. {session.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(order.shippingAddress || order.receiptFileUrl || order.adminNote) && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="space-y-1 text-slate-600 dark:text-slate-300">
                    {order.shippingAddress && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>نشانی تحویل: {order.shippingAddress}</span>
                      </div>
                    )}
                    {order.adminNote && (
                      <p className="text-[11px] text-slate-500">توضیح مدیر: {order.adminNote}</p>
                    )}
                  </div>

                  {order.receiptFileUrl && (
                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(order)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileImage className="w-3.5 h-3.5 text-amber-500" />
                      <span>مشاهده تصویر فیش بانکی</span>
                    </button>
                  )}
                </div>
              )}

              {isOfficial && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs">
                  <input
                    type="text"
                    placeholder="کد رهگیری مرسوله پستی (در صورت ارسال فیزیکی)"
                    value={postalInputs[order.id] ?? order.postalTrackingCode ?? ''}
                    onChange={e => setPostalInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                    className="md:col-span-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="یادداشت بررسی یا تایید مدیر..."
                    value={noteInputs[order.id] ?? order.adminNote ?? ''}
                    onChange={e => setNoteInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                    className="md:col-span-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                  <div className="md:col-span-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={reviewingId === order.id}
                      onClick={() => handleAction(order, 'confirmed')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>تایید و ثبت ارسال</span>
                    </button>
                    <button
                      type="button"
                      disabled={reviewingId === order.id}
                      onClick={() => handleAction(order, 'rejected')}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold cursor-pointer disabled:opacity-50"
                    >
                      رد فیش
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {receiptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
              <span>{receiptPreview.title}</span>
              <button onClick={closePreview} className="px-2.5 py-1 rounded-lg bg-slate-800 cursor-pointer">
                بستن
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex justify-center">
              <img
                src={receiptPreview.url}
                alt={receiptPreview.title}
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

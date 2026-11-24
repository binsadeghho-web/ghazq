import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductOrder, ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { resolveProductCoverUrl } from '../../../data/showcaseImages';
import { api } from '../../../services/apiClient';
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  MEDIA_TYPE_LABELS,
  formatPresentersText,
  formatTomans,
  getProductCategoryLabel,
  triggerSafeMediaDownload,
} from './productUiHelpers';
import {
  X,
  Users,
  FileImage,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  SlidersHorizontal,
  Megaphone,
  Package,
  Eye,
  EyeOff,
  Search,
  MapPin,
  Phone,
  IdCard,
  Truck,
  CreditCard,
  Save,
  Loader2,
  Plus,
  Minus,
  Headphones,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface ProductAdminDetailModalProps {
  product: Product | null;
  orders: ProductOrder[];
  storeConfig: ProductsStoreConfig;
  onClose: () => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => Promise<Product | void>;
  onToggleShowcase: (productId: string, showInShowcase: boolean) => Promise<Product | void>;
  onOpenFullEdit: (product: Product) => void;
  onReviewOrder: (
    orderId: string,
    status: 'confirmed' | 'rejected',
    adminNote?: string,
    postalTrackingCode?: string,
    shippingStatus?: string
  ) => Promise<void>;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

type AdminDetailTab = 'orders' | 'promo' | 'inventory';
type OrderStatusFilter = 'all' | 'pending_review' | 'confirmed' | 'rejected';

export const ProductAdminDetailModal: React.FC<ProductAdminDetailModalProps> = ({
  product,
  orders,
  storeConfig,
  onClose,
  onUpdateProduct,
  onToggleShowcase,
  onOpenFullEdit,
  onReviewOrder,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminDetailTab>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Order review states
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [postalInputs, setPostalInputs] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<{
    url: string;
    title: string;
    isPdf: boolean;
    rawUrl: string;
  } | null>(null);

  // Promotional & stock quick editor state
  const [promoForm, setPromoForm] = useState({
    title: '',
    subtitle: '',
    badgeText: '',
    subjectIndex: '',
    shortDescription: '',
    description: '',
    showInShowcase: true,
    isAvailable: true,
    visibleToCustomer: true,
  });

  const [inventoryForm, setInventoryForm] = useState({
    stock: 0,
    supportsDigital: true,
    supportsPhysical: true,
    digitalPrice: 0,
    physicalPrice: 0,
  });

  const [savingPromo, setSavingPromo] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [togglingShowcase, setTogglingShowcase] = useState(false);
  const [togglingAvailable, setTogglingAvailable] = useState(false);

  useEffect(() => {
    if (!product) return;
    setPromoForm({
      title: product.title || '',
      subtitle: product.subtitle || '',
      badgeText: product.badgeText || '',
      subjectIndex: product.subjectIndex || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      showInShowcase: product.showInShowcase !== false,
      isAvailable: product.isAvailable !== false,
      visibleToCustomer: product.visibleToCustomer !== false,
    });
    setInventoryForm({
      stock: Math.max(0, Number(product.stock ?? 0)),
      supportsDigital: product.supportsDigital !== false,
      supportsPhysical: Boolean(product.supportsPhysical),
      digitalPrice: Math.max(0, Number(product.digitalPrice ?? product.price ?? 0)),
      physicalPrice: Math.max(0, Number(product.physicalPrice ?? product.price ?? 0)),
    });
  }, [product]);

  // Clean up object URLs on unmount or close
  useEffect(() => {
    return () => {
      if (receiptPreview?.url) {
        URL.revokeObjectURL(receiptPreview.url);
      }
    };
  }, [receiptPreview]);

  const productOrders = useMemo(() => {
    if (!product) return [];
    return orders.filter(o => o.productId === product.id);
  }, [orders, product]);

  const orderStats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let rejected = 0;
    let physicalCount = 0;
    let digitalCount = 0;
    let revenue = 0;
    let receiptsCount = 0;

    for (const o of productOrders) {
      if (o.paymentStatus === 'confirmed') {
        confirmed += 1;
        revenue += Number(o.amountPaid || 0);
      } else if (o.paymentStatus === 'rejected') {
        rejected += 1;
      } else {
        pending += 1;
      }
      if (o.purchaseFormat === 'physical') physicalCount += 1;
      else digitalCount += 1;
      if (o.receiptFileUrl) receiptsCount += 1;
    }

    return {
      total: productOrders.length,
      confirmed,
      pending,
      rejected,
      physicalCount,
      digitalCount,
      revenue,
      receiptsCount,
    };
  }, [productOrders]);

  const filteredProductOrders = useMemo(() => {
    return productOrders.filter(o => {
      if (statusFilter !== 'all' && o.paymentStatus !== statusFilter) return false;
      if (!orderSearch.trim()) return true;
      const q = orderSearch.trim().toLowerCase();
      return (
        o.userName.toLowerCase().includes(q) ||
        (o.userNationalId || '').toLowerCase().includes(q) ||
        (o.userPhone || '').toLowerCase().includes(q) ||
        (o.trackingCode || '').toLowerCase().includes(q) ||
        (o.postalTrackingCode || '').toLowerCase().includes(q)
      );
    });
  }, [productOrders, statusFilter, orderSearch]);

  if (!product) return null;

  const coverUrl = resolveProductCoverUrl(product.coverImage, product.format, 0);
  const presentersText = formatPresentersText(product);
  const categoryLabel = getProductCategoryLabel(product.format, product.formatTitle, storeConfig);
  const currentStock = Math.max(0, Number(product.stock ?? 0));
  const sessions = Array.isArray(product.mediaSessions) ? product.mediaSessions : [];

  const handlePreviewReceipt = async (order: ProductOrder) => {
    if (!order.receiptFileUrl) return;
    try {
      setLoadingDocId(order.id);
      const { blob } = await api.fetchPrivateFileBlob(order.receiptFileUrl);
      const objectUrl = URL.createObjectURL(blob);
      const isPdf = blob.type.includes('pdf') || order.receiptFileUrl.toLowerCase().endsWith('.pdf');
      setReceiptPreview({
        url: objectUrl,
        title: `مدرک / فیش بانکی ${order.userName} (${toPersianNumbers(order.trackingCode)})`,
        isPdf,
        rawUrl: order.receiptFileUrl,
      });
    } catch (err: any) {
      onNotify(err?.message || 'امکان دریافت مدرک یا تصویر فیش وجود ندارد.', 'error');
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleCloseReceipt = () => {
    if (receiptPreview?.url) {
      URL.revokeObjectURL(receiptPreview.url);
    }
    setReceiptPreview(null);
  };

  const handleDownloadDocument = async (url: string, label: string) => {
    try {
      await triggerSafeMediaDownload(url, label);
    } catch (err: any) {
      onNotify(err?.message || 'خطا در دانلود مدرک', 'error');
    }
  };

  const handleReviewAction = async (order: ProductOrder, status: 'confirmed' | 'rejected') => {
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
            : 'تایید و آماده تحویل'
          : 'ردشده توسط واحد مالی';
      await onReviewOrder(order.id, status, note, postal, shippingStatus);
      onNotify(
        status === 'confirmed'
          ? `سفارش ${toPersianNumbers(order.trackingCode)} (${order.userName}) تایید شد.`
          : `سفارش ${toPersianNumbers(order.trackingCode)} (${order.userName}) رد شد.`
      );
    } catch (err: any) {
      onNotify(err?.message || 'خطا در ثبت وضعیت سفارش', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.title.trim() || !promoForm.description.trim()) {
      onNotify('عنوان و متن معرفی محصول نمی‌تواند خالی باشد.', 'error');
      return;
    }
    try {
      setSavingPromo(true);
      await onUpdateProduct(product.id, {
        title: promoForm.title.trim(),
        subtitle: promoForm.subtitle.trim() || undefined,
        badgeText: promoForm.badgeText.trim() || undefined,
        subjectIndex: promoForm.subjectIndex.trim() || undefined,
        shortDescription: promoForm.shortDescription.trim() || promoForm.description.trim().slice(0, 140),
        description: promoForm.description.trim(),
        showInShowcase: promoForm.showInShowcase,
        isAvailable: promoForm.isAvailable,
        visibleToCustomer: promoForm.visibleToCustomer,
        version: product.version,
      });
      onNotify(`محتوای تبلیغ و معرفی «${promoForm.title.trim()}» با موفقیت به‌روزرسانی و در ویترین همگام‌سازی شد.`);
    } catch (err: any) {
      onNotify(err?.message || 'خطا در ذخیره محتوای تبلیغ', 'error');
    } finally {
      setSavingPromo(false);
    }
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryForm.supportsDigital && !inventoryForm.supportsPhysical) {
      onNotify('حداقل یکی از حالت‌های فروش (دیجیتال یا فیزیکی) باید فعال باشد.', 'error');
      return;
    }
    try {
      setSavingInventory(true);
      await onUpdateProduct(product.id, {
        stock: Math.max(0, Number(inventoryForm.stock || 0)),
        supportsDigital: inventoryForm.supportsDigital,
        supportsPhysical: inventoryForm.supportsPhysical,
        digitalPrice: Math.max(0, Number(inventoryForm.digitalPrice || 0)),
        physicalPrice: Math.max(0, Number(inventoryForm.physicalPrice || 0)),
        version: product.version,
      });
      onNotify('موجودی انبار و تنظیمات قیمت با موفقیت در پایگاه‌داده ذخیره شد.');
    } catch (err: any) {
      onNotify(err?.message || 'خطا در به‌روزرسانی موجودی و قیمت', 'error');
    } finally {
      setSavingInventory(false);
    }
  };

  const handleQuickToggleShowcase = async () => {
    try {
      setTogglingShowcase(true);
      const next = product.showInShowcase === false;
      await onToggleShowcase(product.id, next);
      setPromoForm(prev => ({ ...prev, showInShowcase: next }));
      onNotify(next ? 'نمایش در ویترین جامع خدمات فعال شد.' : 'اثر از ویترین جامع خدمات مخفی شد.');
    } catch (err: any) {
      onNotify(err?.message || 'خطا در تغییر وضعیت ویترین', 'error');
    } finally {
      setTogglingShowcase(false);
    }
  };

  const handleQuickToggleAvailable = async () => {
    try {
      setTogglingAvailable(true);
      const next = product.isAvailable === false;
      await onUpdateProduct(product.id, { isAvailable: next, version: product.version });
      setPromoForm(prev => ({ ...prev, isAvailable: next }));
      onNotify(next ? 'عرضه و فروش این اثر در سامانه فعال شد.' : 'فروش این اثر موقتاً متوقف شد.');
    } catch (err: any) {
      onNotify(err?.message || 'خطا در تغییر وضعیت فروش', 'error');
    } finally {
      setTogglingAvailable(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return 'نامشخص';
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[92dvh] sm:max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Admin Management Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <img
              src={coverUrl}
              alt={product.title}
              className="w-16 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
            />
            <div className="min-w-0 space-y-1">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                <span className="text-amber-700 dark:text-amber-400">{categoryLabel}</span>
                <span>·</span>
                <span className="truncate">{presentersText}</span>
                <span>·</span>
                <span className="tabular-nums">{toPersianNumbers(product.publishedYear)}</span>
                {product.isbn && (
                  <>
                    <span>·</span>
                    <span className="font-mono tabular-nums">شابک: {toPersianNumbers(product.isbn)}</span>
                  </>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {product.title}
              </h2>
              <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
                <span>
                  وضعیت فروش:{' '}
                  <strong className={product.isAvailable !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {product.isAvailable !== false ? 'فعال برای سفارش' : 'توقف موقت فروش'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  ویترین جامع:{' '}
                  <strong className={product.showInShowcase !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                    {product.showInShowcase !== false ? 'نمایش فعال' : 'مخفی از ویترین'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  دسترسی مشتریان عادی:{' '}
                  <strong>{product.visibleToCustomer !== false ? 'باز' : 'فقط دانش‌آموختگان'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={togglingShowcase}
              onClick={handleQuickToggleShowcase}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 ${
                product.showInShowcase !== false
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {product.showInShowcase !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{product.showInShowcase !== false ? 'فعال در ویترین' : 'مخفی از ویترین'}</span>
            </button>

            <button
              type="button"
              disabled={togglingAvailable}
              onClick={handleQuickToggleAvailable}
              className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors disabled:opacity-50 ${
                product.isAvailable !== false
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}
            >
              {product.isAvailable !== false ? 'توقف موقت فروش' : 'فعال‌سازی فروش'}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFullEdit(product);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>ویرایش فرم جامع (فایل و تصاویر)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4-Column Operational KPI Strip for This Product */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200 dark:divide-slate-800 shrink-0">
          <div className="p-4">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">میزان سفارش ثبت‌شده</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {toPersianNumbers(orderStats.total)}
              </span>
              <span className="text-xs text-slate-500">سفارش</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
              {toPersianNumbers(orderStats.confirmed)} تایید ·{' '}
              <span className={orderStats.pending > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                {toPersianNumbers(orderStats.pending)} در انتظار
              </span>
              {orderStats.rejected > 0 ? ` · ${toPersianNumbers(orderStats.rejected)} رد` : ''}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">فروش قطعی این اثر</div>
            <div className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatTomans(orderStats.revenue)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
              {toPersianNumbers(orderStats.physicalCount)} نسخه فیزیکی · {toPersianNumbers(orderStats.digitalCount)} نسخه دیجیتال
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">باقیمانده موجودی انبار</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-xl font-black tabular-nums ${
                    !product.supportsPhysical
                      ? 'text-slate-700 dark:text-slate-200'
                      : currentStock === 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : currentStock <= 5
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {product.supportsPhysical ? toPersianNumbers(currentStock) : 'نامحدود'}
                </span>
                <span className="text-xs text-slate-500">
                  {product.supportsPhysical ? 'نسخه فیزیکی' : 'فقط دیجیتال'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                ویرایش موجودی
              </button>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
              {product.supportsPhysical && currentStock <= 5
                ? currentStock === 0
                  ? 'هشدار: موجودی نسخه چاپی تمام شده است'
                  : 'هشدار: موجودی انبار رو به اتمام است'
                : `${toPersianNumbers(sessions.length)} فایل / جلسه دیجیتال متصل`}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">مدارک و فیش‌های پیوست</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {toPersianNumbers(orderStats.receiptsCount)}
              </span>
              <span className="text-xs text-slate-500">سند / فیش بارگذاری‌شده</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              امکان مشاهده تصویر فیش، بررسی و تایید ارسال در همین صفحه
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'orders'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>افراد سفارش‌دهنده و مدارک ({toPersianNumbers(productOrders.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promo')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'promo'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>ویرایش محتوای تبلیغ و ویترین</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>موجودی انبار، قیمت و فایل‌ها</span>
          </button>
        </div>

        {/* Scrollable Workspace Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/40 dark:bg-slate-950/30">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold overflow-x-auto">
                  {(
                    [
                      { key: 'all', label: `همه (${toPersianNumbers(orderStats.total)})` },
                      { key: 'pending_review', label: `در انتظار تایید (${toPersianNumbers(orderStats.pending)})` },
                      { key: 'confirmed', label: `تاییدشده (${toPersianNumbers(orderStats.confirmed)})` },
                      { key: 'rejected', label: `ردشده (${toPersianNumbers(orderStats.rejected)})` },
                    ] as Array<{ key: OrderStatusFilter; label: string }>
                  ).map(btn => (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => setStatusFilter(btn.key)}
                      className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                        statusFilter === btn.key
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-80">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="جستجو نام خریدار، کدملی، موبایل، کد رهگیری..."
                    className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {filteredProductOrders.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                    سفارشی مطابق فیلتر انتخابی برای این محصول یافت نشد.
                  </p>
                  <p className="text-xs text-slate-500">
                    پس از ثبت سفارش توسط کاربران یا دانش‌آموختگان، مشخصات فردی، فیش واریزی و مدارک آن‌ها در این فهرست قرار می‌گیرد.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProductOrders.map(order => {
                    const statusStyle =
                      order.paymentStatus === 'confirmed'
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
                        : order.paymentStatus === 'rejected'
                        ? 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25'
                        : 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25';

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4"
                      >
                        {/* Buyer & Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <strong className="text-sm font-black text-slate-900 dark:text-white">
                                {order.userName}
                              </strong>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-600 dark:text-slate-300 font-bold">
                                {order.userRoleTitle || 'کاربر سامانه'}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="font-mono text-amber-700 dark:text-amber-400 font-bold tabular-nums">
                                رهگیری: {toPersianNumbers(order.trackingCode)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 tabular-nums">
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {toPersianNumbers(order.userPhone)}
                              </span>
                              {order.userNationalId && (
                                <span className="inline-flex items-center gap-1">
                                  <IdCard className="w-3 h-3" />
                                  کدملی: {toPersianNumbers(order.userNationalId)}
                                </span>
                              )}
                              <span>ثبت: {formatDate(order.orderedAt)}</span>
                            </div>
                          </div>

                          <div
                            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 self-start sm:self-center ${statusStyle}`}
                          >
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

                        {/* Payment, Delivery & Documents Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1">
                            <span className="text-[11px] text-slate-500 block">نوع سفارش و پرداخت</span>
                            <div className="font-black text-slate-900 dark:text-white tabular-nums">
                              {formatTomans(order.amountPaid)}{' '}
                              <span className="text-[11px] font-bold text-slate-500">
                                ({order.purchaseFormat === 'physical' ? 'نسخه فیزیکی' : 'نسخه دیجیتال'})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>
                                {order.paymentMethod === 'online_gateway'
                                  ? order.gatewayName || 'درگاه پرداخت آنلاین'
                                  : `فیش بانکی (${order.receiptBankName || 'بانک'})`}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1">
                            <span className="text-[11px] text-slate-500 block">تحویل، نشانی و وضعیت ارسال</span>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span>{DELIVERY_METHOD_LABELS[order.deliveryMethod || 'digital_instant']}</span>
                            </div>
                            {order.shippingAddress ? (
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                <span>{order.shippingAddress}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-500">
                                {order.shippingStatus || 'تحویل دیجیتال / بدون نیاز به آدرس پستی'}
                              </div>
                            )}
                            {order.postalTrackingCode && (
                              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                                کد پستی: {toPersianNumbers(order.postalTrackingCode)}
                              </div>
                            )}
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-2">
                            <span className="text-[11px] text-slate-500 block">مدارک و مستندات خریدار</span>
                            {order.receiptFileUrl ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={loadingDocId === order.id}
                                  onClick={() => handlePreviewReceipt(order)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {loadingDocId === order.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <FileImage className="w-3.5 h-3.5" />
                                  )}
                                  <span>مشاهده فیش / مدرک</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadDocument(
                                      order.receiptFileUrl!,
                                      `receipt-${order.trackingCode}`
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-100"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>دانلود</span>
                                </button>
                              </div>
                            ) : order.paymentMethod === 'online_gateway' ? (
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                                پرداخت موفق آنلاین ({order.gatewayName || 'درگاه شتاب'}) — تایید خودکار تراکنش
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">
                                مدرکی برای این سفارش پیوست نشده است.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Admin Verification & Shipping Update */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs">
                          <input
                            type="text"
                            placeholder="کد رهگیری مرسوله پستی..."
                            value={postalInputs[order.id] ?? order.postalTrackingCode ?? ''}
                            onChange={e => setPostalInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="md:col-span-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="یادداشت بررسی یا توضیح مالی..."
                            value={noteInputs[order.id] ?? order.adminNote ?? ''}
                            onChange={e => setNoteInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="md:col-span-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <div className="md:col-span-4 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={reviewingId === order.id}
                              onClick={() => handleReviewAction(order, 'confirmed')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {reviewingId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>تایید و ثبت ارسال</span>
                            </button>
                            <button
                              type="button"
                              disabled={reviewingId === order.id}
                              onClick={() => handleReviewAction(order, 'rejected')}
                              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold cursor-pointer disabled:opacity-50"
                            >
                              رد سفارش
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'promo' && (
            <form onSubmit={handleSavePromo} className="max-w-4xl space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    ویرایش محتوای تبلیغاتی، معرفی و نمایش در ویترین جامع
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تغییرات این بخش بلافاصله در ویترین جامع خدمات، کارت فروشگاه و پنجره معرفی برای همه کاربران به‌روزرسانی می‌شود.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullEdit(product);
                  }}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ویرایش تصاویر، جلسات صوتی/ویدئویی و تنظیمات کامل</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    عنوان اصلی اثر
                  </label>
                  <input
                    type="text"
                    required
                    value={promoForm.title}
                    onChange={e => setPromoForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    نشان / برچسب تبلیغاتی (روی تصویر در ویترین و کارت)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: چاپ جدید، پرفروش، نشست ویژه، تخفیف محدود"
                    value={promoForm.badgeText}
                    onChange={e => setPromoForm(prev => ({ ...prev, badgeText: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    تیتر فرعی / شعار تبلیغاتی
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: تحلیل فقهی و قضایی با رویکرد کاربردی محاکم"
                    value={promoForm.subtitle}
                    onChange={e => setPromoForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    شاخص یا محور موضوعی
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: فقه جزا / آیین دادرسی / حقوق خانواده"
                    value={promoForm.subjectIndex}
                    onChange={e => setPromoForm(prev => ({ ...prev, subjectIndex: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  متن خلاصه تبلیغاتی (نمایش‌داده‌شده در کارت‌ها و ویترین جامع خدمات)
                </label>
                <textarea
                  rows={2}
                  value={promoForm.shortDescription}
                  onChange={e => setPromoForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="خلاصه‌ای جذاب و دقیق از ارزش این اثر برای خواننده یا شرکت‌کننده..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  متن کامل معرفی و تبلیغ محصول (نمایش‌داده‌شده در پنجره معرفی اثر)
                </label>
                <textarea
                  rows={5}
                  required
                  value={promoForm.description}
                  onChange={e => setPromoForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoForm.showInShowcase}
                    onChange={e => setPromoForm(prev => ({ ...prev, showInShowcase: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    نمایش فعال در ویترین جامع خدمات
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoForm.isAvailable}
                    onChange={e => setPromoForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    عرضه و فروش فعال در فروشگاه
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoForm.visibleToCustomer}
                    onChange={e => setPromoForm(prev => ({ ...prev, visibleToCustomer: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    نمایش برای کاربران عادی (مشتریان)
                  </span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPromo}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>ذخیره محتوای تبلیغ و به‌روزرسانی ویترین</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'inventory' && (
            <form onSubmit={handleSaveInventory} className="max-w-4xl space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  مدیریت موجودی انبار، قیمت‌گذاری و فایل‌های متصل
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  با هر خرید نسخه فیزیکی، یک عدد به صورت خودکار از موجودی انبار کسر می‌شود. از این بخش می‌توانید موجودی را اصلاح یا شارژ نمایید.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <label className="font-black text-slate-800 dark:text-slate-200 block">
                    باقیمانده موجودی نسخه فیزیکی
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInventoryForm(prev => ({ ...prev, stock: Math.max(0, prev.stock - 1) }))}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                      aria-label="کاهش موجودی"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={inventoryForm.stock}
                      onChange={e =>
                        setInventoryForm(prev => ({ ...prev, stock: Math.max(0, Number(e.target.value || 0)) }))
                      }
                      className="w-full px-3 py-2 text-center text-base font-black rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => setInventoryForm(prev => ({ ...prev, stock: prev.stock + 1 }))}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 cursor-pointer"
                      aria-label="افزایش موجودی"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {inventoryForm.supportsPhysical && inventoryForm.stock <= 5 && (
                    <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {inventoryForm.stock === 0 ? 'موجودی صفر است (خرید فیزیکی متوقف می‌شود).' : 'موجودی انبار کم است.'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-black text-slate-800 dark:text-slate-200">نسخه دیجیتال (فایل / صوت)</span>
                    <input
                      type="checkbox"
                      checked={inventoryForm.supportsDigital}
                      onChange={e => setInventoryForm(prev => ({ ...prev, supportsDigital: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">قیمت نسخه دیجیتال (تومان):</span>
                    <input
                      type="number"
                      min={0}
                      disabled={!inventoryForm.supportsDigital}
                      value={inventoryForm.digitalPrice}
                      onChange={e =>
                        setInventoryForm(prev => ({ ...prev, digitalPrice: Math.max(0, Number(e.target.value || 0)) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black tabular-nums disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-black text-slate-800 dark:text-slate-200">نسخه فیزیکی (چاپی / پستی)</span>
                    <input
                      type="checkbox"
                      checked={inventoryForm.supportsPhysical}
                      onChange={e => setInventoryForm(prev => ({ ...prev, supportsPhysical: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">قیمت نسخه فیزیکی (تومان):</span>
                    <input
                      type="number"
                      min={0}
                      disabled={!inventoryForm.supportsPhysical}
                      value={inventoryForm.physicalPrice}
                      onChange={e =>
                        setInventoryForm(prev => ({ ...prev, physicalPrice: Math.max(0, Number(e.target.value || 0)) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black tabular-nums disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Attached Media Sessions Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-indigo-500" />
                    <span>فایل‌ها و جلسات دانلودی متصل به این اثر ({toPersianNumbers(sessions.length)} جلسه)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFullEdit(product);
                    }}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    مدیریت و افزودن فایل در فرم جامع
                  </button>
                </div>

                {sessions.length === 0 && !product.downloadLink ? (
                  <p className="text-slate-500 text-[11px]">
                    هنوز فایل صوتی، ویدئویی یا پی‌دی‌اف دانلودی برای این محصول پیوست نشده است.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                    {product.downloadLink && (
                      <div className="py-2 flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">فایل اصلی محصول (کتاب / بسته)</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">آپلودشده و آماده</span>
                      </div>
                    )}
                    {sessions.map((s, idx) => (
                      <div key={s.id} className="py-2 flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {toPersianNumbers(idx + 1)}. {s.title}
                          </span>
                          <span className="text-slate-400 mx-1.5">·</span>
                          <span className="text-[11px] text-slate-500">{MEDIA_TYPE_LABELS[s.mediaType]}</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          {s.durationOrSize ? toPersianNumbers(s.durationOrSize) : 'آماده دانلود پس از خرید'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingInventory}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingInventory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>ذخیره موجودی و قیمت‌ها</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Secure Receipt / Document Lightbox */}
      {receiptPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/90 backdrop-blur-sm overflow-hidden"
          onClick={handleCloseReceipt}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[92dvh]"
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold gap-2 shrink-0">
              <span className="truncate">{receiptPreview.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(receiptPreview.rawUrl, 'order-document')}
                  className="px-3 py-1.5 min-h-[38px] rounded-lg bg-amber-500 text-stone-950 font-black cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود مدرک</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseReceipt}
                  className="px-3 py-1.5 min-h-[38px] rounded-lg bg-slate-800 cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-950 flex justify-center overflow-y-auto overscroll-y-contain flex-1 min-h-0">
              {receiptPreview.isPdf ? (
                <iframe
                  src={receiptPreview.url}
                  title={receiptPreview.title}
                  className="w-full h-[70dvh] rounded-lg bg-white"
                />
              ) : (
                <img
                  src={receiptPreview.url}
                  alt={receiptPreview.title}
                  className="max-h-[70dvh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

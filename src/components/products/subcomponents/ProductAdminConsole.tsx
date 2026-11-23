import React, { useMemo, useState } from 'react';
import { Product, ProductOrder, ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { resolveProductCoverUrl } from '../../../data/showcaseImages';
import {
  formatPresentersText,
  formatTomans,
  getAllProductCategories,
  getProductCategoryLabel,
} from './productUiHelpers';
import { ProductOrdersView } from './ProductOrdersView';
import {
  Search,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Trash2,
  ArrowUp,
  ArrowDown,
  Users,
  BookOpen,
  Receipt,
  Clock,
  Plus,
  Megaphone,
  AlertTriangle,
  Headphones,
} from 'lucide-react';

interface ProductAdminConsoleProps {
  products: Product[];
  orders: ProductOrder[];
  storeConfig: ProductsStoreConfig;
  onInspectProduct: (product: Product) => void;
  onOpenAddProduct: () => void;
  onOpenEdit: (product: Product) => void;
  onOpenDelete: (product: Product) => void;
  onToggleShowcase: (productId: string, showInShowcase: boolean) => void;
  onMoveOrder: (productId: string, direction: 'up' | 'down') => void;
  onReviewOrder: (
    orderId: string,
    status: 'confirmed' | 'rejected',
    adminNote?: string,
    postalTrackingCode?: string,
    shippingStatus?: string
  ) => Promise<void>;
  onNotify: (msg: string, tone?: 'success' | 'error') => void;
}

type AdminConsoleTab = string; // 'catalog' | categoryId | 'orders_pending' | 'orders_all'

export const ProductAdminConsole: React.FC<ProductAdminConsoleProps> = ({
  products,
  orders,
  storeConfig,
  onInspectProduct,
  onOpenAddProduct,
  onOpenEdit,
  onOpenDelete,
  onToggleShowcase,
  onMoveOrder,
  onReviewOrder,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminConsoleTab>('catalog');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => getAllProductCategories(storeConfig), [storeConfig]);

  const activeProducts = useMemo(
    () =>
      products
        .filter(p => !p.isDeleted)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [products]
  );

  // Build per-product order metrics map once cleanly
  const orderStatsByProduct = useMemo(() => {
    const map = new Map<
      string,
      { total: number; confirmed: number; pending: number; rejected: number; revenue: number; physicalSold: number }
    >();
    for (const o of orders) {
      const cur = map.get(o.productId) || {
        total: 0,
        confirmed: 0,
        pending: 0,
        rejected: 0,
        revenue: 0,
        physicalSold: 0,
      };
      cur.total += 1;
      if (o.paymentStatus === 'confirmed') {
        cur.confirmed += 1;
        cur.revenue += Number(o.amountPaid || 0);
        if (o.purchaseFormat === 'physical') cur.physicalSold += 1;
      } else if (o.paymentStatus === 'rejected') {
        cur.rejected += 1;
      } else {
        cur.pending += 1;
      }
      map.set(o.productId, cur);
    }
    return map;
  }, [orders]);

  // Global Management KPIs
  const globalStats = useMemo(() => {
    let showcaseCount = 0;
    let totalPhysicalStock = 0;
    let lowStockCount = 0;
    let pausedCount = 0;

    for (const p of activeProducts) {
      if (p.showInShowcase !== false) showcaseCount += 1;
      if (p.isAvailable === false) pausedCount += 1;
      if (p.supportsPhysical) {
        const st = Math.max(0, Number(p.stock ?? 0));
        totalPhysicalStock += st;
        if (st <= 5) lowStockCount += 1;
      }
    }

    let confirmedOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;
    let totalReceipts = 0;

    for (const o of orders) {
      if (o.paymentStatus === 'confirmed') {
        confirmedOrders += 1;
        totalRevenue += Number(o.amountPaid || 0);
      } else if (o.paymentStatus === 'pending_review') {
        pendingOrders += 1;
      }
      if (o.receiptFileUrl) totalReceipts += 1;
    }

    return {
      totalProducts: activeProducts.length,
      showcaseCount,
      pausedCount,
      totalPhysicalStock,
      lowStockCount,
      totalOrders: orders.length,
      confirmedOrders,
      pendingOrders,
      totalRevenue,
      totalReceipts,
    };
  }, [activeProducts, orders]);

  const filteredCatalog = useMemo(() => {
    let list = activeProducts;
    if (activeTab !== 'catalog' && activeTab !== 'orders_all' && activeTab !== 'orders_pending') {
      list = list.filter(p => p.format === activeTab);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        formatPresentersText(p).toLowerCase().includes(q) ||
        (p.subjectIndex || '').toLowerCase().includes(q) ||
        (p.isbn || '').toLowerCase().includes(q)
    );
  }, [activeProducts, activeTab, searchQuery]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeTab === 'orders_pending') {
      list = list.filter(o => o.paymentStatus === 'pending_review');
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter(
      o =>
        o.productTitle.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        (o.userNationalId || '').toLowerCase().includes(q) ||
        (o.userPhone || '').toLowerCase().includes(q) ||
        (o.trackingCode || '').toLowerCase().includes(q)
    );
  }, [orders, activeTab, searchQuery]);

  const isOrdersView = activeTab === 'orders_all' || activeTab === 'orders_pending';

  return (
    <div className="space-y-5">
      {/* 4-Column Executive Management KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`text-right p-4 rounded-2xl border transition-colors cursor-pointer ${
            !isOrdersView
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={!isOrdersView ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}>
              آثار و محصولات ثبت‌شده
            </span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black tabular-nums">
            {toPersianNumbers(globalStats.totalProducts)}{' '}
            <span className="text-xs font-medium opacity-75">عنوان</span>
          </div>
          <div className={`text-[11px] mt-1 tabular-nums ${!isOrdersView ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}`}>
            {toPersianNumbers(globalStats.showcaseCount)} اثر فعال در ویترین
            {globalStats.pausedCount > 0 ? ` · ${toPersianNumbers(globalStats.pausedCount)} متوقف` : ''}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders_all')}
          className={`text-right p-4 rounded-2xl border transition-colors cursor-pointer ${
            activeTab === 'orders_all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={activeTab === 'orders_all' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}>
              کل فروش و سفارش‌ها
            </span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black tabular-nums truncate">
            {formatTomans(globalStats.totalRevenue)}
          </div>
          <div className={`text-[11px] mt-1 tabular-nums ${activeTab === 'orders_all' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}`}>
            {toPersianNumbers(globalStats.confirmedOrders)} سفارش تاییدشده از {toPersianNumbers(globalStats.totalOrders)} سفارش
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders_pending')}
          className={`text-right p-4 rounded-2xl border transition-colors cursor-pointer ${
            activeTab === 'orders_pending'
              ? 'bg-amber-500 text-stone-950 border-amber-500'
              : globalStats.pendingOrders > 0
              ? 'bg-amber-500/10 text-slate-900 dark:text-white border-amber-500/40 hover:border-amber-500'
              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={activeTab === 'orders_pending' ? 'text-stone-900' : 'text-amber-700 dark:text-amber-400'}>
              فیش‌ها و سفارش‌های در انتظار بررسی
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black tabular-nums">
            {toPersianNumbers(globalStats.pendingOrders)}{' '}
            <span className="text-xs font-bold opacity-80">سفارش</span>
          </div>
          <div className={`text-[11px] mt-1 tabular-nums ${activeTab === 'orders_pending' ? 'text-stone-800' : 'text-slate-500'}`}>
            کل مدارک/فیش‌های بارگذاری‌شده: {toPersianNumbers(globalStats.totalReceipts)}
          </div>
        </button>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-500">باقیمانده کل موجودی انبار</span>
            <AlertTriangle className={`w-4 h-4 ${globalStats.lowStockCount > 0 ? 'text-amber-500' : 'text-sky-500'}`} />
          </div>
          <div className="text-2xl font-black tabular-nums">
            {toPersianNumbers(globalStats.totalPhysicalStock)}{' '}
            <span className="text-xs font-medium text-slate-500">نسخه فیزیکی</span>
          </div>
          <div className="text-[11px] mt-1 text-slate-500 tabular-nums">
            {globalStats.lowStockCount > 0
              ? `${toPersianNumbers(globalStats.lowStockCount)} اثر با موجودی کم (≤ ۵ نسخه)`
              : 'موجودی همه آثار فیزیکی در وضعیت مطلوب است'}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs overflow-x-auto scrollbar-none font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            همه آثار ({toPersianNumbers(activeProducts.length)})
          </button>

          {categories.map(cat => {
            const count = activeProducts.filter(p => p.format === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-3.5 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === cat.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.shortLabel || cat.label} ({toPersianNumbers(count)})
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveTab('orders_pending')}
            className={`px-3.5 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'orders_pending'
                ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            در انتظار بررسی ({toPersianNumbers(globalStats.pendingOrders)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders_all')}
            className={`px-3.5 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'orders_all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            کل سفارش‌ها و مدارک ({toPersianNumbers(orders.length)})
          </button>
        </div>

        <div className="relative w-full xl:w-80 shrink-0">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              isOrdersView
                ? 'جستجو نام خریدار، کدملی، اثر یا کد رهگیری...'
                : 'جستجو در آثار، ارائه‌دهنده، نمایه یا شابک...'
            }
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Main Content Area: Orders Queue OR Structured Management Table */}
      {isOrdersView ? (
        <ProductOrdersView
          orders={filteredOrders}
          products={products}
          storeConfig={storeConfig}
          isOfficial={true}
          onReviewOrder={onReviewOrder}
          onNotify={onNotify}
        />
      ) : (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="font-black text-slate-800 dark:text-slate-200">
              جدول مدیریتی آثار — برای مشاهده خریداران، مدارک، موجودی انبار و ویرایش محتوای تبلیغ روی هر ردیف کلیک کنید
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {toPersianNumbers(filteredCatalog.length)} اثر نمایش داده شده
            </span>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="p-14 text-center space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                هیچ اثری در این نما یافت نشد.
              </p>
              <button
                type="button"
                onClick={onOpenAddProduct}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن اولین اثر / محصول</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Desktop Column Headers */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-5 py-3 bg-slate-50 dark:bg-slate-950/40 text-[11px] font-black text-slate-500 dark:text-slate-400">
                <div className="col-span-4">اثر، ارائه‌دهنده و وضعیت ویترین</div>
                <div className="col-span-3">میزان سفارش‌ها و فروش کل</div>
                <div className="col-span-2">باقیمانده موجودی</div>
                <div className="col-span-1">تعرفه</div>
                <div className="col-span-2 text-left">اقدامات مدیریتی</div>
              </div>

              {filteredCatalog.map((product, idx) => {
                const stats = orderStatsByProduct.get(product.id) || {
                  total: 0,
                  confirmed: 0,
                  pending: 0,
                  rejected: 0,
                  revenue: 0,
                  physicalSold: 0,
                };
                const coverUrl = resolveProductCoverUrl(product.coverImage, product.format, idx);
                const presenters = formatPresentersText(product);
                const categoryLabel = getProductCategoryLabel(product.format, product.formatTitle, storeConfig);
                const stockNum = Math.max(0, Number(product.stock ?? 0));
                const sessionsCount = Array.isArray(product.mediaSessions) ? product.mediaSessions.length : 0;
                const isShown = product.showInShowcase !== false;

                return (
                  <div
                    key={product.id}
                    onClick={() => onInspectProduct(product)}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Col 1: Product Identity */}
                    <div className="lg:col-span-4 flex items-center gap-3.5 min-w-0">
                      <img
                        src={coverUrl}
                        alt={product.title}
                        className="w-14 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
                          <span className="text-amber-700 dark:text-amber-400">{categoryLabel}</span>
                          <span>·</span>
                          <span className="truncate max-w-[180px]">{presenters}</span>
                          {sessionsCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 tabular-nums">
                                <Headphones className="w-3 h-3" />
                                {toPersianNumbers(sessionsCount)} فایل
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                          {product.title}
                        </h3>
                        <div className="text-[11px] flex flex-wrap items-center gap-2 text-slate-500">
                          <span className={isShown ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                            {isShown ? 'فعال در ویترین جامع' : 'مخفی از ویترین'}
                          </span>
                          <span>·</span>
                          <span className={product.isAvailable !== false ? 'text-slate-600 dark:text-slate-300' : 'text-rose-600 font-bold'}>
                            {product.isAvailable !== false ? 'فروش فعال' : 'توقف موقت فروش'}
                          </span>
                          {product.visibleToCustomer === false && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 dark:text-amber-400">مشتری عادی: بسته</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Orders & Revenue */}
                    <div className="lg:col-span-3 space-y-1 text-xs">
                      <div className="flex items-center gap-2 tabular-nums">
                        <strong className="text-sm font-black text-slate-900 dark:text-white">
                          {toPersianNumbers(stats.total)} سفارش
                        </strong>
                        {stats.pending > 0 && (
                          <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">
                            ({toPersianNumbers(stats.pending)} در انتظار تایید)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        تاییدشده: {toPersianNumbers(stats.confirmed)} · فروش: {formatTomans(stats.revenue)}
                      </div>
                    </div>

                    {/* Col 3: Remaining Stock */}
                    <div className="lg:col-span-2 text-xs space-y-1">
                      {product.supportsPhysical ? (
                        <>
                          <div
                            className={`text-sm font-black tabular-nums ${
                              stockNum === 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : stockNum <= 5
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {toPersianNumbers(stockNum)} نسخه باقی‌مانده
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums">
                            {stockNum === 0
                              ? 'ناموجود (نیاز به شارژ)'
                              : stockNum <= 5
                              ? 'موجودی کم'
                              : `فروش‌رفته فیزیکی: ${toPersianNumbers(stats.physicalSold)}`}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            نامحدود (دیجیتال)
                          </div>
                          <div className="text-[11px] text-slate-500">تحویل فایل / لینک دانلود</div>
                        </>
                      )}
                    </div>

                    {/* Col 4: Price Summary */}
                    <div className="lg:col-span-1 text-[11px] space-y-0.5 tabular-nums text-slate-600 dark:text-slate-300">
                      {product.supportsDigital !== false && (
                        <div className="truncate font-bold">{formatTomans(product.digitalPrice ?? product.price)}</div>
                      )}
                      {product.supportsPhysical && (
                        <div className="truncate text-slate-500">چاپی: {formatTomans(product.physicalPrice ?? product.price)}</div>
                      )}
                    </div>

                    {/* Col 5: Quick Admin Actions */}
                    <div
                      className="lg:col-span-2 flex flex-wrap items-center lg:justify-end gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onInspectProduct(product)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-[11px] font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="مشاهده سفارش‌دهندگان، مدارک، موجودی و ویرایش تبلیغ"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>مدیریت و مدارک</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onInspectProduct(product)}
                        className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                        title="مدیریت محتوای تبلیغ"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleShowcase(product.id, !isShown)}
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          isShown
                            ? 'text-emerald-600 hover:bg-emerald-500/10'
                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                        title={isShown ? 'فعال در ویترین (کلیک برای مخفی‌سازی)' : 'مخفی از ویترین (کلیک برای فعال‌سازی)'}
                      >
                        {isShown ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {activeTab === 'catalog' && !searchQuery.trim() && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onMoveOrder(product.id, 'up')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="انتقال به بالا"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx >= filteredCatalog.length - 1}
                            onClick={() => onMoveOrder(product.id, 'down')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="انتقال به پایین"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenEdit(product)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        title="ویرایش جامع محصول (فایل‌ها، تصاویر، قیمت و ارسال)"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenDelete(product)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="حذف نرم اثر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

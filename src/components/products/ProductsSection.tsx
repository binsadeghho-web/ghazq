import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { BookOpen, AlertTriangle, CheckCircle2, Sliders, X, Power } from 'lucide-react';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';

import {
  ProductShelfKey,
  getAllProductCategories,
  getPresentersList,
} from './subcomponents/productUiHelpers';
import { ProductStatsHeader } from './subcomponents/ProductStatsHeader';
import { ProductShelfBar } from './subcomponents/ProductShelfBar';
import { ProductCard } from './subcomponents/ProductCard';
import { ProductOrdersView } from './subcomponents/ProductOrdersView';
import { ProductIntroModal } from './subcomponents/ProductIntroModal';
import { ProductCheckoutModal } from './subcomponents/ProductCheckoutModal';
import { ProductBuilderModal } from './subcomponents/ProductBuilderModal';
import { ProductStoreSettingsModal } from './subcomponents/ProductStoreSettingsModal';
import { ProductDeleteConfirmModal } from './subcomponents/ProductDeleteConfirmModal';
import { ProductLightboxModal } from './subcomponents/ProductLightboxModal';
import { ProductAdminConsole } from './subcomponents/ProductAdminConsole';
import { ProductAdminDetailModal } from './subcomponents/ProductAdminDetailModal';
import { ShieldCheck, Store } from 'lucide-react';

export const ProductsSection: React.FC = () => {
  const {
    currentUser,
    products,
    productOrders,
    productsStoreConfig,
    updateProductsStoreConfig,
    purchaseProduct,
    reviewProductOrder,
    addProduct,
    updateProduct,
    toggleProductShowcase,
    softDeleteProduct,
    reorderProducts,
    sendPinOtpSms,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const isOfficial = canManageAllInSection(currentUser, 'products', rolePolicies);

  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'storefront'>('admin');
  const [inspectingProductId, setInspectingProductId] = useState<string | null>(null);

  const [activeShelf, setActiveShelf] = useState<ProductShelfKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);
  const [enablingNow, setEnablingNow] = useState(false);

  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [purchasingProduct, setPurchasingProduct] = useState<Product | null>(null);
  const [introProduct, setIntroProduct] = useState<Product | null>(null);
  const [productBuilderOpen, setProductBuilderOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const notify = (msg: string, tone: 'success' | 'error' = 'success') => {
    setNotice({ msg, tone });
  };

  const categoriesList = useMemo(
    () => getAllProductCategories(productsStoreConfig),
    [productsStoreConfig]
  );

  // Enforce active shelf fallback for non-officials when a category is disabled
  useEffect(() => {
    if (!isOfficial && activeShelf !== 'all' && activeShelf !== 'my_library' && activeShelf !== 'orders') {
      if (productsStoreConfig.enabledCategories?.[activeShelf] === false) {
        setActiveShelf('all');
      }
    }
  }, [activeShelf, isOfficial, productsStoreConfig.enabledCategories]);

  // Keep introProduct & inspectingProduct fresh after purchase/edit
  const activeIntroProduct = useMemo(() => {
    if (!introProduct) return null;
    return products.find(p => p.id === introProduct.id) || introProduct;
  }, [introProduct, products]);

  const inspectingProduct = useMemo(() => {
    if (!inspectingProductId) return null;
    return products.find(p => p.id === inspectingProductId && !p.isDeleted) || null;
  }, [inspectingProductId, products]);

  const activeProducts = useMemo(
    () =>
      products
        .filter(p => {
          if (p.isDeleted) return false;
          if (p.isAvailable === false) return false;
          if (currentUser?.role === 'customer' && p.visibleToCustomer === false) return false;
          if (!isOfficial && productsStoreConfig.enabledCategories?.[p.format] === false) return false;
          return true;
        })
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [products, currentUser?.role, isOfficial, productsStoreConfig.enabledCategories]
  );

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categoriesList) {
      map[cat.id] = 0;
    }
    for (const p of activeProducts) {
      map[p.format] = (map[p.format] || 0) + 1;
    }
    return map;
  }, [activeProducts, categoriesList]);

  const myOwnedProducts = useMemo(() => activeProducts.filter(p => p.isOwned), [activeProducts]);

  const currentShelfList = useMemo(() => {
    let list: Product[] = activeProducts;
    if (activeShelf === 'my_library') list = myOwnedProducts;
    else if (activeShelf !== 'all' && activeShelf !== 'orders') {
      list = activeProducts.filter(p => p.format === activeShelf);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.authorOrPresenter.toLowerCase().includes(q) ||
          getPresentersList(p).some(pr => pr.toLowerCase().includes(q)) ||
          (p.subjectIndex || '').toLowerCase().includes(q) ||
          (p.shortDescription || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeShelf, activeProducts, myOwnedProducts, searchQuery]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return productOrders;
    const q = searchQuery.toLowerCase();
    return productOrders.filter(
      o =>
        o.productTitle.toLowerCase().includes(q) ||
        o.trackingCode.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q)
    );
  }, [productOrders, searchQuery]);

  // If master section is disabled and user is not an official
  if (!productsStoreConfig.isStoreEnabled && !isOfficial) {
    return (
      <div className="p-10 rounded-3xl border border-amber-500/30 bg-white dark:bg-slate-900 text-center space-y-3" dir="rtl">
        <BookOpen className="w-12 h-12 mx-auto text-amber-500" />
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          بخش «کتاب و محصولات چند رسانه‌ای» موقتاً غیرفعال است
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {productsStoreConfig.disabledNotice ||
            'این بخش موقتاً توسط مدیریت سامانه غیرفعال شده است. پس از تکمیل به‌روزرسانی مجدداً در دسترس خواهد بود.'}
        </p>
      </div>
    );
  }

  const handleEnableStoreNow = async () => {
    try {
      setEnablingNow(true);
      const nextEnabled: Record<string, boolean> = { ...(productsStoreConfig.enabledCategories || {}) };
      for (const cat of categoriesList) {
        nextEnabled[cat.id] = true;
      }
      await updateProductsStoreConfig({
        isStoreEnabled: true,
        enabledCategories: nextEnabled,
      });
      notify('بخش «کتاب و محصولات چند رسانه‌ای» و همه دسته‌بندی‌ها برای تمامی کاربران فعال شد.');
    } catch (err: any) {
      notify(err?.message || 'خطا در فعال‌سازی فوری بخش', 'error');
    } finally {
      setEnablingNow(false);
    }
  };

  const handleOpenProductBuilder = (productToEdit?: Product) => {
    setEditingProduct(productToEdit || null);
    setProductBuilderOpen(true);
  };

  const handleSaveProductBuilder = async (payload: any, editingProductId: string | null) => {
    if (editingProductId) {
      await updateProduct(editingProductId, payload);
      notify(`تغییرات «${payload.title}» با موفقیت در پایگاه داده ذخیره و همگام‌سازی شد.`);
    } else {
      await addProduct(payload);
      notify(`«${payload.title}» با موفقیت ثبت و در ویترین جامع خدمات و فروشگاه فعال شد.`);
    }
  };

  const handleToggleShowcase = async (productId: string, showInShowcase: boolean) => {
    try {
      await toggleProductShowcase(productId, showInShowcase);
      notify(
        showInShowcase
          ? 'نمایش اثر در ویترین جامع خدمات فعال شد.'
          : 'اثر از ویترین جامع خدمات مخفی شد (در فروشگاه همچنان موجود است).'
      );
    } catch (err: any) {
      notify(err?.message || 'خطا در تغییر وضعیت نمایش ویترین', 'error');
    }
  };

  const handleConfirmSoftDelete = async (productId: string) => {
    const target = products.find(p => p.id === productId);
    await softDeleteProduct(productId);
    notify(`اثر «${target?.title || ''}» به صورت امن حذف منطقی شد.`);
  };

  const handleMoveOrder = async (productId: string, direction: 'up' | 'down') => {
    const orderedCatalog = products
      .filter(p => !p.isDeleted)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const idx = orderedCatalog.findIndex(p => p.id === productId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= orderedCatalog.length) return;
    const nextOrder = [...orderedCatalog];
    const [moved] = nextOrder.splice(idx, 1);
    nextOrder.splice(swapIdx, 0, moved);
    try {
      await reorderProducts(nextOrder.map(p => p.id));
      notify('ترتیب چینش ویترین محصولات به‌روزرسانی شد.');
    } catch (err: any) {
      notify(err?.message || 'خطا در تغییر ترتیب محصولات', 'error');
    }
  };

  const anyCategoryDisabled = categoriesList.some(
    cat => productsStoreConfig.enabledCategories?.[cat.id] === false
  );

  return (
    <div className="space-y-5" dir="rtl">
      {isOfficial && (!productsStoreConfig.isStoreEnabled || anyCategoryDisabled) && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {!productsStoreConfig.isStoreEnabled
                ? 'هشدار مدیریتی: کل بخش «کتاب و محصولات چند رسانه‌ای» هم‌اکنون برای کاربران غیرفعال است و پیام غیرفعالی نمایش می‌دهد.'
                : 'توجه: یک یا چند دسته‌بندی محصولات در حال حاضر برای کاربران غیرفعال است.'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={enablingNow}
              onClick={handleEnableStoreNow}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{enablingNow ? 'در حال فعال‌سازی...' : 'فعال‌سازی فوری برای همه کاربران'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>تنظیمات</span>
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            notice.tone === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice.msg}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="cursor-pointer opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isOfficial && (
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-6 py-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              {adminViewMode === 'admin'
                ? 'حالت پنل مدیریت — نظارت بر سفارش‌ها، مدارک واریزی، موجودی و تبلیغات'
                : 'حالت پیش‌نمایش فروشگاه دانش‌آموختگان'}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {productsStoreConfig.storeTitle || 'کتاب و محصولات چند رسانه‌ای'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminViewMode('admin')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  adminViewMode === 'admin'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>پنل مدیریت</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminViewMode('storefront')}
                className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  adminViewMode === 'storefront'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5 text-sky-500" />
                <span>نمای دانش‌آموختگان</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>تنظیمات بخش و عناوین</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenProductBuilder()}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>+ افزودن کتاب / نشست / محصول</span>
            </button>
          </div>
        </div>
      )}

      {isOfficial && adminViewMode === 'admin' ? (
        <ProductAdminConsole
          products={products}
          orders={productOrders}
          storeConfig={productsStoreConfig}
          onInspectProduct={prod => setInspectingProductId(prod.id)}
          onOpenAddProduct={() => handleOpenProductBuilder()}
          onOpenEdit={handleOpenProductBuilder}
          onOpenDelete={setProductToDelete}
          onToggleShowcase={handleToggleShowcase}
          onMoveOrder={handleMoveOrder}
          onReviewOrder={reviewProductOrder}
          onNotify={notify}
        />
      ) : (
        <>
          {!isOfficial && (
            <ProductStatsHeader
              storeConfig={productsStoreConfig}
              activeProductsCount={activeProducts.length}
              categoryCounts={categoryCounts}
              myOwnedCount={myOwnedProducts.length}
              ordersCount={productOrders.length}
              activeShelf={activeShelf}
              onSelectShelf={setActiveShelf}
              isOfficial={false}
              onOpenAddProduct={() => handleOpenProductBuilder()}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}

          <ProductShelfBar
            activeShelf={activeShelf}
            onSelectShelf={setActiveShelf}
            storeConfig={productsStoreConfig}
            isOfficial={isOfficial}
            allCount={activeProducts.length}
            categoryCounts={categoryCounts}
            myOwnedCount={myOwnedProducts.length}
            ordersCount={productOrders.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {activeShelf === 'orders' ? (
            <ProductOrdersView
              orders={filteredOrders}
              products={products}
              storeConfig={productsStoreConfig}
              isOfficial={isOfficial}
              onReviewOrder={reviewProductOrder}
              onNotify={notify}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentShelfList.length === 0 ? (
                <div className="col-span-full p-14 text-center text-xs text-slate-400 space-y-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
                    هیچ اثری در این دسته‌بندی یا با عبارت جستجوی شما یافت نشد.
                  </p>
                </div>
              ) : (
                currentShelfList.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={idx}
                    totalCount={currentShelfList.length}
                    isOfficial={isOfficial}
                    storeConfig={productsStoreConfig}
                    onOpenLightbox={setLightboxImage}
                    onOpenIntro={isOfficial && adminViewMode === 'admin' ? p => setInspectingProductId(p.id) : setIntroProduct}
                    onOpenPurchase={setPurchasingProduct}
                    onOpenEdit={handleOpenProductBuilder}
                    onOpenDelete={setProductToDelete}
                    onMoveOrder={isOfficial && activeShelf === 'all' ? handleMoveOrder : undefined}
                    onToggleShowcase={isOfficial ? handleToggleShowcase : undefined}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      <ProductIntroModal
        product={activeIntroProduct}
        storeConfig={productsStoreConfig}
        isOfficial={isOfficial}
        onClose={() => setIntroProduct(null)}
        onOpenPurchase={setPurchasingProduct}
        onOpenLightbox={setLightboxImage}
      />

      <ProductCheckoutModal
        product={purchasingProduct}
        currentUser={currentUser}
        storeConfig={productsStoreConfig}
        onClose={() => setPurchasingProduct(null)}
        onSubmitPurchase={payload => {
          if (!purchasingProduct) {
            return Promise.reject(new Error('محصول انتخاب نشده است'));
          }
          return purchaseProduct(purchasingProduct.id, payload);
        }}
      />

      <ProductBuilderModal
        isOpen={productBuilderOpen}
        editingProduct={editingProduct}
        storeConfig={productsStoreConfig}
        onClose={() => setProductBuilderOpen(false)}
        onSave={handleSaveProductBuilder}
        onUpdateStoreConfig={updateProductsStoreConfig}
      />

      <ProductStoreSettingsModal
        isOpen={settingsOpen}
        config={productsStoreConfig}
        onClose={() => setSettingsOpen(false)}
        onSave={async updates => {
          await updateProductsStoreConfig(updates);
          notify('تنظیمات بخش کتاب و محصولات چند رسانه‌ای ذخیره و همگام‌سازی شد.');
        }}
      />

      <ProductDeleteConfirmModal
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirmDelete={handleConfirmSoftDelete}
        sendPinOtpSms={sendPinOtpSms}
      />

      <ProductLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      <ProductAdminDetailModal
        product={inspectingProduct}
        orders={productOrders}
        storeConfig={productsStoreConfig}
        onClose={() => setInspectingProductId(null)}
        onUpdateProduct={updateProduct}
        onToggleShowcase={handleToggleShowcase}
        onOpenFullEdit={handleOpenProductBuilder}
        onReviewOrder={reviewProductOrder}
        onNotify={notify}
      />
    </div>
  );
};

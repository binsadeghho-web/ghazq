import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { BookOpen, AlertTriangle, CheckCircle2, Sliders, X } from 'lucide-react';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';

import { ProductShelfKey } from './subcomponents/productUiHelpers';
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
    softDeleteProduct,
    reorderProducts,
    sendPinOtpSms,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const isOfficial = canManageAllInSection(currentUser, 'products', rolePolicies);

  const [activeShelf, setActiveShelf] = useState<ProductShelfKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<{ msg: string; tone: 'success' | 'error' } | null>(null);

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

  // Enforce Reform 30 active shelf fallback for non-officials when a category is disabled
  useEffect(() => {
    if (!isOfficial) {
      if (
        (activeShelf === 'book' || activeShelf === 'multimedia' || activeShelf === 'audio_series') &&
        productsStoreConfig.enabledCategories?.[activeShelf] === false
      ) {
        setActiveShelf('all');
      }
    }
  }, [activeShelf, isOfficial, productsStoreConfig.enabledCategories]);

  const activeProducts = useMemo(
    () =>
      products
        .filter(p => {
          if (p.isDeleted) return false;
          if (currentUser?.role === 'customer' && p.visibleToCustomer === false) return false;
          if (!isOfficial && productsStoreConfig.enabledCategories?.[p.format] === false) return false;
          return true;
        })
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [products, currentUser?.role, isOfficial, productsStoreConfig.enabledCategories]
  );

  const booksShelf = useMemo(() => activeProducts.filter(p => p.format === 'book'), [activeProducts]);
  const multimediaShelf = useMemo(() => activeProducts.filter(p => p.format === 'multimedia'), [activeProducts]);
  const audioShelf = useMemo(() => activeProducts.filter(p => p.format === 'audio_series'), [activeProducts]);
  const myOwnedProducts = useMemo(() => activeProducts.filter(p => p.isOwned), [activeProducts]);

  const currentShelfList = useMemo(() => {
    let list: Product[] = activeProducts;
    if (activeShelf === 'book') list = booksShelf;
    else if (activeShelf === 'multimedia') list = multimediaShelf;
    else if (activeShelf === 'audio_series') list = audioShelf;
    else if (activeShelf === 'my_library') list = myOwnedProducts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.authorOrPresenter.toLowerCase().includes(q) ||
          (p.subjectIndex || '').toLowerCase().includes(q) ||
          (p.shortDescription || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeShelf, activeProducts, booksShelf, multimediaShelf, audioShelf, myOwnedProducts, searchQuery]);

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

  // Reform 30: If master section is disabled and user is not an official
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

  const handleOpenProductBuilder = (productToEdit?: Product) => {
    setEditingProduct(productToEdit || null);
    setProductBuilderOpen(true);
  };

  const handleSaveProductBuilder = async (payload: any, editingProductId: string | null) => {
    if (editingProductId) {
      await updateProduct(editingProductId, payload);
      notify(`تغییرات «${payload.title}» با موفقیت ذخیره شد.`);
    } else {
      await addProduct(payload);
      notify(`«${payload.title}» به کتاب و محصولات چند رسانه‌ای اضافه شد.`);
    }
  };

  const handleConfirmSoftDelete = async (productId: string) => {
    const target = products.find(p => p.id === productId);
    await softDeleteProduct(productId);
    notify(`اثر «${target?.title || ''}» به صورت امن حذف منطقی شد.`);
  };

  const handleMoveOrder = async (productId: string, direction: 'up' | 'down') => {
    const idx = activeProducts.findIndex(p => p.id === productId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= activeProducts.length) return;
    const nextOrder = [...activeProducts];
    const [moved] = nextOrder.splice(idx, 1);
    nextOrder.splice(swapIdx, 0, moved);
    try {
      await reorderProducts(nextOrder.map(p => p.id));
      notify('ترتیب چینش ویترین محصولات به‌روزرسانی شد.');
    } catch (err: any) {
      notify(err?.message || 'خطا در تغییر ترتیب محصولات', 'error');
    }
  };

  const anyCategoryDisabled =
    productsStoreConfig.enabledCategories?.book === false ||
    productsStoreConfig.enabledCategories?.multimedia === false ||
    productsStoreConfig.enabledCategories?.audio_series === false;

  return (
    <div className="space-y-5" dir="rtl">
      {isOfficial && (!productsStoreConfig.isStoreEnabled || anyCategoryDisabled) && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {!productsStoreConfig.isStoreEnabled
                ? 'هشدار مدیریتی: کل بخش «کتاب و محصولات چند رسانه‌ای» برای کاربران غیرفعال است.'
                : 'توجه: یک یا چند دسته‌بندی (کتاب / چندرسانه‌ای / صوت) در حال حاضر برای کاربران غیرفعال است.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>تغییر وضعیت فعال‌سازی</span>
          </button>
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

      <ProductStatsHeader
        storeConfig={productsStoreConfig}
        activeProductsCount={activeProducts.length}
        booksCount={booksShelf.length}
        multimediaCount={multimediaShelf.length}
        audioCount={audioShelf.length}
        myOwnedCount={myOwnedProducts.length}
        ordersCount={productOrders.length}
        activeShelf={activeShelf}
        onSelectShelf={setActiveShelf}
        isOfficial={isOfficial}
        onOpenAddProduct={() => handleOpenProductBuilder()}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <ProductShelfBar
        activeShelf={activeShelf}
        onSelectShelf={setActiveShelf}
        storeConfig={productsStoreConfig}
        isOfficial={isOfficial}
        allCount={activeProducts.length}
        booksCount={booksShelf.length}
        multimediaCount={multimediaShelf.length}
        audioCount={audioShelf.length}
        myOwnedCount={myOwnedProducts.length}
        ordersCount={productOrders.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {activeShelf === 'orders' ? (
        <ProductOrdersView
          orders={filteredOrders}
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
                onOpenLightbox={setLightboxImage}
                onOpenIntro={setIntroProduct}
                onOpenPurchase={setPurchasingProduct}
                onOpenEdit={handleOpenProductBuilder}
                onOpenDelete={setProductToDelete}
                onMoveOrder={isOfficial && activeShelf === 'all' ? handleMoveOrder : undefined}
              />
            ))
          )}
        </div>
      )}

      <ProductIntroModal
        product={introProduct}
        storeConfig={productsStoreConfig}
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
    </div>
  );
};

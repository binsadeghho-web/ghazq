import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { resolveProductCoverUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';
import {
  formatPresentersText,
  formatTomans,
  getAllProductCategories,
  getProductCategoryLabel,
} from '../products/subcomponents/productUiHelpers';
import { ProductIntroModal } from '../products/subcomponents/ProductIntroModal';
import { ProductCheckoutModal } from '../products/subcomponents/ProductCheckoutModal';
import { ProductBuilderModal } from '../products/subcomponents/ProductBuilderModal';
import { ProductLightboxModal } from '../products/subcomponents/ProductLightboxModal';
import {
  ArrowUpRight,
  ChevronLeft,
  Edit3,
  X,
  BookMarked,
  Eye,
  EyeOff,
  Headphones,
} from 'lucide-react';

interface BooksAndPublicationsShowcaseProps {
  onNavigateToProducts?: () => void;
}

export const BooksAndPublicationsShowcase: React.FC<BooksAndPublicationsShowcaseProps> = ({
  onNavigateToProducts,
}) => {
  const {
    products,
    productsStoreConfig,
    updateProductsStoreConfig,
    currentUser,
    crextioConfig,
    updateCrextioConfig,
    updateProduct,
    toggleProductShowcase,
    purchaseProduct,
    isAlumniPreview,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const isAdmin =
    canManageAllInSection(currentUser, 'products', rolePolicies) && !isAlumniPreview;

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeCatFilter, setActiveCatFilter] = useState<string>('all');
  const [introProduct, setIntroProduct] = useState<Product | null>(null);
  const [purchasingProduct, setPurchasingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const allCategories = useMemo(
    () => getAllProductCategories(productsStoreConfig),
    [productsStoreConfig]
  );

  const title = crextioConfig.booksShowcaseTitle || 'ویترین کتاب و محصولات چند رسانه‌ای';
  const subtitle =
    crextioConfig.booksShowcaseSubtitle ||
    'مجموعه کتب مرجع، نشست‌های علمی صوتی و تصویری و درس‌گفتارهای مرکز فقه و حقوق اسلامی با دسترسی دیجیتال و فیزیکی';
  const ctaLabel = crextioConfig.booksShowcaseCtaText || 'ورود به کتاب و محصولات چند رسانه‌ای';

  // Live catalog driven directly from database products (new items default to showInShowcase: true)
  const visibleCatalogProducts = useMemo(() => {
    return [...products]
      .filter(p => {
        if (p.isDeleted || !p.isAvailable) return false;
        if (currentUser?.role === 'customer' && p.visibleToCustomer === false) return false;
        if (!isAdmin) {
          if (p.showInShowcase === false) return false;
          if (productsStoreConfig.enabledCategories?.[p.format] === false) return false;
        }
        return true;
      })
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [products, currentUser?.role, isAdmin, productsStoreConfig.enabledCategories]);

  const displayedProducts = useMemo(() => {
    if (activeCatFilter === 'all') return visibleCatalogProducts;
    return visibleCatalogProducts.filter(p => p.format === activeCatFilter);
  }, [visibleCatalogProducts, activeCatFilter]);

  const availableFilterCats = useMemo(
    () =>
      allCategories.filter(
        cat => isAdmin || productsStoreConfig.enabledCategories?.[cat.id] !== false
      ),
    [allCategories, isAdmin, productsStoreConfig.enabledCategories]
  );

  const [editTitle, setEditTitle] = useState(title);
  const [editSubtitle, setEditSubtitle] = useState(subtitle);

  useEffect(() => {
    setEditTitle(title);
    setEditSubtitle(subtitle);
  }, [title, subtitle]);

  // Hide completely for non-official users when section is disabled
  if (!productsStoreConfig.isStoreEnabled && !isAdmin) {
    return null;
  }

  const handleSaveSettings = () => {
    updateCrextioConfig({
      booksShowcaseTitle: editTitle,
      booksShowcaseSubtitle: editSubtitle,
    });
    setIsSettingsModalOpen(false);
  };

  const handleToggleShowcase = async (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setTogglingId(prod.id);
      await toggleProductShowcase(prod.id, prod.showInShowcase === false);
    } finally {
      setTogglingId(null);
    }
  };

  const activeIntroProduct = introProduct
    ? products.find(p => p.id === introProduct.id) || introProduct
    : null;

  return (
    <div className="w-full relative overflow-hidden rounded-[28px] bg-[#FCFCFA] border border-stone-200/90 shadow-xs p-5 sm:p-7 text-stone-900 space-y-5">
      {isAdmin && !productsStoreConfig.isStoreEnabled && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
          بخش «کتاب و محصولات چند رسانه‌ای» برای کاربران غیرفعال است؛ این ویترین صرفاً در نمای مدیر نمایش داده می‌شود.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900">{title}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Category Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200 text-[11px] font-bold overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCatFilter('all')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                activeCatFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-600'
              }`}
            >
              همه
            </button>
            {availableFilterCats.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCatFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                  activeCatFilter === cat.id ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-600'
                }`}
              >
                {cat.shortLabel || cat.label}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>عنوان ویترین</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToProducts}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-2xs cursor-pointer"
          >
            <span>{ctaLabel}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Product Showcase Grid */}
      {displayedProducts.length === 0 ? (
        <div className="p-8 text-center text-xs text-stone-500 rounded-2xl bg-stone-50 border border-stone-200">
          هیچ محصول فعالی در این دسته‌بندی برای نمایش در ویترین وجود ندارد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedProducts.slice(0, 8).map((prod, idx) => {
            const coverUrl = resolveProductCoverUrl(prod.coverImage, prod.format, idx);
            const displayPrice =
              prod.supportsDigital !== false
                ? Number(prod.digitalPrice ?? prod.price ?? 0)
                : Number(prod.physicalPrice ?? prod.price ?? 0);
            const isShown = prod.showInShowcase !== false;
            const sessionsCount = Array.isArray(prod.mediaSessions) ? prod.mediaSessions.length : 0;

            return (
              <motion.div
                key={prod.id}
                whileHover={{ y: -3 }}
                onClick={() => setIntroProduct(prod)}
                className={`group p-3.5 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md ${
                  !isShown ? 'border-dashed border-stone-300 opacity-70' : 'border-stone-200/90 hover:border-purple-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img
                      src={coverUrl}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/85 text-white text-[10px] font-black">
                      {getProductCategoryLabel(prod.format, prod.formatTitle, productsStoreConfig)}
                    </span>
                    {sessionsCount > 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-indigo-900/85 text-white text-[10px] font-bold flex items-center gap-1 tabular-nums">
                        <Headphones className="w-3 h-3" />
                        {toPersianNumbers(sessionsCount)}
                      </span>
                    )}
                    {isAdmin && !isShown && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                        مخفی از ویترین
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-stone-900 group-hover:text-purple-900 transition-colors line-clamp-1">
                      {prod.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-1 font-medium">
                      {formatPresentersText(prod)}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-amber-700 tabular-nums">
                      {formatTomans(displayPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          disabled={togglingId === prod.id}
                          onClick={e => handleToggleShowcase(prod, e)}
                          title={isShown ? 'غیرفعال در ویترین' : 'فعال در ویترین'}
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            isShown
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-stone-200 bg-stone-100 text-stone-500'
                          }`}
                        >
                          {isShown ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingProduct(prod);
                            setBuilderOpen(true);
                          }}
                          title="ویرایش محصول"
                          className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-amber-50 text-amber-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <span className="text-xs text-purple-800 font-extrabold flex items-center gap-0.5 group-hover:underline">
                      <span>مشاهده</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Showcase Title Edit Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-700" />
                  <h4 className="font-black text-sm text-stone-900">
                    تنظیم عنوان و توضیح ویترین محصولات
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">عنوان ویترین:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">توضیح کوتاه ویترین:</label>
                  <textarea
                    rows={2}
                    value={editSubtitle}
                    onChange={e => setEditSubtitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Interactive Modals */}
      <ProductIntroModal
        product={activeIntroProduct}
        storeConfig={productsStoreConfig}
        isOfficial={isAdmin}
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
        isOpen={builderOpen}
        editingProduct={editingProduct}
        storeConfig={productsStoreConfig}
        onClose={() => {
          setBuilderOpen(false);
          setEditingProduct(null);
        }}
        onSave={async (payload, editingId) => {
          if (editingId) {
            await updateProduct(editingId, payload);
          }
        }}
        onUpdateStoreConfig={updateProductsStoreConfig}
      />

      <ProductLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};

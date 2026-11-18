import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { Product } from '../../types';
import { resolveProductCoverUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';
import {
  ArrowUpRight,
  ChevronLeft,
  Edit3,
  X,
  Plus,
  Trash2,
  BookMarked,
  Upload,
  Loader2,
  Camera,
  AlertCircle,
} from 'lucide-react';

interface BooksAndPublicationsShowcaseProps {
  onNavigateToProducts?: () => void;
}

const FORMAT_LABELS: Record<Product['format'], string> = {
  book: 'کتاب',
  multimedia: 'چندرسانه‌ای',
  audio_series: 'صوت',
};

export const BooksAndPublicationsShowcase: React.FC<BooksAndPublicationsShowcaseProps> = ({
  onNavigateToProducts,
}) => {
  const {
    products,
    productsStoreConfig,
    currentUser,
    crextioConfig,
    updateCrextioConfig,
    isAlumniPreview,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const isAdmin =
    canManageAllInSection(currentUser, 'products', rolePolicies) && !isAlumniPreview;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeCatFilter, setActiveCatFilter] = useState<'all' | Product['format']>('all');

  const selectedCategories: Array<Product['format']> =
    Array.isArray(crextioConfig.booksShowcaseSelectedCategories) &&
    crextioConfig.booksShowcaseSelectedCategories.length > 0
      ? crextioConfig.booksShowcaseSelectedCategories
      : ['book', 'multimedia', 'audio_series'];

  const title = crextioConfig.booksShowcaseTitle || 'ویترین کتاب و محصولات چند رسانه‌ای';
  const subtitle =
    crextioConfig.booksShowcaseSubtitle ||
    'مجموعه کتب مرجع، محصولات چندرسانه‌ای و درس‌گفتارهای صوتی مرکز فقه و حقوق اسلامی با انتخاب نسخه دیجیتال یا فیزیکی';
  const ctaLabel = crextioConfig.booksShowcaseCtaText || 'ورود به کتاب و محصولات چند رسانه‌ای';

  const visibleCatalogProducts = useMemo(() => {
    return products.filter(p => {
      if (p.isDeleted) return false;
      if (!selectedCategories.includes(p.format)) return false;
      if (!isAdmin && productsStoreConfig.enabledCategories?.[p.format] === false) return false;
      return true;
    });
  }, [products, selectedCategories, isAdmin, productsStoreConfig.enabledCategories]);

  const defaultItems = useMemo(
    () =>
      visibleCatalogProducts.slice(0, 6).map((p, idx) => ({
        id: p.id,
        productId: p.id,
        format: p.format,
        title: p.title,
        author: p.authorOrPresenter,
        price: Number(p.digitalPrice ?? p.price ?? 0),
        physicalPrice: Number(p.physicalPrice ?? p.price ?? 0),
        supportsDigital: p.supportsDigital !== false,
        supportsPhysical: Boolean(p.supportsPhysical),
        discountPercent: 0,
        coverImage: resolveProductCoverUrl(p.coverImage, p.format, idx),
        tag: FORMAT_LABELS[p.format],
        shortDescription: p.shortDescription || p.description,
      })),
    [visibleCatalogProducts]
  );

  const savedItems =
    crextioConfig.booksCustomItems && crextioConfig.booksCustomItems.length > 0
      ? crextioConfig.booksCustomItems.map((item, idx) => {
          const fmt: Product['format'] =
            item.format === 'multimedia' || item.format === 'audio_series' ? item.format : 'book';
          return {
            ...item,
            format: fmt,
            coverImage: resolveProductCoverUrl(item.coverImage, fmt, idx),
          };
        })
      : defaultItems;

  const displayedItems = useMemo(() => {
    return savedItems.filter(item => {
      const fmt: Product['format'] =
        item.format === 'multimedia' || item.format === 'audio_series' ? item.format : 'book';
      if (!selectedCategories.includes(fmt)) return false;
      if (!isAdmin && productsStoreConfig.enabledCategories?.[fmt] === false) return false;
      if (activeCatFilter !== 'all' && fmt !== activeCatFilter) return false;
      return true;
    });
  }, [savedItems, selectedCategories, isAdmin, productsStoreConfig.enabledCategories, activeCatFilter]);

  const [editTitle, setEditTitle] = useState(title);
  const [editSubtitle, setEditSubtitle] = useState(subtitle);
  const [editCategories, setEditCategories] = useState<Array<Product['format']>>(selectedCategories);
  const [customItems, setCustomItems] = useState(savedItems);

  useEffect(() => {
    setEditTitle(title);
    setEditSubtitle(subtitle);
    setEditCategories(selectedCategories);
    setCustomItems(savedItems);
  }, [title, subtitle, crextioConfig.booksCustomItems, products.length]);

  // Reform 30: Hide completely for non-official users when section is disabled
  if (!productsStoreConfig.isStoreEnabled && !isAdmin) {
    return null;
  }

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setCustomItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleUploadImage = async (id: string, file: File) => {
    if (!file) return;
    setUploadingId(id);
    setUploadError(null);
    try {
      const res = await api.uploadFile(file, 'product');
      if (res?.url) {
        if (id === '__showcase_banner__') {
          updateCrextioConfig({
            showcaseImageOverrides: {
              ...(crextioConfig.showcaseImageOverrides || {}),
              books_showcase: res.url,
            },
          });
        } else {
          handleUpdateItem(id, 'coverImage', res.url);
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || 'خطا در آپلود تصویر روی سرور');
    } finally {
      setUploadingId(null);
    }
  };

  const handleAddItem = () => {
    setCustomItems(prev => [
      ...prev,
      {
        id: `prd-custom-${Date.now()}`,
        format: 'book',
        title: 'موسوعه یا محصول علمی جدید',
        author: 'مرکز فقه و حقوق اسلامی',
        price: 350000,
        physicalPrice: 520000,
        supportsDigital: true,
        supportsPhysical: true,
        discountPercent: 0,
        coverImage: resolveProductCoverUrl(undefined, 'book', prev.length),
        tag: 'کتاب',
      },
    ]);
  };

  const handleSave = () => {
    updateCrextioConfig({
      booksShowcaseTitle: editTitle,
      booksShowcaseSubtitle: editSubtitle,
      booksShowcaseSelectedCategories: editCategories.length > 0 ? editCategories : ['book', 'multimedia', 'audio_series'],
      booksCustomItems: customItems,
    });
    setIsEditModalOpen(false);
  };

  const availableFilterCats = (['book', 'multimedia', 'audio_series'] as const).filter(
    cat => selectedCategories.includes(cat) && (isAdmin || productsStoreConfig.enabledCategories?.[cat] !== false)
  );

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
          {/* Interactive Category Switcher for all 3 categories */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveCatFilter('all')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                activeCatFilter === 'all' ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-600'
              }`}
            >
              همه
            </button>
            {availableFilterCats.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCatFilter(cat)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  activeCatFilter === cat ? 'bg-white text-stone-900 shadow-2xs font-black' : 'text-stone-600'
                }`}
              >
                {FORMAT_LABELS[cat]}
              </button>
            ))}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>چینش و ویرایش ویترین</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedItems.slice(0, 4).map((item, idx) => {
          const fmt: Product['format'] =
            item.format === 'multimedia' || item.format === 'audio_series' ? item.format : 'book';
          const coverUrl = resolveProductCoverUrl(item.coverImage, fmt, idx);
          const discountedPrice = Math.round(item.price * (1 - (item.discountPercent || 0) / 100));

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              onClick={onNavigateToProducts}
              className="group p-3.5 rounded-2xl bg-white border border-stone-200/90 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md"
            >
              <div className="space-y-2.5">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img
                    src={coverUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/85 text-white text-[10px] font-black">
                    {item.tag || FORMAT_LABELS[fmt]}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 group-hover:text-purple-900 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-1 font-medium">
                    {item.author}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm font-black text-amber-700 tabular-nums">
                    {toPersianNumbers(discountedPrice.toLocaleString('fa-IR'))}
                  </span>
                  <span className="text-[10px] text-stone-500 mr-1">تومان</span>
                </div>

                <span className="text-xs text-purple-800 font-extrabold flex items-center gap-0.5 group-hover:underline">
                  <span>مشاهده و خرید</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-700" />
                  <h4 className="font-black text-sm text-stone-900">
                    تنظیم ویترین کتاب و محصولات چند رسانه‌ای (هر سه دسته)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Category selector for showcase (Reforms 24 & 29) */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                <span className="font-black text-stone-800 block">
                  دسته‌های مجاز برای نمایش در ویترین داشبورد:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['book', 'multimedia', 'audio_series'] as const).map(cat => {
                    const checked = editCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer font-bold ${
                          checked ? 'bg-white border-purple-400 text-purple-900' : 'bg-stone-100 border-stone-200 text-stone-500'
                        }`}
                      >
                        <span>{FORMAT_LABELS[cat]}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e =>
                            setEditCategories(prev =>
                              e.target.checked
                                ? Array.from(new Set([...prev, cat]))
                                : prev.filter(c => c !== cat)
                            )
                          }
                          className="accent-purple-700"
                        />
                      </label>
                    );
                  })}
                </div>
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

              <div className="space-y-3 pt-2 border-t border-stone-200 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h5 className="font-black text-xs text-stone-900">آثار برگزیده ویترین (کتاب، چندرسانه‌ای، صوت):</h5>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      onChange={e => {
                        const selectedP = products.find(p => p.id === e.target.value);
                        if (selectedP) {
                          setCustomItems(prev => [
                            ...prev,
                            {
                              id: `prd-${Date.now()}`,
                              productId: selectedP.id,
                              format: selectedP.format,
                              title: selectedP.title,
                              author: selectedP.authorOrPresenter,
                              price: Number(selectedP.digitalPrice ?? selectedP.price ?? 0),
                              physicalPrice: Number(selectedP.physicalPrice ?? selectedP.price ?? 0),
                              discountPercent: 0,
                              coverImage: resolveProductCoverUrl(selectedP.coverImage, selectedP.format),
                              tag: FORMAT_LABELS[selectedP.format],
                            },
                          ]);
                        }
                        e.target.value = '';
                      }}
                      className="p-1.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-bold text-stone-800"
                    >
                      <option value="">+ افزودن از محصولات موجود (همه دسته‌ها)...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          [{FORMAT_LABELS[p.format]}] {p.title}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> افزودن دستی
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {customItems.map((item, idx) => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-purple-50/40 border border-purple-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">دسته اثر:</label>
                          <select
                            value={item.format || 'book'}
                            onChange={e => handleUpdateItem(item.id, 'format', e.target.value)}
                            className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300"
                          >
                            <option value="book">کتاب</option>
                            <option value="multimedia">محصول چندرسانه‌ای</option>
                            <option value="audio_series">صوت</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-stone-500 block">عنوان اثر:</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => handleUpdateItem(item.id, 'title', e.target.value)}
                            className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">نویسنده / ارائه‌دهنده:</label>
                          <input
                            type="text"
                            value={item.author}
                            onChange={e => handleUpdateItem(item.id, 'author', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block">قیمت نمایشی (تومان):</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => handleUpdateItem(item.id, 'price', parseInt(e.target.value, 10) || 0)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block">برچسب:</label>
                          <input
                            type="text"
                            value={item.tag}
                            onChange={e => handleUpdateItem(item.id, 'tag', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <img
                          src={resolveProductCoverUrl(item.coverImage, (item.format as any) || 'book', idx)}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover border border-purple-200 shrink-0"
                        />
                        <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-900 text-white font-bold text-[10px] cursor-pointer shrink-0">
                          {uploadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                          <span>آپلود تصویر جلد</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleUploadImage(item.id, e.target.files[0])}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setCustomItems(prev => prev.filter(i => i.id !== item.id))}
                          className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1 mr-auto cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  ذخیره دائمی ویترین
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

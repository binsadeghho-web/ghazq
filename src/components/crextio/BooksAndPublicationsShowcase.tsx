import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { DEFAULT_SHOWCASE_IMAGES, resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
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
} from 'lucide-react';

interface BooksAndPublicationsShowcaseProps {
  onNavigateToProducts?: () => void;
}

export const BooksAndPublicationsShowcase: React.FC<BooksAndPublicationsShowcaseProps> = ({
  onNavigateToProducts
}) => {
  const { products, currentUser, crextioConfig, updateCrextioConfig } = useApp();
  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'alumni_manager' ||
    currentUser?.role === 'supervisor';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const title = crextioConfig.booksShowcaseTitle || 'ویترین جامع کتب، انتشارات و منشورات تخصصی فقه و قضا';
  const subtitle = crextioConfig.booksShowcaseSubtitle || 'مجموعه کتب مرجع، موسوعه‌ها، درس‌گفتارهای تحلیلی و منشورات علمی کانون دانش‌آموختگان نخبگانی';

  const showcaseBannerUrl = resolveShowcaseImageUrl(
    'books_showcase',
    crextioConfig.showcaseImageOverrides
  );

  const defaultItems = products.slice(0, 4).map(p => ({
    id: p.id,
    title: p.title,
    author: p.authorOrPresenter,
    price: p.price,
    discountPercent: 20,
    coverImage: p.coverImage || DEFAULT_SHOWCASE_IMAGES.books_showcase,
    tag: p.formatTitle || 'کتاب تخصصی',
  }));

  const savedItems =
    crextioConfig.booksCustomItems && crextioConfig.booksCustomItems.length > 0
      ? crextioConfig.booksCustomItems
      : defaultItems;

  const [editTitle, setEditTitle] = useState(title);
  const [editSubtitle, setEditSubtitle] = useState(subtitle);
  const [customItems, setCustomItems] = useState(savedItems);

  useEffect(() => {
    setEditTitle(title);
    setEditSubtitle(subtitle);
    setCustomItems(
      crextioConfig.booksCustomItems && crextioConfig.booksCustomItems.length > 0
        ? crextioConfig.booksCustomItems
        : defaultItems
    );
  }, [title, subtitle, crextioConfig.booksCustomItems, products.length]);

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setCustomItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleUploadImage = async (id: string, file: File) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const res = await api.uploadFile(file, 'misc');
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
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingId(null);
    }
  };

  const handleAddItem = () => {
    const newItem = {
      id: `book-${Date.now()}`,
      title: 'موسوعه تخصصی آراء قضایی',
      author: 'استاد موسوی',
      price: 150000,
      discountPercent: 25,
      coverImage: showcaseBannerUrl || DEFAULT_SHOWCASE_IMAGES.books_showcase,
      tag: 'کتاب مرجع'
    };
    setCustomItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setCustomItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = () => {
    updateCrextioConfig({
      booksShowcaseTitle: editTitle,
      booksShowcaseSubtitle: editSubtitle,
      booksCustomItems: customItems,
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-[32px] bg-[#FCFCFA] border border-stone-200/90 shadow-sm p-5 sm:p-7 text-stone-900 space-y-5">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shadow-2xs">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-stone-900">{title}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-extrabold">
                ویترین انتشارات
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>ویرایش ویترین کتاب</span>
            </button>
          )}

          <button
            onClick={onNavigateToProducts}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>ورود به فروشگاه انتشارات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Book Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {customItems.map(item => {
          const discountedPrice = Math.round(item.price * (1 - (item.discountPercent / 100)));

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              onClick={onNavigateToProducts}
              className="group p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="relative h-36 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img
                    src={item.coverImage || showcaseBannerUrl || DEFAULT_SHOWCASE_IMAGES.books_showcase}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-purple-900/90 text-white text-[10px] font-black shadow-2xs">
                    {item.tag}
                  </span>
                  {item.discountPercent > 0 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-black shadow-2xs">
                      {toPersianNumbers(item.discountPercent)}٪ تخفیف
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-stone-900 group-hover:text-purple-900 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1 font-medium">
                    پدیدآور: {item.author}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-amber-700">
                      {toPersianNumbers(discountedPrice.toLocaleString('fa-IR'))}
                    </span>
                    <span className="text-[10px] text-stone-500">تومان</span>
                  </div>
                  {item.price > discountedPrice && (
                    <span className="text-[10px] text-stone-400 line-through">
                      {toPersianNumbers(item.price.toLocaleString('fa-IR'))}
                    </span>
                  )}
                </div>

                <span className="text-xs text-purple-800 font-extrabold flex items-center gap-1 group-hover:underline">
                  <span>دریافت</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-700" />
                  <h4 className="font-black text-sm text-stone-900">ویرایش ویترین منشورات و کتب تخصصی (ذخیره در دیتابیس)</h4>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Showcase General Banner Upload */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {showcaseBannerUrl && (
                    <img
                      src={showcaseBannerUrl}
                      alt="کاور ویترین کتاب"
                      referrerPolicy="no-referrer"
                      className="w-14 h-12 rounded-xl object-cover border border-stone-300 shrink-0"
                    />
                  )}
                  <div>
                    <div className="text-xs font-black text-stone-800">تصویر کاور ویترین کتب (نمایشگاه جامع و باکس ساده)</div>
                    <div className="text-[10px] text-stone-500">آپلود مستقیم روی سرور</div>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                  {uploadingId === '__showcase_banner__' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>آپلود تصویر باکس</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleUploadImage('__showcase_banner__', e.target.files[0])}
                  />
                </label>
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
                  <h5 className="font-black text-xs text-stone-900">فهرست کتب و محصولات علمی:</h5>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      onChange={(e) => {
                        const selectedP = products.find(p => p.id === e.target.value);
                        if (selectedP) {
                          setCustomItems(prev => [
                            ...prev,
                            {
                              id: `book-${Date.now()}`,
                              title: selectedP.title,
                              author: selectedP.authorOrPresenter,
                              price: selectedP.price,
                              discountPercent: 15,
                              coverImage: selectedP.coverImage || DEFAULT_SHOWCASE_IMAGES.books_showcase,
                              tag: selectedP.formatTitle || 'کتاب انتشارات'
                            }
                          ]);
                        }
                        e.target.value = '';
                      }}
                      className="p-1.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-bold text-stone-800"
                    >
                      <option value="">+ انتخاب مستقیم از محصولات موجود سیستم...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.authorOrPresenter})
                        </option>
                      ))}
                    </select>

                    <button onClick={handleAddItem} className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:underline cursor-pointer">
                      <Plus className="w-4 h-4" /> افزودن دستی
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {customItems.map(item => (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">عنوان کتاب:</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => handleUpdateItem(item.id, 'title', e.target.value)}
                            className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block">پدیدآور / مولف:</label>
                          <input
                            type="text"
                            value={item.author}
                            onChange={e => handleUpdateItem(item.id, 'author', e.target.value)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block">قیمت (تومان):</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={e => handleUpdateItem(item.id, 'price', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block">تخفیف (٪):</label>
                          <input
                            type="number"
                            value={item.discountPercent}
                            onChange={e => handleUpdateItem(item.id, 'discountPercent', parseInt(e.target.value) || 0)}
                            className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
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

                      <div>
                        <label className="text-[10px] text-stone-500 block mb-1">تصویر جلد کتاب (آپلود روی سرور یا آدرس):</label>
                        <div className="flex items-center gap-2">
                          <img
                            src={item.coverImage}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-purple-200 shrink-0"
                          />
                          <input
                            type="text"
                            value={item.coverImage}
                            onChange={e => handleUpdateItem(item.id, 'coverImage', e.target.value)}
                            className="w-full p-1.5 text-[10px] font-mono bg-white rounded-lg border border-stone-300 min-w-0"
                          />
                          <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-900 text-white font-bold text-[10px] cursor-pointer shrink-0">
                            {uploadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            <span>آپلود جلد</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => e.target.files?.[0] && handleUploadImage(item.id, e.target.files[0])}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> حذف اثر
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  ذخیره دائمی تغییرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

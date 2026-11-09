import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../../types';
import { X, Truck } from 'lucide-react';

export const PRESET_PRODUCT_COVERS = [
  {
    title: 'موسوعه فقهی و حقوقی',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'کتاب قانون و آراء دادگاه',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'درس‌گفتار صوتی دیجیتال',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'نرم‌افزار جامع قضایی',
    url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  },
];

interface ProductBuilderModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSave: (payload: any, editingProductId: string | null) => void;
}

export const ProductBuilderModal: React.FC<ProductBuilderModalProps> = ({
  isOpen,
  editingProduct,
  onClose,
  onSave,
}) => {
  const productCoverInputRef = useRef<HTMLInputElement>(null);

  const [builderForm, setBuilderForm] = useState<{
    title: string;
    subtitle: string;
    authorOrPresenter: string;
    format: 'book' | 'multimedia' | 'audio_series';
    formatTitle: string;
    price: number;
    pagesOrDuration: string;
    publishedYear: string;
    publisher: string;
    isbn: string;
    hasCoverImage: boolean;
    coverImage: string;
    downloadLink: string;
    allowedPaymentMethod: 'both' | 'gateway_only' | 'receipt_only';
    shippingMode: 'postal_only' | 'pickup_only' | 'both';
    shippingCostType: 'free' | 'fixed' | 'calculated_later';
    shippingFixedFee: number;
    pickupAddressNotice: string;
    badgeText: string;
    description: string;
  }>({
    title: '',
    subtitle: '',
    authorOrPresenter: '',
    format: 'book',
    formatTitle: 'کتاب چاپی نفیس (گالینگور)',
    price: 450000,
    pagesOrDuration: '۳۵۰ صفحه',
    publishedYear: '۱۴۰۳',
    publisher: 'انتشارات مرکز نخبگان فقه و قضا',
    isbn: '۹۷۸-۶۰۰-۹۸۷۶-۵۴-۳',
    hasCoverImage: true,
    coverImage: PRESET_PRODUCT_COVERS[0].url,
    downloadLink: 'https://cdn.feqh-ghaza.ir/downloads/sample.pdf',
    allowedPaymentMethod: 'both',
    shippingMode: 'both',
    shippingCostType: 'free',
    shippingFixedFee: 50000,
    pickupAddressNotice: 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری',
    badgeText: 'چاپ جدید',
    description: 'شرح جامع و تحلیل فقهی حقوقی موضوع اثر...',
  });

  useEffect(() => {
    if (editingProduct) {
      setBuilderForm({
        title: editingProduct.title,
        subtitle: editingProduct.subtitle || '',
        authorOrPresenter: editingProduct.authorOrPresenter,
        format: editingProduct.format,
        formatTitle: editingProduct.formatTitle,
        price: editingProduct.price,
        pagesOrDuration: editingProduct.pagesOrDuration,
        publishedYear: editingProduct.publishedYear,
        publisher: editingProduct.publisher || 'انتشارات مرکز نخبگان',
        isbn: editingProduct.isbn || '۹۷۸-۶۰۰-...',
        hasCoverImage: Boolean(editingProduct.coverImage),
        coverImage: editingProduct.coverImage || PRESET_PRODUCT_COVERS[0].url,
        downloadLink: editingProduct.downloadLink || 'https://cdn.feqh-ghaza.ir/downloads/sample.pdf',
        allowedPaymentMethod: editingProduct.allowedPaymentMethod || 'both',
        shippingMode: editingProduct.shippingMode || 'both',
        shippingCostType: editingProduct.shippingCostType || 'free',
        shippingFixedFee: editingProduct.shippingFixedFee || 50000,
        pickupAddressNotice: editingProduct.pickupAddressNotice || 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری',
        badgeText: editingProduct.badgeText || '',
        description: editingProduct.description,
      });
    } else {
      setBuilderForm({
        title: '',
        subtitle: '',
        authorOrPresenter: '',
        format: 'book',
        formatTitle: 'کتاب چاپی نفیس (گالینگور)',
        price: 450000,
        pagesOrDuration: '۳۵۰ صفحه',
        publishedYear: '۱۴۰۳',
        publisher: 'انتشارات مرکز نخبگان فقه و قضا',
        isbn: '۹۷۸-۶۰۰-۹۸۷۶-۵۴-۳',
        hasCoverImage: true,
        coverImage: PRESET_PRODUCT_COVERS[0].url,
        downloadLink: 'https://cdn.feqh-ghaza.ir/downloads/sample.pdf',
        allowedPaymentMethod: 'both',
        shippingMode: 'both',
        shippingCostType: 'free',
        shippingFixedFee: 50000,
        pickupAddressNotice: 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری',
        badgeText: 'چاپ جدید',
        description: 'شرح جامع و تحلیل فقهی حقوقی موضوع اثر...',
      });
    }
  }, [editingProduct, isOpen]);

  const handleProductCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setBuilderForm(prev => ({
          ...prev,
          coverImage: event.target?.result as string,
          hasCoverImage: true,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderForm.title.trim() || !builderForm.authorOrPresenter.trim()) {
      alert('لطفاً عنوان اثر و نام مؤلف/پدیدآورنده را وارد نمایید.');
      return;
    }

    let formatTitle = builderForm.formatTitle;
    if (builderForm.format === 'book') formatTitle = 'کتاب چاپی نفیس (پست سفارشی / تحویل حضوری)';
    else if (builderForm.format === 'audio_series') formatTitle = 'درس‌گفتار صوتی دیجیتال (دانلود آنی)';
    else if (builderForm.format === 'multimedia') formatTitle = 'نرم‌افزار چندرسانه‌ای (دسترسی برخط)';

    const payload = {
      title: builderForm.title.trim(),
      subtitle: builderForm.subtitle.trim(),
      authorOrPresenter: builderForm.authorOrPresenter.trim(),
      format: builderForm.format,
      formatTitle,
      price: Number(builderForm.price),
      description: builderForm.description,
      pagesOrDuration: builderForm.pagesOrDuration,
      publishedYear: builderForm.publishedYear,
      publisher: builderForm.publisher,
      isbn: builderForm.isbn,
      coverImage: builderForm.hasCoverImage ? builderForm.coverImage : undefined,
      downloadLink: builderForm.downloadLink,
      allowedPaymentMethod: builderForm.allowedPaymentMethod,
      shippingMode: builderForm.shippingMode,
      shippingCostType: builderForm.shippingCostType,
      shippingFixedFee: Number(builderForm.shippingFixedFee),
      pickupAddressNotice: builderForm.pickupAddressNotice,
      badgeText: builderForm.badgeText || undefined,
      isAvailable: true,
    };

    onSave(payload, editingProduct ? editingProduct.id : null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                مدیریت انتشارات و محصولات (ویرایش کامل توسط مدیر)
              </span>
              <h3 className="text-base font-black text-white">
                {editingProduct ? 'ویرایش کامل مشخصات اثر' : 'انتشار کتاب یا محصول جدید'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان کامل اثر:</label>
                <input
                  type="text"
                  required
                  value={builderForm.title}
                  onChange={e => setBuilderForm({ ...builderForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام مؤلف / پدیدآورنده:</label>
                <input
                  type="text"
                  required
                  value={builderForm.authorOrPresenter}
                  onChange={e => setBuilderForm({ ...builderForm, authorOrPresenter: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">قفسه / نوع اثر:</label>
                <select
                  value={builderForm.format}
                  onChange={e => setBuilderForm({ ...builderForm, format: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="book">کتاب چاپی (ارسال پستی)</option>
                  <option value="audio_series">درس‌گفتار صوتی (دانلود دیجیتال)</option>
                  <option value="multimedia">نرم‌افزار چندرسانه‌ای (برخط)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ (تومان):</label>
                <input
                  type="number"
                  value={builderForm.price}
                  onChange={e => setBuilderForm({ ...builderForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تعداد صفحات / مدت صوت:</label>
                <input
                  type="text"
                  value={builderForm.pagesOrDuration}
                  onChange={e => setBuilderForm({ ...builderForm, pagesOrDuration: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تصویر جلد اثر (آپلود یا انتخاب):</label>
              <input ref={productCoverInputRef} type="file" accept="image/*" onChange={handleProductCoverUpload} className="hidden" />
              <div className="flex items-center gap-3">
                <img src={builderForm.coverImage} alt="Cover" className="w-16 h-16 rounded-xl object-cover border" />
                <button
                  type="button"
                  onClick={() => productCoverInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
                >
                  آپلود عکس جلد
                </button>
                <input
                  type="text"
                  value={builderForm.coverImage}
                  onChange={e => setBuilderForm({ ...builderForm, coverImage: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Shipping & Fulfillment Configuration for Books */}
            {builderForm.format === 'book' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="font-extrabold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>تنظیمات تحویل و هزینه ارسال (ویژه کتب و آثار مکتوب)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شیوه تحویل مجاز برای خریدار:
                    </label>
                    <select
                      value={builderForm.shippingMode}
                      onChange={e => setBuilderForm({ ...builderForm, shippingMode: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      <option value="both">تحویل حضوری یا ارسال پستی (حق انتخاب با مشتری)</option>
                      <option value="postal_only">منحصراً ارسال پستی پیشتاز</option>
                      <option value="pickup_only">منحصراً تحویل حضوری در محل مرکز</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      سیاست محاسبه هزینه ارسال پستی:
                    </label>
                    <select
                      value={builderForm.shippingCostType}
                      onChange={e => setBuilderForm({ ...builderForm, shippingCostType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      <option value="free">ارسال رایگان (هزینه پست به عهده مرکز)</option>
                      <option value="fixed">مبلغ ثابت برای همه سفارش‌ها (تومان)</option>
                      <option value="calculated_later">اعلام مجزا به مشتری پس از استعلام (وزن/شهر)</option>
                    </select>
                  </div>
                </div>

                {builderForm.shippingCostType === 'fixed' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      مبلغ ثابت هزینه پست پیشتاز (تومان):
                    </label>
                    <input
                      type="number"
                      value={builderForm.shippingFixedFee}
                      onChange={e => setBuilderForm({ ...builderForm, shippingFixedFee: Number(e.target.value) })}
                      placeholder="مثال: ۵۰۰۰۰"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                    />
                  </div>
                )}

                {(builderForm.shippingMode === 'both' || builderForm.shippingMode === 'pickup_only') && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      آدرس و راهنمای تحویل حضوری در مرکز:
                    </label>
                    <input
                      type="text"
                      value={builderForm.pickupAddressNotice}
                      onChange={e => setBuilderForm({ ...builderForm, pickupAddressNotice: e.target.value })}
                      placeholder="آدرس دقیق دبیرخانه و ساعات مراجعه..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شرح و معرفی مشهور اثر:</label>
              <textarea
                rows={3}
                value={builderForm.description}
                onChange={e => setBuilderForm({ ...builderForm, description: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md cursor-pointer"
              >
                {editingProduct ? 'ذخیره تغییرات اثر' : 'انتشار اثر در فروشگاه'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

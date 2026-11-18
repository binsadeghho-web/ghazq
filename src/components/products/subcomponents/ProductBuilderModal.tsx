import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Product,
  ProductDeliveryOptionsMap,
  ProductsStoreConfig,
} from '../../../types';
import { api } from '../../../services/apiClient';
import {
  PRODUCT_STUDIO_IMAGES,
  resolveProductCoverUrl,
} from '../../../data/showcaseImages';
import { X, Truck, Plus, Trash2, UploadCloud, AlertCircle } from 'lucide-react';

export const PRESET_PRODUCT_COVERS = [
  { title: 'کتاب مرجع فقه القضا', url: PRODUCT_STUDIO_IMAGES.book_jurisprudence },
  { title: 'تک‌نگاری و منشورات حقوقی', url: PRODUCT_STUDIO_IMAGES.book_monograph },
  { title: 'بسته نرم‌افزاری چندرسانه‌ای', url: PRODUCT_STUDIO_IMAGES.multimedia_software },
  { title: 'آرشیو درس‌گفتار صوتی', url: PRODUCT_STUDIO_IMAGES.audio_lectures },
];

interface ProductBuilderModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  storeConfig: ProductsStoreConfig;
  onClose: () => void;
  onSave: (payload: any, editingProductId: string | null) => Promise<void>;
}

export const ProductBuilderModal: React.FC<ProductBuilderModalProps> = ({
  isOpen,
  editingProduct,
  storeConfig,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    title: string;
    subtitle: string;
    shortDescription: string;
    subjectIndex: string;
    authorOrPresenter: string;
    format: 'book' | 'multimedia' | 'audio_series';
    supportsDigital: boolean;
    digitalPrice: number;
    digitalFormatLabel: string;
    supportsPhysical: boolean;
    physicalPrice: number;
    physicalFormatLabel: string;
    deliveryOptions: ProductDeliveryOptionsMap;
    allowedPaymentMethod: 'both' | 'gateway_only' | 'receipt_only';
    pagesOrDuration: string;
    publishedYear: string;
    publisher: string;
    isbn: string;
    coverImage: string;
    galleryImages: string[];
    downloadLink: string;
    badgeText: string;
    stock: number;
    displayOrder: number;
    visibleToCustomer: boolean;
    description: string;
  }>({
    title: '',
    subtitle: '',
    shortDescription: '',
    subjectIndex: '',
    authorOrPresenter: '',
    format: 'book',
    supportsDigital: true,
    digitalPrice: 280000,
    digitalFormatLabel: 'نسخه الکترونیک (PDF)',
    supportsPhysical: true,
    physicalPrice: 480000,
    physicalFormatLabel: 'نسخه چاپی نفیس گالینگور',
    deliveryOptions: storeConfig.defaultDeliveryOptions,
    allowedPaymentMethod: 'both',
    pagesOrDuration: '۳۵۰ صفحه',
    publishedYear: '۱۴۰۴',
    publisher: 'انتشارات مرکز فقه و حقوق اسلامی',
    isbn: '',
    coverImage: PRODUCT_STUDIO_IMAGES.book_jurisprudence,
    galleryImages: [PRODUCT_STUDIO_IMAGES.book_jurisprudence],
    downloadLink: '',
    badgeText: '',
    stock: 25,
    displayOrder: 0,
    visibleToCustomer: true,
    description: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    if (editingProduct) {
      const resolvedCover = resolveProductCoverUrl(editingProduct.coverImage, editingProduct.format);
      const rawGallery = Array.isArray(editingProduct.galleryImages)
        ? editingProduct.galleryImages.filter(u => u && !u.includes('unsplash.com'))
        : [];
      const mergedGallery = Array.from(new Set([resolvedCover, ...rawGallery]));

      setForm({
        title: editingProduct.title,
        subtitle: editingProduct.subtitle || '',
        shortDescription: editingProduct.shortDescription || '',
        subjectIndex: editingProduct.subjectIndex || '',
        authorOrPresenter: editingProduct.authorOrPresenter,
        format: editingProduct.format,
        supportsDigital: editingProduct.supportsDigital !== false,
        digitalPrice: Number(editingProduct.digitalPrice ?? editingProduct.price ?? 0),
        digitalFormatLabel:
          editingProduct.digitalFormatLabel ||
          (editingProduct.format === 'book'
            ? 'نسخه الکترونیک (PDF)'
            : editingProduct.format === 'audio_series'
            ? 'فایل صوتی دیجیتال (MP3)'
            : 'بسته دیجیتال چندرسانه‌ای'),
        supportsPhysical: Boolean(editingProduct.supportsPhysical),
        physicalPrice: Number(editingProduct.physicalPrice ?? editingProduct.price ?? 0),
        physicalFormatLabel:
          editingProduct.physicalFormatLabel ||
          (editingProduct.format === 'book'
            ? 'نسخه چاپی فیزیکی'
            : editingProduct.format === 'audio_series'
            ? 'پکیج فیزیکی فلش/لوح صوتی'
            : 'پکیج فیزیکی لوح فشرده چندرسانه‌ای'),
        deliveryOptions:
          editingProduct.deliveryOptions || JSON.parse(JSON.stringify(storeConfig.defaultDeliveryOptions)),
        allowedPaymentMethod: editingProduct.allowedPaymentMethod || 'both',
        pagesOrDuration: editingProduct.pagesOrDuration || '۳۵۰ صفحه',
        publishedYear: editingProduct.publishedYear || '۱۴۰۴',
        publisher: editingProduct.publisher || 'انتشارات مرکز فقه و حقوق اسلامی',
        isbn: editingProduct.isbn || '',
        coverImage: resolvedCover,
        galleryImages: mergedGallery,
        downloadLink: editingProduct.downloadLink || '',
        badgeText: editingProduct.badgeText || '',
        stock: Number(editingProduct.stock ?? 20),
        displayOrder: Number(editingProduct.displayOrder ?? 0),
        visibleToCustomer: editingProduct.visibleToCustomer !== false,
        description: editingProduct.description || '',
      });
    } else {
      setForm({
        title: '',
        subtitle: '',
        shortDescription: '',
        subjectIndex: 'فقه القضا · حقوق کاربردی',
        authorOrPresenter: '',
        format: 'book',
        supportsDigital: true,
        digitalPrice: 280000,
        digitalFormatLabel: 'نسخه الکترونیک (PDF)',
        supportsPhysical: true,
        physicalPrice: 480000,
        physicalFormatLabel: 'نسخه چاپی نفیس گالینگور',
        deliveryOptions: JSON.parse(JSON.stringify(storeConfig.defaultDeliveryOptions)),
        allowedPaymentMethod: 'both',
        pagesOrDuration: '۳۵۰ صفحه',
        publishedYear: '۱۴۰۴',
        publisher: 'انتشارات مرکز فقه و حقوق اسلامی',
        isbn: '',
        coverImage: PRODUCT_STUDIO_IMAGES.book_jurisprudence,
        galleryImages: [PRODUCT_STUDIO_IMAGES.book_jurisprudence],
        downloadLink: '',
        badgeText: '',
        stock: 25,
        displayOrder: 0,
        visibleToCustomer: true,
        description: '',
      });
    }
  }, [editingProduct, isOpen, storeConfig.defaultDeliveryOptions]);

  const handleUploadGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      setFormError(null);
      const uploaded = await api.uploadFile(file, 'product');
      setForm(prev => {
        const nextGallery = Array.from(new Set([...prev.galleryImages, uploaded.url]));
        return {
          ...prev,
          coverImage: prev.coverImage || uploaded.url,
          galleryImages: nextGallery,
        };
      });
    } catch (err: any) {
      setFormError(err?.message || 'خطا در بارگذاری تصویر روی سرور');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFormatChange = (nextFormat: 'book' | 'multimedia' | 'audio_series') => {
    const defaultCover =
      nextFormat === 'multimedia'
        ? PRODUCT_STUDIO_IMAGES.multimedia_software
        : nextFormat === 'audio_series'
        ? PRODUCT_STUDIO_IMAGES.audio_lectures
        : PRODUCT_STUDIO_IMAGES.book_jurisprudence;

    setForm(prev => ({
      ...prev,
      format: nextFormat,
      digitalFormatLabel:
        nextFormat === 'book'
          ? 'نسخه الکترونیک (PDF)'
          : nextFormat === 'audio_series'
          ? 'فایل صوتی دیجیتال (MP3)'
          : 'بسته دیجیتال چندرسانه‌ای (دانلودی/برخط)',
      physicalFormatLabel:
        nextFormat === 'book'
          ? 'نسخه چاپی فیزیکی'
          : nextFormat === 'audio_series'
          ? 'پکیج فیزیکی فلش/لوح صوتی'
          : 'پکیج فیزیکی لوح فشرده چندرسانه‌ای',
      coverImage: editingProduct ? prev.coverImage : defaultCover,
      galleryImages: editingProduct
        ? prev.galleryImages
        : Array.from(new Set([defaultCover, ...prev.galleryImages.filter(g => g !== prev.coverImage)])),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim() || !form.authorOrPresenter.trim() || !form.description.trim()) {
      setFormError('لطفاً عنوان، نویسنده/ارائه‌دهنده و شرح کامل اثر را تکمیل کنید.');
      return;
    }
    if (!form.supportsDigital && !form.supportsPhysical) {
      setFormError('حداقل یکی از شیوه‌های فروش (نسخه دیجیتال یا نسخه فیزیکی) باید فعال باشد.');
      return;
    }

    const formatTitle =
      form.format === 'book'
        ? 'کتاب'
        : form.format === 'multimedia'
        ? 'محصول چندرسانه‌ای'
        : 'صوت و درس‌گفتار';

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      shortDescription: form.shortDescription.trim() || form.description.trim().slice(0, 140),
      subjectIndex: form.subjectIndex.trim() || undefined,
      authorOrPresenter: form.authorOrPresenter.trim(),
      format: form.format,
      formatTitle,
      price: form.supportsPhysical ? Number(form.physicalPrice) : Number(form.digitalPrice),
      supportsDigital: form.supportsDigital,
      digitalPrice: Math.max(0, Number(form.digitalPrice || 0)),
      digitalFormatLabel: form.digitalFormatLabel.trim(),
      supportsPhysical: form.supportsPhysical,
      physicalPrice: Math.max(0, Number(form.physicalPrice || 0)),
      physicalFormatLabel: form.physicalFormatLabel.trim(),
      deliveryOptions: form.deliveryOptions,
      allowedPaymentMethod: form.allowedPaymentMethod,
      description: form.description.trim(),
      pagesOrDuration: form.pagesOrDuration.trim(),
      publishedYear: form.publishedYear.trim(),
      publisher: form.publisher.trim(),
      isbn: form.isbn.trim() || undefined,
      coverImage: form.coverImage,
      galleryImages: form.galleryImages,
      downloadLink: form.downloadLink.trim() || undefined,
      badgeText: form.badgeText.trim() || undefined,
      stock: Math.max(0, Number(form.stock || 0)),
      displayOrder: Number(form.displayOrder || 0),
      visibleToCustomer: form.visibleToCustomer,
      isAvailable: true,
    };

    try {
      setSubmitting(true);
      await onSave(payload, editingProduct ? editingProduct.id : null);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ثبت اطلاعات محصول');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[92vh]"
        >
          <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 font-bold block">
                مدیریت کامل کتاب و محصولات چند رسانه‌ای
              </span>
              <h3 className="text-base font-black text-white">
                {editingProduct ? 'ویرایش کامل کتاب / محصول' : 'انتشار کتاب، محصول چندرسانه‌ای یا صوت جدید'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Category + Core Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">دسته‌بندی محصول:</label>
                <select
                  value={form.format}
                  onChange={e => handleFormatChange(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="book">کتاب</option>
                  <option value="multimedia">محصولات چندرسانه‌ای</option>
                  <option value="audio_series">صوت و درس‌گفتار</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان اثر / محصول:</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نویسنده / پدیدآورنده / مدرس:</label>
                <input
                  type="text"
                  required
                  value={form.authorOrPresenter}
                  onChange={e => setForm(prev => ({ ...prev, authorOrPresenter: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نمایه موضوعی:</label>
                <input
                  type="text"
                  value={form.subjectIndex}
                  onChange={e => setForm(prev => ({ ...prev, subjectIndex: e.target.value }))}
                  placeholder="مثلاً: فقه القضا · دادرسی مدنی"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شابک / کد شناسه:</label>
                <input
                  type="text"
                  value={form.isbn}
                  onChange={e => setForm(prev => ({ ...prev, isbn: e.target.value }))}
                  placeholder="۹۷۸-۶۰۰-..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">حجم / صفحات / مدت:</label>
                <input
                  type="text"
                  value={form.pagesOrDuration}
                  onChange={e => setForm(prev => ({ ...prev, pagesOrDuration: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سال انتشار:</label>
                <input
                  type="text"
                  value={form.publishedYear}
                  onChange={e => setForm(prev => ({ ...prev, publishedYear: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نشان ویژه (اختیاری):</label>
                <input
                  type="text"
                  value={form.badgeText}
                  onChange={e => setForm(prev => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="چاپ جدید / منتخب"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ترتیب چینش در ویترین:</label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={e => setForm(prev => ({ ...prev, displayOrder: Number(e.target.value || 0) }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">توضیح مختصر (نمایش در کارت ویترین و فروشگاه):</label>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={e => setForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="خلاصه یک‌خطی جذاب جهت معرفی سریع اثر..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">توضیح کامل و سرفصل‌های اثر:</label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Gallery & Cover Picker */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 dark:text-white">
                  تصویر جلد و گالری عکس‌های اثر:
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadGalleryImage}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                  <span>{uploadingImage ? 'در حال آپلود...' : 'آپلود تصویر جدید'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PRESET_PRODUCT_COVERS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setForm(prev => ({
                        ...prev,
                        coverImage: preset.url,
                        galleryImages: Array.from(new Set([preset.url, ...prev.galleryImages])),
                      }))
                    }
                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-[11px] font-bold cursor-pointer ${
                      form.coverImage === preset.url
                        ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600'
                    }`}
                  >
                    <img src={preset.url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <span>{preset.title}</span>
                  </button>
                ))}
              </div>

              {form.galleryImages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.galleryImages.map((imgUrl, idx) => (
                    <div
                      key={`${imgUrl}-${idx}`}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 ${
                        form.coverImage === imgUrl ? 'border-amber-500' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt=""
                        onClick={() => setForm(prev => ({ ...prev, coverImage: imgUrl }))}
                        className="w-full h-full object-cover cursor-pointer"
                        title="انتخاب به عنوان تصویر اصلی جلد"
                      />
                      {form.galleryImages.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm(prev => {
                              const filtered = prev.galleryImages.filter((_, i) => i !== idx);
                              return {
                                ...prev,
                                galleryImages: filtered,
                                coverImage:
                                  prev.coverImage === imgUrl ? filtered[0] || '' : prev.coverImage,
                              };
                            })
                          }
                          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-md bg-black/70 text-white flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dual Selling Formats & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Digital Option */}
              <div className={`p-4 rounded-2xl border space-y-3 ${form.supportsDigital ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 opacity-75'}`}>
                <label className="flex items-center justify-between font-black text-slate-900 dark:text-white cursor-pointer">
                  <span>فروش نسخه دیجیتال (PDF / فایل دانلودی)</span>
                  <input
                    type="checkbox"
                    checked={form.supportsDigital}
                    onChange={e => setForm(prev => ({ ...prev, supportsDigital: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </label>

                {form.supportsDigital && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">قیمت نسخه دیجیتال (تومان):</label>
                      <input
                        type="number"
                        min={0}
                        value={form.digitalPrice}
                        onChange={e => setForm(prev => ({ ...prev, digitalPrice: Math.max(0, Number(e.target.value || 0)) }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono tabular-nums font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">عنوان شیوه دیجیتال:</label>
                      <input
                        type="text"
                        value={form.digitalFormatLabel}
                        onChange={e => setForm(prev => ({ ...prev, digitalFormatLabel: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">لینک فایل / راهنمای دانلود (اختیاری):</label>
                      <input
                        type="text"
                        value={form.downloadLink}
                        onChange={e => setForm(prev => ({ ...prev, downloadLink: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Physical Option */}
              <div className={`p-4 rounded-2xl border space-y-3 ${form.supportsPhysical ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-200 dark:border-slate-800 opacity-75'}`}>
                <label className="flex items-center justify-between font-black text-slate-900 dark:text-white cursor-pointer">
                  <span>فروش نسخه فیزیکی (چاپی / پکیج / لوح)</span>
                  <input
                    type="checkbox"
                    checked={form.supportsPhysical}
                    onChange={e => setForm(prev => ({ ...prev, supportsPhysical: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </label>

                {form.supportsPhysical && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">قیمت نسخه فیزیکی (تومان):</label>
                        <input
                          type="number"
                          min={0}
                          value={form.physicalPrice}
                          onChange={e => setForm(prev => ({ ...prev, physicalPrice: Math.max(0, Number(e.target.value || 0)) }))}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono tabular-nums font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">موجودی انبار:</label>
                        <input
                          type="number"
                          min={0}
                          value={form.stock}
                          onChange={e => setForm(prev => ({ ...prev, stock: Math.max(0, Number(e.target.value || 0)) }))}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono tabular-nums font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">عنوان شیوه فیزیکی:</label>
                      <input
                        type="text"
                        value={form.physicalFormatLabel}
                        onChange={e => setForm(prev => ({ ...prev, physicalFormatLabel: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Physical Delivery Options (3 methods) */}
            {form.supportsPhysical && (
              <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-300">
                  <Truck className="w-4 h-4" />
                  <span>روش‌های تحویل فیزیکی و هزینه هر گزینه برای این محصول:</span>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'complexPickup' as const, title: 'تحویل حضوری در مجتمع' },
                    { key: 'postal' as const, title: 'ارسال با پست پیشتاز' },
                    { key: 'courier' as const, title: 'ارسال با پیک اختصاصی' },
                  ].map(opt => {
                    const current = form.deliveryOptions[opt.key];
                    return (
                      <div
                        key={opt.key}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <label className="sm:col-span-4 flex items-center gap-2 font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={current.enabled}
                            onChange={e =>
                              setForm(prev => ({
                                ...prev,
                                deliveryOptions: {
                                  ...prev.deliveryOptions,
                                  [opt.key]: { ...current, enabled: e.target.checked },
                                },
                              }))
                            }
                            className="w-4 h-4 accent-amber-500 cursor-pointer"
                          />
                          <span>{opt.title}</span>
                        </label>
                        <div className="sm:col-span-3">
                          <input
                            type="number"
                            min={0}
                            value={current.fee}
                            onChange={e =>
                              setForm(prev => ({
                                ...prev,
                                deliveryOptions: {
                                  ...prev.deliveryOptions,
                                  [opt.key]: { ...current, fee: Math.max(0, Number(e.target.value || 0)) },
                                },
                              }))
                            }
                            placeholder="هزینه (تومان)"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono tabular-nums"
                          />
                        </div>
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            value={current.notice || ''}
                            onChange={e =>
                              setForm(prev => ({
                                ...prev,
                                deliveryOptions: {
                                  ...prev.deliveryOptions,
                                  [opt.key]: { ...current, notice: e.target.value },
                                },
                              }))
                            }
                            placeholder="توضیح یا آدرس..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Policy & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شیوه پرداخت مجاز برای خریدار:</label>
                <select
                  value={form.allowedPaymentMethod}
                  onChange={e => setForm(prev => ({ ...prev, allowedPaymentMethod: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="both">هر دو روش (درگاه آنلاین و بارگذاری فیش بانکی)</option>
                  <option value="gateway_only">صرفاً درگاه پرداخت آنلاین</option>
                  <option value="receipt_only">صرفاً بارگذاری تصویر فیش بانکی</option>
                </select>
              </div>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={form.visibleToCustomer}
                  onChange={e => setForm(prev => ({ ...prev, visibleToCustomer: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span>قابل نمایش برای حساب‌های مشتری (علاوه بر دانش‌آموختگان)</span>
              </label>
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
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'در حال ثبت...' : editingProduct ? 'ذخیره تغییرات اثر' : 'انتشار محصول در بخش'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

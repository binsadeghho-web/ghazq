import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Product,
  ProductCategoryConfig,
  ProductDeliveryOptionsMap,
  ProductMediaSession,
  ProductsStoreConfig,
} from '../../../types';
import { api } from '../../../services/apiClient';
import {
  PRODUCT_STUDIO_IMAGES,
  resolveProductCoverUrl,
} from '../../../data/showcaseImages';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  getAllProductCategories,
  getPresentersList,
  MEDIA_TYPE_LABELS,
} from './productUiHelpers';
import {
  X,
  Truck,
  Plus,
  Trash2,
  UploadCloud,
  AlertCircle,
  Users,
  Headphones,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const PRESET_PRODUCT_COVERS = [
  { title: 'کتاب مرجع فقه القضا', url: PRODUCT_STUDIO_IMAGES.book_jurisprudence },
  { title: 'تک‌نگاری و منشورات حقوقی', url: PRODUCT_STUDIO_IMAGES.book_monograph },
  { title: 'نشست علمی (صوتی و تصویری)', url: PRODUCT_STUDIO_IMAGES.multimedia_software },
  { title: 'آرشیو درس‌گفتار صوتی', url: PRODUCT_STUDIO_IMAGES.audio_lectures },
];

interface ProductBuilderModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  storeConfig: ProductsStoreConfig;
  onClose: () => void;
  onSave: (payload: any, editingProductId: string | null) => Promise<void>;
  onUpdateStoreConfig?: (updates: Partial<ProductsStoreConfig>) => Promise<any>;
}

export const ProductBuilderModal: React.FC<ProductBuilderModalProps> = ({
  isOpen,
  editingProduct,
  storeConfig,
  onClose,
  onSave,
  onUpdateStoreConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMediaTarget, setUploadingMediaTarget] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [addingCategoryOpen, setAddingCategoryOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategoryKind, setNewCategoryKind] = useState<ProductCategoryConfig['kind']>('custom');
  const [savingCategory, setSavingCategory] = useState(false);

  const wasOpenRef = useRef(false);

  const [form, setForm] = useState<{
    title: string;
    subtitle: string;
    shortDescription: string;
    subjectIndex: string;
    presenters: string[];
    format: string;
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
    mediaSessions: ProductMediaSession[];
    badgeText: string;
    stock: number;
    displayOrder: number;
    visibleToCustomer: boolean;
    showInShowcase: boolean;
    description: string;
  }>({
    title: '',
    subtitle: '',
    shortDescription: '',
    subjectIndex: '',
    presenters: [''],
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
    mediaSessions: [],
    badgeText: '',
    stock: 25,
    displayOrder: 0,
    visibleToCustomer: true,
    showInShowcase: true,
    description: '',
  });

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setFormError(null);
      setAddingCategoryOpen(false);
      setNewCategoryTitle('');
      if (editingProduct) {
        const resolvedCover = resolveProductCoverUrl(editingProduct.coverImage, editingProduct.format);
        const rawGallery = Array.isArray(editingProduct.galleryImages)
          ? editingProduct.galleryImages.filter(u => u && !u.includes('unsplash.com'))
          : [];
        const mergedGallery = Array.from(new Set([resolvedCover, ...rawGallery]));
        const initialPresenters = getPresentersList(editingProduct);

        setForm({
          title: editingProduct.title,
          subtitle: editingProduct.subtitle || '',
          shortDescription: editingProduct.shortDescription || '',
          subjectIndex: editingProduct.subjectIndex || '',
          presenters: initialPresenters.length > 0 ? initialPresenters : [''],
          format: editingProduct.format || 'book',
          supportsDigital: editingProduct.supportsDigital !== false,
          digitalPrice: Number(editingProduct.digitalPrice ?? editingProduct.price ?? 0),
          digitalFormatLabel:
            editingProduct.digitalFormatLabel ||
            (editingProduct.format === 'book'
              ? 'نسخه الکترونیک (PDF)'
              : editingProduct.format === 'audio_series'
              ? 'فایل صوتی / ویدئویی جلسات درس‌گفتار'
              : 'فایل صوتی و تصویری نشست'),
          supportsPhysical: Boolean(editingProduct.supportsPhysical),
          physicalPrice: Number(editingProduct.physicalPrice ?? editingProduct.price ?? 0),
          physicalFormatLabel:
            editingProduct.physicalFormatLabel ||
            (editingProduct.format === 'book'
              ? 'نسخه چاپی فیزیکی'
              : editingProduct.format === 'audio_series'
              ? 'پکیج فیزیکی لوح/فلش درس‌گفتار'
              : 'پکیج فیزیکی لوح فشرده نشست'),
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
          mediaSessions: Array.isArray(editingProduct.mediaSessions)
            ? editingProduct.mediaSessions.map(s => ({ ...s }))
            : [],
          badgeText: editingProduct.badgeText || '',
          stock: Number(editingProduct.stock ?? 20),
          displayOrder: Number(editingProduct.displayOrder ?? 0),
          visibleToCustomer: editingProduct.visibleToCustomer !== false,
          showInShowcase: editingProduct.showInShowcase !== false,
          description: editingProduct.description || '',
        });
      } else {
        setForm({
          title: '',
          subtitle: '',
          shortDescription: '',
          subjectIndex: 'فقه القضا · حقوق کاربردی',
          presenters: [''],
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
          mediaSessions: [],
          badgeText: '',
          stock: 25,
          displayOrder: 0,
          visibleToCustomer: true,
          showInShowcase: true,
          description: '',
        });
      }
    }
    wasOpenRef.current = isOpen;
  }, [editingProduct, isOpen, storeConfig.defaultDeliveryOptions]);

  const categoriesList = getAllProductCategories(storeConfig);

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

  const handleUploadProtectedMedia = async (targetKey: 'single' | string, file: File) => {
    if (!file) return;
    try {
      setUploadingMediaTarget(targetKey);
      setFormError(null);
      const uploaded = await api.uploadFile(file, 'product_media');
      const fileSizeMb = (file.size / (1024 * 1024)).toFixed(1);
      if (targetKey === 'single') {
        setForm(prev => ({ ...prev, downloadLink: uploaded.url }));
      } else {
        setForm(prev => ({
          ...prev,
          mediaSessions: prev.mediaSessions.map(s =>
            s.id === targetKey
              ? {
                  ...s,
                  downloadUrl: uploaded.url,
                  durationOrSize: s.durationOrSize || `${toPersianNumbers(fileSizeMb)} مگابایت`,
                }
              : s
          ),
        }));
      }
    } catch (err: any) {
      setFormError(err?.message || 'خطا در آپلود فایل صوتی/ویدئویی/سند روی سرور');
    } finally {
      setUploadingMediaTarget(null);
    }
  };

  const handleFormatChange = (nextFormat: string) => {
    const cat = categoriesList.find(c => c.id === nextFormat);
    const kind = cat?.kind || (nextFormat === 'multimedia' ? 'session' : nextFormat === 'audio_series' ? 'lecture' : 'book');

    const defaultCover =
      kind === 'session' || kind === 'multimedia'
        ? PRODUCT_STUDIO_IMAGES.multimedia_software
        : kind === 'lecture'
        ? PRODUCT_STUDIO_IMAGES.audio_lectures
        : PRODUCT_STUDIO_IMAGES.book_jurisprudence;

    setForm(prev => ({
      ...prev,
      format: nextFormat,
      digitalFormatLabel:
        kind === 'book'
          ? 'نسخه الکترونیک (PDF)'
          : kind === 'lecture'
          ? 'دسترسی و دانلود جلسات درس‌گفتار (صوتی/تصویری)'
          : 'فایل صوتی / تصویری نشست (دانلودی پس از ثبت‌نام)',
      physicalFormatLabel:
        kind === 'book'
          ? 'نسخه چاپی فیزیکی'
          : kind === 'lecture'
          ? 'پکیج فیزیکی فلش/لوح درس‌گفتار'
          : 'پکیج فیزیکی لوح فشرده چندرسانه‌ای',
      coverImage: editingProduct ? prev.coverImage : defaultCover,
      galleryImages: editingProduct
        ? prev.galleryImages
        : Array.from(new Set([defaultCover, ...prev.galleryImages.filter(g => g !== prev.coverImage)])),
    }));
  };

  const handleCreateCategoryInline = async () => {
    const label = newCategoryTitle.trim();
    if (!label) {
      setFormError('لطفاً نام دسته‌بندی یا عنوان ارائه جدید را وارد نمایید.');
      return;
    }
    const slugId = `cat_${Date.now().toString(36)}`;
    const nextCat: ProductCategoryConfig = {
      id: slugId,
      label,
      shortLabel: label.length > 18 ? label.slice(0, 18) : label,
      kind: newCategoryKind,
      isEnabled: true,
      isBuiltIn: false,
    };
    try {
      setSavingCategory(true);
      setFormError(null);
      if (onUpdateStoreConfig) {
        const mergedCats = [...categoriesList, nextCat];
        await onUpdateStoreConfig({
          enabledCategories: {
            ...(storeConfig.enabledCategories || {}),
            [slugId]: true,
          },
          customCategories: mergedCats,
        });
      }
      setForm(prev => ({ ...prev, format: slugId }));
      setNewCategoryTitle('');
      setAddingCategoryOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ثبت عنوان دسته‌بندی جدید');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleAddPresenter = () => {
    setForm(prev => ({ ...prev, presenters: [...prev.presenters, ''] }));
  };

  const handleChangePresenter = (idx: number, val: string) => {
    setForm(prev => ({
      ...prev,
      presenters: prev.presenters.map((p, i) => (i === idx ? val : p)),
    }));
  };

  const handleRemovePresenter = (idx: number) => {
    setForm(prev => ({
      ...prev,
      presenters: prev.presenters.length > 1 ? prev.presenters.filter((_, i) => i !== idx) : prev.presenters,
    }));
  };

  const handleAddMediaSession = () => {
    const cat = categoriesList.find(c => c.id === form.format);
    const defaultType: ProductMediaSession['mediaType'] =
      cat?.kind === 'book' || form.format === 'book' ? 'document' : 'audio';
    setForm(prev => ({
      ...prev,
      mediaSessions: [
        ...prev.mediaSessions,
        {
          id: `session_${Date.now().toString(36)}_${prev.mediaSessions.length + 1}`,
          title: `جلسه ${toPersianNumbers(prev.mediaSessions.length + 1)}`,
          mediaType: defaultType,
          downloadUrl: '',
          durationOrSize: '',
          description: '',
        },
      ],
    }));
  };

  const handleUpdateMediaSession = (id: string, field: keyof ProductMediaSession, value: string) => {
    setForm(prev => ({
      ...prev,
      mediaSessions: prev.mediaSessions.map(s => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleRemoveMediaSession = (id: string) => {
    setForm(prev => ({
      ...prev,
      mediaSessions: prev.mediaSessions.filter(s => s.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleanedPresenters = form.presenters.map(p => p.trim()).filter(Boolean);
    if (!form.title.trim() || cleanedPresenters.length === 0 || !form.description.trim()) {
      setFormError('لطفاً عنوان، حداقل یک نویسنده/ارائه‌دهنده و شرح کامل اثر را تکمیل کنید.');
      return;
    }
    if (!form.supportsDigital && !form.supportsPhysical) {
      setFormError('حداقل یکی از شیوه‌های فروش (نسخه دیجیتال یا نسخه فیزیکی) باید فعال باشد.');
      return;
    }

    const matchedCat = categoriesList.find(c => c.id === form.format);
    const formatTitle = matchedCat?.label || form.format;

    const cleanedMediaSessions = form.mediaSessions
      .map((s, idx) => ({
        ...s,
        title: s.title.trim() || `جلسه / فایل ${idx + 1}`,
        downloadUrl: s.downloadUrl.trim(),
        durationOrSize: s.durationOrSize?.trim() || undefined,
        description: s.description?.trim() || undefined,
      }))
      .filter(s => s.title || s.downloadUrl);

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      shortDescription: form.shortDescription.trim() || form.description.trim().slice(0, 140),
      subjectIndex: form.subjectIndex.trim() || undefined,
      authorOrPresenter: cleanedPresenters.join('، '),
      presenters: cleanedPresenters,
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
      mediaSessions: cleanedMediaSessions,
      badgeText: form.badgeText.trim() || undefined,
      stock: Math.max(0, Number(form.stock || 0)),
      displayOrder: Number(form.displayOrder || 0),
      visibleToCustomer: form.visibleToCustomer,
      showInShowcase: form.showInShowcase,
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[92dvh] sm:max-h-[92vh]"
        >
          <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <span className="text-[11px] text-amber-400 font-bold block truncate">
                مدیریت کامل کتب، نشست‌ها (صوتی/تصویری)، درس‌گفتارها و عناوین ارائه
              </span>
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                {editingProduct ? 'ویرایش کامل کتاب / محصول / نشست' : 'انتشار کتاب، نشست علمی، درس‌گفتار یا محصول جدید'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="product-builder-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-y-contain flex-1 min-h-0 text-xs">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Category + Core Title */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">دسته‌بندی / عنوان ارائه:</label>
                  {onUpdateStoreConfig && (
                    <button
                      type="button"
                      onClick={() => setAddingCategoryOpen(v => !v)}
                      className="text-[11px] font-black text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      {addingCategoryOpen ? 'بستن' : '+ افزودن عنوان جدید'}
                    </button>
                  )}
                </div>
                <select
                  value={form.format}
                  onChange={e => handleFormatChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-7">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">عنوان اثر / نشست / درس‌گفتار:</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
            </div>

            {addingCategoryOpen && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={e => setNewCategoryTitle(e.target.value)}
                  placeholder="نام عنوان جدید (مثلاً: کرسی‌های تخصصی / همایش فقهی)"
                  className="sm:col-span-6 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
                <select
                  value={newCategoryKind}
                  onChange={e => setNewCategoryKind(e.target.value as ProductCategoryConfig['kind'])}
                  className="sm:col-span-3 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="custom">عنوان ارائه جدید</option>
                  <option value="session">نشست صوتی/تصویری</option>
                  <option value="lecture">درس‌گفتار</option>
                  <option value="book">کتاب</option>
                </select>
                <button
                  type="button"
                  disabled={savingCategory}
                  onClick={handleCreateCategoryInline}
                  className="sm:col-span-3 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black cursor-pointer disabled:opacity-50"
                >
                  {savingCategory ? 'در حال ثبت...' : 'ثبت و انتخاب عنوان'}
                </button>
              </div>
            )}

            {/* Multiple Presenters / Authors */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>نویسندگان / اساتید / ارائه‌دهندگان نشست (پشتیبانی از چند ارائه‌دهنده):</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddPresenter}
                  className="px-3 py-1 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن ارائه‌دهنده</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {form.presenters.map((presenter, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      required={idx === 0}
                      value={presenter}
                      onChange={e => handleChangePresenter(idx, e.target.value)}
                      placeholder={`نام نویسنده / ارائه‌دهنده ${toPersianNumbers(idx + 1)}...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium"
                    />
                    {form.presenters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePresenter(idx)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                        title="حذف ارائه‌دهنده"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Multi-session Download Files (Audio / Video / Docs unlocked after registration/order confirmation) */}
            <div className="p-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Headphones className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-slate-900 dark:text-white block">
                      جلسات و فایل‌های دانلودی (صوت نشست / فیلم جلسه / جزوه PDF)
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      لینک دانلود این فایل‌ها به صورت امن در سرور محافظت می‌شود و پس از تکمیل ثبت‌نام / تایید سفارش برای خریدار نمایش داده می‌شود.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMediaSession}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن جلسه / فایل جدید</span>
                </button>
              </div>

              {form.mediaSessions.length > 0 && (
                <div className="space-y-2.5">
                  {form.mediaSessions.map((session, sIdx) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] text-slate-500 mb-0.5">
                            عنوان جلسه / فایل {toPersianNumbers(sIdx + 1)}:
                          </label>
                          <input
                            type="text"
                            value={session.title}
                            onChange={e => handleUpdateMediaSession(session.id, 'title', e.target.value)}
                            placeholder="مثلاً: صوت نشست اول — مبانی مسئولیت"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-[10px] text-slate-500 mb-0.5">نوع فایل:</label>
                          <select
                            value={session.mediaType}
                            onChange={e => handleUpdateMediaSession(session.id, 'mediaType', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                          >
                            {Object.entries(MEDIA_TYPE_LABELS).map(([k, lbl]) => (
                              <option key={k} value={k}>
                                {lbl}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-500 mb-0.5">مدت / حجم:</label>
                          <input
                            type="text"
                            value={session.durationOrSize || ''}
                            onChange={e => handleUpdateMediaSession(session.id, 'durationOrSize', e.target.value)}
                            placeholder="۴۵ دقیقه"
                            className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveMediaSession(session.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="حذف این فایل/جلسه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={session.downloadUrl}
                          onChange={e => handleUpdateMediaSession(session.id, 'downloadUrl', e.target.value)}
                          placeholder="نشانی فایل آپلودشده یا لینک مستقیم https://..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-[11px]"
                        />
                        <label className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                          {uploadingMediaTarget === session.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>آپلود صوت / ویدئو / PDF</span>
                          <input
                            type="file"
                            accept="audio/*,video/*,.mp3,.wav,.m4a,.ogg,.mp4,.webm,.pdf,.doc,.docx,.zip"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadProtectedMedia(session.id, f);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <div className={`p-4 rounded-2xl border space-y-3 ${form.supportsDigital ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 opacity-75'}`}>
                <label className="flex items-center justify-between font-black text-slate-900 dark:text-white cursor-pointer">
                  <span>فروش نسخه دیجیتال (دانلود فایل / صوت / ویدئو)</span>
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
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-0.5">لینک فایل اصلی / آرشیو (اختیاری):</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={form.downloadLink}
                          onChange={e => setForm(prev => ({ ...prev, downloadLink: e.target.value }))}
                          placeholder="https://... یا آپلود فایل"
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                        />
                        <input
                          ref={singleFileInputRef}
                          type="file"
                          accept="audio/*,video/*,.pdf,.doc,.docx,.zip"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadProtectedMedia('single', f);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={uploadingMediaTarget === 'single'}
                          onClick={() => singleFileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {uploadingMediaTarget === 'single' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>آپلود</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

            {/* Physical Delivery Options */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
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
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.visibleToCustomer}
                    onChange={e => setForm(prev => ({ ...prev, visibleToCustomer: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <span>قابل نمایش برای حساب‌های مشتری (علاوه بر دانش‌آموختگان)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showInShowcase}
                    onChange={e => setForm(prev => ({ ...prev, showInShowcase: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>نمایش پیش‌فرض در ویترین جامع خدمات (سربرگ محصولات)</span>
                </label>
              </div>
            </div>

          </form>

          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              form="product-builder-form"
              disabled={submitting}
              className="px-6 py-2.5 min-h-[42px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'در حال ثبت...' : editingProduct ? 'ذخیره تغییرات اثر' : 'انتشار محصول در بخش و ویترین'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

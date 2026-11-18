import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { resolveProductCoverUrl } from '../../../data/showcaseImages';
import {
  formatTomans,
  getEffectiveDeliveryOptions,
  PRODUCT_FORMAT_LABELS,
} from './productUiHelpers';
import { X, ZoomIn, BookOpen, ShoppingBag, Truck, FileDown } from 'lucide-react';

interface ProductIntroModalProps {
  product: Product | null;
  storeConfig: ProductsStoreConfig;
  onClose: () => void;
  onOpenPurchase: (product: Product) => void;
  onOpenLightbox: (img: { url: string; title: string; subtitle?: string }) => void;
}

export const ProductIntroModal: React.FC<ProductIntroModalProps> = ({
  product,
  storeConfig,
  onClose,
  onOpenPurchase,
  onOpenLightbox,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    setSelectedImageIdx(0);
  }, [product?.id]);

  if (!product) return null;

  const primaryCover = resolveProductCoverUrl(product.coverImage, product.format);
  const rawGallery = Array.isArray(product.galleryImages) ? product.galleryImages : [];
  const galleryList = Array.from(
    new Set([primaryCover, ...rawGallery].filter(url => url && !url.includes('unsplash.com')))
  );
  const activeImage = galleryList[selectedImageIdx] || primaryCover;
  const delivery = getEffectiveDeliveryOptions(product, storeConfig.defaultDeliveryOptions);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[11px] text-amber-400 font-bold block">
                {PRODUCT_FORMAT_LABELS[product.format]}
                {product.subjectIndex ? ` · نمایه: ${product.subjectIndex}` : ''}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white truncate">
                {product.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gallery Column */}
            <div className="lg:col-span-5 space-y-3">
              <div
                onClick={() => onOpenLightbox({ url: activeImage, title: product.title })}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-pointer group"
              >
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>بزرگنمایی تصویر</span>
                </div>
              </div>

              {galleryList.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {galleryList.map((imgUrl, idx) => (
                    <button
                      key={`${imgUrl}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        idx === selectedImageIdx
                          ? 'border-amber-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Contiguous Sales Options Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  شیوه‌های فروش فعال این اثر:
                </span>
                {product.supportsDigital !== false && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <FileDown className="w-4 h-4 text-emerald-500" />
                      <div>
                        <strong className="block text-slate-900 dark:text-white">
                          {product.digitalFormatLabel || 'نسخه دیجیتال / PDF / فایل'}
                        </strong>
                        <span className="text-[10px] text-slate-500">تحویل آنی پس از تایید</span>
                      </div>
                    </div>
                    <strong className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatTomans(product.digitalPrice ?? product.price)}
                    </strong>
                  </div>
                )}

                {product.supportsPhysical && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-500" />
                      <div>
                        <strong className="block text-slate-900 dark:text-white">
                          {product.physicalFormatLabel || 'نسخه فیزیکی'}
                        </strong>
                        <span className="text-[10px] text-slate-500">
                          موجودی: {toPersianNumbers(product.stock ?? 0)} عدد
                        </span>
                      </div>
                    </div>
                    <strong className="font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatTomans(product.physicalPrice ?? product.price)}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Specs & Description Column */}
            <div className="lg:col-span-7 space-y-4">
              {product.shortDescription && (
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  {product.shortDescription}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">نویسنده / ارائه‌دهنده:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{product.authorOrPresenter}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">نمایه موضوعی:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{product.subjectIndex || 'فقه و حقوق'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">حجم / مدت / صفحات:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{toPersianNumbers(product.pagesOrDuration)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ناشر / تولیدکننده:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{product.publisher || 'مرکز فقه و حقوق اسلامی'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">شابک / شناسه:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(product.isbn || '—')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">سال انتشار:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">{toPersianNumbers(product.publishedYear)}</span>
                </div>
              </div>

              {product.supportsPhysical && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <span className="font-black text-slate-900 dark:text-white block">
                    روش‌های تحویل نسخه فیزیکی و هزینه ارسال:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { enabled: delivery.complexPickup.enabled, title: delivery.complexPickup.label || 'تحویل در مجتمع', fee: delivery.complexPickup.fee },
                      { enabled: delivery.postal.enabled, title: delivery.postal.label || 'ارسال با پست', fee: delivery.postal.fee },
                      { enabled: delivery.courier.enabled, title: delivery.courier.label || 'ارسال با پیک', fee: delivery.courier.fee },
                    ]
                      .filter(d => d.enabled)
                      .map((d, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="font-bold block text-slate-800 dark:text-slate-200">{d.title}</span>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-black tabular-nums">
                            {d.fee === 0 ? 'رایگان' : formatTomans(d.fee)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>معرفی کامل اثر:</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              بستن
            </button>
            <button
              type="button"
              onClick={() => {
                const prod = product;
                onClose();
                onOpenPurchase(prod);
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>خرید و انتخاب شیوه دریافت</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

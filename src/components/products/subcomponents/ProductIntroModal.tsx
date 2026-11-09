import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { X, ZoomIn, BookOpen, ShoppingBag } from 'lucide-react';

interface ProductIntroModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenPurchase: (product: Product) => void;
  onOpenLightbox: (img: { url: string; title: string; subtitle?: string }) => void;
}

export const ProductIntroModal: React.FC<ProductIntroModalProps> = ({
  product,
  onClose,
  onOpenPurchase,
  onOpenLightbox,
}) => {
  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                  شناسنامه و معرفی جامع اثر انتشاراتی
                </span>
                <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">
                  {product.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {product.coverImage && (
                <div
                  onClick={() => onOpenLightbox({ url: product.coverImage!, title: product.title })}
                  className="w-full h-52 rounded-2xl overflow-hidden relative shadow-md group/img cursor-pointer"
                >
                  <img
                    src={product.coverImage}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4 text-white">
                    <span className="text-xs font-bold">مؤلف / پدیدآورنده: {product.authorOrPresenter}</span>
                    <span className="flex items-center gap-1 text-[11px] bg-black/60 text-amber-300 px-2.5 py-1 rounded-xl backdrop-blur-md">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>بزرگنمایی تصویر</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium">
                <div>
                  <span className="text-slate-400 block text-[11px]">نوع اثر:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{product.formatTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">حجم / تعداد صفحات:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{toPersianNumbers(product.pagesOrDuration)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">مبلغ سرمایه‌گذاری:</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-black">
                    {product.price > 0 ? `${toPersianNumbers(product.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ناشر / مرکز نشر:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{product.publisher || 'مرکز نخبگان فقه و قضا'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">شابک (ISBN):</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(product.isbn || '۹۷۸-۶۰۰-...')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">سال انتشار:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(product.publishedYear)}</span>
                </div>
                {product.format === 'book' && (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[11px]">شیوه تحویل:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {product.shippingMode === 'postal_only'
                          ? 'ارسال پستی پیشتاز'
                          : product.shippingMode === 'pickup_only'
                          ? 'تحویل حضوری در دبیرخانه'
                          : 'تحویل حضوری یا ارسال پستی'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[11px]">سیاست هزینه پست:</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {product.shippingCostType === 'free'
                          ? 'ارسال پستی رایگان سراسری (به عهده مرکز)'
                          : product.shippingCostType === 'fixed'
                          ? `مبلغ ثابت ${toPersianNumbers((product.shippingFixedFee || 50000).toLocaleString('fa-IR'))} تومان`
                          : 'اعلام مجزای هزینه پست پس از ثبت سفارش توسط مسئول'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <span>شرح و معرفی مشروح اثر:</span>
                </h4>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                بستن
              </button>

              {!product.isOwned && (
                <button
                  onClick={() => {
                    const prod = product;
                    onClose();
                    onOpenPurchase(prod);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>اقدام به خرید و ثبت سفارش</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

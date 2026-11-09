import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  BookOpen,
  ZoomIn,
  User,
  FileText,
  Package,
  Eye,
  Truck,
  Download,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isOfficial: boolean;
  onOpenLightbox: (img: { url: string; title: string; subtitle?: string }) => void;
  onOpenIntro: (product: Product) => void;
  onOpenPurchase: (product: Product) => void;
  onOpenEdit: (product: Product) => void;
  onOpenDelete: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isOfficial,
  onOpenLightbox,
  onOpenIntro,
  onOpenPurchase,
  onOpenEdit,
  onOpenDelete,
}) => {
  const isBook = product.format === 'book';

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-lg group transition-all"
    >
      <div>
        {/* Cover Image with Lightbox Zoom Click */}
        <div
          onClick={() => {
            if (product.coverImage) {
              onOpenLightbox({
                url: product.coverImage,
                title: product.title,
                subtitle: `مؤلف / پدیدآورنده: ${product.authorOrPresenter}`,
              });
            }
          }}
          className="relative h-48 w-full bg-slate-900 overflow-hidden cursor-pointer group/img"
          title="جهت مشاهده تصویر جلد در ابعاد کامل کلیک کنید"
        >
          {product.coverImage ? (
            <>
              <img
                src={product.coverImage}
                alt={product.title}
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                <ZoomIn className="w-6 h-6 text-amber-400 drop-shadow" />
                <span className="text-xs font-bold bg-black/60 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                  مشاهده تصویر کامل اثر
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-950 via-slate-900 to-stone-950 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-amber-500/20" />
            </div>
          )}

          {/* Format Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 pointer-events-none">
            <span
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                isBook
                  ? 'bg-amber-500/90 text-stone-950 border-amber-400'
                  : 'bg-indigo-600/90 text-white border-indigo-400'
              }`}
            >
              {isBook ? '📚 کتاب چاپی (پست سفارشی)' : '🎧 محصول دیجیتال (دانلود آنی)'}
            </span>
          </div>

          {product.badgeText && (
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500 text-stone-950 shadow">
                {product.badgeText}
              </span>
            </div>
          )}

          {/* Author Badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white pointer-events-none max-w-[85%]">
            <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold truncate">{product.authorOrPresenter}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-3.5">
          <h3
            onClick={() => onOpenIntro(product)}
            className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed min-h-[48px] cursor-pointer hover:text-amber-600 transition-colors"
            title="کلیک جهت مطالعه معرفی مشهور و سرفصل‌ها"
          >
            {product.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800 font-medium">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>{toPersianNumbers(product.pagesOrDuration)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-500" />
              <span>سال انتشار: {toPersianNumbers(product.publishedYear)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">مبلغ اثر:</span>
          <span className="text-xs font-black text-slate-900 dark:text-white">
            {product.price > 0 ? `${toPersianNumbers(product.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Intro button (معرفی اثر) */}
          <button
            onClick={() => onOpenIntro(product)}
            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>معرفی اثر</span>
          </button>

          {product.isOwned ? (
            <button
              onClick={() => {
                if (isBook) {
                  alert('کتاب چاپی شما با پست پیشتاز به آدرس ثبت‌شده در پروفایل شما در حال ارسال است.');
                } else {
                  alert(`لینک دانلود مستقیم اثر: ${product.downloadLink || 'https://cdn.feqh-ghaza.ir/download'}`);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {isBook ? <Truck className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isBook ? 'پیگیری مرسوله پستی' : 'دانلود برخط اثر'}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenPurchase(product)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>خرید و دریافت اثر</span>
            </button>
          )}

          {/* Official Management Actions */}
          {isOfficial && (
            <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-1 mr-0.5">
              <button
                onClick={() => onOpenEdit(product)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="ویرایش کامل اثر"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenDelete(product)}
                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="حذف منطقی اثر (نیازمند تایید پین پیامکی)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

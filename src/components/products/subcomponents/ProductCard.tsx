import React from 'react';
import { motion } from 'motion/react';
import { Product, ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { resolveProductCoverUrl } from '../../../data/showcaseImages';
import {
  formatPresentersText,
  formatTomans,
  getProductCategoryLabel,
  isSafeMediaUrl,
} from './productUiHelpers';
import {
  ZoomIn,
  Eye,
  EyeOff,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  ArrowUp,
  ArrowDown,
  Images,
  CheckCircle2,
  Headphones,
  Download,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  index: number;
  totalCount: number;
  isOfficial: boolean;
  storeConfig?: ProductsStoreConfig;
  onOpenLightbox: (img: { url: string; title: string; subtitle?: string }) => void;
  onOpenIntro: (product: Product) => void;
  onOpenPurchase: (product: Product) => void;
  onOpenEdit: (product: Product) => void;
  onOpenDelete: (product: Product) => void;
  onMoveOrder?: (productId: string, direction: 'up' | 'down') => void;
  onToggleShowcase?: (productId: string, showInShowcase: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index,
  totalCount,
  isOfficial,
  storeConfig,
  onOpenLightbox,
  onOpenIntro,
  onOpenPurchase,
  onOpenEdit,
  onOpenDelete,
  onMoveOrder,
  onToggleShowcase,
}) => {
  const coverUrl = resolveProductCoverUrl(product.coverImage, product.format, index);
  const galleryCount = Array.isArray(product.galleryImages) ? product.galleryImages.length : 0;
  const hasDigital = product.supportsDigital !== false;
  const hasPhysical = Boolean(product.supportsPhysical);
  const digitalPrice = Number(product.digitalPrice ?? product.price ?? 0);
  const physicalPrice = Number(product.physicalPrice ?? product.price ?? 0);
  const presentersText = formatPresentersText(product);
  const sessionsCount = Array.isArray(product.mediaSessions) ? product.mediaSessions.length : 0;
  const hasUnlockedFiles = Boolean(
    product.isOwned &&
      (isSafeMediaUrl(product.downloadLink) ||
        (product.mediaSessions || []).some(m => isSafeMediaUrl(m.downloadUrl)))
  );
  const isShownInShowcase = product.showInShowcase !== false;

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
    >
      <div>
        {/* 4:3 Editorial Cover */}
        <div
          onClick={() =>
            onOpenLightbox({
              url: coverUrl,
              title: product.title,
              subtitle: `ارائه‌دهنده / پدیدآورنده: ${presentersText}`,
            })
          }
          className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer group/img"
        >
          <img
            src={coverUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover/img:scale-[1.03] transition-transform duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

          <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between gap-2 text-white pointer-events-none">
            <span className="text-[11px] font-bold truncate">
              {presentersText}
            </span>
            <div className="flex items-center gap-2 shrink-0 text-[11px]">
              {galleryCount > 1 && (
                <span className="flex items-center gap-1 bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-lg tabular-nums">
                  <Images className="w-3 h-3" />
                  {toPersianNumbers(galleryCount)}
                </span>
              )}
              <span className="bg-black/55 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center gap-1 opacity-85 group-hover/img:opacity-100">
                <ZoomIn className="w-3 h-3 text-amber-300" />
              </span>
            </div>
          </div>

          {product.badgeText && (
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-500 text-stone-950 shadow-xs">
                {product.badgeText}
              </span>
            </div>
          )}

          {product.isOwned && (
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
                <span>در کتابخانه شما</span>
              </span>
            </div>
          )}
        </div>

        {/* Clean Metadata & Body */}
        <div className="p-5 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
            <span className="text-amber-700 dark:text-amber-400">
              {getProductCategoryLabel(product.format, product.formatTitle, storeConfig)}
            </span>
            {product.subjectIndex && (
              <>
                <span>·</span>
                <span className="truncate">{product.subjectIndex}</span>
              </>
            )}
            <span>·</span>
            <span className="tabular-nums">{toPersianNumbers(product.publishedYear)}</span>
            {sessionsCount > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 tabular-nums">
                  <Headphones className="w-3 h-3" />
                  {toPersianNumbers(sessionsCount)} فایل / جلسه
                </span>
              </>
            )}
          </div>

          <h3
            onClick={() => onOpenIntro(product)}
            className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            {product.title}
          </h3>

          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          {hasUnlockedFiles && (
            <button
              type="button"
              onClick={() => onOpenIntro(product)}
              className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-500/15"
            >
              <Download className="w-3.5 h-3.5" />
              <span>لینک دانلود فایل‌ها / جلسات فعال است</span>
            </button>
          )}

          {/* Dual Format Price Grid */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            {hasDigital && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">نسخه دیجیتال (صوت / PDF)</span>
                <strong className="text-slate-900 dark:text-white font-black tabular-nums block mt-0.5">
                  {formatTomans(digitalPrice)}
                </strong>
              </div>
            )}
            {hasPhysical && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 block">نسخه فیزیکی (پست / حضوری)</span>
                <strong className="text-slate-900 dark:text-white font-black tabular-nums block mt-0.5">
                  {formatTomans(physicalPrice)}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenIntro(product)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>{hasUnlockedFiles ? 'دریافت فایل‌ها' : 'معرفی و جلسات'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPurchase(product)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{product.isOwned ? 'سفارش نسخه دیگر' : 'خرید و ثبت‌نام'}</span>
          </button>
        </div>

        {isOfficial && (
          <div className="flex items-center gap-0.5">
            {onToggleShowcase && (
              <button
                type="button"
                onClick={() => onToggleShowcase(product.id, !isShownInShowcase)}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  isShownInShowcase
                    ? 'text-emerald-600 hover:bg-emerald-500/10'
                    : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
                title={isShownInShowcase ? 'فعال در ویترین جامع (کلیک برای مخفی‌سازی)' : 'مخفی از ویترین جامع (کلیک برای فعال‌سازی)'}
              >
                {isShownInShowcase ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}
            {onMoveOrder && (
              <>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onMoveOrder(product.id, 'up')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  title="انتقال به جلو"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index >= totalCount - 1}
                  onClick={() => onMoveOrder(product.id, 'down')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  title="انتقال به عقب"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onOpenEdit(product)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              title="ویرایش اثر"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenDelete(product)}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
              title="حذف نرم اثر"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
};

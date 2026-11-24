import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductMediaSession, ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { resolveProductCoverUrl } from '../../../data/showcaseImages';
import {
  MEDIA_TYPE_LABELS,
  formatPresentersText,
  formatTomans,
  getEffectiveDeliveryOptions,
  getProductCategoryLabel,
  isSafeMediaUrl,
  resolvePlayableMediaUrl,
  triggerSafeMediaDownload,
} from './productUiHelpers';
import {
  X,
  ZoomIn,
  BookOpen,
  ShoppingBag,
  Truck,
  FileDown,
  Headphones,
  Download,
  Lock,
  Play,
  Square,
  AlertCircle,
  Loader2,
  Video,
  FileText,
} from 'lucide-react';

interface ProductIntroModalProps {
  product: Product | null;
  storeConfig: ProductsStoreConfig;
  isOfficial?: boolean;
  onClose: () => void;
  onOpenPurchase: (product: Product) => void;
  onOpenLightbox: (img: { url: string; title: string; subtitle?: string }) => void;
}

export const ProductIntroModal: React.FC<ProductIntroModalProps> = ({
  product,
  storeConfig,
  isOfficial = false,
  onClose,
  onOpenPurchase,
  onOpenLightbox,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState<{
    id: string;
    title: string;
    mediaType: 'audio' | 'video';
    src: string;
  } | null>(null);
  const revokePlayerRef = useRef<(() => void) | undefined>(undefined);

  const cleanupPlayer = () => {
    if (revokePlayerRef.current) {
      try {
        revokePlayerRef.current();
      } catch {}
      revokePlayerRef.current = undefined;
    }
    setActivePlayer(null);
  };

  useEffect(() => {
    setSelectedImageIdx(0);
    setMediaError(null);
    cleanupPlayer();
    return () => cleanupPlayer();
  }, [product?.id]);

  if (!product) return null;

  const primaryCover = resolveProductCoverUrl(product.coverImage, product.format);
  const rawGallery = Array.isArray(product.galleryImages) ? product.galleryImages : [];
  const galleryList = Array.from(
    new Set([primaryCover, ...rawGallery].filter(url => url && !url.includes('unsplash.com')))
  );
  const activeImage = galleryList[selectedImageIdx] || primaryCover;
  const delivery = getEffectiveDeliveryOptions(product, storeConfig.defaultDeliveryOptions);

  const canAccessDownloads = Boolean(product.isOwned || isOfficial);
  const sessions: ProductMediaSession[] = Array.isArray(product.mediaSessions)
    ? product.mediaSessions
    : [];
  const hasAnyMediaSection =
    sessions.length > 0 || isSafeMediaUrl(product.downloadLink) || Boolean(product.hasLockedMedia);

  const handleDownload = async (key: string, url: string, fileName?: string) => {
    try {
      setDownloadingKey(key);
      setMediaError(null);
      await triggerSafeMediaDownload(url, fileName);
    } catch (err: any) {
      setMediaError(err?.message || 'امکان دریافت فایل وجود ندارد.');
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleTogglePlay = async (
    id: string,
    title: string,
    url: string,
    mediaType: 'audio' | 'video'
  ) => {
    if (activePlayer?.id === id) {
      cleanupPlayer();
      return;
    }
    try {
      setDownloadingKey(`play_${id}`);
      setMediaError(null);
      cleanupPlayer();
      const resolved = await resolvePlayableMediaUrl(url);
      revokePlayerRef.current = resolved.revoke;
      setActivePlayer({ id, title, mediaType, src: resolved.src });
    } catch (err: any) {
      setMediaError(err?.message || 'امکان پخش مستقیم رسانه وجود ندارد؛ از دکمه دانلود استفاده کنید.');
    } finally {
      setDownloadingKey(null);
    }
  };

  const getMediaIcon = (type: ProductMediaSession['mediaType']) => {
    if (type === 'video') return <Video className="w-4 h-4 text-indigo-500 shrink-0" />;
    if (type === 'document') return <FileText className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Headphones className="w-4 h-4 text-emerald-500 shrink-0" />;
  };

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
          className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        >
          <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] text-amber-400 font-bold block truncate">
                {getProductCategoryLabel(product.format, product.formatTitle, storeConfig)}
                {product.subjectIndex ? ` · نمایه: ${product.subjectIndex}` : ''}
              </span>
              <h3 className="text-sm sm:text-lg font-black text-white truncate">
                {product.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
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

              {/* Sales Options Preview */}
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
                          {product.digitalFormatLabel || 'نسخه دیجیتال (صوت / فیلم / PDF)'}
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

            {/* Specs, Media Sessions & Description Column */}
            <div className="lg:col-span-7 space-y-4">
              {product.shortDescription && (
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  {product.shortDescription}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block text-[11px]">نویسندگان / اساتید / ارائه‌دهندگان:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {formatPresentersText(product)}
                  </strong>
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
                  <span className="text-slate-400 block text-[11px]">سال انتشار:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">{toPersianNumbers(product.publishedYear)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ناشر / تولیدکننده:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{product.publisher || 'مرکز فقه و حقوق اسلامی'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">شابک / شناسه:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(product.isbn || '—')}</span>
                </div>
              </div>

              {/* Media Sessions & Downloads Section */}
              {hasAnyMediaSection && (
                <div className="p-4 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                      <Headphones className="w-4 h-4 text-indigo-500" />
                      <span>فایل‌ها و جلسات صوتی / تصویری / جزوه</span>
                    </div>
                    {canAccessDownloads ? (
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                        دسترسی و لینک دانلود فعال است
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>فعال‌سازی پس از ثبت‌نام / خرید</span>
                      </span>
                    )}
                  </div>

                  {mediaError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{mediaError}</span>
                    </div>
                  )}

                  {activePlayer && (
                    <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="truncate">{activePlayer.title}</span>
                        <button
                          type="button"
                          onClick={cleanupPlayer}
                          className="text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Square className="w-3 h-3" />
                          <span>بستن پخش‌کننده</span>
                        </button>
                      </div>
                      {activePlayer.mediaType === 'video' ? (
                        <video src={activePlayer.src} controls autoPlay className="w-full rounded-lg max-h-60 bg-black" />
                      ) : (
                        <audio src={activePlayer.src} controls autoPlay className="w-full" />
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {isSafeMediaUrl(product.downloadLink) && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileDown className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            فایل اصلی محصول ({product.title})
                          </span>
                        </div>
                        {canAccessDownloads ? (
                          <button
                            type="button"
                            disabled={downloadingKey === '__main__'}
                            onClick={() => handleDownload('__main__', product.downloadLink!, product.title)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            {downloadingKey === '__main__' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>دانلود فایل</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3" /> قفل تا تکمیل ثبت‌نام
                          </span>
                        )}
                      </div>
                    )}

                    {sessions.map((session, sIdx) => {
                      const safeUrl = isSafeMediaUrl(session.downloadUrl);
                      const isPlayable = session.mediaType === 'audio' || session.mediaType === 'video';
                      return (
                        <div
                          key={session.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {getMediaIcon(session.mediaType)}
                            <div className="min-w-0">
                              <strong className="block text-slate-900 dark:text-white truncate">
                                {toPersianNumbers(sIdx + 1)}. {session.title}
                              </strong>
                              <span className="text-[10px] text-slate-500">
                                {MEDIA_TYPE_LABELS[session.mediaType]}
                                {session.durationOrSize ? ` · ${toPersianNumbers(session.durationOrSize)}` : ''}
                              </span>
                            </div>
                          </div>

                          {canAccessDownloads && safeUrl ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isPlayable && (
                                <button
                                  type="button"
                                  disabled={downloadingKey === `play_${session.id}`}
                                  onClick={() =>
                                    handleTogglePlay(
                                      session.id,
                                      session.title,
                                      session.downloadUrl,
                                      session.mediaType === 'video' ? 'video' : 'audio'
                                    )
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  {downloadingKey === `play_${session.id}` ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : activePlayer?.id === session.id ? (
                                    <Square className="w-3 h-3" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                  <span>{activePlayer?.id === session.id ? 'توقف' : 'پخش'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={downloadingKey === session.id}
                                onClick={() => handleDownload(session.id, session.downloadUrl, session.title)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {downloadingKey === session.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                <span>دانلود</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
                              <Lock className="w-3 h-3" />
                              <span>{canAccessDownloads ? 'بدون فایل متصل' : 'لینک پس از ثبت‌نام'}</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!canAccessDownloads && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      جهت دریافت لینک دانلود صوت و ویدئوی جلسات، روی دکمه «ثبت‌نام / خرید و دریافت» کلیک کرده و سفارش خود را نهایی نمایید.
                    </p>
                  )}
                </div>
              )}

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

          <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-50/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
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
              className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{product.isOwned ? 'سفارش نسخه دیگر' : 'ثبت‌نام / خرید و دریافت'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Loader2 } from 'lucide-react';
import { CrextioDashboardConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';
import { resolveShowcaseImageUrl } from '../../../data/showcaseImages';

interface CustomizerResearchTabProps {
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess: () => void;
  handleToggle: (key: keyof CrextioDashboardConfig) => void;
}

const DEFAULT_RESEARCH_CARDS = [
  { id: 'card_grant', title: 'تخصیص گرنت مالی بلاعوض', desc: 'کمک‌هزینه ویژه تأمین منابع، خرید کتب مرجع فقهی و مصاحبه با صاحب‌نظران تا سقف ۵۰ میلیون تومان.', tag: 'بلاعوض نخبگان', icon: 'coins', clickAction: 'quick_modal' as const },
  { id: 'card_supervisor', title: 'استاد راهنمای اختصاصی طراز اول', desc: 'همراهی گام‌به‌گام مراجع فقهی، قضات عالی‌رتبه دیوان عالی و اساتید دکتری در ویراستاری فصول.', tag: 'استاد معین', icon: 'graduation', clickAction: 'navigate_research' as const },
  { id: 'card_accommodation', title: 'اسکان پژوهشی رایگان مشهد و قم', desc: 'اقامت اختصاصی برای پژوهشگر و خانواده در جوار کتابخانه‌های مرجع فیضیه، آستان قدس و دانشگاه.', tag: 'اقامت تا ۱۰ روز', icon: 'home', clickAction: 'quick_modal' as const },
  { id: 'card_publish', title: 'چاپ سراسری کتاب و موسوعه', desc: 'تبدیل رساله برگزیده به اثر فاخر کتابخانه‌ای با نشان مرکز و پخش در مجتمع‌های قضایی کشور.', tag: 'انتشار رسمی', icon: 'book', clickAction: 'navigate_research' as const },
];

export const CustomizerResearchTab: React.FC<CustomizerResearchTabProps> = ({
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
  handleToggle,
}) => {
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgFileRef = useRef<HTMLInputElement>(null);

  const cards =
    crextioConfig.researchPromoCards && crextioConfig.researchPromoCards.length > 0
      ? crextioConfig.researchPromoCards
      : DEFAULT_RESEARCH_CARDS;

  const updateResearchCard = (
    id: string,
    patch: Partial<{
      title: string;
      desc: string;
      tag: string;
      icon: string;
      clickAction: 'quick_modal' | 'navigate_research' | 'external_link' | 'none';
      actionUrl: string;
    }>
  ) => {
    const nextCards = cards.map(item => (item.id === id ? { ...item, ...patch } : item));
    updateCrextioConfig({ researchPromoCards: nextCards });
    triggerSuccess();
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        updateCrextioConfig({
          researchPromoBgImage: res.url,
          showcaseImageOverrides: {
            ...(crextioConfig.showcaseImageOverrides || {}),
            research_promo: res.url,
          },
        });
        triggerSuccess();
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingBg(false);
      if (bgFileRef.current) bgFileRef.current.value = '';
    }
  };

  const currentBgPreview =
    crextioConfig.researchPromoBgImage ||
    resolveShowcaseImageUrl('research_promo', crextioConfig.showcaseImageOverrides);

  return (
    <div className="space-y-5">
      <input
        ref={bgFileRef}
        type="file"
        accept="image/*"
        onChange={handleUploadBg}
        className="hidden"
      />

      <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-emerald-800" />
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-emerald-950">
                تنظیمات و محتوای ۱۰۰٪ ویترین ترغیبی راهبری پژوهش و رساله‌ها
              </h4>
              <p className="text-[11px] text-emerald-800/80 mt-0.5">
                رویکرد ترغیبی، ویرایش متن‌ها، تصویر پس‌زمینه (با آپلود روی سرور)، کارت‌های ۴گانه و کلیک‌ها
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggle('showResearchPromoShowcase')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              crextioConfig.showResearchPromoShowcase !== false
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-300 text-stone-700'
            }`}
          >
            {crextioConfig.showResearchPromoShowcase !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
          </button>
        </div>

        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                نشان ترغیبی بالا (Badge):
              </label>
              <input
                type="text"
                value={crextioConfig.researchPromoBadge || ''}
                onChange={e => {
                  updateCrextioConfig({ researchPromoBadge: e.target.value });
                  triggerSuccess();
                }}
                placeholder="حمایت مادی و معنوی ویژه نخبگان"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                میزان گرنت و مشوق پژوهشی (Highlight):
              </label>
              <input
                type="text"
                value={crextioConfig.researchPromoGrantAmount || ''}
                onChange={e => {
                  updateCrextioConfig({ researchPromoGrantAmount: e.target.value });
                  triggerSuccess();
                }}
                placeholder="تا ۵۰ میلیون تومان گرنت پژوهشی + اسکان مشهد و قم"
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Background Image Preview + Server Upload */}
          <div>
            <label className="font-bold text-stone-700 block mb-1 text-xs">
              تصویر پس‌زمینه ویترین پژوهش (آپلود از دستگاه یا آدرس):
            </label>
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {currentBgPreview && (
                <img
                  src={currentBgPreview}
                  alt="پس‌زمینه پژوهش"
                  referrerPolicy="no-referrer"
                  className="w-16 h-11 rounded-xl object-cover border border-emerald-300 shrink-0"
                />
              )}
              <input
                type="text"
                value={crextioConfig.researchPromoBgImage || ''}
                onChange={e => {
                  updateCrextioConfig({ researchPromoBgImage: e.target.value });
                  triggerSuccess();
                }}
                placeholder="آدرس تصویر یا آپلود از سیستم..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <button
                type="button"
                disabled={uploadingBg}
                onClick={() => bgFileRef.current?.click()}
                className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {uploadingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>آپلود تصویر</span>
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1 text-xs">
              عنوان هیجان‌انگیز و ترغیبی ویترین:
            </label>
            <input
              type="text"
              value={crextioConfig.researchPromoTitle || ''}
              onChange={e => {
                updateCrextioConfig({ researchPromoTitle: e.target.value });
                triggerSuccess();
              }}
              placeholder="باشگاه نخبگانی راهبری رساله‌ها، پایان‌نامه‌ها و پژوهش‌های تحول قضایی"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1 text-xs">
              توضیحات اغواکننده و تشویقی برای ثبت پژوهش:
            </label>
            <textarea
              rows={2}
              value={crextioConfig.researchPromoSubtitle || ''}
              onChange={e => {
                updateCrextioConfig({ researchPromoSubtitle: e.target.value });
                triggerSuccess();
              }}
              placeholder="تطبیق با اساتید برجسته خارج فقه و دکتری، تخصیص گرنت پژوهشی، چاپ کتاب و دفاع مقتدرانه"
              className="w-full p-3 rounded-2xl bg-white border border-stone-200 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
            />
          </div>

          {/* تنظیمات دکمه‌های اقدام و کلیک‌ها */}
          <div className="pt-3 border-t border-emerald-200/80 space-y-3">
            <h5 className="font-black text-xs text-emerald-950">
              تنظیمات دکمه‌های اکشن و کلیک‌های ویترین پژوهش:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2">
                <label className="font-bold text-stone-800 block text-xs">متن دکمه اصلی:</label>
                <input
                  type="text"
                  value={crextioConfig.researchPromoPrimaryBtnText || 'ثبت فوری پروپوزال و دریافت اسکان'}
                  onChange={e => updateCrextioConfig({ researchPromoPrimaryBtnText: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                />
                <label className="font-bold text-stone-600 block text-[11px]">عملکرد کلیک (Action):</label>
                <select
                  value={crextioConfig.researchPromoPrimaryAction || 'quick_modal'}
                  onChange={e => updateCrextioConfig({ researchPromoPrimaryAction: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800"
                >
                  <option value="quick_modal">باز شدن مودال ثبت فوری طرح و اسکان</option>
                  <option value="navigate_research">انتقال مستقیم به تب میز کار پژوهش</option>
                  <option value="external_link">انتقال به آدرس اینترنتی بیرونی</option>
                </select>
                {crextioConfig.researchPromoPrimaryAction === 'external_link' && (
                  <input
                    type="text"
                    value={crextioConfig.researchPromoPrimaryActionUrl || ''}
                    onChange={e => updateCrextioConfig({ researchPromoPrimaryActionUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-mono text-stone-900"
                  />
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2">
                <label className="font-bold text-stone-800 block text-xs">متن دکمه دوم:</label>
                <input
                  type="text"
                  value={crextioConfig.researchPromoSecondaryBtnText || 'میز کار راهبری پژوهش'}
                  onChange={e => updateCrextioConfig({ researchPromoSecondaryBtnText: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                />
                <label className="font-bold text-stone-600 block text-[11px]">عملکرد کلیک (Action):</label>
                <select
                  value={crextioConfig.researchPromoSecondaryAction || 'navigate_research'}
                  onChange={e => updateCrextioConfig({ researchPromoSecondaryAction: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800"
                >
                  <option value="navigate_research">انتقال مستقیم به تب میز کار پژوهش</option>
                  <option value="quick_modal">باز شدن مودال ثبت فوری طرح و اسکان</option>
                  <option value="external_link">انتقال به آدرس اینترنتی بیرونی</option>
                </select>
                {crextioConfig.researchPromoSecondaryAction === 'external_link' && (
                  <input
                    type="text"
                    value={crextioConfig.researchPromoSecondaryActionUrl || ''}
                    onChange={e => updateCrextioConfig({ researchPromoSecondaryActionUrl: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-mono text-stone-900"
                  />
                )}
              </div>
            </div>
          </div>

          {/* ویرایش ۱۰۰ درصدی کارت‌های ۴‌گانه ویترین پژوهش */}
          <div className="pt-3 border-t border-emerald-200/80 space-y-3">
            <h5 className="font-black text-xs text-emerald-950">
              ویرایش عناوین، آیکون، توضیحات، نشان و کلیک‌های کارت‌های ویترین پژوهش:
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cards.map((c: any, cIdx: number) => (
                <div key={c.id} className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold">
                    <span>کارت شماره {toPersianNumbers(cIdx + 1)}</span>
                    <span className="text-emerald-700">شناسه: {c.id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-600 font-bold block mb-0.5">عنوان کارت:</label>
                      <input
                        type="text"
                        value={c.title}
                        onChange={e => updateResearchCard(c.id, { title: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-600 font-bold block mb-0.5">آیکون کارت:</label>
                      <select
                        value={c.icon || 'sparkles'}
                        onChange={e => updateResearchCard(c.id, { icon: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-800"
                      >
                        <option value="coins">سکه / گرنت (Coins)</option>
                        <option value="graduation">کلاه فارغ‌التحصیلی / استاد (Graduation)</option>
                        <option value="home">خانه / اسکان (Home)</option>
                        <option value="book">کتاب / انتشار (Book)</option>
                        <option value="award">مدال / نخبگان (Award)</option>
                        <option value="sparkles">درخشش (Sparkles)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">برچسب کوچک (Tag):</label>
                    <input
                      type="text"
                      value={c.tag}
                      onChange={e => updateResearchCard(c.id, { tag: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-amber-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">شرح و توضیح کارت:</label>
                    <textarea
                      rows={2}
                      value={c.desc}
                      onChange={e => updateResearchCard(c.id, { desc: e.target.value })}
                      className="w-full p-2 rounded-xl border border-stone-200 text-xs text-stone-700"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-stone-600 font-bold block mb-0.5">عملکرد کلیک روی کارت:</label>
                    <select
                      value={c.clickAction || 'quick_modal'}
                      onChange={e => updateResearchCard(c.id, { clickAction: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800"
                    >
                      <option value="quick_modal">باز شدن مودال ثبت فوری پروپوزال</option>
                      <option value="navigate_research">انتقال به میز کار پژوهش</option>
                      <option value="external_link">لینک بیرونی</option>
                      <option value="none">بدون کلیک (فقط نمایشی)</option>
                    </select>

                    {c.clickAction === 'external_link' && (
                      <input
                        type="text"
                        value={c.actionUrl || ''}
                        onChange={e => updateResearchCard(c.id, { actionUrl: e.target.value })}
                        placeholder="https://example.com"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-mono text-stone-900 mt-1"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

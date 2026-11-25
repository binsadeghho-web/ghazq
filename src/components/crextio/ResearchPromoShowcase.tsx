import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import {
  Compass,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Award,
  BookOpen,
  Home,
  CheckCircle2,
  Gift,
  Coins,
  Send,
  X,
  ShieldCheck,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';

interface ResearchPromoShowcaseProps {
  onNavigateToResearch?: () => void;
}

export const ResearchPromoShowcase: React.FC<ResearchPromoShowcaseProps> = ({
  onNavigateToResearch
}) => {
  const { crextioConfig, currentUser, submitResearchProject } = useApp();
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [thesisTitle, setThesisTitle] = useState('');
  const [field, setField] = useState('فقه و حقوق جزا و جرم‌شناسی');
  const [accommodation, setAccommodation] = useState(false);
  const [city, setCity] = useState<'قم' | 'تهران' | 'مشهد'>('قم');
  const [successMsg, setSuccessMsg] = useState(false);

  // Font sizes from config
  const titleFontSize = crextioConfig.fontSizes?.researchTitle || 'text-2xl';
  const bodyFontSize = crextioConfig.fontSizes?.researchBody || 'text-xs';

  // Configurable cards list
  const cardsList = crextioConfig.researchPromoCards && crextioConfig.researchPromoCards.length > 0
    ? crextioConfig.researchPromoCards
    : [
        {
          id: 'card_grant',
          title: 'تخصیص گرنت مالی بلاعوض',
          desc: 'کمک‌هزینه ویژه تأمین منابع، خرید کتب مرجع فقهی و مصاحبه با صاحب‌نظران تا سقف ۵۰ میلیون تومان.',
          tag: 'بلاعوض نخبگان',
          icon: 'coins',
          clickAction: 'quick_modal' as const
        },
        {
          id: 'card_supervisor',
          title: 'استاد راهنمای اختصاصی طراز اول',
          desc: 'همراهی گام‌به‌گام مراجع فقهی، قضات عالی‌رتبه دیوان عالی و اساتید دکتری در ویراستاری فصول.',
          tag: 'استاد معین',
          icon: 'graduation',
          clickAction: 'navigate_research' as const
        },
        {
          id: 'card_accommodation',
          title: 'اسکان پژوهشی رایگان مشهد و قم',
          desc: 'اقامت اختصاصی برای پژوهشگر و خانواده در جوار کتابخانه‌های مرجع فیضیه، آستان قدس و دانشگاه.',
          tag: 'اقامت تا ۱۰ روز',
          icon: 'home',
          clickAction: 'quick_modal' as const
        },
        {
          id: 'card_publish',
          title: 'چاپ سراسری کتاب و موسوعه',
          desc: 'تبدیل رساله برگزیده به اثر فاخر کتابخانه‌ای با نشان مرکز و پخش در مجتمع‌های قضایی کشور.',
          tag: 'انتشار رسمی',
          icon: 'book',
          clickAction: 'navigate_research' as const
        }
      ];

  const getCardIcon = (iconName?: string) => {
    switch (iconName) {
      case 'coins': return Coins;
      case 'graduation': return GraduationCap;
      case 'home': return Home;
      case 'book': return BookOpen;
      case 'award': return Award;
      default: return Sparkles;
    }
  };

  const handleCardClick = (clickAction?: string, actionUrl?: string) => {
    if (clickAction === 'quick_modal') {
      setQuickModalOpen(true);
    } else if (clickAction === 'navigate_research' && onNavigateToResearch) {
      onNavigateToResearch();
    } else if (clickAction === 'external_link' && actionUrl) {
      window.open(actionUrl, '_blank');
    }
  };

  const handlePrimaryBtnClick = () => {
    const action = crextioConfig.researchPromoPrimaryAction || 'quick_modal';
    if (action === 'quick_modal') {
      setQuickModalOpen(true);
    } else if (action === 'navigate_research' && onNavigateToResearch) {
      onNavigateToResearch();
    } else if (action === 'external_link' && crextioConfig.researchPromoPrimaryActionUrl) {
      window.open(crextioConfig.researchPromoPrimaryActionUrl, '_blank');
    }
  };

  const handleSecondaryBtnClick = () => {
    const action = crextioConfig.researchPromoSecondaryAction || 'navigate_research';
    if (action === 'quick_modal') {
      setQuickModalOpen(true);
    } else if (action === 'navigate_research' && onNavigateToResearch) {
      onNavigateToResearch();
    } else if (action === 'external_link' && crextioConfig.researchPromoSecondaryActionUrl) {
      window.open(crextioConfig.researchPromoSecondaryActionUrl, '_blank');
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !thesisTitle.trim()) return;

    submitResearchProject({
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      thesisTitle: thesisTitle.trim(),
      field,
      stage: 'proposal',
      stageTitle: 'تصویب عنوان و نگارش پروپوزال اولیه',
      accommodationRequested: accommodation,
      ...(accommodation && { accommodationCity: city }),
    });

    setThesisTitle('');
    setAccommodation(false);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setQuickModalOpen(false);
    }, 2500);
  };

  return (
    <div className="w-full space-y-4">
      {/* Master Promo Showcase Card */}
      <div className="relative rounded-2xl sm:rounded-[30px] overflow-hidden border border-[#F3D078]/30 bg-gradient-to-br from-[#071E17] via-[#0B2D22] to-[#113C2E] text-white shadow-[0_22px_50px_-24px_rgba(7,30,23,0.45)]">
        {/* Background Atmosphere Image with Scrim (Configurable Background) */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-28">
          <img
            src={
              crextioConfig.researchPromoBgImage ||
              resolveShowcaseImageUrl('research_promo', crextioConfig.showcaseImageOverrides)
            }
            alt="باشگاه نخبگانی راهبری رساله‌ها و اساتید فقه و حقوق"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071E17] via-[#071E17]/82 to-transparent" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-400/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#F3D078]/12 rounded-full blur-3xl pointer-events-none" />

        {/* Content Structure */}
        <div className="relative z-10 p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Top Banner & Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="w-8 h-8 rounded-xl bg-[#F3D078]/15 text-[#F3D078] border border-[#F3D078]/35 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 stroke-[2.2]" />
                </span>
                <span className="font-black text-[#F3D078]">
                  {crextioConfig.researchPromoBadge || 'حمایت مادی و معنوی ویژه نخبگان'}
                </span>
                <span aria-hidden="true" className="text-white/30">·</span>
                <span className="text-[11px] font-bold text-emerald-100/90 inline-flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#F3D078]" />
                  {crextioConfig.researchPromoGrantAmount || 'تا ۵۰ میلیون تومان گرنت پژوهشی + اسکان مشهد و قم'}
                </span>
              </div>

              <h2 className={`${titleFontSize} font-black text-white leading-tight tracking-tight`}>
                {crextioConfig.researchPromoTitle || 'باشگاه نخبگانی راهبری رساله‌ها، پایان‌نامه‌ها و پژوهش‌های تحول قضایی'}
              </h2>
              <p className={`${bodyFontSize} text-emerald-100/80 font-medium leading-relaxed`}>
                {crextioConfig.researchPromoSubtitle || 'تطبیق با اساتید برجسته خارج فقه و دکتری، تخصیص گرنت پژوهشی، چاپ کتاب و دفاع مقتدرانه'}
              </p>
            </div>

            {/* Quick Actions (Admin Configurable Labels & Actions) */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
              <button
                onClick={handlePrimaryBtnClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#F3D078] hover:bg-[#F8DC91] text-[#071E17] font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-[#071E17]" />
                <span>{crextioConfig.researchPromoPrimaryBtnText || 'ثبت فوری پروپوزال و دریافت اسکان'}</span>
              </button>

              <button
                onClick={handleSecondaryBtnClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/18 text-white border border-white/18 font-bold text-xs backdrop-blur-md transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{crextioConfig.researchPromoSecondaryBtnText || 'میز کار راهبری پژوهش'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Enticing Opportunity Pillars (100% Configurable by Admin) */}
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-3.5 sm:overflow-visible sm:pb-0 pt-2">
            {cardsList.map((pillar) => {
              const Icon = getCardIcon(pillar.icon);
              const isClickable = pillar.clickAction && pillar.clickAction !== 'none';

              return (
                <div
                  key={pillar.id}
                  onClick={() => handleCardClick(pillar.clickAction, pillar.actionUrl)}
                  className={`min-w-[74vw] sm:min-w-0 snap-start shrink-0 sm:shrink p-3.5 sm:p-4 rounded-2xl bg-black/22 hover:bg-black/32 border border-white/12 hover:border-[#F3D078]/45 transition-all backdrop-blur-sm space-y-2 group ${
                    isClickable ? 'cursor-pointer hover:shadow-lg active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F3D078]/15 text-[#F3D078] flex items-center justify-center border border-[#F3D078]/30 group-hover:scale-105 transition-transform shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-[#F3D078] truncate">
                      {pillar.tag}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-[13px] font-extrabold text-white group-hover:text-[#F3D078] transition-colors">
                    {pillar.title}
                  </h4>
                  <p className="text-[11px] text-emerald-100/72 leading-relaxed font-medium">
                    {pillar.desc}
                  </p>

                  {isClickable && (
                    <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-[#F3D078]/85 group-hover:text-[#F3D078]">
                      <span>اقدام سریع</span>
                      <ChevronLeft className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Proposal Submission Modal */}
      <AnimatePresence>
        {quickModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFCFA] rounded-t-[26px] sm:rounded-[32px] w-full max-w-lg max-h-[92dvh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden text-stone-900"
            >
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-stone-900 truncate">
                      ثبت سریع طرح پژوهشی و درخواست حمایت نخبگانی
                    </h3>
                    <p className="text-[11px] text-stone-500 truncate">
                      تطبیق فوری با استاد راهنما و بررسی گرنت پژوهشی
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuickModalOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-stone-200/80 flex items-center justify-center text-stone-500 shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {successMsg ? (
                <div className="p-6 text-center space-y-2 flex-1 min-h-0 overflow-y-auto overscroll-y-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-emerald-900">طرح پژوهشی شما با موفقیت ثبت شد!</h4>
                  <p className="text-xs text-stone-600">
                    دبیرخانه علمی مرکز ظرف ۴۸ ساعت آینده با شما تماس گرفته و استاد معین را تعیین خواهد نمود.
                  </p>
                </div>
              ) : (
                <>
                  <form id="research-quick-submit-form" onSubmit={handleQuickSubmit} className="p-5 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        عنوان رساله / پایان‌نامه / طرح پژوهشی:
                      </label>
                      <input
                        type="text"
                        required
                        value={thesisTitle}
                        onChange={e => setThesisTitle(e.target.value)}
                        placeholder="مثال: مسئولیت کیفری هوش مصنوعی در دادرسی‌های الکترونیک..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">گرایش علمی تخصصی:</label>
                      <select
                        value={field}
                        onChange={e => setField(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      >
                        <option value="فقه و حقوق جزا و جرم‌شناسی">فقه و حقوق جزا و جرم‌شناسی</option>
                        <option value="فقه و حقوق خصوصی و قراردادها">فقه و حقوق خصوصی و قراردادها</option>
                        <option value="فقه القضاء و رویه دادرسی">فقه القضاء و رویه دادرسی</option>
                        <option value="حقوق عمومی و فقه حکومتی">حقوق عمومی و فقه حکومتی</option>
                        <option value="حقوق تجارت بین‌الملل و داوری">حقوق تجارت بین‌الملل و داوری</option>
                      </select>
                    </div>

                    {/* Accommodation Option */}
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-900">
                        <input
                          type="checkbox"
                          checked={accommodation}
                          onChange={e => setAccommodation(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-800 accent-emerald-800"
                        />
                        <span>تقاضای اسکان رایگان در مهمان‌سرای علمی نخبگان دارم</span>
                      </label>

                      {accommodation && (
                        <div className="pt-2 flex flex-wrap items-center gap-2 text-stone-700">
                          <span className="font-semibold text-[11px]">شهر اقامت پژوهشی:</span>
                          <div className="flex items-center gap-2">
                            {(['قم', 'مشهد', 'تهران'] as const).map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setCity(c)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                  city === c
                                    ? 'bg-amber-600 text-white border-amber-700'
                                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </form>

                  <div className="px-5 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2 shrink-0 text-xs pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                    <button
                      type="button"
                      onClick={() => setQuickModalOpen(false)}
                      className="px-4 py-2.5 min-h-[42px] rounded-xl border border-stone-300 bg-white text-stone-700 font-bold hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      form="research-quick-submit-form"
                      disabled={!thesisTitle.trim()}
                      className="px-5 py-2.5 min-h-[42px] rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black transition-colors cursor-pointer"
                    >
                      ارسال و ثبت نهایی طرح
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

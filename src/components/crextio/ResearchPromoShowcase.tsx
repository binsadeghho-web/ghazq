import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
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

  const handleCardClick = (clickAction?: string) => {
    if (clickAction === 'quick_modal') {
      setQuickModalOpen(true);
    } else if (clickAction === 'navigate_research' && onNavigateToResearch) {
      onNavigateToResearch();
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
      <div className="relative rounded-[32px] overflow-hidden border border-[#D5E3D8] bg-gradient-to-br from-[#0F261E] via-[#143228] to-[#0A1D16] text-white shadow-xl">
        {/* Background Atmosphere Image with Scrim (NEW: Dignified Islamic Scholarly Chamber without women) */}
        <div className="absolute inset-0 pointer-events-none z-0 opacity-30">
          <img
            src="/src/assets/images/scholarly_research_chamber_1793830009917.jpg"
            alt="باشگاه نخبگانی راهبری رساله‌ها و اساتید فقه و حقوق"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1D16] via-[#0A1D16]/80 to-transparent" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content Structure */}
        <div className="relative z-10 p-6 sm:p-8 space-y-6">
          {/* Top Banner & Badges */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center">
                  <Compass className="w-4 h-4 stroke-[2.3]" />
                </span>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/40">
                  {crextioConfig.researchPromoBadge || 'حمایت مادی و معنوی ویژه نخبگان'}
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-300" />
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
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handlePrimaryBtnClick}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>{crextioConfig.researchPromoPrimaryBtnText || 'ثبت فوری پروپوزال و دریافت اسکان'}</span>
              </button>

              <button
                onClick={handleSecondaryBtnClick}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs backdrop-blur-md transition-all cursor-pointer"
              >
                <span>{crextioConfig.researchPromoSecondaryBtnText || 'میز کار راهبری پژوهش'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4 Enticing Opportunity Pillars (100% Configurable by Admin) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {cardsList.map((pillar) => {
              const Icon = getCardIcon(pillar.icon);
              const isClickable = pillar.clickAction && pillar.clickAction !== 'none';

              return (
                <div
                  key={pillar.id}
                  onClick={() => handleCardClick(pillar.clickAction)}
                  className={`p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/40 transition-all backdrop-blur-sm space-y-2 group ${
                    isClickable ? 'cursor-pointer hover:shadow-lg active:scale-98' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      {pillar.tag}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-[13px] font-extrabold text-white group-hover:text-amber-200 transition-colors">
                    {pillar.title}
                  </h4>
                  <p className="text-[11px] text-emerald-100/70 leading-relaxed font-medium">
                    {pillar.desc}
                  </p>

                  {isClickable && (
                    <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-amber-300/80 group-hover:text-amber-300">
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
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FCFCFA] rounded-[32px] w-full max-w-lg border border-stone-200 shadow-2xl p-6 space-y-4 text-stone-900"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                    <Compass className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900">
                      ثبت سریع طرح پژوهشی و درخواست حمایت نخبگانی
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      تطبیق فوری با استاد راهنما و بررسی گرنت پژوهشی
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setQuickModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-200/80 flex items-center justify-center text-stone-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {successMsg ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-sm text-emerald-900">طرح پژوهشی شما با موفقیت ثبت شد!</h4>
                  <p className="text-xs text-stone-600">
                    دبیرخانه علمی مرکز ظرف ۴۸ ساعت آینده با شما تماس گرفته و استاد معین را تعیین خواهد نمود.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleQuickSubmit} className="space-y-4 text-xs">
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
                      <div className="pt-2 flex items-center gap-2 text-stone-700">
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

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setQuickModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={!thesisTitle.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black transition-colors cursor-pointer"
                    >
                      ارسال و ثبت نهایی طرح
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

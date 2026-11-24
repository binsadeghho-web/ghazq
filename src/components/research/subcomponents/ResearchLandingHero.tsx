import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  FileText,
  Mic,
  CheckCircle2,
  ArrowLeft,
  Info,
  Phone,
  Clock,
  MapPin,
  MessageSquare,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ResearchCategory,
  ResearchPillarCardConfig,
  ResearchPortalConfig,
} from '../../../types';
import { resolveShowcaseImageUrl } from '../../../data/showcaseImages';

interface ResearchLandingHeroProps {
  config: ResearchPortalConfig;
  imageOverrides?: Record<string, string>;
  onSelectCategory: (category: ResearchCategory) => void;
  onOpenGuidance: () => void;
  onScrollToMyRequests: () => void;
  myRequestsCount: number;
}

const FALLBACK_PILLAR_CARDS: ResearchPillarCardConfig[] = [
  {
    id: 'thesis',
    indexLabel: '۰۱',
    badgeText: 'پک کامل و راهبری موردی',
    title: 'راهبری پایان‌نامه‌ها و رساله‌ها',
    subtitle:
      'همراهی جامع از ایده‌پردازی، انتخاب موضوع نوآورانه و تصویب پروپوزال تا تدوین فصول، نقد علمی، آماده‌سازی دفاع و تسهیل اسکان مطالعاتی در قم.',
    highlights: [
      'پک کامل راهبری یا مشورت موردی تخصصی',
      'انتصاب استاد راهنمای برجسته حوزه و دانشگاه',
      'امکان درخواست اسکان مطالعاتی قم (حضوری)',
    ],
    ctaLabel: 'ثبت درخواست راهبری پایان‌نامه',
    enabled: true,
  },
  {
    id: 'article',
    indexLabel: '۰۲',
    badgeText: 'نگارش تا چاپ علمی‌پژوهشی',
    title: 'همکاری در مقاله و کمک به انتشار',
    subtitle:
      'تمامی خدمات تدوین، ساختار و نقد علمی مقاله به همراه پشتیبانی تخصصی برای معرفی نشریات معتبر، استانداردسازی و کمک در ارسال و انتشار مقاله.',
    highlights: [
      'کمک در انتخاب موضوع، ساختار و نقد علمی مقاله',
      'کمک در انتشار و ارسال به نشریات علمی‌پژوهشی',
      'همراهی در پاسخ به داوران تا پذیرش نهایی',
    ],
    ctaLabel: 'ثبت درخواست همکاری در مقاله',
    enabled: true,
  },
  {
    id: 'session_proposal',
    indexLabel: '۰۳',
    badgeText: 'پیشنهاد موضوع نشست علمی',
    title: 'پیشنهاد برگزاری نشست علمی',
    subtitle:
      'پیشنهاد موضوعات به‌روز فقهی و حقوقی برای برگزاری نشست‌های علمی، کرسی‌های ترویجی و میزگردهای تخصصی مرکز با حضور صاحب‌نظران و اساتید.',
    highlights: [
      'پیشنهاد عنوان، محورهای کلیدی و ضرورت نشست',
      'معرفی سخنرانان یا اساتید پیشنهادی و مخاطبان',
      'انتخاب شیوه برگزاری حضوری، آنلاین یا ترکیبی',
    ],
    ctaLabel: 'پیشنهاد برگزاری نشست علمی',
    enabled: true,
  },
];

const CARD_STYLES: Record<
  ResearchCategory,
  {
    gradient: string;
    border: string;
    radialGlow: string;
    iconBox: string;
    ctaClass: string;
    checkColor: string;
    badgeClass: string;
    Icon: typeof BookOpen;
  }
> = {
  thesis: {
    gradient: 'from-[#061C15] via-[#0B2E22] to-[#124534]',
    border: 'border-[#F3D078]/30 hover:border-[#F3D078]/75',
    radialGlow:
      'radial-gradient(circle at 82% 8%, rgba(243,208,120,0.22), transparent 56%)',
    iconBox: 'bg-[#F3D078]/15 border-[#F3D078]/40 text-[#F3D078]',
    ctaClass:
      'bg-gradient-to-l from-[#D4AF37] via-[#F3D078] to-[#E6BE58] text-[#071E17] hover:brightness-105',
    checkColor: 'text-[#F3D078]',
    badgeClass: 'bg-[#F3D078]/15 text-[#F3D078] border-[#F3D078]/30',
    Icon: BookOpen,
  },
  article: {
    gradient: 'from-[#06201E] via-[#0B3632] to-[#104A43]',
    border: 'border-emerald-300/35 hover:border-[#F3D078]/75',
    radialGlow:
      'radial-gradient(circle at 20% 8%, rgba(52,211,153,0.22), transparent 56%)',
    iconBox: 'bg-emerald-400/15 border-emerald-300/40 text-emerald-200',
    ctaClass:
      'bg-gradient-to-l from-[#D4AF37] via-[#F3D078] to-[#E6BE58] text-[#071E17] hover:brightness-105',
    checkColor: 'text-emerald-300',
    badgeClass: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/30',
    Icon: FileText,
  },
  session_proposal: {
    gradient: 'from-[#141F13] via-[#0D2B20] to-[#1F2D18]',
    border: 'border-amber-300/35 hover:border-[#F3D078]/80',
    radialGlow:
      'radial-gradient(circle at 50% 6%, rgba(251,191,36,0.20), transparent 56%)',
    iconBox: 'bg-amber-400/15 border-amber-300/40 text-amber-200',
    ctaClass:
      'bg-gradient-to-l from-[#D4AF37] via-[#F3D078] to-[#E6BE58] text-[#071E17] hover:brightness-105',
    checkColor: 'text-amber-300',
    badgeClass: 'bg-amber-400/15 text-amber-200 border-amber-300/30',
    Icon: Mic,
  },
};

export const ResearchLandingHero: React.FC<ResearchLandingHeroProps> = ({
  config,
  imageOverrides,
  onSelectCategory,
  onOpenGuidance,
  onScrollToMyRequests,
  myRequestsCount,
}) => {
  const heroBgSrc = resolveShowcaseImageUrl('research_promo', imageOverrides);
  const configuredCards =
    config.pillarCards && config.pillarCards.length > 0
      ? config.pillarCards
      : FALLBACK_PILLAR_CARDS;
  const activeCards = configuredCards.filter(card => card.enabled !== false);

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Compact Architectural Intro Strip */}
      <div className="relative rounded-[26px] sm:rounded-3xl overflow-hidden border border-[#F3D078]/25 bg-[#071E17] text-white shadow-xl">
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <img
            src={heroBgSrc}
            alt={config.sectionTitle}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071E17] via-[#071E17]/88 to-[#071E17]/60" />
        </div>
        <div className="absolute inset-0 luxury-lattice-bg opacity-35 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F3D078]/75 to-transparent pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#F3D078] font-black">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>معاونت پژوهش مرکز فقه و حقوق اسلامی</span>
              <span className="text-emerald-400/50">·</span>
              <span className="text-emerald-200 font-bold">پژوهش · مقاله و انتشار · نشست علمی</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
              {config.landingIntroTitle}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-50/85 leading-7">
              {config.landingIntroBody}
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenGuidance}
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors backdrop-blur-sm cursor-pointer whitespace-nowrap"
            >
              <Info className="w-4 h-4 text-[#F3D078] shrink-0" />
              <span>توضیحات و ضوابط</span>
            </button>

            <button
              type="button"
              onClick={onScrollToMyRequests}
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border border-emerald-400/35 text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Layers className="w-4 h-4 shrink-0 text-emerald-300" />
              <span>پیگیری درخواست‌های من ({myRequestsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* THE CENTERPIECE: THREE LUMINOUS, RADIANT INTERACTIVE RESEARCH PILLAR CARDS */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white tracking-tight">
              {config.landingCalloutTitle || 'سه محور تخصصی خدمات پژوهشی'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-slate-400 mt-0.5">
              {config.landingCalloutSubtitle ||
                'با لمس هر کارت، وارد فرم اختصاصی همان خدمت شوید و مراحل را در همین صفحه پیگیری کنید.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {activeCards.map((card, idx) => {
            const style = CARD_STYLES[card.id] || CARD_STYLES.thesis;
            const Icon = style.Icon;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => onSelectCategory(card.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory(card.id);
                  }
                }}
                className={`group relative rounded-[28px] overflow-hidden bg-gradient-to-br ${style.gradient} border ${style.border} text-white p-5 sm:p-6 shadow-xl transition-all duration-300 flex flex-col justify-between gap-5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F3D078]`}
              >
                {/* Luminous Specular & Geometric Lattice Layer */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: style.radialGlow }}
                />
                <div className="absolute inset-0 luxury-lattice-bg opacity-30 pointer-events-none" />
                <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#F3D078]/80 to-transparent pointer-events-none" />

                {/* Top Header: Icon + Index + Category Tag */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl border ${style.iconBox} flex items-center justify-center shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-black whitespace-nowrap ${style.badgeClass}`}
                      >
                        {card.badgeText}
                      </span>
                      <span className="font-mono tabular-nums text-xs font-black text-white/45">
                        {card.indexLabel}
                      </span>
                    </div>
                  </div>

                  {/* Card Title & Subtitle */}
                  <div className="space-y-2">
                    <h4 className="text-lg sm:text-[19px] font-black text-white leading-snug group-hover:text-[#F3D078] transition-colors">
                      {card.title}
                    </h4>
                    <p className="text-xs text-emerald-50/85 leading-6">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Clean Highlights List */}
                  {card.highlights && card.highlights.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t border-white/10">
                      {card.highlights.map((item, hIdx) => (
                        <li
                          key={hIdx}
                          className="flex items-start gap-2 text-xs text-emerald-50/90 leading-5"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 mt-0.5 ${style.checkColor}`}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Luminous Action Footer Button */}
                <div className="relative z-10 pt-2">
                  <div
                    className={`w-full min-h-[46px] px-4 py-3 rounded-2xl font-black text-xs flex items-center justify-between gap-2 shadow-lg transition-all ${style.ctaClass}`}
                  >
                    <span className="truncate">{card.ctaLabel}</span>
                    <ArrowLeft className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Contact Center Strip */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {config.contactCenterTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                پاسخگویی مستقیم کارشناسان دبیرخانه پژوهش در ساعات اداری
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenGuidance}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start md:self-auto whitespace-nowrap"
          >
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>توضیحات</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">شماره تماس مستقیم مرکز:</span>
            <div className="font-mono tabular-nums font-black text-sm text-slate-900 dark:text-white">
              {config.contactPhone}
            </div>
            {config.contactExtension && (
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                {config.contactExtension}
              </span>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
              <span>همراه / پیام‌رسان دبیرخانه:</span>
            </span>
            <div className="font-bold text-slate-900 dark:text-white leading-relaxed">
              {config.contactMobileOrMessenger || 'ثبت نشده'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>ساعات پاسخگویی:</span>
            </span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {config.contactHours || 'شنبه تا چهارشنبه ۸:۳۰ الی ۱۴:۳۰'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>نشانی دبیرخانه:</span>
            </span>
            <div className="font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {config.contactAddress || 'قم، مجتمع علمی مرکز فقه و حقوق اسلامی'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Edit3,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CounselingGeneralShowcaseProps {
  span?: 'full' | 'half';
  scale?: 'micro' | 'compact' | 'normal' | 'expanded';
  onNavigateToGeneral?: () => void;
  onOpenQuickEdit?: () => void;
}

const DEFAULT_GENERAL_BULLETS = [
  'مشاوره پیش از ازدواج و شناخت شخصیت',
  'زوج‌درمانی و تحکیم روابط خانوادگی',
  'مدیریت استرس شغلی و پیشگیری از فرسودگی',
  'مشاوره تحصیلی و تربیتی فرزندان و خانواده',
];

export const CounselingGeneralShowcase: React.FC<CounselingGeneralShowcaseProps> = ({
  span = 'full',
  scale = 'normal',
  onNavigateToGeneral,
  onOpenQuickEdit,
}) => {
  const {
    currentUser,
    consultants,
    crextioConfig,
    isAlumniPreview,
  } = useApp();

  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

  const badge =
    crextioConfig.counselingGeneralShowcaseBadge ||
    crextioConfig.counselingPromoGeneralBadge ||
    'آرامش روانی، سلامت خانواده و تاب‌آوری';

  const title =
    crextioConfig.counselingGeneralShowcaseTitle ||
    crextioConfig.counselingPromoGeneralTitle ||
    'ویترین خدمات مشاوره عمومی، خانواده و روان‌شناختی';

  const subtitle =
    crextioConfig.counselingGeneralShowcaseSubtitle ||
    'دسترسی محرمانه به مشاوران خانواده، زوج‌درمانی، پیش از ازدواج و مدیریت فشارهای روانی شغلی';

  const description =
    crextioConfig.counselingGeneralShowcaseDesc ||
    crextioConfig.counselingPromoGeneralDesc ||
    'کلینیک تخصصی مشاوره عمومی و خانواده مرکز فقه و قضا با حضور مجرب‌ترین روان‌شناسان و مشاوران، خدماتی کاملاً محرمانه برای تحکیم بنیان خانواده و تاب‌آوری شغلی اعضا ارائه می‌دهد.';

  const ctaText =
    crextioConfig.counselingGeneralShowcaseBtnText ||
    crextioConfig.counselingPromoGeneralBtnText ||
    'ورود به خدمات مشاوره عمومی و نوبت‌دهی';

  const bullets =
    crextioConfig.counselingGeneralShowcaseBullets &&
    crextioConfig.counselingGeneralShowcaseBullets.length > 0
      ? crextioConfig.counselingGeneralShowcaseBullets
      : DEFAULT_GENERAL_BULLETS;

  const customData = crextioConfig.counselingPromoCustomData || {};
  const consultantOverrides = customData.consultantOverrides || {};

  const generalConsultants = consultants
    .filter(c => c.counselingType !== 'specialized_career')
    .map(c => ({ ...c, ...(consultantOverrides[c.id] || {}) }));

  const bannerImageUrl = resolveShowcaseImageUrl(
    'counseling_general_showcase',
    crextioConfig.showcaseImageOverrides
  );
  const fallbackAvatarUrl = resolveShowcaseImageUrl(
    'hero_portrait',
    crextioConfig.showcaseImageOverrides
  );

  const isCompact = scale === 'micro' || scale === 'compact';

  return (
    <section
      className={`w-full rounded-[28px] bg-[#FFFCFC] border border-rose-200/85 shadow-sm overflow-hidden text-stone-900 ${
        isCompact ? 'p-4 sm:p-5 space-y-4' : 'p-5 sm:p-7 space-y-5'
      }`}
      dir="rtl"
    >
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-rose-100 pb-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-700" />
              <span>{badge}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>پرونده محرمانه ۱۰۰٪</span>
            </span>
          </div>

          <h3 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">
            {title}
          </h3>
          {!isCompact && (
            <p className="text-xs text-stone-600 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isAdmin && onOpenQuickEdit && (
            <button
              type="button"
              onClick={onOpenQuickEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>ویرایش متن و عکس</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToGeneral}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>{ctaText}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Content */}
      <div
        className={`grid grid-cols-1 ${
          span === 'half' ? 'gap-4' : 'lg:grid-cols-12 gap-5'
        } items-stretch`}
      >
        {/* Visual + Narrative Panel */}
        <div
          className={`${
            span === 'half' ? '' : 'lg:col-span-8'
          } rounded-2xl bg-white border border-rose-100 overflow-hidden grid grid-cols-1 ${
            span === 'half' || isCompact ? '' : 'md:grid-cols-12'
          }`}
        >
          {bannerImageUrl && (
            <div
              className={`${
                span === 'half' || isCompact
                  ? 'h-40'
                  : 'md:col-span-5 min-h-[220px]'
              } relative overflow-hidden bg-stone-900`}
            >
              <img
                src={bannerImageUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute bottom-3 right-3.5 left-3.5 text-white space-y-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-200">
                  <Sparkles className="w-3 h-3" />
                  <span>یارانه ویژه ۷۰ درصدی اعضا</span>
                </div>
                <div className="text-xs font-black">
                  {toPersianNumbers(generalConsultants.length)} مشاور و درمانگر آماده پاسخگویی
                </div>
              </div>
            </div>
          )}

          <div
            className={`${
              span === 'half' || isCompact || !bannerImageUrl
                ? ''
                : 'md:col-span-7'
            } p-4 sm:p-5 flex flex-col justify-between gap-4`}
          >
            <div className="space-y-3">
              <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-medium">
                {description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {bullets.slice(0, isCompact ? 2 : 4).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-stone-700 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-rose-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                <span>جلسات حضوری و آنلاین محرمانه</span>
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-rose-800">
                <Clock className="w-3.5 h-3.5" />
                <span>مدت نشست: ۴۵ دقیقه</span>
              </span>
            </div>
          </div>
        </div>

        {/* General Counselors Sidebar */}
        <div
          className={`${
            span === 'half' ? '' : 'lg:col-span-4'
          } rounded-2xl bg-rose-50/50 border border-rose-200/80 p-4 flex flex-col justify-between gap-3`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-900">
                مشاوران برگزیده حوزه عمومی و خانواده
              </span>
              <span className="text-[11px] font-bold text-rose-800 tabular-nums">
                {toPersianNumbers(generalConsultants.length)} متخصص
              </span>
            </div>

            <div className="space-y-2">
              {generalConsultants.slice(0, isCompact ? 1 : 2).map(c => (
                <div
                  key={c.id}
                  onClick={onNavigateToGeneral}
                  className="p-2.5 rounded-xl bg-white border border-rose-100 hover:border-rose-300 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <img
                    src={c.avatarUrl || fallbackAvatarUrl}
                    alt={c.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover object-top border border-rose-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-stone-900 truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-rose-800 font-medium truncate">
                      {c.title}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate mt-0.5">
                      {c.specialty}
                    </div>
                  </div>
                </div>
              ))}

              {generalConsultants.length === 0 && (
                <div className="p-3 rounded-xl bg-white border border-rose-100 text-xs text-stone-500 text-center">
                  مشاوران این بخش از پنل مدیریت قابل تعریف هستند.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToGeneral}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-rose-100/70 text-rose-900 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
          >
            مشاهده همه مشاوران عمومی و رزرو نوبت
          </button>
        </div>
      </div>
    </section>
  );
};

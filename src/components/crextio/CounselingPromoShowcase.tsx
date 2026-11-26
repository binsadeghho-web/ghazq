import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { Consultant } from '../../types';
import {
  DEFAULT_SHOWCASE_IMAGES,
  resolveShowcaseImageUrl,
  resolveConsultantAvatarUrl,
  handleImageErrorFallback,
} from '../../data/showcaseImages';
import {
  HeartHandshake,
  Compass,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Award,
  Lock,
  Edit3,
  X,
  Camera,
  Pause,
  Loader2,
  Upload,
} from 'lucide-react';

interface CounselingPromoShowcaseProps {
  onNavigateToGeneral?: () => void;
  onNavigateToSpecialized?: () => void;
}

const DEFAULT_SPEC_BULLETS = [
  'برنامه‌ریزی دقیق ترفیع پایه قضایی',
  'تحلیل نقاط قوت و رفع ضعف در اختبار علمی',
  'مشاوره جامع موضوع‌یابی و تدوین پروپوزال دکتری',
  'جلسات شبیه‌سازی مصاحبه‌های ارتقاء مدیریتی',
];

const DEFAULT_GEN_BULLETS = [
  'مشاوره پیش از ازدواج و آزمون‌های شخصیت',
  'زوج‌درمانی و بهبود روابط عاطفی همسران',
  'تکنیک‌های مدیریت استرس حاد و پیشگیری از فرسودگی شغلی',
  'مشاوره تحصیلی و تربیتی نوجوانان و فرزندان',
];

export const CounselingPromoShowcase: React.FC<CounselingPromoShowcaseProps> = ({
  onNavigateToGeneral,
  onNavigateToSpecialized
}) => {
  const { currentUser, consultants, crextioConfig, updateCrextioConfig, isAlumniPreview } = useApp();
  const isAdmin =
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'super_admin' ||
      currentUser?.role === 'alumni_manager' ||
      currentUser?.role === 'supervisor') &&
    !isAlumniPreview;

  const [activeTab, setActiveTab] = useState<'specialized' | 'general'>('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUserInteraction = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 30000);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isPaused) {
        setIsPaused(false);
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveTab(prev => (prev === 'general' ? 'specialized' : 'general'));
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const savedCustom = crextioConfig.counselingPromoCustomData || {};
  const promoTitle = crextioConfig.counselingPromoTitle || 'درگاه جامع خدمات مشاوره نخبگان فقه و قضا';
  const promoSubtitle =
    crextioConfig.counselingPromoSubtitle ||
    'ارائه خدمات مشاوره تخصصی شغلی-تحصیلی قضایی و مشاوره‌های روان‌شناختی، خانواده و فردی با حفظ کامل محرمانگی';

  const showcaseBannerUrl =
    resolveShowcaseImageUrl('counseling_promo', crextioConfig.showcaseImageOverrides) ||
    DEFAULT_SHOWCASE_IMAGES.counseling_promo;
  const fallbackAvatarUrl = resolveConsultantAvatarUrl(
    resolveShowcaseImageUrl('hero_portrait', crextioConfig.showcaseImageOverrides),
    0
  );

  // Merge MySQL persisted consultant overrides with system consultants
  const consultantOverrides = savedCustom.consultantOverrides || {};
  const displaySpecialized = consultants
    .filter(c => c.counselingType === 'specialized_career')
    .map(c => ({ ...c, ...(consultantOverrides[c.id] || {}) }));
  const displayGeneral = consultants
    .filter(c => c.counselingType !== 'specialized_career')
    .map(c => ({ ...c, ...(consultantOverrides[c.id] || {}) }));

  // Local form state for editing modal
  const [editTitle, setEditTitle] = useState(promoTitle);
  const [editSubtitle, setEditSubtitle] = useState(promoSubtitle);
  const [specBadge, setSpecBadge] = useState(
    savedCustom.specBadge || 'برنامه راهبردی ارتقاء قضایی و نخبگانی'
  );
  const [specHeading, setSpecHeading] = useState(
    savedCustom.specHeading || 'هدایت مسیر نخبگی، ارتقاء پایه قضایی و آماده‌سازی اختبار محاکم تجدیدنظر'
  );
  const [specDesc, setSpecDesc] = useState(
    savedCustom.specDesc ||
      'اگر به دنبال ارتقاء به شعب دادگاه تجدیدنظر، دیوان عالی کشور، پذیرش در مقاطع دکتری حقوق، یا تدوین رساله‌های بنیادین فقهی هستید، مستشاران ارشد شما را قدم‌به‌قدم همراهی می‌کنند.'
  );
  const [specBullets, setSpecBullets] = useState<string[]>(
    savedCustom.specBullets && savedCustom.specBullets.length > 0
      ? savedCustom.specBullets
      : DEFAULT_SPEC_BULLETS
  );

  const [genBadge, setGenBadge] = useState(
    savedCustom.genBadge || 'آرامش روانی، سلامت خانواده و تاب‌آوری شغلی'
  );
  const [genHeading, setGenHeading] = useState(
    savedCustom.genHeading || 'خدمات روان‌شناختی، زوج‌درمانی، فرزندپروری و تخلیه فشارهای روانی شغل قضاوت'
  );
  const [genDesc, setGenDesc] = useState(
    savedCustom.genDesc ||
      'قضاوت و اشتغال در مراجع پرتنش نیازمند حفظ سلامت روان و نشاط خانواده است. کلینیک مشاوره فقه و قضا با حضور مجرب‌ترین روان‌شناسان و مشاوران خانواده محیطی کاملاً امن فراهم نموده است.'
  );
  const [genBullets, setGenBullets] = useState<string[]>(
    savedCustom.genBullets && savedCustom.genBullets.length > 0
      ? savedCustom.genBullets
      : DEFAULT_GEN_BULLETS
  );

  const [editOverrides, setEditOverrides] = useState<Record<string, Partial<Consultant>>>(consultantOverrides);

  useEffect(() => {
    setEditTitle(promoTitle);
    setEditSubtitle(promoSubtitle);
    if (savedCustom.specBadge) setSpecBadge(savedCustom.specBadge);
    if (savedCustom.specHeading) setSpecHeading(savedCustom.specHeading);
    if (savedCustom.specDesc) setSpecDesc(savedCustom.specDesc);
    if (savedCustom.specBullets?.length) setSpecBullets(savedCustom.specBullets);
    if (savedCustom.genBadge) setGenBadge(savedCustom.genBadge);
    if (savedCustom.genHeading) setGenHeading(savedCustom.genHeading);
    if (savedCustom.genDesc) setGenDesc(savedCustom.genDesc);
    if (savedCustom.genBullets?.length) setGenBullets(savedCustom.genBullets);
    setEditOverrides(savedCustom.consultantOverrides || {});
  }, [promoTitle, promoSubtitle, crextioConfig.counselingPromoCustomData]);

  const handleUpdateConsultantOverride = (c: Consultant, field: keyof Consultant, val: any) => {
    setEditOverrides(prev => ({
      ...prev,
      [c.id]: {
        ...(prev[c.id] || {}),
        [field]: val,
      },
    }));
  };

  const handleFileUpload = async (targetKey: string, file: File, consultantObj?: Consultant) => {
    if (!file) return;
    setUploadingId(targetKey);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        if (targetKey === '__showcase_banner__') {
          updateCrextioConfig({
            showcaseImageOverrides: {
              ...(crextioConfig.showcaseImageOverrides || {}),
              counseling_promo: res.url,
            },
          });
        } else if (consultantObj) {
          handleUpdateConsultantOverride(consultantObj, 'avatarUrl', res.url);
        }
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`, type: 'error' } }));
    } finally {
      setUploadingId(null);
    }
  };

  const handleSavePromo = () => {
    updateCrextioConfig({
      counselingPromoTitle: editTitle,
      counselingPromoSubtitle: editSubtitle,
      counselingPromoCustomData: {
        specBadge,
        specHeading,
        specDesc,
        specBullets,
        genBadge,
        genHeading,
        genDesc,
        genBullets,
        consultantOverrides: editOverrides,
      },
    });
    setIsEditModalOpen(false);
  };

  const shownSpecBadge = savedCustom.specBadge || specBadge;
  const shownSpecHeading = savedCustom.specHeading || specHeading;
  const shownSpecDesc = savedCustom.specDesc || specDesc;
  const shownSpecBullets = savedCustom.specBullets?.length ? savedCustom.specBullets : specBullets;

  const shownGenBadge = savedCustom.genBadge || genBadge;
  const shownGenHeading = savedCustom.genHeading || genHeading;
  const shownGenDesc = savedCustom.genDesc || genDesc;
  const shownGenBullets = savedCustom.genBullets?.length ? savedCustom.genBullets : genBullets;

  return (
    <div
      onMouseEnter={handleUserInteraction}
      onClick={handleUserInteraction}
      className="w-full relative overflow-hidden rounded-2xl sm:rounded-[30px] bg-[#FCFCF9] border border-[#DFD8C4] shadow-[0_14px_38px_-24px_rgba(7,30,23,0.12)] p-3.5 sm:p-7 text-[#071E17] space-y-4 sm:space-y-5"
    >
      {/* Header and Toggle */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ECE6D6] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
            <span className="text-[#8A6314] inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#9A7116]" />
              <span>ویترین نمایشگاهی مشاوره و هدایت نخبگان</span>
            </span>
            <span aria-hidden="true" className="text-[#D4CBB3]">·</span>
            <span className="text-[#0C4A38] inline-flex items-center gap-1">
              <Lock className="w-3 h-3" /> محرمانگی ۱۰۰٪
            </span>
            {isPaused && (
              <>
                <span aria-hidden="true" className="text-[#D4CBB3]">·</span>
                <span className="text-[#6E5212] inline-flex items-center gap-1">
                  <Pause className="w-3 h-3" /> متوقف
                </span>
              </>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-[#071E17] tracking-tight">
            {promoTitle}
          </h3>
          <p className="text-xs text-[#525E58] max-w-2xl leading-relaxed">
            {promoSubtitle}
          </p>
        </div>

        {/* Tab switchers & Admin edit button */}
        <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#FBF4E1] hover:bg-[#F6E8C3] text-[#6E5212] border border-[#E5C97B] text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#9A7116]" />
              <span>ویرایش ۱۰۰٪ محتوای مشاوره</span>
            </button>
          )}

          <div className="grid grid-cols-2 sm:flex items-center w-full sm:w-auto bg-[#F4F0E4] p-1 rounded-2xl border border-[#DFD8C4]">
            <button
              onClick={() => {
                setActiveTab('general');
                handleUserInteraction();
              }}
              className={`min-h-[40px] sm:min-h-0 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center whitespace-nowrap ${
                activeTab === 'general'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs font-black'
                  : 'text-[#4C5852] hover:text-[#071E17]'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">روانشناختی و مشاوره</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('specialized');
                handleUserInteraction();
              }}
              className={`min-h-[40px] sm:min-h-0 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center whitespace-nowrap ${
                activeTab === 'specialized'
                  ? 'bg-[#071E17] text-[#F3D078] shadow-xs font-black'
                  : 'text-[#4C5852] hover:text-[#071E17]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">تخصصی شغلی و تحصیلی</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Exhibition Content depending on activeTab */}
      <AnimatePresence mode="wait">
        {activeTab === 'specialized' ? (
          <motion.div
            key="specialized"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10"
          >
            {/* Feature Card 1 (Specialized) */}
            <div className="lg:col-span-2 rounded-2xl bg-[#FAF8F2] p-5 border border-[#E2DAC3] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-[#8A6314] font-black inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#9A7116]" />
                    <span>{shownSpecBadge}</span>
                  </span>
                  <span className="text-[11px] text-[#0C4A38] font-bold">
                    نوبت‌دهی آنلاین با اساتید طراز اول
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-[#071E17] leading-snug">
                  {shownSpecHeading}
                </h4>

                <p className="text-xs text-[#525E58] leading-relaxed">
                  {shownSpecDesc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {shownSpecBullets.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#2B3B34] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#9A7116] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#ECE6D6] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#525E58] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8A6314]" />
                  <span>مدت هر نشست: ۴۵ دقیقه · حضوری یا تصویری امن</span>
                </div>
                <button
                  onClick={onNavigateToSpecialized}
                  className="w-full sm:w-auto justify-center px-5 py-2.5 sm:py-2 rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#D4AF37]/30 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>رزرو مشاوره تخصصی شغلی و تحصیلی</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Counselors Preview + Visual Cover */}
            <div className="rounded-2xl bg-[#FAF8F2] p-4 border border-[#E2DAC3] flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                {showcaseBannerUrl && (
                  <div className="relative h-28 rounded-xl overflow-hidden bg-[#071E17] border border-[#E2DAC3]">
                    <img
                      src={showcaseBannerUrl}
                      alt={shownSpecHeading}
                      referrerPolicy="no-referrer"
                      onError={e => handleImageErrorFallback(e, DEFAULT_SHOWCASE_IMAGES.counseling_promo)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071E17]/85 via-[#071E17]/20 to-transparent" />
                    <span className="absolute bottom-2 right-3 text-[11px] font-black text-[#F3D078]">
                      همراهی اساتید و قضات پیشکسوت
                    </span>
                  </div>
                )}
                <span className="text-xs font-black text-[#071E17] block">
                  مشاوران برگزیده هدایت شغلی:
                </span>
                <div className="space-y-2">
                  {displaySpecialized.slice(0, 2).map((c, idx) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-white border border-[#E2DAC3] flex items-center gap-2.5">
                      <img
                        src={resolveConsultantAvatarUrl(c.avatarUrl, idx)}
                        alt={c.name}
                        referrerPolicy="no-referrer"
                        onError={e => handleImageErrorFallback(e, fallbackAvatarUrl)}
                        className="w-11 h-11 rounded-xl object-cover object-top border border-[#D4AF37]/40 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#071E17] truncate">{c.name}</div>
                        <div className="text-[11px] text-[#8A6314] font-medium truncate">{c.title}</div>
                        <div className="text-[10px] text-[#525E58] mt-0.5 tabular-nums">{c.experienceYears} سال سابقه قضایی</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onNavigateToSpecialized}
                className="w-full py-2 rounded-xl bg-white hover:bg-[#F4F0E4] text-[#071E17] text-xs font-bold transition-all text-center cursor-pointer border border-[#DFD8C4]"
              >
                مشاهده کارنامه مشاوران شغلی
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="general"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10"
          >
            {/* Feature Card 2 (General) */}
            <div className="lg:col-span-2 rounded-2xl bg-[#FAF8F2] p-5 border border-[#E2DAC3] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-[#0C4A38] font-black inline-flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-rose-700" />
                    <span>{shownGenBadge}</span>
                  </span>
                  <span className="text-[11px] text-[#8A6314] font-bold">
                    یارانه ویژه ۷۰ درصدی کانون نخبگان
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-[#071E17] leading-snug">
                  {shownGenHeading}
                </h4>

                <p className="text-xs text-[#525E58] leading-relaxed">
                  {shownGenDesc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {shownGenBullets.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#2B3B34] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#0C4A38] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#ECE6D6] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#525E58] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0C4A38]" />
                  <span>پرونده الکترونیک محرمانه بدون دسترسی شخص ثالث</span>
                </div>
                <button
                  onClick={onNavigateToGeneral}
                  className="w-full sm:w-auto justify-center px-5 py-2.5 sm:py-2 rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#D4AF37]/30 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>رزرو خدمات روانشناختی و مشاوره</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Counselors Preview + Visual Cover */}
            <div className="rounded-2xl bg-[#FAF8F2] p-4 border border-[#E2DAC3] flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                {showcaseBannerUrl && (
                  <div className="relative h-28 rounded-xl overflow-hidden bg-[#071E17] border border-[#E2DAC3]">
                    <img
                      src={showcaseBannerUrl}
                      alt={shownGenHeading}
                      referrerPolicy="no-referrer"
                      onError={e => handleImageErrorFallback(e, DEFAULT_SHOWCASE_IMAGES.counseling_general_showcase)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071E17]/85 via-[#071E17]/20 to-transparent" />
                    <span className="absolute bottom-2 right-3 text-[11px] font-black text-emerald-300">
                      کلینیک تخصصی و محرمانه مشاوره
                    </span>
                  </div>
                )}
                <span className="text-xs font-black text-[#071E17] block">
                  مشاوران و درمانگران برگزیده:
                </span>
                <div className="space-y-2">
                  {displayGeneral.slice(0, 2).map((c, idx) => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-white border border-[#E2DAC3] flex items-center gap-2.5">
                      <img
                        src={resolveConsultantAvatarUrl(c.avatarUrl, idx)}
                        alt={c.name}
                        referrerPolicy="no-referrer"
                        onError={e => handleImageErrorFallback(e, fallbackAvatarUrl)}
                        className="w-11 h-11 rounded-xl object-cover object-top border border-[#D4AF37]/40 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#071E17] truncate">{c.name}</div>
                        <div className="text-[11px] text-[#0C4A38] font-medium truncate">{c.title}</div>
                        <div className="text-[10px] text-[#525E58] mt-0.5">{c.specialty}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onNavigateToGeneral}
                className="w-full py-2 rounded-xl bg-white hover:bg-[#F4F0E4] text-[#071E17] text-xs font-bold transition-all text-center cursor-pointer border border-[#DFD8C4]"
              >
                مشاهده اسامی همه مشاوران خانواده
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Promo & Consultant Full Edit Modal (Persisted in MySQL) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-1 sm:p-5 overflow-hidden" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-t-[26px] sm:rounded-3xl w-full max-w-3xl border border-stone-200 shadow-2xl text-stone-900 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 sm:px-6 flex items-center justify-between gap-2 border-b border-stone-200 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Edit3 className="w-5 h-5 text-amber-700 shrink-0" />
                  <h4 className="font-black text-xs sm:text-sm text-stone-900 truncate">
                    ویرایش ۱۰۰٪ محتوای مشاوره و تصاویر (ذخیره دائم در پایگاه داده)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-700 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain space-y-5 flex-1 min-h-0">

              {/* Showcase General Banner Upload */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {showcaseBannerUrl && (
                    <img
                      src={showcaseBannerUrl}
                      alt="تصویر ویترین مشاوره"
                      referrerPolicy="no-referrer"
                      className="w-14 h-12 rounded-xl object-cover border border-stone-300 shrink-0"
                    />
                  )}
                  <div>
                    <div className="text-xs font-black text-stone-800">تصویر اختصاصی ویترین مشاوره (نمایشگاه جامع و باکس ساده)</div>
                    <div className="text-[10px] text-stone-500">آپلود مستقیم روی سرور</div>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                  {uploadingId === '__showcase_banner__' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>آپلود تصویر باکس</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload('__showcase_banner__', e.target.files[0])}
                  />
                </label>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">تیتر اصلی ویترین مشاوره:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">توضیح کوتاه ویترین:</label>
                  <textarea
                    rows={2}
                    value={editSubtitle}
                    onChange={e => setEditSubtitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-800 leading-relaxed"
                  />
                </div>
              </div>

              {/* Specialized Counseling Content Edit */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 text-xs">
                <h5 className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-700" />
                  <span>ویرایش محتوای «مشاوره تخصصی شغلی و تحصیلی»:</span>
                </h5>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">تیتر اول (Badge):</label>
                  <input
                    type="text"
                    value={specBadge}
                    onChange={e => setSpecBadge(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">عنوان اصلی کادر تخصصی:</label>
                  <input
                    type="text"
                    value={specHeading}
                    onChange={e => setSpecHeading(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">توضیحات کامل بخش تخصصی:</label>
                  <textarea
                    rows={2}
                    value={specDesc}
                    onChange={e => setSpecDesc(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">۴ تگ/خدمت شاخص (هر خط یک مورد):</label>
                  <textarea
                    rows={3}
                    value={specBullets.join('\n')}
                    onChange={e => setSpecBullets(e.target.value.split('\n').filter(Boolean))}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>

              {/* General Counseling Content Edit */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3 text-xs">
                <h5 className="font-black text-xs text-rose-950 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-rose-700" />
                  <span>ویرایش محتوای «خدمات روانشناختی و مشاوره»:</span>
                </h5>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">تیتر اول (Badge):</label>
                  <input
                    type="text"
                    value={genBadge}
                    onChange={e => setGenBadge(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">عنوان اصلی کادر عمومی:</label>
                  <input
                    type="text"
                    value={genHeading}
                    onChange={e => setGenHeading(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">توضیحات کامل بخش عمومی:</label>
                  <textarea
                    rows={2}
                    value={genDesc}
                    onChange={e => setGenDesc(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">۴ تگ/خدمت شاخص (هر خط یک مورد):</label>
                  <textarea
                    rows={3}
                    value={genBullets.join('\n')}
                    onChange={e => setGenBullets(e.target.value.split('\n').filter(Boolean))}
                    className="w-full p-2 rounded-xl bg-white border border-stone-300"
                  />
                </div>
              </div>

              {/* Edit Consultants Photos & Details via Server Upload */}
              <div className="space-y-3 pt-2 border-t border-stone-200 text-xs">
                <h5 className="font-black text-xs text-stone-900">
                  ویرایش اسامی، سمت و آپلود عکس مشاوران شغلی و عمومی (ذخیره روی سرور):
                </h5>
                <div className="space-y-2">
                  {[...displaySpecialized, ...displayGeneral].map(c => {
                    const ov = editOverrides[c.id] || {};
                    const currentName = ov.name ?? c.name;
                    const currentTitle = ov.title ?? c.title;
                    const currentSpecialty = ov.specialty ?? c.specialty;
                    const currentYears = ov.experienceYears ?? c.experienceYears;
                    const currentAvatar = ov.avatarUrl ?? c.avatarUrl ?? fallbackAvatarUrl;
                    const isSpec = c.counselingType === 'specialized_career';

                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-4 gap-2 items-center ${
                          isSpec ? 'bg-amber-50/50 border-amber-200' : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={resolveConsultantAvatarUrl(currentAvatar, 0)}
                            alt={currentName}
                            referrerPolicy="no-referrer"
                            onError={e => handleImageErrorFallback(e, fallbackAvatarUrl)}
                            className="w-9 h-9 rounded-lg object-cover border border-stone-300 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <label className="text-[10px] text-stone-500 block">
                              {isSpec ? 'مشاور شغلی:' : 'مشاور خانواده:'}
                            </label>
                            <input
                              type="text"
                              value={currentName}
                              onChange={e => handleUpdateConsultantOverride(c, 'name', e.target.value)}
                              className="w-full p-1 text-xs font-bold bg-white rounded border border-stone-300"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block">سمت:</label>
                          <input
                            type="text"
                            value={currentTitle}
                            onChange={e => handleUpdateConsultantOverride(c, 'title', e.target.value)}
                            className="w-full p-1 text-xs bg-white rounded border border-stone-300"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block">
                            {isSpec ? 'سابقه (سال):' : 'تخصص:'}
                          </label>
                          {isSpec ? (
                            <input
                              type="number"
                              value={currentYears}
                              onChange={e => handleUpdateConsultantOverride(c, 'experienceYears', parseInt(e.target.value) || 0)}
                              className="w-full p-1 text-xs bg-white rounded border border-stone-300"
                            />
                          ) : (
                            <input
                              type="text"
                              value={currentSpecialty}
                              onChange={e => handleUpdateConsultantOverride(c, 'specialty', e.target.value)}
                              className="w-full p-1 text-xs bg-white rounded border border-stone-300"
                            />
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block">آپلود عکس:</label>
                          <label className="flex items-center gap-1 text-[10px] font-bold text-stone-800 bg-white border border-stone-300 hover:bg-stone-100 px-2.5 py-1.5 rounded-lg cursor-pointer w-fit">
                            {uploadingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                            <span>انتخاب و آپلود</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => e.target.files?.[0] && handleFileUpload(c.id, e.target.files[0], c)}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              </div>

              <div className="px-5 py-3.5 sm:px-6 flex items-center justify-end gap-2 border-t border-stone-200 shrink-0 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 min-h-[42px] rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSavePromo}
                  className="px-6 py-2.5 min-h-[42px] rounded-full bg-amber-700 hover:bg-amber-800 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  ذخیره دائمی تغییرات در پایگاه داده
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

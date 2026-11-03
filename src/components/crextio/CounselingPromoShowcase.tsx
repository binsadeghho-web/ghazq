import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Consultant } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
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
  RotateCcw,
  Camera,
  Plus,
  Trash2,
  Pause
} from 'lucide-react';

interface CounselingPromoShowcaseProps {
  onNavigateToGeneral?: () => void;
  onNavigateToSpecialized?: () => void;
}

export const CounselingPromoShowcase: React.FC<CounselingPromoShowcaseProps> = ({
  onNavigateToGeneral,
  onNavigateToSpecialized
}) => {
  const { currentUser, consultants, crextioConfig, updateCrextioConfig } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const [activeTab, setActiveTab] = useState<'specialized' | 'general'>('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pause shifting on hover/click for 30 seconds, or resume on scroll
  const handleUserInteraction = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 30000); // 30 seconds pause
  };

  useEffect(() => {
    const handleScroll = () => {
      // Resume regular auto-shift on scroll if user is no longer holding
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
    }, 4000); // 4 seconds interval
    return () => clearInterval(interval);
  }, [isPaused]);

  // Showcase Header Titles
  const promoTitle = crextioConfig.counselingPromoTitle || 'درگاه جامع خدمات مشاوره نخبگان فقه و قضا';
  const promoSubtitle = crextioConfig.counselingPromoSubtitle || 'ارائه خدمات مشاوره تخصصی شغلی-تحصیلی قضایی و مشاوره‌های روان‌شناختی، خانواده و فردی با حفظ کامل محرمانگی';

  const [editTitle, setEditTitle] = useState(promoTitle);
  const [editSubtitle, setEditSubtitle] = useState(promoSubtitle);

  // Specialized Counseling Editable Details
  const [specBadge, setSpecBadge] = useState('برنامه راهبردی ارتقاء قضایی و نخبگانی');
  const [specHeading, setSpecHeading] = useState('هدایت مسیر نخبگی، ارتقاء پایه قضایی و آماده‌سازی اختبار محاکم تجدیدنظر');
  const [specDesc, setSpecDesc] = useState('اگر به دنبال ارتقاء به شعب دادگاه تجدیدنظر، دیوان عالی کشور، پذیرش در مقاطع دکتری حقوق، یا تدوین رساله‌های بنیادین فقهی هستید، مستشاران ارشد شما را قدم‌به‌قدم همراهی می‌کنند.');
  const [specBullets, setSpecBullets] = useState<string[]>([
    'برنامه‌ریزی دقیق ترفیع پایه قضایی',
    'تحلیل نقاط قوت و رفع ضعف در اختبار علمی',
    'مشاوره جامع موضوع‌یابی و تدوین پروپوزال دکتری',
    'جلسات شبیه‌سازی مصاحبه‌های ارتقاء مدیریتی'
  ]);

  // General Counseling Editable Details
  const [genBadge, setGenBadge] = useState('آرامش روانی، سلامت خانواده و تاب‌آوری شغلی');
  const [genHeading, setGenHeading] = useState('خدمات روان‌شناختی، زوج‌درمانی، فرزندپروری و تخلیه فشارهای روانی شغل قضاوت');
  const [genDesc, setGenDesc] = useState('قضاوت و اشتغال در مراجع پرتنش نیازمند حفظ سلامت روان و نشاط خانواده است. کلینیک مشاوره فقه و قضا با حضور مجرب‌ترین روان‌شناسان و مشاوران خانواده محیطی کاملاً امن فراهم نموده است.');
  const [genBullets, setGenBullets] = useState<string[]>([
    'مشاوره پیش از ازدواج و آزمون‌های شخصیت',
    'زوج‌درمانی و بهبود روابط عاطفی همسران',
    'تکنیک‌های مدیریت استرس حاد و پیشگیری از فرسودگی شغلی',
    'مشاوره تحصیلی و تربیتی نوجوانان و فرزندان'
  ]);

  // Editable Consultants Lists
  const defaultSpecialized = consultants.filter(c => c.counselingType === 'specialized_career');
  const defaultGeneral = consultants.filter(c => c.counselingType !== 'specialized_career');

  const [specializedList, setSpecializedList] = useState<Consultant[]>(defaultSpecialized);
  const [generalList, setGeneralList] = useState<Consultant[]>(defaultGeneral);

  const handleUpdateConsultant = (listType: 'spec' | 'gen', id: string, field: keyof Consultant, val: any) => {
    if (listType === 'spec') {
      setSpecializedList(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    } else {
      setGeneralList(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    }
  };

  const handleFileUpload = (listType: 'spec' | 'gen', id: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleUpdateConsultant(listType, id, 'avatarUrl', e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePromo = () => {
    updateCrextioConfig({
      counselingPromoTitle: editTitle,
      counselingPromoSubtitle: editSubtitle
    });
    setIsEditModalOpen(false);
  };

  return (
    <div
      onMouseEnter={handleUserInteraction}
      onClick={handleUserInteraction}
      className="w-full relative overflow-hidden rounded-[32px] bg-[#FCFCFA] border border-stone-200/90 shadow-sm p-5 sm:p-7 text-stone-900 space-y-5"
    >
      {/* Header and Toggle */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>ویترین نمایشگاهی مشاوره و هدایت نخبگان</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-700" /> محرمانگی ۱۰۰٪
            </span>
            {isPaused && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                <Pause className="w-3 h-3 text-amber-700" /> چرخش خودکار به مدت ۳۰ ثانیه متوقف شد
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
            {promoTitle}
          </h3>
          <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
            {promoSubtitle}
          </p>
        </div>

        {/* Tab switchers & Admin edit button */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>ویرایش ۱۰۰٪ محتوای مشاوره</span>
            </button>
          )}

          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => {
                setActiveTab('general');
                handleUserInteraction();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'general'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>مشاوره عمومی و خانواده</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('specialized');
                handleUserInteraction();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'specialized'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>مشاوره تخصصی شغلی و تحصیلی</span>
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
            <div className="lg:col-span-2 rounded-2xl bg-[#FFFDF7] p-5 border border-amber-200/90 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>{specBadge}</span>
                  </span>
                  <span className="text-[11px] text-amber-800 font-bold">
                    نوبت‌دهی آنلاین با اساتید طراز اول
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                  {specHeading}
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {specDesc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {specBullets.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-stone-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-amber-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-stone-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>مدت هر نشست: ۴۵ دقیقه · حضوری یا تصویری امن</span>
                </div>
                <button
                  onClick={onNavigateToSpecialized}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>رزرو مشاوره تخصصی شغلی و تحصیلی</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Counselors Preview */}
            <div className="rounded-2xl bg-white p-4 border border-stone-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <span className="text-xs font-black text-stone-800 block">
                  مشاوران برگزیده هدایت شغلی:
                </span>
                <div className="space-y-2">
                  {specializedList.slice(0, 2).map(c => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2.5">
                      <img
                        src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                        alt={c.name}
                        className="w-11 h-11 rounded-xl object-cover object-top border border-amber-300 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-stone-900 truncate">{c.name}</div>
                        <div className="text-[11px] text-amber-800 font-medium truncate">{c.title}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{c.experienceYears} سال سابقه قضایی</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onNavigateToSpecialized}
                className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-bold transition-all text-center cursor-pointer border border-stone-200"
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
            <div className="lg:col-span-2 rounded-2xl bg-[#FFF9FA] p-5 border border-rose-200/90 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-black border border-rose-300 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-700" />
                    <span>{genBadge}</span>
                  </span>
                  <span className="text-[11px] text-rose-800 font-bold">
                    یارانه ویژه ۷۰ درصدی کانون نخبگان
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                  {genHeading}
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {genDesc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {genBullets.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-stone-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-rose-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-stone-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                  <span>پرونده الکترونیک محرمانه بدون دسترسی شخص ثالث</span>
                </div>
                <button
                  onClick={onNavigateToGeneral}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>رزرو مشاوره عمومی و فردی</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Counselors Preview */}
            <div className="rounded-2xl bg-white p-4 border border-stone-200 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <span className="text-xs font-black text-stone-800 block">
                  مشاوران و درمانگران برگزیده:
                </span>
                <div className="space-y-2">
                  {generalList.slice(0, 2).map(c => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center gap-2.5">
                      <img
                        src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                        alt={c.name}
                        className="w-11 h-11 rounded-xl object-cover object-top border border-rose-300 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-stone-900 truncate">{c.name}</div>
                        <div className="text-[11px] text-rose-800 font-medium truncate">{c.title}</div>
                        <div className="text-[10px] text-stone-500 mt-0.5">{c.specialty}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={onNavigateToGeneral}
                className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-bold transition-all text-center cursor-pointer border border-stone-200"
              >
                مشاهده اسامی همه مشاوران خانواده
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Promo & Consultant Full Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-700" />
                  <h4 className="font-black text-sm text-stone-900">
                    ویرایش ۱۰۰٪ محتوای هردو بخش مشاوره تخصصی و عمومی
                  </h4>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
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
                  <span>ویرایش محتوای «مشاوره عمومی و خانواده»:</span>
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

              {/* Edit Consultants Photos & Details */}
              <div className="space-y-3 pt-2 border-t border-stone-200 text-xs">
                <h5 className="font-black text-xs text-stone-900">
                  ویرایش اسامی، سمت و آپلود عکس مشاوران شغلی و عمومی:
                </h5>
                <div className="space-y-2">
                  {specializedList.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                          alt={c.name}
                          className="w-9 h-9 rounded-lg object-cover border border-amber-300 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <label className="text-[10px] text-stone-500 block">مشاور شغلی:</label>
                          <input
                            type="text"
                            value={c.name}
                            onChange={e => handleUpdateConsultant('spec', c.id, 'name', e.target.value)}
                            className="w-full p-1 text-xs font-bold bg-white rounded border border-stone-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">سمت:</label>
                        <input
                          type="text"
                          value={c.title}
                          onChange={e => handleUpdateConsultant('spec', c.id, 'title', e.target.value)}
                          className="w-full p-1 text-xs bg-white rounded border border-stone-300"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">سابقه (سال):</label>
                        <input
                          type="number"
                          value={c.experienceYears}
                          onChange={e => handleUpdateConsultant('spec', c.id, 'experienceYears', parseInt(e.target.value) || 0)}
                          className="w-full p-1 text-xs bg-white rounded border border-stone-300"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">آپلود عکس:</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded cursor-pointer w-fit">
                          <Camera className="w-3 h-3 text-amber-700" />
                          <span>انتخاب فایل عکس</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleFileUpload('spec', c.id, e.target.files[0])}
                          />
                        </label>
                      </div>
                    </div>
                  ))}

                  {generalList.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                          alt={c.name}
                          className="w-9 h-9 rounded-lg object-cover border border-rose-300 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <label className="text-[10px] text-stone-500 block">مشاور خانواده:</label>
                          <input
                            type="text"
                            value={c.name}
                            onChange={e => handleUpdateConsultant('gen', c.id, 'name', e.target.value)}
                            className="w-full p-1 text-xs font-bold bg-white rounded border border-stone-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">تخصص:</label>
                        <input
                          type="text"
                          value={c.specialty}
                          onChange={e => handleUpdateConsultant('gen', c.id, 'specialty', e.target.value)}
                          className="w-full p-1 text-xs bg-white rounded border border-stone-300"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">عنوان:</label>
                        <input
                          type="text"
                          value={c.title}
                          onChange={e => handleUpdateConsultant('gen', c.id, 'title', e.target.value)}
                          className="w-full p-1 text-xs bg-white rounded border border-stone-300"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">آپلود عکس:</label>
                        <label className="flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded cursor-pointer w-fit">
                          <Camera className="w-3 h-3 text-rose-700" />
                          <span>انتخاب فایل عکس</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleFileUpload('gen', c.id, e.target.files[0])}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleSavePromo}
                  className="px-6 py-2 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  ذخیره تغییرات ۱۰۰٪ محتوا
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

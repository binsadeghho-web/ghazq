import React, { useState, useEffect } from 'react';
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
  Trash2
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

  // چرخه تکرارشونده هر ۲ ثانیه بین مشاوره عمومی و مشاوره تخصصی
  const [activeTab, setActiveTab] = useState<'specialized' | 'general'>('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab(prev => (prev === 'general' ? 'specialized' : 'general'));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const promoTitle =
    crextioConfig.counselingPromoTitle ||
    'درگاه جامع خدمات مشاوره نخبگان فقه و قضا';
  const promoSubtitle =
    crextioConfig.counselingPromoSubtitle ||
    'ارائه خدمات مشاوره تخصصی شغلی-تحصیلی قضایی و مشاوره‌های روان‌شناختی، خانواده و فردی با حفظ کامل محرمانگی';

  const [editTitle, setEditTitle] = useState(promoTitle);
  const [editSubtitle, setEditSubtitle] = useState(promoSubtitle);

  // فهرست مشاوران قابل ویرایش درون ویترین
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

  const handleResetPromo = () => {
    const defaultT = 'درگاه جامع خدمات مشاوره نخبگان فقه و قضا';
    const defaultS =
      'ارائه خدمات مشاوره تخصصی شغلی-تحصیلی قضایی و مشاوره‌های روان‌شناختی، خانواده و فردی با حفظ کامل محرمانگی';
    setEditTitle(defaultT);
    setEditSubtitle(defaultS);
    setSpecializedList(defaultSpecialized);
    setGeneralList(defaultGeneral);
    updateCrextioConfig({
      counselingPromoTitle: defaultT,
      counselingPromoSubtitle: defaultS
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-[32px] bg-[#FCFCFA] border border-stone-200/90 shadow-sm p-5 sm:p-7 text-stone-900 space-y-5">
      {/* Header and Toggle */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>ویترین نمایشگاهی مشاوره و هدایت نخبگان</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-700" /> محرمانگی ۱۰۰٪
            </span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>ویرایش ویترین و مشاوران</span>
            </button>
          )}

          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200">
            <button
              onClick={() => setActiveTab('general')}
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
              onClick={() => setActiveTab('specialized')}
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
            {/* Feature Card 1 */}
            <div className="lg:col-span-2 rounded-2xl bg-[#FFFDF7] p-5 border border-amber-200/90 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-700" />
                    <span>برنامه راهبردی ارتقاء قضایی و نخبگانی</span>
                  </span>
                  <span className="text-[11px] text-amber-800 font-bold">
                    نوبت‌دهی آنلاین با اساتید طراز اول
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                  هدایت مسیر نخبگی، ارتقاء پایه قضایی و آماده‌سازی اختبار محاکم تجدیدنظر
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed">
                  اگر به دنبال ارتقاء به شعب دادگاه تجدیدنظر، دیوان عالی کشور، پذیرش در مقاطع دکتری حقوق، یا تدوین رساله‌های بنیادین فقهی هستید، مستشاران ارشد شما را قدم‌به‌قدم همراهی می‌کنند.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    'برنامه‌ریزی دقیق ترفیع پایه قضایی',
                    'تحلیل نقاط قوت و رفع ضعف در اختبار علمی',
                    'مشاوره جامع موضوع‌یابی و تدوین پروپوزال دکتری',
                    'جلسات شبیه‌سازی مصاحبه‌های ارتقاء مدیریتی'
                  ].map((item, idx) => (
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
            {/* Feature Card 2 */}
            <div className="lg:col-span-2 rounded-2xl bg-[#FFF9FA] p-5 border border-rose-200/90 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-black border border-rose-300 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-700" />
                    <span>آرامش روانی، سلامت خانواده و تاب‌آوری شغلی</span>
                  </span>
                  <span className="text-[11px] text-rose-800 font-bold">
                    یارانه ویژه ۷۰ درصدی کانون نخبگان
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                  خدمات روان‌شناختی، زوج‌درمانی، فرزندپروری و تخلیه فشارهای روانی شغل قضاوت
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed">
                  قضاوت و اشتغال در مراجع پرتنش نیازمند حفظ سلامت روان و نشاط خانواده است. کلینیک مشاوره فقه و قضا با حضور مجرب‌ترین روان‌شناسان و مشاوران خانواده حوزه و دانشگاه محیطی کاملاً امن و محرمانه فراهم نموده است.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    'مشاوره پیش از ازدواج و آزمون‌های شخصیت',
                    'زوج‌درمانی و بهبود روابط عاطفی همسران',
                    'تکنیک‌های مدیریت استرس حاد و پیشگیری از فرسودگی شغلی',
                    'مشاوره تحصیلی و تربیتی نوجوانان و فرزندان'
                  ].map((item, idx) => (
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
          <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-700" />
                  <h4 className="font-black text-sm text-stone-900">
                    ویرایش کامل ویترین مشاوره و مشخصات و عکس مشاوران
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

              {/* Edit Consultants (Names, Titles, and Photos!) */}
              <div className="space-y-3 pt-2 border-t border-stone-200 text-xs">
                <h5 className="font-black text-xs text-stone-900">
                  ویرایش مشخصات و عکس مشاوران تخصصی شغلی:
                </h5>
                <div className="space-y-2.5">
                  {specializedList.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                          alt={c.name}
                          className="w-10 h-10 rounded-lg object-cover object-top border border-amber-300"
                        />
                        <div className="min-w-0 flex-1">
                          <label className="text-[10px] text-stone-500 block">نام مشاور:</label>
                          <input
                            type="text"
                            value={c.name}
                            onChange={e => handleUpdateConsultant('spec', c.id, 'name', e.target.value)}
                            className="w-full p-1 text-xs font-bold bg-white rounded border border-stone-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block">سمت قضایی/علمی:</label>
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
                        <label className="text-[10px] text-stone-500 block">آدرس یا آپلود عکس مشاور:</label>
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={c.avatarUrl || ''}
                            placeholder="/assets/cleric_portrait.jpg"
                            onChange={e => handleUpdateConsultant('spec', c.id, 'avatarUrl', e.target.value)}
                            className="w-full p-1 text-[10px] font-mono bg-white rounded border border-stone-300"
                          />
                          <label className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded cursor-pointer w-fit">
                            <Camera className="w-3 h-3 text-amber-700" />
                            <span>انتخاب عکس از دستگاه</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => e.target.files?.[0] && handleFileUpload('spec', c.id, e.target.files[0])}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h5 className="font-black text-xs text-stone-900 pt-3">
                  ویرایش مشخصات و عکس مشاوران عمومی و خانواده:
                </h5>
                <div className="space-y-2.5">
                  {generalList.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                          alt={c.name}
                          className="w-10 h-10 rounded-lg object-cover object-top border border-rose-300"
                        />
                        <div className="min-w-0 flex-1">
                          <label className="text-[10px] text-stone-500 block">نام مشاور:</label>
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
                        <label className="text-[10px] text-stone-500 block">آدرس یا آپلود عکس مشاور:</label>
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={c.avatarUrl || ''}
                            placeholder="/assets/cleric_portrait.jpg"
                            onChange={e => handleUpdateConsultant('gen', c.id, 'avatarUrl', e.target.value)}
                            className="w-full p-1 text-[10px] font-mono bg-white rounded border border-stone-300"
                          />
                          <label className="flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded cursor-pointer w-fit">
                            <Camera className="w-3 h-3 text-rose-700" />
                            <span>انتخاب عکس از دستگاه</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => e.target.files?.[0] && handleFileUpload('gen', c.id, e.target.files[0])}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleResetPromo}
                  className="px-4 py-2 rounded-full border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی پیش‌فرض</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePromo}
                  className="px-6 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  ذخیره تغییرات ویترین و عکس‌ها
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

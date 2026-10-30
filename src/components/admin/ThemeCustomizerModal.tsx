import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CrextioDashboardConfig } from '../../types';
import {
  Palette,
  Layout,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  GraduationCap,
  BookOpen,
  Inbox,
  Scale,
  FileCheck,
  X,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { crextioConfig, updateCrextioConfig, resetCrextioConfig } = useApp();
  const [activeTab, setActiveTab] = useState<'modules' | 'modes' | 'styling'>('modules');
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (key: keyof CrextioDashboardConfig) => {
    updateCrextioConfig({ [key]: !crextioConfig[key] });
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-[#FCFCFA] rounded-[36px] w-full max-w-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 bg-[#F5F4EE] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
              <SlidersHorizontal className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-stone-900">سفارشی‌ساز فوق‌پیشرفته تم ۲ (پرتال دانش‌آموختگان)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                  ویژه مدیران
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                تغییر زنده و پویا در نحوه چیدمان، ویترین‌ها، کارت‌ها و نحوه نمایش بخش‌های داشبورد تم دوم
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-stone-200/80 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-stone-200 bg-[#FCFCFA]">
          <button
            onClick={() => setActiveTab('modules')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'modules'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ماژول‌ها و بخش‌های فعال</span>
          </button>
          <button
            onClick={() => setActiveTab('modes')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'modes'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>نوع نمایش و حالت گالری‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('styling')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'styling'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>رنگ‌بندی بوم و عناوین</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800 text-xs">
          
          {/* TAB 1: MODULES VISIBILITY */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              <p className="text-stone-600 font-medium leading-relaxed">
                کدام ماژول‌ها و باکس‌ها در داشبورد تم دوم نمایش داده شوند؟ با خاموش کردن هر بخش، آن قسمت از صفحه حذف خواهد شد:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'showHeroBanner' as const, title: 'بنر متحرک بالای صفحه (Hero Banner)', desc: 'باکس خوش‌آمدگویی هوشمند همراه با امواج نوری زنده', icon: Sparkles },
                  { key: 'showKpiRow' as const, title: 'کارت‌های آمار زنده (KPI Counter)', desc: 'شمارنده‌های پرونده‌ها، اعضا، آراء و کتب', icon: Sliders },
                  { key: 'showCourseShowcase' as const, title: 'ویترین اختصاصی دوره‌ها (Course Showcase)', desc: 'اسلایدر متحرک یا گالری دوره‌های علمی فقه القضا', icon: GraduationCap },
                  { key: 'showPublicationsGallery' as const, title: 'ویترین انتشارات و کتب تخصصی', desc: 'باکس جدیدترین موسوعه‌ها و درس‌گفتارهای صوتی', icon: BookOpen },
                  { key: 'showCartableSnippet' as const, title: 'کارتابل درخواست‌های اداری من', desc: 'لیست سریع آخرین پرونده‌ها و استعلام‌های ثبت‌شده', icon: Inbox },
                  { key: 'showQuickActions' as const, title: 'ماتریس دسترسی سریع (Quick Actions)', desc: 'دکمه‌های میانبر پرونده، آموزش، مشاوره، رفاهیات و تالار', icon: FileCheck },
                  { key: 'showRulingsSnippet' as const, title: 'آخرین دادنامه‌های تالار نقد آراء', desc: 'باکس خلاصه آراء برگزیده محاکم تجدیدنظر', icon: Scale },
                  { key: 'showProfileCard' as const, title: 'کارت پرونده و پرتره قاضی/دانش‌آموخته', desc: 'نمایش عکس پرسنلی، سطح و اطلاعات قضایی کاربر', icon: Eye },
                  { key: 'showPerformanceCard' as const, title: 'نوار ارزیابی و یکپارچگی SHA-256', desc: 'آمار پیشرفت رسیدگی و اصالت رمزنگاری داده‌ها', icon: CheckCircle2 }
                ].map(item => {
                  const isEnabled = crextioConfig[item.key];
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleToggle(item.key)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isEnabled
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          : 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className={`p-2.5 rounded-2xl shrink-0 ${
                        isEnabled ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-stone-900">{item.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isEnabled ? 'bg-emerald-700 text-white' : 'bg-stone-300 text-stone-700'
                          }`}>
                            {isEnabled ? 'فعال' : 'مخفی'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-normal">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MODES & LAYOUTS */}
          {activeTab === 'modes' && (
            <div className="space-y-6">
              {/* Course Showcase Mode */}
              <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-800" />
                    نحوه نمایش دوره‌های آموزشی (Course Showcase Layout)
                  </h4>
                  <span className="text-stone-500 text-[11px]">ویترین دوره‌های علمی</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { mode: 'carousel' as const, title: 'چرخشی خودکار (Slider)', desc: 'اسلایدر هوشمند متحرک تمام‌عرض با فلش و نقطه' },
                    { mode: 'grid' as const, title: 'شبکه کارتی (۳ تایی)', desc: 'نمایش همزمان تمام دوره‌های برگزیده کنار یکدیگر' },
                    { mode: 'compact' as const, title: 'فشرده و مینی‌مال (Compact)', desc: 'ارتفاع کمتر برای تمرکز بر اطلاعات پرونده‌ها' }
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => {
                        updateCrextioConfig({ courseShowcaseMode: opt.mode });
                        triggerSuccess();
                      }}
                      className={`p-3.5 rounded-2xl border text-right transition-all ${
                        crextioConfig.courseShowcaseMode === opt.mode
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-md font-bold'
                          : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <p className="font-extrabold text-xs">{opt.title}</p>
                      <p className={`text-[10px] mt-1 ${crextioConfig.courseShowcaseMode === opt.mode ? 'text-emerald-100' : 'text-stone-500'}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Publications Mode */}
              <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-800" />
                    سبک نمایش ویترین انتشارات (Publications View)
                  </h4>
                  <span className="text-stone-500 text-[11px]">موسوعه‌ها و کتب تخصصی</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { mode: 'cards' as const, title: 'کارت‌های تصویری دو ستونه', desc: 'طراحی ویژه کتاب با آیکون نفیس و قیمت به تومان' },
                    { mode: 'list' as const, title: 'لیست سطری فشرده', desc: 'نمایش نواری سریع برای کتابخانه‌های پرحجم' }
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => {
                        updateCrextioConfig({ publicationsMode: opt.mode });
                        triggerSuccess();
                      }}
                      className={`p-3.5 rounded-2xl border text-right transition-all ${
                        crextioConfig.publicationsMode === opt.mode
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-md font-bold'
                          : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <p className="font-extrabold text-xs">{opt.title}</p>
                      <p className={`text-[10px] mt-1 ${crextioConfig.publicationsMode === opt.mode ? 'text-emerald-100' : 'text-stone-500'}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STYLING & TITLES */}
          {activeTab === 'styling' && (
            <div className="space-y-5">
              {/* Canvas Theme Selector */}
              <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
                <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-800" />
                  تمپلیت رنگی بوم تم دوم (Canvas Palette Tone)
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { tone: 'warm_ivory' as const, title: 'عاجی گرم و کهربایی (پیش‌فرض)', bg: 'bg-[#F8F7F2]', border: 'border-[#E5E3D8]' },
                    { tone: 'royal_emerald' as const, title: 'زمردی تیره سلطنتی', bg: 'bg-[#182622] text-white', border: 'border-[#2A423B]' },
                    { tone: 'pure_minimal' as const, title: 'سفید مینیمال بدون حاشیه', bg: 'bg-white', border: 'border-stone-200' },
                  ].map(t => (
                    <button
                      key={t.tone}
                      onClick={() => {
                        updateCrextioConfig({ canvasTheme: t.tone });
                        triggerSuccess();
                      }}
                      className={`p-4 rounded-2xl border text-right transition-all ${
                        crextioConfig.canvasTheme === t.tone
                          ? 'ring-2 ring-emerald-600 font-bold shadow-sm'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-xl ${t.bg} ${t.border} border mb-2 flex items-center justify-center text-[10px] font-bold`}>
                        نمونه بافت
                      </div>
                      <p className="font-extrabold text-xs text-stone-900">{t.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Editable Titles */}
              <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-3">
                <h4 className="font-extrabold text-sm text-stone-900">تیتر اختصاصی هدر داشبورد</h4>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-600">عنوان اصلی:</label>
                  <input
                    type="text"
                    value={crextioConfig.heroTitle || ''}
                    onChange={e => updateCrextioConfig({ heroTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-600">زیرعنوان توضیحی:</label>
                  <input
                    type="text"
                    value={crextioConfig.heroSubtitle || ''}
                    onChange={e => updateCrextioConfig({ heroSubtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#F5F4EE] border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetCrextioConfig();
                triggerSuccess();
              }}
              className="px-4 py-2 rounded-full border border-stone-300 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی به پیش‌فرض کارخانه</span>
            </button>

            {successToast && (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                تغییرات آنی اعمال گردید
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-colors"
          >
            بستن و ذخیره نهایی
          </button>
        </div>
      </motion.div>
    </div>
  );
};

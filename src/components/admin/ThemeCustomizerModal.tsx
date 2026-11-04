import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CrextioDashboardConfig, CrextioBentoCardConfig, CrextioHeroStatItem, JudicialRuling } from '../../types';
import { DEFAULT_BENTO_CARDS, DEFAULT_HERO_STATS } from '../../data/mockData';
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
  SlidersHorizontal,
  Award,
  ArrowUp,
  ArrowDown,
  Edit3,
  Maximize2
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { crextioConfig, updateCrextioConfig, resetCrextioConfig, rulings } = useApp();
  const [activeTab, setActiveTab] = useState<'modules' | 'rulings' | 'research' | 'fonts' | 'modes' | 'styling' | 'showcase' | 'cards' | 'stats'>('modules');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
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

  const currentCards: CrextioBentoCardConfig[] = crextioConfig.bentoCardsConfig || DEFAULT_BENTO_CARDS;

  const handleCardUpdate = (updatedCards: CrextioBentoCardConfig[]) => {
    updateCrextioConfig({ bentoCardsConfig: updatedCards });
    triggerSuccess();
  };

  const moveCardUp = (index: number) => {
    if (index === 0) return;
    const newCards = [...currentCards];
    const temp = newCards[index - 1];
    newCards[index - 1] = newCards[index];
    newCards[index] = temp;
    newCards.forEach((c, idx) => { c.order = idx + 1; });
    handleCardUpdate(newCards);
  };

  const moveCardDown = (index: number) => {
    if (index === currentCards.length - 1) return;
    const newCards = [...currentCards];
    const temp = newCards[index + 1];
    newCards[index + 1] = newCards[index];
    newCards[index] = temp;
    newCards.forEach((c, idx) => { c.order = idx + 1; });
    handleCardUpdate(newCards);
  };

  const setCardSize = (id: string, size: '1-col' | '2-col' | '3-col' | 'full') => {
    const newCards = currentCards.map(c => c.id === id ? { ...c, size } : c);
    handleCardUpdate(newCards);
  };

  const setCardField = (id: string, field: keyof CrextioBentoCardConfig, val: any) => {
    const newCards = currentCards.map(c => c.id === id ? { ...c, [field]: val } : c);
    handleCardUpdate(newCards);
  };

  const setCardSubServices = (id: string, text: string) => {
    const list = text.split('\n').map(s => s.trim()).filter(Boolean);
    setCardField(id, 'subServices', list);
  };

  const toggleCardVisibility = (id: string) => {
    const newCards = currentCards.map(c => c.id === id ? { ...c, isVisible: c.isVisible === false ? true : false } : c);
    handleCardUpdate(newCards);
  };

  const currentHeroStats: CrextioHeroStatItem[] = crextioConfig.heroStatsConfig || DEFAULT_HERO_STATS;

  const handleHeroStatUpdate = (updatedStats: CrextioHeroStatItem[]) => {
    updateCrextioConfig({ heroStatsConfig: updatedStats });
    triggerSuccess();
  };

  const handleStatFieldChange = (id: string, field: keyof CrextioHeroStatItem, val: any) => {
    const updated = currentHeroStats.map(s => s.id === id ? { ...s, [field]: val } : s);
    handleHeroStatUpdate(updated);
  };

  const handleToggleStatVisibility = (id: string) => {
    const updated = currentHeroStats.map(s => s.id === id ? { ...s, isVisible: s.isVisible === false ? true : false } : s);
    handleHeroStatUpdate(updated);
  };

  const handleDeleteHeroStat = (id: string) => {
    if (currentHeroStats.length <= 1) return;
    const updated = currentHeroStats.filter(s => s.id !== id);
    handleHeroStatUpdate(updated);
  };

  const handleAddHeroStat = () => {
    const newId = `stat_${Date.now()}`;
    const newStat: CrextioHeroStatItem = {
      id: newId,
      label: 'شاخص جدید',
      val: 500,
      trend: '+۵٪ این ماه',
      icon: 'award',
      color: 'text-amber-800 bg-amber-100',
      isVisible: true
    };
    handleHeroStatUpdate([...currentHeroStats, newStat]);
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
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-stone-200 bg-[#FCFCFA] overflow-x-auto">
          <button
            onClick={() => setActiveTab('modules')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'modules'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>ماژول‌ها و بخش‌های فعال</span>
          </button>
          <button
            onClick={() => setActiveTab('rulings')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'rulings'
                ? 'border-amber-700 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-700" />
            <span>ویترین تالار آراء قضایی</span>
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'research'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>ویترین راهبری پژوهش (ترغیبی)</span>
          </button>
          <button
            onClick={() => setActiveTab('fonts')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'fonts'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Edit3 className="w-4 h-4 text-teal-700" />
            <span>سایز فونت ویترین‌ها (تفکیکی)</span>
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cards'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-700" />
            <span>چیدمان و اندازه کارت‌ها (Bento Grid)</span>
          </button>
          <button
            onClick={() => setActiveTab('modes')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
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
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'styling'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>رنگ‌بندی بوم و عناوین</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>آمار ۴‌گانه بنر دانش‌آموختگان</span>
          </button>
          <button
            onClick={() => setActiveTab('showcase')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'showcase'
                ? 'border-emerald-700 text-emerald-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>ویترین گزارش و آمار خدمات</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-800 text-xs">
          
          {/* TAB 1: MODULES VISIBILITY & SECTION RE-ORDERING */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              {/* Section Re-ordering Box */}
              <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-800" />
                    مدیریت ترتیب قرارگیری و جابه‌جایی تمام ویترین‌ها و بخش‌های داشبورد
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      updateCrextioConfig({
                        dashboardSectionOrder: [
                          'top_vip_row',
                          'course_showcase',
                          'counseling_promo',
                          'welfare_showcase',
                          'multimedia_showcase',
                          'bento_grid',
                          'books_showcase'
                        ],
                        hiddenDashboardSections: {}
                      });
                      triggerSuccess();
                    }}
                    className="px-3 py-1 rounded-full border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بازنشانی ترتیب پیش‌فرض</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  با استفاده از دکمه‌های بالا و پایین، موقعیت قرارگیری هر ویترین یا بخش را در داشبورد تغییر دهید یا هر ویترین را کاملاً مخفی نمایید:
                </p>

                {(() => {
                  const defaultOrder = [
                    'top_vip_row',
                    'rulings_showcase',
                    'research_promo',
                    'course_showcase',
                    'counseling_promo',
                    'welfare_showcase',
                    'multimedia_showcase',
                    'bento_grid',
                    'books_showcase'
                  ];
                  const sectionOrder = crextioConfig.dashboardSectionOrder && crextioConfig.dashboardSectionOrder.length > 0
                    ? crextioConfig.dashboardSectionOrder
                    : defaultOrder;
                  const hiddenMap = crextioConfig.hiddenDashboardSections || {};

                  const sectionMeta: Record<string, { title: string; desc: string }> = {
                    top_vip_row: { title: 'بنر وی‌آی‌پی بالای صفحه و کارت پرتره دانش‌آموخته', desc: 'کادر خوش‌آمدگویی هوشمند و پرتره پرسنلی قاضی/دانش‌آموخته' },
                    rulings_showcase: { title: 'ویترین تالار نقد و مناظره آراء قضایی (جدید)', desc: 'باکس تعاملی دادنامه‌های داغ، استدلال‌ها و ثبت مستقیم نقد و رأی' },
                    research_promo: { title: 'ویترین ترغیبی و تبلیغی باشگاه راهبری پژوهش (جدید)', desc: 'جذب نخبگان به رساله‌ها با گرنت ۵۰ میلیونی، اسکان و اساتید طراز اول' },
                    course_showcase: { title: 'ویترین ویژه دوره‌های علمی (اسلایدر دوره‌ها)', desc: 'اسلایدر متحرک دوره‌های توانمندسازی علمی فقه القضا' },
                    counseling_promo: { title: 'ویترین خدمات مشاوره و روانشناسی نخبگان', desc: 'درگاه مشاوره تخصصی شغلی و عمومی با اسلاید ۴ ثانیه‌ای' },
                    welfare_showcase: { title: 'ویترین خدمات رفاهی، تسهیلات و وام‌ها', desc: 'وام ۱۰۰ میلیونی، اسکان مشهد/قم، خدمات درمانی و اقلام تعاونی' },
                    multimedia_showcase: { title: 'ویترین محصولات چندرسانه‌ای و درس‌گفتارها', desc: 'درس‌گفتارهای صوتی خارج فقه القضا و ویدیوهای آموزشی' },
                    bento_grid: { title: 'ویترین جامع خدمات سامانه (Bento Grid 9 تایی)', desc: 'ماتریس کارت‌های اصلی دسترسی به ماژول‌های سامانه' },
                    books_showcase: { title: 'ویترین جامع کتب، انتشارات و منشورات تخصصی', desc: 'موسوعه‌ها، کتاب‌های مرجع فقهی و حقوقی در انتهای داشبورد' }
                  };

                  return (
                    <div className="space-y-2 pt-1">
                      {sectionOrder.map((key, idx) => {
                        const isHidden = hiddenMap[key] === true;
                        const meta = sectionMeta[key] || { title: key, desc: 'بخش داشبورد' };

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              !isHidden ? 'bg-white border-stone-200' : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                                {toPersianNumbers(idx + 1)}
                              </span>
                              <div className="min-w-0">
                                <h5 className="font-extrabold text-stone-900 text-xs truncate">{meta.title}</h5>
                                <p className="text-[10px] text-stone-500 truncate">{meta.desc}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  const newOrder = [...sectionOrder];
                                  const temp = newOrder[idx - 1];
                                  newOrder[idx - 1] = newOrder[idx];
                                  newOrder[idx] = temp;
                                  updateCrextioConfig({ dashboardSectionOrder: newOrder });
                                  triggerSuccess();
                                }}
                                title="انتقال به بالاتر"
                                className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 disabled:opacity-20 flex items-center justify-center text-stone-700 cursor-pointer"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                disabled={idx === sectionOrder.length - 1}
                                onClick={() => {
                                  const newOrder = [...sectionOrder];
                                  const temp = newOrder[idx + 1];
                                  newOrder[idx + 1] = newOrder[idx];
                                  newOrder[idx] = temp;
                                  updateCrextioConfig({ dashboardSectionOrder: newOrder });
                                  triggerSuccess();
                                }}
                                title="انتقال به پایین‌تر"
                                className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 disabled:opacity-20 flex items-center justify-center text-stone-700 cursor-pointer"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updatedHidden = { ...hiddenMap, [key]: !isHidden };
                                  updateCrextioConfig({ hiddenDashboardSections: updatedHidden });
                                  triggerSuccess();
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                                  !isHidden
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-stone-200 text-stone-600 border-stone-300'
                                }`}
                              >
                                {!isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{!isHidden ? 'نمایش' : 'مخفی'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Sub-module Toggles */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-stone-900">تنظیمات ریزماژول‌های داخل بنر و کادرها:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { key: 'showRulingsShowcase' as const, title: 'ویترین تالار نقد و مناظره آراء قضایی', desc: 'نمایش دادنامه‌های جنجالی و داغ و امکان ثبت نقد مستقیم', icon: Scale },
                    { key: 'showResearchPromoShowcase' as const, title: 'ویترین ترغیبی باشگاه راهبری رساله‌ها', desc: 'بنر مجلل ترغیب نخبگان با گرنت، اسکان و اساتید طراز اول', icon: Sparkles },
                    { key: 'showHeroBanner' as const, title: 'بنر متحرک بالای صفحه (Hero Banner)', desc: 'باکس خوش‌آمدگویی هوشمند همراه با امواج نوری زنده', icon: Sparkles },
                    { key: 'showKpiRow' as const, title: 'کارت‌های آمار زنده (KPI Counter)', desc: 'شمارنده‌های پرونده‌ها، اعضا، آراء و کتب', icon: Sliders },
                    { key: 'showCourseShowcase' as const, title: 'ویترین اختصاصی دوره‌ها (Course Showcase)', desc: 'اسلایدر متحرک یا گالری دوره‌های علمی فقه القضا', icon: GraduationCap },
                    { key: 'showCartableSnippet' as const, title: 'کارتابل درخواست‌های اداری من', desc: 'لیست سریع آخرین پرونده‌ها و استعلام‌های ثبت‌شده', icon: Inbox },
                    { key: 'showProfileCard' as const, title: 'کارت پرونده و پرتره قاضی/دانش‌آموخته', desc: 'نمایش عکس پرسنلی، سطح و اطلاعات قضایی کاربر', icon: Eye }
                  ].map(item => {
                    const isEnabled = crextioConfig[item.key];
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggle(item.key)}
                        className={`p-3.5 rounded-3xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isEnabled
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                            : 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className={`p-2 rounded-2xl shrink-0 ${
                          isEnabled ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'
                        }`}>
                          <Icon className="w-4 h-4" />
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
            </div>
          )}

          {/* TAB: RULINGS SHOWCASE MANAGEMENT (100% ADMIN CONTROL) */}
          {activeTab === 'rulings' && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                      <Scale className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-950">
                        تنظیمات و محتوای ۱۰۰٪ ویترین تالار نقد آراء قضایی
                      </h4>
                      <p className="text-[11px] text-amber-800/80 mt-0.5">
                        ویرایش کامل تیتر، زیرعنوان، نشان بالایی و روشن/خاموش کردن ویترین
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle('showRulingsShowcase')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      crextioConfig.showRulingsShowcase !== false
                        ? 'bg-amber-800 text-white'
                        : 'bg-stone-300 text-stone-700'
                    }`}
                  >
                    {crextioConfig.showRulingsShowcase !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      نشان ویژه بالای ویترین (Badge):
                    </label>
                    <input
                      type="text"
                      value={crextioConfig.rulingsShowcaseBadge || ''}
                      onChange={e => {
                        updateCrextioConfig({ rulingsShowcaseBadge: e.target.value });
                        triggerSuccess();
                      }}
                      placeholder="مثال: تالار مناظره و نقد آراء منتخب"
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      عنوان اصلی ویترین آراء:
                    </label>
                    <input
                      type="text"
                      value={crextioConfig.rulingsShowcaseTitle || ''}
                      onChange={e => {
                        updateCrextioConfig({ rulingsShowcaseTitle: e.target.value });
                        triggerSuccess();
                      }}
                      placeholder="مثال: تالار نقد، ارزیابی و مباحثه آراء و دادنامه‌های قضایی"
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      حالت پیش‌فرض نمایش ویترین آراء (اصلاح ۳):
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          updateCrextioConfig({ rulingsShowcaseMode: 'expanded' });
                          triggerSuccess();
                        }}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          crextioConfig.rulingsShowcaseMode !== 'compact'
                            ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className="block font-black text-xs">۱. حالت تفصیلی و کامل (دو ستونه)</span>
                        <span className="text-[10px] text-stone-500 font-normal">نمایش فهرست آراء + پنل نقد و مباحثه زنده و قواعد فقهی</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateCrextioConfig({ rulingsShowcaseMode: 'compact' });
                          triggerSuccess();
                        }}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                          crextioConfig.rulingsShowcaseMode === 'compact'
                            ? 'bg-amber-100 text-amber-950 border-amber-400 font-black shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className="block font-black text-xs">۲. حالت مختصر و فشرده (شبکه ۳ تایی)</span>
                        <span className="text-[10px] text-stone-500 font-normal">کارت‌های مختصر افقی متناسب با مرور سریع و اشغال کمتر صفحه</span>
                      </button>
                    </div>
                  </div>

                  {/* آرای قضایی قابل ویرایش ۱۰۰ درصدی */}
                  <div className="pt-3 border-t border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-xs text-amber-950 block">
                        فهرست دادنامه‌های اختصاصی ویترین (ویرایش ۱۰۰٪ متن، شعب و آراء):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentList = crextioConfig.rulingsCustomList || rulings;
                          const newRulingItem: JudicialRuling = {
                            id: `rul_${Date.now()}`,
                            title: 'دادنامه جدید: عدم نفوذ شرط وجه التزام گزاف در قراردادهای الحاقی',
                            courtBranch: 'شعبه تخصصی دیوان عالی کشور',
                            judgeName: 'دکتر علیرضا میرزایی',
                            rulingDate: '۱۴۰۳/۰۸/۰۵',
                            caseType: 'civil',
                            caseTypeTitle: 'حقوقی و قراردادها',
                            summary: 'دادگاه با بررسی موازین انصاف و منع سوءاستفاده از حق، تعهدات نامتعارف الحاقی را تحدید نمود.',
                            fullRulingText: 'متن رأی صادر شده جهت مباحثه حقوقدانان...',
                            legalPrinciples: ['قاعده لاضرر و لاضرار', 'ماده ۹۷۵ قانون مدنی و نظم عمومی'],
                            status: 'selected',
                            submittedById: 'usr_admin',
                            submittedByName: 'مدیر سامانه',
                            likesCount: 12,
                            likedBy: [],
                            discussions: []
                          };
                          updateCrextioConfig({ rulingsCustomList: [newRulingItem, ...currentList] });
                          triggerSuccess();
                        }}
                        className="px-3 py-1 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] cursor-pointer"
                      >
                        + افزودن رأی جدید به ویترین
                      </button>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {(crextioConfig.rulingsCustomList || rulings).map((r, idx) => (
                        <div key={r.id} className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-[10px]">
                              {toPersianNumbers(idx + 1)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentList = (crextioConfig.rulingsCustomList || rulings).filter(item => item.id !== r.id);
                                updateCrextioConfig({ rulingsCustomList: currentList });
                                triggerSuccess();
                              }}
                              className="text-[10px] text-red-600 hover:text-red-800 font-bold"
                            >
                              حذف این دادنامه
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-stone-500 font-bold block mb-0.5">عنوان دادنامه:</label>
                              <input
                                type="text"
                                value={r.title}
                                onChange={e => {
                                  const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                                  const target = currentList.find(item => item.id === r.id);
                                  if (target) {
                                    target.title = e.target.value;
                                    updateCrextioConfig({ rulingsCustomList: currentList });
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-stone-500 font-bold block mb-0.5">مرجع صدور و شعبه:</label>
                              <input
                                type="text"
                                value={r.courtBranch}
                                onChange={e => {
                                  const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                                  const target = currentList.find(item => item.id === r.id);
                                  if (target) {
                                    target.courtBranch = e.target.value;
                                    updateCrextioConfig({ rulingsCustomList: currentList });
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 font-bold block mb-0.5">چکیده استنباط حقوقی:</label>
                            <textarea
                              rows={2}
                              value={r.summary}
                              onChange={e => {
                                const currentList = [...(crextioConfig.rulingsCustomList || rulings)];
                                const target = currentList.find(item => item.id === r.id);
                                if (target) {
                                  target.summary = e.target.value;
                                  updateCrextioConfig({ rulingsCustomList: currentList });
                                }
                              }}
                              className="w-full p-2 rounded-xl border border-stone-200 text-xs text-stone-800"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RESEARCH PROMO MANAGEMENT (100% ADMIN CONTROL & CLICK ACTIONS) */}
          {activeTab === 'research' && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5 text-emerald-800" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950">
                        تنظیمات و محتوای ۱۰۰٪ ویترین ترغیبی راهبری پژوهش و رساله‌ها
                      </h4>
                      <p className="text-[11px] text-emerald-800/80 mt-0.5">
                        رویکرد ترغیبی و تبلیغی، ویرایش متن‌ها، کارت‌های ۴گانه و اکشن کلیک‌ها
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
                      <label className="font-bold text-stone-700 block mb-1">
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
                      <label className="font-bold text-stone-700 block mb-1">
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

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
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
                    <label className="font-bold text-stone-700 block mb-1">
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

                  {/* تنظیمات دکمه‌های اقدام و کلیک‌ها (اصلاح ۱) */}
                  <div className="pt-3 border-t border-emerald-200/80 space-y-3">
                    <h5 className="font-black text-xs text-emerald-950">
                      تنظیمات دکمه‌های اکشن و کلیک‌های ویترین پژوهش:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-white border border-stone-200 space-y-2">
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
                      </div>

                      <div className="p-3 rounded-2xl bg-white border border-stone-200 space-y-2">
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
                      </div>
                    </div>
                  </div>

                  {/* ویرایش ۱۰۰ درصدی کارت‌های ۴‌گانه ویترین پژوهش */}
                  <div className="pt-3 border-t border-emerald-200/80 space-y-3">
                    <h5 className="font-black text-xs text-emerald-950">
                      ویرایش عناوین، توضیحات، نشان و کلیک‌های هر ۴ کارت ویترین پژوهش:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(crextioConfig.researchPromoCards || [
                        { id: 'card_grant', title: 'تخصیص گرنت مالی بلاعوض', desc: 'کمک‌هزینه ویژه تأمین منابع، خرید کتب مرجع فقهی و مصاحبه با صاحب‌نظران تا سقف ۵۰ میلیون تومان.', tag: 'بلاعوض نخبگان', clickAction: 'quick_modal' },
                        { id: 'card_supervisor', title: 'استاد راهنمای اختصاصی طراز اول', desc: 'همراهی گام‌به‌گام مراجع فقهی، قضات عالی‌رتبه دیوان عالی و اساتید دکتری در ویراستاری فصول.', tag: 'استاد معین', clickAction: 'navigate_research' },
                        { id: 'card_accommodation', title: 'اسکان پژوهشی رایگان مشهد و قم', desc: 'اقامت اختصاصی برای پژوهشگر و خانواده در جوار کتابخانه‌های مرجع فیضیه، آستان قدس و دانشگاه.', tag: 'اقامت تا ۱۰ روز', clickAction: 'quick_modal' },
                        { id: 'card_publish', title: 'چاپ سراسری کتاب و موسوعه', desc: 'تبدیل رساله برگزیده به اثر فاخر کتابخانه‌ای با نشان مرکز و پخش در مجتمع‌های قضایی کشور.', tag: 'انتشار رسمی', clickAction: 'navigate_research' }
                      ]).map((c, cIdx) => (
                        <div key={c.id} className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2">
                          <div className="flex items-center justify-between text-stone-500 text-[11px] font-bold">
                            <span>کارت شماره {toPersianNumbers(cIdx + 1)}</span>
                            <span className="text-emerald-700">شناسه: {c.id}</span>
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-600 font-bold block mb-0.5">عنوان کارت:</label>
                            <input
                              type="text"
                              value={c.title}
                              onChange={e => {
                                const newCards = [...(crextioConfig.researchPromoCards || [])];
                                const target = newCards.find(item => item.id === c.id);
                                if (target) {
                                  target.title = e.target.value;
                                  updateCrextioConfig({ researchPromoCards: newCards });
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-600 font-bold block mb-0.5">برچسب کوچک (Tag):</label>
                            <input
                              type="text"
                              value={c.tag}
                              onChange={e => {
                                const newCards = [...(crextioConfig.researchPromoCards || [])];
                                const target = newCards.find(item => item.id === c.id);
                                if (target) {
                                  target.tag = e.target.value;
                                  updateCrextioConfig({ researchPromoCards: newCards });
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-amber-800"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-600 font-bold block mb-0.5">شرح و توضیح کارت:</label>
                            <textarea
                              rows={2}
                              value={c.desc}
                              onChange={e => {
                                const newCards = [...(crextioConfig.researchPromoCards || [])];
                                const target = newCards.find(item => item.id === c.id);
                                if (target) {
                                  target.desc = e.target.value;
                                  updateCrextioConfig({ researchPromoCards: newCards });
                                }
                              }}
                              className="w-full p-2 rounded-xl border border-stone-200 text-xs text-stone-700"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-600 font-bold block mb-0.5">عملکرد کلیک روی کارت:</label>
                            <select
                              value={c.clickAction || 'quick_modal'}
                              onChange={e => {
                                const newCards = [...(crextioConfig.researchPromoCards || [])];
                                const target = newCards.find(item => item.id === c.id);
                                if (target) {
                                  target.clickAction = e.target.value as any;
                                  updateCrextioConfig({ researchPromoCards: newCards });
                                }
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800"
                            >
                              <option value="quick_modal">باز شدن مودال ثبت فوری پروپوزال</option>
                              <option value="navigate_research">انتقال به میز کار پژوهش</option>
                              <option value="none">بدون کلیک (فقط نمایشی)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FONT SIZES BY SECTION & TEXT TYPE (اصلاح ۴: کنترل تفکیکی سایز فونت‌ها) */}
          {activeTab === 'fonts' && (
            <div className="space-y-5">
              <div className="p-5 rounded-3xl bg-teal-50/80 border border-teal-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-teal-200 text-teal-900 flex items-center justify-center font-bold">
                      <Edit3 className="w-5 h-5 text-teal-800" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-teal-950">
                        تنظیمات تفکیکی سایز فونت متون در تمامی ویترین‌های داشبورد
                      </h4>
                      <p className="text-[11px] text-teal-800/80 mt-0.5">
                        امکان تنظیم مجزای اندازه تیترها، زیرعنوان‌ها، متن‌های بدنه و برچسب‌های کارت‌ها
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* 1. Rulings Showcase Fonts */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                    <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-700" />
                      <span>ویترین تالار آراء قضایی</span>
                    </h5>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه تیتر اصلی ویترین آراء:</label>
                      <select
                        value={crextioConfig.fontSizes?.rulingsTitle || 'text-lg'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              rulingsTitle: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-sm">کوچک (14px)</option>
                        <option value="text-base">متوسط استاندارد (16px)</option>
                        <option value="text-lg">بزرگ (18px - پیش‌فرض)</option>
                        <option value="text-xl">خیلی بزرگ (20px)</option>
                        <option value="text-2xl">برجسته ویژه (24px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه متن بدنه و چکیده‌ها:</label>
                      <select
                        value={crextioConfig.fontSizes?.rulingsBody || 'text-xs'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              rulingsBody: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-[10px]">بسیار ریز (10px)</option>
                        <option value="text-[11px]">ریز بهینه (11px)</option>
                        <option value="text-xs">استاندارد (12px - پیش‌فرض)</option>
                        <option value="text-sm">خوانا و درشت (14px)</option>
                      </select>
                    </div>
                  </div>

                  {/* 2. Research Promo Showcase Fonts */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                    <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                      <span>ویترین ترغیبی راهبری پژوهش</span>
                    </h5>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه عنوان جذاب پژوهش:</label>
                      <select
                        value={crextioConfig.fontSizes?.researchTitle || 'text-2xl'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              researchTitle: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-base">متوسط (16px)</option>
                        <option value="text-lg">بزرگ (18px)</option>
                        <option value="text-xl">خیلی بزرگ (20px)</option>
                        <option value="text-2xl">بسیار درشت (24px - پیش‌فرض)</option>
                        <option value="text-3xl">حداکثر برجستگی (30px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">اندازه زیرعنوان و کارت‌ها:</label>
                      <select
                        value={crextioConfig.fontSizes?.researchBody || 'text-xs'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              researchBody: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-[10px]">بسیار ریز (10px)</option>
                        <option value="text-[11px]">ریز بهینه (11px)</option>
                        <option value="text-xs">استاندارد (12px - پیش‌فرض)</option>
                        <option value="text-sm">خوانا و درشت (14px)</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Hero VIP Banner Fonts */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                    <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-teal-700" />
                      <span>بنر وی‌آی‌پی خوش‌آمدگویی هدر</span>
                    </h5>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز تیتر خوش‌آمدگویی:</label>
                      <select
                        value={crextioConfig.fontSizes?.heroTitle || 'text-2xl'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              heroTitle: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-lg">متوسط (18px)</option>
                        <option value="text-xl">بزرگ (20px)</option>
                        <option value="text-2xl">بسیار درشت (24px - پیش‌فرض)</option>
                        <option value="text-3xl">عظیم (30px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز متن سمت و سازمان:</label>
                      <select
                        value={crextioConfig.fontSizes?.heroSubtitle || 'text-xs'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              heroSubtitle: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-[10px]">بسیار ریز (10px)</option>
                        <option value="text-[11px]">ریز (11px)</option>
                        <option value="text-xs">استاندارد (12px - پیش‌فرض)</option>
                        <option value="text-sm">درشت (14px)</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Bento Grid Cards Fonts */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                    <h5 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-700" />
                      <span>کارت‌های شبکه ۹‌گانه (Bento Grid)</span>
                    </h5>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز عناوین کارت‌های خدمات:</label>
                      <select
                        value={crextioConfig.fontSizes?.cardTitles || 'text-sm'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              cardTitles: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-xs">ریز (12px)</option>
                        <option value="text-sm">استاندارد (14px - پیش‌فرض)</option>
                        <option value="text-base">بزرگ (16px)</option>
                        <option value="text-lg">خیلی بزرگ (18px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">سایز زیرعناوین و زیرخدمات:</label>
                      <select
                        value={crextioConfig.fontSizes?.cardSubtitles || 'text-[11px]'}
                        onChange={e => {
                          updateCrextioConfig({
                            fontSizes: {
                              ...crextioConfig.fontSizes,
                              cardSubtitles: e.target.value as any
                            }
                          });
                          triggerSuccess();
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                      >
                        <option value="text-[10px]">بسیار ریز (10px)</option>
                        <option value="text-[11px]">ریز بهینه (11px - پیش‌فرض)</option>
                        <option value="text-xs">استاندارد (12px)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BENTO CARDS MANAGEMENT */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-800" />
                    مدیریت چیدمان، اندازه و محتوای کارت‌های ۹‌گانه (Bento Grid)
                  </h4>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">
                    تعیین موقعیت (ترتیب)، سایز ستونی در شبکه، تیترها و زیرخدمات نمایش داده‌شده در هر کارت
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCardUpdate(DEFAULT_BENTO_CARDS);
                  }}
                  className="px-3 py-1.5 rounded-full border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پیش‌فرض کارت‌ها</span>
                </button>
              </div>

              <div className="space-y-3">
                {currentCards.map((card, idx) => {
                  const isEditing = editingCardId === card.id;
                  const isVisible = card.isVisible !== false;

                  return (
                    <div
                      key={card.id}
                      className={`p-4 rounded-3xl border transition-all ${
                        isVisible
                          ? 'bg-stone-50 border-stone-200'
                          : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                      }`}
                    >
                      {/* Card Header row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Order badges & movement buttons */}
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-stone-200 shadow-2xs">
                            <span className="font-black text-xs text-stone-700 min-w-4 text-center">
                              {toPersianNumbers(idx + 1)}
                            </span>
                            <div className="flex flex-col gap-0.5 mr-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveCardUp(idx)}
                                title="انتقال به بالا"
                                className="w-4 h-4 flex items-center justify-center rounded hover:bg-stone-100 disabled:opacity-20 text-stone-600"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === currentCards.length - 1}
                                onClick={() => moveCardDown(idx)}
                                title="انتقال به پایین"
                                className="w-4 h-4 flex items-center justify-center rounded hover:bg-stone-100 disabled:opacity-20 text-stone-600"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                                {card.title}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                style={{
                                  borderColor: card.accentColor,
                                  color: card.accentColor,
                                  backgroundColor: `${card.accentColor}10`
                                }}
                              >
                                {card.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              {card.subtext}
                            </p>
                          </div>
                        </div>

                        {/* Quick Size and Edit controls */}
                        <div className="flex items-center gap-2">
                          {/* Size Selector */}
                          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-stone-200">
                            {[
                              { key: '1-col', label: '۱ ستون' },
                              { key: '2-col', label: '۲ ستون' },
                              { key: '3-col', label: '۳ ستون' },
                              { key: 'full', label: 'کامل' }
                            ].map(sz => (
                              <button
                                key={sz.key}
                                type="button"
                                onClick={() => setCardSize(card.id, sz.key as any)}
                                className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all ${
                                  card.size === sz.key
                                    ? 'bg-emerald-800 text-white shadow-xs'
                                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                                }`}
                              >
                                {sz.label}
                              </button>
                            ))}
                          </div>

                          {/* Visibility button */}
                          <button
                            type="button"
                            onClick={() => toggleCardVisibility(card.id)}
                            className={`p-2 rounded-2xl border transition-colors ${
                              isVisible
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-stone-200 border-stone-300 text-stone-500'
                            }`}
                            title={isVisible ? 'مخفی کردن کارت' : 'نمایش کارت'}
                          >
                            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Edit Details Accordion Toggle */}
                          <button
                            type="button"
                            onClick={() => setEditingCardId(isEditing ? null : card.id)}
                            className={`px-3 py-1.5 rounded-2xl border text-[11px] font-bold flex items-center gap-1 transition-all ${
                              isEditing
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEditing ? 'بستن فرم' : 'ویرایش متن'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Editing Form when opened */}
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-stone-200 space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="font-bold text-stone-700 block mb-1">عنوان کارت:</label>
                                <input
                                  type="text"
                                  value={card.title}
                                  onChange={e => setCardField(card.id, 'title', e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="font-bold text-stone-700 block mb-1">نشان ویژه (Badge):</label>
                                <input
                                  type="text"
                                  value={card.badge}
                                  onChange={e => setCardField(card.id, 'badge', e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-emerald-600"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="font-bold text-stone-700 block mb-1">توضیح کوتاه زیر عنوان:</label>
                              <input
                                type="text"
                                value={card.subtext}
                                onChange={e => setCardField(card.id, 'subtext', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-800 focus:outline-emerald-600"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-stone-700 block mb-1">
                                فهرست خدمات زیرمجموعه (هر خط یک خدمت):
                              </label>
                              <textarea
                                rows={3}
                                value={card.subServices ? card.subServices.join('\n') : ''}
                                onChange={e => setCardSubServices(card.id, e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-800 focus:outline-emerald-600 leading-relaxed"
                                placeholder="خدمت اول&#10;خدمت دوم&#10;خدمت سوم"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: HERO STATS MANAGEMENT */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-800" />
                    مدیریت آمار و شاخص‌های بنر دانش‌آموختگان (VIP Hero Stats)
                  </h4>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    تعیین عناوین، ارقام (شمارش از ۰ تا عدد نهایی)، روندهای رشد و مدیریت نمایش یا حذف هر شاخص
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddHeroStat}
                    className="px-3 py-1.5 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <span>+ افزودن شاخص</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleHeroStatUpdate(DEFAULT_HERO_STATS);
                    }}
                    className="px-3 py-1.5 rounded-full border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>پیش‌فرض</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {currentHeroStats.map((stat, idx) => {
                  const isVisible = stat.isVisible !== false;

                  return (
                    <div
                      key={stat.id}
                      className={`p-4 rounded-3xl border transition-all ${
                        isVisible
                          ? 'bg-stone-50 border-stone-200'
                          : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-xs font-black text-stone-700">
                            {toPersianNumbers(idx + 1)}
                          </span>
                          <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                            {stat.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatVisibility(stat.id)}
                            className={`p-1.5 rounded-xl border transition-colors ${
                              isVisible
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-stone-200 text-stone-600 border-stone-300'
                            }`}
                            title={isVisible ? 'مخفی کردن' : 'نمایش مجدد'}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHeroStat(stat.id)}
                            className="p-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                            title="حذف شاخص"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">
                            عنوان شاخص:
                          </label>
                          <input
                            type="text"
                            value={stat.label}
                            onChange={e => handleStatFieldChange(stat.id, 'label', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">
                            مقدار عددی هدف (شمارش از صفر):
                          </label>
                          <input
                            type="number"
                            value={stat.val}
                            onChange={e =>
                              handleStatFieldChange(stat.id, 'val', parseInt(e.target.value) || 0)
                            }
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-black text-stone-900 focus:outline-emerald-600"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">
                            برچسب روند/رشد:
                          </label>
                          <input
                            type="text"
                            value={stat.trend}
                            onChange={e => handleStatFieldChange(stat.id, 'trend', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-bold text-emerald-800 focus:outline-emerald-600"
                          />
                        </div>
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

          {/* TAB 4: SHOWCASE REPORT & STATS MANAGEMENT */}
          {activeTab === 'showcase' && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-[#F5F4EE] border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-800" />
                    مدیریت ویترین گزارش خدمات و ارقام آماری
                  </h4>
                  <button
                    onClick={() => handleToggle('showShowcaseSection')}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      crextioConfig.showShowcaseSection !== false
                        ? 'bg-emerald-800 text-white'
                        : 'bg-stone-300 text-stone-700'
                    }`}
                  >
                    {crextioConfig.showShowcaseSection !== false ? 'نمایش ویترین: فعال' : 'نمایش ویترین: مخفی'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">عنوان ویترین گزارش خدمات:</label>
                    <input
                      type="text"
                      value={crextioConfig.showcaseTitle || ''}
                      onChange={e => updateCrextioConfig({ showcaseTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">توضیحات زیرعنوان:</label>
                    <input
                      type="text"
                      value={crextioConfig.showcaseSubtitle || ''}
                      onChange={e => updateCrextioConfig({ showcaseSubtitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">آمار دانش‌آموختگان:</label>
                      <input
                        type="text"
                        value={crextioConfig.showcaseAlumniCount || ''}
                        onChange={e => updateCrextioConfig({ showcaseAlumniCount: e.target.value })}
                        className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">تعداد دوره‌های تخصصی:</label>
                      <input
                        type="text"
                        value={crextioConfig.showcaseCoursesCount || ''}
                        onChange={e => updateCrextioConfig({ showcaseCoursesCount: e.target.value })}
                        className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">تعداد دادنامه‌ها و آراء:</label>
                      <input
                        type="text"
                        value={crextioConfig.showcaseRulingsCount || ''}
                        onChange={e => updateCrextioConfig({ showcaseRulingsCount: e.target.value })}
                        className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-stone-700 block mb-1">شاخص رضایت‌مندی:</label>
                      <input
                        type="text"
                        value={crextioConfig.showcaseSatisfactionRate || ''}
                        onChange={e => updateCrextioConfig({ showcaseSatisfactionRate: e.target.value })}
                        className="w-full px-4 py-2 rounded-2xl bg-white border border-stone-200 text-xs text-stone-900 font-bold"
                      />
                    </div>
                  </div>
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

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import {
  CrextioDashboardConfig,
  CrextioBentoCardConfig,
  CrextioHeroStatItem,
} from '../../types';
import { DEFAULT_BENTO_CARDS, DEFAULT_HERO_STATS } from '../../data/mockData';
import { SlidersHorizontal, X, RotateCcw, CheckCircle2 } from 'lucide-react';
import { CustomizerTabBar } from './theme_customizer_subcomponents/CustomizerTabBar';
import { CustomizerModulesTab } from './theme_customizer_subcomponents/CustomizerModulesTab';
import { CustomizerRulingsTab } from './theme_customizer_subcomponents/CustomizerRulingsTab';
import { CustomizerResearchTab } from './theme_customizer_subcomponents/CustomizerResearchTab';
import { CustomizerShowcaseTabs } from './theme_customizer_subcomponents/CustomizerShowcaseTabs';
import { CustomizerHeroStatsTab } from './theme_customizer_subcomponents/CustomizerHeroStatsTab';
import { CustomizerFontsTab } from './theme_customizer_subcomponents/CustomizerFontsTab';
import { CustomizerBentoCardsTab } from './theme_customizer_subcomponents/CustomizerBentoCardsTab';
import { CustomizerStylingModesTab } from './theme_customizer_subcomponents/CustomizerStylingModesTab';
import { HonorsManagerEditor, UnifiedShowcaseManagerEditor } from './theme_customizer_subcomponents/CustomizerHonorsUnifiedTab';
import { CustomizerNavigationTab } from './theme_customizer_subcomponents/CustomizerNavigationTab';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  initialTab?: CustomizerTab;
  onClose: () => void;
}

export type CustomizerTab =
  | 'modules'
  | 'navigation'
  | 'honors'
  | 'unified'
  | 'rulings'
  | 'research'
  | 'courses'
  | 'counseling'
  | 'welfare'
  | 'books'
  | 'multimedia'
  | 'hero'
  | 'fonts'
  | 'modes'
  | 'styling'
  | 'showcase'
  | 'cards'
  | 'stats';

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  initialTab = 'modules',
  onClose,
}) => {
  const { crextioConfig, updateCrextioConfig, resetCrextioConfig, rulings } = useApp();
  const [activeTab, setActiveTab] = useState<CustomizerTab>(initialTab);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof CrextioDashboardConfig) => {
    const currentVal = crextioConfig[key];
    updateCrextioConfig({ [key]: !currentVal } as any);
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2000);
  };

  // Bento Cards state & handlers
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

  const setCardSize = (id: string, size: CrextioBentoCardConfig['size']) => {
    const newCards = currentCards.map(c => c.id === id ? { ...c, size } : c);
    handleCardUpdate(newCards);
  };

  const setCardField = (id: string, field: 'title' | 'badge' | 'subtext', val: string) => {
    const newCards = currentCards.map(c => c.id === id ? { ...c, [field]: val } : c);
    handleCardUpdate(newCards);
  };

  const setCardSubServices = (id: string, text: string) => {
    const list = text.split('\n').map(s => s.trim()).filter(Boolean);
    const newCards = currentCards.map(c => c.id === id ? { ...c, subServices: list } : c);
    handleCardUpdate(newCards);
  };

  const toggleCardVisibility = (id: string) => {
    const newCards = currentCards.map(c => c.id === id ? { ...c, isVisible: c.isVisible === false } : c);
    handleCardUpdate(newCards);
  };

  // Hero Stats state & handlers
  const currentHeroStats: CrextioHeroStatItem[] = crextioConfig.heroStatsConfig || DEFAULT_HERO_STATS;

  const handleHeroStatUpdate = (updatedStats: CrextioHeroStatItem[]) => {
    updateCrextioConfig({ heroStatsConfig: updatedStats });
    triggerSuccess();
  };

  const handleStatFieldChange = (id: string, field: 'label' | 'val' | 'trend', val: any) => {
    const updated = currentHeroStats.map(s => s.id === id ? { ...s, [field]: val } : s);
    handleHeroStatUpdate(updated);
  };

  const handleToggleStatVisibility = (id: string) => {
    const updated = currentHeroStats.map(s => s.id === id ? { ...s, isVisible: s.isVisible === false } : s);
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
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-end sm:items-center justify-center p-1 sm:p-5 overflow-hidden" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-[#FCFCFA] rounded-t-[26px] sm:rounded-[36px] w-full max-w-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#F5F4EE] border-b border-stone-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md shrink-0">
              <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-lg font-extrabold text-stone-900 truncate">سفارشی‌ساز فوق‌پیشرفته تم ۲ (پرتال دانش‌آموختگان)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] sm:text-[11px] font-bold shrink-0">
                  ویژه مدیران
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1">
                تغییر زنده و پویا در نحوه چیدمان، ویترین‌ها، کارت‌ها و نحوه نمایش بخش‌های داشبورد تم دوم
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-stone-200/80 flex items-center justify-center text-stone-500 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="shrink-0">
          <CustomizerTabBar activeTab={activeTab} onSelectTab={setActiveTab} />
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain space-y-6 flex-1 min-h-0 text-stone-800 text-xs">
          {activeTab === 'modules' && (
            <CustomizerModulesTab
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
              handleToggle={handleToggle}
            />
          )}

          {activeTab === 'navigation' && (
            <CustomizerNavigationTab
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          )}

          {activeTab === 'honors' && (
            <HonorsManagerEditor
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          )}

          {activeTab === 'unified' && (
            <UnifiedShowcaseManagerEditor
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          )}

          {activeTab === 'rulings' && (
            <CustomizerRulingsTab
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
              rulings={rulings}
              handleToggle={handleToggle}
            />
          )}

          {activeTab === 'research' && (
            <CustomizerResearchTab
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
              handleToggle={handleToggle}
            />
          )}

          {(activeTab === 'courses' ||
            activeTab === 'counseling' ||
            activeTab === 'welfare' ||
            activeTab === 'books' ||
            activeTab === 'multimedia') && (
            <CustomizerShowcaseTabs
              activeTab={activeTab}
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
              handleToggle={handleToggle}
            />
          )}

          {(activeTab === 'hero' || activeTab === 'stats') && (
            <CustomizerHeroStatsTab
              activeTab={activeTab}
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
              handleToggle={handleToggle}
              currentHeroStats={currentHeroStats}
              handleAddHeroStat={handleAddHeroStat}
              handleHeroStatUpdate={handleHeroStatUpdate}
              handleToggleStatVisibility={handleToggleStatVisibility}
              handleDeleteHeroStat={handleDeleteHeroStat}
              handleStatFieldChange={handleStatFieldChange}
              defaultHeroStats={DEFAULT_HERO_STATS}
            />
          )}

          {activeTab === 'fonts' && (
            <CustomizerFontsTab
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
            />
          )}

          {activeTab === 'cards' && (
            <CustomizerBentoCardsTab
              currentCards={currentCards}
              editingCardId={editingCardId}
              setEditingCardId={setEditingCardId}
              handleCardUpdate={handleCardUpdate}
              moveCardUp={moveCardUp}
              moveCardDown={moveCardDown}
              setCardSize={setCardSize}
              toggleCardVisibility={toggleCardVisibility}
              setCardField={setCardField}
              setCardSubServices={setCardSubServices}
              defaultBentoCards={DEFAULT_BENTO_CARDS}
            />
          )}

          {(activeTab === 'modes' || activeTab === 'styling' || activeTab === 'showcase') && (
            <CustomizerStylingModesTab
              activeTab={activeTab}
              crextioConfig={crextioConfig}
              updateCrextioConfig={updateCrextioConfig}
              triggerSuccess={triggerSuccess}
              handleToggle={handleToggle}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3.5 sm:p-5 bg-[#F5F4EE] border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                resetCrextioConfig();
                triggerSuccess();
              }}
              className="px-3.5 sm:px-4 py-2 min-h-[40px] rounded-full border border-stone-300 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی</span>
            </button>

            {successToast && (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                تغییرات اعمال شد
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 sm:px-6 py-2.5 min-h-[42px] rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
          >
            بستن و ذخیره تغییرات
          </button>
        </div>
      </motion.div>
    </div>
  );
};

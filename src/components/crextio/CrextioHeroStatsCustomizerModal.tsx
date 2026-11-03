import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CrextioHeroStatItem } from '../../types';
import { DEFAULT_HERO_STATS } from '../../data/mockData';
import {
  X,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Users,
  GraduationCap,
  Scale,
  BookOpen,
  Award,
  Activity,
  Gift,
  Shield
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface CrextioHeroStatsCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrextioHeroStatsCustomizerModal: React.FC<CrextioHeroStatsCustomizerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { crextioConfig, updateCrextioConfig } = useApp();
  const currentStats: CrextioHeroStatItem[] = crextioConfig.heroStatsConfig || DEFAULT_HERO_STATS;

  const [stats, setStats] = useState<CrextioHeroStatItem[]>(currentStats);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleStatFieldChange = (id: string, field: keyof CrextioHeroStatItem, val: any) => {
    setStats(prev => prev.map(s => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const handleToggleVisibility = (id: string) => {
    setStats(prev =>
      prev.map(s => (s.id === id ? { ...s, isVisible: s.isVisible === false ? true : false } : s))
    );
  };

  const handleDeleteStat = (id: string) => {
    if (stats.length <= 1) {
      alert('حداقل یک آیتم آماری باید وجود داشته باشد.');
      return;
    }
    setStats(prev => prev.filter(s => s.id !== id));
  };

  const handleAddNewStat = () => {
    const newId = `stat_${Date.now()}`;
    const newStat: CrextioHeroStatItem = {
      id: newId,
      label: 'عنوان شاخص جدید',
      val: 500,
      trend: '+۵٪ این ماه',
      icon: 'award',
      color: 'text-amber-800 bg-amber-100',
      isVisible: true
    };
    setStats([...stats, newStat]);
  };

  const handleSave = () => {
    updateCrextioConfig({ heroStatsConfig: stats });
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 700);
  };

  const handleReset = () => {
    setStats(DEFAULT_HERO_STATS);
    updateCrextioConfig({ heroStatsConfig: DEFAULT_HERO_STATS });
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#FCFCFA] rounded-[36px] w-full max-w-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#F5F4EE] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
              <Sliders className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-stone-900">
                  مدیریت آمار و شاخص‌های بنر دانش‌آموختگان
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                  ویژه مدیران
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                تغییر عناوین، ارقام، روندها، حذف یا افزودن شاخص‌های آماری بنر وی‌آی‌پی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Stats */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-stone-600">
              شاخص‌های آماری فعال ({toPersianNumbers(stats.length)} مورد):
            </span>
            <button
              type="button"
              onClick={handleAddNewStat}
              className="px-3 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن شاخص جدید</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {stats.map((stat, idx) => {
              const isVisible = stat.isVisible !== false;
              return (
                <div
                  key={stat.id}
                  className={`p-4 rounded-3xl border transition-all ${
                    isVisible
                      ? 'bg-stone-50 border-stone-200 shadow-2xs'
                      : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[11px] font-black text-stone-700">
                        {toPersianNumbers(idx + 1)}
                      </span>
                      <span className="font-extrabold text-stone-900 text-xs">
                        {stat.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(stat.id)}
                        className={`p-1.5 rounded-xl border text-xs transition-colors ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-200 text-stone-600 border-stone-300'
                        }`}
                        title={isVisible ? 'مخفی‌سازی' : 'نمایش مجدد'}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStat(stat.id)}
                        className="p-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        title="حذف شاخص"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inputs row */}
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
                        مقدار عددی (شمارش از صفر):
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
                        برچسب روند یا رشد:
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

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-[#F5F4EE] border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-full border border-stone-300 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی پیش‌فرض</span>
          </button>

          <div className="flex items-center gap-2">
            {successToast && (
              <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 animate-pulse">
                <Check className="w-4 h-4" /> ذخیره گردید
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-md transition-colors"
            >
              ذخیره و اعمال در داشبورد
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

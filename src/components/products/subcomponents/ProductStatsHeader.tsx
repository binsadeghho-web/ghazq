import React from 'react';
import { motion } from 'motion/react';
import { ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { ProductShelfKey, getAllProductCategories } from './productUiHelpers';
import {
  BookOpen,
  MonitorPlay,
  Headphones,
  CheckCircle2,
  Sliders,
  Plus,
  Layers,
  Receipt,
  Tags,
} from 'lucide-react';

interface ProductStatsHeaderProps {
  storeConfig: ProductsStoreConfig;
  activeProductsCount: number;
  categoryCounts: Record<string, number>;
  myOwnedCount: number;
  ordersCount: number;
  activeShelf: ProductShelfKey;
  onSelectShelf: (shelf: ProductShelfKey) => void;
  isOfficial: boolean;
  onOpenAddProduct: () => void;
  onOpenSettings: () => void;
}

export const ProductStatsHeader: React.FC<ProductStatsHeaderProps> = ({
  storeConfig,
  activeProductsCount,
  categoryCounts,
  myOwnedCount,
  ordersCount,
  activeShelf,
  onSelectShelf,
  isOfficial,
  onOpenAddProduct,
  onOpenSettings,
}) => {
  const categories = getAllProductCategories(storeConfig);

  const getCategoryIcon = (kind: string, id: string) => {
    if (kind === 'book' || id === 'book') return <BookOpen className="w-4 h-4 text-amber-600" />;
    if (kind === 'session' || kind === 'multimedia' || id === 'multimedia') {
      return <MonitorPlay className="w-4 h-4 text-indigo-600" />;
    }
    if (kind === 'lecture' || id === 'audio_series') return <Headphones className="w-4 h-4 text-sky-600" />;
    return <Tags className="w-4 h-4 text-emerald-600" />;
  };

  const allStats: Array<{
    key: ProductShelfKey;
    label: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    visible: boolean;
    disabledForUsers?: boolean;
  }> = [
    {
      key: 'all',
      label: 'کل آثار فعال',
      value: activeProductsCount,
      unit: 'عنوان',
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
      visible: true,
    },
    ...categories.map(cat => ({
      key: cat.id,
      label: cat.shortLabel || cat.label,
      value: categoryCounts[cat.id] || 0,
      unit: 'اثر',
      icon: getCategoryIcon(cat.kind, cat.id),
      visible: isOfficial || storeConfig.enabledCategories?.[cat.id] !== false,
      disabledForUsers: storeConfig.enabledCategories?.[cat.id] === false,
    })),
    {
      key: 'my_library',
      label: 'کتابخانه من',
      value: myOwnedCount,
      unit: 'اثر',
      icon: <CheckCircle2 className="w-4 h-4 text-teal-600" />,
      visible: true,
    },
    {
      key: 'orders',
      label: isOfficial ? 'کل سفارش‌ها' : 'سفارش‌ها و رهگیری',
      value: ordersCount,
      unit: 'سفارش',
      icon: <Receipt className="w-4 h-4 text-violet-600" />,
      visible: true,
    },
  ];

  const stats = allStats.filter(s => s.visible);

  return (
    <div className="space-y-4">
      {/* Editorial Hero Header */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-6 py-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
            مرکز نشر، رسانه و عرضه آثار علمی مرکز فقه و حقوق اسلامی
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {storeConfig.storeTitle || 'کتاب و محصولات چند رسانه‌ای'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {storeConfig.storeSubtitle ||
              'خرید مستقیم کتاب، نشست‌های علمی صوتی و تصویری و درس‌گفتارها با دسترسی آنی فایل‌ها پس از ثبت‌نام یا ارسال نسخه فیزیکی'}
          </p>
        </div>

        {isOfficial && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>تنظیمات بخش، عناوین و ارسال</span>
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onOpenAddProduct}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/15 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کتاب / نشست / محصول</span>
            </motion.button>
          </div>
        )}
      </div>

      {/* Editorial Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(stat => {
          const isActive = activeShelf === stat.key;
          return (
            <button
              key={stat.key}
              type="button"
              onClick={() => onSelectShelf(stat.key)}
              className={`text-right p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-[11px] font-bold truncate ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}`}>
                  {stat.label}
                </span>
                {stat.icon}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black tabular-nums">
                  {toPersianNumbers(stat.value)}
                </span>
                <span className={`text-[11px] font-medium ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500'}`}>
                  {stat.unit}
                </span>
              </div>
              {stat.disabledForUsers && (
                <span className="text-[10px] font-bold text-rose-500 block mt-1">
                  غیرفعال برای کاربران
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

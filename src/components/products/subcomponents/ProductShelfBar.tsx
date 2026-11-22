import React from 'react';
import { ProductsStoreConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { ProductShelfKey, getAllProductCategories } from './productUiHelpers';
import {
  BookOpen,
  MonitorPlay,
  Headphones,
  Layers,
  CheckCircle2,
  Receipt,
  Search,
  Tags,
} from 'lucide-react';

interface ProductShelfBarProps {
  activeShelf: ProductShelfKey;
  onSelectShelf: (shelf: ProductShelfKey) => void;
  storeConfig: ProductsStoreConfig;
  isOfficial: boolean;
  allCount: number;
  categoryCounts: Record<string, number>;
  myOwnedCount: number;
  ordersCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ProductShelfBar: React.FC<ProductShelfBarProps> = ({
  activeShelf,
  onSelectShelf,
  storeConfig,
  isOfficial,
  allCount,
  categoryCounts,
  myOwnedCount,
  ordersCount,
  searchQuery,
  onSearchChange,
}) => {
  const categories = getAllProductCategories(storeConfig);

  const getCategoryIcon = (kind: string, id: string) => {
    if (kind === 'book' || id === 'book') return <BookOpen className="w-3.5 h-3.5 text-amber-500" />;
    if (kind === 'session' || kind === 'multimedia' || id === 'multimedia') {
      return <MonitorPlay className="w-3.5 h-3.5 text-indigo-500" />;
    }
    if (kind === 'lecture' || id === 'audio_series') return <Headphones className="w-3.5 h-3.5 text-sky-500" />;
    return <Tags className="w-3.5 h-3.5 text-emerald-500" />;
  };

  const allTabs: Array<{
    key: ProductShelfKey;
    label: string;
    count: number;
    icon: React.ReactNode;
    visible: boolean;
    disabledTag?: boolean;
  }> = [
    {
      key: 'all',
      label: 'همه آثار',
      count: allCount,
      icon: <Layers className="w-3.5 h-3.5 text-emerald-500" />,
      visible: true,
    },
    ...categories.map(cat => ({
      key: cat.id,
      label: cat.label,
      count: categoryCounts[cat.id] || 0,
      icon: getCategoryIcon(cat.kind, cat.id),
      visible: isOfficial || storeConfig.enabledCategories?.[cat.id] !== false,
      disabledTag: storeConfig.enabledCategories?.[cat.id] === false,
    })),
    {
      key: 'my_library',
      label: 'کتابخانه من',
      count: myOwnedCount,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />,
      visible: true,
    },
    {
      key: 'orders',
      label: 'سفارش‌ها و رهگیری',
      count: ordersCount,
      icon: <Receipt className="w-3.5 h-3.5 text-violet-500" />,
      visible: true,
    },
  ];

  const tabs = allTabs.filter(t => t.visible);

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs overflow-x-auto scrollbar-none font-bold">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelectShelf(tab.key)}
            className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeShelf === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className="text-[11px] opacity-70 tabular-nums">({toPersianNumbers(tab.count)})</span>
            {tab.disabledTag && (
              <span className="text-[10px] text-rose-500 font-bold">(خاموش)</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative w-full xl:w-80 shrink-0">
        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="جستجو در عنوان، ارائه‌دهندگان، نمایه یا کد رهگیری..."
          className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
        />
      </div>
    </div>
  );
};

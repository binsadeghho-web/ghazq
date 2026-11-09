import React from 'react';
import { Search, ShieldCheck, Archive } from 'lucide-react';
import { toPersianNumbers } from '../../../utils/persianNumbers';

export type CourseTab = 'available' | 'my_courses' | 'archive' | 'admin_panel' | 'deleted_courses';
export type CourseFormatFilter = 'all' | 'online' | 'in_person' | 'hybrid';

interface CourseFilterBarProps {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  formatFilter: CourseFormatFilter;
  onFormatFilterChange: (format: CourseFormatFilter) => void;
  availableCount: number;
  myEnrolledCount: number;
  archivedCount: number;
  deletedCount: number;
  pendingReceiptsCount: number;
  isOfficial: boolean;
}

export const CourseFilterBar: React.FC<CourseFilterBarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  formatFilter,
  onFormatFilterChange,
  availableCount,
  myEnrolledCount,
  archivedCount,
  deletedCount,
  pendingReceiptsCount,
  isOfficial,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 glass-card p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-xs overflow-x-auto scrollbar-none font-bold">
        <button
          onClick={() => onTabChange('available')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'available'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          دوره‌های در حال ثبت‌نام ({toPersianNumbers(availableCount)})
        </button>

        <button
          onClick={() => onTabChange('my_courses')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'my_courses'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>دوره‌های من</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            {toPersianNumbers(myEnrolledCount)}
          </span>
        </button>

        <button
          onClick={() => onTabChange('archive')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'archive'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          آرشیو دوره‌های سابق ({toPersianNumbers(archivedCount)})
        </button>

        {isOfficial && (
          <button
            onClick={() => onTabChange('admin_panel')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'admin_panel'
                ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>پنل تایید فیش‌ها</span>
            {pendingReceiptsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white animate-pulse">
                {toPersianNumbers(pendingReceiptsCount)}
              </span>
            )}
          </button>
        )}

        {isOfficial && (
          <button
            onClick={() => onTabChange('deleted_courses')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'deleted_courses'
                ? 'bg-rose-500 text-white shadow-xs font-black'
                : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>دوره‌های بایگانی / حذف منطقی ({toPersianNumbers(deletedCount)})</span>
          </button>
        )}
      </div>

      {/* Search & Format Filter */}
      {activeTab !== 'admin_panel' && activeTab !== 'deleted_courses' && (
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-xs">
            <button
              onClick={() => onFormatFilterChange('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                formatFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => onFormatFilterChange('online')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                formatFilter === 'online'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              مجازی (برخط)
            </button>
            <button
              onClick={() => onFormatFilterChange('in_person')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                formatFilter === 'in_person'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              حضوری
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="جستجو در عنوان، استاد، فقه القضا..."
              className="w-full pr-8.5 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

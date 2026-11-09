import React from 'react';
import { BookOpen, Headphones, Layers, CheckCircle, Search } from 'lucide-react';
import { toPersianNumbers } from '../../../utils/persianNumbers';

interface ProductShelfBarProps {
  activeShelf: 'books' | 'multimedia' | 'combined' | 'my_library';
  onSelectShelf: (shelf: 'books' | 'multimedia' | 'combined' | 'my_library') => void;
  booksCount: number;
  multimediaCount: number;
  myOwnedCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ProductShelfBar: React.FC<ProductShelfBarProps> = ({
  activeShelf,
  onSelectShelf,
  booksCount,
  multimediaCount,
  myOwnedCount,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 glass-card p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
      {/* Shelf Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-xs overflow-x-auto scrollbar-none font-bold">
        <button
          onClick={() => onSelectShelf('books')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeShelf === 'books'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          <span>قفسه کتاب‌ها و آثار مکتوب ({toPersianNumbers(booksCount)})</span>
        </button>

        <button
          onClick={() => onSelectShelf('multimedia')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeShelf === 'multimedia'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Headphones className="w-3.5 h-3.5 text-indigo-500" />
          <span>قفسه محصولات چندرسانه‌ای ({toPersianNumbers(multimediaCount)})</span>
        </button>

        <button
          onClick={() => onSelectShelf('combined')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeShelf === 'combined'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-500" />
          <span>نمایش ترکیبی (همه آثار)</span>
        </button>

        <button
          onClick={() => onSelectShelf('my_library')}
          className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeShelf === 'my_library'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-sky-500" />
          <span>کتابخانه من ({toPersianNumbers(myOwnedCount)})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="جستجو در عنوان کتاب، مؤلف، نرم‌افزار..."
          className="w-full pr-8.5 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
        />
      </div>
    </div>
  );
};

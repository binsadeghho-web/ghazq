import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export const ConcurrentConflictModal: React.FC = () => {
  const [conflictData, setConflictData] = useState<{
    title?: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    const handleConflict = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      setConflictData({
        title: detail?.title || 'تداخل در ویرایش هم‌زمان داده‌ها',
        detail: detail?.detail || detail?.message || 'اطلاعات این بخش توسط مدیر یا کاربر دیگری تغییر یافته است. لطفاً صفحه را بازخوانی کرده و مجدداً تلاش نمایید.',
      });
    };

    window.addEventListener('app:concurrent_conflict', handleConflict);
    return () => {
      window.removeEventListener('app:concurrent_conflict', handleConflict);
    };
  }, []);

  if (!conflictData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-hidden" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md max-h-[92dvh] flex flex-col bg-white dark:bg-stone-900 rounded-t-[26px] sm:rounded-3xl p-5 sm:p-6 border border-amber-500/30 shadow-2xl overflow-hidden relative pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white truncate">
                {conflictData.title}
              </h3>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Optimistic Concurrency Control (OCC)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setConflictData(null)}
              className="mr-auto w-9 h-9 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain mb-5">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {conflictData.detail}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              بارگذاری مجدد اطلاعات تازه
            </button>
            <button
              type="button"
              onClick={() => setConflictData(null)}
              className="min-h-[42px] py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-xs rounded-2xl transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 border border-amber-500/30 shadow-2xl overflow-hidden relative"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                {conflictData.title}
              </h3>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Optimistic Concurrency Control (OCC)
              </span>
            </div>
            <button
              onClick={() => setConflictData(null)}
              className="mr-auto p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-6">
            {conflictData.detail}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              بارگذاری مجدد اطلاعات تازه
            </button>
            <button
              onClick={() => setConflictData(null)}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium rounded-2xl transition-colors cursor-pointer"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

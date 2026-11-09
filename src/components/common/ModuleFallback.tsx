import React from 'react';

export const ModuleFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="w-full min-h-[400px] rounded-[32px] bg-stone-50/80 dark:bg-[#182622]/80 border border-stone-200/80 dark:border-[#2A423B] p-8 flex flex-col items-center justify-center text-center shadow-sm"
  >
    <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-600 dark:border-emerald-400/30 dark:border-t-emerald-400 animate-spin mb-4" />
    <div className="h-4 w-52 max-w-full bg-stone-200 dark:bg-[#2A423B] rounded-full mb-2.5 animate-pulse" />
    <div className="h-3 w-36 max-w-full bg-stone-100 dark:bg-[#20332D] rounded-full mb-1 animate-pulse" />
    <span className="text-[11px] text-stone-400 font-medium mt-2">در حال بارگذاری ماژول...</span>
  </div>
);

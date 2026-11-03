import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { JudicialRuling } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Scale,
  ArrowUpRight,
  ThumbsUp,
  MessageSquare,
  Eye,
  X
} from 'lucide-react';

interface CrextioRulingsShowcaseProps {
  onNavigateToRulings?: () => void;
}

export const CrextioRulingsShowcase: React.FC<CrextioRulingsShowcaseProps> = ({
  onNavigateToRulings
}) => {
  const { rulings, toggleRulingLike } = useApp();
  const [activePreviewRuling, setActivePreviewRuling] = useState<JudicialRuling | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate items for continuous smooth ticker loop
  const displayRulings = rulings.length > 0 ? [...rulings, ...rulings] : [];

  return (
    <div className="w-full rounded-2xl bg-white border border-stone-200/90 shadow-xs p-3.5 sm:p-4 text-stone-900 overflow-hidden space-y-2.5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <Scale className="w-4 h-4 stroke-[2.3]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 tracking-tight">
              آخرین آراء صادره و گزیده محاکم تجدیدنظر و دیوان عالی کشور
            </h4>
          </div>
        </div>

        <button
          onClick={onNavigateToRulings}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <span>ورود به تالار جامع نقد آراء</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
        </button>
      </div>

      {/* عناوین آراء صادره به صورت عبوری (Horizontal Passing Ticker Stream) */}
      <div
        className="relative overflow-hidden w-full py-1"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          animate={{
            x: isPaused ? undefined : ['0%', '-50%']
          }}
          transition={{
            repeat: Infinity,
            duration: 25,
            ease: 'linear'
          }}
          className="flex items-center gap-3 w-max"
        >
          {displayRulings.map((ruling, idx) => (
            <div
              key={`${ruling.id}-${idx}`}
              onClick={() => setActivePreviewRuling(ruling)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#F8F7F2] hover:bg-emerald-50 border border-stone-200 hover:border-emerald-400/80 transition-all cursor-pointer text-xs group shrink-0"
            >
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                {ruling.courtBranch}
              </span>

              <span className="font-bold text-stone-800 group-hover:text-emerald-900 transition-colors max-w-[280px] sm:max-w-[360px] truncate">
                {ruling.title}
              </span>

              <div className="flex items-center gap-2 text-stone-400 text-[10px] mr-1">
                <span className="flex items-center gap-0.5">
                  <ThumbsUp className="w-3 h-3 text-amber-600" />
                  <span>{toPersianNumbers(ruling.likesCount)}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span>{toPersianNumbers(ruling.discussions?.length || 0)}</span>
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* مودال پیش‌نمایش سریع دادنامه منتخب */}
      <AnimatePresence>
        {activePreviewRuling && (
          <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl w-full max-w-xl border border-stone-200 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto text-stone-900"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-stone-900 line-clamp-1">
                      {activePreviewRuling.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {activePreviewRuling.courtBranch} · دادرس: {activePreviewRuling.judgeName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActivePreviewRuling(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 block">چکیده مبدأ استنباط:</span>
                  <p className="text-stone-700 leading-relaxed">{activePreviewRuling.summary}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1 max-h-48 overflow-y-auto">
                  <span className="font-bold text-emerald-900 block">متن دادنامه:</span>
                  <p className="text-stone-600 font-serif leading-loose text-xs whitespace-pre-line">
                    {activePreviewRuling.fullRulingText || activePreviewRuling.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-xs">
                <button
                  onClick={() => toggleRulingLike(activePreviewRuling.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>موافقت با رأی ({toPersianNumbers(activePreviewRuling.likesCount)})</span>
                </button>

                <button
                  onClick={() => {
                    setActivePreviewRuling(null);
                    if (onNavigateToRulings) onNavigateToRulings();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-colors cursor-pointer"
                >
                  ورود به تالار نقد و ثبت مباحثه
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, RotateCcw, ArrowUp, ArrowDown, Eye, EyeOff, Edit3 } from 'lucide-react';
import { CrextioBentoCardConfig } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';

interface CustomizerBentoCardsTabProps {
  currentCards: CrextioBentoCardConfig[];
  editingCardId: string | null;
  setEditingCardId: (id: string | null) => void;
  handleCardUpdate: (cards: CrextioBentoCardConfig[]) => void;
  moveCardUp: (idx: number) => void;
  moveCardDown: (idx: number) => void;
  setCardSize: (id: string, size: CrextioBentoCardConfig['size']) => void;
  toggleCardVisibility: (id: string) => void;
  setCardField: (id: string, field: 'title' | 'badge' | 'subtext', value: string) => void;
  setCardSubServices: (id: string, value: string) => void;
  defaultBentoCards: CrextioBentoCardConfig[];
}

export const CustomizerBentoCardsTab: React.FC<CustomizerBentoCardsTabProps> = ({
  currentCards,
  editingCardId,
  setEditingCardId,
  handleCardUpdate,
  moveCardUp,
  moveCardDown,
  setCardSize,
  toggleCardVisibility,
  setCardField,
  setCardSubServices,
  defaultBentoCards,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
        <div>
          <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-800" />
            مدیریت چیدمان، اندازه و محتوای کارت‌های ۹‌گانه (Bento Grid)
          </h4>
          <p className="text-[11px] text-emerald-800/80 mt-0.5">
            تعیین موقعیت (ترتیب)، سایز ستونی در شبکه، تیترها و زیرخدمات نمایش داده‌شده در هر کارت
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            handleCardUpdate(defaultBentoCards);
          }}
          className="px-3 py-1.5 rounded-full border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>پیش‌فرض کارت‌ها</span>
        </button>
      </div>

      <div className="space-y-3">
        {currentCards.map((card, idx) => {
          const isEditing = editingCardId === card.id;
          const isVisible = card.isVisible !== false;

          return (
            <div
              key={card.id}
              className={`p-4 rounded-3xl border transition-all ${
                isVisible
                  ? 'bg-stone-50 border-stone-200'
                  : 'bg-stone-100 border-dashed border-stone-300 opacity-60'
              }`}
            >
              {/* Card Header row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Order badges & movement buttons */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-stone-200 shadow-2xs">
                    <span className="font-black text-xs text-stone-700 min-w-4 text-center">
                      {toPersianNumbers(idx + 1)}
                    </span>
                    <div className="flex flex-col gap-0.5 mr-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCardUp(idx)}
                        title="انتقال به بالا"
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-stone-100 disabled:opacity-20 text-stone-600 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === currentCards.length - 1}
                        onClick={() => moveCardDown(idx)}
                        title="انتقال به پایین"
                        className="w-4 h-4 flex items-center justify-center rounded hover:bg-stone-100 disabled:opacity-20 text-stone-600 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                        {card.title}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          borderColor: card.accentColor,
                          color: card.accentColor,
                          backgroundColor: `${card.accentColor}10`
                        }}
                      >
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {card.subtext}
                    </p>
                  </div>
                </div>

                {/* Quick Size and Edit controls */}
                <div className="flex items-center gap-2">
                  {/* Size Selector */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-stone-200">
                    {[
                      { key: '1-col', label: '۱ ستون' },
                      { key: '2-col', label: '۲ ستون' },
                      { key: '3-col', label: '۳ ستون' },
                      { key: 'full', label: 'کامل' }
                    ].map(sz => (
                      <button
                        key={sz.key}
                        type="button"
                        onClick={() => setCardSize(card.id, sz.key as any)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          card.size === sz.key
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>

                  {/* Visibility button */}
                  <button
                    type="button"
                    onClick={() => toggleCardVisibility(card.id)}
                    className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
                      isVisible
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-stone-200 border-stone-300 text-stone-500'
                    }`}
                    title={isVisible ? 'مخفی کردن کارت' : 'نمایش کارت'}
                  >
                    {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit Details Accordion Toggle */}
                  <button
                    type="button"
                    onClick={() => setEditingCardId(isEditing ? null : card.id)}
                    className={`px-3 py-1.5 rounded-2xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isEditing
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-white border-stone-200 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'بستن فرم' : 'ویرایش متن'}</span>
                  </button>
                </div>
              </div>

              {/* Editing Form when opened */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-stone-200 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">عنوان کارت:</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={e => setCardField(card.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-700 block mb-1">نشان ویژه (Badge):</label>
                        <input
                          type="text"
                          value={card.badge}
                          onChange={e => setCardField(card.id, 'badge', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-900 focus:outline-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">توضیح کوتاه زیر عنوان:</label>
                      <input
                        type="text"
                        value={card.subtext}
                        onChange={e => setCardField(card.id, 'subtext', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-800 focus:outline-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 block mb-1">
                        فهرست خدمات زیرمجموعه (هر خط یک خدمت):
                      </label>
                      <textarea
                        rows={3}
                        value={card.subServices ? card.subServices.join('\n') : ''}
                        onChange={e => setCardSubServices(card.id, e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-800 focus:outline-emerald-600 leading-relaxed"
                        placeholder="خدمت اول&#10;خدمت دوم&#10;خدمت سوم"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

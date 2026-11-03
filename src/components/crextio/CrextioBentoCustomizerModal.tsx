import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CrextioBentoCardConfig } from '../../types';
import { DEFAULT_BENTO_CARDS } from '../../data/mockData';
import {
  Sliders,
  X,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Edit3,
  Layers,
  Sparkles,
  Maximize2,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

interface CrextioBentoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CrextioBentoCustomizerModal: React.FC<CrextioBentoCustomizerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { crextioConfig, updateCrextioConfig } = useApp();
  const currentCards: CrextioBentoCardConfig[] = crextioConfig.bentoCardsConfig || DEFAULT_BENTO_CARDS;

  const [cards, setCards] = useState<CrextioBentoCardConfig[]>(currentCards);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  // جابه‌جایی کارت به بالا در لیست
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newCards = [...cards];
    const temp = newCards[index - 1];
    newCards[index - 1] = newCards[index];
    newCards[index] = temp;
    // به‌روزرسانی فیلد order
    newCards.forEach((c, idx) => {
      c.order = idx + 1;
    });
    setCards(newCards);
  };

  // جابه‌جایی کارت به پایین در لیست
  const moveDown = (index: number) => {
    if (index === cards.length - 1) return;
    const newCards = [...cards];
    const temp = newCards[index + 1];
    newCards[index + 1] = newCards[index];
    newCards[index] = temp;
    newCards.forEach((c, idx) => {
      c.order = idx + 1;
    });
    setCards(newCards);
  };

  // تغییر سایز کارت
  const handleSizeChange = (id: string, newSize: '1-col' | '2-col' | '3-col' | 'full') => {
    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, size: newSize } : c))
    );
  };

  // ویرایش مشخصات متنی کارت
  const handleFieldChange = (id: string, field: keyof CrextioBentoCardConfig, val: any) => {
    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  // ویرایش زیرخدمات به صورت خطی
  const handleSubServicesChange = (id: string, text: string) => {
    const list = text.split('\n').map(s => s.trim()).filter(Boolean);
    handleFieldChange(id, 'subServices', list);
  };

  // ذخیره نهایی در تنظیمات
  const handleSave = () => {
    updateCrextioConfig({ bentoCardsConfig: cards });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  // بازنشانی به مقادیر پیش‌فرض
  const handleReset = () => {
    if (window.confirm('آیا مایل به بازنشانی چیدمان و متن کارت‌ها به حالت اولیه هستید؟')) {
      setCards(DEFAULT_BENTO_CARDS);
      updateCrextioConfig({ bentoCardsConfig: DEFAULT_BENTO_CARDS });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#12221D] rounded-3xl border border-emerald-500/30 text-white shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[88vh]"
        dir="rtl"
      >
        {/* هدر مودال مدیریت */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#132A21] to-[#1A382C] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>مدیریت جایگاه، اندازه و محتوای کارت‌های داشبورد</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  پنل ادمین
                </span>
              </h3>
              <p className="text-xs text-stone-300 mt-0.5">
                تغییر اولویت و مکان کارت‌ها، تنظیم عرض و ویرایش متون و زیرخدمات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* لیست کارت‌ها با قابلیت تغییر ترتیب، سایز و ویرایش محتوا */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-white/5">
          {cards.map((card, idx) => {
            const isEditing = editingCardId === card.id;

            return (
              <div
                key={card.id}
                className="pt-3.5 first:pt-0 bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-emerald-500/30 transition-all space-y-3"
              >
                {/* ردیف بالا: کنترل موقعیت، عنوان و سایز */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* دکمه‌های جابه‌جایی بالا و پایین */}
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        title="انتقال کارت به بالا (جایگاه قبلی)"
                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-emerald-300"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold px-1.5 text-amber-300">
                        {idx + 1}
                      </span>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === cards.length - 1}
                        title="انتقال کارت به پایین (جایگاه بعدی)"
                        className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-emerald-300"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{card.title}</span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                          style={{
                            backgroundColor: `${card.accentColor || '#10B981'}20`,
                            color: card.accentColor || '#10B981'
                          }}
                        >
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">{card.subtext}</p>
                    </div>
                  </div>

                  {/* کنترل سایز و دکمه باز کردن ویرایش متن */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* انتخاب سایز کارت */}
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                      {[
                        { id: '1-col', label: '۱ ستون (عادی)' },
                        { id: '2-col', label: '۲ ستون (عریض)' },
                        { id: '3-col', label: '۳ ستون' },
                        { id: 'full', label: 'تمام‌عرض' }
                      ].map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSizeChange(card.id, s.id as any)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                            card.size === s.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-stone-300 hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* دکمه باز کردن پنل ویرایش توضیحات */}
                    <button
                      onClick={() => setEditingCardId(isEditing ? null : card.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        isEditing
                          ? 'bg-amber-400 text-stone-950 border-amber-300'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'بستن فرم' : 'ویرایش متن'}</span>
                    </button>
                  </div>
                </div>

                {/* فرم ویرایش متون و توضیحات تفصیلی کارت */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-300 font-bold mb-1">عنوان کارت</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={e => handleFieldChange(card.id, 'title', e.target.value)}
                          className="w-full bg-[#182C24] border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-300 font-bold mb-1">متن برچسب (Badge)</label>
                        <input
                          type="text"
                          value={card.badge}
                          onChange={e => handleFieldChange(card.id, 'badge', e.target.value)}
                          className="w-full bg-[#182C24] border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-300 font-bold mb-1">توضیحات و شرح خدمات کارت</label>
                      <textarea
                        rows={2}
                        value={card.subtext}
                        onChange={e => handleFieldChange(card.id, 'subtext', e.target.value)}
                        className="w-full bg-[#182C24] border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-300 font-bold mb-1">
                        زیرخدمات و امکانات (هر خدمت در یک سطر جدید)
                      </label>
                      <textarea
                        rows={3}
                        value={card.subServices.join('\n')}
                        onChange={e => handleSubServicesChange(card.id, e.target.value)}
                        placeholder="درخواست گواهی اشتغال&#10;استعلام ترفیع پایه"
                        className="w-full bg-[#182C24] border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* فوتر دکمه‌های ذخیره و بازنشانی */}
        <div className="p-4 px-6 bg-[#0E1A16] border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl hover:bg-rose-950/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی به چیدمان اولیه</span>
          </button>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>تنظیمات ذخیره شد</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-xs font-bold text-stone-300 hover:bg-white/10 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-stone-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره و اعمال چیدمان</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

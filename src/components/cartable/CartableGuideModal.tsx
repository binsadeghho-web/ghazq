import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { X, BookOpen, Edit3, Trash2, Info, ArrowRight } from 'lucide-react';
import { CartableGuide } from './cartableTypes';

interface CartableGuideModalProps {
  isOpen: boolean;
  guide: CartableGuide;
  canEdit: boolean;
  onClose: () => void;
  onSaveGuide: (guide: CartableGuide) => Promise<void>;
  onStartNewRequest: () => void;
}

export const CartableGuideModal: React.FC<CartableGuideModalProps> = ({
  isOpen,
  guide,
  canEdit,
  onClose,
  onSaveGuide,
  onStartNewRequest,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CartableGuide>(guide);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditForm(guide);
      setIsEditing(false);
    }
  }, [isOpen, guide]);

  if (!isOpen) return null;

  const handleSave = async (next: CartableGuide) => {
    setSaving(true);
    try {
      await onSaveGuide(next);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDisableGuide = async () => {
    await handleSave({ ...editForm, enabled: false });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {isEditing ? 'ویرایش راهنمای ثبت درخواست' : guide.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                راهنمای رسمی مراحل، ضوابط و رهگیری در کارتابل خدمات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش راهنما</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان راهنما
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  متن اصلی راهنما
                </label>
                <textarea
                  rows={4}
                  value={editForm.content}
                  onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  مراحل انجام کار (هر خط یک مرحله)
                </label>
                <textarea
                  rows={4}
                  value={(editForm.steps || []).join('\n')}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      steps: e.target.value.split('\n').filter(s => s.trim().length > 0),
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نکات مهم و الزامات رسیدگی (هر خط یک نکته)
                </label>
                <textarea
                  rows={3}
                  value={(editForm.tips || []).join('\n')}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      tips: e.target.value.split('\n').filter(t => t.trim().length > 0),
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDisableGuide}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>غیرفعال‌سازی راهنما</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave({ ...editForm, enabled: true })}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'در حال ذخیره...' : 'ذخیره در پایگاه داده'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-amber-100 leading-relaxed font-medium">
                {guide.content}
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>مراحل ثبت و پیگیری درخواست</span>
                </h4>
                <div className="space-y-2.5">
                  {(guide.steps || []).map((st, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
                    >
                      <span className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                        {toPersianNumbers(i + 1)}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        {st}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>نکات کلیدی و راهکارهای تسریع رسیدگی</span>
                </h4>
                <div className="space-y-2">
                  {(guide.tips || []).map((tp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                      <Info className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{tp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {guide.updatedBy ? `آخرین بروزرسانی توسط: ${guide.updatedBy}` : 'مرکز خدمات اداری و دانش‌آموختگان'}
            </span>
            <button
              type="button"
              onClick={onStartNewRequest}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>شروع ثبت درخواست</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  X,
  ClipboardList,
  Edit3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Building2,
  Check,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  CartableCategoryItem,
  CartableFollowableTopic,
  CartableFollowableTopicsConfig,
} from './cartableTypes';

interface CartableFollowableTopicsModalProps {
  isOpen: boolean;
  config: CartableFollowableTopicsConfig;
  categories: CartableCategoryItem[];
  canEdit: boolean;
  onClose: () => void;
  onSaveConfig: (next: CartableFollowableTopicsConfig) => Promise<void>;
  onSelectTopicForNewRequest: (topic: CartableFollowableTopic) => void;
}

export const CartableFollowableTopicsModal: React.FC<CartableFollowableTopicsModalProps> = ({
  isOpen,
  config,
  categories,
  canEdit,
  onClose,
  onSaveConfig,
  onSelectTopicForNewRequest,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<CartableFollowableTopicsConfig>(config);
  const [saving, setSaving] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState('معاونت آموزش');
  const [newEstDays, setNewEstDays] = useState('۳ تا ۵ روز کاری');
  const [newCatKey, setNewCatKey] = useState(categories[0]?.key || 'administrative');

  useEffect(() => {
    setDraft(config);
    setIsEditing(false);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const visibleTopics = (config.items || []).filter(t => t.isActive !== false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveConfig({
        ...draft,
        items: (draft.items || []).map((t, idx) => ({ ...t, order: idx + 1 })),
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTopic = () => {
    if (!newTitle.trim()) return;
    const item: CartableFollowableTopic = {
      id: `topic_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || newTitle.trim(),
      departmentTitle: newDept.trim() || 'مرکز فقه و حقوق اسلامی',
      categoryKey: newCatKey,
      estimatedDays: newEstDays.trim() || '۳ روز کاری',
      isActive: true,
      order: (draft.items?.length || 0) + 1,
    };
    setDraft(prev => ({ ...prev, items: [...(prev.items || []), item] }));
    setNewTitle('');
    setNewDesc('');
  };

  const moveTopic = (index: number, direction: -1 | 1) => {
    const list = [...(draft.items || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [removed] = list.splice(index, 1);
    list.splice(targetIdx, 0, removed);
    setDraft(prev => ({ ...prev, items: list }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={onClose}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
      >
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-white truncate">
                {isEditing ? 'ویرایش موارد قابل پیگیری از مرکز فقه و حقوق اسلامی' : config.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {config.subtitle || 'فهرست امور، استعلامات و خدمات رسمی قابل ثبت در کارتابل'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش موارد</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {isEditing ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-white">
                    تنظیمات نمایش و عناوین دکمه و پنجره
                  </span>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.enabled !== false}
                      onChange={e => setDraft({ ...draft, enabled: e.target.checked })}
                      className="rounded accent-emerald-500 w-4 h-4"
                    />
                    <span>نمایش دکمه در کارتابل</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      عنوان دکمه در صفحه کارتابل
                    </label>
                    <input
                      type="text"
                      value={draft.buttonLabel || 'موارد قابل پیگیری از مرکز فقه و حقوق اسلامی'}
                      onChange={e => setDraft({ ...draft, buttonLabel: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      سرتیتر پنجره فهرست موارد
                    </label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={e => setDraft({ ...draft, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/25 space-y-3">
                <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>افزودن مورد قابل پیگیری جدید</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="عنوان مورد قابل پیگیری..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="واحد مسئول پیگیری (مثلاً: معاونت آموزش)"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={newCatKey}
                    onChange={e => setNewCatKey(e.target.value)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  >
                    {categories.map(c => (
                      <option key={c.key} value={c.key}>
                        دسته پیشنهادی: {c.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="زمان تقریبی رسیدگی (مثلاً: ۳ تا ۵ روز کاری)"
                    value={newEstDays}
                    onChange={e => setNewEstDays(e.target.value)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="توضیحات، مدارک مورد نیاز و جزئیات پیگیری..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن به فهرست</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {(draft.items || []).map((topic, idx) => (
                  <div
                    key={topic.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        ردیف {toPersianNumbers(idx + 1)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDraft(prev => ({
                              ...prev,
                              items: prev.items.map((t, i) =>
                                i === idx ? { ...t, isActive: t.isActive === false } : t
                              ),
                            }))
                          }
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                            topic.isActive !== false
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {topic.isActive !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{topic.isActive !== false ? 'فعال' : 'مخفی'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTopic(idx, -1)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                          title="انتقال به بالا"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTopic(idx, 1)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                          title="انتقال به پایین"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft(prev => ({
                              ...prev,
                              items: prev.items.filter((_, i) => i !== idx),
                            }))
                          }
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                          title="حذف مورد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={topic.title}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            items: prev.items.map((t, i) =>
                              i === idx ? { ...t, title: e.target.value } : t
                            ),
                          }))
                        }
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={topic.departmentTitle || ''}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            items: prev.items.map((t, i) =>
                              i === idx ? { ...t, departmentTitle: e.target.value } : t
                            ),
                          }))
                        }
                        placeholder="واحد مسئول"
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={topic.description}
                      onChange={e =>
                        setDraft(prev => ({
                          ...prev,
                          items: prev.items.map((t, i) =>
                            i === idx ? { ...t, description: e.target.value } : t
                          ),
                        }))
                      }
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTopics.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  در حال حاضر موردی ثبت نشده است. می‌توانید درخواست خود را از دکمه «ثبت درخواست جدید» ارسال کنید.
                </div>
              ) : (
                visibleTopics.map((topic, idx) => (
                  <div
                    key={topic.id}
                    className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[11px] font-black flex items-center justify-center shrink-0">
                          {toPersianNumbers(idx + 1)}
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {topic.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-8">
                        {topic.description}
                      </p>
                      {(topic.departmentTitle || topic.estimatedDays) && (
                        <div className="flex items-center flex-wrap gap-3 pr-8 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                          {topic.departmentTitle && (
                            <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>واحد پیگیری: {topic.departmentTitle}</span>
                            </span>
                          )}
                          {topic.estimatedDays && (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>زمان رسیدگی: {toPersianNumbers(topic.estimatedDays)}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectTopicForNewRequest(topic)}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>ثبت این درخواست</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(config);
                  setIsEditing(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'در حال ذخیره...' : 'ذخیره در پایگاه داده'}</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-400 font-medium">
                مرکز فقه و حقوق اسلامی · کارتابل پیگیری درخواست‌ها
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

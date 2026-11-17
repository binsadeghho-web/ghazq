import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  X,
  Sliders,
  PlusCircle,
  Plus,
  Layers,
  Trash2,
  Power,
  AlertCircle,
} from 'lucide-react';
import { CartableCategoryItem } from './cartableTypes';

interface CartableCategoriesModalProps {
  isOpen: boolean;
  categories: CartableCategoryItem[];
  categoriesDisabled: boolean;
  officials: Array<{ role: string; title: string }>;
  onClose: () => void;
  onSave: (categories: CartableCategoryItem[], categoriesDisabled: boolean) => Promise<void>;
}

export const CartableCategoriesModal: React.FC<CartableCategoriesModalProps> = ({
  isOpen,
  categories,
  categoriesDisabled,
  officials,
  onClose,
  onSave,
}) => {
  const [listEdit, setListEdit] = useState<CartableCategoryItem[]>(categories);
  const [disabledFlag, setDisabledFlag] = useState<boolean>(categoriesDisabled);
  const [saving, setSaving] = useState(false);

  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatOfficialRole, setNewCatOfficialRole] = useState(
    officials[2]?.role || 'alumni_manager'
  );

  useEffect(() => {
    if (isOpen) {
      setListEdit(categories);
      setDisabledFlag(categoriesDisabled);
    }
  }, [isOpen, categories, categoriesDisabled]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(listEdit, disabledFlag);
      onClose();
    } finally {
      setSaving(false);
    }
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
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                مدیریت دسته‌بندی‌ها و ماتریس ارجاع خودکار
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                تعریف دسته‌ها، فعال/غیرفعال‌سازی و هدایت مستقیم تمام درخواست‌ها به مدیر دانش‌آموختگان
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Master Toggle: Disable All Categories -> Route to Alumni Manager (اصلاح ۳) */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              disabledFlag
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                <Power className={`w-4 h-4 ${disabledFlag ? 'text-amber-500' : 'text-emerald-500'}`} />
                <span>خاموش کردن همه دسته‌بندی‌ها (ارجاع سراسری به مدیر دانش‌آموختگان)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                در صورت فعال‌سازی این گزینه، انتخاب دسته‌بندی برای دانش‌آموختگان غیرفعال شده و تمامی درخواست‌های جدید مستقیماً به کارتابل «مدیر دانش‌آموختگان» ارسال می‌گردند.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDisabledFlag(prev => !prev)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-colors cursor-pointer ${
                disabledFlag
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {disabledFlag ? 'دسته‌بندی‌ها خاموش است (کلیک برای روشن کردن)' : 'خاموش کردن همه دسته‌ها'}
            </button>
          </div>

          {disabledFlag && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>همه دسته‌بندی‌ها هم‌اکنون خاموش هستند و تمام درخواست‌های جدید به مدیر دانش‌آموختگان ارجاع می‌شوند.</span>
            </div>
          )}

          {/* Add New Category Box */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              <span>افزودن دسته‌بندی جدید به کارتابل</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  عنوان فارسی دسته‌بندی
                </label>
                <input
                  type="text"
                  placeholder="مثال: خدمات رفاهی و تسهیلات قرض‌الحسنه"
                  value={newCatTitle}
                  onChange={e => setNewCatTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  کلید سیستمی (انگلیسی یکتا)
                </label>
                <input
                  type="text"
                  placeholder="مثال: welfare"
                  value={newCatKey}
                  onChange={e =>
                    setNewCatKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  مسئول پیش‌فرض رسیدگی (ارجاع خودکار)
                </label>
                <select
                  value={newCatOfficialRole}
                  onChange={e => setNewCatOfficialRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  {officials.map(off => (
                    <option key={off.role} value={off.role}>
                      {off.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  شرح مختصر دسته
                </label>
                <input
                  type="text"
                  placeholder="توضیح جهت راهنمایی دانش‌آموخته هنگام انتخاب"
                  value={newCatDescription}
                  onChange={e => setNewCatDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!newCatTitle.trim() || !newCatKey.trim()) {
                    return;
                  }
                  const offObj = officials.find(o => o.role === newCatOfficialRole);
                  const newCatItem: CartableCategoryItem = {
                    id: `cat_${Date.now()}`,
                    key: newCatKey.trim(),
                    title: newCatTitle.trim(),
                    assignedRole: newCatOfficialRole,
                    assignedOfficialTitle: offObj?.title || 'مدیر دانش‌آموختگان',
                    description: newCatDescription.trim() || newCatTitle.trim(),
                    isActive: true,
                  };
                  setListEdit([...listEdit, newCatItem]);
                  setNewCatTitle('');
                  setNewCatKey('');
                  setNewCatDescription('');
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-black text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن به لیست دسته‌ها</span>
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <span>فهرست دسته‌بندی‌ها و وضعیت ارجاع ({toPersianNumbers(listEdit.length)} دسته)</span>
            </h4>

            <div className="space-y-2.5">
              {listEdit.map((cat, idx) => {
                const isCatActive = cat.isActive !== false;
                return (
                  <div
                    key={cat.id || cat.key || idx}
                    className={`p-3.5 rounded-2xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                      isCatActive
                        ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                        : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {cat.title}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {cat.key}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {cat.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-between md:justify-end flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setListEdit(prev =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, isActive: item.isActive === false } : item
                            )
                          )
                        }
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black border transition-colors cursor-pointer ${
                          isCatActive
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isCatActive ? 'روشن' : 'خاموش'}
                      </button>

                      <select
                        value={cat.assignedRole}
                        onChange={e => {
                          const newRole = e.target.value;
                          const off = officials.find(o => o.role === newRole);
                          setListEdit(prev =>
                            prev.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    assignedRole: newRole,
                                    assignedOfficialTitle: off?.title || item.assignedOfficialTitle,
                                  }
                                : item
                            )
                          );
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-sky-700 dark:text-sky-300"
                      >
                        {officials.map(off => (
                          <option key={off.role} value={off.role}>
                            {off.title}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setListEdit(prev => prev.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'در حال ثبت در دیتابیس...' : 'ذخیره تنظیمات در پایگاه داده'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

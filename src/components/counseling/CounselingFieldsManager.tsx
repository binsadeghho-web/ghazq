import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Compass,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { CounselingFieldItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { isReadOnlyObserverRole } from '../../utils/rbacPolicy';

interface CounselingFieldsManagerProps {
  counselingType: 'general' | 'specialized_career';
  readOnly?: boolean;
}

const ICON_OPTIONS = [
  { id: 'sparkles', label: 'درخشش' },
  { id: 'briefcase', label: 'مسیر شغلی' },
  { id: 'graduation', label: 'تحصیلات تکمیلی' },
  { id: 'heart', label: 'خانواده و حمایت' },
  { id: 'brain', label: 'روان‌شناسی' },
  { id: 'scale', label: 'عدالت و قضا' },
  { id: 'compass', label: 'جهت‌یابی' },
  { id: 'book', label: 'مطالعه و پژوهش' },
];

const COLOR_OPTIONS = [
  { id: 'emerald', label: 'زمردی' },
  { id: 'amber', label: 'کهربایی' },
  { id: 'indigo', label: 'لاجوردی' },
  { id: 'teal', label: 'فیروزه‌ای' },
  { id: 'rose', label: 'یاقوتی' },
];

export const CounselingFieldsManager: React.FC<CounselingFieldsManagerProps> = ({
  counselingType,
  readOnly,
}) => {
  const {
    currentUser,
    counselingFields,
    createCounselingField,
    updateCounselingField,
    deleteCounselingField,
  } = useApp();

  const isReadOnly = readOnly ?? isReadOnlyObserverRole(currentUser?.role);

  const items = counselingFields
    .filter(f => f.counselingType === counselingType)
    .sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CounselingFieldItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    description: '',
    iconName: counselingType === 'specialized_career' ? 'briefcase' : 'brain',
    accentColor: counselingType === 'specialized_career' ? 'amber' : 'emerald',
    isActive: true,
    displayOrder: items.length + 1,
  });

  const openCreate = () => {
    if (isReadOnly) return;
    setEditingItem(null);
    setFormState({
      title: '',
      subtitle: '',
      description: '',
      iconName: counselingType === 'specialized_career' ? 'briefcase' : 'brain',
      accentColor: counselingType === 'specialized_career' ? 'amber' : 'emerald',
      isActive: true,
      displayOrder: items.length + 1,
    });
    setIsFormOpen(true);
  };

  const openEdit = (item: CounselingFieldItem) => {
    if (isReadOnly) return;
    setEditingItem(item);
    setFormState({
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || '',
      iconName: item.iconName || 'sparkles',
      accentColor: item.accentColor || 'emerald',
      isActive: item.isActive,
      displayOrder: item.displayOrder || 1,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !formState.title.trim()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await updateCounselingField(editingItem.id, {
          ...formState,
          counselingType,
        });
      } else {
        await createCounselingField({
          ...formState,
          counselingType,
        });
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    if (isReadOnly) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const current = items[idx];
    const target = items[targetIdx];
    const currentOrder = current.displayOrder || idx + 1;
    const targetOrder = target.displayOrder || targetIdx + 1;
    const newOrderForCurrent = targetOrder === currentOrder ? targetIdx + 1 : targetOrder;
    const newOrderForTarget = targetOrder === currentOrder ? idx + 1 : currentOrder;
    await updateCounselingField(current.id, { displayOrder: newOrderForCurrent });
    await updateCounselingField(target.id, { displayOrder: newOrderForTarget });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>
              مدیریت «زمینه‌های مشاوره» ({counselingType === 'specialized_career' ? 'مشاوره تخصصی' : 'خدمات روانشناختی و مشاوره'})
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            زمینه‌ها مستقیماً در پایگاه داده ذخیره شده و در صفحه اول و گام اول فرم ثبت درخواست نمایش داده می‌شوند. زیرعنوان و توضیحات کاملاً اختیاری هستند.
          </p>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن زمینه مشاوره جدید</span>
          </button>
        )}
      </div>

      {isFormOpen && !isReadOnly && (
        <form
          onSubmit={handleSave}
          className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-black text-emerald-950 dark:text-emerald-200">
              {editingItem ? `ویرایش زمینه: ${editingItem.title}` : 'تعریف زمینه مشاوره جدید'}
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-1 rounded-lg hover:bg-white/60 text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان زمینه مشاوره *</label>
              <input
                type="text"
                required
                value={formState.title}
                onChange={e => setFormState({ ...formState, title: e.target.value })}
                placeholder="مثال: خانواده، ازدواج و زوج درمانی، درمانی..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">زیرعنوان کوتاه (اختیاری)</label>
              <input
                type="text"
                value={formState.subtitle}
                onChange={e => setFormState({ ...formState, subtitle: e.target.value })}
                placeholder="در صورت خالی ماندن، فقط عنوان نمایش داده می‌شود"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات راهنما (اختیاری)</label>
            <textarea
              rows={2}
              value={formState.description}
              onChange={e => setFormState({ ...formState, description: e.target.value })}
              placeholder="اختیاری — در صورت خالی ماندن هیچ متنی زیر عنوان نمایش داده نمی‌شود"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">آیکون کارت</label>
              <select
                value={formState.iconName}
                onChange={e => setFormState({ ...formState, iconName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {ICON_OPTIONS.map(ic => (
                  <option key={ic.id} value={ic.id}>{ic.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">طیف رنگ</label>
              <select
                value={formState.accentColor}
                onChange={e => setFormState({ ...formState, accentColor: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                {COLOR_OPTIONS.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ترتیب نمایش</label>
              <input
                type="number"
                min={1}
                value={formState.displayOrder}
                onChange={e => setFormState({ ...formState, displayOrder: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={e => setFormState({ ...formState, isActive: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              <span className="font-bold">فعال در سامانه</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره...' : editingItem ? 'ذخیره تغییرات' : 'ثبت در پایگاه داده'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2.5">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
            هنوز زمینه مشاوره‌ای تعریف نشده است.
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {toPersianNumbers(idx + 1)}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</h4>
                    {item.subtitle && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        — {item.subtitle}
                      </span>
                    )}
                    {!item.isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                        مخفی برای اعضا
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">{item.description}</p>
                  )}
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                    title="انتقال به بالا"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                    title="انتقال به پایین"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => updateCounselingField(item.id, { isActive: !item.isActive })}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer hover:bg-slate-100"
                    title={item.isActive ? 'مخفی کردن' : 'فعال کردن'}
                  >
                    {item.isActive ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{item.isActive ? 'فعال' : 'مخفی'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteCounselingField(item.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                      >
                        تایید حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                      >
                        لغو
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-100 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

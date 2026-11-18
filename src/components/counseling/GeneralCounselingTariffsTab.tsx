import React, { useState } from 'react';
import { DollarSign, Plus, Edit3, Trash2, Clock, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GeneralCounselingTariffItem } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface GeneralCounselingTariffsTabProps {
  isAdminMode?: boolean;
}

export const GeneralCounselingTariffsTab: React.FC<GeneralCounselingTariffsTabProps> = ({ isAdminMode = false }) => {
  const {
    counselingTariffs,
    createCounselingTariff,
    updateCounselingTariff,
    deleteCounselingTariff,
  } = useApp();

  const visibleTariffs = (isAdminMode ? counselingTariffs : counselingTariffs.filter(t => t.isActive))
    .slice()
    .sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1));

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GeneralCounselingTariffItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState<{
    serviceTitle: string;
    sessionDurationMinutes: number;
    meetingMode: 'حضوری' | 'برخط' | 'تلفنی' | 'همه روش‌ها';
    standardFee: number;
    alumniSubsidizedFee: number;
    notes: string;
    isActive: boolean;
    displayOrder: number;
  }>({
    serviceTitle: '',
    sessionDurationMinutes: 45,
    meetingMode: 'همه روش‌ها',
    standardFee: 600000,
    alumniSubsidizedFee: 200000,
    notes: '',
    isActive: true,
    displayOrder: visibleTariffs.length + 1,
  });

  const openAdd = () => {
    setEditing(null);
    setFormState({
      serviceTitle: '',
      sessionDurationMinutes: 45,
      meetingMode: 'همه روش‌ها',
      standardFee: 600000,
      alumniSubsidizedFee: 200000,
      notes: '',
      isActive: true,
      displayOrder: visibleTariffs.length + 1,
    });
    setFormOpen(true);
  };

  const openEdit = (t: GeneralCounselingTariffItem) => {
    setEditing(t);
    setFormState({
      serviceTitle: t.serviceTitle,
      sessionDurationMinutes: t.sessionDurationMinutes,
      meetingMode: t.meetingMode,
      standardFee: t.standardFee,
      alumniSubsidizedFee: t.alumniSubsidizedFee,
      notes: t.notes || '',
      isActive: t.isActive,
      displayOrder: t.displayOrder,
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.serviceTitle.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCounselingTariff(editing.id, formState);
      } else {
        await createCounselingTariff(formState);
      }
      setFormOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      <div className="bg-gradient-to-l from-slate-900 to-emerald-950 text-white rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1.5">
          <h2 className="text-base font-black flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <span>نرخ‌نامه مصوب خدمات مشاوره و روان‌شناسان مرکز</span>
          </h2>
          <p className="text-slate-300 leading-relaxed max-w-2xl">
            تعرفه‌های رسمی جلسات فردی، خانواده و سنجش‌های روان‌شناختی با اعمال یارانه ویژه دانش‌آموختگان مرکز در این بخش قابل مشاهده است.
          </p>
        </div>

        {isAdminMode && (
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن ردیف نرخ‌نامه</span>
          </button>
        )}
      </div>

      {isAdminMode && formOpen && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-emerald-200 dark:border-emerald-900 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white">
              {editing ? `ویرایش ردیف: ${editing.serviceTitle}` : 'ثبت ردیف جدید در نرخ‌نامه'}
            </h3>
            <button type="button" onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان خدمت مشاوره *</label>
              <input
                type="text"
                required
                value={formState.serviceTitle}
                onChange={e => setFormState({ ...formState, serviceTitle: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مدت جلسه (دقیقه)</label>
              <input
                type="number"
                value={formState.sessionDurationMinutes}
                onChange={e => setFormState({ ...formState, sessionDurationMinutes: Number(e.target.value) || 45 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شیوه برگزاری</label>
              <select
                value={formState.meetingMode}
                onChange={e => setFormState({ ...formState, meetingMode: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="همه روش‌ها">همه روش‌ها</option>
                <option value="حضوری">حضوری</option>
                <option value="برخط">برخط</option>
                <option value="تلفنی">تلفنی</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تعرفه آزاد (تومان)</label>
              <input
                type="number"
                value={formState.standardFee}
                onChange={e => setFormState({ ...formState, standardFee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">سهم دانش‌آموخته با یارانه (تومان)</label>
              <input
                type="number"
                value={formState.alumniSubsidizedFee}
                onChange={e => setFormState({ ...formState, alumniSubsidizedFee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <label className="flex items-center gap-2 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={e => setFormState({ ...formState, isActive: e.target.checked })}
                className="accent-emerald-600"
              />
              <span className="font-bold">نمایش در نرخ‌نامه عمومی</span>
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات تکمیلی</label>
            <input
              type="text"
              value={formState.notes}
              onChange={e => setFormState({ ...formState, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره...' : 'ذخیره ردیف'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTariffs.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-500">
            هیچ ردیف نرخ‌نامه‌ای ثبت نشده است.
          </div>
        ) : (
          visibleTariffs.map(t => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">{t.serviceTitle}</h3>
                  {!t.isActive && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                      مخفی
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{toPersianNumbers(t.sessionDurationMinutes)} دقیقه</span>
                  <span>·</span>
                  <span>{t.meetingMode}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>تعرفه مصوب آزاد:</span>
                    <span className="font-mono line-through">{toPersianNumbers(t.standardFee.toLocaleString('en-US'))} تومان</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-700 dark:text-emerald-400">
                    <span>سهم پرداختی عضو مرکز:</span>
                    <span className="font-mono text-sm">
                      {t.alumniSubsidizedFee === 0
                        ? 'رایگان'
                        : `${toPersianNumbers(t.alumniSubsidizedFee.toLocaleString('en-US'))} تومان`}
                    </span>
                  </div>
                </div>

                {t.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t.notes}
                  </p>
                )}
              </div>

              {isAdminMode && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {confirmDeleteId === t.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteCounselingTariff(t.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                      >
                        تایید حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                      >
                        لغو
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(t.id)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 cursor-pointer"
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

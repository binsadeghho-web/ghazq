import React, { useState, useEffect } from 'react';
import {
  X,
  Layout,
  Grid,
  List,
  Check,
  Plus,
  Trash2,
  Save,
  Loader2,
  Sliders,
} from 'lucide-react';
import { RulingTagDefinition, RulingsPortalConfig } from '../../types';
import { getRulingTagStyleClasses, TAG_COLOR_OPTIONS, TAG_STYLE_OPTIONS } from './rulingTypesAndTags';

interface RulingPortalDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalConfig: RulingsPortalConfig;
  onSavePortalConfig: (updates: Partial<RulingsPortalConfig>) => Promise<void>;
}

export const RulingPortalDesignerModal: React.FC<RulingPortalDesignerModalProps> = ({
  isOpen,
  onClose,
  portalConfig,
  onSavePortalConfig,
}) => {
  const [draft, setDraft] = useState<RulingsPortalConfig>(portalConfig);
  const [saving, setSaving] = useState(false);

  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagScope, setNewTagScope] = useState<'internal' | 'public'>('internal');
  const [newTagColor, setNewTagColor] = useState<RulingTagDefinition['colorScheme']>('emerald');
  const [newTagStyle, setNewTagStyle] = useState<RulingTagDefinition['styleVariant']>('soft');

  useEffect(() => {
    if (isOpen) {
      setDraft(portalConfig);
    }
  }, [isOpen, portalConfig]);

  if (!isOpen) return null;

  const handleAddTagDef = () => {
    const label = newTagLabel.trim();
    if (!label) return;
    const def: RulingTagDefinition = {
      id: `tag_${Date.now()}`,
      label,
      colorScheme: newTagColor,
      styleVariant: newTagStyle,
      scope: newTagScope,
    };

    if (newTagScope === 'internal') {
      if ((draft.internalTagDefinitions || []).some(d => d.label === label)) return;
      setDraft(prev => ({
        ...prev,
        internalTagDefinitions: [...(prev.internalTagDefinitions || []), def],
      }));
    } else {
      if ((draft.publicLabelDefinitions || []).some(d => d.label === label)) return;
      setDraft(prev => ({
        ...prev,
        publicLabelDefinitions: [...(prev.publicLabelDefinitions || []), def],
      }));
    }
    setNewTagLabel('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSavePortalConfig(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-stone-950/65 backdrop-blur-xs overflow-hidden"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#FBF9F5] dark:bg-slate-900 rounded-t-[26px] sm:rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-4 bg-stone-900 dark:bg-slate-950 text-white flex items-center justify-between gap-2 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sliders className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">طراحی چیدمان، بخش‌های نمایشی و مدیریت برچسب‌های تالار رأی</h3>
              <p className="text-[11px] text-stone-300 mt-0.5 truncate">
                تنظیم شیوه نمایش تالار برای همه کاربران و تعریف برچسب‌های رنگی اختصاصی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="w-10 h-10 rounded-lg text-stone-300 hover:text-white hover:bg-stone-800 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 text-right">
          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700 dark:text-slate-300 mb-1">
                عنوان اصلی تالار رأی
              </label>
              <input
                type="text"
                value={draft.portalTitle || ''}
                onChange={e => setDraft(prev => ({ ...prev, portalTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-700 dark:text-slate-300 mb-1">
                زیرعنوان تالار رأی
              </label>
              <input
                type="text"
                value={draft.portalSubtitle || ''}
                onChange={e => setDraft(prev => ({ ...prev, portalSubtitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white"
              />
            </div>
          </div>

          {/* Layout Mode Selector (Reform 21) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-800 dark:text-slate-200">
              الگوی چیدمان و نمایش تالار آراء
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'editorial_split' as const,
                  title: 'نمای نشریه‌ای دو ستونه',
                  desc: 'فهرست آراء در کنار صفحه مطالعه کامل دادنامه و دیدگاه‌ها',
                  icon: Layout,
                },
                {
                  id: 'magazine_grid' as const,
                  title: 'شبکه مجله‌ای جذاب',
                  desc: 'کارت‌های عریض تحلیلی با خلاصه و آمار تعامل برای ترغیب مطالعه',
                  icon: Grid,
                },
                {
                  id: 'archive_list' as const,
                  title: 'فهرست آرشیوی منظم',
                  desc: 'ردیف‌های خوانا و فشرده مناسب مرور سریع مجموعه دادنامه‌ها',
                  icon: List,
                },
              ].map(opt => {
                const Icon = opt.icon;
                const active = draft.layoutMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, layoutMode: opt.id }))}
                    className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                      active
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500'
                        : 'bg-white dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-200 dark:border-slate-700 hover:border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{opt.title}</span>
                    </div>
                    <p
                      className={`text-[11px] mt-1 leading-relaxed ${
                        active ? 'text-stone-300 dark:text-stone-900' : 'text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles for Comments & Sections */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-800 dark:text-slate-200">
              اجزاء و بخش‌های قابل نمایش در کارت و صفحه مطالعه رأی
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                { key: 'globalCommentsEnabled', label: 'امکان ثبت دیدگاه و کامنت در کل تالار' },
                { key: 'showSummary', label: 'نمایش بخش چکیده و گردش کار رأی' },
                { key: 'showPrinciples', label: 'نمایش مستندات قانونی و قواعد فقهی' },
                { key: 'showKeywords', label: 'نمایش کلیدواژه‌های تخصصی' },
                { key: 'showAttachments', label: 'نمایش فایل‌های پیوست دادنامه' },
                { key: 'showCreatedAt', label: 'نمایش تاریخ و زمان بارگذاری رأی' },
                { key: 'showReviewedAt', label: 'نمایش تاریخ، زمان و نام مسئول بررسی‌کننده' },
              ].map(item => {
                const checked = (draft as any)[item.key] !== false;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, [item.key]: !checked }))}
                    className={`p-3 rounded-xl border flex items-center justify-between text-right cursor-pointer transition-colors ${
                      checked
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-semibold'
                        : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        checked ? 'bg-emerald-700 text-white' : 'bg-stone-200 dark:bg-slate-700'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag Definitions Manager */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">
              مدیریت و طراحی برچسب‌های مدیریتی (محرمانه) و برچسب‌های عمومی (کاربران)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                value={newTagLabel}
                onChange={e => setNewTagLabel(e.target.value)}
                placeholder="نام برچسب جدید..."
                className="sm:col-span-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
              />
              <select
                value={newTagScope}
                onChange={e => setNewTagScope(e.target.value as 'internal' | 'public')}
                className="px-2.5 py-2 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
              >
                <option value="internal">برچسب مدیریتی (محرمانه)</option>
                <option value="public">برچسب عمومی (نمایان برای کاربر)</option>
              </select>
              <select
                value={newTagStyle}
                onChange={e => setNewTagStyle(e.target.value as any)}
                className="px-2.5 py-2 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
              >
                {TAG_STYLE_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {TAG_COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewTagColor(c.value)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full ${c.swatchClass} flex items-center justify-center text-white cursor-pointer ${
                      newTagColor === c.value ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-white' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {newTagColor === c.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddTagDef}
                disabled={!newTagLabel.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن برچسب به فهرست</span>
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-slate-700">
              <div className="text-[11px] font-bold text-stone-600 dark:text-slate-400">
                برچسب‌های مدیریتی (محرمانه):
              </div>
              <div className="flex flex-wrap gap-2">
                {(draft.internalTagDefinitions || []).map(def => (
                  <span
                    key={def.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getRulingTagStyleClasses(
                      def.label,
                      draft.internalTagDefinitions,
                      def.colorScheme
                    )}`}
                  >
                    <span>{def.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft(prev => ({
                          ...prev,
                          internalTagDefinitions: (prev.internalTagDefinitions || []).filter(
                            d => d.id !== def.id
                          ),
                        }))
                      }
                      className="opacity-70 hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-slate-700">
              <div className="text-[11px] font-bold text-stone-600 dark:text-slate-400">
                برچسب‌های عمومی (قابل نمایش برای دانش‌آموختگان):
              </div>
              <div className="flex flex-wrap gap-2">
                {(draft.publicLabelDefinitions || []).map(def => (
                  <span
                    key={def.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getRulingTagStyleClasses(
                      def.label,
                      draft.publicLabelDefinitions,
                      def.colorScheme
                    )}`}
                  >
                    <span>{def.label}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft(prev => ({
                          ...prev,
                          publicLabelDefinitions: (prev.publicLabelDefinitions || []).filter(
                            d => d.id !== def.id
                          ),
                        }))
                      }
                      className="opacity-70 hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[42px] rounded-xl text-xs font-medium text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 min-h-[42px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>ذخیره تنظیمات چیدمان و برچسب‌ها</span>
          </button>
        </div>
      </div>
    </div>
  );
};

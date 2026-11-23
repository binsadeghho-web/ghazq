import React, { useState } from 'react';
import {
  CrextioDashboardConfig,
  CustomNavItemConfig,
  NavigationCustomizationConfig,
} from '../../../types';
import {
  DEFAULT_VERTICAL_NAV_ITEMS,
  DEFAULT_HORIZONTAL_NAV_ITEMS,
  DEFAULT_SERVICES_MENU_ITEMS,
  DEFAULT_SERVICES_MENU_TITLE,
  getResolvedNavigationConfig,
} from '../../../utils/navigationConfig';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  PanelRight,
  PanelTop,
  LayoutGrid,
  Sparkles,
  Lock,
} from 'lucide-react';

interface CustomizerNavigationTabProps {
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess?: () => void;
}

type NavSubTab = 'vertical' | 'horizontal' | 'services';

const STAFF_ONLY_IDS = new Set([
  'alumni',
  'users',
  'finance',
  'admin',
  'Alumni',
  'Users',
  'Finance',
  'Admin',
  'Setting',
]);

const PROTECTED_HOME_IDS = new Set(['dashboard', 'Dashboard']);

export const CustomizerNavigationTab: React.FC<CustomizerNavigationTabProps> = ({
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
}) => {
  const [subTab, setSubTab] = useState<NavSubTab>('vertical');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const resolvedNav: Required<NavigationCustomizationConfig> = getResolvedNavigationConfig(
    crextioConfig.navigationConfig
  );

  const activeListKey: keyof Pick<
    Required<NavigationCustomizationConfig>,
    'verticalSidebar' | 'horizontalNavbar' | 'servicesMenuItems'
  > =
    subTab === 'vertical'
      ? 'verticalSidebar'
      : subTab === 'horizontal'
      ? 'horizontalNavbar'
      : 'servicesMenuItems';

  const items: CustomNavItemConfig[] = resolvedNav[activeListKey];

  const commitNav = (patch: Partial<NavigationCustomizationConfig>) => {
    updateCrextioConfig({
      navigationConfig: {
        ...resolvedNav,
        ...patch,
      },
    });
    triggerSuccess?.();
  };

  const updateList = (nextItems: CustomNavItemConfig[]) => {
    commitNav({ [activeListKey]: nextItems });
  };

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= items.length || fromIdx === toIdx) return;
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    updateList(next);
  };

  const updateItemField = (
    idx: number,
    field: 'label' | 'subtext' | 'badge',
    value: string
  ) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    updateList(next);
  };

  const toggleItemVisibility = (idx: number) => {
    const target = items[idx];
    if (!target || PROTECTED_HOME_IDS.has(target.id)) return;
    const next = items.map((item, i) =>
      i === idx ? { ...item, visible: item.visible === false } : item
    );
    updateList(next);
  };

  const resetCurrentSubTab = () => {
    if (subTab === 'vertical') {
      commitNav({ verticalSidebar: DEFAULT_VERTICAL_NAV_ITEMS.map(d => ({ ...d })) });
    } else if (subTab === 'horizontal') {
      commitNav({ horizontalNavbar: DEFAULT_HORIZONTAL_NAV_ITEMS.map(d => ({ ...d })) });
    } else {
      commitNav({
        servicesMenuTitle: DEFAULT_SERVICES_MENU_TITLE,
        servicesMenuItems: DEFAULT_SERVICES_MENU_ITEMS.map(d => ({ ...d })),
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-4">
      {/* Intro & Sub-tab Switcher */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>مدیریت ترتیب، آیکون‌ها و عناوین ناوبری و منوی خدمات</span>
            </h3>
            <p className="text-[11px] text-emerald-900/75 mt-0.5 leading-relaxed">
              مدیران سامانه و مدیران دانش‌آموختگان می‌توانند ترتیب نمایش و نام تمام بخش‌ها را در ناوبری عمودی، ناوبری افقی و منوی خدمات سامانه تغییر دهند (با کشیدن و رها کردن یا دکمه‌های بالا و پایین).
            </p>
          </div>

          <button
            type="button"
            onClick={resetCurrentSubTab}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی این بخش به پیش‌فرض</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            {
              id: 'vertical' as NavSubTab,
              label: 'ناوبری عمودی (ستون کناری)',
              desc: `${toPersianNumbers(resolvedNav.verticalSidebar.length)} گزینه`,
              icon: PanelRight,
            },
            {
              id: 'horizontal' as NavSubTab,
              label: 'ناوبری افقی (نوار بالای تم ۲ و ۳)',
              desc: `${toPersianNumbers(resolvedNav.horizontalNavbar.length)} گزینه`,
              icon: PanelTop,
            },
            {
              id: 'services' as NavSubTab,
              label: 'منو و خدمات سامانه (مگا منو و کارت‌ها)',
              desc: `${toPersianNumbers(resolvedNav.servicesMenuItems.length)} خدمت`,
              icon: LayoutGrid,
            },
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSubTab(tab.id);
                  handleDragEnd();
                }}
                className={`p-2.5 rounded-xl border text-right flex items-center gap-2.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    active ? 'bg-white/15 text-amber-300' : 'bg-stone-100 text-emerald-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-black truncate">{tab.label}</div>
                  <div
                    className={`text-[10px] ${
                      active ? 'text-emerald-100' : 'text-stone-500'
                    }`}
                  >
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Menu Trigger Button Title */}
      {subTab === 'services' && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="shrink-0">
            <label className="block text-xs font-black text-amber-950">
              عنوان دکمه مرکزی مگا منوی خدمات:
            </label>
            <p className="text-[10px] text-amber-900/75 mt-0.5">
              این عنوان روی دکمه اصلی وسط هدر تم ۲ نمایش داده می‌شود.
            </p>
          </div>
          <input
            type="text"
            value={resolvedNav.servicesMenuTitle}
            onChange={e => commitNav({ servicesMenuTitle: e.target.value })}
            placeholder={DEFAULT_SERVICES_MENU_TITLE}
            className="w-full sm:w-80 px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-black text-stone-900 focus:outline-emerald-700"
          />
        </div>
      )}

      {/* Draggable & Editable Items List */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isVisible = item.visible !== false;
          const isProtectedHome = PROTECTED_HOME_IDS.has(item.id);
          const isStaffOnly = STAFF_ONLY_IDS.has(item.id);
          const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={e => {
                e.preventDefault();
                if (dragOverIdx !== idx) setDragOverIdx(idx);
              }}
              onDrop={() => {
                if (draggedIdx !== null) moveItem(draggedIdx, idx);
                handleDragEnd();
              }}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                isDragOver
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : isVisible
                  ? 'bg-white border-stone-200'
                  : 'bg-stone-100/80 border-dashed border-stone-300 opacity-70'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="p-1 rounded-lg bg-stone-100 text-stone-500 cursor-grab active:cursor-grabbing"
                    title="برای جابه‌جایی بکشید"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-[11px] font-black shrink-0 tabular-nums">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 px-1.5 py-0.5 rounded bg-stone-50 border border-stone-200">
                    {item.id}
                  </span>
                  {isStaffOnly && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                      ویژه مدیران/ستاد
                    </span>
                  )}
                  {isProtectedHome && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>ثابت</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, idx - 1)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 disabled:opacity-30 cursor-pointer"
                    title="انتقال به بالا"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, idx + 1)}
                    className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 disabled:opacity-30 cursor-pointer"
                    title="انتقال به پایین"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {!isProtectedHome && (
                    <button
                      type="button"
                      onClick={() => toggleItemVisibility(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                        isVisible
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                      }`}
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{isVisible ? 'نمایش' : 'مخفی'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className={subTab === 'services' ? 'sm:col-span-4' : item.subtext !== undefined ? 'sm:col-span-5' : 'sm:col-span-12'}>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">
                    عنوان نمایشی:
                  </label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => updateItemField(idx, 'label', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-stone-50 focus:bg-white border border-stone-300 text-xs font-black text-stone-900 focus:outline-emerald-700"
                  />
                </div>

                {subTab === 'services' && (
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">
                      نشان / برچسب (Badge):
                    </label>
                    <input
                      type="text"
                      value={item.badge ?? ''}
                      onChange={e => updateItemField(idx, 'badge', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-stone-50 focus:bg-white border border-stone-300 text-xs font-bold text-stone-800 focus:outline-emerald-700"
                    />
                  </div>
                )}

                {item.subtext !== undefined && (
                  <div className={subTab === 'services' ? 'sm:col-span-5' : 'sm:col-span-7'}>
                    <label className="block text-[10px] font-bold text-stone-500 mb-1">
                      توضیح کوتاه زیرعنوان:
                    </label>
                    <input
                      type="text"
                      value={item.subtext ?? ''}
                      onChange={e => updateItemField(idx, 'subtext', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-stone-50 focus:bg-white border border-stone-300 text-xs text-stone-700 focus:outline-emerald-700"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

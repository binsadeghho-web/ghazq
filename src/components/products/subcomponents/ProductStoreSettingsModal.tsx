import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ProductCategoryConfig,
  ProductPaymentGateway,
  ProductsStoreConfig,
} from '../../../types';
import {
  CATEGORY_KIND_LABELS,
  getAllProductCategories,
} from './productUiHelpers';
import {
  X,
  Sliders,
  CreditCard,
  Truck,
  Power,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Tags,
} from 'lucide-react';

interface ProductStoreSettingsModalProps {
  isOpen: boolean;
  config: ProductsStoreConfig;
  onClose: () => void;
  onSave: (updates: Partial<ProductsStoreConfig>) => Promise<void>;
}

export const ProductStoreSettingsModal: React.FC<ProductStoreSettingsModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<ProductsStoreConfig>(config);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newGatewayName, setNewGatewayName] = useState('');
  const [newGatewayDesc, setNewGatewayDesc] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryKind, setNewCategoryKind] = useState<ProductCategoryConfig['kind']>('custom');
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const cloned: ProductsStoreConfig = JSON.parse(JSON.stringify(config));
      cloned.customCategories = getAllProductCategories(cloned);
      setForm(cloned);
      setErrorMsg(null);
      setNewCategoryLabel('');
      setNewCategoryKind('custom');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, config]);

  if (!isOpen) return null;

  const categoriesList = getAllProductCategories(form);

  const handleAddCategory = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const slugId = `cat_${Date.now().toString(36)}`;
    const nextCat: ProductCategoryConfig = {
      id: slugId,
      label,
      shortLabel: label.length > 18 ? label.slice(0, 18) : label,
      kind: newCategoryKind,
      isEnabled: true,
      isBuiltIn: false,
    };
    setForm(prev => {
      const currentCats = getAllProductCategories(prev);
      return {
        ...prev,
        enabledCategories: {
          ...(prev.enabledCategories || {}),
          [slugId]: true,
        },
        customCategories: [...currentCats, nextCat],
      };
    });
    setNewCategoryLabel('');
  };

  const handleRemoveCustomCategory = (catId: string) => {
    setForm(prev => {
      const nextEnabled = { ...(prev.enabledCategories || {}) };
      delete nextEnabled[catId];
      const nextCats = getAllProductCategories(prev).filter(c => c.id !== catId || c.isBuiltIn);
      return {
        ...prev,
        enabledCategories: nextEnabled,
        customCategories: nextCats,
      };
    });
  };

  const handleToggleCategory = (catId: string, checked: boolean) => {
    setForm(prev => {
      const nextCats = getAllProductCategories(prev).map(c =>
        c.id === catId ? { ...c, isEnabled: checked } : c
      );
      return {
        ...prev,
        enabledCategories: {
          ...(prev.enabledCategories || {}),
          [catId]: checked,
        },
        customCategories: nextCats,
      };
    });
  };

  const handleRenameCategory = (catId: string, label: string) => {
    setForm(prev => {
      const nextCats = getAllProductCategories(prev).map(c =>
        c.id === catId ? { ...c, label, shortLabel: label.length > 18 ? label.slice(0, 18) : label } : c
      );
      return {
        ...prev,
        customCategories: nextCats,
      };
    });
  };

  const handleAddGateway = () => {
    const trimmed = newGatewayName.trim();
    if (!trimmed) return;
    const item: ProductPaymentGateway = {
      id: `gw_${Date.now().toString(36)}`,
      name: trimmed,
      providerCode: 'custom',
      description: newGatewayDesc.trim() || 'درگاه پرداخت بانکی عضو شتاب',
      badge: 'فعال',
      isActive: true,
    };
    setForm(prev => ({ ...prev, gateways: [...(prev.gateways || []), item] }));
    setNewGatewayName('');
    setNewGatewayDesc('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      await onSave({
        ...form,
        customCategories: getAllProductCategories(form),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ذخیره تنظیمات بخش محصولات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] text-right"
        >
          <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-2 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sliders className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black truncate">
                  تنظیمات بخش کتاب و محصولات چند رسانه‌ای
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  کنترل وضعیت کل بخش، عناوین دسته‌بندی، درگاه‌های پرداخت و تعرفه‌های ارسال
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form id="product-store-settings-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-6 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Master Store Switch & Presentation Categories */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${form.isStoreEnabled ? 'text-emerald-600' : 'text-rose-500'}`} />
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                      وضعیت فعال‌سازی کل بخش «کتاب و محصولات چند رسانه‌ای» برای همه کاربران
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      با روشن بودن این گزینه، کلیه دستگاه‌ها و کاربران مجاز در RBAC به بخش و محصولات دسترسی فوری خواهند داشت.
                    </p>
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={form.isStoreEnabled}
                    onChange={e => setForm(prev => ({ ...prev, isStoreEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <span className={`font-black ${form.isStoreEnabled ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {form.isStoreEnabled ? 'بخش برای همه فعال است' : 'کل بخش غیرفعال'}
                  </span>
                </label>
              </div>

              {!form.isStoreEnabled && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    پیام اطلاع‌رسانی هنگام غیرفعال بودن بخش:
                  </label>
                  <input
                    type="text"
                    value={form.disabledNotice || ''}
                    onChange={e => setForm(prev => ({ ...prev, disabledNotice: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4 text-amber-500" />
                  <span className="font-black text-slate-800 dark:text-slate-200">
                    عناوین دسته‌بندی و نوع ارائه (کتب، نشست‌ها، درس‌گفتارها و عناوین جدید):
                  </span>
                </div>

                <div className="space-y-2">
                  {categoriesList.map(cat => {
                    const checked = form.enabledCategories?.[cat.id] !== false;
                    return (
                      <div
                        key={cat.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border transition-colors ${
                          checked
                            ? 'bg-white dark:bg-slate-900 border-emerald-500/35'
                            : 'bg-rose-500/5 border-rose-500/30 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => handleToggleCategory(cat.id, e.target.checked)}
                            className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={cat.label}
                            onChange={e => handleRenameCategory(cat.id, e.target.value)}
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {CATEGORY_KIND_LABELS[cat.kind || 'custom']}
                            {cat.isBuiltIn ? ' · پیش‌فرض' : ' · سفارشی'}
                          </span>
                          {!cat.isBuiltIn && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomCategory(cat.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="حذف عنوان سفارشی"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                  <input
                    type="text"
                    value={newCategoryLabel}
                    onChange={e => setNewCategoryLabel(e.target.value)}
                    placeholder="عنوان دسته‌بندی جدید (مثلاً: کرسی‌های نظریه‌پردازی / همایش ملی)..."
                    className="sm:col-span-6 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                  <select
                    value={newCategoryKind}
                    onChange={e => setNewCategoryKind(e.target.value as ProductCategoryConfig['kind'])}
                    className="sm:col-span-3 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="custom">عنوان ارائه جدید</option>
                    <option value="session">نوع نشست (صوتی/تصویری)</option>
                    <option value="lecture">نوع درس‌گفتار</option>
                    <option value="book">نوع کتاب / مکتوب</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="sm:col-span-3 px-3 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-stone-950 font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن عنوان جدید</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Store Identity Texts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان اصلی بخش:</label>
                <input
                  type="text"
                  value={form.storeTitle}
                  onChange={e => setForm(prev => ({ ...prev, storeTitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">زیرعنوان توضیحی بخش:</label>
                <input
                  type="text"
                  value={form.storeSubtitle}
                  onChange={e => setForm(prev => ({ ...prev, storeSubtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* 3. Payment Gateways & Bank Card Info */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <h4 className="font-black text-slate-900 dark:text-white text-sm">
                  درگاه‌های پرداخت آنلاین و مشخصات واریز فیش
                </h4>
              </div>

              <div className="space-y-2">
                {(form.gateways || []).map((gw, idx) => (
                  <div
                    key={gw.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={gw.isActive}
                          onChange={e =>
                            setForm(prev => ({
                              ...prev,
                              gateways: prev.gateways.map((item, i) =>
                                i === idx ? { ...item, isActive: e.target.checked } : item
                              ),
                            }))
                          }
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                        <span className="font-black text-slate-900 dark:text-white">{gw.name}</span>
                      </div>
                      {gw.description && (
                        <p className="text-[11px] text-slate-500 mr-6 mt-0.5">{gw.description}</p>
                      )}
                    </div>
                    {form.gateways.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm(prev => ({
                            ...prev,
                            gateways: prev.gateways.filter((_, i) => i !== idx),
                          }))
                        }
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg self-end sm:self-center cursor-pointer"
                        title="حذف درگاه"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <input
                  type="text"
                  value={newGatewayName}
                  onChange={e => setNewGatewayName(e.target.value)}
                  placeholder="نام درگاه جدید (مثلاً: درگاه سداد ملی)"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={newGatewayDesc}
                  onChange={e => setNewGatewayDesc(e.target.value)}
                  placeholder="توضیح کوتاه درگاه..."
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={handleAddGateway}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن درگاه</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شماره کارت جهت واریز فیش:</label>
                  <input
                    type="text"
                    value={form.bankCardNumber || ''}
                    onChange={e => setForm(prev => ({ ...prev, bankCardNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام بانک و صاحب حساب:</label>
                  <input
                    type="text"
                    value={form.bankAccountHolder || ''}
                    onChange={e => setForm(prev => ({ ...prev, bankAccountHolder: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* 4. Default Physical Delivery Options */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-500" />
                <h4 className="font-black text-slate-900 dark:text-white text-sm">
                  تعرفه‌های پیش‌فرض تحویل و ارسال نسخه‌های فیزیکی
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'complexPickup' as const, title: 'تحویل حضوری در مجتمع' },
                  { key: 'postal' as const, title: 'ارسال با پست پیشتاز' },
                  { key: 'courier' as const, title: 'ارسال با پیک اختصاصی' },
                ].map(opt => {
                  const current = form.defaultDeliveryOptions?.[opt.key] || { enabled: true, fee: 0, label: opt.title, notice: '' };
                  return (
                    <div
                      key={opt.key}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <label className="sm:col-span-4 flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={current.enabled}
                          onChange={e =>
                            setForm(prev => ({
                              ...prev,
                              defaultDeliveryOptions: {
                                ...prev.defaultDeliveryOptions,
                                [opt.key]: { ...current, enabled: e.target.checked },
                              },
                            }))
                          }
                          className="w-4 h-4 accent-sky-600 cursor-pointer"
                        />
                        <span>{opt.title}</span>
                      </label>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-500 mb-0.5">هزینه پیش‌فرض (تومان):</label>
                        <input
                          type="number"
                          min={0}
                          value={current.fee}
                          onChange={e =>
                            setForm(prev => ({
                              ...prev,
                              defaultDeliveryOptions: {
                                ...prev.defaultDeliveryOptions,
                                [opt.key]: { ...current, fee: Math.max(0, Number(e.target.value || 0)) },
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono tabular-nums"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] text-slate-500 mb-0.5">راهنما / آدرس تحویل:</label>
                        <input
                          type="text"
                          value={current.notice || ''}
                          onChange={e =>
                            setForm(prev => ({
                              ...prev,
                              defaultDeliveryOptions: {
                                ...prev.defaultDeliveryOptions,
                                [opt.key]: { ...current, notice: e.target.value },
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </form>

          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[42px] rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              form="product-store-settings-form"
              disabled={saving}
              className="px-6 py-2.5 min-h-[42px] rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات فروشگاه'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

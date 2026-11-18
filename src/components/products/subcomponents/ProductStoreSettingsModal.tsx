import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ProductPaymentGateway,
  ProductsStoreConfig,
} from '../../../types';
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

  useEffect(() => {
    if (isOpen) {
      setForm(JSON.parse(JSON.stringify(config)));
      setErrorMsg(null);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

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
      await onSave(form);
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm sm:text-base font-black">
                  تنظیمات بخش کتاب و محصولات چند رسانه‌ای
                </h3>
                <p className="text-[11px] text-slate-400">
                  کنترل فعال‌سازی بخش و دسته‌بندی‌ها (اصلاح ۳۰)، درگاه‌های پرداخت و تعرفه‌های پیش‌فرض ارسال
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Master Store Switch & Category Switches (Reform 30) */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${form.isStoreEnabled ? 'text-emerald-600' : 'text-rose-500'}`} />
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">
                      وضعیت فعال‌سازی کل بخش «کتاب و محصولات چند رسانه‌ای»
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      در صورت خاموش شدن، دسترسی خرید و مشاهده بخش برای دانش‌آموختگان و مشتریان متوقف می‌شود (مدیران همچنان دسترسی مدیریتی دارند).
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
                    {form.isStoreEnabled ? 'بخش فعال است' : 'کل بخش غیرفعال'}
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

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="block font-black text-slate-800 dark:text-slate-200 mb-2">
                  کنترل مستقل فعال/غیرفعال‌سازی هر دسته‌بندی (اصلاح ۳۰):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'book' as const, label: 'فروش بخش کتاب' },
                    { key: 'multimedia' as const, label: 'فروش محصولات چندرسانه‌ای' },
                    { key: 'audio_series' as const, label: 'فروش بخش صوت و درس‌گفتار' },
                  ].map(cat => {
                    const checked = form.enabledCategories?.[cat.key] !== false;
                    return (
                      <label
                        key={cat.key}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? 'bg-white dark:bg-slate-900 border-emerald-500/40'
                            : 'bg-rose-500/5 border-rose-500/30 opacity-80'
                        }`}
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cat.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e =>
                            setForm(prev => ({
                              ...prev,
                              enabledCategories: {
                                ...prev.enabledCategories,
                                [cat.key]: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                      </label>
                    );
                  })}
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

            {/* 3. Payment Gateways & Bank Card Info (Reform 26) */}
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

            {/* 4. Default Physical Delivery Options (Reform 26) */}
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

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات فروشگاه'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

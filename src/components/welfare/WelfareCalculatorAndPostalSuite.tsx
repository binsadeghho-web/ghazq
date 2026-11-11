import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Calculator,
  Truck,
  PackageCheck,
  AlertTriangle,
  Sliders,
  Check,
  Save,
  Boxes,
} from 'lucide-react';

interface WelfareCalculatorAndPostalSuiteProps {
  mode: 'calculator' | 'postal_and_inventory' | 'all';
  isOfficial: boolean;
}

export const WelfareCalculatorAndPostalSuite: React.FC<WelfareCalculatorAndPostalSuiteProps> = ({
  mode,
  isOfficial,
}) => {
  const {
    currentUser,
    loanTermsAndRules,
    updateLoanTermsAndRules,
    consumables,
    consumableOrders,
    refreshWelfare,
  } = useApp() as any;

  // Calculator State
  const [principalToman, setPrincipalToman] = useState<number>(100_000_000);
  const [months, setMonths] = useState<number>(loanTermsAndRules?.maxInstallments || 24);
  const [adminCommission, setAdminCommission] = useState<number>(
    Number(loanTermsAndRules?.loanCommissionRate) || 2
  );
  const [adminMaxInstallments, setAdminMaxInstallments] = useState<number>(
    Number(loanTermsAndRules?.maxInstallments) || 36
  );
  const [adminGraceMonths, setAdminGraceMonths] = useState<number>(
    Number(loanTermsAndRules?.installmentGracePeriodMonths) || 2
  );
  const [adminMaxAmountDisplay, setAdminMaxAmountDisplay] = useState<string>(
    loanTermsAndRules?.maxLoanAmountDisplay || '۱۵۰ میلیون تومان'
  );

  // Postal Tracking State
  const [postalCodeInputs, setPostalCodeInputs] = useState<Record<string, string>>({});
  const [shippingStatusInputs, setShippingStatusInputs] = useState<Record<string, string>>({});

  // Inventory Manager State
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [thresholdInputs, setThresholdInputs] = useState<Record<string, number>>({});

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const commissionRate = Number(loanTermsAndRules?.loanCommissionRate ?? adminCommission ?? 2);
  const maxMonths = Number(loanTermsAndRules?.maxInstallments ?? adminMaxInstallments ?? 36);
  const effectiveMonths = Math.min(Math.max(1, months), maxMonths);

  const totalCommission = Math.round((principalToman * commissionRate) / 100);
  const totalRepayment = principalToman + totalCommission;
  const monthlyInstallment = Math.round(totalRepayment / effectiveMonths);

  const handleSaveLoanConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateLoanTermsAndRules) return;
    try {
      await updateLoanTermsAndRules({
        ...loanTermsAndRules,
        loanCommissionRate: adminCommission,
        maxInstallments: adminMaxInstallments,
        installmentGracePeriodMonths: adminGraceMonths,
        maxLoanAmountDisplay: adminMaxAmountDisplay,
      });
      showToast('نرخ کارمزد، سقف اقساط و ضوابط تسهیلات با موفقیت در پایگاه داده ذخیره گردید.');
    } catch (err: any) {
      showToast(`خطا در ذخیره ضوابط تسهیلات: ${err.message}`);
    }
  };

  const handleSavePostalTracking = async (order: any) => {
    const code = postalCodeInputs[order.id] ?? order.postalTrackingCode ?? '';
    const status = (shippingStatusInputs[order.id] ?? order.shippingStatus ?? 'shipped') as
      | 'preparing'
      | 'shipped'
      | 'delivered';
    try {
      await api.updateConsumableOrderPostalTracking(order.id, {
        postalTrackingCode: code,
        shippingStatus: status,
        expectedVersion: order.version || 1,
      });
      if (refreshWelfare) await refreshWelfare();
      showToast(`کد رهگیری پستی سفارش «${order.applicantName}» ثبت و همگام‌سازی شد.`);
    } catch (err: any) {
      showToast(`خطا در ثبت کد رهگیری پستی: ${err.message}`);
    }
  };

  const handleSaveInventory = async (item: any) => {
    const nextStock = stockInputs[item.id] !== undefined ? stockInputs[item.id] : Number(item.stock) || 0;
    const nextThreshold =
      thresholdInputs[item.id] !== undefined
        ? thresholdInputs[item.id]
        : Number(item.lowStockThreshold ?? 5);
    try {
      await api.updateConsumableInventory(item.id, {
        stock: nextStock,
        lowStockThreshold: nextThreshold,
        expectedVersion: item.version || 1,
      });
      if (refreshWelfare) await refreshWelfare();
      showToast(`موجودی انبار و حد هشدار برای «${item.title || item.name}» به‌روزرسانی شد.`);
    } catch (err: any) {
      showToast(`خطا در به‌روزرسانی موجودی: ${err.message}`);
    }
  };

  const visibleOrders = isOfficial
    ? consumableOrders || []
    : (consumableOrders || []).filter((o: any) => o.applicantId === currentUser?.id);

  return (
    <div className="space-y-5" dir="rtl">
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ۱. ماشین‌حساب تسهیلات + پنل تنظیم کارمزد و اقساط توسط ادمین */}
      {(mode === 'calculator' || mode === 'all') && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-800" />
              <span>ماشین‌حساب آنلاین اقساط و کارمزد تسهیلات قرض‌الحسنه</span>
            </h3>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full">
              کارمزد مصوب فعلی: {toPersianNumbers(commissionRate)}٪ | سقف اقساط:{' '}
              {toPersianNumbers(maxMonths)} ماه
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-stone-700 mb-1.5">
                  <span>مبلغ وام درخواستی:</span>
                  <span className="font-mono font-black text-teal-900">
                    {toPersianNumbers(principalToman.toLocaleString('fa-IR'))} تومان
                  </span>
                </div>
                <input
                  type="range"
                  min={10_000_000}
                  max={300_000_000}
                  step={5_000_000}
                  value={principalToman}
                  onChange={e => setPrincipalToman(Number(e.target.value))}
                  className="w-full accent-teal-800 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-stone-700 mb-1.5">
                  <span>تعداد اقساط بازپرداخت:</span>
                  <span className="font-mono font-black text-teal-900">
                    {toPersianNumbers(effectiveMonths)} ماه
                  </span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={maxMonths}
                  step={3}
                  value={effectiveMonths}
                  onChange={e => setMonths(Number(e.target.value))}
                  className="w-full accent-teal-800 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>اصل مبلغ تسهیلات:</span>
                <strong className="font-mono text-stone-900">
                  {toPersianNumbers(principalToman.toLocaleString('fa-IR'))} تومان
                </strong>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>کل کارمزد ({toPersianNumbers(commissionRate)}٪):</span>
                <strong className="font-mono text-amber-800">
                  {toPersianNumbers(totalCommission.toLocaleString('fa-IR'))} تومان
                </strong>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>مجموع کل بازپرداخت:</span>
                <strong className="font-mono text-stone-900">
                  {toPersianNumbers(totalRepayment.toLocaleString('fa-IR'))} تومان
                </strong>
              </div>
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm">
                <span className="font-black text-teal-950">مبلغ هر قسط ماهانه:</span>
                <span className="font-mono font-black text-teal-800 text-base">
                  {toPersianNumbers(monthlyInstallment.toLocaleString('fa-IR'))} تومان
                </span>
              </div>
            </div>
          </div>

          {/* تنظیمات کارمزد و اقساط توسط ادمین */}
          {isOfficial && (
            <form
              onSubmit={handleSaveLoanConfig}
              className="pt-4 border-t border-stone-200 space-y-3"
            >
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>تنظیمات ادمین: کنترل نرخ کارمزد، سقف اقساط و دوره تنفس تسهیلات:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    نرخ کارمزد وام (درصد):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    step={0.5}
                    value={adminCommission}
                    onChange={e => setAdminCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    حداکثر تعداد اقساط (ماه):
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={120}
                    value={adminMaxInstallments}
                    onChange={e => setAdminMaxInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    دوره تنفس (ماه):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={adminGraceMonths}
                    onChange={e => setAdminGraceMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    عنوان سقف وام:
                  </label>
                  <input
                    type="text"
                    value={adminMaxAmountDisplay}
                    onChange={e => setAdminMaxAmountDisplay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ذخیره تنظیمات کارمزد و اقساط</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ۲. مدیریت موجودی انبار تعاونی و هشدار اتمام موجودی + رهگیری پستی مرسولات */}
      {(mode === 'postal_and_inventory' || mode === 'all') && (
        <div className="space-y-5">
          {/* مدیریت موجودی انبار توسط ادمین */}
          {isOfficial && (
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-teal-800" />
                  <span>مدیریت موجودی انبار تعاونی و حد هشدار اتمام موجودی (کسر خودکار با هر سفارش)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(consumables || []).map((item: any) => {
                  const currentStock =
                    stockInputs[item.id] !== undefined ? stockInputs[item.id] : Number(item.stock) || 0;
                  const currentThreshold =
                    thresholdInputs[item.id] !== undefined
                      ? thresholdInputs[item.id]
                      : Number(item.lowStockThreshold ?? 5);
                  const isOut = Number(item.stock) <= 0;
                  const isLow = !isOut && Number(item.stock) <= Number(item.lowStockThreshold ?? 5);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border space-y-3 text-xs ${
                        isOut
                          ? 'bg-rose-50/70 border-rose-300'
                          : isLow
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="font-black text-stone-900 truncate">
                          {item.title || item.name}
                        </strong>
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                            ناموجود (توقف سفارش)
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-black flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>رو به اتمام</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                            موجود در انبار
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-1">
                            موجودی فعلی ({item.unit}):
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={currentStock}
                            onChange={e =>
                              setStockInputs(prev => ({
                                ...prev,
                                [item.id]: Math.max(0, Number(e.target.value) || 0),
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-stone-300 font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-1">
                            حد هشدار اتمام:
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={currentThreshold}
                            onChange={e =>
                              setThresholdInputs(prev => ({
                                ...prev,
                                [item.id]: Math.max(1, Number(e.target.value) || 1),
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-stone-300 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveInventory(item)}
                        className="w-full py-1.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-[11px] font-black cursor-pointer"
                      >
                        ثبت موجودی انبار
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* رهگیری مرسولات پستی تعاونی و ثبت کد رهگیری توسط ادمین */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-800" />
                <span>سامانه رهگیری پستی کالاهای تعاونی و ثبت کد مرسوله</span>
              </h3>
              <span className="text-[11px] text-stone-500 font-bold">
                تعداد سفارشات: {toPersianNumbers(visibleOrders.length)} فقره
              </span>
            </div>

            {visibleOrders.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-6">
                هیچ سفارش کالایی جهت رهگیری پستی ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleOrders.map((ord: any) => {
                  const shipStatus = ord.shippingStatus || 'preparing';
                  const trackingCode = ord.postalTrackingCode || '';
                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="w-4 h-4 text-teal-700" />
                          <strong className="font-black text-stone-900">
                            سفارش: {ord.applicantName}
                          </strong>
                          <span className="text-stone-400">·</span>
                          <span className="font-mono font-bold text-teal-800">
                            {toPersianNumbers((ord.totalAmount || 0).toLocaleString('fa-IR'))} تومان
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600">
                          نشانی تحویل: {ord.deliveryAddress || 'ثبت نشده'}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black ${
                              shipStatus === 'delivered'
                                ? 'bg-emerald-100 text-emerald-900'
                                : shipStatus === 'shipped'
                                ? 'bg-sky-100 text-sky-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            وضعیت ارسال پستی:{' '}
                            {shipStatus === 'delivered'
                              ? 'تحویل داده شده'
                              : shipStatus === 'shipped'
                              ? 'ارسال شده با پست پیشتاز'
                              : 'در حال آماده‌سازی در انبار'}
                          </span>
                          {trackingCode ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-white border border-stone-300 font-mono font-black text-stone-900">
                              کد رهگیری پستی: {toPersianNumbers(trackingCode)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400">
                              کد رهگیری پستی هنوز صادر نشده است
                            </span>
                          )}
                        </div>
                      </div>

                      {isOfficial && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <select
                            value={shippingStatusInputs[ord.id] ?? shipStatus}
                            onChange={e =>
                              setShippingStatusInputs(prev => ({
                                ...prev,
                                [ord.id]: e.target.value,
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold"
                          >
                            <option value="preparing">در حال آماده‌سازی</option>
                            <option value="shipped">ارسال شده با پست</option>
                            <option value="delivered">تحویل شده</option>
                          </select>
                          <input
                            type="text"
                            placeholder="کد رهگیری ۲۴ رقمی پست..."
                            value={postalCodeInputs[ord.id] ?? trackingCode}
                            onChange={e =>
                              setPostalCodeInputs(prev => ({
                                ...prev,
                                [ord.id]: e.target.value,
                              }))
                            }
                            className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-mono w-48"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePostalTracking(ord)}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-black cursor-pointer"
                          >
                            ثبت کد رهگیری
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

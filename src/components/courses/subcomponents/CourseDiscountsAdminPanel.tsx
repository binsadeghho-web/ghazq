import React, { useState, useEffect, useCallback } from 'react';
import { Course, CourseDiscountCode, CourseDiscountCategory, CourseScope } from '../../../types';
import { api } from '../../../services/apiClient';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  Tag,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  Power,
  X,
  RefreshCw,
  Edit3,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface CourseDiscountsAdminPanelProps {
  courses: Course[];
  scope?: CourseScope;
  hideNationalId?: boolean;
}

const DISCOUNT_CATEGORY_LABELS: Record<CourseDiscountCategory, string> = {
  percentage: 'تخفیف درصدی استاندارد',
  fixed_amount: 'تخفیف مبلغی ثابت (تومان)',
  single_course: 'کد تخفیف ویژه یک دوره/کارگاه مشخص',
  multi_course: 'کد تخفیف ویژه چند دوره/کارگاه انتخابی',
  all_courses: 'کد تخفیف سراسری (همه موارد این بخش)',
  audience_specific: 'کد تخفیف ویژه مخاطبان (طلاب، قضات، وکلا...)',
  user_specific: 'کد تخفیف اختصاصی افراد (کد ملی مشخص)',
  early_bird: 'کد تخفیف ثبت‌نام زودهنگام / مناسبتی زمان‌دار',
};

const AUDIENCE_PRESETS = ['طلاب و فضلای حوزه', 'قضات دادگستری', 'وکلای دادگستری', 'پژوهشگران و دانشجویان دکتری', 'ایثارگران و رتبه‌های برتر'];

export const CourseDiscountsAdminPanel: React.FC<CourseDiscountsAdminPanelProps> = ({
  courses,
  scope = 'specialized',
  hideNationalId = false,
}) => {
  const pluralNoun = scope === 'counseling_workshop' ? 'کارگاه‌های آموزشی' : 'دوره‌ها';
  const unitNoun = scope === 'counseling_workshop' ? 'کارگاه' : 'دوره';
  const [discounts, setDiscounts] = useState<CourseDiscountCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create / Edit Form Modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CourseDiscountCode | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountCategory, setDiscountCategory] = useState<CourseDiscountCategory>('percentage');
  const [valueType, setValueType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(0);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [allowedNationalIdsText, setAllowedNationalIdsText] = useState('');
  const [maxUses, setMaxUses] = useState<string>('50');
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [startsAt, setStartsAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [startsAtJalali, setStartsAtJalali] = useState<string>('');
  const [expiresAtJalali, setExpiresAtJalali] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  // Full Specification & Usage Report Modal
  const [detailsModalCode, setDetailsModalCode] = useState<CourseDiscountCode | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.getCourseDiscountCodes(false, scope);
      setDiscounts(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در دریافت لیست کدهای تخفیف.' });
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    loadDiscounts();
    const unsub = api.subscribeToEvents(ev => {
      if (ev.type === 'courses.discount_updated' || ev.type === 'courses.enrolled') {
        loadDiscounts();
      }
    });
    return () => unsub();
  }, [loadDiscounts]);

  const resetForm = () => {
    setEditingCode(null);
    setCode(`FEQH${Math.floor(100 + Math.random() * 900)}`);
    setTitle('');
    setDescription('');
    setDiscountCategory('percentage');
    setValueType('percent');
    setDiscountValue(20);
    setMaxDiscountAmount('');
    setMinPurchaseAmount(0);
    setSelectedCourseId(courses[0]?.id || '');
    setSelectedCourseIds([]);
    setTargetAudiences([]);
    setAllowedNationalIdsText('');
    setMaxUses('50');
    setPerUserLimit(1);
    setStartsAt('');
    setExpiresAt('');
    setStartsAtJalali('');
    setExpiresAtJalali('');
    setIsActive(true);
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (dc: CourseDiscountCode) => {
    setEditingCode(dc);
    setCode(dc.code);
    setTitle(dc.title);
    setDescription(dc.description || '');
    setDiscountCategory(dc.discountCategory);
    setValueType(dc.valueType);
    setDiscountValue(dc.discountValue);
    setMaxDiscountAmount(dc.maxDiscountAmount ? String(dc.maxDiscountAmount) : '');
    setMinPurchaseAmount(dc.minPurchaseAmount || 0);
    setSelectedCourseId(dc.courseId || '');
    setSelectedCourseIds(dc.courseIds || []);
    setTargetAudiences(dc.targetAudiences || []);
    setAllowedNationalIdsText((dc.allowedNationalIds || []).join(', '));
    setMaxUses(dc.maxUses !== null && dc.maxUses !== undefined ? String(dc.maxUses) : '');
    setPerUserLimit(dc.perUserLimit || 1);
    setStartsAt(dc.startsAt ? dc.startsAt.slice(0, 10) : '');
    setExpiresAt(dc.expiresAt ? dc.expiresAt.slice(0, 10) : '');
    setStartsAtJalali(dc.startsAtJalali || '');
    setExpiresAtJalali(dc.expiresAtJalali || '');
    setIsActive(dc.isActive);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || undefined,
        scope,
        discountCategory,
        valueType,
        discountValue: Number(discountValue),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        minPurchaseAmount: Number(minPurchaseAmount || 0),
        courseId: discountCategory === 'single_course' ? selectedCourseId || null : null,
        courseIds: discountCategory === 'multi_course' ? selectedCourseIds : [],
        targetAudiences: discountCategory === 'audience_specific' ? targetAudiences : [],
        allowedNationalIds:
          discountCategory === 'user_specific' && !hideNationalId
            ? allowedNationalIdsText
                .split(/[,،\s\n]+/)
                .map(s => s.trim())
                .filter(Boolean)
            : [],
        maxUses: maxUses.trim() ? Number(maxUses) : null,
        perUserLimit: Number(perUserLimit || 1),
        startsAt: startsAt || null,
        expiresAt: expiresAt || null,
        startsAtJalali: startsAtJalali || undefined,
        expiresAtJalali: expiresAtJalali || undefined,
        isActive,
      };

      if (editingCode) {
        await api.updateCourseDiscountCode(editingCode.id, payload, editingCode.version);
        setFeedback({ type: 'success', text: `کد تخفیف «${payload.code}» با موفقیت بروزرسانی شد.` });
      } else {
        await api.createCourseDiscountCode(payload);
        setFeedback({ type: 'success', text: `کد تخفیف «${payload.code}» با موفقیت ایجاد شد.` });
      }
      setFormOpen(false);
      await loadDiscounts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره کد تخفیف.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (dc: CourseDiscountCode) => {
    try {
      await api.updateCourseDiscountCode(dc.id, { isActive: !dc.isActive }, dc.version);
      await loadDiscounts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در تغییر وضعیت کد تخفیف.' });
    }
  };

  const handleDelete = async (dc: CourseDiscountCode) => {
    try {
      await api.deleteCourseDiscountCode(dc.id, dc.version);
      setFeedback({ type: 'success', text: `کد تخفیف «${dc.code}» حذف منطقی شد.` });
      await loadDiscounts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در حذف کد تخفیف.' });
    }
  };

  const handleOpenDetails = async (dc: CourseDiscountCode) => {
    setDetailsModalCode(dc);
    setLoadingDetails(true);
    try {
      const full = await api.getCourseDiscountDetails(dc.id);
      setDetailsModalCode(full);
    } catch {
      // Keep basic info if detail fetch fails
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <span>استودیو تعریف انواع کد تخفیف {pluralNoun} و گزارش کامل مصرف</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            امکان تعریف کد تخفیف درصدی، مبلغ ثابت، تک‌دوره‌ای، چنددوره‌ای، سراسری، گروه مخاطبان، اختصاصی کد ملی و زمان‌دار به همراه نمایش کامل مشخصات و استفاده‌کنندگان
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDiscounts}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف کد تخفیف جدید</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Codes Grid */}
      {discounts.length === 0 ? (
        <div className="p-10 text-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-2">
          <Tag className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-bold">هنوز هیچ کد تخفیفی برای دوره‌ها تعریف نشده است.</p>
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black cursor-pointer"
          >
            ایجاد اولین کد تخفیف
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {discounts.map(dc => (
            <div
              key={dc.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                dc.isActive
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  : 'bg-slate-100/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-75'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-black text-sm tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 inline-block">
                      {dc.code}
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-white mt-2">{dc.title}</h4>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                      dc.isActive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-500/15 text-rose-600'
                    }`}
                  >
                    {dc.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                  {DISCOUNT_CATEGORY_LABELS[dc.discountCategory] || dc.discountCategory}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-500">میزان تخفیف:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                    {dc.valueType === 'percent'
                      ? `${toPersianNumbers(dc.discountValue)}٪${
                          dc.maxDiscountAmount
                            ? ` (سقف ${toPersianNumbers(dc.maxDiscountAmount.toLocaleString('fa-IR'))} ت)`
                            : ''
                        }`
                      : `${toPersianNumbers(dc.discountValue.toLocaleString('fa-IR'))} تومان`}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    تعداد استفاده: <strong className="text-slate-900 dark:text-white">{toPersianNumbers(dc.usedCount)}</strong>
                    {dc.maxUses ? ` از ${toPersianNumbers(dc.maxUses)}` : ' (نامحدود)'}
                  </span>
                  {dc.expiresAtJalali && (
                    <span className="font-mono">تا {toPersianNumbers(dc.expiresAtJalali)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenDetails(dc)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-black flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>مشخصات کامل و گزارش</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEditForm(dc)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
                  title="ویرایش"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(dc)}
                  className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 cursor-pointer"
                  title={dc.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(dc)}
                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 cursor-pointer"
                  title="حذف منطقی"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setFormOpen(false)}
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <strong className="text-sm font-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{editingCode ? `ویرایش کد تخفیف ${editingCode.code}` : 'تعریف کد تخفیف جدید (انواع کدهای تخفیف)'}</span>
              </strong>
              <button type="button" onClick={() => setFormOpen(false)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block">کد تخفیف (لاتین و حروف بزرگ):</label>
                  <input
                    required
                    disabled={Boolean(editingCode)}
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="مثال: QAZA1404"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono font-black uppercase dir-ltr disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">عنوان جشنواره یا علت تخفیف:</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="مثال: تخفیف ویژه طلاب و قضات"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block">نوع کد تخفیف:</label>
                <select
                  value={discountCategory}
                  onChange={e => {
                    const cat = e.target.value as CourseDiscountCategory;
                    setDiscountCategory(cat);
                    if (cat === 'fixed_amount') setValueType('fixed');
                    if (cat === 'percentage') setValueType('percent');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-black"
                >
                  {Object.entries(DISCOUNT_CATEGORY_LABELS)
                    .filter(([k]) => !(hideNationalId && k === 'user_specific'))
                    .map(([k, lbl]) => (
                      <option key={k} value={k}>{lbl}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block">نوع محاسبه کسر:</label>
                  <select
                    value={valueType}
                    onChange={e => setValueType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    <option value="percent">درصدی (٪)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">
                    {valueType === 'percent' ? 'درصد تخفیف (۱ تا ۱۰۰):' : 'مبلغ تخفیف (تومان):'}
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={valueType === 'percent' ? 100 : undefined}
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold block">سقف مبلغ تخفیف (اختیاری - تومان):</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={e => setMaxDiscountAmount(e.target.value)}
                    placeholder="بدون سقف"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Conditional Scope Controls */}
              {discountCategory === 'single_course' && (
                <div className="space-y-1">
                  <label className="font-bold block">دوره مشمول تخفیف:</label>
                  <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {discountCategory === 'multi_course' && (
                <div className="space-y-1.5">
                  <label className="font-bold block">انتخاب دوره‌های مشمول:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {courses.map(c => {
                      const checked = selectedCourseIds.includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedCourseIds(prev =>
                                checked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                              )
                            }
                          />
                          <span className="truncate font-semibold">{c.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {discountCategory === 'audience_specific' && (
                <div className="space-y-1.5">
                  <label className="font-bold block">گروه مخاطبان مجاز:</label>
                  <div className="flex flex-wrap gap-2">
                    {AUDIENCE_PRESETS.map(aud => {
                      const selected = targetAudiences.includes(aud);
                      return (
                        <button
                          key={aud}
                          type="button"
                          onClick={() =>
                            setTargetAudiences(prev =>
                              selected ? prev.filter(a => a !== aud) : [...prev, aud]
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer ${
                            selected
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {aud}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {discountCategory === 'user_specific' && (
                <div className="space-y-1">
                  <label className="font-bold block">کدهای ملی مجاز (با کاما یا فاصله جدا کنید):</label>
                  <textarea
                    rows={2}
                    value={allowedNationalIdsText}
                    onChange={e => setAllowedNationalIdsText(e.target.value)}
                    placeholder="0019988776, 0022334455"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono dir-ltr"
                  />
                </div>
              )}

              {/* Limits & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block">سقف کل استفاده (خالی=نامحدود):</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={e => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">سقف استفاده هر نفر:</label>
                  <input
                    type="number"
                    min={1}
                    value={perUserLimit}
                    onChange={e => setPerUserLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">حداقل مبلغ دوره (تومان):</label>
                  <input
                    type="number"
                    min={0}
                    value={minPurchaseAmount}
                    onChange={e => setMinPurchaseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block">تاریخ شروع (میلادی):</label>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">شروع شمسی:</label>
                  <input
                    type="text"
                    value={startsAtJalali}
                    onChange={e => setStartsAtJalali(e.target.value)}
                    placeholder="۱۴۰۳/۰۹/۰۱"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">تاریخ انقضا (میلادی):</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold block">انقضا شمسی:</label>
                  <input
                    type="text"
                    value={expiresAtJalali}
                    onChange={e => setExpiresAtJalali(e.target.value)}
                    placeholder="۱۴۰۳/۱۲/۲۹"
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold block">توضیحات ادمین:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                <span>کد تخفیف بلافاصله پس از ذخیره فعال باشد</span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'در حال ذخیره...' : editingCode ? 'ثبت تغییرات کد تخفیف' : 'ایجاد و انتشار کد تخفیف'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Full Specifications & Usage Report Modal */}
      {detailsModalCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setDetailsModalCode(null)}
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black px-3 py-1 rounded-xl bg-amber-500 text-stone-950">
                  {detailsModalCode.code}
                </span>
                <div>
                  <h3 className="font-black text-sm">{detailsModalCode.title}</h3>
                  <span className="text-[11px] text-slate-300">
                    {DISCOUNT_CATEGORY_LABELS[detailsModalCode.discountCategory]}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setDetailsModalCode(null)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Full Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">میزان و نوع تخفیف:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                    {detailsModalCode.valueType === 'percent'
                      ? `${toPersianNumbers(detailsModalCode.discountValue)} درصد`
                      : `${toPersianNumbers(detailsModalCode.discountValue.toLocaleString('fa-IR'))} تومان`}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">سقف مبلغ کسر:</span>
                  <strong className="font-bold">
                    {detailsModalCode.maxDiscountAmount
                      ? `${toPersianNumbers(detailsModalCode.maxDiscountAmount.toLocaleString('fa-IR'))} تومان`
                      : 'بدون سقف'}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">آمار مصرف / ظرفیت:</span>
                  <strong className="font-black">
                    {toPersianNumbers(detailsModalCode.usedCount)} از{' '}
                    {detailsModalCode.maxUses ? toPersianNumbers(detailsModalCode.maxUses) : 'نامحدود'}
                    {detailsModalCode.remainingUses !== null && detailsModalCode.remainingUses !== undefined
                      ? ` (مانده: ${toPersianNumbers(detailsModalCode.remainingUses)})`
                      : ''}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">بازه اعتبار زمانی:</span>
                  <strong className="font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-500" />
                    <span>
                      {detailsModalCode.startsAtJalali || 'فوری'} تا {detailsModalCode.expiresAtJalali || 'نامحدود'}
                    </span>
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">سقف مجاز هر کاربر:</span>
                  <strong className="font-bold">{toPersianNumbers(detailsModalCode.perUserLimit || 1)} بار</strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ایجادکننده:</span>
                  <strong className="font-bold">{detailsModalCode.createdByName || 'ادمین سیستم'}</strong>
                </div>
              </div>

              {detailsModalCode.description && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <strong className="block mb-1 text-slate-700 dark:text-slate-300">توضیحات کد تخفیف:</strong>
                  <p className="text-slate-600 dark:text-slate-400">{detailsModalCode.description}</p>
                </div>
              )}

              {detailsModalCode.targetAudiences && detailsModalCode.targetAudiences.length > 0 && (
                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40">
                  <strong className="block mb-1.5 text-sky-900 dark:text-sky-300">مخاطبان مجاز:</strong>
                  <div className="flex flex-wrap gap-1.5">
                    {detailsModalCode.targetAudiences.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-sky-200 text-sky-800 dark:text-sky-200 font-bold">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!hideNationalId && detailsModalCode.allowedNationalIds && detailsModalCode.allowedNationalIds.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                  <strong className="block mb-1 text-amber-900 dark:text-amber-300">کدهای ملی مجاز:</strong>
                  <div className="font-mono text-amber-950 dark:text-amber-200">
                    {detailsModalCode.allowedNationalIds.join(' ، ')}
                  </div>
                </div>
              )}

              {/* Usages Audit Table */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>تاریخچه دقیق استفاده‌کنندگان از این کد تخفیف:</span>
                </h4>
                {loadingDetails ? (
                  <div className="p-6 text-center text-slate-400">در حال دریافت گزارش مصرف...</div>
                ) : !detailsModalCode.usages || detailsModalCode.usages.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    تاکنون هیچ ثبت‌نامی با این کد تخفیف انجام نشده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-black">
                        <tr>
                          <th className="p-2.5">{hideNationalId ? 'فراگیر' : 'فراگیر و کد ملی'}</th>
                          <th className="p-2.5">{unitNoun}</th>
                          <th className="p-2.5">مبلغ اصلی</th>
                          <th className="p-2.5">مبلغ تخفیف</th>
                          <th className="p-2.5">مبلغ نهایی</th>
                          <th className="p-2.5">تاریخ استفاده</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {detailsModalCode.usages.map(u => (
                          <tr key={u.id}>
                            <td className="p-2.5">
                              <strong className="block">{u.userName}</strong>
                              {!hideNationalId && u.userNationalId && (
                                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                                  {toPersianNumbers(u.userNationalId)}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 max-w-[160px] truncate font-bold">{u.courseTitle}</td>
                            <td className="p-2.5">{toPersianNumbers(u.originalAmount.toLocaleString('fa-IR'))} ت</td>
                            <td className="p-2.5 text-rose-600 font-bold">
                              -{toPersianNumbers(u.discountAmount.toLocaleString('fa-IR'))} ت
                            </td>
                            <td className="p-2.5 text-emerald-600 font-black">
                              {toPersianNumbers(u.finalAmount.toLocaleString('fa-IR'))} ت
                            </td>
                            <td className="p-2.5 font-mono text-[10px]">
                              {toPersianNumbers(new Date(u.usedAt).toLocaleDateString('fa-IR'))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

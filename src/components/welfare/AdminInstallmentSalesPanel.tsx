import React, { useState } from 'react';
import {
  Store,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  ClipboardList,
  X,
  Save,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelfareInstallmentPartner } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

export const AdminInstallmentSalesPanel: React.FC = () => {
  const {
    installmentPartners,
    installmentRequests,
    createInstallmentPartner,
    updateInstallmentPartner,
    deleteInstallmentPartner,
    reviewInstallmentRequest,
  } = useApp();

  const [subTab, setSubTab] = useState<'requests' | 'partners'>('requests');
  const [editingPartner, setEditingPartner] = useState<WelfareInstallmentPartner | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    maxCreditLimit: 150000000,
    creditLimitDisplay: 'تا سقف ۱۵۰,۰۰۰,۰۰۰ تومان',
    installmentTerms: '',
    durationMonths: 18,
    logoUrl: '',
    isActive: true,
    displayOrder: 10,
  });

  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openAddModal = () => {
    setEditingPartner(null);
    setForm({
      name: '',
      tagline: '',
      description: '',
      maxCreditLimit: 150000000,
      creditLimitDisplay: 'تا سقف ۱۵۰,۰۰۰,۰۰۰ تومان',
      installmentTerms: 'اقساط ۱۲ الی ۱۸ ماهه ویژه اعضای مجتمع',
      durationMonths: 18,
      logoUrl: '',
      isActive: true,
      displayOrder: installmentPartners.length + 1,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: WelfareInstallmentPartner) => {
    setEditingPartner(p);
    setForm({
      name: p.name,
      tagline: p.tagline || '',
      description: p.description || '',
      maxCreditLimit: p.maxCreditLimit,
      creditLimitDisplay: p.creditLimitDisplay,
      installmentTerms: p.installmentTerms,
      durationMonths: p.durationMonths,
      logoUrl: p.logoUrl || '',
      isActive: p.isActive,
      displayOrder: p.displayOrder,
    });
    setIsAddModalOpen(true);
  };

  const handleUploadLogo = async (file: File | undefined) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const up = await api.uploadFile(file, 'misc');
      if (up?.url) setForm((prev) => ({ ...prev, logoUrl: up.url }));
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در آپلود لوگو.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('partner-save');
    setFeedback(null);
    try {
      if (editingPartner) {
        await updateInstallmentPartner(editingPartner.id, form);
        setFeedback({ type: 'success', text: `فروشگاه «${form.name}» با موفقیت ویرایش شد.` });
      } else {
        await createInstallmentPartner(form);
        setFeedback({ type: 'success', text: `فروشگاه «${form.name}» به طرف‌های قرارداد اضافه شد.` });
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره فروشگاه.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReviewReq = async (
    id: string,
    status: 'approved' | 'rejected' | 'completed'
  ) => {
    setBusyId(id);
    setFeedback(null);
    try {
      const target = installmentRequests.find((r) => r.id === id);
      await reviewInstallmentRequest(id, status, notesMap[id] ?? target?.adminNote);
      setFeedback({ type: 'success', text: 'وضعیت درخواست خرید اقساطی به‌روزرسانی شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در بررسی درخواست.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100 border border-stone-200">
          <button
            type="button"
            onClick={() => setSubTab('requests')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
              subTab === 'requests' ? 'bg-[#071E17] text-[#F3D078]' : 'text-stone-700 hover:bg-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>درخواست‌های خرید اقساطی ({toPersianNumbers(installmentRequests.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('partners')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer ${
              subTab === 'partners' ? 'bg-[#071E17] text-[#F3D078]' : 'text-stone-700 hover:bg-white'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>فروشگاه‌های طرف قرارداد ({toPersianNumbers(installmentPartners.length)})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> افزودن فروشگاه طرف قرارداد
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {subTab === 'requests' ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-[#071E17] border-b border-stone-100 pb-3">
            مدیریت درخواست‌های اعتبار و خرید اقساطی
          </h3>

          {installmentRequests.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs font-bold">
              درخواستی ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {installmentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-black text-[#071E17]">
                        {req.applicantName} · فروشگاه «{req.partnerName}»
                      </div>
                      <div className="text-xs text-stone-600 tabular-nums mt-0.5">
                        مبلغ درخواستی:{' '}
                        <strong>{toPersianNumbers(req.requestedAmount.toLocaleString('fa-IR'))} تومان</strong>
                        {' · '}مدت: {toPersianNumbers(req.months)} ماه
                        {req.applicantPhone ? ` · تماس: ${toPersianNumbers(req.applicantPhone)}` : ''}
                        {' · '}ثبت: {formatIsoToJalali(req.createdAt)}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-black border bg-white">
                      {req.status === 'approved'
                        ? 'تایید شده'
                        : req.status === 'completed'
                        ? 'تکمیل‌شده'
                        : req.status === 'rejected'
                        ? 'رد شده'
                        : 'در حال بررسی'}
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/60">
                      {req.description}
                    </p>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="کد معرفی‌نامه یا توضیح مدیر..."
                      value={notesMap[req.id] ?? req.adminNote ?? ''}
                      onChange={(e) => setNotesMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                      className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleReviewReq(req.id, 'approved')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
                      >
                        تایید و صدور معرفی‌نامه
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleReviewReq(req.id, 'completed')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black cursor-pointer"
                      >
                        تکمیل شد
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => handleReviewReq(req.id, 'rejected')}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black cursor-pointer"
                      >
                        رد
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {installmentPartners.map((p) => (
            <div
              key={p.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-[#071E17]">{p.name}</h4>
                    <p className="text-xs text-stone-500">{p.tagline}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                      p.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    {p.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{p.description}</p>
                <div className="text-xs font-bold text-[#071E17] tabular-nums">
                  سقف اعتبار: {toPersianNumbers(p.creditLimitDisplay)} · تا {toPersianNumbers(p.durationMonths)} ماه
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => deleteInstallmentPartner(p.id)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Partner Modal (Mobile-Safe Pinned Header/Footer) */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-[#071E17] text-white">
              <h3 className="text-sm font-black">
                {editingPartner ? `ویرایش فروشگاه: ${editingPartner.name}` : 'افزودن فروشگاه طرف قرارداد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="min-h-[40px] min-w-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="installment-partner-form"
              onSubmit={handleSavePartner}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-5 space-y-3.5"
            >
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">نام فروشگاه *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">عنوان کوتاه / حوزه کالا</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 block">سقف اعتبار عددی (تومان)</label>
                  <input
                    type="number"
                    value={form.maxCreditLimit}
                    onChange={(e) => setForm((p) => ({ ...p, maxCreditLimit: Number(e.target.value) || 0 }))}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-stone-700 block">حداکثر مدت اقساط (ماه)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.durationMonths}
                    onChange={(e) => setForm((p) => ({ ...p, durationMonths: Math.max(1, Number(e.target.value) || 12) }))}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">متن نمایشی سقف اعتبار</label>
                <input
                  type="text"
                  value={form.creditLimitDisplay}
                  onChange={(e) => setForm((p) => ({ ...p, creditLimitDisplay: e.target.value }))}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">شرایط اقساط و تضامین</label>
                <textarea
                  rows={2}
                  value={form.installmentTerms}
                  onChange={(e) => setForm((p) => ({ ...p, installmentTerms: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">توضیحات تکمیلی فروشگاه</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">لوگو / تصویر فروشگاه</label>
                <div className="flex items-center gap-2">
                  <label className="min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingLogo ? 'در حال آپلود...' : 'آپلود لوگو'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadLogo(e.target.files?.[0])}
                    />
                  </label>
                  {form.logoUrl && <span className="text-xs font-bold text-emerald-700">تصویر پیوست شد</span>}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-black text-stone-800 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-[#071E17]"
                />
                <span>نمایش و فعال‌سازی فروشگاه در بخش کاربران</span>
              </label>
            </form>

            <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-3.5 border-t border-stone-200 bg-stone-50 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                form="installment-partner-form"
                disabled={busyId === 'partner-save'}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره فروشگاه</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

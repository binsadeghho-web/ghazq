import React, { useState, useMemo } from 'react';
import {
  Compass,
  Plus,
  Edit3,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Download,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelfareRecreationProgram, RecreationRegistrationMethod } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

const EMPTY_FORM = {
  title: '',
  programType: 'اردوی خانوادگی',
  destination: '',
  summary: '',
  description: '',
  scheduleText: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  capacity: 40,
  isFree: false,
  feeAmount: 350000,
  registrationMethod: 'both' as RecreationRegistrationMethod,
  cardNumber: '',
  paymentInstructions: '',
  coverImage: '/assets/recreation/default.jpg',
  isActive: true,
  displayOrder: 1,
};

export const AdminRecreationPanel: React.FC = () => {
  const {
    recreationPrograms,
    recreationRegistrations,
    createRecreationProgram,
    updateRecreationProgram,
    deleteRecreationProgram,
    reviewRecreationRegistration,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<WelfareRecreationProgram | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [savingProg, setSavingProg] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [filterProgramId, setFilterProgramId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [busyRegId, setBusyRegId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredRegistrations = useMemo(() => {
    return (recreationRegistrations || []).filter((r) => {
      if (filterProgramId !== 'all' && r.programId !== filterProgramId) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [recreationRegistrations, filterProgramId, filterStatus]);

  const openCreateModal = () => {
    setEditingProg(null);
    setForm({ ...EMPTY_FORM, displayOrder: (recreationPrograms?.length || 0) + 1 });
    setIsModalOpen(true);
    setFeedback(null);
  };

  const openEditModal = (prog: WelfareRecreationProgram) => {
    setEditingProg(prog);
    setForm({
      title: prog.title,
      programType: prog.programType || 'تور و اردو',
      destination: prog.destination,
      summary: prog.summary || '',
      description: prog.description || '',
      scheduleText: prog.scheduleText || '',
      startDate: prog.startDate || '',
      endDate: prog.endDate || '',
      registrationDeadline: prog.registrationDeadline || '',
      capacity: prog.capacity || 0,
      isFree: prog.isFree,
      feeAmount: prog.feeAmount || 0,
      registrationMethod: prog.registrationMethod || 'both',
      cardNumber: prog.cardNumber || '',
      paymentInstructions: prog.paymentInstructions || '',
      coverImage: prog.coverImage || '/assets/recreation/default.jpg',
      isActive: prog.isActive !== false,
      displayOrder: prog.displayOrder || 1,
    });
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleUploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const res = await api.uploadFile(file, 'welfare_media');
      if (res?.url) {
        setForm((prev) => ({ ...prev, coverImage: res.url }));
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'آپلود تصویر کاور با خطا مواجه شد.' });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.destination.trim()) {
      setFeedback({ type: 'error', text: 'عنوان برنامه و مقصد الزامی است.' });
      return;
    }
    setSavingProg(true);
    setFeedback(null);
    try {
      const payload: Partial<WelfareRecreationProgram> = {
        ...form,
        title: form.title.trim(),
        destination: form.destination.trim(),
        capacity: Math.max(0, Math.floor(Number(form.capacity || 0))),
        feeAmount: form.isFree ? 0 : Math.max(0, Math.round(Number(form.feeAmount || 0))),
        registrationMethod: form.isFree ? 'direct_free' : form.registrationMethod,
        gallery: [form.coverImage || '/assets/recreation/default.jpg'],
      };
      if (editingProg) {
        await updateRecreationProgram(editingProg.id, { ...payload, version: editingProg.version });
        setFeedback({ type: 'success', text: 'اطلاعیه و برنامه تفریحی با موفقیت ویرایش شد.' });
      } else {
        await createRecreationProgram(payload);
        setFeedback({ type: 'success', text: 'اطلاعیه و برنامه تفریحی جدید ایجاد شد.' });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره برنامه تفریحی.' });
    } finally {
      setSavingProg(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await deleteRecreationProgram(id);
      setConfirmDeleteId(null);
      setFeedback({ type: 'success', text: 'برنامه تفریحی حذف شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در حذف برنامه.' });
    }
  };

  const handleReviewRegistration = async (
    id: string,
    status: 'confirmed' | 'rejected' | 'cancelled'
  ) => {
    setBusyRegId(id);
    setFeedback(null);
    try {
      const target = recreationRegistrations.find((r) => r.id === id);
      await reviewRecreationRegistration(id, status, notesMap[id] ?? target?.adminNote ?? '');
      setFeedback({ type: 'success', text: 'وضعیت ثبت‌نام با موفقیت به‌روزرسانی شد.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در بررسی ثبت‌نام.' });
    } finally {
      setBusyRegId(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Programs Management */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#071E17]" />
            <h3 className="text-sm font-black text-[#071E17]">
              مدیریت اطلاعیه‌ها، تورها و اردوهای تفریحی و گردشگری
            </h3>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#071E17] hover:bg-[#0D3327] text-[#F3D078] text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف برنامه / اطلاعیه جدید</span>
          </button>
        </div>

        {recreationPrograms.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs font-bold">
            هنوز برنامه‌ای در بخش تفریحی و گردشگری ثبت نشده است.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recreationPrograms.map((prog) => (
              <div
                key={prog.id}
                className="p-4 rounded-2xl border border-stone-200/85 bg-[#FCFCF9] flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={prog.coverImage || '/assets/recreation/default.jpg'}
                    alt={prog.title}
                    className="w-20 h-20 rounded-xl object-cover border border-stone-200 shrink-0 bg-stone-100"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-emerald-800">
                        {prog.programType} · <MapPin className="w-3 h-3 inline" /> {prog.destination}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                          prog.isActive
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {prog.isActive ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-[#071E17] truncate">{prog.title}</h4>
                    <div className="text-[11px] text-stone-600 tabular-nums flex flex-wrap items-center gap-x-2">
                      <span>
                        ظرفیت:{' '}
                        {prog.capacity === 0
                          ? `${toPersianNumbers(prog.registeredCount)} ثبت‌نام (نامحدود)`
                          : `${toPersianNumbers(prog.registeredCount)} / ${toPersianNumbers(prog.capacity)} نفر`}
                      </span>
                      <span className="text-stone-300">·</span>
                      <span>
                        {prog.isFree
                          ? 'رایگان'
                          : `${toPersianNumbers(prog.feeAmount.toLocaleString('fa-IR'))} تومان`}
                      </span>
                    </div>
                    {prog.scheduleText && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span className="truncate">{prog.scheduleText}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-200/70">
                  <button
                    type="button"
                    onClick={() => openEditModal(prog)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-black text-[#071E17] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> ویرایش
                  </button>
                  {confirmDeleteId === prog.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDeleteProgram(prog.id)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-black cursor-pointer"
                      >
                        تایید حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(prog.id)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registrations Review Queue */}
      <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#071E17]" />
            <h3 className="text-sm font-black text-[#071E17]">
              کارتابل ثبت‌نام‌ها و تایید فیش‌های گردشگری
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterProgramId}
              onChange={(e) => setFilterProgramId(e.target.value)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
            >
              <option value="all">همه برنامه‌ها</option>
              {recreationPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending_review">در انتظار تایید فیش</option>
              <option value="confirmed">تایید قطعی</option>
              <option value="rejected">رد شده</option>
            </select>
          </div>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="py-10 text-center text-stone-400 text-xs font-bold">
            ثبت‌نامی مطابق فیلتر انتخابی یافت نشد.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="p-4 rounded-2xl border border-stone-200/85 bg-[#FCFCF9] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-[#071E17]">
                      {reg.userName} · {reg.programTitle}
                    </div>
                    <div className="text-xs text-stone-600 tabular-nums mt-0.5">
                      نفرات: <strong>{toPersianNumbers(reg.seatsReserved)} نفر</strong> · مبلغ:{' '}
                      <strong>
                        {reg.totalAmount === 0
                          ? 'رایگان'
                          : `${toPersianNumbers(reg.totalAmount.toLocaleString('fa-IR'))} تومان`}
                      </strong>
                      {reg.userPhone ? ` · تماس: ${toPersianNumbers(reg.userPhone)}` : ''}
                      {' · '}کد: {reg.trackingCode} · {formatIsoToJalali(reg.createdAt)}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                      reg.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : reg.status === 'rejected' || reg.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {reg.status === 'confirmed'
                      ? 'ثبت‌نام قطعی'
                      : reg.status === 'rejected'
                      ? 'رد شده'
                      : reg.status === 'cancelled'
                      ? 'لغو شده'
                      : 'در انتظار بررسی فیش'}
                  </span>
                </div>

                {reg.notes && (
                  <p className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-200/70">
                    توضیحات عضو: {reg.notes}
                  </p>
                )}

                {reg.receiptUrl && (
                  <div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.downloadPrivateFile(reg.receiptUrl!, `فیش-${reg.trackingCode}`);
                        } catch (err: any) {
                          setFeedback({ type: 'error', text: err?.message || 'خطا در دانلود فیش.' });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#071E17] border border-stone-200 text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>مشاهده و دانلود فیش واریزی</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="یادداشت مدیر، شماره صندلی یا پیام به عضو..."
                    value={notesMap[reg.id] ?? reg.adminNote ?? ''}
                    onChange={(e) => setNotesMap((prev) => ({ ...prev, [reg.id]: e.target.value }))}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busyRegId === reg.id}
                      onClick={() => handleReviewRegistration(reg.id, 'confirmed')}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> تایید ثبت‌نام
                    </button>
                    <button
                      type="button"
                      disabled={busyRegId === reg.id}
                      onClick={() => handleReviewRegistration(reg.id, 'rejected')}
                      className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> رد و آزادسازی ظرفیت
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROGRAM MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[26px] sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-stone-200">
              <h3 className="font-black text-sm sm:text-base text-[#071E17]">
                {editingProg ? 'ویرایش برنامه تفریحی و گردشگری' : 'تعریف برنامه تفریحی / گردشگری جدید'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="بستن"
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              id="admin-recreation-form"
              onSubmit={handleSaveProgram}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-4 text-xs"
            >
              {/* Cover Upload */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E2DAC3] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={form.coverImage || '/assets/recreation/default.jpg'}
                    alt="کاور برنامه"
                    className="w-20 h-14 rounded-xl object-cover border border-stone-200"
                  />
                  <div>
                    <div className="font-black text-[#071E17]">تصویر کاور اطلاعیه</div>
                    <div className="text-[11px] text-stone-500">آپلود مستقیم از دستگاه</div>
                  </div>
                </div>
                <label className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#071E17] text-[#F3D078] font-black inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingCover ? 'در حال آپلود...' : 'انتخاب تصویر'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploadingCover}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) handleUploadCover(f);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-black text-stone-700 block">
                    عنوان تور / اردو / برنامه تفریحی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="مثال: اردوی زیارتی و سیاحتی مشهد مقدس"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-700 block">نوع برنامه:</label>
                  <input
                    type="text"
                    value={form.programType}
                    onChange={(e) => setForm((p) => ({ ...p, programType: e.target.value }))}
                    placeholder="تور زیارتی / اردوی خانوادگی / گردشگری"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-700 block">
                    مقصد / محل برگزاری <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.destination}
                    onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                    placeholder="مثال: باغ‌موزه و مجموعه تفریحی کوهستانی"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-700 block">زمان‌بندی و ساعت حرکت:</label>
                  <input
                    type="text"
                    value={form.scheduleText}
                    onChange={(e) => setForm((p) => ({ ...p, scheduleText: e.target.value }))}
                    placeholder="پنج‌شنبه · حرکت ساعت ۷:۳۰ از مجتمع"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-700 block">تاریخ اجرا:</label>
                  <input
                    type="text"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    placeholder="۱۴۰۴/۰۹/۲۰"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-700 block">مهلت ثبت‌نام:</label>
                  <input
                    type="text"
                    value={form.registrationDeadline}
                    onChange={(e) => setForm((p) => ({ ...p, registrationDeadline: e.target.value }))}
                    placeholder="۱۴۰۴/۰۹/۱۷"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-700 block">
                    ظرفیت کل (عدد ۰ به معنای نامحدود):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 font-black tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 font-black text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFree}
                      onChange={(e) => setForm((p) => ({ ...p, isFree: e.target.checked }))}
                      className="w-4 h-4 accent-[#071E17]"
                    />
                    <span>این برنامه رایگان است</span>
                  </label>

                  <label className="flex items-center gap-2 font-black text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 accent-[#071E17]"
                    />
                    <span>برنامه فعال و قابل ثبت‌نام باشد</span>
                  </label>
                </div>

                {!form.isFree && (
                  <>
                    <div className="space-y-1">
                      <label className="font-black text-stone-700 block">
                        هزینه مشارکت هر نفر (تومان):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.feeAmount}
                        onChange={(e) => setForm((p) => ({ ...p, feeAmount: Number(e.target.value) }))}
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 font-black tabular-nums"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-stone-700 block">شیوه ثبت‌نام و پرداخت:</label>
                      <select
                        value={form.registrationMethod}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            registrationMethod: e.target.value as RecreationRegistrationMethod,
                          }))
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 font-bold"
                      >
                        <option value="both">پرداخت آنلاین یا بارگذاری فیش</option>
                        <option value="online_gateway">فقط پرداخت آنلاین</option>
                        <option value="bank_receipt">فقط بارگذاری فیش واریزی</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-black text-stone-700 block">
                        شماره کارت جهت واریز فیش (اختیاری):
                      </label>
                      <input
                        type="text"
                        value={form.cardNumber}
                        onChange={(e) => setForm((p) => ({ ...p, cardNumber: e.target.value }))}
                        placeholder="6037-9979-0000-0000"
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300 font-bold tabular-nums"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-black text-stone-700 block">خلاصه کوتاه روی کارت:</label>
                  <input
                    type="text"
                    value={form.summary}
                    onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                    placeholder="چکیده یک‌خطی برای نمایش در کارت اطلاعیه..."
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-black text-stone-700 block">توضیحات کامل و خدمات:</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="شرح کامل برنامه، خدمات پذیرایی، شرایط همراهان و نکات ضروری..."
                    className="w-full p-3 rounded-xl border border-stone-300 leading-relaxed"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-black text-stone-700 block">
                    راهنمای شیوه ثبت‌نام (اختیاری):
                  </label>
                  <textarea
                    rows={2}
                    value={form.paymentInstructions}
                    onChange={(e) => setForm((p) => ({ ...p, paymentInstructions: e.target.value }))}
                    placeholder="توضیحات نحوه پرداخت، تحویل کارت شرکت یا هماهنگی سرویس..."
                    className="w-full p-3 rounded-xl border border-stone-300 leading-relaxed"
                  />
                </div>
              </div>
            </form>

            <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 sm:px-6 sm:py-4 border-t border-stone-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-black cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                form="admin-recreation-form"
                disabled={savingProg || uploadingCover}
                className="min-h-[42px] px-6 py-2 rounded-xl bg-[#071E17] hover:bg-[#0D3327] text-[#F3D078] text-xs font-black cursor-pointer disabled:opacity-60"
              >
                {savingProg ? 'در حال ذخیره...' : editingProg ? 'ذخیره تغییرات' : 'انتشار اطلاعیه'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

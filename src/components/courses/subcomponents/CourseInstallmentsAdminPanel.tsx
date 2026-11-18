import React, { useState, useEffect, useCallback } from 'react';
import { Course, CourseInstallmentRecord } from '../../../types';
import { api } from '../../../services/apiClient';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { PrivateFileViewerModal } from './PrivateFileViewerModal';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
  RefreshCw,
  Edit3,
  X,
  Check,
} from 'lucide-react';

interface CourseInstallmentsAdminPanelProps {
  courses: Course[];
  initialCourseId?: string;
}

export const CourseInstallmentsAdminPanel: React.FC<CourseInstallmentsAdminPanelProps> = ({
  courses,
  initialCourseId = 'all',
}) => {
  const [items, setItems] = useState<CourseInstallmentRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalRecords: number;
    uniqueStudents: number;
    paidTotal: number;
    pendingTotal: number;
    awaitingCount: number;
    overdueCount: number;
  }>({
    totalRecords: 0,
    uniqueStudents: 0,
    paidTotal: 0,
    pendingTotal: 0,
    awaitingCount: 0,
    overdueCount: 0,
  });
  const [courseFilter, setCourseFilter] = useState<string>(initialCourseId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [viewingFile, setViewingFile] = useState<{ url: string; title: string } | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<CourseInstallmentRecord | null>(null);
  const [editDueIso, setEditDueIso] = useState('');
  const [editDueJalali, setEditDueJalali] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [editNote, setEditNote] = useState('');

  const [rejectingInstallment, setRejectingInstallment] = useState<CourseInstallmentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('فیش واریزی در استعلام حساب تایید نگردید.');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminCourseInstallments({
        courseId: courseFilter,
        status: statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setItems(Array.isArray(res.items) ? res.items : []);
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در دریافت لیست اقساط.' });
    } finally {
      setLoading(false);
    }
  }, [courseFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
    const unsub = api.subscribeToEvents(ev => {
      if (ev.type === 'courses.installment_updated' || ev.type === 'courses.enrolled') {
        loadData();
      }
    });
    return () => unsub();
  }, [loadData]);

  const handleConfirmInstallment = async (inst: CourseInstallmentRecord) => {
    setFeedback(null);
    try {
      await api.reviewCourseInstallment(inst.id, {
        status: 'paid',
        adminNote: 'پرداخت قسط توسط مدیریت بررسی و تایید قطعی شد.',
        expectedVersion: inst.version,
      });
      setFeedback({ type: 'success', text: `پرداخت «${inst.title}» برای ${inst.userName} تایید شد.` });
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در تایید قسط.' });
    }
  };

  const handleRejectInstallment = async () => {
    if (!rejectingInstallment) return;
    setFeedback(null);
    try {
      await api.reviewCourseInstallment(rejectingInstallment.id, {
        status: 'rejected',
        adminNote: rejectReason.trim() || 'مستندات واریزی رد شد.',
        expectedVersion: rejectingInstallment.version,
      });
      setFeedback({ type: 'success', text: `قسط «${rejectingInstallment.userName}» رد شد.` });
      setRejectingInstallment(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در رد قسط.' });
    }
  };

  const openScheduleEditor = (inst: CourseInstallmentRecord) => {
    setEditingInstallment(inst);
    setEditDueIso(inst.dueDateIso);
    setEditDueJalali(inst.dueDateJalali);
    setEditAmount(inst.amount);
    setEditNote(inst.adminNote || '');
  };

  const handleSaveSchedule = async () => {
    if (!editingInstallment) return;
    setFeedback(null);
    try {
      await api.reviewCourseInstallment(editingInstallment.id, {
        dueDateIso: editDueIso,
        dueDateJalali: editDueJalali,
        amount: editAmount,
        adminNote: editNote,
        expectedVersion: editingInstallment.version,
      });
      setFeedback({ type: 'success', text: `تاریخ سررسید و مبلغ قسط برای ${editingInstallment.userName} بروزرسانی شد.` });
      setEditingInstallment(null);
      await loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره زمان‌بندی قسط.' });
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span>مدیریت جامع اقساط دوره‌ها، مستندات و سررسیدهای خودکار</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            مشاهده فراگیران دارای قسط، وضعیت پرداخت‌ها، بررسی مستندات ذخیره‌شده روی دیسک و تنظیم تاریخ بازشدن خودکار درگاه پرداخت
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی لیست</span>
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">افراد دارای پرونده قسطی</span>
          <strong className="text-lg font-black text-slate-900 dark:text-white">
            {toPersianNumbers(summary.uniqueStudents)} نفر
          </strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-bold">مبلغ اقساط پرداخت‌شده</span>
          <strong className="text-sm font-black text-emerald-600 dark:text-emerald-300">
            {toPersianNumbers(summary.paidTotal.toLocaleString('fa-IR'))} تومان
          </strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50">
          <span className="text-[11px] text-sky-700 dark:text-sky-400 block font-bold">مانده اقساط در انتظار</span>
          <strong className="text-sm font-black text-sky-600 dark:text-sky-300">
            {toPersianNumbers(summary.pendingTotal.toLocaleString('fa-IR'))} تومان
          </strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
          <span className="text-[11px] text-amber-700 dark:text-amber-400 block font-bold">فیش‌های در نوبت تایید</span>
          <strong className="text-lg font-black text-amber-600 dark:text-amber-300">
            {toPersianNumbers(summary.awaitingCount)} مورد
          </strong>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
          <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-bold">اقساط سررسید گذشته</span>
          <strong className="text-lg font-black text-rose-600 dark:text-rose-300">
            {toPersianNumbers(summary.overdueCount)} مورد
          </strong>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس نام، کد ملی، شماره همراه، کد رهگیری یا نام دوره..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
          />
        </div>

        <select
          value={courseFilter}
          onChange={e => setCourseFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold max-w-[220px]"
        >
          <option value="all">همه دوره‌های اقساطی</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
        >
          <option value="all">همه وضعیت‌های قسط</option>
          <option value="awaiting_verification">در انتظار بررسی فیش</option>
          <option value="paid">پرداخت و تایید شده</option>
          <option value="pending">سررسید آینده (در انتظار)</option>
          <option value="overdue">سررسید گذشته / معوق</option>
          <option value="rejected">رد شده</option>
        </select>
      </div>

      {/* Installments Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
            <tr>
              <th className="p-3">فراگیر و کد ملی</th>
              <th className="p-3">دوره و عنوان قسط</th>
              <th className="p-3">مبلغ قسط</th>
              <th className="p-3">تاریخ سررسید (بازشدن درگاه)</th>
              <th className="p-3 text-center">مستند پرداخت روی دیسک</th>
              <th className="p-3 text-center">وضعیت</th>
              <th className="p-3 text-center">عملیات مدیریتی</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  هیچ قسطی مطابق فیلتر انتخابی یافت نشد.
                </td>
              </tr>
            ) : (
              items.map(inst => (
                <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3">
                    <strong className="text-slate-900 dark:text-white block font-black">{inst.userName}</strong>
                    <span className="text-[11px] text-slate-500 font-mono block">
                      {toPersianNumbers(inst.userPhone || '')} · ملی: {toPersianNumbers(inst.userNationalId || '')}
                    </span>
                  </td>
                  <td className="p-3">
                    <strong className="text-slate-800 dark:text-slate-200 block max-w-[210px] truncate">
                      {inst.courseTitle}
                    </strong>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      قسط {toPersianNumbers(inst.installmentNumber)}: {inst.title}
                    </span>
                  </td>
                  <td className="p-3 font-black text-slate-900 dark:text-white">
                    {toPersianNumbers(inst.amount.toLocaleString('fa-IR'))} تومان
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-sky-500" />
                      <span>{toPersianNumbers(inst.dueDateJalali)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">{inst.dueDateIso}</span>
                  </td>
                  <td className="p-3 text-center">
                    {inst.receiptFileUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setViewingFile({
                            url: inst.receiptFileUrl!,
                            title: `فیش قسط ${inst.userName} (${inst.title})`,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده فایل دیسک</span>
                      </button>
                    ) : inst.trackingCode ? (
                      <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        درگاه: {toPersianNumbers(inst.trackingCode)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">در انتظار پرداخت</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-flex items-center gap-1 ${
                        inst.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : inst.status === 'awaiting_verification'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : inst.status === 'overdue' || inst.status === 'rejected'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {inst.status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {inst.status === 'awaiting_verification' && <Clock className="w-3.5 h-3.5" />}
                      {(inst.status === 'overdue' || inst.status === 'rejected') && (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {inst.status === 'paid'
                          ? 'پرداخت قطعی'
                          : inst.status === 'awaiting_verification'
                          ? 'در بررسی فیش'
                          : inst.status === 'overdue'
                          ? 'سررسید گذشته'
                          : inst.status === 'rejected'
                          ? 'رد شده'
                          : 'در نوبت سررسید'}
                      </span>
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {inst.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmInstallment(inst)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] cursor-pointer"
                        >
                          تایید
                        </button>
                      )}
                      {inst.status === 'awaiting_verification' && (
                        <button
                          type="button"
                          onClick={() => setRejectingInstallment(inst)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 font-bold text-[11px] cursor-pointer"
                        >
                          رد
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openScheduleEditor(inst)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                        title="تغییر تاریخ سررسید / مبلغ قسط"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inline Schedule / Amount Edit Dialog */}
      {editingInstallment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setEditingInstallment(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <strong className="text-sm font-black text-slate-900 dark:text-white">
                تنظیم سررسید خودکار و مبلغ قسط ({editingInstallment.userName})
              </strong>
              <button type="button" onClick={() => setEditingInstallment(null)} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold block">تاریخ سررسید میلادی (مبنای بازشدن خودکار درگاه در پنل کاربر):</label>
                <input
                  type="date"
                  value={editDueIso}
                  onChange={e => setEditDueIso(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold block">تاریخ سررسید شمسی (نمایشی):</label>
                <input
                  type="text"
                  value={editDueJalali}
                  onChange={e => setEditDueJalali(e.target.value)}
                  placeholder="۱۴۰۳/۱۰/۱۵"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold block">مبلغ قسط (تومان):</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold block">یادداشت مدیر:</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingInstallment(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره زمان‌بندی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Reject Reason Dialog */}
      {rejectingInstallment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setRejectingInstallment(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs"
            onClick={e => e.stopPropagation()}
          >
            <strong className="text-sm font-black text-rose-600 block">
              علت رد فیش قسط «{rejectingInstallment.userName}»
            </strong>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingInstallment(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleRejectInstallment}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white font-black cursor-pointer"
              >
                تایید رد مستند
              </button>
            </div>
          </div>
        </div>
      )}

      <PrivateFileViewerModal
        fileUrl={viewingFile?.url || null}
        title={viewingFile?.title}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
};

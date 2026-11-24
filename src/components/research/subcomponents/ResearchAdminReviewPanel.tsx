import React, { useState } from 'react';
import {
  Search,
  Phone,
  CreditCard,
  Mail,
  MapPin,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Edit3,
  AlertCircle,
  X,
  UserCheck,
  Home,
  BookOpen,
  FileText,
  Settings,
} from 'lucide-react';
import { ResearchMentorship } from '../../../types';
import { ResearchConversationThread } from './ResearchConversationThread';
import {
  formatResearchDateFa,
  getDeliveryModeLabel,
  getResearchCategoryLabel,
  getResearchStatusMeta,
  getServiceScopeLabel,
} from './researchUiHelpers';

interface ResearchAdminReviewPanelProps {
  requests: ResearchMentorship[];
  onUpdateStatus: (
    projectId: string,
    payload: {
      status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
      adminNote?: string;
      assignedSupervisor?: string;
      stageTitle?: string;
      progressPercent?: number;
      replyMessage?: string;
    }
  ) => Promise<ResearchMentorship | null>;
  onSendMessage: (projectId: string, message: string) => Promise<any>;
  onDeleteRequest: (projectId: string) => Promise<boolean>;
  onOpenConfigEditor: () => void;
}

export const ResearchAdminReviewPanel: React.FC<ResearchAdminReviewPanelProps> = ({
  requests,
  onUpdateStatus,
  onSendMessage,
  onDeleteRequest,
  onOpenConfigEditor,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Detailed status/supervisor editor modal
  const [selectedForReview, setSelectedForReview] = useState<ResearchMentorship | null>(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'in_review' as 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed',
    assignedSupervisor: '',
    stageTitle: '',
    progressPercent: 10,
    adminNote: '',
    replyMessage: '',
  });

  const openReviewModal = (req: ResearchMentorship) => {
    const norm = getResearchStatusMeta(req.status).key as any;
    setSelectedForReview(req);
    setReviewForm({
      status: norm,
      assignedSupervisor: req.assignedSupervisor || '',
      stageTitle: req.stageTitle || '',
      progressPercent: Number(req.progressPercent ?? 10),
      adminNote: req.adminNote || '',
      replyMessage: '',
    });
  };

  const handleQuickStatus = async (
    req: ResearchMentorship,
    nextStatus: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed'
  ) => {
    setBusyId(req.id);
    try {
      await onUpdateStatus(req.id, { status: nextStatus });
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveReviewModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForReview) return;
    setBusyId(selectedForReview.id);
    try {
      const updated = await onUpdateStatus(selectedForReview.id, {
        status: reviewForm.status,
        assignedSupervisor: reviewForm.assignedSupervisor,
        stageTitle: reviewForm.stageTitle,
        progressPercent: Number(reviewForm.progressPercent),
        adminNote: reviewForm.adminNote,
        ...(reviewForm.replyMessage.trim() ? { replyMessage: reviewForm.replyMessage.trim() } : {}),
      });
      if (updated) {
        setSelectedForReview(null);
      }
    } finally {
      setBusyId(null);
    }
  };

  const filteredRequests = requests.filter(r => {
    const normStatus = getResearchStatusMeta(r.status).key;
    if (filter !== 'all' && normStatus !== filter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const prof = r.applicantProfile;
    return [
      r.thesisTitle,
      r.applicantName,
      r.briefSummary,
      r.targetInstitution,
      r.field,
      prof?.phone,
      prof?.nationalId,
      prof?.city,
      prof?.major,
    ]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q));
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => getResearchStatusMeta(r.status).key === 'pending').length,
    in_review: requests.filter(r => getResearchStatusMeta(r.status).key === 'in_review').length,
    approved: requests.filter(r => getResearchStatusMeta(r.status).key === 'approved').length,
    rejected: requests.filter(r => getResearchStatusMeta(r.status).key === 'rejected').length,
    completed: requests.filter(r => getResearchStatusMeta(r.status).key === 'completed').length,
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              کارتابل بررسی و راهبری درخواست‌های پژوهش ({requests.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مشاهده مشخصات کامل متقاضیان، تغییر وضعیت (در حال بررسی / تایید / رد) و گفت‌وگوی مستقیم در تمام مراحل
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenConfigEditor}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>ویرایشگر ۱۰۰٪ متن‌ها، تلفن‌ها و مراحل الگوریتم</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {[
              { id: 'all', label: `همه (${counts.all})` },
              { id: 'pending', label: `در انتظار بررسی (${counts.pending})` },
              { id: 'in_review', label: `در حال بررسی (${counts.in_review})` },
              { id: 'approved', label: `تایید شده (${counts.approved})` },
              { id: 'rejected', label: `رد شده (${counts.rejected})` },
              { id: 'completed', label: `تکمیل‌شده (${counts.completed})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  filter === tab.id
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجوی نام، تلفن، کد ملی، عنوان..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Request Cards */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200/90 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          درخواستی مطابق با فیلتر فعلی یافت نشد.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRequests.map(req => {
            const statusMeta = getResearchStatusMeta(req.status);
            const prof = req.applicantProfile;
            const CategoryIcon = req.researchCategory === 'article' ? FileText : BookOpen;
            const isBusy = busyId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-xs"
              >
                {/* Header & Status */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-black ${statusMeta.surfaceClass} ${statusMeta.textColorClass}`}>
                        <span className={`w-2 h-2 rounded-full ${statusMeta.dotColorClass}`} />
                        <span>{statusMeta.label}</span>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        <CategoryIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>{getResearchCategoryLabel(req.researchCategory)}</span>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {getServiceScopeLabel(req.serviceScope)}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono tabular-nums text-slate-500">
                        ثبت: {formatResearchDateFa(req.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {req.thesisTitle}
                    </h3>
                  </div>

                  {/* Quick Official Action Buttons (Reform 34) */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {statusMeta.key !== 'in_review' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuickStatus(req, 'in_review')}
                        className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>در حال بررسی</span>
                      </button>
                    )}

                    {statusMeta.key !== 'approved' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuickStatus(req, 'approved')}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تایید نهایی</span>
                      </button>
                    )}

                    {statusMeta.key !== 'rejected' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuickStatus(req, 'rejected')}
                        className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رد درخواست</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openReviewModal(req)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>بررسی و انتصاب استاد</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(req.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="بایگانی / حذف نرم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Delete Confirmation */}
                {confirmDeleteId === req.id && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>آیا از حذف نرم این پرونده اطمینان دارید؟ سوابق در پایگاه داده بایگانی می‌شوند.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await onDeleteRequest(req.id);
                          if (ok) setConfirmDeleteId(null);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer"
                      >
                        تایید حذف
                      </button>
                    </div>
                  </div>
                )}

                {/* Reform 38: Full Applicant Identity Profile */}
                <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 p-4 space-y-2.5">
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>مشخصات کامل متقاضی:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-[11px] text-slate-500 block">نام و نام خانوادگی:</span>
                      <strong className="text-slate-900 dark:text-white">{prof?.fullName || req.applicantName}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" /> تلفن تماس:
                      </span>
                      <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                        {prof?.phone || 'ثبت نشده'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-sky-600" /> کد ملی:
                      </span>
                      <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                        {prof?.nationalId || 'ثبت نشده'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600" /> شهر / سمت:
                      </span>
                      <strong className="text-slate-900 dark:text-white">
                        {[prof?.city, prof?.roleTitle].filter(Boolean).join(' · ') || 'ثبت نشده'}
                      </strong>
                    </div>
                    {(prof?.university || prof?.major) && (
                      <div className="sm:col-span-2">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-indigo-500" /> دانشگاه / رشته تحصیلی:
                        </span>
                        <strong className="text-slate-900 dark:text-white">
                          {[prof?.university, prof?.major].filter(Boolean).join(' — ')}
                        </strong>
                      </div>
                    )}
                    {prof?.email && (
                      <div className="sm:col-span-2">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> ایمیل:
                        </span>
                        <strong className="font-mono text-slate-900 dark:text-white">{prof.email}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Specs & Brief Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                    <span className="text-[11px] text-slate-500 block">نحوه برگزاری و اسکان:</span>
                    <strong className="text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{getDeliveryModeLabel(req.deliveryMode)}</span>
                      {req.accommodationRequested && (
                        <>
                          <span>·</span>
                          <span className="text-amber-700 dark:text-amber-400 inline-flex items-center gap-1">
                            <Home className="w-3.5 h-3.5" /> اسکان {req.accommodationCity || 'قم'}
                          </span>
                        </>
                      )}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                    <span className="text-[11px] text-slate-500 block">نهاد یا مجله مقصد / گرایش:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {[req.targetInstitution, req.field].filter(Boolean).join(' · ') || '—'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-0.5">
                    <span className="text-[11px] text-slate-500 block">استاد معین و پیشرفت:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {req.assignedSupervisor || 'تعیین‌نشده'} ({req.progressPercent}٪)
                    </strong>
                  </div>
                </div>

                {req.selectedPartialTopics && req.selectedPartialTopics.length > 0 && (
                  <div className="text-xs bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                    <span className="font-black text-amber-800 dark:text-amber-300">محورهای مشورت موردی: </span>
                    <span>{req.selectedPartialTopics.join(' · ')}</span>
                  </div>
                )}

                {req.briefSummary && (
                  <div className="text-xs bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
                    <span className="font-bold text-slate-500 block">شرح درخواست متقاضی:</span>
                    <p className="text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {req.briefSummary}
                    </p>
                  </div>
                )}

                {/* Reform 34 Two-Way Messaging */}
                <ResearchConversationThread
                  request={req}
                  isOfficialViewer={true}
                  onSendMessage={onSendMessage}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Official Review Modal */}
      {selectedForReview && (
        <div className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden" dir="rtl" onClick={() => setSelectedForReview(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl"
          >
            <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                بررسی تخصصی، تغییر وضعیت و انتصاب استاد
              </h3>
              <button
                type="button"
                onClick={() => setSelectedForReview(null)}
                aria-label="بستن"
                className="w-10 h-10 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="research-admin-review-form" onSubmit={handleSaveReviewModal} className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  وضعیت پرونده:
                </label>
                <select
                  value={reviewForm.status}
                  onChange={e => setReviewForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="pending">در انتظار بررسی (قابل ویرایش توسط کاربر)</option>
                  <option value="in_review">در حال بررسی کارشناسی (قفل ویرایش کاربر)</option>
                  <option value="approved">تایید نهایی درخواست</option>
                  <option value="rejected">رد درخواست</option>
                  <option value="completed">تکمیل‌شده</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  استاد راهنما / کارشناس معین:
                </label>
                <input
                  type="text"
                  value={reviewForm.assignedSupervisor}
                  onChange={e => setReviewForm(p => ({ ...p, assignedSupervisor: e.target.value }))}
                  placeholder="نام و مرتبه علمی استاد راهنما..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    عنوان مرحله فعلی:
                  </label>
                  <input
                    type="text"
                    value={reviewForm.stageTitle}
                    onChange={e => setReviewForm(p => ({ ...p, stageTitle: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    درصد پیشرفت (۰ تا ۱۰۰):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={reviewForm.progressPercent}
                    onChange={e => setReviewForm(p => ({ ...p, progressPercent: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  یادداشت رسمی / علت وضعیت (نمایش در پرونده):
                </label>
                <textarea
                  rows={2}
                  value={reviewForm.adminNote}
                  onChange={e => setReviewForm(p => ({ ...p, adminNote: e.target.value }))}
                  placeholder="توضیح نتیجه بررسی یا راهنمای گام بعدی..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  ارسال پیام همزمان در گفت‌وگوی پرونده (اختیاری):
                </label>
                <textarea
                  rows={2}
                  value={reviewForm.replyMessage}
                  onChange={e => setReviewForm(p => ({ ...p, replyMessage: e.target.value }))}
                  placeholder="متن پیام مستقیم به پژوهشگر..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </form>

            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setSelectedForReview(null)}
                className="px-4 py-2.5 min-h-[42px] rounded-xl border border-slate-300 dark:border-slate-700 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                form="research-admin-review-form"
                disabled={busyId === selectedForReview.id}
                className="px-5 py-2.5 min-h-[42px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-black cursor-pointer disabled:opacity-50"
              >
                {busyId === selectedForReview.id ? 'در حال ذخیره...' : 'ذخیره بررسی و همگام‌سازی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

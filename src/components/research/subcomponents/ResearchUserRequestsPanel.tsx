import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Lock,
  Check,
  Clock,
  Home,
  BookOpen,
  FileText,
  Mic,
  UserCheck,
  AlertCircle,
  Compass,
  Info,
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

interface ResearchUserRequestsPanelProps {
  requests: ResearchMentorship[];
  onStartNew: () => void;
  onEditPending: (req: ResearchMentorship) => void;
  onDeletePending: (id: string) => Promise<boolean>;
  onSendMessage: (id: string, msg: string) => Promise<any>;
  onOpenGuidance: () => void;
}

export const ResearchUserRequestsPanel: React.FC<ResearchUserRequestsPanelProps> = ({
  requests,
  onStartNew,
  onEditPending,
  onDeletePending,
  onSendMessage,
  onOpenGuidance,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const ok = await onDeletePending(id);
      if (ok) {
        setConfirmDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 text-center border border-slate-200/90 dark:border-slate-800 space-y-4">
        <Compass className="w-10 h-10 text-amber-500/80 mx-auto" />
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            هنوز درخواست پژوهش یا پیشنهاد نشستی ثبت نکرده‌اید
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            پس از انتخاب یکی از سه کارت پژوهشی بالا (راهبری پایان‌نامه، همکاری در مقاله و انتشار، یا پیشنهاد نشست علمی)، وضعیت پرونده و گفت‌وگوها در همین بخش نمایش داده می‌شود.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onStartNew}
            className="px-5 py-2.5 min-h-[42px] rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] text-xs font-black inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت درخواست یا پیشنهاد جدید</span>
          </button>
          <button
            type="button"
            onClick={onOpenGuidance}
            className="px-4 py-2.5 min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Info className="w-4 h-4 text-amber-500" />
            <span>توضیحات</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            پیگیری درخواست‌ها و پیشنهادهای من ({requests.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            موارد ثبت‌شده تا پیش از ورود به بررسی کارشناسی قابل ویرایش یا حذف هستند و در همه مراحل امکان گفت‌وگو فعال است.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartNew}
          className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] text-xs font-black inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت درخواست یا پیشنهاد جدید</span>
        </button>
      </div>

      <div className="space-y-4">
        {requests.map(req => {
          const statusMeta = getResearchStatusMeta(req.status);
          const isSession = req.researchCategory === 'session_proposal';
          const CategoryIcon =
            isSession ? Mic : req.researchCategory === 'article' ? FileText : BookOpen;
          const canModify = !statusMeta.isLockedForUser;

          return (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 space-y-5 shadow-xs"
            >
              {/* Header row */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-2 min-w-0">
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
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      ثبت: {formatResearchDateFa(req.createdAt)}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {req.thesisTitle}
                  </h4>
                </div>

                {/* Reform 35 Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {canModify ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditPending(req)}
                        className="px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isSession ? 'ویرایش پیشنهاد' : 'ویرایش درخواست'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(req.id)}
                        className="px-3.5 py-2 min-h-[40px] rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>پرونده وارد بررسی شده و قابل ویرایش/حذف نیست</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Delete Confirmation (Zero window.confirm) */}
              {confirmDeleteId === req.id && canModify && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>آیا از حذف این مورد اطمینان دارید؟ پرونده از لیست موارد فعال شما کنار گذاشته می‌شود.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === req.id}
                      onClick={() => handleConfirmDelete(req.id)}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === req.id ? 'در حال حذف...' : 'تایید حذف'}
                    </button>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {isSession ? 'حوزه تخصصی نشست:' : 'نوع خدمات:'}
                  </span>
                  <strong className="text-slate-900 dark:text-white">
                    {isSession ? req.field : getServiceScopeLabel(req.serviceScope)}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">نحوه برگزاری:</span>
                  <strong className="text-slate-900 dark:text-white">{getDeliveryModeLabel(req.deliveryMode)}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {isSession ? 'سخنرانان / نهاد همکار:' : 'استاد / راهبر معین:'}
                  </span>
                  <strong className="text-slate-900 dark:text-white flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {isSession
                        ? req.targetInstitution || req.assignedSupervisor || 'تعیین توسط شورای علمی'
                        : req.assignedSupervisor || 'در حال انتصاب توسط شورا'}
                    </span>
                  </strong>
                </div>

                {!isSession ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">اسکان مطالعاتی:</span>
                    <strong className="text-slate-900 dark:text-white flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        {req.accommodationRequested
                          ? `درخواست‌شده (${req.accommodationCity || 'قم'})`
                          : 'بدون درخواست اسکان'}
                      </span>
                    </strong>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">دبیر / پیگیر نشست:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {req.assignedSupervisor || 'در انتظار بررسی شورای نشست‌ها'}
                    </strong>
                  </div>
                )}
              </div>

              {req.selectedPartialTopics && req.selectedPartialTopics.length > 0 && (
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-3">
                  <span className="font-black text-amber-800 dark:text-amber-300">
                    {isSession ? 'محورهای کلیدی پیشنهادی نشست: ' : 'محورهای موردی انتخاب‌شده: '}
                  </span>
                  <span>{req.selectedPartialTopics.join(' · ')}</span>
                </div>
              )}

              {req.briefSummary && (
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3.5 space-y-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400 block">
                    {isSession ? 'ضرورت و شرح پیشنهاد نشست:' : 'شرح درخواست شما:'}
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{req.briefSummary}</p>
                </div>
              )}

              {req.adminNote && (
                <div className="text-xs bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 space-y-1">
                  <span className="font-black text-emerald-800 dark:text-emerald-300 block">
                    یادداشت / نتیجه بررسی مسئول پژوهش:
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {req.adminNote}
                  </p>
                </div>
              )}

              {/* Approved Roadmap & Progress */}
              {(req.status === 'approved' || req.status === 'active' || req.status === 'completed') && (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">
                      گام فعلی: {req.stageTitle}
                    </span>
                    <span className="font-mono tabular-nums font-black text-emerald-400">
                      {req.progressPercent}٪ پیشرفت
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-emerald-400 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, req.progressPercent))}%` }}
                    />
                  </div>
                  {Array.isArray(req.milestones) && req.milestones.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {req.milestones.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {m.isDone ? (
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{m.title}</span>
                          </div>
                          <span className="font-mono tabular-nums text-[10px] text-slate-400 shrink-0">
                            {m.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reform 34: Persistent Two-Way Conversation Thread in ALL statuses */}
              <ResearchConversationThread
                request={req}
                isOfficialViewer={false}
                onSendMessage={onSendMessage}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

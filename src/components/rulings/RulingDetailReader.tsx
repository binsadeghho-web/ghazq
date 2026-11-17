import React, { useState } from 'react';
import {
  Award,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  FileText,
  Download,
  Clock,
  Tag,
  Edit3,
  Trash2,
  Check,
  X,
  Sliders,
  Loader2,
  Lock,
} from 'lucide-react';
import { JudicialRuling, RulingsPortalConfig } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { RulingEnhancementsToolbar } from './RulingEnhancementsToolbar';
import { RulingAdminReviewPanel } from './RulingAdminReviewPanel';
import {
  extractAttachmentDisplayName,
  formatPersianDateTime,
  getRulingTagStyleClasses,
} from './rulingTypesAndTags';

interface RulingDetailReaderProps {
  ruling: JudicialRuling;
  isOfficial: boolean;
  currentUserId: string;
  portalConfig: RulingsPortalConfig;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveOrder: (direction: 'up' | 'down') => void;
  onToggleLike: (rulingId: string) => Promise<void>;
  onToggleDislike: (rulingId: string) => Promise<void>;
  onAddDiscussion: (rulingId: string, comment: string) => Promise<void>;
  onEditDiscussion: (rulingId: string, discussionId: string, comment: string) => Promise<void>;
  onDeleteDiscussion: (rulingId: string, discussionId: string) => Promise<void>;
  onSaveRuling: (rulingId: string, updates: Partial<JudicialRuling>) => Promise<JudicialRuling | null>;
  onUpdatePortalConfig: (updates: Partial<RulingsPortalConfig>) => Promise<void>;
  onCloseReader?: () => void;
}

export const RulingDetailReader: React.FC<RulingDetailReaderProps> = ({
  ruling,
  isOfficial,
  currentUserId,
  portalConfig,
  canMoveUp,
  canMoveDown,
  onMoveOrder,
  onToggleLike,
  onToggleDislike,
  onAddDiscussion,
  onEditDiscussion,
  onDeleteDiscussion,
  onSaveRuling,
  onUpdatePortalConfig,
  onCloseReader,
}) => {
  const [showAdminEditor, setShowAdminEditor] = useState(
    isOfficial && (ruling.status === 'pending_review' || ruling.isVisibleToAlumni === false)
  );
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Discussion inline edit state (Reform 19)
  const [editingDiscId, setEditingDiscId] = useState<string | null>(null);
  const [editingDiscText, setEditingDiscText] = useState('');
  const [savingDisc, setSavingDisc] = useState(false);

  // Attachment secure download state
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isLiked = (ruling.likedBy || []).includes(currentUserId);
  const isDisliked = (ruling.dislikedBy || []).includes(currentUserId);
  const canComment =
    portalConfig.globalCommentsEnabled !== false && ruling.commentsEnabled !== false;

  const isVisible =
    ruling.isVisibleToAlumni !== undefined
      ? Boolean(ruling.isVisibleToAlumni)
      : ruling.status === 'selected';

  const handleDownloadAttachment = async (url: string, idx: number) => {
    setDownloadingUrl(url);
    setDownloadError(null);
    try {
      await api.downloadPrivateFile(url, extractAttachmentDisplayName(url, idx));
    } catch (err: any) {
      setDownloadError(err?.message || 'عدم امکان دریافت فایل پیوست.');
    } finally {
      setDownloadingUrl(null);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !canComment) return;
    setSubmittingComment(true);
    try {
      await onAddDiscussion(ruling.id, commentText.trim());
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveDiscEdit = async (discId: string) => {
    if (!editingDiscText.trim()) return;
    setSavingDisc(true);
    try {
      await onEditDiscussion(ruling.id, discId, editingDiscText.trim());
      setEditingDiscId(null);
      setEditingDiscText('');
    } finally {
      setSavingDisc(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 space-y-6 text-right">
      {/* Editorial Top Header */}
      <div className="space-y-3 pb-5 border-b border-stone-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
            <span className="font-semibold text-stone-800 dark:text-slate-200">
              {ruling.caseTypeTitle || 'حقوقی و تجاری'}
            </span>
            {ruling.rulingDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{ruling.rulingDate}</span>
              </>
            )}
            {ruling.courtBranch && (
              <>
                <span aria-hidden="true">·</span>
                <span>{ruling.courtBranch}</span>
              </>
            )}
            {ruling.judgeName && (
              <>
                <span aria-hidden="true">·</span>
                <span>دادرس: {ruling.judgeName}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOfficial && (
              <button
                type="button"
                onClick={() => setShowAdminEditor(v => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showAdminEditor
                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950'
                    : 'bg-amber-50 dark:bg-slate-800 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-slate-700 hover:bg-amber-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdminEditor ? 'بستن میز بررسی مدیر' : 'تکمیل و برچسب‌گذاری مدیر'}</span>
              </button>
            )}
            {onCloseReader && (
              <button
                type="button"
                onClick={onCloseReader}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white leading-snug">
          {ruling.title}
        </h2>

        {/* Badges Row: System Pick + Public Labels (Reform 22) + Admin Tags (Official Only - Reform 14) */}
        {(ruling.isSystemPick ||
          (ruling.publicLabels && ruling.publicLabels.length > 0) ||
          (isOfficial && ruling.adminTags && ruling.adminTags.length > 0) ||
          isOfficial) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {ruling.isSystemPick && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-700 text-white text-xs font-bold shadow-2xs">
                <Award className="w-3.5 h-3.5" />
                <span>برگزیده سامانه</span>
              </span>
            )}

            {(ruling.publicLabels || []).map(lbl => (
              <span
                key={lbl}
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getRulingTagStyleClasses(
                  lbl,
                  portalConfig.publicLabelDefinitions,
                  'emerald'
                )}`}
              >
                {lbl}
              </span>
            ))}

            {isOfficial && (
              <>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                    ruling.status === 'selected' && isVisible
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {ruling.status === 'selected' && isVisible
                    ? 'نمایش به دانش‌آموختگان: فعال'
                    : 'مخفی از دانش‌آموختگان / در انتظار تکمیل'}
                </span>

                {(ruling.adminTags || []).map(tag => (
                  <span
                    key={`adm_${tag}`}
                    title="برچسب محرمانه مدیریتی"
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${getRulingTagStyleClasses(
                      tag,
                      portalConfig.internalTagDefinitions,
                      'indigo'
                    )}`}
                  >
                    <Lock className="w-3 h-3 opacity-75" />
                    <span>{tag}</span>
                  </span>
                ))}
              </>
            )}
          </div>
        )}

        {/* Upload & Review Timestamps (Reform 15) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-stone-500 dark:text-slate-400 pt-2">
          <span>
            بارگذاری توسط:{' '}
            <strong className="text-stone-700 dark:text-slate-200">
              {ruling.submittedByName || 'عضو مجمع'}
            </strong>
          </span>
          {portalConfig.showCreatedAt !== false && ruling.createdAt && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>زمان بارگذاری: {formatPersianDateTime(ruling.createdAt)}</span>
              </span>
            </>
          )}
          {portalConfig.showReviewedAt !== false && ruling.reviewedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-emerald-800 dark:text-emerald-400 font-semibold">
                <Clock className="w-3 h-3" />
                <span>
                  زمان بررسی مدیر: {formatPersianDateTime(ruling.reviewedAt)}
                  {ruling.reviewedByName ? ` (${ruling.reviewedByName})` : ''}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Official Completion & Tagging Panel */}
      {isOfficial && showAdminEditor && (
        <RulingAdminReviewPanel
          ruling={ruling}
          portalConfig={portalConfig}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMoveOrder={onMoveOrder}
          onSaveRuling={onSaveRuling}
          onUpdatePortalConfig={onUpdatePortalConfig}
        />
      )}

      {/* Body Sections */}
      <div className="space-y-5">
        {/* Summary */}
        {portalConfig.showSummary !== false && ruling.summary && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">
              چکیده و گردش کار پرونده:
            </h4>
            <p className="text-xs sm:text-[13px] text-stone-700 dark:text-slate-300 leading-loose bg-[#FAF8F2] dark:bg-slate-800/60 p-4 rounded-xl border border-stone-200/80 dark:border-slate-800">
              {ruling.summary}
            </p>
          </div>
        )}

        {/* Keywords */}
        {portalConfig.showKeywords !== false && ruling.keywords && ruling.keywords.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-stone-900 dark:text-white">کلیدواژه‌ها:</h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-slate-300">
              {ruling.keywords.map((kw, i) => (
                <React.Fragment key={kw}>
                  {i > 0 && <span aria-hidden="true" className="text-stone-300 dark:text-slate-700">·</span>}
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Tag className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                    <span>{kw}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Legal Principles */}
        {portalConfig.showPrinciples !== false &&
          ruling.legalPrinciples &&
          ruling.legalPrinciples.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                اصول و مستندات قانونی و فقهی:
              </h4>
              <div className="space-y-1.5">
                {ruling.legalPrinciples.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-stone-700 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 flex items-center justify-center text-[11px] font-mono tabular-nums shrink-0 mt-0.5">
                      {toPersianNumbers(idx + 1)}
                    </span>
                    <span className="leading-relaxed">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Full Ruling Text */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-stone-900 dark:text-white">
            متن کامل دادنامه و استدلال قضایی:
          </h4>
          <div className="text-xs sm:text-[13px] text-stone-800 dark:text-slate-200 leading-loose bg-[#FAF8F2] dark:bg-slate-800/50 p-5 rounded-xl border border-stone-200/80 dark:border-slate-800 font-serif whitespace-pre-wrap max-h-72 overflow-y-auto">
            {ruling.fullRulingText}
          </div>
        </div>

        {/* Attachments (Secure Authenticated Download) */}
        {portalConfig.showAttachments !== false &&
          ruling.attachments &&
          ruling.attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                اسناد و فایل‌های پیوست دادنامه:
              </h4>
              {downloadError && <p className="text-xs text-rose-600">{downloadError}</p>}
              <div className="flex flex-wrap gap-2">
                {ruling.attachments.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    disabled={downloadingUrl === url}
                    onClick={() => handleDownloadAttachment(url, idx)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-amber-500 text-xs font-semibold text-stone-800 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {downloadingUrl === url ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    )}
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>{extractAttachmentDisplayName(url, idx)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Reactions Row (Mutually Exclusive Like + Dislike - Reform 18) */}
        <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleLike(ruling.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isLiked
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span className="tabular-nums">پسند ({toPersianNumbers(ruling.likesCount || 0)})</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleDislike(ruling.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isDisliked
                  ? 'bg-rose-700 text-white border-rose-800'
                  : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span className="tabular-nums">عدم پسند ({toPersianNumbers(ruling.dislikesCount || 0)})</span>
            </button>
          </div>

          <span className="text-[11px] text-stone-500 dark:text-slate-400 tabular-nums">
            {toPersianNumbers((ruling.discussions || []).length)} دیدگاه ثبت‌شده
          </span>
        </div>

        {/* Highlights, Official Print & Featured Critique Pinning */}
        <RulingEnhancementsToolbar
          ruling={ruling}
          isOfficial={isOfficial}
          onRulingUpdated={() => {}}
        />
      </div>

      {/* Discussions & Comments Section (Reforms 18 & 19) */}
      <div className="pt-5 border-t border-stone-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>نقدها و دیدگاه‌های تخصصی ({toPersianNumbers((ruling.discussions || []).length)})</span>
          </h4>
          {!canComment && (
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              ثبت دیدگاه جدید بسته است
            </span>
          )}
        </div>

        {canComment ? (
          <form onSubmit={handleCommentSubmit} className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="دیدگاه فقهی، تحلیل استدلال یا نقد حقوقی خود را درباره این رأی بنویسید..."
              className="flex-1 p-3 text-xs rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 disabled:opacity-40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {submittingComment ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 rotate-180" />
              )}
              <span>ثبت دیدگاه</span>
            </button>
          </form>
        ) : (
          <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 text-xs text-stone-600 dark:text-slate-300">
            ثبت دیدگاه و نظر جدید توسط مدیریت برای این بخش غیرفعال شده است؛ دیدگاه‌های پیشین همچنان قابل مطالعه هستند.
          </div>
        )}

        {/* Comments List with Official Edit & Delete (Reform 19) */}
        <div className="space-y-2.5">
          {(ruling.discussions || []).length === 0 ? (
            <div className="p-5 text-center text-xs text-stone-400 dark:text-slate-500 bg-stone-50 dark:bg-slate-800/40 rounded-xl border border-stone-100 dark:border-slate-800">
              هنوز دیدگاهی ثبت نشده است.
            </div>
          ) : (
            ruling.discussions.map(disc => {
              const isEditing = editingDiscId === disc.id;
              return (
                <div
                  key={disc.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    disc.isFeatured
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-stone-50 dark:bg-slate-800/50 border-stone-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-slate-400">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-stone-900 dark:text-white">{disc.authorName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{disc.authorRoleTitle}</span>
                      {disc.isFeatured && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-amber-800 dark:text-amber-400">نقد برگزیده</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums">
                        {formatPersianDateTime(disc.timestamp)}
                        {disc.editedAt ? ' (ویرایش‌شده)' : ''}
                      </span>

                      {isOfficial && !isEditing && (
                        <div className="flex items-center gap-1 mr-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDiscId(disc.id);
                              setEditingDiscText(disc.comment);
                            }}
                            className="p-1 rounded-md text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-slate-700 cursor-pointer"
                            title="ویرایش دیدگاه"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDiscussion(ruling.id, disc.id)}
                            className="p-1 rounded-md text-rose-600 hover:text-rose-800 hover:bg-rose-100/70 dark:hover:bg-rose-950/60 cursor-pointer"
                            title="حذف دیدگاه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={editingDiscText}
                        onChange={e => setEditingDiscText(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-xs resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingDiscId(null)}
                          className="px-3 py-1 rounded-lg text-[11px] text-stone-600 hover:bg-stone-200 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          disabled={savingDisc || !editingDiscText.trim()}
                          onClick={() => handleSaveDiscEdit(disc.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-45"
                        >
                          <Check className="w-3 h-3" />
                          <span>ذخیره ویرایش</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-stone-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {disc.comment}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Tag,
  Plus,
  Scale,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { JudicialRuling } from '../../types';
import { api } from '../../services/apiClient';
import {
  CASE_TYPE_OPTIONS,
  extractAttachmentDisplayName,
  getCaseTypeTitle,
  isVerdictAllowedClientFile,
} from './rulingTypesAndTags';

interface RulingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOfficial: boolean;
  submittedById: string;
  submittedByName: string;
  onSubmitRuling: (data: Partial<JudicialRuling> & { title: string; fullRulingText: string }) => Promise<JudicialRuling | null>;
}

export const RulingUploadModal: React.FC<RulingUploadModalProps> = ({
  isOpen,
  onClose,
  isOfficial,
  submittedById,
  submittedByName,
  onSubmitRuling,
}) => {
  const [title, setTitle] = useState('');
  const [fullRulingText, setFullRulingText] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Official-only optional completion fields at creation time
  const [showOfficialFields, setShowOfficialFields] = useState(false);
  const [caseType, setCaseType] = useState<JudicialRuling['caseType']>('commercial');
  const [courtBranch, setCourtBranch] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [rulingDate, setRulingDate] = useState('۱۴۰۴/۰۱/۲۰');
  const [summary, setSummary] = useState('');
  const [principlesText, setPrinciplesText] = useState('');
  const [publishImmediately, setPublishImmediately] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    const clean = keywordInput.trim();
    if (!clean) return;
    if (!keywords.includes(clean)) {
      setKeywords(prev => [...prev, clean]);
    }
    setKeywordInput('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const validation = isVerdictAllowedClientFile(file);
        if (!validation.ok) {
          setUploadError(validation.error || 'فایل انتخابی مجاز نیست.');
          continue;
        }
        const res = await api.uploadFile(file, 'verdict');
        if (res?.url) {
          setAttachments(prev => (prev.includes(res.url) ? prev : [...prev, res.url]));
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || 'خطا در بارگذاری فایل پیوست.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fullRulingText.trim()) return;

    const pendingKeywords = keywordInput.trim()
      ? Array.from(
          new Set([
            ...keywords,
            ...keywordInput
              .split(/[،,]/)
              .map(s => s.trim())
              .filter(Boolean),
          ])
        )
      : keywords;

    setSubmitting(true);
    setUploadError(null);
    try {
      const payload: Partial<JudicialRuling> & { title: string; fullRulingText: string } = {
        title: title.trim(),
        fullRulingText: fullRulingText.trim(),
        attachments,
        keywords: pendingKeywords,
        submittedById,
        submittedByName,
      };

      if (isOfficial && showOfficialFields) {
        payload.caseType = caseType;
        payload.caseTypeTitle = getCaseTypeTitle(caseType);
        if (courtBranch.trim()) payload.courtBranch = courtBranch.trim();
        if (judgeName.trim()) payload.judgeName = judgeName.trim();
        if (rulingDate.trim()) payload.rulingDate = rulingDate.trim();
        if (summary.trim()) payload.summary = summary.trim();
        if (principlesText.trim()) {
          payload.legalPrinciples = principlesText
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean);
        }
        if (publishImmediately) {
          payload.status = 'selected';
          payload.isVisibleToAlumni = true;
        }
      }

      const created = await onSubmitRuling(payload);
      if (created) {
        setTitle('');
        setFullRulingText('');
        setKeywordInput('');
        setKeywords([]);
        setAttachments([]);
        setSummary('');
        setPrinciplesText('');
        setCourtBranch('');
        setJudgeName('');
        setPublishImmediately(false);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-stone-950/65 backdrop-blur-xs overflow-hidden"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FBF9F5] dark:bg-slate-900 rounded-t-[26px] sm:rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-stone-900 dark:bg-slate-950 text-white flex items-center justify-between gap-2 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">بارگذاری رأی</h3>
              <p className="text-[11px] text-stone-300 mt-0.5 line-clamp-1">
                {isOfficial
                  ? 'ثبت دادنامه جدید در تالار رأی؛ جزئیات تکمیلی پس از ثبت نیز قابل ویرایش و برچسب‌گذاری است'
                  : 'فرم ساده ثبت رأی — پس از بررسی علمی و تکمیل مستندات توسط دبیرخانه، در تالار منتشر خواهد شد'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="ruling-upload-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto overscroll-y-contain flex-1 min-h-0 text-right">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* 1. عنوان */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1.5">
              عنوان رأی <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="عنوان گویا و موضوع اصلی رأی را وارد نمایید..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          {/* 2. متن رأی */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1.5">
              متن رأی <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={7}
              required
              value={fullRulingText}
              onChange={e => setFullRulingText(e.target.value)}
              placeholder="متن دادنامه، فرازهای استدلالی یا شرح رأی را اینجا بنویسید..."
              className="w-full p-3.5 text-xs leading-loose rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white font-serif focus:outline-none focus:ring-2 focus:ring-amber-600 resize-y"
            />
          </div>

          {/* 3. فایل پیوست (تصویر، PDF یا Word با اعتبارسنجی امنیتی) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 dark:text-slate-200">
                فایل پیوست دادنامه (اختیاری)
              </label>
              <span className="text-[11px] text-stone-500 dark:text-slate-400">
                فرمت‌های مجاز: JPG · PNG · WEBP · PDF · DOC · DOCX (حداکثر ۸ مگابایت)
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-xl border border-dashed border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>در حال بررسی امنیتی و بارگذاری فایل...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>انتخاب تصویر یا سند رأی جهت پیوست</span>
                </>
              )}
            </button>

            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((url, idx) => (
                  <div
                    key={url}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 text-stone-700 dark:text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">{extractAttachmentDisplayName(url, idx)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter(u => u !== url))}
                      className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      title="حذف پیوست"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. کلیدواژه‌ها (اختیاری) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-800 dark:text-slate-200">
              کلیدواژه‌ها (اختیاری)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="مثال: وجه التزام، خسارت تاخیر، شرط فاسخ (با اینتر یا دکمه + اضافه کنید)"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3.5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-stone-800 dark:text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.map(kw => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-[11px] font-medium text-stone-700 dark:text-slate-200"
                  >
                    <Tag className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => setKeywords(prev => prev.filter(k => k !== kw))}
                      className="text-stone-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Optional extended fields strictly for Officials only */}
          {isOfficial && (
            <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-3">
              <button
                type="button"
                onClick={() => setShowOfficialFields(v => !v)}
                className="text-xs font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {showOfficialFields
                  ? 'بستن بخش تکمیل فوری مشخصات و انتشار مستقیم (اختیاری)'
                  : '+ تکمیل فوری خلاصه، مستندات و انتشار مستقیم (ویژه مدیران)'}
              </button>

              {showOfficialFields && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                        حوزه موضوعی
                      </label>
                      <select
                        value={caseType}
                        onChange={e => setCaseType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
                      >
                        {CASE_TYPE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                        تاریخ صدور دادنامه
                      </label>
                      <input
                        type="text"
                        value={rulingDate}
                        onChange={e => setRulingDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                        مرجع صادرکننده
                      </label>
                      <input
                        type="text"
                        value={courtBranch}
                        onChange={e => setCourtBranch(e.target.value)}
                        placeholder="شعبه صادرکننده رأی"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                        قاضی / هیئت دادرسان
                      </label>
                      <input
                        type="text"
                        value={judgeName}
                        onChange={e => setJudgeName(e.target.value)}
                        placeholder="نام قاضی یا مستشاران"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                      خلاصه رأی
                    </label>
                    <textarea
                      rows={2}
                      value={summary}
                      onChange={e => setSummary(e.target.value)}
                      placeholder="خلاصه گردش‌کار و استدلال محوری رأی..."
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-300 mb-1">
                      مستندات قانونی و قواعد فقهی (هر سطر یک مورد)
                    </label>
                    <textarea
                      rows={2}
                      value={principlesText}
                      onChange={e => setPrinciplesText(e.target.value)}
                      placeholder="ماده ۲۳۰ قانون مدنی&#10;قاعده فقهی لاضرر"
                      className="w-full p-2.5 text-xs rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white resize-none"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-slate-200 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={publishImmediately}
                      onChange={e => setPublishImmediately(e.target.checked)}
                      className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>انتشار مستقیم و نمایش به دانش‌آموختگان بلافاصله پس از ثبت</span>
                  </label>
                </div>
              )}
            </div>
          )}

        </form>

        {/* Pinned Footer Buttons */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-200 dark:border-slate-800 bg-[#FBF9F5] dark:bg-slate-900 flex items-center justify-end gap-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-stone-700 dark:text-slate-300 bg-stone-200/80 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            form="ruling-upload-form"
            disabled={submitting || uploading || !title.trim() || !fullRulingText.trim()}
            className="flex-1 sm:flex-none px-5 py-2.5 min-h-[44px] bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 disabled:opacity-45 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>ثبت و بارگذاری رأی</span>
          </button>
        </div>
      </div>
    </div>
  );
};

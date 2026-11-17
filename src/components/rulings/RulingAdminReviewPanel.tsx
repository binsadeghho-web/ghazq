import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Plus,
  Save,
  ShieldAlert,
  Eye,
  EyeOff,
  Award,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Tag,
  Upload,
  Trash2,
  Loader2,
  X,
  FileText,
} from 'lucide-react';
import { JudicialRuling, RulingTagDefinition, RulingsPortalConfig } from '../../types';
import { api } from '../../services/apiClient';
import {
  CASE_TYPE_OPTIONS,
  extractAttachmentDisplayName,
  getCaseTypeTitle,
  getRulingTagStyleClasses,
  isVerdictAllowedClientFile,
  TAG_COLOR_OPTIONS,
  TAG_STYLE_OPTIONS,
} from './rulingTypesAndTags';

interface RulingAdminReviewPanelProps {
  ruling: JudicialRuling;
  portalConfig: RulingsPortalConfig;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveOrder: (direction: 'up' | 'down') => void;
  onSaveRuling: (rulingId: string, updates: Partial<JudicialRuling>) => Promise<JudicialRuling | null>;
  onUpdatePortalConfig: (updates: Partial<RulingsPortalConfig>) => Promise<void>;
}

export const RulingAdminReviewPanel: React.FC<RulingAdminReviewPanelProps> = ({
  ruling,
  portalConfig,
  canMoveUp,
  canMoveDown,
  onMoveOrder,
  onSaveRuling,
  onUpdatePortalConfig,
}) => {
  const [title, setTitle] = useState(ruling.title || '');
  const [summary, setSummary] = useState(ruling.summary || '');
  const [fullRulingText, setFullRulingText] = useState(ruling.fullRulingText || '');
  const [courtBranch, setCourtBranch] = useState(ruling.courtBranch || '');
  const [judgeName, setJudgeName] = useState(ruling.judgeName || '');
  const [rulingDate, setRulingDate] = useState(ruling.rulingDate || '');
  const [caseType, setCaseType] = useState<JudicialRuling['caseType']>(ruling.caseType || 'commercial');
  const [principlesText, setPrinciplesText] = useState((ruling.legalPrinciples || []).join('\n'));
  const [keywords, setKeywords] = useState<string[]>(ruling.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [attachments, setAttachments] = useState<string[]>(ruling.attachments || []);
  const [adminTags, setAdminTags] = useState<string[]>(ruling.adminTags || []);
  const [publicLabels, setPublicLabels] = useState<string[]>(ruling.publicLabels || []);
  const [isSystemPick, setIsSystemPick] = useState(Boolean(ruling.isSystemPick));
  const [isVisibleToAlumni, setIsVisibleToAlumni] = useState(
    ruling.isVisibleToAlumni !== undefined ? Boolean(ruling.isVisibleToAlumni) : ruling.status === 'selected'
  );
  const [commentsEnabled, setCommentsEnabled] = useState(ruling.commentsEnabled !== false);
  const [internalReviewNote, setInternalReviewNote] = useState(ruling.internalReviewNote || '');

  // Quick custom internal tag creator
  const [showNewTagBox, setShowNewTagBox] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState<RulingTagDefinition['colorScheme']>('indigo');
  const [newTagStyle, setNewTagStyle] = useState<RulingTagDefinition['styleVariant']>('soft');
  const [newTagScope, setNewTagScope] = useState<'internal' | 'public'>('internal');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(ruling.title || '');
    setSummary(ruling.summary || '');
    setFullRulingText(ruling.fullRulingText || '');
    setCourtBranch(ruling.courtBranch || '');
    setJudgeName(ruling.judgeName || '');
    setRulingDate(ruling.rulingDate || '');
    setCaseType(ruling.caseType || 'commercial');
    setPrinciplesText((ruling.legalPrinciples || []).join('\n'));
    setKeywords(ruling.keywords || []);
    setAttachments(ruling.attachments || []);
    setAdminTags(ruling.adminTags || []);
    setPublicLabels(ruling.publicLabels || []);
    setIsSystemPick(Boolean(ruling.isSystemPick));
    setIsVisibleToAlumni(
      ruling.isVisibleToAlumni !== undefined ? Boolean(ruling.isVisibleToAlumni) : ruling.status === 'selected'
    );
    setCommentsEnabled(ruling.commentsEnabled !== false);
    setInternalReviewNote(ruling.internalReviewNote || '');
    setUploadError(null);
  }, [ruling.id, ruling.version, ruling.updatedAt]);

  const toggleTag = (label: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => (prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]));
  };

  const handleAddKeyword = () => {
    const clean = keywordInput.trim();
    if (!clean) return;
    if (!keywords.includes(clean)) setKeywords(prev => [...prev, clean]);
    setKeywordInput('');
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const validation = isVerdictAllowedClientFile(file);
        if (!validation.ok) {
          setUploadError(validation.error || 'فایل مجاز نیست.');
          continue;
        }
        const res = await api.uploadFile(file, 'verdict');
        if (res?.url) {
          setAttachments(prev => (prev.includes(res.url) ? prev : [...prev, res.url]));
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || 'خطا در آپلود فایل.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleCreateCustomTag = async () => {
    const clean = newTagLabel.trim();
    if (!clean) return;
    const def: RulingTagDefinition = {
      id: `tag_${Date.now()}`,
      label: clean,
      colorScheme: newTagColor,
      styleVariant: newTagStyle,
      scope: newTagScope,
    };

    if (newTagScope === 'internal') {
      const existingDefs = portalConfig.internalTagDefinitions || [];
      if (!existingDefs.some(d => d.label === clean)) {
        await onUpdatePortalConfig({ internalTagDefinitions: [...existingDefs, def] });
      }
      if (!adminTags.includes(clean)) setAdminTags(prev => [...prev, clean]);
    } else {
      const existingDefs = portalConfig.publicLabelDefinitions || [];
      if (!existingDefs.some(d => d.label === clean)) {
        await onUpdatePortalConfig({ publicLabelDefinitions: [...existingDefs, def] });
      }
      if (!publicLabels.includes(clean)) setPublicLabels(prev => [...prev, clean]);
    }

    setNewTagLabel('');
    setShowNewTagBox(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveRuling(ruling.id, {
        title: title.trim() || ruling.title,
        summary: summary.trim(),
        fullRulingText: fullRulingText.trim() || ruling.fullRulingText,
        courtBranch: courtBranch.trim(),
        judgeName: judgeName.trim(),
        rulingDate: rulingDate.trim(),
        caseType,
        caseTypeTitle: getCaseTypeTitle(caseType),
        legalPrinciples: principlesText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        keywords,
        attachments,
        adminTags,
        publicLabels,
        isSystemPick,
        isVisibleToAlumni,
        status: isVisibleToAlumni ? 'selected' : 'pending_review',
        commentsEnabled,
        internalReviewNote: internalReviewNote.trim(),
        version: ruling.version,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="p-5 rounded-2xl bg-[#F7F4EC] dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 space-y-5 text-right"
    >
      {/* Top Toolbar: Confidentiality banner + manual order controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-700">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-white">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>میز کار تکمیل علمی، برچسب‌گذاری مدیریتی و کنترل انتشار</span>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-slate-400">
            برچسب‌های مدیریتی و یادداشت کارشناسی محرمانه هستند و برای دانش‌آموختگان نمایش داده نمی‌شوند.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-500 dark:text-slate-400 ml-1">ترتیب چینش:</span>
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() => onMoveOrder('up')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 disabled:opacity-35 cursor-pointer"
            title="انتقال به جایگاه بالاتر"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => onMoveOrder('down')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 disabled:opacity-35 cursor-pointer"
            title="انتقال به جایگاه پایین‌تر"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Control Switches Row: Visibility, System Pick, Comments */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={() => setIsVisibleToAlumni(v => !v)}
          className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
            isVisibleToAlumni
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {isVisibleToAlumni ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>نمایش به دانش‌آموختگان</span>
          </span>
          <span className="text-[11px]">{isVisibleToAlumni ? 'فعال' : 'مخفی'}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsSystemPick(v => !v)}
          className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
            isSystemPick
              ? 'bg-amber-700 text-white border-amber-800'
              : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>برگزیده سامانه</span>
          </span>
          <span className="text-[11px]">{isSystemPick ? 'بله' : 'خیر'}</span>
        </button>

        <button
          type="button"
          onClick={() => setCommentsEnabled(v => !v)}
          className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
            commentsEnabled
              ? 'bg-stone-800 text-white border-stone-900 dark:bg-slate-700'
              : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>ثبت دیدگاه و کامنت</span>
          </span>
          <span className="text-[11px]">{commentsEnabled ? 'باز' : 'بسته'}</span>
        </button>
      </div>

      {/* Internal Admin Tags (Reform 14) & Public Labels (Reform 22) */}
      <div className="space-y-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-stone-800 dark:text-slate-200">
            برچسب‌های مدیریتی (محرمانه — فقط قابل مشاهده برای مدیران):
          </span>
          <button
            type="button"
            onClick={() => setShowNewTagBox(v => !v)}
            className="text-[11px] font-bold text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ایجاد برچسب اختصاصی جدید</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(portalConfig.internalTagDefinitions || []).map(def => {
            const active = adminTags.includes(def.label);
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => toggleTag(def.label, adminTags, setAdminTags)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? `${getRulingTagStyleClasses(def.label, portalConfig.internalTagDefinitions, def.colorScheme)} ring-2 ring-offset-1 ring-stone-400 dark:ring-slate-500`
                    : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                }`}
              >
                {active && <Check className="w-3 h-3 shrink-0" />}
                <span>{def.label}</span>
              </button>
            );
          })}
        </div>

        {/* Public Labels */}
        <div className="pt-3 border-t border-stone-100 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-stone-800 dark:text-slate-200 block">
            برچسب‌های عمومی (قابل مشاهده برای دانش‌آموختگان روی کارت رأی و ویترین):
          </span>
          <div className="flex flex-wrap gap-2">
            {(portalConfig.publicLabelDefinitions || []).map(def => {
              const active = publicLabels.includes(def.label);
              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => toggleTag(def.label, publicLabels, setPublicLabels)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active
                      ? `${getRulingTagStyleClasses(def.label, portalConfig.publicLabelDefinitions, def.colorScheme)} ring-2 ring-offset-1 ring-amber-500/60`
                      : 'bg-stone-50 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                  }`}
                >
                  {active && <Check className="w-3 h-3 shrink-0" />}
                  <span>{def.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline custom tag creator */}
        {showNewTagBox && (
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                value={newTagLabel}
                onChange={e => setNewTagLabel(e.target.value)}
                placeholder="عنوان برچسب جدید..."
                className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
              />
              <select
                value={newTagScope}
                onChange={e => setNewTagScope(e.target.value as 'internal' | 'public')}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
              >
                <option value="internal">برچسب محرمانه مدیر</option>
                <option value="public">برچسب عمومی کاربران</option>
              </select>
              <select
                value={newTagStyle}
                onChange={e => setNewTagStyle(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
              >
                {TAG_STYLE_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {TAG_COLOR_OPTIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewTagColor(c.value)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full ${c.swatchClass} flex items-center justify-center text-white cursor-pointer ${
                      newTagColor === c.value ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-white' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {newTagColor === c.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTagBox(false)}
                  className="px-3 py-1 rounded-lg text-xs text-stone-500 hover:bg-stone-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  بستن
                </button>
                <button
                  type="button"
                  onClick={handleCreateCustomTag}
                  disabled={!newTagLabel.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  ثبت و افزودن برچسب
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Fields (Reform 13) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            عنوان رأی
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-semibold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            حوزه موضوعی
          </label>
          <select
            value={caseType}
            onChange={e => setCaseType(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
          >
            {CASE_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            تاریخ صدور دادنامه
          </label>
          <input
            type="text"
            value={rulingDate}
            onChange={e => setRulingDate(e.target.value)}
            placeholder="۱۴۰۳/۰۷/۱۵"
            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-mono tabular-nums"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            مرجع صادرکننده (شعبه/دیوان)
          </label>
          <input
            type="text"
            value={courtBranch}
            onChange={e => setCourtBranch(e.target.value)}
            placeholder="مثال: شعبه اول دیوان عالی کشور"
            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            قاضی / هیئت دادرسان
          </label>
          <input
            type="text"
            value={judgeName}
            onChange={e => setJudgeName(e.target.value)}
            placeholder="مثال: هیئت مستشاران"
            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            خلاصه رأی و گردش کار (تنظیم توسط ادمین / مدیر دانش‌آموختگان)
          </label>
          <textarea
            rows={3}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="خلاصه روشن و علمی از موضوع پرونده و نتیجه استنباط قضایی..."
            className="w-full p-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white resize-y"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            مستندات قانونی و قواعد فقهی رأی (هر سطر یک مورد)
          </label>
          <textarea
            rows={3}
            value={principlesText}
            onChange={e => setPrinciplesText(e.target.value)}
            placeholder="ماده ۵۲۲ قانون آیین دادرسی مدنی&#10;قاعده فقهی لاضرر و نفی عسر و حرج"
            className="w-full p-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white resize-y"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            متن کامل انشای رأی
          </label>
          <textarea
            rows={4}
            value={fullRulingText}
            onChange={e => setFullRulingText(e.target.value)}
            className="w-full p-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white font-serif resize-y"
          />
        </div>

        {/* Keywords editing */}
        <div className="sm:col-span-2 space-y-2">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300">
            اصلاح و تکمیل کلیدواژه‌ها
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
              placeholder="افزودن کلیدواژه جدید..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddKeyword}
              className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-white font-bold cursor-pointer"
            >
              افزودن
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map(kw => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-[11px]"
                >
                  <Tag className="w-3 h-3 text-amber-700" />
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

        {/* Attachments manager */}
        <div className="sm:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-stone-700 dark:text-slate-300">
              فایل‌های پیوست دادنامه
            </label>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              onChange={handleUploadAttachment}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              <span>پیوست فایل جدید</span>
            </button>
          </div>
          {uploadError && <p className="text-[11px] text-rose-600">{uploadError}</p>}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((url, idx) => (
                <div
                  key={url}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-[11px]"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>{extractAttachmentDisplayName(url, idx)}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter(u => u !== url))}
                    className="text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Internal Review Note (Staff Only) */}
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold text-stone-700 dark:text-slate-300 mb-1">
            یادداشت کارشناسی داخلی دبیرخانه (محرمانه — پنهان از دانش‌آموختگان)
          </label>
          <input
            type="text"
            value={internalReviewNote}
            onChange={e => setInternalReviewNote(e.target.value)}
            placeholder="توضیحات بررسی داخلی تیم ممیزی..."
            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-stone-200 dark:border-slate-700">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>ذخیره تکمیل، برچسب‌گذاری و وضعیت انتشار</span>
        </button>
      </div>
    </form>
  );
};

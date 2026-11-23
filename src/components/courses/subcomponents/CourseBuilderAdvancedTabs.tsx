import React, { useRef, useState } from 'react';
import {
  CourseCustomField,
  CourseInstallmentPlan,
  CourseInstallmentPlanItem,
  CourseInstructorItem,
  CourseSessionItem,
  CourseSessionPresenterMode,
} from '../../../types';
import { api } from '../../../services/apiClient';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { compressImageFast, formatFileSizeLabel } from '../../../utils/imageCompression';
import {
  UserCheck,
  UploadCloud,
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CalendarClock,
  Target,
  Sparkles,
  Layers,
  Users,
  Calendar,
  FolderOpen,
  RefreshCw,
  Download,
  Link as LinkIcon,
  HardDrive,
} from 'lucide-react';

const BUILT_IN_HIDEABLE_FIELDS: { key: string; label: string }[] = [
  { key: 'instructorResume', label: 'رزومه و سوابق اساتید' },
  { key: 'sessions', label: 'برنامه جلسات و ارائه‌دهندگان' },
  { key: 'necessity', label: 'ضرورت اجرای دوره' },
  { key: 'targetAudiences', label: 'مخاطبین هدف' },
  { key: 'managerNotes', label: 'توضیحات تکمیلی مدیر' },
  { key: 'holdingTime', label: 'ساعت و زمان برگزاری' },
  { key: 'capacity', label: 'ظرفیت باقی‌مانده و کل' },
  { key: 'topics', label: 'سرفصل‌های آموزشی' },
  { key: 'prerequisites', label: 'پیش‌نیازها' },
  { key: 'certificate', label: 'گواهی پایان دوره' },
  { key: 'installments', label: 'جدول پرداخت اقساطی' },
  { key: 'price', label: 'مبلغ شهریه' },
];

const QUICK_AUDIENCE_OPTIONS = [
  'طلاب سطوح عالی و خارج',
  'قضات دادگستری',
  'وکلای پایه یک',
  'دانشجویان و پژوهشگران حقوق',
  'کارشناسان رسمی قوه قضاییه',
];

export type CourseOfflineFileEntry = {
  id: string;
  title: string;
  url?: string;
  downloadUrl?: string;
  size?: string;
  fileSizeBytes?: number;
  fileType?: string;
  format?: string;
  description?: string;
  sessionNumber?: number;
  sourceType?: 'upload' | 'disk' | 'external';
  filename?: string;
};

interface CourseBuilderAdvancedTabsProps {
  courseId?: string;
  draftFolderKey: string;
  primaryInstructorName: string;
  onPrimaryInstructorNameChange: (val: string) => void;
  instructorTitle: string;
  onInstructorTitleChange: (val: string) => void;
  instructorAvatarUrl: string;
  onInstructorAvatarChange: (val: string) => void;
  instructorResume: string;
  onInstructorResumeChange: (val: string) => void;
  instructors: CourseInstructorItem[];
  onInstructorsChange: (val: CourseInstructorItem[]) => void;
  sessions: CourseSessionItem[];
  onSessionsChange: (val: CourseSessionItem[]) => void;
  offlineDownloadFiles: CourseOfflineFileEntry[];
  onOfflineDownloadFilesChange: (val: CourseOfflineFileEntry[]) => void;
  offlineDownloadGuide: string;
  onOfflineDownloadGuideChange: (val: string) => void;
  holdingTime: string;
  onHoldingTimeChange: (val: string) => void;
  necessity: string;
  onNecessityChange: (val: string) => void;
  managerNotes: string;
  onManagerNotesChange: (val: string) => void;
  targetAudiences: string[];
  onTargetAudiencesChange: (val: string[]) => void;
  customFields: CourseCustomField[];
  onCustomFieldsChange: (val: CourseCustomField[]) => void;
  hiddenFields: string[];
  onHiddenFieldsChange: (val: string[]) => void;
  hasInstallments: boolean;
  onHasInstallmentsChange: (val: boolean) => void;
  installmentPlan: CourseInstallmentPlan;
  onInstallmentPlanChange: (val: CourseInstallmentPlan) => void;
  coursePrice: number;
}

export const CourseBuilderAdvancedTabs: React.FC<CourseBuilderAdvancedTabsProps> = ({
  courseId,
  draftFolderKey,
  primaryInstructorName,
  onPrimaryInstructorNameChange,
  instructorTitle,
  onInstructorTitleChange,
  instructorAvatarUrl,
  onInstructorAvatarChange,
  instructorResume,
  onInstructorResumeChange,
  instructors,
  onInstructorsChange,
  sessions,
  onSessionsChange,
  offlineDownloadFiles,
  onOfflineDownloadFilesChange,
  offlineDownloadGuide,
  onOfflineDownloadGuideChange,
  holdingTime,
  onHoldingTimeChange,
  necessity,
  onNecessityChange,
  managerNotes,
  onManagerNotesChange,
  targetAudiences,
  onTargetAudiencesChange,
  customFields,
  onCustomFieldsChange,
  hiddenFields,
  onHiddenFieldsChange,
  hasInstallments,
  onHasInstallmentsChange,
  installmentPlan,
  onInstallmentPlanChange,
  coursePrice,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const courseFileInputRef = useRef<HTMLInputElement>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreviewLocal, setAvatarPreviewLocal] = useState<string | null>(null);
  const [avatarStats, setAvatarStats] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [uploadingInstructorId, setUploadingInstructorId] = useState<string | null>(null);
  const [instCompressionStats, setInstCompressionStats] = useState<Record<string, string>>({});

  const [newAudience, setNewAudience] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // Multi-instructor quick add
  const [newInstName, setNewInstName] = useState('');
  const [newInstTitle, setNewInstTitle] = useState('');
  const [newInstRoleLabel, setNewInstRoleLabel] = useState('مدرس همکار / ارائه‌دهنده');

  // Disk & offline files manager
  const folderTarget = courseId || `draft_${draftFolderKey}`;
  const [uploadingCourseFile, setUploadingCourseFile] = useState(false);
  const [courseFileError, setCourseFileError] = useState<string | null>(null);
  const [scanningDisk, setScanningDisk] = useState(false);
  const [diskInfo, setDiskInfo] = useState<{
    relativeDiskPath: string;
    files: Array<{ filename: string; sizeLabel: string; sizeBytes: number; format: string; url: string }>;
  } | null>(null);
  const [extFileTitle, setExtFileTitle] = useState('');
  const [extFileUrl, setExtFileUrl] = useState('');
  const [extFileSize, setExtFileSize] = useState('');
  const [extFileSessionNum, setExtFileSessionNum] = useState<string>('');

  // Fast compressed upload for primary instructor avatar (with auto old-file cleanup via previousUrl)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    const prevUrl = instructorAvatarUrl;
    try {
      const compressed = await compressImageFast(rawFile, 'avatar');
      setAvatarPreviewLocal(compressed.previewUrl);
      setAvatarStats(
        compressed.savedPercent > 0
          ? `فشرده‌سازی ${toPersianNumbers(compressed.savedPercent)}٪ (${formatFileSizeLabel(compressed.compressedBytes)})`
          : formatFileSizeLabel(compressed.compressedBytes)
      );
      const uploaded = await api.uploadFile(compressed.file, 'course', {
        previousUrl: prevUrl && prevUrl.startsWith('/api/storage/') ? prevUrl : undefined,
      });
      onInstructorAvatarChange(uploaded.url);
      // Also sync primary item inside instructors array
      const next = instructors.map((inst, idx) =>
        idx === 0 || inst.isPrimary ? { ...inst, avatarUrl: uploaded.url } : inst
      );
      if (next.length > 0) onInstructorsChange(next);
    } catch (err: any) {
      setAvatarError(err?.message || 'خطا در بارگذاری تصویر استاد.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Fast compressed upload for an additional instructor portrait
  const handleSecondaryInstructorAvatarUpload = async (instId: string, rawFile: File) => {
    const target = instructors.find(i => i.id === instId);
    const prevUrl = target?.avatarUrl;
    setUploadingInstructorId(instId);
    setAvatarError(null);
    try {
      const compressed = await compressImageFast(rawFile, 'avatar');
      onInstructorsChange(
        instructors.map(inst => (inst.id === instId ? { ...inst, avatarUrl: compressed.previewUrl } : inst))
      );
      setInstCompressionStats(prev => ({
        ...prev,
        [instId]:
          compressed.savedPercent > 0
            ? `${toPersianNumbers(compressed.savedPercent)}٪ بهینه`
            : formatFileSizeLabel(compressed.compressedBytes),
      }));
      const uploaded = await api.uploadFile(compressed.file, 'course', {
        previousUrl: prevUrl && prevUrl.startsWith('/api/storage/') ? prevUrl : undefined,
      });
      onInstructorsChange(
        instructors.map(inst => {
          if (inst.id !== instId) return inst;
          if (inst.isPrimary) onInstructorAvatarChange(uploaded.url);
          return { ...inst, avatarUrl: uploaded.url };
        })
      );
    } catch (err: any) {
      setAvatarError(err?.message || 'خطا در آپلود تصویر مدرس.');
    } finally {
      setUploadingInstructorId(null);
    }
  };

  // Multi-Instructor helpers
  const addSecondaryInstructor = () => {
    const cleanName = newInstName.trim();
    if (!cleanName) return;
    const baseList =
      instructors.length > 0
        ? instructors
        : primaryInstructorName.trim()
        ? [
            {
              id: `inst_primary_${Date.now()}`,
              fullName: primaryInstructorName.trim(),
              title: instructorTitle.trim() || undefined,
              roleLabel: 'مدرس اصلی دوره',
              avatarUrl: instructorAvatarUrl || undefined,
              resume: instructorResume || undefined,
              isPrimary: true,
            },
          ]
        : [];
    const created: CourseInstructorItem = {
      id: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fullName: cleanName,
      title: newInstTitle.trim() || undefined,
      roleLabel: newInstRoleLabel.trim() || 'مدرس همکار',
      isPrimary: baseList.length === 0,
    };
    onInstructorsChange([...baseList, created]);
    setNewInstName('');
    setNewInstTitle('');
  };

  const setInstructorPrimary = (instId: string) => {
    const next = instructors.map(inst => ({ ...inst, isPrimary: inst.id === instId }));
    onInstructorsChange(next);
    const chosen = next.find(i => i.id === instId);
    if (chosen) {
      onPrimaryInstructorNameChange(chosen.fullName);
      onInstructorTitleChange(chosen.title || '');
      onInstructorAvatarChange(chosen.avatarUrl || '');
      onInstructorResumeChange(chosen.resume || '');
    }
  };

  const removeInstructor = (instId: string) => {
    const filtered = instructors.filter(i => i.id !== instId);
    if (filtered.length > 0 && !filtered.some(i => i.isPrimary)) {
      filtered[0] = { ...filtered[0], isPrimary: true };
      onPrimaryInstructorNameChange(filtered[0].fullName);
      onInstructorTitleChange(filtered[0].title || '');
      onInstructorAvatarChange(filtered[0].avatarUrl || '');
      onInstructorResumeChange(filtered[0].resume || '');
    }
    onInstructorsChange(filtered);
  };

  // Multi-Session helpers
  const addSession = () => {
    const nextNum = sessions.length + 1;
    const primaryInst = instructors.find(i => i.isPrimary) || instructors[0];
    const nextSess: CourseSessionItem = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sessionNumber: nextNum,
      title: `جلسه ${toPersianNumbers(nextNum)}`,
      presenterMode: primaryInst || primaryInstructorName ? 'course_instructor' : 'unspecified',
      presenterInstructorId: primaryInst?.id,
      presenterName: primaryInst?.fullName || primaryInstructorName || undefined,
      presenterTitle: primaryInst?.title || instructorTitle || undefined,
      holdingType: 'online',
      durationMinutes: 90,
    };
    onSessionsChange([...sessions, nextSess]);
  };

  const updateSession = (sessId: string, patch: Partial<CourseSessionItem>) => {
    onSessionsChange(sessions.map(s => (s.id === sessId ? { ...s, ...patch } : s)));
  };

  const removeSession = (sessId: string) => {
    const next = sessions
      .filter(s => s.id !== sessId)
      .map((s, idx) => ({ ...s, sessionNumber: idx + 1 }));
    onSessionsChange(next);
  };

  // Disk files helpers
  const handleUploadCourseDiskFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCourseFileError(null);
    setUploadingCourseFile(true);
    try {
      const uploaded = await api.uploadFile(
        file,
        'course_file',
        courseId ? { courseId } : { draftFolderKey }
      );
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const newEntry: CourseOfflineFileEntry = {
        id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: file.name.replace(/\.[^.]+$/, '') || file.name,
        url: uploaded.url,
        size: formatFileSizeLabel(uploaded.sizeBytes || file.size),
        fileSizeBytes: uploaded.sizeBytes || file.size,
        format: ext,
        sourceType: 'upload',
        filename: uploaded.filename,
        sessionNumber: extFileSessionNum ? Number(extFileSessionNum) : undefined,
      };
      onOfflineDownloadFilesChange([...offlineDownloadFiles, newEntry]);
      await handleScanDiskFolder();
    } catch (err: any) {
      setCourseFileError(err?.message || 'خطا در بارگذاری فایل دوره روی دیسک.');
    } finally {
      setUploadingCourseFile(false);
      e.target.value = '';
    }
  };

  const handleScanDiskFolder = async () => {
    setScanningDisk(true);
    setCourseFileError(null);
    try {
      const res = await api.getCourseDiskFiles(folderTarget);
      setDiskInfo({
        relativeDiskPath: res.relativeDiskPath,
        files: res.files || [],
      });
    } catch (err: any) {
      setCourseFileError(err?.message || 'خطا در خواندن پوشه دیسک دوره.');
    } finally {
      setScanningDisk(false);
    }
  };

  const handleAttachDiskFileToList = (diskFile: {
    filename: string;
    sizeLabel: string;
    sizeBytes: number;
    format: string;
    url: string;
  }) => {
    if (offlineDownloadFiles.some(f => f.url === diskFile.url || f.downloadUrl === diskFile.url)) {
      return;
    }
    const cleanTitle = diskFile.filename.replace(/\.[^.]+$/, '').replace(/^[0-9]+_[a-z0-9]+_/i, '') || diskFile.filename;
    onOfflineDownloadFilesChange([
      ...offlineDownloadFiles,
      {
        id: `disk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: cleanTitle,
        url: diskFile.url,
        size: diskFile.sizeLabel,
        fileSizeBytes: diskFile.sizeBytes,
        format: diskFile.format,
        sourceType: 'disk',
        filename: diskFile.filename,
      },
    ]);
  };

  const handleDeletePhysicalDiskFile = async (filename: string, url: string) => {
    try {
      await api.deleteCourseDiskFile(folderTarget, filename);
      onOfflineDownloadFilesChange(offlineDownloadFiles.filter(f => (f.url || f.downloadUrl) !== url));
      await handleScanDiskFolder();
    } catch (err: any) {
      setCourseFileError(err?.message || 'خطا در حذف فایل از دیسک.');
    }
  };

  const handleAddExternalLink = () => {
    setCourseFileError(null);
    if (!extFileTitle.trim() || !extFileUrl.trim()) {
      setCourseFileError('لطفاً عنوان فایل و نشانی لینک دانلود را وارد نمایید.');
      return;
    }
    const cleanUrl = extFileUrl.trim();
    const extMatch = cleanUrl.split('?')[0].split('.').pop()?.toUpperCase();
    const fmt = extMatch && extMatch.length <= 5 ? extMatch : 'LINK';
    onOfflineDownloadFilesChange([
      ...offlineDownloadFiles,
      {
        id: `ext_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: extFileTitle.trim(),
        url: cleanUrl,
        size: extFileSize.trim() || 'لینک دانلود',
        format: fmt,
        sourceType: cleanUrl.startsWith('/api/storage/private/') ? 'disk' : 'external',
        sessionNumber: extFileSessionNum ? Number(extFileSessionNum) : undefined,
      },
    ]);
    setExtFileTitle('');
    setExtFileUrl('');
    setExtFileSize('');
    setExtFileSessionNum('');
  };

  const toggleAudience = (aud: string) => {
    if (targetAudiences.includes(aud)) {
      onTargetAudiencesChange(targetAudiences.filter(a => a !== aud));
    } else {
      onTargetAudiencesChange([...targetAudiences, aud]);
    }
  };

  const addCustomAudience = () => {
    const clean = newAudience.trim();
    if (!clean) return;
    if (!targetAudiences.includes(clean)) {
      onTargetAudiencesChange([...targetAudiences, clean]);
    }
    setNewAudience('');
  };

  const toggleHiddenField = (key: string) => {
    if (hiddenFields.includes(key)) {
      onHiddenFieldsChange(hiddenFields.filter(k => k !== key));
    } else {
      onHiddenFieldsChange([...hiddenFields, key]);
    }
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    onCustomFieldsChange([
      ...customFields,
      {
        id: `cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: newFieldLabel.trim(),
        value: newFieldValue.trim(),
        visible: true,
      },
    ]);
    setNewFieldLabel('');
    setNewFieldValue('');
  };

  const updateInstallmentItem = (idx: number, patch: Partial<CourseInstallmentPlanItem>) => {
    const nextItems = installmentPlan.items.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    onInstallmentPlanChange({
      ...installmentPlan,
      items: nextItems,
      count: nextItems.length,
    });
  };

  const addInstallmentItem = () => {
    const nextNum = installmentPlan.items.length + 1;
    const futureDate = new Date(Date.now() + (nextNum - 1) * 30 * 86400 * 1000);
    const iso = futureDate.toISOString().slice(0, 10);
    const jalali = futureDate.toLocaleDateString('fa-IR');
    const nextItems: CourseInstallmentPlanItem[] = [
      ...installmentPlan.items,
      {
        installmentNumber: nextNum,
        title: `قسط ${toPersianNumbers(nextNum)}`,
        percentage: Math.round(100 / nextNum),
        fixedAmount: coursePrice > 0 ? Math.round(coursePrice / nextNum) : 0,
        dueDateIso: iso,
        dueDateJalali: jalali,
      },
    ];
    onInstallmentPlanChange({
      ...installmentPlan,
      enabled: true,
      count: nextItems.length,
      items: nextItems,
    });
  };

  const removeInstallmentItem = (idx: number) => {
    const nextItems = installmentPlan.items
      .filter((_, i) => i !== idx)
      .map((item, i) => ({ ...item, installmentNumber: i + 1 }));
    onInstallmentPlanChange({
      ...installmentPlan,
      count: nextItems.length,
      items: nextItems,
    });
  };

  const effectiveAvatarPreview = avatarPreviewLocal || instructorAvatarUrl;

  return (
    <div className="space-y-6">
      {/* A. Primary Instructor Title, Fast Avatar & Multi-Instructor Manager */}
      <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            <span>۷. اساتید و مدرسان دوره (پشتیبانی از چند مدرس + فشرده‌سازی خودکار تصویر):</span>
          </h4>
          <span className="text-[10px] font-bold text-slate-400 tabular-nums">
            تعداد مدرسین ثبت‌شده: {toPersianNumbers(Math.max(instructors.length, primaryInstructorName ? 1 : 0))} نفر
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              مرتبه علمی / سمت استاد اصلی:
            </label>
            <input
              type="text"
              value={instructorTitle}
              onChange={e => onInstructorTitleChange(e.target.value)}
              placeholder="مثال: مدرس خارج فقه و قاضی دیوان عالی کشور"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {effectiveAvatarPreview ? (
              <div className="relative shrink-0">
                <img
                  src={effectiveAvatarPreview}
                  alt="تصویر استاد"
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreviewLocal(null);
                    setAvatarStats(null);
                    onInstructorAvatarChange('');
                  }}
                  title="حذف عکس استاد (حذف از دیسک پس از ذخیره)"
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center shadow cursor-pointer"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>{uploadingAvatar ? 'در حال فشرده‌سازی و ذخیره...' : 'بارگذاری سریع عکس استاد'}</span>
              </button>
              {avatarStats && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block tabular-nums">
                  {avatarStats}
                </span>
              )}
              {avatarError && <span className="text-[10px] text-rose-600 block">{avatarError}</span>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            رزومه علمی، تالیفات و سوابق تدریس استاد اصلی:
          </label>
          <textarea
            rows={2}
            value={instructorResume}
            onChange={e => onInstructorResumeChange(e.target.value)}
            placeholder="سوابق تدریس در حوزه و دانشگاه، تالیفات فقهی-حقوقی، سوابق قضایی و علمی استاد..."
            className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed"
          />
        </div>

        {/* Multi-Instructor Sub-panel */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>فهرست مدرسان همکار و ارائه‌دهندگان چندگانه دوره:</span>
            </span>
          </div>

          {instructors.length > 0 && (
            <div className="space-y-2">
              {instructors.map((inst, idx) => (
                <div
                  key={inst.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    inst.isPrimary
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {inst.avatarUrl ? (
                      <img src={inst.avatarUrl} alt={inst.fullName} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-300 dark:border-slate-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      <input
                        type="text"
                        value={inst.fullName}
                        onChange={e => {
                          const val = e.target.value;
                          onInstructorsChange(instructors.map((x, i) => (i === idx ? { ...x, fullName: val } : x)));
                          if (inst.isPrimary) onPrimaryInstructorNameChange(val);
                        }}
                        placeholder="نام کامل مدرس"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                      />
                      <input
                        type="text"
                        value={inst.title || ''}
                        onChange={e => {
                          const val = e.target.value;
                          onInstructorsChange(instructors.map((x, i) => (i === idx ? { ...x, title: val } : x)));
                          if (inst.isPrimary) onInstructorTitleChange(val);
                        }}
                        placeholder="مرتبه علمی / سمت"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={inst.roleLabel || ''}
                        onChange={e => {
                          const val = e.target.value;
                          onInstructorsChange(instructors.map((x, i) => (i === idx ? { ...x, roleLabel: val } : x)));
                        }}
                        placeholder="نقش (مثلاً مدرس جلسات فقهی)"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <label className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer flex items-center gap-1">
                      {uploadingInstructorId === inst.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{instCompressionStats[inst.id] || 'عکس'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleSecondaryInstructorAvatarUpload(inst.id, f);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setInstructorPrimary(inst.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black cursor-pointer ${
                        inst.isPrimary
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {inst.isPrimary ? 'استاد اصلی' : 'انتخاب به عنوان اصلی'}
                    </button>

                    {instructors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstructor(inst.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        title="حذف مدرس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Collaborating Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
            <input
              type="text"
              value={newInstName}
              onChange={e => setNewInstName(e.target.value)}
              placeholder="نام مدرس / ارائه‌دهنده همکار..."
              className="sm:col-span-4 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <input
              type="text"
              value={newInstTitle}
              onChange={e => setNewInstTitle(e.target.value)}
              placeholder="عنوان علمی (مثلاً قاضی / عضو هیئت علمی)"
              className="sm:col-span-4 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <input
              type="text"
              value={newInstRoleLabel}
              onChange={e => setNewInstRoleLabel(e.target.value)}
              placeholder="نقش در دوره"
              className="sm:col-span-2 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={addSecondaryInstructor}
              className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن مدرس</span>
            </button>
          </div>
        </div>
      </div>

      {/* A2. Multi-Session Curriculum & Per-Session Presenter Manager */}
      <div className="space-y-3 p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 dark:border-sky-900/40 pb-2">
          <div>
            <h4 className="text-xs font-black text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>۸. مدیریت جلسات دوره و تعیین ارائه‌دهنده اختصاصی هر جلسه:</span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              دوره می‌تواند یک یا چند جلسه با مدرس از لیست اساتید، ارائه‌دهنده مهمان، نشست هم‌اندیشی و یا بدون ذکر مدرس داشته باشد.
            </p>
          </div>

          <button
            type="button"
            onClick={addSession}
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن جلسه جدید ({toPersianNumbers(sessions.length)} جلسه)</span>
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900 border border-dashed border-sky-300 dark:border-sky-800 text-center text-xs text-slate-500">
            هنوز جلسه زمان‌بندی‌شده اختصاصی ثبت نشده است. با کلیک بر روی «افزودن جلسه جدید»، برنامه جلسات و ارائه‌دهنده هر جلسه را تنظیم نمایید.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess, idx) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-800/50 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-black text-[11px] tabular-nums shrink-0">
                      جلسه {toPersianNumbers(sess.sessionNumber || idx + 1)}
                    </span>
                    <input
                      type="text"
                      value={sess.title}
                      onChange={e => updateSession(sess.id, { title: e.target.value })}
                      placeholder="موضوع و عنوان جلسه..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSession(sess.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="حذف جلسه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4">
                    <span className="text-[10px] text-slate-400 block mb-0.5">نحوه ذکر ارائه‌دهنده / مدرس جلسه</span>
                    <select
                      value={sess.presenterMode}
                      onChange={e => {
                        const mode = e.target.value as CourseSessionPresenterMode;
                        if (mode === 'unspecified') {
                          updateSession(sess.id, {
                            presenterMode: mode,
                            presenterInstructorId: undefined,
                            presenterName: undefined,
                            presenterTitle: undefined,
                          });
                        } else if (mode === 'course_instructor') {
                          const firstInst = instructors[0];
                          updateSession(sess.id, {
                            presenterMode: mode,
                            presenterInstructorId: firstInst?.id,
                            presenterName: firstInst?.fullName || primaryInstructorName,
                            presenterTitle: firstInst?.title || instructorTitle,
                          });
                        } else {
                          updateSession(sess.id, { presenterMode: mode, presenterInstructorId: undefined });
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                    >
                      <option value="course_instructor">انتخاب از اساتید دوره</option>
                      <option value="custom_presenter">ارائه‌دهنده مهمان / اختصاصی</option>
                      <option value="panel">پنل تخصصی / چند ارائه‌دهنده</option>
                      <option value="unspecified">بدون ذکر مدرس</option>
                    </select>
                  </div>

                  {sess.presenterMode === 'course_instructor' && (
                    <div className="sm:col-span-4">
                      <span className="text-[10px] text-slate-400 block mb-0.5">انتخاب مدرس جلسه</span>
                      <select
                        value={sess.presenterInstructorId || ''}
                        onChange={e => {
                          const chosen = instructors.find(i => i.id === e.target.value);
                          updateSession(sess.id, {
                            presenterInstructorId: chosen?.id,
                            presenterName: chosen?.fullName || primaryInstructorName,
                            presenterTitle: chosen?.title || instructorTitle,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                      >
                        {instructors.length === 0 ? (
                          <option value="">{primaryInstructorName || 'استاد دوره'}</option>
                        ) : (
                          instructors.map(inst => (
                            <option key={inst.id} value={inst.id}>
                              {inst.fullName} {inst.title ? `(${inst.title})` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}

                  {(sess.presenterMode === 'custom_presenter' || sess.presenterMode === 'panel') && (
                    <>
                      <div className="sm:col-span-4">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          {sess.presenterMode === 'panel' ? 'اسامی اعضای پنل / ارائه‌دهندگان' : 'نام کامل ارائه‌دهنده مهمان'}
                        </span>
                        <input
                          type="text"
                          value={sess.presenterName || ''}
                          onChange={e => updateSession(sess.id, { presenterName: e.target.value })}
                          placeholder="مثال: دکتر احمدی و حجت‌الاسلام حسینی"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <span className="text-[10px] text-slate-400 block mb-0.5">سمت / توضیح ارائه‌دهنده (اختیاری)</span>
                        <input
                          type="text"
                          value={sess.presenterTitle || ''}
                          onChange={e => updateSession(sess.id, { presenterTitle: e.target.value })}
                          placeholder="مثال: قاضی پژوهشگر"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </>
                  )}

                  {sess.presenterMode === 'unspecified' && (
                    <div className="sm:col-span-8 flex items-end pb-1.5 text-[11px] text-slate-400">
                      نام مدرس برای این جلسه در کاتالوگ دوره نمایش داده نخواهد شد.
                    </div>
                  )}

                  {sess.presenterMode === 'course_instructor' && (
                    <div className="sm:col-span-4">
                      <span className="text-[10px] text-slate-400 block mb-0.5">نوع برگزاری جلسه</span>
                      <select
                        value={sess.holdingType || 'online'}
                        onChange={e => updateSession(sess.id, { holdingType: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="online">برخط (آنلاین)</option>
                        <option value="in_person">حضوری</option>
                        <option value="hybrid">ترکیبی</option>
                        <option value="offline_recorded">آفلاین (فایل ضبط‌شده)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">تاریخ جلسه (شمسی)</span>
                    <input
                      type="text"
                      value={sess.sessionDate || ''}
                      onChange={e => updateSession(sess.id, { sessionDate: e.target.value })}
                      placeholder="۱۴۰۳/۱۰/۰۵"
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 tabular-nums"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">ساعت شروع</span>
                    <input
                      type="text"
                      value={sess.startTime || ''}
                      onChange={e => updateSession(sess.id, { startTime: e.target.value })}
                      placeholder="۰۹:۳۰"
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 tabular-nums"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">مدت (دقیقه)</span>
                    <input
                      type="number"
                      min={10}
                      value={sess.durationMinutes || 90}
                      onChange={e => updateSession(sess.id, { durationMinutes: Number(e.target.value) })}
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">لینک اختصاصی جلسه (اختیاری)</span>
                    <input
                      type="text"
                      value={sess.meetingLink || ''}
                      onChange={e => updateSession(sess.id, { meetingLink: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono dir-ltr"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A3. Per-Course Dedicated Disk Folder & Downloadable Files Manager */}
      <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 dark:border-indigo-900/40 pb-2">
          <div>
            <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>۹. فایل‌های دوره آفلاین، جزوات و بارگذاری در پوشه اختصاصی دیسک دوره:</span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              فایل‌های بارگذاری‌شده در پوشه اختصاصی این دوره روی دیسک نرم‌افزار ذخیره می‌شوند؛ همچنین می‌توانید فایل‌ها را مستقیماً در پوشه قرار داده و با دکمه اسکن به فهرست دانلود بیفزایید.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[10px] font-mono dir-ltr text-indigo-700 dark:text-indigo-300">
            course_files/{folderTarget.startsWith('draft_') || folderTarget.startsWith('course_') ? folderTarget : `course_${folderTarget}`}/
          </span>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            راهنمای دانلود و دسترسی به فایل‌های دوره برای شرکت‌کنندگان:
          </label>
          <input
            type="text"
            value={offlineDownloadGuide}
            onChange={e => onOfflineDownloadGuideChange(e.target.value)}
            placeholder="مثال: ویدیوهای ضبط‌شده و اسلاید جلسات جهت دانلود شرکت‌کنندگان قطعی دوره..."
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          />
        </div>

        {/* Upload directly to course disk folder OR scan folder */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={courseFileInputRef}
            type="file"
            accept=".zip,.rar,.7z,.pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.m4a,.wav,.webm,.jpg,.jpeg,.png,.webp"
            onChange={handleUploadCourseDiskFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploadingCourseFile}
            onClick={() => courseFileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {uploadingCourseFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
            <span>{uploadingCourseFile ? 'در حال ذخیره در پوشه دوره...' : 'آپلود فایل دوره روی دیسک'}</span>
          </button>

          <button
            type="button"
            disabled={scanningDisk}
            onClick={handleScanDiskFolder}
            className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {scanningDisk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5 text-amber-400" />}
            <span>اسکن فایل‌های موجود در پوشه دیسک دوره</span>
          </button>
        </div>

        {courseFileError && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold">
            {courseFileError}
          </div>
        )}

        {/* Scanned Physical Disk Files Result */}
        {diskInfo && (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-600 dark:text-slate-300">
                فایل‌های فیزیکی شناسایی‌شده در دیسک (<span className="font-mono dir-ltr">{diskInfo.relativeDiskPath}</span>):
              </span>
              <button
                type="button"
                onClick={handleScanDiskFolder}
                className="text-indigo-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>بروزرسانی</span>
              </button>
            </div>

            {diskInfo.files.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                هنوز فایلی داخل این پوشه روی دیسک قرار نگرفته است. می‌توانید فایل خود را آپلود کنید یا مستقیماً داخل پوشه یادشده روی سرور کپی نمایید.
              </p>
            ) : (
              <div className="space-y-1.5">
                {diskInfo.files.map(df => {
                  const alreadyAttached = offlineDownloadFiles.some(
                    f => f.url === df.url || f.downloadUrl === df.url
                  );
                  return (
                    <div
                      key={df.filename}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-bold">
                          {df.format}
                        </span>
                        <span className="font-mono text-[11px] truncate dir-ltr">{df.filename}</span>
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">{df.sizeLabel}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {alreadyAttached ? (
                          <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            متصل به دوره
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAttachDiskFileToList(df)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer"
                          >
                            + افزودن به لیست دانلود
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhysicalDiskFile(df.filename, df.url)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="حذف فیزیکی فایل از دیسک"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Current Course Download Links List */}
        {offlineDownloadFiles.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
              فهرست فایل‌ها و لینک‌های دانلود متصل به دوره ({toPersianNumbers(offlineDownloadFiles.length)} مورد):
            </span>
            {offlineDownloadFiles.map((f, idx) => (
              <div
                key={f.id || idx}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 font-bold text-[10px] shrink-0">
                    {f.format || f.fileType || 'FILE'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-900 dark:text-white truncate">{f.title}</strong>
                      {f.sessionNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                          جلسه {toPersianNumbers(f.sessionNumber)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate block dir-ltr">
                      {f.url || f.downloadUrl} {f.size ? `· ${f.size}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onOfflineDownloadFilesChange(offlineDownloadFiles.filter((_, i) => i !== idx))
                    }
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="حذف از فهرست دانلود دوره"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* External Download Link Form */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
          <input
            type="text"
            value={extFileTitle}
            onChange={e => setExtFileTitle(e.target.value)}
            placeholder="عنوان فایل یا لینک دانلود..."
            className="sm:col-span-4 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          />
          <input
            type="text"
            value={extFileUrl}
            onChange={e => setExtFileUrl(e.target.value)}
            placeholder="آدرس دانلود (https://... یا /api/storage/...)"
            className="sm:col-span-4 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono dir-ltr"
          />
          <input
            type="text"
            value={extFileSize}
            onChange={e => setExtFileSize(e.target.value)}
            placeholder="حجم (مثلاً ۴۵ مگ)"
            className="sm:col-span-2 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          />
          <button
            type="button"
            onClick={handleAddExternalLink}
            className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>افزودن لینک</span>
          </button>
        </div>
      </div>

      {/* B. Target Audiences, Holding Time, Necessity & Manager Notes */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <Target className="w-4 h-4" />
          <span>۱۰. ساعت برگزاری، مخاطبین هدف، ضرورت دوره و توضیحات مدیر:</span>
        </h4>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
            ساعت دقیق برگزاری دوره:
          </label>
          <input
            type="text"
            value={holdingTime}
            onChange={e => onHoldingTimeChange(e.target.value)}
            placeholder="مثال: پنج‌شنبه‌ها ساعت ۱۶:۰۰ الی ۱۸:۳۰"
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            مخاطبین هدف دوره (انتخاب گروهی یا افزودن دستی):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_AUDIENCE_OPTIONS.map(opt => {
              const selected = targetAudiences.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleAudience(opt)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    selected
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAudience}
              onChange={e => setNewAudience(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomAudience();
                }
              }}
              placeholder="افزودن مخاطب هدف دلخواه..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={addCustomAudience}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              افزودن
            </button>
          </div>
          {targetAudiences.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {targetAudiences.map(aud => (
                <span
                  key={aud}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[11px] font-bold"
                >
                  <span>{aud}</span>
                  <button type="button" onClick={() => toggleAudience(aud)} className="text-rose-500 cursor-pointer">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              ضرورت‌های اجرای دوره:
            </label>
            <textarea
              rows={3}
              value={necessity}
              onChange={e => onNecessityChange(e.target.value)}
              placeholder="چرایی و ضرورت برگزاری این دوره تخصصی و حل نیازهای قضایی و پژوهشی..."
              className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              توضیحات تکمیلی و نکات مدیر آموزش:
            </label>
            <textarea
              rows={3}
              value={managerNotes}
              onChange={e => onManagerNotesChange(e.target.value)}
              placeholder="توضیحات اضافی، ضوابط امتیاز پژوهشی یا توصیه‌های مدیر..."
              className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 resize-none"
            />
          </div>
        </div>
      </div>

      {/* C. Dynamic Fields Builder & Hidden Built-in Fields */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5">
          <Layers className="w-4 h-4" />
          <span>۱۱. سفارشی‌سازی فیلدها (افزودن فیلد جدید یا کسر فیلدهای پیش‌فرض توسط مدیر):</span>
        </h4>

        <div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
            کسر / مخفی‌سازی فیلدهای پیش‌فرض برای این دوره (فیلدهای انتخاب‌شده مخفی می‌شوند):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BUILT_IN_HIDEABLE_FIELDS.map(f => {
              const isHidden = hiddenFields.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggleHiddenField(f.key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                    isHidden
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 line-through'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-emerald-500" />}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>افزودن فیلد سفارشی جدید توسط ادمین:</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              type="text"
              value={newFieldLabel}
              onChange={e => setNewFieldLabel(e.target.value)}
              placeholder="عنوان فیلد (مثلاً: امتیاز ضمن خدمت)"
              className="sm:col-span-2 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <input
              type="text"
              value={newFieldValue}
              onChange={e => setNewFieldValue(e.target.value)}
              placeholder="مقدار / توضیح فیلد..."
              className="sm:col-span-2 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={addCustomField}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن فیلد</span>
            </button>
          </div>

          {customFields.length > 0 && (
            <div className="space-y-2 pt-1">
              {customFields.map((cf, idx) => (
                <div
                  key={cf.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs"
                >
                  <input
                    type="text"
                    value={cf.label}
                    onChange={e => {
                      const next = customFields.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x));
                      onCustomFieldsChange(next);
                    }}
                    className="w-40 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                  <input
                    type="text"
                    value={cf.value}
                    onChange={e => {
                      const next = customFields.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x));
                      onCustomFieldsChange(next);
                    }}
                    className="flex-1 min-w-[160px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = customFields.map((x, i) => (i === idx ? { ...x, visible: !cf.visible } : x));
                      onCustomFieldsChange(next);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      cf.visible !== false
                        ? 'bg-emerald-500/15 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cf.visible !== false ? 'نمایش فعال' : 'مخفی'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onCustomFieldsChange(customFields.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* D. Scheduled Installment Plan Table */}
      <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-900/40 pb-2">
          <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" />
            <span>۱۲. زمان‌بندی سررسید اقساط (بازشدن خودکار درگاه پرداخت در پنل کاربر):</span>
          </h4>

          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={hasInstallments && installmentPlan.enabled}
              onChange={e => {
                const checked = e.target.checked;
                onHasInstallmentsChange(checked);
                onInstallmentPlanChange({
                  ...installmentPlan,
                  enabled: checked,
                  count: installmentPlan.items.length,
                });
              }}
              className="rounded text-emerald-600"
            />
            <span>فعال‌سازی جدول سررسید اقساط هوشمند</span>
          </label>
        </div>

        {hasInstallments && installmentPlan.enabled && (
          <div className="space-y-2.5">
            {installmentPlan.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 text-xs items-center"
              >
                <div className="sm:col-span-3">
                  <span className="text-[10px] text-slate-400 block">عنوان قسط</span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={e => updateInstallmentItem(idx, { title: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">درصد شهریه</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={item.percentage ?? 0}
                    onChange={e => updateInstallmentItem(idx, { percentage: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">مبلغ ثابت (اختیاری)</span>
                  <input
                    type="number"
                    min={0}
                    value={item.fixedAmount ?? 0}
                    onChange={e => updateInstallmentItem(idx, { fixedAmount: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">سررسید میلادی (تریگر خودکار)</span>
                  <input
                    type="date"
                    value={item.dueDateIso}
                    onChange={e => updateInstallmentItem(idx, { dueDateIso: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block">تاریخ نمایشی شمسی</span>
                  <input
                    type="text"
                    value={item.dueDateJalali}
                    onChange={e => updateInstallmentItem(idx, { dueDateJalali: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => removeInstallmentItem(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="حذف قسط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addInstallmentItem}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن ردیف قسط و تاریخ سررسید</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { CartableCategory, RequestPriority, User } from '../../types';
import { api } from '../../services/apiClient';
import {
  X,
  Paperclip,
  Upload,
  Loader2,
  Trash2,
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  CARTABLE_FILE_ACCEPT,
  CartableCategoryItem,
  validateCartableClientFile,
} from './cartableTypes';

interface UploadedDraftAttachment {
  url: string;
  name: string;
}

interface CartableNewRequestModalProps {
  isOpen: boolean;
  currentUser: User | null;
  categories: CartableCategoryItem[];
  categoriesDisabled: boolean;
  followableButtonLabel: string;
  followableEnabled: boolean;
  initialCategoryKey?: string;
  initialTitle?: string;
  onClose: () => void;
  onOpenFollowableTopics: () => void;
  onSubmitRequest: (
    payload: {
      category: CartableCategory;
      categoryTitle: string;
      title: string;
      description: string;
      applicantId: string;
      applicantName: string;
      applicantRoleTitle: string;
      priority: RequestPriority;
      status: 'pending';
      attachments?: string[];
    },
    initialMessageText: string
  ) => Promise<void>;
}

export const CartableNewRequestModal: React.FC<CartableNewRequestModalProps> = ({
  isOpen,
  currentUser,
  categories,
  categoriesDisabled,
  followableButtonLabel,
  followableEnabled,
  initialCategoryKey,
  initialTitle,
  onClose,
  onOpenFollowableTopics,
  onSubmitRequest,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCategories = categories.filter(c => c.isActive !== false);
  const hasActiveCategories = !categoriesDisabled && activeCategories.length > 0;

  const [newCategoryKey, setNewCategoryKey] = useState<string>(
    initialCategoryKey || activeCategories[0]?.key || 'general'
  );
  const [newTitle, setNewTitle] = useState(initialTitle || '');
  const [newPriority, setNewPriority] = useState<RequestPriority>('normal');
  const [newDescription, setNewDescription] = useState('');
  const [attachments, setAttachments] = useState<UploadedDraftAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTitle !== undefined) {
        setNewTitle(initialTitle);
      }
      if (initialCategoryKey && activeCategories.some(c => c.key === initialCategoryKey)) {
        setNewCategoryKey(initialCategoryKey);
      } else if (activeCategories.length > 0 && !activeCategories.some(c => c.key === newCategoryKey)) {
        setNewCategoryKey(activeCategories[0].key);
      }
      setUploadError(null);
    }
  }, [isOpen, initialTitle, initialCategoryKey]);

  if (!isOpen) return null;

  const selectedCategoryObj =
    activeCategories.find(c => c.key === newCategoryKey) || activeCategories[0];

  const handleSelectFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadError(null);
    setUploading(true);
    try {
      for (const file of files) {
        const check = validateCartableClientFile(file);
        if (!check.ok) {
          setUploadError(check.error || 'فرمت فایل مجاز نیست.');
          continue;
        }
        // Always save alumni initial request attachments in dedicated folder 'cartable_alumni'
        const uploaded = await api.uploadFile(file, 'cartable_alumni');
        if (uploaded?.url) {
          setAttachments(prev => [
            ...prev,
            { url: uploaded.url, name: uploaded.originalName || file.name },
          ]);
        }
      }
    } catch (err: any) {
      setUploadError(err?.message || 'خطا در بارگذاری فایل پیوست روی سرور.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim() || !newDescription.trim() || submitting) return;

    setSubmitting(true);
    try {
      const resolvedCategoryKey = hasActiveCategories && selectedCategoryObj
        ? selectedCategoryObj.key
        : 'general';
      const resolvedCategoryTitle = hasActiveCategories && selectedCategoryObj
        ? selectedCategoryObj.title
        : 'درخواست عمومی (ارجاع به مدیر دانش‌آموختگان)';

      await onSubmitRequest(
        {
          category: resolvedCategoryKey as CartableCategory,
          categoryTitle: resolvedCategoryTitle,
          title: newTitle.trim(),
          description: newDescription.trim(),
          applicantId: currentUser.id,
          applicantName: currentUser.fullName,
          applicantRoleTitle: currentUser.roleTitle,
          priority: newPriority,
          status: 'pending',
          attachments: attachments.map(a => a.url),
        },
        newDescription.trim()
      );

      setNewTitle('');
      setNewDescription('');
      setAttachments([]);
      setUploadError(null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 max-h-[92dvh] sm:max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 p-4 sm:p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-black text-white truncate">
              ثبت درخواست جدید در کارتابل خدمات
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-1">
              درخواست شما مستقیماً به مسئول مربوطه ارجاع داده شده و کد پیگیری یکتا دریافت می‌کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="cartable-new-request-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto overscroll-y-contain flex-1 min-h-0"
        >
          {/* Quick Button: Followable Cases of Islamic Law & Jurisprudence Center (اصلاحیه ۴) */}
          {followableEnabled && (
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-sky-800 dark:text-sky-200 font-bold">
                <Info className="w-4 h-4 text-sky-500 shrink-0" />
                <span>آشنایی با امور اداری، آموزشی و استعلامات قابل پیگیری:</span>
              </div>
              <button
                type="button"
                onClick={onOpenFollowableTopics}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ClipboardList className="w-4 h-4" />
                <span>{followableButtonLabel}</span>
              </button>
            </div>
          )}

          {/* Dynamic Category Selector OR Direct Routing to Alumni Manager Notice (اصلاح ۳) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              دسته‌بندی موضوعی درخواست
            </label>
            {hasActiveCategories ? (
              <>
                <select
                  value={newCategoryKey}
                  onChange={e => setNewCategoryKey(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {activeCategories.map(cat => (
                    <option key={cat.id || cat.key} value={cat.key}>
                      {cat.title}
                    </option>
                  ))}
                </select>
                {selectedCategoryObj && (
                  <div className="mt-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs flex flex-wrap items-center justify-between gap-2 text-sky-700 dark:text-sky-300 font-medium">
                    <span>{selectedCategoryObj.description}</span>
                    <span className="font-bold text-[11px] bg-sky-500/20 px-2 py-0.5 rounded-md text-sky-800 dark:text-sky-200 shrink-0">
                      ارجاع خودکار به: {selectedCategoryObj.assignedOfficialTitle}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 font-bold flex items-center justify-between gap-2">
                <span>
                  در حال حاضر دسته‌بندی‌ها توسط مدیریت غیرفعال شده‌اند؛ تمامی درخواست‌ها به صورت مستقیم برای مدیر دانش‌آموختگان ارسال می‌شوند.
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-[11px] font-black shrink-0">
                  گیرنده: مدیر دانش‌آموختگان
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              عنوان درخواست
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="عنوان دقیق درخواست خود را بنویسید (مثال: تقاضای صدور گواهی فارغ‌التحصیلی)"
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              اولویّت پاسخگویی
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewPriority('normal')}
                className={`p-3 rounded-2xl text-xs font-black border transition-all text-center cursor-pointer ${
                  newPriority === 'normal'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                }`}
              >
                عادی
              </button>
              <button
                type="button"
                onClick={() => setNewPriority('urgent')}
                className={`p-3 rounded-2xl text-xs font-black border transition-all text-center cursor-pointer ${
                  newPriority === 'urgent'
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/50 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                }`}
              >
                فوری (پاسخ ۲۴ ساعته)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              شرح درخواست و توضیحات کامل
            </label>
            <textarea
              rows={4}
              required
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="مشخصات کامل، دلایل و توضیحات درخواست خود را بنویسید..."
              className="w-full p-4 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Secure Disk Attachment Uploader */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Paperclip className="w-4 h-4 text-emerald-500" />
                <span>پیوست مدارک و مستندات (اختیاری)</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={CARTABLE_FILE_ACCEPT}
                onChange={handleSelectFiles}
                className="hidden"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploading ? 'در حال بررسی و ذخیره...' : 'انتخاب فایل پیوست'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                فرمت‌های مجاز: تصویر (JPG، PNG، WEBP)، فایل PDF و سند Word (DOC، DOCX) · حداکثر ۸ مگابایت
              </span>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachments.map((att, idx) => (
                  <div
                    key={`${att.url}-${idx}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 text-xs font-bold"
                  >
                    <span className="truncate max-w-[180px]" dir="ltr">
                      {att.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="حذف پیوست"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="shrink-0 p-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 flex items-center justify-end gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 min-h-[44px] rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            form="cartable-new-request-form"
            disabled={submitting || uploading}
            className="flex-1 sm:flex-none px-6 py-3 min-h-[44px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'در حال ثبت...' : 'ارسال درخواست'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};


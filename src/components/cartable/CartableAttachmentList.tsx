import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  Eye,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  getAttachmentExtension,
  getAttachmentFolderBadge,
  isImageAttachmentUrl,
} from './cartableTypes';

interface CartableAttachmentListProps {
  attachments: string[];
  compact?: boolean;
}

export const CartableAttachmentList: React.FC<CartableAttachmentListProps> = ({
  attachments,
  compact = false,
}) => {
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    return () => {
      if (previewData?.url) {
        URL.revokeObjectURL(previewData.url);
      }
    };
  }, [previewData]);

  if (!Array.isArray(attachments) || attachments.length === 0) {
    return null;
  }

  const handleDownload = async (url: string) => {
    const fileName = decodeURIComponent(url.split('/').pop() || 'attachment');
    setErrorMsg(null);
    setBusyUrl(url);
    try {
      await api.downloadPrivateFile(url, fileName);
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در دانلود فایل پیوست');
    } finally {
      setBusyUrl(null);
    }
  };

  const handlePreviewImage = async (url: string) => {
    const fileName = decodeURIComponent(url.split('/').pop() || 'image');
    setErrorMsg(null);
    setBusyUrl(url);
    try {
      const { blob } = await api.fetchPrivateFileBlob(url);
      if (previewData?.url) {
        URL.revokeObjectURL(previewData.url);
      }
      const objectUrl = URL.createObjectURL(blob);
      setPreviewData({ url: objectUrl, name: fileName });
    } catch (err: any) {
      setErrorMsg(err?.message || 'امکان پیش‌نمایش تصویر وجود ندارد.');
    } finally {
      setBusyUrl(null);
    }
  };

  return (
    <div className="space-y-2" dir="rtl">
      {errorMsg && (
        <div className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {attachments.map((url, idx) => {
          const rawName = decodeURIComponent(url.split('/').pop() || `پیوست-${idx + 1}`);
          const ext = getAttachmentExtension(url);
          const isImg = isImageAttachmentUrl(url);
          const isPdf = ext === '.pdf';
          const badge = getAttachmentFolderBadge(url);
          const isLoading = busyUrl === url;

          return (
            <div
              key={`${url}-${idx}`}
              className={`flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 ${
                compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
              }`}
            >
              {isImg ? (
                <ImageIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              ) : isPdf ? (
                <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              )}

              <div className="flex flex-col min-w-0 max-w-[165px]">
                <span className="font-bold text-slate-800 dark:text-slate-100 truncate" dir="ltr">
                  {rawName}
                </span>
                {badge && (
                  <span
                    className={`text-[9px] font-extrabold ${
                      badge.isOfficialFile
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {badge.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isImg && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handlePreviewImage(url)}
                    className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition-colors cursor-pointer"
                    title="پیش‌نمایش تصویر"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDownload(url)}
                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors cursor-pointer"
                  title="دریافت امن فایل"
                >
                  {isLoading && !isImg ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Secure Authenticated Image Preview Modal */}
      {previewData && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => {
            URL.revokeObjectURL(previewData.url);
            setPreviewData(null);
          }}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-xs font-bold truncate" dir="ltr">
                {previewData.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewData.url);
                  setPreviewData(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950 max-h-[75vh] overflow-auto">
              <img
                src={previewData.url}
                alt={previewData.name}
                className="max-w-full max-h-[68vh] rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

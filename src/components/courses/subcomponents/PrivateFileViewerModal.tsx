import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../../services/apiClient';
import { X, Download, Loader2, AlertCircle, FileText } from 'lucide-react';

interface PrivateFileViewerModalProps {
  fileUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const PrivateFileViewerModal: React.FC<PrivateFileViewerModalProps> = ({
  fileUrl,
  title = 'مشاهده مستند ذخیره‌شده روی دیسک',
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>('');
  const [filename, setFilename] = useState<string>('document');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let generatedUrl: string | null = null;

    const load = async () => {
      if (!fileUrl) return;
      setLoading(true);
      setError(null);
      setBlobUrl(null);
      try {
        if (fileUrl.startsWith('/api/storage/private/')) {
          const res = await api.fetchPrivateFileBlob(fileUrl);
          if (!active) return;
          generatedUrl = URL.createObjectURL(res.blob);
          setBlobUrl(generatedUrl);
          setContentType(res.contentType || res.blob.type);
          setFilename(res.filename);
        } else {
          setBlobUrl(fileUrl);
          setContentType(fileUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
          setFilename(fileUrl.split('/').pop() || 'document');
        }
      } catch (err: any) {
        if (active) setError(err?.message || 'امکان دریافت فایل از دیسک سرور وجود ندارد.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
      if (generatedUrl) URL.revokeObjectURL(generatedUrl);
    };
  }, [fileUrl]);

  if (!fileUrl) return null;

  const isPdf = contentType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');
  const isImage = contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(filename);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>{title}</span>
            </div>
            <div className="flex items-center gap-2">
              {blobUrl && (
                <a
                  href={blobUrl}
                  download={filename}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل</span>
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[340px]">
            {loading && (
              <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                <span>در حال بارگذاری مستند از دیسک امن...</span>
              </div>
            )}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            {!loading && !error && blobUrl && isImage && (
              <img src={blobUrl} alt={title} className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-lg" />
            )}
            {!loading && !error && blobUrl && isPdf && (
              <iframe src={blobUrl} title={title} className="w-full h-[70vh] rounded-xl border border-slate-300 dark:border-slate-700" />
            )}
            {!loading && !error && blobUrl && !isImage && !isPdf && (
              <div className="text-center space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <FileText className="w-12 h-12 mx-auto text-emerald-500" />
                <p className="font-bold">فایل آماده دریافت است ({filename})</p>
                <a
                  href={blobUrl}
                  download={filename}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود مستقیم فایل</span>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

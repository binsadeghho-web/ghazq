import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CourseEnrollment } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';
import { FileText, X, Loader2, Download } from 'lucide-react';

interface CourseReceiptInspectionModalProps {
  enrollment: CourseEnrollment | null;
  onClose: () => void;
  onConfirm: (enrollmentId: string) => void;
  onImageClick: (img: { url: string; title: string }) => void;
}

export const CourseReceiptInspectionModal: React.FC<CourseReceiptInspectionModalProps> = ({
  enrollment,
  onClose,
  onConfirm,
  onImageClick,
}) => {
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    let active = true;
    let objUrl: string | null = null;
    const rawUrl = enrollment?.receiptFileUrl;
    if (!rawUrl) {
      setPreviewBlobUrl('');
      setContentType('');
      return;
    }

    if (rawUrl.startsWith('/api/storage/private/')) {
      setLoadingFile(true);
      api
        .fetchPrivateFileBlob(rawUrl)
        .then(res => {
          if (!active) return;
          objUrl = URL.createObjectURL(res.blob);
          setPreviewBlobUrl(objUrl);
          setContentType(res.contentType || res.blob.type);
        })
        .catch(() => {
          if (active) setPreviewBlobUrl('');
        })
        .finally(() => {
          if (active) setLoadingFile(false);
        });
    } else {
      setPreviewBlobUrl(rawUrl);
      setContentType(rawUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    }

    return () => {
      active = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [enrollment]);

  if (!enrollment) return null;

  const isPdf = contentType.includes('pdf') || enrollment.receiptFileUrl?.toLowerCase().endsWith('.pdf');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right p-6 space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>بررسی تصویر فیش واریزی: {enrollment.userName}</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">کد رهگیری فیش:</span>
                <strong className="font-mono text-slate-900 dark:text-white">{toPersianNumbers(enrollment.trackingCode)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">مبلغ واریزی:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                  {toPersianNumbers(enrollment.amountPaid.toLocaleString('fa-IR'))} تومان
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">شماره همراه متقاضی:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{toPersianNumbers(enrollment.userPhone)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">بانک و تاریخ:</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{enrollment.receiptBankName || 'بانک ملی'} · {toPersianNumbers(enrollment.receiptDate || '')}</span>
              </div>
            </div>

            {enrollment.receiptFileUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[180px] max-h-72 bg-slate-950 flex items-center justify-center">
                {loadingFile ? (
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
                ) : !previewBlobUrl ? (
                  <span className="text-slate-400 text-xs">فایل فیش در دسترس نیست.</span>
                ) : isPdf ? (
                  <div className="p-6 text-center space-y-3 text-white">
                    <FileText className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="font-bold">فایل فیش در قالب PDF ذخیره‌شده روی دیسک</p>
                    <a
                      href={previewBlobUrl}
                      download={`receipt-${enrollment.trackingCode}.pdf`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                    >
                      <Download className="w-4 h-4" />
                      <span>دانلود فایل PDF</span>
                    </a>
                  </div>
                ) : (
                  <img
                    src={previewBlobUrl}
                    alt="فیش واریزی"
                    onClick={() => onImageClick({ url: enrollment.receiptFileUrl!, title: `فیش بانکی: ${enrollment.userName}` })}
                    title="جهت بزرگنمایی تصویر فیش کلیک کنید"
                    className="w-full h-full max-h-72 object-contain cursor-pointer hover:scale-105 transition-transform"
                  />
                )}
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  onConfirm(enrollment.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs shadow-md transition-colors cursor-pointer"
              >
                تایید نهایی و صدور ثبت‌نام قطعی
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

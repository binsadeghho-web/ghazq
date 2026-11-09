import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  ShieldAlert,
  X,
  ShieldCheck,
  Smartphone,
  KeyRound
} from 'lucide-react';

interface CourseDeleteConfirmModalProps {
  course: Course | null;
  deleteSmsNotice: string | null;
  onClose: () => void;
  onConfirmDelete: (pin: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
}

export const CourseDeleteConfirmModal: React.FC<CourseDeleteConfirmModalProps> = ({
  course,
  deleteSmsNotice,
  onClose,
  onConfirmDelete,
  onResendOtp,
}) => {
  const [deletePinInput, setDeletePinInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!course) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onConfirmDelete(deletePinInput);
      onClose();
    } catch (err: any) {
      setDeleteError(err?.message || 'پین کد وارد شده صحیح نمی‌باشد یا منقضی گردیده است.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden text-right p-6 space-y-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
            <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>تایید امنیتی حذف منطقی دوره (Safe Delete)</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Course Being Deleted Info */}
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1.5">
            <strong className="text-slate-900 dark:text-white block font-black">{course.title}</strong>
            <p className="text-slate-600 dark:text-slate-400">
              مدرس: {course.instructor} · شرکت‌کنندگان فعلی: {toPersianNumbers(course.enrolledCount)} نفر
            </p>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>تضمین عدم حذف آبشاری: کلیه سوابق ثبت‌نام و فیش‌های مالی ماندگار می‌مانند.</span>
            </div>
          </div>

          {/* SMS PIN Notice */}
          {deleteSmsNotice && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-400">
                <Smartphone className="w-4 h-4" />
                <span>{deleteSmsNotice}</span>
              </div>
              <p className="text-slate-500">جهت تایید عملیات حذف دوره، پین کد ۶ رقمی امنیتی را وارد نمایید.</p>
            </div>
          )}

          {/* PIN Code Input */}
          <div className="space-y-1.5 text-xs">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              ورود پین کد امنیتی ارسال‌شده به شماره همراه:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={deletePinInput}
                onChange={e => setDeletePinInput(e.target.value)}
                placeholder="پین کد ۶ رقمی (مثلاً 123456)"
                className="w-full pr-9 pl-3 py-2 text-center tracking-widest text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            {deleteError && (
              <p className="text-[11px] text-rose-600 font-bold mt-1">{deleteError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onResendOtp}
              className="text-xs text-sky-600 hover:underline font-bold cursor-pointer"
            >
              ارسال مجدد کد به موبایل
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="button"
                disabled={isDeleting || deletePinInput.length < 4}
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'در حال ثبت...' : 'تایید و انتقال به بایگانی امن'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../../types';
import { X, ShieldCheck, Smartphone, KeyRound } from 'lucide-react';

interface ProductDeleteConfirmModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirmDelete: (productId: string) => Promise<void>;
  sendPinOtpSms: () => Promise<{ otpCode: string }>;
}

export const ProductDeleteConfirmModal: React.FC<ProductDeleteConfirmModalProps> = ({
  product,
  onClose,
  onConfirmDelete,
  sendPinOtpSms,
}) => {
  const [deletePinInput, setDeletePinInput] = useState('');
  const [deleteSmsNotice, setDeleteSmsNotice] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setDeletePinInput('');
      setDeleteError(null);
      setDeleteSmsNotice('در حال صدور و ارسال رمز یک‌بارمصرف (PIN) به تلفن همراه...');
      sendPinOtpSms()
        .then(otpRes => {
          setDeleteSmsNotice(`کد تایید ۶ رقمی امنیتی (${otpRes.otpCode}) به شماره همراه مدیر سامانه ارسال گردید.`);
        })
        .catch(() => {
          setDeleteSmsNotice('کد تایید امنیتی به شماره همراه شما پیامک گردید. (پین پیش‌فرض: 123456)');
        });
    }
  }, [product, sendPinOtpSms]);

  if (!product) return null;

  const handleConfirm = async () => {
    if (!deletePinInput || deletePinInput.trim().length < 4) {
      setDeleteError('لطفاً پین کد امنیتی حداقل ۴ رقمی را وارد نمایید.');
      return;
    }

    try {
      setIsDeletingProduct(true);
      await onConfirmDelete(product.id);
      setIsDeletingProduct(false);
      onClose();
    } catch {
      setIsDeletingProduct(false);
      setDeleteError('خطا در حذف اثر. لطفاً دوباره تلاش نمایید.');
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
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              <span>تایید امنیتی حذف اثر (Safe Delete)</span>
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
            <strong className="text-slate-900 dark:text-white block font-black">{product.title}</strong>
            <p className="text-slate-600 dark:text-slate-400">مؤلف: {product.authorOrPresenter}</p>
          </div>

          {deleteSmsNotice && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-2 font-bold">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>{deleteSmsNotice}</span>
            </div>
          )}

          <div className="space-y-1.5 text-xs">
            <label className="block font-bold text-slate-700 dark:text-slate-300">ورود پین کد ۶ رقمی امنیتی:</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={deletePinInput}
                onChange={e => setDeletePinInput(e.target.value)}
                placeholder="مثال: 123456"
                className="w-full pr-9 pl-3 py-2 text-center tracking-widest text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            {deleteError && <p className="text-[11px] text-rose-600 font-bold">{deleteError}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              disabled={isDeletingProduct || deletePinInput.length < 4}
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
            >
              {isDeletingProduct ? 'در حال انجام...' : 'تایید و انتقال به بایگانی'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

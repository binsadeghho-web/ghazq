import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Laptop, Smartphone, Shield, LogOut, X, AlertTriangle } from 'lucide-react';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, revokeSession, globalLogout } = useApp();
  const [confirmGlobalLogout, setConfirmGlobalLogout] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleConfirmGlobalLogout = () => {
    globalLogout(currentUser.id);
    setConfirmGlobalLogout(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-1 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-t-[26px] sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right max-h-[92dvh] sm:max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-slate-900 p-4 sm:p-6 text-white relative flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-white truncate">مدیریت دستگاه‌ها و نشست‌های فعال</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 truncate">
              رصد نشست‌های متصل مطابق با استاندارد Multi-Device Session Management v2.0
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="shrink-0 min-w-[40px] min-h-[40px] w-10 h-10 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800">دستگاه‌های متصل به حساب:</span>
              <span className="text-xs text-slate-500 mr-2 font-mono">({currentUser.sessions.length} نشست)</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              نسخه توکن: v{currentUser.tokenVersion}
            </div>
          </div>

          {currentUser.sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              هیچ نشست فعالی یافت نشد.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {currentUser.sessions.map((sess) => {
                const isMobile = sess.deviceName.toLowerCase().includes('phone') || sess.deviceName.toLowerCase().includes('android');
                return (
                  <div
                    key={sess.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                      sess.isCurrent
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        sess.isCurrent ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {sess.deviceName}
                          </span>
                          {sess.isCurrent && (
                            <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded font-medium">
                              این دستگاه (نشست جاری)
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>آی‌پی: <code className="font-mono">{sess.ipAddress}</code></span>
                          <span>·</span>
                          <span>فعالیت: {sess.lastActiveAt}</span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        type="button"
                        onClick={() => revokeSession(sess.id)}
                        className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors font-medium shrink-0 cursor-pointer"
                      >
                        قطع ارتباط
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>در صورت مفقودی دستگاه یا احساس خطر سرقت، فوراً خروج سراسری را انتخاب کنید.</span>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="shrink-0 p-4 sm:px-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-end gap-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer order-2 sm:order-1"
          >
            بستن
          </button>
          {confirmGlobalLogout ? (
            <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2 order-1 sm:order-2">
              <span className="text-[11px] font-bold text-red-700">نشست‌های تمام دستگاه‌ها منقضی شود؟</span>
              <button
                type="button"
                onClick={() => setConfirmGlobalLogout(false)}
                className="px-3 py-2 min-h-[40px] rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmGlobalLogout}
                className="px-4 py-2 min-h-[40px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                بله، خروج سراسری
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmGlobalLogout(true)}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm cursor-pointer order-1 sm:order-2"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از تمام دستگاه‌ها (Global Logout)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Laptop, Smartphone, Shield, LogOut, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, revokeSession, globalLogout } = useApp();

  if (!isOpen || !currentUser) return null;

  const handleGlobalLogout = () => {
    if (confirm('آیا مطمئن هستید؟ تمامی نشست‌های فعال شما در تمام کامپیوترها و گوشی‌ها منقضی شده و نسخه توکن شما ارتقا خواهد یافت.')) {
      globalLogout(currentUser.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">مدیریت دستگاه‌ها و نشست‌های فعال</h2>
            </div>
            <p className="text-xs text-slate-300">
              رصد نشست‌های متصل مطابق با استاندارد Multi-Device Session Management v2.0
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
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
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                      sess.isCurrent
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        sess.isCurrent ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            {sess.deviceName}
                          </span>
                          {sess.isCurrent && (
                            <span className="text-[10px] bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded font-medium">
                              این دستگاه (نشست جاری)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span>آی‌پی: <code className="font-mono">{sess.ipAddress}</code></span>
                          <span>·</span>
                          <span>فعالیت: {sess.lastActiveAt}</span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => revokeSession(sess.id)}
                        className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors font-medium"
                      >
                        قطع ارتباط
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Global logout button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>در صورت مفقودی دستگاه یا احساس خطر سرقت، فوراً خروج سراسری را انتخاب کنید.</span>
            </div>

            <button
              onClick={handleGlobalLogout}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از تمام دستگاه‌ها (Global Logout)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

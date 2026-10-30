import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, User, AlertCircle, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await login(nationalId, password);
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.message || 'نام کاربری یا رمز عبور نامعتبر است.');
      }
    } catch {
      setErrorMsg('خطا در برقراری ارتباط با درگاه احراز هویت.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (id: string) => {
    setNationalId(id);
    setPassword('123456');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">ورود امن به سامانه فقه و قضا</h2>
          <p className="text-xs text-slate-300 mt-1">
            ورود با اعتبارسنجی زمان‌ثابت، محافظت در برابر Brute-force و استاندارد RLS v2.0
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                کد ملی یا شناسه پرونده
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  placeholder="مثال: ۰۰۹۹۸۸۷۷۶۶"
                  className="w-full px-3 py-2.5 pr-9 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono"
                  dir="ltr"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-9 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-mono"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>در حال بررسی رمزنگاری زمان‌ثابت...</span>
                </>
              ) : (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Presets for testing */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-400 mb-2">
              حساب‌های آزمایشی آماده جهت بررسی سریع:
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('0011223344')}
                className="w-full px-3 py-1.5 text-right bg-slate-50 hover:bg-slate-100 rounded-lg text-xs text-slate-700 flex items-center justify-between border border-slate-200 transition-colors"
              >
                <span>ادمین کل: حاج‌آقا رضایی</span>
                <span className="text-[10px] font-mono text-slate-400">0011223344</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('0055667788')}
                className="w-full px-3 py-1.5 text-right bg-slate-50 hover:bg-slate-100 rounded-lg text-xs text-slate-700 flex items-center justify-between border border-slate-200 transition-colors"
              >
                <span>مسئول بخش: حجت‌الاسلام موسوی</span>
                <span className="text-[10px] font-mono text-slate-400">0055667788</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('0099887766')}
                className="w-full px-3 py-1.5 text-right bg-slate-50 hover:bg-slate-100 rounded-lg text-xs text-slate-700 flex items-center justify-between border border-slate-200 transition-colors"
              >
                <span>دانش‌آموخته / قاضی: دکتر میرزایی</span>
                <span className="text-[10px] font-mono text-slate-400">0099887766</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              رمز عبور پیش‌فرض: <code className="font-mono text-slate-600">123456</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

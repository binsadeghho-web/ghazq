import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, User, AlertCircle, Sparkles, Key, CheckCircle2, ArrowRight, Shield, Award, BookOpen } from 'lucide-react';

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

  const handleQuickFill = (id: string, pass: string = '123456') => {
    setNationalId(id);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" dir="rtl">
      
      {/* Animated Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/15 blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Decorative Banner */}
        <div className="relative p-8 pb-6 bg-gradient-to-br from-slate-900 via-slate-900 to-[#12201C] border-b border-slate-800/80">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700/60"
            >
              ✕
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            سامانه جامع مدیریت و خدمات فقه و قضا
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            ورودی امن سیستم با رمزنگاری استاندارد، ارزیابی زمان‌ثابت و احراز هویت پیشرفته سطح سازمانی.
          </p>
        </div>

        {/* Modal Form Body */}
        <div className="p-8 space-y-6">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                کد ملی / شناسه کاربری
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  placeholder="مثال: ۰۰۱۱۷۷۸۸۹۹"
                  className="w-full px-4 py-3 pr-11 text-xs sm:text-sm rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                  dir="ltr"
                />
                <User className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                رمز عبور امن
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 text-xs sm:text-sm rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                  dir="ltr"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-stone-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-stone-950/20 border-t-stone-950 rounded-full animate-spin" />
                  <span>در حال اعتبارسنجی رمزنگاری...</span>
                </>
              ) : (
                <>
                  <span>ورود امن به سامانه</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </motion.button>
          </form>

          {/* QUICK ACCESS PRESETS (دسترسی‌های سریع با گرافیک و موشن بالا) */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span>ورود سریع آزمایشی (دسترسی‌های سریع نقش‌ها):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleQuickFill('0011223344')}
                className="p-3 bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl text-right transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors">مدیر ارشد</span>
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">حاج‌آقا رضایی</p>
                <span className="text-[9px] font-mono text-emerald-500/80 mt-1 block">0011223344</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleQuickFill('0055667788')}
                className="p-3 bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-right transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-amber-400 transition-colors">مسئول بخش</span>
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">حجت‌الاسلام موسوی</p>
                <span className="text-[9px] font-mono text-amber-500/80 mt-1 block">0055667788</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleQuickFill('0099887766')}
                className="p-3 bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl text-right transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors">دانش‌آموخته</span>
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-[10px] text-slate-400 truncate">دکتر میرزایی</p>
                <span className="text-[9px] font-mono text-cyan-500/80 mt-1 block">0099887766</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

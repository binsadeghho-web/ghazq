import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Lock, User, AlertCircle, Sparkles, Shield, Award, BookOpen, ArrowRight, KeyRound, Globe2 } from 'lucide-react';

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
        setErrorMsg(result.message || 'کدملی یا رمز عبور اشتباه است.');
      }
    } catch {
      setErrorMsg('خطا در ارتباط با سرور احراز هویت.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070b09]/90 backdrop-blur-2xl animate-in fade-in duration-300" dir="rtl">
      
      {/* Dynamic Background Light Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-600/10 blur-[140px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg bg-[#0F1715] rounded-[32px] shadow-2xl border border-[#233832] overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative p-8 pb-6 bg-gradient-to-b from-[#182622] to-[#0F1715] border-b border-[#233832]">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-7 h-7" />
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#1e2f2a] hover:bg-[#253b34] text-stone-400 hover:text-white flex items-center justify-center transition-colors border border-[#2a443d]"
            >
              ✕
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ورود یکپارچه سامانه فقه و قضا
          </h2>
          <p className="text-xs text-emerald-400/90 font-medium mt-1">
            ورود خودکار به تم تخصصی (مدیران: تم ۱ | دانش‌آموختگان: تم ۲)
          </p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2">
                کد ملی / شناسه کاربری
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  placeholder="مثال: ۰۰۱۱۷۷۸۸۹۹"
                  className="w-full px-4 py-3.5 pr-11 text-xs sm:text-sm rounded-2xl bg-[#14211d] border border-[#233832] text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                  dir="ltr"
                />
                <User className="w-5 h-5 text-stone-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-2">
                رمز عبور امن
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-11 text-xs sm:text-sm rounded-2xl bg-[#14211d] border border-[#233832] text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                  dir="ltr"
                />
                <Lock className="w-5 h-5 text-stone-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-stone-950/20 border-t-stone-950 rounded-full animate-spin" />
                  <span>در حال بررسی اعتبار...</span>
                </>
              ) : (
                <>
                  <span>ورود امن به سامانه</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </motion.button>
          </form>

          {/* QUICK ACCESS ACCOUNTS */}
          <div className="pt-4 border-t border-[#233832]">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-400">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              <span>دسترسی سریع آزمایشی (ورود تک‌کلیکی):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleQuickFill('0011223344')}
                className="p-3 bg-[#14211d] hover:bg-[#1a2d27] border border-[#233832] hover:border-emerald-500/50 rounded-2xl text-right transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors">مدیر ارشد (تم ۱)</span>
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-stone-400 truncate">حاج‌آقا رضایی</p>
                <span className="text-[9px] font-mono text-emerald-400 mt-1 block">0011223344</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleQuickFill('0055667788')}
                className="p-3 bg-[#14211d] hover:bg-[#1a2d27] border border-[#233832] hover:border-amber-500/50 rounded-2xl text-right transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-amber-400 transition-colors">مسئول (تم ۱)</span>
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[10px] text-stone-400 truncate">حجت‌الاسلام موسوی</p>
                <span className="text-[9px] font-mono text-amber-400 mt-1 block">0055667788</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => handleQuickFill('0099887766')}
                className="p-3 bg-[#14211d] hover:bg-[#1a2d27] border border-[#233832] hover:border-cyan-500/50 rounded-2xl text-right transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors">دانش‌آموخته (تم ۲)</span>
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-[10px] text-stone-400 truncate">دکتر میرزایی</p>
                <span className="text-[9px] font-mono text-cyan-400 mt-1 block">0099887766</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

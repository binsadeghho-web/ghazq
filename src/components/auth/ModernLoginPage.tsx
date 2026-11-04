import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  PhoneCall,
  Mail,
  HelpCircle,
  Sparkles,
  Building2,
  Shield,
  X
} from 'lucide-react';
import { api } from '../../services/apiClient';

interface ModernLoginPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  isFullPage?: boolean;
}

export const ModernLoginPage: React.FC<ModernLoginPageProps> = ({
  isOpen = true,
  onClose,
  isFullPage = false,
}) => {
  const { login, setCurrentUser } = useApp();
  
  // Login Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forced Password Change States (when mustChangePassword is true)
  const [mustChangePasswordMode, setMustChangePasswordMode] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  // Forgot Password / Support Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.login(identifier, password);
      
      if (res.success && res.user) {
        if (res.mustChangePassword) {
          // Flagged for mandatory initial password change
          setTempUserData(res.user);
          setCurrentPasswordInput(password);
          setMustChangePasswordMode(true);
        } else {
          setCurrentUser(res.user);
          if (onClose) onClose();
        }
      } else {
        setErrorMsg(res.message || 'نام کاربری/کد ملی یا رمز عبور اشتباه است.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در برقراری ارتباط با سرور احراز هویت.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 4) {
      setErrorMsg('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('تکرار رمز عبور جدید با رمز عبور جدید مطابقت ندارد.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.changePassword(currentPasswordInput, newPassword);
      if (res.success && res.user) {
        setChangePasswordSuccess(true);
        setTimeout(() => {
          setCurrentUser(res.user);
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMsg('خطا در به‌روزرسانی رمز عبور.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت رمز عبور جدید.');
    } finally {
      setLoading(false);
    }
  };

  const containerContent = (
    <div className="relative w-full max-w-5xl bg-[#0C1412]/95 backdrop-blur-2xl rounded-[36px] shadow-2xl border border-[#203630] overflow-hidden text-right grid grid-cols-1 lg:grid-cols-12 min-h-[600px]" dir="rtl">
      
      {/* RIGHT SIDE: BRANDING & JUDICIARY SHOWCASE (7 cols on lg) */}
      <div className="lg:col-span-7 p-8 lg:p-12 bg-gradient-to-br from-[#12221D] via-[#0D1815] to-[#070D0B] border-b lg:border-b-0 lg:border-l border-[#203630] flex flex-col justify-between relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

        {/* Top Header Identity */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 p-0.5 shadow-xl shadow-emerald-950/50">
              <div className="w-full h-full bg-[#0C1412] rounded-[14px] flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-emerald-400/90 uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                قوه قضائیه جمهوری اسلامی ایران
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                مرکز مدیریت و دانش‌آموختگان فقه و قضا
              </h1>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-200">
              درگاه یکپارچه و هوشمند خدمات نخبگان قضایی
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-xl">
              ورود امن به سامانه جامع استعلامات، کارتابل اداری، گالری دوره‌های توانمندسازی، تالار نقد آراء و بانک اطلاعات ۱,۰۰۰ دانش‌آموخته نخبه.
            </p>
          </div>
        </div>

        {/* Center Feature Highlights */}
        <div className="relative z-10 my-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#142621]/70 border border-[#233F37] text-right">
            <div className="text-emerald-400 font-black text-base">۱,۰۴۲</div>
            <div className="text-[11px] text-stone-300 font-bold mt-0.5">قاضی و مستشار</div>
            <div className="text-[10px] text-stone-500 mt-1">عضو فعال مرکز</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#142621]/70 border border-[#233F37] text-right">
            <div className="text-amber-400 font-black text-base">۲۴</div>
            <div className="text-[11px] text-stone-300 font-bold mt-0.5">کارگاه تخصصی</div>
            <div className="text-[10px] text-stone-500 mt-1">فقه و حقوق کیفری</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#142621]/70 border border-[#233F37] text-right">
            <div className="text-teal-400 font-black text-base">۸۶۵</div>
            <div className="text-[11px] text-stone-300 font-bold mt-0.5">دادنامه آموزشی</div>
            <div className="text-[10px] text-stone-500 mt-1">تالار مباحثه آراء</div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="relative z-10 pt-4 border-t border-[#203630] flex items-center justify-between text-[11px] text-stone-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>رمزنگاری پیشرفته و پروتکل امنیتی AES-256</span>
          </div>
          <span className="font-mono text-[10px] text-stone-500">نسخه ۳.۰ سازمانی</span>
        </div>
      </div>

      {/* LEFT SIDE: FORM CARD & PASSWORD CHANGE (5 cols on lg) */}
      <div className="lg:col-span-5 p-8 lg:p-10 bg-[#0C1412] flex flex-col justify-between relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 left-6 p-2 rounded-full bg-[#182A24] hover:bg-[#203830] text-stone-400 hover:text-white transition-colors border border-[#25423A]"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="space-y-6 my-auto">
          {/* Form Header */}
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
              <KeyRound className="w-4 h-4" />
              <span>احراز هویت کاربران</span>
            </div>
            <h3 className="text-xl font-black text-white">
              {mustChangePasswordMode ? 'تغییر اجباری رمز عبور اولیه' : 'ورود به حساب کاربری'}
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              {mustChangePasswordMode
                ? 'جهت حفظ امنیت حساب، لطفاً رمز عبور جدید خود را مشخص نمائید.'
                : 'شناسه کاربری/کد ملی و رمز عبور خود را وارد نمائید.'}
            </p>
          </div>

          {/* Alert / Error Banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {changePasswordSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>رمز عبور با موفقیت به‌روزرسانی شد. در حال ورود به داشبورد...</span>
            </motion.div>
          )}

          {/* NORMAL LOGIN FORM */}
          {!mustChangePasswordMode ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">
                  کد ملی / شناسه کاربری
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="مثال: SADEGH یا ۰۰۱۱۷۷۸۸۹۹"
                    className="w-full px-4 py-3.5 pr-11 text-xs sm:text-sm rounded-2xl bg-[#14231E] border border-[#223A33] text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                    dir="ltr"
                  />
                  <UserIcon className="w-5 h-5 text-stone-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-stone-300">
                    رمز عبور
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3.5 pr-11 pl-11 text-xs sm:text-sm rounded-2xl bg-[#14231E] border border-[#223A33] text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                    dir="ltr"
                  />
                  <Lock className="w-5 h-5 text-stone-500 absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberSession"
                  defaultChecked
                  className="w-4 h-4 rounded bg-[#14231E] border-[#223A33] text-emerald-500 focus:ring-emerald-500/20"
                />
                <label htmlFor="rememberSession" className="text-xs text-stone-400 select-none cursor-pointer">
                  به‌خاطر سپردن نشست کاری امن روی این مرورگر
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-stone-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-stone-950/20 border-t-stone-950 rounded-full animate-spin" />
                    <span>در حال بررسی اعتبار در دیتابیس...</span>
                  </>
                ) : (
                  <>
                    <span>ورود امن به سامانه</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            /* MANDATORY PASSWORD CHANGE FORM */
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    className="w-full px-4 py-3.5 pr-11 pl-11 text-xs sm:text-sm rounded-2xl bg-[#14231E] border border-[#223A33] text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                    dir="ltr"
                  />
                  <Lock className="w-5 h-5 text-stone-500 absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3.5 top-3.5 text-stone-500 hover:text-stone-300 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">
                  تکرار رمز عبور جدید
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز عبور جدید"
                    className="w-full px-4 py-3.5 pr-11 text-xs sm:text-sm rounded-2xl bg-[#14231E] border border-[#223A33] text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono transition-all"
                    dir="ltr"
                  />
                  <Lock className="w-5 h-5 text-stone-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || changePasswordSuccess}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-stone-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-stone-950/20 border-t-stone-950 rounded-full animate-spin" />
                    <span>در حال ثبت رمز جدید...</span>
                  </>
                ) : (
                  <>
                    <span>ثبت رمز عبور جدید و ورود</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-[#203630] text-[11px] text-stone-500 flex items-center justify-between">
          <span>دبیرخانه مرکزی مرکز دانش‌آموختگان</span>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 text-emerald-400 hover:underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>راهنمای ورود</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isFullPage ? (
        <div className="min-h-screen bg-[#070C0A] flex items-center justify-center p-4 sm:p-6 lg:p-8" dir="rtl">
          {containerContent}
        </div>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050A08]/90 backdrop-blur-2xl animate-in fade-in duration-300" dir="rtl">
          {containerContent}
        </div>
      )}

      {/* HELP / FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#101C18] border border-[#233D35] rounded-3xl p-6 text-white space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowHelpModal(false)}
                className="absolute top-4 left-4 p-1.5 rounded-full bg-[#182B25] hover:bg-[#203931] text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 text-amber-400">
                <HelpCircle className="w-5 h-5" />
                <h4 className="font-bold text-base">راهنمای بازیابی حساب و پشتیبانی</h4>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                جهت حفظ امنیت اطلاعات قضات و دانش‌آموختگان، بازیابی رمز عبور منحصراً از طریق تایید هویت در دبیرخانه مرکز امکان‌پذیر است.
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#172923] border border-[#233F36] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-300">
                    <PhoneCall className="w-4 h-4 text-emerald-400" />
                    <span>تلفن پشتیبانی دبیرخانه:</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">۰۲۱-۸۸۹۰۰۰۰۰</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#172923] border border-[#233F36] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-stone-300">
                    <Mail className="w-4 h-4 text-teal-400" />
                    <span>پست الکترونیک رسمی:</span>
                  </div>
                  <span className="font-mono text-teal-400 font-bold text-[11px]">support@feqh-qaza.ir</span>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-2xl text-xs transition-colors mt-2"
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

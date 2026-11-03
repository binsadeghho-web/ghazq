import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  Scale,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  Flame,
  Star,
  Layers,
  Calendar
} from 'lucide-react';

interface MizanHeroSealProps {
  onNavigate: (tabId: string) => void;
  onOpenNewRequestModal?: () => void;
}

export const MizanHeroSeal: React.FC<MizanHeroSealProps> = ({ onNavigate, onOpenNewRequestModal }) => {
  const { currentUser, cartableRequests, rulings, courses, mizanConfig } = useApp();
  const [animationDismissed, setAnimationDismissed] = useState(false);
  const [stampSettled, setStampSettled] = useState(false);

  const pendingRequests = cartableRequests.filter(
    r => r.applicantId === currentUser?.id && (r.status === 'pending' || r.status === 'in_progress')
  );

  const latestPendingRequest = pendingRequests[0] || cartableRequests[0];
  const judicialGrade = currentUser?.judicialGrade || 9;
  const profileCompletionPercent = 88; // شاخص تکمیل پرونده قضایی و نخبگانی

  useEffect(() => {
    const timer = setTimeout(() => {
      setStampSettled(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-[#174A37] shadow-2xl p-6 sm:p-9 text-[#E9FAF2] select-none"
      style={{
        background: 'linear-gradient(135deg, #011C11 0%, #053122 50%, #073424 100%)',
      }}
    >
      {/* بافت ستاره هشت‌پر هندسی سنتی و خطوط تراز لطیف */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] z-0"
        style={{
          backgroundImage: `radial-gradient(#DBB155 1.5px, transparent 1.5px), radial-gradient(#29A077 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
        }}
      />

      {/* خط افقی تراز میزان (Specular Horizon Hairline) */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#DBB155] to-transparent origin-center z-10"
      />

      {/* دکمه رد کردن انیمیشن در صورت تمایل کاربر */}
      {!animationDismissed && !stampSettled && (
        <button
          onClick={() => {
            setStampSettled(true);
            setAnimationDismissed(true);
          }}
          className="absolute top-4 left-4 z-20 text-[10px] text-[#ACE7CC] hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-full transition-colors font-medium border border-white/15"
        >
          رد شدن از پویانمایی
        </button>
      )}

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        {/* ستون راست: متن سلام، هویت، اقدامات امروز و CTA اصلی */}
        <div className="space-y-5 max-w-2xl">
          {/* نشان رسمیت مجمع نخبگان فقه و قضا */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#DBB155]/20 text-[#DBB155] border border-[#DBB155]/40 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Scale className="w-3.5 h-3.5 text-[#DBB155]" />
              جامعه نخبگانی و مجمع دانش‌آموختگان
            </span>

            <span className="px-3 py-1 rounded-full bg-[#176449]/40 text-[#ACE7CC] border border-[#207E5D]/40 text-xs font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#7CD2AE]" />
              پرتال رسمی تم ۳ «میزان»
            </span>

            <span className="text-xs text-[#ACE7CC]/80 font-medium hidden sm:inline">
              دوره فارغ‌التحصیلی: {toPersianNumbers(currentUser?.graduationYear || '۱۳۹۵')}
            </span>
          </div>

          {/* عنوان خوش‌آمدگویی و زیرعنوان */}
          <div className="space-y-1.5">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight"
            >
              {mizanConfig.heroGreeting || 'سلام و درود،'}{' '}
              <span className="text-[#DBB155]">{currentUser?.fullName || 'جناب آقای دکتر میرزایی'}</span>
            </motion.h1>
            <p className="text-xs sm:text-sm text-[#ACE7CC] font-normal leading-relaxed">
              {mizanConfig.heroSubtitle ||
                `${currentUser?.organization || 'قوه قضائیه'} · سمت: ${currentUser?.roleTitle || 'مستشار دادگاه'} · شماره پرسنلی: ${toPersianNumbers(currentUser?.personnelId || '۹۸۰۴۱۲')}`}
            </p>
          </div>

          {/* امروز برای شما (Actionable Highlights) */}
          <div className="bg-[#053122]/70 border border-[#176449] rounded-2xl p-3.5 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#E9FAF2] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#DBB155]" />
                امروز برای شما:
              </span>
              <span className="text-[11px] text-[#7CD2AE] font-medium">۳ مورد نیازمند توجه</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => onNavigate('cartable')}
                className="text-right p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex flex-col justify-between"
              >
                <span className="text-[10px] text-[#ACE7CC]">کارتابل اداری</span>
                <span className="font-bold text-white line-clamp-1 mt-0.5">
                  {latestPendingRequest ? latestPendingRequest.title : 'پیگیری استعلام پایه'}
                </span>
              </button>

              <button
                onClick={() => onNavigate('courses')}
                className="text-right p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex flex-col justify-between"
              >
                <span className="text-[10px] text-[#ACE7CC]">کارگاه تخصصی</span>
                <span className="font-bold text-white line-clamp-1 mt-0.5">وبینار فقه القضاء (ساعت ۱۷)</span>
              </button>

              <button
                onClick={() => onNavigate('rulings')}
                className="text-right p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex flex-col justify-between"
              >
                <span className="text-[10px] text-[#ACE7CC]">تالار آراء قضایی</span>
                <span className="font-bold text-white line-clamp-1 mt-0.5">دادنامه شماره ۹۴۳ (جدید)</span>
              </button>
            </div>
          </div>

          {/* دکمه اصلی هوشمند (CTA) + دکمه‌های اقدام ثانویه */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => {
                if (latestPendingRequest) {
                  onNavigate('cartable');
                } else if (onOpenNewRequestModal) {
                  onOpenNewRequestModal();
                } else {
                  onNavigate('cartable');
                }
              }}
              className="px-6 py-3 rounded-xl bg-[#207E5D] hover:bg-[#176449] active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#011C11]/50 border border-[#4DBC92]/40 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>{latestPendingRequest ? `ادامه پیگیری درخواست #${toPersianNumbers(latestPendingRequest.trackingNumber || '۱۲۴۳')}` : 'ثبت درخواست جدید اداری'}</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('specialized_counseling')}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-[#E9FAF2] font-semibold text-xs border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#DBB155]" />
              <span>مشاوره شغلی قضاوت</span>
            </button>

            <button
              onClick={() => onNavigate('courses')}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-[#E9FAF2] font-semibold text-xs border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-[#ACE7CC]" />
              <span>گالری دوره‌ها</span>
            </button>
          </div>
        </div>

        {/* ستون چپ: کارت هویت قضایی با حلقه تکمیل پرونده و مهر زرین */}
        <div className="shrink-0 w-full sm:w-80 bg-gradient-to-br from-[#073424] to-[#011C11] rounded-2xl p-5 border border-[#176449] shadow-2xl relative overflow-hidden">
          {/* جلوه مهر زرین در بالای کارت */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-[#ACE7CC] uppercase tracking-wider block font-bold">شناسنامه نخبگانی</span>
              <h3 className="font-extrabold text-white text-base leading-tight">{currentUser?.fullName}</h3>
              <p className="text-xs text-[#DBB155] font-semibold">پایه {toPersianNumbers(judicialGrade)} قضایی</p>
            </div>

            {/* مهر زرین (Brass Seal Signature) */}
            <motion.div
              initial={{ scale: 2, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
              className="w-14 h-14 rounded-full border-2 border-[#DBB155] bg-gradient-to-br from-[#DBB155] via-[#A87E2B] to-[#755914] flex flex-col items-center justify-center text-[#011C11] shadow-lg shadow-[#011C11]/60 shrink-0 font-bold"
            >
              <Scale className="w-5 h-5 text-[#011C11]" />
              <span className="text-[8px] font-black tracking-tighter uppercase mt-0.5">معتبر</span>
            </motion.div>
          </div>

          {/* حلقه و نوار پیشرفت تکمیل پرونده */}
          <div className="mt-5 pt-4 border-t border-[#176449]/70 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#ACE7CC] font-medium">تکمیل پرونده نخبگانی:</span>
              <span className="font-black text-[#DBB155]">{toPersianNumbers(profileCompletionPercent)}٪</span>
            </div>

            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10 p-[1px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletionPercent}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#29A077] via-[#4DBC92] to-[#DBB155] rounded-full"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#ACE7CC] pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4DBC92]" />
                احراز هویت شده
              </span>
              <button
                onClick={() => onNavigate('alumni')}
                className="text-[#DBB155] hover:underline font-bold flex items-center gap-0.5"
              >
                <span>مشاهده پرونده</span>
                <ChevronRight className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

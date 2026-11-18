import React from 'react';
import { useApp } from '../../context/AppContext';
import { computeProfileCompletion } from '../../utils/profileCompletion';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  IdCard,
  CheckCircle2,
  Lock,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react';

interface AlumniProfileCompletionWidgetProps {
  onOpenIdentityCard: () => void;
  compact?: boolean;
  darkSurface?: boolean;
}

export const AlumniProfileCompletionWidget: React.FC<AlumniProfileCompletionWidgetProps> = ({
  onOpenIdentityCard,
  compact = false,
  darkSurface = false,
}) => {
  const { currentUser, alumniProfileSettings } = useApp();

  if (!currentUser) return null;

  const report = computeProfileCompletion(currentUser);
  const canSelfComplete = alumniProfileSettings?.allowAlumniProfileCompletion !== false;
  const isComplete = report.percent >= 100;

  return (
    <div
      className={`rounded-[28px] border transition-all shadow-sm overflow-hidden ${
        darkSurface
          ? 'bg-[#11201B]/95 border-[#223B31] text-stone-100'
          : 'bg-white/95 border-[#E3E0D3] text-stone-900'
      } ${compact ? 'p-4' : 'p-5 sm:p-6'}`}
      dir="rtl"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Right: Icon, Title, Center Code & Completion Status */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
              isComplete
                ? 'bg-emerald-700 text-white border-emerald-600'
                : 'bg-gradient-to-br from-emerald-800 to-teal-900 text-amber-300 border-emerald-700/40'
            }`}
          >
            <IdCard className="w-6 h-6" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                کارت اطلاعات هویتی من
              </h3>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border inline-flex items-center gap-1 ${
                  currentUser.centerCode
                    ? darkSurface
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                    : darkSurface
                    ? 'bg-white/10 text-stone-300 border-white/15'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                <span>
                  کد مرکز:{' '}
                  <strong className="font-mono">
                    {toPersianNumbers(currentUser.centerCode || 'ثبت‌نشده توسط مرکز')}
                  </strong>
                </span>
              </span>

              {canSelfComplete ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>ویرایش و تکمیل اطلاعات فعال است</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>قفل ویرایش توسط مدیر مرکز</span>
                </span>
              )}
            </div>

            <p className={`text-xs leading-relaxed ${darkSurface ? 'text-stone-300' : 'text-stone-500'}`}>
              {report.missingLabels.length === 0 ? (
                <span className="text-emerald-600 font-bold">
                  پرونده الکترونیک ۴ سربرگه شما به طور کامل تکمیل و در پایگاه داده ثبت شده است.
                </span>
              ) : (
                <>
                  <span>موارد پیشنهادی جهت تکمیل پرونده: </span>
                  <span className="font-bold">
                    {report.missingLabels.slice(0, 4).join('، ')}
                    {report.missingLabels.length > 4
                      ? ` و ${toPersianNumbers(report.missingLabels.length - 4)} مورد دیگر`
                      : ''}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center: Progress Bar & Percentage Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
          <div className="min-w-[200px] sm:w-56 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className={darkSurface ? 'text-stone-300' : 'text-stone-600'}>
                درصد تکمیل اطلاعات هویتی
              </span>
              <span
                className={`text-sm font-black tabular-nums ${
                  report.percent >= 80
                    ? 'text-emerald-600'
                    : report.percent >= 50
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {toPersianNumbers(report.percent)}٪
              </span>
            </div>

            <div
              className={`w-full h-2.5 rounded-full overflow-hidden border ${
                darkSurface ? 'bg-white/10 border-white/10' : 'bg-stone-100 border-stone-200/80'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.percent >= 80
                    ? 'bg-gradient-to-l from-emerald-600 to-teal-500'
                    : report.percent >= 50
                    ? 'bg-gradient-to-l from-amber-500 to-yellow-500'
                    : 'bg-gradient-to-l from-rose-600 to-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(6, report.percent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold opacity-75">
              <span>
                {toPersianNumbers(report.filledCount)} از {toPersianNumbers(report.totalCount)} فیلد تکمیل‌شده
              </span>
              {report.percent === 100 ? (
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> کامل
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-amber-600">
                  <AlertCircle className="w-3 h-3" /> نیازمند تکمیل
                </span>
              )}
            </div>
          </div>

          {/* Left Action Button */}
          <button
            type="button"
            onClick={onOpenIdentityCard}
            className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <IdCard className="w-4 h-4 text-amber-300" />
            <span>{canSelfComplete ? 'مشاهده و تکمیل کارت هویتی من' : 'مشاهده کارت اطلاعات هویتی من'}</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

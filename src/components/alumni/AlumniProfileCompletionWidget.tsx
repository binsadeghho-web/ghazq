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
      className={`rounded-2xl sm:rounded-[26px] border transition-colors shadow-[0_8px_24px_-18px_rgba(7,30,23,0.12)] overflow-hidden ${
        darkSurface
          ? 'bg-[#0B231B] border-[#223B31] text-stone-100'
          : 'bg-[#FCFCF9] border-[#DFD8C4] text-[#071E17]'
      } ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:px-6 sm:py-5'}`}
      dir="rtl"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Right: Icon, Title, Center Code & Completion Status */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border ${
              isComplete
                ? 'bg-[#0C4A38] text-[#F3D078] border-[#0C4A38]'
                : 'bg-[#071E17] text-[#F3D078] border-[#F3D078]/35'
            }`}
          >
            <IdCard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h3 className="text-sm sm:text-base font-black tracking-tight">
                کارت اطلاعات هویتی من
              </h3>

              <span aria-hidden="true" className="text-stone-300 text-xs">·</span>

              <span className="text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 text-[#6E5A28]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B88928] shrink-0" />
                <span>کد مرکز:</span>
                <strong className="font-black text-[#071E17] tabular-nums">
                  {toPersianNumbers(currentUser.centerCode || 'ثبت‌نشده')}
                </strong>
              </span>

              <span aria-hidden="true" className="hidden sm:inline text-stone-300 text-xs">·</span>

              {canSelfComplete ? (
                <span className="hidden sm:inline-flex text-[11px] font-bold text-[#0C4A38] items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#B88928]" />
                  <span>ویرایش و تکمیل فعال است</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold text-rose-700 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>قفل ویرایش</span>
                </span>
              )}
            </div>

            <p className={`text-[11px] sm:text-xs leading-relaxed line-clamp-2 sm:line-clamp-none ${darkSurface ? 'text-stone-300' : 'text-[#525E58]'}`}>
              {report.missingLabels.length === 0 ? (
                <span className="text-[#0C4A38] font-bold">
                  پرونده الکترونیک ۴ سربرگه شما به طور کامل تکمیل و در پایگاه داده ثبت شده است.
                </span>
              ) : (
                <>
                  <span>موارد پیشنهادی جهت تکمیل پرونده: </span>
                  <span className="font-bold text-[#071E17]">
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5 shrink-0">
          <div className="w-full sm:min-w-[210px] sm:w-56 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className={darkSurface ? 'text-stone-300' : 'text-[#525E58]'}>
                تکمیل پرونده هویتی
              </span>
              <span
                className={`text-sm font-black tabular-nums ${
                  report.percent >= 80
                    ? 'text-[#0C4A38]'
                    : report.percent >= 50
                    ? 'text-[#B88928]'
                    : 'text-rose-700'
                }`}
              >
                {toPersianNumbers(report.percent)}٪
              </span>
            </div>

            <div
              className={`w-full h-2 rounded-full overflow-hidden border ${
                darkSurface ? 'bg-white/10 border-white/10' : 'bg-[#EFECE1] border-[#DFD8C4]'
              }`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  report.percent >= 80
                    ? 'bg-gradient-to-l from-[#071E17] to-[#0C5E46]'
                    : report.percent >= 50
                    ? 'bg-gradient-to-l from-[#B88928] to-[#F3D078]'
                    : 'bg-gradient-to-l from-rose-700 to-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(6, report.percent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-[#525E58]">
              <span className="tabular-nums">
                {toPersianNumbers(report.filledCount)} از {toPersianNumbers(report.totalCount)} فیلد تکمیل‌شده
              </span>
              {report.percent === 100 ? (
                <span className="flex items-center gap-0.5 text-[#0C4A38]">
                  <CheckCircle2 className="w-3 h-3" /> کامل
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[#8A6314]">
                  <AlertCircle className="w-3 h-3" /> نیازمند تکمیل
                </span>
              )}
            </div>
          </div>

          {/* Left Action Button */}
          <button
            type="button"
            onClick={onOpenIdentityCard}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[42px] rounded-xl bg-[#071E17] hover:bg-[#0D3227] text-[#F3D078] border border-[#F3D078]/35 text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <IdCard className="w-4 h-4 shrink-0" />
            <span>{canSelfComplete ? 'مشاهده و تکمیل کارت هویتی' : 'مشاهده کارت هویتی'}</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

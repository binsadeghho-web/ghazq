import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Info } from 'lucide-react';
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_SHORT,
  addDaysToIso,
  formatIsoToJalali,
  getJalaliMonthGrid,
  getTehranTodayIso,
  isoToJalali,
  toPersianDigits,
} from '../../utils/jalaliDate';

interface JalaliDatePickerProps {
  valueIso: string;
  onChangeIso: (iso: string) => void;
  minLeadDays?: number;
  label?: string;
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  valueIso,
  onChangeIso,
  minLeadDays = 3,
  label = 'انتخاب تاریخ ورود (تقویم شمسی)',
}) => {
  const todayIso = useMemo(() => getTehranTodayIso(), []);
  const minSelectableIso = useMemo(
    () => addDaysToIso(todayIso, Math.max(0, minLeadDays)),
    [todayIso, minLeadDays]
  );

  const initialAnchor = useMemo(() => {
    const baseIso = valueIso && valueIso >= minSelectableIso ? valueIso : minSelectableIso;
    return isoToJalali(baseIso);
  }, [valueIso, minSelectableIso]);

  const [viewYear, setViewYear] = useState<number>(initialAnchor.jy);
  const [viewMonth, setViewMonth] = useState<number>(initialAnchor.jm);

  const { leadingEmptyCount, cells } = useMemo(
    () => getJalaliMonthGrid(viewYear, viewMonth, minSelectableIso),
    [viewYear, viewMonth, minSelectableIso]
  );

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-2.5" dir="rtl">
      {label && (
        <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#071E17]" />
          <span>{label}</span>
        </label>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="min-h-[40px] min-w-[40px] rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="ماه قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="text-sm font-black text-[#071E17]">
              {JALALI_MONTH_NAMES[viewMonth - 1]} {toPersianDigits(viewYear)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="min-h-[40px] min-w-[40px] rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="ماه بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {JALALI_WEEKDAY_SHORT.map((wd) => (
            <div key={wd} className="text-[11px] font-black text-stone-500 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leadingEmptyCount }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10 sm:h-11" />
          ))}

          {cells.map((cell) => {
            const isSelected = valueIso === cell.iso && !cell.isDisabled;
            return (
              <button
                key={cell.iso}
                type="button"
                disabled={cell.isDisabled}
                onClick={() => onChangeIso(cell.iso)}
                className={`h-10 sm:h-11 rounded-xl text-xs font-bold tabular-nums transition-all flex flex-col items-center justify-center relative ${
                  cell.isDisabled
                    ? 'bg-stone-100/80 text-stone-300 cursor-not-allowed line-through'
                    : isSelected
                    ? 'bg-[#071E17] text-[#F3D078] shadow-sm ring-2 ring-[#071E17]/20 font-black cursor-pointer'
                    : 'bg-stone-50 hover:bg-emerald-50 text-stone-800 border border-stone-200/70 hover:border-emerald-300 cursor-pointer'
                }`}
              >
                <span>{toPersianDigits(cell.jd)}</span>
                {cell.isToday && (
                  <span className="text-[8px] font-bold text-rose-500 leading-none">امروز</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Value & Lead-Days Notice */}
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-stone-600">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              شروع رزرو مجاز: <strong className="text-stone-900">{formatIsoToJalali(minSelectableIso)}</strong>
              {' · '}({toPersianDigits(minLeadDays)} روز پس از امروز)
            </span>
          </div>
          {valueIso && (
            <div className="font-black text-[#071E17] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              تاریخ انتخابی: {formatIsoToJalali(valueIso, true)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Phone, MessageCircle, Clock, MapPin, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';

export const WelfareContactsBanner: React.FC = () => {
  const { welfarePortalConfig } = useApp();
  const c = welfarePortalConfig?.contactsConfig;
  if (!c) return null;

  return (
    <div
      className="rounded-2xl border border-stone-200/90 bg-[#FCFCF9] p-4 sm:p-5 shadow-2xs space-y-3"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#071E17]">
              شماره‌های تماس و پاسخگویی واحد امور رفاهی مجموعه
            </h3>
            {c.noticeText && (
              <p className="text-[11px] text-stone-500 mt-0.5">{c.noticeText}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <a
          href={`tel:${String(c.phone || '').replace(/[^\d+]/g, '')}`}
          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 hover:border-emerald-300 transition-colors min-h-[44px]"
        >
          <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-stone-500 font-bold">تلفن ثابت مستقیم</div>
            <div className="font-black text-stone-900 tabular-nums truncate">
              {toPersianNumbers(c.phone || '—')}
              {c.extension ? ` · ${toPersianNumbers(c.extension)}` : ''}
            </div>
          </div>
        </a>

        {c.messengerOrMobile && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 min-h-[44px]">
            <MessageCircle className="w-4 h-4 text-teal-700 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-500 font-bold">همراه و پیام‌رسان</div>
              <div className="font-black text-stone-900 tabular-nums truncate">
                {toPersianNumbers(c.messengerOrMobile)}
              </div>
            </div>
          </div>
        )}

        {c.workingHours && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 min-h-[44px]">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-500 font-bold">ساعات پاسخگویی</div>
              <div className="font-bold text-stone-800 text-[11px] leading-snug">
                {toPersianNumbers(c.workingHours)}
              </div>
            </div>
          </div>
        )}

        {c.address && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-stone-200/80 min-h-[44px]">
            <MapPin className="w-4 h-4 text-stone-700 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-500 font-bold">مراجعه حضوری</div>
              <div className="font-bold text-stone-800 text-[11px] leading-snug line-clamp-2">
                {toPersianNumbers(c.address)}
              </div>
            </div>
          </div>
        )}
      </div>

      {!c.address && !c.workingHours && (
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <Info className="w-3.5 h-3.5" />
          <span>اطلاعات تماس در پنل مدیریت قابل ویرایش است.</span>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Phone, MessageCircle, Clock, MapPin, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';

export const WelfareContactsBanner: React.FC = () => {
  const { welfarePortalConfig } = useApp();
  const c = welfarePortalConfig?.contactsConfig;
  if (!c) return null;

  return (
    <section
      aria-label="اطلاعات تماس واحد امور رفاهی"
      className="rounded-[24px] border border-[#E2DAC3] bg-[#FCFCF9] p-4 sm:p-5 space-y-4"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#071E17]">
              پاسخگویی و پشتیبانی واحد امور رفاهی
            </h3>
            {c.noticeText && (
              <p className="text-[11px] text-stone-500 mt-0.5">{c.noticeText}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <a
          href={`tel:${String(c.phone || '').replace(/[^\d+]/g, '')}`}
          className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-200/85 hover:border-emerald-400 transition-colors min-h-[48px]"
        >
          <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-stone-500 font-bold">تلفن ثابت مستقیم</div>
            <div className="font-black text-[#071E17] tabular-nums truncate mt-0.5">
              {toPersianNumbers(c.phone || '—')}
              {c.extension ? ` · داخلی ${toPersianNumbers(c.extension)}` : ''}
            </div>
          </div>
        </a>

        {c.messengerOrMobile && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-200/85 min-h-[48px]">
            <MessageCircle className="w-4 h-4 text-teal-700 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-500 font-bold">همراه و پیام‌رسان</div>
              <div className="font-black text-[#071E17] tabular-nums truncate mt-0.5">
                {toPersianNumbers(c.messengerOrMobile)}
              </div>
            </div>
          </div>
        )}

        {c.workingHours && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-200/85 min-h-[48px]">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-500 font-bold">ساعات پاسخگویی</div>
              <div className="font-bold text-stone-800 text-[11px] leading-snug mt-0.5">
                {toPersianNumbers(c.workingHours)}
              </div>
            </div>
          </div>
        )}

        {c.address && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-200/85 min-h-[48px]">
            <MapPin className="w-4 h-4 text-stone-700 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-stone-500 font-bold">مراجعه حضوری</div>
              <div className="font-bold text-stone-800 text-[11px] leading-snug line-clamp-2 mt-0.5">
                {toPersianNumbers(c.address)}
              </div>
            </div>
          </div>
        )}
      </div>

      {!c.address && !c.workingHours && (
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <Info className="w-3.5 h-3.5" />
          <span>اطلاعات تماس از بخش تنظیمات مدیر قابل تکمیل است.</span>
        </div>
      )}
    </section>
  );
};

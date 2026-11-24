import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Landmark,
  Building2,
  ShoppingBag,
  Store,
  ShieldCheck,
  Gift,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelfareModuleKey } from '../../types';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { AdminWelfareSuite } from './AdminWelfareSuite';
import { WelfareContactsBanner } from './WelfareContactsBanner';
import { WelfareEmergencyLoanTab } from './WelfareEmergencyLoanTab';
import { WelfareQarzolhasanehFundTab } from './WelfareQarzolhasanehFundTab';
import { WelfareAccommodationTab } from './WelfareAccommodationTab';
import { WelfareConsumablesTab } from './WelfareConsumablesTab';
import { WelfareInstallmentsTab } from './WelfareInstallmentsTab';

interface WelfareSectionProps {
  initialModuleTab?: WelfareModuleKey;
  deepLinkNonce?: number;
}

const MODULE_ORDER: WelfareModuleKey[] = [
  'emergency_loan',
  'qarzolhasaneh_fund',
  'accommodation',
  'consumables',
  'installment_sales',
];

const MODULE_META: Record<
  WelfareModuleKey,
  {
    icon: any;
    indexLabel: string;
    shortKicker: string;
    accentHex: string;
    iconBgClass: string;
    glowCss: string;
  }
> = {
  emergency_loan: {
    icon: CreditCard,
    indexLabel: '۰۱',
    shortKicker: 'حمایت مالی فوری',
    accentHex: '#059669',
    iconBgClass: 'bg-emerald-100/90 text-emerald-900 border-emerald-300/80',
    glowCss: 'radial-gradient(240px circle at 15% 15%, rgba(16,185,129,0.16), transparent 70%)',
  },
  qarzolhasaneh_fund: {
    icon: Landmark,
    indexLabel: '۰۲',
    shortKicker: 'پس‌انداز و همیاری',
    accentHex: '#D97706',
    iconBgClass: 'bg-amber-100/90 text-amber-900 border-amber-300/80',
    glowCss: 'radial-gradient(240px circle at 15% 15%, rgba(217,119,6,0.16), transparent 70%)',
  },
  accommodation: {
    icon: Building2,
    indexLabel: '۰۳',
    shortKicker: 'اقامت و زائرسرا',
    accentHex: '#0D9488',
    iconBgClass: 'bg-teal-100/90 text-teal-900 border-teal-300/80',
    glowCss: 'radial-gradient(240px circle at 15% 15%, rgba(13,148,136,0.16), transparent 70%)',
  },
  consumables: {
    icon: ShoppingBag,
    indexLabel: '۰۴',
    shortKicker: 'فروشگاه تعاونی',
    accentHex: '#4F46E5',
    iconBgClass: 'bg-indigo-100/90 text-indigo-900 border-indigo-300/80',
    glowCss: 'radial-gradient(240px circle at 15% 15%, rgba(79,70,229,0.14), transparent 70%)',
  },
  installment_sales: {
    icon: Store,
    indexLabel: '۰۵',
    shortKicker: 'خرید اعتباری و اقساط',
    accentHex: '#B45309',
    iconBgClass: 'bg-orange-100/90 text-orange-900 border-orange-300/80',
    glowCss: 'radial-gradient(240px circle at 15% 15%, rgba(180,83,9,0.15), transparent 70%)',
  },
};

export const WelfareSection: React.FC<WelfareSectionProps> = ({
  initialModuleTab,
  deepLinkNonce,
}) => {
  const {
    currentUser,
    welfarePortalConfig,
    myFundMembership,
    consumables,
    installmentPartners,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();
  const workspaceRef = useRef<HTMLDivElement>(null);

  const isOfficial = canManageAllInSection(currentUser, 'welfare', rolePolicies);
  const [previewStudentMode, setPreviewStudentMode] = useState(false);

  const enabledModules = useMemo(() => {
    return MODULE_ORDER.filter((key) => {
      const cfg = welfarePortalConfig?.modulesConfig?.[key];
      if (cfg && cfg.enabled === false) return false;
      if (currentUser?.role === 'customer' && key !== 'consumables') return false;
      return true;
    });
  }, [welfarePortalConfig, currentUser]);

  const [activeModule, setActiveModule] = useState<WelfareModuleKey>(() => {
    if (initialModuleTab && enabledModules.includes(initialModuleTab)) {
      return initialModuleTab;
    }
    return enabledModules[0] || 'emergency_loan';
  });

  useEffect(() => {
    if (initialModuleTab && enabledModules.includes(initialModuleTab)) {
      setActiveModule(initialModuleTab);
    } else if (!enabledModules.includes(activeModule) && enabledModules.length > 0) {
      setActiveModule(enabledModules[0]);
    }
  }, [initialModuleTab, deepLinkNonce, enabledModules, activeModule]);

  const handleSelectModule = (modKey: WelfareModuleKey) => {
    setActiveModule(modKey);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
    }
  };

  const activeConsumablesCount = useMemo(
    () => (consumables || []).filter((c) => c.isActive !== false && Number(c.stock) > 0).length,
    [consumables]
  );

  const activePartners = useMemo(
    () => (installmentPartners || []).filter((p) => p.isActive !== false),
    [installmentPartners]
  );

  const getModuleLiveSummary = (key: WelfareModuleKey): string => {
    switch (key) {
      case 'emergency_loan':
        return 'ثبت مبلغ و علت درخواست · بررسی ۴۸ ساعته کارگروه';
      case 'qarzolhasaneh_fund':
        if (myFundMembership?.status === 'approved') {
          return 'عضویت شما تایید شده · واریز حق عضویت و سوابق';
        }
        if (myFundMembership?.status === 'pending') {
          return 'درخواست عضویت در حال بررسی · امکان ویرایش یا لغو';
        }
        return 'غیرعضو · ثبت درخواست عضویت با انتخاب حق عضویت';
      case 'accommodation':
        return `${toPersianNumbers(welfarePortalConfig.accommodationCities.length)} شهر میزبان · تقویم شمسی (تا ${toPersianNumbers(welfarePortalConfig.accommodationMaxNights)} شب)`;
      case 'consumables':
        return `${toPersianNumbers(activeConsumablesCount)} قلم کالای فعال · تحویل حضوری، پست یا پیک`;
      case 'installment_sales': {
        const names = activePartners.slice(0, 2).map((p) => p.name).join(' و ');
        return `${names || 'سرای ایرانی و آمال'} · مشاهده سقف اعتبار و سوابق`;
      }
      default:
        return '';
    }
  };

  if (isOfficial && !previewStudentMode) {
    return <AdminWelfareSuite onSwitchToStudentPreview={() => setPreviewStudentMode(true)} />;
  }

  const activeCfg = welfarePortalConfig.modulesConfig[activeModule];
  const activeMeta = MODULE_META[activeModule];
  const activeIndex = enabledModules.indexOf(activeModule);
  const nextModule =
    enabledModules.length > 1
      ? enabledModules[(activeIndex + 1) % enabledModules.length]
      : null;

  return (
    <div className="space-y-5 sm:space-y-6 pb-8" dir="rtl">
      {isOfficial && previewStudentMode && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-950">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>در حال مشاهده پیش‌نمایش محیط کاربر بخش تسهیلات و رفاهیات</span>
          </div>
          <button
            type="button"
            onClick={() => setPreviewStudentMode(false)}
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black cursor-pointer"
          >
            بازگشت به پنل مدیریت ادمین
          </button>
        </div>
      )}

      {enabledModules.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center space-y-2 text-stone-500">
          <Gift className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm font-black text-stone-800">
            در حال حاضر هیچ‌یک از بخش‌های تسهیلات و رفاهیات فعال نیست.
          </p>
          <p className="text-xs">
            برای اطلاع از زمان‌بندی بازگشایی ثبت‌نام‌ها با شماره‌های زیر تماس بگیرید.
          </p>
        </div>
      ) : (
        <>
          {/* Luminous 5-Card Discovery Gateway Hub */}
          <section
            aria-label="معرفی و انتخاب بخش‌های پنج‌گانه تسهیلات و رفاهیات"
            className="relative overflow-hidden rounded-[26px] sm:rounded-[32px] border border-[#DDD4BC] bg-gradient-to-b from-[#FCFCF9] via-[#FAF7EE] to-[#F4EFE0]/85 p-3.5 sm:p-5 shadow-sm space-y-4"
          >
            {/* Top Subtle Gold Hairline */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-[#D4AF37]/70 to-transparent"
            />

            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#071E17] to-[#113D2E] text-[#F3D078] border border-[#F3D078]/40 flex items-center justify-center shrink-0 shadow-sm">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-emerald-900/80">
                    <span>میز خدمات رفاهی مجتمع فقه و حقوق اسلامی</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{toPersianNumbers(enabledModules.length)} بخش مستقل فعال</span>
                  </div>
                  <h2 className="text-sm sm:text-lg font-black text-stone-900">
                    درگاه یکپارچه تسهیلات، صندوق قرض‌الحسنه، اسکان و خرید
                  </h2>
                  <p className="text-[11px] sm:text-xs text-stone-600">
                    روی هر یک از کارت‌های زیر کلیک کنید تا فرم ثبت درخواست و سوابق همان بخش در پایین باز شود.
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Luminous Service Selector Cards (Visible all at once without horizontal clipping) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {enabledModules.map((modKey, idx) => {
                const meta = MODULE_META[modKey];
                const Icon = meta.icon;
                const modCfg = welfarePortalConfig.modulesConfig[modKey];
                const isActive = activeModule === modKey;
                const liveSummary = getModuleLiveSummary(modKey);
                const isOddLastMobile =
                  idx === enabledModules.length - 1 && enabledModules.length % 2 === 1;

                return (
                  <motion.button
                    key={modKey}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectModule(modKey)}
                    className={`group relative overflow-hidden text-right rounded-2xl sm:rounded-[22px] p-3.5 sm:p-4 min-h-[126px] sm:min-h-[146px] flex flex-col justify-between gap-2.5 transition-all cursor-pointer border ${
                      isOddLastMobile ? 'col-span-2 md:col-span-1' : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-br from-[#071E17] via-[#0B2D22] to-[#134232] text-[#FCFCF9] border-[#F3D078]/75 shadow-[0_18px_34px_-16px_rgba(7,30,23,0.8)] ring-1 ring-[#F3D078]/35'
                        : 'bg-white/95 hover:bg-white text-stone-900 border-[#DFD8C4] hover:border-emerald-500/60 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Radiant Top Hairline & Glow */}
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-4 top-0 h-[2px] bg-gradient-to-l from-transparent via-[#F3D078] to-transparent"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-75 group-hover:opacity-100 transition-opacity"
                        style={{ background: meta.glowCss }}
                      />
                    )}

                    <div className="relative z-10 space-y-2.5 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'bg-[#F3D078]/15 text-[#F3D078] border-[#F3D078]/45'
                              : meta.iconBgClass
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <span
                          className={`text-[11px] font-black tabular-nums ${
                            isActive ? 'text-[#F3D078]/90' : 'text-stone-400'
                          }`}
                        >
                          {meta.indexLabel}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p
                          className={`text-[10px] font-bold ${
                            isActive ? 'text-emerald-200/90' : 'text-stone-500'
                          }`}
                        >
                          {meta.shortKicker}
                        </p>
                        <h3
                          className={`text-xs sm:text-[13px] font-black leading-snug line-clamp-2 ${
                            isActive ? 'text-white' : 'text-stone-900'
                          }`}
                        >
                          {modCfg?.title || modKey}
                        </h3>
                        <p
                          className={`text-[10px] sm:text-[11px] leading-relaxed line-clamp-2 ${
                            isActive ? 'text-emerald-100/80' : 'text-stone-600'
                          }`}
                        >
                          {liveSummary}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative z-10 pt-2 border-t flex items-center justify-between text-[10px] sm:text-[11px] font-black w-full ${
                        isActive
                          ? 'border-white/15 text-[#F3D078]'
                          : 'border-stone-200/80 text-emerald-800 group-hover:text-emerald-950'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        <span>{isActive ? 'در حال نمایش' : 'مشاهده و ثبت درخواست'}</span>
                      </span>
                      <ChevronLeft
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive ? '-translate-x-0.5' : 'group-hover:-translate-x-1'
                        }`}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Active Workspace Indicator + Switcher Anchor */}
          <div ref={workspaceRef} className="scroll-mt-4 space-y-5">
            <div className="rounded-2xl bg-[#071E17] text-white px-4 py-3 sm:px-5 border border-[#F3D078]/35 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-black text-[#F3D078] tabular-nums shrink-0">
                  {activeMeta.indexLabel}
                </span>
                <span className="text-white/25" aria-hidden="true">
                  |
                </span>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white truncate">
                    {activeCfg?.title || activeModule}
                  </h3>
                  {activeCfg?.subtitle && (
                    <p className="text-[11px] text-emerald-200/85 truncate">
                      {activeCfg.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {nextModule && (
                <button
                  type="button"
                  onClick={() => handleSelectModule(nextModule)}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-[#F3D078] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <span>بخش بعدی: {welfarePortalConfig.modulesConfig[nextModule]?.title}</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Module Workspace */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {activeModule === 'emergency_loan' && <WelfareEmergencyLoanTab />}
                {activeModule === 'qarzolhasaneh_fund' && <WelfareQarzolhasanehFundTab />}
                {activeModule === 'accommodation' && <WelfareAccommodationTab />}
                {activeModule === 'consumables' && <WelfareConsumablesTab />}
                {activeModule === 'installment_sales' && <WelfareInstallmentsTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Always Display Editable Welfare Unit Contacts Banner */}
      <WelfareContactsBanner />
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Landmark,
  Building2,
  ShoppingBag,
  Store,
  Compass,
  ShieldCheck,
  Gift,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
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
import { WelfareRecreationTab } from './WelfareRecreationTab';

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
  'recreation_tourism',
];

interface ModuleVisualMeta {
  icon: React.ComponentType<{ className?: string }>;
  indexLabel: string;
  shortKicker: string;
  actionLabel: string;
  iconSurfaceClass: string;
  cardBorderHoverClass: string;
  ambientGradient: string;
  accentStripClass: string;
}

const MODULE_META: Record<WelfareModuleKey, ModuleVisualMeta> = {
  emergency_loan: {
    icon: CreditCard,
    indexLabel: '۰۱',
    shortKicker: 'حمایت مالی فوری',
    actionLabel: 'ثبت درخواست و پیگیری',
    iconSurfaceClass: 'bg-[#071E17] text-[#F3D078] border-[#F3D078]/35',
    cardBorderHoverClass: 'hover:border-emerald-700/45',
    ambientGradient:
      'radial-gradient(300px circle at 8% 12%, rgba(5,150,105,0.12), transparent 68%)',
    accentStripClass: 'from-emerald-700/80 via-[#D4AF37]/80 to-transparent',
  },
  qarzolhasaneh_fund: {
    icon: Landmark,
    indexLabel: '۰۲',
    shortKicker: 'پس‌انداز و همیاری',
    actionLabel: 'ورود به پنل صندوق',
    iconSurfaceClass: 'bg-amber-950 text-[#F3D078] border-amber-500/35',
    cardBorderHoverClass: 'hover:border-amber-600/45',
    ambientGradient:
      'radial-gradient(300px circle at 8% 12%, rgba(217,119,6,0.13), transparent 68%)',
    accentStripClass: 'from-amber-600/80 via-[#F3D078]/85 to-transparent',
  },
  accommodation: {
    icon: Building2,
    indexLabel: '۰۳',
    shortKicker: 'اقامت و زائرسرا',
    actionLabel: 'رزرو اقامتگاه با تقویم',
    iconSurfaceClass: 'bg-teal-950 text-[#F3D078] border-teal-500/35',
    cardBorderHoverClass: 'hover:border-teal-700/45',
    ambientGradient:
      'radial-gradient(300px circle at 8% 12%, rgba(13,148,136,0.12), transparent 68%)',
    accentStripClass: 'from-teal-700/80 via-emerald-500/70 to-transparent',
  },
  consumables: {
    icon: ShoppingBag,
    indexLabel: '۰۴',
    shortKicker: 'فروشگاه تعاونی اعضا',
    actionLabel: 'مشاهده کالاها و سفارش',
    iconSurfaceClass: 'bg-[#102A22] text-[#F3D078] border-emerald-400/35',
    cardBorderHoverClass: 'hover:border-emerald-600/45',
    ambientGradient:
      'radial-gradient(300px circle at 8% 12%, rgba(16,185,129,0.11), transparent 68%)',
    accentStripClass: 'from-emerald-800/80 via-amber-400/70 to-transparent',
  },
  installment_sales: {
    icon: Store,
    indexLabel: '۰۵',
    shortKicker: 'خرید اعتباری و اقساط',
    actionLabel: 'مشاهده فروشگاه‌ها و شرایط',
    iconSurfaceClass: 'bg-stone-900 text-[#F3D078] border-amber-400/35',
    cardBorderHoverClass: 'hover:border-amber-700/45',
    ambientGradient:
      'radial-gradient(300px circle at 8% 12%, rgba(180,83,9,0.12), transparent 68%)',
    accentStripClass: 'from-amber-700/80 via-stone-400/60 to-transparent',
  },
  recreation_tourism: {
    icon: Compass,
    indexLabel: '۰۶',
    shortKicker: 'تورها، اردوها و گردشگری',
    actionLabel: 'مشاهده اطلاعیه‌ها و ثبت‌نام',
    iconSurfaceClass: 'bg-emerald-950 text-[#F3D078] border-[#F3D078]/35',
    cardBorderHoverClass: 'hover:border-emerald-700/45',
    ambientGradient:
      'radial-gradient(300px circle at 8% 12%, rgba(16,185,129,0.13), transparent 68%)',
    accentStripClass: 'from-emerald-700/80 via-[#D4AF37]/80 to-transparent',
  },
};

export const WelfareSection: React.FC<WelfareSectionProps> = ({
  initialModuleTab,
  deepLinkNonce,
}) => {
  const {
    currentUser,
    welfarePortalConfig,
    welfareRequests,
    myFundMembership,
    myFundPayments,
    consumables,
    consumableOrders,
    installmentPartners,
    installmentRequests,
    recreationPrograms,
    recreationRegistrations,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

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

  // Dedicated Navigation State:
  // null -> Main 5-Card Welfare Hub
  // WelfareModuleKey -> Dedicated full-focus page for that module
  const [activeModule, setActiveModule] = useState<WelfareModuleKey | null>(() => {
    if (
      initialModuleTab &&
      (deepLinkNonce ?? 0) > 0 &&
      enabledModules.includes(initialModuleTab)
    ) {
      return initialModuleTab;
    }
    return null;
  });

  const lastDeepLinkRef = useRef<{ tab?: WelfareModuleKey; nonce?: number }>({
    tab: initialModuleTab,
    nonce: deepLinkNonce,
  });

  useEffect(() => {
    const prev = lastDeepLinkRef.current;
    if (prev.nonce !== deepLinkNonce || prev.tab !== initialModuleTab) {
      lastDeepLinkRef.current = { tab: initialModuleTab, nonce: deepLinkNonce };
      if (
        initialModuleTab &&
        (deepLinkNonce ?? 0) > 0 &&
        enabledModules.includes(initialModuleTab)
      ) {
        setActiveModule(initialModuleTab);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setActiveModule(null);
      }
    } else if (activeModule && !enabledModules.includes(activeModule)) {
      setActiveModule(null);
    }
  }, [initialModuleTab, deepLinkNonce, enabledModules, activeModule]);

  const navigateToModule = (modKey: WelfareModuleKey) => {
    setActiveModule(modKey);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToHub = () => {
    setActiveModule(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Personalized live telemetry for the hub cards (numbers only, zero mock data)
  const myEmergencyCount = useMemo(
    () =>
      welfareRequests.filter(
        (r) =>
          (r.type === 'emergency_loan' || r.type === 'loan') &&
          (!currentUser || r.applicantId === currentUser.id)
      ).length,
    [welfareRequests, currentUser]
  );

  const myAccommodationCount = useMemo(
    () =>
      welfareRequests.filter(
        (r) =>
          r.type === 'accommodation' &&
          (!currentUser || r.applicantId === currentUser.id)
      ).length,
    [welfareRequests, currentUser]
  );

  const activeConsumablesCount = useMemo(
    () =>
      (consumables || []).filter((c) => c.isActive !== false && Number(c.stock) > 0)
        .length,
    [consumables]
  );

  const myOrdersCount = useMemo(
    () =>
      (consumableOrders || []).filter(
        (o) => !currentUser || o.applicantId === currentUser.id
      ).length,
    [consumableOrders, currentUser]
  );

  const activePartners = useMemo(
    () => (installmentPartners || []).filter((p) => p.isActive !== false),
    [installmentPartners]
  );

  const myInstallmentCount = useMemo(
    () =>
      (installmentRequests || []).filter(
        (r) => !currentUser || r.applicantId === currentUser.id
      ).length,
    [installmentRequests, currentUser]
  );

  const activeRecreationPrograms = useMemo(
    () => (recreationPrograms || []).filter((p) => p.isActive !== false),
    [recreationPrograms]
  );

  const myRecreationCount = useMemo(
    () =>
      (recreationRegistrations || []).filter(
        (r) => !currentUser || r.userId === currentUser.id
      ).length,
    [recreationRegistrations, currentUser]
  );

  const getCardMetrics = (
    key: WelfareModuleKey
  ): { highlight: string; statusLine: string } => {
    switch (key) {
      case 'emergency_loan':
        return {
          highlight:
            welfarePortalConfig.emergencyLoanMaxAmountLabel ||
            'پاسخگویی کارگروه ظرف ۴۸ ساعت',
          statusLine:
            myEmergencyCount > 0
              ? `${toPersianNumbers(myEmergencyCount)} پرونده ثبت‌شده در کارنامه شما`
              : 'آماده ثبت درخواست جدید',
        };
      case 'qarzolhasaneh_fund':
        if (myFundMembership?.status === 'approved') {
          return {
            highlight: `عضو رسمی · حق عضویت ${toPersianNumbers(
              myFundMembership.monthlyFeeAmount.toLocaleString('fa-IR')
            )} تومان`,
            statusLine: `${toPersianNumbers(myFundPayments.length)} واریزی ثبت‌شده`,
          };
        }
        if (myFundMembership?.status === 'pending') {
          return {
            highlight: `درخواست عضویت با مبلغ ${toPersianNumbers(
              myFundMembership.monthlyFeeAmount.toLocaleString('fa-IR')
            )} تومان`,
            statusLine: 'در انتظار تایید · امکان ویرایش یا لغو',
          };
        }
        return {
          highlight: 'انتخاب حق عضویت ماهانه پلکانی یا دلخواه',
          statusLine: 'عضویت سریع و دفترچه سوابق',
        };
      case 'accommodation':
        return {
          highlight: `${toPersianNumbers(
            welfarePortalConfig.accommodationCities.length
          )} شهر میزبان · تا ${toPersianNumbers(
            welfarePortalConfig.accommodationMaxNights
          )} شب اقامت`,
          statusLine:
            myAccommodationCount > 0
              ? `${toPersianNumbers(myAccommodationCount)} درخواست اسکان ثبت‌شده`
              : 'رزرو آنلاین با تقویم شمسی',
        };
      case 'consumables':
        return {
          highlight: `${toPersianNumbers(
            activeConsumablesCount
          )} قلم کالای فعال با نرخ تعاونی`,
          statusLine:
            myOrdersCount > 0
              ? `${toPersianNumbers(myOrdersCount)} سفارش در سوابق شما`
              : 'تحویل حضوری، پست پیشتاز یا پیک',
        };
      case 'installment_sales': {
        const names = activePartners
          .slice(0, 2)
          .map((p) => p.name)
          .join('، ');
        return {
          highlight: names || 'فروشگاه‌های طرف قرارداد مجتمع',
          statusLine:
            myInstallmentCount > 0
              ? `${toPersianNumbers(myInstallmentCount)} درخواست اعتبار ثبت‌شده`
              : `${toPersianNumbers(activePartners.length)} فروشگاه فعال طرف قرارداد`,
        };
      }
      case 'recreation_tourism':
        return {
          highlight:
            activeRecreationPrograms.length > 0
              ? `${toPersianNumbers(activeRecreationPrograms.length)} برنامه و اردوی فعال`
              : 'اطلاع‌رسانی تورها و اردوهای اعضا',
          statusLine:
            myRecreationCount > 0
              ? `${toPersianNumbers(myRecreationCount)} ثبت‌نام در کارنامه شما`
              : 'ظرفیت، هزینه و ثبت‌نام آنلاین',
        };
      default:
        return { highlight: '', statusLine: '' };
    }
  };

  if (isOfficial && !previewStudentMode) {
    return (
      <AdminWelfareSuite onSwitchToStudentPreview={() => setPreviewStudentMode(true)} />
    );
  }

  const activeCfg = activeModule
    ? welfarePortalConfig.modulesConfig[activeModule]
    : null;
  const activeMeta = activeModule ? MODULE_META[activeModule] : null;
  const activeIndex = activeModule ? enabledModules.indexOf(activeModule) : -1;
  const nextModule =
    activeModule && enabledModules.length > 1
      ? enabledModules[(activeIndex + 1) % enabledModules.length]
      : null;

  return (
    <div className="space-y-6 pb-8" dir="rtl">
      {isOfficial && previewStudentMode && (
        <div className="rounded-2xl border border-amber-300/90 bg-amber-50/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-950">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>پیش‌نمایش محیط کاربری اعضا در بخش تسهیلات و رفاهیات</span>
          </div>
          <button
            type="button"
            onClick={() => setPreviewStudentMode(false)}
            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#071E17] text-[#F3D078] text-xs font-black whitespace-nowrap shrink-0 cursor-pointer"
          >
            بازگشت به پنل مدیریت
          </button>
        </div>
      )}

      {enabledModules.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center space-y-2.5 text-stone-500">
          <Gift className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm font-black text-stone-800">
            در حال حاضر هیچ‌یک از بخش‌های تسهیلات و رفاهیات فعال نیست.
          </p>
          <p className="text-xs">
            برای اطلاع از زمان‌بندی بازگشایی ثبت‌نام‌ها با شماره‌های زیر تماس بگیرید.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {!activeModule ? (
            /* =====================================================================
               VIEW A: DEDICATED MAIN WELFARE HUB (ONLY INTRO + 5 RADIANT CARDS)
               ===================================================================== */
            <motion.div
              key="welfare-main-hub"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Executive Sanctuary Banner */}
              <section className="relative overflow-hidden rounded-[28px] sm:rounded-[34px] bg-gradient-to-bl from-[#071E17] via-[#0B2D22] to-[#113C2E] text-[#FCFCF9] p-5 sm:p-7 lg:p-8 border border-[#F3D078]/30 shadow-[0_22px_48px_-24px_rgba(7,30,23,0.75)]">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#F3D078]/10 blur-3xl"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-l from-transparent via-[#F3D078]/75 to-transparent"
                />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2.5 max-w-2xl">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-[#F3D078]">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>سامانه جامع امور رفاهی مجتمع فقه و حقوق اسلامی</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight text-white leading-snug">
                      تسهیلات و خدمات رفاهی اعضا
                    </h1>
                    <p className="text-xs sm:text-sm text-emerald-100/85 leading-relaxed">
                      جهت مشاهده شرایط و ثبت درخواست در هر بخش، وارد صفحه اختصاصی آن شوید.
                    </p>
                  </div>

                  {/* Unboxed Tabular Status Ledger */}
                  <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-r border-white/12 lg:pr-7 shrink-0">
                    <div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-emerald-200/75">
                        بخش‌های فعال
                      </div>
                      <div className="text-lg sm:text-2xl font-black text-[#F3D078] tabular-nums mt-0.5">
                        {toPersianNumbers(enabledModules.length)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-emerald-200/75">
                        وضعیت صندوق
                      </div>
                      <div className="text-xs sm:text-sm font-black text-white mt-1.5 flex items-center gap-1 whitespace-nowrap">
                        {myFundMembership?.status === 'approved' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>عضو رسمی</span>
                          </>
                        ) : myFundMembership?.status === 'pending' ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-[#F3D078] shrink-0" />
                            <span>در حال بررسی</span>
                          </>
                        ) : (
                          <span className="text-stone-300">آماده عضویت</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-emerald-200/75">
                        پرونده‌های من
                      </div>
                      <div className="text-lg sm:text-2xl font-black text-white tabular-nums mt-0.5">
                        {toPersianNumbers(
                          myEmergencyCount +
                            myAccommodationCount +
                            myOrdersCount +
                            myInstallmentCount +
                            myRecreationCount
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6 Balanced Radiant Gateway Cards */}
              <section
                aria-label="فهرست بخش‌های تسهیلات و رفاهیات"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              >
                {enabledModules.map((modKey) => {
                  const meta = MODULE_META[modKey];
                  const Icon = meta.icon;
                  const modCfg = welfarePortalConfig.modulesConfig[modKey];
                  const metrics = getCardMetrics(modKey);

                  return (
                    <motion.button
                      key={modKey}
                      type="button"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => navigateToModule(modKey)}
                      className={`group relative overflow-hidden text-right rounded-[26px] border border-[#E2DAC3] bg-[#FCFCF9] hover:bg-white p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-[0_8px_24px_-16px_rgba(7,30,23,0.16)] hover:shadow-[0_20px_38px_-18px_rgba(7,30,23,0.28)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#071E17] min-h-[205px] ${
                        meta.cardBorderHoverClass
                      }`}
                    >
                      {/* Top Accent Hairline + Subtle Ambient Radial */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-6 top-0 h-[2px] bg-gradient-to-l ${meta.accentStripClass} opacity-60 group-hover:opacity-100 transition-opacity`}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity"
                        style={{ background: meta.ambientGradient }}
                      />

                      {/* Card Header */}
                      <div className="relative z-10 space-y-4 w-full">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${meta.iconSurfaceClass}`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-emerald-800/85 block">
                                {meta.shortKicker}
                              </span>
                              <h2 className="text-base sm:text-lg font-black text-[#071E17] leading-snug mt-0.5 truncate">
                                {modCfg?.title || modKey}
                              </h2>
                            </div>
                          </div>

                          <span className="text-xs sm:text-sm font-black text-stone-300 group-hover:text-amber-600/80 tabular-nums shrink-0 transition-colors">
                            {meta.indexLabel}
                          </span>
                        </div>

                        <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed line-clamp-2">
                          {modCfg?.subtitle}
                        </p>
                      </div>

                      {/* Live Telemetry + Navigation CTA */}
                      <div className="relative z-10 space-y-3 w-full">
                        <div className="text-[11px] sm:text-xs text-stone-700 font-bold tabular-nums flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-stone-200/75 pt-3">
                          <span className="text-[#071E17]">{metrics.highlight}</span>
                          {metrics.statusLine && (
                            <>
                              <span className="text-stone-300" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-emerald-800">{metrics.statusLine}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs font-black text-[#071E17] group-hover:text-emerald-900">
                          <span>{meta.actionLabel}</span>
                          <span className="w-8 h-8 rounded-xl bg-[#071E17]/6 group-hover:bg-[#071E17] text-[#071E17] group-hover:text-[#F3D078] flex items-center justify-center transition-colors">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </section>

              <WelfareContactsBanner />
            </motion.div>
          ) : (
            /* =====================================================================
               VIEW B: DEDICATED MODULE PAGE (CLEAN TOP BACK BAR + FULL PAGE MODULE)
               ===================================================================== */
            <motion.div
              key={`welfare-page-${activeModule}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Crisp Navigation & Breadcrumb Strip */}
              <div className="rounded-2xl border border-[#DFD7C2] bg-[#FCFCF9] px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={navigateToHub}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#071E17] hover:bg-[#0D3327] text-[#F3D078] text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors shadow-xs"
                  >
                    <ArrowRight className="w-4 h-4 shrink-0" />
                    <span>بازگشت به بخش اصلی رفاهیات</span>
                  </button>

                  {activeMeta && (
                    <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 min-w-0">
                      <span className="text-stone-300" aria-hidden="true">
                        /
                      </span>
                      <span className="font-black text-[#071E17] tabular-nums shrink-0">
                        {activeMeta.indexLabel}
                      </span>
                      <span className="font-bold text-stone-800 truncate">
                        {activeCfg?.title || activeModule}
                      </span>
                    </div>
                  )}
                </div>

                {nextModule && (
                  <button
                    type="button"
                    onClick={() => navigateToModule(nextModule)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700 hover:text-[#071E17] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <span>
                      بخش بعدی: {welfarePortalConfig.modulesConfig[nextModule]?.title}
                    </span>
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>

              {/* Dedicated Subpage Workspace */}
              {activeModule === 'emergency_loan' && <WelfareEmergencyLoanTab />}
              {activeModule === 'qarzolhasaneh_fund' && <WelfareQarzolhasanehFundTab />}
              {activeModule === 'accommodation' && <WelfareAccommodationTab />}
              {activeModule === 'consumables' && <WelfareConsumablesTab />}
              {activeModule === 'installment_sales' && <WelfareInstallmentsTab />}
              {activeModule === 'recreation_tourism' && <WelfareRecreationTab />}

              <WelfareContactsBanner />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

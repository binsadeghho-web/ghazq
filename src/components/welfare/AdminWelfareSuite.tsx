import React, { useState } from 'react';
import {
  Gift,
  Sliders,
  CreditCard,
  Landmark,
  Building2,
  ShoppingBag,
  Store,
  Compass,
  Eye,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelfareModuleKey, MobileDetailedShowcaseId } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { AdminEmergencyLoanPanel } from './AdminEmergencyLoanPanel';
import { AdminQarzolhasanehFundPanel } from './AdminQarzolhasanehFundPanel';
import { AdminAccommodationPanel } from './AdminAccommodationPanel';
import { WelfareCooperativeManager } from './WelfareCooperativeManager';
import { WelfareOrdersAuditView } from './WelfareOrdersAuditView';
import { AdminInstallmentSalesPanel } from './AdminInstallmentSalesPanel';
import { WelfareCalculatorAndPostalSuite } from './WelfareCalculatorAndPostalSuite';
import { AdminRecreationPanel } from './AdminRecreationPanel';

interface AdminWelfareSuiteProps {
  onSwitchToStudentPreview: () => void;
}

const MODULE_META: Array<{
  key: WelfareModuleKey;
  defaultLabel: string;
  detailedShowcaseKey: MobileDetailedShowcaseId;
  icon: any;
}> = [
  {
    key: 'emergency_loan',
    defaultLabel: 'تسهیلات اضطراری',
    detailedShowcaseKey: 'welfare_emergency',
    icon: CreditCard,
  },
  {
    key: 'qarzolhasaneh_fund',
    defaultLabel: 'صندوق قرض‌الحسنه مجتمع فقه و حقوق اسلامی',
    detailedShowcaseKey: 'welfare_fund',
    icon: Landmark,
  },
  {
    key: 'accommodation',
    defaultLabel: 'اسکان در قم و سایر شهرها',
    detailedShowcaseKey: 'welfare_accommodation',
    icon: Building2,
  },
  {
    key: 'consumables',
    defaultLabel: 'تهیه اقلام مصرفی',
    detailedShowcaseKey: 'welfare_consumables',
    icon: ShoppingBag,
  },
  {
    key: 'installment_sales',
    defaultLabel: 'فروش اقساطی',
    detailedShowcaseKey: 'welfare_installments',
    icon: Store,
  },
  {
    key: 'recreation_tourism',
    defaultLabel: 'تفریحی و گردشگری',
    detailedShowcaseKey: 'welfare_recreation',
    icon: Compass,
  },
];

export const AdminWelfareSuite: React.FC<AdminWelfareSuiteProps> = ({
  onSwitchToStudentPreview,
}) => {
  const {
    welfareRequests,
    consumables,
    consumableOrders,
    allFundMemberships,
    installmentRequests,
    recreationRegistrations,
    welfarePortalConfig,
    updateWelfarePortalConfig,
    crextioConfig,
    updateCrextioConfig,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'portal_settings' | WelfareModuleKey>('portal_settings');
  const [modulesDraft, setModulesDraft] = useState(welfarePortalConfig.modulesConfig);
  const [contactsDraft, setContactsDraft] = useState(welfarePortalConfig.contactsConfig);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const pendingLoans = welfareRequests.filter(
    (r) => (r.type === 'emergency_loan' || r.type === 'loan') && r.status === 'pending'
  ).length;
  const pendingFund = allFundMemberships.filter((m) => m.status === 'pending').length;
  const pendingStays = welfareRequests.filter(
    (r) => r.type === 'accommodation' && r.status === 'pending'
  ).length;
  const pendingInstallments = installmentRequests.filter((r) => r.status === 'pending').length;
  const pendingRecreation = (recreationRegistrations || []).filter(
    (r) => r.status === 'pending_review'
  ).length;

  const syncMobileShowcaseFlags = (nextModules: typeof modulesDraft) => {
    const mobileCfg = crextioConfig.mobileConfig;
    if (!mobileCfg) return;
    const prevDetailed = mobileCfg.detailedShowcaseEnabled || ({} as Record<MobileDetailedShowcaseId, boolean>);
    const updatedDetailed: Record<MobileDetailedShowcaseId, boolean> = {
      ...prevDetailed,
      welfare_emergency: Boolean(nextModules.emergency_loan?.showInMobileShowcase),
      welfare_fund: Boolean(nextModules.qarzolhasaneh_fund?.showInMobileShowcase),
      welfare_accommodation: Boolean(nextModules.accommodation?.showInMobileShowcase),
      welfare_consumables: Boolean(nextModules.consumables?.showInMobileShowcase),
      welfare_installments: Boolean(nextModules.installment_sales?.showInMobileShowcase),
      welfare_recreation: Boolean(nextModules.recreation_tourism?.showInMobileShowcase),
    };
    const anyWelfareInShowcase = MODULE_META.some((m) => nextModules[m.key]?.showInMobileShowcase);
    updateCrextioConfig({
      mobileConfig: {
        ...mobileCfg,
        showcaseMode: anyWelfareInShowcase ? 'detailed' : mobileCfg.showcaseMode,
        detailedShowcaseEnabled: updatedDetailed,
      },
    });
  };

  const handleSavePortalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setFeedback(null);
    try {
      await updateWelfarePortalConfig({
        modulesConfig: modulesDraft,
        contactsConfig: contactsDraft,
      });
      syncMobileShowcaseFlags(modulesDraft);
      setFeedback({
        type: 'success',
        text: 'تنظیمات فعال‌سازی ۶ بخش، ویترین خدمات موبایل و شماره‌های تماس با موفقیت ذخیره و همگام‌سازی شد.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ذخیره تنظیمات.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const tabItems: Array<{
    id: 'portal_settings' | WelfareModuleKey;
    label: string;
    icon: any;
    badge?: string;
  }> = [
    {
      id: 'portal_settings',
      label: 'تنظیمات ۶ بخش، ویترین و تماس',
      icon: Sliders,
    },
    {
      id: 'emergency_loan',
      label: '۱. تسهیلات اضطراری',
      icon: CreditCard,
      badge: pendingLoans > 0 ? toPersianNumbers(pendingLoans) : undefined,
    },
    {
      id: 'qarzolhasaneh_fund',
      label: '۲. صندوق قرض‌الحسنه',
      icon: Landmark,
      badge: pendingFund > 0 ? toPersianNumbers(pendingFund) : undefined,
    },
    {
      id: 'accommodation',
      label: '۳. اسکان و مهمانسرا',
      icon: Building2,
      badge: pendingStays > 0 ? toPersianNumbers(pendingStays) : undefined,
    },
    {
      id: 'consumables',
      label: '۴. اقلام مصرفی و سفارش‌ها',
      icon: ShoppingBag,
      badge: `${toPersianNumbers(consumables.length)} قلم · ${toPersianNumbers(consumableOrders.length)} سفارش`,
    },
    {
      id: 'installment_sales',
      label: '۵. فروش اقساطی',
      icon: Store,
      badge: pendingInstallments > 0 ? toPersianNumbers(pendingInstallments) : undefined,
    },
    {
      id: 'recreation_tourism',
      label: '۶. تفریحی و گردشگری',
      icon: Compass,
      badge: pendingRecreation > 0 ? toPersianNumbers(pendingRecreation) : undefined,
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Executive Obsidian-Emerald Header */}
      <div className="bg-gradient-to-l from-[#071E17] via-[#0B2C22] to-[#0D3327] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#F3D078] text-xs font-black">
              <Gift className="w-4 h-4" />
              <span>پنل جامع مدیریت ۶ بخش تسهیلات و رفاهیات</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              مدیریت مستقل خدمات رفاهی، صندوق قرض‌الحسنه و ویترین موبایل
            </h1>
            <p className="text-xs text-stone-200 max-w-2xl leading-relaxed">
              هر یک از ۶ بخش دارای پنل مدیریتی مجزا، کلید فعال‌سازی، امکان نمایش در ویترین خدمات موبایل و تنظیمات اختصاصی شماره‌های تماس است.
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToStudentPreview}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#F3D078] hover:bg-amber-300 text-[#071E17] text-xs font-black flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>پیش‌نمایش نمای کاربر</span>
          </button>
        </div>
      </div>

      {/* 6 Navigation Tabs (Settings + 5 Independent Module Admin Panels) */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 overflow-x-auto scrollbar-none">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#071E17] text-[#F3D078] shadow-sm'
                  : 'text-stone-700 hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black tabular-nums ${
                    isActive ? 'bg-white/15 text-[#F3D078]' : 'bg-emerald-100 text-[#071E17]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: PORTAL SETTINGS (5 MODULE TOGGLES + MOBILE SHOWCASE SYNC + CONTACTS) */}
      {activeTab === 'portal_settings' && (
        <form onSubmit={handleSavePortalSettings} className="space-y-6">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* 5 Modules Activation & Mobile Showcase Toggles */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-[#071E17]">
                فعال‌سازی بخش‌های شش‌گانه و نمایش در «ویترین خدمات» موبایل
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                با فعال‌کردن گزینه نمایش در ویترین موبایل، کارت اختصاصی آن بخش به‌صورت خودکار در حالت پیشرفته ویترین موبایل نمایان می‌شود.
              </p>
            </div>

            <div className="space-y-3">
              {MODULE_META.map((meta) => {
                const Icon = meta.icon;
                const mod = modulesDraft[meta.key];
                return (
                  <div
                    key={meta.key}
                    className="p-4 rounded-2xl border border-stone-200/90 bg-[#FCFCF9] space-y-3"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#071E17] text-[#F3D078] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="font-black text-xs sm:text-sm text-[#071E17]">
                          {meta.defaultLabel}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-stone-200 flex items-center gap-2 text-xs font-black text-stone-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mod.enabled !== false}
                            onChange={(e) =>
                              setModulesDraft((prev) => ({
                                ...prev,
                                [meta.key]: { ...prev[meta.key], enabled: e.target.checked },
                              }))
                            }
                            className="w-4 h-4 accent-[#071E17]"
                          />
                          <span>بخش فعال است</span>
                        </label>

                        <label className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-stone-200 flex items-center gap-2 text-xs font-black text-emerald-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(mod.showInMobileShowcase)}
                            onChange={(e) =>
                              setModulesDraft((prev) => ({
                                ...prev,
                                [meta.key]: {
                                  ...prev[meta.key],
                                  showInMobileShowcase: e.target.checked,
                                },
                              }))
                            }
                            className="w-4 h-4 accent-emerald-700"
                          />
                          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>نمایش در ویترین خدمات موبایل</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) =>
                          setModulesDraft((prev) => ({
                            ...prev,
                            [meta.key]: { ...prev[meta.key], title: e.target.value },
                          }))
                        }
                        placeholder="عنوان بخش"
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-white"
                      />
                      <input
                        type="text"
                        value={mod.subtitle}
                        onChange={(e) =>
                          setModulesDraft((prev) => ({
                            ...prev,
                            [meta.key]: { ...prev[meta.key], subtitle: e.target.value },
                          }))
                        }
                        placeholder="زیرعنوان توضیحی"
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Welfare Unit Contacts Editor */}
          <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Phone className="w-4 h-4 text-[#071E17]" />
              <h3 className="text-sm font-black text-[#071E17]">
                تنظیم شماره‌های تماس و کانال‌های ارتباطی مجموعه (قابل نمایش در تمام ۶ بخش)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">تلفن ثابت مستقیم:</label>
                <input
                  type="text"
                  value={contactsDraft.phone}
                  onChange={(e) => setContactsDraft((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">داخلی واحد رفاهی:</label>
                <input
                  type="text"
                  value={contactsDraft.extension || ''}
                  onChange={(e) => setContactsDraft((p) => ({ ...p, extension: e.target.value }))}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">شماره همراه / پیام‌رسان ایتا:</label>
                <input
                  type="text"
                  value={contactsDraft.messengerOrMobile || ''}
                  onChange={(e) =>
                    setContactsDraft((p) => ({ ...p, messengerOrMobile: e.target.value }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold bg-stone-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 block">ساعات پاسخگویی:</label>
                <input
                  type="text"
                  value={contactsDraft.workingHours}
                  onChange={(e) => setContactsDraft((p) => ({ ...p, workingHours: e.target.value }))}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-black text-stone-700 block">نشانی واحد امور رفاهی:</label>
                <input
                  type="text"
                  value={contactsDraft.address || ''}
                  onChange={(e) => setContactsDraft((p) => ({ ...p, address: e.target.value }))}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-black text-stone-700 block">متن اطلاع‌رسانی بالای بنر تماس:</label>
                <input
                  type="text"
                  value={contactsDraft.noticeText || ''}
                  onChange={(e) => setContactsDraft((p) => ({ ...p, noticeText: e.target.value }))}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-stone-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="min-h-[46px] px-7 py-2.5 rounded-2xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات بخش‌ها، ویترین و تماس'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 6 INDEPENDENT MODULE ADMIN PANELS */}
      {activeTab === 'emergency_loan' && <AdminEmergencyLoanPanel />}
      {activeTab === 'qarzolhasaneh_fund' && <AdminQarzolhasanehFundPanel />}
      {activeTab === 'accommodation' && <AdminAccommodationPanel />}
      {activeTab === 'consumables' && (
        <div className="space-y-6">
          <WelfareCalculatorAndPostalSuite mode="postal_and_inventory" isOfficial={true} />
          <WelfareCooperativeManager />
          <WelfareOrdersAuditView />
        </div>
      )}
      {activeTab === 'installment_sales' && <AdminInstallmentSalesPanel />}
      {activeTab === 'recreation_tourism' && <AdminRecreationPanel />}
    </div>
  );
};

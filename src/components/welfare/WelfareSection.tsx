import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Landmark,
  Building2,
  ShoppingBag,
  Store,
  ShieldCheck,
  Gift,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WelfareModuleKey } from '../../types';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';
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

const MODULE_ICONS: Record<WelfareModuleKey, any> = {
  emergency_loan: CreditCard,
  qarzolhasaneh_fund: Landmark,
  accommodation: Building2,
  consumables: ShoppingBag,
  installment_sales: Store,
};

const MODULE_ORDER: WelfareModuleKey[] = [
  'emergency_loan',
  'qarzolhasaneh_fund',
  'accommodation',
  'consumables',
  'installment_sales',
];

export const WelfareSection: React.FC<WelfareSectionProps> = ({
  initialModuleTab,
  deepLinkNonce,
}) => {
  const { currentUser, welfarePortalConfig } = useApp();
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

  if (isOfficial && !previewStudentMode) {
    return <AdminWelfareSuite onSwitchToStudentPreview={() => setPreviewStudentMode(true)} />;
  }

  return (
    <div className="space-y-6 pb-8" dir="rtl">
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
          {/* Responsive 5-Module Navigation Strip */}
          <div className="rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 min-w-max">
              {enabledModules.map((modKey) => {
                const Icon = MODULE_ICONS[modKey];
                const modCfg = welfarePortalConfig.modulesConfig[modKey];
                const isActive = activeModule === modKey;
                return (
                  <button
                    key={modKey}
                    type="button"
                    onClick={() => setActiveModule(modKey)}
                    className={`min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#071E17] text-[#F3D078] shadow-sm'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{modCfg?.title || modKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Module Content */}
          {activeModule === 'emergency_loan' && <WelfareEmergencyLoanTab />}
          {activeModule === 'qarzolhasaneh_fund' && <WelfareQarzolhasanehFundTab />}
          {activeModule === 'accommodation' && <WelfareAccommodationTab />}
          {activeModule === 'consumables' && <WelfareConsumablesTab />}
          {activeModule === 'installment_sales' && <WelfareInstallmentsTab />}
        </>
      )}

      {/* Always Display Editable Welfare Unit Contacts Banner */}
      <WelfareContactsBanner />
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { WelfareSectionsManager } from './WelfareSectionsManager';
import { WelfareLoanRequestsManager } from './WelfareLoanRequestsManager';
import { WelfareLoanRulesEditor } from './WelfareLoanRulesEditor';
import { WelfareCooperativeManager } from './WelfareCooperativeManager';
import { WelfareOrdersAuditView } from './WelfareOrdersAuditView';
import { WelfareAccommodationsManager } from './WelfareAccommodationsManager';
import { WelfareCalculatorAndPostalSuite } from './WelfareCalculatorAndPostalSuite';
import {
  Gift,
  CreditCard,
  Home,
  ShoppingBag,
  Sliders,
  Scale,
  BarChart3,
  Layers,
  Eye,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

interface AdminWelfareSuiteProps {
  onSwitchToStudentPreview: () => void;
}

export const AdminWelfareSuite: React.FC<AdminWelfareSuiteProps> = ({
  onSwitchToStudentPreview
}) => {
  const { welfareRequests, consumables, consumableOrders } = useApp();

  const [activeTab, setActiveTab] = useState<
    'sections_config' | 'loans' | 'loan_rules' | 'cooperative' | 'orders_audit' | 'accommodations'
  >('sections_config');

  const pendingLoans = welfareRequests.filter(r => r.type === 'loan' && r.status === 'pending').length;
  const pendingStays = welfareRequests.filter(r => r.type === 'accommodation' && r.status === 'pending').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* EXECUTIVE WELFARE COMMAND HEADER */}
      <div className="bg-gradient-to-r from-stone-950 via-slate-900 to-teal-950 text-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-teal-800/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-teal-400" />
                صندوق رفاه، اعتبارات حامی و تعاونی
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                پنل مدیریت ارشد و حسابرسی ۱۰۰٪
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-stone-300 text-xs font-mono">
                دسترسی اختصاصی ادمین
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              میز فرماندهی، ویرایش ۱۰۰ درصدی و حسابرسی جامع رفاهیات
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-2xl leading-relaxed">
              تقسیم و فعال/غیرفعال‌سازی بخش‌های مالی و اقلام، تدوین ضوابط و اساسنامه وام، ویرایش محصولات و عکس‌های تعاونی و حسابرسی ریز سوابق سفارشات
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onSwitchToStudentPreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all shadow-sm hover:scale-102 active:scale-98 cursor-pointer backdrop-blur-md"
            >
              <Eye className="w-4 h-4 text-teal-300" />
              <span>پیش‌نمایش محیط دانش‌آموخته</span>
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS BAR */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 overflow-x-auto scrollbar-none">
        {[
          {
            id: 'sections_config',
            label: 'تقسیم‌بندی و فعال‌سازی بخش‌های رفاهیات',
            icon: Layers,
            badge: 'مدیریت بخش‌ها'
          },
          {
            id: 'loans',
            label: 'کارتابل پرونده‌های وام صندوق حامی',
            icon: CreditCard,
            badge: pendingLoans > 0 ? `${toPersianNumbers(pendingLoans)} نیاز به اقدام` : undefined
          },
          {
            id: 'loan_rules',
            label: 'تدوین ضوابط، آیین‌نامه و مدارک الزامی وام',
            icon: Scale,
            badge: 'ویرایش ۱۰۰٪'
          },
          {
            id: 'cooperative',
            label: 'مدیریت محصولات، عکس‌ها و نرخ‌های تعاونی',
            icon: ShoppingBag,
            badge: `${toPersianNumbers(consumables.length)} قلم کالا`
          },
          {
            id: 'orders_audit',
            label: 'سوابق سفارش‌ها (تفکیک‌شده و کلی) و حسابرسی',
            icon: BarChart3,
            badge: `${toPersianNumbers(consumableOrders.length)} فاکتور`
          },
          {
            id: 'accommodations',
            label: 'اقامتگاه‌های مشهد و قم و صدور معرفی‌نامه',
            icon: Home,
            badge: pendingStays > 0 ? `${toPersianNumbers(pendingStays)} رزرو` : undefined
          }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-900'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SECTIONS */}
      {activeTab === 'sections_config' && <WelfareSectionsManager />}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          <WelfareCalculatorAndPostalSuite mode="calculator" isOfficial={true} />
          <WelfareLoanRequestsManager />
        </div>
      )}
      {activeTab === 'loan_rules' && (
        <div className="space-y-6">
          <WelfareCalculatorAndPostalSuite mode="calculator" isOfficial={true} />
          <WelfareLoanRulesEditor />
        </div>
      )}
      {activeTab === 'cooperative' && (
        <div className="space-y-6">
          <WelfareCalculatorAndPostalSuite mode="postal_and_inventory" isOfficial={true} />
          <WelfareCooperativeManager />
        </div>
      )}
      {activeTab === 'orders_audit' && (
        <div className="space-y-6">
          <WelfareCalculatorAndPostalSuite mode="postal_and_inventory" isOfficial={true} />
          <WelfareOrdersAuditView />
        </div>
      )}
      {activeTab === 'accommodations' && <WelfareAccommodationsManager />}
    </div>
  );
};

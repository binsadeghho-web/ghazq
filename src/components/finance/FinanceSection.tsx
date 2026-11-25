import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { ConsultantManagementModule } from '../admin/ConsultantManagementModule';
import { ModuleFallback } from '../common/ModuleFallback';

const AnalyticsReportsModule = lazy(() => import('../admin/AnalyticsReportsModule').then(m => ({ default: m.AnalyticsReportsModule })));
const FinancialAuditLedgerModule = lazy(() => import('../admin/FinancialAuditLedgerModule').then(m => ({ default: m.FinancialAuditLedgerModule })));
import {
  DollarSign,
  TrendingUp,
  Receipt,
  PieChart,
  BarChart3,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Printer,
  Filter,
  Search,
  GraduationCap,
  ShoppingBag,
  Gift,
  HeartHandshake,
  Scale,
  Inbox,
  Users2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  Coins,
  Wallet
} from 'lucide-react';

export const FinanceSection: React.FC = () => {
  const {
    courseEnrollments,
    productOrders,
    welfareRequests,
    consumableOrders,
    cartableRequests,
    synergyPosts,
    consultants
  } = useApp();

  const [activeFinanceTab, setActiveFinanceTab] = useState<'analytics' | 'ledger' | 'consultants' | 'welfare'>('analytics');

  const formatToman = (amount: number): string => {
    return `${toPersianNumbers(amount.toLocaleString('fa-IR'))} تومان`;
  };

  // Aggregated Overall System Revenue Calculations across ALL modules
  const financialTotals = useMemo(() => {
    // 1. Courses Revenue
    const courseRev = courseEnrollments
      .filter(e => e.paymentStatus === 'confirmed')
      .reduce((sum, e) => sum + e.amountPaid, 0);

    // 2. Products Store Revenue
    const productRev = productOrders
      .filter(p => p.paymentStatus === 'confirmed')
      .reduce((sum, p) => sum + p.amountPaid, 0);

    // 3. Cooperative Basket Revenue
    const consumableRev = consumableOrders
      .filter(c => c.status === 'delivered' || c.status === 'dispatched')
      .reduce((sum, c) => sum + c.totalAmount, 0);

    // 4. Counseling Sessions Revenue & Honorariums
    const counselingEstRev = consultants
      .filter(c => c.isActive !== false)
      .reduce((sum, c) => sum + (c.fee || 0), 0) * 12; // annualized estimate

    // 5. Active Disbursed Welfare Loans
    const disbursedLoansVolume = welfareRequests
      .filter(w => w.status === 'disbursed' || w.status === 'approved')
      .reduce((sum, w) => sum + (w.type === 'loan' ? 100000000 : 15000000), 0);

    // Total System Commercial Revenue
    const totalCommercialIncome = courseRev + productRev + consumableRev;

    // Total Transactions & Registrations Count
    const totalTransactionsCount =
      courseEnrollments.length +
      productOrders.length +
      consumableOrders.length +
      welfareRequests.length +
      cartableRequests.length;

    // Pending Receipts / Action Queue Count
    const pendingReviewCount =
      courseEnrollments.filter(e => e.paymentStatus === 'pending_review').length +
      productOrders.filter(p => p.paymentStatus === 'pending_review').length +
      welfareRequests.filter(w => w.status === 'pending').length;

    return {
      courseRev,
      productRev,
      consumableRev,
      counselingEstRev,
      disbursedLoansVolume,
      totalCommercialIncome,
      totalTransactionsCount,
      pendingReviewCount,
    };
  }, [courseEnrollments, productOrders, consumableOrders, consultants, welfareRequests, cartableRequests]);

  return (
    <div className="space-y-5 sm:space-y-6" dir="rtl">
      {/* Top Main Section Header — Theme 2 Obsidian Emerald */}
      <div className="relative rounded-[28px] overflow-hidden p-5 sm:p-7 border border-[#F3D078]/25 bg-gradient-to-br from-[#071E17] via-[#0B2A20] to-[#113D30] text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-[#F3D078]/35 text-[#F3D078] flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  امور مالی، حسابداری و مدیریت درآمدها
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-[#F3D078]/15 text-[#F3D078] border border-[#F3D078]/30">
                  مرکز پایش کلان
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 font-medium mt-1">
                مدیریت یکپارچه تمامی تراکنش‌های مالی، شهریه دوره‌ها، فروشگاه کتب، تسویه‌حساب مشاوران و اعتبارات صندوق رفاه
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-l from-[#D4AF37] to-[#F3D078] hover:brightness-105 text-[#071E17] text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش جامع مالی</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#FCFCF9] border border-[#E2DAC3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-bold">درآمد کل محقق‌شده سامانه</span>
            <div className="p-2 rounded-xl bg-emerald-900/10 text-[#071E17]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#071E17] tabular-nums">
            {formatToman(financialTotals.totalCommercialIncome)}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>دوره‌ها، انتشارات و سبد تعاونی</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#FCFCF9] border border-[#E2DAC3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-bold">حجم تسهیلات و وام‌های فعال</span>
            <div className="p-2 rounded-xl bg-[#FAF8F2] border border-[#E2DAC3] text-[#8E651C]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#071E17] tabular-nums">
            {formatToman(financialTotals.disbursedLoansVolume)}
          </div>
          <div className="text-[11px] text-teal-800 font-semibold">
            وام‌های قرض‌الحسنه و اعتبارات رفاهی
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#FCFCF9] border border-[#E2DAC3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-bold">فیش‌ها و اقلام در صف تایید</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 tabular-nums">
            {toPersianNumbers(financialTotals.pendingReviewCount)} مورد
          </div>
          <div className="text-[11px] text-amber-800 font-semibold">
            نیازمند بررسی و تایید مسئول حسابداری
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#FCFCF9] border border-[#E2DAC3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-bold">کل ثبت‌نام‌ها و درخواست‌ها</span>
            <div className="p-2 rounded-xl bg-stone-200/70 text-[#071E17]">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#071E17] tabular-nums">
            {toPersianNumbers(financialTotals.totalTransactionsCount)} تراکنش
          </div>
          <div className="text-[11px] text-stone-600 font-semibold">
            تراکنش‌های ثبت‌شده در پایگاه داده
          </div>
        </div>
      </div>

      {/* Top Segmented Sub-Tab Switcher Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#FCFCF9] rounded-2xl border border-[#E2DAC3] shadow-xs overflow-x-auto scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setActiveFinanceTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'analytics'
              ? 'bg-[#071E17] text-[#F3D078] shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>تحلیل و آمار جامع مالی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFinanceTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'ledger'
              ? 'bg-[#071E17] text-[#F3D078] shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>دفترکل و تراکنش‌های جامع</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFinanceTab('consultants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'consultants'
              ? 'bg-[#071E17] text-[#F3D078] shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>تسویه‌حساب‌ها و تعرفه مشاوران</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFinanceTab('welfare')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'welfare'
              ? 'bg-[#071E17] text-[#F3D078] shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F2]'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>تسهیلات، وام‌ها و اعتبارات رفاهی</span>
        </button>
      </div>

      {/* Main Content Areas according to Sub-Tab */}
      {activeFinanceTab === 'analytics' && (
        <Suspense fallback={<ModuleFallback />}>
          <AnalyticsReportsModule />
        </Suspense>
      )}

      {activeFinanceTab === 'ledger' && (
        <Suspense fallback={<ModuleFallback />}>
          <FinancialAuditLedgerModule />
        </Suspense>
      )}

      {activeFinanceTab === 'consultants' && (
        <ConsultantManagementModule />
      )}

      {activeFinanceTab === 'welfare' && (
        <div className="bg-[#FCFCF9] rounded-[28px] p-5 sm:p-7 border border-[#E2DAC3] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DAC3]">
            <div>
              <h3 className="text-base font-extrabold text-[#071E17] flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#A87923]" />
                <span>گزارش مانده اعتبارات، وام‌های فعال و اقساط صندوق رفاه</span>
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                جدول پایش پرداخت‌ها، اقساط سررسیدشده و مانده تسهیلات پرداختی به اعضا
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[#FAF8F2] border border-[#E2DAC3] text-[#8E651C]">
              صندوق قرض‌الحسنه مجتمع فقه و حقوق
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E2DAC3] space-y-1">
              <span className="text-xs text-stone-500 block">حجم کل اعتبارات تخصیصی:</span>
              <span className="text-xl font-black text-[#071E17] tabular-nums">
                {formatToman(5000000000)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E2DAC3] space-y-1">
              <span className="text-xs text-stone-500 block">پرداختی‌های جاری (وام‌های فعال):</span>
              <span className="text-xl font-black text-emerald-800 tabular-nums">
                {formatToman(financialTotals.disbursedLoansVolume)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E2DAC3] space-y-1">
              <span className="text-xs text-stone-500 block">مانده قابل واگذاری:</span>
              <span className="text-xl font-black text-[#8E651C] tabular-nums">
                {formatToman(5000000000 - financialTotals.disbursedLoansVolume)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E2DAC3] bg-white">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#FAF8F2] text-stone-700 font-bold border-b border-[#E2DAC3]">
                <tr>
                  <th className="p-3.5">کد درخواست</th>
                  <th className="p-3.5">نام وام‌گیرنده</th>
                  <th className="p-3.5">نوع تسهیلات</th>
                  <th className="p-3.5">مبلغ اصل وام</th>
                  <th className="p-3.5">تعداد اقساط</th>
                  <th className="p-3.5">وضعیت پرداختی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DAC3]/60">
                {welfareRequests.map(req => (
                  <tr key={req.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#071E17]">
                      WLF-{req.id.slice(0, 8)}
                    </td>
                    <td className="p-3.5 font-bold text-stone-900">
                      {req.applicantName}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F2] border border-[#E2DAC3] text-stone-800 font-bold">
                        {req.title}
                      </span>
                    </td>
                    <td className="p-3.5 font-black text-[#071E17] tabular-nums">
                      {formatToman(req.type === 'loan' ? 100000000 : 15000000)}
                    </td>
                    <td className="p-3.5 font-bold tabular-nums text-stone-700">
                      {toPersianNumbers('۲۴ قسط')}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        req.status === 'disbursed' || req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {req.status === 'disbursed' ? 'پرداخت شده' : req.status === 'approved' ? 'تاییدشده' : 'در حال بررسی'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

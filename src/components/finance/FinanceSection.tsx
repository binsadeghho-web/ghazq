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
    <div className="space-y-6">
      {/* Top Main Section Header */}
      <div className="glass-card rounded-[32px] p-6 sm:p-8 border border-stone-200/90 dark:border-[#2A423B] bg-white/95 dark:bg-[#182622]/95 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  امور مالی، حسابداری و مدیریت درآمدها
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  مرکز پایش کلان
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                مدیریت یکپارچه تمامی تراکنش‌های مالی، شهریه دوره‌ها، فروشگاه کتب، تسویه‌حساب مشاوران، و اعتبارات صندوق رفاه
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش جامع مالی</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Section 9 Golden Signals / Financial Performance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#182622] border border-stone-200/90 dark:border-[#2A423B] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold">درآمد کل محقق‌شده سامانه</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white tabular-nums">
            {formatToman(financialTotals.totalCommercialIncome)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>دوره‌ها، انتشارات و سبد تعاونی</span>
          </div>
        </div>

        {/* Welfare Loans Pool */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#182622] border border-stone-200/90 dark:border-[#2A423B] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold">حجم تسهیلات و وام‌های فعال</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white tabular-nums">
            {formatToman(financialTotals.disbursedLoansVolume)}
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
            وام‌های قرض‌الحسنه و اعتبارات رفاهی
          </div>
        </div>

        {/* Pending Settlements Queue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#182622] border border-stone-200/90 dark:border-[#2A423B] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold">فیش‌ها و اقلام در صف تایید</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {toPersianNumbers(financialTotals.pendingReviewCount)} مورد
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
            نیازمند بررسی و تایید مسئول حسابداری
          </div>
        </div>

        {/* Total Financial Activity Count */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#182622] border border-stone-200/90 dark:border-[#2A423B] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span className="font-bold">کل ثبت‌نام‌ها و درخواست‌ها</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white tabular-nums">
            {toPersianNumbers(financialTotals.totalTransactionsCount)} تراکنش
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
            تراکنش‌های ثبت‌شده در پایگاه داده
          </div>
        </div>
      </div>

      {/* Top Segmented Sub-Tab Switcher Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-[#182622] rounded-2xl border border-stone-200/90 dark:border-[#2A423B] shadow-xs overflow-x-auto text-xs">
        <button
          onClick={() => setActiveFinanceTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'analytics'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>تحلیل و آمار جامع مالی</span>
        </button>

        <button
          onClick={() => setActiveFinanceTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'ledger'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>دفترکل و تراکنش‌های جامع</span>
        </button>

        <button
          onClick={() => setActiveFinanceTab('consultants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'consultants'
              ? 'bg-amber-500 text-stone-950 font-black shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>تسویه‌حساب‌ها و تعرفه مشاوران</span>
        </button>

        <button
          onClick={() => setActiveFinanceTab('welfare')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeFinanceTab === 'welfare'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
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
        <div className="bg-white dark:bg-[#182622] rounded-[32px] p-6 sm:p-8 border border-stone-200/90 dark:border-[#2A423B] space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-[#2A423B]">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-teal-600" />
                <span>گزارش مانده اعتبارات، وام‌های فعال و اقساط صندوق رفاه</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                جدول پایش پرداخت‌ها، اقساط سررسیدشده و مانده تسهیلات پرداختی به اعضا
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-300">
              صندوق قرض‌الحسنه مرکز دانش‌آموختگان
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="text-xs text-stone-500 block">حجم کل اعتبارات تخصیصی:</span>
              <span className="text-xl font-black text-stone-900 dark:text-white tabular-nums">
                {formatToman(5000000000)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="text-xs text-stone-500 block">پرداختی‌های جاری (وام‌های فعال):</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatToman(financialTotals.disbursedLoansVolume)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-1">
              <span className="text-xs text-stone-500 block">مانده قابل واگذاری:</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                {formatToman(5000000000 - financialTotals.disbursedLoansVolume)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold">
                <tr>
                  <th className="p-3.5">کد درخواست</th>
                  <th className="p-3.5">نام وام‌گیرنده</th>
                  <th className="p-3.5">نوع تسهیلات</th>
                  <th className="p-3.5">مبلغ اصل وام</th>
                  <th className="p-3.5">تعداد اقساط</th>
                  <th className="p-3.5">وضعیت پرداختی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {welfareRequests.map(req => (
                  <tr key={req.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-stone-800 dark:text-stone-200">
                      WLF-{req.id.slice(0, 8)}
                    </td>
                    <td className="p-3.5 font-bold text-stone-900 dark:text-white">
                      {req.applicantName}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                        {req.title}
                      </span>
                    </td>
                    <td className="p-3.5 font-black tabular-nums">
                      {formatToman(req.type === 'loan' ? 100000000 : 15000000)}
                    </td>
                    <td className="p-3.5 font-bold tabular-nums">
                      {toPersianNumbers('۲۴ قسط')}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'disbursed' || req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
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

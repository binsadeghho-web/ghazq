import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Printer,
  Filter,
  Search,
  FileSpreadsheet,
  PieChart,
  BarChart2,
  GraduationCap,
  ShoppingBag,
  Gift,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Sparkles,
  ArrowDownLeft,
  Receipt,
  FileText
} from 'lucide-react';

export const FinancialAuditLedgerModule: React.FC = () => {
  const {
    courseEnrollments,
    productOrders,
    welfareRequests,
    consumableOrders,
    reviewCourseEnrollment,
    reviewProductOrder,
  } = useApp();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'courses' | 'products' | 'welfare' | 'consumables'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending_review' | 'rejected'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'online_gateway' | 'bank_receipt'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatToman = (amount: number): string => {
    return `${toPersianNumbers(amount.toLocaleString('fa-IR'))} تومان`;
  };

  // Aggregated All Financial Transactions Array
  const allLedgerItems = useMemo(() => {
    const items: Array<{
      id: string;
      originalId: string;
      category: 'courses' | 'products' | 'welfare' | 'consumables';
      categoryTitle: string;
      title: string;
      userName: string;
      userPhone: string;
      userRoleTitle: string;
      amount: number;
      paymentMethod: 'online_gateway' | 'bank_receipt' | 'salary_deduction' | 'fund_disbursed';
      paymentMethodTitle: string;
      paymentStatus: 'confirmed' | 'pending_review' | 'rejected';
      trackingCode: string;
      receiptFileUrl?: string;
      date: string;
      adminNote?: string;
      rawItem: any;
    }> = [];

    // 1. Course Enrollments
    courseEnrollments.forEach(e => {
      items.push({
        id: `enr_${e.id}`,
        originalId: e.id,
        category: 'courses',
        categoryTitle: 'شهریه دوره‌های آموزشی',
        title: e.courseTitle,
        userName: e.userName,
        userPhone: e.userPhone,
        userRoleTitle: e.userRoleTitle || 'دانش‌آموخته',
        amount: e.amountPaid,
        paymentMethod: e.paymentMethod,
        paymentMethodTitle: e.paymentMethod === 'online_gateway' ? 'درگاه آنلاین شاپرک' : 'واریز کارت به کارت / فیش بانکی',
        paymentStatus: e.paymentStatus,
        trackingCode: e.trackingCode,
        receiptFileUrl: e.receiptFileUrl,
        date: e.enrolledAt,
        adminNote: e.adminNote,
        rawItem: e,
      });
    });

    // 2. Product Orders
    productOrders.forEach(p => {
      items.push({
        id: `prd_${p.id}`,
        originalId: p.id,
        category: 'products',
        categoryTitle: 'خرید کتاب و انتشارات',
        title: p.productTitle,
        userName: p.userName,
        userPhone: p.userPhone,
        userRoleTitle: p.userRoleTitle || 'دانش‌آموخته',
        amount: p.amountPaid,
        paymentMethod: p.paymentMethod,
        paymentMethodTitle: p.paymentMethod === 'online_gateway' ? 'درگاه آنلاین شاپرک' : 'واریز کارت به کارت / فیش بانکی',
        paymentStatus: p.paymentStatus,
        trackingCode: p.trackingCode,
        receiptFileUrl: p.receiptFileUrl,
        date: p.orderedAt,
        adminNote: p.adminNote,
        rawItem: p,
      });
    });

    // 3. Welfare Requests (Loans/Grants)
    welfareRequests.forEach(w => {
      let status: 'confirmed' | 'pending_review' | 'rejected' = 'pending_review';
      if (w.status === 'approved' || w.status === 'disbursed') status = 'confirmed';
      else if (w.status === 'rejected') status = 'rejected';

      const numericVal = w.type === 'loan' ? 100000000 : 15000000;

      items.push({
        id: `welf_${w.id}`,
        originalId: w.id,
        category: 'welfare',
        categoryTitle: 'تسهیلات و وام صندوق رفاه',
        title: w.title,
        userName: w.applicantName,
        userPhone: '۰۹۱۲۰۰۰۰۰۰۰',
        userRoleTitle: 'عضو صندوق رفاه',
        amount: numericVal,
        paymentMethod: 'fund_disbursed',
        paymentMethodTitle: 'واریز صندوق رفاهی مرکز',
        paymentStatus: status,
        trackingCode: `WLF-${w.id.slice(0, 8)}`,
        date: w.createdAt,
        adminNote: w.adminNote,
        rawItem: w,
      });
    });

    // 4. Consumable Orders (Cooperative)
    consumableOrders.forEach(c => {
      items.push({
        id: `csm_${c.id}`,
        originalId: c.id,
        category: 'consumables',
        categoryTitle: 'سبد مصرفی تعاونی',
        title: `سفارش شامل ${toPersianNumbers(c.items.length)} قلم کالا`,
        userName: c.applicantName,
        userPhone: '۰۹۱۲۰۰۰۰۰۰۰',
        userRoleTitle: 'عضو تعاونی',
        amount: c.totalAmount,
        paymentMethod: 'salary_deduction',
        paymentMethodTitle: 'کسر از حقوق / درگاه تعاونی',
        paymentStatus: c.status === 'delivered' || c.status === 'dispatched' ? 'confirmed' : 'pending_review',
        trackingCode: `CSM-${c.id.slice(0, 8)}`,
        date: c.createdAt,
        rawItem: c,
      });
    });

    return items;
  }, [courseEnrollments, productOrders, welfareRequests, consumableOrders]);

  // Filtered List
  const filteredLedger = useMemo(() => {
    return allLedgerItems.filter(item => {
      if (activeCategoryFilter !== 'all' && item.category !== activeCategoryFilter) return false;
      if (statusFilter !== 'all' && item.paymentStatus !== statusFilter) return false;
      if (methodFilter !== 'all' && item.paymentMethod !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q) ||
          item.trackingCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allLedgerItems, activeCategoryFilter, statusFilter, methodFilter, searchQuery]);

  // Aggregate Metrics
  const summaryMetrics = useMemo(() => {
    const confirmedItems = allLedgerItems.filter(i => i.paymentStatus === 'confirmed');
    const pendingItems = allLedgerItems.filter(i => i.paymentStatus === 'pending_review');

    const courseVolume = confirmedItems.filter(i => i.category === 'courses').reduce((sum, i) => sum + i.amount, 0);
    const productVolume = confirmedItems.filter(i => i.category === 'products').reduce((sum, i) => sum + i.amount, 0);
    const welfareVolume = confirmedItems.filter(i => i.category === 'welfare').reduce((sum, i) => sum + i.amount, 0);
    const consumableVolume = confirmedItems.filter(i => i.category === 'consumables').reduce((sum, i) => sum + i.amount, 0);

    const totalSystemIncome = courseVolume + productVolume + consumableVolume;
    const totalDisbursedLoans = welfareVolume;

    return {
      totalSystemIncome,
      totalDisbursedLoans,
      pendingCount: pendingItems.length,
      confirmedCount: confirmedItems.length,
      courseVolume,
      productVolume,
      welfareVolume,
      consumableVolume,
    };
  }, [allLedgerItems]);

  const handlePrintAudit = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Banner & Actions Header */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              دفتر کل حسابرسی و مدیریت امور مالی سامانه
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            پنل اختصاصی مسئولان و مدیران ارشد جهت پایش متمرکز تراکنش‌های ریالی شهریه دوره‌ها، فروش کتب و محصولات، پرداخت وام‌های صندوق رفاه و سفارشات تعاونی.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handlePrintAudit}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ صورت‌حساب مالی</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total System Income */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>مجموع درآمد واریزی کل</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatToman(summaryMetrics.totalSystemIncome)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>حاصل از دوره‌ها، کتب و تعاونی</span>
          </div>
        </div>

        {/* Tuition Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>درآمد شهریه دوره‌های آموزشی</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatToman(summaryMetrics.courseVolume)}
          </div>
          <div className="text-[11px] text-indigo-600 font-bold">
            تسویه‌شده در درگاه و فیش‌های تاییدشده
          </div>
        </div>

        {/* Publications Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>درآمد انتشارات و محصولات</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatToman(summaryMetrics.productVolume)}
          </div>
          <div className="text-[11px] text-amber-600 font-bold">
            فروش کتب چاپی و فایل‌های صوتی
          </div>
        </div>

        {/* Pending Review Items */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>فیش‌های در نوبت حسابرسی</span>
            <div className="p-2 bg-rose-500/10 text-rose-600 rounded-lg">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
            {toPersianNumbers(summaryMetrics.pendingCount)} مورد
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
            نیازمند تایید فیش توسط مسئول
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs overflow-x-auto font-bold">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه تراکنش‌ها ({toPersianNumbers(allLedgerItems.length)})
            </button>
            <button
              onClick={() => setActiveCategoryFilter('courses')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryFilter === 'courses'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
              }`}
            >
              شهریه دوره‌ها
            </button>
            <button
              onClick={() => setActiveCategoryFilter('products')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryFilter === 'products'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              انتشارات و کتب
            </button>
            <button
              onClick={() => setActiveCategoryFilter('welfare')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryFilter === 'welfare'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-teal-600'
              }`}
            >
              وام و صندوق رفاه
            </button>
            <button
              onClick={() => setActiveCategoryFilter('consumables')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeCategoryFilter === 'consumables'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              سبد تعاونی
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="جستجو در کد رهگیری، نام کاربر..."
              className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Sub Status & Method Filter Bar */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-bold shrink-0">فیلتر تکمیلی:</span>

          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="confirmed">تاییدشده (Confirmed)</option>
              <option value="pending_review">در صف بررسی فیش (Pending)</option>
              <option value="rejected">ردشده / برگشتی (Rejected)</option>
            </select>

            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">همه ابزارهای پرداخت</option>
              <option value="online_gateway">درگاه آنلاین شاپرک</option>
              <option value="bank_receipt">واریز کارت به کارت / فیش بانکی</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Detailed Transaction Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            <span>صورت دادوستدها و تراکنش‌های حسابرسی ({toPersianNumbers(filteredLedger.length)} مورد)</span>
          </h3>
          <span className="text-[11px] text-slate-500">نمایش مبالغ به عدد صحیح ریالی/تومانی</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">کد رهگیری / شناسه</th>
                <th className="p-3.5">نام متقاضی / دانش‌آموخته</th>
                <th className="p-3.5">بخش / عنوان تراکنش</th>
                <th className="p-3.5">مبلغ (تومان)</th>
                <th className="p-3.5">ابزار پرداخت</th>
                <th className="p-3.5">تاریخ ثبت</th>
                <th className="p-3.5">وضعیت</th>
                <th className="p-3.5 text-center">عملیات حسابرسی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    هیچ تراکنش حسابرسی‌شده‌ای با این مشخصات یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredLedger.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.trackingCode}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">{item.userName}</span>
                      <span className="text-[10px] text-slate-400 block">{item.userRoleTitle}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold block w-fit mb-0.5">
                        {item.categoryTitle}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block max-w-xs truncate">
                        {item.title}
                      </span>
                    </td>
                    <td className="p-3.5 font-black tabular-nums text-slate-900 dark:text-white text-xs">
                      {formatToman(item.amount)}
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {item.paymentMethodTitle}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 tabular-nums">
                      {item.date}
                    </td>
                    <td className="p-3.5">
                      {item.paymentStatus === 'confirmed' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>تایید و تسویه</span>
                        </span>
                      )}
                      {item.paymentStatus === 'pending_review' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>در صف بررسی فیش</span>
                        </span>
                      )}
                      {item.paymentStatus === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>ردشده</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {item.paymentStatus === 'pending_review' ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (item.category === 'courses') {
                                reviewCourseEnrollment(item.originalId, 'confirmed', 'تایید حسابرسی');
                              } else if (item.category === 'products') {
                                reviewProductOrder(item.originalId, 'confirmed', 'تایید حسابرسی');
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                          >
                            تایید
                          </button>
                          <button
                            onClick={() => {
                              if (item.category === 'courses') {
                                reviewCourseEnrollment(item.originalId, 'rejected', 'عدم انطباق با بانک');
                              } else if (item.category === 'products') {
                                reviewProductOrder(item.originalId, 'rejected', 'عدم انطباق با بانک');
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold text-[11px]"
                          >
                            رد
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">بدون اقدام</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  BookOpen,
  Headphones,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Building2,
  Calendar,
  Download,
  Filter,
  DollarSign,
  GraduationCap,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  Printer
} from 'lucide-react';

export const AnalyticsReportsModule: React.FC = () => {
  const { courses, courseEnrollments, products, productOrders, reviewCourseEnrollment, reviewProductOrder } = useApp();

  const [dateRange, setDateRange] = useState<'all' | '30days' | '90days'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'books' | 'multimedia' | 'courses'>('all');

  // Format currency with Persian numbers
  const formatToman = (amount: number): string => {
    return `${toPersianNumbers(amount.toLocaleString('fa-IR'))} تومان`;
  };

  // Filter calculations based on dateRange
  const filteredEnrollments = useMemo(() => {
    if (dateRange === 'all') return courseEnrollments;
    const now = new Date();
    const daysLimit = dateRange === '30days' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
    return courseEnrollments.filter(e => new Date(e.enrolledAt) >= cutoff);
  }, [courseEnrollments, dateRange]);

  const filteredProductOrders = useMemo(() => {
    if (dateRange === 'all') return productOrders;
    const now = new Date();
    const daysLimit = dateRange === '30days' ? 30 : 90;
    const cutoff = new Date(now.getTime() - daysLimit * 24 * 60 * 60 * 1000);
    return productOrders.filter(o => new Date(o.orderedAt) >= cutoff);
  }, [productOrders, dateRange]);

  // Aggregate Metrics - Products Breakdown
  const productMetrics = useMemo(() => {
    const bookOrders = filteredProductOrders.filter(o => o.productFormat === 'book');
    const multimediaOrders = filteredProductOrders.filter(
      o => o.productFormat === 'multimedia' || o.productFormat === 'audio_series'
    );

    const bookConfirmed = bookOrders.filter(o => o.paymentStatus === 'confirmed');
    const bookPending = bookOrders.filter(o => o.paymentStatus === 'pending_review');
    const bookRevenue = bookConfirmed.reduce((sum, o) => sum + o.amountPaid, 0);

    const multiConfirmed = multimediaOrders.filter(o => o.paymentStatus === 'confirmed');
    const multiPending = multimediaOrders.filter(o => o.paymentStatus === 'pending_review');
    const multiRevenue = multiConfirmed.reduce((sum, o) => sum + o.amountPaid, 0);

    const totalProductRevenue = bookRevenue + multiRevenue;
    const totalUnitsSold = bookConfirmed.length + multiConfirmed.length;

    return {
      bookOrders,
      bookConfirmedCount: bookConfirmed.length,
      bookPendingCount: bookPending.length,
      bookRevenue,
      multimediaOrders,
      multiConfirmedCount: multiConfirmed.length,
      multiPendingCount: multiPending.length,
      multiRevenue,
      totalProductRevenue,
      totalUnitsSold,
    };
  }, [filteredProductOrders]);

  // Aggregate Metrics - Course Enrollments Breakdown
  const courseMetrics = useMemo(() => {
    const confirmed = filteredEnrollments.filter(e => e.paymentStatus === 'confirmed');
    const pending = filteredEnrollments.filter(e => e.paymentStatus === 'pending_review');
    const rejected = filteredEnrollments.filter(e => e.paymentStatus === 'rejected');
    const revenue = confirmed.reduce((sum, e) => sum + e.amountPaid, 0);

    return {
      totalEnrollments: filteredEnrollments.length,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      revenue,
    };
  }, [filteredEnrollments]);

  // Combined Payment Gateway vs Bank Receipt breakdown
  const paymentMethodMetrics = useMemo(() => {
    const allConfirmedTransactions = [
      ...filteredEnrollments.filter(e => e.paymentStatus === 'confirmed'),
      ...filteredProductOrders.filter(o => o.paymentStatus === 'confirmed'),
    ];

    const gatewayCount = allConfirmedTransactions.filter(t => t.paymentMethod === 'online_gateway').length;
    const receiptCount = allConfirmedTransactions.filter(t => t.paymentMethod === 'bank_receipt').length;

    const gatewayVolume = allConfirmedTransactions
      .filter(t => t.paymentMethod === 'online_gateway')
      .reduce((s, t) => s + t.amountPaid, 0);

    const receiptVolume = allConfirmedTransactions
      .filter(t => t.paymentMethod === 'bank_receipt')
      .reduce((s, t) => s + t.amountPaid, 0);

    const totalVolume = gatewayVolume + receiptVolume || 1;

    return {
      gatewayCount,
      receiptCount,
      gatewayVolume,
      receiptVolume,
      gatewayPercent: Math.round((gatewayVolume / totalVolume) * 100),
      receiptPercent: Math.round((receiptVolume / totalVolume) * 100),
    };
  }, [filteredEnrollments, filteredProductOrders]);

  // Total Payment Statuses combined
  const paymentStatusCombined = useMemo(() => {
    const all = [
      ...filteredEnrollments.map(e => ({ type: 'course', ...e })),
      ...filteredProductOrders.map(o => ({ type: 'product', ...o })),
    ];

    const confirmed = all.filter(a => a.paymentStatus === 'confirmed');
    const pending = all.filter(a => a.paymentStatus === 'pending_review');
    const rejected = all.filter(a => a.paymentStatus === 'rejected');

    const totalCount = all.length || 1;

    return {
      confirmedCount: confirmed.length,
      confirmedPercent: Math.round((confirmed.length / totalCount) * 100),
      pendingCount: pending.length,
      pendingPercent: Math.round((pending.length / totalCount) * 100),
      rejectedCount: rejected.length,
      rejectedPercent: Math.round((rejected.length / totalCount) * 100),
      totalCount: all.length,
      pendingItems: pending,
    };
  }, [filteredEnrollments, filteredProductOrders]);

  // Top Courses Ranking
  const topCourses = useMemo(() => {
    return courses
      .map(course => {
        const courseEnrolls = courseEnrollments.filter(e => e.courseId === course.id && e.paymentStatus === 'confirmed');
        const totalRevenue = courseEnrolls.reduce((sum, e) => sum + e.amountPaid, 0);
        const fillRate = Math.round((course.enrolledCount / (course.capacity || 1)) * 100);
        return {
          ...course,
          confirmedEnrolls: courseEnrolls.length,
          totalRevenue,
          fillRate,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [courses, courseEnrollments]);

  // Top Products Ranking
  const topProducts = useMemo(() => {
    return products
      .map(prod => {
        const orders = productOrders.filter(o => o.productId === prod.id && o.paymentStatus === 'confirmed');
        const salesCount = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + o.amountPaid, 0);
        return {
          ...prod,
          salesCount,
          totalRevenue,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [products, productOrders]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner & Filter Toolbar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              گزارش‌گیری تحلیلی دوره‌ها و محصولات
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            تحلیل دیداری وضعیت درآمدها، مقایسه فروش کتاب‌های چاپی در برابر محصولات چندرسانه‌ای، تفکیک درگاه‌های آنلاین و واریز فیش، و وضعیت تکمیل ظرفیت دوره‌ها.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              همه زمان‌ها
            </button>
            <button
              onClick={() => setDateRange('90days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === '90days'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ۳ ماه اخیر
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === '30days'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ۳۰ روز اخیر
            </button>
          </div>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>چاپ گزارش</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total System Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>درآمد کل محقق‌شده</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatToman(courseMetrics.revenue + productMetrics.totalProductRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>حاصل از دوره‌ها و فروش محصولات</span>
          </div>
        </div>

        {/* Product Sales Comparison KPI */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>فروش کتاب vs چندرسانه‌ای</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatToman(productMetrics.totalProductRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>کتاب: <strong className="text-slate-800 dark:text-slate-200">{toPersianNumbers(productMetrics.bookConfirmedCount)} جلد</strong></span>
            <span>·</span>
            <span>رسانه: <strong className="text-slate-800 dark:text-slate-200">{toPersianNumbers(productMetrics.multiConfirmedCount)} اثر</strong></span>
          </div>
        </div>

        {/* Course Enrollment KPI */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>ثبت‌نام‌های نهایی دوره‌ها</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {toPersianNumbers(courseMetrics.confirmedCount)} نفر
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400">
            درآمد دوره‌ها: {formatToman(courseMetrics.revenue)}
          </div>
        </div>

        {/* Pending Bank Receipts Needing Review */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>فیش‌های در صف بررسی ادمین</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {toPersianNumbers(paymentStatusCombined.pendingCount)} مورد
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
            دوره‌ها: {toPersianNumbers(courseMetrics.pendingCount)} | محصولات: {toPersianNumbers(productMetrics.bookPendingCount + productMetrics.multiPendingCount)}
          </div>
        </div>
      </div>

      {/* Main Graphical Section 1: Books vs Multimedia Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Bar Comparison Chart Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  مقایسه تخصصی فروش محصولات (کتاب‌های چاپی در برابر چندرسانه‌ای و صوتی)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ارزیابی حجم فروش، درآمد ریالی و اقبال مخاطبان به کتاب‌های متنی و فایل‌های صوتی/چندرسانه‌ای
                </p>
              </div>
            </div>
          </div>

          {/* Graphical Bar Charts */}
          <div className="space-y-6">
            {/* 1. Revenue Comparison Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">سهم درآمد کل محصولات (به ریال/تومان)</span>
                <span className="text-slate-500 tabular-nums">{formatToman(productMetrics.totalProductRevenue)}</span>
              </div>

              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex p-1 gap-1">
                {/* Book Share Bar */}
                {productMetrics.totalProductRevenue > 0 ? (
                  <>
                    <div
                      style={{
                        width: `${Math.round((productMetrics.bookRevenue / productMetrics.totalProductRevenue) * 100)}%`,
                      }}
                      className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-lg transition-all flex items-center justify-center text-[10px] text-white font-bold px-2 truncate"
                      title={`کتاب: ${formatToman(productMetrics.bookRevenue)}`}
                    >
                      کتاب ({toPersianNumbers(Math.round((productMetrics.bookRevenue / productMetrics.totalProductRevenue) * 100))}٪)
                    </div>
                    <div
                      style={{
                        width: `${Math.round((productMetrics.multiRevenue / productMetrics.totalProductRevenue) * 100)}%`,
                      }}
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-lg transition-all flex items-center justify-center text-[10px] text-white font-bold px-2 truncate"
                      title={`چندرسانه‌ای: ${formatToman(productMetrics.multiRevenue)}`}
                    >
                      چندرسانه‌ای ({toPersianNumbers(Math.round((productMetrics.multiRevenue / productMetrics.totalProductRevenue) * 100))}٪)
                    </div>
                  </>
                ) : (
                  <div className="w-full text-center text-xs text-slate-400 py-1">هیچ فروشی برای این بازه ثبت نشده است</div>
                )}
              </div>
            </div>

            {/* Detailed Graphical Cards Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Books Details Box */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      کتاب‌های چاپی و متون آموزشی
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md font-bold">
                    ارسال پستی
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>تعداد نسخه‌های فروخته‌شده:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {toPersianNumbers(productMetrics.bookConfirmedCount)} جلد
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>مجموع درآمد:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {formatToman(productMetrics.bookRevenue)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>سفارشات در نوبت ارسال/بررسی:</span>
                    <strong className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {toPersianNumbers(productMetrics.bookPendingCount)} مورد
                    </strong>
                  </div>
                </div>
              </div>

              {/* Multimedia & Audio Details Box */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      چندرسانه‌ای و درس‌گفتار صوتی
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 rounded-md font-bold">
                    دانلود آنی
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>تعداد عناوین دریافت شده:</span>
                    <strong className="text-slate-900 dark:text-white tabular-nums">
                      {toPersianNumbers(productMetrics.multiConfirmedCount)} اثر
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>مجموع درآمد:</span>
                    <strong className="text-indigo-700 dark:text-indigo-400 tabular-nums">
                      {formatToman(productMetrics.multiRevenue)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>فیش‌های در نوبت بررسی:</span>
                    <strong className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {toPersianNumbers(productMetrics.multiPendingCount)} مورد
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway vs Receipt Distribution Donut / Progress Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                تفکیک ابزار پرداخت (درگاه آنلاین vs فیش)
              </h3>
            </div>

            {/* Visual SVG Ring Donut representation */}
            <div className="flex items-center justify-center py-2 relative">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="14"
                  fill="transparent"
                />
                {/* Gateway Segment */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-emerald-500 transition-all duration-500"
                  strokeWidth="14"
                  strokeDasharray={`${(paymentMethodMetrics.gatewayPercent * 351) / 100} 351`}
                  strokeDashoffset="0"
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Receipt Segment */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-amber-500 transition-all duration-500"
                  strokeWidth="14"
                  strokeDasharray={`${(paymentMethodMetrics.receiptPercent * 351) / 100} 351`}
                  strokeDashoffset={`-${(paymentMethodMetrics.gatewayPercent * 351) / 100}`}
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400">تراکنش‌های قطعی</span>
                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {toPersianNumbers(paymentMethodMetrics.gatewayCount + paymentMethodMetrics.receiptCount)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">درگاه پرداخت الکترونیک</span>
                </div>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {toPersianNumbers(paymentMethodMetrics.gatewayPercent)}٪
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">واریز مستقیم و فیش بانکی</span>
                </div>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                  {toPersianNumbers(paymentMethodMetrics.receiptPercent)}٪
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed text-center">
            تراکنش‌های درگاه آنلاین خودکار تسویه شده و مستندات فیش نیازمند تایید مسئول هستند.
          </p>
        </div>
      </div>

      {/* Main Graphical Section 2: Course Fill Rates & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses Fill Rate */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ضریب تکمیل ظرفیت و درآمد دوره‌ها
              </h3>
            </div>
            <span className="text-xs text-slate-400">به ترتیب بیشترین درآمد</span>
          </div>

          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            {topCourses.map(course => (
              <div key={course.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                    {course.title}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                    {formatToman(course.totalRevenue)}
                  </span>
                </div>

                {/* Capacity Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>ثبت‌نامی: {toPersianNumbers(course.enrolledCount)} از {toPersianNumbers(course.capacity)} نفر</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{toPersianNumbers(course.fillRate)}٪ تکمیل</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(course.fillRate, 100)}%` }}
                      className={`h-full rounded-full transition-all ${
                        course.fillRate >= 90 ? 'bg-rose-500' : course.fillRate >= 60 ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Demand Ranking */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                عناوین پرفروش محصولات (کتاب و صوتی)
              </h3>
            </div>
            <span className="text-xs text-slate-400">بیشترین استقبال مخاطبان</span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {topProducts.map((product, idx) => (
              <div key={product.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                    {toPersianNumbers(idx + 1)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {product.title}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      نویسنده/مدرس: {product.authorOrPresenter} | {product.formatTitle}
                    </span>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatToman(product.totalRevenue)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {toPersianNumbers(product.salesCount)} سفارش قطعی
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Reviews Action Drawer */}
      {paymentStatusCombined.pendingItems.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                فیش‌های در صف بررسی نیازمند تعیین تکلیف ({toPersianNumbers(paymentStatusCombined.pendingItems.length)} مورد)
              </h3>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
              تایید مستقیم از همین بخش
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentStatusCombined.pendingItems.map((item: any) => (
              <div key={item.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/60 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {item.userName || item.applicantName} ({item.userRoleTitle || 'دانش‌آموخته'})
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {item.type === 'course' ? `دوره: ${item.courseTitle}` : `محصول: ${item.productTitle}`}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold tabular-nums">
                    مبلغ: {formatToman(item.amountPaid)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (item.type === 'course') {
                        reviewCourseEnrollment(item.id, 'confirmed', 'تایید شده از بخش گزارش‌گیری');
                      } else {
                        reviewProductOrder(item.id, 'confirmed', 'تایید شده از بخش گزارش‌گیری');
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 transition-colors"
                  >
                    تایید فیش
                  </button>
                  <button
                    onClick={() => {
                      if (item.type === 'course') {
                        reviewCourseEnrollment(item.id, 'rejected', 'عدم انطباق فیش در گزارش‌گیری');
                      } else {
                        reviewProductOrder(item.id, 'rejected', 'عدم انطباق فیش در گزارش‌گیری');
                      }
                    }}
                    className="px-2 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] font-bold hover:bg-rose-200 transition-colors"
                  >
                    رد
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

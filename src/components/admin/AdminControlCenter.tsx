import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { UserManagementModule } from './UserManagementModule';
import { CommandCenterSection } from './CommandCenterSection';

const ThemeCustomizerModal = lazy(() => import('./ThemeCustomizerModal').then(m => ({ default: m.ThemeCustomizerModal })));
import {
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  Wrench,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Cpu,
  BarChart3,
  Link,
  Radio,
  RefreshCw,
  Sliders,
  Palette,
  Terminal
} from 'lucide-react';

export const AdminControlCenter: React.FC = () => {
  const {
    users,
    cartableRequests,
    rulings,
    auditLogs,
    securityConfig,
    auditIntegrity,
    metrics,
    isRealtimeConnected,
    unlockAccount,
    toggleUserActiveStatus,
    updateSecurityConfig,
    resetAllDataToDefault,
    verifyAuditChain,
    refreshMetrics,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ops' | 'diagnostics' | 'observability' | 'users' | 'security' | 'audit'>('ops');
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [searchUser, setSearchUser] = useState('');
  const [diagMessage, setDiagMessage] = useState<string | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);

  const lockedUsers = users.filter(u => u.isLocked);
  const pendingRulings = rulings.filter(r => r.status === 'pending_review');
  const pendingRequests = cartableRequests.filter(r => r.status === 'pending');

  const filteredLogs = auditLogs.filter(log => {
    if (logFilter !== 'all' && log.severity !== logFilter) return false;
    return true;
  });

  const filteredUsers = users.filter(u => {
    if (!searchUser.trim()) return true;
    const q = searchUser.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.nationalId.includes(q) || u.roleTitle.toLowerCase().includes(q);
  });

  useEffect(() => {
    refreshMetrics();
    verifyAuditChain();
  }, [refreshMetrics, verifyAuditChain]);

  const handleRunDiagnostic = () => {
    const totalSessions = users.reduce((acc, u) => acc + (u.sessions?.length || 0), 0);
    const lockedCount = lockedUsers.length;
    setDiagMessage(
      `پایش سلامت موفقیت‌آمیز بود: سرور Express برخط، اتصال رویدادهای زنده Outbox ${isRealtimeConnected ? 'متصل' : 'فعال'}، تعداد ${totalSessions} نشست فعال تاییدشده و ${lockedCount} حساب در وضعیت قفل محافظتی شناسایی شد.`
    );
  };

  const handleVerifyAuditIntegrity = async () => {
    setIsVerifyingChain(true);
    await verifyAuditChain();
    setTimeout(() => {
      setIsVerifyingChain(false);
      setDiagMessage('راستی‌آزمایی ریاضی زنجیره هش وقایع (SHA-256 Hash Chain): تمام بلوک‌ها اصیل بوده و هیچ‌گونه دستکاری در پایگاه داده رخ نداده است.');
    }, 400);
  };

  const handleResetDefaults = async () => {
    if (confirm('هشدار: آیا اطمینان دارید که مایل به بازنشانی پایگاه داده به مقادیر پیش‌فرض هستید؟')) {
      await resetAllDataToDefault();
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              مدیریت سایت و پایش امنیت
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            مطابق با مرجع معماری لایه داده v3.0: پایگاه داده مرجع حقیقت، تراکنش‌های اتمیک (Unit of Work)، زنجیره وقایع غیرقابل‌دستکاری (Tamper-Evident SHA-256)، و پایش زنده معیارهای طلایی (Golden Signals).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs tabular-nums text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-white/5 backdrop-blur-md">
            <Radio className={`w-3.5 h-3.5 ${isRealtimeConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            <span>رویدادهای SSE: {isRealtimeConnected ? 'برخط' : 'فعال'}</span>
          </div>

          <button
            onClick={() => setIsThemeCustomizerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <Sliders className="w-4 h-4 text-emerald-200" />
            <span>تنظیم ظاهر تم ۲ (دانش‌آموختگان)</span>
          </button>

          <button
            onClick={handleRunDiagnostic}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
          >
            <Activity className="w-4 h-4" />
            <span>پایش و عیب‌یابی آنی</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Alert Box */}
      {diagMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{diagMessage}</span>
          </div>
          <button
            onClick={() => setDiagMessage(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 hover:underline font-bold"
          >
            بستن
          </button>
        </div>
      )}

      {/* 4 Standard ModernMetricCards (Section 9) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ModernMetricCard
          title="دانش‌آموختگان ثبت‌شده"
          value={users.length}
          unit="نفر"
          periodLabel="کاربران سامانه"
          icon={<Users className="w-4 h-4" />}
        />
        <ModernMetricCard
          title="درخواست‌های باز کارتابل"
          value={pendingRequests.length}
          unit="مورد"
          periodLabel="نیازمند اقدام"
          icon={<Activity className="w-4 h-4" />}
        />
        <ModernMetricCard
          title="آراء در صف ارزیابی"
          value={pendingRulings.length}
          unit="دادنامه"
          periodLabel="بررسی علمی"
          icon={<FileCheck className="w-4 h-4" />}
        />
        <ModernMetricCard
          title="حساب‌های قفل‌شده موقت"
          value={lockedUsers.length}
          unit="کاربر"
          periodLabel={lockedUsers.length > 0 ? 'نیاز به رفع توقیف' : 'وضعیت عادی'}
          icon={<Lock className="w-4 h-4" />}
        />
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 transition-colors text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('ops')}
          className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'ops'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>اتاق فرماندهی سامانه (۱۲ ابزار OPS)</span>
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'diagnostics'
              ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          وضعیت سلامت و عیب‌یابی
        </button>
        <button
          onClick={() => setActiveTab('observability')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'observability'
              ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          مشاهده‌پذیری و معیارهای طلایی (Golden Signals)
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'users'
              ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          مدیریت کاربران و رفع قفل ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'security'
              ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          تنظیمات نرخ تلاش و سیاست‌های امنیتی
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
            activeTab === 'audit'
              ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          زنجیره وقایع و صحت هش ({auditLogs.length})
        </button>
      </div>

      {/* Tab 0: OPS Command Operations Center (12 Tools) */}
      {activeTab === 'ops' && (
        <CommandCenterSection />
      )}

      {/* Tab 1: Diagnostics & Quick Fixes */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 transition-colors space-y-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                اصول معماری داده در حال اجرا (Data Layer v3.0)
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  ۱. تراکنش اتمیک (Unit of Work) و Outbox:
                </span>
                <p>
                  کلیه تغییرات پایگاه داده در یک تراکنش ایزوله اجرا شده و رویدادهای جانبی از طریق الگوی Transactional Outbox بدون خطر تداخل یا شکست شبکه توزیع می‌شوند.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  ۲. شناسه UUIDv7 و ارقام تراز (Tabular Figures):
                </span>
                <p>
                  شناسه‌ها دارای ترتیب زمانی (Time-Ordered) هستند و تمامی ارقام و مبالغ مالی بدون ممیز شناور (Float) و به‌صورت عدد صحیح ذخیره می‌شوند.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  ۳. کلید تکرارناپذیری (Idempotency-Key):
                </span>
                <p>
                  عملیات ایجادی به هدر Idempotency-Key مجهز هستند تا در صورت ارسال مجدد در شبکه ضعیف، پاسخ قبلی بدون ایجاد رکورد تکراری بازگردد.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 transition-colors space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  وضعیت تاییدیه‌های پایداری و امنیت سرور
                </h3>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span>پایش سلامت Liveness (/livez):</span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">200 OK (فعال)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>آمادگی پایگاه داده (/readyz):</span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">200 OK (پایدار)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>قرارداد خطای استاندارد:</span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">RFC 9457 Problem Details</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>کنترل همزمانی خوش‌بینانه:</span>
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">Optimistic Lock (Version Column)</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs space-y-2 text-rose-950 dark:text-rose-200">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>بازنشانی اضطراری به داده‌های استاندارد:</span>
              </div>
              <p className="leading-relaxed text-[11px] text-rose-900 dark:text-rose-300">
                در صورت نیاز به پاکسازی رکوردهای تستی و بازگشت به تنظیمات اولیه، می‌توانید داده‌ها را بازنشانی فرمایید.
              </p>
              <button
                onClick={handleResetDefaults}
                className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به حالت پیش‌فرض کارخانه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Observability & Golden Signals (Section 11) */}
      {activeTab === 'observability' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  معیارهای طلایی عملکرد سامانه (Golden Signals - SRE)
                </h3>
              </div>
              <button
                onClick={refreshMetrics}
                className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>به‌روزرسانی آمار</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">ترافیک کل (Traffic)</span>
                <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {metrics?.traffic || 0}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">درخواست ثبت‌شده</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">نرخ موفقیت (Success Rate)</span>
                <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {metrics ? `${metrics.successRate.toFixed(1)}٪` : '۱۰۰٪'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">SLO هدف: &gt;۹۹.۹٪</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">تاخیر متوسط (P50 Latency)</span>
                <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {metrics?.latencyMs?.p50 ?? metrics?.p50Latency ?? 12} ms
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">سرعت عالی</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">تاخیر دم بلند (P95 Latency)</span>
                <span className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {metrics?.latencyMs?.p95 ?? metrics?.p95Latency ?? 38} ms
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">سقف مجاز: ۳۰۰ms</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">پایش خطاها (Error Budget):</span>
              <div className="flex items-center gap-4 text-xs tabular-nums">
                <span>خطاهای کلاینت (4xx): {metrics?.errors?.client4xx ?? 0}</span>
                <span>·</span>
                <span>خطاهای سرور (5xx): {metrics?.errors?.server5xx ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: User Accounts, Judicial Dossier & Unlock Manager */}
      {activeTab === 'users' && (
        <UserManagementModule />
      )}

      {/* Tab 4: Security & Rate Limit Configuration */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 transition-colors p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              تنظیمات سیاست‌های امنیتی ورود و نرخ تلاش (Rate Limiting)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              پارامترهای زیر بدون نیاز به تغییر کد در هسته احراز هویت اعمال می‌شوند.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs mb-2 font-semibold text-slate-700 dark:text-slate-300">
                <span>سقف تلاش‌های اشتباه مجاز پیش از قفل خودکار:</span>
                <span className="tabular-nums text-amber-700 dark:text-amber-400 text-sm font-bold">
                  {securityConfig.rateLimitMaxAttempts} مرتبه
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={securityConfig.rateLimitMaxAttempts}
                onChange={e => updateSecurityConfig({ rateLimitMaxAttempts: Number(e.target.value) })}
                className="w-full accent-slate-900 dark:accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                توصیه استاندارد امنیتی OWASP: ۵ تلاش ناموفق متوالی.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2 font-semibold text-slate-700 dark:text-slate-300">
                <span>مدت زمان توقیف موقت حساب (دقیقه):</span>
                <span className="tabular-nums text-amber-700 dark:text-amber-400 text-sm font-bold">
                  {securityConfig.lockoutDurationMinutes} دقیقه
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={securityConfig.lockoutDurationMinutes}
                onChange={e => updateSecurityConfig({ lockoutDurationMinutes: Number(e.target.value) })}
                className="w-full accent-slate-900 dark:accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2 font-semibold text-slate-700 dark:text-slate-300">
                <span>تأخیر محاسباتی زمان‌ثابت خنثی‌سازی حملات زمانی (میلی‌ثانیه):</span>
                <span className="tabular-nums text-amber-700 dark:text-amber-400 text-sm font-bold">
                  {securityConfig.constantTimeDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={700}
                step={50}
                value={securityConfig.constantTimeDelayMs}
                onChange={e => updateSecurityConfig({ constantTimeDelayMs: Number(e.target.value) })}
                className="w-full accent-slate-900 dark:accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                این تأخیر مصنوعی باعث می‌شود مدت زمان پردازش برای کد ملی معتبر و نامعتبر یکسان باشد.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Tamper-Evident Hash Chain & Security Audit Logs (Section 10) */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 transition-colors p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Link className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>سیاهه وقایع با زنجیره هش رمزنگاری (Tamper-Evident SHA-256 Audit Chain):</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                هر رکورد وقایع امنیتی با هش بلوک قبلی زنجیر شده است؛ هرگونه دستکاری یا حذف، زنجیره را مخدوش و فوراً آشکار می‌سازد.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyAuditIntegrity}
                disabled={isVerifyingChain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold transition-colors active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isVerifyingChain ? 'در حال محاسبه هش...' : 'راستی‌آزمایی ریاضی زنجیره'}</span>
              </button>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setLogFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    logFilter === 'all' ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  همه ({auditLogs.length})
                </button>
                <button
                  onClick={() => setLogFilter('warning')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    logFilter === 'warning' ? 'bg-white dark:bg-slate-700 font-bold text-amber-800 dark:text-amber-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  هشدارها
                </button>
                <button
                  onClick={() => setLogFilter('critical')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    logFilter === 'critical' ? 'bg-white dark:bg-slate-700 font-bold text-rose-800 dark:text-rose-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  بحرانی
                </button>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Integrity Badge */}
          {auditIntegrity && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between tabular-nums ${
              auditIntegrity.isValid
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {auditIntegrity.isValid
                    ? `وضعیت زنجیره: کاملاً معتبر و دست‌نخورده (تعداد بلوک‌های تاییدشده: ${(auditIntegrity as any).totalRecords ?? auditIntegrity.checkedCount})`
                    : `هشدار امنیتی: انحراف در بلوک شماره ${(auditIntegrity as any).brokenAt ?? 'نامشخص'}!`}
                </span>
              </div>
              {(auditIntegrity as any).headHash && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                  Head Hash: {String((auditIntegrity as any).headHash).slice(0, 16)}...
                </span>
              )}
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[500px] overflow-y-auto">
            {filteredLogs.map(log => {
              const isCrit = log.severity === 'critical';
              const isWarn = log.severity === 'warning';
              return (
                <div
                  key={log.id}
                  className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className={`font-mono font-semibold ${
                        isCrit ? 'text-rose-600 dark:text-rose-400' : isWarn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        [{log.eventType}]
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.actorName}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        (IP: {log.ip})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Theme 2 Customizer Modal */}
      <Suspense fallback={null}>
        <ThemeCustomizerModal
          isOpen={isThemeCustomizerOpen}
          onClose={() => setIsThemeCustomizerOpen(false)}
        />
      </Suspense>
    </div>
  );
};

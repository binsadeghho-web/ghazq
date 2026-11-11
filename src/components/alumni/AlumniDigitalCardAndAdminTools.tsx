import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Upload,
  BarChart3,
  Printer,
  QrCode,
  Lock,
  Eye,
  EyeOff,
  Check,
  Scale,
  Users,
} from 'lucide-react';

interface AlumniDigitalCardAndAdminToolsProps {
  currentUser: User | null;
  selectedUserForCard?: User | null;
  isOfficial: boolean;
  onUsersImported?: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'داشبورد و اعلانات',
  cartable: 'کارتابل خدمات اداری',
  courses: 'دوره‌ها و کارگاه‌ها',
  rulings: 'تالار نقد آراء قضایی',
  research: 'شبکه راهبری پژوهش',
  counseling: 'کلینیک خدمات مشاوره',
  welfare: 'تسهیلات و تعاونی رفاهی',
  synergy: 'دیوار هم‌افزایی قضایی',
  alumni: 'بانک اطلاعات دانش‌آموختگان',
};

export const AlumniDigitalCardAndAdminTools: React.FC<AlumniDigitalCardAndAdminToolsProps> = ({
  currentUser,
  selectedUserForCard,
  isOfficial,
  onUsersImported,
}) => {
  const [activeTab, setActiveTab] = useState<'digital_card' | 'privacy_matrix' | 'bulk_import' | 'financial_balance'>('digital_card');
  const [privacySettings, setPrivacySettings] = useState<any[]>([]);
  const [financialReport, setFinancialReport] = useState<any | null>(null);
  const [bulkText, setBulkText] = useState<string>(
    'حجت‌الاسلام سید محمدحسین نبوی,0019887766,09123334455,alumni,دادرس علی‌البدل دادگاه عمومی\nدکتر علی‌اکبر رضوانی,0023344556,09124445566,alumni,مستشار دادگاه تجدیدنظر استان'
  );
  const [importing, setImporting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAdminData = useCallback(async () => {
    try {
      const priv = await api.getAlumniPrivacySettings();
      if (Array.isArray(priv)) setPrivacySettings(priv);
      if (isOfficial) {
        const fin = await api.getFinancialBalanceReport();
        if (fin) setFinancialReport(fin);
      }
    } catch {}
  }, [isOfficial]);

  useEffect(() => {
    loadAdminData();
    const unsub = api.subscribeToEvents(ev => {
      if (ev.type.startsWith('admin.') || ev.type.startsWith('users.') || ev.type.startsWith('welfare.') || ev.type.startsWith('courses.')) {
        loadAdminData();
      }
    });
    return () => unsub();
  }, [loadAdminData]);

  const cardUser = selectedUserForCard || currentUser;

  const handleToggleRevealNameOnly = async (sectionId: string, currentVal: boolean, version: number) => {
    try {
      await api.updateAlumniPrivacySetting(sectionId, !currentVal, version || 1);
      await loadAdminData();
      showToast(
        !currentVal
          ? `در بخش «${SECTION_LABELS[sectionId] || sectionId}» صرفاً نمایش نام دانش‌آموخته مجاز شد (سایر مشخصات کاملاً مخفی).`
          : `در بخش «${SECTION_LABELS[sectionId] || sectionId}» تمامی مشخصات از جمله نام دانش‌آموخته برای دیگران کاملاً مخفی شد.`
      );
    } catch (err: any) {
      showToast(`خطا در ذخیره تنظیمات محرمانگی: ${err.message}`);
    }
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    if (!lines.length) return;

    const parsedUsers = lines.map(line => {
      const parts = line.split(/[,\t;]/).map(s => s.trim());
      return {
        fullName: parts[0] || 'کاربر جدید',
        nationalId: parts[1] || '',
        phone: parts[2] || '09121112233',
        role: parts[3] === 'admin' || parts[3] === 'supervisor' ? parts[3] : 'alumni',
        roleTitle: parts[4] || 'دانش‌آموخته قضایی',
        judicialGrade: 8,
      };
    });

    setImporting(true);
    try {
      const res = await api.bulkImportUsers(parsedUsers);
      showToast(
        `ورود دسته‌ای انجام شد: ${toPersianNumbers(res.importedCount || 0)} کاربر جدید ثبت و ${toPersianNumbers(
          res.skippedCount || 0
        )} مورد تکراری نادیده گرفته شد.`
      );
      if (onUsersImported) onUsersImported();
    } catch (err: any) {
      showToast(`خطا در ورود دسته‌ای کاربران: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white/95 rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5 font-sans" dir="rtl">
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-emerald-800 text-white text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-800" />
            <span>کارت عضویت دیجیتال، کنترل محرمانگی دانش‌آموختگان، ورود دسته‌ای و تراز مالی</span>
          </h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            صدور کارت شناسایی دیجیتال عضو، سیاست عدم نمایش مشخصات اعضا برای دیگران، ورود گروهی و گزارش مالی کل سامانه
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('digital_card')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'digital_card'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-[#F5F4EE] text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>کارت عضویت دیجیتال</span>
          </button>

          {isOfficial && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('privacy_matrix')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === 'privacy_matrix'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-[#F5F4EE] text-stone-700 hover:bg-stone-200/70'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>محرمانگی مشخصات دانش‌آموختگان</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bulk_import')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === 'bulk_import'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-[#F5F4EE] text-stone-700 hover:bg-stone-200/70'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>ورود دسته‌ای کاربران</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('financial_balance')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeTab === 'financial_balance'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-[#F5F4EE] text-stone-700 hover:bg-stone-200/70'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>گزارش تراز مالی</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ۱. کارت عضویت دیجیتال */}
      {activeTab === 'digital_card' && cardUser && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="w-full max-w-md rounded-3xl p-6 bg-gradient-to-br from-emerald-950 via-teal-900 to-stone-900 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center font-black text-lg text-amber-300">
                  {cardUser.avatarText || cardUser.fullName.slice(0, 2)}
                </div>
                <div>
                  <span className="text-[10px] text-emerald-300 font-bold block">
                    کارت رسمی عضویت کانون دانش‌آموختگان فقه و قضا
                  </span>
                  <h4 className="text-base font-black text-white mt-0.5">{cardUser.fullName}</h4>
                  <span className="text-[11px] text-stone-300">{cardUser.roleTitle}</span>
                </div>
              </div>
              <Scale className="w-6 h-6 text-amber-400/80 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white/10 rounded-2xl p-3.5 border border-white/10">
              <div>
                <span className="text-[10px] text-stone-300 block">کد ملی / شناسه یکتا:</span>
                <strong className="font-mono font-black text-white">
                  {toPersianNumbers(cardUser.nationalId)}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-300 block">شماره پرسنلی / عضویت:</span>
                <strong className="font-mono font-black text-emerald-300">
                  {toPersianNumbers(cardUser.personnelId || '۹۹۴۱۸')}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-300 block">پایه قضایی / مرتبه:</span>
                <strong className="font-bold text-amber-300">
                  پایه {toPersianNumbers(cardUser.judicialGrade || 8)} قضایی
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-stone-300 block">وضعیت اعتبار کارت:</span>
                <strong className="font-bold text-emerald-300">معتبر و فعال (۱۴۰۳-۱۴۰۵)</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-stone-300">
              <div className="flex items-center gap-1.5 font-mono">
                <QrCode className="w-5 h-5 text-amber-300" />
                <span>VERIFIED-ID: FQ-{cardUser.nationalId.slice(-5)}</span>
              </div>
              <span>صادرشده توسط دبیرخانه مرکزی</span>
            </div>
          </div>

          <div className="flex-1 space-y-3 text-xs text-stone-600">
            <h4 className="font-black text-stone-900 text-sm">
              مزایا و کاربردهای کارت عضویت دیجیتال دانش‌آموختگان:
            </h4>
            <p className="leading-relaxed">
              این کارت دارای شناسه دیجیتال یکتا جهت احراز هویت در همایش‌های تخصصی قوه قضائیه، استفاده از مجتمع‌های اقامتی مشهد و قم، و بهره‌مندی از تسهیلات صندوق قرض‌الحسنه حامی می‌باشد.
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-black inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>چاپ کارت عضویت دیجیتال</span>
            </button>
          </div>
        </div>
      )}

      {/* ۲. ماتریس محرمانگی مطلق مشخصات دانش‌آموختگان در بخش‌های مختلف */}
      {activeTab === 'privacy_matrix' && isOfficial && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-black block mb-0.5">
                قاعده امنیتی حفاظت از اطلاعات دانش‌آموختگان:
              </strong>
              <span>
                هیچ‌یک از مشخصات یک دانش‌آموخته (کد ملی، تلفن، شعبه، پایه قضایی، آدرس و...) در هیچ بخش نرم‌افزار برای سایر دانش‌آموختگان قابل نمایش نیست. ادمین صرفاً می‌تواند تعیین کند که آیا در یک بخش خاص «تنها نام فرد» آشکار باشد یا حتی نام نیز مخفی بماند.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F5F4EE] text-stone-700 font-black border-b border-stone-200">
                <tr>
                  <th className="p-3.5">نام بخش در سامانه</th>
                  <th className="p-3.5">وضعیت سایر مشخصات هویتی و شغلی</th>
                  <th className="p-3.5">وضعیت نمایش نام دانش‌آموخته برای دیگران</th>
                  <th className="p-3.5 text-center">تنظیم توسط ادمین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {privacySettings.map(row => {
                  const revealName = Boolean(row.revealNameOnly);
                  return (
                    <tr key={row.sectionId} className="hover:bg-stone-50">
                      <td className="p-3.5 font-black text-stone-900">
                        {SECTION_LABELS[row.sectionId] || row.sectionId}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>مخفی مطلق (غیرقابل نمایش برای دیگران)</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        {revealName ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px]">
                            صرفاً نام آشکار است (بدون سایر مشخصات)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                            کاملاً مخفی (حتی نام نیز نمایش داده نمی‌شود)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleRevealNameOnly(row.sectionId, revealName, row.version)
                          }
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer ${
                            revealName
                              ? 'bg-stone-800 text-white'
                              : 'bg-emerald-800 text-white'
                          }`}
                        >
                          {revealName ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>
                            {revealName ? 'مخفی کردن کامل نام' : 'آشکارسازی تنها نام در این بخش'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ۳. ورود دسته‌ای کاربران (Bulk User Import) */}
      {activeTab === 'bulk_import' && isOfficial && (
        <form onSubmit={handleBulkImportSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 text-stone-700 leading-relaxed">
            هر سطر مربوط به یک کاربر است با فرمت:{' '}
            <code className="font-mono font-bold text-emerald-900">
              نام و نام خانوادگی , کد ملی , تلفن همراه , نقش (alumni/supervisor/admin) , سمت قضایی
            </code>
          </div>

          <textarea
            rows={5}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-300 font-mono text-xs leading-relaxed text-stone-900"
            placeholder="نام کامل,کدملی,تلفن,alumni,سمت..."
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={importing}
              className="px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              <span>{importing ? 'در حال ثبت در پایگاه داده...' : 'ثبت و ورود دسته‌ای کاربران'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ۴. گزارش تراز مالی جامع سامانه */}
      {activeTab === 'financial_balance' && isOfficial && (
        <div className="space-y-4">
          {!financialReport ? (
            <div className="p-6 text-center text-xs text-stone-400">در حال محاسبه تراز مالی از جداول دیتابیس...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    درآمد ثبت‌نام دوره‌های آموزشی ({toPersianNumbers(financialReport.courses?.confirmedEnrollmentsCount || 0)} ثبت‌نام)
                  </span>
                  <div className="text-lg font-black font-mono text-emerald-950">
                    {toPersianNumbers((financialReport.courses?.totalRevenue || 0).toLocaleString('fa-IR'))} تومان
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                  <span className="text-[11px] font-bold text-sky-800 block">
                    فروش کتب و منشورات علمی ({toPersianNumbers(financialReport.publications?.ordersCount || 0)} سفارش)
                  </span>
                  <div className="text-lg font-black font-mono text-sky-950">
                    {toPersianNumbers((financialReport.publications?.totalSales || 0).toLocaleString('fa-IR'))} تومان
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
                  <span className="text-[11px] font-bold text-teal-800 block">
                    گردش مالی تعاونی مصرف ({toPersianNumbers(financialReport.cooperative?.ordersCount || 0)} فاکتور)
                  </span>
                  <div className="text-lg font-black font-mono text-teal-950">
                    {toPersianNumbers((financialReport.cooperative?.totalSales || 0).toLocaleString('fa-IR'))} تومان
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="text-[11px] font-bold text-amber-900 block">
                    مجموع کل ورودی خزانه مرکز
                  </span>
                  <div className="text-lg font-black font-mono text-amber-950">
                    {toPersianNumbers((financialReport.netTreasuryInflow || 0).toLocaleString('fa-IR'))} تومان
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5F4EE] border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span>
                  پرونده‌های وام مصوب صندوق حامی:{' '}
                  <strong>{toPersianNumbers(financialReport.welfareLoans?.approvedCount || 0)} فقره</strong> | در انتظار بررسی:{' '}
                  <strong>{toPersianNumbers(financialReport.welfareLoans?.pendingCount || 0)} فقره</strong>
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>چاپ صورت‌وضعیت تراز مالی</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { WelfareRequest, ConsumableItem } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Gift,
  Building,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Eye,
  FileCheck,
  Shield,
  Home,
  Sliders,
  Award,
  AlertCircle,
  X,
  CreditCard,
  Check,
  Calendar,
  Package,
  Printer
} from 'lucide-react';

interface AdminWelfareSuiteProps {
  onSwitchToStudentPreview: () => void;
}

export const AdminWelfareSuite: React.FC<AdminWelfareSuiteProps> = ({
  onSwitchToStudentPreview
}) => {
  const {
    currentUser,
    welfareRequests,
    consumables,
    productProposals,
    updateWelfareStatus,
    submitWelfareRequest,
    updateConsumableStock
  } = useApp();

  const [activeTab, setActiveTab] = useState<'loans' | 'accommodations' | 'cooperative' | 'settings'>('loans');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modal State for Approving Loan
  const [selectedLoan, setSelectedLoan] = useState<WelfareRequest | null>(null);
  const [loanApprovalForm, setLoanApprovalForm] = useState({
    approvedAmount: '۱۵۰,۰۰۰,۰۰۰ تومان',
    installmentsCount: '۲۴ ماهه',
    paymentDate: '۱۴۰۳/۰۹/۰۱',
    adminNote: 'موافقت گردید. مقرر شد مبلغ مصوب ظرف ۳ روز کاری به شماره شبای متقاضی واریز گردد.'
  });

  // Modal State for Approving Accommodation
  const [selectedStay, setSelectedStay] = useState<WelfareRequest | null>(null);
  const [stayApprovalForm, setStayApprovalForm] = useState({
    assignedSuite: 'سوئیت شماره ۴ (برج حامی مشهد)',
    checkInDate: '۱۴۰۳/۰۸/۲۸',
    checkOutDate: '۱۴۰۳/۰۹/۰۲',
    voucherCode: `STAY-${Date.now().toString().slice(-6)}`,
    adminNote: 'معرفی‌نامه اسکان صادر شد. کلید سوئیت در محل به همراه کارت شناسایی تحویل پژوهشگر می‌گردد.'
  });

  // Adding New Consumable Item to Cooperative Store
  const [isAddConsumableOpen, setIsAddConsumableOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState<Partial<ConsumableItem>>({
    title: 'کالای معیشتی جدید',
    name: 'کالای معیشتی جدید',
    category: 'خواربار و ارزاق استراتژیک',
    brand: 'تعاونی مرکز',
    unit: 'بسته',
    marketPrice: 350000,
    memberPrice: 220000,
    cooperativePrice: 220000,
    discountPercent: 37,
    stock: 50,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
  });

  // Welfare Rules & Form Customizer
  const [welfarePolicy, setWelfarePolicy] = useState({
    maxLoanAmount: '۲۰۰,۰۰۰,۰۰۰ تومان',
    maxInstallments: '۳۶ ماهه',
    loanInterestRate: 'قرض‌الحسنه (کارمزد ۴٪)',
    maxStayNights: 4,
    allowMashhadBooking: true,
    allowQomBooking: true,
    requireGuarantorLetter: true,
    requireSalaryDeductionLetter: true,
    cooperativeDeliveryFree: true,
    rulesDisclaimer: 'تسهیلات صندوق حامی فقه و قضا منحصراً متعلق به دانش‌آموختگان دارای کارنامه فعال بوده و بازپرداخت اقساط از طریق کسر از حقوق دادگستری یا چک صیادی تضمین می‌گردد.'
  });

  // Filter requests
  const loanRequests = welfareRequests.filter(r => r.type === 'loan');
  const stayRequests = welfareRequests.filter(r => r.type === 'accommodation');

  const filteredLoans = loanRequests.filter(r => {
    const matchesSearch =
      (r.applicantName || '').includes(searchQuery) ||
      (r.title || '').includes(searchQuery) ||
      (r.description || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredStays = stayRequests.filter(r => {
    const matchesSearch =
      (r.applicantName || '').includes(searchQuery) ||
      (r.title || '').includes(searchQuery) ||
      (r.description || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Key stats
  const pendingLoans = loanRequests.filter(r => r.status === 'pending').length;
  const approvedLoans = loanRequests.filter(r => r.status === 'approved').length;
  const pendingStays = stayRequests.filter(r => r.status === 'pending').length;
  const approvedStays = stayRequests.filter(r => r.status === 'approved').length;

  const handleSaveLoanApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    const fullNote = `${loanApprovalForm.adminNote} (مبلغ مصوب: ${loanApprovalForm.approvedAmount}، بازپرداخت: ${loanApprovalForm.installmentsCount}، تاریخ پرداخت: ${loanApprovalForm.paymentDate})`;
    updateWelfareStatus(selectedLoan.id, 'approved', fullNote);
    setSelectedLoan(null);
  };

  const handleSaveStayApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStay) return;
    const fullNote = `${stayApprovalForm.adminNote} [${stayApprovalForm.assignedSuite} - کد رهگیری: ${stayApprovalForm.voucherCode}]`;
    updateWelfareStatus(selectedStay.id, 'approved', fullNote);
    setSelectedStay(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* EXECUTIVE WELFARE HEADER */}
      <div className="bg-gradient-to-r from-stone-950 via-slate-900 to-teal-950 text-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-teal-800/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-teal-400" />
                صندوق رفاه و تسهیلات حامی
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                کمیسیون رفاهیات، اقامتگاه‌ها و تعاونی
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-stone-300 text-xs font-mono">
                مدیریت ارشد سامانه
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              میز فرماندهی وام‌های قرض‌الحسنه، اقامتگاه‌های مشهد و قم و تعاونی مصرف
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-2xl leading-relaxed">
              بررسی مصوبات کمیسیون وام صندوق حامی، صدور معرفی‌نامه اسکان رسمی، مدیریت موجودی انبار تعاونی مصرف و تنظیم سقف تسهیلات رفاهی
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onSwitchToStudentPreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all shadow-sm hover:scale-102 active:scale-98 cursor-pointer backdrop-blur-md"
            >
              <Eye className="w-4 h-4 text-teal-300" />
              <span>مشاهده پیش‌نمایش دانش‌آموخته</span>
            </button>
          </div>
        </div>

        {/* 4 STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">تقاضاهای وام صندوق حامی</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white">{toPersianNumbers(loanRequests.length)}</span>
              <span className="text-[10px] text-amber-400 font-bold">{toPersianNumbers(pendingLoans)} در انتظار تصویب</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">وام‌های مصوب پرداخت‌شده</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{toPersianNumbers(approvedLoans)} فقره</span>
              <span className="text-[10px] text-emerald-400 font-bold">تسهیلات ۴٪</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">درخواست‌های اسکان مشهد و قم</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white">{toPersianNumbers(stayRequests.length)}</span>
              <span className="text-[10px] text-teal-300 font-bold">{toPersianNumbers(approvedStays)} اسکان قطعی</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">سقف تسهیلات رفاهی مصوب</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-amber-300">{toPersianNumbers(welfarePolicy.maxLoanAmount)}</span>
              <span className="text-[10px] text-stone-300">اقساط {toPersianNumbers(welfarePolicy.maxInstallments)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 overflow-x-auto scrollbar-none">
        {[
          { id: 'loans', label: 'میز مدیریت وام‌های قرض‌الحسنه صندوق حامی', icon: CreditCard, badge: pendingLoans > 0 ? `${toPersianNumbers(pendingLoans)} نیاز به اقدام` : undefined },
          { id: 'accommodations', label: 'مدیریت اقامتگاه‌ها و معرفی‌نامه‌های اسکان', icon: Home, badge: pendingStays > 0 ? `${toPersianNumbers(pendingStays)} رزرو` : undefined },
          { id: 'cooperative', label: 'تعاونی مصرف، اقلام یارانه‌ای و پیشنهادات', icon: ShoppingBag, badge: `${toPersianNumbers(consumables.length)} قلم کالا` },
          { id: 'settings', label: 'آیین‌نامه‌ها، سقف مبالغ و فیلدهای فرم رفاهیات', icon: Sliders },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: LOAN MANAGEMENT WORKSPACE
          ========================================================================= */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام متقاضی وام یا موضوع..."
                className="bg-transparent text-xs text-stone-900 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'همه تقاضاها' },
                { id: 'pending', label: 'در انتظار کمیسیون' },
                { id: 'approved', label: 'تصویب‌شده' },
                { id: 'rejected', label: 'ردشده' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-teal-900 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
              <CreditCard className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-bold text-stone-700 text-sm">هیچ تقاضای وامی با این فیلتر یافت نشد</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLoans.map(loan => {
                const isPending = loan.status === 'pending';
                const isApproved = loan.status === 'approved';
                const isRejected = loan.status === 'rejected';

                return (
                  <div
                    key={loan.id}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                      isPending ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-stone-900">{loan.applicantName}</h4>
                            <p className="text-xs text-teal-800 font-bold">{loan.title}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                              : isApproved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          {isPending ? 'در انتظار کمیسیون' : isApproved ? 'وام مصوب شد' : 'رد شد'}
                        </span>
                      </div>

                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-stone-800">
                          <span>مبلغ تقاضا: {toPersianNumbers(loan.requestedValue || '۱۰۰ میلیون تومان')}</span>
                          <span className="text-teal-800 font-mono">کارمزد ۴٪</span>
                        </div>
                        {loan.description && (
                          <p className="text-[11px] text-stone-600 bg-white p-2 rounded-xl border border-stone-200 leading-relaxed">
                            <span className="font-bold text-stone-900 block mb-0.5">علت تقاضای وام:</span>
                            {loan.description}
                          </p>
                        )}
                        {loan.adminNote && (
                          <p className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-xl border border-emerald-200 font-medium">
                            <span className="font-bold block mb-0.5">مصوبه کمیسیون:</span>
                            {loan.adminNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setLoanApprovalForm({
                                approvedAmount: loan.requestedValue || '۱۰۰,۰۰۰,۰۰۰ تومان',
                                installmentsCount: '۲۴ ماهه',
                                paymentDate: '۱۴۰۳/۰۹/۰۱',
                                adminNote: 'موافقت گردید. مقرر شد مبلغ مصوب ظرف ۳ روز کاری واریز گردد.'
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تصویب و صدور مصوبه وام</span>
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            onClick={() => {
                              const reason = prompt('علت رد تقاضای وام را درج فرمایید:');
                              if (reason) {
                                updateWelfareStatus(loan.id, 'rejected', reason);
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                          >
                            رد تقاضا
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACCOMMODATION & RESIDENCY MANAGEMENT
          ========================================================================= */}
      {activeTab === 'accommodations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-stone-900">مدیریت اقامتگاه‌های زیارتی مشهد مقدس و قم</h3>
              <p className="text-xs text-stone-500 mt-0.5">بررسی تاریخ‌ها، تخصیص سوئیت و صدور برگه معرفی‌نامه اسکان</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStays.map(stay => {
              const isPending = stay.status === 'pending';
              const isApproved = stay.status === 'approved';

              return (
                <div
                  key={stay.id}
                  className={`bg-white rounded-3xl p-5 border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                    isPending ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-stone-900">{stay.applicantName}</h4>
                          <p className="text-xs text-amber-900 font-bold">{stay.title}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                            : isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {isPending ? 'در انتظار تایید سوئیت' : 'اسکان قطعی شد'}
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1.5">
                      <p className="text-stone-700">
                        <span className="font-bold text-stone-900">جزئیات تقاضا: </span>
                        {stay.description}
                      </p>
                      {stay.adminNote && (
                        <p className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                          <span className="font-bold block mb-0.5">معرفی‌نامه صادرشده:</span>
                          {stay.adminNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    {isPending && (
                      <button
                        onClick={() => {
                          setSelectedStay(stay);
                          setStayApprovalForm({
                            assignedSuite: 'سوئیت ۲ (برج حامی مشهد)',
                            checkInDate: '۱۴۰۳/۰۸/۲۸',
                            checkOutDate: '۱۴۰۳/۰۹/۰۲',
                            voucherCode: `VOUCH-${Date.now().toString().slice(-6)}`,
                            adminNote: 'معرفی‌نامه اسکان صادر شد. کلید سوئیت در محل تحویل می‌گردد.'
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>تایید و صدور برگه معرفی‌نامه اسکان</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: COOPERATIVE & SUBSIDIZED CONSUMABLES STORE
          ========================================================================= */}
      {activeTab === 'cooperative' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-black text-sm text-stone-900">انبار تعاونی مصرف و اقلام یارانه‌ای معیشت اعضا</h3>
              <p className="text-xs text-stone-500 mt-0.5">تغییر موجودی، افزودن کالای جدید و نرخ‌های یارانه‌ای</p>
            </div>
            <button
              onClick={() => setIsAddConsumableOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کالای یارانه‌ای جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consumables.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                      alt={item.name || item.title}
                      className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shadow-xs shrink-0"
                    />
                    <div>
                      <h4 className="font-black text-sm text-stone-900">{item.name || item.title}</h4>
                      <p className="text-xs text-teal-800 font-bold">{item.brand || 'تعاونی مرکز'}</p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {toPersianNumbers(item.discountPercent || Math.round(((item.marketPrice - item.cooperativePrice) / (item.marketPrice || 1)) * 100))}٪ تخفیف سهم اعضا
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1.5">
                    <div className="flex justify-between font-bold text-stone-900">
                      <span>نرخ یارانه اعضا:</span>
                      <span className="text-teal-800 font-black">{toPersianNumbers(((item.memberPrice ?? item.cooperativePrice) || 0).toLocaleString())} ریال</span>
                    </div>
                    <div className="flex justify-between text-stone-500 text-[11px]">
                      <span>قیمت آزاد بازار:</span>
                      <span className="line-through">{toPersianNumbers((item.marketPrice || 0).toLocaleString())} ریال</span>
                    </div>
                    <div className="flex justify-between font-bold text-stone-800 pt-1 border-t border-stone-200/60">
                      <span>موجودی انبار:</span>
                      <span className="text-emerald-700">{toPersianNumbers(item.stock)} {item.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateConsumableStock(item.id, item.stock + 10)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      +۱۰ شارژ
                    </button>
                    <button
                      onClick={() => updateConsumableStock(item.id, Math.max(0, item.stock - 5))}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      -۵ کسر
                    </button>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">شناسه: {item.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SETTINGS & POLICIES CUSTOMIZER
          ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
            <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-800" />
              <span>تنظیمات مبالغ، سقف تسهیلات و شروط آیین‌نامه‌ای رفاهیات</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">سقف مبلغ وام قرض‌الحسنه صندوق حامی:</label>
                <input
                  type="text"
                  value={welfarePolicy.maxLoanAmount}
                  onChange={e => setWelfarePolicy({ ...welfarePolicy, maxLoanAmount: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">حداکثر مدت بازپرداخت اقساط:</label>
                <input
                  type="text"
                  value={welfarePolicy.maxInstallments}
                  onChange={e => setWelfarePolicy({ ...welfarePolicy, maxInstallments: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">سقف شب‌های مجاز اقامت در سوئیت‌ها:</label>
                <input
                  type="number"
                  value={welfarePolicy.maxStayNights}
                  onChange={e => setWelfarePolicy({ ...welfarePolicy, maxStayNights: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">نرخ کارمزد قرض‌الحسنه:</label>
                <input
                  type="text"
                  value={welfarePolicy.loanInterestRate}
                  onChange={e => setWelfarePolicy({ ...welfarePolicy, loanInterestRate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { key: 'allowMashhadBooking', label: 'فعال بودن ثبت‌نام اقامتگاه مشهد مقدس' },
                { key: 'allowQomBooking', label: 'فعال بودن ثبت‌نام اقامتگاه قم' },
                { key: 'requireGuarantorLetter', label: 'الزام به بارگذاری فرم تعهد ضامن' },
                { key: 'requireSalaryDeductionLetter', label: 'الزام به ارائه گواهی کسر از حقوق' },
              ].map(cfg => (
                <label
                  key={cfg.key}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-teal-50/40 transition-colors"
                >
                  <span className="text-xs font-bold text-stone-800">{cfg.label}</span>
                  <input
                    type="checkbox"
                    checked={(welfarePolicy as any)[cfg.key]}
                    onChange={e =>
                      setWelfarePolicy(prev => ({ ...prev, [cfg.key]: e.target.checked }))
                    }
                    className="w-4 h-4 accent-teal-800 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1 text-xs">متن قوانین و ضوابط ذیل فرم‌ها:</label>
              <textarea
                rows={2}
                value={welfarePolicy.rulesDisclaimer}
                onChange={e => setWelfarePolicy({ ...welfarePolicy, rulesDisclaimer: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* LOAN APPROVAL MODAL */}
      <AnimatePresence>
        {selectedLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-300 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-800" />
                  <h3 className="font-black text-sm text-stone-900">
                    تصویب و صدور مصوبه وام صندوق حامی: {selectedLoan.applicantName}
                  </h3>
                </div>
                <button onClick={() => setSelectedLoan(null)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLoanApproval} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">مبلغ مصوب کمیسیون:</label>
                    <input
                      type="text"
                      value={loanApprovalForm.approvedAmount}
                      onChange={e => setLoanApprovalForm({ ...loanApprovalForm, approvedAmount: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">تعداد اقساط:</label>
                    <input
                      type="text"
                      value={loanApprovalForm.installmentsCount}
                      onChange={e => setLoanApprovalForm({ ...loanApprovalForm, installmentsCount: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">تاریخ مقرر واریز:</label>
                  <input
                    type="text"
                    value={loanApprovalForm.paymentDate}
                    onChange={e => setLoanApprovalForm({ ...loanApprovalForm, paymentDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">متن مصوبه رسمی کمیسیون:</label>
                  <textarea
                    rows={2}
                    value={loanApprovalForm.adminNote}
                    onChange={e => setLoanApprovalForm({ ...loanApprovalForm, adminNote: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLoan(null)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer shadow-xs"
                  >
                    تایید و صدور مصوبه وام
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STAY APPROVAL MODAL */}
      <AnimatePresence>
        {selectedStay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-300 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-amber-800" />
                  <h3 className="font-black text-sm text-stone-900">
                    صدور برگه معرفی‌نامه اسکان برای {selectedStay.applicantName}
                  </h3>
                </div>
                <button onClick={() => setSelectedStay(null)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStayApproval} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">سوئیت و اقامتگاه اختصاص‌یافته:</label>
                  <input
                    type="text"
                    value={stayApprovalForm.assignedSuite}
                    onChange={e => setStayApprovalForm({ ...stayApprovalForm, assignedSuite: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">تاریخ ورود:</label>
                    <input
                      type="text"
                      value={stayApprovalForm.checkInDate}
                      onChange={e => setStayApprovalForm({ ...stayApprovalForm, checkInDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">تاریخ خروج:</label>
                    <input
                      type="text"
                      value={stayApprovalForm.checkOutDate}
                      onChange={e => setStayApprovalForm({ ...stayApprovalForm, checkOutDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">کد پیگیری و رهگیری رسمی:</label>
                  <input
                    type="text"
                    value={stayApprovalForm.voucherCode}
                    onChange={e => setStayApprovalForm({ ...stayApprovalForm, voucherCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs font-bold text-blue-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">یادداشت اداری معرفی‌نامه:</label>
                  <textarea
                    rows={2}
                    value={stayApprovalForm.adminNote}
                    onChange={e => setStayApprovalForm({ ...stayApprovalForm, adminNote: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStay(null)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold cursor-pointer shadow-xs"
                  >
                    تایید اسکان و صدور معرفی‌نامه
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

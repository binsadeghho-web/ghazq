import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsumableItem, WelfareRequest } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { AdminWelfareSuite } from './AdminWelfareSuite';
import { WelfareCalculatorAndPostalSuite } from './WelfareCalculatorAndPostalSuite';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  canManageAllInSection,
  canAccessWelfareSubSection,
  useRbacPolicies,
} from '../../utils/rbacPolicy';
import {
  Gift,
  Coins,
  Home,
  ShoppingBag,
  Share2,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  MapPin,
  Check,
  ChevronDown,
  Heart,
  FileText,
  ShieldCheck,
  Scale,
  Calendar,
  UserCheck,
  X,
  Sparkles
} from 'lucide-react';

export const WelfareSection: React.FC = () => {
  const {
    currentUser,
    welfareRequests,
    consumables: rawConsumables,
    consumableOrders,
    productProposals,
    submitWelfareRequest,
    updateWelfareStatus,
    placeConsumableOrder,
    submitProductProposal,
    welfareSectionsConfig,
    loanTermsAndRules,
    cooperativeSectionInfo
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const isOfficial = canManageAllInSection(currentUser, 'welfare', rolePolicies);
  const [previewStudentMode, setPreviewStudentMode] = useState(false);

  // Filter consumables for customer users based on item-level visibleToCustomer
  const consumables = rawConsumables.filter(item => {
    if (currentUser?.role === 'customer' && item.visibleToCustomer === false) return false;
    return true;
  });

  // Check which sections are enabled globally AND permitted for the user's role (e.g., customer vs alumni)
  const loansConfig = welfareSectionsConfig.find(s => s.id === 'financial_loans');
  const accommodationsConfig = welfareSectionsConfig.find(s => s.id === 'accommodations');
  const cooperativeConfig = welfareSectionsConfig.find(s => s.id === 'cooperative_groceries');
  const healthConfig = welfareSectionsConfig.find(s => s.id === 'health_insurance');
  const customSections = welfareSectionsConfig.filter(
    s => s.id.startsWith('welf_sec_') && s.isEnabled
  );

  const isLoansEnabled =
    loansConfig?.isEnabled !== false &&
    canAccessWelfareSubSection(currentUser, 'welfare_loans', rolePolicies);
  const isAccommodationsEnabled =
    accommodationsConfig?.isEnabled !== false &&
    canAccessWelfareSubSection(currentUser, 'welfare_accommodations', rolePolicies);
  const isCooperativeEnabled =
    cooperativeConfig?.isEnabled !== false &&
    canAccessWelfareSubSection(currentUser, 'welfare_cooperative', rolePolicies);
  const isHealthEnabled =
    healthConfig?.isEnabled === true &&
    currentUser?.role !== 'customer';

  // Initial active tab determination
  const initialActive = isLoansEnabled
    ? 'loans'
    : isAccommodationsEnabled
    ? 'stay'
    : isCooperativeEnabled
    ? 'groceries'
    : 'my_welfare';

  const [activeTab, setActiveTab] = useState<string>(initialActive);

  // Loan Request Form State
  const [loanAmount, setLoanAmount] = useState(loanTermsAndRules.maxLoanAmountDisplay || '۱۵۰ میلیون تومان');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanRulesAccepted, setLoanRulesAccepted] = useState(false);
  const [isCharterModalOpen, setIsCharterModalOpen] = useState(false);

  // Accommodation Form State
  const [stayCity, setStayCity] = useState('مشهد مقدس');
  const [stayDays, setStayDays] = useState('۳ شب');
  const [stayPersons, setStayPersons] = useState('۴ نفر');
  const [stayDates, setStayDates] = useState('');
  const [stayPurpose, setStayPurpose] = useState('');
  const [stayRulesAccepted, setStayRulesAccepted] = useState(false);

  // Health / Custom Request Form State
  const [customReqSubject, setCustomReqSubject] = useState('');
  const [customReqDesc, setCustomReqDesc] = useState('');

  // Cart for groceries
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [deliveryAddress, setDeliveryAddress] = useState('تهران، دادگستری کل استان، شعبه ۱۴ تجدیدنظر');

  // Member Product Proposal State
  const [propName, setPropName] = useState('');
  const [propOfferedPrice, setPropOfferedPrice] = useState(200000);
  const [propMarketPrice, setPropMarketPrice] = useState(300000);
  const [propSupplier, setPropSupplier] = useState('');
  const [propDesc, setPropDesc] = useState('');

  const myWelfareList = welfareRequests.filter(r => isOfficial || r.applicantId === currentUser?.id);

  // If Admin/Supervisor and not previewing student mode, show complete admin executive suite
  if (isOfficial && !previewStudentMode) {
    return <AdminWelfareSuite onSwitchToStudentPreview={() => setPreviewStudentMode(true)} />;
  }

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !loanRulesAccepted) return;

    submitWelfareRequest({
      type: 'loan',
      typeTitle: `درخواست وام از ${loanTermsAndRules.fundName}`,
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      title: `تقاضای تسهیلات قرض‌الحسنه (${loanAmount})`,
      requestedValue: loanAmount,
      description: loanPurpose,
      rulesAcknowledged: true,
    });

    setLoanPurpose('');
    setLoanRulesAccepted(false);
    setActiveTab('my_welfare');
  };

  const handleStaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !stayRulesAccepted) return;

    submitWelfareRequest({
      type: 'accommodation',
      typeTitle: 'درخواست اسکان و اقامت زیارتی موقت',
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      title: `اقامت موقت ${stayCity} (${stayDays} - ${stayPersons})`,
      requestedValue: `${stayCity} - ${stayDays}`,
      description: `بازه زمانی: ${stayDates} | هدف: ${stayPurpose}`,
      rulesAcknowledged: true,
    });

    setStayDates('');
    setStayPurpose('');
    setStayRulesAccepted(false);
    setActiveTab('my_welfare');
  };

  const handleCustomSubmit = (e: React.FormEvent, secTitle: string) => {
    e.preventDefault();
    if (!currentUser || !customReqSubject) return;

    submitWelfareRequest({
      type: 'loan',
      typeTitle: secTitle,
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      title: customReqSubject,
      requestedValue: 'ثبت تقاضای حمایتی',
      description: customReqDesc,
      rulesAcknowledged: true,
    });

    setCustomReqSubject('');
    setCustomReqDesc('');
    alert(`درخواست شما در بخش «${secTitle}» ثبت و به کمیسیون رفاهیات ارجاع گردید.`);
    setActiveTab('my_welfare');
  };

  const handleCartQuantityChange = (itemId: string, delta: number) => {
    const targetItem = consumables.find(c => c.id === itemId);
    const availableStock = Number(targetItem?.stock ?? 0);
    if (delta > 0 && availableStock <= 0) return;

    setCartQuantities(prev => {
      const current = prev[itemId] || 0;
      const updated = Math.min(availableStock, Math.max(0, current + delta));
      return { ...prev, [itemId]: updated };
    });
  };

  const cartItems = Object.entries(cartQuantities)
    .filter(([_, q]) => q > 0)
    .map(([id, q]) => {
      const item = consumables.find(c => c.id === id)!;
      return {
        itemId: id,
        title: item.title,
        quantity: q,
        unitPrice: item.cooperativePrice || item.memberPrice || 0,
      };
    });

  const cartTotal = cartItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);

  const handlePlaceOrder = () => {
    if (!cartItems.length) return;
    placeConsumableOrder(cartItems, deliveryAddress);
    setCartQuantities({});
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !propName) return;

    submitProductProposal({
      proposerId: currentUser.id,
      proposerName: currentUser.fullName,
      productName: propName,
      offeredPrice: propOfferedPrice,
      marketPrice: propMarketPrice,
      supplierDetails: propSupplier,
      description: propDesc,
    });

    setPropName('');
    setPropSupplier('');
    setPropDesc('');
    alert('پیشنهاد کالای شما به مدیریت تعاونی ارسال شد.');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Return to Admin Mode floating banner if admin is previewing student mode */}
      {isOfficial && previewStudentMode && (
        <div className="bg-teal-100 border border-teal-300 text-teal-900 rounded-2xl p-3 px-5 flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping" />
            در حال مشاهده پیش‌نمایش فرم و محیط رفاهیات دانش‌آموخته هستید.
          </span>
          <button
            onClick={() => setPreviewStudentMode(false)}
            className="px-4 py-1.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            بازگشت به میز مدیریت ادمین
          </button>
        </div>
      )}

      {/* METRIC CARDS OVERVIEW (Respects section enables) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoansEnabled && (
          <ModernMetricCard
            title={loansConfig?.title || 'تسهیلات قرض‌الحسنه'}
            value={loanTermsAndRules.maxLoanAmountDisplay.replace(' تومان', '')}
            periodLabel="سقف تسهیلات حامی"
            unit="تومان"
            icon={<Coins className="w-4 h-4 text-amber-500" />}
            onClick={() => setActiveTab('loans')}
          />
        )}
        {isAccommodationsEnabled && (
          <ModernMetricCard
            title={accommodationsConfig?.title || 'اقامتگاه‌های زیارتی'}
            value="مشهد و قم"
            periodLabel="اسکان خانوادگی ۴ روزه"
            icon={<Home className="w-4 h-4 text-teal-600" />}
            onClick={() => setActiveTab('stay')}
          />
        )}
        {isCooperativeEnabled && (
          <ModernMetricCard
            title={cooperativeConfig?.title || 'اقلام مصرفی تعاونی'}
            value={consumables.length}
            periodLabel="توزیع مستقیم با سوبسید"
            unit="کالا"
            icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}
            onClick={() => setActiveTab('groceries')}
          />
        )}
        <ModernMetricCard
          title="پیگیری درخواست‌های من"
          value={myWelfareList.length}
          periodLabel="سوابق مصوبات رفاهی"
          unit="فقره"
          icon={<Gift className="w-4 h-4 text-purple-500" />}
          onClick={() => setActiveTab('my_welfare')}
        />
      </div>

      {/* HEADER BAR */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              تسهیلات، رفاهیات و تعاونی مصرف دانش‌آموختگان
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-teal-100 text-teal-900 text-xs font-black">
              {loanTermsAndRules.fundName}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            وام‌های قرض‌الحسنه کارمزد صفر، اسکان در مجتمع‌های ثامن‌الائمه مشهد و کوثر قم و تامین اقلام اساسی معیشتی
          </p>
        </div>
      </div>

      {/* DYNAMIC SEGMENTED CONTROL TABS (Respects Active Config) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 text-xs overflow-x-auto shadow-xs scrollbar-none">
        {isLoansEnabled && (
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'loans'
                ? 'bg-teal-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            {loansConfig?.title || 'وام و تسهیلات مالی'}
          </button>
        )}

        {isAccommodationsEnabled && (
          <button
            onClick={() => setActiveTab('stay')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'stay'
                ? 'bg-teal-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            {accommodationsConfig?.title || 'اسکان و اقامتگاه‌های زیارتی'}
          </button>
        )}

        {isCooperativeEnabled && (
          <button
            onClick={() => setActiveTab('groceries')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'groceries'
                ? 'bg-teal-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            {cooperativeSectionInfo.title} ({toPersianNumbers(consumables.length)})
          </button>
        )}

        {isHealthEnabled && (
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-teal-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            {healthConfig?.title || 'بیمه تکمیلی و درمان'}
          </button>
        )}

        {customSections.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveTab(sec.id)}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === sec.id
                ? 'bg-teal-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
            }`}
          >
            {sec.title}
          </button>
        ))}

        <button
          onClick={() => setActiveTab('proposal')}
          className={`px-3.5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'proposal'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
          }`}
        >
          پیشنهاد کالا به تعاونی
        </button>

        <button
          onClick={() => setActiveTab('my_welfare')}
          className={`px-3.5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'my_welfare'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
          }`}
        >
          پیگیری مصوبات من ({toPersianNumbers(myWelfareList.length)})
        </button>
      </div>

      {/* =========================================================================
          TAB 1: FINANCIAL LOANS (100% Configured by Admin)
          ========================================================================= */}
      {isLoansEnabled && activeTab === 'loans' && (
        <div className="space-y-6">
          <WelfareCalculatorAndPostalSuite mode="calculator" isOfficial={isOfficial} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-sm font-black text-stone-900">
                فرم تقاضای تسهیلات از {loanTermsAndRules.fundName}
              </h2>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2.5 py-0.5 rounded-full">
                کارمزد: {toPersianNumbers(loanTermsAndRules.loanCommissionRate)}٪
              </span>
            </div>

            <form onSubmit={handleLoanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  انتخاب بسته و سقف مبلغ درخواستی:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    loanTermsAndRules.maxLoanAmountDisplay,
                    '۱۰۰ میلیون تومان',
                    '۵۰ میلیون تومان'
                  ].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLoanAmount(amt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        loanAmount === amt
                          ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-2xs'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  موضوع، انگیزه و دلیل درخواست تسهیلات:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="مثال: ودیعه رهن مسکن، تجهیز دفتر وکالت/پژوهش، تامین هزینه‌های ازدواج یا چاپ رساله علمی..."
                  value={loanPurpose}
                  onChange={e => setLoanPurpose(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-stone-900 leading-relaxed"
                />
              </div>

              {/* DYNAMIC CONDITIONS BOX FROM ADMIN CONFIG */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs text-stone-700">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 block flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-teal-800" />
                    ضوابط و آیین‌نامه مصوب صندوق حامی:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCharterModalOpen(true)}
                    className="text-[11px] text-teal-800 font-bold hover:underline"
                  >
                    مطالعه متن کامل اساسنامه
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px] text-stone-600">
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                    <span>بازپرداخت: حداکثر {toPersianNumbers(loanTermsAndRules.maxInstallments)} ماه با دوره تنفس {toPersianNumbers(loanTermsAndRules.installmentGracePeriodMonths)} ماه پس از واریز</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                    <span>ضمانت: {loanTermsAndRules.guarantorConditionText}</span>
                  </p>
                </div>

                <label className="flex items-center gap-2 pt-2 text-xs font-bold text-stone-900 cursor-pointer border-t border-stone-200">
                  <input
                    type="checkbox"
                    required
                    checked={loanRulesAccepted}
                    onChange={e => setLoanRulesAccepted(e.target.checked)}
                    className="rounded text-teal-800 w-4 h-4"
                  />
                  <span>ضوابط و شرایط آیین‌نامه صندوق را مطالعه نموده و متعهد می‌گردم.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!loanRulesAccepted}
                className="w-full py-3 bg-teal-850 bg-teal-900 hover:bg-teal-950 disabled:opacity-40 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>ارسال رسمی درخواست وام به کمیسیون اعتبارات</span>
              </button>
            </form>
          </div>

          {/* SIDE CARD: CRITERIA & DOCUMENTS */}
          <div className="lg:col-span-5 space-y-4">
            {/* Criteria */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs space-y-3">
              <h3 className="font-black text-xs text-stone-900 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                شرایط احراز متقاضیان دریافت وام:
              </h3>
              <ul className="space-y-2 text-xs text-stone-600">
                {loanTermsAndRules.eligibilityCriteria.map((crit, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs space-y-3">
              <h3 className="font-black text-xs text-stone-900 flex items-center gap-1.5 pb-2 border-b border-stone-100">
                <FileText className="w-4 h-4 text-amber-700" />
                مدارک و مستندات الزامی پرونده:
              </h3>
              <ul className="space-y-2 text-xs text-stone-600">
                {loanTermsAndRules.requiredDocuments.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      •
                    </span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Special Tiers */}
            {loanTermsAndRules.specialLoanTiers.length > 0 && (
              <div className="bg-stone-50 rounded-3xl p-5 border border-stone-200 space-y-2">
                <span className="text-xs font-black text-teal-900 block">بسته‌های ویژه تسهیلات:</span>
                <div className="space-y-1.5 text-xs text-stone-600">
                  {loanTermsAndRules.specialLoanTiers.map(t => (
                    <div key={t.id} className="p-2 bg-white rounded-xl border border-stone-200/70 flex justify-between items-center">
                      <span className="font-bold text-stone-800">{t.title}</span>
                      <span className="font-mono font-bold text-teal-800 text-[11px]">{t.amount} ({t.installments})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACCOMMODATIONS (مشهد و قم)
          ========================================================================= */}
      {isAccommodationsEnabled && activeTab === 'stay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <h2 className="text-sm font-black text-stone-900 pb-2 border-b border-stone-100">
              ثبت درخواست اسکان و رزرو مجتمع‌های اقامتی
            </h2>

            <form onSubmit={handleStaySubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['مشهد مقدس', 'قم مقدس', 'تهران (مرکز نخبگان)'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setStayCity(c)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      stayCity === c
                        ? 'border-teal-700 bg-teal-50 text-teal-900 shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{c}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">مدت اقامت:</label>
                  <select
                    value={stayDays}
                    onChange={e => setStayDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 font-bold"
                  >
                    <option value="۲ شب">۲ شب</option>
                    <option value="۳ شب">۳ شب (سقف مجاز ایام تعطیل)</option>
                    <option value="۴ شب">۴ شب (ویژه ایام عادی و پژوهشی)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">تعداد همراهان:</label>
                  <select
                    value={stayPersons}
                    onChange={e => setStayPersons(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white text-stone-900 font-bold"
                  >
                    <option value="۲ نفر">۲ نفر</option>
                    <option value="۳ نفر">۳ نفر</option>
                    <option value="۴ نفر">۴ نفر</option>
                    <option value="۵ نفر">۵ نفر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">تاریخ پیشنهادی ورود و خروج:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: از ۱۴۰۳/۰۸/۲۵ لغایت ۱۴۰۳/۰۸/۲۸"
                  value={stayDates}
                  onChange={e => setStayDates(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">هدف از سفر (زیارتی، پژوهشی، شرکت در همایش):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرکت در نشست علمی حقوقی و زیارت مضجع شریف"
                  value={stayPurpose}
                  onChange={e => setStayPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900"
                />
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs text-stone-600">
                <span className="font-bold text-stone-900 block">ضوابط اقامتگاه:</span>
                <p className="text-[11px] leading-relaxed text-stone-500">
                  حضور شخص دانش‌آموخته به همراه خانواده الزامی است و واگذاری سهمیه به غیر ممنوع می‌باشد. معرفی‌نامه رسمی با مهر دیجیتال صادر می‌گردد.
                </p>
                <label className="flex items-center gap-2 pt-1 font-bold text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={stayRulesAccepted}
                    onChange={e => setStayRulesAccepted(e.target.checked)}
                    className="rounded text-teal-800"
                  />
                  <span>قوانین مهمان‌سرا را پذیرفته و متعهد می‌گردم.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!stayRulesAccepted}
                className="w-full py-3 bg-teal-850 bg-teal-900 hover:bg-teal-950 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
              >
                ثبت رزرو و استعلام ظرفیت اتاق‌ها
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-2">
              <span className="text-xs font-black text-stone-900 block flex items-center gap-1.5">
                <Home className="w-4 h-4 text-teal-800" />
                مشهد مقدس - مجتمع اقامتی ثامن‌الائمه
              </span>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                خیابان طبرسی، فاصله ۵ دقیقه‌ای تا باب‌الرضا، سوئیت‌های مجهز دو تخته و چهارتخته با امکانات پخت و پز، استقبال و خدمات رفاهی کامل.
              </p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-2">
              <span className="text-xs font-black text-stone-900 block flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal-800" />
                قم مقدس - مرکز اقامتی کوثر
              </span>
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                میدان روح‌الله، نزدیک حرم مطهر حضرت معصومه (س) و کتابخانه آیت‌الله مرعشی نجفی، ویژه پژوهشگران و اساتید فقه القضا.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: COOPERATIVE GROCERIES STOREFRONT (100% Configured by Admin)
          ========================================================================= */}
      {isCooperativeEnabled && activeTab === 'groceries' && (
        <div className="space-y-6">
          {/* Cooperative Header & Notice */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="font-bold text-teal-950">{cooperativeSectionInfo.notice}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-800 text-white font-mono text-[11px] font-bold shrink-0">
              {toPersianNumbers(consumables.length)} قلم کالای یارانه‌ای فعال
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consumables.map(item => {
              const qty = cartQuantities[item.id] || 0;
              const mkt = item.marketPrice || item.cooperativePrice;
              const coop = item.cooperativePrice || item.memberPrice || 0;
              const discount = item.discountPercent || Math.round(((mkt - coop) / (mkt || 1)) * 100);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-stone-200/90 p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-xs">
                        {toPersianNumbers(discount)}٪ تخفیف اعضا
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-mono">
                        موجود: {toPersianNumbers(item.stock)} {item.unit}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                        <span className="font-bold text-teal-800">{item.category}</span>
                        <span>{item.brand || 'تعاونی مرکز'}</span>
                      </div>
                      <h3 className="text-sm font-black text-stone-900 leading-snug line-clamp-1">
                        {item.title || item.name}
                      </h3>
                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 space-y-1">
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span>قیمت بازار آزاد:</span>
                        <span className="line-through font-mono">
                          {toPersianNumbers(mkt.toLocaleString('fa-IR'))} تومان
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-800">قیمت سهم اعضا:</span>
                        <span className="font-black font-mono text-teal-900 text-sm">
                          {toPersianNumbers(coop.toLocaleString('fa-IR'))} تومان
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity selector or Out-of-Stock lock */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    {Number(item.stock) <= 0 ? (
                      <span className="w-full py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black text-center">
                        اتمام موجودی انبار — توقف ثبت سفارش
                      </span>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="text-xs text-stone-500 font-bold">تعداد درخواستی:</span>
                          {Number(item.stock) <= Number((item as any).lowStockThreshold ?? 5) && (
                            <span className="text-[10px] text-amber-700 font-black">
                              هشدار: تنها {toPersianNumbers(item.stock)} {item.unit} باقی مانده
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCartQuantityChange(item.id, -1)}
                            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs text-stone-900">
                            {toPersianNumbers(qty)}
                          </span>
                          <button
                            onClick={() => handleCartQuantityChange(item.id, 1)}
                            disabled={qty >= Number(item.stock)}
                            className="w-8 h-8 rounded-xl bg-teal-900 hover:bg-teal-950 disabled:opacity-40 text-white flex items-center justify-center font-bold text-xs active:scale-95 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* رهگیری پستی کالاهای ارسالی و مدیریت موجودی انبار */}
          <WelfareCalculatorAndPostalSuite mode="postal_and_inventory" isOfficial={isOfficial} />

          {/* Cart checkout */}
          {cartTotal > 0 && (
            <div className="bg-gradient-to-r from-stone-950 via-teal-950 to-stone-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-teal-800/40">
              <div className="space-y-1">
                <span className="text-xs text-amber-400 font-black">سبد خرید ارزاق یارانه‌ای تعاونی:</span>
                <div className="text-base font-black">
                  مجموع فاکتور سهم اعضا: <span className="text-teal-300 font-mono text-lg">{toPersianNumbers(cartTotal.toLocaleString('fa-IR'))} تومان</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="نشانی کامل محل تحویل در دادگستری یا منزل..."
                  className="px-4 py-2.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none w-full sm:w-80"
                />
                <button
                  onClick={handlePlaceOrder}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ثبت قطعی سفارش تعاونی</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB: HEALTH & SUPPLEMENTARY INSURANCE (When enabled by admin)
          ========================================================================= */}
      {isHealthEnabled && activeTab === 'health' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-stone-900">
                {healthConfig?.title || 'بیمه تکمیلی، سلامت و گرنت‌های درمانی'}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">{healthConfig?.subtitle}</p>
            </div>
          </div>

          <form onSubmit={e => handleCustomSubmit(e, 'درخواست بیمه تکمیلی و گرنت درمان')} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">موضوع تقاضای درمانی یا نوع بیمه *:</label>
              <input
                type="text"
                required
                placeholder="مثال: جبران فرانشیز بستری، خدمات دندانپزشکی، کمک‌هزینه داروی خاص"
                value={customReqSubject}
                onChange={e => setCustomReqSubject(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">شرح مدارک و هزینه‌های درمان:</label>
              <textarea
                rows={3}
                required
                placeholder="شماره فاکتور، بیمارستان و مشخصات بیمار تحت تکفل..."
                value={customReqDesc}
                onChange={e => setCustomReqDesc(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-stone-300 leading-relaxed text-xs"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ارسال پرونده درمان به کمیسیون رفاهیات</span>
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          DYNAMIC CUSTOM SECTION TABS (Added by Admin)
          ========================================================================= */}
      {customSections.map(sec => {
        if (activeTab !== sec.id) return null;
        return (
          <div key={sec.id} className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-stone-900">{sec.title}</h3>
                  {sec.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                      {sec.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">{sec.subtitle}</p>
              </div>
            </div>

            {sec.description && (
              <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-2xl border border-stone-100 leading-relaxed">
                {sec.description}
              </p>
            )}

            <form onSubmit={e => handleCustomSubmit(e, sec.title)} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">عنوان تقاضا *:</label>
                <input
                  type="text"
                  required
                  placeholder={`ثبت درخواست در بخش ${sec.title}`}
                  value={customReqSubject}
                  onChange={e => setCustomReqSubject(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">توضیحات و مستندات:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="شرح کامل انگیزه و مشخصات درخواست..."
                  value={customReqDesc}
                  onChange={e => setCustomReqDesc(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 leading-relaxed text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال تقاضا به مدیریت رفاهیات</span>
              </button>
            </form>
          </div>
        );
      })}

      {/* =========================================================================
          TAB 4: MEMBER PROPOSALS
          ========================================================================= */}
      {activeTab === 'proposal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">پیشنهاد کالای ارزان و باکیفیت به مدیریت تعاونی</h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                اگر شما یا بستگانتان تولیدکننده محصولی معتبر و مرغوب هستید، مشخصات آن را ثبت فرمایید تا پس از تایید کیفی به صورت یارانه‌ای در تعاونی عرضه گردد.
              </p>
            </div>

            <form onSubmit={handleProposalSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">نام محصول پیشنهادی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: چای ارگانیک سرگل فومنات"
                  value={propName}
                  onChange={e => setPropName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">قیمت پیشنهادی تعاونی (تومان):</label>
                  <input
                    type="number"
                    value={propOfferedPrice}
                    onChange={e => setPropOfferedPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">قیمت بازار آزاد (تومان):</label>
                  <input
                    type="number"
                    value={propMarketPrice}
                    onChange={e => setPropMarketPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">مشخصات تولیدکننده و شهر منشا:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: باغات چای اکبری - فومن گیلان"
                  value={propSupplier}
                  onChange={e => setPropSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">توضیحات کیفیت و استانداردهای بهداشتی:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="توضیحات پیرامون ارگانیک بودن، شماره پروانه بهداشت و شیوه ارسال نمونه تست..."
                  value={propDesc}
                  onChange={e => setPropDesc(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-stone-300 bg-stone-50 text-stone-900 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-850 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Send className="w-4 h-4 text-amber-400 rotate-180" />
                <span>ارسال پیشنهاد به مدیریت تعاونی</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
            <span className="text-xs font-black text-stone-900 block">پیشنهادهای اخیر دانش‌آموختگان:</span>
            <div className="space-y-2">
              {productProposals.map(p => (
                <div key={p.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-stone-900">{p.productName}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      در حال ارزیابی کیفی
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    تولیدکننده: {p.supplierDetails}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: MY WELFARE DOSSIERS
          ========================================================================= */}
      {activeTab === 'my_welfare' && (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 text-xs font-black text-stone-900 flex justify-between items-center">
            <span>سوابق درخواست‌های رفاهی، تسهیلات و اسکان‌های من:</span>
            <span className="font-mono text-teal-800 font-bold">{toPersianNumbers(myWelfareList.length)} پرونده</span>
          </div>

          <div className="divide-y divide-stone-100">
            {myWelfareList.length === 0 ? (
              <div className="p-12 text-center text-xs text-stone-400">
                درخواستی تاکنون ثبت نگردیده است.
              </div>
            ) : (
              myWelfareList.map(req => (
                <div key={req.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-black text-stone-900">{req.title}</span>
                      <span className="text-[10px] font-mono text-stone-400">({req.createdAt})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'approved' || req.status === 'disbursed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status === 'approved' || req.status === 'disbursed'
                          ? 'مصوب شد'
                          : req.status === 'pending'
                          ? 'در انتظار بررسی کمیسیون'
                          : 'رد شده'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-sans">{req.description}</p>
                    {req.adminNote && (
                      <div className="text-[11px] text-teal-900 bg-teal-50 p-2 rounded-xl border border-teal-200/60 font-medium">
                        <span className="font-bold">پاسخ رسمی کمیسیون رفاه:</span> {req.adminNote}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* OFFICIAL CHARTER MODAL */}
      {isCharterModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                  <Scale className="w-4 h-4" />
                </span>
                <h3 className="font-black text-sm text-stone-900">
                  متن کامل اساسنامه {loanTermsAndRules.fundName}
                </h3>
              </div>
              <button
                onClick={() => setIsCharterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700 leading-relaxed font-sans max-h-96 overflow-y-auto space-y-3">
              <p>{loanTermsAndRules.officialCharterText}</p>

              <div className="pt-2 border-t border-stone-200 space-y-1.5 font-bold text-[11px] text-stone-800">
                <p>• کارمزد رسمی صندوق: {toPersianNumbers(loanTermsAndRules.loanCommissionRate)}٪ قرض‌الحسنه</p>
                <p>• سقف اعطایی به هر عضو: {loanTermsAndRules.maxLoanAmountDisplay}</p>
                <p>• بازپرداخت اقساط: تا {toPersianNumbers(loanTermsAndRules.maxInstallments)} ماه</p>
                <p>• شرایط ضامن: {loanTermsAndRules.guarantorConditionText}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsCharterModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-teal-900 text-white text-xs font-bold cursor-pointer"
              >
                متوجه شدم و بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

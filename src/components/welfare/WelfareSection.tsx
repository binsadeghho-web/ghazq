import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsumableItem, WelfareRequest } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
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
  ChevronDown
} from 'lucide-react';

export const WelfareSection: React.FC = () => {
  const {
    currentUser,
    welfareRequests,
    consumables,
    consumableOrders,
    productProposals,
    submitWelfareRequest,
    updateWelfareStatus,
    placeConsumableOrder,
    submitProductProposal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'loans' | 'stay' | 'groceries' | 'proposal' | 'my_welfare'>('loans');

  // Loan Request Form State
  const [loanAmount, setLoanAmount] = useState('۱۰۰ میلیون تومان');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanRulesAccepted, setLoanRulesAccepted] = useState(false);

  // Accommodation Form State
  const [stayCity, setStayCity] = useState('مشهد مقدس');
  const [stayDays, setStayDays] = useState('۳ شب');
  const [stayPersons, setStayPersons] = useState('۴ نفر');
  const [stayDates, setStayDates] = useState('');
  const [stayPurpose, setStayPurpose] = useState('');
  const [stayRulesAccepted, setStayRulesAccepted] = useState(false);

  // Cart for groceries
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [deliveryAddress, setDeliveryAddress] = useState('تهران، دادگستری کل استان، شعبه ۱۴ تجدیدنظر');

  // Member Product Proposal State
  const [propName, setPropName] = useState('');
  const [propOfferedPrice, setPropOfferedPrice] = useState(200000);
  const [propMarketPrice, setPropMarketPrice] = useState(300000);
  const [propSupplier, setPropSupplier] = useState('');
  const [propDesc, setPropDesc] = useState('');

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const myWelfareList = welfareRequests.filter(r => isOfficial || r.applicantId === currentUser?.id);

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !loanRulesAccepted) return;

    submitWelfareRequest({
      type: 'loan',
      typeTitle: 'درخواست وام قرض‌الحسنه صندوق حامی',
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      title: `تقاضای وام قرض‌الحسنه (${loanAmount})`,
      requestedValue: loanAmount,
      description: loanPurpose,
      rulesAcknowledged: true,
    });

    setLoanPurpose('');
    setLoanRulesAccepted(false);
    alert('درخواست وام قرض‌الحسنه شما ثبت و به کمیسیون رفاهیات ارجاع گردید.');
    setActiveTab('my_welfare');
  };

  const handleStaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !stayRulesAccepted) return;

    submitWelfareRequest({
      type: 'accommodation',
      typeTitle: 'درخواست اسکان و اقامت موقت',
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
    alert('درخواست اقامت موقت شما ثبت شد. نتیجه استعلام ظرفیت اتاق‌ها به شما اطلاع داده خواهد شد.');
    setActiveTab('my_welfare');
  };

  const handleCartQuantityChange = (itemId: string, delta: number) => {
    setCartQuantities(prev => {
      const current = prev[itemId] || 0;
      const updated = Math.max(0, current + delta);
      return { ...prev, [itemId]: updated };
    });
  };

  const cartItems = Object.entries(cartQuantities)
    .filter(([_, q]) => q > 0)
    .map(([id, q]) => {
      const item = consumables.find(c => c.id === id)!;
      return {
        itemId: item.id,
        title: item.title,
        quantity: q,
        unitPrice: item.cooperativePrice,
      };
    });

  const cartTotal = cartItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) return;
    placeConsumableOrder(cartItems, deliveryAddress);
    setCartQuantities({});
    alert('سفارش اقلام معیشتی با موفقیت ثبت شد.');
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    submitProductProposal({
      proposerId: currentUser.id,
      proposerName: currentUser.fullName,
      productName: propName,
      offeredPrice: Number(propOfferedPrice),
      marketPrice: Number(propMarketPrice),
      supplierDetails: propSupplier,
      description: propDesc,
    });

    setPropName('');
    setPropSupplier('');
    setPropDesc('');
    alert('پیشنهاد کالای شما به مدیریت تعاونی ارسال شد.');
  };

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="تسهیلات قرض‌الحسنه"
          value="۱۵۰ میلیون"
          periodLabel="سقف تسهیلات صندوق"
          unit="تومان"
          icon={<Coins className="w-4 h-4 text-amber-500" />}
          onClick={() => setActiveTab('loans')}
        />
        <ModernMetricCard
          title="مهمان‌سراهای فعال"
          value="۳ شهر"
          periodLabel="مشهد، قم و تهران"
          icon={<Home className="w-4 h-4 text-blue-500" />}
          onClick={() => setActiveTab('stay')}
        />
        <ModernMetricCard
          title="اقلام معیشتی تعاونی"
          value={consumables.length}
          periodLabel="توزیع مستقیم با تخفیف"
          unit="کالا"
          icon={<ShoppingBag className="w-4 h-4 text-emerald-500" />}
          onClick={() => setActiveTab('groceries')}
        />
        <ModernMetricCard
          title="درخواست‌های رفاهی من"
          value={myWelfareList.length}
          periodLabel="سوابق پیگیری"
          unit="مورد"
          icon={<Gift className="w-4 h-4 text-purple-500" />}
          onClick={() => setActiveTab('my_welfare')}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            تسهیلات، رفاهیات و اقلام مصرفی اعضا
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>وام‌های قرض‌الحسنه، رزرو مهمان‌سراهای زیارتی، توزیع معیشتی تعاونی و پیشنهاد کالا</span>
            <span aria-hidden="true">·</span>
            <span>صندوق حامی دانش‌آموختگان فقه و قضا</span>
          </div>
        </div>
      </div>

      {/* Segmented Control */}
      <div className="flex items-center gap-1.5 p-1.5 glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'loans'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          وام و تسهیلات مالی
        </button>
        <button
          onClick={() => setActiveTab('stay')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'stay'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          اسکان و اقامت موقت
        </button>
        <button
          onClick={() => setActiveTab('groceries')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'groceries'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          اقلام معیشتی تعاونی ({consumables.length})
        </button>
        <button
          onClick={() => setActiveTab('proposal')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'proposal'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          پیشنهاد محصول ارزان به ادمین
        </button>
        <button
          onClick={() => setActiveTab('my_welfare')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'my_welfare'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          پیگیری درخواست‌ها ({myWelfareList.length})
        </button>
      </div>

      {/* Tab 1: Loans */}
      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              ثبت درخواست تسهیلات قرض‌الحسنه
            </h2>

            <form onSubmit={handleLoanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  سقف مبلغ درخواستی:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['۵۰ میلیون تومان', '۱۰۰ میلیون تومان', '۱۵۰ میلیون تومان'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLoanAmount(amt)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-colors ${
                        loanAmount === amt
                          ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  انگیزه یا موضوع درخواست:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="مثال: خرید تجهیزات کتابخانه تخصصی، پیش‌پرداخت رهن مسکن یا انتشار اثر پژوهشی..."
                  value={loanPurpose}
                  onChange={e => setLoanPurpose(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Conditions Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block">ضوابط و آیین‌نامه صندوق:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>کارمزد تسهیلات ۴ درصد سالیانه مطابق عقود شرعی قرض‌الحسنه است.</li>
                  <li>بازپرداخت حداکثر ۳۶ ماه با کسر از حقوق یا معرفی یک ضامن معتبر قضایی/کارمندی.</li>
                  <li>اولویت تخصیص با متقاضیانی است که قبلاً از تسهیلات استفاده ننموده‌اند.</li>
                </ul>

                <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={loanRulesAccepted}
                    onChange={e => setLoanRulesAccepted(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>ضوابط و شرایط آیین‌نامه را مطالعه نموده و متعهد می‌گردم.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!loanRulesAccepted}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>ارسال درخواست وام به هیئت امنا</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">گردش کار تایید تسهیلات:</span>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>۱. ثبت درخواست اولیه توسط دانش‌آموخته در سامانه</p>
              <p>۲. بررسی استعلام مانده بدهی و خوش‌حسابی توسط کارشناس مالی</p>
              <p>۳. صدور معرفی‌نامه الکترونیک به بانک قرض‌الحسنه رسالت / مهر ایران</p>
              <p>۴. واریز تسهیلات ظرف حداکثر ۷ روز کاری</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Accommodation */}
      {activeTab === 'stay' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              ثبت درخواست اسکان و اقامت موقت
            </h2>

            <form onSubmit={handleStaySubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['مشهد مقدس', 'قم مقدس', 'تهران (مرکز نخبگان)'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setStayCity(c)}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      stayCity === c
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{c}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">مدت اقامت:</label>
                  <select
                    value={stayDays}
                    onChange={e => setStayDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="۲ شب">۲ شب</option>
                    <option value="۳ شب">۳ شب (سقف مجاز ایام تعطیل)</option>
                    <option value="۴ شب">۴ شب (ویژه ایام عادی و پژوهشی)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">تعداد همراهان:</label>
                  <select
                    value={stayPersons}
                    onChange={e => setStayPersons(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="۲ نفر">۲ نفر</option>
                    <option value="۳ نفر">۳ نفر</option>
                    <option value="۴ نفر">۴ نفر</option>
                    <option value="۵ نفر">۵ نفر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">تاریخ پیشنهادی ورود و خروج:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: از ۱۴۰۳/۰۸/۲۵ لغایت ۱۴۰۳/۰۸/۲۸"
                  value={stayDates}
                  onChange={e => setStayDates(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">هدف از سفر (زیارتی، پژوهشی، اداری):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرکت در نشست علمی حقوقی و زیارت"
                  value={stayPurpose}
                  onChange={e => setStayPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block">ضوابط استفاده از مهمان‌سرا:</span>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  حضور شخص دانش‌آموخته به همراه خانواده الزامی است و واگذاری سهمیه به غیر ممنوع می‌باشد.
                </p>
                <label className="flex items-center gap-2 pt-1 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={stayRulesAccepted}
                    onChange={e => setStayRulesAccepted(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>قوانین مهمان‌سرا را پذیرفته و متعهد می‌گردم.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!stayRulesAccepted}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors active:scale-[0.98]"
              >
                ثبت رزرو اقامتگاه
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">مشهد مقدس - مهمان‌سرای ثامن‌الائمه</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">خیابان طبرسی، فاصله ۵ دقیقه‌ای تا باب‌الرضا، سوئیت‌های مجهز دو تخته و چهارتخته.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">قم مقدس - مرکز اقامتی کوثر</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">میدان روح‌الله، نزدیک حرم مطهر حضرت معصومه (س) و کتابخانه آیت‌الله مرعشی.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Groceries Storefront */}
      {activeTab === 'groceries' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {consumables.map(item => {
              const qty = cartQuantities[item.id] || 0;
              const discount = Math.round(((item.marketPrice - item.cooperativePrice) / item.marketPrice) * 100);
              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.category}</span>
                      <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                        {discount}٪ تخفیف
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug min-h-[34px]">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>قیمت بازار آزاد:</span>
                        <span className="line-through font-mono tabular-nums">{item.marketPrice.toLocaleString('fa-IR')} ت</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">قیمت تعاونی:</span>
                        <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                          {item.cooperativePrice.toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">تعداد:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCartQuantityChange(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 active:scale-95"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">{qty}</span>
                      <button
                        onClick={() => handleCartQuantityChange(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart checkout */}
          {cartTotal > 0 && (
            <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs text-amber-400 font-semibold">سبد سفارش اقلام معیشتی تعاونی:</span>
                <div className="text-sm font-bold">
                  مجموع اقلام انتخابی: <span className="text-amber-300 font-mono tabular-nums">{cartTotal.toLocaleString('fa-IR')} تومان</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="نشانی تحویل..."
                  className="px-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none w-full sm:w-80"
                />
                <button
                  onClick={handlePlaceOrder}
                  className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shrink-0 transition-colors active:scale-[0.98]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>ثبت نهایی سفارش تعاونی</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Member Proposals */}
      {activeTab === 'proposal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">پیشنهاد کالای ارزان و باکیفیت به ادمین</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                اگر شما یا بستگانتان تولیدکننده محصولی معتبر هستید، مشخصات آن را ثبت فرمایید تا پس از تایید کیفی به صورت تعاونی عرضه گردد.
              </p>
            </div>

            <form onSubmit={handleProposalSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نام محصول پیشنهادی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: چای ارگانیک سرگل فومنات"
                  value={propName}
                  onChange={e => setPropName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">قیمت پیشنهادی (تومان):</label>
                  <input
                    type="number"
                    value={propOfferedPrice}
                    onChange={e => setPropOfferedPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">قیمت بازار آزاد (تومان):</label>
                  <input
                    type="number"
                    value={propMarketPrice}
                    onChange={e => setPropMarketPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">مشخصات تولیدکننده و شهر:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: کارخانه چای اکبری - فومن گیلان"
                  value={propSupplier}
                  onChange={e => setPropSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">توضیحات کیفیت:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="توضیحات پیرامون ارگانیک بودن و نحوه ارسال نمونه تست..."
                  value={propDesc}
                  onChange={e => setPropDesc(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Send className="w-4 h-4 text-amber-400 rotate-180" />
                <span>ارسال پیشنهاد به مدیریت تعاونی</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">پیشنهادهای اخیر اعضا:</span>
            <div className="space-y-2">
              {productProposals.map(p => (
                <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900 dark:text-white">{p.productName}</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400">در حال ارزیابی نمونه</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    تولیدکننده: {p.supplierDetails}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: My Welfare Requests */}
      {activeTab === 'my_welfare' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
            سوابق درخواست‌های رفاهی و تسهیلاتی:
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myWelfareList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                درخواستی ثبت نشده است.
              </div>
            ) : (
              myWelfareList.map(req => (
                <div key={req.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{req.title}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="font-mono tabular-nums text-slate-500">{req.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{req.description}</p>
                    {req.adminNote && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-1">
                        پاسخ مسئول: {req.adminNote}
                      </div>
                    )}
                  </div>

                  {isOfficial && req.status === 'pending' && (
                    <button
                      onClick={() => {
                        const note = prompt('یادداشت تایید:');
                        if (note) updateWelfareStatus(req.id, 'approved', note);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-medium shrink-0 active:scale-[0.98]"
                    >
                      تایید درخواست
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

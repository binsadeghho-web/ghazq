import { WelfareSectionConfig, WelfareLoanTermsAndRules, CooperativeSectionInfo } from '../types/welfare';
import { ConsumableOrder } from '../types';

export const DEFAULT_WELFARE_SECTIONS: WelfareSectionConfig[] = [
  {
    id: 'financial_loans',
    title: 'تسهیلات و وام‌های قرض‌الحسنه صندوق حامی',
    subtitle: 'اعطای وام قرض‌الحسنه کارمزد صفر با اقساط ۳۶ ماهه و امکان تنفس ۳ ماهه',
    icon: 'CreditCard',
    badge: 'کارمزد صفر',
    isEnabled: true,
    displayOrder: 1,
    description: 'حمایت مالی مستقیم از قضات و دانش‌آموختگان سطوح عالی جهت رهن مسکن، ازدواج، درمان و تجهیز دفتر پژوهشی'
  },
  {
    id: 'accommodations',
    title: 'اسکان و اقامتگاه‌های زیارتی مشهد مقدس و قم',
    subtitle: 'رزرو آنلاین مجتمع‌های اقامتی ثامن‌الائمه مشهد و مهمان‌سرای اساتید قم',
    icon: 'Home',
    badge: 'تخفیف ۷۰٪',
    isEnabled: true,
    displayOrder: 2,
    description: 'تسهیلات ویژه اقامتی ۴ روزه برای دانش‌آموخته و اعضای درجه یک خانواده همراه با صبحانه و استقبال رسمی'
  },
  {
    id: 'cooperative_groceries',
    title: 'تعاونی مصرف و ارزاق یارانه‌ای دانش‌آموختگان',
    subtitle: 'تامین مایحتاج اساسی خانواده با سوبسید ۳۰ الی ۵۰ درصدی نسبت به بازار آزاد',
    icon: 'ShoppingBag',
    badge: 'سوبسید ویژه',
    isEnabled: true,
    displayOrder: 3,
    description: 'توزیع مستقیم برنج طارم مازندران، روغن زیتون فرابکر، عسل طبیعی سبلان، خشکبار تویسرکان و بسته‌های پروتئینی'
  },
  {
    id: 'health_insurance',
    title: 'بیمه تکمیلی، سلامت و گرنت‌های درمانی',
    subtitle: 'پوشش فرانشیز درمان، بستری و آزمایشگاه‌های تخصصی خانواده دانش‌آموختگان',
    icon: 'Heart',
    badge: 'پوشش کامل',
    isEnabled: true,
    displayOrder: 4,
    description: 'حمایت مالی صندوق رفاه از هزینه‌های دندانپزشکی، زایمان، عمل‌های جراحی و داروهای خاص'
  }
];

export const DEFAULT_LOAN_TERMS_AND_RULES: WelfareLoanTermsAndRules = {
  fundName: 'صندوق قرض‌الحسنه حامی دانش‌آموختگان نخبگان فقه و قضا',
  maxLoanAmount: 150000000,
  maxLoanAmountDisplay: '۱۵۰,۰۰۰,۰۰۰ تومان',
  loanCommissionRate: 0,
  maxInstallments: 36,
  installmentGracePeriodMonths: 3,
  guarantorsRequired: 1,
  guarantorConditionText: 'یک نفر همکار قضایی شاغل یا ارائه چک صیادی بنفش با کسر از حقوق سازمانی',
  disbursementCycleDays: 5,
  eligibilityCriteria: [
    'عضویت رسمی و فعال در سامانه جامع دانش‌آموختگان فقه و قضا',
    'اشتغال در مراجع قضایی کشور، کانون وکلا یا تدریس/پژوهش رسمی در حوزه‌های علمیه',
    'عدم وجود بدهی معوق سررسیدشده یا چک برگشتی در شبکه بانکی کشور',
    'گذشت حداقل ۴ ماه از زمان تسویه وام قبلی صندوق (در صورت بهره‌مندی در ادوار گذشته)'
  ],
  requiredDocuments: [
    'تصویر آخرین حکم کارگزینی یا کارت شناسایی معتبر شغلی ممهور',
    'فیش حقوقی رسمی دو ماه اخیر متقاضی',
    'فرم تکمیل‌شده تاییدیه کسر از حقوق یا تصویر چک صیادی بنفش ضامن',
    'شماره شبای حساب بانکی متقاضی به همراه شماره تلفن همراه به نام شخص'
  ],
  officialCharterText: 'با استناد به مصوبه شورای عالی حمایت از دانش‌آموختگان نخبه فقه و قضا، صندوق حامی با هدف تکریم منزلت اجتماعی و گره‌گشایی معیشتی از قضات شریف و پژوهشگران معزز دایر گردیده است. تمامی تسهیلات این صندوق از محل موقوفات اختصاصی و منابع حامیان مرکز تامین شده و با کارمزد صفر درصد در قالب عقد قرض‌الحسنه شرعی اعطا می‌گردد. رعایت دقیق مواعد اقساط ماهانه، صندوق را در گردش منابع و حمایت از سایر همکاران نیازمند یاری خواهد نمود.',
  specialLoanTiers: [
    {
      id: 'tier_housing',
      title: 'تسهیلات ودیعه مسکن قضات',
      amount: '۱۵۰ میلیون تومان',
      installments: '۳۶ ماهه (اقساط ماهیانه: ۴,۱۶۰,۰۰۰ ت)',
      targetGroup: 'قضات غیربومی شاغل در شعب دادگستری'
    },
    {
      id: 'tier_marriage',
      title: 'تسهیلات پیوند آسمانی و آغاز زندگی',
      amount: '۱۰۰ میلیون تومان',
      installments: '۴۸ ماهه (اقساط ماهیانه: ۲,۰۸۰,۰۰۰ ت)',
      targetGroup: 'دانش‌آموختگانی که در ۲ سال اخیر ازدواج نموده‌اند'
    },
    {
      id: 'tier_emergency',
      title: 'تسهیلات اضطراری درمان و معیشت',
      amount: '۵۰ میلیون تومان',
      installments: '۲۴ ماهه (اقساط ماهیانه: ۲,۰۸۰,۰۰۰ ت)',
      targetGroup: 'واریز سریع ظرف ۴۸ ساعت با اولویت درمان و بستری'
    }
  ]
};

export const DEFAULT_COOPERATIVE_INFO: CooperativeSectionInfo = {
  title: 'تعاونی مصرف و ارزاق یارانه‌ای دانش‌آموختگان',
  subtitle: 'توزیع مستقیم برنج، روغن، عسل و خواربار ارگانیک با ۳۰ الی ۵۰ درصد تخفیف سهم اعضا',
  notice: 'یارانه کالاهای این بخش مستقیماً از محل بودجه رفاهیات مرکز تامین شده و تحویل سفارش‌ها در تهران و کلیه شهرستان‌ها حداکثر ظرف ۴۸ تا ۷۲ ساعت کاری انجام می‌گردد.'
};

export const INITIAL_EXTENDED_ORDERS: ConsumableOrder[] = [
  {
    id: 'ord_901',
    applicantId: 'usr_alumni_01',
    applicantName: 'دکتر علیرضا میرزایی',
    items: [
      { itemId: 'cnsm_1', title: 'برنج طارم هاشمی درجه یک مازندران', quantity: 2, unitPrice: 1050000 },
      { itemId: 'cnsm_2', title: 'روغن زیتون فرابکر رودبار', quantity: 2, unitPrice: 380000 }
    ],
    totalAmount: 2860000,
    deliveryAddress: 'تهران، میدان تجریش، خیابان باهنر، پلاک ۲۴، واحد ۶',
    status: 'delivered',
    createdAt: '۱۴۰۳/۰۷/۲۸'
  },
  {
    id: 'ord_902',
    applicantId: 'usr_alumni_02',
    applicantName: 'حجت‌الاسلام سیدمحمدرضا حسینی',
    items: [
      { itemId: 'cnsm_1', title: 'برنج طارم هاشمی درجه یک مازندران', quantity: 3, unitPrice: 1050000 },
      { itemId: 'cnsm_3', title: 'مغز گردوی درجه یک تویسرکان', quantity: 1, unitPrice: 620000 }
    ],
    totalAmount: 3770000,
    deliveryAddress: 'قم، بلوار امین، خیابان مصلی، کوچه ۱۲، پلاک ۳',
    status: 'dispatched',
    createdAt: '۱۴۰۳/۰۸/۰۲'
  },
  {
    id: 'ord_903',
    applicantId: 'usr_alumni_03',
    applicantName: 'قاضی مرتضی کاظمی',
    items: [
      { itemId: 'cnsm_4', title: 'عسل طبیعی کوهستان سبلان', quantity: 2, unitPrice: 340000 },
      { itemId: 'cnsm_2', title: 'روغن زیتون فرابکر رودبار', quantity: 1, unitPrice: 380000 }
    ],
    totalAmount: 1060000,
    deliveryAddress: 'مشهد مقدس، دادگستری کل خراسان رضوی، شعبه ۷ دادگاه حقوقی',
    status: 'prepared',
    createdAt: '۱۴۰۳/۰۸/۰۴'
  },
  {
    id: 'ord_904',
    applicantId: 'usr_alumni_04',
    applicantName: 'دکتر هادی صادقی‌کیا',
    items: [
      { itemId: 'cnsm_1', title: 'برنج طارم هاشمی درجه یک مازندران', quantity: 1, unitPrice: 1050000 },
      { itemId: 'cnsm_3', title: 'مغز گردوی درجه یک تویسرکان', quantity: 2, unitPrice: 620000 }
    ],
    totalAmount: 2290000,
    deliveryAddress: 'شیراز، خیابان ملاصدرا، کوچه قصرالدشت، مجتمع قضایی وحدت',
    status: 'registered',
    createdAt: '۱۴۰۳/۰۸/۰۵'
  }
];

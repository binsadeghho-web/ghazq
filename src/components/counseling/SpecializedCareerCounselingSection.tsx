import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingRequest } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { AdminSpecializedCounselingSuite } from './AdminSpecializedCounselingSuite';
import {
  Scale,
  GraduationCap,
  Award,
  Calendar,
  Clock,
  CheckCircle,
  Video,
  Building,
  Phone,
  Plus,
  Info,
  DollarSign,
  ShieldCheck,
  Edit3,
  X,
  User,
  Sparkles,
  MessageSquare,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';

// Dedicated initial specialized career advisors list
const INITIAL_SPECIALIZED_CAREER_CONSULTANTS: Consultant[] = [
  {
    id: 'spec_cns_01',
    name: 'آیت‌الله دکتر سید ابراهیم علوی',
    title: 'قاضی پیشکسوت دیوان عالی کشور و استاد خارج فقه القضا',
    specialty: 'ارتقا به شعب تخصصی دیوان عالی، تحلیل استدلال دادنامه‌ها و هدایت سطح ۴',
    bio: 'با بیش از ۳۰ سال خدمت در مراتب عالی قضایی و تدریس در حوزه علمیه قم و دانشگاه علوم قضایی. راهنمای ارتقای رتبه بیش از ۵۰۰ قاضی و مستشار کشور.',
    experienceYears: 30,
    availability: 'شنبه‌ها و دوشنبه‌ها عصر',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    academicRank: 'استاد سطوح عالی حوزه علمیه قم و دکتری تخصصی فقه و حقوق',
    resumeDetails: [
      'رئیس اسبق شعبه تخصصی کیفری و حقوقی دیوان عالی کشور',
      'مدرس برجسته خارج فقه القضا و حقوق کیفری تطبیقی در حوزه علمیه قم',
      'مولف ۱۰ عنوان کتاب مرجع در تحلیل آرای وحدت رویه و استدلال قضایی',
      'طراح ارشد مصاحبه‌های صلاحیت ارتقا به پایه‌های ۱۰ و ۱۱ قضایی'
    ],
    isActive: true,
    counselingType: 'specialized_career',
    fee: 500000,
    subsidyNotice: '۷۰٪ یارانه پرداختی توسط مرکز نخبگان (سهم دانش‌آموخته: ۱۵۰,۰۰۰ تومان)'
  },
  {
    id: 'spec_cns_02',
    name: 'استاد دکتر حبیب‌الله سلیمانی',
    title: 'مستشار ارشد دادگاه تجدیدنظر و طراح آزمون‌های قضایی',
    specialty: 'برنامه‌ریزی رساله دکتری حین خدمت، مصاحبه‌های صلاحیت و دادرسی تجاری',
    bio: 'قاضی نمونه کشوری، مدرس مدعو دانشگاه تهران و مشاور تخصصی نخبگان قضایی در برنامه‌ریزی ادامه تحصیل و نگارش کتب فقهی-حقوقی.',
    experienceYears: 22,
    availability: 'یکشنبه‌ها و چهارشنبه‌ها صبح',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    academicRank: 'دکتری تخصصی حقوق خصوصی - مستشار تجدیدنظر',
    resumeDetails: [
      'مستشار شعبه ۱۴ دادگاه تجدیدنظر استان تهران',
      'استاد مدعو دانشکده حقوق دانشگاه تهران و شهید بهشتی',
      'راهنما و ناظر بیش از ۲۰۰ عنوان پایان‌نامه و رساله فقه القضا',
      'عضو شورای عالی پژوهش و نقد آرای قضایی دادگستری کل استان تهران'
    ],
    isActive: true,
    counselingType: 'specialized_career',
    fee: 400000,
    subsidyNotice: 'رایگان برای اعضای دارنده کارت نخبگی علمی'
  },
  {
    id: 'spec_cns_03',
    name: 'دکتر احمد نوری‌زاد',
    title: 'دانشیار دانشگاه علوم قضایی و داور ارشد دعاوی بین‌المللی',
    specialty: 'انتخاب گرایش‌های نوظهور (فقه جزا و فناوری، هوش مصنوعی، قراردادها)',
    bio: 'پژوهشگر ارشد فقه و فناوری‌های نوین، داور اتاق بازرگانی و مشاور تدوین مقالات و کتب تخصصی دانش‌آموختگان.',
    experienceYears: 16,
    availability: 'سه‌شنبه‌ها و پنج‌شنبه‌ها',
    avatarUrl: '/assets/cleric_portrait.jpg',
    academicRank: 'دانشیار پایه ۲۱ دانشگاه علوم قضایی و خدمات اداری',
    resumeDetails: [
      'مدیر گروه حقوق تجارت و فناوری‌های نوظهور پژوهشگاه قوه قضاییه',
      'مولف کتاب برتر حقوق قراردادهای هوشمند و ادله دیجیتال',
      'مشاور بین‌الملل دعاوی تجاری و داوری سازمان‌های قضایی'
    ],
    isActive: true,
    counselingType: 'specialized_career',
    fee: 450000,
    subsidyNotice: '۶۵٪ تخفیف سهم یارانه آموزشی مرکز'
  }
];

export const SpecializedCareerCounselingSection: React.FC = () => {
  const {
    currentUser,
    counselingRequests,
    bookCounseling,
    updateCounselingStatus
  } = useApp();

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const [viewMode, setViewMode] = useState<'admin' | 'student'>(isOfficial ? 'admin' : 'student');

  const [activeTab, setActiveTab] = useState<'request' | 'advisors' | 'tariffs' | 'my_history' | 'admin_queue'>('request');

  // Local state for specialized consultants (independent list)
  const [specializedConsultants, setSpecializedConsultants] = useState<Consultant[]>(INITIAL_SPECIALIZED_CAREER_CONSULTANTS);

  // Form State
  const [selectedTopic, setSelectedTopic] = useState<'promotion_supreme_court' | 'doctoral_thesis_plan' | 'competency_interview' | 'emerging_fields'>('promotion_supreme_court');
  const [preferredAdvisorId, setPreferredAdvisorId] = useState(INITIAL_SPECIALIZED_CAREER_CONSULTANTS[0].id);
  const [meetingMode, setMeetingMode] = useState<'برخط (تصویری امن)' | 'حضوری' | 'تلفنی'>('برخط (تصویری امن)');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '09121112233');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [selectedAdvisorModal, setSelectedAdvisorModal] = useState<Consultant | null>(null);
  const [editingAdvisor, setEditingAdvisor] = useState<Consultant | null>(null);
  const [isAddingAdvisor, setIsAddingAdvisor] = useState(false);
  const [advisorForm, setAdvisorForm] = useState<Partial<Consultant>>({});

  // Filter requests for specialized career counseling
  const specializedRequests = counselingRequests.filter(r => r.counselingType === 'specialized_career' || r.category === 'judicial_career' || r.category === 'academic');
  const mySpecializedRequests = specializedRequests.filter(r => r.applicantId === currentUser?.id);

  const selectedAdvisorObj = specializedConsultants.find(c => c.id === preferredAdvisorId) || specializedConsultants[0];

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let topicTitle = 'مشاوره ارتقا به شعب دیوان عالی و دادگاه تجدیدنظر';
    if (selectedTopic === 'doctoral_thesis_plan') topicTitle = 'برنامه‌ریزی رساله دکتری و سطح ۴ حین خدمت';
    if (selectedTopic === 'competency_interview') topicTitle = 'آمادگی مصاحبه‌های صلاحیت و ترفیع رتبه قضایی';
    if (selectedTopic === 'emerging_fields') topicTitle = 'انتخاب گرایش‌های نوظهور (فقه جزا و فناوری، حقوق اقتصادی)';

    bookCounseling({
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      userNationalId: currentUser.nationalId,
      userPhone: userPhone || currentUser.phone,
      userRoleTitle: currentUser.roleTitle,
      category: 'judicial_career',
      categoryTitle: topicTitle,
      counselingType: 'specialized_career',
      preferredConsultantId: selectedAdvisorObj.id,
      preferredConsultantName: selectedAdvisorObj.name,
      description,
      meetingMode,
      fee: selectedAdvisorObj.fee,
      subsidyNotice: selectedAdvisorObj.subsidyNotice,
      paymentStatus: 'pending_review'
    });

    setDescription('');
    setSuccessMsg('درخواست مشاوره تخصصی شغلی-تحصیلی شما با موفقیت در دبیرخانه ارتقای علمی ثبت شد.');
    setTimeout(() => setSuccessMsg(''), 6000);
    setActiveTab('my_history');
  };

  const handleSaveAdvisorEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAdvisor) {
      setSpecializedConsultants(prev => prev.map(c => c.id === editingAdvisor.id ? { ...c, ...advisorForm } : c));
      setEditingAdvisor(null);
    } else if (isAddingAdvisor) {
      const newCns: Consultant = {
        id: `spec_cns_${Date.now()}`,
        name: advisorForm.name || 'مشاور ارشد جدید',
        title: advisorForm.title || 'قاضی پیشکسوت و مشاور ارتقای شغلی',
        specialty: advisorForm.specialty || 'هدایت شغلی و تحصیلی قضاوت',
        bio: advisorForm.bio || '',
        experienceYears: advisorForm.experienceYears || 15,
        availability: advisorForm.availability || 'شنبه‌ها و چهارشنبه‌ها',
        avatarUrl: advisorForm.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
        academicRank: advisorForm.academicRank || 'استاد مدعو',
        resumeDetails: advisorForm.resumeDetails || [],
        isActive: true,
        counselingType: 'specialized_career',
        fee: advisorForm.fee || 400000,
        subsidyNotice: advisorForm.subsidyNotice || 'شامل ۷۰٪ یارانه آموزشی مرکز'
      };
      setSpecializedConsultants(prev => [newCns, ...prev]);
      setIsAddingAdvisor(false);
    }
  };

  if (isOfficial && viewMode === 'admin') {
    return <AdminSpecializedCounselingSuite onSwitchToStudentPreview={() => setViewMode('student')} />;
  }

  return (
    <div className="space-y-6">
      {/* Return to Admin Mode floating banner if admin is previewing student mode */}
      {isOfficial && viewMode === 'student' && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl p-3 px-5 flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            در حال مشاهده پیش‌نمایش فرم و محیط دانش‌آموخته هستید.
          </span>
          <button
            onClick={() => setViewMode('admin')}
            className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            بازگشت به میز مدیریت ادمین
          </button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="مشاوران ارشد شغلی و تحصیلی"
          value={specializedConsultants.length}
          periodLabel="قضات دیوان عالی و اساتید ارشد"
          unit="استاد"
          icon={<Scale className="w-4 h-4 text-amber-500" />}
          onClick={() => setActiveTab('advisors')}
        />
        <ModernMetricCard
          title="نوبت‌های شغلی ثبت‌شده من"
          value={mySpecializedRequests.length}
          periodLabel="سابقه جلسات مشاوره تخصصی"
          unit="جلسه"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
          onClick={() => setActiveTab('my_history')}
        />
        <ModernMetricCard
          title="یارانه پرداختی مرکز نخبگان"
          value="۷۰٪"
          periodLabel="تخفیف ویژه دانش‌آموختگان"
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
          onClick={() => setActiveTab('tariffs')}
        />
        <ModernMetricCard
          title="جلسات برگزارشده"
          value={mySpecializedRequests.filter(r => r.status === 'attended').length}
          periodLabel="ارتقا و هدایت شغلی"
          unit="جلسه"
          icon={<CheckCircle className="w-4 h-4 text-purple-500" />}
          onClick={() => setActiveTab('my_history')}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              کلینیک مستقل و جدی مشاوره تخصصی تحصیلی و شغلی قضاوت
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">ویژه قضات و پژوهشگران</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            مشاوره تخصصی تحصیلی و شغلی قضاوت
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            هدایت شغلی، برنامه‌ریزی ارتقای رتبه قضایی، آماده‌سازی مصاحبه‌های دیوان عالی و برنامه‌ریزی رساله دکتری با قضات پیشکسوت
          </p>
        </div>

        {isOfficial && (
          <button
            onClick={() => setActiveTab('admin_queue')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مدیریت نوبت‌ها و مشاوران ارشد ({specializedRequests.filter(r => r.status === 'pending').length} جدید)</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'request'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>ثبت نوبت مشاوره شغلی</span>
        </button>

        <button
          onClick={() => setActiveTab('advisors')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'advisors'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-500" />
          <span>مشاوران ارشد شغلی و دیوان عالی ({specializedConsultants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tariffs')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'tariffs'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-blue-500" />
          <span>جدول تعرفه‌ها و یارانه آموزشی</span>
        </button>

        <button
          onClick={() => setActiveTab('my_history')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'my_history'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-500" />
          <span>سوابق نوبت‌های شغلی من ({mySpecializedRequests.length})</span>
        </button>

        {isOfficial && (
          <button
            onClick={() => setActiveTab('admin_queue')}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'admin_queue'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مدیریت ادمین</span>
          </button>
        )}
      </div>

      {/* Tab 1: Dedicated Booking Form */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                <span>فرم درخواست وقت مشاوره تخصصی شغلی و ارتقای قضایی</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                این مشاوره به صورت کاملاً اختصاصی توسط قضات پیشکسوت دیوان عالی و اساتید ارشد فقه القضا ارائه می‌شود.
              </p>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                  ۱. محور اصلی مشاوره شغلی-تحصیلی:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'promotion_supreme_court', label: 'ارتقا به دیوان عالی و محاکم تجدیدنظر' },
                    { id: 'doctoral_thesis_plan', label: 'برنامه‌ریزی رساله دکتری و سطح ۴ حین خدمت' },
                    { id: 'competency_interview', label: 'آمادگی مصاحبه‌های صلاحیت و ترفیع پایه' },
                    { id: 'emerging_fields', label: 'انتخاب گرایش‌های نوظهور (فقه جزا و فناوری)' },
                  ].map(topic => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => setSelectedTopic(topic.id as any)}
                      className={`p-3.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                        selectedTopic === topic.id
                          ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{topic.label}</span>
                      {selectedTopic === topic.id && <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  ۲. انتخاب استاد یا قاضی پیشکسوت مد نظر:
                </label>
                <select
                  value={preferredAdvisorId}
                  onChange={e => setPreferredAdvisorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {specializedConsultants.filter(c => c.isActive !== false).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ({c.title}) [{c.fee?.toLocaleString('fa-IR')} تومان]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    ۳. شیوه برگزاری جلسه:
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'برخط (تصویری امن)', label: 'برخط (تصویری اختصاصی)', icon: Video },
                      { id: 'حضوری', label: 'حضوری (تهران / قم)', icon: Building },
                      { id: 'تلفنی', label: 'تلفنی (خط مستقیم مرکز)', icon: Phone },
                    ].map(m => {
                      const IconComp = m.icon;
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            meetingMode === m.id
                              ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-amber-500/30'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="specMeetingMode"
                            className="hidden"
                            checked={meetingMode === m.id}
                            onChange={() => setMeetingMode(m.id as any)}
                          />
                          <IconComp className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    ۴. شماره همراه جهت ارسال پیامک هماهنگی:
                  </label>
                  <input
                    type="text"
                    required
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-left"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    لینک ورود و تقویم وقت با پیامک اطلاع‌رسانی می‌شود.
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  ۵. خلاصه سوابق قضایی و اهداف مد نظر از جلسه مشاوره:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="پایه قضایی فعلی، حوزه خدمت، اهداف ارتقا یا چالش‌های تحصیلی خود را تشریح فرمایید..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none leading-relaxed"
                />
              </div>

              {/* Fee & Subsidy Box */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <span>تعرفه رسمی جلسه:</span>
                  <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
                    {selectedAdvisorObj.fee?.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {selectedAdvisorObj.subsidyNotice}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl font-black transition-all shadow-md active:scale-[0.99]"
              >
                ثبت قطعی درخواست مشاوره تخصصی شغلی
              </button>
            </form>
          </div>

          {/* Info Side Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold">بخش ویژه و مستقل مرکز نخبگان</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                این خدمات مستقل از بخش مشاوره عمومی بوده و تمام جلسات توسط اساتید سطح ۴ حوزه، قضات دیوان عالی و اعضای هیئت علمی دانشگاه برگزار می‌گردد.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span>مزایای کلینیک مشاوره شغلی:</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span>تحلیل استدلال دادنامه‌های متقاضی جهت ارائه در مصاحبه‌های ترفیع</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span>برنامه‌ریزی زمانی تدوین رساله دکتری بدون ایجاد تداخل با حجم کار محاکم</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">✓</span>
                  <span>بهره‌مندی از ۷۰٪ یارانه آموزشی پرداخت‌شده توسط مرکز نخبگان</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Independent Advisors Directory */}
      {activeTab === 'advisors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                فهرست مستقل مشاوران ارشد شغلی، تحصیلی و دیوان عالی
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                کلیک روی «مشاهده شناسنامه و سوابق تخصصی» جهت بررسی رزومه و رزرو مستقیم وقت
              </p>
            </div>

            {isOfficial && (
              <button
                onClick={() => {
                  setAdvisorForm({
                    name: '',
                    title: 'قاضی پیشکسوت و مشاور ارتقای شغلی',
                    specialty: 'ارتقا به دیوان عالی و برنامه‌ریزی رساله',
                    bio: '',
                    experienceYears: 20,
                    availability: 'شنبه‌ها و سه‌شنبه‌ها',
                    avatarUrl: '',
                    academicRank: 'استاد مدعو',
                    fee: 450000,
                    subsidyNotice: 'شامل ۷۰٪ یارانه آموزشی مرکز'
                  });
                  setIsAddingAdvisor(true);
                }}
                className="px-4 py-2 bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن مشاور ارشد جدید</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specializedConsultants.map(c => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-amber-500/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-xs shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {c.name}
                      </h3>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block truncate">
                        {c.academicRank}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums block">
                        {c.experienceYears} سال سابقه خدمت و تدریس
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {c.bio}
                  </p>

                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>تعرفه جلسه:</span>
                      <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
                        {c.fee?.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 block">
                      {c.subsidyNotice}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {isOfficial && (
                    <button
                      onClick={() => {
                        setEditingAdvisor(c);
                        setAdvisorForm(c);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                      title="ویرایش مشاور ارشد"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedAdvisorModal(c)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>مشاهده شناسنامه و سوابق تخصصی</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Transparent Tariffs & Subsidies Schedule */}
      {activeTab === 'tariffs' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 shadow-md">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>جدول شفاف تعرفه‌ها و یارانه‌های آموزشی مرکز نخبگان</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              به منظور حمایت از پیشرفت علمی دانش‌آموختگان، تا ۷۰٪ از تعرفه رسمی جلسات مشاوره تخصصی شغلی توسط مرکز نخبگان پرداخت می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold inline-block">
                ارتقا به دیوان عالی
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                مشاوره ارتقای پایه و دیوان عالی
              </h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>تعرفه رسمی: ۵۰۰,۰۰۰ تومان</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">سهم یارانه مرکز: ۳۵۰,۰۰۰ تومان (۷۰٪)</p>
                <p className="font-bold text-slate-900 dark:text-white">سهم پرداختی دانش‌آموخته: ۱۵۰,۰۰۰ تومان</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block">
                برنامه‌ریزی رساله دکتری
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                هدایت رساله دکتری و سطح ۴
              </h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>تعرفه رسمی: ۴۰۰,۰۰۰ تومان</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">سهم یارانه مرکز: ۲۸۰,۰۰۰ تومان (۷۰٪)</p>
                <p className="font-bold text-slate-900 dark:text-white">سهم پرداختی دانش‌آموخته: ۱۲۰,۰۰۰ تومان</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold inline-block">
                گرایش‌های نوظهور
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                انتخاب گرایش‌های تخصصی
              </h3>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>تعرفه رسمی: ۴۵۰,۰۰۰ تومان</p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">سهم یارانه مرکز: ۱۰۰٪ (رایگان)</p>
                <p className="font-bold text-slate-900 dark:text-white">سهم پرداختی دانش‌آموخته: ۰ تومان</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: My History */}
      {activeTab === 'my_history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
            سوابق نوبت‌های مشاوره تخصصی شغلی و تحصیلی من:
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mySpecializedRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                هنوز هیچ نوبت مشاوره شغلی تخصصی ثبت نکرده‌اید.
              </div>
            ) : (
              mySpecializedRequests.map(req => (
                <div key={req.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{req.categoryTitle}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                      {req.status === 'scheduled' ? 'هماهنگ‌شده' : req.status === 'attended' ? 'شرکت‌کرده' : 'در حال بررسی'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">{req.description}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
                    <span>استاد: {req.preferredConsultantName}</span>
                    <span>·</span>
                    <span>شیوه: {req.meetingMode}</span>
                    {req.scheduledDate && <span>· زمان: {req.scheduledDate} {req.scheduledTime}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Advisor Resume Modal */}
      {selectedAdvisorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedAdvisorModal.avatarUrl}
                  alt={selectedAdvisorModal.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500"
                />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedAdvisorModal.name}</h3>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">{selectedAdvisorModal.academicRank}</span>
                </div>
              </div>
              <button onClick={() => setSelectedAdvisorModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl">
                {selectedAdvisorModal.bio}
              </p>

              {selectedAdvisorModal.resumeDetails && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 dark:text-white">سوابق قضایی و علمی:</h4>
                  {selectedAdvisorModal.resumeDetails.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setPreferredAdvisorId(selectedAdvisorModal.id);
                  setSelectedAdvisorModal(null);
                  setActiveTab('request');
                }}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                ثبت نوبت با این مشاور ارشد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

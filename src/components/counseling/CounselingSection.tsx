import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingCategory, CounselingRequest } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import {
  HeartHandshake,
  UserCheck,
  Calendar,
  Clock,
  Sparkles,
  Award,
  Video,
  Phone,
  Building,
  CheckCircle,
  Plus,
  BookOpen,
  Scale,
  FileText,
  XCircle,
  AlertCircle,
  Edit3,
  Camera,
  ExternalLink,
  User,
  Check,
  X,
  ChevronLeft,
  GraduationCap,
  Info,
  MapPin,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface CounselingSectionProps {
  initialTab?: 'request' | 'my_history' | 'consultants' | 'admin_queue' | 'academic_special' | 'articles';
}

export const CounselingSection: React.FC<CounselingSectionProps> = ({ initialTab = 'request' }) => {
  const {
    currentUser,
    consultants,
    counselingRequests,
    bookCounseling,
    updateCounselingStatus,
    updateConsultant,
    addConsultant
  } = useApp();

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const [activeTab, setActiveTab] = useState<'request' | 'my_history' | 'consultants' | 'admin_queue' | 'academic_special' | 'articles'>(initialTab);

  // Booking Form State
  const [category, setCategory] = useState<CounselingCategory>('judicial_career');
  const [preferredConsultantId, setPreferredConsultantId] = useState('');
  const [meetingMode, setMeetingMode] = useState<'حضوری' | 'برخط (تصویری امن)' | 'تلفنی'>('برخط (تصویری امن)');
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '09121112233');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [selectedConsultantForModal, setSelectedConsultantForModal] = useState<Consultant | null>(null);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [isAddingConsultant, setIsAddingConsultant] = useState(false);
  const [consultantForm, setConsultantForm] = useState<Partial<Consultant>>({});

  // Admin Scheduling Modal
  const [editingRequest, setEditingRequest] = useState<CounselingRequest | null>(null);
  const [adminScheduleForm, setAdminScheduleForm] = useState<{
    status: CounselingRequest['status'];
    scheduledDate: string;
    scheduledTime: string;
    meetingMode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
    venueDetails: string;
    preferredConsultantId: string;
    counselorNotes: string;
  }>({
    status: 'scheduled',
    scheduledDate: '',
    scheduledTime: '',
    meetingMode: 'برخط (تصویری امن)',
    venueDetails: '',
    preferredConsultantId: '',
    counselorNotes: ''
  });

  // Filters for History & Admin Queue
  const [historyFilter, setHistoryFilter] = useState<'all' | 'attended' | 'upcoming' | 'cancelled' | 'pending'>('all');
  const [adminQueueFilter, setAdminQueueFilter] = useState<'all' | 'pending' | 'scheduled' | 'attended'>('all');

  // Filter requests for current user vs admin view
  const myRequests = counselingRequests.filter(r => r.applicantId === currentUser?.id);
  const displayRequests = isOfficial ? counselingRequests : myRequests;

  // Stats calculation
  const totalMySessions = myRequests.length;
  const attendedCount = myRequests.filter(r => r.status === 'attended').length;
  const upcomingCount = myRequests.filter(r => r.status === 'scheduled' || r.status === 'pending').length;
  const cancelledCount = myRequests.filter(r => r.status === 'cancelled' || r.status === 'absent').length;

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let catTitle = 'مشاوره شغلی و تحصیلی قضاوت';
    if (category === 'individual') catTitle = 'مشاوره فردی و تاب‌آوری شغلی';
    if (category === 'family') catTitle = 'مشاوره خانواده و زوج‌درمانی';
    if (category === 'marriage') catTitle = 'مشاوره پیش از ازدواج و تحکیم خانواده';
    if (category === 'personality') catTitle = 'مشاوره شخصیتی و مدیریت اضطراب';
    if (category === 'academic') catTitle = 'مشاوره تحصیلی و آزمون‌های تکمیلی';

    const selectedConsultant = consultants.find(c => c.id === preferredConsultantId);

    bookCounseling({
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      userNationalId: currentUser.nationalId,
      userPhone: userPhone || currentUser.phone,
      userRoleTitle: currentUser.roleTitle,
      category,
      categoryTitle: catTitle,
      preferredConsultantId: preferredConsultantId || undefined,
      preferredConsultantName: selectedConsultant?.name,
      description,
      meetingMode,
    });

    setDescription('');
    setSuccessMsg('درخواست مشاوره شما با موفقیت در سامانه ثبت گردید. کارشناسان دبیرخانه جهت هماهنگی زمان با شما تماس خواهند گرفت.');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleOpenAdminSchedule = (req: CounselingRequest) => {
    setEditingRequest(req);
    setAdminScheduleForm({
      status: req.status === 'pending' ? 'scheduled' : req.status,
      scheduledDate: req.scheduledDate || new Date().toLocaleDateString('fa-IR'),
      scheduledTime: req.scheduledTime || '16:00',
      meetingMode: req.meetingMode || 'برخط (تصویری امن)',
      venueDetails: req.venueDetails || (req.meetingMode === 'حضوری' ? 'دفتر مشاوره مرکز - اتاق ۲' : 'لینک جلسه امن: https://meet.feqh.ir/counseling'),
      preferredConsultantId: req.preferredConsultantId || (consultants[0]?.id || ''),
      counselorNotes: req.counselorNotes || ''
    });
  };

  const handleSaveAdminSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    const selectedConsultant = consultants.find(c => c.id === adminScheduleForm.preferredConsultantId);

    updateCounselingStatus(
      editingRequest.id,
      adminScheduleForm.status,
      adminScheduleForm.scheduledDate,
      adminScheduleForm.counselorNotes,
      adminScheduleForm.scheduledTime,
      adminScheduleForm.venueDetails,
      adminScheduleForm.meetingMode,
      adminScheduleForm.preferredConsultantId,
      selectedConsultant?.name
    );

    setEditingRequest(null);
  };

  const handleSaveConsultantEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConsultant) {
      updateConsultant(editingConsultant.id, consultantForm);
      setEditingConsultant(null);
    } else if (isAddingConsultant) {
      addConsultant({
        name: consultantForm.name || 'مشاور جدید',
        title: consultantForm.title || 'روان‌شناس و مشاور حقوقی',
        specialty: consultantForm.title || 'مشاوره فردی',
        bio: consultantForm.bio || '',
        experienceYears: consultantForm.experienceYears || 5,
        specialties: consultantForm.specialties || ['مشاوره فردی'],
        availability: consultantForm.availability || 'شنبه تا چهارشنبه',
        avatarUrl: consultantForm.avatarUrl || '/assets/cleric_portrait.jpg',
        academicRank: consultantForm.academicRank || 'استاد مدعو',
        resumeDetails: consultantForm.resumeDetails || [],
        isActive: consultantForm.isActive !== false
      });
      setIsAddingConsultant(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ModernMetricCard
          title="مشاوره تخصصی تحصیلی و شغلی قضا"
          value="کلینیک ویژه"
          periodLabel="رشد علمی و ارتقای رتبه"
          icon={<Scale className="w-4 h-4 text-amber-500" />}
          onClick={() => setActiveTab('academic_special')}
        />
        <ModernMetricCard
          title="مشاوران و روان‌شناسان مرکز"
          value={consultants.length}
          periodLabel="اساتید و متخصصین معتمد"
          unit="نفر"
          icon={<HeartHandshake className="w-4 h-4 text-amber-500" />}
          onClick={() => setActiveTab('consultants')}
        />
        <ModernMetricCard
          title="کل جلسات رزرو شده من"
          value={totalMySessions}
          periodLabel="سابقه نوبت‌های من"
          unit="جلسه"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
          onClick={() => setActiveTab('my_history')}
        />
        <ModernMetricCard
          title="جلسات شرکت‌کرده"
          value={attendedCount}
          periodLabel="حضور تاییدشده"
          unit="جلسه"
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
          onClick={() => setActiveTab('my_history')}
        />
        <ModernMetricCard
          title="جلسات در پیش رو"
          value={upcomingCount}
          periodLabel="هماهنگ‌شده و جاری"
          unit="جلسه"
          icon={<Clock className="w-4 h-4 text-purple-500" />}
          onClick={() => setActiveTab('my_history')}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              بخش خدمات عمومی مشاوره و سلامت روان
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">محرمانه و رمزنگاری‌شده</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            بخش خدمات عمومی مشاوره
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ارائه خدمات مشاوره فردی، خانواده، شخصیتی و مدیریت استرس در کنار کلینیک تخصصی هدایت شغلی و تحصیلی
          </p>
        </div>

        {isOfficial && (
          <button
            onClick={() => setActiveTab('admin_queue')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>مدیریت نوبت‌ها ({counselingRequests.filter(r => r.status === 'pending').length} معلق)</span>
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
          <span>ثبت نوبت مشاوره</span>
        </button>

        <button
          onClick={() => setActiveTab('my_history')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'my_history'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-500" />
          <span>سوابق مشاوره من ({myRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('consultants')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'consultants'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span>فهرست روان‌شناسان و مشاوران ({consultants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('academic_special')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'academic_special'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-purple-500" />
          <span>کلینیک هدایت شغلی و تحصیلی</span>
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
            <span>تعیین وقت و نوبت‌دهی ادمین</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'articles'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span>راهنماهای سلامت روانی</span>
        </button>
      </div>

      {/* Tab 1: Request Booking Form */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>فرم درخواست وقت مشاوره و ارزیابی روان‌شناختی</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  اطلاعات فرم کاملاً محرمانه بوده و تنها برای مشاور و دبیرخانه قابل مشاهده است.
                </p>
              </div>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  ۱. موضوع و زمینه اصلی مشاوره:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'judicial_career', label: 'مسیر شغلی و تحصیلی قضاوت' },
                    { id: 'individual', label: 'فردی و تاب‌آوری شغلی' },
                    { id: 'family', label: 'خانواده و زوج‌درمانی' },
                    { id: 'marriage', label: 'مشاوره پیش از ازدواج' },
                    { id: 'personality', label: 'شخصیتی و مدیریت اضطراب' },
                    { id: 'academic', label: 'تحصیلی و آزمون‌های تکمیلی' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategory(item.id as CounselingCategory)}
                      className={`p-3 rounded-xl border text-xs text-right transition-all flex items-center justify-between ${
                        category === item.id
                          ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-amber-500/30'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{item.label}</span>
                      {category === item.id && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  ۲. انتخاب مشاور یا روان‌شناس مد نظر:
                </label>
                <select
                  value={preferredConsultantId}
                  onChange={e => setPreferredConsultantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="">پیش‌فرض: انتخاب بر اساس تشخیص دبیرخانه و تناسب موضوع</option>
                  {consultants.filter(c => c.isActive !== false).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — ({c.title}) [{c.experienceYears} سال سابقه]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    ۳. شیوه برگزاری جلسه:
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'برخط (تصویری امن)', label: 'برخط (تصویری رمزنگاری‌شده)', icon: Video },
                      { id: 'حضوری', label: 'حضوری (تهران / قم)', icon: Building },
                      { id: 'تلفنی', label: 'تلفنی (خط اختصاصی مرکز)', icon: Phone },
                    ].map(mode => {
                      const IconComp = mode.icon;
                      return (
                        <label
                          key={mode.id}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            meetingMode === mode.id
                              ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-bold ring-2 ring-amber-500/30'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name="meetingMode"
                            className="hidden"
                            checked={meetingMode === mode.id}
                            onChange={() => setMeetingMode(mode.id as any)}
                          />
                          <IconComp className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{mode.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    ۴. شماره همراه جهت ارسال هماهنگی:
                  </label>
                  <input
                    type="text"
                    required
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    placeholder="0912xxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-mono tabular-nums text-left"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    پیامک تایید نوبت و لینک جلسه به این شماره ارسال خواهد شد.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  ۵. شرح خلاصه چالش یا اهداف مد نظر از جلسه:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="نکات اصلی، سوابق قبلی مشاوره یا زمان‌های پیشنهادی خود جهت حضور در جلسه را یادداشت فرمایید..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>ثبت قطعی درخواست مشاوره</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold">پروتکل حفظ محرمانگی شأن قضایی</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                با توجه به حساسیت بالا و مسئولیت‌های قضایی دانش‌آموختگان، تمامی درخواست‌ها در بستر رمزنگاری‌شده ثبت می‌شوند. مشخصات متقاضی صرفاً نزد دبیرخانه مشاوره محفوظ بوده و افشا نمی‌شود.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span>مراحل پس از ثبت نوبت:</span>
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">۱</span>
                  <span>بررسی اولویت و موضوع توسط دبیرخانه تخصصی</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">۲</span>
                  <span>تخصیص مناسب‌ترین مشاور با تقویم پیشنهادی</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0">۳</span>
                  <span>ارسال پیامک حاوی تاریخ، ساعت و آدرس/لینک جلسه</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: My Counseling History & Session Records ("سوابق مشاوره من") */}
      {activeTab === 'my_history' && (
        <div className="space-y-5">
          {/* Summary Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>سوابق مشاوره و پرونده جلسات من</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                مشاهده تاریخچه حضور در جلسات، وضعیت نوبت‌های جاری و توصیه‌های ثبت‌شده توسط مشاوران
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              {[
                { id: 'all', label: 'همه' },
                { id: 'upcoming', label: 'در پیش رو' },
                { id: 'attended', label: 'شرکت‌کرده' },
                { id: 'cancelled', label: 'لغوشده / غایب' },
                { id: 'pending', label: 'در حال بررسی' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setHistoryFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    historyFilter === f.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions List */}
          {(() => {
            const filteredMyRequests = myRequests.filter(req => {
              if (historyFilter === 'attended') return req.status === 'attended';
              if (historyFilter === 'upcoming') return req.status === 'scheduled';
              if (historyFilter === 'cancelled') return req.status === 'cancelled' || req.status === 'absent';
              if (historyFilter === 'pending') return req.status === 'pending';
              return true;
            });

            if (filteredMyRequests.length === 0) {
              return (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/90 dark:border-slate-800 space-y-3">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    هیچ رکورد مشاوره‌ای با این فیلتر یافت نشد.
                  </p>
                  <button
                    onClick={() => setActiveTab('request')}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>ثبت اولین نوبت مشاوره</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredMyRequests.map(req => {
                  const consultantObj = consultants.find(c => c.id === req.preferredConsultantId);

                  let statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                      در حال بررسی دبیرخانه
                    </span>
                  );
                  if (req.status === 'scheduled') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                        در پیش رو (هماهنگ‌شده)
                      </span>
                    );
                  } else if (req.status === 'attended') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                        شرکت‌کرده (حضور تایید شد)
                      </span>
                    );
                  } else if (req.status === 'cancelled') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                        لغوشده
                      </span>
                    );
                  } else if (req.status === 'absent') {
                    statusBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200">
                        غایب در جلسه
                      </span>
                    );
                  }

                  return (
                    <div
                      key={req.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs hover:border-slate-300 transition-all"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {req.categoryTitle}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-xs text-slate-500 font-medium">{req.meetingMode}</span>
                        </div>
                        <div>{statusBadge}</div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-slate-400 block">مشاور طرف قرارداد:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {req.preferredConsultantName || consultantObj?.name || 'تعیین‌شده توسط دبیرخانه'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 block">زمان و ساعت برگزاری:</span>
                          {req.scheduledDate ? (
                            <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                              {req.scheduledDate} {req.scheduledTime ? `— ساعت ${req.scheduledTime}` : ''}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">در انتظار تعیین زمان توسط دبیرخانه</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-slate-400 block">مکان / لینک دسترسی:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {req.venueDetails || (req.meetingMode === 'حضوری' ? 'مرکز مشاوره (دفتر اصلی)' : 'لینک جلسه در پیامک ارسال می‌شود')}
                          </span>
                        </div>
                      </div>

                      {/* Description & Counselor Notes */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">خلاصه درخواست کاربر: </span>
                          <span className="text-slate-600 dark:text-slate-400">{req.description}</span>
                        </div>

                        {req.counselorNotes && (
                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-amber-900 dark:text-amber-300 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">یادداشت و توصیه مشاور: </span>
                              <span>{req.counselorNotes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 3: Psychologists Showcase Cards ("فهرست روان‌شناسان و مشاوران مرکز") */}
      {activeTab === 'consultants' && (
        <div className="space-y-6">
          {/* Header & Add Button for Admin */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                فهرست روان‌شناسان، مشاوران و اعضای هیئت علمی معتمد مرکز
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                کلیک روی «مشاهده بیشتر سوابق» جهت مطالعه سوابق علمی، رزومه تفصیلی و رزرو مستقیم نوبت
              </p>
            </div>

            {isOfficial && (
              <button
                onClick={() => {
                  setConsultantForm({
                    name: '',
                    title: 'روان‌شناس بالینی و مشاور حقوقی',
                    bio: '',
                    experienceYears: 10,
                    specialties: ['مشاوره فردی'],
                    availability: 'شنبه تا چهارشنبه',
                    avatarUrl: '',
                    academicRank: 'استاد مدعو',
                    resumeDetails: [],
                    isActive: true
                  });
                  setIsAddingConsultant(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن مشاور جدید</span>
              </button>
            )}
          </div>

          {/* Cards Grid preserving the requested layout style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {consultants.map(c => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-amber-500/50 transition-all"
              >
                <div className="space-y-3">
                  {/* Photo & Info Row */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-lg border border-amber-500/20">
                          {c.name.slice(0, 2)}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="مشاور فعال مرکز" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {c.name}
                        </h3>
                      </div>
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block truncate">
                        {c.academicRank || 'مشاور معتمد مرکز'}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.experienceYears} سال سابقه تخصصی</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    {c.title}
                  </span>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {c.bio}
                  </p>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>تقویم حضور: {c.availability}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {isOfficial && (
                    <button
                      onClick={() => {
                        setEditingConsultant(c);
                        setConsultantForm(c);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="ویرایش مشخصات / عکس"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedConsultantForModal(c)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>مشاهده بیشتر سوابق</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Admin Scheduling Queue ("تعیین وقت و نوبت‌دهی ادمین") */}
      {activeTab === 'admin_queue' && isOfficial && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>مدیریت دبیرخانه نوبت‌ها و تعیین زمان مشاوره</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تایید درخواست‌های واصله، تعیین وقت جلسات، ثبت لینک/آدرس و درج گزارش و توصیه‌های مشاور
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              {[
                { id: 'all', label: 'همه درخواست‌ها' },
                { id: 'pending', label: 'معلق (جدید)' },
                { id: 'scheduled', label: 'هماهنگ‌شده' },
                { id: 'attended', label: 'شرکت‌کرده' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setAdminQueueFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    adminQueueFilter === f.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {counselingRequests
                .filter(req => adminQueueFilter === 'all' || req.status === adminQueueFilter)
                .map(req => (
                  <div key={req.id} className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {req.applicantName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono tabular-nums">({req.userPhone || 'بدون تلفن'})</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{req.categoryTitle}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{req.meetingMode}</span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {req.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        {req.scheduledDate && (
                          <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            زمان: {req.scheduledDate} {req.scheduledTime ? `ساعت ${req.scheduledTime}` : ''}
                          </span>
                        )}
                        {req.venueDetails && (
                          <span className="text-slate-600 dark:text-slate-300">مکان/لینک: {req.venueDetails}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenAdminSchedule(req)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعیین وقت / ویرایش</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Specialized Academic & Judicial Career Counseling */}
      {activeTab === 'academic_special' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 shadow-md">
            <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <GraduationCap className="w-4 h-4" />
              <span>کلینیک تخصصی هدایت شغلی و رشد علمی قضاوت</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              مشاوره پیشرفت تحصیلی و ارتقای رتبه قضایی با اساتید پیشکسوت
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              ویژه دانش‌آموختگانی که در محاکم بدوی یا تجدیدنظر مشغول خدمت بوده و به دنبال ادامه تحصیل در مقطع سطح ۴ و دکتری، نگارش مقالات علمی، یا ارتقا به شعب تخصصی دیوان عالی کشور هستند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold text-sm block">۰۱.</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">انتخاب گرایش تخصصی حقوقی</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                راهنمایی در انتخاب گرایش‌های نوظهور مانند فقه جزا و فناوری، حقوق اقتصادی و قراردادهای عمومی.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold text-sm block">۰۲.</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">برنامه‌ریزی رساله دکتری</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                هموارسازی نگارش رساله حین خدمت پرفشار قضایی و زمان‌بندی جلسات دفاع.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold text-sm block">۰۳.</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">آمادگی مصاحبه‌های ترفیع</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                تحلیل نقاط استدلال دادنامه‌ها جهت ارتقا به شعب تخصصی دیوان عالی کشور.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Psychological Guides */}
      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              مدیریت خستگی تصمیم‌گیری (Decision Fatigue) در تراکم پرونده‌ها
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              راهکارهای عملی برای تجدید قوای شناختی و تمرکز ذهنی بین جلسات رسیدگی محاکم به منظور جلوگیری از اطاله دادرسی...
            </p>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums block pt-2">مدت مطالعه: ۵ دقیقه</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              تفکیک بار احساسی پرونده‌های جنایی و خانواده از حریم منزل
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تکنیک‌های شناختی-رفتاری جهت حفظ تعادل روانی و روابط خانوادگی در مواجهه با پرونده‌های سنگین و آزاردهنده...
            </p>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums block pt-2">مدت مطالعه: ۷ دقیقه</span>
          </div>
        </div>
      )}

      {/* Modal 1: Detailed Consultant Resume ("مشاهده بیشتر سوابق") */}
      {selectedConsultantForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                {selectedConsultantForModal.avatarUrl ? (
                  <img
                    src={selectedConsultantForModal.avatarUrl}
                    alt={selectedConsultantForModal.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 font-black flex items-center justify-center text-xl border border-amber-500">
                    {selectedConsultantForModal.name.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedConsultantForModal.name}
                  </h2>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                    {selectedConsultantForModal.academicRank || 'مشاور ارشد مرکز'} — {selectedConsultantForModal.title}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {selectedConsultantForModal.experienceYears} سال سابقه فعالیت تخصصی
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedConsultantForModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resume Content */}
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-500" />
                  <span>معرفی و بیوگرافی:</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl">
                  {selectedConsultantForModal.bio}
                </p>
              </div>

              {selectedConsultantForModal.resumeDetails && selectedConsultantForModal.resumeDetails.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>سوابق علمی، پژوهشی و اجرایی:</span>
                  </h3>
                  <div className="space-y-2">
                    {selectedConsultantForModal.resumeDetails.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>تخصص‌های درمانی و حوزه‌های مشاوره:</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedConsultantForModal.specialties || [selectedConsultantForModal.specialty]).map((spec: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 rounded-lg font-medium text-[11px]">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">برنامه زمانی و حضور در مرکز:</span>
                <span className="text-slate-600 dark:text-slate-400 block">{selectedConsultantForModal.availability}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedConsultantForModal(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs font-medium"
              >
                بستن
              </button>
              <button
                onClick={() => {
                  setPreferredConsultantId(selectedConsultantForModal.id);
                  setSelectedConsultantForModal(null);
                  setActiveTab('request');
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <Calendar className="w-4 h-4" />
                <span>ثبت نوبت با این مشاور</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Admin Add/Edit Consultant */}
      {(editingConsultant || isAddingConsultant) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAddingConsultant ? 'افزودن مشاور جدید به مرکز' : 'ویرایش مشخصات و عکس مشاور'}
              </h2>
              <button
                onClick={() => {
                  setEditingConsultant(null);
                  setIsAddingConsultant(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultantEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی:
                </label>
                <input
                  type="text"
                  required
                  value={consultantForm.name || ''}
                  onChange={e => setConsultantForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مرتبه علمی / عنوان تخصصی:
                </label>
                <input
                  type="text"
                  placeholder="مثال: دانشیار دانشگاه و روان‌شناس بالینی ارشد"
                  value={consultantForm.academicRank || ''}
                  onChange={e => setConsultantForm(prev => ({ ...prev, academicRank: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان شیوه‌نامه یا حوزه اصلی:
                </label>
                <input
                  type="text"
                  required
                  value={consultantForm.title || ''}
                  onChange={e => setConsultantForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  آدرس تصویر / عکس پرتره مشاور (URL):
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={consultantForm.avatarUrl || ''}
                  onChange={e => setConsultantForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سابقه فعالیت (سال):
                  </label>
                  <input
                    type="number"
                    value={consultantForm.experienceYears || 5}
                    onChange={e => setConsultantForm(prev => ({ ...prev, experienceYears: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تقویم حضور:
                  </label>
                  <input
                    type="text"
                    value={consultantForm.availability || ''}
                    onChange={e => setConsultantForm(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شرح مختصر بیوگرافی:
                </label>
                <textarea
                  rows={3}
                  value={consultantForm.bio || ''}
                  onChange={e => setConsultantForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingConsultant(null);
                    setIsAddingConsultant(false);
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Admin Appointment Scheduling */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  تعیین زمان جلسه و بروزرسانی نوبت
                </h2>
                <span className="text-[11px] text-slate-400">متقاضی: {editingRequest.applicantName}</span>
              </div>
              <button
                onClick={() => setEditingRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  وضعیت نوبت:
                </label>
                <select
                  value={adminScheduleForm.status}
                  onChange={e => setAdminScheduleForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="pending">در حال بررسی دبیرخانه</option>
                  <option value="scheduled">هماهنگ‌شده و فعال (در پیش رو)</option>
                  <option value="attended">شرکت‌کرده (پایان یافته با موفقیت)</option>
                  <option value="cancelled">لغوشده</option>
                  <option value="absent">غایب در جلسه</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    تاریخ جلسه (هجری شمسی):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1403/08/25"
                    value={adminScheduleForm.scheduledDate}
                    onChange={e => setAdminScheduleForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    ساعت برگزاری:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="16:30"
                    value={adminScheduleForm.scheduledTime}
                    onChange={e => setAdminScheduleForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  مشاور اختصاص یافته:
                </label>
                <select
                  value={adminScheduleForm.preferredConsultantId}
                  onChange={e => setAdminScheduleForm(prev => ({ ...prev, preferredConsultantId: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {consultants.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  مکان / لینک دسترسی برخط:
                </label>
                <input
                  type="text"
                  required
                  placeholder="آدرس مرکز یا لینک تصویری https://meet.feqh.ir/counseling"
                  value={adminScheduleForm.venueDetails}
                  onChange={e => setAdminScheduleForm(prev => ({ ...prev, venueDetails: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  توصیه یا یادداشت مشاور/دبیرخانه:
                </label>
                <textarea
                  rows={3}
                  placeholder="یادداشت‌های پس از جلسه یا نکات جهت مطالعه قبل از جلسه..."
                  value={adminScheduleForm.counselorNotes}
                  onChange={e => setAdminScheduleForm(prev => ({ ...prev, counselorNotes: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  ذخیره زمان و نوبت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

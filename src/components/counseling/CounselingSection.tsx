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
  Scale
} from 'lucide-react';

export const CounselingSection: React.FC = () => {
  const { currentUser, consultants, counselingRequests, bookCounseling, updateCounselingStatus } = useApp();

  const [activeTab, setActiveTab] = useState<'request' | 'academic_special' | 'consultants' | 'my_requests' | 'articles'>('request');
  
  // Booking Form State
  const [category, setCategory] = useState<CounselingCategory>('judicial_career');
  const [preferredConsultantId, setPreferredConsultantId] = useState('');
  const [meetingMode, setMeetingMode] = useState<'حضوری' | 'برخط (تصویری امن)' | 'تلفنی'>('برخط (تصویری امن)');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const myRequests = counselingRequests.filter(r => isOfficial || r.applicantId === currentUser?.id);

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let catTitle = 'مشاوره شغلی و تحصیلی قضاوت';
    if (category === 'individual') catTitle = 'مشاوره فردی و تاب‌آوری';
    if (category === 'family') catTitle = 'مشاوره خانواده و زوج‌درمانی';
    if (category === 'personality') catTitle = 'مشاوره شخصیتی و مدیریت اضطراب';
    if (category === 'academic') catTitle = 'مشاوره تحصیلی و آزمون‌های تکمیلی';

    const selectedConsultant = consultants.find(c => c.id === preferredConsultantId);

    bookCounseling({
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      category,
      categoryTitle: catTitle,
      preferredConsultantId: preferredConsultantId || undefined,
      preferredConsultantName: selectedConsultant?.name,
      description,
      meetingMode,
    });

    setDescription('');
    setSuccessMsg('درخواست مشاوره شما با موفقیت ثبت شد. دبیرخانه ظرف ۲۴ ساعت آینده جهت تعیین وقت دقیق تماس خواهد گرفت.');
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernMetricCard
          title="مشاوران و روان‌شناسان همکار"
          value={consultants.length}
          periodLabel="اساتید و متخصصین معتمد"
          unit="نفر"
          icon={<HeartHandshake className="w-4 h-4 text-amber-500" />}
          onClick={() => setActiveTab('consultants')}
        />
        <ModernMetricCard
          title="نوبت‌های ثبت‌شده"
          value={myRequests.length}
          periodLabel="جلسات هماهنگ‌شده و جاری"
          unit="جلسه"
          icon={<Calendar className="w-4 h-4 text-blue-500" />}
          onClick={() => setActiveTab('my_requests')}
        />
        <ModernMetricCard
          title="هدایت شغلی قضاوت"
          value="پیشکسوتان"
          periodLabel="قضات بازنشسته و اساتید"
          icon={<Scale className="w-4 h-4 text-emerald-500" />}
          onClick={() => setActiveTab('academic_special')}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            خدمات روان‌شناختی، سلامت شغلی و مشاوره تخصصی
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>مدیریت فرسودگی شغلی، تحکیم خانواده و بخش ویژه هدایت تحصیلی-شغلی قضاوت</span>
            <span aria-hidden="true">·</span>
            <span>۱۰۰٪ محرمانه و بدون افشای هویت</span>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'request'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          ثبت نوبت مشاوره
        </button>
        <button
          onClick={() => setActiveTab('academic_special')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'academic_special'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          بخش ویژه: مشاوره تحصیلی و شغلی قضاوت
        </button>
        <button
          onClick={() => setActiveTab('consultants')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'consultants'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          مشاوران همکار ({consultants.length})
        </button>
        <button
          onClick={() => setActiveTab('my_requests')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
            activeTab === 'my_requests'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          پیگیری نوبت‌ها ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
            activeTab === 'articles'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          راهنماهای سلامت روانی
        </button>
      </div>

      {/* Tab 1: Request Booking Form */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              فرم درخواست وقت مشاوره و ارزیابی تخصصی
            </h2>

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  زمینه و موضوع مشاوره:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('judicial_career')}
                    className={`p-2.5 rounded-lg border text-xs text-right transition-colors ${
                      category === 'judicial_career'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    مسیر شغلی و تحصیلی قضاوت
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('individual')}
                    className={`p-2.5 rounded-lg border text-xs text-right transition-colors ${
                      category === 'individual'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    فردی و تاب‌آوری شغلی
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('family')}
                    className={`p-2.5 rounded-lg border text-xs text-right transition-colors ${
                      category === 'family'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    خانواده و زوج‌درمانی
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('personality')}
                    className={`p-2.5 rounded-lg border text-xs text-right transition-colors ${
                      category === 'personality'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    شخصیتی و اضطراب
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('academic')}
                    className={`p-2.5 rounded-lg border text-xs text-right transition-colors ${
                      category === 'academic'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    تحصیلی و آزمون‌های تکمیلی
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  مشاور پیشنهادی (اختیاری):
                </label>
                <select
                  value={preferredConsultantId}
                  onChange={e => setPreferredConsultantId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">هماهنگی توسط دبیرخانه با مناسب‌ترین مشاور</option>
                  {consultants.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - ({c.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  شیوه برگزاری جلسه:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                    meetingMode === 'برخط (تصویری امن)'
                      ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      className="hidden"
                      checked={meetingMode === 'برخط (تصویری امن)'}
                      onChange={() => setMeetingMode('برخط (تصویری امن)')}
                    />
                    <Video className="w-4 h-4 shrink-0" />
                    <span>برخط (تصویری امن)</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                    meetingMode === 'حضوری'
                      ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      className="hidden"
                      checked={meetingMode === 'حضوری'}
                      onChange={() => setMeetingMode('حضوری')}
                    />
                    <Building className="w-4 h-4 shrink-0" />
                    <span>حضوری (تهران/قم)</span>
                  </label>
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer ${
                    meetingMode === 'تلفنی'
                      ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="mode"
                      className="hidden"
                      checked={meetingMode === 'تلفنی'}
                      onChange={() => setMeetingMode('تلفنی')}
                    />
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>تلفنی (خط امن)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  خلاصه موضوع یا چالش مورد مشورت:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="موضوع اصلی، اهداف مد نظر و روزهای پیشنهادی خود را مرقوم فرمایید..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>ثبت قطعی درخواست مشاوره</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">پروتکل محرمانگی قضایی:</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                با توجه به شأن و مسئولیت‌های خطیر قضاوت، تمامی فرآیند مشاوره با کد رمزنگاری‌شده و بدون درج مشخصات شغلی در دسترس عموم ساماندهی می‌شود.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">مراحل بعد از ثبت:</span>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="font-mono tabular-nums text-slate-400">۱.</span>
                  <span>بررسی اولیه موضوع توسط دبیرخانه</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono tabular-nums text-slate-400">۲.</span>
                  <span>هماهنگی تقویم آزاد مشاور معتمد</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono tabular-nums text-slate-400">۳.</span>
                  <span>ارسال لینک نشست رمزنگاری‌شده به همراه پیامک یادآور</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Specialized Academic & Judicial Career Counseling */}
      {activeTab === 'academic_special' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-6 space-y-2">
            <div className="text-xs text-amber-400 font-semibold">
              کلینیک تخصصی هدایت شغلی و رشد علمی قضاوت
            </div>
            <h2 className="text-base font-bold text-white">
              مشاوره پیشرفت تحصیلی و ارتقای رتبه قضایی با اساتید پیشکسوت
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              ویژه دانش‌آموختگانی که در محاکم بدوی یا تجدیدنظر مشغول خدمت بوده و به دنبال ادامه تحصیل در مقطع سطح ۴ و دکتری، انتشار کتب فقهی، یا ارتقا به دیوان عالی هستند.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2">
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold text-sm block">۰۱.</span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">انتخاب گرایش تخصصی</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                راهنمایی در انتخاب گرایش‌های نوظهور مانند فقه جزا و فناوری، حقوق اقتصادی و قراردادهای عمومی.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2">
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold text-sm block">۰۲.</span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">برنامه‌ریزی رساله دکتری</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                هموارسازی نگارش رساله حین خدمت پرفشار قضایی و زمان‌بندی جلسات دفاع.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2">
              <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 font-bold text-sm block">۰۳.</span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">آمادگی مصاحبه‌های ترفیع</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                تحلیل نقاط استدلال دادنامه‌ها جهت ارتقا به شعب تخصصی دیوان عالی کشور.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Consultants Directory */}
      {activeTab === 'consultants' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {consultants.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">{c.experienceYears} سال سابقه</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{c.title}</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                  {c.bio}
                </p>
                <div className="text-[11px] text-slate-400 pt-1">
                  <span>روزهای پاسخگویی: {c.availability}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setPreferredConsultantId(c.id);
                    setActiveTab('request');
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-medium active:scale-[0.98]"
                >
                  درخواست نوبت
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: My Requests */}
      {activeTab === 'my_requests' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
            لیست درخواست‌ها و نوبت‌های ثبت‌شده:
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {myRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                نوبتی در این بخش ثبت نشده است.
              </div>
            ) : (
              myRequests.map(req => (
                <div key={req.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{req.categoryTitle}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-slate-500">{req.meetingMode}</span>
                      {req.scheduledDate && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">{req.scheduledDate}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{req.description}</p>
                  </div>

                  {isOfficial && req.status === 'pending' && (
                    <button
                      onClick={() => {
                        const date = prompt('زمان جلسه را مشخص فرمایید:');
                        if (date) updateCounselingStatus(req.id, 'scheduled', date);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-medium shrink-0"
                    >
                      تایید زمان جلسه
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Psychological Guides */}
      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              مدیریت خستگی تصمیم‌گیری (Decision Fatigue) در تراکم پرونده‌ها
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              راهکارهای عملی برای تجدید قوای شناختی و تمرکز ذهنی بین جلسات رسیدگی محاکم به منظور جلوگیری از اطاله دادرسی...
            </p>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums block pt-2">مدت مطالعه: ۵ دقیقه</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              تفکیک بار احساسی پرونده‌های جنایی و خانواده از حریم منزل
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تکنیک‌های شناختی-رفتاری جهت حفظ تعادل روانی و روابط خانوادگی در مواجهه با پرونده‌های سنگین و آزاردهنده...
            </p>
            <span className="text-[11px] text-slate-400 font-mono tabular-nums block pt-2">مدت مطالعه: ۷ دقیقه</span>
          </div>
        </div>
      )}
    </div>
  );
};

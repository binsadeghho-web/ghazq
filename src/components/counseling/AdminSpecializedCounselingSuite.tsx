import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingRequest } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Scale,
  Award,
  BookOpen,
  Calendar,
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
  Video,
  Building2,
  Sliders,
  DollarSign,
  TrendingUp,
  X,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Percent
} from 'lucide-react';

interface AdminSpecializedCounselingSuiteProps {
  onSwitchToStudentPreview: () => void;
}

export const AdminSpecializedCounselingSuite: React.FC<AdminSpecializedCounselingSuiteProps> = ({
  onSwitchToStudentPreview
}) => {
  const {
    currentUser,
    consultants,
    counselingRequests,
    updateCounselingStatus,
    updateConsultant,
    addConsultant,
    deleteConsultant
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dossiers' | 'advisors' | 'form_settings' | 'analytics'>('dossiers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'attended' | 'cancelled'>('all');

  // Modal State for Dossier Evaluation & Scheduling
  const [selectedRequest, setSelectedRequest] = useState<CounselingRequest | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    status: 'scheduled' as CounselingRequest['status'],
    scheduledDate: '',
    scheduledTime: '17:00',
    meetingMode: 'برخط (تصویری امن)' as 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    venueDetails: '',
    preferredConsultantId: '',
    counselorNotes: '',
    evaluationScore: 'عالی (رتبه ۱)',
    recommendationIssued: true
  });

  // Modal State for Adding/Editing Senior Judges / Advisors
  const [editingJudge, setEditingJudge] = useState<Consultant | null>(null);
  const [isAddJudgeOpen, setIsAddJudgeOpen] = useState(false);
  const [judgeForm, setJudgeForm] = useState<Partial<Consultant>>({
    name: '',
    title: 'مستشار دیوان عالی کشور و استاد خارج فقه القضا',
    specialty: 'ارتقای پایه قضایی و آماده‌سازی اختبار محاکم تجدیدنظر',
    experienceYears: 25,
    academicRank: 'قاضی پایه ۱۱ و استاد سطوح عالی',
    availability: 'دوشنبه‌ها و پنج‌شنبه‌ها عصر',
    fee: 2500000,
    subsidyNotice: '۶۵٪ سهم یارانه مرکز دانش‌آموختگان',
    avatarUrl: '/assets/cleric_portrait.jpg',
    counselingType: 'specialized_career',
    isActive: true
  });

  // Form Customizer State
  const [formRequirements, setFormRequirements] = useState({
    requireJudicialBase: true,
    requireCourtLocation: true,
    requireSampleRulingUpload: true,
    requireCvSummary: true,
    requireTargetRankSelection: true,
    centerSubsidyPercent: 65,
    generalTariff: 2500000,
    subsidyPolicyNotice: 'با مصوبه شورای عالی هدایت نخبگان، ۶۵٪ از هزینه جلسات مشاوره تخصصی و شبیه‌سازی اختبار مستقیماً از محل گرنت مرکز تامین گردیده و سهم پرداختی قاضی صرفاً ۳۵٪ می‌باشد.'
  });

  // Filter specialized career requests
  const specializedRequests = counselingRequests.filter(
    r => r.counselingType === 'specialized_career' || r.category === 'judicial_career'
  );

  const filteredRequests = specializedRequests.filter(r => {
    const matchesSearch =
      (r.applicantName || '').includes(searchQuery) ||
      (r.userNationalId || '').includes(searchQuery) ||
      (r.userPhone || '').includes(searchQuery) ||
      (r.categoryTitle || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter specialized senior consultants
  const seniorJudges = consultants.filter(c => c.counselingType === 'specialized_career');

  // Key Counters
  const totalDossiers = specializedRequests.length;
  const pendingDossiers = specializedRequests.filter(r => r.status === 'pending').length;
  const scheduledDossiers = specializedRequests.filter(r => r.status === 'scheduled').length;
  const completedPromotions = specializedRequests.filter(r => r.status === 'attended').length;

  const handleOpenSchedule = (req: CounselingRequest) => {
    setSelectedRequest(req);
    setScheduleForm({
      status: req.status === 'pending' ? 'scheduled' : req.status,
      scheduledDate: req.scheduledDate || new Date().toLocaleDateString('fa-IR'),
      scheduledTime: req.scheduledTime || '17:00',
      meetingMode: req.meetingMode || 'برخط (تصویری امن)',
      venueDetails: req.venueDetails || 'تالار وبینار اختصاصی دیوان: https://meet.feqh.ir/supreme-court',
      preferredConsultantId: req.preferredConsultantId || (seniorJudges[0]?.id || consultants[0]?.id || ''),
      counselorNotes: req.counselorNotes || '',
      evaluationScore: 'صلاحیت تاییدشده جهت ترفیع',
      recommendationIssued: true
    });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    const judgeObj = consultants.find(c => c.id === scheduleForm.preferredConsultantId);

    updateCounselingStatus(
      selectedRequest.id,
      scheduleForm.status,
      scheduleForm.scheduledDate,
      scheduleForm.counselorNotes,
      scheduleForm.scheduledTime,
      scheduleForm.venueDetails,
      scheduleForm.meetingMode,
      scheduleForm.preferredConsultantId,
      judgeObj?.name
    );
    setSelectedRequest(null);
  };

  const handleSaveJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJudge) {
      updateConsultant(editingJudge.id, judgeForm);
      setEditingJudge(null);
    } else {
      addConsultant({
        name: judgeForm.name || 'قاضی پیشکسوت جدید',
        title: judgeForm.title || 'مستشار دیوان عالی کشور',
        specialty: judgeForm.specialty || 'هدایت شغلی قضایی و اختبار',
        experienceYears: judgeForm.experienceYears || 20,
        availability: judgeForm.availability || 'پنج‌شنبه‌ها عصر',
        avatarUrl: judgeForm.avatarUrl || '/assets/cleric_portrait.jpg',
        academicRank: judgeForm.academicRank || 'استاد مدعو',
        bio: judgeForm.bio || 'مستشار و قاضی پیشکسوت دیوان عالی کشور و داور علمی هدایت شغلی نخبگان',
        fee: judgeForm.fee || formRequirements.generalTariff,
        subsidyNotice: `${formRequirements.centerSubsidyPercent}٪ سهم یارانه مرکز`,
        resumeDetails: [],
        isActive: true,
        counselingType: 'specialized_career'
      });
      setIsAddJudgeOpen(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* EXECUTIVE HEADER */}
      <div className="bg-gradient-to-r from-stone-950 via-slate-900 to-amber-950 text-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-amber-800/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                شورای عالی ارتقا و ترفیع قضایی
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                کارتابل مشاوره تخصصی نخبگان
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-stone-300 text-xs font-mono">
                دیوان عالی کشور · دادگاه‌های تجدیدنظر
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              میز هدایت شغلی-تحصیلی، ترفیع رتبه قضایی و شبیه‌سازی مصاحبه‌های اختبار
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-2xl leading-relaxed">
              ارزیابی پرونده‌های ترفیع پایه قضایی، شبیه‌سازی جلسات اختبار، تخصیص مستشاران معین، مدیریت تعرفه‌ها و تنظیم یارانه آموزشی مرکز نخبگان
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onSwitchToStudentPreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all shadow-sm hover:scale-102 active:scale-98 cursor-pointer backdrop-blur-md"
            >
              <Eye className="w-4 h-4 text-amber-300" />
              <span>مشاهده پیش‌نمایش دانش‌آموخته</span>
            </button>
          </div>
        </div>

        {/* 4 STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">کل پرونده‌های ارتقای نخبگان</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white">{toPersianNumbers(totalDossiers)}</span>
              <span className="text-[10px] text-amber-400 font-bold">{toPersianNumbers(completedPromotions)} مصاحبه موفق</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">درخواست‌های در انتظار داوری</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-amber-300">{toPersianNumbers(pendingDossiers)}</span>
              <span className="text-[10px] text-amber-400 font-bold">نیازمند تعیین وقت داور</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">قضات عالی‌رتبه و داوران اختبار</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white">{toPersianNumbers(seniorJudges.length || 4)}</span>
              <span className="text-[10px] text-emerald-400 font-bold">مستشاران پیشکسوت</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">سهم یارانه مصوب مرکز</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{toPersianNumbers(formRequirements.centerSubsidyPercent)}٪</span>
              <span className="text-[10px] text-stone-300 font-medium">سهم متقاضی: ۳۵٪</span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 overflow-x-auto scrollbar-none">
        {[
          { id: 'dossiers', label: 'کارتابل متقاضیان ارتقای قضایی و اختبار', icon: FileCheck, badge: pendingDossiers > 0 ? `${toPersianNumbers(pendingDossiers)} نیازمند اقدام` : undefined },
          { id: 'advisors', label: 'هیئت قضات پیشکسوت و مستشاران دیوان', icon: Award, badge: `${toPersianNumbers(seniorJudges.length || 4)} استاد` },
          { id: 'form_settings', label: 'شخصی‌سازی فیلدهای فرم، شروط و یارانه', icon: Sliders },
          { id: 'analytics', label: 'شاخص‌های ترفیع و نتایج مصاحبه‌ها', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-900 text-white shadow-sm'
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
          TAB 1: DOSSIERS & PROMOTION QUEUE
          ========================================================================= */}
      {activeTab === 'dossiers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام قاضی، پایه، شعبه یا موضوع..."
                className="bg-transparent text-xs text-stone-900 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'همه تقاضاها' },
                { id: 'pending', label: 'نیازمند داور' },
                { id: 'scheduled', label: 'هماهنگ‌شده' },
                { id: 'attended', label: 'ارزیابی مثبت' },
                { id: 'cancelled', label: 'رد / لغوشده' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-amber-900 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
              <Scale className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-bold text-stone-700 text-sm">هیچ پرونده ارتقایی با این فیلتر ثبت نشده است</h3>
              <p className="text-xs text-stone-500">تمامی پرونده‌های متقاضیان ارتقا به شعب دیوان و تجدیدنظر در این بخش فهرست می‌شوند.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                const isScheduled = req.status === 'scheduled';
                const isAttended = req.status === 'attended';

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                      isPending ? 'border-amber-400 ring-2 ring-amber-100' : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-yellow-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            <Scale className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-sm text-stone-900">{req.applicantName}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                                {req.userRoleTitle || 'قاضی شعبه'}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 font-bold mt-0.5">
                              {req.categoryTitle || 'ارتقا به شعب تجدیدنظر و دیوان عالی'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                              : isScheduled
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : isAttended
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {isPending ? 'نیازمند تخصیص داور' : isScheduled ? 'جلسه مصاحبه تنظیم شد' : 'صلاحیت تایید شد'}
                        </span>
                      </div>

                      {/* Dossier Meta Details */}
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-2">
                        <div className="flex items-center justify-between text-stone-600 text-[11px]">
                          <span>تلفن تماس مستقیم: {toPersianNumbers(req.userPhone || '---')}</span>
                          <span className="font-mono text-emerald-800 font-bold">
                            یارانه ۶۵٪ اعمال شد
                          </span>
                        </div>

                        {req.description && (
                          <div className="bg-white p-2.5 rounded-xl border border-stone-200 text-[11px] leading-relaxed text-stone-700">
                            <span className="font-bold text-stone-900 block mb-0.5">شرح هدف ارتقا و موضوع اختبار:</span>
                            {req.description}
                          </div>
                        )}

                        {(req.scheduledDate || req.scheduledTime) && (
                          <div className="flex items-center justify-between text-[11px] text-amber-950 bg-amber-50 p-2 rounded-xl border border-amber-200">
                            <span className="font-bold">
                              زمان مصاحبه: {toPersianNumbers(req.scheduledDate || '')} ساعت {toPersianNumbers(req.scheduledTime || '')}
                            </span>
                            <span className="font-bold text-emerald-800">
                              استاد داور: {req.preferredConsultantName || 'مستشار دیوان'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenSchedule(req)}
                        className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isPending ? 'تخصیص استاد و تعیین نوبت' : 'ویرایش جزئیات ارزیابی'}</span>
                      </button>

                      {!isAttended && (
                        <button
                          onClick={() => updateCounselingStatus(req.id, 'attended')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>تایید ارزیابی و صلاحیت</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: SENIOR JUDGES & ADVISORS BOARD
          ========================================================================= */}
      {activeTab === 'advisors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-black text-sm text-stone-900">هیئت مستشاران دیوان عالی کشور و داوران ارتقای قضایی</h3>
              <p className="text-xs text-stone-500 mt-0.5">تعیین تعرفه، سهمیه تخفیف و ساعات حضور در اتاق مصاحبه</p>
            </div>
            <button
              onClick={() => {
                setJudgeForm({
                  name: '',
                  title: 'مستشار دیوان عالی کشور',
                  specialty: 'ارتقای پایه و مصاحبه اختبار تجدیدنظر',
                  experienceYears: 25,
                  academicRank: 'قاضی پایه ۱۱',
                  availability: 'پنج‌شنبه‌ها ۱۶ الی ۲۰',
                  fee: formRequirements.generalTariff,
                  subsidyNotice: '۶۵٪ سهم یارانه مرکز',
                  avatarUrl: '/assets/cleric_portrait.jpg',
                  isActive: true,
                  counselingType: 'specialized_career'
                });
                setIsAddJudgeOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن قاضی پیشکسوت / داور</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seniorJudges.map(j => (
              <div
                key={j.id}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={j.avatarUrl || '/assets/cleric_portrait.jpg'}
                      alt={j.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-200 shadow-xs shrink-0"
                    />
                    <div>
                      <h4 className="font-black text-sm text-stone-900">{j.name}</h4>
                      <p className="text-xs text-amber-900 font-bold">{j.title}</p>
                      <span className="text-[11px] text-stone-500 font-medium">{j.academicRank}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1.5">
                    <p className="text-stone-700">
                      <span className="font-bold text-stone-900">حوزه داوری: </span>
                      {j.specialty}
                    </p>
                    <p className="text-stone-700">
                      <span className="font-bold text-stone-900">ساعات حضور: </span>
                      {j.availability}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
                      <span className="text-emerald-800 font-bold">{j.subsidyNotice || 'یارانه مرکز فعال'}</span>
                      <span className="font-bold text-stone-900">{toPersianNumbers(j.experienceYears)} سال سابقه</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      updateConsultant(j.id, { isActive: j.isActive === false ? true : false });
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      j.isActive === false
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {j.isActive === false ? 'فعال‌سازی داور' : 'غیرفعال‌سازی موقت'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingJudge(j);
                        setJudgeForm(j);
                      }}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`آیا از حذف استاد «${j.name}» اطمینان دارید؟`)) {
                          deleteConsultant(j.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: FORM SETTINGS & SUBSIDY RULES
          ========================================================================= */}
      {activeTab === 'form_settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
            <h3 className="font-black text-sm text-stone-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-800" />
              <span>تنظیمات مدارک الزامی و فیلدهای فرم تقاضای ارتقا</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'requireJudicialBase', label: 'الزامی بودن درج پایه قضایی فعلی متقاضی' },
                { key: 'requireCourtLocation', label: 'الزامی بودن درج استان و حوزه قضایی خدمت' },
                { key: 'requireSampleRulingUpload', label: 'الزام بارگذاری نمونه دادنامه مستدل جهت ارزیابی اولیه' },
                { key: 'requireCvSummary', label: 'الزام پیوست خلاصه سوابق تدریس، پژوهش و مقالات' },
                { key: 'requireTargetRankSelection', label: 'اجبار به انتخاب سمت هدف (دیوان عالی / تجدیدنظر / دادسرا)' },
              ].map(cfg => (
                <label
                  key={cfg.key}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-amber-50/40 transition-colors"
                >
                  <span className="text-xs font-bold text-stone-800">{cfg.label}</span>
                  <input
                    type="checkbox"
                    checked={(formRequirements as any)[cfg.key]}
                    onChange={e =>
                      setFormRequirements(prev => ({ ...prev, [cfg.key]: e.target.checked }))
                    }
                    className="w-4 h-4 accent-amber-800 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <h4 className="font-bold text-xs text-amber-950 flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-800" />
                <span>سیاست یارانه و سهم گرنت آموزشی مرکز:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">درصد یارانه مرکز (تخفیف):</label>
                  <input
                    type="number"
                    value={formRequirements.centerSubsidyPercent}
                    onChange={e =>
                      setFormRequirements(prev => ({ ...prev, centerSubsidyPercent: Number(e.target.value) }))
                    }
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">تعرفه رسمی هر جلسه داوری (ریال):</label>
                  <input
                    type="number"
                    value={formRequirements.generalTariff}
                    onChange={e =>
                      setFormRequirements(prev => ({ ...prev, generalTariff: Number(e.target.value) || 0 }))
                    }
                    className="w-full p-2.5 rounded-xl bg-white border border-stone-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1 text-xs">متن راهنمای سهم یارانه به اعضا:</label>
                <textarea
                  rows={2}
                  value={formRequirements.subsidyPolicyNotice}
                  onChange={e =>
                    setFormRequirements(prev => ({ ...prev, subsidyPolicyNotice: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-xl bg-white border border-stone-200 text-xs leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ANALYTICS & PROMOTION RESULTS
          ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3">
            <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>نتایج مصاحبه‌های اختبار</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>قبولی قطعی در دیوان عالی و تجدیدنظر</span>
                <span className="text-emerald-700">۸۸.۴٪</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '88.4%' }} />
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed mt-2">
                بر اساس بازخورد داوران، شبیه‌سازی سوالات فقهی و آراء وحدت رویه بیشترین تاثیر را در ترفیع متقاضیان داشته است.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3">
            <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>پایه‌های قضایی مراجعین</span>
            </h4>
            <div className="space-y-1.5 text-xs">
              {[
                { rank: 'پایه ۸ و ۹ (آمادگی دیوان عالی)', count: '۴۲ قاضی' },
                { rank: 'پایه ۶ و ۷ (محاکم تجدیدنظر)', count: '۵۸ قاضی' },
                { rank: 'پایه ۴ و ۵ (ریاست شعب دادگاه)', count: '۳۶ قاضی' },
              ].map(r => (
                <div key={r.rank} className="p-2.5 bg-stone-50 rounded-xl flex justify-between font-bold">
                  <span>{r.rank}</span>
                  <span className="text-amber-900">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3">
            <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-teal-600" />
              <span>گرنت آموزشی مصرف‌شده</span>
            </h4>
            <p className="text-2xl font-black text-emerald-800">۱۸۲,۵۰۰,۰۰۰ ریال</p>
            <p className="text-xs text-stone-500">
              تخصیص‌یافته از محل بودجه مصوب حمایت از پژوهش‌ها و ترفیع نخبگان حوزوی و قضایی
            </p>
          </div>
        </div>
      )}

      {/* SCHEDULE DOSSIER MODAL */}
      <AnimatePresence>
        {selectedRequest && (
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
                  <Scale className="w-5 h-5 text-amber-800" />
                  <h3 className="font-black text-sm text-stone-900">
                    تعیین وقت داوری ارتقای قضایی: {selectedRequest.applicantName}
                  </h3>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">استاد داور / مستشار دیوان:</label>
                  <select
                    value={scheduleForm.preferredConsultantId}
                    onChange={e => setScheduleForm({ ...scheduleForm, preferredConsultantId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-xs"
                  >
                    {seniorJudges.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.name} - {j.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">تاریخ مصاحبه:</label>
                    <input
                      type="text"
                      value={scheduleForm.scheduledDate}
                      onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                      placeholder="۱۴۰۳/۰۹/۱۰"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">ساعت جلسه:</label>
                    <input
                      type="text"
                      value={scheduleForm.scheduledTime}
                      onChange={e => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                      placeholder="۱۷:۳۰"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">لینک وبینار تصویری امن / شماره سالن:</label>
                  <input
                    type="text"
                    value={scheduleForm.venueDetails}
                    onChange={e => setScheduleForm({ ...scheduleForm, venueDetails: e.target.value })}
                    placeholder="https://meet.feqh.ir/supreme-court"
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">توصیه‌نامه یا یادداشت هماهنگی ارتقا:</label>
                  <textarea
                    rows={2}
                    value={scheduleForm.counselorNotes}
                    onChange={e => setScheduleForm({ ...scheduleForm, counselorNotes: e.target.value })}
                    placeholder="مطالعه آرای وحدت رویه سال ۱۴۰۲ جهت آمادگی مصاحبه..."
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold cursor-pointer shadow-xs"
                  >
                    ذخیره و ابلاغ به قاضی
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD/EDIT JUDGE MODAL */}
      <AnimatePresence>
        {(isAddJudgeOpen || editingJudge) && (
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
                  <Award className="w-5 h-5 text-amber-800" />
                  <h3 className="font-black text-sm text-stone-900">
                    {editingJudge ? `ویرایش مشخصات ${editingJudge.name}` : 'افزودن مستشار و داور ارتقای قضایی'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddJudgeOpen(false);
                    setEditingJudge(null);
                  }}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJudge} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={judgeForm.name || ''}
                      onChange={e => setJudgeForm({ ...judgeForm, name: e.target.value })}
                      placeholder="استاد سید علی حسینی"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">سمت قضایی / دانشگاهی:</label>
                    <input
                      type="text"
                      value={judgeForm.title || ''}
                      onChange={e => setJudgeForm({ ...judgeForm, title: e.target.value })}
                      placeholder="مستشار شعبه دیوان عالی کشور"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">حوزه داوری و تخصص:</label>
                    <input
                      type="text"
                      value={judgeForm.specialty || ''}
                      onChange={e => setJudgeForm({ ...judgeForm, specialty: e.target.value })}
                      placeholder="حقوق جزا، اختبار دیوان"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">روزهای حضور:</label>
                    <input
                      type="text"
                      value={judgeForm.availability || ''}
                      onChange={e => setJudgeForm({ ...judgeForm, availability: e.target.value })}
                      placeholder="پنج‌شنبه‌ها ۱۶ الی ۲۰"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddJudgeOpen(false);
                      setEditingJudge(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-bold cursor-pointer shadow-xs"
                  >
                    ثبت استاد داور
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

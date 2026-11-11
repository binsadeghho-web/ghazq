import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingRequest, CounselingCategory } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { CounselingCalendarAndDossierSuite } from './CounselingCalendarAndDossierSuite';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Eye,
  Settings,
  Phone,
  Video,
  Building,
  Check,
  X,
  Shield,
  HeartHandshake,
  BarChart3,
  Sliders,
  FileText,
  FileCheck,
  Award,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface AdminCounselingGeneralSuiteProps {
  onSwitchToStudentPreview: () => void;
}

export const AdminCounselingGeneralSuite: React.FC<AdminCounselingGeneralSuiteProps> = ({
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

  const [activeTab, setActiveTab] = useState<'queue' | 'consultants' | 'form_builder' | 'analytics'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'attended' | 'cancelled'>('all');

  // Modals state
  const [editingRequest, setEditingRequest] = useState<CounselingRequest | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    status: 'scheduled' as CounselingRequest['status'],
    scheduledDate: '',
    scheduledTime: '16:00',
    meetingMode: 'برخط (تصویری امن)' as 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    venueDetails: '',
    preferredConsultantId: '',
    counselorNotes: ''
  });

  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isAddConsultantOpen, setIsAddConsultantOpen] = useState(false);
  const [consultantForm, setConsultantForm] = useState<Partial<Consultant>>({
    name: '',
    title: 'روان‌شناس و مشاور سلامت روان',
    specialty: 'مشاوره خانواده و زوج‌درمانی',
    experienceYears: 10,
    availability: 'شنبه‌ها و سه‌شنبه‌ها عصر',
    academicRank: 'استاد مدعو',
    avatarUrl: '/assets/cleric_portrait.jpg',
    isActive: true
  });

  // Dynamic Form Settings state (Admin can add/remove categories and toggle fields)
  const [counselingTopics, setCounselingTopics] = useState<Array<{ id: string; label: string; desc: string; active: boolean }>>([
    { id: 'individual', label: 'مشاوره فردی و تاب‌آوری شغلی', desc: 'مدیریت اضطراب، فرسودگی شغلی و آرامش ذهنی', active: true },
    { id: 'family', label: 'مشاوره خانواده و زوج‌درمانی', desc: 'روابط همسران، ارتباط موثر و حل تعارضات', active: true },
    { id: 'marriage', label: 'مشاوره پیش از ازدواج و گزینش همسر', desc: 'تست‌های شخصیت و ارزیابی تناسب طرفین', active: true },
    { id: 'personality', label: 'مشاوره شخصیت و کنترل هیجانات', desc: 'کنترل خشم و مدیریت بحران‌های روانی', active: true },
    { id: 'academic', label: 'مشاوره تحصیلی و آزمون‌های ارتقا', desc: 'برنامه‌ریزی مطالعاتی و کنکور دکتری', active: true },
  ]);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  const [formFieldsConfig, setFormFieldsConfig] = useState({
    requireSecondPhone: false,
    allowDocumentAttachment: true,
    showUrgencySelector: true,
    allowMeetingModeSelection: true,
    showPreferredTime: true,
    disclaimerText: 'کلیه اطلاعات ثبت‌شده در این کلینیک مطابق سوگندنامه رازداری اخلاقی، منحصراً در اختیار مشاور معین قرار گرفته و به هیچ وجه در پرونده اداری یا ارزیابی‌های شغلی منعکس نخواهد شد.'
  });

  // Filter general counseling requests (exclude purely specialized career)
  const generalRequests = counselingRequests.filter(r => r.counselingType !== 'specialized_career');

  const filteredRequests = generalRequests.filter(r => {
    const matchesSearch =
      (r.applicantName || '').includes(searchQuery) ||
      (r.userNationalId || '').includes(searchQuery) ||
      (r.userPhone || '').includes(searchQuery) ||
      (r.categoryTitle || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Key Counts
  const totalRequests = generalRequests.length;
  const pendingCount = generalRequests.filter(r => r.status === 'pending').length;
  const scheduledCount = generalRequests.filter(r => r.status === 'scheduled').length;
  const attendedCount = generalRequests.filter(r => r.status === 'attended').length;
  const activeConsultantsCount = consultants.filter(c => c.isActive !== false).length;

  const handleOpenScheduleModal = (req: CounselingRequest) => {
    setEditingRequest(req);
    setScheduleForm({
      status: req.status === 'pending' ? 'scheduled' : req.status,
      scheduledDate: req.scheduledDate || new Date().toLocaleDateString('fa-IR'),
      scheduledTime: req.scheduledTime || '16:30',
      meetingMode: req.meetingMode || 'برخط (تصویری امن)',
      venueDetails: req.venueDetails || (req.meetingMode === 'حضوری' ? 'اتاق مشاوره ۳ - مجتمع مرکزی' : 'https://meet.feqh.ir/room-private'),
      preferredConsultantId: req.preferredConsultantId || (consultants[0]?.id || ''),
      counselorNotes: req.counselorNotes || ''
    });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    const consObj = consultants.find(c => c.id === scheduleForm.preferredConsultantId);

    updateCounselingStatus(
      editingRequest.id,
      scheduleForm.status,
      scheduleForm.scheduledDate,
      scheduleForm.counselorNotes,
      scheduleForm.scheduledTime,
      scheduleForm.venueDetails,
      scheduleForm.meetingMode,
      scheduleForm.preferredConsultantId,
      consObj?.name
    );
    setEditingRequest(null);
  };

  const handleSaveConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConsultant) {
      updateConsultant(selectedConsultant.id, consultantForm);
      setSelectedConsultant(null);
    } else {
      addConsultant({
        name: consultantForm.name || 'مشاور جدید',
        title: consultantForm.title || 'روان‌شناس و مشاور سلامت روان',
        specialty: consultantForm.specialty || 'مشاوره فردی و خانواده',
        experienceYears: consultantForm.experienceYears || 5,
        availability: consultantForm.availability || 'شنبه‌ها و چهارشنبه‌ها',
        avatarUrl: consultantForm.avatarUrl || '/assets/cleric_portrait.jpg',
        academicRank: consultantForm.academicRank || 'استاد مدعو',
        bio: consultantForm.bio || 'مشاور خانواده و سلامت روان دانش‌آموختگان حوزوی و قضایی',
        resumeDetails: [],
        isActive: true
      });
      setIsAddConsultantOpen(false);
    }
  };

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const newTopic = {
      id: `topic_${Date.now()}`,
      label: newTopicName.trim(),
      desc: newTopicDesc.trim() || 'موضوع جدید مشاوره سلامت روان',
      active: true
    };
    setCounselingTopics(prev => [...prev, newTopic]);
    setNewTopicName('');
    setNewTopicDesc('');
    setIsAddTopicOpen(false);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* EXECUTIVE ADMIN HEADER */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-[32px] p-6 sm:p-8 shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                میز فرماندهی و نظارت اداری
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                کلینیک مشاوره عمومی و سلامت روان
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-stone-300 text-xs font-mono">
                سطح دسترسی: مدیر ارشد سامانه
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              سامانه جامع مدیریت نوبت‌ها، کادر روان‌شناسان و فرم‌های مشاوره عمومی
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 font-medium max-w-2xl leading-relaxed">
              رصد زنده متقاضیان، زمان‌بندی جلسات حضوری و برخط، تخصیص مشاور، مدیریت فرم‌های پذیرش و تنظیم ضوابط محرمانگی سلامت روان دانش‌آموختگان
            </p>
          </div>

          {/* Student View Preview Switcher */}
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

        {/* 4 EXECUTIVE KPI METRIC CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">کل نوبت‌های ثبت‌شده</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white">{toPersianNumbers(totalRequests)}</span>
              <span className="text-[10px] text-emerald-400 font-bold">{toPersianNumbers(attendedCount)} جلسه موفق</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">نوبت‌های در انتظار تایید</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-amber-300">{toPersianNumbers(pendingCount)}</span>
              <span className="text-[10px] text-amber-400 font-bold">نیازمند تعیین وقت</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">جلسات هماهنگ‌شده جاری</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-teal-300">{toPersianNumbers(scheduledCount)}</span>
              <span className="text-[10px] text-teal-400 font-bold">در تقویم هفته</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-1">
            <span className="text-[11px] text-stone-300 font-bold block">مشاوران و روان‌شناسان فعال</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white">{toPersianNumbers(activeConsultantsCount)}</span>
              <span className="text-[10px] text-emerald-400 font-bold">۹۹.۱٪ رضایت</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 overflow-x-auto scrollbar-none">
        {[
          { id: 'queue', label: 'میز مدیریت نوبت‌ها و رصد مراجعان', icon: Calendar, badge: pendingCount > 0 ? `${toPersianNumbers(pendingCount)} اقدام` : undefined },
          { id: 'consultants', label: 'مدیریت کادر مشاوران و ساعات حضور', icon: Users, badge: `${toPersianNumbers(consultants.length)} مشاور` },
          { id: 'form_builder', label: 'شخصی‌سازی فیلدهای فرم درخواست و موضوعات', icon: Sliders },
          { id: 'analytics', label: 'آمار، نظرسنجی و گزارشات عملکرد', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
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

      {/* سامانه تقویم نوبت‌دهی، مدیریت تقویم حضور مشاوران، پرونده جلسات و کنترل مخفی/آشکارسازی هویت متقاضیان */}
      <CounselingCalendarAndDossierSuite
        currentUser={currentUser}
        consultants={consultants}
        counselingRequests={counselingRequests}
        isOfficial={true}
      />

      {/* =========================================================================
          TAB 1: QUEUE & APPOINTMENT MANAGEMENT
          ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Search & Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام، کد ملی، شماره یا موضوع..."
                className="bg-transparent text-xs text-stone-900 focus:outline-none w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'همه نوبت‌ها' },
                { id: 'pending', label: 'در انتظار اقدام' },
                { id: 'scheduled', label: 'تعیین وقت‌شده' },
                { id: 'attended', label: 'برگزارشده' },
                { id: 'cancelled', label: 'لغوشده' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Grid / Cards */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-bold text-stone-700 text-sm">هیچ درخواستی با این مشخصات یافت نشد</h3>
              <p className="text-xs text-stone-500">می‌توانید فیلترها را تغییر داده یا از بخش جستجو نام دیگری را وارد نمایید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                const isScheduled = req.status === 'scheduled';
                const isAttended = req.status === 'attended';
                const isCancelled = req.status === 'cancelled';

                return (
                  <motion.div
                    key={req.id}
                    layout
                    className={`bg-white rounded-3xl p-5 border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                      isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {req.applicantName?.slice(0, 2) || 'عضو'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-sm text-stone-900">{req.applicantName}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono">
                                کد: {toPersianNumbers(req.userNationalId || '---')}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                              {req.categoryTitle || 'مشاوره عمومی'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                            isPending
                              ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                              : isScheduled
                              ? 'bg-teal-50 text-teal-800 border-teal-300'
                              : isAttended
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {isPending
                            ? 'در انتظار تعیین وقت'
                            : isScheduled
                            ? 'تعیین وقت‌شده'
                            : isAttended
                            ? 'جلسه برگزار شد'
                            : 'لغوشده'}
                        </span>
                      </div>

                      {/* Request Details Box */}
                      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-2">
                        <div className="flex items-center justify-between text-stone-600">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <span>تلفن تماس: {toPersianNumbers(req.userPhone || 'نامشخص')}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            {req.meetingMode === 'حضوری' ? (
                              <Building className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <Video className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span className="font-bold">{req.meetingMode || 'برخط'}</span>
                          </span>
                        </div>

                        {req.description && (
                          <p className="text-[11px] text-stone-700 leading-relaxed bg-white p-2.5 rounded-xl border border-stone-200/80">
                            <span className="font-bold text-stone-900 block mb-0.5">شرح تقاضای متقاضی:</span>
                            {req.description}
                          </p>
                        )}

                        {/* Scheduled Time info if exists */}
                        {(req.scheduledDate || req.scheduledTime) && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-900 bg-emerald-50/70 p-2 rounded-xl border border-emerald-200">
                            <span className="font-bold">
                              زمان جلسه: {toPersianNumbers(req.scheduledDate || '')} ساعت {toPersianNumbers(req.scheduledTime || '')}
                            </span>
                            <span className="text-stone-600 font-medium">
                              مشاور: {req.preferredConsultantName || 'نامشخص'}
                            </span>
                          </div>
                        )}

                        {req.venueDetails && (
                          <div className="text-[11px] text-stone-600 truncate">
                            <span className="font-bold">مکان / لینک: </span>
                            <span className="font-mono text-blue-700">{req.venueDetails}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenScheduleModal(req)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{isPending ? 'تعیین زمان و مشاور' : 'ویرایش زمان جلسه'}</span>
                        </button>

                        {!isAttended && (
                          <button
                            onClick={() => updateCounselingStatus(req.id, 'attended')}
                            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-stone-200"
                            title="ثبت پایان موفق جلسه"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ثبت حضور</span>
                          </button>
                        )}
                      </div>

                      {!isCancelled && (
                        <button
                          onClick={() => {
                            if (confirm('آیا از لغو این نوبت مشاوره اطمینان دارید؟')) {
                              updateCounselingStatus(req.id, 'cancelled', undefined, 'لغو شده توسط مدیر سامانه');
                            }
                          }}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="لغو نوبت"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CONSULTANT STAFF ROSTER MANAGEMENT
          ========================================================================= */}
      {activeTab === 'consultants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-black text-sm text-stone-900">فهرست روان‌شناسان و مشاوران سلامت روان مرکز</h3>
              <p className="text-xs text-stone-500 mt-0.5">افزودن مشاور، ویرایش سوابق و روزهای پاسخگویی</p>
            </div>
            <button
              onClick={() => {
                setConsultantForm({
                  name: '',
                  title: 'روان‌شناس بالینی و مشاور خانواده',
                  specialty: 'مشاوره خانواده و زوج‌درمانی',
                  experienceYears: 10,
                  availability: 'شنبه‌ها و سه‌شنبه‌ها ۱۶ الی ۱۹',
                  academicRank: 'استاد مدعو',
                  avatarUrl: '/assets/cleric_portrait.jpg',
                  isActive: true
                });
                setIsAddConsultantOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن مشاور جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultants.map(c => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                      alt={c.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-100 shadow-xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-black text-sm text-stone-900">{c.name}</h4>
                        {c.isActive === false && (
                          <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                            غیرفعال
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-800 font-bold">{c.title}</p>
                      <span className="text-[11px] text-stone-500 font-medium">{c.academicRank}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs space-y-1.5">
                    <p className="text-stone-700">
                      <span className="font-bold text-stone-900">تخصص: </span>
                      {c.specialty}
                    </p>
                    <p className="text-stone-700">
                      <span className="font-bold text-stone-900">ساعات حضور: </span>
                      {c.availability}
                    </p>
                    <p className="text-stone-500 text-[11px]">
                      سابقه خدمت مشاوره: {toPersianNumbers(c.experienceYears)} سال
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      updateConsultant(c.id, { isActive: c.isActive === false ? true : false });
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                      c.isActive === false
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {c.isActive === false ? 'فعال‌سازی مشاور' : 'غیرفعال‌سازی موقت'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedConsultant(c);
                        setConsultantForm(c);
                      }}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                      title="ویرایش مشخصات"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`آیا از حذف مشاور «${c.name}» اطمینان دارید؟`)) {
                          deleteConsultant(c.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer"
                      title="حذف مشاور"
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
          TAB 3: DYNAMIC FORM BUILDER & FIELD CUSTOMIZER
          ========================================================================= */}
      {activeTab === 'form_builder' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-5">
            <div>
              <h3 className="font-black text-base text-stone-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-800" />
                <span>مدیریت موضوعات و دسته‌بندی‌های مشاوره عمومی</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                ادمین می‌تواند سرفصل‌های مشاوره را اضافه، ویرایش یا برای متقاضیان غیرفعال کند.
              </p>
            </div>

            <div className="space-y-2.5">
              {counselingTopics.map((topic, idx) => (
                <div
                  key={topic.id}
                  className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                      {toPersianNumbers(idx + 1)}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-stone-900">{topic.label}</p>
                      <p className="text-[11px] text-stone-500">{topic.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCounselingTopics(prev =>
                          prev.map(t => (t.id === topic.id ? { ...t, active: !t.active } : t))
                        );
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        topic.active
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {topic.active ? 'نمایش در فرم: فعال' : 'مخفی در فرم'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('آیا از حذف این موضوع اطمینان دارید؟')) {
                          setCounselingTopics(prev => prev.filter(t => t.id !== topic.id));
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Topic Row */}
            {isAddTopicOpen ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-xs text-emerald-950">تعریف موضوع جدید مشاوره:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={e => setNewTopicName(e.target.value)}
                    placeholder="عنوان موضوع (مثال: مشاوره فرزندپروری و تربیت کودک)"
                    className="px-3.5 py-2 bg-white rounded-xl border border-stone-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <input
                    type="text"
                    value={newTopicDesc}
                    onChange={e => setNewTopicDesc(e.target.value)}
                    placeholder="توضیح کوتاه موضوع..."
                    className="px-3.5 py-2 bg-white rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddTopic}
                    className="px-4 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 cursor-pointer"
                  >
                    افزودن به فرم
                  </button>
                  <button
                    onClick={() => setIsAddTopicOpen(false)}
                    className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-300 cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddTopicOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تعریف موضوع یا دسته‌بندی جدید مشاوره</span>
              </button>
            )}
          </div>

          {/* Form Fields Toggles */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-black text-sm text-stone-900">تنظیمات فیلدهای فرم دانش‌آموخته</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'requireSecondPhone', label: 'الزامی بودن شماره تماس دوم / اضطراری' },
                { key: 'allowDocumentAttachment', label: 'امکان بارگذاری مدارک و پرونده ارجاعی' },
                { key: 'showUrgencySelector', label: 'امکان انتخاب درجه فوریت مشاوره توسط متقاضی' },
                { key: 'allowMeetingModeSelection', label: 'اجازه به متقاضی جهت انتخاب شیوه (حضوری / مجازی)' },
                { key: 'showPreferredTime', label: 'نمایش فیلد ساعت پیشنهادی دانش‌آموخته' },
              ].map(cfg => (
                <label
                  key={cfg.key}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-emerald-50/40 transition-colors"
                >
                  <span className="text-xs font-bold text-stone-800">{cfg.label}</span>
                  <input
                    type="checkbox"
                    checked={(formFieldsConfig as any)[cfg.key]}
                    onChange={e =>
                      setFormFieldsConfig(prev => ({ ...prev, [cfg.key]: e.target.checked }))
                    }
                    className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>

            {/* Confidentiality Disclaimer */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-stone-700">متن منشور و تعهدنامه محرمانگی ذیل فرم:</label>
              <textarea
                rows={3}
                value={formFieldsConfig.disclaimerText}
                onChange={e =>
                  setFormFieldsConfig(prev => ({ ...prev, disclaimerText: e.target.value }))
                }
                className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ANALYTICS & CLINIC REPORTING
          ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3">
              <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>توزیع موضوعات مراجعین</span>
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'مشاوره خانواده و زوج‌درمانی', percent: 42, color: 'bg-emerald-600' },
                  { label: 'مدیریت استرس شغلی و تاب‌آوری', percent: 28, color: 'bg-teal-600' },
                  { label: 'مشاوره پیش از ازدواج', percent: 18, color: 'bg-amber-600' },
                  { label: 'مشاوره فردی و فرزندپروری', percent: 12, color: 'bg-purple-600' },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-stone-700">
                      <span>{item.label}</span>
                      <span>{toPersianNumbers(item.percent)}٪</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3">
              <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-blue-600" />
                <span>شیوه‌های برگزاری جلسات</span>
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'برخط امن تصویری', count: 64, color: 'bg-blue-600' },
                  { label: 'حضوری در اتاق مشاوره', count: 26, color: 'bg-amber-600' },
                  { label: 'تلفنی تخصصی', count: 10, color: 'bg-stone-500' },
                ].map(m => (
                  <div key={m.label} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                    <span className="font-bold text-stone-800">{m.label}</span>
                    <span className="font-black text-emerald-800">{toPersianNumbers(m.count)}٪</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3">
              <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>اقدام و دستورات اداری</span>
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                گزارش‌های ماهانه پس از بازبینی دبیرکل به شورای عالی رفاه و سلامت قضات مرکز ارائه خواهد شد.
              </p>
              <button
                onClick={() => alert('گزارش رسمی کلینیک مشاوره با فرمت PDF آماده چاپ گردید.')}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>خروجی و چاپ رسمی پرونده‌ها</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      <AnimatePresence>
        {editingRequest && (
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
                  <Calendar className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-black text-sm text-stone-900">
                    تعیین وقت و شیوه جلسه مشاوره برای {editingRequest.applicantName}
                  </h3>
                </div>
                <button onClick={() => setEditingRequest(null)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">وضعیت نوبت:</label>
                  <select
                    value={scheduleForm.status}
                    onChange={e => setScheduleForm({ ...scheduleForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-xs"
                  >
                    <option value="scheduled">تعیین وقت‌شده (قطعی)</option>
                    <option value="pending">در انتظار اقدام</option>
                    <option value="attended">برگزار شد و پایان یافت</option>
                    <option value="cancelled">لغوشده</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">تاریخ جلسه:</label>
                    <input
                      type="text"
                      value={scheduleForm.scheduledDate}
                      onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                      placeholder="۱۴۰۳/۰۸/۲۵"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">ساعت جلسه:</label>
                    <input
                      type="text"
                      value={scheduleForm.scheduledTime}
                      onChange={e => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                      placeholder="۱۷:۰۰"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">مشاور معین جلسه:</label>
                  <select
                    value={scheduleForm.preferredConsultantId}
                    onChange={e => setScheduleForm({ ...scheduleForm, preferredConsultantId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-xs"
                  >
                    {consultants.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">شیوه برگزاری:</label>
                    <select
                      value={scheduleForm.meetingMode}
                      onChange={e => setScheduleForm({ ...scheduleForm, meetingMode: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-xs"
                    >
                      <option value="برخط (تصویری امن)">برخط (تصویری امن)</option>
                      <option value="حضوری">حضوری</option>
                      <option value="تلفنی">تلفنی</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">لینک یا شماره اتاق:</label>
                    <input
                      type="text"
                      value={scheduleForm.venueDetails}
                      onChange={e => setScheduleForm({ ...scheduleForm, venueDetails: e.target.value })}
                      placeholder="اتاق ۳ یا آدرس وبینار..."
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">یادداشت اداری / پیام به مراجع:</label>
                  <textarea
                    rows={2}
                    value={scheduleForm.counselorNotes}
                    onChange={e => setScheduleForm({ ...scheduleForm, counselorNotes: e.target.value })}
                    placeholder="توضیح هماهنگی یا پیش‌نیاز جلسه..."
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingRequest(null)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold cursor-pointer shadow-xs"
                  >
                    ذخیره و ثبت نوبت
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD/EDIT CONSULTANT MODAL */}
      <AnimatePresence>
        {(isAddConsultantOpen || selectedConsultant) && (
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
                  <Users className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-black text-sm text-stone-900">
                    {selectedConsultant ? `ویرایش مشخصات ${selectedConsultant.name}` : 'افزودن مشاور و روان‌شناس جدید'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsAddConsultantOpen(false);
                    setSelectedConsultant(null);
                  }}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveConsultant} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={consultantForm.name || ''}
                      onChange={e => setConsultantForm({ ...consultantForm, name: e.target.value })}
                      placeholder="دکتر احمد رضایی"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">مرتبه علمی / سمت:</label>
                    <input
                      type="text"
                      value={consultantForm.academicRank || ''}
                      onChange={e => setConsultantForm({ ...consultantForm, academicRank: e.target.value })}
                      placeholder="استاد تمام، دانشیار یا متخصص بالینی"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">عنوان تخصصی:</label>
                    <input
                      type="text"
                      value={consultantForm.title || ''}
                      onChange={e => setConsultantForm({ ...consultantForm, title: e.target.value })}
                      placeholder="روان‌شناس خانواده و زوج‌درمانگر"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">زمینه تخصصی:</label>
                    <input
                      type="text"
                      value={consultantForm.specialty || ''}
                      onChange={e => setConsultantForm({ ...consultantForm, specialty: e.target.value })}
                      placeholder="خانواده، ازدواج، استرس"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">روزها و ساعات حضور:</label>
                    <input
                      type="text"
                      value={consultantForm.availability || ''}
                      onChange={e => setConsultantForm({ ...consultantForm, availability: e.target.value })}
                      placeholder="شنبه‌ها و سه‌شنبه‌ها ۱۶ الی ۲۰"
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">سابقه فعالیت (سال):</label>
                    <input
                      type="number"
                      value={consultantForm.experienceYears || 5}
                      onChange={e => setConsultantForm({ ...consultantForm, experienceYears: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">لینک یا مسیر تصویر پروفایل:</label>
                  <input
                    type="text"
                    value={consultantForm.avatarUrl || ''}
                    onChange={e => setConsultantForm({ ...consultantForm, avatarUrl: e.target.value })}
                    placeholder="/assets/cleric_portrait.jpg"
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddConsultantOpen(false);
                      setSelectedConsultant(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold cursor-pointer shadow-xs"
                  >
                    ذخیره مشخصات مشاور
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

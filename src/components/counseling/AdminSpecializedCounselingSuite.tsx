import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  FileCheck,
  Award,
  Sliders,
  Eye,
  Search,
  Calendar,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingRequest } from '../../types';
import { CounselingFormBuilderTab } from './CounselingFormBuilderTab';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface AdminSpecializedCounselingSuiteProps {
  onSwitchToStudentPreview: () => void;
}

export const AdminSpecializedCounselingSuite: React.FC<AdminSpecializedCounselingSuiteProps> = ({
  onSwitchToStudentPreview,
}) => {
  const {
    consultants,
    counselingRequests,
    specializedConfig,
    updateCounselingStatus,
    updateConsultant,
    addConsultant,
    deleteConsultant,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'dossiers' | 'form_builder' | 'advisors'>('dossiers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'attended' | 'cancelled'>('all');

  const [selectedRequest, setSelectedRequest] = useState<CounselingRequest | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    status: 'scheduled' as CounselingRequest['status'],
    scheduledDate: '',
    scheduledTime: '۱۶:۰۰',
    meetingMode: 'برخط (تصویری امن)' as 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    venueDetails: '',
    preferredConsultantId: '',
    counselorNotes: '',
  });

  const [editingAdvisor, setEditingAdvisor] = useState<Consultant | null>(null);
  const [isAddAdvisorOpen, setIsAddAdvisorOpen] = useState(false);
  const [confirmDeleteAdvisorId, setConfirmDeleteAdvisorId] = useState<string | null>(null);
  const [advisorForm, setAdvisorForm] = useState<Partial<Consultant>>({
    name: '',
    title: 'مشاور تخصصی شغلی و تحصیلی',
    specialty: 'هدایت مسیر شغلی، ادامه تحصیل و برنامه‌ریزی پژوهشی',
    experienceYears: 12,
    academicRank: 'استاد و مشاور تخصصی مرکز',
    availability: 'دوشنبه‌ها و چهارشنبه‌ها',
    bio: '',
    resumeDetails: [],
    avatarUrl: '/assets/cleric_portrait.jpg',
    counselingType: 'specialized_career',
    isActive: true,
  });
  const [resumeText, setResumeText] = useState('');

  const specializedRequests = useMemo(
    () => counselingRequests.filter(r => r.counselingType === 'specialized_career'),
    [counselingRequests]
  );

  const specializedAdvisors = useMemo(
    () => consultants.filter(c => c.counselingType === 'specialized_career'),
    [consultants]
  );

  const filteredRequests = useMemo(
    () =>
      specializedRequests.filter(r => {
        const q = searchQuery.trim();
        const matchesSearch =
          !q ||
          (r.applicantName || '').includes(q) ||
          (r.userNationalId || '').includes(q) ||
          (r.selectedFieldTitle || '').includes(q) ||
          (r.categoryTitle || '').includes(q);
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [specializedRequests, searchQuery, statusFilter]
  );

  const totalCount = specializedRequests.length;
  const pendingCount = specializedRequests.filter(r => r.status === 'pending').length;
  const scheduledCount = specializedRequests.filter(r => r.status === 'scheduled').length;
  const advisorsCount = specializedAdvisors.filter(c => c.isActive !== false).length;

  const openScheduleModal = (req: CounselingRequest) => {
    setSelectedRequest(req);
    setScheduleForm({
      status: req.status === 'pending' ? 'scheduled' : req.status,
      scheduledDate: req.scheduledDate || new Date().toLocaleDateString('fa-IR'),
      scheduledTime: req.scheduledTime || '۱۶:۰۰',
      meetingMode: req.meetingMode || 'برخط (تصویری امن)',
      venueDetails: req.venueDetails || '',
      preferredConsultantId: req.preferredConsultantId || (specializedAdvisors[0]?.id || ''),
      counselorNotes: req.counselorNotes || '',
    });
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    const chosenAdvisor = specializedAdvisors.find(c => c.id === scheduleForm.preferredConsultantId);
    await updateCounselingStatus(
      selectedRequest.id,
      scheduleForm.status,
      scheduleForm.scheduledDate,
      scheduleForm.counselorNotes,
      scheduleForm.scheduledTime,
      scheduleForm.venueDetails,
      scheduleForm.meetingMode,
      scheduleForm.preferredConsultantId || undefined,
      chosenAdvisor?.name
    );
    setSelectedRequest(null);
  };

  const openAddAdvisorModal = () => {
    setEditingAdvisor(null);
    setAdvisorForm({
      name: '',
      title: 'مشاور تخصصی شغلی و تحصیلی',
      specialty: 'هدایت شغلی، ادامه تحصیل و گرایش تخصصی',
      experienceYears: 10,
      academicRank: 'مشاور تخصصی مرکز',
      availability: 'شنبه و دوشنبه عصر',
      bio: '',
      resumeDetails: [],
      avatarUrl: '/assets/cleric_portrait.jpg',
      counselingType: 'specialized_career',
      isActive: true,
    });
    setResumeText('');
    setIsAddAdvisorOpen(true);
  };

  const openEditAdvisorModal = (c: Consultant) => {
    setIsAddAdvisorOpen(false);
    setEditingAdvisor(c);
    setAdvisorForm(c);
    setResumeText(Array.isArray(c.resumeDetails) ? c.resumeDetails.join('\n') : '');
  };

  const handleSaveAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedResume = resumeText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingAdvisor) {
      await updateConsultant(editingAdvisor.id, {
        ...advisorForm,
        resumeDetails: parsedResume,
        counselingType: 'specialized_career',
      });
      setEditingAdvisor(null);
    } else {
      await addConsultant({
        name: advisorForm.name || 'مشاور جدید',
        title: advisorForm.title || 'مشاور تخصصی شغلی و تحصیلی',
        specialty: advisorForm.specialty || 'مشاوره تخصصی',
        experienceYears: Number(advisorForm.experienceYears || 10),
        availability: advisorForm.availability || 'با هماهنگی قبلی',
        academicRank: advisorForm.academicRank || 'مشاور تخصصی مرکز',
        bio: advisorForm.bio || '',
        avatarUrl: advisorForm.avatarUrl || '/assets/cleric_portrait.jpg',
        resumeDetails: parsedResume,
        counselingType: 'specialized_career',
        isActive: advisorForm.isActive !== false,
      });
      setIsAddAdvisorOpen(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Admin Executive Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300">
              <Briefcase className="w-4 h-4" />
              <span>میز مدیریت و راهبری مشاوره تخصصی شغلی و تحصیلی</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {specializedConfig.sectionTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              رسیدگی به درخواست‌های ثبت‌شده، طراحی ۱۰۰٪ مراحل و فیلدهای فرم، مدیریت «زمینه‌های مشاوره» و کنترل نمایش مشاوران به دانش‌آموختگان
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToStudentPreview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold cursor-pointer shrink-0"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span>مشاهده پیش‌نمایش دانش‌آموخته</span>
          </button>
        </div>

        {/* Dynamic DB Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">کل درخواست‌های تخصصی</span>
            <span className="text-2xl font-black text-white mt-1 block">{toPersianNumbers(totalCount)}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">در انتظار بررسی و نوبت</span>
            <span className="text-2xl font-black text-amber-300 mt-1 block">{toPersianNumbers(pendingCount)}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">نوبت‌های هماهنگ‌شده</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">{toPersianNumbers(scheduledCount)}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">مشاوران تخصصی فعال</span>
            <span className="text-2xl font-black text-white mt-1 block">{toPersianNumbers(advisorsCount)}</span>
          </div>
        </div>
      </div>

      {/* Rebuilt Clean Admin Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {[
          {
            id: 'dossiers',
            label: 'کارتابل متقاضیان و نوبت‌دهی',
            icon: FileCheck,
            badge: pendingCount > 0 ? `${toPersianNumbers(pendingCount)} جدید` : undefined,
          },
          {
            id: 'form_builder',
            label: 'طراح فرم، متن‌ها و زمینه‌های مشاوره',
            icon: Sliders,
          },
          {
            id: 'advisors',
            label: 'مدیریت مشاوران تخصصی',
            icon: Award,
            badge: `${toPersianNumbers(specializedAdvisors.length)} مشاور`,
          },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                active
                  ? 'bg-indigo-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Requests Queue */}
      {activeTab === 'dossiers' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام متقاضی، کد ملی یا زمینه..."
                className="bg-transparent text-xs focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'همه درخواست‌ها' },
                { id: 'pending', label: 'در انتظار اقدام' },
                { id: 'scheduled', label: 'هماهنگ‌شده' },
                { id: 'attended', label: 'برگزارشده' },
                { id: 'cancelled', label: 'لغوشده' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-indigo-800 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              درخواست مشاوره تخصصی‌ای با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                const isAttended = req.status === 'attended' || req.status === 'completed';

                return (
                  <div
                    key={req.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border flex flex-col justify-between gap-4 shadow-2xs ${
                      isPending ? 'border-amber-400 ring-2 ring-amber-100 dark:ring-amber-900/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">{req.applicantName}</h4>
                          <p className="text-indigo-700 dark:text-indigo-400 font-bold mt-0.5">
                            {req.selectedFieldTitle || req.categoryTitle}
                          </p>
                          <span className="text-[11px] text-slate-500 font-mono">
                            تماس: {toPersianNumbers(req.userPhone || '---')} · شیوه: {req.meetingMode}
                          </span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            isPending
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : isAttended
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : req.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isPending ? 'در انتظار زمان‌بندی' : isAttended ? 'برگزارشده' : req.status === 'scheduled' ? 'هماهنگ‌شده' : 'لغوشده'}
                        </span>
                      </div>

                      {req.description && (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {req.description}
                        </div>
                      )}

                      {req.scheduledDate && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                          <span>زمان: {toPersianNumbers(req.scheduledDate)} {req.scheduledTime || ''}</span>
                          <span>مشاور: {req.preferredConsultantName || 'تعیین‌نشده'}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => openScheduleModal(req)}
                        className="px-4 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isPending ? 'تخصیص مشاور و زمان‌بندی' : 'ویرایش وضعیت و زمان'}</span>
                      </button>

                      {!isAttended && (
                        <button
                          type="button"
                          onClick={() => updateCounselingStatus(req.id, 'attended')}
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ثبت برگزاری</span>
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

      {/* Tab 2: 100% Dynamic Form & Counseling Fields Builder */}
      {activeTab === 'form_builder' && (
        <CounselingFormBuilderTab counselingType="specialized_career" />
      )}

      {/* Tab 3: Specialized Advisors Management */}
      {activeTab === 'advisors' && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">کادر مشاوران تخصصی شغلی و تحصیلی</h3>
              <p className="text-slate-500 mt-0.5">
                نمایش این فهرست برای دانش‌آموختگان از بخش «طراح فرم و تنظیمات» قابل روشن یا خاموش شدن است.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddAdvisorModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-900 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن مشاور تخصصی جدید</span>
            </button>
          </div>

          {specializedAdvisors.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-500">
              هنوز مشاوری در گروه تخصصی تعریف نشده است. از دکمه «افزودن مشاور تخصصی جدید» استفاده کنید.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specializedAdvisors.map(c => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {c.avatarUrl && (
                        <img src={c.avatarUrl} alt={c.name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{c.name}</h4>
                        <p className="text-indigo-700 dark:text-indigo-400 font-bold truncate">{c.title}</p>
                        <span className="text-[11px] text-slate-500 block">{c.academicRank}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1 text-slate-700 dark:text-slate-300">
                      <p><strong>تخصص:</strong> {c.specialty}</p>
                      <p><strong>زمان حضور:</strong> {c.availability}</p>
                      <p><strong>سابقه:</strong> {toPersianNumbers(c.experienceYears)} سال</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditAdvisorModal(c)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {confirmDeleteAdvisorId === c.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteConsultant(c.id);
                            setConfirmDeleteAdvisorId(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                        >
                          تایید حذف
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAdvisorId(null)}
                          className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                        >
                          لغو
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAdvisorId(c.id)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden" dir="rtl" onClick={() => setSelectedRequest(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-xs max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                  تعیین وقت و مشاور: {selectedRequest.applicantName}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  aria-label="بستن"
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form id="admin-spec-schedule-form" onSubmit={handleSaveSchedule} className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">وضعیت پرونده:</label>
                  <select
                    value={scheduleForm.status}
                    onChange={e => setScheduleForm({ ...scheduleForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="pending">در انتظار اقدام</option>
                    <option value="scheduled">هماهنگ‌شده</option>
                    <option value="attended">برگزارشده</option>
                    <option value="cancelled">لغوشده</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">مشاور تخصصی:</label>
                  <select
                    value={scheduleForm.preferredConsultantId}
                    onChange={e => setScheduleForm({ ...scheduleForm, preferredConsultantId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">تعیین نشده</option>
                    {specializedAdvisors.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">تاریخ جلسه:</label>
                  <input
                    type="text"
                    value={scheduleForm.scheduledDate}
                    onChange={e => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">ساعت جلسه:</label>
                  <input
                    type="text"
                    value={scheduleForm.scheduledTime}
                    onChange={e => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">محل برگزاری یا لینک جلسه برخط:</label>
                <input
                  type="text"
                  value={scheduleForm.venueDetails}
                  onChange={e => setScheduleForm({ ...scheduleForm, venueDetails: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">توضیح یا جمع‌بندی مشاور (نمایش در کارتابل متقاضی):</label>
                <textarea
                  rows={2}
                  value={scheduleForm.counselorNotes}
                  onChange={e => setScheduleForm({ ...scheduleForm, counselorNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              </form>
              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  form="admin-spec-schedule-form"
                  className="px-5 py-2.5 min-h-[42px] rounded-xl bg-indigo-800 text-white font-bold cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Specialized Advisor Modal */}
      <AnimatePresence>
        {(isAddAdvisorOpen || editingAdvisor) && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden" dir="rtl" onClick={() => { setIsAddAdvisorOpen(false); setEditingAdvisor(null); }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-xs max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                  {editingAdvisor ? `ویرایش مشاور: ${editingAdvisor.name}` : 'افزودن مشاور تخصصی شغلی/تحصیلی'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddAdvisorOpen(false);
                    setEditingAdvisor(null);
                  }}
                  aria-label="بستن"
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form id="admin-spec-advisor-form" onSubmit={handleSaveAdvisor} className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={advisorForm.name || ''}
                    onChange={e => setAdvisorForm({ ...advisorForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">عنوان حرفه‌ای *</label>
                  <input
                    type="text"
                    required
                    value={advisorForm.title || ''}
                    onChange={e => setAdvisorForm({ ...advisorForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">حوزه تخصصی *</label>
                  <input
                    type="text"
                    required
                    value={advisorForm.specialty || ''}
                    onChange={e => setAdvisorForm({ ...advisorForm, specialty: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">سابقه (سال)</label>
                  <input
                    type="number"
                    value={advisorForm.experienceYears ?? 10}
                    onChange={e => setAdvisorForm({ ...advisorForm, experienceYears: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">مرتبه علمی / صنفی</label>
                  <input
                    type="text"
                    value={advisorForm.academicRank || ''}
                    onChange={e => setAdvisorForm({ ...advisorForm, academicRank: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">برنامه حضور</label>
                  <input
                    type="text"
                    value={advisorForm.availability || ''}
                    onChange={e => setAdvisorForm({ ...advisorForm, availability: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">توضیحات معرفی مشاور</label>
                <textarea
                  rows={2}
                  value={advisorForm.bio || ''}
                  onChange={e => setAdvisorForm({ ...advisorForm, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">سوابق و افتخارات علمی (هر مورد در یک خط)</label>
                <textarea
                  rows={3}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="مثال: عضو هیئت علمی دانشگاه..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              </form>
              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddAdvisorOpen(false);
                    setEditingAdvisor(null);
                  }}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  form="admin-spec-advisor-form"
                  className="px-5 py-2.5 min-h-[42px] rounded-xl bg-indigo-800 text-white font-bold cursor-pointer"
                >
                  ذخیره در پایگاه داده
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

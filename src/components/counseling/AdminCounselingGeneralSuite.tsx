import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartHandshake,
  Users,
  Calendar,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  Search,
  Eye,
  Sliders,
  DollarSign,
  ClipboardCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingRequest } from '../../types';
import { CounselingFormBuilderTab } from './CounselingFormBuilderTab';
import { GeneralCounselingTariffsTab } from './GeneralCounselingTariffsTab';
import { PsychologicalTestsTab } from './PsychologicalTestsTab';
import { CounselingCalendarAndDossierSuite } from './CounselingCalendarAndDossierSuite';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface AdminCounselingGeneralSuiteProps {
  onSwitchToStudentPreview: () => void;
}

export const AdminCounselingGeneralSuite: React.FC<AdminCounselingGeneralSuiteProps> = ({
  onSwitchToStudentPreview,
}) => {
  const {
    currentUser,
    consultants,
    counselingRequests,
    generalConfig,
    updateCounselingStatus,
    updateConsultant,
    addConsultant,
    deleteConsultant,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'queue' | 'tests_dossiers' | 'consultants' | 'tariffs' | 'form_builder'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'attended' | 'cancelled'>('all');

  const [editingRequest, setEditingRequest] = useState<CounselingRequest | null>(null);
  const [confirmCancelRequestId, setConfirmCancelRequestId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    status: 'scheduled' as CounselingRequest['status'],
    scheduledDate: '',
    scheduledTime: '۱۶:۰۰',
    meetingMode: 'برخط (تصویری امن)' as 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    venueDetails: '',
    preferredConsultantId: '',
    counselorNotes: '',
  });

  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isAddConsultantOpen, setIsAddConsultantOpen] = useState(false);
  const [confirmDeleteConsultantId, setConfirmDeleteConsultantId] = useState<string | null>(null);
  const [consultantForm, setConsultantForm] = useState<Partial<Consultant>>({
    name: '',
    title: 'روان‌شناس بالینی و مشاور خانواده',
    specialty: 'مشاوره فردی، زوج‌درمانی و مدیریت استرس',
    experienceYears: 10,
    availability: 'شنبه‌ها و سه‌شنبه‌ها عصر',
    academicRank: 'روان‌شناس مرکز',
    bio: '',
    resumeDetails: [],
    avatarUrl: '/assets/cleric_portrait.jpg',
    counselingType: 'general',
    isActive: true,
  });
  const [resumeText, setResumeText] = useState('');

  // Strict 100% Separation: General requests & psychologists only
  const generalRequests = useMemo(
    () => counselingRequests.filter(r => r.counselingType !== 'specialized_career'),
    [counselingRequests]
  );

  const generalConsultants = useMemo(
    () => consultants.filter(c => c.counselingType !== 'specialized_career'),
    [consultants]
  );

  const filteredRequests = useMemo(
    () =>
      generalRequests.filter(r => {
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
    [generalRequests, searchQuery, statusFilter]
  );

  const totalRequests = generalRequests.length;
  const pendingCount = generalRequests.filter(r => r.status === 'pending').length;
  const scheduledCount = generalRequests.filter(r => r.status === 'scheduled').length;
  const activePsychologistsCount = generalConsultants.filter(c => c.isActive !== false).length;

  const handleOpenScheduleModal = (req: CounselingRequest) => {
    setEditingRequest(req);
    setScheduleForm({
      status: req.status === 'pending' ? 'scheduled' : req.status,
      scheduledDate: req.scheduledDate || new Date().toLocaleDateString('fa-IR'),
      scheduledTime: req.scheduledTime || '۱۶:۳۰',
      meetingMode: req.meetingMode || 'برخط (تصویری امن)',
      venueDetails: req.venueDetails || '',
      preferredConsultantId: req.preferredConsultantId || (generalConsultants[0]?.id || ''),
      counselorNotes: req.counselorNotes || '',
    });
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    const consObj = generalConsultants.find(c => c.id === scheduleForm.preferredConsultantId);
    await updateCounselingStatus(
      editingRequest.id,
      scheduleForm.status,
      scheduleForm.scheduledDate,
      scheduleForm.counselorNotes,
      scheduleForm.scheduledTime,
      scheduleForm.venueDetails,
      scheduleForm.meetingMode,
      scheduleForm.preferredConsultantId || undefined,
      consObj?.name
    );
    setEditingRequest(null);
  };

  const openAddConsultantModal = () => {
    setSelectedConsultant(null);
    setConsultantForm({
      name: '',
      title: 'روان‌شناس بالینی و مشاور خانواده',
      specialty: 'مشاوره فردی و خانواده',
      experienceYears: 10,
      availability: 'شنبه‌ها و سه‌شنبه‌ها ۱۶ الی ۱۹',
      academicRank: 'روان‌شناس و مشاور مرکز',
      bio: '',
      resumeDetails: [],
      avatarUrl: '/assets/cleric_portrait.jpg',
      counselingType: 'general',
      isActive: true,
    });
    setResumeText('');
    setIsAddConsultantOpen(true);
  };

  const openEditConsultantModal = (c: Consultant) => {
    setIsAddConsultantOpen(false);
    setSelectedConsultant(c);
    setConsultantForm(c);
    setResumeText(Array.isArray(c.resumeDetails) ? c.resumeDetails.join('\n') : '');
  };

  const handleSaveConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedResume = resumeText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (selectedConsultant) {
      await updateConsultant(selectedConsultant.id, {
        ...consultantForm,
        resumeDetails: parsedResume,
        counselingType: 'general',
      });
      setSelectedConsultant(null);
    } else {
      await addConsultant({
        name: consultantForm.name || 'روان‌شناس جدید',
        title: consultantForm.title || 'روان‌شناس و مشاور سلامت روان',
        specialty: consultantForm.specialty || 'مشاوره فردی و خانواده',
        experienceYears: Number(consultantForm.experienceYears || 8),
        availability: consultantForm.availability || 'شنبه‌ها و چهارشنبه‌ها',
        avatarUrl: consultantForm.avatarUrl || '/assets/cleric_portrait.jpg',
        academicRank: consultantForm.academicRank || 'روان‌شناس مرکز',
        bio: consultantForm.bio || '',
        resumeDetails: parsedResume,
        counselingType: 'general',
        isActive: consultantForm.isActive !== false,
      });
      setIsAddConsultantOpen(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Admin / Psychologist Executive Header */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300">
              <HeartHandshake className="w-4 h-4" />
              <span>میز مدیریت و کلینیک روان‌شناسان مرکز</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {generalConfig.sectionTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              زمان‌بندی مراجعان، مدیریت کادر روان‌شناسان، فعال‌سازی تست‌ها برای دانش‌آموختگان، تنظیم نرخ‌نامه و سفارشی‌سازی زمینه‌ها و مراحل فرم
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

        {/* Dynamic DB KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">کل درخواست‌های مشاوره عمومی</span>
            <span className="text-2xl font-black text-white mt-1 block">{toPersianNumbers(totalRequests)}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">نوبت‌های در انتظار پذیرش</span>
            <span className="text-2xl font-black text-amber-300 mt-1 block">{toPersianNumbers(pendingCount)}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">جلسات هماهنگ‌شده</span>
            <span className="text-2xl font-black text-emerald-300 mt-1 block">{toPersianNumbers(scheduledCount)}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <span className="text-slate-300 font-bold block">روان‌شناسان فعال مرکز</span>
            <span className="text-2xl font-black text-white mt-1 block">{toPersianNumbers(activePsychologistsCount)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {[
          {
            id: 'queue',
            label: 'پذیرش و نوبت‌دهی',
            icon: Calendar,
            badge: pendingCount > 0 ? `${toPersianNumbers(pendingCount)} معلق` : undefined,
          },
          {
            id: 'tests_dossiers',
            label: 'تست‌های روان‌شناختی و پرونده جلسات',
            icon: ClipboardCheck,
          },
          {
            id: 'consultants',
            label: 'کادر روان‌شناسان مرکز',
            icon: Users,
            badge: `${toPersianNumbers(generalConsultants.length)} روان‌شناس`,
          },
          {
            id: 'tariffs',
            label: 'مدیریت نرخ‌نامه',
            icon: DollarSign,
          },
          {
            id: 'form_builder',
            label: 'طراح فرم و زمینه‌های مشاوره',
            icon: Sliders,
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
                  ? 'bg-emerald-800 text-white shadow-sm'
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

      {/* Tab 1: General Counseling Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام، کد ملی یا زمینه..."
                className="bg-transparent text-xs focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'همه نوبت‌ها' },
                { id: 'pending', label: 'در انتظار تایید' },
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
                      ? 'bg-emerald-800 text-white'
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
              هیچ درخواست مشاوره عمومی‌ای با این مشخصات یافت نشد.
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
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
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
                          {isPending ? 'در انتظار تعیین وقت' : isAttended ? 'برگزارشده' : req.status === 'scheduled' ? 'تعیین وقت‌شده' : 'لغوشده'}
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
                          <span>روان‌شناس: {req.preferredConsultantName || 'تعیین‌نشده'}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenScheduleModal(req)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{isPending ? 'تعیین زمان و روان‌شناس' : 'ویرایش زمان'}</span>
                        </button>

                        {!isAttended && (
                          <button
                            type="button"
                            onClick={() => updateCounselingStatus(req.id, 'attended')}
                            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ثبت حضور</span>
                          </button>
                        )}
                      </div>

                      {req.status !== 'cancelled' && (
                        confirmCancelRequestId === req.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await updateCounselingStatus(req.id, 'cancelled', undefined, 'لغو شده توسط مدیر');
                                setConfirmCancelRequestId(null);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                            >
                              تایید لغو
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelRequestId(null)}
                              className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                            >
                              انصراف
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelRequestId(req.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="لغو نوبت"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Psychological Tests & Session Dossiers (Scoped to General) */}
      {activeTab === 'tests_dossiers' && (
        <div className="space-y-6">
          <PsychologicalTestsTab isPsychologistMode={true} />
          <CounselingCalendarAndDossierSuite
            currentUser={currentUser}
            consultants={generalConsultants}
            counselingRequests={generalRequests}
            isOfficial={true}
          />
        </div>
      )}

      {/* Tab 3: Psychologists Roster CRUD */}
      {activeTab === 'consultants' && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">کادر روان‌شناسان و مشاوران مرکز</h3>
              <p className="text-slate-500 mt-0.5">مدیریت مشخصات، رزومه تفصیلی و ساعات پاسخگویی روان‌شناسان</p>
            </div>
            <button
              type="button"
              onClick={openAddConsultantModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن روان‌شناس جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generalConsultants.map(c => (
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
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold truncate">{c.title}</p>
                      <span className="text-[11px] text-slate-500 block">{c.academicRank}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-1 text-slate-700 dark:text-slate-300">
                    <p><strong>تخصص:</strong> {c.specialty}</p>
                    <p><strong>حضور:</strong> {c.availability}</p>
                    <p><strong>سابقه:</strong> {toPersianNumbers(c.experienceYears)} سال</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditConsultantModal(c)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {confirmDeleteConsultantId === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteConsultant(c.id);
                          setConfirmDeleteConsultantId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                      >
                        تایید حذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteConsultantId(null)}
                        className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                      >
                        لغو
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteConsultantId(c.id)}
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
        </div>
      )}

      {/* Tab 4: General Tariffs Admin Management */}
      {activeTab === 'tariffs' && <GeneralCounselingTariffsTab isAdminMode={true} />}

      {/* Tab 5: Dynamic Form & Counseling Fields Builder */}
      {activeTab === 'form_builder' && <CounselingFormBuilderTab counselingType="general" />}

      {/* Schedule Request Modal */}
      <AnimatePresence>
        {editingRequest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleSaveSchedule}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  تعیین زمان جلسه: {editingRequest.applicantName}
                </h3>
                <button type="button" onClick={() => setEditingRequest(null)} className="text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">وضعیت:</label>
                  <select
                    value={scheduleForm.status}
                    onChange={e => setScheduleForm({ ...scheduleForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="pending">در انتظار تایید</option>
                    <option value="scheduled">هماهنگ‌شده</option>
                    <option value="attended">برگزارشده</option>
                    <option value="cancelled">لغوشده</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">روان‌شناس معین:</label>
                  <select
                    value={scheduleForm.preferredConsultantId}
                    onChange={e => setScheduleForm({ ...scheduleForm, preferredConsultantId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">تعیین نشده</option>
                    {generalConsultants.map(c => (
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
                <label className="block font-bold mb-1">محل جلسه یا لینک اختصاصی:</label>
                <input
                  type="text"
                  value={scheduleForm.venueDetails}
                  onChange={e => setScheduleForm({ ...scheduleForm, venueDetails: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">یادداشت یا راهنمایی برای مراجع:</label>
                <textarea
                  rows={2}
                  value={scheduleForm.counselorNotes}
                  onChange={e => setScheduleForm({ ...scheduleForm, counselorNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Psychologist Modal */}
      <AnimatePresence>
        {(isAddConsultantOpen || selectedConsultant) && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleSaveConsultant}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm text-slate-900 dark:text-white">
                  {selectedConsultant ? `ویرایش روان‌شناس: ${selectedConsultant.name}` : 'افزودن روان‌شناس جدید مرکز'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddConsultantOpen(false);
                    setSelectedConsultant(null);
                  }}
                  className="text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    value={consultantForm.name || ''}
                    onChange={e => setConsultantForm({ ...consultantForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">عنوان تخصصی *</label>
                  <input
                    type="text"
                    required
                    value={consultantForm.title || ''}
                    onChange={e => setConsultantForm({ ...consultantForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">گرایش بالینی / تخصص *</label>
                  <input
                    type="text"
                    required
                    value={consultantForm.specialty || ''}
                    onChange={e => setConsultantForm({ ...consultantForm, specialty: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">سابقه (سال)</label>
                  <input
                    type="number"
                    value={consultantForm.experienceYears ?? 8}
                    onChange={e => setConsultantForm({ ...consultantForm, experienceYears: Number(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">درجه علمی / شماره نظام</label>
                  <input
                    type="text"
                    value={consultantForm.academicRank || ''}
                    onChange={e => setConsultantForm({ ...consultantForm, academicRank: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">روزها و ساعات حضور</label>
                  <input
                    type="text"
                    value={consultantForm.availability || ''}
                    onChange={e => setConsultantForm({ ...consultantForm, availability: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">معرفی کوتاه</label>
                <textarea
                  rows={2}
                  value={consultantForm.bio || ''}
                  onChange={e => setConsultantForm({ ...consultantForm, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">رزومه و سوابق روان‌شناس (هر مورد در یک خط)</label>
                <textarea
                  rows={3}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="مثال: دکتری تخصصی روان‌شناسی بالینی..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddConsultantOpen(false);
                    setSelectedConsultant(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  ذخیره در پایگاه داده
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

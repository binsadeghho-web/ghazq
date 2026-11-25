import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
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
  MapPin,
  Clock,
  Phone,
  LayoutGrid,
  Copy,
  GraduationCap,
  Paperclip,
  Download,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { Consultant, CounselingRequest } from '../../types';
import { CounselingFormBuilderTab } from './CounselingFormBuilderTab';
import { GeneralCounselingTariffsTab } from './GeneralCounselingTariffsTab';
import { PsychologicalTestsTab } from './PsychologicalTestsTab';
import { CounselingCalendarAndDossierSuite } from './CounselingCalendarAndDossierSuite';
import { CounselingGeneralShowcaseEditorModal } from '../crextio/CounselingGeneralShowcaseEditorModal';
import { ModuleFallback } from '../common/ModuleFallback';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { isReadOnlyObserverRole } from '../../utils/rbacPolicy';

const CoursesSection = lazy(() =>
  import('../courses/CoursesSection').then(m => ({ default: m.CoursesSection }))
);

interface AdminCounselingGeneralSuiteProps {
  initialTab?: 'queue' | 'tests_dossiers' | 'consultants' | 'tariffs' | 'form_builder';
  initialWorkspace?: 'booking' | 'workshops';
  onSwitchToStudentPreview: () => void;
}

export const AdminCounselingGeneralSuite: React.FC<AdminCounselingGeneralSuiteProps> = ({
  initialTab = 'queue',
  initialWorkspace = 'booking',
  onSwitchToStudentPreview,
}) => {
  const {
    currentUser,
    consultants,
    counselingRequests,
    counselingClientsBasic,
    courses,
    courseEnrollments,
    generalConfig,
    counselingFields,
    updateCounselingStatus,
    updateCounselingRequest,
    deleteCounselingRequest,
    updateConsultant,
    addConsultant,
    deleteConsultant,
  } = useApp();

  const isObserver = isReadOnlyObserverRole(currentUser?.role);
  const isPsychologistRole = currentUser?.role === 'psychologist_counselor';
  const [adminWorkspace, setAdminWorkspace] = useState<'booking' | 'workshops'>(initialWorkspace);
  const [showcaseEditorOpen, setShowcaseEditorOpen] = useState(false);
  const [contactModalClient, setContactModalClient] = useState<{ fullName: string; phone: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const clientPhoneByUserId = useMemo(() => {
    const map = new Map<string, string>();
    counselingClientsBasic.forEach(c => {
      if (c.id && c.phone) map.set(c.id, c.phone);
    });
    return map;
  }, [counselingClientsBasic]);

  const [activeTab, setActiveTab] = useState<'queue' | 'tests_dossiers' | 'consultants' | 'tariffs' | 'form_builder'>(initialTab);
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'scheduled' | 'attended' | 'cancelled'>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const [editingRequest, setEditingRequest] = useState<CounselingRequest | null>(null);
  const [confirmCancelRequestId, setConfirmCancelRequestId] = useState<string | null>(null);
  const [confirmDeleteRequestId, setConfirmDeleteRequestId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    status: 'scheduled' as CounselingRequest['status'],
    scheduledDate: '',
    scheduledTime: '۱۶:۰۰',
    meetingMode: 'حضوری' as 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    venueDetails: '',
    preferredConsultantId: '',
    selectedFieldTitle: '',
    counselorNotes: '',
  });

  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isAddConsultantOpen, setIsAddConsultantOpen] = useState(false);
  const [confirmDeleteConsultantId, setConfirmDeleteConsultantId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

  const generalFieldTitles = useMemo(() => {
    const titles = new Set<string>();
    counselingFields
      .filter(f => f.counselingType === 'general')
      .forEach(f => titles.add(f.title));
    generalRequests.forEach(r => {
      if (r.selectedFieldTitle) titles.add(r.selectedFieldTitle);
    });
    return Array.from(titles);
  }, [counselingFields, generalRequests]);

  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    generalRequests.forEach(r => {
      const loc = r.formResponses?.counselingLocation;
      if (loc && typeof loc === 'string' && loc.trim()) {
        locs.add(loc.trim());
      }
    });
    return Array.from(locs);
  }, [generalRequests]);

  const filteredRequests = useMemo(
    () =>
      generalRequests.filter(r => {
        const q = searchQuery.trim();
        const locStr = String(r.formResponses?.counselingLocation || '');
        const timeStr = String(r.formResponses?.counselingTimePreference || '');
        const matchesSearch =
          !q ||
          (r.applicantName || '').includes(q) ||
          (r.userNationalId || '').includes(q) ||
          (r.userPhone || '').includes(q) ||
          (r.selectedFieldTitle || '').includes(q) ||
          (r.categoryTitle || '').includes(q) ||
          locStr.includes(q) ||
          timeStr.includes(q) ||
          (r.description || '').includes(q);
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesField =
          fieldFilter === 'all' ||
          (fieldFilter === '__none__' ? !r.selectedFieldTitle : r.selectedFieldTitle === fieldFilter);
        const matchesLocation = locationFilter === 'all' || locStr === locationFilter;
        return matchesSearch && matchesStatus && matchesField && matchesLocation;
      }),
    [generalRequests, searchQuery, statusFilter, fieldFilter, locationFilter]
  );

  const totalRequests = generalRequests.length;
  const pendingCount = generalRequests.filter(r => r.status === 'pending').length;
  const scheduledCount = generalRequests.filter(r => r.status === 'scheduled').length;
  const activePsychologistsCount = generalConsultants.filter(c => c.isActive !== false).length;

  // Counseling Workshops Metrics (Strictly Scoped to courseScope === 'counseling_workshop')
  const workshopCourses = useMemo(
    () => courses.filter(c => (c.courseScope || 'specialized') === 'counseling_workshop' && !c.isDeleted),
    [courses]
  );
  const workshopCourseIds = useMemo(
    () => new Set(courses.filter(c => (c.courseScope || 'specialized') === 'counseling_workshop').map(c => c.id)),
    [courses]
  );
  const workshopEnrollments = useMemo(
    () => courseEnrollments.filter(e => workshopCourseIds.has(e.courseId)),
    [courseEnrollments, workshopCourseIds]
  );
  const workshopActiveCount = workshopCourses.length;
  const workshopEnrollingCount = workshopCourses.filter(c => c.status === 'enrolling' || c.status === 'ongoing').length;
  const workshopPendingReceiptsCount = workshopEnrollments.filter(e => e.paymentStatus === 'pending_review').length;
  const workshopConfirmedCount = workshopEnrollments.filter(e => e.paymentStatus === 'confirmed').length;

  const handleOpenScheduleModal = (req: CounselingRequest) => {
    if (isObserver) return;
    setEditingRequest(req);
    setScheduleForm({
      status: req.status === 'pending' ? 'scheduled' : req.status,
      scheduledDate: req.scheduledDate || new Date().toLocaleDateString('fa-IR'),
      scheduledTime: req.scheduledTime || '۱۶:۳۰',
      meetingMode: req.meetingMode || 'حضوری',
      venueDetails: req.venueDetails || '',
      preferredConsultantId: req.preferredConsultantId || (generalConsultants[0]?.id || ''),
      selectedFieldTitle: req.selectedFieldTitle || '',
      counselorNotes: req.counselorNotes || '',
    });
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest || isObserver) return;
    const consObj = generalConsultants.find(c => c.id === scheduleForm.preferredConsultantId);
    const matchedField = counselingFields.find(
      f => f.counselingType === 'general' && f.title === scheduleForm.selectedFieldTitle
    );
    await updateCounselingRequest(editingRequest.id, {
      status: scheduleForm.status,
      scheduledDate: scheduleForm.scheduledDate,
      scheduledTime: scheduleForm.scheduledTime,
      meetingMode: scheduleForm.meetingMode,
      venueDetails: scheduleForm.venueDetails,
      counselorNotes: scheduleForm.counselorNotes,
      preferredConsultantId: scheduleForm.preferredConsultantId || undefined,
      preferredConsultantName: consObj?.name || undefined,
      selectedFieldId: matchedField?.id || (scheduleForm.selectedFieldTitle ? editingRequest.selectedFieldId : undefined),
      selectedFieldTitle: scheduleForm.selectedFieldTitle || undefined,
      categoryTitle: scheduleForm.selectedFieldTitle || 'خدمات روانشناختی و مشاوره',
    });
    setEditingRequest(null);
  };

  const openAddConsultantModal = () => {
    if (isObserver) return;
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
    if (isObserver) return;
    setIsAddConsultantOpen(false);
    setSelectedConsultant(c);
    setConsultantForm(c);
    setResumeText(Array.isArray(c.resumeDetails) ? c.resumeDetails.join('\n') : '');
  };

  const handleSaveConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isObserver) return;
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
              مدیریت کامل درخواست‌ها، زمان‌بندی مراجعان، کادر روان‌شناسان، تست‌ها، نرخ‌نامه و ویرایش کامل محتوای صفحه و مراحل فرم
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isObserver && (
              <button
                type="button"
                onClick={() => setShowcaseEditorOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black cursor-pointer shrink-0 transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>مدیریت ویترین ۳ بخشی داشبورد</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSwitchToStudentPreview}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold cursor-pointer shrink-0"
            >
              <Eye className="w-4 h-4 text-amber-300" />
              <span>مشاهده پیش‌نمایش دانش‌آموخته</span>
            </button>
          </div>
        </div>

        {/* Dynamic DB KPI Cards Adapting to Active Admin Workspace */}
        {adminWorkspace === 'workshops' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">کل کارگاه‌های آموزشی فعال</span>
              <span className="text-2xl font-black text-white mt-1 block tabular-nums">{toPersianNumbers(workshopActiveCount)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">کارگاه‌های در حال پذیرش</span>
              <span className="text-2xl font-black text-emerald-300 mt-1 block tabular-nums">{toPersianNumbers(workshopEnrollingCount)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">فیش‌های ثبت‌نامی در نوبت بررسی</span>
              <span className="text-2xl font-black text-amber-300 mt-1 block tabular-nums">{toPersianNumbers(workshopPendingReceiptsCount)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">ثبت‌نام‌های قطعی کارگاه‌ها</span>
              <span className="text-2xl font-black text-white mt-1 block tabular-nums">{toPersianNumbers(workshopConfirmedCount)}</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/10 text-xs">
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">کل درخواست‌های خدمات روانشناختی و مشاوره</span>
              <span className="text-2xl font-black text-white mt-1 block tabular-nums">{toPersianNumbers(totalRequests)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">نوبت‌های در انتظار پذیرش</span>
              <span className="text-2xl font-black text-amber-300 mt-1 block tabular-nums">{toPersianNumbers(pendingCount)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">جلسات هماهنگ‌شده</span>
              <span className="text-2xl font-black text-emerald-300 mt-1 block tabular-nums">{toPersianNumbers(scheduledCount)}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <span className="text-slate-300 font-bold block">روان‌شناسان فعال مرکز</span>
              <span className="text-2xl font-black text-white mt-1 block tabular-nums">{toPersianNumbers(activePsychologistsCount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Completely Separate Top-Level Admin Workspace Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => setAdminWorkspace('booking')}
          className={`text-right p-4 sm:p-5 rounded-3xl border backdrop-blur-xl transition-all flex items-center justify-between gap-4 cursor-pointer ${
            adminWorkspace === 'booking'
              ? 'bg-gradient-to-l from-emerald-800 via-teal-900 to-slate-900 text-white border-emerald-400/50 shadow-lg'
              : 'bg-white/80 dark:bg-slate-900/75 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                adminWorkspace === 'booking'
                  ? 'bg-white/15 border-white/25 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span
                className={`text-[11px] font-bold block ${
                  adminWorkspace === 'booking' ? 'text-emerald-200' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                پنل مدیریت ۱
              </span>
              <h2 className="text-sm sm:text-base font-black truncate">
                پنل مدیریت رزرو وقت مشاوره و پرونده‌ها
              </h2>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  adminWorkspace === 'booking' ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                پذیرش، نوبت‌دهی، کادر روان‌شناسان، آزمون‌ها، تعرفه و فرم‌ساز
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-amber-400 text-stone-950 text-[11px] font-black shrink-0 whitespace-nowrap tabular-nums">
              {toPersianNumbers(pendingCount)} نوبت معلق
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAdminWorkspace('workshops')}
          className={`text-right p-4 sm:p-5 rounded-3xl border backdrop-blur-xl transition-all flex items-center justify-between gap-4 cursor-pointer ${
            adminWorkspace === 'workshops'
              ? 'bg-gradient-to-l from-indigo-900 via-teal-900 to-slate-900 text-white border-teal-400/50 shadow-lg'
              : 'bg-white/80 dark:bg-slate-900/75 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-teal-400/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                adminWorkspace === 'workshops'
                  ? 'bg-white/15 border-white/25 text-amber-300'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span
                className={`text-[11px] font-bold block ${
                  adminWorkspace === 'workshops' ? 'text-teal-200' : 'text-indigo-700 dark:text-indigo-400'
                }`}
              >
                پنل مدیریت ۲
              </span>
              <h2 className="text-sm sm:text-base font-black truncate">
                پنل مدیریت کارگاه‌های آموزشی
              </h2>
              <p
                className={`text-[11px] mt-0.5 truncate ${
                  adminWorkspace === 'workshops' ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                تعریف کارگاه، جلسات، اساتید، تایید فیش، اقساط، تخفیف و گواهی
              </p>
            </div>
          </div>
          {workshopPendingReceiptsCount > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white text-[11px] font-black shrink-0 whitespace-nowrap tabular-nums">
              {toPersianNumbers(workshopPendingReceiptsCount)} فیش منتظر
            </span>
          )}
        </button>
      </div>

      {/* WORKSPACE 2: DEDICATED COUNSELING WORKSHOPS ADMIN ENGINE */}
      {adminWorkspace === 'workshops' && (
        <Suspense fallback={<ModuleFallback />}>
          <CoursesSection
            mode="counseling_workshop"
            onOpenShowcaseEditor={!isObserver ? () => setShowcaseEditorOpen(true) : undefined}
          />
        </Suspense>
      )}

      {/* WORKSPACE 1: DEDICATED COUNSELING BOOKING ADMIN ENGINE */}
      {adminWorkspace === 'booking' && (
        <>
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
                label: 'ویرایش صفحه، زمینه‌ها، شهرها و فرم',
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 w-full lg:w-80">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={
                        isPsychologistRole
                          ? 'جستجو بر اساس نام، موبایل، شهر یا زمینه...'
                          : 'جستجو بر اساس نام، کد ملی، موبایل، شهر یا زمینه...'
                      }
                      className="bg-transparent text-xs focus:outline-none w-full"
                    />
                  </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={fieldFilter}
                  onChange={e => setFieldFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="all">همه زمینه‌های مشاوره</option>
                  <option value="__none__">بدون انتخاب زمینه</option>
                  {generalFieldTitles.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  <option value="all">همه شهرها / مکان‌ها</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
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
              هیچ درخواست خدمات روانشناختی و مشاوره‌ای با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRequests.map(req => {
                const isPending = req.status === 'pending';
                const isAttended = req.status === 'attended' || req.status === 'completed';
                const locVal = req.formResponses?.counselingLocation;
                const timeVal = req.formResponses?.counselingTimePreference;

                return (
                  <div
                    key={req.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border flex flex-col justify-between gap-4 shadow-2xs ${
                      isPending ? 'border-amber-400 ring-2 ring-amber-100 dark:ring-amber-900/20' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white">{req.applicantName}</h4>
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                            {req.selectedFieldTitle || 'بدون انتخاب زمینه (درخواست عمومی)'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {toPersianNumbers(req.userPhone || clientPhoneByUserId.get(req.applicantId) || '---')}
                            </span>
                            {!isPsychologistRole && req.userNationalId && (
                              <span>· کد ملی: {toPersianNumbers(req.userNationalId)}</span>
                            )}
                            <span>· {req.meetingMode}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${
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

                      {(locVal || timeVal) && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {locVal && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>مکان: {String(locVal)}</span>
                            </span>
                          )}
                          {timeVal && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-bold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>زمان: {String(timeVal)}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {req.description && (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                          {req.description}
                        </div>
                      )}

                      {Array.isArray(req.attachments) && req.attachments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-slate-500 inline-flex items-center gap-1">
                            <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                            <span>پیوست‌ها:</span>
                          </span>
                          {req.attachments.map((att, idx) => (
                            <button
                              key={`${att.url}-${idx}`}
                              type="button"
                              onClick={async () => {
                                try {
                                  await api.downloadPrivateFile(att.url, att.name);
                                } catch (err: any) {
                                  window.dispatchEvent(
                                    new CustomEvent('app:toast', {
                                      detail: { message: err?.message || 'خطا در دانلود پیوست.', type: 'error' },
                                    })
                                  );
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                            >
                              <Download className="w-3 h-3 text-emerald-600" />
                              <span>{att.name || `فایل ${idx + 1}`}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {req.scheduledDate && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                          <span>زمان: {toPersianNumbers(req.scheduledDate)} {req.scheduledTime || ''}</span>
                          <span>روان‌شناس: {req.preferredConsultantName || 'تعیین‌نشده'}</span>
                        </div>
                      )}
                    </div>

                    {!isObserver && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(req)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{isPending ? 'تعیین زمان و ویرایش' : 'ویرایش و زمان‌بندی'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setContactModalClient({
                                fullName: req.applicantName,
                                phone: req.userPhone || clientPhoneByUserId.get(req.applicantId) || '',
                              })
                            }
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
                            title="نمایش نام و شماره تماس مراجع"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            <span>اطلاعات تماس مراجع</span>
                          </button>

                          {!isAttended && req.status !== 'cancelled' && (
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

                        <div className="flex items-center gap-1">
                          {req.status !== 'cancelled' && (
                            confirmCancelRequestId === req.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await updateCounselingStatus(req.id, 'cancelled', undefined, 'لغو شده توسط مدیر');
                                    setConfirmCancelRequestId(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-[11px] cursor-pointer"
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
                                className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                                title="لغو نوبت"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )
                          )}

                          {confirmDeleteRequestId === req.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteCounselingRequest(req.id);
                                  setConfirmDeleteRequestId(null);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-[11px] cursor-pointer"
                              >
                                حذف قطعی
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteRequestId(null)}
                                className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                              >
                                انصراف
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteRequestId(req.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="حذف درخواست"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
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
          <PsychologicalTestsTab isPsychologistMode={!isObserver} />
          <CounselingCalendarAndDossierSuite
            currentUser={currentUser}
            consultants={generalConsultants}
            counselingRequests={generalRequests}
            isOfficial={!isObserver}
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
            {!isObserver && (
              <button
                type="button"
                onClick={openAddConsultantModal}
                className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن روان‌شناس جدید</span>
              </button>
            )}
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

                {!isObserver && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: General Tariffs Admin Management */}
      {activeTab === 'tariffs' && <GeneralCounselingTariffsTab isAdminMode={!isObserver} />}

      {/* Tab 5: Full Page, Fields, Cities & Dynamic Form Builder */}
      {activeTab === 'form_builder' && <CounselingFormBuilderTab counselingType="general" />}
        </>
      )}

      {/* Schedule & Edit Request Modal */}
      <AnimatePresence>
        {editingRequest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden" dir="rtl" onClick={() => setEditingRequest(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-xs max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                  تعیین زمان و ویرایش درخواست: {editingRequest.applicantName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  aria-label="بستن"
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form id="admin-general-schedule-form" onSubmit={handleSaveSchedule} className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-4">

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
                  <label className="block font-bold mb-1">زمینه مشاوره:</label>
                  <select
                    value={scheduleForm.selectedFieldTitle}
                    onChange={e => setScheduleForm({ ...scheduleForm, selectedFieldTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="">بدون انتخاب زمینه (عمومی)</option>
                    {generalFieldTitles.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">شیوه برگزاری:</label>
                  <select
                    value={scheduleForm.meetingMode}
                    onChange={e => setScheduleForm({ ...scheduleForm, meetingMode: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="حضوری">حضوری</option>
                    <option value="برخط (تصویری امن)">برخط (تصویری امن)</option>
                    <option value="تلفنی">تلفنی</option>
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
                <label className="block font-bold mb-1">محل جلسه / نام مرکز یا لینک اختصاصی:</label>
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

              </form>
              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  form="admin-general-schedule-form"
                  className="px-5 py-2.5 min-h-[42px] rounded-xl bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Psychologist Modal */}
      <AnimatePresence>
        {(isAddConsultantOpen || selectedConsultant) && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden" dir="rtl" onClick={() => { setIsAddConsultantOpen(false); setSelectedConsultant(null); }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl text-xs max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                  {selectedConsultant ? `ویرایش روان‌شناس: ${selectedConsultant.name}` : 'افزودن روان‌شناس جدید مرکز'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddConsultantOpen(false);
                    setSelectedConsultant(null);
                  }}
                  aria-label="بستن"
                  className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form id="admin-general-consultant-form" onSubmit={handleSaveConsultant} className="p-4 sm:p-6 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-4">

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

              <div className="space-y-1.5">
                <label className="block font-bold">تصویر پروفایل روان‌شناس / مشاور:</label>
                <div className="flex flex-wrap items-center gap-3">
                  {consultantForm.avatarUrl && (
                    <img
                      src={consultantForm.avatarUrl}
                      alt="تصویر روان‌شناس"
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    value={consultantForm.avatarUrl || ''}
                    onChange={e => setConsultantForm({ ...consultantForm, avatarUrl: e.target.value })}
                    placeholder="آدرس تصویر یا آپلود از سیستم..."
                    dir="ltr"
                    className="flex-1 min-w-[180px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingAvatar ? 'در حال آپلود...' : 'آپلود عکس'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingAvatar}
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (!f) return;
                        setUploadingAvatar(true);
                        try {
                          const up = await api.uploadFile(f, 'counseling_media');
                          if (up?.url) setConsultantForm(prev => ({ ...prev, avatarUrl: up.url }));
                        } catch (err: any) {
                          window.dispatchEvent(
                            new CustomEvent('app:toast', {
                              detail: { message: err?.message || 'آپلود تصویر با خطا مواجه شد.', type: 'error' },
                            })
                          );
                        } finally {
                          setUploadingAvatar(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              </form>
              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddConsultantOpen(false);
                    setSelectedConsultant(null);
                  }}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  form="admin-general-consultant-form"
                  className="px-5 py-2.5 min-h-[42px] rounded-xl bg-emerald-800 text-white font-bold cursor-pointer"
                >
                  ذخیره در پایگاه داده
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Minimal-PII Client Contact Modal (Full Name & Phone Only) */}
      {contactModalClient && (
        <div
          className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-1 sm:p-4 overflow-hidden"
          dir="rtl"
          onClick={() => setContactModalClient(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-xs max-h-[92dvh] overflow-y-auto overscroll-y-contain"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات تماس مراجع</span>
              </h4>
              <button
                type="button"
                onClick={() => setContactModalClient(null)}
                aria-label="بستن"
                className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2.5">
              <div>
                <span className="text-[11px] text-slate-500 block">نام و نام خانوادگی:</span>
                <span className="font-black text-sm text-slate-900 dark:text-white">
                  {contactModalClient.fullName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">شماره تماس (موبایل):</span>
                {contactModalClient.phone ? (
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <a
                      href={`tel:${contactModalClient.phone}`}
                      className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-300 hover:underline"
                    >
                      {toPersianNumbers(contactModalClient.phone)}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(contactModalClient.phone).catch(() => {});
                        setCopiedPhone(true);
                        setTimeout(() => setCopiedPhone(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedPhone ? 'کپی شد' : 'کپی شماره'}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 font-bold">شماره تماس ثبت نشده است</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setContactModalClient(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}

      {/* 3-Section General Counseling Showcase Editor Modal */}
      {!isObserver && (
        <CounselingGeneralShowcaseEditorModal
          isOpen={showcaseEditorOpen}
          onClose={() => setShowcaseEditorOpen(false)}
        />
      )}
    </div>
  );
};

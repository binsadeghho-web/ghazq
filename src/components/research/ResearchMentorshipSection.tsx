import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ResearchMentorship } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import {
  Compass,
  CheckCircle2,
  Clock,
  Home,
  UserCheck,
  Plus,
  BookOpen,
  Sparkles,
  Download,
  X,
  ShieldCheck,
  Edit3,
  Trash2,
  Settings,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  FileText,
  GraduationCap,
  ChevronLeft,
  Info,
  Calendar,
  Layers
} from 'lucide-react';

export const ResearchMentorshipSection: React.FC = () => {
  const {
    currentUser,
    researchMentorships,
    submitResearchProject,
    updateResearchProgress,
    updateResearchProject,
    deleteResearchProject
  } = useApp();

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Admin visibility & display controls (simulated persistent settings)
  const [showPublicStats, setShowPublicStats] = useState(true);
  const [showPublicDirectory, setShowPublicDirectory] = useState(true);
  const [allowNewSubmissions, setAllowNewSubmissions] = useState(true);

  // Sub-tabs state
  const [activeTab, setActiveTab] = useState<'overview' | 'my_roadmap' | 'new_submission' | 'admin_control'>('overview');

  // New Submission Form State
  const [newTitle, setNewTitle] = useState('');
  const [newField, setNewField] = useState('فقه و حقوق جزا و جرم‌شناسی');
  const [newAccommodation, setNewAccommodation] = useState(false);
  const [newCity, setNewCity] = useState<'قم' | 'تهران' | 'مشهد'>('قم');
  const [formSuccess, setFormSuccess] = useState('');

  // Admin Modal / Edit State
  const [selectedThesisForEdit, setSelectedThesisForEdit] = useState<ResearchMentorship | null>(null);
  const [editForm, setEditForm] = useState<{
    status: ResearchMentorship['status'];
    stage: ResearchMentorship['stage'];
    stageTitle: string;
    progressPercent: number;
    assignedSupervisor: string;
    accommodationRequested: boolean;
    accommodationCity: 'قم' | 'تهران' | 'مشهد';
    thesisTitle: string;
    field: string;
    applicantName: string;
  }>({
    status: 'active',
    stage: 'proposal',
    stageTitle: 'تصویب عنوان و نگارش پروپوزال اولیه',
    progressPercent: 20,
    assignedSupervisor: '',
    accommodationRequested: false,
    accommodationCity: 'قم',
    thesisTitle: '',
    field: 'فقه و حقوق جزا و جرم‌شناسی',
    applicantName: ''
  });

  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'suspended'>('all');

  // My Thesis Records
  const myTheses = researchMentorships.filter(r => r.applicantId === currentUser?.id);
  const activeMyThesis = myTheses.find(r => r.status === 'active' || r.status === 'completed' || r.status === 'under_review') || myTheses[0];

  // Global Stats calculation
  const totalTheses = researchMentorships.length;
  const activeThesesCount = researchMentorships.filter(r => r.status === 'active' || r.status === 'under_review').length;
  const completedThesesCount = researchMentorships.filter(r => r.status === 'completed').length;
  const pendingThesesCount = researchMentorships.filter(r => r.status === 'pending' || r.status === 'under_review').length;

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim()) return;

    submitResearchProject({
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      thesisTitle: newTitle.trim(),
      field: newField,
      stage: 'proposal',
      stageTitle: 'تصویب عنوان و نگارش پروپوزال اولیه',
      accommodationRequested: newAccommodation,
      ...(newAccommodation && { accommodationCity: newCity }),
    });

    setNewTitle('');
    setNewAccommodation(false);
    setFormSuccess('درخواست راهبری پایان‌نامه شما ثبت شد و پس از بررسی توسط شورای پژوهش فعال خواهد شد.');
    setTimeout(() => setFormSuccess(''), 6000);
    setActiveTab('my_roadmap');
  };

  const handleOpenEditModal = (proj: ResearchMentorship) => {
    setSelectedThesisForEdit(proj);
    setEditForm({
      status: proj.status,
      stage: proj.stage,
      stageTitle: proj.stageTitle,
      progressPercent: proj.progressPercent,
      assignedSupervisor: proj.assignedSupervisor || '',
      accommodationRequested: proj.accommodationRequested,
      accommodationCity: proj.accommodationCity || 'قم',
      thesisTitle: proj.thesisTitle,
      field: proj.field,
      applicantName: proj.applicantName
    });
  };

  const handleSaveThesisEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThesisForEdit) return;

    updateResearchProject(selectedThesisForEdit.id, {
      status: editForm.status,
      stage: editForm.stage,
      stageTitle: editForm.stageTitle,
      progressPercent: editForm.progressPercent,
      assignedSupervisor: editForm.assignedSupervisor,
      accommodationRequested: editForm.accommodationRequested,
      accommodationCity: editForm.accommodationCity,
      thesisTitle: editForm.thesisTitle,
      field: editForm.field,
      applicantName: editForm.applicantName
    });

    setSelectedThesisForEdit(null);
  };

  const handleDeleteThesis = (id: string) => {
    if (confirm('آیا از حذف یا بایگانی این پایان‌نامه اطمینان دارید؟ تمامی اطلاعات آن ماندگار باقی می‌ماند.')) {
      deleteResearchProject(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview KPI Cards (Control via Admin setting `showPublicStats` or Official role) */}
      {(showPublicStats || isOfficial) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModernMetricCard
            title="کل رساله‌های در حال راهبری"
            value={totalTheses}
            periodLabel="پایان‌نامه‌های ثبت‌شده در کلینیک"
            unit="عنوان"
            icon={<Compass className="w-4 h-4 text-amber-500" />}
            onClick={() => setActiveTab('overview')}
          />
          <ModernMetricCard
            title="پایان‌نامه‌های فعال و جاری"
            value={activeThesesCount}
            periodLabel="در مرحله نگارش و نقد علمی"
            unit="عنوان"
            icon={<Clock className="w-4 h-4 text-blue-500" />}
            onClick={() => setActiveTab('overview')}
          />
          <ModernMetricCard
            title="رساله‌های دفاع‌شده"
            value={completedThesesCount}
            periodLabel="پایان‌یافته با موفقیت"
            unit="رساله"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            onClick={() => setActiveTab('overview')}
          />
          <ModernMetricCard
            title="اسکان مطالعاتی فعال"
            value={researchMentorships.filter(r => r.accommodationRequested).length}
            periodLabel="قم، تهران و مشهد"
            unit="مورد"
            icon={<Home className="w-4 h-4 text-purple-500" />}
            onClick={() => setActiveTab('overview')}
          />
        </div>
      )}

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
              کلینیک تخصصی راهبری پایان‌نامه‌ها و رساله‌ها
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">سطح ۴ و دکتری تخصصی</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            راهبری پایان‌نامه‌ها و شتاب‌دهی علمی رساله‌ها
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            هدایت علمی پایان‌نامه‌های فقه و حقوق، انتصاب استاد راهنما، ویراستاری تخصصی و اسکان پژوهشی در قم، تهران و مشهد
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {allowNewSubmissions && (
            <button
              onClick={() => setActiveTab('new_submission')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>درخواست راهبری پایان‌نامه جدید</span>
            </button>
          )}

          {isOfficial && (
            <button
              onClick={() => setActiveTab('admin_control')}
              className="px-4 py-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>پنل مدیریت و تنظیمات ادمین ({pendingThesesCount} معلق)</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-500" />
          <span>شناسنامه و بانک پایان‌نامه‌ها</span>
        </button>

        <button
          onClick={() => setActiveTab('my_roadmap')}
          className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'my_roadmap'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-500" />
          <span>پنل و گام‌به‌گام پایان‌نامه من ({myTheses.length})</span>
        </button>

        {allowNewSubmissions && (
          <button
            onClick={() => setActiveTab('new_submission')}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'new_submission'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-500" />
            <span>ثبت درخواست جدید راهبری</span>
          </button>
        )}

        {isOfficial && (
          <button
            onClick={() => setActiveTab('admin_control')}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'admin_control'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مدیریت و تنظیمات ادمین</span>
          </button>
        )}
      </div>

      {/* Tab 1: Overview & Directory */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3 shadow-md">
            <div className="inline-flex items-center gap-2 text-xs text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="w-4 h-4" />
              <span>سامانه شتاب‌دهی و هدایت پایان‌نامه‌های تخصصی فقه و حقوق</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              شبکه واحد راهبری پایان‌نامه‌های نخبگان قضایی
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              این کلینیک تخصصی امکان هماهنگی استاد راهنما، نقد و ویراستاری علمی فصول تدوین‌شده و اعطای تسهیلات اسکان موقت در شهرهای قم، تهران و مشهد را برای پژوهشگران فراهم می‌آورد.
            </p>
          </div>

          {showPublicDirectory || isOfficial ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>فهرست پایان‌نامه‌های فعال و در حال راهبری ({researchMentorships.length}):</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {researchMentorships.map(proj => (
                  <div
                    key={proj.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-3 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-500/20 truncate">
                          {proj.stageTitle}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-slate-500">
                          {proj.progressPercent}٪
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {proj.thesisTitle}
                      </h4>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p><strong>پژوهشگر:</strong> {proj.applicantName}</p>
                        <p><strong>گرایش:</strong> {proj.field}</p>
                        <p><strong>استاد راهنما:</strong> {proj.assignedSupervisor || 'در حال انتصاب توسط شورا'}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      {proj.accommodationRequested ? (
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <Home className="w-3.5 h-3.5" />
                          اسکان {proj.accommodationCity}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">بدون اسکان</span>
                      )}

                      <button
                        onClick={() => {
                          if (proj.applicantId === currentUser?.id) {
                            setActiveTab('my_roadmap');
                          } else {
                            alert(`عنوان: ${proj.thesisTitle}\nپژوهشگر: ${proj.applicantName}\nمرحله: ${proj.stageTitle}`);
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-bold text-xs transition-colors"
                      >
                        {proj.applicantId === currentUser?.id ? 'ورود به پنل من' : 'مشاهده جزئیات'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-center space-y-2">
              <EyeOff className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                نمایش عمومی لیست پایان‌نامه‌ها توسط مسئول مرکز غیرفعال شده است.
              </h3>
              <p className="text-[11px] text-slate-400">
                شما همچنان می‌توانید از برگه «پنل و گام‌به‌گام پایان‌نامه من»، روند پرونده خود را پیگیری نمایید.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Transformed Alumnus Thesis Panel ("پنل و گام‌به‌گام پایان‌نامه من") */}
      {activeTab === 'my_roadmap' && (
        <div className="space-y-6">
          {!activeMyThesis ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/90 dark:border-slate-800 space-y-3">
              <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                هنوز هیچ درخواست راهبری پایان‌نامه‌ای برای شما ثبت یا تایید نشده است.
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                جهت شروع فرآیند راهبری پایان‌نامه، انتصاب استاد راهنما و استفاده از اسکان پژوهشی، درخواست جدید خود را ثبت فرمایید.
              </p>
              {allowNewSubmissions && (
                <button
                  onClick={() => setActiveTab('new_submission')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت درخواست راهبری پایان‌نامه</span>
                </button>
              )}
            </div>
          ) : activeMyThesis.status === 'pending' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-amber-200 dark:border-amber-800/50 space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold">درخواست راهبری پایان‌نامه شما در حال بررسی دبیرخانه است</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    عنوان ثبت‌شده: <strong className="text-slate-800 dark:text-slate-200">{activeMyThesis.thesisTitle}</strong>
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl">
                پس از بررسی شورای پژوهشی مرکز و انتصاب استاد راهنما، این پنل به طور خودکار تبدیل به «فرماندهی گام‌به‌گام راهبری پایان‌نامه» شما خواهد شد.
              </p>
            </div>
          ) : (
            /* Transformed Interactive Command Panel for Approved/Active Thesis */
            <div className="space-y-6">
              {/* Main Thesis Identity Header */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700/80 pb-5">
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold inline-block">
                      ✓ وضعیت: در حال راهبری و فعال
                    </span>
                    <h2 className="text-lg md:text-xl font-black text-white leading-tight">
                      {activeMyThesis.thesisTitle}
                    </h2>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-xs text-slate-400 block">درصد پیشرفت کل:</span>
                    <span className="text-2xl font-black font-mono tabular-nums text-emerald-400">
                      {activeMyThesis.progressPercent}٪
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-700 shadow-sm"
                      style={{ width: `${activeMyThesis.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                    <span>مرحله فعلی: {activeMyThesis.stageTitle}</span>
                    <span>۱۰۰٪ (آماده دفاع)</span>
                  </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block">استاد راهنمای معتمد:</span>
                    <span className="font-bold text-amber-300">
                      {activeMyThesis.assignedSupervisor || 'در حال تعیین نهایی توسط شورا'}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block">گرایش علمی:</span>
                    <span className="font-bold text-white">{activeMyThesis.field}</span>
                  </div>

                  <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
                    <span className="text-slate-400 block">اسکان پژوهشی:</span>
                    <span className="font-bold text-emerald-300">
                      {activeMyThesis.accommodationRequested ? `تخصیص‌یافته در ${activeMyThesis.accommodationCity}` : 'بدون درخواست اسکان'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Interactive Roadmap Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span>نقشه راه گام‌به‌گام و مراحل تصویب و نگارش رساله:</span>
                </h3>

                <div className="space-y-3">
                  {activeMyThesis.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        m.isDone
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            m.isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {m.isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {m.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {m.isDone ? 'تایید و تکمیل شد' : 'در حال انجام / پیش‌بینی آینده'}
                          </span>
                        </div>
                      </div>

                      <span className="font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 font-semibold bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                        {m.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: New Thesis Guidance Request Form */}
      {activeTab === 'new_submission' && allowNewSubmissions && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-xs max-w-2xl mx-auto">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              <span>ثبت درخواست راهبری پایان‌نامه و رساله دکتری</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              جهت انتصاب استاد راهنما، نقد علمی فصول و بهره‌مندی از اسکان پژوهشی، اطلاعات زیر را وارد نمایید.
            </p>
          </div>

          {formSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmitNew} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                عنوان مصوب یا پیشنهادی رساله / پایان‌نامه:
              </label>
              <textarea
                rows={3}
                required
                placeholder="عنوان دقیق رساله یا پایان‌نامه مد نظر خود را وارد فرمایید..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                گرایش تخصصی:
              </label>
              <select
                value={newField}
                onChange={e => setNewField(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="فقه و حقوق جزا و جرم‌شناسی">فقه و حقوق جزا و جرم‌شناسی</option>
                <option value="فقه و حقوق خصوصی و قراردادها">فقه و حقوق خصوصی و قراردادها</option>
                <option value="فقه القضا و آیین دادرسی">فقه القضا و آیین دادرسی</option>
                <option value="حقوق عمومی و فقه حکومتی">حقوق عمومی و فقه حکومتی</option>
              </select>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-900 dark:text-white">
                <input
                  type="checkbox"
                  checked={newAccommodation}
                  onChange={e => setNewAccommodation(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                />
                <span>تقاضای تسهیلات اسکان موقت پژوهشی و استفاده از منابع کتابخانه‌ای دارم</span>
              </label>

              {newAccommodation && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                    شهر اولویت اسکان:
                  </label>
                  <select
                    value={newCity}
                    onChange={e => setNewCity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="قم">قم (پردیس پژوهشی و کتابخانه تخصصی آیت‌الله بروجردی)</option>
                    <option value="تهران">تهران (دانشگاه علوم قضایی و کتابخانه ملی)</option>
                    <option value="مشهد">مشهد (مرکز اسناد آستان قدس رضوی)</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl font-black transition-all shadow-md active:scale-[0.99]"
            >
              ثبت نهایی درخواست راهبری
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Admin Management & Settings Panel */}
      {activeTab === 'admin_control' && isOfficial && (
        <div className="space-y-6">
          {/* Admin Control Settings Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  تنظیمات نمایشی و اختیارات ادمین در بخش راهبری پایان‌نامه‌ها
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">نمایش آمار به عموم:</span>
                  <span className="text-[11px] text-slate-400">کارت‌های شاخص کلی در بالای صفحه</span>
                </div>
                <input
                  type="checkbox"
                  checked={showPublicStats}
                  onChange={e => setShowPublicStats(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">بانک پایان‌نامه‌ها:</span>
                  <span className="text-[11px] text-slate-400">نمایش لیست بقیه دانش‌آموختگان</span>
                </div>
                <input
                  type="checkbox"
                  checked={showPublicDirectory}
                  onChange={e => setShowPublicDirectory(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">پذیرش درخواست جدید:</span>
                  <span className="text-[11px] text-slate-400">فعال بودن دکمه ثبت درخواست</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowNewSubmissions}
                  onChange={e => setAllowNewSubmissions(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
              </label>
            </div>
          </div>

          {/* Admin Management Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                مدیریت کلیه پایان‌نامه‌ها ({researchMentorships.length}):
              </span>

              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                {[
                  { id: 'all', label: 'همه' },
                  { id: 'pending', label: 'معلق' },
                  { id: 'active', label: 'فعال' },
                  { id: 'completed', label: 'پایان‌یافته' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setAdminFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      adminFilter === f.id
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {researchMentorships
                .filter(r => adminFilter === 'all' || r.status === adminFilter)
                .map(proj => (
                  <div key={proj.id} className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {proj.thesisTitle}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          {proj.stageTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                        <span>پژوهشگر: <strong>{proj.applicantName}</strong></span>
                        <span>·</span>
                        <span>استاد راهنما: {proj.assignedSupervisor || 'تعیین‌نشده'}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">پیشرفت: {proj.progressPercent}٪</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(proj)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تایید / ویرایش</span>
                      </button>

                      <button
                        onClick={() => handleDeleteThesis(proj.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="حذف یا بایگانی"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit / Approval Modal */}
      {selectedThesisForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                تایید، انتصاب استاد و ویرایش پایان‌نامه
              </h3>
              <button onClick={() => setSelectedThesisForEdit(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveThesisEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  وضعیت کلی پایان‌نامه:
                </label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="pending">در انتظار تایید شورا (معلق)</option>
                  <option value="active">تاییدشده و فعال (در حال راهبری)</option>
                  <option value="completed">پایان‌یافته و دفاع‌شده</option>
                  <option value="suspended">بایگانی شده / غیرفعال</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  عنوان رساله:
                </label>
                <input
                  type="text"
                  required
                  value={editForm.thesisTitle}
                  onChange={e => setEditForm(prev => ({ ...prev, thesisTitle: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  استاد راهنمای انتصابی:
                </label>
                <input
                  type="text"
                  placeholder="نام و عنوان استاد راهنما..."
                  value={editForm.assignedSupervisor}
                  onChange={e => setEditForm(prev => ({ ...prev, assignedSupervisor: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    عنوان گام / مرحله فعلی:
                  </label>
                  <input
                    type="text"
                    value={editForm.stageTitle}
                    onChange={e => setEditForm(prev => ({ ...prev, stageTitle: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    درصد پیشرفت (۰ تا ۱۰۰):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editForm.progressPercent}
                    onChange={e => setEditForm(prev => ({ ...prev, progressPercent: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedThesisForEdit(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium"
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
    </div>
  );
};

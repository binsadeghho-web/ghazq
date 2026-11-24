import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Clock,
  Info,
  X,
  UserCheck,
  Calendar,
  Video,
  Building,
  Phone,
  CheckCircle2,
  Sparkles,
  Award,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingFieldItem } from '../../types';
import { AdminSpecializedCounselingSuite } from './AdminSpecializedCounselingSuite';
import { CounselingLandingHero } from './CounselingLandingHero';
import { CounselingDynamicWizardModal } from './CounselingDynamicWizardModal';
import { toPersianNumbers } from '../../utils/persianNumbers';

const STAFF_ROLES = new Set([
  'admin',
  'super_admin',
  'supervisor',
  'alumni_manager',
  'cultural_educational_officer',
]);

export const SpecializedCareerCounselingSection: React.FC = () => {
  const {
    currentUser,
    consultants,
    counselingRequests,
    specializedConfig,
    counselingFields,
    bookCounseling,
    isAlumniPreview,
  } = useApp();

  const isOfficial = Boolean(currentUser?.role && STAFF_ROLES.has(currentUser.role));
  const [previewStudentMode, setPreviewStudentMode] = useState(false);

  const [activeTab, setActiveTab] = useState<'landing' | 'my_history' | 'advisors'>('landing');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [preselectedField, setPreselectedField] = useState<CounselingFieldItem | null>(null);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedAdvisorModal, setSelectedAdvisorModal] = useState<Consultant | null>(null);

  const specializedFields = useMemo(
    () =>
      counselingFields
        .filter(f => f.counselingType === 'specialized_career' && f.isActive)
        .sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1)),
    [counselingFields]
  );

  const specializedAdvisors = useMemo(
    () => consultants.filter(c => c.isActive !== false && c.counselingType === 'specialized_career'),
    [consultants]
  );

  const mySpecializedRequests = useMemo(
    () =>
      counselingRequests.filter(
        r => r.counselingType === 'specialized_career' && r.applicantId === currentUser?.id
      ),
    [counselingRequests, currentUser]
  );

  if (isOfficial && !previewStudentMode && !isAlumniPreview) {
    return <AdminSpecializedCounselingSuite onSwitchToStudentPreview={() => setPreviewStudentMode(true)} />;
  }

  const startWizard = (field?: CounselingFieldItem) => {
    setPreselectedField(field || null);
    setWizardOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'scheduled') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
          هماهنگ‌شده
        </span>
      );
    }
    if (status === 'attended' || status === 'completed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
          برگزارشده
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
          لغوشده
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
        در حال بررسی
      </span>
    );
  };

  return (
    <div className="space-y-3.5 sm:space-y-6" dir="rtl">
      {isOfficial && previewStudentMode && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 rounded-2xl p-3 px-4 sm:px-5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <span className="text-xs font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            در حال مشاهده پیش‌نمایش دانش‌آموخته در بخش مشاوره تخصصی شغلی و تحصیلی هستید.
          </span>
          <button
            type="button"
            onClick={() => setPreviewStudentMode(false)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold cursor-pointer"
          >
            بازگشت به میز مدیریت ادمین
          </button>
        </div>
      )}

      {/* Unified Mobile Command Hero (< sm): Title + Subtitle + Integrated Direct Request CTA */}
      <div className="sm:hidden relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#071E17] via-[#0E3226] to-[#08221A] text-white p-4 border border-amber-400/20 shadow-[0_16px_38px_-18px_rgba(7,30,23,0.7)] space-y-3.5">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 luxury-lattice-bg opacity-65" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-amber-300/60 to-transparent" />

        <div className="relative z-10 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-300/35 text-amber-300 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-white truncate">
                {specializedConfig.sectionTitle}
              </h1>
              <p className="text-[11px] text-emerald-100/80 truncate mt-0.5">
                {specializedConfig.sectionSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDescriptionModalOpen(true)}
            className="px-3 py-2 min-h-[40px] rounded-xl bg-white/10 border border-white/15 text-amber-200 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>راهنما</span>
          </button>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => startWizard()}
            className="flex-1 min-h-[46px] px-4 rounded-2xl bg-gradient-to-l from-amber-300 via-amber-400 to-yellow-300 text-[#071E17] font-black text-xs flex items-center justify-between gap-2 shadow-[0_10px_24px_-10px_rgba(251,191,36,0.65)] cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="truncate">{specializedConfig.ctaButtonLabel || 'درخواست مشاوره تخصصی'}</span>
            </span>
            <ArrowLeft className="w-4 h-4 shrink-0" />
          </motion.button>

          {mySpecializedRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('my_history')}
              className="min-h-[46px] px-3.5 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 tabular-nums cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{toPersianNumbers(mySpecializedRequests.length)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Header (Tablet & Desktop >= sm) */}
      <div className="hidden sm:flex glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/10 flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>{specializedConfig.headerBadgeLabel || 'سامانه هدایت حرفه‌ای و علمی دانش‌آموختگان'}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {specializedConfig.sectionTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {specializedConfig.sectionSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDescriptionModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Info className="w-4 h-4 text-amber-400" />
          <span>{specializedConfig.descriptionButtonLabel || 'توضیحات'}</span>
        </button>
      </div>

      {/* Rebuilt Alumni Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-white/90 sm:glass-panel rounded-2xl border border-stone-200/80 sm:border-slate-200/90 dark:border-white/10 text-[11px] sm:text-xs overflow-x-auto scrollbar-none shadow-2xs">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('landing')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 min-h-[38px] rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
            activeTab === 'landing'
              ? 'bg-emerald-900 sm:bg-white sm:dark:bg-slate-700 text-white sm:text-slate-900 sm:dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'landing' ? 'text-amber-300 sm:text-indigo-600' : 'text-indigo-600'}`} />
          <span className="sm:hidden">موضوعات</span>
          <span className="hidden sm:inline">{specializedConfig.tabRequestLabel || 'معرفی، زمینه‌ها و ثبت درخواست'}</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('my_history')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 min-h-[38px] rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer tabular-nums ${
            activeTab === 'my_history'
              ? 'bg-emerald-900 sm:bg-white sm:dark:bg-slate-700 text-white sm:text-slate-900 sm:dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'my_history' ? 'text-amber-300 sm:text-blue-600' : 'text-blue-600'}`} />
          <span className="sm:hidden">سوابق ({toPersianNumbers(mySpecializedRequests.length)})</span>
          <span className="hidden sm:inline">{specializedConfig.tabHistoryLabel || 'سوابق درخواست‌های من'} ({toPersianNumbers(mySpecializedRequests.length)})</span>
        </motion.button>

        {specializedConfig.showAdvisorsToStudents && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('advisors')}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 min-h-[38px] rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer tabular-nums ${
              activeTab === 'advisors'
                ? 'bg-emerald-900 sm:bg-white sm:dark:bg-slate-700 text-white sm:text-slate-900 sm:dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'advisors' ? 'text-amber-300 sm:text-emerald-600' : 'text-emerald-600'}`} />
            <span className="sm:hidden">مشاوران ({toPersianNumbers(specializedAdvisors.length)})</span>
            <span className="hidden sm:inline">{specializedConfig.tabConsultantsLabel || 'مشاوران تخصصی'} ({toPersianNumbers(specializedAdvisors.length)})</span>
          </motion.button>
        )}
      </div>

      {/* Tab 1: Clean Intro + Counseling Fields + CTA (NO immediate booking form) */}
      {activeTab === 'landing' && (
        <CounselingLandingHero
          variant="specialized"
          badgeLabel={specializedConfig.heroBadgeLabel || 'بخش مشاوره تخصصی شغلی و تحصیلی'}
          introTitle={specializedConfig.landingIntroTitle}
          introBody={specializedConfig.landingIntroBody}
          historyButtonLabel={specializedConfig.heroHistoryButtonLabel}
          calloutBadgeLabel={specializedConfig.calloutBadgeLabel}
          calloutTitle={specializedConfig.landingCalloutTitle}
          calloutSubtitle={specializedConfig.landingCalloutSubtitle}
          ctaButtonLabel={specializedConfig.ctaButtonLabel || 'در خواست مشاوره تخصصی شغلی/تحصیلی دارم'}
          calloutSecondaryLinkLabel={specializedConfig.calloutSecondaryLinkLabel}
          descriptionButtonLabel={specializedConfig.descriptionButtonLabel || 'توضیحات'}
          fieldsShowcaseBadgeLabel={specializedConfig.fieldsShowcaseBadgeLabel}
          fieldsSectionTitle={specializedConfig.fieldsSectionTitle || 'زمینه‌های مشاوره تخصصی'}
          fieldsSectionSubtitle={specializedConfig.fieldsSectionSubtitle}
          fieldsShowcaseHelperText={specializedConfig.fieldsShowcaseHelperText}
          fieldsCardCtaLabel={specializedConfig.fieldsCardCtaLabel}
          fieldsShowcaseEmptyText={specializedConfig.fieldsShowcaseEmptyText}
          landingInfoCardsTitle={specializedConfig.landingInfoCardsTitle}
          landingInfoCardsSubtitle={specializedConfig.landingInfoCardsSubtitle}
          landingInfoCards={specializedConfig.landingInfoCards}
          fields={specializedFields}
          myRequestsCount={mySpecializedRequests.length}
          onStartWizard={startWizard}
          onOpenDescriptionModal={() => setDescriptionModalOpen(true)}
          onViewHistory={() => setActiveTab('my_history')}
        />
      )}

      {/* Tab 2: My Specialized Requests History */}
      {activeTab === 'my_history' && (
        <div className="space-y-3 sm:space-y-4">
          {mySpecializedRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white">
                  هنوز درخواستی در بخش مشاوره تخصصی شغلی/تحصیلی ثبت نکرده‌اید
                </h3>
                <p className="text-xs text-slate-500">
                  برای دریافت مشاوره گام‌به‌گام بر روی دکمه زیر کلیک نمایید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => startWizard()}
                className="px-5 py-3 min-h-[44px] rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black cursor-pointer"
              >
                {specializedConfig.ctaButtonLabel || 'در خواست مشاوره تخصصی شغلی/تحصیلی دارم'}
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {mySpecializedRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-[22px] sm:rounded-3xl p-4 sm:p-5 border border-stone-200/80 sm:border-slate-200/90 dark:border-slate-800 space-y-3 sm:space-y-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 sm:pb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {req.selectedFieldTitle || req.categoryTitle}
                      </h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {req.meetingMode === 'حضوری' ? (
                          <Building className="w-3.5 h-3.5 text-amber-600" />
                        ) : req.meetingMode === 'تلفنی' ? (
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Video className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{req.meetingMode}</span>
                      </span>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">مشاور تخصصی:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                        {req.preferredConsultantName || 'تعیین توسط دبیرخانه'}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">زمان جلسه:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block tabular-nums truncate">
                        {req.scheduledDate
                          ? `${toPersianNumbers(req.scheduledDate)} ${req.scheduledTime ? `— ${toPersianNumbers(req.scheduledTime)}` : ''}`
                          : 'در انتظار زمان‌بندی'}
                      </span>
                    </div>

                    <div className="col-span-2 md:col-span-1 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[10px] sm:text-[11px]">محل یا لینک جلسه:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block break-all">
                        {req.venueDetails || 'پس از تایید اطلاع‌رسانی می‌شود'}
                      </span>
                    </div>
                  </div>

                  {req.description && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {req.description}
                    </div>
                  )}

                  {req.counselorNotes && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black">توضیح و جمع‌بندی مشاور: </span>
                        <span>{req.counselorNotes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Conditional Advisors Roster (Controlled by Admin toggle showAdvisorsToStudents) */}
      {activeTab === 'advisors' && specializedConfig.showAdvisorsToStudents && (
        <div className="space-y-4 sm:space-y-5">
          {specializedAdvisors.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              در حال حاضر مشاوری برای نمایش عمومی در این بخش ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {specializedAdvisors.map(c => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-[22px] sm:rounded-3xl border border-stone-200/80 sm:border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 shadow-2xs"
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-3">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 text-indigo-700 font-black flex items-center justify-center shrink-0">
                          {c.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{c.name}</h3>
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 block truncate">
                          {c.title}
                          {c.academicRank ? ` · ${c.academicRank}` : ''}
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500" />
                            <span>{toPersianNumbers(c.experienceYears)} سال تجربه</span>
                          </span>
                          {c.availability && (
                            <>
                              <span>·</span>
                              <span className="truncate">{c.availability}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="line-clamp-2 sm:line-clamp-3">{c.bio || c.specialty}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAdvisorModal(c)}
                    className="w-full py-2.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>مشاهده توضیحات و رزومه مشاور</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Persistent Description Modal (Reform 46) */}
      <AnimatePresence>
        {descriptionModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl max-h-[85dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  <span>{specializedConfig.descriptionModalTitle}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setDescriptionModalOpen(false)}
                  className="p-2 min-h-[40px] min-w-[40px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-7 whitespace-pre-line">
                {specializedConfig.descriptionModalBody}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDescriptionModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-3 sm:py-2.5 min-h-[44px] rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  متوجه شدم
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advisor Details Modal */}
      <AnimatePresence>
        {selectedAdvisorModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[28px] sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedAdvisorModal.avatarUrl && (
                    <img
                      src={selectedAdvisorModal.avatarUrl}
                      alt={selectedAdvisorModal.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{selectedAdvisorModal.name}</h3>
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 truncate">
                      {selectedAdvisorModal.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAdvisorModal(null)}
                  className="p-2 min-h-[40px] min-w-[40px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedAdvisorModal.bio || selectedAdvisorModal.specialty}
                </p>

                {Array.isArray(selectedAdvisorModal.resumeDetails) && selectedAdvisorModal.resumeDetails.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 dark:text-white">سوابق علمی و حرفه‌ای:</h4>
                    <div className="space-y-1.5">
                      {selectedAdvisorModal.resumeDetails.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAdvisorModal(null)}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  بستن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdvisorModal(null);
                    startWizard();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black cursor-pointer"
                >
                  شروع ثبت درخواست مشاوره
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Step-by-Step Request Wizard */}
      <CounselingDynamicWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        counselingType="specialized_career"
        sectionTitle={specializedConfig.sectionTitle}
        descriptionButtonLabel={specializedConfig.descriptionButtonLabel || 'توضیحات'}
        onOpenDescriptionModal={() => setDescriptionModalOpen(true)}
        submissionSuccessTitle={specializedConfig.submissionSuccessTitle}
        submissionSuccessMessage={specializedConfig.submissionSuccessMessage}
        wizardSteps={specializedConfig.wizardSteps}
        fieldsList={specializedFields}
        preselectedField={preselectedField}
        consultants={specializedAdvisors}
        showConsultantsSelection={specializedConfig.showAdvisorsToStudents}
        showFieldsSelectionStep={specializedConfig.showFieldsSelectionStep}
        wizardFieldStepTitle={specializedConfig.wizardFieldStepTitle}
        wizardFieldStepSubtitle={specializedConfig.wizardFieldStepSubtitle}
        wizardFieldNotice={specializedConfig.wizardFieldNotice}
        fieldSelectionOptional={specializedConfig.fieldSelectionOptional ?? false}
        skipFieldSelectionLabel={specializedConfig.skipFieldSelectionLabel}
        otherCities={specializedConfig.otherCities}
        includeFinalReviewStep={specializedConfig.includeFinalReviewStep ?? true}
        showPhoneFieldInWizard={specializedConfig.showPhoneFieldInWizard ?? true}
        showConsultantsInWizard={specializedConfig.showConsultantsInWizard ?? true}
        submitButtonLabel={specializedConfig.submitButtonLabel}
        nextButtonLabel={specializedConfig.nextButtonLabel}
        prevButtonLabel={specializedConfig.prevButtonLabel}
        currentUser={currentUser}
        onSubmitBooking={bookCounseling}
        onDoneSuccess={() => setActiveTab('my_history')}
      />
    </div>
  );
};

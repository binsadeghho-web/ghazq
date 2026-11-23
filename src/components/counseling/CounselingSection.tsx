import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HeartHandshake,
  UserCheck,
  Clock,
  DollarSign,
  ClipboardCheck,
  Sparkles,
  Info,
  X,
  CheckCircle2,
  Calendar,
  Building,
  Phone,
  Video,
  Award,
  MessageSquare,
  Edit3,
  MapPin,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Consultant, CounselingFieldItem } from '../../types';
import { AdminCounselingGeneralSuite } from './AdminCounselingGeneralSuite';
import { CounselingLandingHero } from './CounselingLandingHero';
import { CounselingDynamicWizardModal } from './CounselingDynamicWizardModal';
import { GeneralCounselingTariffsTab } from './GeneralCounselingTariffsTab';
import { PsychologicalTestsTab } from './PsychologicalTestsTab';
import { CounselingCalendarAndDossierSuite } from './CounselingCalendarAndDossierSuite';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { useRbacPolicies, canManageAllInSection, isReadOnlyObserverRole } from '../../utils/rbacPolicy';

interface CounselingSectionProps {
  initialTab?: 'request' | 'consultants' | 'tariffs' | 'tests' | 'my_history';
  autoOpenWizardNonce?: number;
}

export const CounselingSection: React.FC<CounselingSectionProps> = ({
  initialTab = 'request',
  autoOpenWizardNonce,
}) => {
  const {
    currentUser,
    consultants,
    counselingRequests,
    generalConfig,
    counselingFields,
    counselingTariffs,
    testAssignments,
    bookCounseling,
    isAlumniPreview,
  } = useApp();

  const { rolePolicies } = useRbacPolicies();
  const canManageCounseling = canManageAllInSection(currentUser, 'counseling', rolePolicies);
  const isObserver = isReadOnlyObserverRole(currentUser?.role);
  const isOfficial = canManageCounseling || isObserver;
  const [previewStudentMode, setPreviewStudentMode] = useState(false);
  const [adminStartTab, setAdminStartTab] = useState<'queue' | 'tests_dossiers' | 'consultants' | 'tariffs' | 'form_builder'>('queue');

  const [activeTab, setActiveTab] = useState<'request' | 'consultants' | 'tariffs' | 'tests' | 'my_history'>(initialTab);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [preselectedField, setPreselectedField] = useState<CounselingFieldItem | null>(null);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [selectedPsychologistModal, setSelectedPsychologistModal] = useState<Consultant | null>(null);

  useEffect(() => {
    if (autoOpenWizardNonce && autoOpenWizardNonce > 0) {
      setActiveTab('request');
      setPreselectedField(null);
      setWizardOpen(true);
    }
  }, [autoOpenWizardNonce]);

  // Strict 100% Separation: Only general counseling fields, consultants, and requests
  const generalFields = useMemo(
    () =>
      counselingFields
        .filter(f => f.counselingType === 'general' && f.isActive)
        .sort((a, b) => (a.displayOrder || 1) - (b.displayOrder || 1)),
    [counselingFields]
  );

  const generalConsultants = useMemo(
    () => consultants.filter(c => c.isActive !== false && c.counselingType !== 'specialized_career'),
    [consultants]
  );

  const myGeneralRequests = useMemo(
    () =>
      counselingRequests.filter(
        r => r.counselingType !== 'specialized_career' && r.applicantId === currentUser?.id
      ),
    [counselingRequests, currentUser]
  );

  const myUnlockedTestsCount = useMemo(
    () => testAssignments.filter(a => a.userId === currentUser?.id && a.isVisibleToUser !== false).length,
    [testAssignments, currentUser]
  );

  if (isOfficial && !previewStudentMode && !isAlumniPreview) {
    return (
      <AdminCounselingGeneralSuite
        initialTab={adminStartTab}
        onSwitchToStudentPreview={() => setPreviewStudentMode(true)}
      />
    );
  }

  const startWizard = (field?: CounselingFieldItem) => {
    setPreselectedField(field || null);
    setWizardOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {isOfficial && previewStudentMode && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <span className="text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            در حال مشاهده پیش‌نمایش دانش‌آموخته در بخش مشاوره عمومی و روان‌شناسان مرکز هستید.
          </span>
          <div className="flex items-center gap-2">
            {canManageCounseling && !isObserver && (
              <button
                type="button"
                onClick={() => {
                  setAdminStartTab('form_builder');
                  setPreviewStudentMode(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش صفحه و فرم</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setAdminStartTab('queue');
                setPreviewStudentMode(false);
              }}
              className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold cursor-pointer"
            >
              بازگشت به میز مدیریت روان‌شناسان
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {(generalConfig.headerBadgeLabel ?? 'بخش مستقل خدمات روان‌شناسی و سلامت روان مرکز') && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              <HeartHandshake className="w-4 h-4" />
              <span>{generalConfig.headerBadgeLabel || 'بخش مستقل خدمات روان‌شناسی و سلامت روان مرکز'}</span>
            </div>
          )}
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {generalConfig.sectionTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {generalConfig.sectionSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDescriptionModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Info className="w-4 h-4 text-amber-400" />
          <span>{generalConfig.descriptionButtonLabel || 'توضیحات'}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'request'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{generalConfig.tabRequestLabel || 'رزرو وقت و زمینه‌های مشاوره'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('consultants')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'consultants'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 text-teal-600" />
          <span>{generalConfig.tabConsultantsLabel || 'روان‌شناسان مرکز'} ({toPersianNumbers(generalConsultants.length)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tariffs')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tariffs'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-600" />
          <span>{generalConfig.tabTariffsLabel || 'نرخ‌نامه'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tests'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-indigo-600" />
          <span>{generalConfig.tabTestsLabel || 'تست‌ها'} ({toPersianNumbers(myUnlockedTestsCount)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_history')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_history'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-blue-600" />
          <span>{generalConfig.tabHistoryLabel || 'سوابق مشاوره'} ({toPersianNumbers(myGeneralRequests.length)})</span>
        </button>
      </div>

      {/* Tab 1: Landing Hero + Fields + Animated CTA */}
      {activeTab === 'request' && (
        <CounselingLandingHero
          variant="general"
          badgeLabel={generalConfig.heroBadgeLabel ?? 'بخش روان‌شناسان و مشاوره عمومی مرکز'}
          introTitle={generalConfig.landingIntroTitle}
          introBody={generalConfig.landingIntroBody}
          historyButtonLabel={generalConfig.heroHistoryButtonLabel}
          calloutBadgeLabel={generalConfig.calloutBadgeLabel}
          calloutTitle={generalConfig.landingCalloutTitle}
          calloutSubtitle={generalConfig.landingCalloutSubtitle}
          ctaButtonLabel={generalConfig.ctaButtonLabel || 'رزرو وقت مشاوره'}
          calloutSecondaryLinkLabel={generalConfig.calloutSecondaryLinkLabel}
          descriptionButtonLabel={generalConfig.descriptionButtonLabel || 'توضیحات'}
          fieldsShowcaseBadgeLabel={generalConfig.fieldsShowcaseBadgeLabel}
          fieldsSectionTitle={generalConfig.fieldsSectionTitle || 'زمینه‌های مشاوره عمومی و روان‌شناختی'}
          fieldsSectionSubtitle={generalConfig.fieldsSectionSubtitle}
          fieldsShowcaseHelperText={generalConfig.fieldsShowcaseHelperText}
          fieldsCardCtaLabel={generalConfig.fieldsCardCtaLabel}
          fieldsShowcaseEmptyText={generalConfig.fieldsShowcaseEmptyText}
          landingInfoCardsTitle={generalConfig.landingInfoCardsTitle}
          landingInfoCardsSubtitle={generalConfig.landingInfoCardsSubtitle}
          landingInfoCards={generalConfig.landingInfoCards}
          fields={generalFields}
          myRequestsCount={myGeneralRequests.length}
          onStartWizard={startWizard}
          onOpenDescriptionModal={() => setDescriptionModalOpen(true)}
          onViewHistory={() => setActiveTab('my_history')}
        />
      )}

      {/* Tab 2: Psychologists Directory & Resumes */}
      {activeTab === 'consultants' && (
        <div className="space-y-5">
          {generalConsultants.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              هنوز روان‌شناسی در سامانه ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {generalConsultants.map(c => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {c.avatarUrl ? (
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-700 font-black flex items-center justify-center shrink-0">
                          {c.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{c.name}</h3>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block truncate">
                          {c.title}
                        </span>
                        {c.academicRank && (
                          <span className="text-[11px] text-slate-500 block truncate">{c.academicRank}</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {c.bio || c.specialty}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{toPersianNumbers(c.experienceYears)} سال سابقه</span>
                      </span>
                      <span>{c.availability}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPsychologistModal(c)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>مشاهده رزومه و سوابق روان‌شناس</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tariffs Schedule */}
      {activeTab === 'tariffs' && <GeneralCounselingTariffsTab isAdminMode={false} />}

      {/* Tab 4: Unlocked Psychological Tests */}
      {activeTab === 'tests' && <PsychologicalTestsTab isPsychologistMode={false} />}

      {/* Tab 5: Counseling History & Session Dossiers */}
      {activeTab === 'my_history' && (
        <div className="space-y-6">
          {myGeneralRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white">
                  هنوز سابقه مشاوره‌ای ثبت نشده است
                </h3>
                <p className="text-xs text-slate-500">
                  برای رزرو وقت جدید با روان‌شناسان مرکز روی دکمه زیر کلیک کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => startWizard()}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
              >
                {generalConfig.ctaButtonLabel || 'رزرو وقت مشاوره'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myGeneralRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {req.selectedFieldTitle || req.categoryTitle}
                      </h3>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
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
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 self-start">
                      {req.status === 'scheduled'
                        ? 'هماهنگ‌شده'
                        : req.status === 'attended' || req.status === 'completed'
                        ? 'برگزارشده'
                        : req.status === 'cancelled'
                        ? 'لغوشده'
                        : 'در حال بررسی'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[11px]">روان‌شناس معین:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {req.preferredConsultantName || 'انتخاب توسط واحد پذیرش مرکز'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[11px]">زمان برگزاری:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                        {req.scheduledDate
                          ? `${toPersianNumbers(req.scheduledDate)} ${req.scheduledTime ? `— ساعت ${toPersianNumbers(req.scheduledTime)}` : ''}`
                          : 'در انتظار زمان‌بندی'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[11px]">محل یا لینک جلسه:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 block break-all">
                        {req.venueDetails || 'پس از تایید اطلاع‌رسانی می‌شود'}
                      </span>
                    </div>
                  </div>

                  {(req.formResponses?.counselingLocation || req.formResponses?.counselingTimePreference) && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {req.formResponses?.counselingLocation && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-bold">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>مکان درخواستی: {String(req.formResponses.counselingLocation)}</span>
                        </span>
                      )}
                      {req.formResponses?.counselingTimePreference && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>زمان ترجیحی: {String(req.formResponses.counselingTimePreference)}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {req.description && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {req.description}
                    </div>
                  )}

                  {req.counselorNotes && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black">یادداشت روان‌شناس: </span>
                        <span>{req.counselorNotes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Scoped Calendar & Session Dossiers strictly for General Counseling */}
          <CounselingCalendarAndDossierSuite
            currentUser={currentUser}
            consultants={generalConsultants}
            counselingRequests={myGeneralRequests}
            isOfficial={false}
          />
        </div>
      )}

      {/* Description Modal */}
      <AnimatePresence>
        {descriptionModalOpen && (
          <div className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-500" />
                  <span>{generalConfig.descriptionModalTitle}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setDescriptionModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-7 whitespace-pre-line">
                {generalConfig.descriptionModalBody}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDescriptionModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  متوجه شدم
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Psychologist Resume Modal */}
      <AnimatePresence>
        {selectedPsychologistModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  {selectedPsychologistModal.avatarUrl && (
                    <img
                      src={selectedPsychologistModal.avatarUrl}
                      alt={selectedPsychologistModal.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                  )}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedPsychologistModal.name}</h3>
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {selectedPsychologistModal.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPsychologistModal(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedPsychologistModal.bio || selectedPsychologistModal.specialty}
                </p>

                {Array.isArray(selectedPsychologistModal.resumeDetails) && selectedPsychologistModal.resumeDetails.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 dark:text-white">رزومه و سوابق تخصصی روان‌شناس:</h4>
                    <div className="space-y-1.5">
                      {selectedPsychologistModal.resumeDetails.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPsychologistModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  بستن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPsychologistModal(null);
                    startWizard();
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
                >
                  {generalConfig.ctaButtonLabel || 'رزرو وقت مشاوره'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Multi-Step General Counseling Wizard */}
      <CounselingDynamicWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        counselingType="general"
        sectionTitle={generalConfig.sectionTitle}
        descriptionButtonLabel={generalConfig.descriptionButtonLabel || 'توضیحات'}
        onOpenDescriptionModal={() => setDescriptionModalOpen(true)}
        submissionSuccessTitle={generalConfig.submissionSuccessTitle || 'درخواست شما ثبت شد'}
        submissionSuccessMessage={generalConfig.submissionSuccessMessage}
        wizardSteps={generalConfig.wizardSteps}
        fieldsList={generalFields}
        preselectedField={preselectedField}
        consultants={generalConsultants}
        showConsultantsSelection={true}
        showFieldsSelectionStep={generalConfig.showFieldsSelectionStep}
        wizardFieldStepTitle={generalConfig.wizardFieldStepTitle}
        wizardFieldStepSubtitle={generalConfig.wizardFieldStepSubtitle}
        wizardFieldNotice={generalConfig.wizardFieldNotice}
        fieldSelectionOptional={generalConfig.fieldSelectionOptional ?? true}
        skipFieldSelectionLabel={generalConfig.skipFieldSelectionLabel}
        otherCities={generalConfig.otherCities}
        includeFinalReviewStep={generalConfig.includeFinalReviewStep ?? false}
        showPhoneFieldInWizard={generalConfig.showPhoneFieldInWizard ?? true}
        showConsultantsInWizard={generalConfig.showConsultantsInWizard ?? false}
        submitButtonLabel={generalConfig.submitButtonLabel || 'ثبت درخواست مشاوره'}
        nextButtonLabel={generalConfig.nextButtonLabel || 'ادامه و مرحله بعد'}
        prevButtonLabel={generalConfig.prevButtonLabel || 'مرحله قبل'}
        showRatesButtonInEnd={generalConfig.showRatesInWizardEnd}
        ratesButtonLabel={generalConfig.ratesButtonLabel || 'اطلاع از نرخ نامه مشاوره مرکز'}
        tariffs={counselingTariffs}
        currentUser={currentUser}
        onSubmitBooking={bookCounseling}
        onDoneSuccess={() => setActiveTab('my_history')}
      />
    </div>
  );
};

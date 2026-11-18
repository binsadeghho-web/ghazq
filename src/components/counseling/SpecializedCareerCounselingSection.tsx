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
    <div className="space-y-6" dir="rtl">
      {isOfficial && previewStudentMode && (
        <div className="bg-amber-100 border border-amber-300 text-amber-950 rounded-2xl p-3 px-5 flex items-center justify-between shadow-xs">
          <span className="text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            در حال مشاهده پیش‌نمایش دانش‌آموخته در بخش مشاوره تخصصی شغلی و تحصیلی هستید.
          </span>
          <button
            type="button"
            onClick={() => setPreviewStudentMode(false)}
            className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold cursor-pointer"
          >
            بازگشت به میز مدیریت ادمین
          </button>
        </div>
      )}

      {/* Clean Header */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1">
            <Briefcase className="w-4 h-4" />
            <span>سامانه هدایت حرفه‌ای و علمی دانش‌آموختگان</span>
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
      <div className="flex items-center gap-2 p-1.5 glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('landing')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'landing'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>معرفی، زمینه‌ها و ثبت درخواست</span>
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
          <span>سوابق درخواست‌های من ({toPersianNumbers(mySpecializedRequests.length)})</span>
        </button>

        {specializedConfig.showAdvisorsToStudents && (
          <button
            type="button"
            onClick={() => setActiveTab('advisors')}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'advisors'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>مشاوران تخصصی ({toPersianNumbers(specializedAdvisors.length)})</span>
          </button>
        )}
      </div>

      {/* Tab 1: Clean Intro + Counseling Fields + CTA (NO immediate booking form) */}
      {activeTab === 'landing' && (
        <CounselingLandingHero
          variant="specialized"
          badgeLabel="بخش مشاوره تخصصی شغلی و تحصیلی"
          introTitle={specializedConfig.landingIntroTitle}
          introBody={specializedConfig.landingIntroBody}
          calloutTitle={specializedConfig.landingCalloutTitle}
          calloutSubtitle={specializedConfig.landingCalloutSubtitle}
          ctaButtonLabel={specializedConfig.ctaButtonLabel || 'در خواست مشاوره تخصصی شغلی/تحصیلی دارم'}
          descriptionButtonLabel={specializedConfig.descriptionButtonLabel || 'توضیحات'}
          fieldsSectionTitle={specializedConfig.fieldsSectionTitle || 'زمینه‌های مشاوره تخصصی'}
          fieldsSectionSubtitle={specializedConfig.fieldsSectionSubtitle}
          fields={specializedFields}
          myRequestsCount={mySpecializedRequests.length}
          onStartWizard={startWizard}
          onOpenDescriptionModal={() => setDescriptionModalOpen(true)}
          onViewHistory={() => setActiveTab('my_history')}
        />
      )}

      {/* Tab 2: My Specialized Requests History */}
      {activeTab === 'my_history' && (
        <div className="space-y-4">
          {mySpecializedRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-4">
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
                className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black cursor-pointer"
              >
                {specializedConfig.ctaButtonLabel || 'در خواست مشاوره تخصصی شغلی/تحصیلی دارم'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {mySpecializedRequests.map(req => (
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
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[11px]">مشاور تخصصی:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {req.preferredConsultantName || 'تعیین توسط دبیرخانه مرکز'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[11px]">زمان جلسه:</span>
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

                  {req.description && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {req.description}
                    </div>
                  )}

                  {req.counselorNotes && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
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
        <div className="space-y-5">
          {specializedAdvisors.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              در حال حاضر مشاوری برای نمایش عمومی در این بخش ثبت نشده است.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {specializedAdvisors.map(c => (
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
                        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-700 font-black flex items-center justify-center shrink-0">
                          {c.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{c.name}</h3>
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 block truncate">
                          {c.title}
                        </span>
                        {c.academicRank && (
                          <span className="text-[11px] text-slate-500 block truncate">{c.academicRank}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="line-clamp-3">{c.bio || c.specialty}</p>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{toPersianNumbers(c.experienceYears)} سال تجربه</span>
                      </span>
                      <span>{c.availability}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAdvisorModal(c)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
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
                  <span>{specializedConfig.descriptionModalTitle}</span>
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
                {specializedConfig.descriptionModalBody}
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

      {/* Advisor Details Modal */}
      <AnimatePresence>
        {selectedAdvisorModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  {selectedAdvisorModal.avatarUrl && (
                    <img
                      src={selectedAdvisorModal.avatarUrl}
                      alt={selectedAdvisorModal.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                    />
                  )}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedAdvisorModal.name}</h3>
                    <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                      {selectedAdvisorModal.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAdvisorModal(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAdvisorModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  بستن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdvisorModal(null);
                    startWizard();
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-black cursor-pointer"
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
        submissionSuccessMessage={specializedConfig.submissionSuccessMessage}
        wizardSteps={specializedConfig.wizardSteps}
        fieldsList={specializedFields}
        preselectedField={preselectedField}
        consultants={specializedAdvisors}
        showConsultantsSelection={specializedConfig.showAdvisorsToStudents}
        currentUser={currentUser}
        onSubmitBooking={bookCounseling}
        onDoneSuccess={() => setActiveTab('my_history')}
      />
    </div>
  );
};

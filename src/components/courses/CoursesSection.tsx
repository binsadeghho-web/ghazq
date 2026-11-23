import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Course, CourseEnrollment, CourseInstallmentRecord, CourseScope } from '../../types';
import { GraduationCap, CreditCard, CalendarClock, ArrowLeft } from 'lucide-react';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';
import { toPersianNumbers } from '../../utils/persianNumbers';

// Subcomponents
import { CourseStatsHeader } from './subcomponents/CourseStatsHeader';
import { CourseFilterBar, CourseTab, CourseFormatFilter } from './subcomponents/CourseFilterBar';
import { CourseCard } from './subcomponents/CourseCard';
import { CourseDetailModal } from './subcomponents/CourseDetailModal';
import { CourseRegistrationModal } from './subcomponents/CourseRegistrationModal';
import { CourseAttendanceModal } from './subcomponents/CourseAttendanceModal';
import { CourseRosterModal } from './subcomponents/CourseRosterModal';
import { CourseDeleteConfirmModal } from './subcomponents/CourseDeleteConfirmModal';
import { CourseBuilderModal } from './subcomponents/CourseBuilderModal';
import { CourseLightboxModal } from './subcomponents/CourseLightboxModal';
import { CourseReceiptInspectionModal } from './subcomponents/CourseReceiptInspectionModal';
import { CourseDeletedTab } from './subcomponents/CourseDeletedTab';
import { CourseAdminPanelTab } from './subcomponents/CourseAdminPanelTab';
import { CourseAdminPanelModal } from './CourseAdminPanelModal';
import { CourseAttendanceWaitlistCertModal } from './subcomponents/CourseAttendanceWaitlistCertModal';
import { InstallmentAutoGatewayModal } from './subcomponents/InstallmentAutoGatewayModal';
import { CourseInstallmentsAdminPanel } from './subcomponents/CourseInstallmentsAdminPanel';
import { CourseDiscountsAdminPanel } from './subcomponents/CourseDiscountsAdminPanel';

interface CoursesSectionProps {
  mode?: CourseScope;
  onOpenShowcaseEditor?: () => void;
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({
  mode = 'specialized',
  onOpenShowcaseEditor,
}) => {
  const {
    currentUser,
    courses,
    courseEnrollments,
    myInstallments,
    dueNowInstallments,
    refreshMyInstallments,
    refreshCourses,
    enrollCourseWithDetails,
    addCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
    sendCourseSms,
    reviewCourseEnrollment,
    removeCourseEnrollmentFromClass,
    restoreCourseEnrollmentToClass,
    sendPinOtpSms,
  } = useApp();
  const { rolePolicies } = useRbacPolicies();

  const isWorkshopMode = mode === 'counseling_workshop';
  const unitNoun = isWorkshopMode ? 'کارگاه' : 'دوره';
  const isOfficial = isWorkshopMode
    ? canManageAllInSection(currentUser, 'counseling', rolePolicies)
    : canManageAllInSection(currentUser, 'courses', rolePolicies);
  const hideNationalId = currentUser?.role === 'psychologist_counselor';

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<CourseTab>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<CourseFormatFilter>('all');

  // Modals & Active Selections
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [registrationCourse, setRegistrationCourse] = useState<Course | null>(null);
  const [attendanceCourse, setAttendanceCourse] = useState<Course | null>(null);
  const [opsModalCourse, setOpsModalCourse] = useState<Course | null>(null);
  const [dedicatedCourseAdmin, setDedicatedCourseAdmin] = useState<Course | null>(null);
  const [courseForRoster, setCourseForRoster] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteSmsNotice, setDeleteSmsNotice] = useState<string | null>(null);
  const [courseBuilderOpen, setCourseBuilderOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [inspectingEnrollment, setInspectingEnrollment] = useState<CourseEnrollment | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Installment Auto-Gateway Modal State
  const [activeGatewayInstallment, setActiveGatewayInstallment] = useState<CourseInstallmentRecord | null>(null);
  const [isAutoTriggeredGateway, setIsAutoTriggeredGateway] = useState(false);
  const autoPromptedUserRef = useRef<string | null>(null);

  // Strictly scoped courses, enrollments, and installments by mode ('specialized' vs 'counseling_workshop')
  const scopedCourses = useMemo(
    () => courses.filter(c => (c.courseScope || 'specialized') === mode),
    [courses, mode]
  );

  const scopedCourseIds = useMemo(
    () => new Set(scopedCourses.map(c => c.id)),
    [scopedCourses]
  );

  const scopedEnrollments = useMemo(
    () => courseEnrollments.filter(e => scopedCourseIds.has(e.courseId)),
    [courseEnrollments, scopedCourseIds]
  );

  const scopedMyInstallments = useMemo(
    () => myInstallments.filter(i => scopedCourseIds.has(i.courseId)),
    [myInstallments, scopedCourseIds]
  );

  const scopedDueNowInstallments = useMemo(
    () => dueNowInstallments.filter(i => scopedCourseIds.has(i.courseId)),
    [dueNowInstallments, scopedCourseIds]
  );

  // Auto-open payment gateway when due installment exists for the current user in this scope
  useEffect(() => {
    if (!currentUser?.id) {
      autoPromptedUserRef.current = null;
      return;
    }
    if (scopedDueNowInstallments.length > 0 && autoPromptedUserRef.current !== `${currentUser.id}:${mode}`) {
      autoPromptedUserRef.current = `${currentUser.id}:${mode}`;
      setActiveGatewayInstallment(scopedDueNowInstallments[0]);
      setIsAutoTriggeredGateway(true);
    }
  }, [currentUser?.id, scopedDueNowInstallments, mode]);

  // Memoized Lists (with granular customer visibility filtering)
  const activeCourses = useMemo(
    () =>
      scopedCourses.filter(c => {
        if (c.isDeleted) return false;
        if (currentUser?.role === 'customer' && c.visibleToCustomer === false) return false;
        return true;
      }),
    [scopedCourses, currentUser?.role]
  );
  const deletedCourses = useMemo(() => scopedCourses.filter(c => c.isDeleted), [scopedCourses]);
  const availableCourses = useMemo(
    () => activeCourses.filter(c => c.status === 'enrolling' || c.status === 'ongoing'),
    [activeCourses]
  );
  const myEnrolledCourses = useMemo(() => {
    return activeCourses.filter(c => {
      if (c.classStatus === 'removed') return false;
      const myEnr = scopedEnrollments.find(e => e.courseId === c.id && e.userId === currentUser?.id);
      if (myEnr) {
        return myEnr.paymentStatus !== 'rejected' && myEnr.classStatus !== 'removed';
      }
      return Boolean(c.isEnrolled);
    });
  }, [activeCourses, scopedEnrollments, currentUser]);
  const archivedCourses = useMemo(() => activeCourses.filter(c => c.status === 'completed'), [activeCourses]);

  const pendingReceiptsCount = useMemo(() => {
    return scopedEnrollments.filter(e => e.paymentStatus === 'pending_review').length;
  }, [scopedEnrollments]);

  const unpaidMyInstallments = useMemo(
    () => scopedMyInstallments.filter(item => item.status !== 'paid'),
    [scopedMyInstallments]
  );

  const currentList = useMemo(() => {
    let list: Course[] = [];
    if (activeTab === 'available') list = availableCourses;
    else if (activeTab === 'my_courses') list = myEnrolledCourses;
    else if (activeTab === 'archive') list = archivedCourses;
    else if (activeTab === 'deleted_courses') list = deletedCourses;
    else list = activeCourses;

    return list.filter(c => {
      if (formatFilter !== 'all' && c.holdingFormat !== formatFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          (c.category && c.category.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeTab, availableCourses, myEnrolledCourses, archivedCourses, deletedCourses, activeCourses, formatFilter, searchQuery]);

  const existingEnrollment = useMemo(() => {
    if (!registrationCourse || !currentUser) return null;
    return scopedEnrollments.find(e => e.courseId === registrationCourse.id && e.userId === currentUser.id);
  }, [registrationCourse, currentUser, scopedEnrollments]);

  // Handlers
  const handleOpenRegistration = (course: Course) => {
    setRegistrationCourse(course);
  };

  const handleSubmitRegistration = async (enrollmentData: {
    paymentMethod: 'online_gateway' | 'bank_receipt';
    paymentPlanType?: 'full' | 'installment';
    discountCode?: string;
    trackingCode: string;
    receiptBankName: string;
    receiptDate: string;
    receiptFileUrl: string;
  }) => {
    if (!registrationCourse) throw new Error('No course selected');
    await enrollCourseWithDetails(registrationCourse.id, enrollmentData);
    await refreshMyInstallments().catch(() => {});
    return enrollmentData.trackingCode;
  };

  const handleStartDelete = async (course: Course) => {
    setCourseToDelete(course);
    setDeleteSmsNotice(null);
    try {
      const res = await sendPinOtpSms();
      setDeleteSmsNotice(`کد تایید ۶ رقمی به شماره همراه مدیر (${res.otpCode}) ارسال شد.`);
    } catch {
      setDeleteSmsNotice('پیامک کد امنیتی ارسال شد (پین پیش‌فرض: 123456).');
    }
  };

  const handleConfirmSoftDelete = async (pin: string) => {
    if (!courseToDelete) return;
    const res = await softDeleteCourse(courseToDelete.id, pin);
    if (!res.success) {
      throw new Error(res.message);
    }
    setCourseToDelete(null);
  };

  const handleRestore = async (course: Course) => {
    await restoreCourse(course.id);
  };

  const handleSaveCourse = async (courseData: Partial<Course>) => {
    const payloadWithScope: Partial<Course> = {
      ...courseData,
      courseScope: mode,
    };
    if (editingCourse) {
      await updateCourse(editingCourse.id, payloadWithScope);
    } else {
      await addCourse(payloadWithScope);
    }
  };

  const isCatalogTab = activeTab === 'available' || activeTab === 'my_courses' || activeTab === 'archive';

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header & Metrics Overview */}
      <CourseStatsHeader
        mode={mode}
        availableCount={availableCourses.length}
        enrolledCount={myEnrolledCourses.length}
        archiveCount={archivedCourses.length}
        pendingReceiptsCount={pendingReceiptsCount}
        totalHours={activeCourses.reduce((acc, c) => acc + c.hours, 0)}
        isOfficial={isOfficial}
        onSelectTab={setActiveTab}
        onOpenBuilder={() => {
          setEditingCourse(null);
          setCourseBuilderOpen(true);
        }}
        onOpenShowcaseEditor={onOpenShowcaseEditor}
      />

      {/* User Installment Status & Auto-Gateway Banner */}
      {unpaidMyInstallments.length > 0 && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            scopedDueNowInstallments.length > 0
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
          }`}
        >
          <div className="flex items-center gap-3 text-xs">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                scopedDueNowInstallments.length > 0 ? 'bg-amber-500 text-stone-950' : 'bg-emerald-600 text-white'
              }`}
            >
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <strong className="font-black text-sm block">
                {scopedDueNowInstallments.length > 0
                  ? `${toPersianNumbers(scopedDueNowInstallments.length)} قسط سررسید شده آماده پرداخت دارید`
                  : `${toPersianNumbers(unpaidMyInstallments.length)} قسط آتی در برنامه اقساط شما ثبت شده است`}
              </strong>
              <span className="opacity-85">
                {scopedDueNowInstallments.length > 0
                  ? `نزدیک‌ترین قسط: ${scopedDueNowInstallments[0].courseTitle || (isWorkshopMode ? 'کارگاه آموزشی' : 'دوره تخصصی')} · قسط ${toPersianNumbers(scopedDueNowInstallments[0].installmentNumber)} به مبلغ ${toPersianNumbers(scopedDueNowInstallments[0].amount.toLocaleString('fa-IR'))} تومان`
                  : `قسط بعدی: ${unpaidMyInstallments[0].courseTitle || (isWorkshopMode ? 'کارگاه آموزشی' : 'دوره تخصصی')} · سررسید ${toPersianNumbers(unpaidMyInstallments[0].dueDateJalali || unpaidMyInstallments[0].dueDateIso.slice(0, 10))}`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAutoTriggeredGateway(false);
              setActiveGatewayInstallment(scopedDueNowInstallments[0] || unpaidMyInstallments[0]);
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-stone-950 text-xs font-black flex items-center gap-2 hover:opacity-95 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{scopedDueNowInstallments.length > 0 ? 'پرداخت قسط سررسید شده' : 'مدیریت و پرداخت اقساط من'}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Navigation Tabs & Filter Bar */}
      <CourseFilterBar
        mode={mode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        formatFilter={formatFilter}
        onFormatFilterChange={setFormatFilter}
        availableCount={availableCourses.length}
        myEnrolledCount={myEnrolledCourses.length}
        archivedCount={archivedCourses.length}
        deletedCount={deletedCourses.length}
        pendingReceiptsCount={pendingReceiptsCount}
        isOfficial={isOfficial}
      />

      {/* 3. Catalog & Course Cards Grid */}
      {isCatalogTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.length === 0 ? (
            <div className="col-span-full p-16 text-center text-xs text-slate-400 space-y-3 glass-card rounded-3xl border border-slate-200 dark:border-white/10">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
                هیچ {unitNoun}‌ای با شرایط انتخابی یافت نشد.
              </p>
              <p>می‌توانید فیلترها را تغییر داده یا از جستجوی {unitNoun} استفاده فرمایید.</p>
            </div>
          ) : (
            currentList.map(course => {
              const userEnrollment = scopedEnrollments.find(e => e.courseId === course.id && e.userId === currentUser?.id);
              return (
                <CourseCard
                  key={course.id}
                  mode={mode}
                  course={course}
                  userEnrollment={userEnrollment}
                  isOfficial={isOfficial}
                  onOpenDetail={setDetailCourse}
                  onOpenRegistration={handleOpenRegistration}
                  onOpenAttendance={setAttendanceCourse}
                  onOpenDedicatedAdmin={setDedicatedCourseAdmin}
                  onOpenRoster={setCourseForRoster}
                  onOpenBuilder={c => {
                    setEditingCourse(c);
                    setCourseBuilderOpen(true);
                  }}
                  onStartDelete={handleStartDelete}
                  onImageClick={setLightboxImage}
                  onOpenCourseOps={setOpsModalCourse}
                />
              );
            })
          )}
        </div>
      )}

      {/* 4. Soft-Deleted Courses Tab */}
      {isOfficial && activeTab === 'deleted_courses' && (
        <CourseDeletedTab
          mode={mode}
          deletedCourses={deletedCourses}
          courseEnrollments={scopedEnrollments}
          onSelectCourseRoster={setCourseForRoster}
          onRestoreCourse={handleRestore}
          onImageClick={setLightboxImage}
        />
      )}

      {/* 5. Admin Registration Moderation Tab */}
      {isOfficial && activeTab === 'admin_panel' && (
        <CourseAdminPanelTab
          mode={mode}
          courses={activeCourses}
          courseEnrollments={scopedEnrollments}
          onInspectReceipt={setInspectingEnrollment}
          onReviewEnrollment={reviewCourseEnrollment}
        />
      )}

      {/* 6. Admin Installments Management Tab */}
      {isOfficial && activeTab === 'installments_admin' && (
        <CourseInstallmentsAdminPanel
          courses={activeCourses}
          scope={mode}
          hideNationalId={hideNationalId}
        />
      )}

      {/* 7. Admin Discount Codes Management Tab */}
      {isOfficial && activeTab === 'discounts_admin' && (
        <CourseDiscountsAdminPanel
          courses={activeCourses}
          scope={mode}
          hideNationalId={hideNationalId}
        />
      )}

      {/* 8. Modular Dialogs */}
      <CourseDetailModal
        course={detailCourse}
        userEnrollment={detailCourse ? scopedEnrollments.find(e => e.courseId === detailCourse.id && e.userId === currentUser?.id) : undefined}
        isOfficial={isOfficial}
        onClose={() => setDetailCourse(null)}
        onOpenRegistration={c => {
          setDetailCourse(null);
          handleOpenRegistration(c);
        }}
        onOpenAttendance={c => {
          setDetailCourse(null);
          setAttendanceCourse(c);
        }}
        onOpenDedicatedAdmin={
          isOfficial
            ? c => {
                setDetailCourse(null);
                setDedicatedCourseAdmin(c);
              }
            : undefined
        }
        onImageClick={setLightboxImage}
      />

      <InstallmentAutoGatewayModal
        installment={activeGatewayInstallment}
        allMyInstallments={scopedMyInstallments}
        isAutoTriggered={isAutoTriggeredGateway}
        onClose={() => {
          setActiveGatewayInstallment(null);
          setIsAutoTriggeredGateway(false);
        }}
        onPaymentSuccess={async () => {
          await Promise.all([refreshMyInstallments(), refreshCourses()]);
        }}
      />

      <CourseRegistrationModal
        course={registrationCourse}
        currentUser={currentUser}
        existingEnrollment={existingEnrollment}
        onClose={() => setRegistrationCourse(null)}
        onSubmitRegistration={handleSubmitRegistration}
        onImageClick={setLightboxImage}
      />

      <CourseAttendanceModal
        course={attendanceCourse}
        onClose={() => setAttendanceCourse(null)}
        onImageClick={setLightboxImage}
      />

      <CourseAttendanceWaitlistCertModal
        course={opsModalCourse}
        currentUser={currentUser}
        enrollments={scopedEnrollments}
        isOfficial={isOfficial}
        hideNationalId={hideNationalId}
        mode={mode}
        onClose={() => setOpsModalCourse(null)}
      />

      <AnimatePresence>
        {dedicatedCourseAdmin && (
          <CourseAdminPanelModal
            course={scopedCourses.find(c => c.id === dedicatedCourseAdmin.id) || dedicatedCourseAdmin}
            mode={mode}
            hideNationalId={hideNationalId}
            onClose={() => setDedicatedCourseAdmin(null)}
            onOpenSmsModal={() => {
              setCourseForRoster(scopedCourses.find(c => c.id === dedicatedCourseAdmin.id) || dedicatedCourseAdmin);
            }}
            onInspectReceipt={setInspectingEnrollment}
            onOpenBuilder={c => {
              setDedicatedCourseAdmin(null);
              setEditingCourse(c);
              setCourseBuilderOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <CourseRosterModal
        course={courseForRoster ? (scopedCourses.find(c => c.id === courseForRoster.id) || courseForRoster) : null}
        enrollments={scopedEnrollments}
        hideNationalId={hideNationalId}
        onClose={() => setCourseForRoster(null)}
        onReviewEnrollment={reviewCourseEnrollment}
        onRemoveFromClass={removeCourseEnrollmentFromClass}
        onRestoreToClass={restoreCourseEnrollmentToClass}
        onSendCourseSms={sendCourseSms}
        onInspectReceipt={setInspectingEnrollment}
      />

      <CourseDeleteConfirmModal
        mode={mode}
        course={courseToDelete}
        deleteSmsNotice={deleteSmsNotice}
        onClose={() => setCourseToDelete(null)}
        onConfirmDelete={handleConfirmSoftDelete}
        onResendOtp={async () => {
          try {
            const res = await sendPinOtpSms();
            setDeleteSmsNotice(`کد پیامکی جدید مجدداً ارسال گردید (${res.otpCode}).`);
          } catch {
            setDeleteSmsNotice('کد مجدداً ارسال گردید. (پین پیش‌فرض: 123456)');
          }
        }}
      />

      <CourseBuilderModal
        mode={mode}
        isOpen={courseBuilderOpen}
        courseToEdit={editingCourse}
        onClose={() => {
          setCourseBuilderOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        onImagePreview={setLightboxImage}
      />

      <CourseReceiptInspectionModal
        enrollment={inspectingEnrollment}
        onClose={() => setInspectingEnrollment(null)}
        onConfirm={id => reviewCourseEnrollment(id, 'confirmed', 'فیش بانکی استعلام و تایید گردید.')}
        onImageClick={setLightboxImage}
      />

      <CourseLightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};

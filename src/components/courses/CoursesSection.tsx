import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Course, CourseEnrollment } from '../../types';
import { GraduationCap } from 'lucide-react';

// Subcomponents
import { CourseStatsHeader } from './subcomponents/CourseStatsHeader';
import { CourseFilterBar, CourseTab, CourseFormatFilter } from './subcomponents/CourseFilterBar';
import { CourseCard } from './subcomponents/CourseCard';
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

export const CoursesSection: React.FC = () => {
  const {
    currentUser,
    courses,
    courseEnrollments,
    enrollCourseWithDetails,
    addCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
    sendCourseSms,
    reviewCourseEnrollment,
    sendPinOtpSms,
  } = useApp();

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<CourseTab>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<CourseFormatFilter>('all');

  // Modals & Active Selections
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

  // Memoized Lists
  const activeCourses = useMemo(() => courses.filter(c => !c.isDeleted), [courses]);
  const deletedCourses = useMemo(() => courses.filter(c => c.isDeleted), [courses]);
  const availableCourses = useMemo(() => activeCourses.filter(c => c.status === 'enrolling' || c.status === 'ongoing'), [activeCourses]);
  const myEnrolledCourses = useMemo(() => {
    return activeCourses.filter(c => {
      const hasEnroll = courseEnrollments.some(e => e.courseId === c.id && e.userId === currentUser?.id);
      return c.isEnrolled || hasEnroll;
    });
  }, [activeCourses, courseEnrollments, currentUser]);
  const archivedCourses = useMemo(() => activeCourses.filter(c => c.status === 'completed'), [activeCourses]);

  const pendingReceiptsCount = useMemo(() => {
    return courseEnrollments.filter(e => e.paymentStatus === 'pending_review').length;
  }, [courseEnrollments]);

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
    return courseEnrollments.find(e => e.courseId === registrationCourse.id && e.userId === currentUser.id);
  }, [registrationCourse, currentUser, courseEnrollments]);

  // Handlers
  const handleOpenRegistration = (course: Course) => {
    setRegistrationCourse(course);
  };

  const handleSubmitRegistration = async (enrollmentData: {
    paymentMethod: 'online_gateway' | 'bank_receipt';
    trackingCode: string;
    receiptBankName: string;
    receiptDate: string;
    receiptFileUrl: string;
  }) => {
    if (!registrationCourse) throw new Error('No course selected');
    await enrollCourseWithDetails(registrationCourse.id, enrollmentData);
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
    if (editingCourse) {
      await updateCourse(editingCourse.id, courseData);
    } else {
      await addCourse(courseData);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header & Metrics Overview */}
      <CourseStatsHeader
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
      />

      {/* 2. Navigation Tabs & Filter Bar */}
      <CourseFilterBar
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
      {activeTab !== 'admin_panel' && activeTab !== 'deleted_courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.length === 0 ? (
            <div className="col-span-full p-16 text-center text-xs text-slate-400 space-y-3 glass-card rounded-3xl border border-slate-200 dark:border-white/10">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">هیچ دوره‌ای با شرایط انتخابی یافت نشد.</p>
              <p>می‌توانید فیلترها را تغییر داده یا از جستجوی دوره استفاده فرمایید.</p>
            </div>
          ) : (
            currentList.map(course => {
              const userEnrollment = courseEnrollments.find(e => e.courseId === course.id && e.userId === currentUser?.id);
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  userEnrollment={userEnrollment}
                  isOfficial={isOfficial}
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
          deletedCourses={deletedCourses}
          courseEnrollments={courseEnrollments}
          onSelectCourseRoster={setCourseForRoster}
          onRestoreCourse={handleRestore}
          onImageClick={setLightboxImage}
        />
      )}

      {/* 5. Admin Registration Moderation Tab */}
      {isOfficial && activeTab === 'admin_panel' && (
        <CourseAdminPanelTab
          courses={courses}
          courseEnrollments={courseEnrollments}
          onInspectReceipt={setInspectingEnrollment}
          onReviewEnrollment={reviewCourseEnrollment}
        />
      )}

      {/* 6. Modular Dialogs */}
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
        enrollments={courseEnrollments}
        isOfficial={isOfficial}
        onClose={() => setOpsModalCourse(null)}
      />

      <AnimatePresence>
        {dedicatedCourseAdmin && (
          <CourseAdminPanelModal
            course={dedicatedCourseAdmin}
            onClose={() => setDedicatedCourseAdmin(null)}
            onOpenSmsModal={() => {
              setCourseForRoster(dedicatedCourseAdmin);
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
        course={courseForRoster}
        enrollments={courseEnrollments}
        onClose={() => setCourseForRoster(null)}
        onReviewEnrollment={reviewCourseEnrollment}
        onSendCourseSms={sendCourseSms}
        onInspectReceipt={setInspectingEnrollment}
      />

      <CourseDeleteConfirmModal
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

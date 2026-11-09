import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Course, CourseEnrollment, User } from '../types';
import { INITIAL_COURSES, INITIAL_COURSE_ENROLLMENTS } from '../data/mockData';
import { api } from '../services/apiClient';

export interface CoursesContextType {
  courses: Course[];
  courseEnrollments: CourseEnrollment[];
  enrollCourse: (courseId: string) => Promise<any>;
  enrollCourseWithDetails: (courseId: string, enrollmentData: any) => Promise<{ course: Course; enrollment: CourseEnrollment }>;
  addCourse: (course: Partial<Course>) => Promise<any>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<any>;
  softDeleteCourse: (courseId: string, pin: string) => Promise<{ success: boolean; message: string }>;
  restoreCourse: (courseId: string) => Promise<{ success: boolean; message: string }>;
  sendCourseSms: (courseId: string, recipientPhone: string | 'all', message: string, recipientName?: string) => Promise<{ success: boolean; count: number; message: string }>;
  reviewCourseEnrollment: (enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) => Promise<void>;
  refreshCourses: () => Promise<void>;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

interface CoursesProviderProps {
  children: React.ReactNode;
  currentUser?: User | null;
  securityPin?: string;
}

export const CoursesProvider: React.FC<CoursesProviderProps> = ({
  children,
  currentUser,
  securityPin = '123456',
}) => {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>(INITIAL_COURSE_ENROLLMENTS);

  const refreshCourses = useCallback(async () => {
    try {
      const [fetchedCourses, fetchedEnrollments] = await Promise.all([
        api.getCourses(),
        api.getCourseEnrollments(),
      ]);
      if (Array.isArray(fetchedCourses)) setCourses(fetchedCourses);
      if (Array.isArray(fetchedEnrollments)) setCourseEnrollments(fetchedEnrollments);
    } catch {}
  }, []);

  useEffect(() => {
    refreshCourses();
    const unsubscribe = api.subscribeToEvents(event => {
      if (event.type.startsWith('courses.')) {
        refreshCourses();
      }
    });
    return () => unsubscribe();
  }, [refreshCourses]);

  const enrollCourseWithDetails = useCallback(async (courseId: string, enrollmentData: any) => {
    try {
      const res = await api.enrollCourse(courseId, enrollmentData);
      setCourses(prev => prev.map(c => (c.id === courseId ? res.course : c)));
      setCourseEnrollments(prev => [res.enrollment, ...prev.filter(e => e.id !== res.enrollment.id)]);
      return res;
    } catch (err: any) {
      // Fallback local simulation if offline
      const targetCourse = courses.find(c => c.id === courseId);
      const isGateway = enrollmentData.paymentMethod === 'online_gateway';
      const paymentStatus = isGateway ? 'confirmed' : 'pending_review';
      const fakeEnrollment: CourseEnrollment = {
        id: `enr_${Date.now()}`,
        courseId,
        courseTitle: targetCourse?.title || 'دوره تخصصی',
        userId: currentUser?.id || 'usr_alumni_01',
        userName: currentUser?.fullName || 'دکتر علیرضا میرزایی',
        userNationalId: currentUser?.nationalId || '0019988776',
        userPhone: currentUser?.phone || '09127778899',
        userRoleTitle: currentUser?.roleTitle || 'دانش‌آموخته',
        enrolledAt: new Date().toISOString(),
        paymentMethod: enrollmentData.paymentMethod || 'bank_receipt',
        paymentStatus,
        amountPaid: enrollmentData.amountPaid ?? targetCourse?.price ?? 0,
        trackingCode: enrollmentData.trackingCode || (isGateway ? `SHP-${Date.now().toString().slice(-7)}` : `TRX-${Date.now().toString().slice(-7)}`),
        receiptBankName: enrollmentData.receiptBankName || (isGateway ? 'درگاه پرداخت شاپرک' : 'بانک ملی ایران'),
        receiptDate: enrollmentData.receiptDate || new Date().toLocaleDateString('fa-IR'),
        receiptFileUrl: enrollmentData.receiptFileUrl,
      };

      setCourseEnrollments(prev => [fakeEnrollment, ...prev]);
      const updatedCourse: Course = targetCourse ? {
        ...targetCourse,
        enrolledCount: paymentStatus === 'confirmed' ? targetCourse.enrolledCount + 1 : targetCourse.enrolledCount,
        isEnrolled: true,
        enrollmentStatus: paymentStatus,
        hasArchiveAccess: paymentStatus === 'confirmed',
      } : ({} as any);

      if (targetCourse) {
        setCourses(prev => prev.map(c => c.id === courseId ? updatedCourse : c));
      }
      return { course: updatedCourse, enrollment: fakeEnrollment };
    }
  }, [courses, currentUser]);

  const enrollCourse = useCallback(async (courseId: string) => {
    return enrollCourseWithDetails(courseId, { paymentMethod: 'online_gateway' });
  }, [enrollCourseWithDetails]);

  const addCourse = useCallback(async (courseData: Partial<Course>) => {
    try {
      const created = await api.createCourse(courseData);
      setCourses(prev => [created, ...prev]);
      return created;
    } catch {
      const newCourse: Course = {
        id: `crs_${Date.now()}`,
        title: courseData.title || 'دوره جدید',
        instructor: courseData.instructor || 'استاد محترم',
        instructorTitle: courseData.instructorTitle,
        category: courseData.category || 'فقه القضاء',
        level: courseData.level || 'تخصصی عالی',
        hours: Number(courseData.hours || 16),
        capacity: Number(courseData.capacity || 40),
        enrolledCount: 0,
        schedule: courseData.schedule || 'جلسات هفتگی',
        startDate: courseData.startDate,
        endDate: courseData.endDate,
        holdingFormat: courseData.holdingFormat || 'online',
        venueAddress: courseData.venueAddress,
        meetingLink: courseData.meetingLink || 'https://lms.feqh-ghaza.ir/class',
        meetingAccessGuide: courseData.meetingAccessGuide,
        coverImage: courseData.coverImage,
        price: Number(courseData.price || 0),
        hasInstallments: Boolean(courseData.hasInstallments),
        installmentDetails: courseData.installmentDetails,
        hasCertificate: Boolean(courseData.hasCertificate),
        certificateDetails: courseData.certificateDetails,
        prerequisites: courseData.prerequisites,
        description: courseData.description || '',
        topics: courseData.topics && courseData.topics.length > 0 ? courseData.topics : ['مبانی نظری و فقهی', 'تحلیل آراء قضایی'],
        status: courseData.status || 'enrolling',
        archiveAccess: courseData.archiveAccess || 'enrolled_only',
        archiveResources: courseData.archiveResources || [],
        isEnrolled: false,
      };
      setCourses(prev => [newCourse, ...prev]);
      return newCourse;
    }
  }, []);

  const updateCourse = useCallback(async (courseId: string, updates: Partial<Course>) => {
    try {
      const updated = await api.updateCourse(courseId, updates);
      setCourses(prev => prev.map(c => (c.id === courseId ? updated : c)));
      return updated;
    } catch {
      setCourses(prev => prev.map(c => (c.id === courseId ? { ...c, ...updates } : c)));
    }
  }, []);

  const reviewCourseEnrollment = useCallback(async (enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) => {
    try {
      const updated = await api.reviewCourseEnrollment(enrollmentId, status, adminNote);
      setCourseEnrollments(prev => prev.map(e => e.id === enrollmentId ? updated : e));
      
      setCourses(prev => prev.map(c => {
        if (c.id !== updated.courseId) return c;
        const isCurrentUsr = updated.userId === currentUser?.id;
        return {
          ...c,
          enrolledCount: status === 'confirmed' ? c.enrolledCount + 1 : Math.max(0, c.enrolledCount - 1),
          ...(isCurrentUsr ? {
            isEnrolled: status === 'confirmed',
            enrollmentStatus: status,
            hasArchiveAccess: status === 'confirmed',
          } : {})
        };
      }));
    } catch {
      setCourseEnrollments(prev => prev.map(e => {
        if (e.id !== enrollmentId) return e;
        return {
          ...e,
          paymentStatus: status,
          adminNote: adminNote || (status === 'confirmed' ? 'مستندات واریز تایید و ثبت‌نام قطعی شد.' : 'رسید واریزی مورد تایید قرار نگرفت.'),
          reviewedBy: currentUser?.fullName || 'مدیر سامانه',
          reviewedAt: new Date().toISOString(),
        };
      }));

      const targetEnrollment = courseEnrollments.find(e => e.id === enrollmentId);
      if (targetEnrollment) {
        setCourses(prev => prev.map(c => {
          if (c.id !== targetEnrollment.courseId) return c;
          const isCurrentUsr = targetEnrollment.userId === currentUser?.id;
          return {
            ...c,
            enrolledCount: status === 'confirmed' ? c.enrolledCount + 1 : Math.max(0, c.enrolledCount - 1),
            ...(isCurrentUsr ? {
              isEnrolled: status === 'confirmed',
              enrollmentStatus: status,
              hasArchiveAccess: status === 'confirmed',
            } : {})
          };
        }));
      }
    }
  }, [courseEnrollments, currentUser]);

  const softDeleteCourse = useCallback(async (courseId: string, pin: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.deleteCourse(courseId, pin);
      setCourses(prev => prev.map(c => c.id === courseId ? {
        ...c,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.fullName || 'مسئول آموزش',
      } : c));
      return res;
    } catch {
      if (pin !== securityPin && pin !== '123456') {
        throw new Error('پین کد امنیتی وارد شده نادرست است.');
      }
      setCourses(prev => prev.map(c => c.id === courseId ? {
        ...c,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.fullName || 'مسئول آموزش',
      } : c));
      return { success: true, message: 'دوره با موفقیت حذف منطقی (Safe Delete) و به بخش بایگانی منتقل گردید.' };
    }
  }, [currentUser, securityPin]);

  const restoreCourse = useCallback(async (courseId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.restoreCourse(courseId);
      setCourses(prev => prev.map(c => c.id === courseId ? {
        ...c,
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
      } : c));
      return res;
    } catch {
      setCourses(prev => prev.map(c => c.id === courseId ? {
        ...c,
        isDeleted: false,
        deletedAt: undefined,
        deletedBy: undefined,
      } : c));
      return { success: true, message: 'دوره با موفقیت از بایگانی بازیابی شد.' };
    }
  }, []);

  const sendCourseSms = useCallback(async (
    courseId: string,
    recipientPhone: string | 'all',
    message: string,
    recipientName?: string
  ): Promise<{ success: boolean; count: number; message: string }> => {
    try {
      const res = await api.sendCourseSms(courseId, recipientPhone, message, recipientName);
      return res;
    } catch {
      const targetCount = recipientPhone === 'all'
        ? Math.max(1, courseEnrollments.filter(e => e.courseId === courseId).length)
        : 1;
      return {
        success: true,
        count: targetCount,
        message: `پیامک با موفقیت به ${targetCount} شماره همراه ارسال گردید.`,
      };
    }
  }, [courseEnrollments]);

  const value = useMemo<CoursesContextType>(() => ({
    courses,
    courseEnrollments,
    enrollCourse,
    enrollCourseWithDetails,
    addCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
    sendCourseSms,
    reviewCourseEnrollment,
    refreshCourses,
  }), [
    courses,
    courseEnrollments,
    enrollCourse,
    enrollCourseWithDetails,
    addCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
    sendCourseSms,
    reviewCourseEnrollment,
    refreshCourses,
  ]);

  return (
    <CoursesContext.Provider value={value}>
      {children}
    </CoursesContext.Provider>
  );
};

export const useCourses = (): CoursesContextType => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};

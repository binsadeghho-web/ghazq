import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Course, CourseEnrollment, CourseInstallmentRecord, User } from '../types';
import { api } from '../services/apiClient';

export interface CoursesContextType {
  courses: Course[];
  courseEnrollments: CourseEnrollment[];
  myInstallments: CourseInstallmentRecord[];
  dueNowInstallments: CourseInstallmentRecord[];
  enrollCourse: (courseId: string) => Promise<any>;
  enrollCourseWithDetails: (courseId: string, enrollmentData: any) => Promise<{ course: Course; enrollment: CourseEnrollment }>;
  addCourse: (course: Partial<Course>) => Promise<any>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<any>;
  softDeleteCourse: (courseId: string, pin: string) => Promise<{ success: boolean; message: string }>;
  restoreCourse: (courseId: string) => Promise<{ success: boolean; message: string }>;
  sendCourseSms: (courseId: string, recipientPhone: string | 'all', message: string, recipientName?: string) => Promise<{ success: boolean; count: number; message: string }>;
  reviewCourseEnrollment: (enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) => Promise<void>;
  refreshCourses: () => Promise<void>;
  refreshMyInstallments: () => Promise<void>;
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
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [myInstallments, setMyInstallments] = useState<CourseInstallmentRecord[]>([]);
  const [dueNowInstallments, setDueNowInstallments] = useState<CourseInstallmentRecord[]>([]);

  const refreshMyInstallments = useCallback(async () => {
    if (!currentUser) {
      setMyInstallments([]);
      setDueNowInstallments([]);
      return;
    }
    try {
      const res = await api.getMyCourseInstallments();
      if (res && Array.isArray(res.items)) {
        setMyInstallments(res.items);
        setDueNowInstallments(Array.isArray(res.dueNow) ? res.dueNow : []);
      }
    } catch {
      // Fail quietly only on background poll if unauthenticated
    }
  }, [currentUser]);

  const refreshCourses = useCallback(async () => {
    try {
      const [fetchedCourses, fetchedEnrollments] = await Promise.all([
        api.getCourses(),
        api.getCourseEnrollments(),
      ]);
      if (Array.isArray(fetchedCourses)) setCourses(fetchedCourses);
      if (Array.isArray(fetchedEnrollments)) setCourseEnrollments(fetchedEnrollments);
      await refreshMyInstallments();
    } catch {
      // Keep current state cleanly if unauthenticated before login
    }
  }, [refreshMyInstallments]);

  useEffect(() => {
    refreshCourses();
    const unsubscribe = api.subscribeToEvents(event => {
      if (event.type.startsWith('courses.')) {
        const delta = event.data?.data || event.data;
        const resourceId = delta?.resourceId || delta?.courseId;
        const updates = delta?.updates;
        const version = delta?.version;

        if (event.type === 'courses.installment_updated') {
          const updatedInst = delta?.installment as CourseInstallmentRecord | undefined;
          if (updatedInst) {
            setMyInstallments(prev => prev.map(i => (i.id === updatedInst.id ? updatedInst : i)));
            setDueNowInstallments(prev => {
              const filtered = prev.filter(i => i.id !== updatedInst.id);
              return updatedInst.isDueNow ? [...filtered, updatedInst] : filtered;
            });
          } else {
            refreshMyInstallments();
          }
          return;
        }

        if (event.type === 'courses.updated' && resourceId && updates && typeof updates === 'object') {
          setCourses(prev => {
            const exists = prev.some(c => c.id === resourceId);
            if (exists) {
              return prev.map(c =>
                c.id === resourceId ? { ...c, ...updates, version: version || ((c as any).version || 1) + 1 } : c
              );
            }
            return [updates as Course, ...prev];
          });
        } else if (event.type === 'courses.created' && updates && typeof updates === 'object') {
          setCourses(prev => [updates as Course, ...prev.filter(c => c.id !== (updates as Course).id)]);
        } else {
          refreshCourses();
        }
      }
    });
    return () => unsubscribe();
  }, [refreshCourses, refreshMyInstallments]);

  const enrollCourseWithDetails = useCallback(async (courseId: string, enrollmentData: any) => {
    const res = await api.enrollCourse(courseId, enrollmentData);
    setCourses(prev => prev.map(c => (c.id === courseId ? res.course : c)));
    setCourseEnrollments(prev => [res.enrollment, ...prev.filter(e => e.id !== res.enrollment.id)]);
    await refreshMyInstallments();
    return res;
  }, [refreshMyInstallments]);

  const enrollCourse = useCallback(async (courseId: string) => {
    return enrollCourseWithDetails(courseId, { paymentMethod: 'online_gateway' });
  }, [enrollCourseWithDetails]);

  const addCourse = useCallback(async (courseData: Partial<Course>) => {
    const created = await api.createCourse(courseData);
    setCourses(prev => [created, ...prev.filter(c => c.id !== created.id)]);
    return created;
  }, []);

  const updateCourse = useCallback(async (courseId: string, updates: Partial<Course>) => {
    const existing = courses.find(c => c.id === courseId);
    const expectedVersion = (existing as any)?.version || 1;
    const updated = await api.updateCourse(courseId, { ...updates, expectedVersion });
    setCourses(prev => prev.map(c => (c.id === courseId ? updated : c)));
    return updated;
  }, [courses]);

  const reviewCourseEnrollment = useCallback(async (enrollmentId: string, status: 'confirmed' | 'rejected', adminNote?: string) => {
    const existing = courseEnrollments.find(e => e.id === enrollmentId);
    const expectedVersion = (existing as any)?.version || 1;
    const updated = await api.reviewCourseEnrollment(enrollmentId, status, adminNote, expectedVersion);
    setCourseEnrollments(prev => prev.map(e => (e.id === enrollmentId ? updated : e)));

    setCourses(prev =>
      prev.map(c => {
        if (c.id !== updated.courseId) return c;
        const isCurrentUsr = updated.userId === currentUser?.id;
        return {
          ...c,
          enrolledCount: status === 'confirmed' ? c.enrolledCount + 1 : Math.max(0, c.enrolledCount - 1),
          ...(isCurrentUsr
            ? {
                isEnrolled: status === 'confirmed',
                enrollmentStatus: status,
                hasArchiveAccess: status === 'confirmed',
              }
            : {}),
        };
      })
    );
    await refreshMyInstallments();
  }, [courseEnrollments, currentUser, refreshMyInstallments]);

  const softDeleteCourse = useCallback(async (courseId: string, pin: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.deleteCourse(courseId, pin);
    setCourses(prev =>
      prev.map(c =>
        c.id === courseId
          ? {
              ...c,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              deletedBy: currentUser?.fullName || 'مسئول آموزش',
            }
          : c
      )
    );
    return res;
  }, [currentUser]);

  const restoreCourse = useCallback(async (courseId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.restoreCourse(courseId);
    setCourses(prev =>
      prev.map(c =>
        c.id === courseId
          ? {
              ...c,
              isDeleted: false,
              deletedAt: undefined,
              deletedBy: undefined,
            }
          : c
      )
    );
    return res;
  }, []);

  const sendCourseSms = useCallback(async (
    courseId: string,
    recipientPhone: string | 'all',
    message: string,
    recipientName?: string
  ): Promise<{ success: boolean; count: number; message: string }> => {
    return api.sendCourseSms(courseId, recipientPhone, message, recipientName);
  }, []);

  const value = useMemo<CoursesContextType>(() => ({
    courses,
    courseEnrollments,
    myInstallments,
    dueNowInstallments,
    enrollCourse,
    enrollCourseWithDetails,
    addCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
    sendCourseSms,
    reviewCourseEnrollment,
    refreshCourses,
    refreshMyInstallments,
  }), [
    courses,
    courseEnrollments,
    myInstallments,
    dueNowInstallments,
    enrollCourse,
    enrollCourseWithDetails,
    addCourse,
    updateCourse,
    softDeleteCourse,
    restoreCourse,
    sendCourseSms,
    reviewCourseEnrollment,
    refreshCourses,
    refreshMyInstallments,
  ]);

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>;
};

export const useCourses = (): CoursesContextType => {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
};

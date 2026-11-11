import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Consultant, CounselingRequest } from '../types';
import { INITIAL_CONSULTANTS, INITIAL_COUNSELING_REQUESTS } from '../data/mockData';
import { api } from '../services/apiClient';

function notifyToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  }
}

export interface CounselingContextType {
  consultants: Consultant[];
  counselingRequests: CounselingRequest[];
  feedbackMessage: { text: string; type: 'success' | 'error' } | null;
  clearFeedbackMessage: () => void;
  bookCounseling: (data: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateCounselingStatus: (
    requestId: string,
    status: CounselingRequest['status'],
    scheduledDate?: string,
    counselorNotes?: string,
    scheduledTime?: string,
    venueDetails?: string,
    meetingMode?: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    preferredConsultantId?: string,
    preferredConsultantName?: string
  ) => Promise<void>;
  updateConsultant: (consultantId: string, updates: Partial<Consultant>) => Promise<void>;
  addConsultant: (consultantData: Omit<Consultant, 'id'>) => Promise<void>;
  deleteConsultant: (consultantId: string) => Promise<void>;
  refreshCounseling: () => Promise<void>;
}

const CounselingContext = createContext<CounselingContextType | undefined>(undefined);

export const CounselingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consultants, setConsultants] = useState<Consultant[]>(INITIAL_CONSULTANTS);
  const [counselingRequests, setCounselingRequests] = useState<CounselingRequest[]>(INITIAL_COUNSELING_REQUESTS);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const clearFeedbackMessage = useCallback(() => setFeedbackMessage(null), []);

  const showFeedback = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    notifyToast(text, type);
  }, []);

  const refreshCounseling = useCallback(async () => {
    try {
      const [fetchedConsultants, fetchedRequests] = await Promise.all([
        api.getConsultants(),
        api.getCounselingRequests(),
      ]);
      if (Array.isArray(fetchedConsultants)) setConsultants(fetchedConsultants);
      if (Array.isArray(fetchedRequests)) setCounselingRequests(fetchedRequests);
    } catch {}
  }, []);

  useEffect(() => {
    refreshCounseling();
    const unsubscribe = api.subscribeToEvents(event => {
      if (!event.type.startsWith('counseling.')) return;
      const payload = event.data ?? (event as any).payload;
      if (!payload) {
        refreshCounseling();
        return;
      }

      // Direct State Patching via Delta-Payload (Zero Re-fetch)
      if (event.type === 'counseling.requested' && payload.request) {
        const incoming = payload.request as CounselingRequest;
        setCounselingRequests(prev => {
          const exists = prev.some(r => r.id === incoming.id);
          return exists ? prev.map(r => (r.id === incoming.id ? incoming : r)) : [incoming, ...prev];
        });
      } else if (event.type === 'counseling.updated' && payload.request) {
        const updated = payload.request as CounselingRequest;
        setCounselingRequests(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      } else if (event.type === 'counseling.consultant_created' && payload.consultant) {
        const incoming = payload.consultant as Consultant;
        setConsultants(prev => {
          const exists = prev.some(c => c.id === incoming.id);
          return exists ? prev.map(c => (c.id === incoming.id ? incoming : c)) : [incoming, ...prev];
        });
      } else if (event.type === 'counseling.consultant_updated' && payload.consultant) {
        const updated = payload.consultant as Consultant;
        setConsultants(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      } else if (event.type === 'counseling.consultant_deleted' && payload.consultantId) {
        setConsultants(prev => prev.filter(c => c.id !== payload.consultantId));
      } else {
        refreshCounseling();
      }
    });
    return () => unsubscribe();
  }, [refreshCounseling]);

  const bookCounseling = useCallback(async (data: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const created = await api.bookCounseling(data);
      setCounselingRequests(prev => {
        const exists = prev.some(r => r.id === created.id);
        return exists ? prev.map(r => (r.id === created.id ? created : r)) : [created, ...prev];
      });
      showFeedback('درخواست مشاوره با حفظ محرمانگی کامل در سامانه ثبت شد و جهت هماهنگی بررسی خواهد شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت درخواست مشاوره: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const updateCounselingStatus = useCallback(async (
    requestId: string,
    status: CounselingRequest['status'],
    scheduledDate?: string,
    counselorNotes?: string,
    scheduledTime?: string,
    venueDetails?: string,
    meetingMode?: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی',
    preferredConsultantId?: string,
    preferredConsultantName?: string
  ) => {
    try {
      const existing = counselingRequests.find(r => r.id === requestId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const updated = await api.updateCounselingStatus(requestId, {
        status,
        scheduledDate,
        counselorNotes,
        scheduledTime,
        venueDetails,
        meetingMode,
        preferredConsultantId,
        preferredConsultantName,
        expectedVersion,
      });
      setCounselingRequests(prev => prev.map(r => (r.id === requestId ? updated : r)));
      showFeedback('وضعیت درخواست مشاوره در پایگاه داده به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      if (err.status === 409) {
        await refreshCounseling();
      }
      showFeedback(`خطا در به‌روزرسانی وضعیت مشاوره: ${err.message}`, 'error');
    }
  }, [counselingRequests, refreshCounseling, showFeedback]);

  const updateConsultant = useCallback(async (consultantId: string, updates: Partial<Consultant>) => {
    try {
      const existing = consultants.find(c => c.id === consultantId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const updated = await api.updateConsultant(consultantId, {
        ...updates,
        expectedVersion,
      });
      setConsultants(prev => prev.map(c => (c.id === consultantId ? updated : c)));
      showFeedback('اطلاعات مشاور با موفقیت در پایگاه داده ذخیره شد.', 'success');
    } catch (err: any) {
      if (err.status === 409) {
        await refreshCounseling();
      }
      showFeedback(`خطا در ویرایش اطلاعات مشاور: ${err.message}`, 'error');
    }
  }, [consultants, refreshCounseling, showFeedback]);

  const addConsultant = useCallback(async (consultantData: Omit<Consultant, 'id'>) => {
    try {
      const created = await api.createConsultant(consultantData);
      setConsultants(prev => {
        const exists = prev.some(c => c.id === created.id);
        return exists ? prev.map(c => (c.id === created.id ? created : c)) : [created, ...prev];
      });
      showFeedback('مشاور جدید با موفقیت در پایگاه داده ثبت شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت مشاور جدید: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const deleteConsultant = useCallback(async (consultantId: string) => {
    try {
      await api.deleteConsultant(consultantId);
      setConsultants(prev => prev.filter(c => c.id !== consultantId));
      showFeedback('مشاور از پایگاه داده حذف گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف مشاور: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const value = useMemo<CounselingContextType>(() => ({
    consultants,
    counselingRequests,
    feedbackMessage,
    clearFeedbackMessage,
    bookCounseling,
    updateCounselingStatus,
    updateConsultant,
    addConsultant,
    deleteConsultant,
    refreshCounseling,
  }), [
    consultants,
    counselingRequests,
    feedbackMessage,
    clearFeedbackMessage,
    bookCounseling,
    updateCounselingStatus,
    updateConsultant,
    addConsultant,
    deleteConsultant,
    refreshCounseling,
  ]);

  return (
    <CounselingContext.Provider value={value}>
      {children}
    </CounselingContext.Provider>
  );
};

export const useCounseling = (): CounselingContextType => {
  const context = useContext(CounselingContext);
  if (!context) {
    throw new Error('useCounseling must be used within a CounselingProvider');
  }
  return context;
};

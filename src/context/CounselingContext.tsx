import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Consultant, CounselingRequest } from '../types';
import { INITIAL_CONSULTANTS, INITIAL_COUNSELING_REQUESTS } from '../data/mockData';
import { api } from '../services/apiClient';

export interface CounselingContextType {
  consultants: Consultant[];
  counselingRequests: CounselingRequest[];
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
  ) => void;
  updateConsultant: (consultantId: string, updates: Partial<Consultant>) => void;
  addConsultant: (consultantData: Omit<Consultant, 'id'>) => void;
  deleteConsultant: (consultantId: string) => void;
  refreshCounseling: () => Promise<void>;
}

const CounselingContext = createContext<CounselingContextType | undefined>(undefined);

export const CounselingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consultants, setConsultants] = useState<Consultant[]>(INITIAL_CONSULTANTS);
  const [counselingRequests, setCounselingRequests] = useState<CounselingRequest[]>(INITIAL_COUNSELING_REQUESTS);

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
      if (event.type.startsWith('counseling.')) {
        refreshCounseling();
      }
    });
    return () => unsubscribe();
  }, [refreshCounseling]);

  const bookCounseling = useCallback(async (data: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const created = await api.bookCounseling(data);
      setCounselingRequests(prev => [created, ...prev]);
      alert('درخواست مشاوره با حفظ محرمانگی کامل در سامانه ثبت شد و جهت هماهنگی بررسی خواهد شد.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  }, []);

  const updateCounselingStatus = useCallback((
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
    setCounselingRequests(prev =>
      prev.map(r => (r.id === requestId ? {
        ...r,
        status,
        ...(scheduledDate ? { scheduledDate } : {}),
        ...(scheduledTime ? { scheduledTime } : {}),
        ...(counselorNotes !== undefined ? { counselorNotes } : {}),
        ...(venueDetails ? { venueDetails } : {}),
        ...(meetingMode ? { meetingMode } : {}),
        ...(preferredConsultantId ? { preferredConsultantId } : {}),
        ...(preferredConsultantName ? { preferredConsultantName } : {})
      } : r))
    );
  }, []);

  const updateConsultant = useCallback((consultantId: string, updates: Partial<Consultant>) => {
    setConsultants(prev => prev.map(c => (c.id === consultantId ? { ...c, ...updates } : c)));
  }, []);

  const addConsultant = useCallback((consultantData: Omit<Consultant, 'id'>) => {
    const newConsultant: Consultant = {
      ...consultantData,
      id: `cns_${Date.now()}`,
    };
    setConsultants(prev => [newConsultant, ...prev]);
  }, []);

  const deleteConsultant = useCallback((consultantId: string) => {
    setConsultants(prev => prev.filter(c => c.id !== consultantId));
  }, []);

  const value = useMemo<CounselingContextType>(() => ({
    consultants,
    counselingRequests,
    bookCounseling,
    updateCounselingStatus,
    updateConsultant,
    addConsultant,
    deleteConsultant,
    refreshCounseling,
  }), [
    consultants,
    counselingRequests,
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

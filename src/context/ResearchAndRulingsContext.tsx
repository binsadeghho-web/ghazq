import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ResearchMentorship, JudicialRuling, SynergyPost, User } from '../types';
import { INITIAL_RESEARCH_MENTORSHIPS, INITIAL_RULINGS, INITIAL_SYNERGY_POSTS } from '../data/mockData';
import { api } from '../services/apiClient';

function notifyToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  }
}

export interface ResearchAndRulingsContextType {
  researchMentorships: ResearchMentorship[];
  submitResearchProject: (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => Promise<void>;
  updateResearchProgress: (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => Promise<void>;
  updateResearchProject: (projectId: string, updates: Partial<ResearchMentorship>) => Promise<void>;
  deleteResearchProject: (projectId: string) => Promise<void>;

  rulings: JudicialRuling[];
  submitRuling: (data: Omit<JudicialRuling, 'id' | 'status' | 'likesCount' | 'likedBy' | 'discussions'>) => Promise<void>;
  approveRuling: (rulingId: string) => Promise<void>;
  addRulingDiscussion: (rulingId: string, comment: string) => Promise<void>;
  toggleRulingLike: (rulingId: string) => Promise<void>;

  synergyPosts: SynergyPost[];
  createSynergyPost: (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => Promise<void>;
  respondToSynergyPost: (postId: string, message: string, isPrivate: boolean, contactShared?: string) => Promise<void>;
  resolveSynergyPost: (postId: string) => Promise<void>;

  feedbackMessage: { text: string; type: 'success' | 'error' } | null;
  clearFeedbackMessage: () => void;
  refreshResearchAndRulings: () => Promise<void>;
}

const ResearchAndRulingsContext = createContext<ResearchAndRulingsContextType | undefined>(undefined);

interface ResearchAndRulingsProviderProps {
  children: React.ReactNode;
  currentUser?: User | null;
}

export const ResearchAndRulingsProvider: React.FC<ResearchAndRulingsProviderProps> = ({
  children,
  currentUser,
}) => {
  const [researchMentorships, setResearchMentorships] = useState<ResearchMentorship[]>(INITIAL_RESEARCH_MENTORSHIPS);
  const [rulings, setRulings] = useState<JudicialRuling[]>(INITIAL_RULINGS);
  const [synergyPosts, setSynergyPosts] = useState<SynergyPost[]>(INITIAL_SYNERGY_POSTS);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const clearFeedbackMessage = useCallback(() => setFeedbackMessage(null), []);

  const showFeedback = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    notifyToast(text, type);
  }, []);

  const refreshResearchAndRulings = useCallback(async () => {
    try {
      const [fetchedResearch, fetchedRulings, fetchedSynergy] = await Promise.all([
        api.getResearchProjects(),
        api.getRulings(),
        api.getSynergyPosts(),
      ]);
      if (Array.isArray(fetchedResearch)) setResearchMentorships(fetchedResearch);
      if (Array.isArray(fetchedRulings)) setRulings(fetchedRulings);
      if (Array.isArray(fetchedSynergy)) setSynergyPosts(fetchedSynergy);
    } catch {}
  }, []);

  useEffect(() => {
    refreshResearchAndRulings();
    const unsubscribe = api.subscribeToEvents(event => {
      const payload = event.data ?? (event as any).payload;

      // Direct State Patching via Delta-Payload (Zero Re-fetch)
      if (event.type.startsWith('research.')) {
        if (event.type === 'research.created' && payload?.mentorship) {
          const incoming = payload.mentorship as ResearchMentorship;
          setResearchMentorships(prev => {
            const exists = prev.some(p => p.id === incoming.id);
            return exists ? prev.map(p => (p.id === incoming.id ? incoming : p)) : [incoming, ...prev];
          });
        } else if ((event.type === 'research.updated' || event.type === 'research.progress_updated') && payload?.mentorship) {
          const updated = payload.mentorship as ResearchMentorship;
          setResearchMentorships(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        } else if (event.type === 'research.deleted' && payload?.mentorshipId) {
          setResearchMentorships(prev => prev.filter(p => p.id !== payload.mentorshipId));
        } else {
          api.getResearchProjects().then(setResearchMentorships).catch(() => {});
        }
      } else if (event.type.startsWith('rulings.')) {
        if (event.type === 'rulings.created' && payload?.ruling) {
          const incoming = payload.ruling as JudicialRuling;
          setRulings(prev => {
            const exists = prev.some(r => r.id === incoming.id);
            return exists ? prev.map(r => (r.id === incoming.id ? incoming : r)) : [incoming, ...prev];
          });
        } else if ((event.type === 'rulings.approved' || event.type === 'rulings.critique_added' || event.type === 'rulings.liked') && payload?.ruling) {
          const updated = payload.ruling as JudicialRuling;
          setRulings(prev => prev.map(r => (r.id === updated.id ? updated : r)));
        } else {
          api.getRulings().then(setRulings).catch(() => {});
        }
      } else if (event.type.startsWith('synergy.')) {
        if (event.type === 'synergy.created' && payload?.post) {
          const incoming = payload.post as SynergyPost;
          setSynergyPosts(prev => {
            const exists = prev.some(p => p.id === incoming.id);
            return exists ? prev.map(p => (p.id === incoming.id ? incoming : p)) : [incoming, ...prev];
          });
        } else if ((event.type === 'synergy.updated' || event.type === 'synergy.responded') && payload?.post) {
          const updated = payload.post as SynergyPost;
          setSynergyPosts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        } else {
          api.getSynergyPosts().then(setSynergyPosts).catch(() => {});
        }
      }
    });
    return () => unsubscribe();
  }, [refreshResearchAndRulings]);

  // Research methods
  const submitResearchProject = useCallback(async (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => {
    try {
      const created = await api.submitResearchProject(data);
      setResearchMentorships(prev => {
        const exists = prev.some(p => p.id === created.id);
        return exists ? prev.map(p => (p.id === created.id ? created : p)) : [created, ...prev];
      });
      showFeedback('طرح پژوهشی با موفقیت در دبیرخانه رساله‌ها ثبت شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت طرح پژوهشی: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const updateResearchProgress = useCallback(async (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => {
    try {
      const existing = researchMentorships.find(p => p.id === projectId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const res = await api.updateResearchProgress(projectId, {
        stage,
        stageTitle,
        progressPercent,
        expectedVersion,
      });
      const updated = res?.mentorship || res;
      setResearchMentorships(prev => prev.map(p => (p.id === projectId ? updated : p)));
      showFeedback('پیشرفت طرح پژوهشی در پایگاه داده ذخیره گردید.', 'success');
    } catch (err: any) {
      if (err.status === 409) {
        await refreshResearchAndRulings();
      }
      showFeedback(`خطا در به‌روزرسانی پیشرفت پژوهش: ${err.message}`, 'error');
    }
  }, [researchMentorships, refreshResearchAndRulings, showFeedback]);

  const updateResearchProject = useCallback(async (projectId: string, updates: Partial<ResearchMentorship>) => {
    try {
      const existing = researchMentorships.find(p => p.id === projectId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const res = await api.updateResearchProject(projectId, {
        ...updates,
        expectedVersion,
      });
      const updated = res?.mentorship || res;
      setResearchMentorships(prev => prev.map(p => (p.id === projectId ? updated : p)));
      showFeedback('اطلاعات طرح پژوهشی در پایگاه داده به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      if (err.status === 409) {
        await refreshResearchAndRulings();
      }
      showFeedback(`خطا در ویرایش طرح پژوهشی: ${err.message}`, 'error');
    }
  }, [researchMentorships, refreshResearchAndRulings, showFeedback]);

  const deleteResearchProject = useCallback(async (projectId: string) => {
    try {
      await api.deleteResearchProject(projectId);
      setResearchMentorships(prev => prev.filter(p => p.id !== projectId));
      showFeedback('طرح پژوهشی از پایگاه داده حذف گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف طرح پژوهشی: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  // Judicial Rulings methods
  const submitRuling = useCallback(async (data: Omit<JudicialRuling, 'id' | 'status' | 'likesCount' | 'likedBy' | 'discussions'>) => {
    try {
      const created = await api.submitRuling(data);
      const rulingItem = created?.ruling || created;
      setRulings(prev => {
        const exists = prev.some(r => r.id === rulingItem.id);
        return exists ? prev.map(r => (r.id === rulingItem.id ? rulingItem : r)) : [rulingItem, ...prev];
      });
      showFeedback('دادنامه جدید با موفقیت در تالار آراء ثبت شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت دادنامه: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const approveRuling = useCallback(async (rulingId: string) => {
    try {
      const existing = rulings.find(r => r.id === rulingId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const res = await api.approveRuling(rulingId, expectedVersion);
      const updated = res?.ruling || res;
      setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      showFeedback('دادنامه به عنوان رأی برگزیده تالار تایید گردید.', 'success');
    } catch (err: any) {
      if (err.status === 409) {
        await refreshResearchAndRulings();
      }
      showFeedback(`خطا در تایید دادنامه: ${err.message}`, 'error');
    }
  }, [rulings, refreshResearchAndRulings, showFeedback]);

  const addRulingDiscussion = useCallback(async (rulingId: string, comment: string) => {
    try {
      const res = await api.addRulingCritique(rulingId, comment);
      const updated = res?.ruling || res;
      setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      showFeedback('نقد حقوقی شما با موفقیت ثبت گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت نقد حقوقی: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const toggleRulingLike = useCallback(async (rulingId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.toggleRulingLike(rulingId);
      const updated = res?.ruling || res;
      if (updated && updated.id) {
        setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      }
    } catch (err: any) {
      showFeedback(`خطا در ثبت پسند: ${err.message}`, 'error');
    }
  }, [currentUser, showFeedback]);

  // Synergy methods
  const createSynergyPost = useCallback(async (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => {
    try {
      const created = await api.createSynergyPost(data);
      const postItem = created?.post || created;
      setSynergyPosts(prev => {
        const exists = prev.some(p => p.id === postItem.id);
        return exists ? prev.map(p => (p.id === postItem.id ? postItem : p)) : [postItem, ...prev];
      });
      showFeedback('درخواست هم‌افزایی شما با حفظ کامل تدابیر محرمانگی در دیوار منتشر گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در انتشار درخواست هم‌افزایی: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const respondToSynergyPost = useCallback(async (postId: string, message: string, isPrivate: boolean, contactShared?: string) => {
    try {
      const res = await api.respondToSynergyPost(postId, message, isPrivate, contactShared);
      const updated = res?.post || res;
      setSynergyPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
      showFeedback('پاسخ هم‌افزایی با موفقیت ثبت گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت پاسخ هم‌افزایی: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const resolveSynergyPost = useCallback(async (postId: string) => {
    try {
      const existing = synergyPosts.find(p => p.id === postId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const res = await api.resolveSynergyPost(postId, expectedVersion);
      const updated = res?.post || res;
      setSynergyPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
      showFeedback('وضعیت درخواست هم‌افزایی به «حل‌شده» تغییر یافت.', 'success');
    } catch (err: any) {
      if (err.status === 409) {
        await refreshResearchAndRulings();
      }
      showFeedback(`خطا در تغییر وضعیت هم‌افزایی: ${err.message}`, 'error');
    }
  }, [synergyPosts, refreshResearchAndRulings, showFeedback]);

  const value = useMemo<ResearchAndRulingsContextType>(() => ({
    researchMentorships,
    submitResearchProject,
    updateResearchProgress,
    updateResearchProject,
    deleteResearchProject,
    rulings,
    submitRuling,
    approveRuling,
    addRulingDiscussion,
    toggleRulingLike,
    synergyPosts,
    createSynergyPost,
    respondToSynergyPost,
    resolveSynergyPost,
    feedbackMessage,
    clearFeedbackMessage,
    refreshResearchAndRulings,
  }), [
    researchMentorships,
    submitResearchProject,
    updateResearchProgress,
    updateResearchProject,
    deleteResearchProject,
    rulings,
    submitRuling,
    approveRuling,
    addRulingDiscussion,
    toggleRulingLike,
    synergyPosts,
    createSynergyPost,
    respondToSynergyPost,
    resolveSynergyPost,
    feedbackMessage,
    clearFeedbackMessage,
    refreshResearchAndRulings,
  ]);

  return (
    <ResearchAndRulingsContext.Provider value={value}>
      {children}
    </ResearchAndRulingsContext.Provider>
  );
};

export const useResearchAndRulings = (): ResearchAndRulingsContextType => {
  const context = useContext(ResearchAndRulingsContext);
  if (!context) {
    throw new Error('useResearchAndRulings must be used within a ResearchAndRulingsProvider');
  }
  return context;
};

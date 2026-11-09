import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ResearchMentorship, JudicialRuling, SynergyPost, User } from '../types';
import { INITIAL_RESEARCH_MENTORSHIPS, INITIAL_RULINGS, INITIAL_SYNERGY_POSTS } from '../data/mockData';
import { api } from '../services/apiClient';

export interface ResearchAndRulingsContextType {
  researchMentorships: ResearchMentorship[];
  submitResearchProject: (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => Promise<void>;
  updateResearchProgress: (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => void;
  updateResearchProject: (projectId: string, updates: Partial<ResearchMentorship>) => void;
  deleteResearchProject: (projectId: string) => void;

  rulings: JudicialRuling[];
  submitRuling: (data: Omit<JudicialRuling, 'id' | 'status' | 'likesCount' | 'likedBy' | 'discussions'>) => void;
  approveRuling: (rulingId: string) => Promise<void>;
  addRulingDiscussion: (rulingId: string, comment: string) => Promise<void>;
  toggleRulingLike: (rulingId: string) => void;

  synergyPosts: SynergyPost[];
  createSynergyPost: (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => Promise<void>;
  respondToSynergyPost: (postId: string, message: string, isPrivate: boolean, contactShared?: string) => Promise<void>;
  resolveSynergyPost: (postId: string) => void;

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
      if (event.type.startsWith('research.')) {
        api.getResearchProjects().then(setResearchMentorships).catch(() => {});
      } else if (event.type.startsWith('rulings.')) {
        api.getRulings().then(setRulings).catch(() => {});
      } else if (event.type.startsWith('synergy.')) {
        api.getSynergyPosts().then(setSynergyPosts).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [refreshResearchAndRulings]);

  // Research methods
  const submitResearchProject = useCallback(async (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => {
    try {
      const created = await api.submitResearchProject(data);
      setResearchMentorships(prev => [created, ...prev]);
      alert('طرح پژوهشی با موفقیت در دبیرخانه رساله‌ها ثبت شد.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  }, []);

  const updateResearchProgress = useCallback((projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => {
    setResearchMentorships(prev =>
      prev.map(p => (p.id === projectId ? { ...p, stage, stageTitle, progressPercent } : p))
    );
  }, []);

  const updateResearchProject = useCallback((projectId: string, updates: Partial<ResearchMentorship>) => {
    setResearchMentorships(prev =>
      prev.map(p => (p.id === projectId ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteResearchProject = useCallback((projectId: string) => {
    setResearchMentorships(prev => prev.filter(p => p.id !== projectId));
  }, []);

  // Judicial Rulings methods
  const submitRuling = useCallback((data: Omit<JudicialRuling, 'id' | 'status' | 'likesCount' | 'likedBy' | 'discussions'>) => {
    const newRuling: JudicialRuling = {
      ...data,
      id: `rul_${Date.now()}`,
      status: 'pending_review',
      likesCount: 0,
      likedBy: [],
      discussions: [],
    };
    setRulings(prev => [newRuling, ...prev]);
  }, []);

  const approveRuling = useCallback(async (rulingId: string) => {
    try {
      const updated = await api.approveRuling(rulingId);
      setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      alert('دادنامه به عنوان رأی برگزیده تالار تایید گردید.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  }, []);

  const addRulingDiscussion = useCallback(async (rulingId: string, comment: string) => {
    try {
      const updated = await api.addRulingCritique(rulingId, comment);
      setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
    } catch (err: any) {
      alert(`خطا در ثبت نقد حقوقی: ${err.message}`);
    }
  }, []);

  const toggleRulingLike = useCallback((rulingId: string) => {
    if (!currentUser) return;
    setRulings(prev =>
      prev.map(r => {
        if (r.id !== rulingId) return r;
        const hasLiked = r.likedBy.includes(currentUser.id);
        return {
          ...r,
          likesCount: hasLiked ? r.likesCount - 1 : r.likesCount + 1,
          likedBy: hasLiked ? r.likedBy.filter(id => id !== currentUser.id) : [...r.likedBy, currentUser.id],
        };
      })
    );
  }, [currentUser]);

  // Synergy methods
  const createSynergyPost = useCallback(async (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => {
    try {
      const created = await api.createSynergyPost(data);
      setSynergyPosts(prev => [created, ...prev]);
      alert('درخواست هم‌افزایی شما با حفظ کامل تدابیر محرمانگی در دیوار منتشر گردید.');
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  }, []);

  const respondToSynergyPost = useCallback(async (postId: string, message: string, isPrivate: boolean, contactShared?: string) => {
    try {
      const updated = await api.respondToSynergyPost(postId, message, isPrivate, contactShared);
      setSynergyPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
    } catch (err: any) {
      alert(`خطا: ${err.message}`);
    }
  }, []);

  const resolveSynergyPost = useCallback((postId: string) => {
    setSynergyPosts(prev => prev.map(p => (p.id === postId ? { ...p, status: 'resolved' } : p)));
  }, []);

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

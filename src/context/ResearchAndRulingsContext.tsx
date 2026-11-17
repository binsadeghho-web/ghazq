import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ResearchMentorship, JudicialRuling, SynergyPost, User, RulingsPortalConfig } from '../types';
import { INITIAL_RESEARCH_MENTORSHIPS, INITIAL_RULINGS, INITIAL_SYNERGY_POSTS } from '../data/mockData';
import { api } from '../services/apiClient';

function notifyToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  }
}

export const DEFAULT_CLIENT_RULINGS_PORTAL_CONFIG: RulingsPortalConfig = {
  layoutMode: 'editorial_split',
  globalCommentsEnabled: true,
  showCreatedAt: true,
  showReviewedAt: true,
  showKeywords: true,
  showPrinciples: true,
  showSummary: true,
  showAttachments: true,
  portalTitle: 'تالار رأی قضایی، نقد علمی و مباحثات فقهی',
  portalSubtitle: 'مطالعه آراء مدلل، استنادات فقهی-حقوقی و گفت‌وگوی تخصصی قضات و پژوهشگران',
  internalTagDefinitions: [
    { id: 'tag_reviewed', label: 'بررسی شد', colorScheme: 'emerald', styleVariant: 'solid', scope: 'internal' },
    { id: 'tag_incomplete', label: 'بررسی ناقص', colorScheme: 'rose', styleVariant: 'soft', scope: 'internal' },
    { id: 'tag_selected', label: 'منتخب', colorScheme: 'amber', styleVariant: 'solid', scope: 'internal' },
    { id: 'tag_showcase', label: 'مناسب ویترین', colorScheme: 'indigo', styleVariant: 'soft', scope: 'internal' },
    { id: 'tag_legacy', label: 'قدیمی', colorScheme: 'slate', styleVariant: 'outline', scope: 'internal' },
    { id: 'tag_used', label: 'استفاده شده در سامانه', colorScheme: 'sky', styleVariant: 'soft', scope: 'internal' },
  ],
  publicLabelDefinitions: [
    { id: 'pub_pick', label: 'برگزیده سامانه', colorScheme: 'amber', styleVariant: 'solid', scope: 'public' },
    { id: 'pub_unity', label: 'رأی وحدت رویه', colorScheme: 'emerald', styleVariant: 'soft', scope: 'public' },
    { id: 'pub_analytical', label: 'تحلیل نوآورانه', colorScheme: 'indigo', styleVariant: 'soft', scope: 'public' },
    { id: 'pub_practical', label: 'کاربردی در شعب', colorScheme: 'sky', styleVariant: 'outline', scope: 'public' },
  ],
  version: 1,
};

export interface ResearchAndRulingsContextType {
  researchMentorships: ResearchMentorship[];
  submitResearchProject: (data: Omit<ResearchMentorship, 'id' | 'progressPercent' | 'status' | 'milestones' | 'createdAt'>) => Promise<void>;
  updateResearchProgress: (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => Promise<void>;
  updateResearchProject: (projectId: string, updates: Partial<ResearchMentorship>) => Promise<void>;
  deleteResearchProject: (projectId: string) => Promise<void>;

  rulings: JudicialRuling[];
  rulingsPortalConfig: RulingsPortalConfig;
  updateRulingsPortalConfig: (updates: Partial<RulingsPortalConfig>) => Promise<void>;
  submitRuling: (data: Partial<JudicialRuling> & { title: string; fullRulingText: string }) => Promise<JudicialRuling | null>;
  updateRuling: (rulingId: string, updates: Partial<JudicialRuling>) => Promise<JudicialRuling | null>;
  reorderRulings: (orderedIds: string[]) => Promise<void>;
  approveRuling: (rulingId: string) => Promise<void>;
  addRulingDiscussion: (rulingId: string, comment: string) => Promise<void>;
  editRulingDiscussion: (rulingId: string, discussionId: string, comment: string) => Promise<void>;
  deleteRulingDiscussion: (rulingId: string, discussionId: string) => Promise<void>;
  toggleRulingLike: (rulingId: string) => Promise<void>;
  toggleRulingDislike: (rulingId: string) => Promise<void>;

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
  const [rulingsPortalConfig, setRulingsPortalConfig] = useState<RulingsPortalConfig>(DEFAULT_CLIENT_RULINGS_PORTAL_CONFIG);
  const [synergyPosts, setSynergyPosts] = useState<SynergyPost[]>(INITIAL_SYNERGY_POSTS);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const clearFeedbackMessage = useCallback(() => setFeedbackMessage(null), []);

  const showFeedback = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    notifyToast(text, type);
  }, []);

  const refreshResearchAndRulings = useCallback(async () => {
    try {
      const [fetchedResearch, fetchedRulings, fetchedPortalCfg, fetchedSynergy] = await Promise.all([
        api.getResearchProjects(),
        api.getRulings(),
        api.getRulingsPortalConfig().catch(() => null),
        api.getSynergyPosts(),
      ]);
      if (Array.isArray(fetchedResearch)) setResearchMentorships(fetchedResearch);
      if (Array.isArray(fetchedRulings)) setRulings(fetchedRulings);
      if (fetchedPortalCfg && typeof fetchedPortalCfg === 'object') {
        setRulingsPortalConfig({
          ...DEFAULT_CLIENT_RULINGS_PORTAL_CONFIG,
          ...fetchedPortalCfg,
        });
      }
      if (Array.isArray(fetchedSynergy)) setSynergyPosts(fetchedSynergy);
    } catch {}
  }, []);

  useEffect(() => {
    refreshResearchAndRulings();
  }, [refreshResearchAndRulings, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const unsubscribe = api.subscribeToEvents(event => {
      const payload = event.data ?? (event as any).payload;
      const updates = payload?.updates ?? payload;

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
        }
      } else if (event.type.startsWith('rulings.')) {
        if (event.type === 'rulings.portal_config_updated' && updates) {
          setRulingsPortalConfig(prev => ({ ...prev, ...updates }));
        } else if (event.type === 'rulings.reordered' && Array.isArray(updates?.orderedIds)) {
          const orderMap = new Map<string, number>();
          updates.orderedIds.forEach((id: string, idx: number) => orderMap.set(id, idx + 1));
          setRulings(prev => {
            const next = prev.map(r => (orderMap.has(r.id) ? { ...r, displayOrder: orderMap.get(r.id)! } : r));
            return next.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          });
        } else if (updates?.removedRulingId) {
          setRulings(prev => prev.filter(r => r.id !== updates.removedRulingId));
        } else if (event.type === 'rulings.highlights_updated' && updates?.rulingId) {
          setRulings(prev =>
            prev.map(r =>
              r.id === updates.rulingId
                ? { ...r, highlights: updates.highlights, version: updates.version ?? r.version }
                : r
            )
          );
        } else if (event.type === 'rulings.critique_featured' && updates?.rulingId) {
          setRulings(prev =>
            prev.map(r =>
              r.id === updates.rulingId
                ? {
                    ...r,
                    discussions: r.discussions.map(d =>
                      d.id === updates.discussionId ? { ...d, isFeatured: Boolean(updates.isFeatured) } : d
                    ),
                  }
                : r
            )
          );
        } else {
          const rulingDelta: JudicialRuling | null = updates?.ruling || (updates?.id && updates?.title ? updates : null);
          if (rulingDelta) {
            setRulings(prev => {
              const exists = prev.some(r => r.id === rulingDelta.id);
              return exists ? prev.map(r => (r.id === rulingDelta.id ? rulingDelta : r)) : [rulingDelta, ...prev];
            });
          }
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
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
  const updateRulingsPortalConfig = useCallback(async (updates: Partial<RulingsPortalConfig>) => {
    try {
      const expectedVersion = Number(rulingsPortalConfig.version ?? 1);
      const res = await api.updateRulingsPortalConfig({
        ...rulingsPortalConfig,
        ...updates,
        expectedVersion,
      });
      if (res?.config) {
        setRulingsPortalConfig({ ...DEFAULT_CLIENT_RULINGS_PORTAL_CONFIG, ...res.config });
      }
      showFeedback('تنظیمات و چیدمان تالار رأی در پایگاه داده ذخیره شد.', 'success');
    } catch (err: any) {
      if (err?.problem?.status === 409 || err?.status === 409) {
        await refreshResearchAndRulings();
      }
      showFeedback(`خطا در ذخیره تنظیمات تالار: ${err.message}`, 'error');
    }
  }, [rulingsPortalConfig, refreshResearchAndRulings, showFeedback]);

  const submitRuling = useCallback(async (data: Partial<JudicialRuling> & { title: string; fullRulingText: string }): Promise<JudicialRuling | null> => {
    try {
      const created = await api.submitRuling(data);
      const rulingItem = created?.ruling || created;
      setRulings(prev => {
        const exists = prev.some(r => r.id === rulingItem.id);
        return exists ? prev.map(r => (r.id === rulingItem.id ? rulingItem : r)) : [rulingItem, ...prev];
      });
      showFeedback('رأی شما با موفقیت در سامانه بارگذاری و برای بررسی به دبیرخانه ارسال شد.', 'success');
      return rulingItem;
    } catch (err: any) {
      showFeedback(`خطا در بارگذاری رأی: ${err.message}`, 'error');
      return null;
    }
  }, [showFeedback]);

  const updateRuling = useCallback(async (rulingId: string, updates: Partial<JudicialRuling>): Promise<JudicialRuling | null> => {
    try {
      const existing = rulings.find(r => r.id === rulingId);
      const expectedVersion = Number(updates.version ?? existing?.version ?? 1);
      const updated = await api.updateRuling(rulingId, {
        ...updates,
        expectedVersion,
      });
      if (updated && updated.id) {
        setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      }
      showFeedback('اطلاعات و برچسب‌های دادنامه با موفقیت در پایگاه داده ثبت گردید.', 'success');
      return updated || null;
    } catch (err: any) {
      if (err?.problem?.status === 409 || err?.status === 409) {
        await refreshResearchAndRulings();
      }
      showFeedback(`خطا در ذخیره بررسی دادنامه: ${err.message}`, 'error');
      return null;
    }
  }, [rulings, refreshResearchAndRulings, showFeedback]);

  const reorderRulings = useCallback(async (orderedIds: string[]) => {
    try {
      const orderMap = new Map<string, number>();
      orderedIds.forEach((id, idx) => orderMap.set(id, idx + 1));
      setRulings(prev => {
        const next = prev.map(r => (orderMap.has(r.id) ? { ...r, displayOrder: orderMap.get(r.id)! } : r));
        return next.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      });
      await api.reorderRulings(orderedIds);
      showFeedback('ترتیب چینش آراء در تالار ذخیره شد.', 'success');
    } catch (err: any) {
      await refreshResearchAndRulings();
      showFeedback(`خطا در تغییر ترتیب آراء: ${err.message}`, 'error');
    }
  }, [refreshResearchAndRulings, showFeedback]);

  const approveRuling = useCallback(async (rulingId: string) => {
    try {
      const existing = rulings.find(r => r.id === rulingId);
      const expectedVersion = Number((existing as any)?.version ?? 1);
      const res = await api.approveRuling(rulingId, expectedVersion);
      const updated = res?.ruling || res;
      setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      showFeedback('دادنامه تایید و برای دانش‌آموختگان منتشر گردید.', 'success');
    } catch (err: any) {
      if (err?.problem?.status === 409 || err?.status === 409) {
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
      showFeedback('دیدگاه حقوقی شما با موفقیت ثبت گردید.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ثبت دیدگاه: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const editRulingDiscussion = useCallback(async (rulingId: string, discussionId: string, comment: string) => {
    try {
      const res = await api.editRulingDiscussion(rulingId, discussionId, comment);
      const updated = res?.ruling || res;
      if (updated && updated.id) {
        setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      }
      showFeedback('دیدگاه با موفقیت ویرایش و در پایگاه داده ذخیره شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در ویرایش دیدگاه: ${err.message}`, 'error');
    }
  }, [showFeedback]);

  const deleteRulingDiscussion = useCallback(async (rulingId: string, discussionId: string) => {
    try {
      const res = await api.deleteRulingDiscussion(rulingId, discussionId);
      const updated = res?.ruling || res;
      if (updated && updated.id) {
        setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      }
      showFeedback('دیدگاه مورد نظر حذف شد.', 'success');
    } catch (err: any) {
      showFeedback(`خطا در حذف دیدگاه: ${err.message}`, 'error');
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

  const toggleRulingDislike = useCallback(async (rulingId: string) => {
    if (!currentUser) return;
    try {
      const res = await api.toggleRulingDislike(rulingId);
      const updated = res?.ruling || res;
      if (updated && updated.id) {
        setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
      }
    } catch (err: any) {
      showFeedback(`خطا در ثبت عدم پسند: ${err.message}`, 'error');
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
    rulingsPortalConfig,
    updateRulingsPortalConfig,
    submitRuling,
    updateRuling,
    reorderRulings,
    approveRuling,
    addRulingDiscussion,
    editRulingDiscussion,
    deleteRulingDiscussion,
    toggleRulingLike,
    toggleRulingDislike,
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
    rulingsPortalConfig,
    updateRulingsPortalConfig,
    submitRuling,
    updateRuling,
    reorderRulings,
    approveRuling,
    addRulingDiscussion,
    editRulingDiscussion,
    deleteRulingDiscussion,
    toggleRulingLike,
    toggleRulingDislike,
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

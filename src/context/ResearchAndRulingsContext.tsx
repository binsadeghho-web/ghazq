import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResearchMentorship,
  ResearchPortalConfig,
  JudicialRuling,
  SynergyPost,
  User,
  RulingsPortalConfig,
} from '../types';
import { INITIAL_RESEARCH_MENTORSHIPS, INITIAL_RULINGS, INITIAL_SYNERGY_POSTS } from '../data/mockData';
import { api } from '../services/apiClient';

function notifyToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } }));
  }
}

export const DEFAULT_CLIENT_RESEARCH_PORTAL_CONFIG: ResearchPortalConfig = {
  sectionTitle: 'راهبری پژوهش و مقاله (خدمات پژوهشی)',
  sectionSubtitle:
    'همراهی گام‌به‌گام اساتید و پژوهشگران برجسته مرکز در تدوین پایان‌نامه، رساله و مقالات علمی‌پژوهشی',
  landingIntroTitle: 'در کلینیک راهبری پژوهش و مقاله مرکز فقه و حقوق اسلامی چه خدماتی ارائه می‌شود؟',
  landingIntroBody:
    'این مرکز ویژه دانش‌آموختگان و پژوهشگران عرصه فقه و حقوق اسلامی راه‌اندازی شده است تا از نخستین گام پژوهش تا مرحله دفاع یا انتشار علمی همراه شما باشد. خدمات شامل مشاوره انتخاب موضوع نوآورانه، نگارش و تصویب پروپوزال، تعیین ساختار و فصل‌بندی علمی، انتصاب استاد راهنما و ناظر، نقد و بازبینی فصول و مقالات، و همچنین تسهیل اسکان مطالعاتی در شهر مقدس قم (برای بسته‌های کامل حضوری) است.',
  landingCalloutTitle: 'آماده شروع یا ارتقای پژوهش علمی خود هستید؟',
  landingCalloutSubtitle:
    'اگر نیاز به کمک و راهبری در انجام پایان‌نامه یا مقاله دارید، روی دکمه ثبت درخواست راهبری کلیک کنید تا الگوریتم هوشمند خدمات پژوهش متناسب با نیاز شما فعال شود.',
  ctaButtonLabel: 'ثبت درخواست راهبری',
  guidanceNotesTitle: 'توضیحات، ضوابط و راهنمای کامل راهبری پژوهش',
  guidanceNotesBody:
    '۱. پس از ثبت درخواست، پرونده شما با وضعیت «در انتظار بررسی» برای شورای پژوهشی مرکز ارسال می‌شود.\n۲. تا پیش از ورود درخواست به وضعیت «در حال بررسی»، امکان ویرایش یا حذف درخواست برای شما فعال است؛ پس از آغاز بررسی کارشناسی، اطلاعات پرونده قفل می‌شود.\n۳. در تمامی مراحل (انتظار، در حال بررسی، تایید یا نیاز به تکمیل)، می‌توانید از طریق بخش گفت‌وگوی پرونده با مسئول پژوهش در ارتباط مستقیم باشید.\n۴. تسهیلات اسکان موقت مطالعاتی در قم منحصراً برای متقاضیان «پک کامل راهبری حضوری» (در صورت فعال بودن سهمیه اسکان) در دسترس است.',
  contactCenterTitle: 'راه‌های ارتباطی و پشتیبانی دبیرخانه راهبری پژوهش',
  contactPhone: '۰۲۵-۳۷۷۴۱۲۹۰',
  contactExtension: 'داخلی ۲۰۲ و ۲۰۵',
  contactMobileOrMessenger: '۰۹۱۲۰۵۸۴۱۲۰ (ایتا و پیام‌رسان بله)',
  contactHours: 'شنبه تا چهارشنبه، ساعت ۸:۳۰ الی ۱۴:۳۰',
  contactAddress: 'قم، خیابان معلم، مجتمع علمی مرکز فقه و حقوق اسلامی، طبقه سوم، معاونت پژوهش',
  accommodationEnabledInWizard: true,
  accommodationCityLabel: 'اسکان موقت مطالعاتی در شهر مقدس قم',
  submissionSuccessMessage:
    'درخواست راهبری پژوهش شما با موفقیت ثبت شد. کارشناسان معاونت پژوهش پرونده را بررسی کرده و با شما تماس گرفته می‌شود.',
  wizardConfig: {
    step1Title: 'نوع پژوهش مورد نظر خود را انتخاب نمایید:',
    step1Options: [
      {
        id: 'thesis',
        label: 'راهبری پایان‌نامه',
        description: 'هدایت تخصصی پایان‌نامه کارشناسی ارشد، سطح ۳ و ۴ حوزوی و رساله دکتری',
        enabled: true,
      },
      {
        id: 'article',
        label: 'راهبری مقاله',
        description: 'نگارش، ساختاربندی، ویراستاری علمی و آماده‌سازی مقالات علمی‌پژوهشی و ترویجی',
        enabled: true,
      },
    ],
    step2Title: 'سطح خدمات و همراهی مورد نیاز شما چیست؟',
    step2Options: [
      {
        id: 'full_pack',
        label: 'نیاز به پک کامل راهبری دارم',
        description: 'همراهی جامع از انتخاب موضوع و پروپوزال تا تکمیل، بازبینی نهایی و هدایت گام‌به‌گام',
        enabled: true,
      },
      {
        id: 'partial_mentorship',
        label: 'نیاز به مشورت و یا راهبری موردی دارم (بخشی از پایان‌نامه / مقاله)',
        description: 'راهبری متمرکز در یک یا چند بخش مشخص (مانند موضوع، پروپوزال، ساختار یا بازبینی)',
        enabled: true,
      },
    ],
    fullPackDeliveryTitle: 'شیوه برگزاری جلسات پک کامل راهبری را انتخاب فرمایید:',
    fullPackInPersonLabel: 'راهبری حضوری می‌خواهم',
    fullPackOnlineLabel: 'راهبری آنلاین می‌خواهم',
    accommodationQuestionLabel: 'آیا در طول جلسات راهبری حضوری، نیاز به اسکان موقت در قم دارید؟',
    briefSummaryLabel: 'شرح مختصر از درخواست راهبری (عنوان، هدف از پژوهش، برای ارائه به کدام نهاد)',
    briefSummaryPlaceholder:
      'لطفاً عنوان احتمالی یا موضوع مد نظر، هدف اصلی پژوهش و نام دانشگاه، حوزه علمیه یا نهاد/نشریه مقصد را به اختصار بنویسید...',
    partialTopicsTitle: 'در کدام بخش‌ها نیاز به مشورت یا راهبری موردی دارید؟',
    partialTopics: [
      { id: 'topic_selection', label: 'انتخاب موضوع نوآورانه و مسئله‌محور', enabled: true },
      { id: 'proposal_writing', label: 'نوشتن پروپوزال و تصویب عنوان', enabled: true },
      { id: 'structure_outline', label: 'تدوین ساختار و فصل‌بندی مقاله / پایان‌نامه', enabled: true },
      { id: 'scientific_review', label: 'درخواست بازبینی، نقد علمی و بررسی متن دارم', enabled: true },
    ],
    partialDeliveryTitle: 'امکان حضور شما در جلسات مشورت و راهبری چگونه است؟',
    partialInPersonLabel: 'امکان حضور دارم',
    partialOnlineLabel: 'امکان حضور ندارم (آنلاین)',
    reviewStepTitle: 'بازبینی مشخصات هویتی و جزئیات درخواست پیش از ثبت نهایی',
  },
  version: 1,
};

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

export interface ResearchStatusUpdatePayload {
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  adminNote?: string;
  assignedSupervisor?: string;
  stageTitle?: string;
  progressPercent?: number;
  replyMessage?: string;
}

export interface ResearchAndRulingsContextType {
  researchMentorships: ResearchMentorship[];
  researchPortalConfig: ResearchPortalConfig;
  updateResearchPortalConfig: (updates: Partial<ResearchPortalConfig>) => Promise<ResearchPortalConfig | null>;
  submitResearchProject: (
    data: Partial<ResearchMentorship> & {
      thesisTitle: string;
      field?: string;
      researchCategory?: 'thesis' | 'article';
      serviceScope?: 'full_pack' | 'partial_mentorship';
      selectedPartialTopics?: string[];
      deliveryMode?: 'in_person' | 'online';
      briefSummary?: string;
      targetInstitution?: string;
      accommodationRequested?: boolean;
      accommodationCity?: 'قم' | 'تهران' | 'مشهد';
    }
  ) => Promise<ResearchMentorship | null>;
  updateResearchProgress: (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => Promise<void>;
  updateResearchProject: (projectId: string, updates: Partial<ResearchMentorship>) => Promise<ResearchMentorship | null>;
  updateResearchStatus: (projectId: string, payload: ResearchStatusUpdatePayload) => Promise<ResearchMentorship | null>;
  addResearchMessage: (projectId: string, message: string) => Promise<ResearchMentorship | null>;
  deleteResearchProject: (projectId: string) => Promise<boolean>;

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

function mergePortalConfig(incoming?: Partial<ResearchPortalConfig> | null): ResearchPortalConfig {
  if (!incoming || typeof incoming !== 'object') return DEFAULT_CLIENT_RESEARCH_PORTAL_CONFIG;
  return {
    ...DEFAULT_CLIENT_RESEARCH_PORTAL_CONFIG,
    ...incoming,
    wizardConfig: {
      ...DEFAULT_CLIENT_RESEARCH_PORTAL_CONFIG.wizardConfig,
      ...(incoming.wizardConfig || {}),
    },
  };
}

export const ResearchAndRulingsProvider: React.FC<ResearchAndRulingsProviderProps> = ({
  children,
  currentUser,
}) => {
  const [researchMentorships, setResearchMentorships] = useState<ResearchMentorship[]>(INITIAL_RESEARCH_MENTORSHIPS);
  const [researchPortalConfig, setResearchPortalConfig] = useState<ResearchPortalConfig>(DEFAULT_CLIENT_RESEARCH_PORTAL_CONFIG);
  const [rulings, setRulings] = useState<JudicialRuling[]>(INITIAL_RULINGS);
  const [rulingsPortalConfig, setRulingsPortalConfig] = useState<RulingsPortalConfig>(DEFAULT_CLIENT_RULINGS_PORTAL_CONFIG);
  const [synergyPosts, setSynergyPosts] = useState<SynergyPost[]>(INITIAL_SYNERGY_POSTS);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const clearFeedbackMessage = useCallback(() => setFeedbackMessage(null), []);

  const showFeedback = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    notifyToast(text, type);
  }, []);

  const refreshResearchOnly = useCallback(async () => {
    try {
      const [fetchedResearch, fetchedResearchCfg] = await Promise.all([
        api.getResearchProjects(),
        api.getResearchPortalConfig().catch(() => null),
      ]);
      if (Array.isArray(fetchedResearch)) {
        setResearchMentorships(prev =>
          JSON.stringify(prev) === JSON.stringify(fetchedResearch) ? prev : fetchedResearch
        );
      }
      if (fetchedResearchCfg && typeof fetchedResearchCfg === 'object') {
        const merged = mergePortalConfig(fetchedResearchCfg);
        setResearchPortalConfig(prev =>
          JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged
        );
      }
    } catch {}
  }, []);

  const refreshResearchAndRulings = useCallback(async () => {
    try {
      const [fetchedResearch, fetchedResearchCfg, fetchedRulings, fetchedPortalCfg, fetchedSynergy] = await Promise.all([
        api.getResearchProjects(),
        api.getResearchPortalConfig().catch(() => null),
        api.getRulings(),
        api.getRulingsPortalConfig().catch(() => null),
        api.getSynergyPosts(),
      ]);
      if (Array.isArray(fetchedResearch)) {
        setResearchMentorships(prev =>
          JSON.stringify(prev) === JSON.stringify(fetchedResearch) ? prev : fetchedResearch
        );
      }
      if (fetchedResearchCfg && typeof fetchedResearchCfg === 'object') {
        const merged = mergePortalConfig(fetchedResearchCfg);
        setResearchPortalConfig(prev =>
          JSON.stringify(prev) === JSON.stringify(merged) ? prev : merged
        );
      }
      if (Array.isArray(fetchedRulings)) setRulings(fetchedRulings);
      if (fetchedPortalCfg && typeof fetchedPortalCfg === 'object') {
        const mergedRulingsCfg = {
          ...DEFAULT_CLIENT_RULINGS_PORTAL_CONFIG,
          ...fetchedPortalCfg,
        };
        setRulingsPortalConfig(prev =>
          JSON.stringify(prev) === JSON.stringify(mergedRulingsCfg) ? prev : mergedRulingsCfg
        );
      }
      if (Array.isArray(fetchedSynergy)) setSynergyPosts(fetchedSynergy);
    } catch {}
  }, []);

  useEffect(() => {
    refreshResearchAndRulings();
  }, [refreshResearchAndRulings, currentUser?.id, currentUser?.role]);

  // Zero-F5 Background Sync Resilience:
  // Keeps statuses, two-way replies, and config synchronized even after 10+ seconds of tab idle or SSE reconnects.
  useEffect(() => {
    if (!currentUser?.id) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshResearchOnly();
      }
    }, 10000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshResearchOnly();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [currentUser?.id, refreshResearchOnly]);

  useEffect(() => {
    const unsubscribe = api.subscribeToEvents(event => {
      const payload = event.data ?? (event as any).payload;
      const updates = payload?.updates ?? payload;

      // Direct State Patching via Delta-Payload (Zero Re-fetch)
      if (event.type.startsWith('research.')) {
        if (event.type === 'research.config_updated' && updates) {
          const cfg = updates?.config || updates;
          setResearchPortalConfig(mergePortalConfig(cfg));
        } else if (event.type === 'research.deleted') {
          const delId = updates?.mentorshipId || updates?.id || payload?.resourceId || payload?.mentorshipId;
          if (delId) {
            setResearchMentorships(prev => prev.filter(p => p.id !== delId));
          }
        } else {
          const entity: ResearchMentorship | null =
            updates?.id ? updates : (payload?.mentorship || updates?.mentorship || null);
          if (entity && entity.id) {
            setResearchMentorships(prev => {
              const exists = prev.some(p => p.id === entity.id);
              return exists ? prev.map(p => (p.id === entity.id ? entity : p)) : [entity, ...prev];
            });
          }
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

  // Research Portal Config
  const updateResearchPortalConfig = useCallback(
    async (updates: Partial<ResearchPortalConfig>): Promise<ResearchPortalConfig | null> => {
      try {
        const expectedVersion = Number(researchPortalConfig.version ?? 1);
        const res = await api.updateResearchPortalConfig({
          ...researchPortalConfig,
          ...updates,
          wizardConfig: {
            ...researchPortalConfig.wizardConfig,
            ...(updates.wizardConfig || {}),
          },
          expectedVersion,
        });
        const nextCfg = mergePortalConfig(res?.config || res);
        setResearchPortalConfig(nextCfg);
        showFeedback('تنظیمات بخش راهبری پژوهش و مقاله با موفقیت در پایگاه داده ذخیره شد.', 'success');
        return nextCfg;
      } catch (err: any) {
        if (err?.problem?.status === 409 || err?.status === 409) {
          await refreshResearchOnly();
        }
        showFeedback(`خطا در ذخیره تنظیمات راهبری پژوهش: ${err.message}`, 'error');
        return null;
      }
    },
    [researchPortalConfig, refreshResearchOnly, showFeedback]
  );

  // Research methods
  const submitResearchProject = useCallback(
    async (data: any): Promise<ResearchMentorship | null> => {
      try {
        const created = await api.submitResearchProject(data);
        const entity: ResearchMentorship = created?.mentorship || created;
        setResearchMentorships(prev => {
          const exists = prev.some(p => p.id === entity.id);
          return exists ? prev.map(p => (p.id === entity.id ? entity : p)) : [entity, ...prev];
        });
        showFeedback('درخواست راهبری پژوهش شما با موفقیت ثبت شد.', 'success');
        return entity;
      } catch (err: any) {
        showFeedback(`خطا در ثبت درخواست راهبری پژوهش: ${err.message}`, 'error');
        return null;
      }
    },
    [showFeedback]
  );

  const updateResearchProgress = useCallback(
    async (projectId: string, stage: ResearchMentorship['stage'], stageTitle: string, progressPercent: number) => {
      try {
        const existing = researchMentorships.find(p => p.id === projectId);
        const expectedVersion = Number(existing?.version ?? 1);
        const res = await api.updateResearchProgress(projectId, {
          stage,
          stageTitle,
          progressPercent,
          expectedVersion,
        });
        const updated = res?.mentorship || res;
        setResearchMentorships(prev => prev.map(p => (p.id === projectId ? updated : p)));
        showFeedback('پیشرفت پرونده پژوهشی در پایگاه داده ذخیره گردید.', 'success');
      } catch (err: any) {
        if (err?.problem?.status === 409 || err?.status === 409) {
          await refreshResearchOnly();
        }
        showFeedback(`خطا در به‌روزرسانی پیشرفت پژوهش: ${err.message}`, 'error');
      }
    },
    [researchMentorships, refreshResearchOnly, showFeedback]
  );

  const updateResearchProject = useCallback(
    async (projectId: string, updates: Partial<ResearchMentorship>): Promise<ResearchMentorship | null> => {
      try {
        const existing = researchMentorships.find(p => p.id === projectId);
        const expectedVersion = Number(updates.version ?? existing?.version ?? 1);
        const res = await api.updateResearchProject(projectId, {
          ...updates,
          expectedVersion,
        });
        const updated = res?.mentorship || res;
        setResearchMentorships(prev => prev.map(p => (p.id === projectId ? updated : p)));
        showFeedback('اطلاعات درخواست راهبری پژوهش با موفقیت ویرایش و ذخیره شد.', 'success');
        return updated;
      } catch (err: any) {
        if (err?.problem?.status === 409 || err?.status === 409) {
          await refreshResearchOnly();
        }
        showFeedback(`خطا در ویرایش درخواست: ${err.message}`, 'error');
        return null;
      }
    },
    [researchMentorships, refreshResearchOnly, showFeedback]
  );

  const updateResearchStatus = useCallback(
    async (projectId: string, payload: ResearchStatusUpdatePayload): Promise<ResearchMentorship | null> => {
      try {
        const existing = researchMentorships.find(p => p.id === projectId);
        const expectedVersion = Number(existing?.version ?? 1);
        const res = await api.updateResearchStatus(projectId, {
          ...payload,
          expectedVersion,
        });
        const updated = res?.mentorship || res;
        setResearchMentorships(prev => prev.map(p => (p.id === projectId ? updated : p)));
        showFeedback('وضعیت درخواست در پایگاه داده ثبت و همگام‌سازی شد.', 'success');
        return updated;
      } catch (err: any) {
        if (err?.problem?.status === 409 || err?.status === 409) {
          await refreshResearchOnly();
        }
        showFeedback(`خطا در تغییر وضعیت درخواست: ${err.message}`, 'error');
        return null;
      }
    },
    [researchMentorships, refreshResearchOnly, showFeedback]
  );

  const addResearchMessage = useCallback(
    async (projectId: string, message: string): Promise<ResearchMentorship | null> => {
      try {
        const res = await api.addResearchMessage(projectId, message);
        const updated = res?.mentorship || res;
        if (updated && updated.id) {
          setResearchMentorships(prev => prev.map(p => (p.id === projectId ? updated : p)));
        }
        showFeedback('پیام شما در پرونده پژوهشی ثبت و ارسال شد.', 'success');
        return updated || null;
      } catch (err: any) {
        showFeedback(`خطا در ارسال پیام: ${err.message}`, 'error');
        return null;
      }
    },
    [showFeedback]
  );

  const deleteResearchProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      try {
        const existing = researchMentorships.find(p => p.id === projectId);
        const expectedVersion = Number(existing?.version ?? 1);
        await api.deleteResearchProject(projectId, expectedVersion);
        setResearchMentorships(prev => prev.filter(p => p.id !== projectId));
        showFeedback('درخواست راهبری پژوهش با موفقیت حذف (بایگانی) شد.', 'success');
        return true;
      } catch (err: any) {
        if (err?.problem?.status === 409 || err?.status === 409) {
          await refreshResearchOnly();
        }
        showFeedback(`خطا در حذف درخواست پژوهش: ${err.message}`, 'error');
        return false;
      }
    },
    [researchMentorships, refreshResearchOnly, showFeedback]
  );

  // Judicial Rulings methods
  const updateRulingsPortalConfig = useCallback(
    async (updates: Partial<RulingsPortalConfig>) => {
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
    },
    [rulingsPortalConfig, refreshResearchAndRulings, showFeedback]
  );

  const submitRuling = useCallback(
    async (data: Partial<JudicialRuling> & { title: string; fullRulingText: string }): Promise<JudicialRuling | null> => {
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
    },
    [showFeedback]
  );

  const updateRuling = useCallback(
    async (rulingId: string, updates: Partial<JudicialRuling>): Promise<JudicialRuling | null> => {
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
    },
    [rulings, refreshResearchAndRulings, showFeedback]
  );

  const reorderRulings = useCallback(
    async (orderedIds: string[]) => {
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
    },
    [refreshResearchAndRulings, showFeedback]
  );

  const approveRuling = useCallback(
    async (rulingId: string) => {
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
    },
    [rulings, refreshResearchAndRulings, showFeedback]
  );

  const addRulingDiscussion = useCallback(
    async (rulingId: string, comment: string) => {
      try {
        const res = await api.addRulingCritique(rulingId, comment);
        const updated = res?.ruling || res;
        setRulings(prev => prev.map(r => (r.id === rulingId ? updated : r)));
        showFeedback('دیدگاه حقوقی شما با موفقیت ثبت گردید.', 'success');
      } catch (err: any) {
        showFeedback(`خطا در ثبت دیدگاه: ${err.message}`, 'error');
      }
    },
    [showFeedback]
  );

  const editRulingDiscussion = useCallback(
    async (rulingId: string, discussionId: string, comment: string) => {
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
    },
    [showFeedback]
  );

  const deleteRulingDiscussion = useCallback(
    async (rulingId: string, discussionId: string) => {
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
    },
    [showFeedback]
  );

  const toggleRulingLike = useCallback(
    async (rulingId: string) => {
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
    },
    [currentUser, showFeedback]
  );

  const toggleRulingDislike = useCallback(
    async (rulingId: string) => {
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
    },
    [currentUser, showFeedback]
  );

  // Synergy methods
  const createSynergyPost = useCallback(
    async (data: Omit<SynergyPost, 'id' | 'createdAt' | 'responses'>) => {
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
    },
    [showFeedback]
  );

  const respondToSynergyPost = useCallback(
    async (postId: string, message: string, isPrivate: boolean, contactShared?: string) => {
      try {
        const res = await api.respondToSynergyPost(postId, message, isPrivate, contactShared);
        const updated = res?.post || res;
        setSynergyPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
        showFeedback('پاسخ هم‌افزایی با موفقیت ثبت گردید.', 'success');
      } catch (err: any) {
        showFeedback(`خطا در ثبت پاسخ هم‌افزایی: ${err.message}`, 'error');
      }
    },
    [showFeedback]
  );

  const resolveSynergyPost = useCallback(
    async (postId: string) => {
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
    },
    [synergyPosts, refreshResearchAndRulings, showFeedback]
  );

  const value = useMemo<ResearchAndRulingsContextType>(
    () => ({
      researchMentorships,
      researchPortalConfig,
      updateResearchPortalConfig,
      submitResearchProject,
      updateResearchProgress,
      updateResearchProject,
      updateResearchStatus,
      addResearchMessage,
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
    }),
    [
      researchMentorships,
      researchPortalConfig,
      updateResearchPortalConfig,
      submitResearchProject,
      updateResearchProgress,
      updateResearchProject,
      updateResearchStatus,
      addResearchMessage,
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
    ]
  );

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

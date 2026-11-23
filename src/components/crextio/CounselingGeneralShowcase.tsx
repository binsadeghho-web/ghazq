import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  CounselingWorkshopItem,
  CounselingAnnouncementItem,
  Consultant,
} from '../../types';
import { CounselingGeneralShowcaseEditorModal } from './CounselingGeneralShowcaseEditorModal';
import {
  HeartHandshake,
  Edit3,
  ArrowLeft,
  GraduationCap,
  Megaphone,
  UserCheck,
  Calendar,
  Download,
  ExternalLink,
  FileAudio,
  FileVideo,
  FileText,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Pause,
} from 'lucide-react';

interface CounselingGeneralShowcaseProps {
  span?: 'full' | 'half';
  scale?: 'micro' | 'compact' | 'normal' | 'expanded';
  onNavigateToGeneral?: () => void;
  onBookGeneralCounseling?: () => void;
  onOpenQuickEdit?: () => void;
}

type ShowcasePillarKey = 'workshops' | 'announcements' | 'consultants';

const SHOWCASE_EDITOR_ROLES = new Set([
  'admin',
  'super_admin',
  'alumni_manager',
  'supervisor',
  'cultural_educational_officer',
  'psychologist_counselor',
]);

function isSafeHttpUrl(raw?: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const CounselingGeneralShowcase: React.FC<CounselingGeneralShowcaseProps> = ({
  span = 'full',
  scale = 'normal',
  onNavigateToGeneral,
  onBookGeneralCounseling,
}) => {
  const {
    currentUser,
    consultants,
    crextioConfig,
    generalShowcase,
    updateGeneralShowcase,
    registerInWorkshop,
    isAlumniPreview,
  } = useApp();

  const canEditShowcase =
    Boolean(currentUser?.role && SHOWCASE_EDITOR_ROLES.has(currentUser.role)) &&
    !isAlumniPreview;

  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<CounselingWorkshopItem | null>(null);
  const [registeringWsId, setRegisteringWsId] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<CounselingAnnouncementItem | null>(null);
  const [consultantIdx, setConsultantIdx] = useState(0);
  const [coverImgFailed, setCoverImgFailed] = useState(false);

  // Scheduled Carousel state
  const [activePillarIdx, setActivePillarIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);

  // Effective Scale & Mode
  const effectiveScale = generalShowcase.showcaseScale || scale || 'normal';
  const isMicro = effectiveScale === 'micro';
  const isCompact = effectiveScale === 'compact' || effectiveScale === 'micro';
  const isExpanded = effectiveScale === 'expanded';
  const displayMode = generalShowcase.displayMode || 'carousel';
  const autoplay = generalShowcase.carouselAutoplay !== false && !manualPaused;
  const intervalSeconds = Math.min(30, Math.max(3, Number(generalShowcase.carouselIntervalSeconds) || 6));

  // Workshops Display Policy (strictly NO 'all' tab)
  const workshopsDisplayMode = generalShowcase.workshopsDisplayMode || 'both';
  const [workshopTab, setWorkshopTab] = useState<'upcoming' | 'archive'>('upcoming');

  const upcomingCount = useMemo(
    () => (generalShowcase.workshops || []).filter(w => w.isActive !== false && w.mode === 'upcoming').length,
    [generalShowcase.workshops]
  );
  const archiveCount = useMemo(
    () => (generalShowcase.workshops || []).filter(w => w.isActive !== false && w.mode === 'archive').length,
    [generalShowcase.workshops]
  );

  // Keep workshop tab synchronized with admin visibility mode
  useEffect(() => {
    if (workshopsDisplayMode === 'upcoming_only') {
      setWorkshopTab('upcoming');
    } else if (workshopsDisplayMode === 'archive_only') {
      setWorkshopTab('archive');
    } else if (workshopsDisplayMode === 'both') {
      if (workshopTab === 'upcoming' && upcomingCount === 0 && archiveCount > 0) {
        setWorkshopTab('archive');
      }
    }
  }, [workshopsDisplayMode, upcomingCount, archiveCount]);

  const effectiveWorkshopTab: 'upcoming' | 'archive' =
    workshopsDisplayMode === 'upcoming_only'
      ? 'upcoming'
      : workshopsDisplayMode === 'archive_only'
      ? 'archive'
      : workshopTab;

  const activeWorkshops = useMemo(
    () =>
      (generalShowcase.workshops || [])
        .filter(w => w.isActive !== false && w.mode === effectiveWorkshopTab)
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [generalShowcase.workshops, effectiveWorkshopTab]
  );

  const visibleFields = useMemo(() => {
    const raw =
      effectiveWorkshopTab === 'upcoming'
        ? generalShowcase.upcomingFields
        : generalShowcase.archiveFields;
    return {
      showImage: raw?.showImage !== false,
      showPresenter: raw?.showPresenter !== false,
      showSchedule: raw?.showSchedule !== false,
      showDescription:
        raw?.showDescription !== undefined
          ? Boolean(raw.showDescription)
          : effectiveWorkshopTab === 'upcoming',
      showActionBadge: raw?.showActionBadge !== false,
    };
  }, [effectiveWorkshopTab, generalShowcase.upcomingFields, generalShowcase.archiveFields]);

  const activeAnnouncements = useMemo(
    () =>
      (generalShowcase.announcements || [])
        .filter(a => a.isActive !== false)
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [generalShowcase.announcements]
  );

  const generalConsultants = useMemo(
    () => consultants.filter(c => c.isActive !== false && c.counselingType !== 'specialized_career'),
    [consultants]
  );

  const featuredConsultants: Consultant[] = useMemo(() => {
    const pickedIds = generalShowcase.featuredConsultantIds || [];
    if (pickedIds.length > 0) {
      const matched = pickedIds
        .map(id => generalConsultants.find(c => c.id === id))
        .filter((c): c is Consultant => Boolean(c));
      if (matched.length > 0) return matched;
    }
    return generalConsultants;
  }, [generalConsultants, generalShowcase.featuredConsultantIds]);

  const registeredWorkshopIds = useMemo(
    () => new Set(generalShowcase.myRegisteredWorkshopIds || []),
    [generalShowcase.myRegisteredWorkshopIds]
  );

  const liveSelectedWorkshop = useMemo(() => {
    if (!selectedWorkshop) return null;
    return (
      (generalShowcase.workshops || []).find(w => w.id === selectedWorkshop.id) ||
      selectedWorkshop
    );
  }, [selectedWorkshop, generalShowcase.workshops]);

  const showWorkshops = generalShowcase.showWorkshopsCard !== false;
  const showAnnouncements = generalShowcase.showAnnouncementsCard !== false;
  const showConsultants = generalShowcase.showFeaturedConsultantCard !== false;

  const enabledPillars = useMemo<ShowcasePillarKey[]>(() => {
    const list: ShowcasePillarKey[] = [];
    if (showWorkshops) list.push('workshops');
    if (showAnnouncements) list.push('announcements');
    if (showConsultants) list.push('consultants');
    return list;
  }, [showWorkshops, showAnnouncements, showConsultants]);

  const safePillarIdx = enabledPillars.length > 0 ? activePillarIdx % enabledPillars.length : 0;
  const activePillar: ShowcasePillarKey | null =
    enabledPillars.length > 0 ? enabledPillars[safePillarIdx] : null;

  // Scheduled rotation timer for Carousel mode
  useEffect(() => {
    if (
      displayMode !== 'carousel' ||
      !autoplay ||
      isPaused ||
      enabledPillars.length <= 1 ||
      Boolean(selectedWorkshop) ||
      Boolean(selectedAnnouncement) ||
      editorOpen
    ) {
      return;
    }
    const timer = setInterval(() => {
      setActivePillarIdx(prev => (prev + 1) % enabledPillars.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [
    displayMode,
    autoplay,
    isPaused,
    enabledPillars.length,
    intervalSeconds,
    selectedWorkshop,
    selectedAnnouncement,
    editorOpen,
  ]);

  const fallbackAvatarUrl = resolveShowcaseImageUrl(
    'hero_portrait',
    crextioConfig.showcaseImageOverrides
  );
  const coverImageUrl =
    generalShowcase.showcaseImageUrl ||
    resolveShowcaseImageUrl('counseling_general_showcase', crextioConfig.showcaseImageOverrides);

  useEffect(() => {
    setCoverImgFailed(false);
  }, [coverImageUrl]);

  const showCoverPanel =
    generalShowcase.showShowcaseImage !== false &&
    !isMicro &&
    span !== 'half' &&
    Boolean(coverImageUrl);

  const currentConsultant =
    featuredConsultants.length > 0
      ? featuredConsultants[consultantIdx % featuredConsultants.length]
      : null;

  const handleWorkshopRegister = async (wsId: string) => {
    setRegisteringWsId(wsId);
    try {
      await registerInWorkshop(wsId);
    } finally {
      setRegisteringWsId(null);
    }
  };

  const handleQuickToggleScale = async () => {
    const nextScale = isCompact ? 'normal' : 'compact';
    await updateGeneralShowcase({ showcaseScale: nextScale });
  };

  const PILLAR_META: Record<
    ShowcasePillarKey,
    { label: string; shortLabel: string; icon: React.ComponentType<any>; accentText: string; dotColor: string }
  > = {
    workshops: {
      label: generalShowcase.workshopsCardTitle || 'کارگاه‌های آموزشی و آرشیو',
      shortLabel: 'کارگاه‌ها و آرشیو',
      icon: GraduationCap,
      accentText: 'text-emerald-800 dark:text-emerald-300',
      dotColor: 'bg-emerald-600',
    },
    announcements: {
      label: generalShowcase.announcementsCardTitle || 'اطلاعیه‌های دوره‌های روان‌شناسی',
      shortLabel: 'اطلاعیه‌ها',
      icon: Megaphone,
      accentText: 'text-amber-800 dark:text-amber-300',
      dotColor: 'bg-amber-600',
    },
    consultants: {
      label: generalShowcase.consultantCardTitle || 'مشاورین مرکز و رزرو نوبت',
      shortLabel: 'مشاورین و رزرو',
      icon: UserCheck,
      accentText: 'text-rose-800 dark:text-rose-300',
      dotColor: 'bg-rose-600',
    },
  };

  const maxVisibleRows = isMicro ? 2 : isCompact ? 3 : isExpanded ? 6 : 4;

  // Render content for Pillar 1: Workshops & Archive (NO "همه" option)
  const renderWorkshopsPillar = (inGrid = false) => {
    const displayedRows = activeWorkshops.slice(0, maxVisibleRows);
    return (
      <div className={`flex flex-col justify-between h-full ${isCompact ? 'gap-2.5' : 'gap-4'}`}>
        <div className={isCompact ? 'space-y-2.5' : 'space-y-3.5'}>
          {/* Subheader & Mode Tabs (Upcoming vs Archive ONLY) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-w-0">
              <h4 className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-black text-stone-900 dark:text-white flex items-center gap-2`}>
                <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">{generalShowcase.workshopsCardTitle || 'کارگاه‌های آموزشی و آرشیو جلسات'}</span>
              </h4>
              {!isCompact && generalShowcase.workshopsCardSubtitle && (
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {generalShowcase.workshopsCardSubtitle}
                </p>
              )}
            </div>

            {workshopsDisplayMode === 'both' ? (
              <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto items-center gap-1 p-1 rounded-xl bg-stone-100/90 dark:bg-slate-800/80 text-[11px] font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setWorkshopTab('upcoming')}
                  className={`min-h-[38px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-center ${
                    effectiveWorkshopTab === 'upcoming'
                      ? 'bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 shadow-2xs font-black'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  کارگاه‌های فعال ({toPersianNumbers(upcomingCount)})
                </button>
                <button
                  type="button"
                  onClick={() => setWorkshopTab('archive')}
                  className={`min-h-[38px] sm:min-h-0 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-center ${
                    effectiveWorkshopTab === 'archive'
                      ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-300 shadow-2xs font-black'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  آرشیو جلسات ({toPersianNumbers(archiveCount)})
                </button>
              </div>
            ) : (
              <span className={`text-[11px] font-bold ${effectiveWorkshopTab === 'upcoming' ? 'text-emerald-800 dark:text-emerald-300' : 'text-indigo-800 dark:text-indigo-300'}`}>
                {effectiveWorkshopTab === 'upcoming' ? 'کارگاه‌های فعال پیش‌رو' : 'آرشیو جلسات برگزارشده'}
              </span>
            )}
          </div>

          {/* Hairline-divided clean editorial list (No nested card boxes) */}
          {displayedRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 dark:text-slate-400">
              {effectiveWorkshopTab === 'upcoming'
                ? 'در حال حاضر کارگاه فعالی برای ثبت‌نام درج نشده است.'
                : 'هنوز جلسه آرشیوی در این بخش منتشر نشده است.'}
            </div>
          ) : (
            <div className={`divide-y divide-stone-200/70 dark:divide-slate-800/70 ${inGrid ? 'max-h-[280px] overflow-y-auto pl-1' : ''}`}>
              {displayedRows.map(ws => {
                const isRegistered = registeredWorkshopIds.has(ws.id);
                const mediaCount = (ws.mediaFiles || []).length;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => setSelectedWorkshop(ws)}
                    className={`w-full text-right flex items-center gap-3 transition-colors hover:bg-emerald-950/[0.03] dark:hover:bg-white/[0.04] rounded-xl px-2 cursor-pointer group ${
                      isMicro ? 'py-2' : isCompact ? 'py-2.5' : 'py-3'
                    }`}
                  >
                    {visibleFields.showImage && (
                      ws.bannerUrl ? (
                        <img
                          src={ws.bannerUrl}
                          alt={ws.title}
                          referrerPolicy="no-referrer"
                          className={`${isCompact ? 'w-10 h-10 rounded-lg' : 'w-12 h-12 rounded-xl'} object-cover shrink-0 shadow-2xs`}
                        />
                      ) : (
                        <div className={`${isCompact ? 'w-10 h-10 rounded-lg' : 'w-12 h-12 rounded-xl'} bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0`}>
                          {ws.mode === 'upcoming' ? (
                            <Calendar className="w-4 h-4" />
                          ) : (
                            <FileAudio className="w-4 h-4" />
                          )}
                        </div>
                      )
                    )}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`${isCompact ? 'text-xs' : 'text-[13px]'} font-black text-stone-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-300 truncate`}>
                          {ws.title}
                        </span>
                        {visibleFields.showActionBadge && (
                          <span className="shrink-0 text-[10px] font-extrabold whitespace-nowrap">
                            {ws.mode === 'upcoming' ? (
                              isRegistered ? (
                                <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  ثبت‌نام‌شده
                                </span>
                              ) : (
                                <span className="text-emerald-800 dark:text-emerald-300 group-hover:underline">
                                  مشاهده و ثبت‌نام
                                </span>
                              )
                            ) : (
                              <span className="text-indigo-700 dark:text-indigo-300 tabular-nums">
                                {mediaCount > 0 ? `${toPersianNumbers(mediaCount)} فایل آماده دانلود` : 'مشاهده آرشیو'}
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {(visibleFields.showPresenter || visibleFields.showSchedule) && (ws.presenter || ws.scheduleText) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-slate-400 truncate">
                          {visibleFields.showPresenter && ws.presenter && <span className="truncate">{ws.presenter}</span>}
                          {visibleFields.showPresenter && ws.presenter && visibleFields.showSchedule && ws.scheduleText && (
                            <span aria-hidden="true">·</span>
                          )}
                          {visibleFields.showSchedule && ws.scheduleText && <span className="truncate">{ws.scheduleText}</span>}
                        </div>
                      )}

                      {!isMicro && visibleFields.showDescription && ws.description && (
                        <p className="text-[11px] text-stone-600 dark:text-slate-400 line-clamp-1">
                          {ws.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-slate-800/70 text-[11px] text-stone-500 dark:text-slate-400">
          <span>برای دریافت فایل‌های جلسه یا ثبت‌نام، روی عنوان کلیک کنید</span>
          <button
            type="button"
            onClick={onNavigateToGeneral}
            className="font-bold text-emerald-800 dark:text-emerald-300 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>کارگاه‌های بخش مشاوره</span>
            <ArrowLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // Render content for Pillar 2: Announcements (with enlarged poster lightbox)
  const renderAnnouncementsPillar = (inGrid = false) => {
    const displayedAnns = activeAnnouncements.slice(0, isMicro ? 2 : isCompact ? 2 : 3);
    return (
      <div className={`flex flex-col justify-between h-full ${isCompact ? 'gap-2.5' : 'gap-4'}`}>
        <div className={isCompact ? 'space-y-2.5' : 'space-y-3.5'}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h4 className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-black text-stone-900 dark:text-white flex items-center gap-2`}>
                <Megaphone className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">{generalShowcase.announcementsCardTitle || 'اطلاعیه‌های دوره‌های روان‌شناسی'}</span>
              </h4>
              {!isCompact && generalShowcase.announcementsCardSubtitle && (
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {generalShowcase.announcementsCardSubtitle}
                </p>
              )}
            </div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 tabular-nums shrink-0">
              {toPersianNumbers(activeAnnouncements.length)} اطلاعیه
            </span>
          </div>

          {displayedAnns.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 dark:text-slate-400">
              در حال حاضر اطلاعیه فعالی در این بخش منتشر نشده است.
            </div>
          ) : (
            <div className={`divide-y divide-stone-200/70 dark:divide-slate-800/70 ${inGrid ? 'max-h-[280px] overflow-y-auto pl-1' : ''}`}>
              {displayedAnns.map(ann => (
                <button
                  key={ann.id}
                  type="button"
                  onClick={() => setSelectedAnnouncement(ann)}
                  className={`w-full text-right flex items-center gap-3 hover:bg-amber-950/[0.03] dark:hover:bg-white/[0.04] rounded-xl px-2 transition-colors cursor-pointer group ${
                    isCompact ? 'py-2.5' : 'py-3'
                  }`}
                >
                  {ann.bannerUrl ? (
                    <div className={`relative ${isCompact ? 'w-14 h-12 rounded-lg' : 'w-20 h-16 rounded-xl'} overflow-hidden bg-stone-100 shrink-0`}>
                      <img
                        src={ann.bannerUrl}
                        alt={ann.title || 'پوستر اطلاعیه روان‌شناسی'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className={`${isCompact ? 'w-12 h-12 rounded-lg' : 'w-14 h-14 rounded-xl'} bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0`}>
                      <Megaphone className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className={ann.organizerType === 'external' ? 'text-indigo-700 dark:text-indigo-300' : 'text-emerald-800 dark:text-emerald-300'}>
                        {ann.organizerType === 'external' ? 'دوره برون‌مرکزی' : 'دوره داخلی مرکز'}
                      </span>
                      {ann.scheduleText && (
                        <>
                          <span aria-hidden="true" className="text-stone-300">·</span>
                          <span className="text-amber-800 dark:text-amber-300 truncate">{ann.scheduleText}</span>
                        </>
                      )}
                    </div>
                    <div className={`${isCompact ? 'text-xs' : 'text-[13px]'} font-black text-stone-900 dark:text-white group-hover:text-amber-800 dark:group-hover:text-amber-300 truncate`}>
                      {ann.title || 'اطلاعیه تصویری دوره روان‌شناسی'}
                    </div>
                    {!isMicro && ann.subtitle && (
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                        {ann.subtitle}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-stone-400 group-hover:text-amber-700 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden sm:inline">بزرگ‌نمایی</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-slate-800/70 text-[11px] text-stone-500 dark:text-slate-400">
          <span>کلیک روی هر اطلاعیه جهت مشاهده بزرگ‌نمایی پوستر و جزئیات</span>
        </div>
      </div>
    );
  };

  // Render content for Pillar 3: Featured Consultants + Direct Booking CTA
  const renderConsultantsPillar = () => (
    <div className={`flex flex-col justify-between h-full ${isCompact ? 'gap-2.5' : 'gap-4'}`}>
      <div className={isCompact ? 'space-y-2.5' : 'space-y-3.5'}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className={`${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-black text-stone-900 dark:text-white flex items-center gap-2`}>
              <UserCheck className="w-4 h-4 text-rose-700 shrink-0" />
              <span className="truncate">{generalShowcase.consultantCardTitle || 'مشاورین مرکز و رزرو نوبت'}</span>
            </h4>
            {!isCompact && (
              <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                آشنایی با روان‌شناسان مرکز و ثبت نوبت محرمانه مشاوره
              </p>
            )}
          </div>

          {featuredConsultants.length > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setConsultantIdx(i => (i - 1 + featuredConsultants.length) % featuredConsultants.length)
                }
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 cursor-pointer"
                title="مشاور قبلی"
              >
                <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-stone-500 tabular-nums px-1">
                {toPersianNumbers((consultantIdx % featuredConsultants.length) + 1)}/{toPersianNumbers(featuredConsultants.length)}
              </span>
              <button
                type="button"
                onClick={() => setConsultantIdx(i => (i + 1) % featuredConsultants.length)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 cursor-pointer"
                title="مشاور بعدی"
              >
                <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          )}
        </div>

        {currentConsultant ? (
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-3.5">
              <img
                src={currentConsultant.avatarUrl || fallbackAvatarUrl}
                alt={currentConsultant.name}
                referrerPolicy="no-referrer"
                className={`${isCompact ? 'w-14 h-14 rounded-2xl' : 'w-18 h-18 rounded-2xl'} object-cover object-top shrink-0 shadow-xs`}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className={`${isCompact ? 'text-sm' : 'text-base'} font-black text-stone-900 dark:text-white truncate`}>
                  {currentConsultant.name}
                </div>
                <div className="text-xs font-bold text-rose-800 dark:text-rose-300 truncate">
                  {currentConsultant.specialty || currentConsultant.title}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                  {currentConsultant.availability || currentConsultant.academicRank}
                </div>
              </div>
            </div>

            {!isMicro && (currentConsultant.bio || currentConsultant.title) && (
              <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-2 leading-relaxed pt-2 border-t border-stone-200/60 dark:border-slate-800/70">
                {currentConsultant.bio || currentConsultant.title}
              </p>
            )}
          </div>
        ) : (
          <div className="py-6 text-xs text-stone-500 text-center">
            مشاورین کلینیک از پنل مدیریت قابل معرفی هستند.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200/60 dark:border-slate-800/70">
        {featuredConsultants.length > 1 ? (
          <div className="flex items-center gap-1.5">
            {featuredConsultants.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setConsultantIdx(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === consultantIdx % featuredConsultants.length
                    ? 'w-5 bg-rose-700'
                    : 'w-1.5 bg-stone-300 dark:bg-slate-700 hover:bg-rose-300'
                }`}
                aria-label={c.name}
              />
            ))}
          </div>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={() => (onBookGeneralCounseling || onNavigateToGeneral)?.()}
          className={`${isCompact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-xs sm:text-sm'} rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-black inline-flex items-center gap-2 shadow-xs transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap`}
        >
          <span>{generalShowcase.consultantCardCtaLabel || 'رزرو وقت مشاوره'}</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full rounded-2xl sm:rounded-[28px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-stone-200/75 dark:border-slate-800 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.14)] overflow-hidden text-stone-900 dark:text-slate-100 ${
        isMicro
          ? 'p-3 sm:p-4 space-y-3'
          : isCompact
          ? 'p-3.5 sm:p-5 space-y-3 sm:space-y-3.5'
          : isExpanded
          ? 'p-4 sm:p-8 space-y-4 sm:space-y-6'
          : 'p-3.5 sm:p-6 space-y-4 sm:space-y-5'
      }`}
      dir="rtl"
    >
      {/* Subtle Top Scheduled Timing Progress Indicator */}
      {displayMode === 'carousel' && enabledPillars.length > 1 && autoplay && !isPaused && (
        <div className="absolute top-0 inset-x-0 h-[3px] bg-stone-200/40 dark:bg-slate-800/60 overflow-hidden pointer-events-none">
          <motion.div
            key={`${activePillar}-${safePillarIdx}-${intervalSeconds}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: intervalSeconds, ease: 'linear' }}
            style={{ transformOrigin: '100% 50%' }}
            className="h-full w-full bg-gradient-to-l from-emerald-600 via-teal-500 to-amber-500"
          />
        </div>
      )}

      {/* Clean Editorial Header (Zero Pill Clutter) */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 ${isMicro ? 'pb-2' : 'pb-3.5'} border-b border-stone-200/70 dark:border-slate-800/80`}>
        <div className="space-y-1 min-w-0">
          {!isMicro && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <span>{generalShowcase.sectionBadge || 'بخش مشاوره عمومی و خدمات روان‌شناختی'}</span>
              <span aria-hidden="true" className="text-stone-300 dark:text-slate-600">·</span>
              <span className="text-stone-500 dark:text-slate-400">محرمانگی کامل پرونده</span>
            </div>
          )}

          <h3 className={`${isMicro ? 'text-sm sm:text-base' : isCompact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-black text-stone-900 dark:text-white tracking-tight truncate`}>
            {generalShowcase.sectionTitle || 'ویترین خدمات مشاوره عمومی و کلینیک روان‌شناختی'}
          </h3>

          {!isCompact && generalShowcase.sectionSubtitle && (
            <p className="text-xs text-stone-500 dark:text-slate-400 max-w-3xl leading-relaxed">
              {generalShowcase.sectionSubtitle}
            </p>
          )}
        </div>

        {/* Interactive Toolbar Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto">
          {canEditShowcase && (
            <>
              <button
                type="button"
                onClick={handleQuickToggleScale}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title={isCompact ? 'بزرگ‌تر کردن اندازه ویترین' : 'کوچک‌تر کردن اندازه ویترین'}
              >
                {isCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                <span>{isCompact ? 'اندازه عادی' : 'کوچک‌تر'}</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-950 dark:text-amber-200 text-xs font-black transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>تنظیمات ویترین</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onNavigateToGeneral}
            className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 ${isMicro ? 'px-3 py-2 text-[11px]' : 'px-4 py-2.5 sm:py-2 text-xs'} rounded-xl bg-stone-900 hover:bg-black dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0`}
          >
            <span>میز خدمات مشاوره</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      {enabledPillars.length === 0 ? (
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-stone-500 font-bold">
            در حال حاضر هیچ‌یک از ۳ بخش این ویترین فعال نیست.
          </span>
          {canEditShowcase ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-black cursor-pointer"
            >
              فعال‌سازی بخش‌ها
            </button>
          ) : (
            <button
              type="button"
              onClick={onBookGeneralCounseling || onNavigateToGeneral}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-black cursor-pointer"
            >
              {generalShowcase.consultantCardCtaLabel || 'رزرو وقت مشاوره'}
            </button>
          )}
        </div>
      ) : displayMode === 'carousel' && activePillar ? (
        /* ================================================================
           SCHEDULED ROTATING SHOWCASE MODE (Airy Glass Stage, Zero Box Clutter)
           ================================================================ */
        <div className="space-y-3.5">
          {/* Interactive Segmented Pillar Navigation & Playback Controls */}
          {enabledPillars.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100/90 dark:bg-slate-800/80 overflow-x-auto scrollbar-none max-w-full">
                {enabledPillars.map((pillar, idx) => {
                  const meta = PILLAR_META[pillar];
                  const Icon = meta.icon;
                  const isActive = idx === safePillarIdx;
                  return (
                    <button
                      key={pillar}
                      type="button"
                      onClick={() => setActivePillarIdx(idx)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs font-black'
                          : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? meta.accentText : ''}`} />
                      <span>{isCompact ? meta.shortLabel : meta.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setManualPaused(p => !p)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 cursor-pointer"
                  title={manualPaused ? 'ادامه پخش زمان‌بندی‌شده' : 'توقف موقت چرخش'}
                >
                  {manualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePillarIdx(prev => (prev - 1 + enabledPillars.length) % enabledPillars.length)
                  }
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 cursor-pointer"
                  title="بخش قبلی"
                >
                  <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePillarIdx(prev => (prev + 1) % enabledPillars.length)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl sm:rounded-lg flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 cursor-pointer"
                  title="بخش بعدی"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Balanced Editorial Split: Optional Showcase Image + Animated Active Pillar Stage */}
          <div className={`grid grid-cols-1 ${showCoverPanel ? 'lg:grid-cols-12' : ''} gap-4 sm:gap-5 items-stretch`}>
            {showCoverPanel && (
              <div className={`lg:col-span-4 relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 ${isCompact ? 'min-h-[155px] sm:min-h-[180px]' : isExpanded ? 'min-h-[200px] sm:min-h-[290px]' : 'min-h-[175px] sm:min-h-[235px]'}`}>
                {!coverImgFailed ? (
                  <img
                    src={coverImageUrl}
                    alt={generalShowcase.sectionTitle || 'ویترین مشاوره عمومی'}
                    referrerPolicy="no-referrer"
                    onError={() => setCoverImgFailed(true)}
                    className="w-full h-full object-cover lg:absolute lg:inset-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-200/70">
                    <HeartHandshake className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
                <div className="relative lg:absolute lg:inset-x-0 lg:bottom-0 p-4 text-white space-y-2 z-10 flex flex-col justify-end h-full">
                  <div className="text-xs font-black text-emerald-300">
                    همراهی تخصصی و محرمانه
                  </div>
                  <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed">
                    کارگاه‌های مهارتی، دوره‌های روان‌شناسی و نوبت‌دهی مستقیم مشاورین مرکز
                  </p>
                  <button
                    type="button"
                    onClick={() => (onBookGeneralCounseling || onNavigateToGeneral)?.()}
                    className="self-start px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-stone-900 text-[11px] font-black transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{generalShowcase.consultantCardCtaLabel || 'رزرو وقت مشاوره'}</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div className={showCoverPanel ? 'lg:col-span-8 flex flex-col justify-between' : 'flex flex-col justify-between'}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePillar}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full"
                >
                  {activePillar === 'workshops' && renderWorkshopsPillar(false)}
                  {activePillar === 'announcements' && renderAnnouncementsPillar(false)}
                  {activePillar === 'consultants' && renderConsultantsPillar()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      ) : (
        /* ================================================================
           SIMULTANEOUS COLUMN GRID MODE (Clean Hairline Separators, No Cluttered Cards)
           ================================================================ */
        <div
          className={`grid gap-6 items-stretch ${
            enabledPillars.length === 1
              ? 'grid-cols-1'
              : enabledPillars.length === 2
              ? 'grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-x-reverse lg:divide-stone-200/70 dark:lg:divide-slate-800/80'
              : 'grid-cols-1 lg:grid-cols-3 lg:divide-x lg:divide-x-reverse lg:divide-stone-200/70 dark:lg:divide-slate-800/80'
          }`}
        >
          {showWorkshops && (
            <div className={enabledPillars.length > 1 ? 'lg:pl-5' : ''}>
              {renderWorkshopsPillar(true)}
            </div>
          )}
          {showAnnouncements && (
            <div className={enabledPillars.length > 1 ? 'lg:px-5' : ''}>
              {renderAnnouncementsPillar(true)}
            </div>
          )}
          {showConsultants && (
            <div className={enabledPillars.length > 1 ? 'lg:pr-5' : ''}>
              {renderConsultantsPillar()}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL A: WORKSHOP DETAILS + REGISTRATION + ARCHIVE DOWNLOADS
         ==================================================================== */}
      {liveSelectedWorkshop && (
        <div
          className="fixed inset-0 z-[75] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          dir="rtl"
          onClick={() => setSelectedWorkshop(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-2xl overflow-hidden text-xs max-h-[88vh] flex flex-col"
          >
            {liveSelectedWorkshop.bannerUrl && (
              <div className="h-44 w-full bg-stone-900 relative overflow-hidden shrink-0">
                <img
                  src={liveSelectedWorkshop.bannerUrl}
                  alt={liveSelectedWorkshop.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              </div>
            )}

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-[11px] font-black mb-1 ${liveSelectedWorkshop.mode === 'upcoming' ? 'text-emerald-700' : 'text-indigo-700'}`}>
                    {liveSelectedWorkshop.mode === 'upcoming' ? 'کارگاه آموزشی پیش‌رو' : 'آرشیو جلسه برگزارشده'}
                  </div>
                  <h4 className="text-base font-black text-stone-900 dark:text-white">
                    {liveSelectedWorkshop.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1">
                    {liveSelectedWorkshop.presenter ? `مدرس: ${liveSelectedWorkshop.presenter}` : ''}
                    {liveSelectedWorkshop.presenter && liveSelectedWorkshop.scheduleText ? ' · ' : ''}
                    {liveSelectedWorkshop.scheduleText || ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWorkshop(null)}
                  className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {liveSelectedWorkshop.description && (
                <p className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/50 text-stone-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {liveSelectedWorkshop.description}
                </p>
              )}

              {(liveSelectedWorkshop.mediaFiles || []).length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-black text-stone-900 dark:text-white">
                    فایل‌های جلسه و منابع قابل دریافت:
                  </h5>
                  <div className="divide-y divide-stone-200 dark:divide-slate-800">
                    {(liveSelectedWorkshop.mediaFiles || []).map(mf => {
                      const safe = isSafeHttpUrl(mf.url);
                      return (
                        <div
                          key={mf.id}
                          className="py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {mf.mediaType === 'audio' ? (
                              <FileAudio className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : mf.mediaType === 'video' ? (
                              <FileVideo className="w-4 h-4 text-indigo-600 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-stone-900 dark:text-white truncate">{mf.title}</div>
                              <div className="text-[10px] text-stone-500">
                                {mf.sourceType === 'disk' ? 'میزبانی روی سرور مرکز' : 'لینک دانلود خارجی'}
                                {mf.durationOrSize ? ` · ${mf.durationOrSize}` : ''}
                              </div>
                            </div>
                          </div>

                          {safe && (
                            <a
                              href={mf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={mf.sourceType === 'disk' ? mf.title : undefined}
                              className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1 shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>دریافت فایل</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-2">
              {liveSelectedWorkshop.mode === 'upcoming' ? (
                <div className="flex flex-wrap items-center gap-2">
                  {registeredWorkshopIds.has(liveSelectedWorkshop.id) ? (
                    <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ثبت‌نام شما با موفقیت ثبت شده است</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={registeringWsId === liveSelectedWorkshop.id}
                      onClick={() => handleWorkshopRegister(liveSelectedWorkshop.id)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {registeringWsId === liveSelectedWorkshop.id
                          ? 'در حال ثبت‌نام...'
                          : 'ثبت‌نام در کارگاه'}
                      </span>
                    </button>
                  )}

                  {isSafeHttpUrl(liveSelectedWorkshop.registrationUrl) && (
                    <a
                      href={liveSelectedWorkshop.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>لینک جلسه / ثبت‌نام</span>
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-stone-500">آرشیو آموزشی قابل استفاده اعضای مرکز</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedWorkshop(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL B: ANNOUNCEMENT ENLARGED POSTER LIGHTBOX
         ==================================================================== */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-[75] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          dir="rtl"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-2xl overflow-hidden text-xs max-h-[92vh] flex flex-col"
          >
            <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black ${
                    selectedAnnouncement.organizerType === 'external'
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {selectedAnnouncement.organizerType === 'external' ? 'دوره برون‌مرکزی' : 'دوره داخلی مرکز'}
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <h4 className="font-black text-sm text-stone-900 dark:text-white">
                  {selectedAnnouncement.title || 'پوستر اطلاعیه دوره روان‌شناسی'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {selectedAnnouncement.bannerUrl && (
                <div className="rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-950 flex items-center justify-center">
                  <img
                    src={selectedAnnouncement.bannerUrl}
                    alt={selectedAnnouncement.title || 'پوستر دوره'}
                    className="max-h-[62vh] w-auto object-contain mx-auto"
                  />
                </div>
              )}

              {(selectedAnnouncement.subtitle ||
                selectedAnnouncement.scheduleText ||
                selectedAnnouncement.description ||
                (selectedAnnouncement.topics || []).length > 0) && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/40 space-y-2.5">
                  {selectedAnnouncement.subtitle && (
                    <div className="font-bold text-stone-800 dark:text-slate-200">
                      {selectedAnnouncement.subtitle}
                    </div>
                  )}
                  {selectedAnnouncement.scheduleText && (
                    <div className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedAnnouncement.scheduleText}</span>
                    </div>
                  )}
                  {selectedAnnouncement.description && (
                    <p className="text-stone-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {selectedAnnouncement.description}
                    </p>
                  )}
                  {(selectedAnnouncement.topics || []).length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {(selectedAnnouncement.topics || []).map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-stone-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-stone-50 dark:bg-slate-950/50">
              {isSafeHttpUrl(selectedAnnouncement.externalUrl) ? (
                <a
                  href={selectedAnnouncement.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>مشاهده لینک دوره / ثبت‌نام</span>
                </a>
              ) : (
                <span className="text-[11px] text-stone-500">اطلاع‌رسانی دوره‌های روان‌شناسی مرکز</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL C: ADMIN / PSYCHOLOGIST SHOWCASE EDITOR
         ==================================================================== */}
      {canEditShowcase && (
        <CounselingGeneralShowcaseEditorModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </section>
  );
};

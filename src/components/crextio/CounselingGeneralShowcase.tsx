import React, { useState, useMemo } from 'react';
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
  Lock,
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
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CounselingGeneralShowcaseProps {
  span?: 'full' | 'half';
  scale?: 'micro' | 'compact' | 'normal' | 'expanded';
  onNavigateToGeneral?: () => void;
  onBookGeneralCounseling?: () => void;
  onOpenQuickEdit?: () => void;
}

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
  scale = 'normal',
  onNavigateToGeneral,
  onBookGeneralCounseling,
}) => {
  const {
    currentUser,
    consultants,
    crextioConfig,
    generalShowcase,
    registerInWorkshop,
    isAlumniPreview,
  } = useApp();

  const canEditShowcase =
    Boolean(currentUser?.role && SHOWCASE_EDITOR_ROLES.has(currentUser.role)) &&
    !isAlumniPreview;

  const [editorOpen, setEditorOpen] = useState(false);
  const [workshopFilter, setWorkshopFilter] = useState<'all' | 'upcoming' | 'archive'>('all');
  const [selectedWorkshop, setSelectedWorkshop] = useState<CounselingWorkshopItem | null>(null);
  const [registeringWsId, setRegisteringWsId] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<CounselingAnnouncementItem | null>(null);
  const [consultantIdx, setConsultantIdx] = useState(0);

  const fallbackAvatarUrl = resolveShowcaseImageUrl(
    'hero_portrait',
    crextioConfig.showcaseImageOverrides
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

  const activeWorkshops = useMemo(
    () =>
      (generalShowcase.workshops || [])
        .filter(w => {
          if (w.isActive === false) return false;
          if (workshopFilter === 'upcoming') return w.mode === 'upcoming';
          if (workshopFilter === 'archive') return w.mode === 'archive';
          return true;
        })
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [generalShowcase.workshops, workshopFilter]
  );

  const activeAnnouncements = useMemo(
    () =>
      (generalShowcase.announcements || [])
        .filter(a => a.isActive !== false)
        .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0)),
    [generalShowcase.announcements]
  );

  // Sync currently open workshop modal with latest registration state from context
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
  const activeCardsCount = [showWorkshops, showAnnouncements, showConsultants].filter(Boolean).length;

  const gridColsClass =
    activeCardsCount === 1
      ? 'grid-cols-1'
      : activeCardsCount === 2
      ? 'grid-cols-1 lg:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  const isCompact = scale === 'micro' || scale === 'compact';

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

  return (
    <section
      className={`w-full rounded-[28px] bg-white/85 backdrop-blur-xl border border-stone-200/90 shadow-sm overflow-hidden text-stone-900 ${
        isCompact ? 'p-4 sm:p-5 space-y-4' : 'p-5 sm:p-7 space-y-5'
      }`}
      dir="rtl"
    >
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
              <span>{generalShowcase.sectionBadge || 'بخش مشاوره عمومی و خدمات روان‌شناختی'}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>محرمانگی کامل پرونده</span>
            </span>
          </div>

          <h3 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">
            {generalShowcase.sectionTitle || 'ویترین خدمات مشاوره عمومی و کلینیک روان‌شناختی'}
          </h3>
          {!isCompact && generalShowcase.sectionSubtitle && (
            <p className="text-xs text-stone-600 max-w-3xl leading-relaxed">
              {generalShowcase.sectionSubtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canEditShowcase && (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-black transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>مدیریت ۳ بخش ویترین</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToGeneral}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>میز خدمات مشاوره عمومی</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Adaptive 1 / 2 / 3 Glassmorphic Card Grid */}
      {activeCardsCount === 0 ? (
        <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-stone-600 font-bold">
            در حال حاضر تمام بخش‌های نمایشی این ویترین غیرفعال شده‌اند.
          </span>
          {canEditShowcase ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-black cursor-pointer"
            >
              فعال‌سازی کارت‌ها
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
      ) : (
        <div className={`grid ${gridColsClass} gap-4 sm:gap-5 items-stretch`}>
          {/* ================================================================
              CARD 1: WORKSHOPS & ARCHIVE
             ================================================================ */}
          {showWorkshops && (
            <div className="rounded-3xl bg-gradient-to-b from-emerald-50/75 via-white to-white border border-emerald-200/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-stone-900">
                        {generalShowcase.workshopsCardTitle || 'کارگاه‌های آموزشی و آرشیو جلسات'}
                      </h4>
                      {generalShowcase.workshopsCardSubtitle && (
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {generalShowcase.workshopsCardSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upcoming vs Archive Filter Pill Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100/90 border border-stone-200/70 text-[11px] font-bold">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'upcoming', label: 'پیش‌رو' },
                    { id: 'archive', label: 'آرشیو جلسات' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setWorkshopFilter(tab.id as any)}
                      className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                        workshopFilter === tab.id
                          ? 'bg-white text-emerald-900 shadow-2xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Workshop Items List */}
                <div className="space-y-2 max-h-[290px] overflow-y-auto pl-0.5">
                  {activeWorkshops.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-500">
                      هنوز کارگاه یا جلسه آرشیوی در این بخش ثبت نشده است.
                    </div>
                  ) : (
                    activeWorkshops.map(ws => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => setSelectedWorkshop(ws)}
                        className="w-full text-right p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border border-stone-200/90 hover:border-emerald-300 transition-all flex items-start gap-3 cursor-pointer group"
                      >
                        {ws.bannerUrl ? (
                          <img
                            src={ws.bannerUrl}
                            alt={ws.title}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            {ws.mode === 'upcoming' ? (
                              <Calendar className="w-5 h-5" />
                            ) : (
                              <FileAudio className="w-5 h-5" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                ws.mode === 'upcoming'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-indigo-100 text-indigo-900'
                              }`}
                            >
                              {ws.mode === 'upcoming' ? 'ثبت‌نام کارگاه' : 'آرشیو قابل دانلود'}
                            </span>
                            {registeredWorkshopIds.has(ws.id) && (
                              <span className="text-[10px] font-black text-emerald-700 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                ثبت‌نام‌شده
                              </span>
                            )}
                          </div>
                          <div className="font-black text-xs text-stone-900 group-hover:text-emerald-900 truncate">
                            {ws.title}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate">
                            {ws.presenter ? `${ws.presenter}` : ''}
                            {ws.presenter && ws.scheduleText ? ' · ' : ''}
                            {ws.scheduleText || ''}
                            {(ws.mediaFiles || []).length > 0
                              ? ` (${toPersianNumbers((ws.mediaFiles || []).length)} فایل)`
                              : ''}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>کلیک روی هر مورد برای ثبت‌نام یا دانلود</span>
                <span className="font-bold text-emerald-800 tabular-nums">
                  {toPersianNumbers(activeWorkshops.length)} عنوان
                </span>
              </div>
            </div>
          )}

          {/* ================================================================
              CARD 2: ANNOUNCEMENTS (WITH POSTER LIGHTBOX)
             ================================================================ */}
          {showAnnouncements && (
            <div className="rounded-3xl bg-gradient-to-b from-amber-50/75 via-white to-white border border-amber-200/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-stone-900">
                      {generalShowcase.announcementsCardTitle || 'اطلاعیه‌های دوره‌های روان‌شناسی'}
                    </h4>
                    {generalShowcase.announcementsCardSubtitle && (
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        {generalShowcase.announcementsCardSubtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pl-0.5">
                  {activeAnnouncements.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-500">
                      هنوز اطلاعیه جدیدی منتشر نشده است.
                    </div>
                  ) : (
                    activeAnnouncements.map(ann => (
                      <button
                        key={ann.id}
                        type="button"
                        onClick={() => setSelectedAnnouncement(ann)}
                        className="w-full text-right rounded-2xl bg-white hover:bg-amber-50/40 border border-stone-200/90 hover:border-amber-300 overflow-hidden transition-all cursor-pointer group"
                      >
                        {ann.bannerUrl && (
                          <div className="relative h-32 w-full bg-stone-100 overflow-hidden">
                            <img
                              src={ann.bannerUrl}
                              alt={ann.title || 'پوستر اطلاعیه روان‌شناسی'}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            />
                            <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/65 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                              <Maximize2 className="w-3 h-3" />
                              بزرگ‌نمایی
                            </span>
                            <span
                              className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                ann.organizerType === 'external'
                                  ? 'bg-indigo-900/90 text-white'
                                  : 'bg-emerald-900/90 text-white'
                              }`}
                            >
                              {ann.organizerType === 'external' ? 'دوره برون‌مرکزی' : 'دوره داخلی مرکز'}
                            </span>
                          </div>
                        )}
                        {(ann.title || ann.scheduleText || !ann.bannerUrl) && (
                          <div className="p-3 space-y-1">
                            {!ann.bannerUrl && (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black mb-1 ${
                                  ann.organizerType === 'external'
                                    ? 'bg-indigo-100 text-indigo-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                {ann.organizerType === 'external' ? 'دوره برون‌مرکزی' : 'دوره داخلی مرکز'}
                              </span>
                            )}
                            <div className="font-black text-xs text-stone-900 truncate">
                              {ann.title || 'اطلاعیه تصویری دوره روان‌شناسی'}
                            </div>
                            {ann.scheduleText && (
                              <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{ann.scheduleText}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>کلیک روی پوستر جهت بزرگ‌نمایی و جزئیات</span>
                <span className="font-bold text-amber-800 tabular-nums">
                  {toPersianNumbers(activeAnnouncements.length)} اطلاعیه
                </span>
              </div>
            </div>
          )}

          {/* ================================================================
              CARD 3: FEATURED CONSULTANTS + DIRECT BOOKING CTA
             ================================================================ */}
          {showConsultants && (
            <div className="rounded-3xl bg-gradient-to-b from-rose-50/75 via-white to-white border border-rose-200/80 p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-rose-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-stone-900">
                        {generalShowcase.consultantCardTitle || 'مشاورین مرکز و رزرو نوبت'}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        آشنایی با روان‌شناسان مرکز و رزرو مستقیم نوبت مشاوره
                      </p>
                    </div>
                  </div>

                  {featuredConsultants.length > 1 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setConsultantIdx(i => (i - 1 + featuredConsultants.length) % featuredConsultants.length)
                        }
                        className="p-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-stone-700 cursor-pointer"
                        title="مشاور قبلی"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConsultantIdx(i => (i + 1) % featuredConsultants.length)}
                        className="p-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-stone-700 cursor-pointer"
                        title="مشاور بعدی"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {currentConsultant ? (
                  <div className="p-4 rounded-2xl bg-white border border-rose-100/90 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={currentConsultant.avatarUrl || fallbackAvatarUrl}
                        alt={currentConsultant.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-2xl object-cover object-top border border-rose-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="font-black text-sm text-stone-900 truncate">
                          {currentConsultant.name}
                        </div>
                        <div className="text-xs font-bold text-rose-800 truncate">
                          {currentConsultant.specialty || currentConsultant.title}
                        </div>
                        <div className="text-[11px] text-stone-500 truncate">
                          {currentConsultant.availability || currentConsultant.academicRank}
                        </div>
                      </div>
                    </div>

                    {(currentConsultant.bio || currentConsultant.title) && (
                      <p className="text-xs text-stone-600 line-clamp-1 pt-2 border-t border-rose-100">
                        {currentConsultant.bio || currentConsultant.title}
                      </p>
                    )}

                    {featuredConsultants.length > 1 && (
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        {featuredConsultants.map((c, idx) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setConsultantIdx(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${
                              idx === consultantIdx % featuredConsultants.length
                                ? 'w-5 bg-rose-700'
                                : 'w-1.5 bg-rose-200 hover:bg-rose-300'
                            }`}
                            aria-label={c.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white border border-rose-100 text-xs text-stone-500 text-center">
                    مشاورین کلینیک از پنل مدیریت قابل معرفی هستند.
                  </div>
                )}
              </div>

              {/* Direct Booking CTA directly under the consultant card */}
              <button
                type="button"
                onClick={() => (onBookGeneralCounseling || onNavigateToGeneral)?.()}
                className="w-full py-3 px-4 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{generalShowcase.consultantCardCtaLabel || 'رزرو وقت مشاوره'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
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
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black mb-1.5 ${
                      liveSelectedWorkshop.mode === 'upcoming'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-indigo-100 text-indigo-900'
                    }`}
                  >
                    {liveSelectedWorkshop.mode === 'upcoming' ? 'کارگاه آموزشی پیش‌رو' : 'آرشیو جلسه برگزارشده'}
                  </span>
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

              {/* Media Files (Disk or External Links) */}
              {(liveSelectedWorkshop.mediaFiles || []).length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-black text-stone-900 dark:text-white">
                    فایل‌های جلسه و منابع قابل دریافت:
                  </h5>
                  <div className="space-y-2">
                    {(liveSelectedWorkshop.mediaFiles || []).map(mf => {
                      const safe = isSafeHttpUrl(mf.url);
                      return (
                        <div
                          key={mf.id}
                          className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-2"
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
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                    selectedAnnouncement.organizerType === 'external'
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {selectedAnnouncement.organizerType === 'external' ? 'دوره برون‌مرکزی' : 'دوره داخلی مرکز'}
                </span>
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
                <div className="rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 flex items-center justify-center">
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
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200 dark:border-slate-800 space-y-2.5">
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
          MODAL C: ADMIN / PSYCHOLOGIST 3-SECTION SHOWCASE EDITOR
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

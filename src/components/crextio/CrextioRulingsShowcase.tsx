import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { JudicialRuling } from '../../types';
import { resolveShowcaseImageUrl } from '../../data/showcaseImages';
import { RulingsShowcaseEditModal } from './RulingsShowcaseEditModal';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { canManageRulingsRole, getRulingTagStyleClasses } from '../rulings/rulingTypesAndTags';
import {
  Scale,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  X,
  Send,
  Eye,
  Flame,
  Edit3,
  Pause,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Award,
} from 'lucide-react';

interface CrextioRulingsShowcaseProps {
  onNavigateToRulings?: () => void;
}

type ShowcaseTabKey = 'summary' | 'principles' | 'discussions' | 'fullText';

const DEFAULT_TAB_LABELS: Record<ShowcaseTabKey, string> = {
  summary: 'چکیده استنباط',
  principles: 'مستندات و قواعد فقهی',
  discussions: 'نقدها و مباحثات',
  fullText: 'متن دادنامه',
};

export const CrextioRulingsShowcase: React.FC<CrextioRulingsShowcaseProps> = ({
  onNavigateToRulings,
}) => {
  const {
    rulings,
    rulingsPortalConfig,
    toggleRulingLike,
    toggleRulingDislike,
    addRulingDiscussion,
    currentUser,
    crextioConfig,
    updateCrextioConfig,
    isAlumniPreview,
  } = useApp();

  const isAdmin = canManageRulingsRole(currentUser?.role) && !isAlumniPreview;

  const contentMode = crextioConfig.rulingsShowcaseContentMode || 'tabbed';
  const showLikes = crextioConfig.rulingsShowLikesInShowcase !== false;
  const showDislikes = crextioConfig.rulingsShowDislikesInShowcase !== false;
  const showComments = crextioConfig.rulingsShowCommentsInShowcase !== false;

  const visibleTabs: ShowcaseTabKey[] = useMemo(() => {
    const raw = crextioConfig.rulingsShowcaseVisibleTabs;
    const base: ShowcaseTabKey[] =
      Array.isArray(raw) && raw.length > 0
        ? (raw as ShowcaseTabKey[])
        : ['summary', 'principles', 'discussions', 'fullText'];
    return showComments ? base : base.filter(t => t !== 'discussions');
  }, [crextioConfig.rulingsShowcaseVisibleTabs, showComments]);

  const tabLabels = useMemo(
    () => ({
      ...DEFAULT_TAB_LABELS,
      ...(crextioConfig.rulingsShowcaseTabLabels || {}),
    }),
    [crextioConfig.rulingsShowcaseTabLabels]
  );

  // Sync live DB stats/visibility onto custom list when custom list references existing rulings
  const baseRulings = useMemo(() => {
    const liveMap = new Map<string, JudicialRuling>(rulings.map(r => [r.id, r]));
    const source: JudicialRuling[] =
      crextioConfig.rulingsCustomList && crextioConfig.rulingsCustomList.length > 0
        ? crextioConfig.rulingsCustomList.map(custom => {
            const live = liveMap.get(custom.id);
            if (!live) return custom;
            return {
              ...custom,
              likesCount: live.likesCount,
              likedBy: live.likedBy,
              dislikesCount: live.dislikesCount,
              dislikedBy: live.dislikedBy,
              discussions: live.discussions,
              commentsEnabled: live.commentsEnabled,
              isSystemPick: live.isSystemPick ?? custom.isSystemPick,
              publicLabels: live.publicLabels ?? custom.publicLabels,
              isVisibleToAlumni: live.isVisibleToAlumni ?? custom.isVisibleToAlumni,
              status: live.status ?? custom.status,
            };
          })
        : rulings;

    const sorted = [...source].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    if (isAdmin) return sorted;
    return sorted
      .filter(r => r.status === 'selected' && r.isVisibleToAlumni !== false)
      .map(r => {
        const { adminTags: _a, internalReviewNote: _n, ...safe } = r;
        return safe;
      });
  }, [crextioConfig.rulingsCustomList, rulings, isAdmin]);

  const showcaseRulings = useMemo(() => {
    const selectedIds = crextioConfig.rulingsSelectedIds;
    if (Array.isArray(selectedIds) && selectedIds.length > 0) {
      const filtered = baseRulings.filter(r => selectedIds.includes(r.id));
      if (filtered.length > 0) return filtered;
    }
    return baseRulings;
  }, [baseRulings, crextioConfig.rulingsSelectedIds]);

  const [selectedRuling, setSelectedRuling] = useState<JudicialRuling | null>(
    () => showcaseRulings[0] || null
  );
  const [activeTab, setActiveTab] = useState<ShowcaseTabKey>(visibleTabs[0] || 'summary');
  const [newComment, setNewComment] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [fullModalRuling, setFullModalRuling] = useState<JudicialRuling | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab]);

  const currentActive =
    (selectedRuling && showcaseRulings.find(r => r.id === selectedRuling.id)) ||
    showcaseRulings[0] ||
    null;

  const liveModalRuling = useMemo(
    () =>
      fullModalRuling
        ? showcaseRulings.find(r => r.id === fullModalRuling.id) || fullModalRuling
        : null,
    [fullModalRuling, showcaseRulings]
  );

  const mode = crextioConfig.rulingsShowcaseMode || 'expanded';
  const isCompact = mode === 'compact';
  const isSummaryCarousel = mode === 'summary_carousel';
  const intervalSeconds = Math.max(2, Number(crextioConfig.rulingsShowcaseIntervalSeconds) || 5);
  const summaryAutoplay = crextioConfig.rulingsSummaryAutoplay !== false;
  const coverImage =
    crextioConfig.rulingsShowcaseBgImage ||
    resolveShowcaseImageUrl('rulings_showcase', crextioConfig.showcaseImageOverrides);

  useEffect(() => {
    if (!isSummaryCarousel || !summaryAutoplay || isPaused || showcaseRulings.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIdx(prev => (prev + 1) % showcaseRulings.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [isSummaryCarousel, summaryAutoplay, isPaused, showcaseRulings.length, intervalSeconds]);

  const safeCarouselIdx = carouselIdx >= showcaseRulings.length ? 0 : carouselIdx;
  const currentCarouselRuling = showcaseRulings[safeCarouselIdx] || showcaseRulings[0];

  const titleFontSize = crextioConfig.fontSizes?.rulingsTitle || 'text-lg';
  const bodyFontSize = crextioConfig.fontSizes?.rulingsBody || 'text-xs';

  const canPostCommentOnActive = Boolean(
    currentActive &&
      rulingsPortalConfig.globalCommentsEnabled !== false &&
      currentActive.commentsEnabled !== false
  );

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentActive || !newComment.trim() || !canPostCommentOnActive) return;
    await addRulingDiscussion(currentActive.id, newComment.trim());
    setNewComment('');
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 3000);
  };

  const renderReactions = (ruling: JudicialRuling, compactBtns = false) => {
    if (!showLikes && !showDislikes && !showComments) return null;
    const liked = (ruling.likedBy || []).includes(currentUser?.id || '');
    const disliked = (ruling.dislikedBy || []).includes(currentUser?.id || '');
    const discCount = ruling.discussions?.length || 0;

    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {showLikes && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              toggleRulingLike(ruling.id);
            }}
            className={`flex items-center gap-1 ${
              compactBtns ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            } rounded-xl border font-bold transition-colors cursor-pointer ${
              liked
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-stone-50 hover:bg-emerald-50 text-stone-700 border-stone-200'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="tabular-nums">{toPersianNumbers(ruling.likesCount || 0)}</span>
          </button>
        )}

        {showDislikes && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              toggleRulingDislike(ruling.id);
            }}
            className={`flex items-center gap-1 ${
              compactBtns ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            } rounded-xl border font-bold transition-colors cursor-pointer ${
              disliked
                ? 'bg-rose-700 text-white border-rose-800'
                : 'bg-stone-50 hover:bg-rose-50 text-stone-700 border-stone-200'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span className="tabular-nums">{toPersianNumbers(ruling.dislikesCount || 0)}</span>
          </button>
        )}

        {showComments && (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-[11px] px-1.5 tabular-nums">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{toPersianNumbers(discCount)} نظر</span>
          </span>
        )}
      </div>
    );
  };

  const renderPublicBadges = (ruling: JudicialRuling) => {
    if (!ruling.isSystemPick && !(ruling.publicLabels && ruling.publicLabels.length > 0)) {
      return null;
    }
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {ruling.isSystemPick && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-700 text-white text-[10px] font-bold">
            <Award className="w-3 h-3" />
            <span>برگزیده سامانه</span>
          </span>
        )}
        {(ruling.publicLabels || []).map(lbl => (
          <span
            key={lbl}
            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${getRulingTagStyleClasses(
              lbl,
              rulingsPortalConfig.publicLabelDefinitions,
              'emerald'
            )}`}
          >
            {lbl}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className="w-full space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative rounded-[32px] overflow-hidden border border-[#E5E0D0] bg-[#FCFBF8] shadow-md">
        <div className="relative z-10 px-6 py-5 border-b border-[#ECE7DA] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/60 via-white/80 to-emerald-50/40 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shadow-xs">
                <Scale className="w-4 h-4 stroke-[2.3]" />
              </span>
              <span className="text-xs font-black text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/80">
                {crextioConfig.rulingsShowcaseBadge || 'تالار مناظره و نقد آراء منتخب'}
              </span>
              <span className="text-[11px] text-stone-500 font-bold hidden sm:inline-flex items-center gap-1 tabular-nums">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                {toPersianNumbers(showcaseRulings.length)} دادنامه منتخب در ویترین
              </span>
            </div>
            <h3 className={`${titleFontSize} font-black text-stone-900 tracking-tight`}>
              {crextioConfig.rulingsShowcaseTitle ||
                'تالار نقد، ارزیابی و مباحثه آراء و دادنامه‌های قضایی'}
            </h3>
            <p className={`${bodyFontSize} text-stone-600 font-medium`}>
              {crextioConfig.rulingsShowcaseSubtitle ||
                'میدان تحلیل رویه‌های قضایی، آراء وحدت رویه و نقدهای حقوقی مستند دانش‌آموختگان نخبه'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                <span>ویرایش و تنظیم ویترین آراء</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToRulings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>{crextioConfig.rulingsPrimaryBtnText || 'ورود به تالار جامع آراء'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showcaseRulings.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-500">
            در حال حاضر رأی منتشرشده‌ای در ویترین قرار نگرفته است.
          </div>
        ) : isSummaryCarousel && currentCarouselRuling ? (
          /* -------------------- MODE 1: SUMMARY CAROUSEL -------------------- */
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-stretch bg-white/95">
            {coverImage && (
              <div className="lg:col-span-4 relative min-h-[210px] overflow-hidden bg-stone-900">
                <img
                  src={coverImage}
                  alt={currentCarouselRuling.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-white space-y-1">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    {currentCarouselRuling.caseTypeTitle} · {currentCarouselRuling.rulingDate}
                  </span>
                  <div className="text-xs font-black line-clamp-1">
                    {currentCarouselRuling.courtBranch}
                  </div>
                  <div className="text-[11px] text-stone-300">
                    انشاء: {currentCarouselRuling.judgeName}
                  </div>
                </div>
              </div>
            )}

            <div
              className={`${
                coverImage ? 'lg:col-span-8' : 'lg:col-span-12'
              } p-5 sm:p-6 flex flex-col justify-between gap-4`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCarouselRuling.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-stone-500">
                    <span className="tabular-nums">
                      گزیده رأی {toPersianNumbers(safeCarouselIdx + 1)} از{' '}
                      {toPersianNumbers(showcaseRulings.length)} · هر{' '}
                      {toPersianNumbers(intervalSeconds)} ثانیه
                    </span>
                    {renderPublicBadges(currentCarouselRuling)}
                  </div>

                  <h4 className="text-base sm:text-xl font-black text-stone-900 leading-snug">
                    {currentCarouselRuling.title}
                  </h4>

                  {contentMode !== 'title_only' && currentCarouselRuling.summary && (
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-2xl">
                      {currentCarouselRuling.summary}
                    </p>
                  )}

                  {contentMode === 'tabbed' &&
                    currentCarouselRuling.legalPrinciples &&
                    currentCarouselRuling.legalPrinciples.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {currentCarouselRuling.legalPrinciples.slice(0, 3).map((pr, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-700"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{pr}</span>
                          </span>
                        ))}
                      </div>
                    )}
                </motion.div>
              </AnimatePresence>

              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFullModalRuling(currentCarouselRuling)}
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>مشاهده کامل و نقد</span>
                  </button>
                  {renderReactions(currentCarouselRuling)}
                </div>

                {showcaseRulings.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaused(p => !p)}
                      className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 cursor-pointer"
                      title={isPaused ? 'ادامه پخش خودکار' : 'توقف'}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCarouselIdx(p => (p - 1 + showcaseRulings.length) % showcaseRulings.length)
                      }
                      className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCarouselIdx(p => (p + 1) % showcaseRulings.length)}
                      className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isCompact ? (
          /* -------------------- MODE 2: COMPACT GRID -------------------- */
          <div className="relative z-10 p-5 sm:p-6 bg-white/95">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showcaseRulings.map(ruling => (
                <div
                  key={ruling.id}
                  className="p-4 rounded-2xl bg-[#FBF9F4] hover:bg-amber-50/50 border border-stone-200/90 hover:border-amber-300 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="font-bold text-amber-900">{ruling.courtBranch || ruling.caseTypeTitle}</span>
                      <span className="font-mono tabular-nums">{ruling.rulingDate}</span>
                    </div>

                    {renderPublicBadges(ruling)}

                    <h4 className="font-black text-xs sm:text-sm text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2 leading-snug">
                      {ruling.title}
                    </h4>

                    {contentMode !== 'title_only' && (
                      <p className="text-[11px] text-stone-600 font-medium line-clamp-2 leading-relaxed">
                        {ruling.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2 text-xs">
                    {renderReactions(ruling, true)}

                    <button
                      type="button"
                      onClick={() => setFullModalRuling(ruling)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-bold text-stone-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <Eye className="w-3 h-3 text-stone-500" />
                      <span>مشاهده</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* -------------------- MODE 3: EXPANDED SPLIT STAGE -------------------- */
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left List */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-l border-[#ECE7DA] p-4 sm:p-5 space-y-3 bg-[#FAF8F2]/60">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black text-stone-700">
                  {crextioConfig.rulingsShowcaseSectionTitle || 'دادنامه‌های داغ و برگزیده'}
                </span>
                <span className="text-[10px] text-stone-500 font-semibold">برای مطالعه کلیک کنید</span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {showcaseRulings.map(ruling => {
                  const isSelected = currentActive?.id === ruling.id;
                  return (
                    <div
                      key={ruling.id}
                      onClick={() => setSelectedRuling(ruling)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/30'
                          : 'bg-white/80 hover:bg-white border-stone-200/90 hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] text-stone-500">
                        <span className="font-bold text-stone-700">{ruling.caseTypeTitle}</span>
                        <span className="font-mono tabular-nums">{ruling.rulingDate}</span>
                      </div>

                      {renderPublicBadges(ruling)}

                      <h4 className="text-xs sm:text-[13px] font-black text-stone-900 line-clamp-2 leading-snug">
                        {ruling.title}
                      </h4>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                        <span className="truncate max-w-[150px]">{ruling.courtBranch}</span>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          {showLikes && <span>{toPersianNumbers(ruling.likesCount || 0)} پسند</span>}
                          {showDislikes && <span>{toPersianNumbers(ruling.dislikesCount || 0)} مخالف</span>}
                          {showComments && (
                            <span>{toPersianNumbers(ruling.discussions?.length || 0)} نظر</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Active Reader Stage */}
            {currentActive && (
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-white/90">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                      <span>مرجع: <strong>{currentActive.courtBranch || '—'}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>دادرس: <strong>{currentActive.judgeName || '—'}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>ثبت: {currentActive.submittedByName}</span>
                    </div>

                    {renderPublicBadges(currentActive)}

                    <h3 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                      {currentActive.title}
                    </h3>
                  </div>

                  {contentMode === 'title_only' ? (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                      حالت نمایش خلاصه روی «عنوان آراء» تنظیم شده است؛ برای مطالعه متن دادنامه روی دکمه «مشاهده پرونده کامل» کلیک کنید.
                    </div>
                  ) : contentMode === 'title_summary' ? (
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 text-stone-800 leading-relaxed text-xs space-y-2">
                      <span className="font-bold text-amber-900 block">چکیده استنباط قضایی:</span>
                      <p className="font-medium text-stone-700 leading-loose">
                        {currentActive.summary || currentActive.fullRulingText}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Configurable Tabs (Reform 16) */}
                      {visibleTabs.length > 1 && (
                        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                          {visibleTabs.map(tKey => (
                            <button
                              key={tKey}
                              type="button"
                              onClick={() => setActiveTab(tKey)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                                activeTab === tKey
                                  ? 'bg-white text-stone-900 shadow-2xs'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              <span className="truncate">{tabLabels[tKey]}</span>
                              {tKey === 'discussions' && (
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black tabular-nums">
                                  {toPersianNumbers(currentActive.discussions?.length || 0)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {activeTab === 'summary' && visibleTabs.includes('summary') && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 text-stone-800 leading-relaxed text-xs space-y-2">
                          <span className="font-bold text-amber-900 block">{tabLabels.summary}:</span>
                          <p className="font-medium text-stone-700 leading-loose">
                            {currentActive.summary}
                          </p>
                        </div>
                      )}

                      {activeTab === 'principles' && visibleTabs.includes('principles') && (
                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                          <span className="font-bold text-stone-900 block">{tabLabels.principles}:</span>
                          <ul className="space-y-1.5 text-stone-700 list-disc list-inside">
                            {currentActive.legalPrinciples?.map((pr, idx) => (
                              <li key={idx} className="leading-relaxed font-medium">
                                {pr}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeTab === 'discussions' && visibleTabs.includes('discussions') && (
                        <div className="space-y-3">
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {currentActive.discussions && currentActive.discussions.length > 0 ? (
                              currentActive.discussions.map(disc => (
                                <div
                                  key={disc.id}
                                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-stone-900">{disc.authorName}</span>
                                    <span className="text-[10px] text-stone-400">{disc.authorRoleTitle}</span>
                                  </div>
                                  <p className="text-stone-700 text-[11px] leading-relaxed pt-1">
                                    {disc.comment}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-stone-400 text-xs">
                                هنوز نقدی برای این رأی ثبت نشده است.
                              </div>
                            )}
                          </div>

                          {canPostCommentOnActive ? (
                            <form
                              onSubmit={handlePostComment}
                              className="pt-2 border-t border-stone-200 flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="نقد حقوقی یا نظر مستند خود را بنویسید..."
                                className="flex-1 px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                              />
                              <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>ارسال نقد</span>
                              </button>
                            </form>
                          ) : (
                            <p className="text-[11px] text-stone-500">
                              ثبت دیدگاه جدید برای این رأی غیرفعال است.
                            </p>
                          )}
                          {commentSuccess && (
                            <span className="text-[11px] text-emerald-700 font-bold block">
                              نقد مستند شما با موفقیت ثبت گردید.
                            </span>
                          )}
                        </div>
                      )}

                      {activeTab === 'fullText' && visibleTabs.includes('fullText') && (
                        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs max-h-52 overflow-y-auto font-serif leading-loose whitespace-pre-line">
                          {currentActive.fullRulingText || currentActive.summary}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {renderReactions(currentActive)}

                  <button
                    type="button"
                    onClick={() => setFullModalRuling(currentActive)}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>مشاهده پرونده کامل</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Reading Full Ruling */}
      <AnimatePresence>
        {liveModalRuling && (
          <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-stone-200 shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto text-stone-900"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-stone-900 line-clamp-1">
                      {liveModalRuling.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {liveModalRuling.courtBranch} · دادرس: {liveModalRuling.judgeName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFullModalRuling(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {renderPublicBadges(liveModalRuling)}

              <div className="space-y-3 text-xs">
                {liveModalRuling.summary && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <span className="font-bold text-amber-900 block">چکیده مبدأ استنباط:</span>
                    <p className="text-stone-700 leading-relaxed">{liveModalRuling.summary}</p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 max-h-72 overflow-y-auto">
                  <span className="font-bold text-emerald-950 block">متن رسمی دادنامه:</span>
                  <p className="text-stone-700 font-serif leading-loose text-xs whitespace-pre-line">
                    {liveModalRuling.fullRulingText || liveModalRuling.summary}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-200 text-xs">
                {renderReactions(liveModalRuling)}

                <button
                  type="button"
                  onClick={() => {
                    setFullModalRuling(null);
                    if (onNavigateToRulings) onNavigateToRulings();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-colors cursor-pointer"
                >
                  ورود به تالار نقد و ثبت مباحثه تفصیلی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RulingsShowcaseEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        crextioConfig={crextioConfig}
        updateCrextioConfig={updateCrextioConfig}
        allRulings={rulings}
      />
    </div>
  );
};

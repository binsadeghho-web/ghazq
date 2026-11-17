import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { JudicialRuling } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { RulingUploadModal } from './RulingUploadModal';
import { RulingPortalDesignerModal } from './RulingPortalDesignerModal';
import { RulingDetailReader } from './RulingDetailReader';
import {
  canManageRulingsRole,
  CASE_TYPE_OPTIONS,
  formatPersianDateTime,
  getRulingTagStyleClasses,
} from './rulingTypesAndTags';
import {
  Scale,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  Plus,
  Search,
  Sliders,
  Award,
  ArrowUpDown,
  Lock,
  ArrowUp,
  ArrowDown,
  Eye,
} from 'lucide-react';

export const JudicialRulingsSection: React.FC = () => {
  const {
    currentUser,
    isAlumniPreview,
    rulings,
    rulingsPortalConfig,
    updateRulingsPortalConfig,
    submitRuling,
    updateRuling,
    reorderRulings,
    addRulingDiscussion,
    editRulingDiscussion,
    deleteRulingDiscussion,
    toggleRulingLike,
    toggleRulingDislike,
  } = useApp();

  const isOfficial = canManageRulingsRole(currentUser?.role) && !isAlumniPreview;

  const [activeTab, setActiveTab] = useState<'all_visible' | 'pending_or_hidden' | 'system_picks'>('all_visible');
  const [searchQuery, setSearchQuery] = useState('');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('all');
  const [adminTagFilter, setAdminTagFilter] = useState<string>('all');
  const [publicLabelFilter, setPublicLabelFilter] = useState<string>('all');

  const [selectedRulingId, setSelectedRulingId] = useState<string | null>(null);
  const [drawerRulingId, setDrawerRulingId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [designerModalOpen, setDesignerModalOpen] = useState(false);

  // Reform 17: Alumni NEVER see pending_review or hidden rulings
  const basePool = useMemo(() => {
    const sorted = [...rulings].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    if (isOfficial) return sorted;
    return sorted.filter(r => r.status === 'selected' && r.isVisibleToAlumni !== false);
  }, [rulings, isOfficial]);

  const publishedVisibleCount = useMemo(
    () => basePool.filter(r => r.status === 'selected' && r.isVisibleToAlumni !== false).length,
    [basePool]
  );

  const pendingOrHiddenCount = useMemo(
    () => basePool.filter(r => r.status !== 'selected' || r.isVisibleToAlumni === false).length,
    [basePool]
  );

  const systemPicksCount = useMemo(
    () => basePool.filter(r => r.isSystemPick).length,
    [basePool]
  );

  const totalDiscussions = useMemo(
    () => basePool.reduce((acc, r) => acc + (r.discussions?.length || 0), 0),
    [basePool]
  );

  const filteredRulings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return basePool.filter(r => {
      if (activeTab === 'all_visible') {
        if (isOfficial && (r.status !== 'selected' || r.isVisibleToAlumni === false)) return false;
      } else if (activeTab === 'pending_or_hidden') {
        if (!isOfficial) return false;
        if (r.status === 'selected' && r.isVisibleToAlumni !== false) return false;
      } else if (activeTab === 'system_picks') {
        if (!r.isSystemPick) return false;
      }

      if (caseTypeFilter !== 'all' && r.caseType !== caseTypeFilter) return false;

      if (isOfficial && adminTagFilter !== 'all') {
        if (!(r.adminTags || []).includes(adminTagFilter)) return false;
      }

      if (publicLabelFilter !== 'all') {
        if (!(r.publicLabels || []).includes(publicLabelFilter)) return false;
      }

      if (q) {
        const haystack = [
          r.title,
          r.summary,
          r.courtBranch,
          r.judgeName,
          ...(r.keywords || []),
          ...(r.publicLabels || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    basePool,
    activeTab,
    isOfficial,
    caseTypeFilter,
    adminTagFilter,
    publicLabelFilter,
    searchQuery,
  ]);

  // Synchronize selected ruling safely
  useEffect(() => {
    if (filteredRulings.length === 0) {
      setSelectedRulingId(null);
      return;
    }
    if (!selectedRulingId || !filteredRulings.some(r => r.id === selectedRulingId)) {
      setSelectedRulingId(filteredRulings[0].id);
    }
  }, [filteredRulings, selectedRulingId]);

  const activeRuling: JudicialRuling | null = useMemo(
    () => filteredRulings.find(r => r.id === selectedRulingId) || filteredRulings[0] || null,
    [filteredRulings, selectedRulingId]
  );

  const drawerRuling: JudicialRuling | null = useMemo(
    () => (drawerRulingId ? basePool.find(r => r.id === drawerRulingId) || null : null),
    [basePool, drawerRulingId]
  );

  // Move ruling up/down in global order (Reform 14 & 21)
  const handleMoveRulingOrder = async (rulingId: string, direction: 'up' | 'down') => {
    if (!isOfficial) return;
    const allOrdered = [...rulings].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const idx = allOrdered.findIndex(r => r.id === rulingId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= allOrdered.length) return;
    const next = [...allOrdered];
    const [moved] = next.splice(idx, 1);
    next.splice(swapIdx, 0, moved);
    await reorderRulings(next.map(r => r.id));
  };

  // Group rulings by similarity of their primary admin tag (Reform 14)
  const handleGroupByAdminTags = async () => {
    if (!isOfficial) return;
    const allSorted = [...rulings].sort((a, b) => {
      const aTag = (a.adminTags && a.adminTags[0]) || 'ی_بدون_برچسب';
      const bTag = (b.adminTags && b.adminTags[0]) || 'ی_بدون_برچسب';
      if (aTag !== bTag) return aTag.localeCompare(bTag, 'fa');
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    await reorderRulings(allSorted.map(r => r.id));
  };

  const layoutMode = rulingsPortalConfig.layoutMode || 'editorial_split';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ModernMetricCard
          title="آراء منتشرشده در تالار"
          value={publishedVisibleCount}
          periodLabel="قابل مشاهده برای دانش‌آموختگان"
          unit="رأی"
          icon={<Scale className="w-4 h-4 text-amber-600" />}
          onClick={() => setActiveTab('all_visible')}
        />
        {isOfficial ? (
          <ModernMetricCard
            title="در صف بررسی و مخفی"
            value={pendingOrHiddenCount}
            periodLabel="ارسال‌شده توسط اعضا / نیازمند تکمیل"
            unit="رأی"
            icon={<Clock className="w-4 h-4 text-rose-600" />}
            onClick={() => setActiveTab('pending_or_hidden')}
          />
        ) : (
          <ModernMetricCard
            title="آراء برگزیده سامانه"
            value={systemPicksCount}
            periodLabel="منتخب هیئت علمی مرکز"
            unit="رأی"
            icon={<Award className="w-4 h-4 text-amber-600" />}
            onClick={() => setActiveTab('system_picks')}
          />
        )}
        <ModernMetricCard
          title="مباحثات و نقدهای تخصصی"
          value={totalDiscussions}
          periodLabel="دیدگاه‌های ثبت‌شده در تالار"
          unit="دیدگاه"
          icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Header & Action Bar */}
      <div className="rounded-2xl p-5 sm:p-6 bg-[#FBF9F5] dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
            {rulingsPortalConfig.portalTitle || 'تالار رأی قضایی، نقد علمی و مباحثات فقهی'}
          </h1>
          <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
            {rulingsPortalConfig.portalSubtitle ||
              'مطالعه آراء مدلل، استنادات فقهی-حقوقی و گفت‌وگوی تخصصی قضات و پژوهشگران'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isOfficial && (
            <>
              <button
                type="button"
                onClick={handleGroupByAdminTags}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="مرتب‌سازی و چیدن آراء دارای برچسب مشابه در کنار یکدیگر"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>چینش هم‌برچسب‌ها</span>
              </button>

              <button
                type="button"
                onClick={() => setDesignerModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>طراحی چیدمان و برچسب‌ها</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>بارگذاری رأی</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented View Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('all_visible')}
              className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'all_visible'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              آراء تالار ({toPersianNumbers(publishedVisibleCount)})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('system_picks')}
              className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'system_picks'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>برگزیده سامانه ({toPersianNumbers(systemPicksCount)})</span>
            </button>

            {isOfficial && (
              <button
                type="button"
                onClick={() => setActiveTab('pending_or_hidden')}
                className={`px-3.5 py-1.5 text-xs rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'pending_or_hidden'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                صف بررسی / مخفی ({toPersianNumbers(pendingOrHiddenCount)})
              </button>
            )}
          </div>

          {/* Search + Category + Public Label Selects */}
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end min-w-[240px]">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان، کلیدواژه یا شعبه..."
                className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            <select
              value={caseTypeFilter}
              onChange={e => setCaseTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-800 dark:text-slate-200 font-medium"
            >
              <option value="all">همه حوزه‌ها</option>
              {CASE_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {(rulingsPortalConfig.publicLabelDefinitions || []).length > 0 && (
              <select
                value={publicLabelFilter}
                onChange={e => setPublicLabelFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-800 dark:text-slate-200 font-medium"
              >
                <option value="all">همه برچسب‌های عمومی</option>
                {(rulingsPortalConfig.publicLabelDefinitions || []).map(def => (
                  <option key={def.id} value={def.label}>
                    {def.label}
                  </option>
                ))}
              </select>
            )}

            {isOfficial && (rulingsPortalConfig.internalTagDefinitions || []).length > 0 && (
              <select
                value={adminTagFilter}
                onChange={e => setAdminTagFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold"
              >
                <option value="all">همه برچسب‌های مدیریتی</option>
                {(rulingsPortalConfig.internalTagDefinitions || []).map(def => (
                  <option key={def.id} value={def.label}>
                    {def.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredRulings.length === 0 ? (
        <div className="p-14 text-center rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-2">
          <Scale className="w-8 h-8 text-stone-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-stone-700 dark:text-slate-300">
            هیچ رأیی با فیلترهای انتخاب‌شده یافت نشد.
          </p>
          <p className="text-xs text-stone-400 dark:text-slate-500">
            می‌توانید فیلتر جستجو را تغییر دهید یا از دکمه «بارگذاری رأی» مورد جدیدی ثبت نمایید.
          </p>
        </div>
      ) : layoutMode === 'magazine_grid' ? (
        /* LAYOUT 2: ENGAGING MAGAZINE GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRulings.map((ruling, idx) => {
            const isLiked = (ruling.likedBy || []).includes(currentUser?.id || '');
            const isDisliked = (ruling.dislikedBy || []).includes(currentUser?.id || '');
            return (
              <article
                key={ruling.id}
                onClick={() => setDrawerRulingId(ruling.id)}
                className="group cursor-pointer rounded-2xl bg-[#FBF9F5] dark:bg-slate-900 border border-stone-200 dark:border-slate-800 hover:border-amber-500/70 p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Unboxed header metadata */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-stone-800 dark:text-slate-200">
                        {ruling.caseTypeTitle}
                      </span>
                      {ruling.rulingDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{ruling.rulingDate}</span>
                        </>
                      )}
                    </div>
                    {isOfficial && (
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveRulingOrder(ruling.id, 'up')}
                          className="p-1 rounded bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                          title="بالاتر"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === filteredRulings.length - 1}
                          onClick={() => handleMoveRulingOrder(ruling.id, 'down')}
                          className="p-1 rounded bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                          title="پایین‌تر"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-[15px] font-bold text-stone-900 dark:text-white group-hover:text-amber-800 dark:group-hover:text-amber-300 leading-snug line-clamp-2 transition-colors">
                    {ruling.title}
                  </h3>

                  {/* System pick + public labels + official admin tags */}
                  {(ruling.isSystemPick ||
                    (ruling.publicLabels && ruling.publicLabels.length > 0) ||
                    (isOfficial && ruling.adminTags && ruling.adminTags.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5">
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
                      {isOfficial &&
                        (ruling.adminTags || []).map(tag => (
                          <span
                            key={`adm_${tag}`}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${getRulingTagStyleClasses(
                              tag,
                              rulingsPortalConfig.internalTagDefinitions,
                              'indigo'
                            )}`}
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>{tag}</span>
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Summary excerpt */}
                  {rulingsPortalConfig.showSummary !== false && (
                    <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {ruling.summary || ruling.fullRulingText}
                    </p>
                  )}

                  {/* Timestamps */}
                  <div className="text-[10px] text-stone-400 dark:text-slate-500 space-y-0.5 font-mono tabular-nums">
                    {rulingsPortalConfig.showCreatedAt !== false && ruling.createdAt && (
                      <div>بارگذاری: {formatPersianDateTime(ruling.createdAt)}</div>
                    )}
                    {rulingsPortalConfig.showReviewedAt !== false && ruling.reviewedAt && (
                      <div className="text-emerald-700 dark:text-emerald-400">
                        بررسی: {formatPersianDateTime(ruling.reviewedAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Interactions */}
                <div
                  className="pt-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleRulingLike(ruling.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                        isLiked
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span className="tabular-nums">{toPersianNumbers(ruling.likesCount || 0)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleRulingDislike(ruling.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                        isDisliked
                          ? 'bg-rose-700 text-white border-rose-800'
                          : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                      <span className="tabular-nums">{toPersianNumbers(ruling.dislikesCount || 0)}</span>
                    </button>

                    <span className="inline-flex items-center gap-1 px-1.5 text-[11px] text-stone-500 dark:text-slate-400 tabular-nums">
                      <MessageSquare className="w-3 h-3" />
                      <span>{toPersianNumbers((ruling.discussions || []).length)}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDrawerRulingId(ruling.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>مطالعه و نقد</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : layoutMode === 'archive_list' ? (
        /* LAYOUT 3: CLEAN ARCHIVE ROWS + MODAL READER */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 divide-y divide-stone-100 dark:divide-slate-800 overflow-hidden">
          {filteredRulings.map((ruling, idx) => (
            <div
              key={ruling.id}
              onClick={() => setDrawerRulingId(ruling.id)}
              className="p-4 sm:px-6 hover:bg-[#FAF8F2] dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 dark:text-slate-400">
                  <span className="font-mono tabular-nums text-stone-400">
                    {toPersianNumbers(idx + 1)}.
                  </span>
                  <span className="font-semibold text-stone-800 dark:text-slate-200">
                    {ruling.caseTypeTitle}
                  </span>
                  {ruling.courtBranch && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{ruling.courtBranch}</span>
                    </>
                  )}
                  {ruling.rulingDate && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ruling.rulingDate}</span>
                    </>
                  )}
                  {ruling.isSystemPick && (
                    <span className="px-2 py-0.5 rounded bg-amber-700 text-white text-[10px] font-bold">
                      برگزیده سامانه
                    </span>
                  )}
                  {(ruling.publicLabels || []).map(lbl => (
                    <span
                      key={lbl}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getRulingTagStyleClasses(
                        lbl,
                        rulingsPortalConfig.publicLabelDefinitions,
                        'emerald'
                      )}`}
                    >
                      {lbl}
                    </span>
                  ))}
                  {isOfficial &&
                    (ruling.adminTags || []).map(tag => (
                      <span
                        key={`adm_${tag}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${getRulingTagStyleClasses(
                          tag,
                          rulingsPortalConfig.internalTagDefinitions,
                          'indigo'
                        )}`}
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>{tag}</span>
                      </span>
                    ))}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white leading-snug">
                  {ruling.title}
                </h3>
              </div>

              <div
                className="flex items-center gap-3 shrink-0 text-xs text-stone-500 dark:text-slate-400"
                onClick={e => e.stopPropagation()}
              >
                <span className="font-mono tabular-nums">{toPersianNumbers(ruling.likesCount || 0)} پسند</span>
                <span className="font-mono tabular-nums">{toPersianNumbers(ruling.dislikesCount || 0)} مخالف</span>
                <span className="font-mono tabular-nums">{toPersianNumbers((ruling.discussions || []).length)} دیدگاه</span>
                {isOfficial && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveRulingOrder(ruling.id, 'up')}
                      className="p-1 rounded border border-stone-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredRulings.length - 1}
                      onClick={() => handleMoveRulingOrder(ruling.id, 'down')}
                      className="p-1 rounded border border-stone-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerRulingId(ruling.id)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 text-[11px] font-bold cursor-pointer"
                >
                  مطالعه رأی
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LAYOUT 1: EDITORIAL SPLIT VIEW (DEFAULT) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Rulings List Column (5 Cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-stone-600 dark:text-slate-400">
              <span>فهرست آراء ({toPersianNumbers(filteredRulings.length)})</span>
              <span>برای مطالعه کلیک کنید</span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-slate-800 max-h-[760px] overflow-y-auto">
              {filteredRulings.map((ruling, idx) => {
                const isSelected = activeRuling?.id === ruling.id;
                return (
                  <div
                    key={ruling.id}
                    onClick={() => setSelectedRulingId(ruling.id)}
                    className={`p-4 text-right transition-colors cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-[#FAF6EC] dark:bg-slate-800/90'
                        : 'hover:bg-stone-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Unboxed Metadata */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-stone-800 dark:text-slate-200">
                          {ruling.caseTypeTitle}
                        </span>
                        {ruling.rulingDate && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{ruling.rulingDate}</span>
                          </>
                        )}
                      </div>
                      {isOfficial && (
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveRulingOrder(ruling.id, 'up')}
                            className="p-1 rounded bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                            title="انتقال به بالا"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredRulings.length - 1}
                            onClick={() => handleMoveRulingOrder(ruling.id, 'down')}
                            className="p-1 rounded bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                            title="انتقال به پایین"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xs sm:text-[13px] font-bold text-stone-900 dark:text-white line-clamp-2 leading-relaxed">
                      {ruling.title}
                    </h3>

                    {/* Functional Tags: System Pick + Public Labels + Official Internal Admin Tags */}
                    {(ruling.isSystemPick ||
                      (ruling.publicLabels && ruling.publicLabels.length > 0) ||
                      (isOfficial && ruling.adminTags && ruling.adminTags.length > 0)) && (
                      <div className="flex flex-wrap gap-1">
                        {ruling.isSystemPick && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-700 text-white text-[10px] font-bold">
                            <Award className="w-2.5 h-2.5" />
                            <span>برگزیده سامانه</span>
                          </span>
                        )}
                        {(ruling.publicLabels || []).map(lbl => (
                          <span
                            key={lbl}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getRulingTagStyleClasses(
                              lbl,
                              rulingsPortalConfig.publicLabelDefinitions,
                              'emerald'
                            )}`}
                          >
                            {lbl}
                          </span>
                        ))}
                        {isOfficial &&
                          (ruling.adminTags || []).map(tag => (
                            <span
                              key={`adm_${tag}`}
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${getRulingTagStyleClasses(
                                tag,
                                rulingsPortalConfig.internalTagDefinitions,
                                'indigo'
                              )}`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>{tag}</span>
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Card Bottom Counters */}
                    <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-slate-500 pt-1">
                      <span className="truncate max-w-[160px]">
                        {ruling.courtBranch || ruling.submittedByName}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums">
                        <span>{toPersianNumbers(ruling.likesCount || 0)} پسند</span>
                        <span aria-hidden="true">·</span>
                        <span>{toPersianNumbers(ruling.dislikesCount || 0)} مخالف</span>
                        <span aria-hidden="true">·</span>
                        <span>{toPersianNumbers((ruling.discussions || []).length)} دیدگاه</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Reader Column (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 overflow-hidden">
            {activeRuling ? (
              <RulingDetailReader
                ruling={activeRuling}
                isOfficial={isOfficial}
                currentUserId={currentUser?.id || ''}
                portalConfig={rulingsPortalConfig}
                canMoveUp={filteredRulings[0]?.id !== activeRuling.id}
                canMoveDown={filteredRulings[filteredRulings.length - 1]?.id !== activeRuling.id}
                onMoveOrder={dir => handleMoveRulingOrder(activeRuling.id, dir)}
                onToggleLike={toggleRulingLike}
                onToggleDislike={toggleRulingDislike}
                onAddDiscussion={addRulingDiscussion}
                onEditDiscussion={editRulingDiscussion}
                onDeleteDiscussion={deleteRulingDiscussion}
                onSaveRuling={updateRuling}
                onUpdatePortalConfig={updateRulingsPortalConfig}
              />
            ) : (
              <div className="p-16 text-center text-xs text-stone-400">
                یک رأی را از فهرست انتخاب فرمایید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drawer / Modal Reader for Grid & Archive Modes */}
      {drawerRuling && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs"
          dir="rtl"
          onClick={() => setDrawerRulingId(null)}
        >
          <div
            className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <RulingDetailReader
              ruling={drawerRuling}
              isOfficial={isOfficial}
              currentUserId={currentUser?.id || ''}
              portalConfig={rulingsPortalConfig}
              canMoveUp={filteredRulings[0]?.id !== drawerRuling.id}
              canMoveDown={filteredRulings[filteredRulings.length - 1]?.id !== drawerRuling.id}
              onMoveOrder={dir => handleMoveRulingOrder(drawerRuling.id, dir)}
              onToggleLike={toggleRulingLike}
              onToggleDislike={toggleRulingDislike}
              onAddDiscussion={addRulingDiscussion}
              onEditDiscussion={editRulingDiscussion}
              onDeleteDiscussion={deleteRulingDiscussion}
              onSaveRuling={updateRuling}
              onUpdatePortalConfig={updateRulingsPortalConfig}
              onCloseReader={() => setDrawerRulingId(null)}
            />
          </div>
        </div>
      )}

      {/* Upload Modal (Reform 11 & 12) */}
      <RulingUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        isOfficial={isOfficial}
        submittedById={currentUser?.id || ''}
        submittedByName={currentUser?.fullName || 'عضو مجمع'}
        onSubmitRuling={submitRuling}
      />

      {/* Portal Designer Modal (Reforms 14, 18, 21, 22) */}
      <RulingPortalDesignerModal
        isOpen={designerModalOpen}
        onClose={() => setDesignerModalOpen(false)}
        portalConfig={rulingsPortalConfig}
        onSavePortalConfig={updateRulingsPortalConfig}
      />
    </div>
  );
};

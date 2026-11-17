import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { canManageRulingsRole, getRulingTagStyleClasses } from '../rulings/rulingTypesAndTags';
import {
  Scale,
  MessageSquare,
  ArrowLeft,
  Building2,
  Award,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

interface MizanRulingsShelfProps {
  onNavigate: (tabId: string) => void;
}

export const MizanRulingsShelf: React.FC<MizanRulingsShelfProps> = ({ onNavigate }) => {
  const {
    rulings,
    rulingsPortalConfig,
    mizanConfig,
    currentUser,
    isAlumniPreview,
    toggleRulingLike,
    toggleRulingDislike,
  } = useApp();
  const [activeCategory, setActiveCategory] = useState<'all' | 'civil' | 'criminal' | 'commercial' | 'family'>('all');
  const [cardTabs, setCardTabs] = useState<Record<string, 'summary' | 'principles' | 'fullText'>>({});

  if (mizanConfig.showRulingsShelf === false && mizanConfig.showRulingsPicks === false) return null;

  const isOfficial = canManageRulingsRole(currentUser?.role) && !isAlumniPreview;
  const contentMode = mizanConfig.rulingsShelfContentMode || 'title_summary';
  const showLikes = mizanConfig.rulingsShowLikesInShowcase !== false;
  const showDislikes = mizanConfig.rulingsShowDislikesInShowcase !== false;
  const showComments = mizanConfig.rulingsShowCommentsInShowcase !== false;

  const visiblePool = useMemo(() => {
    const sorted = [...rulings].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    if (isOfficial) return sorted;
    return sorted.filter(r => r.status === 'selected' && r.isVisibleToAlumni !== false);
  }, [rulings, isOfficial]);

  const filteredRulings = useMemo(
    () =>
      visiblePool
        .filter(r => (activeCategory === 'all' ? true : r.caseType === activeCategory))
        .slice(0, 3),
    [visiblePool, activeCategory]
  );

  const categories = [
    { id: 'all', label: 'همه آراء منتخب' },
    { id: 'civil', label: 'حقوقی و مدنی' },
    { id: 'criminal', label: 'کیفری و جرایم' },
    { id: 'commercial', label: 'تجاری و ورشکستگی' },
    { id: 'family', label: 'خانواده و ارث' },
  ] as const;

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F8EED8] text-[#9A6418] flex items-center justify-center font-bold">
            <Scale className="w-4 h-4 text-[#9A6418]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0D3829]">تالار منتخب دادنامه‌ها و آراء قضایی</h3>
            <p className="text-xs text-[#527768]">تحلیل علمی و تبادل نظر پیرامون آخرین دادنامه‌های محاکم دادگستری</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#EEF5F1] p-1 rounded-xl text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-white text-[#0D3829] shadow-sm font-bold'
                    : 'text-[#587E6F] hover:text-[#0D3829]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('rulings')}
            className="text-xs font-semibold text-[#158561] hover:text-[#0C583F] flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer"
          >
            <span>ورود به تالار آراء</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {filteredRulings.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white border border-[#E3ECE8] text-xs text-[#527768]">
          رأی منتشرشده‌ای در این دسته یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredRulings.map(ruling => {
            const activeSubTab = cardTabs[ruling.id] || 'summary';
            const isLiked = (ruling.likedBy || []).includes(currentUser?.id || '');
            const isDisliked = (ruling.dislikedBy || []).includes(currentUser?.id || '');
            return (
              <div
                key={ruling.id}
                onClick={() => onNavigate('rulings')}
                className="group cursor-pointer rounded-2xl bg-white border border-[#E3ECE8] p-5 shadow-sm hover:shadow-md hover:border-[#158561]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header unboxed metadata */}
                  <div className="flex items-center justify-between text-[11px] text-[#527768]">
                    <span className="font-bold text-[#1E5C46]">
                      {ruling.caseTypeTitle || 'حقوقی'}
                    </span>
                    <span className="font-mono tabular-nums text-[#719588]">
                      {ruling.rulingDate || '—'}
                    </span>
                  </div>

                  {/* System pick + public labels */}
                  {(ruling.isSystemPick || (ruling.publicLabels && ruling.publicLabels.length > 0)) && (
                    <div className="flex flex-wrap gap-1">
                      {ruling.isSystemPick && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-700 text-white text-[10px] font-bold">
                          <Award className="w-3 h-3" />
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
                    </div>
                  )}

                  {/* Title */}
                  <h4 className="text-sm font-bold text-[#143D2D] leading-snug group-hover:text-[#158561] transition-colors line-clamp-2">
                    {ruling.title}
                  </h4>

                  {contentMode === 'title_summary' && (
                    <p className="text-xs text-[#527768] line-clamp-3 leading-relaxed">
                      {ruling.summary || ruling.fullRulingText}
                    </p>
                  )}

                  {contentMode === 'tabbed' && (
                    <div className="space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 p-0.5 bg-[#EEF5F1] rounded-lg text-[10px]">
                        {[
                          { id: 'summary' as const, label: 'چکیده' },
                          { id: 'principles' as const, label: 'مستندات' },
                          { id: 'fullText' as const, label: 'متن رأی' },
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setCardTabs(prev => ({ ...prev, [ruling.id]: t.id }))}
                            className={`flex-1 py-1 rounded-md font-bold cursor-pointer ${
                              activeSubTab === t.id
                                ? 'bg-white text-[#0D3829] shadow-2xs'
                                : 'text-[#527768]'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {activeSubTab === 'summary' && (
                        <p className="text-xs text-[#527768] line-clamp-3 leading-relaxed">
                          {ruling.summary || ruling.fullRulingText}
                        </p>
                      )}
                      {activeSubTab === 'principles' && (
                        <div className="text-[11px] text-[#336150] space-y-1 max-h-20 overflow-y-auto">
                          {(ruling.legalPrinciples || []).length > 0 ? (
                            ruling.legalPrinciples.slice(0, 3).map((p, i) => <div key={i}>· {p}</div>)
                          ) : (
                            <div className="text-[#719588]">مستنداتی ثبت نشده است.</div>
                          )}
                        </div>
                      )}
                      {activeSubTab === 'fullText' && (
                        <p className="text-[11px] text-[#336150] line-clamp-3 font-serif leading-relaxed">
                          {ruling.fullRulingText || ruling.summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-4 mt-4 border-t border-[#EDF3F0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#587E6F]">
                  <div className="flex items-center gap-1 text-[11px] text-[#426C5D]">
                    <Building2 className="w-3.5 h-3.5 text-[#158561]" />
                    <span className="truncate max-w-[120px]">{ruling.courtBranch || 'مرجع قضایی'}</span>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {showLikes && (
                      <button
                        type="button"
                        onClick={() => toggleRulingLike(ruling.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${
                          isLiked ? 'bg-[#158561] text-white' : 'bg-[#EEF5F1] text-[#158561]'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span className="tabular-nums">{toPersianNumbers(ruling.likesCount || 0)}</span>
                      </button>
                    )}

                    {showDislikes && (
                      <button
                        type="button"
                        onClick={() => toggleRulingDislike(ruling.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${
                          isDisliked ? 'bg-rose-700 text-white' : 'bg-[#FDF2F0] text-rose-700'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span className="tabular-nums">{toPersianNumbers(ruling.dislikesCount || 0)}</span>
                      </button>
                    )}

                    {showComments && (
                      <span className="inline-flex items-center gap-1 text-[#158561] font-semibold text-[11px] tabular-nums">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{toPersianNumbers(ruling.discussions?.length || 0)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

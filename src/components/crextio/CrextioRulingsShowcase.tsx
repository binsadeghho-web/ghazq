import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { JudicialRuling } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Scale,
  ArrowUpRight,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  X,
  FileText,
  Send,
  Eye,
  Flame,
  Award
} from 'lucide-react';

interface CrextioRulingsShowcaseProps {
  onNavigateToRulings?: () => void;
}

export const CrextioRulingsShowcase: React.FC<CrextioRulingsShowcaseProps> = ({
  onNavigateToRulings
}) => {
  const { rulings, toggleRulingLike, addRulingDiscussion, currentUser, crextioConfig, updateCrextioConfig } = useApp();
  const [selectedRuling, setSelectedRuling] = useState<JudicialRuling | null>(() => rulings[0] || null);
  const [activeTab, setActiveTab] = useState<'principles' | 'summary' | 'discussions' | 'fullText'>('summary');
  const [newComment, setNewComment] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [fullModalRuling, setFullModalRuling] = useState<JudicialRuling | null>(null);

  // Active showcase rulings list (custom or default)
  const showcaseRulings = (crextioConfig.rulingsCustomList && crextioConfig.rulingsCustomList.length > 0)
    ? crextioConfig.rulingsCustomList
    : (rulings.length > 0 ? rulings : []);

  const currentActive = selectedRuling || showcaseRulings[0];

  // Mode: expanded (full dossier & debate) or compact (clean ticker cards strip)
  const isCompact = crextioConfig.rulingsShowcaseMode === 'compact';

  // Font sizes from config
  const titleFontSize = crextioConfig.fontSizes?.rulingsTitle || 'text-lg';
  const bodyFontSize = crextioConfig.fontSizes?.rulingsBody || 'text-xs';

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentActive || !newComment.trim()) return;
    addRulingDiscussion(currentActive.id, newComment.trim());
    setNewComment('');
    setCommentSuccess(true);
    setTimeout(() => setCommentSuccess(false), 3000);
  };

  return (
    <div className="w-full space-y-4">
      {/* Showcase Master Container */}
      <div className="relative rounded-[32px] overflow-hidden border border-[#E5E0D0] bg-[#FCFBF8] shadow-md">
        {/* Subtle Ambient Background Gradient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row with Domain Badge, Mode Switcher, and CTA */}
        <div className="relative z-10 px-6 py-5 border-b border-[#ECE7DA] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/60 via-white/80 to-emerald-50/40 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shadow-xs">
                <Scale className="w-4 h-4 stroke-[2.3]" />
              </span>
              <span className="text-xs font-black text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/80">
                {crextioConfig.rulingsShowcaseBadge || 'تالار مناظره و نقد آراء منتخب'}
              </span>
              <span className="text-[11px] text-stone-500 font-bold hidden sm:inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                {toPersianNumbers(showcaseRulings.length)} دادنامه چالش‌برانگیز در جریان بحث
              </span>
            </div>
            <h3 className={`${titleFontSize} font-black text-stone-900 tracking-tight`}>
              {crextioConfig.rulingsShowcaseTitle || 'تالار نقد، ارزیابی و مباحثه آراء و دادنامه‌های قضایی'}
            </h3>
            <p className={`${bodyFontSize} text-stone-600 font-medium`}>
              {crextioConfig.rulingsShowcaseSubtitle || 'میدان تحلیل رویه‌های قضایی، آراء وحدت رویه و نقدهای حقوقی مستند دانش‌آموختگان نخبه'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onNavigateToRulings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>{crextioConfig.rulingsPrimaryBtnText || 'ورود به تالار جامع آراء'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* -------------------- MODE 1: COMPACT MODE -------------------- */}
        {isCompact ? (
          <div className="relative z-10 p-5 sm:p-6 bg-white/95">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showcaseRulings.map(ruling => {
                const discussionsCount = ruling.discussions?.length || 0;
                return (
                  <div
                    key={ruling.id}
                    className="p-4 rounded-2xl bg-[#FBF9F4] hover:bg-amber-50/50 border border-stone-200/90 hover:border-amber-300 transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                          {ruling.courtBranch}
                        </span>
                        <span className="text-stone-400 font-medium">{ruling.rulingDate}</span>
                      </div>

                      <h4 className="font-black text-xs sm:text-sm text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2 leading-snug">
                        {ruling.title}
                      </h4>

                      <p className="text-[11px] text-stone-600 font-medium line-clamp-2 leading-relaxed">
                        {ruling.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 text-stone-500 text-[11px]">
                        <button
                          onClick={() => toggleRulingLike(ruling.id)}
                          className="flex items-center gap-1 hover:text-amber-700 font-bold cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
                          <span>{toPersianNumbers(ruling.likesCount)}</span>
                        </button>
                        <span className="flex items-center gap-1 font-bold text-emerald-700">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{toPersianNumbers(discussionsCount)}</span>
                        </span>
                      </div>

                      <button
                        onClick={() => setFullModalRuling(ruling)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-[11px] font-bold text-stone-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-stone-500" />
                        <span>مشاهده و نقد</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* -------------------- MODE 2: EXPANDED MODE (SPLIT STAGE) -------------------- */
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Column (5 Cols): Rulings Selector List */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-l border-[#ECE7DA] p-4 sm:p-5 space-y-3 bg-[#FAF8F2]/60">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black text-stone-700">{crextioConfig.rulingsShowcaseSectionTitle || 'دادنامه‌های داغ و برگزیده این هفته'}</span>
                <span className="text-[10px] text-stone-500 font-semibold">برای بررسی کلیک کنید</span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {showcaseRulings.map(ruling => {
                  const isSelected = currentActive?.id === ruling.id;
                  const discussionsCount = ruling.discussions?.length || 0;

                  return (
                    <div
                      key={ruling.id}
                      onClick={() => {
                        setSelectedRuling(ruling);
                        setActiveTab('summary');
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/30'
                          : 'bg-white/80 hover:bg-white border-stone-200/90 hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                          {ruling.caseTypeTitle}
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium">
                          {ruling.rulingDate}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-[13px] font-black text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2 leading-snug">
                        {ruling.title}
                      </h4>

                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
                        <span className="truncate max-w-[180px] font-medium text-stone-500">
                          {ruling.courtBranch}
                        </span>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1 font-bold text-amber-700">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{toPersianNumbers(ruling.likesCount)}</span>
                          </span>
                          <span className="flex items-center gap-1 font-bold text-emerald-700">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{toPersianNumbers(discussionsCount)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7 Cols): Active Focused Ruling Dossier & Live Debate */}
            {currentActive && (
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-white/90">
                <div className="space-y-4">
                  {/* Dossier Header Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                        مرجع صدور: {currentActive.courtBranch}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-700 text-[11px] font-bold border border-stone-200">
                        قاضی انشاءکننده: {currentActive.judgeName}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                        ثبت‌شده توسط: {currentActive.submittedByName}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                      {currentActive.title}
                    </h3>
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                        activeTab === 'summary'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      چکیده استنباط
                    </button>
                    <button
                      onClick={() => setActiveTab('principles')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                        activeTab === 'principles'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      مستندات و قواعد فقهی
                    </button>
                    <button
                      onClick={() => setActiveTab('discussions')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                        activeTab === 'discussions'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <span>نقدها و مباحثات</span>
                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black flex items-center justify-center">
                        {toPersianNumbers(currentActive.discussions?.length || 0)}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('fullText')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                        activeTab === 'fullText'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      متن دادنامه
                    </button>
                  </div>

                  {/* Tab 1: Summary */}
                  {activeTab === 'summary' && (
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 text-stone-800 leading-relaxed text-xs space-y-2">
                      <span className="font-bold text-amber-900 block">چکیده محوری رأی و چالش حقوقی:</span>
                      <p className="font-medium text-stone-700 leading-loose">
                        {currentActive.summary}
                      </p>
                    </div>
                  )}

                  {/* Tab 2: Legal Principles */}
                  {activeTab === 'principles' && (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                      <span className="font-bold text-stone-900 block">قواعد فقهی، مواد قانونی و اصول استنادی:</span>
                      <ul className="space-y-1.5 text-stone-700 list-disc list-inside">
                        {currentActive.legalPrinciples?.map((pr, idx) => (
                          <li key={idx} className="leading-relaxed font-medium">
                            {pr}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tab 3: Discussions & Critiques */}
                  {activeTab === 'discussions' && (
                    <div className="space-y-3">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {currentActive.discussions && currentActive.discussions.length > 0 ? (
                          currentActive.discussions.map(disc => (
                            <div key={disc.id} className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-stone-900">{disc.authorName}</span>
                                <span className="text-[10px] text-stone-400">{disc.timestamp}</span>
                              </div>
                              <span className="text-[10px] text-stone-500 font-semibold block">{disc.authorRoleTitle}</span>
                              <p className="text-stone-700 text-[11px] leading-relaxed pt-1">{disc.comment}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-stone-400 text-xs">
                            هنوز نقدی برای این رأی ثبت نشده است. اولین نقد را شما بنویسید!
                          </div>
                        )}
                      </div>

                      {/* Quick Critique Submission Form */}
                      <form onSubmit={handlePostComment} className="pt-2 border-t border-stone-200 flex items-center gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          placeholder="نقد حقوقی، ایراد استدلال یا نظر مستند خود را بنویسید..."
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
                      {commentSuccess && (
                        <span className="text-[11px] text-emerald-700 font-bold block animate-pulse">
                          نقد مستند شما با موفقیت در تالار ثبت گردید.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Full Text Snippet */}
                  {activeTab === 'fullText' && (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs max-h-52 overflow-y-auto font-serif leading-loose whitespace-pre-line">
                      {currentActive.fullRulingText || currentActive.summary}
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => toggleRulingLike(currentActive.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      currentActive.likedBy.includes(currentUser?.id || '')
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-stone-50 hover:bg-amber-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-amber-700" />
                    <span>تأیید استدلال ({toPersianNumbers(currentActive.likesCount)})</span>
                  </button>

                  <button
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

      {/* Modal for Reading Full Official Ruling Dossier */}
      <AnimatePresence>
        {fullModalRuling && (
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
                      {fullModalRuling.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {fullModalRuling.courtBranch} · دادرس: {fullModalRuling.judgeName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setFullModalRuling(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-900 block">چکیده مبدأ استنباط:</span>
                  <p className="text-stone-700 leading-relaxed">{fullModalRuling.summary}</p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 max-h-72 overflow-y-auto">
                  <span className="font-bold text-emerald-950 block">متن رسمی دادنامه و استدلال شعبه:</span>
                  <p className="text-stone-700 font-serif leading-loose text-xs whitespace-pre-line">
                    {fullModalRuling.fullRulingText || fullModalRuling.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-xs">
                <button
                  onClick={() => toggleRulingLike(fullModalRuling.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>تأیید رأی ({toPersianNumbers(fullModalRuling.likesCount)})</span>
                </button>

                <button
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
    </div>
  );
};

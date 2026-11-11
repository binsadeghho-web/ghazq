import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { JudicialRuling } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { RulingEnhancementsToolbar } from './RulingEnhancementsToolbar';
import {
  Scale,
  ThumbsUp,
  MessageSquare,
  CheckCircle,
  Clock,
  Plus,
  Send,
  Building,
  User,
  BookOpen,
  X,
  FileText,
  ShieldCheck
} from 'lucide-react';

export const JudicialRulingsSection: React.FC = () => {
  const { currentUser, rulings, submitRuling, approveRuling, addRulingDiscussion, toggleRulingLike } = useApp();

  const [activeTab, setActiveTab] = useState<'selected' | 'pending'>('selected');
  const [selectedRuling, setSelectedRuling] = useState<JudicialRuling | null>(rulings[0] || null);
  const [newRulingModalOpen, setNewRulingModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Keep selectedRuling synchronized with live SSE updates in rulings array
  useEffect(() => {
    if (selectedRuling) {
      const fresh = rulings.find(r => r.id === selectedRuling.id);
      if (fresh) setSelectedRuling(fresh);
    } else if (rulings.length > 0) {
      setSelectedRuling(rulings[0]);
    }
  }, [rulings, selectedRuling]);

  // Submit ruling form state
  const [newTitle, setNewTitle] = useState('');
  const [newCourtBranch, setNewCourtBranch] = useState('');
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newRulingDate, setNewRulingDate] = useState('۱۴۰۳/۰۷/۱۵');
  const [newCaseType, setNewCaseType] = useState<JudicialRuling['caseType']>('commercial');
  const [newSummary, setNewSummary] = useState('');
  const [newPrinciples, setNewPrinciples] = useState('');
  const [newFullText, setNewFullText] = useState('');

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const publishedRulings = rulings.filter(r => r.status === 'selected');
  const pendingRulings = rulings.filter(r => r.status === 'pending_review');

  const visibleRulings = activeTab === 'selected' ? publishedRulings : pendingRulings;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedRuling) return;
    addRulingDiscussion(selectedRuling.id, commentText.trim());
    setCommentText('');
  };

  const handleCreateRuling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let typeTitle = 'حقوقی و تجاری';
    if (newCaseType === 'criminal') typeTitle = 'کیفری و جزایی';
    if (newCaseType === 'civil') typeTitle = 'مدنی و قراردادها';
    if (newCaseType === 'family') typeTitle = 'امور حسبی و خانواده';

    submitRuling({
      title: newTitle,
      courtBranch: newCourtBranch,
      judgeName: newJudgeName,
      rulingDate: newRulingDate,
      caseType: newCaseType,
      caseTypeTitle: typeTitle,
      summary: newSummary,
      legalPrinciples: newPrinciples.split('\n').filter(p => p.trim().length > 0),
      fullRulingText: newFullText,
      submittedById: currentUser.id,
      submittedByName: currentUser.fullName,
    });

    setNewTitle('');
    setNewCourtBranch('');
    setNewJudgeName('');
    setNewSummary('');
    setNewPrinciples('');
    setNewFullText('');
    setNewRulingModalOpen(false);

    setStatusNotice('رأی قضایی شما به دبیرخانه تالار واصل گردید و پس از ارزیابی علمی منتشر خواهد شد.');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleApprove = (rulingId: string) => {
    approveRuling(rulingId);
    setStatusNotice('رأی قضایی با موفقیت تایید و به عنوان دادنامه منتخب منتشر گردید.');
    setTimeout(() => setStatusNotice(null), 4000);
    if (selectedRuling?.id === rulingId) {
      setSelectedRuling({ ...selectedRuling, status: 'selected' });
    }
  };

  const totalDiscussions = rulings.reduce((acc, r) => acc + r.discussions.length, 0);

  return (
    <div className="space-y-6">
      {statusNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{statusNotice}</span>
          <button onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* 3 Metrics Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernMetricCard
          title="آراء منتخب تالار"
          value={publishedRulings.length}
          periodLabel="دادنامه‌های برگزیده و مستدل"
          unit="رأی"
          icon={<Scale className="w-4 h-4 text-amber-500" />}
          onClick={() => {
            setActiveTab('selected');
            setSelectedRuling(publishedRulings[0] || null);
          }}
        />
        <ModernMetricCard
          title="در صف بررسی تیم ممیزی"
          value={pendingRulings.length}
          periodLabel="پیشنهادهای واصله اعضا"
          unit="رأی"
          icon={<Clock className="w-4 h-4 text-blue-500" />}
          onClick={() => {
            if (isOfficial) {
              setActiveTab('pending');
              setSelectedRuling(pendingRulings[0] || null);
            }
          }}
        />
        <ModernMetricCard
          title="مباحثات و نقدهای علمی"
          value={totalDiscussions}
          periodLabel="دیدگاه‌های تخصصی ثبت‌شده"
          unit="نظر"
          icon={<MessageSquare className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            تالار رأی قضایی و مباحثات فقهی
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>آراء مدلل محاکم بدوی، تجدیدنظر و دیوان عالی کشور همراه با استنادات اصولی</span>
            <span aria-hidden="true">·</span>
            <span>نقد و گفت‌وگوی علمی قضات و پژوهشگران</span>
          </div>
        </div>

        <button
          onClick={() => setNewRulingModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>پیشنهاد رأی قضایی جدید</span>
        </button>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex items-center gap-2 glass-panel p-2 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <button
          onClick={() => {
            setActiveTab('selected');
            setSelectedRuling(publishedRulings[0] || null);
          }}
          className={`px-3.5 py-2 text-xs rounded-xl font-medium transition-all ${
            activeTab === 'selected'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          آراء برگزیده منتشرشده ({publishedRulings.length})
        </button>

        {isOfficial && (
          <button
            onClick={() => {
              setActiveTab('pending');
              setSelectedRuling(pendingRulings[0] || null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>صف بررسی ممیزی ({pendingRulings.length})</span>
          </button>
        )}
      </div>

      {/* 2-Column Split: List & Selected Deliberation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Rulings List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {activeTab === 'selected' ? 'آراء منتخب مراجع قضایی' : 'دادنامه‌های در انتظار ارزیابی'}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
            {visibleRulings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                موردی در این دسته وجود ندارد.
              </div>
            ) : (
              visibleRulings.map(ruling => {
                const isSelected = selectedRuling?.id === ruling.id;
                return (
                  <button
                    key={ruling.id}
                    onClick={() => setSelectedRuling(ruling)}
                    className={`w-full p-4 text-right transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-slate-100/70 dark:bg-slate-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Unboxed Metadata (Zero-Pill) */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{ruling.caseTypeTitle}</span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-mono tabular-nums">{ruling.rulingDate}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate max-w-[140px]">{ruling.courtBranch}</span>
                    </div>

                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">
                      {ruling.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                      <span>{ruling.judgeName}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums">{ruling.likesCount} پسند</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{ruling.discussions.length} نظر</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Ruling & Discussions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
          {selectedRuling ? (
            <div className="p-6 space-y-6">
              
              {/* Header */}
              <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRuling.caseTypeTitle}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-mono tabular-nums">{selectedRuling.rulingDate}</span>
                  </div>

                  {selectedRuling.status === 'selected' ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      رأی منتخب تالار
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      در صف ارزیابی علمی
                    </span>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedRuling.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>مرجع صادرکننده: <strong className="text-slate-700 dark:text-slate-300">{selectedRuling.courtBranch}</strong></span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span>قاضی / دادرسان: <strong className="text-slate-700 dark:text-slate-300">{selectedRuling.judgeName}</strong></span>
                </div>

                {/* Approve Button for Admin */}
                {isOfficial && selectedRuling.status === 'pending_review' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      ارسال‌شده توسط: {selectedRuling.submittedByName}
                    </span>
                    <button
                      onClick={() => handleApprove(selectedRuling.id)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors active:scale-[0.98]"
                    >
                      تایید و انتشار به عنوان رأی منتخب
                    </button>
                  </div>
                )}
              </div>

              {/* Summary and Legal Principles */}
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
                    چکیده و گردش‌کار پرونده:
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    {selectedRuling.summary}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                    اصول و مستندات قانونی-فقهی حاکم:
                  </span>
                  <div className="space-y-1.5">
                    {selectedRuling.legalPrinciples.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
                    متن انشای دادنامه:
                  </span>
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 font-serif whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {selectedRuling.fullRulingText}
                  </div>
                </div>

                {/* Like Button */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => toggleRulingLike(selectedRuling.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors active:scale-[0.98]"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>مفید و مدلل بود ({selectedRuling.likesCount})</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    ارسال‌شده توسط: {selectedRuling.submittedByName}
                  </span>
                </div>

                {/* ابزار هایلایت، نسخه چاپی و نقد برگزیده */}
                <RulingEnhancementsToolbar
                  ruling={selectedRuling}
                  isOfficial={isOfficial}
                  onRulingUpdated={() => {}}
                />
              </div>

              {/* Discussions & Critiques */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  مباحثات و نقدهای علمی اعضا ({selectedRuling.discussions.length}):
                </span>

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="دیدگاه فقهی یا نقد حقوقی خود را پیرامون استدلال این دادنامه بنویسید..."
                    className="flex-1 p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 active:scale-[0.98]"
                  >
                    <span>ثبت نظر</span>
                    <Send className="w-3.5 h-3.5 rotate-180 text-amber-400" />
                  </button>
                </form>

                {/* Discussion timeline */}
                <div className="space-y-2.5">
                  {selectedRuling.discussions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                      نظری تاکنون ثبت نشده است. اولین نقد علمی را شما بنویسید.
                    </div>
                  ) : (
                    selectedRuling.discussions.map(disc => (
                      <div key={disc.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{disc.authorName} ({disc.authorRoleTitle})</span>
                          <span className="font-mono tabular-nums">{disc.timestamp}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{disc.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-400">
              یک رأی را از لیست سمت راست انتخاب فرمایید.
            </div>
          )}
        </div>
      </div>

      {/* New Ruling Modal */}
      {newRulingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">ارسال رأی قضایی به تالار</h3>
                <p className="text-xs text-slate-400 mt-0.5">پس از ارزیابی علمی تیم پشتیبانی، به عنوان رأی منتخب منتشر خواهد شد</p>
              </div>
              <button
                onClick={() => setNewRulingModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRuling} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عنوان رأی یا موضوع کلیدی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عدم تعلق خسارت تاخیر تادیه به رمزارزها"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">مرجع صادرکننده:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شعبه ۲۱ دادگاه تجدیدنظر تهران"
                    value={newCourtBranch}
                    onChange={e => setNewCourtBranch(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">قاضی / اعضای دادگاه:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: دکتر نوری‌زاد و هیئت مستشاران"
                    value={newJudgeName}
                    onChange={e => setNewJudgeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">حوزه موضوعی:</label>
                  <select
                    value={newCaseType}
                    onChange={e => setNewCaseType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="commercial">حقوقی و تجاری</option>
                    <option value="civil">مدنی و قراردادها</option>
                    <option value="criminal">کیفری و جزایی</option>
                    <option value="family">خانواده و حسبی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">تاریخ صدور دادنامه:</label>
                  <input
                    type="text"
                    value={newRulingDate}
                    onChange={e => setNewRulingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">خلاصه دادنامه:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="خلاصه گردش کار و نتیجه رأی صادرشده..."
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  مستندات قانونی و قواعد فقهی حاکم (هر سطر یک مورد):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ماده ۵۲۲ قانون آیین دادرسی مدنی&#10;قاعده فقهی لاضرر و نفی حرج"
                  value={newPrinciples}
                  onChange={e => setNewPrinciples(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">متن کامل یا فرازهای مهم دادنامه:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="فرازهای استدلالی دادنامه..."
                  value={newFullText}
                  onChange={e => setNewFullText(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none font-serif"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewRulingModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold active:scale-[0.98]"
                >
                  ارسال به دبیرخانه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

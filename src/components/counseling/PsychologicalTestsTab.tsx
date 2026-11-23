import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Unlock,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  X,
  UserCheck,
  Send,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Phone,
  Link2,
  Copy,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PsychologicalTestAssignment,
  PsychologicalTestQuestion,
  PsychologicalTestResult,
} from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface PsychologicalTestsTabProps {
  isPsychologistMode?: boolean;
}

function isSafeHttpUrl(raw?: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const PsychologicalTestsTab: React.FC<PsychologicalTestsTabProps> = ({
  isPsychologistMode = false,
}) => {
  const {
    currentUser,
    users,
    counselingRequests,
    counselingClientsBasic,
    psychologicalTests,
    testAssignments,
    testResults,
    createPsychologicalTest,
    deletePsychologicalTest,
    assignPsychologicalTest,
    toggleTestAssignmentVisibility,
    deleteTestAssignment,
    submitPsychologicalTest,
    reviewPsychologicalTestResult,
  } = useApp();

  // Psychologist Sub-tabs: assign_unlock (External Link & Visibility) | results_review | catalog
  const [psychSubTab, setPsychSubTab] = useState<'assign_unlock' | 'results_review' | 'catalog'>('assign_unlock');
  const [assignmentMode, setAssignmentMode] = useState<'external_link' | 'internal_bank'>('external_link');

  // External Link Assignment Form State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [externalTestUrl, setExternalTestUrl] = useState('');
  const [externalTestTitle, setExternalTestTitle] = useState('');
  const [showImmediately, setShowImmediately] = useState(true);
  const [selectedTestId, setSelectedTestId] = useState<string>(psychologicalTests[0]?.id || '');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteAssignmentId, setConfirmDeleteAssignmentId] = useState<string | null>(null);

  // Create New Legacy Internal Test Form
  const [newTestOpen, setNewTestOpen] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('ارزیابی روان‌شناختی');
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newTestMinutes, setNewTestMinutes] = useState(15);
  const [newTestQuestions, setNewTestQuestions] = useState<PsychologicalTestQuestion[]>([
    {
      id: `q_${Date.now()}`,
      prompt: 'میزان آرامش و کیفیت خواب شما در دو هفته گذشته چگونه بوده است؟',
      type: 'single_choice',
      options: ['بسیار مطلوب (۳)', 'متوسط (۲)', 'کاهش‌یافته (۱)', 'نیازمند بررسی (۰)'],
    },
  ]);

  // Review Result Modal
  const [reviewingResult, setReviewingResult] = useState<PsychologicalTestResult | null>(null);
  const [clinicalNoteInput, setClinicalNoteInput] = useState('');
  const [scoreSummaryInput, setScoreSummaryInput] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  // Alumni Legacy In-App Test Taking Modal
  const [takingAssignment, setTakingAssignment] = useState<PsychologicalTestAssignment | null>(null);
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [submittingTest, setSubmittingTest] = useState(false);

  // Strict PII-Minimized Client Picker: ONLY id + fullName + phone
  const candidateUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string }>();

    for (const c of counselingClientsBasic) {
      if (c.id) {
        map.set(c.id, { id: c.id, name: c.fullName, phone: c.phone || '' });
      }
    }
    for (const r of counselingRequests) {
      if (r.applicantId && !map.has(r.applicantId)) {
        map.set(r.applicantId, {
          id: r.applicantId,
          name: r.applicantName,
          phone: r.userPhone || '',
        });
      }
    }
    // Fallback only if users loaded (for non-psychologist admins)
    for (const u of users) {
      if (u.id && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          name: u.fullName,
          phone: u.phone || '',
        });
      }
    }
    return Array.from(map.values());
  }, [counselingClientsBasic, counselingRequests, users]);

  const filteredCandidates = useMemo(() => {
    const q = clientSearch.trim();
    if (!q) return candidateUsers;
    return candidateUsers.filter(
      u => (u.name || '').includes(q) || (u.phone || '').includes(q)
    );
  }, [candidateUsers, clientSearch]);

  const activeTargetUser =
    candidateUsers.find(u => u.id === selectedUserId) || filteredCandidates[0] || candidateUsers[0];

  const handleCopyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!activeTargetUser) {
      setFormError('لطفاً ابتدا دانش‌آموخته مورد نظر را انتخاب نمایید.');
      return;
    }

    if (assignmentMode === 'external_link') {
      const cleanedUrl = externalTestUrl.trim();
      if (!isSafeHttpUrl(cleanedUrl)) {
        setFormError('آدرس لینک تست باید معتبر و با پیشوند https:// یا http:// باشد.');
        return;
      }

      setAssigning(true);
      try {
        const res = await assignPsychologicalTest({
          externalTestUrl: cleanedUrl,
          externalTestTitle: externalTestTitle.trim() || 'ارزیابی و تست روان‌شناختی اختصاصی',
          isVisibleToUser: showImmediately,
          userId: activeTargetUser.id,
          userName: activeTargetUser.name,
          adminNote: assignNote.trim() || undefined,
        });
        if (res) {
          setExternalTestUrl('');
          setExternalTestTitle('');
          setAssignNote('');
        }
      } finally {
        setAssigning(false);
      }
      return;
    }

    // Legacy Internal Test Bank assignment
    const targetTestId = selectedTestId || psychologicalTests[0]?.id;
    if (!targetTestId) return;
    setAssigning(true);
    try {
      await assignPsychologicalTest({
        testId: targetTestId,
        isVisibleToUser: showImmediately,
        userId: activeTargetUser.id,
        userName: activeTargetUser.name,
        adminNote: assignNote.trim() || undefined,
      });
      setAssignNote('');
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) return;
    await createPsychologicalTest({
      title: newTestTitle.trim(),
      category: newTestCategory.trim() || 'ارزیابی روان‌شناختی',
      description: newTestDesc.trim(),
      estimatedMinutes: newTestMinutes,
      instructions: 'لطفاً سوالات زیر را با صداقت کامل پاسخ دهید.',
      questions: newTestQuestions,
      isActive: true,
    });
    setNewTestTitle('');
    setNewTestDesc('');
    setNewTestOpen(false);
  };

  const handleSubmitAlumniTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takingAssignment) return;
    const testObj = psychologicalTests.find(t => t.id === takingAssignment.testId);
    const questions = takingAssignment.questions || testObj?.questions || [];
    const formattedAnswers = questions.map(q => ({
      questionId: q.id,
      prompt: q.prompt,
      questionText: q.prompt,
      answer: answerMap[q.id] || 'بدون پاسخ',
    }));

    setSubmittingTest(true);
    try {
      await submitPsychologicalTest(takingAssignment.id, formattedAnswers);
      setTakingAssignment(null);
      setAnswerMap({});
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleSaveClinicalReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingResult) return;
    setSavingReview(true);
    try {
      await reviewPsychologicalTestResult(reviewingResult.id, {
        psychologistNotes: clinicalNoteInput,
        scoreSummary: scoreSummaryInput,
      });
      setReviewingResult(null);
    } finally {
      setSavingReview(false);
    }
  };

  // =========================================================================
  // ALUMNI VIEW: My Personalized Visible Tests (External Links + Legacy)
  // =========================================================================
  if (!isPsychologistMode) {
    const myAssignments = testAssignments.filter(
      a => a.userId === currentUser?.id && a.isVisibleToUser !== false
    );
    const myResults = testResults.filter(r => r.userId === currentUser?.id);

    return (
      <div className="space-y-5 text-xs">
        <div className="bg-gradient-to-l from-slate-900 to-indigo-950 text-white rounded-3xl p-6 space-y-2 shadow-md">
          <h2 className="text-base font-black flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
            <span>تست‌ها و سنجش‌های روان‌شناختی اختصاصی شما</span>
          </h2>
          <p className="text-slate-300 leading-relaxed max-w-2xl">
            لینک تست‌ها یا آزمون‌هایی که توسط روان‌شناس مرکز اختصاصاً برای پرونده شما صادر و فعال شده‌اند در این بخش نمایش داده می‌شوند.
          </p>
        </div>

        {myAssignments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200">
              در حال حاضر تستی برای شما فعال نشده است
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              در صورت تجویز تست روان‌شناختی توسط مشاور، لینک اختصاصی شما بلافاصله در همین صفحه نمایش داده خواهد شد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssignments.map(a => {
              const hasExternalUrl = isSafeHttpUrl(a.externalTestUrl);
              const relatedRes = myResults.find(r => r.assignmentId === a.id);
              const isCompleted = a.status === 'completed' || a.status === 'reviewed';
              const displayTitle =
                a.externalTestTitle || a.testTitle || 'تست روان‌شناختی اختصاصی';

              return (
                <div
                  key={a.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {hasExternalUrl
                            ? 'تست اختصاصی برون‌سایتی'
                            : a.testCategory || 'آزمون روان‌شناختی'}
                        </span>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                          {displayTitle}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${
                          a.status === 'reviewed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : a.status === 'completed'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {hasExternalUrl
                          ? 'آماده انجام'
                          : a.status === 'reviewed'
                          ? 'بررسی‌شده توسط روان‌شناس'
                          : a.status === 'completed'
                          ? 'تکمیل‌شده'
                          : 'آماده پاسخگویی'}
                      </span>
                    </div>

                    {a.testDescription && (
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {a.testDescription}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>تجویزکننده: {a.assignedByName}</span>
                      {!hasExternalUrl && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>حدود {toPersianNumbers(a.estimatedMinutes || 15)} دقیقه</span>
                          </span>
                        </>
                      )}
                    </div>

                    {a.adminNote && (
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200">
                        <span className="font-bold">توضیح روان‌شناس: </span>
                        <span>{a.adminNote}</span>
                      </div>
                    )}

                    {relatedRes && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                        <div className="font-bold text-emerald-900 dark:text-emerald-300">
                          وضعیت ثبت: {relatedRes.scoreSummary}
                        </div>
                        {relatedRes.psychologistNotes && (
                          <div className="text-slate-700 dark:text-slate-300 pt-1 border-t border-emerald-200/70">
                            <span className="font-bold">جمع‌بندی روان‌شناس: </span>
                            <span>{relatedRes.psychologistNotes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {hasExternalUrl ? (
                    <a
                      href={a.externalTestUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>ورود به سایت و انجام تست</span>
                    </a>
                  ) : (
                    !isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setTakingAssignment(a);
                          setAnswerMap({});
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>شروع و پاسخگویی به تست</span>
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Take Legacy In-App Test Modal */}
        {takingAssignment && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <form
              onSubmit={handleSubmitAlumniTest}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm">{takingAssignment.testTitle}</h3>
                  {takingAssignment.instructions && (
                    <p className="text-[11px] text-slate-300 mt-1">{takingAssignment.instructions}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setTakingAssignment(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {(takingAssignment.questions || psychologicalTests.find(t => t.id === takingAssignment.testId)?.questions || []).map(
                  (q, idx) => (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {toPersianNumbers(idx + 1)}. {q.prompt}
                      </p>

                      {q.type === 'text' ? (
                        <textarea
                          rows={2}
                          required
                          value={answerMap[q.id] || ''}
                          onChange={e => setAnswerMap({ ...answerMap, [q.id]: e.target.value })}
                          placeholder="پاسخ خود را بنویسید..."
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || ['خیلی زیاد', 'زیاد', 'متوسط', 'کم', 'اصلاً']).map(opt => {
                            const selected = answerMap[q.id] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setAnswerMap({ ...answerMap, [q.id]: opt })}
                                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                                  selected
                                    ? 'border-emerald-500 bg-emerald-500/10 font-black text-emerald-900 dark:text-emerald-300'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setTakingAssignment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submittingTest}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingTest ? 'در حال ثبت...' : 'ارسال پاسخ‌نامه برای روان‌شناس'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PSYCHOLOGIST / ADMIN VIEW: Personalized External Links + Legacy Tests
  // =========================================================================
  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        {[
          { id: 'assign_unlock', label: `ارسال و نمایش لینک تست اختصاصی (${toPersianNumbers(testAssignments.length)})`, icon: Link2 },
          { id: 'results_review', label: `پاسخ‌نامه‌های داخلی (${toPersianNumbers(testResults.length)})`, icon: FileText },
          { id: 'catalog', label: `بانک آزمون‌های داخلی (${toPersianNumbers(psychologicalTests.length)})`, icon: ClipboardCheck },
        ].map(t => {
          const Icon = t.icon;
          const active = psychSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setPsychSubTab(t.id as any)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-all ${
                active
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-tab 1: Personalized External Test Link + Visibility Toggle */}
      {psychSubTab === 'assign_unlock' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAssignSubmit}
            className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>اختصاص تست به دانش‌آموخته</span>
              </h3>

              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setAssignmentMode('external_link')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    assignmentMode === 'external_link' ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  لینک سایت تست
                </button>
                {psychologicalTests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('internal_bank')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      assignmentMode === 'internal_bank' ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-white shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    بانک داخلی
                  </button>
                )}
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                {formError}
              </div>
            )}

            {/* Alumnus Search + Picker (Minimal PII: FullName + Phone ONLY) */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                ۱. انتخاب دانش‌آموخته / مراجع:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="جستجو با نام یا شماره موبایل..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <select
                required
                value={activeTargetUser?.id || ''}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                {filteredCandidates.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.phone ? `(${toPersianNumbers(u.phone)})` : ''}
                  </option>
                ))}
              </select>

              {activeTargetUser && (
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                      اطلاعات تماس مراجع انتخاب‌شده:
                    </span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {activeTargetUser.name}
                    </span>
                  </div>
                  {activeTargetUser.phone ? (
                    <a
                      href={`tel:${activeTargetUser.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-mono font-bold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{toPersianNumbers(activeTargetUser.phone)}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">شماره تماس ثبت نشده</span>
                  )}
                </div>
              )}
            </div>

            {assignmentMode === 'external_link' ? (
              <>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ۲. آدرس لینک اختصاصی تست در سایت آزمون *
                  </label>
                  <input
                    type="url"
                    required
                    dir="ltr"
                    value={externalTestUrl}
                    onChange={e => setExternalTestUrl(e.target.value)}
                    placeholder="https://test-platform.example.com/session/..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان تست (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={externalTestTitle}
                    onChange={e => setExternalTestTitle(e.target.value)}
                    placeholder="مثال: پرسشنامه شخصیت‌شناسی نئو / آزمون سازگاری زوجین"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">۲. انتخاب تست از بانک داخلی:</label>
                <select
                  required
                  value={selectedTestId || psychologicalTests[0]?.id || ''}
                  onChange={e => setSelectedTestId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {psychologicalTests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                توضیح یا راهنمای کوتاه برای دانش‌آموخته (اختیاری):
              </label>
              <textarea
                rows={2}
                value={assignNote}
                onChange={e => setAssignNote(e.target.value)}
                placeholder="مثال: لطفاً پیش از جلسه نوبت دوم تکمیل فرمایید..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={showImmediately}
                onChange={e => setShowImmediately(e.target.checked)}
              />
              <span>بلافاصله به این دانش‌آموخته نمایش داده شود</span>
            </label>

            <button
              type="submit"
              disabled={assigning || candidateUsers.length === 0}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {showImmediately ? <Eye className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>
                {assigning
                  ? 'در حال ثبت...'
                  : showImmediately
                  ? 'نمایش به دانش‌آموخته و ثبت لینک'
                  : 'ثبت لینک به صورت مخفی (ذخیره)'}
              </span>
            </button>
          </form>

          {/* Assigned External Links & Tests List */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              فهرست تست‌ها و لینک‌های اختصاصی مراجعان ({toPersianNumbers(testAssignments.length)})
            </h3>

            {testAssignments.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">هنوز لینک یا تستی برای مراجعان ثبت نشده است.</p>
            ) : (
              <div className="space-y-2.5">
                {testAssignments.map(a => {
                  const matchedClient = candidateUsers.find(c => c.id === a.userId);
                  const phone = a.userPhone || matchedClient?.phone || '';
                  const isVisible = a.isVisibleToUser !== false;
                  const title = a.externalTestTitle || a.testTitle || 'تست روان‌شناختی اختصاصی';

                  return (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5">
                            <span>{a.userName}</span>
                            {phone && (
                              <a
                                href={`tel:${phone}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]"
                              >
                                <Phone className="w-3 h-3" />
                                {toPersianNumbers(phone)}
                              </a>
                            )}
                            <span className="text-slate-400">—</span>
                            <span className="text-indigo-700 dark:text-indigo-400">{title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            ثبت توسط: {a.assignedByName}
                            {a.scoreSummary ? ` · ${a.scoreSummary}` : ''}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              toggleTestAssignmentVisibility(a.id, { isVisibleToUser: !isVisible })
                            }
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors border ${
                              isVisible
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                            }`}
                            title={isVisible ? 'مخفی کردن از کارتابل دانش‌آموخته' : 'نمایش به دانش‌آموخته'}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{isVisible ? 'نمایش به دانش‌آموخته' : 'مخفی'}</span>
                          </button>

                          {confirmDeleteAssignmentId === a.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteTestAssignment(a.id);
                                  setConfirmDeleteAssignmentId(null);
                                }}
                                className="px-2 py-1.5 rounded-xl bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                حذف
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteAssignmentId(null)}
                                className="px-2 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                              >
                                لغو
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAssignmentId(a.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="حذف تست"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {a.externalTestUrl && isSafeHttpUrl(a.externalTestUrl) && (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <a
                            href={a.externalTestUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            dir="ltr"
                            className="text-[11px] font-mono text-indigo-700 dark:text-indigo-400 hover:underline truncate flex-1 text-left"
                          >
                            {a.externalTestUrl}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyText(a.id, a.externalTestUrl || '')}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedId === a.id ? 'کپی شد' : 'کپی لینک'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 2: View Submitted Answers & Psychologist Review */}
      {psychSubTab === 'results_review' && (
        <div className="space-y-3">
          {testResults.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 text-slate-500">
              هنوز هیچ پاسخ‌نامه داخلی‌ای ثبت نشده است.
            </div>
          ) : (
            testResults.map(res => (
              <div
                key={res.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      {res.userName} — {res.testTitle}
                    </h4>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                      {res.scoreSummary}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReviewingResult(res);
                      setClinicalNoteInput(res.psychologistNotes || '');
                      setScoreSummaryInput(res.scoreSummary || '');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer self-start sm:self-center"
                  >
                    {res.psychologistNotes ? 'ویرایش تحلیل بالینی' : 'ثبت تحلیل و یادداشت روان‌شناس'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(res.answers || []).map((ans, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                      <div className="font-bold text-slate-700 dark:text-slate-300">{ans.questionText || ans.prompt}</div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-black mt-1">پاسخ: {ans.answer}</div>
                    </div>
                  ))}
                </div>

                {res.psychologistNotes && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200">
                    <span className="font-black">یادداشت روان‌شناس ({res.reviewedByName}): </span>
                    <span>{res.psychologistNotes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Sub-tab 3: Manage Internal Tests Catalog */}
      {psychSubTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">بانک تست‌های روان‌شناختی قابل فعال‌سازی</h3>
            <button
              type="button"
              onClick={() => setNewTestOpen(v => !v)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف تست جدید</span>
            </button>
          </div>

          {newTestOpen && (
            <form
              onSubmit={handleCreateTest}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-emerald-200 dark:border-emerald-900 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={newTestTitle}
                  onChange={e => setNewTestTitle(e.target.value)}
                  placeholder="عنوان تست"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
                <input
                  type="text"
                  value={newTestCategory}
                  onChange={e => setNewTestCategory(e.target.value)}
                  placeholder="دسته‌بندی"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="number"
                  value={newTestMinutes}
                  onChange={e => setNewTestMinutes(Number(e.target.value) || 15)}
                  placeholder="زمان تقریبی (دقیقه)"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <input
                type="text"
                value={newTestDesc}
                onChange={e => setNewTestDesc(e.target.value)}
                placeholder="توضیح مختصر هدف آزمون..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">سوالات آزمون:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setNewTestQuestions(prev => [
                        ...prev,
                        {
                          id: `q_${Date.now()}`,
                          prompt: '',
                          type: 'single_choice',
                          options: ['زیاد (۳)', 'متوسط (۲)', 'کم (۱)', 'اصلاً (۰)'],
                        },
                      ])
                    }
                    className="text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> افزودن سوال
                  </button>
                </div>

                {newTestQuestions.map((q, idx) => (
                  <div key={q.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={q.prompt}
                      onChange={e =>
                        setNewTestQuestions(prev =>
                          prev.map((item, i) => (i === idx ? { ...item, prompt: e.target.value } : item))
                        )
                      }
                      placeholder={`متن سوال ${toPersianNumbers(idx + 1)}`}
                      className="sm:col-span-7 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={(q.options || []).join('، ')}
                      onChange={e =>
                        setNewTestQuestions(prev =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  options: e.target.value.split(/[،,]/).map(s => s.trim()).filter(Boolean),
                                }
                              : item
                          )
                        )
                      }
                      placeholder="گزینه‌ها با کاما"
                      className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setNewTestQuestions(prev => prev.filter((_, i) => i !== idx))}
                      className="sm:col-span-1 p-2 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewTestOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  ذخیره آزمون جدید
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {psychologicalTests.map(t => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">{t.category}</span>
                    <button
                      type="button"
                      onClick={() => deletePsychologicalTest(t.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="حذف آزمون"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1">{t.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{t.description}</p>
                </div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <span>{toPersianNumbers((t.questions || []).length)} سوال استاندارد</span>
                  <span>{toPersianNumbers(t.estimatedMinutes)} دقیقه</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Review Modal */}
      {reviewingResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <form
            onSubmit={handleSaveClinicalReview}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ثبت جمع‌بندی بالینی برای {reviewingResult.userName}</span>
              </h3>
              <button type="button" onClick={() => setReviewingResult(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-bold mb-1">خلاصه نمره / وضعیت ارزیابی:</label>
              <input
                type="text"
                value={scoreSummaryInput}
                onChange={e => setScoreSummaryInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">تحلیل و توصیه روان‌شناس (نمایش در کارتابل متقاضی):</label>
              <textarea
                rows={4}
                required
                value={clinicalNoteInput}
                onChange={e => setClinicalNoteInput(e.target.value)}
                placeholder="تحلیل تخصصی نتایج و توصیه‌های جلسه..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={savingReview}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                {savingReview ? 'در حال ذخیره...' : 'ذخیره تحلیل بالینی'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

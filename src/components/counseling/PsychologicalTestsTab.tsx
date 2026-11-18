import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PsychologicalTest,
  PsychologicalTestAssignment,
  PsychologicalTestQuestion,
  PsychologicalTestResult,
} from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface PsychologicalTestsTabProps {
  isPsychologistMode?: boolean;
}

export const PsychologicalTestsTab: React.FC<PsychologicalTestsTabProps> = ({
  isPsychologistMode = false,
}) => {
  const {
    currentUser,
    users,
    counselingRequests,
    psychologicalTests,
    testAssignments,
    testResults,
    createPsychologicalTest,
    deletePsychologicalTest,
    assignPsychologicalTest,
    submitPsychologicalTest,
    reviewPsychologicalTestResult,
  } = useApp();

  // Psychologist Sub-tabs: assign_unlock | results_review | catalog
  const [psychSubTab, setPsychSubTab] = useState<'assign_unlock' | 'results_review' | 'catalog'>('assign_unlock');

  // Assign / Unlock Test Form
  const [selectedTestId, setSelectedTestId] = useState<string>(psychologicalTests[0]?.id || '');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Create New Test Form
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

  // Alumni Test Taking Modal
  const [takingAssignment, setTakingAssignment] = useState<PsychologicalTestAssignment | null>(null);
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [submittingTest, setSubmittingTest] = useState(false);

  // Combine alumni from `users` + applicants from `counselingRequests` so psychologist can pick any alumnus reliably
  const candidateUsersMap = new Map<string, { id: string; name: string; nationalId?: string }>();
  for (const u of users) {
    if (u.role === 'alumni' || u.role === 'customer' || u.id) {
      candidateUsersMap.set(u.id, { id: u.id, name: u.fullName, nationalId: u.nationalId });
    }
  }
  for (const r of counselingRequests) {
    if (r.applicantId && !candidateUsersMap.has(r.applicantId)) {
      candidateUsersMap.set(r.applicantId, {
        id: r.applicantId,
        name: r.applicantName,
        nationalId: r.userNationalId,
      });
    }
  }
  const candidateUsers = Array.from(candidateUsersMap.values());

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTestId = selectedTestId || psychologicalTests[0]?.id;
    const targetUser = candidateUsers.find(u => u.id === selectedUserId) || candidateUsers[0];
    if (!targetTestId || !targetUser) return;

    setAssigning(true);
    try {
      await assignPsychologicalTest({
        testId: targetTestId,
        userId: targetUser.id,
        userName: targetUser.name,
        userNationalId: targetUser.nationalId,
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
  // ALUMNI VIEW: My Unlocked Tests & Completed Results
  // =========================================================================
  if (!isPsychologistMode) {
    const myAssignments = testAssignments.filter(a => a.userId === currentUser?.id);
    const myResults = testResults.filter(r => r.userId === currentUser?.id);

    return (
      <div className="space-y-5 text-xs">
        <div className="bg-gradient-to-l from-slate-900 to-indigo-950 text-white rounded-3xl p-6 space-y-2 shadow-md">
          <h2 className="text-base font-black flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-400" />
            <span>بخش تست‌ها و سنجش‌های روان‌شناختی من</span>
          </h2>
          <p className="text-slate-300 leading-relaxed max-w-2xl">
            آزمون‌هایی که توسط روان‌شناس مرکز متناسب با جلسه مشاوره برای شما فعال («باز») شده است در این قسمت قرار می‌گیرند. پاسخ‌ها صرفاً توسط روان‌شناس پرونده قابل مشاهده است.
          </p>
        </div>

        {myAssignments.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200">
              در حال حاضر هیچ تست روان‌شناختی‌ای برای شما فعال نشده است
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              در صورت نیاز به ارزیابی استاندارد، روان‌شناس مرکز آزمون مرتبط را مستقیماً در کارتابل شما فعال خواهد کرد.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssignments.map(a => {
              const relatedRes = myResults.find(r => r.assignmentId === a.id);
              const isCompleted = a.status === 'completed' || a.status === 'reviewed';

              return (
                <div
                  key={a.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {a.testCategory || 'تست روان‌شناختی'}
                        </span>
                        <h3 className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
                          {a.testTitle || 'آزمون روان‌شناسی'}
                        </h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          a.status === 'reviewed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : a.status === 'completed'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {a.status === 'reviewed' ? 'بررسی‌شده توسط روان‌شناس' : a.status === 'completed' ? 'تکمیل‌شده' : 'آماده پاسخگویی'}
                      </span>
                    </div>

                    {a.testDescription && (
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{a.testDescription}</p>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>حدود {toPersianNumbers(a.estimatedMinutes || 15)} دقیقه</span>
                      </span>
                      <span>·</span>
                      <span>تجویزکننده: {a.assignedByName}</span>
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

                  {!isCompleted && (
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
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Take Test Modal */}
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
  // PSYCHOLOGIST / ADMIN VIEW: Unlock Test + Review Results + Manage Catalog
  // =========================================================================
  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        {[
          { id: 'assign_unlock', label: `باز کردن تست برای دانش‌آموخته (${toPersianNumbers(testAssignments.length)})`, icon: Unlock },
          { id: 'results_review', label: `نتایج و پاسخ‌نامه‌های ثبت‌شده (${toPersianNumbers(testResults.length)})`, icon: FileText },
          { id: 'catalog', label: `بانک آزمون‌های روان‌شناختی (${toPersianNumbers(psychologicalTests.length)})`, icon: ClipboardCheck },
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

      {/* Sub-tab 1: Unlock Specific Test for Specific Alumnus */}
      {psychSubTab === 'assign_unlock' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleAssignSubmit}
            className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs"
          >
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>فعال‌سازی (باز کردن) تست برای دانش‌آموخته مشخص</span>
            </h3>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">۱. انتخاب دانش‌آموخته:</label>
              <select
                required
                value={selectedUserId || candidateUsers[0]?.id || ''}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                {candidateUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.nationalId ? `(${u.nationalId})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">۲. انتخاب تست روان‌شناختی:</label>
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

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">توضیح یا دستورالعمل اختصاصی برای این عضو (اختیاری):</label>
              <textarea
                rows={2}
                value={assignNote}
                onChange={e => setAssignNote(e.target.value)}
                placeholder="مثال: لطفاً پیش از جلسه نوبت دوم تکمیل فرمایید..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={assigning || psychologicalTests.length === 0 || candidateUsers.length === 0}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>{assigning ? 'در حال فعال‌سازی...' : 'باز کردن تست در کارتابل دانش‌آموخته'}</span>
            </button>
          </form>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">
              فهرست تست‌های بازشده برای مراجعان
            </h3>

            {testAssignments.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">هنوز تستی برای مراجعان باز نشده است.</p>
            ) : (
              <div className="space-y-2.5">
                {testAssignments.map(a => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-black text-slate-900 dark:text-white">
                        {a.userName} — <span className="text-emerald-700 dark:text-emerald-400">{a.testTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        فعال‌سازی توسط: {a.assignedByName}
                        {a.scoreSummary ? ` · ${a.scoreSummary}` : ''}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black self-start sm:self-center ${
                        a.status === 'reviewed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : a.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {a.status === 'reviewed' ? 'تحلیل ثبت شد' : a.status === 'completed' ? 'پاسخ ثبت‌شده' : 'باز برای کاربر'}
                    </span>
                  </div>
                ))}
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
              هنوز هیچ پاسخ‌نامه‌ای توسط دانش‌آموختگان ثبت نشده است.
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

      {/* Sub-tab 3: Manage Tests Catalog */}
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
                  placeholder="عنوان تست (مثال: آزمون تاب‌آوری کانر-دیویدسون)"
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

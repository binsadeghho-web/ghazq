import React, { useState, useEffect, useCallback } from 'react';
import { Consultant, CounselingRequest, User } from '../../types';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Calendar,
  Clock,
  FolderKanban,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  ShieldCheck,
  UserCheck,
  FileText,
} from 'lucide-react';

interface ScheduleSlot {
  id: string;
  dayOfWeek: string;
  timeRange: string;
  mode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی';
  isAvailable: boolean;
}

interface CounselingCalendarAndDossierSuiteProps {
  currentUser: User | null;
  consultants: Consultant[];
  counselingRequests: CounselingRequest[];
  isOfficial: boolean;
  onSelectSlotForBooking?: (consultantId: string, slotSummary: string, mode: 'حضوری' | 'برخط (تصویری امن)' | 'تلفنی') => void;
}

const DEFAULT_SLOTS: ScheduleSlot[] = [
  { id: 'sl_1', dayOfWeek: 'شنبه', timeRange: '۱۵:۰۰ الی ۱۷:۰۰', mode: 'برخط (تصویری امن)', isAvailable: true },
  { id: 'sl_2', dayOfWeek: 'دوشنبه', timeRange: '۱۶:۰۰ الی ۱۸:۰۰', mode: 'حضوری', isAvailable: true },
  { id: 'sl_3', dayOfWeek: 'چهارشنبه', timeRange: '۱۴:۳۰ الی ۱۶:۳۰', mode: 'تلفنی', isAvailable: true },
];

export const CounselingCalendarAndDossierSuite: React.FC<CounselingCalendarAndDossierSuiteProps> = ({
  currentUser,
  consultants,
  counselingRequests,
  isOfficial,
  onSelectSlotForBooking,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'booking_calendar' | 'schedule_manager' | 'dossiers' | 'identity_privacy'>('booking_calendar');
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>(consultants[0]?.id || '');
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Schedule Manager Form State
  const [newSlotDay, setNewSlotDay] = useState('شنبه');
  const [newSlotTime, setNewSlotTime] = useState('۱۶:۰۰ الی ۱۷:۳۰');
  const [newSlotMode, setNewSlotMode] = useState<'حضوری' | 'برخط (تصویری امن)' | 'تلفنی'>('برخط (تصویری امن)');

  // Dossier Form State
  const [dossierReqId, setDossierReqId] = useState<string>('');
  const [dossierNumber, setDossierNumber] = useState<number>(1);
  const [dossierDate, setDossierDate] = useState<string>('۱۴۰۳/۰۸/۲۰');
  const [dossierSummary, setDossierSummary] = useState<string>('');
  const [dossierNotes, setDossierNotes] = useState<string>('');
  const [dossierNextGoal, setDossierNextGoal] = useState<string>('');
  const [dossierHideIdentity, setDossierHideIdentity] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadDossiers = useCallback(async () => {
    try {
      const list = await api.getCounselingDossiers();
      if (Array.isArray(list)) setDossiers(list);
    } catch {}
  }, []);

  useEffect(() => {
    loadDossiers();
    const unsub = api.subscribeToEvents(ev => {
      if (ev.type.startsWith('counseling.')) {
        loadDossiers();
      }
    });
    return () => unsub();
  }, [loadDossiers]);

  const activeConsultant = consultants.find(c => c.id === selectedConsultantId) || consultants[0];
  const currentSlots: ScheduleSlot[] = Array.isArray((activeConsultant as any)?.scheduleSlots) &&
    (activeConsultant as any).scheduleSlots.length > 0
    ? (activeConsultant as any).scheduleSlots
    : DEFAULT_SLOTS;

  const handleAddScheduleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultant) return;
    const nextSlot: ScheduleSlot = {
      id: `slot_${Date.now()}`,
      dayOfWeek: newSlotDay,
      timeRange: newSlotTime,
      mode: newSlotMode,
      isAvailable: true,
    };
    const updatedSlots = [...currentSlots, nextSlot];
    try {
      await api.updateConsultantSchedule(
        activeConsultant.id,
        updatedSlots,
        (activeConsultant as any).version || 1
      );
      showToast(`بازه زمانی جدید در تقویم حضور «${activeConsultant.name}» ثبت شد.`);
    } catch (err: any) {
      showToast(`خطا در ذخیره تقویم حضور: ${err.message}`);
    }
  };

  const handleRemoveScheduleSlot = async (slotId: string) => {
    if (!activeConsultant) return;
    const updatedSlots = currentSlots.filter(s => s.id !== slotId);
    try {
      await api.updateConsultantSchedule(
        activeConsultant.id,
        updatedSlots,
        (activeConsultant as any).version || 1
      );
      showToast('بازه زمانی از تقویم حضور مشاور حذف شد.');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`);
    }
  };

  const handleSaveDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetReq = counselingRequests.find(r => r.id === dossierReqId) || counselingRequests[0];
    if (!targetReq) {
      showToast('ابتدا یک درخواست مشاوره را انتخاب نمایید.');
      return;
    }
    try {
      await api.saveCounselingDossier({
        requestId: targetReq.id,
        consultantId: targetReq.preferredConsultantId || activeConsultant?.id || 'cons_1',
        applicantId: targetReq.applicantId,
        applicantName: targetReq.applicantName,
        hideApplicantIdentity: dossierHideIdentity,
        sessionNumber: dossierNumber,
        sessionDate: dossierDate,
        clinicalSummary: dossierSummary,
        privateNotes: dossierNotes,
        nextSessionGoal: dossierNextGoal,
      });
      setDossierSummary('');
      setDossierNotes('');
      setDossierNextGoal('');
      await loadDossiers();
      showToast('پرونده جلسه مشاوره با موفقیت در پایگاه داده ثبت گردید.');
    } catch (err: any) {
      showToast(`خطا در ثبت پرونده جلسه: ${err.message}`);
    }
  };

  const handleToggleRequestIdentity = async (req: CounselingRequest) => {
    const currentlyHidden = Boolean((req as any).hideIdentity);
    try {
      await api.toggleCounselingIdentityVisibility(
        req.id,
        !currentlyHidden,
        (req as any).version || 1
      );
      showToast(
        !currentlyHidden
          ? `هویت متقاضی «${req.applicantName}» مخفی گردید.`
          : `هویت متقاضی «${req.applicantName}» آشکار گردید.`
      );
    } catch (err: any) {
      showToast(`خطا: ${err.message}`);
    }
  };

  const visibleDossiers = isOfficial
    ? dossiers
    : dossiers.filter(d => d.applicantId === currentUser?.id);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5" dir="rtl">
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>سامانه تقویم نوبت‌دهی، مدیریت حضور مشاوران، پرونده جلسات و کنترل هویت</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            انتخاب تعاملی وقت از تقویم حضور اساتید، ثبت پرونده بالینی جلسات و کنترل نمایش یا مخفی‌سازی هویت مراجعان توسط ادمین
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('booking_calendar')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'booking_calendar'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>تقویم نوبت‌دهی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('dossiers')}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'dossiers'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>پرونده جلسات ({toPersianNumbers(visibleDossiers.length)})</span>
          </button>

          {isOfficial && (
            <>
              <button
                type="button"
                onClick={() => setActiveSubTab('schedule_manager')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeSubTab === 'schedule_manager'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>مدیریت تقویم حضور مشاوران</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('identity_privacy')}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeSubTab === 'identity_privacy'
                    ? 'bg-indigo-700 text-white'
                    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>مخفی / آشکارسازی هویت متقاضیان</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ۱. تقویم نوبت‌دهی تعاملی */}
      {activeSubTab === 'booking_calendar' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">انتخاب مشاور جهت مشاهده تقویم:</span>
            {consultants.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedConsultantId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                  (activeConsultant?.id || '') === c.id
                    ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-white font-black'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentSlots.map(slot => (
              <div
                key={slot.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      روز {slot.dayOfWeek}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      {slot.mode}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                    ساعت: {slot.timeRange}
                  </div>
                </div>

                {onSelectSlotForBooking && activeConsultant && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSlotForBooking(
                        activeConsultant.id,
                        `روز ${slot.dayOfWeek} ساعت ${slot.timeRange}`,
                        slot.mode
                      );
                      showToast(`نوبت «روز ${slot.dayOfWeek} ساعت ${slot.timeRange}» با ${activeConsultant.name} در فرم درخواست درج شد.`);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-black cursor-pointer transition-all"
                  >
                    انتخاب این نوبت از تقویم
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ۲. مدیریت تقویم حضور مشاوران (مخصوص ادمین) */}
      {activeSubTab === 'schedule_manager' && isOfficial && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">مشاور در حال ویرایش:</span>
            {consultants.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedConsultantId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                  (activeConsultant?.id || '') === c.id
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddScheduleSlot} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">روز هفته:</label>
              <select
                value={newSlotDay}
                onChange={e => setNewSlotDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              >
                {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">بازه ساعتی حضور:</label>
              <input
                type="text"
                required
                value={newSlotTime}
                onChange={e => setNewSlotTime(e.target.value)}
                placeholder="مثال: ۱۶:۰۰ الی ۱۸:۰۰"
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">نوع پذیرش:</label>
              <select
                value={newSlotMode}
                onChange={e => setNewSlotMode(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
              >
                <option value="برخط (تصویری امن)">برخط (تصویری امن)</option>
                <option value="حضوری">حضوری</option>
                <option value="تلفنی">تلفنی</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن به تقویم مشاور</span>
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {currentSlots.map(slot => (
              <div
                key={slot.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <span className="font-bold">{slot.dayOfWeek}</span>
                <span className="font-mono text-slate-500">{slot.timeRange}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{slot.mode}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveScheduleSlot(slot.id)}
                  className="text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ۳. پرونده جلسات (Session Dossiers) */}
      {activeSubTab === 'dossiers' && (
        <div className="space-y-4">
          {isOfficial && (
            <form
              onSubmit={handleSaveDossier}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <span className="text-xs font-black text-slate-900 dark:text-white block">
                ثبت پرونده جدید جلسه مشاوره:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    مراجع / نوبت مرتبط:
                  </label>
                  <select
                    value={dossierReqId}
                    onChange={e => setDossierReqId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="">انتخاب پرونده مراجع...</option>
                    {counselingRequests.map(r => (
                      <option key={r.id} value={r.id}>
                        {(r as any).hideIdentity ? 'مراجع محرمانه (هویت مخفی)' : r.applicantName} — {r.categoryTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    شماره جلسه:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={dossierNumber}
                    onChange={e => setDossierNumber(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    تاریخ برگزاری جلسه:
                  </label>
                  <input
                    type="text"
                    value={dossierDate}
                    onChange={e => setDossierDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    خلاصه ارزیابی و شرح جلسه (قابل مشاهده برای مراجع):
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={dossierSummary}
                    onChange={e => setDossierSummary(e.target.value)}
                    placeholder="جمع‌بندی جلسه و تمرین‌های توصیه‌شده..."
                    className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    هدف جلسه آینده و یادداشت تخصصی:
                  </label>
                  <textarea
                    rows={2}
                    value={dossierNextGoal}
                    onChange={e => setDossierNextGoal(e.target.value)}
                    placeholder="برنامه پیگیری در جلسه بعد..."
                    className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dossierHideIdentity}
                    onChange={e => setDossierHideIdentity(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>مخفی کردن هویت متقاضی در این پرونده جلسه</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-black cursor-pointer"
                >
                  ثبت در پرونده جلسات
                </button>
              </div>
            </form>
          )}

          {visibleDossiers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl">
              پرونده جلسه‌ای ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleDossiers.map(d => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span className="font-black text-slate-900 dark:text-white">
                        جلسه {toPersianNumbers(d.sessionNumber)} —{' '}
                        {d.hideApplicantIdentity ? 'مراجع محرمانه (هویت مخفی‌شده توسط ادمین)' : d.applicantName}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{toPersianNumbers(d.sessionDate)}</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    <strong>جمع‌بندی جلسه: </strong>
                    {d.clinicalSummary}
                  </p>

                  {d.nextSessionGoal && (
                    <p className="text-emerald-700 dark:text-emerald-400">
                      <strong>برنامه جلسه آینده: </strong>
                      {d.nextSessionGoal}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ۴. کنترل مخفی کردن / آشکار کردن هویت متقاضیان توسط ادمین */}
      {activeSubTab === 'identity_privacy' && isOfficial && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200 font-medium">
            در این بخش ادمین می‌تواند برای هر درخواست مشاوره، نمایش یا مخفی‌سازی نام و هویت متقاضی را فعال یا غیرفعال نماید.
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black">
                <tr>
                  <th className="p-3">نام متقاضی</th>
                  <th className="p-3">موضوع مشاوره</th>
                  <th className="p-3">وضعیت فعلی هویت</th>
                  <th className="p-3 text-center">تغییر وضعیت توسط ادمین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {counselingRequests.map(req => {
                  const isHidden = Boolean((req as any).hideIdentity);
                  return (
                    <tr key={req.id}>
                      <td className="p-3 font-bold">
                        {isHidden ? `مخفی (${req.applicantName})` : req.applicantName}
                      </td>
                      <td className="p-3">{req.categoryTitle}</td>
                      <td className="p-3">
                        {isHidden ? (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold">
                            هویت مخفی است
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                            هویت آشکار است
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRequestIdentity(req)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black inline-flex items-center gap-1.5 cursor-pointer ${
                            isHidden
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{isHidden ? 'آشکارسازی هویت' : 'مخفی کردن هویت'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

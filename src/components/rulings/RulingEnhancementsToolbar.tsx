import React, { useState } from 'react';
import { JudicialRuling } from '../../types';
import { api } from '../../services/apiClient';
import {
  Highlighter,
  Printer,
  Pin,
  Plus,
  Trash2,
  Award,
  Check,
  X,
} from 'lucide-react';

interface HighlightItem {
  id: string;
  phrase: string;
  color: 'amber' | 'emerald' | 'sky';
  note?: string;
}

interface RulingEnhancementsToolbarProps {
  ruling: JudicialRuling;
  isOfficial: boolean;
  onRulingUpdated: () => void;
}

export const RulingEnhancementsToolbar: React.FC<RulingEnhancementsToolbarProps> = ({
  ruling,
  isOfficial,
  onRulingUpdated,
}) => {
  const [newHighlightPhrase, setNewHighlightPhrase] = useState('');
  const [newHighlightColor, setNewHighlightColor] = useState<'amber' | 'emerald' | 'sky'>('amber');
  const [newHighlightNote, setNewHighlightNote] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const highlights: HighlightItem[] = Array.isArray((ruling as any).highlights)
    ? (ruling as any).highlights
    : [];

  const handleAddHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHighlightPhrase.trim()) return;
    const nextItem: HighlightItem = {
      id: `hl_${Date.now()}`,
      phrase: newHighlightPhrase.trim(),
      color: newHighlightColor,
      note: newHighlightNote.trim() || undefined,
    };
    const nextList = [...highlights, nextItem];
    try {
      await api.updateRulingHighlights(ruling.id, nextList, (ruling as any).version || 1);
      setNewHighlightPhrase('');
      setNewHighlightNote('');
      onRulingUpdated();
      showToast('فراز انتخابی در متن رأی هایلایت و ذخیره گردید.');
    } catch (err: any) {
      showToast(`خطا در ثبت هایلایت: ${err.message}`);
    }
  };

  const handleRemoveHighlight = async (id: string) => {
    const nextList = highlights.filter(h => h.id !== id);
    try {
      await api.updateRulingHighlights(ruling.id, nextList, (ruling as any).version || 1);
      onRulingUpdated();
      showToast('هایلایت حذف شد.');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`);
    }
  };

  const handleTogglePinDiscussion = async (discId: string, currentFeatured: boolean) => {
    try {
      await api.togglePinRulingDiscussion(ruling.id, discId, !currentFeatured);
      onRulingUpdated();
      showToast(!currentFeatured ? 'این دیدگاه به عنوان «نقد برگزیده» سنجاق شد.' : 'از حالت نقد برگزیده خارج شد.');
    } catch (err: any) {
      showToast(`خطا: ${err.message}`);
    }
  };

  // Render fullRulingText with highlighted spans
  const renderHighlightedText = (text: string) => {
    if (!highlights.length) return text;
    let segments: Array<{ text: string; color?: 'amber' | 'emerald' | 'sky'; note?: string }> = [{ text }];

    highlights.forEach(hl => {
      if (!hl.phrase) return;
      const nextSegments: typeof segments = [];
      segments.forEach(seg => {
        if (seg.color) {
          nextSegments.push(seg);
          return;
        }
        const parts = seg.text.split(hl.phrase);
        parts.forEach((part, idx) => {
          if (part) nextSegments.push({ text: part });
          if (idx < parts.length - 1) {
            nextSegments.push({ text: hl.phrase, color: hl.color, note: hl.note });
          }
        });
      });
      segments = nextSegments;
    });

    return segments.map((seg, idx) => {
      if (!seg.color) return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
      const colorClass =
        seg.color === 'emerald'
          ? 'bg-emerald-200/80 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-100 px-1 rounded font-bold'
          : seg.color === 'sky'
          ? 'bg-sky-200/80 dark:bg-sky-500/30 text-sky-950 dark:text-sky-100 px-1 rounded font-bold'
          : 'bg-amber-200/90 dark:bg-amber-500/35 text-amber-950 dark:text-amber-100 px-1 rounded font-bold';
      return (
        <mark key={idx} className={colorClass} title={seg.note || 'فراز هایلایت‌شده'}>
          {seg.text}
        </mark>
      );
    });
  };

  const featuredDiscussions = ruling.discussions.filter(d => (d as any).isFeatured);

  return (
    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800" dir="rtl">
      {toastMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* نوار ابزار نسخه چاپی و افزودن هایلایت */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Highlighter className="w-4 h-4 text-amber-500" />
            <span>ابزار هایلایت فرازهای کلیدی دادنامه و نسخه چاپی:</span>
          </span>

          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>مشاهده و چاپ نسخه رسمی دادنامه</span>
          </button>
        </div>

        {/* فرم ثبت هایلایت */}
        <form onSubmit={handleAddHighlight} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            value={newHighlightPhrase}
            onChange={e => setNewHighlightPhrase(e.target.value)}
            placeholder="عبارت یا جمله دقیقی از متن رأی را جهت هایلایت وارد کنید..."
            className="sm:col-span-5 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={newHighlightNote}
            onChange={e => setNewHighlightNote(e.target.value)}
            placeholder="حاشیه یا نکته علمی (اختیاری)..."
            className="sm:col-span-4 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <select
            value={newHighlightColor}
            onChange={e => setNewHighlightColor(e.target.value as any)}
            className="sm:col-span-2 px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
          >
            <option value="amber">طلایی</option>
            <option value="emerald">سبز</option>
            <option value="sky">آبی</option>
          </select>
          <button
            type="submit"
            className="sm:col-span-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center cursor-pointer"
            title="ثبت هایلایت"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* نمایش متن دادنامه با هایلایت‌های فعال */}
        {highlights.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex flex-wrap gap-1.5">
              {highlights.map(hl => (
                <span
                  key={hl.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                >
                  <Highlighter className="w-3 h-3 text-amber-500" />
                  <strong className="truncate max-w-[160px]">{hl.phrase}</strong>
                  {hl.note && <span className="text-slate-400">({hl.note})</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(hl.id)}
                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-xs leading-relaxed font-serif whitespace-pre-wrap">
              <span className="text-[11px] font-sans font-bold text-amber-600 dark:text-amber-400 block mb-1">
                نمای متن انشای دادنامه همراه با عبارات هایلایت‌شده:
              </span>
              {renderHighlightedText(ruling.fullRulingText)}
            </div>
          </div>
        )}
      </div>

      {/* بخش نقدهای برگزیده (Featured Critiques) + دکمه سنجاق برای ادمین */}
      {(featuredDiscussions.length > 0 || (isOfficial && ruling.discussions.length > 0)) && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>نقدهای برگزیده و سنجاق‌شده هیئت علمی ({featuredDiscussions.length}):</span>
            </span>
          </div>

          {featuredDiscussions.length > 0 ? (
            <div className="space-y-2">
              {featuredDiscussions.map(disc => (
                <div
                  key={disc.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/40 text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {disc.authorName} ({disc.authorRoleTitle}) — نقد برگزیده
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{disc.timestamp}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{disc.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              هنوز نقدی به عنوان «نقد برگزیده» انتخاب نشده است.
            </p>
          )}

          {isOfficial && ruling.discussions.length > 0 && (
            <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                انتخاب نقد برگزیده توسط مدیر:
              </span>
              {ruling.discussions.map(disc => {
                const isFeat = Boolean((disc as any).isFeatured);
                return (
                  <button
                    key={disc.id}
                    type="button"
                    onClick={() => handleTogglePinDiscussion(disc.id, isFeat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition-all ${
                      isFeat
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                    <span>
                      {isFeat ? `حذف برگزیده (${disc.authorName})` : `برگزیده کردن نقد ${disc.authorName}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* مودال نسخه چاپی رسمی دادنامه */}
      {showPrintModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setShowPrintModal(false)}
        >
          <div
            className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden max-h-[88vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">پیش‌نمایش نسخه چاپی دادنامه و نقدهای برگزیده</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ مستقیم / ذخیره PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-5 text-right font-serif">
              <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
                <div className="text-xs font-bold text-slate-500">
                  مرکز تخصصی فقه و قضا — تالار نقد و تحلیل آراء قضایی
                </div>
                <h2 className="text-lg font-black text-slate-900">{ruling.title}</h2>
                <div className="text-xs text-slate-600 font-sans">
                  مرجع صادرکننده: {ruling.courtBranch} | دادرس: {ruling.judgeName} | تاریخ:{' '}
                  {ruling.rulingDate}
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold font-sans text-slate-900">چکیده گردش کار:</h4>
                <p className="text-xs leading-relaxed text-slate-800">{ruling.summary}</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold font-sans text-slate-900">مستندات قانونی و اصول فقهی:</h4>
                <ul className="list-disc list-inside text-xs space-y-1 text-slate-800">
                  {ruling.legalPrinciples.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold font-sans text-slate-900">متن کامل انشای رأی:</h4>
                <div className="p-4 rounded-xl border border-slate-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {renderHighlightedText(ruling.fullRulingText)}
                </div>
              </div>

              {featuredDiscussions.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-300">
                  <h4 className="text-xs font-bold font-sans text-slate-900">نقدهای علمی برگزیده:</h4>
                  {featuredDiscussions.map(d => (
                    <div key={d.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <strong>{d.authorName}: </strong>
                      <span>{d.comment}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

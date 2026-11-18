import React, { useState } from 'react';
import { Send, MessageSquare, ShieldCheck, User as UserIcon } from 'lucide-react';
import { ResearchMentorship } from '../../../types';
import { formatResearchDateTimeFa } from './researchUiHelpers';

interface ResearchConversationThreadProps {
  request: ResearchMentorship;
  isOfficialViewer: boolean;
  onSendMessage: (requestId: string, message: string) => Promise<any>;
}

export const ResearchConversationThread: React.FC<ResearchConversationThreadProps> = ({
  request,
  isOfficialViewer,
  onSendMessage,
}) => {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const messages = Array.isArray(request.messages) ? request.messages : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const updated = await onSendMessage(request.id, text);
      if (updated) {
        setDraft('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
          <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>گفت‌وگو و مکاتبه دوطرفه پرونده ({messages.length})</span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          همگام‌سازی لحظه‌ای در تمامی وضعیت‌ها
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
          هنوز پیامی ثبت نشده است. {isOfficialViewer ? 'می‌توانید پاسخ یا راهنمایی خود را برای متقاضی بنویسید.' : 'می‌توانید پرسش یا تکمله خود را برای کارشناس پژوهش ارسال کنید.'}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pl-1">
          {messages.map(msg => {
            const fromOfficial = Boolean(msg.isOfficial);
            return (
              <div
                key={msg.id}
                className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                  fromOfficial
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                    {fromOfficial ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    )}
                    <span>{msg.senderName}</span>
                    <span className="text-slate-400">·</span>
                    <span className={fromOfficial ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                      {fromOfficial ? 'کارشناس / مسئول پژوهش' : 'متقاضی'}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-[10px] text-slate-400">
                    {formatResearchDateTimeFa(msg.createdAt)}
                  </span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={
            isOfficialViewer
              ? 'پاسخ یا نظر کارشناسی خود را برای پژوهشگر بنویسید...'
              : 'پاسخ یا توضیحات تکمیلی خود را بنویسید...'
          }
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 disabled:opacity-45 text-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sending ? 'ارسال...' : 'ارسال پیام'}</span>
        </button>
      </form>
    </div>
  );
};

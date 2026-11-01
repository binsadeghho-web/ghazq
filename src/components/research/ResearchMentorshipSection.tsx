import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ResearchMentorship } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import {
  Compass,
  CheckCircle2,
  Clock,
  Home,
  UserCheck,
  Plus,
  BookOpen,
  Sparkles,
  Download,
  X
} from 'lucide-react';

export const ResearchMentorshipSection: React.FC = () => {
  const { currentUser, researchMentorships, submitResearchProject, updateResearchProgress } = useApp();

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newField, setNewField] = useState('فقه و حقوق جزا و جرم‌شناسی');
  const [newAccommodation, setNewAccommodation] = useState(false);
  const [newCity, setNewCity] = useState<'قم' | 'تهران' | 'مشهد'>('قم');

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const userProjects = researchMentorships.filter(r => isOfficial || r.applicantId === currentUser?.id);

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    submitResearchProject({
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      thesisTitle: newTitle,
      field: newField,
      stage: 'proposal',
      stageTitle: 'تصویب عنوان و نگارش پروپوزال اولیه',
      accommodationRequested: newAccommodation,
      ...(newAccommodation && { accommodationCity: newCity }),
    });

    setNewTitle('');
    setNewAccommodation(false);
    setNewModalOpen(false);
    alert('پروژه پژوهشی شما ثبت شد و به کارگروه راهبری رساله‌ها ارجاع گردید.');
  };

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ModernMetricCard
          title="پروژه‌های در حال راهبری"
          value={researchMentorships.length}
          periodLabel="رساله‌های فعال دکتری و سطح ۴"
          unit="رساله"
          icon={<Compass className="w-4 h-4 text-amber-500" />}
        />
        <ModernMetricCard
          title="میانگین پیشرفت نگارش"
          value="۷۰٪"
          periodLabel="روند تدوین فصول"
          icon={<Clock className="w-4 h-4 text-blue-500" />}
        />
        <ModernMetricCard
          title="اسکان موقت پژوهشی"
          value="فعال"
          periodLabel="قم، تهران و مشهد"
          icon={<Home className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            راهبری پایان‌نامه‌ها
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>طرح ویژه هدایت رساله‌های دکتری و سطح ۴، هماهنگی استاد راهنما و اسکان پژوهشی</span>
            <span aria-hidden="true">·</span>
            <span>ویراستاری علمی و نقد آراء</span>
          </div>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت پروژه پژوهشی جدید</span>
        </button>
      </div>

      {/* 4 Pillars Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 space-y-2 hover:-translate-y-0.5 transition-all">
          <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 text-xs font-bold">۰۱.</span>
          <h3 className="text-xs font-black text-slate-900 dark:text-white">هماهنگی با استاد راهنما</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            تسهیل در ارتباط با اساتید خارج فقه و مستشاران عالی دیوان به عنوان استاد راهنما یا مشاور.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 space-y-2 hover:-translate-y-0.5 transition-all">
          <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 text-xs font-bold">۰۲.</span>
          <h3 className="text-xs font-black text-slate-900 dark:text-white">کوچینگ و شتاب‌دهی</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            برنامه‌ریزی فشرده ماهانه و نقد تخصصی فصول تدوین‌شده جهت تسریع در برگزاری جلسه دفاع.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 space-y-2 hover:-translate-y-0.5 transition-all">
          <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 text-xs font-bold">۰۳.</span>
          <h3 className="text-xs font-black text-slate-900 dark:text-white">اسکان موقت پژوهشی</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            امکان اقامت چندروزه در قم، تهران یا مشهد برای دسترسی به کتابخانه‌های مرجع خطی و اسنادی.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 space-y-2 hover:-translate-y-0.5 transition-all">
          <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 text-xs font-bold">۰۴.</span>
          <h3 className="text-xs font-black text-slate-900 dark:text-white">دسترسی به اسناد قضایی</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            معرفی‌نامه معتبر جهت دسترسی به آرای واقعی و اسناد پژوهشگاه قوه قضائیه.
          </p>
        </div>
      </div>

      {/* Active Mentorship Projects List */}
      <div className="space-y-4">
        {userProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200/90 dark:border-slate-800 text-xs text-slate-400">
            هنوز رساله‌ای در این بخش ثبت نشده است.
          </div>
        ) : (
          userProjects.map(project => (
            <div key={project.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 transition-colors">
              
              {/* Header without pills */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{project.field}</span>
                    <span aria-hidden="true">·</span>
                    <span>پژوهشگر: {project.applicantName}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {project.thesisTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">پیشرفت رساله:</span>
                    <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white">
                      {project.progressPercent}٪
                    </span>
                  </div>
                  <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-slate-900 dark:bg-amber-400 h-1.5 rounded-full"
                      style={{ width: `${project.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Mentorship Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">استاد راهنما:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {project.assignedSupervisor || 'در حال تعیین توسط شورا'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">مرحله تدوین:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{project.stageTitle}</span>
                  </div>

                  {project.accommodationRequested && (
                    <div className="text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                      اسکان موقت در شهر {project.accommodationCity} لحاظ گردیده است.
                    </div>
                  )}
                </div>

                {/* Milestones list */}
                <div className="lg:col-span-8 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">مراحل و گام‌های مصوب:</span>
                  <div className="space-y-1.5">
                    {project.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${m.isDone ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}`} />
                          <span className={m.isDone ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-500'}>{m.title}</span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">{m.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              {isOfficial && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      const p = prompt('درصد پیشرفت جدید (۰ الی ۱۰۰):', String(project.progressPercent));
                      if (p) updateResearchProgress(project.id, project.stage, project.stageTitle, Number(p));
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-medium active:scale-[0.98]"
                  >
                    به‌روزرسانی درصد پیشرفت
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Project Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">ثبت رساله در طرح شتاب‌دهی</h3>
                <p className="text-xs text-slate-400 mt-0.5">شروع کوچینگ و هماهنگی راهبری علمی</p>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عنوان رساله یا پایان‌نامه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بررسی فقهی استناد به ادله دیجیتال در احکام کیفری"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">گرایش تخصصی:</label>
                <select
                  value={newField}
                  onChange={e => setNewField(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="فقه و حقوق جزا و جرم‌شناسی">فقه و حقوق جزا و جرم‌شناسی</option>
                  <option value="فقه و حقوق خصوصی و قراردادها">فقه و حقوق خصوصی و قراردادها</option>
                  <option value="فقه القضاء و حقوق عمومی">فقه القضاء و حقوق عمومی</option>
                  <option value="فقه اقتصادی و تجارت">فقه اقتصادی و تجارت</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAccommodation}
                    onChange={e => setNewAccommodation(e.target.checked)}
                    className="rounded text-slate-900"
                  />
                  <span>تقاضای استفاده از اسکان موقت پژوهشی حین تدوین رساله</span>
                </label>

                {newAccommodation && (
                  <div className="pt-2 flex items-center gap-2 text-xs">
                    <span className="text-slate-500">شهر مقصد:</span>
                    <select
                      value={newCity}
                      onChange={e => setNewCity(e.target.value as any)}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="قم">قم مقدس (کتابخانه آیت‌الله مرعشی و فیضیه)</option>
                      <option value="تهران">تهران (دیوان عالی و کتابخانه مجلس)</option>
                      <option value="مشهد">مشهد مقدس (کتابخانه آستان قدس رضوی)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold active:scale-[0.98]"
                >
                  ثبت قطعی پروژه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

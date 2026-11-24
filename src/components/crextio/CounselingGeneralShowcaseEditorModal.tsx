import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  Megaphone,
  UserCheck,
  Sliders,
  Link2,
  FileAudio,
  FileVideo,
  FileText,
  Users,
  Phone,
  Image as ImageIcon,
  CheckCircle2,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import {
  CounselingGeneralShowcaseConfig,
  CounselingWorkshopItem,
  CounselingWorkshopMediaFile,
  CounselingAnnouncementItem,
} from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface CounselingGeneralShowcaseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EditorTab = 'overview' | 'workshops' | 'announcements' | 'consultants';

export const CounselingGeneralShowcaseEditorModal: React.FC<CounselingGeneralShowcaseEditorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { generalShowcase, updateGeneralShowcase, consultants } = useApp();

  const [draft, setDraft] = useState<CounselingGeneralShowcaseConfig>(generalShowcase);
  const [activeTab, setActiveTab] = useState<EditorTab>('overview');
  const [saving, setSaving] = useState(false);

  // Workshop editor state
  const [editingWorkshop, setEditingWorkshop] = useState<CounselingWorkshopItem | null>(null);
  const [isWorkshopFormOpen, setIsWorkshopFormOpen] = useState(false);
  const [uploadingWorkshopMedia, setUploadingWorkshopMedia] = useState(false);
  const [uploadingWorkshopBanner, setUploadingWorkshopBanner] = useState(false);
  const [extMediaTitle, setExtMediaTitle] = useState('');
  const [extMediaUrl, setExtMediaUrl] = useState('');
  const [extMediaType, setExtMediaType] = useState<'audio' | 'video' | 'file'>('audio');
  const [extMediaDuration, setExtMediaDuration] = useState('');

  // Workshop Registrations Modal / Drawer
  const [registrationsWorkshopId, setRegistrationsWorkshopId] = useState<string | null>(null);
  const [registrationsList, setRegistrationsList] = useState<
    Array<{ id: string; fullName: string; phone: string; notes: string; createdAt: string }>
  >([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Showcase banner upload state
  const [uploadingShowcaseImg, setUploadingShowcaseImg] = useState(false);

  // Announcement editor state
  const [editingAnnouncement, setEditingAnnouncement] = useState<CounselingAnnouncementItem | null>(null);
  const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState(false);
  const [uploadingAnnouncementImg, setUploadingAnnouncementImg] = useState(false);
  const [bulletsInput, setBulletsInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(generalShowcase);
    }
  }, [isOpen, generalShowcase]);

  const generalConsultants = useMemo(
    () => consultants.filter(c => c.isActive !== false && c.counselingType !== 'specialized_career'),
    [consultants]
  );

  if (!isOpen) return null;

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const saved = await updateGeneralShowcase(draft);
      if (saved) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  // --- Workshop Helpers ---
  const openNewWorkshop = () => {
    setEditingWorkshop({
      id: `ws_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: '',
      mode: 'upcoming',
      presenter: '',
      scheduleText: '',
      description: '',
      bannerUrl: '',
      registrationUrl: '',
      mediaFiles: [],
      isActive: true,
      displayOrder: (draft.workshops || []).length + 1,
    });
    setExtMediaTitle('');
    setExtMediaUrl('');
    setExtMediaDuration('');
    setIsWorkshopFormOpen(true);
  };

  const openEditWorkshop = (ws: CounselingWorkshopItem) => {
    setEditingWorkshop({ ...ws, mediaFiles: [...(ws.mediaFiles || [])] });
    setExtMediaTitle('');
    setExtMediaUrl('');
    setExtMediaDuration('');
    setIsWorkshopFormOpen(true);
  };

  const handleUploadShowcaseImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingShowcaseImg(true);
    try {
      const res = await api.uploadFile(file, 'counseling_media');
      setDraft(prev => ({ ...prev, showcaseImageUrl: res.url, showShowcaseImage: true }));
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('app:toast', { detail: { message: err?.message || 'خطا در بارگذاری تصویر ویترین', type: 'error' } })
      );
    } finally {
      setUploadingShowcaseImg(false);
      e.target.value = '';
    }
  };

  const handleUploadWorkshopBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingWorkshop) return;
    setUploadingWorkshopBanner(true);
    try {
      const res = await api.uploadFile(file, 'counseling_media');
      setEditingWorkshop(prev => (prev ? { ...prev, bannerUrl: res.url } : null));
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('app:toast', { detail: { message: err?.message || 'خطا در بارگذاری تصویر کارگاه', type: 'error' } })
      );
    } finally {
      setUploadingWorkshopBanner(false);
      e.target.value = '';
    }
  };

  const handleUploadWorkshopDiskFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingWorkshop) return;
    setUploadingWorkshopMedia(true);
    try {
      const res = await api.uploadFile(file, 'counseling_media');
      const mime = (file.type || '').toLowerCase();
      const detectedType: 'audio' | 'video' | 'file' = mime.startsWith('audio/')
        ? 'audio'
        : mime.startsWith('video/')
        ? 'video'
        : 'file';
      const newMedia: CounselingWorkshopMediaFile = {
        id: `mf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: extMediaTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
        mediaType: detectedType,
        url: res.url,
        sourceType: 'disk',
        durationOrSize: extMediaDuration.trim() || undefined,
      };
      setEditingWorkshop(prev =>
        prev ? { ...prev, mediaFiles: [...(prev.mediaFiles || []), newMedia] } : null
      );
      setExtMediaTitle('');
      setExtMediaDuration('');
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('app:toast', { detail: { message: err?.message || 'خطا در آپلود فایل جلسه', type: 'error' } })
      );
    } finally {
      setUploadingWorkshopMedia(false);
      e.target.value = '';
    }
  };

  const handleAddExternalWorkshopMedia = () => {
    if (!editingWorkshop || !extMediaUrl.trim()) return;
    const newMedia: CounselingWorkshopMediaFile = {
      id: `mf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: extMediaTitle.trim() || 'فایل جلسه کارگاه',
      mediaType: extMediaType,
      url: extMediaUrl.trim(),
      sourceType: 'external',
      durationOrSize: extMediaDuration.trim() || undefined,
    };
    setEditingWorkshop(prev =>
      prev ? { ...prev, mediaFiles: [...(prev.mediaFiles || []), newMedia] } : null
    );
    setExtMediaTitle('');
    setExtMediaUrl('');
    setExtMediaDuration('');
  };

  const handleSaveWorkshopItem = () => {
    if (!editingWorkshop || !editingWorkshop.title.trim()) return;
    setDraft(prev => {
      const exists = prev.workshops.some(w => w.id === editingWorkshop.id);
      return {
        ...prev,
        workshops: exists
          ? prev.workshops.map(w => (w.id === editingWorkshop.id ? editingWorkshop : w))
          : [editingWorkshop, ...prev.workshops],
      };
    });
    setIsWorkshopFormOpen(false);
    setEditingWorkshop(null);
  };

  const handleInspectRegistrations = async (workshopId: string) => {
    setRegistrationsWorkshopId(workshopId);
    setLoadingRegistrations(true);
    try {
      const list = await api.getWorkshopRegistrations(workshopId);
      setRegistrationsList(Array.isArray(list) ? list : []);
    } catch {
      setRegistrationsList([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // --- Announcement Helpers ---
  const openNewAnnouncement = () => {
    setEditingAnnouncement({
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: '',
      subtitle: '',
      organizerType: 'internal',
      bannerUrl: '',
      description: '',
      scheduleText: '',
      externalUrl: '',
      topics: [],
      isActive: true,
      displayOrder: (draft.announcements || []).length + 1,
    });
    setBulletsInput('');
    setIsAnnouncementFormOpen(true);
  };

  const openEditAnnouncement = (ann: CounselingAnnouncementItem) => {
    setEditingAnnouncement({ ...ann });
    setBulletsInput((ann.topics || []).join('\n'));
    setIsAnnouncementFormOpen(true);
  };

  const handleUploadAnnouncementBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingAnnouncement) return;
    setUploadingAnnouncementImg(true);
    try {
      const res = await api.uploadFile(file, 'counseling_media');
      setEditingAnnouncement(prev => (prev ? { ...prev, bannerUrl: res.url } : null));
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent('app:toast', { detail: { message: err?.message || 'خطا در بارگذاری تصویر پوستر', type: 'error' } })
      );
    } finally {
      setUploadingAnnouncementImg(false);
      e.target.value = '';
    }
  };

  const handleSaveAnnouncementItem = () => {
    if (!editingAnnouncement) return;
    const parsedBullets = bulletsInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const finalized: CounselingAnnouncementItem = {
      ...editingAnnouncement,
      topics: parsedBullets,
    };
    setDraft(prev => {
      const exists = prev.announcements.some(a => a.id === finalized.id);
      return {
        ...prev,
        announcements: exists
          ? prev.announcements.map(a => (a.id === finalized.id ? finalized : a))
          : [finalized, ...prev.announcements],
      };
    });
    setIsAnnouncementFormOpen(false);
    setEditingAnnouncement(null);
  };

  const toggleFeaturedConsultant = (consultantId: string) => {
    setDraft(prev => {
      const cur = prev.featuredConsultantIds || [];
      const exists = cur.includes(consultantId);
      return {
        ...prev,
        featuredConsultantIds: exists ? cur.filter(id => id !== consultantId) : [...cur, consultantId],
      };
    });
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-1 sm:p-5 overflow-hidden"
      dir="rtl"
    >
      <div className="w-full max-w-5xl max-h-[92dvh] sm:max-h-[92vh] rounded-t-[26px] sm:rounded-[28px] bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black flex items-center gap-2 truncate">
              <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">مدیریت ویترین ۳ بخشی خدمات روانشناختی و مشاوره</span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
              فعال/غیرفعال‌سازی مستقل هر کارت، مدیریت کارگاه‌ها و فایل‌های آرشیو، پوستر اطلاعیه‌ها و مشاورین معرفی‌شده
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-3 pb-2 bg-stone-50 dark:bg-slate-950/40 border-b border-stone-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: 'overview', label: 'تنظیمات و فعال‌سازی کارت‌ها', icon: Sliders },
            { id: 'workshops', label: `۱. کارگاه‌های آموزشی (${toPersianNumbers(draft.workshops.length)})`, icon: GraduationCap },
            { id: 'announcements', label: `۲. اطلاعیه‌های دوره‌ها (${toPersianNumbers(draft.announcements.length)})`, icon: Megaphone },
            { id: 'consultants', label: `۳. مشاورین مرکز (${toPersianNumbers((draft.featuredConsultantIds || []).length)})`, icon: UserCheck },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as EditorTab)}
                className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                  active
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-800 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain flex-1 min-h-0 space-y-5">
          {/* TAB 0: OVERVIEW & TOGGLES */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Row 1: Display Mode (Scheduled Carousel vs Grid) + Size Scale */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      نحوه نمایش ۳ بخش در ویترین
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, displayMode: 'carousel' })}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        (draft.displayMode || 'carousel') === 'carousel'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="font-black flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5" />
                        <span>ویترین زمان‌بندی‌شده</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 ${(draft.displayMode || 'carousel') === 'carousel' ? 'text-emerald-100' : 'text-stone-500'}`}>
                        چرخش خودکار بین بخش‌های فعال
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, displayMode: 'grid' })}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        draft.displayMode === 'grid'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="font-black flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>نمایش ستونی هم‌زمان</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 ${draft.displayMode === 'grid' ? 'text-emerald-100' : 'text-stone-500'}`}>
                        نمایش کنار هم بخش‌های فعال
                      </div>
                    </button>
                  </div>

                  {(draft.displayMode || 'carousel') === 'carousel' && (
                    <div className="pt-2 border-t border-stone-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 font-bold cursor-pointer text-stone-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={draft.carouselAutoplay !== false}
                          onChange={e => setDraft({ ...draft, carouselAutoplay: e.target.checked })}
                        />
                        <span>جابه‌جایی خودکار زمان‌بندی‌شده</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500">مکث هر اسلاید:</span>
                        <select
                          value={Number(draft.carouselIntervalSeconds || 6)}
                          onChange={e => setDraft({ ...draft, carouselIntervalSeconds: Number(e.target.value) })}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                        >
                          {[4, 5, 6, 8, 10, 12, 15].map(sec => (
                            <option key={sec} value={sec}>
                              {toPersianNumbers(sec)} ثانیه
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Size / Scale Control */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      {(draft.showcaseScale === 'micro' || draft.showcaseScale === 'compact') ? (
                        <Minimize2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-emerald-700" />
                      )}
                      اندازه ویترین در داشبورد
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'micro', label: 'خیلی کوچک', desc: 'نوار فشرده' },
                      { id: 'compact', label: 'کوچک', desc: 'کم‌ارتفاع' },
                      { id: 'normal', label: 'استاندارد', desc: 'متعادل' },
                      { id: 'expanded', label: 'بزرگ', desc: 'گسترده' },
                    ].map(sz => {
                      const active = (draft.showcaseScale || 'normal') === sz.id;
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => setDraft({ ...draft, showcaseScale: sz.id as any })}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            active
                              ? 'bg-stone-900 text-white border-stone-900 dark:bg-emerald-700 dark:border-emerald-700'
                              : 'bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-stone-100'
                          }`}
                        >
                          <div className="font-black text-[11px]">{sz.label}</div>
                          <div className={`text-[10px] mt-0.5 ${active ? 'text-stone-300' : 'text-stone-400'}`}>
                            {sz.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Titles + Showcase Editorial Image Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-stone-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-stone-200 dark:border-slate-800">
                <div className="lg:col-span-7 space-y-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-slate-200 mb-1">تیتر اصلی ویترین داشبورد:</label>
                    <input
                      type="text"
                      value={draft.sectionTitle || ''}
                      onChange={e => setDraft({ ...draft, sectionTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-slate-200 mb-1">توضیح کوتاه زیر تیتر ویترین:</label>
                    <input
                      type="text"
                      value={draft.sectionSubtitle || ''}
                      onChange={e => setDraft({ ...draft, sectionSubtitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="lg:col-span-5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-700" />
                      تصویر شاخص ویترین
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.showShowcaseImage !== false}
                        onChange={e => setDraft({ ...draft, showShowcaseImage: e.target.checked })}
                      />
                      <span>نمایش تصویر</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    {draft.showcaseImageUrl ? (
                      <img
                        src={draft.showcaseImageUrl}
                        alt="تصویر ویترین مشاوره"
                        className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-400 border border-dashed border-stone-300 shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-bold cursor-pointer text-[11px]">
                          {uploadingShowcaseImg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>آپلود عکس ویترین</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadShowcaseImage} />
                        </label>
                        {draft.showcaseImageUrl && (
                          <button
                            type="button"
                            onClick={() => setDraft({ ...draft, showcaseImageUrl: '' })}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] cursor-pointer"
                          >
                            حذف عکس
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        dir="ltr"
                        value={draft.showcaseImageUrl || ''}
                        onChange={e => setDraft({ ...draft, showcaseImageUrl: e.target.value })}
                        placeholder="یا نشانی تصویر (اختیاری)"
                        className="w-full px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1 Toggle */}
                <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${draft.showWorkshopsCard ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-stone-50 dark:bg-slate-800/30 border-stone-200 dark:border-slate-800 opacity-75'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      بخش ۱: کارگاه‌های آموزشی
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, showWorkshopsCard: !draft.showWorkshopsCard })}
                      className={`px-2.5 py-1 rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer ${
                        draft.showWorkshopsCard
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-300 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                      }`}
                    >
                      {draft.showWorkshopsCard ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{draft.showWorkshopsCard ? 'فعال' : 'غیرفعال'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.workshopsCardTitle}
                    onChange={e => setDraft({ ...draft, workshopsCardTitle: e.target.value })}
                    placeholder="عنوان کارت کارگاه‌ها"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={draft.workshopsCardSubtitle || ''}
                    onChange={e => setDraft({ ...draft, workshopsCardSubtitle: e.target.value })}
                    placeholder="توضیح کوتاه بخش..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                  />
                </div>

                {/* Card 2 Toggle */}
                <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${draft.showAnnouncementsCard ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-stone-50 dark:bg-slate-800/30 border-stone-200 dark:border-slate-800 opacity-75'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Megaphone className="w-4 h-4 text-amber-700" />
                      بخش ۲: اطلاعیه‌ها
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, showAnnouncementsCard: !draft.showAnnouncementsCard })}
                      className={`px-2.5 py-1 rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer ${
                        draft.showAnnouncementsCard
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-300 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                      }`}
                    >
                      {draft.showAnnouncementsCard ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{draft.showAnnouncementsCard ? 'فعال' : 'غیرفعال'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.announcementsCardTitle}
                    onChange={e => setDraft({ ...draft, announcementsCardTitle: e.target.value })}
                    placeholder="عنوان کارت اطلاعیه‌ها"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                  />
                  <textarea
                    rows={2}
                    value={draft.announcementsCardSubtitle || ''}
                    onChange={e => setDraft({ ...draft, announcementsCardSubtitle: e.target.value })}
                    placeholder="توضیح کوتاه بخش..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                  />
                </div>

                {/* Card 3 Toggle */}
                <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${draft.showFeaturedConsultantCard ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800' : 'bg-stone-50 dark:bg-slate-800/30 border-stone-200 dark:border-slate-800 opacity-75'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-rose-700" />
                      بخش ۳: مشاورین مرکز
                    </span>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, showFeaturedConsultantCard: !draft.showFeaturedConsultantCard })}
                      className={`px-2.5 py-1 rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer ${
                        draft.showFeaturedConsultantCard
                          ? 'bg-rose-700 text-white'
                          : 'bg-stone-300 dark:bg-slate-700 text-stone-700 dark:text-slate-200'
                      }`}
                    >
                      {draft.showFeaturedConsultantCard ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{draft.showFeaturedConsultantCard ? 'فعال' : 'غیرفعال'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={draft.consultantCardTitle}
                    onChange={e => setDraft({ ...draft, consultantCardTitle: e.target.value })}
                    placeholder="عنوان کارت مشاورین"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                  />
                  <input
                    type="text"
                    value={draft.consultantCardCtaLabel || 'رزرو وقت مشاوره'}
                    onChange={e => setDraft({ ...draft, consultantCardCtaLabel: e.target.value })}
                    placeholder="متن دکمه رزرو وقت مشاوره"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: WORKSHOPS & ARCHIVE */}
          {activeTab === 'workshops' && (
            <div className="space-y-4">
              {/* Showcase Filtering Policy & What to display in each */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-black text-stone-900 dark:text-white">
                      حالت نمایش کارگاه‌های فعال و آرشیو در ویترین (بدون گزینه «همه»)
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      انتخاب کنید کاربران فقط کارگاه‌های فعال را ببینند، فقط آرشیو جلسات را ببینند یا هر دو بخش مجزا را.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 shrink-0">
                    {[
                      { id: 'both', label: 'هر دو (فعال و آرشیو)' },
                      { id: 'upcoming_only', label: 'فقط کارگاه‌های فعال' },
                      { id: 'archive_only', label: 'فقط آرشیو جلسات' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, workshopsDisplayMode: opt.id as any })}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          (draft.workshopsDisplayMode || 'both') === opt.id
                            ? 'bg-emerald-800 text-white'
                            : 'text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* What to display in Active Workshops vs Archive Sessions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-stone-200/80 dark:border-slate-700">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-2">
                    <div className="font-black text-emerald-900 dark:text-emerald-300">
                      محتوای قابل نمایش در «کارگاه‌های فعال»:
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px]">
                      {[
                        { key: 'showImage', label: 'تصویر / پوستر' },
                        { key: 'showPresenter', label: 'نام مدرس' },
                        { key: 'showSchedule', label: 'زمان‌بندی' },
                        { key: 'showDescription', label: 'توضیح کوتاه' },
                        { key: 'showActionBadge', label: 'وضعیت ثبت‌نام' },
                      ].map(f => {
                        const checked = (draft.upcomingFields as any)?.[f.key] !== false;
                        return (
                          <label key={f.key} className="flex items-center gap-1.5 cursor-pointer font-bold text-stone-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e =>
                                setDraft({
                                  ...draft,
                                  upcomingFields: {
                                    ...(draft.upcomingFields || {}),
                                    [f.key]: e.target.checked,
                                  },
                                })
                              }
                            />
                            <span>{f.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-2">
                    <div className="font-black text-indigo-900 dark:text-indigo-300">
                      محتوای قابل نمایش در «آرشیو جلسات»:
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px]">
                      {[
                        { key: 'showImage', label: 'تصویر / کاور' },
                        { key: 'showPresenter', label: 'ارائه‌دهنده' },
                        { key: 'showSchedule', label: 'تاریخ / مدت' },
                        { key: 'showDescription', label: 'توضیح کوتاه' },
                        { key: 'showActionBadge', label: 'تعداد فایل قابل دانلود' },
                      ].map(f => {
                        const defaultVal = f.key === 'showDescription' ? false : true;
                        const val = (draft.archiveFields as any)?.[f.key];
                        const checked = val !== undefined ? Boolean(val) : defaultVal;
                        return (
                          <label key={f.key} className="flex items-center gap-1.5 cursor-pointer font-bold text-stone-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={e =>
                                setDraft({
                                  ...draft,
                                  archiveFields: {
                                    ...(draft.archiveFields || {}),
                                    [f.key]: e.target.checked,
                                  },
                                })
                              }
                            />
                            <span>{f.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-stone-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-stone-200 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-stone-900 dark:text-white">مدیریت کارگاه‌های فعال و جلسات آرشیوی</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    امکان بارگذاری عکس پوستر، فایل صوتی، ویدئویی و جزوه روی دیسک یا لینک دانلود خارجی
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewWorkshop}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن کارگاه یا آرشیو</span>
                </button>
              </div>

              {isWorkshopFormOpen && editingWorkshop && (
                <div className="p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                    <span className="font-black text-emerald-900 dark:text-emerald-300">
                      {editingWorkshop.title ? `ویرایش: ${editingWorkshop.title}` : 'ثبت کارگاه / جلسه آرشیو جدید'}
                    </span>
                    <button type="button" onClick={() => setIsWorkshopFormOpen(false)} className="text-stone-400 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block font-bold mb-1">عنوان کارگاه / جلسه *</label>
                      <input
                        type="text"
                        value={editingWorkshop.title}
                        onChange={e => setEditingWorkshop({ ...editingWorkshop, title: e.target.value })}
                        placeholder="مثال: کارگاه مهارت‌های گفتگوی زوجین"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">نوع بخش</label>
                      <select
                        value={editingWorkshop.mode}
                        onChange={e =>
                          setEditingWorkshop({
                            ...editingWorkshop,
                            mode: e.target.value === 'archive' ? 'archive' : 'upcoming',
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                      >
                        <option value="upcoming">کارگاه پیش‌رو (امکان ثبت‌نام)</option>
                        <option value="archive">آرشیو جلسات برگزارشده (صوت/ویدئو)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1">ارائه‌دهنده / مدرس</label>
                      <input
                        type="text"
                        value={editingWorkshop.presenter || ''}
                        onChange={e => setEditingWorkshop({ ...editingWorkshop, presenter: e.target.value })}
                        placeholder="نام استاد یا روان‌شناس"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">تاریخ و ساعت / مدت</label>
                      <input
                        type="text"
                        value={editingWorkshop.scheduleText || ''}
                        onChange={e => setEditingWorkshop({ ...editingWorkshop, scheduleText: e.target.value })}
                        placeholder="مثال: پنجشنبه ۱۸ آبان · ساعت ۱۶"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">لینک خارجی ثبت‌نام (اختیاری)</label>
                      <input
                        type="url"
                        dir="ltr"
                        value={editingWorkshop.registrationUrl || ''}
                        onChange={e => setEditingWorkshop({ ...editingWorkshop, registrationUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">توضیحات کارگاه</label>
                      <textarea
                        rows={2}
                        value={editingWorkshop.description || ''}
                        onChange={e => setEditingWorkshop({ ...editingWorkshop, description: e.target.value })}
                        placeholder="سرفصل‌ها یا راهنمای شرکت در کارگاه..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block font-bold">پوستر یا تصویر کارگاه / جلسه (اختیاری)</label>
                      <div className="flex items-center gap-2.5">
                        {editingWorkshop.bannerUrl ? (
                          <img
                            src={editingWorkshop.bannerUrl}
                            alt={editingWorkshop.title || 'پوستر کارگاه'}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-stone-300 flex items-center justify-center text-stone-400 shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <input
                          type="text"
                          dir="ltr"
                          value={editingWorkshop.bannerUrl || ''}
                          onChange={e => setEditingWorkshop({ ...editingWorkshop, bannerUrl: e.target.value })}
                          placeholder="آدرس تصویر یا بارگذاری..."
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-mono"
                        />
                        <label className="px-3 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer flex items-center gap-1.5 shrink-0">
                          {uploadingWorkshopBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>آپلود عکس</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadWorkshopBanner} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Media / Archive Files Section */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
                    <h5 className="font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                      <FileAudio className="w-4 h-4 text-emerald-700" />
                      <span>فایل‌های قابل دانلود جلسه (صوتی، تصویری یا جزوه — آپلود روی دیسک یا لینک دانلود)</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={extMediaTitle}
                        onChange={e => setExtMediaTitle(e.target.value)}
                        placeholder="عنوان فایل (مثلاً صوت جلسه اول)"
                        className="sm:col-span-2 px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700"
                      />
                      <select
                        value={extMediaType}
                        onChange={e => setExtMediaType(e.target.value as any)}
                        className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 font-bold"
                      >
                        <option value="audio">فایل صوتی</option>
                        <option value="video">فایل تصویری / ویدئو</option>
                        <option value="file">فایل جزوه / اسناد</option>
                      </select>
                      <input
                        type="text"
                        value={extMediaDuration}
                        onChange={e => setExtMediaDuration(e.target.value)}
                        placeholder="مدت (مثلاً ۵۰ دقیقه)"
                        className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        value={extMediaUrl}
                        onChange={e => setExtMediaUrl(e.target.value)}
                        placeholder="لینک دانلود خارجی فایل (https://...)"
                        className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddExternalWorkshopMedia}
                        disabled={!extMediaUrl.trim()}
                        className="px-3 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>افزودن لینک دانلود</span>
                      </button>

                      <label className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer">
                        {uploadingWorkshopMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>بارگذاری مستقیم فایل روی دیسک سرور</span>
                        <input
                          type="file"
                          accept="audio/*,video/*,application/pdf,.doc,.docx,.zip"
                          className="hidden"
                          onChange={handleUploadWorkshopDiskFile}
                        />
                      </label>
                    </div>

                    {(editingWorkshop.mediaFiles || []).length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {(editingWorkshop.mediaFiles || []).map(mf => (
                          <div
                            key={mf.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {mf.mediaType === 'audio' ? (
                                <FileAudio className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : mf.mediaType === 'video' ? (
                                <FileVideo className="w-4 h-4 text-indigo-600 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                              <span className="font-bold truncate">{mf.title}</span>
                              <span className="px-2 py-0.5 rounded-md bg-stone-200 dark:bg-slate-700 text-[10px]">
                                {mf.sourceType === 'disk' ? 'فایل سرور' : 'لینک خارجی'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingWorkshop(prev =>
                                  prev
                                    ? { ...prev, mediaFiles: (prev.mediaFiles || []).filter(x => x.id !== mf.id) }
                                    : null
                                )
                              }
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingWorkshop.isActive !== false}
                        onChange={e => setEditingWorkshop({ ...editingWorkshop, isActive: e.target.checked })}
                      />
                      <span>در ویترین داشبورد نمایش داده شود</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsWorkshopFormOpen(false)}
                        className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveWorkshopItem}
                        className="px-5 py-2 rounded-xl bg-emerald-800 text-white font-black cursor-pointer"
                      >
                        تایید و افزودن به لیست
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Workshops list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draft.workshops.map(ws => {
                  const isVisible = ws.isActive !== false;
                  return (
                    <div
                      key={ws.id}
                      className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border flex flex-col justify-between gap-3 transition-opacity ${
                        isVisible ? 'border-stone-200 dark:border-slate-800' : 'border-stone-200/70 dark:border-slate-800/50 opacity-60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              ws.mode === 'upcoming'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-indigo-100 text-indigo-900'
                            }`}
                          >
                            {ws.mode === 'upcoming' ? 'کارگاه فعال (پیش‌رو)' : 'آرشیو جلسه'}
                          </span>
                          <div className="flex items-center gap-1">
                            {ws.mode === 'upcoming' && (
                              <button
                                type="button"
                                onClick={() => handleInspectRegistrations(ws.id)}
                                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                title="مشاهده لیست ثبت‌نام‌کنندگان"
                              >
                                <Users className="w-3 h-3" />
                                <span>{toPersianNumbers(ws.registrationsCount || 0)} شرکت‌کننده</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setDraft(prev => ({
                                  ...prev,
                                  workshops: prev.workshops.map(item =>
                                    item.id === ws.id ? { ...item, isActive: item.isActive === false } : item
                                  ),
                                }))
                              }
                              className={`p-1.5 rounded-lg cursor-pointer ${
                                isVisible
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                  : 'text-stone-400 bg-stone-100 hover:bg-stone-200'
                              }`}
                              title={isVisible ? 'در حال نمایش در ویترین (کلیک برای مخفی‌سازی)' : 'مخفی در ویترین (کلیک برای نمایش)'}
                            >
                              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditWorkshop(ws)}
                              className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                              title="ویرایش"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDraft(prev => ({
                                  ...prev,
                                  workshops: prev.workshops.filter(item => item.id !== ws.id),
                                }))
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {ws.bannerUrl && (
                            <img
                              src={ws.bannerUrl}
                              alt={ws.title}
                              className="w-11 h-11 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <h5 className="font-black text-stone-900 dark:text-white truncate">{ws.title}</h5>
                            <p className="text-[11px] text-stone-500 truncate mt-0.5">
                              {ws.presenter ? `${ws.presenter} · ` : ''}
                              {ws.scheduleText || ''}
                              {(ws.mediaFiles || []).length > 0
                                ? ` · ${toPersianNumbers((ws.mediaFiles || []).length)} فایل`
                                : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {draft.workshops.length === 0 && (
                  <div className="md:col-span-2 p-8 text-center text-stone-500 border border-dashed border-stone-300 rounded-2xl">
                    هنوز کارگاه یا جلسه آرشیوی ثبت نشده است. برای افزودن روی دکمه «افزودن کارگاه یا آرشیو» کلیک کنید.
                  </div>
                )}
              </div>

              {/* Registrations viewer inside Workshops tab */}
              {registrationsWorkshopId && (
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-stone-900 dark:text-white">
                      ثبت‌نام‌کنندگان کارگاه ({toPersianNumbers(registrationsList.length)} نفر)
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegistrationsWorkshopId(null)}
                      className="text-stone-400 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingRegistrations ? (
                    <div className="py-4 text-center text-stone-500">در حال بارگذاری فهرست...</div>
                  ) : registrationsList.length === 0 ? (
                    <div className="py-3 text-stone-500">هنوز عضوی در این کارگاه ثبت‌نام نکرده است.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {registrationsList.map(reg => (
                        <div
                          key={reg.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 flex items-center justify-between gap-2"
                        >
                          <span className="font-bold text-stone-900 dark:text-white truncate">{reg.fullName}</span>
                          {reg.phone && (
                            <a
                              href={`tel:${reg.phone}`}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 shrink-0"
                            >
                              <Phone className="w-3 h-3" />
                              {toPersianNumbers(reg.phone)}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 bg-stone-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-stone-200 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-stone-900 dark:text-white">اطلاعیه‌های دوره‌های روان‌شناسی (داخلی و برون‌مرکزی)</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    تمام فیلدهای متنی اختیاری هستند؛ می‌توانید صرفاً پوستر اطلاعیه را بارگذاری کنید تا با کلیک بزرگ‌نمایی شود.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewAnnouncement}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن اطلاعیه جدید</span>
                </button>
              </div>

              {isAnnouncementFormOpen && editingAnnouncement && (
                <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
                    <span className="font-black text-amber-950 dark:text-amber-200">فرم ثبت / ویرایش اطلاعیه دوره</span>
                    <button type="button" onClick={() => setIsAnnouncementFormOpen(false)} className="text-stone-400 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Image uploader front & center */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 space-y-2">
                    <label className="block font-black text-stone-900 dark:text-white">
                      تصویر / پوستر اطلاعیه (نمایش در کارت و بزرگ‌نمایی هنگام کلیک):
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {editingAnnouncement.bannerUrl ? (
                        <img
                          src={editingAnnouncement.bannerUrl}
                          alt="پیش‌نمایش"
                          className="w-24 h-24 rounded-xl object-cover border border-stone-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center text-stone-400 border border-dashed border-stone-300">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-[220px] space-y-2">
                        <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer">
                          {uploadingAnnouncementImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span>بارگذاری تصویر پوستر اطلاعیه</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleUploadAnnouncementBanner} />
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={editingAnnouncement.bannerUrl || ''}
                          onChange={e =>
                            setEditingAnnouncement({ ...editingAnnouncement, bannerUrl: e.target.value })
                          }
                          placeholder="یا آدرس URL تصویر را وارد کنید (اختیاری)"
                          className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1">عنوان دوره (اختیاری)</label>
                      <input
                        type="text"
                        value={editingAnnouncement.title || ''}
                        onChange={e => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                        placeholder="مثال: دوره تربیت مربی خانواده"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">نوع برگزاری</label>
                      <select
                        value={editingAnnouncement.organizerType}
                        onChange={e =>
                          setEditingAnnouncement({
                            ...editingAnnouncement,
                            organizerType: e.target.value === 'external' ? 'external' : 'internal',
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-bold"
                      >
                        <option value="internal">دوره داخلی مرکز</option>
                        <option value="external">دوره برون‌مرکزی / معرفی</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">زمان‌بندی / تاریخ (اختیاری)</label>
                      <input
                        type="text"
                        value={editingAnnouncement.scheduleText || ''}
                        onChange={e =>
                          setEditingAnnouncement({ ...editingAnnouncement, scheduleText: e.target.value })
                        }
                        placeholder="مثال: شروع از آذرماه ۱۴۰۳"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">زیرتیتر یا نام برگزارکننده (اختیاری)</label>
                      <input
                        type="text"
                        value={editingAnnouncement.subtitle || ''}
                        onChange={e => setEditingAnnouncement({ ...editingAnnouncement, subtitle: e.target.value })}
                        placeholder="مثال: مرکز تخصصی روان‌شناسی..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">لینک ثبت‌نام یا اطلاعات بیشتر (اختیاری)</label>
                      <input
                        type="url"
                        dir="ltr"
                        value={editingAnnouncement.externalUrl || ''}
                        onChange={e =>
                          setEditingAnnouncement({ ...editingAnnouncement, externalUrl: e.target.value })
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">سرفصل‌ها (هر خط یک مورد — اختیاری)</label>
                      <textarea
                        rows={3}
                        value={bulletsInput}
                        onChange={e => setBulletsInput(e.target.value)}
                        placeholder={'شناخت الگوهای تعارض\nمهارت‌های گوش‌دادن فعال'}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">توضیحات تکمیلی (اختیاری)</label>
                      <textarea
                        rows={3}
                        value={editingAnnouncement.description || ''}
                        onChange={e =>
                          setEditingAnnouncement({ ...editingAnnouncement, description: e.target.value })
                        }
                        placeholder="توضیحات دلخواه درباره نحوه شرکت در دوره..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingAnnouncement.isActive !== false}
                        onChange={e =>
                          setEditingAnnouncement({ ...editingAnnouncement, isActive: e.target.checked })
                        }
                      />
                      <span>فعال و قابل نمایش در ویترین</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAnnouncementFormOpen(false)}
                        className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAnnouncementItem}
                        className="px-5 py-2 rounded-xl bg-amber-600 text-white font-black cursor-pointer"
                      >
                        تایید و افزودن اطلاعیه
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draft.announcements.map(ann => (
                  <div
                    key={ann.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex items-center gap-3"
                  >
                    {ann.bannerUrl ? (
                      <img
                        src={ann.bannerUrl}
                        alt={ann.title || 'پوستر اطلاعیه'}
                        className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Megaphone className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900">
                        {ann.organizerType === 'external' ? 'دوره برون‌مرکزی' : 'دوره داخلی'}
                      </span>
                      <div className="font-black text-stone-900 dark:text-white truncate">
                        {ann.title || 'اطلاعیه تصویری دوره روان‌شناسی'}
                      </div>
                      {ann.scheduleText && <div className="text-[11px] text-stone-500 truncate">{ann.scheduleText}</div>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditAnnouncement(ann)}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft(prev => ({
                            ...prev,
                            announcements: prev.announcements.filter(a => a.id !== ann.id),
                          }))
                        }
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {draft.announcements.length === 0 && (
                  <div className="md:col-span-2 p-8 text-center text-stone-500 border border-dashed border-stone-300 rounded-2xl">
                    هنوز اطلاعیه‌ای ثبت نشده است.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONSULTANTS PICKER */}
          {activeTab === 'consultants' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200 dark:border-slate-800 space-y-1">
                <h4 className="font-black text-stone-900 dark:text-white">انتخاب مشاورین برای نمایش در کارت ۳ ویترین داشبورد</h4>
                <p className="text-[11px] text-stone-500">
                  در کارت مشاورین مرکز، تصویر، نام، تخصص و خلاصه یک‌خطی مشاور منتخب همراه با دکمه مستقیم «رزرو وقت مشاوره» نمایش داده می‌شود. اگر موردی انتخاب نشود، مشاوران فعال عمومی به صورت خودکار نمایش داده می‌شوند.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {generalConsultants.map(c => {
                  const selected = (draft.featuredConsultantIds || []).includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleFeaturedConsultant(c.id)}
                      className={`p-3.5 rounded-2xl border text-right flex items-center gap-3 cursor-pointer transition-all ${
                        selected
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-stone-300'
                      }`}
                    >
                      <img
                        src={c.avatarUrl || '/assets/cleric_portrait.jpg'}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover object-top border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-stone-900 dark:text-white truncate">{c.name}</div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">{c.specialty}</div>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3.5 sm:p-4 bg-stone-50 dark:bg-slate-950/60 border-t border-stone-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[42px] rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 font-bold cursor-pointer"
          >
            بستن
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAll}
            className="px-5 sm:px-6 py-2.5 min-h-[42px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>ذخیره نهایی تنظیمات ویترین ۳ بخشی</span>
          </button>
        </div>
      </div>
    </div>
  );
};

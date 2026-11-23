import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Bell,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  Inbox,
  BookOpen,
  HeartHandshake,
  Gift,
  Settings2,
  Megaphone,
  ArrowUpLeft,
  X,
  Edit3,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';

export type WidgetsRenderMode = 'all' | 'admin_bar' | 'banners_only' | 'status_only' | 'calendar_only';

interface DashboardWidgetsSuiteProps {
  onNavigateTab?: (tab: string) => void;
  isAlumniPreview?: boolean;
  onToggleAlumniPreview?: () => void;
  renderMode?: WidgetsRenderMode;
  compactHeight?: boolean;
}

const SYNC_EVENT_NAME = 'dashboard-widgets-sync';

export const DashboardWidgetsSuite: React.FC<DashboardWidgetsSuiteProps> = ({
  onNavigateTab,
  isAlumniPreview,
  onToggleAlumniPreview,
  renderMode = 'all',
  compactHeight = false,
}) => {
  const {
    currentUser,
    cartableRequests,
    courses,
    counselingRequests,
    welfareRequests,
    crextioConfig,
    isAlumniPreview: globalAlumniPreview,
    toggleAlumniPreview,
  } = useApp();

  const effectiveAlumniPreview = isAlumniPreview !== undefined ? isAlumniPreview : globalAlumniPreview;
  const handleTogglePreview = onToggleAlumniPreview || toggleAlumniPreview;

  const isRealAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'alumni_manager' ||
    currentUser?.role === 'supervisor';
  const showAdminControls = isRealAdmin && !effectiveAlumniPreview;

  const [banners, setBanners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [widgetConfig, setWidgetConfig] = useState<{
    showStatusSummaryWidget: boolean;
    showEventsCalendarWidget: boolean;
    version: number;
  }>({
    showStatusSummaryWidget: true,
    showEventsCalendarWidget: true,
    version: 1,
  });

  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [activeManagerTab, setActiveManagerTab] = useState<'toggles' | 'banners' | 'calendar'>('toggles');

  // Banner Form (Create or Edit)
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editingBannerVersion, setEditingBannerVersion] = useState<number>(1);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState<'info' | 'warning' | 'urgent' | 'celebration'>('info');
  const [bannerActionLabel, setBannerActionLabel] = useState('مشاهده بخش');
  const [bannerActionTab, setBannerActionTab] = useState('Courses');
  const [bannerExpiresAt, setBannerExpiresAt] = useState('۱۴۰۵/۰۶/۳۱');

  // Event Form (Create or Edit)
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventVersion, setEditingEventVersion] = useState<number>(1);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('۱۴۰۵/۰۳/۱۵');
  const [eventTime, setEventTime] = useState('۱۶:۰۰ الی ۱۸:۰۰');
  const [eventCategoryTitle, setEventCategoryTitle] = useState('نشست علمی و قضایی');
  const [eventDesc, setEventDesc] = useState('');

  const [statusToast, setStatusToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const broadcastLocalSync = (detail: {
    banners?: any[];
    events?: any[];
    widgetConfig?: any;
  }) => {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, { detail }));
  };

  const fetchWidgetsData = useCallback(async () => {
    try {
      const data = await api.getDashboardWidgetsData();
      if (data) {
        if (Array.isArray(data.banners)) setBanners(data.banners);
        if (Array.isArray(data.events)) setEvents(data.events);
        if (data.widgetConfig) setWidgetConfig(data.widgetConfig);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchWidgetsData();

    const handleLocalSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      if (detail.banners) setBanners(detail.banners);
      if (detail.events) setEvents(detail.events);
      if (detail.widgetConfig) setWidgetConfig(detail.widgetConfig);
    };
    window.addEventListener(SYNC_EVENT_NAME, handleLocalSync);

    const unsub = api.subscribeToEvents(ev => {
      if (!ev.type.startsWith('dashboard.')) return;
      const payload = ev.data?.updates || ev.data || {};
      if (ev.type === 'dashboard.widgets_toggled' && payload.widgetConfig) {
        setWidgetConfig(payload.widgetConfig);
      } else if (ev.type === 'dashboard.banner_created' && payload.banner) {
        setBanners(prev => [payload.banner, ...prev.filter(b => b.id !== payload.banner.id)]);
      } else if (ev.type === 'dashboard.banner_updated' && payload.banner) {
        setBanners(prev => prev.map(b => (b.id === payload.banner.id ? payload.banner : b)));
      } else if (ev.type === 'dashboard.banner_deleted' && payload.bannerId) {
        setBanners(prev => prev.filter(b => b.id !== payload.bannerId));
      } else if (ev.type === 'dashboard.event_created' && payload.eventItem) {
        setEvents(prev => [...prev.filter(e => e.id !== payload.eventItem.id), payload.eventItem]);
      } else if (ev.type === 'dashboard.event_updated' && payload.eventItem) {
        setEvents(prev => prev.map(e => (e.id === payload.eventItem.id ? payload.eventItem : e)));
      } else if (ev.type === 'dashboard.event_deleted' && payload.eventId) {
        setEvents(prev => prev.filter(e => e.id !== payload.eventId));
      } else {
        fetchWidgetsData();
      }
    });

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleLocalSync);
      unsub();
    };
  }, [fetchWidgetsData]);

  const handleToggleWidget = async (key: 'showStatusSummaryWidget' | 'showEventsCalendarWidget') => {
    try {
      const nextState = {
        showStatusSummaryWidget:
          key === 'showStatusSummaryWidget'
            ? !widgetConfig.showStatusSummaryWidget
            : widgetConfig.showStatusSummaryWidget,
        showEventsCalendarWidget:
          key === 'showEventsCalendarWidget'
            ? !widgetConfig.showEventsCalendarWidget
            : widgetConfig.showEventsCalendarWidget,
        expectedVersion: widgetConfig.version || 1,
      };
      const updated = await api.updateDashboardWidgetToggles(nextState);
      setWidgetConfig(updated);
      broadcastLocalSync({ widgetConfig: updated });
      notify('وضعیت نمایش ویجت‌ها در پایگاه داده ذخیره و همگام‌سازی شد.');
    } catch (err: any) {
      await fetchWidgetsData();
      notify(`خطا: ${err.message}`);
    }
  };

  const resetBannerForm = () => {
    setEditingBannerId(null);
    setEditingBannerVersion(1);
    setBannerTitle('');
    setBannerMessage('');
    setBannerType('info');
    setBannerActionLabel('مشاهده بخش');
    setBannerActionTab('Courses');
    setBannerExpiresAt('۱۴۰۵/۰۶/۳۱');
  };

  const handleStartEditBanner = (b: any) => {
    setEditingBannerId(b.id);
    setEditingBannerVersion(b.version || 1);
    setBannerTitle(b.title || '');
    setBannerMessage(b.message || '');
    setBannerType(b.bannerType || 'info');
    setBannerActionLabel(b.actionLabel || '');
    setBannerActionTab(b.actionTab || 'Courses');
    setBannerExpiresAt(b.expiresAt || '');
  };

  const handleSubmitBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerMessage.trim()) return;
    try {
      if (editingBannerId) {
        const updated = await api.updateDashboardBanner(editingBannerId, {
          title: bannerTitle,
          message: bannerMessage,
          bannerType,
          actionLabel: bannerActionLabel,
          actionTab: bannerActionTab,
          expiresAt: bannerExpiresAt,
          expectedVersion: editingBannerVersion,
        });
        const nextBanners = banners.map(b => (b.id === editingBannerId ? updated : b));
        setBanners(nextBanners);
        broadcastLocalSync({ banners: nextBanners });
        resetBannerForm();
        notify('متن و تنظیمات بنر اطلاع‌رسانی در MySQL ویرایش و همگام شد.');
      } else {
        const created = await api.createDashboardBanner({
          title: bannerTitle,
          message: bannerMessage,
          bannerType,
          actionLabel: bannerActionLabel,
          actionTab: bannerActionTab,
          expiresAt: bannerExpiresAt,
          isActive: true,
          priority: 5,
        });
        const nextBanners = [created, ...banners.filter(b => b.id !== created.id)];
        setBanners(nextBanners);
        broadcastLocalSync({ banners: nextBanners });
        resetBannerForm();
        notify('بنر اطلاع‌رسانی جدید در پایگاه داده ثبت و منتشر شد.');
      }
    } catch (err: any) {
      await fetchWidgetsData();
      notify(`خطا: ${err.message}`);
    }
  };

  const handleToggleBannerActive = async (banner: any) => {
    try {
      const updated = await api.updateDashboardBanner(banner.id, {
        isActive: !banner.isActive,
        expectedVersion: banner.version || 1,
      });
      const nextBanners = banners.map(b => (b.id === banner.id ? updated : b));
      setBanners(nextBanners);
      broadcastLocalSync({ banners: nextBanners });
      notify('وضعیت بنر اطلاع‌رسانی به‌روزرسانی شد.');
    } catch {
      await fetchWidgetsData();
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await api.deleteDashboardBanner(id);
      const nextBanners = banners.filter(b => b.id !== id);
      setBanners(nextBanners);
      broadcastLocalSync({ banners: nextBanners });
      if (editingBannerId === id) resetBannerForm();
      notify('بنر از پایگاه داده حذف گردید.');
    } catch (err: any) {
      notify(`خطا: ${err.message}`);
    }
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEditingEventVersion(1);
    setEventTitle('');
    setEventDate('۱۴۰۵/۰۳/۱۵');
    setEventTime('۱۶:۰۰ الی ۱۸:۰۰');
    setEventCategoryTitle('نشست علمی و قضایی');
    setEventDesc('');
  };

  const handleStartEditEvent = (ev: any) => {
    setEditingEventId(ev.id);
    setEditingEventVersion(ev.version || 1);
    setEventTitle(ev.title || '');
    setEventDate(ev.eventDate || '');
    setEventTime(ev.eventTime || '');
    setEventCategoryTitle(ev.categoryTitle || 'نشست علمی و قضایی');
    setEventDesc(ev.description || '');
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate.trim()) return;
    try {
      if (editingEventId) {
        const updated = await api.updateDashboardEvent(editingEventId, {
          title: eventTitle,
          eventDate,
          eventTime,
          categoryTitle: eventCategoryTitle,
          description: eventDesc,
          expectedVersion: editingEventVersion,
        });
        const nextEvents = events.map(ev => (ev.id === editingEventId ? updated : ev));
        setEvents(nextEvents);
        broadcastLocalSync({ events: nextEvents });
        resetEventForm();
        notify('رویداد تقویم در پایگاه داده ویرایش شد.');
      } else {
        const created = await api.createDashboardEvent({
          title: eventTitle,
          eventDate,
          eventTime,
          category: 'conference',
          categoryTitle: eventCategoryTitle,
          description: eventDesc,
        });
        const nextEvents = [...events.filter(ev => ev.id !== created.id), created];
        setEvents(nextEvents);
        broadcastLocalSync({ events: nextEvents });
        resetEventForm();
        notify('رویداد جدید در تقویم پایگاه داده ثبت شد.');
      }
    } catch (err: any) {
      await fetchWidgetsData();
      notify(`خطا: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.deleteDashboardEvent(id);
      const nextEvents = events.filter(ev => ev.id !== id);
      setEvents(nextEvents);
      broadcastLocalSync({ events: nextEvents });
      if (editingEventId === id) resetEventForm();
      notify('رویداد از تقویم حذف شد.');
    } catch (err: any) {
      notify(`خطا: ${err.message}`);
    }
  };

  // Compute user-specific summary stats
  const myCartableActive = cartableRequests.filter(
    r =>
      (r.applicantId === currentUser?.id || !effectiveAlumniPreview) &&
      (r.status === 'pending' || r.status === 'in_progress' || r.status === 'need_info')
  ).length;
  const myEnrolledCourses = courses.filter(c => c.isEnrolled).length;
  const myCounselingActive = counselingRequests.filter(
    r => (r.applicantId === currentUser?.id || !effectiveAlumniPreview) && (r.status === 'pending' || r.status === 'scheduled')
  ).length;
  const myWelfareActive = welfareRequests.filter(
    r => (r.applicantId === currentUser?.id || !effectiveAlumniPreview) && (r.status === 'pending' || r.status === 'approved')
  ).length;

  const activeBanners = banners.filter(b => b.isActive);

  const renderAdminBar = () => {
    if (!isRealAdmin) return null;
    return (
      <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-3 sm:p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
            <Settings2 className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold text-stone-900 truncate">
              {effectiveAlumniPreview
                ? 'حالت پیش‌نمایش نمای دانش‌آموخته (فعال)'
                : 'ابزارهای مدیریت داشبورد، تقویم و بنرها'}
            </h4>
            <p className="hidden sm:block text-[11px] text-stone-500">
              {effectiveAlumniPreview
                ? 'در این حالت، تمام دکمه‌های ویرایش ادمین مخفی بوده و داشبورد دقیقاً از دید دانش‌آموخته نمایش داده می‌شود.'
                : 'کنترل روشن/خاموش بودن ویجت وضعیت و تقویم، ویرایش بنرهای اطلاع‌رسانی و پیش‌نمایش زنده دانش‌آموخته'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleTogglePreview}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              effectiveAlumniPreview
                ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
            }`}
          >
            {effectiveAlumniPreview ? (
              <EyeOff className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            )}
            <span>
              {effectiveAlumniPreview ? 'خروج از پیش‌نمایش دانش‌آموخته' : 'پیش‌نمایش نمای دانش‌آموخته'}
            </span>
          </button>

          {!effectiveAlumniPreview && (
            <button
              type="button"
              onClick={() => setIsManagerOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>مدیریت بنرها، تقویم و ویجت‌ها</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderBannersBlock = () => {
    if (activeBanners.length === 0) return null;
    return (
      <div className="space-y-2.5">
        {activeBanners.map(b => {
          const styleMap: Record<string, string> = {
            celebration:
              'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white border-emerald-600/40',
            urgent: 'bg-gradient-to-r from-rose-900 via-red-900 to-amber-950 text-white border-rose-500/40',
            warning: 'bg-amber-50 text-amber-950 border-amber-300',
            info: 'bg-stone-900 text-white border-stone-700',
          };
          const boxStyle = styleMap[b.bannerType] || styleMap.info;

          return (
            <div
              key={b.id}
              className={`rounded-2xl ${
                compactHeight ? 'p-3 sm:px-4' : 'p-4 sm:px-6'
              } border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${boxStyle}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold opacity-90">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{b.title}</span>
                  {b.expiresAt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="opacity-75">اعتبار تا {toPersianNumbers(b.expiresAt)}</span>
                    </>
                  )}
                </div>
                <p className="text-xs opacity-90 leading-relaxed">{b.message}</p>
              </div>

              {b.actionLabel && b.actionTab && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab(b.actionTab)}
                  className="px-4 py-2 min-h-[40px] w-full sm:w-auto justify-center rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer border border-white/20"
                >
                  <span>{b.actionLabel}</span>
                  <ArrowUpLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStatusCard = (fullSpanClass?: string) => {
    if (!widgetConfig.showStatusSummaryWidget) return null;
    return (
      <div
        className={`${fullSpanClass || ''} h-full bg-white/95 rounded-2xl sm:rounded-[28px] ${
          compactHeight ? 'p-3.5 sm:p-4' : 'p-3.5 sm:p-6'
        } border border-[#E3E0D3] shadow-xs flex flex-col justify-between`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/70 gap-2">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-base font-extrabold text-stone-900 truncate">
              {crextioConfig.statusWidgetTitle || 'ویجت خلاصه وضعیت پرونده‌ها و خدمات من'}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1">
              {crextioConfig.statusWidgetSubtitle || 'نمای یکپارچه و بلادرنگ فعالیت‌های جاری شما در سامانه'}
            </p>
          </div>
          {showAdminControls && (
            <button
              type="button"
              onClick={() => handleToggleWidget('showStatusSummaryWidget')}
              className="text-[10px] sm:text-[11px] font-bold text-stone-500 hover:text-rose-700 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-stone-100 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              خاموش کردن ویجت
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab?.('People')}
            className={`text-right ${compactHeight ? 'p-2.5' : 'p-3 sm:p-4'} rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group active:scale-[0.98]`}
          >
            <Inbox className="w-5 h-5 text-emerald-700 mb-1.5 group-hover:scale-110 transition-transform" />
            <p className={`${compactHeight ? 'text-lg' : 'text-xl sm:text-2xl'} font-black text-stone-900 tabular-nums`}>
              {toPersianNumbers(myCartableActive)}
            </p>
            <p className="text-[11px] font-bold text-stone-600 mt-0.5 line-clamp-1">درخواست کارتابل در جریان</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('Courses')}
            className={`text-right ${compactHeight ? 'p-2.5' : 'p-3 sm:p-4'} rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group active:scale-[0.98]`}
          >
            <BookOpen className="w-5 h-5 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <p className={`${compactHeight ? 'text-lg' : 'text-xl sm:text-2xl'} font-black text-stone-900 tabular-nums`}>
              {toPersianNumbers(myEnrolledCourses)}
            </p>
            <p className="text-[11px] font-bold text-stone-600 mt-0.5 line-clamp-1">دوره‌های ثبت‌نام‌شده</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('Counseling')}
            className={`text-right ${compactHeight ? 'p-2.5' : 'p-3 sm:p-4'} rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group active:scale-[0.98]`}
          >
            <HeartHandshake className="w-5 h-5 text-teal-700 mb-1.5 group-hover:scale-110 transition-transform" />
            <p className={`${compactHeight ? 'text-lg' : 'text-xl sm:text-2xl'} font-black text-stone-900 tabular-nums`}>
              {toPersianNumbers(myCounselingActive)}
            </p>
            <p className="text-[11px] font-bold text-stone-600 mt-0.5 line-clamp-1">نوبت مشاوره فعال</p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('Welfare')}
            className={`text-right ${compactHeight ? 'p-2.5' : 'p-3 sm:p-4'} rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group active:scale-[0.98]`}
          >
            <Gift className="w-5 h-5 text-indigo-700 mb-1.5 group-hover:scale-110 transition-transform" />
            <p className={`${compactHeight ? 'text-lg' : 'text-xl sm:text-2xl'} font-black text-stone-900 tabular-nums`}>
              {toPersianNumbers(myWelfareActive)}
            </p>
            <p className="text-[11px] font-bold text-stone-600 mt-0.5 line-clamp-1">پرونده تسهیلات رفاهی</p>
          </button>
        </div>
      </div>
    );
  };

  const renderCalendarCard = (fullSpanClass?: string) => {
    if (!widgetConfig.showEventsCalendarWidget) return null;
    return (
      <div
        className={`${fullSpanClass || ''} h-full bg-white/95 rounded-2xl sm:rounded-[28px] ${
          compactHeight ? 'p-3.5 sm:p-4' : 'p-3.5 sm:p-6'
        } border border-[#E3E0D3] shadow-xs flex flex-col justify-between`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/70 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-5 h-5 text-emerald-800 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-base font-extrabold text-stone-900 truncate">
                {crextioConfig.eventsCalendarTitle || 'تقویم رویدادها و مهلت‌های مرکز'}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 line-clamp-1">
                {crextioConfig.eventsCalendarSubtitle || 'نشست‌های علمی، کارگاه‌ها و فراخوان‌های پیش‌رو'}
              </p>
            </div>
          </div>
          {showAdminControls && (
            <button
              type="button"
              onClick={() => handleToggleWidget('showEventsCalendarWidget')}
              className="text-[10px] sm:text-[11px] font-bold text-stone-500 hover:text-rose-700 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-stone-100 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              خاموش کردن تقویم
            </button>
          )}
        </div>

        <div className={`space-y-2.5 ${compactHeight ? 'max-h-[150px]' : 'max-h-[210px]'} overflow-y-auto pr-1`}>
          {events.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">رویدادی در تقویم ثبت نشده است.</p>
          ) : (
            events.map(ev => (
              <div
                key={ev.id}
                className="p-3 rounded-2xl bg-[#F8F7F2] border border-stone-200/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-stone-900">{ev.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                    <span>{ev.categoryTitle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-emerald-800">{toPersianNumbers(ev.eventDate)}</span>
                    {ev.eventTime && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{toPersianNumbers(ev.eventTime)}</span>
                      </>
                    )}
                  </div>
                </div>
                {showAdminControls && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 cursor-pointer shrink-0"
                    title="حذف رویداد"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderManagerModal = () => {
    if (!isManagerOpen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
        <div
          className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-stone-200 space-y-4 sm:space-y-5"
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-3.5 border-b border-stone-200 gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-extrabold text-stone-900 truncate">
                مدیریت ویجت‌ها، تقویم و بنرهای اطلاع‌رسانی داشبورد
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 line-clamp-1">
                ثبت، ویرایش کامل و حذف بنرها و رویدادها با ذخیره در دیتابیس
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsManagerOpen(false)}
              className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveManagerTab('toggles')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeManagerTab === 'toggles'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              فعال/غیرفعال‌سازی ویجت و تقویم
            </button>
            <button
              type="button"
              onClick={() => setActiveManagerTab('banners')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeManagerTab === 'banners'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              بنرهای اطلاع‌رسانی ({toPersianNumbers(banners.length)})
            </button>
            <button
              type="button"
              onClick={() => setActiveManagerTab('calendar')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                activeManagerTab === 'calendar'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              تقویم رویدادها ({toPersianNumbers(events.length)})
            </button>
          </div>

          {activeManagerTab === 'toggles' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-stone-900">نمایش «ویجت خلاصه وضعیت من» در داشبورد</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    در صورت خاموش بودن، این ویجت برای هیچ‌یک از کاربران نمایش داده نمی‌شود.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('showStatusSummaryWidget')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    widgetConfig.showStatusSummaryWidget
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {widgetConfig.showStatusSummaryWidget ? 'فعال (روشن)' : 'غیرفعال (خاموش)'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-stone-900">نمایش «تقویم رویدادها و مهلت‌ها» در داشبورد</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    امکان فعال‌سازی یا خاموش‌سازی سراسری تقویم داشبورد توسط ادمین.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleWidget('showEventsCalendarWidget')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    widgetConfig.showEventsCalendarWidget
                      ? 'bg-emerald-700 text-white'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {widgetConfig.showEventsCalendarWidget ? 'فعال (روشن)' : 'غیرفعال (خاموش)'}
                </button>
              </div>
            </div>
          )}

          {activeManagerTab === 'banners' && (
            <div className="space-y-5">
              <form
                onSubmit={handleSubmitBanner}
                className={`p-4 rounded-2xl border space-y-3 ${
                  editingBannerId ? 'bg-amber-50/70 border-amber-300' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-stone-900">
                    {editingBannerId ? 'ویرایش بنر اطلاع‌رسانی انتخاب‌شده' : 'افزودن بنر اطلاع‌رسانی جدید'}
                  </h4>
                  {editingBannerId && (
                    <button
                      type="button"
                      onClick={resetBannerForm}
                      className="text-[11px] font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={e => setBannerTitle(e.target.value)}
                    placeholder="عنوان اطلاعیه..."
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    required
                  />
                  <select
                    value={bannerType}
                    onChange={e => setBannerType(e.target.value as any)}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="celebration">سبز زمردی (فراخوان / ویژه)</option>
                    <option value="urgent">قرمز یاقوتی (فوری / مهم)</option>
                    <option value="warning">کهربایی (هشدار / مهلت)</option>
                    <option value="info">سرمه‌ای رسمی (اطلاع‌رسانی عمومی)</option>
                  </select>
                </div>
                <textarea
                  value={bannerMessage}
                  onChange={e => setBannerMessage(e.target.value)}
                  placeholder="متن کامل بنر اطلاع‌رسانی..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={bannerActionLabel}
                    onChange={e => setBannerActionLabel(e.target.value)}
                    placeholder="متن دکمه (مثلاً مشاهده دوره‌ها)"
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                  <select
                    value={bannerActionTab}
                    onChange={e => setBannerActionTab(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="Courses">بخش دوره‌های آموزشی</option>
                    <option value="People">بخش کارتابل اداری</option>
                    <option value="Welfare">بخش تسهیلات رفاهی</option>
                    <option value="Rulings">بخش تالار نقد آراء</option>
                    <option value="Counseling">بخش مشاوره</option>
                    <option value="Research">بخش راهبری پژوهش</option>
                    <option value="Synergy">بخش دیوار هم‌افزایی</option>
                  </select>
                  <input
                    type="text"
                    value={bannerExpiresAt}
                    onChange={e => setBannerExpiresAt(e.target.value)}
                    placeholder="تاریخ انقضا (مثلاً ۱۴۰۵/۰۶/۳۱)"
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {editingBannerId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingBannerId ? 'ذخیره تغییرات بنر در دیتابیس' : 'ثبت و انتشار بنر در دیتابیس'}</span>
                </button>
              </form>

              <div className="space-y-2">
                {banners.map(b => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-stone-900 truncate">{b.title}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">{b.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditBanner(b)}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                        title="ویرایش متن بنر"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBannerActive(b)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                          b.isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {b.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeManagerTab === 'calendar' && (
            <div className="space-y-5">
              <form
                onSubmit={handleSubmitEvent}
                className={`p-4 rounded-2xl border space-y-3 ${
                  editingEventId ? 'bg-amber-50/70 border-amber-300' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-stone-900">
                    {editingEventId ? 'ویرایش رویداد تقویم' : 'افزودن رویداد یا مهلت جدید به تقویم'}
                  </h4>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={resetEventForm}
                      className="text-[11px] font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      انصراف از ویرایش
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="عنوان رویداد یا مهلت..."
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white sm:col-span-2"
                    required
                  />
                  <input
                    type="text"
                    value={eventCategoryTitle}
                    onChange={e => setEventCategoryTitle(e.target.value)}
                    placeholder="دسته‌بندی (مثلاً نشست علمی)"
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    placeholder="تاریخ (مثلاً ۱۴۰۵/۰۳/۱۵)"
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                    required
                  />
                  <input
                    type="text"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    placeholder="ساعت برگزاری (مثلاً ۱۶:۰۰ الی ۱۸:۰۰)"
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {editingEventId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingEventId ? 'ذخیره تغییرات رویداد' : 'افزودن رویداد به تقویم'}</span>
                </button>
              </form>

              <div className="space-y-2">
                {events.map(ev => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 bg-white"
                  >
                    <div>
                      <p className="text-xs font-bold text-stone-900">{ev.title}</p>
                      <p className="text-[11px] text-stone-500">
                        {ev.categoryTitle} · {toPersianNumbers(ev.eventDate)}{' '}
                        {ev.eventTime ? `· ${toPersianNumbers(ev.eventTime)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditEvent(ev)}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer"
                        title="ویرایش رویداد"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (renderMode === 'admin_bar') {
    return (
      <>
        {statusToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusToast}</span>
          </div>
        )}
        {renderAdminBar()}
        {renderManagerModal()}
      </>
    );
  }

  if (renderMode === 'banners_only') {
    return renderBannersBlock();
  }

  if (renderMode === 'status_only') {
    return renderStatusCard();
  }

  if (renderMode === 'calendar_only') {
    return renderCalendarCard();
  }

  // Default 'all' mode (Theme 1 & Theme 3)
  return (
    <div className="space-y-5">
      {statusToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {renderAdminBar()}
      {renderBannersBlock()}

      {(widgetConfig.showStatusSummaryWidget || widgetConfig.showEventsCalendarWidget) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {renderStatusCard(widgetConfig.showEventsCalendarWidget ? 'lg:col-span-7' : 'lg:col-span-12')}
          {renderCalendarCard(widgetConfig.showStatusSummaryWidget ? 'lg:col-span-5' : 'lg:col-span-12')}
        </div>
      )}

      {renderManagerModal()}
    </div>
  );
};

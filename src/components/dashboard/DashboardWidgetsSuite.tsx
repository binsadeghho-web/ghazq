import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Bell,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Inbox,
  BookOpen,
  HeartHandshake,
  Gift,
  Settings2,
  Megaphone,
  ArrowUpLeft,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/apiClient';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface DashboardWidgetsSuiteProps {
  onNavigateTab?: (tab: string) => void;
  isAlumniPreview?: boolean;
  onToggleAlumniPreview?: () => void;
}

export const DashboardWidgetsSuite: React.FC<DashboardWidgetsSuiteProps> = ({
  onNavigateTab,
  isAlumniPreview = false,
  onToggleAlumniPreview,
}) => {
  const {
    currentUser,
    cartableRequests,
    courses,
    counselingRequests,
    welfareRequests,
  } = useApp();

  const isRealAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  const showAdminControls = isRealAdmin && !isAlumniPreview;

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

  // New Banner Form
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState<'info' | 'warning' | 'urgent' | 'celebration'>('info');
  const [bannerActionLabel, setBannerActionLabel] = useState('مشاهده بخش');
  const [bannerActionTab, setBannerActionTab] = useState('courses');
  const [bannerExpiresAt, setBannerExpiresAt] = useState('۱۴۰۵/۰۶/۳۱');

  // New Calendar Event Form
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
    const unsub = api.subscribeToEvents((ev) => {
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
      } else if (ev.type === 'dashboard.event_deleted' && payload.eventId) {
        setEvents(prev => prev.filter(e => e.id !== payload.eventId));
      } else {
        fetchWidgetsData();
      }
    });
    return () => unsub();
  }, [fetchWidgetsData]);

  const handleToggleWidget = async (key: 'showStatusSummaryWidget' | 'showEventsCalendarWidget') => {
    try {
      const nextState = {
        showStatusSummaryWidget: key === 'showStatusSummaryWidget' ? !widgetConfig.showStatusSummaryWidget : widgetConfig.showStatusSummaryWidget,
        showEventsCalendarWidget: key === 'showEventsCalendarWidget' ? !widgetConfig.showEventsCalendarWidget : widgetConfig.showEventsCalendarWidget,
        expectedVersion: widgetConfig.version || 1,
      };
      const updated = await api.updateDashboardWidgetToggles(nextState);
      setWidgetConfig(updated);
      notify('وضعیت نمایش ویجت‌ها در پایگاه داده ذخیره و برای تمام کاربران همگام‌سازی شد.');
    } catch (err: any) {
      await fetchWidgetsData();
      notify(`خطا: ${err.message}`);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerMessage.trim()) return;
    try {
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
      setBanners(prev => [created, ...prev.filter(b => b.id !== created.id)]);
      setBannerTitle('');
      setBannerMessage('');
      notify('بنر اطلاع‌رسانی جدید در پایگاه داده ثبت و منتشر شد.');
    } catch (err: any) {
      notify(`خطا: ${err.message}`);
    }
  };

  const handleToggleBannerActive = async (banner: any) => {
    try {
      const updated = await api.updateDashboardBanner(banner.id, {
        isActive: !banner.isActive,
        expectedVersion: banner.version || 1,
      });
      setBanners(prev => prev.map(b => (b.id === banner.id ? updated : b)));
      notify('وضعیت بنر اطلاع‌رسانی به‌روزرسانی شد.');
    } catch (err: any) {
      await fetchWidgetsData();
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await api.deleteDashboardBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
      notify('بنر از پایگاه داده حذف گردید.');
    } catch (err: any) {
      notify(`خطا: ${err.message}`);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate.trim()) return;
    try {
      const created = await api.createDashboardEvent({
        title: eventTitle,
        eventDate,
        eventTime,
        category: 'conference',
        categoryTitle: eventCategoryTitle,
        description: eventDesc,
      });
      setEvents(prev => [...prev.filter(ev => ev.id !== created.id), created]);
      setEventTitle('');
      setEventDesc('');
      notify('رویداد جدید در تقویم پایگاه داده ثبت شد.');
    } catch (err: any) {
      notify(`خطا: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.deleteDashboardEvent(id);
      setEvents(prev => prev.filter(ev => ev.id !== id));
      notify('رویداد از تقویم حذف شد.');
    } catch (err: any) {
      notify(`خطا: ${err.message}`);
    }
  };

  // Compute user-specific summary stats
  const myCartableActive = cartableRequests.filter(
    r => (r.applicantId === currentUser?.id || !isAlumniPreview) && (r.status === 'pending' || r.status === 'in_progress' || r.status === 'need_info')
  ).length;
  const myEnrolledCourses = courses.filter(c => c.isEnrolled).length;
  const myCounselingActive = counselingRequests.filter(
    r => (r.applicantId === currentUser?.id || !isAlumniPreview) && (r.status === 'pending' || r.status === 'scheduled')
  ).length;
  const myWelfareActive = welfareRequests.filter(
    r => (r.applicantId === currentUser?.id || !isAlumniPreview) && (r.status === 'pending' || r.status === 'approved')
  ).length;

  const activeBanners = banners.filter(b => b.isActive);

  return (
    <div className="space-y-5">
      {statusToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* ADMIN BAR: ALUMNI PREVIEW MODE + BANNER/WIDGET/CALENDAR MANAGER */}
      {isRealAdmin && (
        <div className="bg-white/95 border border-stone-200/90 rounded-2xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Settings2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-extrabold text-stone-900">
                {isAlumniPreview ? 'حالت پیش‌نمایش نمای دانش‌آموخته (فعال)' : 'ابزارهای مدیریت داشبورد، تقویم و بنرهای اطلاع‌رسانی'}
              </h4>
              <p className="text-[11px] text-stone-500">
                {isAlumniPreview
                  ? 'در این حالت، داشبورد دقیقاً همان‌گونه که دانش‌آموختگان مشاهده می‌کنند نمایش داده می‌شود.'
                  : 'کنترل روشن/خاموش بودن ویجت وضعیت و تقویم، مدیریت بنرهای اطلاع‌رسانی و پیش‌نمایش زنده دانش‌آموخته'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onToggleAlumniPreview && (
              <button
                onClick={onToggleAlumniPreview}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isAlumniPreview
                    ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                }`}
              >
                {isAlumniPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{isAlumniPreview ? 'خروج از پیش‌نمایش دانش‌آموخته' : 'پیش‌نمایش نمای دانش‌آموخته'}</span>
              </button>
            )}

            {!isAlumniPreview && (
              <button
                onClick={() => setIsManagerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                <span>مدیریت بنرها، تقویم و ویجت‌های داشبورد</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. TIMED ANNOUNCEMENT BANNERS */}
      {activeBanners.length > 0 && (
        <div className="space-y-2.5">
          {activeBanners.map((b) => {
            const styleMap: Record<string, string> = {
              celebration: 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white border-emerald-600/40',
              urgent: 'bg-gradient-to-r from-rose-900 via-red-900 to-amber-950 text-white border-rose-500/40',
              warning: 'bg-amber-50 text-amber-950 border-amber-300',
              info: 'bg-stone-900 text-white border-stone-700',
            };
            const boxStyle = styleMap[b.bannerType] || styleMap.info;

            return (
              <div
                key={b.id}
                className={`rounded-2xl p-4 sm:px-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${boxStyle}`}
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
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors cursor-pointer border border-white/20"
                  >
                    <span>{b.actionLabel}</span>
                    <ArrowUpLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2 & 3. MY STATUS SUMMARY WIDGET + EVENTS & DEADLINES CALENDAR (Both Admin-Toggleable) */}
      {(widgetConfig.showStatusSummaryWidget || widgetConfig.showEventsCalendarWidget) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* WIDGET: MY STATUS SUMMARY */}
          {widgetConfig.showStatusSummaryWidget && (
            <div className={`${widgetConfig.showEventsCalendarWidget ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white/95 rounded-[28px] p-5 sm:p-6 border border-[#E3E0D3] shadow-xs flex flex-col justify-between`}>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200/70">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">ویجت خلاصه وضعیت پرونده‌ها و خدمات من</h3>
                  <p className="text-xs text-stone-500 mt-0.5">نمای یکپارچه و بلادرنگ فعالیت‌های جاری شما در سامانه</p>
                </div>
                {showAdminControls && (
                  <button
                    onClick={() => handleToggleWidget('showStatusSummaryWidget')}
                    className="text-[11px] font-bold text-stone-500 hover:text-rose-700 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    خاموش کردن ویجت
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <button
                  onClick={() => onNavigateTab?.('People')}
                  className="text-right p-4 rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group"
                >
                  <Inbox className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-2xl font-black text-stone-900">{toPersianNumbers(myCartableActive)}</p>
                  <p className="text-xs font-bold text-stone-600 mt-1">درخواست کارتابل در جریان</p>
                </button>

                <button
                  onClick={() => onNavigateTab?.('Courses')}
                  className="text-right p-4 rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group"
                >
                  <BookOpen className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-2xl font-black text-stone-900">{toPersianNumbers(myEnrolledCourses)}</p>
                  <p className="text-xs font-bold text-stone-600 mt-1">دوره‌های ثبت‌نام‌شده</p>
                </button>

                <button
                  onClick={() => onNavigateTab?.('Counseling')}
                  className="text-right p-4 rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group"
                >
                  <HeartHandshake className="w-5 h-5 text-teal-700 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-2xl font-black text-stone-900">{toPersianNumbers(myCounselingActive)}</p>
                  <p className="text-xs font-bold text-stone-600 mt-1">نوبت مشاوره فعال</p>
                </button>

                <button
                  onClick={() => onNavigateTab?.('Welfare')}
                  className="text-right p-4 rounded-2xl bg-[#F8F7F2] hover:bg-emerald-50/70 border border-stone-200/80 transition-all cursor-pointer group"
                >
                  <Gift className="w-5 h-5 text-indigo-700 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-2xl font-black text-stone-900">{toPersianNumbers(myWelfareActive)}</p>
                  <p className="text-xs font-bold text-stone-600 mt-1">پرونده تسهیلات رفاهی</p>
                </button>
              </div>
            </div>
          )}

          {/* WIDGET: EVENTS & DEADLINES CALENDAR */}
          {widgetConfig.showEventsCalendarWidget && (
            <div className={`${widgetConfig.showStatusSummaryWidget ? 'lg:col-span-5' : 'lg:col-span-12'} bg-white/95 rounded-[28px] p-5 sm:p-6 border border-[#E3E0D3] shadow-xs flex flex-col justify-between`}>
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-200/70">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-800" />
                  <div>
                    <h3 className="text-base font-extrabold text-stone-900">تقویم رویدادها و مهلت‌های مرکز</h3>
                    <p className="text-xs text-stone-500">نشست‌های علمی، کارگاه‌ها و فراخوان‌های پیش‌رو</p>
                  </div>
                </div>
                {showAdminControls && (
                  <button
                    onClick={() => handleToggleWidget('showEventsCalendarWidget')}
                    className="text-[11px] font-bold text-stone-500 hover:text-rose-700 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    خاموش کردن تقویم
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[210px] overflow-y-auto pr-1">
                {events.length === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center">رویدادی در تقویم ثبت نشده است.</p>
                ) : (
                  events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl bg-[#F8F7F2] border border-stone-200/80 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-stone-900">{ev.title}</p>
                        <div className="flex items-center gap-2 text-[11px] text-stone-500">
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
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
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
          )}
        </div>
      )}

      {/* ADMIN MODAL FOR DASHBOARD BANNERS, CALENDAR & WIDGET TOGGLES */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 shadow-2xl border border-stone-200 space-y-5" dir="rtl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">مدیریت ویجت‌ها، تقویم و بنرهای اطلاع‌رسانی داشبورد</h3>
                <p className="text-xs text-stone-500 mt-0.5">تمامی تغییرات در جداول اختصاصی دیتابیس ذخیره شده و بدون نیاز به رفرش برای کاربران اعمال می‌شود.</p>
              </div>
              <button
                onClick={() => setIsManagerOpen(false)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tab Controls */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
              <button
                onClick={() => setActiveManagerTab('toggles')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeManagerTab === 'toggles' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                فعال/غیرفعال‌سازی ویجت و تقویم
              </button>
              <button
                onClick={() => setActiveManagerTab('banners')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeManagerTab === 'banners' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                بنرهای اطلاع‌رسانی ({toPersianNumbers(banners.length)})
              </button>
              <button
                onClick={() => setActiveManagerTab('calendar')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeManagerTab === 'calendar' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
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
                    <p className="text-xs text-stone-500 mt-0.5">در صورت خاموش بودن، این ویجت برای هیچ‌یک از کاربران در داشبورد نمایش داده نمی‌شود.</p>
                  </div>
                  <button
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
                    <p className="text-xs text-stone-500 mt-0.5">امکان فعال‌سازی یا خاموش‌سازی سراسری تقویم داشبورد توسط ادمین.</p>
                  </div>
                  <button
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
                <form onSubmit={handleAddBanner} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-stone-900">افزودن بنر اطلاع‌رسانی جدید</h4>
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
                    <Plus className="w-3.5 h-3.5" />
                    <span>ثبت و انتشار بنر در دیتابیس</span>
                  </button>
                </form>

                <div className="space-y-2">
                  {banners.map(b => (
                    <div key={b.id} className="p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 bg-white">
                      <div>
                        <p className="text-xs font-extrabold text-stone-900">{b.title}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">{b.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleBannerActive(b)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                            b.isActive ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {b.isActive ? 'فعال' : 'غیرفعال'}
                        </button>
                        <button
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
                <form onSubmit={handleAddEvent} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-stone-900">افزودن رویداد یا مهلت جدید به تقویم</h4>
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
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن رویداد به تقویم</span>
                  </button>
                </form>

                <div className="space-y-2">
                  {events.map(ev => (
                    <div key={ev.id} className="p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 bg-white">
                      <div>
                        <p className="text-xs font-bold text-stone-900">{ev.title}</p>
                        <p className="text-[11px] text-stone-500">
                          {ev.categoryTitle} · {toPersianNumbers(ev.eventDate)} {ev.eventTime ? `· ${toPersianNumbers(ev.eventTime)}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { CartableCategory, CartableRequest, RequestPriority, RequestStatus } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { CartableEnhancedTools } from './CartableEnhancedTools';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { api } from '../../services/apiClient';
import {
  Inbox,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Shield,
  Briefcase,
  GraduationCap,
  Building,
  CheckCheck,
  Search,
  Filter,
  X,
  MessageSquare,
  FolderCheck,
  FolderKanban,
  Archive,
  XCircle,
  ChevronLeft,
  Sparkles,
  UserCheck,
  BadgeAlert,
  ArrowRight,
  ChevronDown,
  ShieldAlert,
  FileCheck2,
  Lock,
  HelpCircle,
  BookOpen,
  Sliders,
  Edit3,
  Trash2,
  PlusCircle,
  Check,
  Info,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface CartableCategoryItem {
  id: string;
  key: string;
  title: string;
  assignedRole: string;
  assignedOfficialTitle: string;
  description: string;
}

interface CartableGuide {
  id?: string;
  title: string;
  content: string;
  steps: string[];
  tips: string[];
  updatedAt?: string;
  updatedBy?: string;
  enabled?: boolean;
}

const DEFAULT_CATEGORIES: CartableCategoryItem[] = [
  {
    id: 'cat_admin',
    key: 'administrative',
    title: 'خدمات اداری (صدور گواهی، ریزنمرات و احکام)',
    assignedRole: 'admin_finance_officer',
    assignedOfficialTitle: 'مسئول اداری و مالی',
    description: 'صدور انواع گواهی اشتغال، احکام، تسویه‌حساب و مدارک رسمی اداری',
  },
  {
    id: 'cat_edu',
    key: 'educational',
    title: 'خدمات آموزشی (تطبیق واحدهای حوزوی و دانشگاهی)',
    assignedRole: 'education_deputy',
    assignedOfficialTitle: 'معاونت آموزش',
    description: 'ارزیابی پرونده تحصیلی، صدور معرفی‌نامه امتحانات و تطبیق دروس',
  },
  {
    id: 'cat_career',
    key: 'career',
    title: 'خدمات شغلی (جابه‌جایی، ارتقای رتبه و تسریع پرونده)',
    assignedRole: 'alumni_manager',
    assignedOfficialTitle: 'مدیر دانش‌آموختگان',
    description: 'تسریع فرایند استخدامی، معرفی‌نامه شغلی، ارتقای پایه و انتقال سازمانی',
  },
];

const DEFAULT_GUIDE: CartableGuide = {
  id: 'guide_default',
  title: 'راهنمای جامع ثبت درخواست در کارتابل خدمات',
  content:
    'دانش‌آموختگان گرامی می‌توانند انواع درخواست‌های اداری، آموزشی، رفاهی و استعلامات رسمی خود را از این درگاه ثبت نمایند. بر اساس دسته‌بندی انتخابی، هر پرونده به صورت خودکار به مسئول مربوطه در سازمان ارجاع داده شده و کد رهگیری یکتا دریافت می‌کند.',
  steps: [
    'انتخاب دقیق دسته‌بندی موضوعی جهت ارجاع مستقیم به کارتابل مسئول مربوطه',
    'درج عنوان گویا و مستند همراه با شرح تفصیلی در متن درخواست',
    'تعیین اولویت رسیدگی (عادی یا فوری؛ درخواست‌های فوری شامل مواعد اداری حساس هستند)',
    'پیوست مدارک، اسناد، فیش‌ها و سوابق مورد نیاز جهت تسریع در فرآیند',
  ],
  tips: [
    'درخواست‌های عادی با دقت کامل توسط کارشناس رسیدگی و در موعد مقرر پاسخ داده می‌شوند.',
    'پس از ثبت، امکان گفت‌وگوی تعاملی و ارسال مدارک تکمیلی در طول رسیدگی پرونده فراهم است.',
    'تغییر وضعیت پرونده به صورت بلادرنگ در کارتابل شما منعکس و اطلاع‌رسانی می‌گردد.',
  ],
  enabled: true,
};

const OFFICIAL_ROLES_LIST = [
  { role: 'admin', title: 'مدیر ارشد سامانه' },
  { role: 'general_observer', title: 'ناظر کل سامانه' },
  { role: 'alumni_manager', title: 'مدیر دانش‌آموختگان' },
  { role: 'admin_finance_officer', title: 'مسئول اداری و مالی' },
  { role: 'education_deputy', title: 'معاونت آموزش' },
  { role: 'cultural_educational_officer', title: 'معاونت فرهنگی و رفاهی' },
  { role: 'research_deputy', title: 'معاونت اجرایی و پژوهش' },
];

export const CartableSection: React.FC = () => {
  const {
    currentUser,
    users,
    cartableRequests,
    createCartableRequest,
    replyCartableRequest,
    updateCartableStatus,
    markCartableAsRead,
  } = useApp();

  const isOfficial =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'supervisor' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'alumni_manager' ||
    currentUser?.role === 'admin_finance_officer' ||
    currentUser?.role === 'education_deputy' ||
    currentUser?.role === 'cultural_educational_officer' ||
    currentUser?.role === 'research_deputy' ||
    currentUser?.role === 'general_observer';

  const isAdminOrAlumniManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'alumni_manager';

  // Config State (Categories, Guide, Officials from Database)
  const [categories, setCategories] = useState<CartableCategoryItem[]>(DEFAULT_CATEGORIES);
  const [guide, setGuide] = useState<CartableGuide>(DEFAULT_GUIDE);
  const [officials, setOfficials] = useState(OFFICIAL_ROLES_LIST);

  // Guide UI States
  const [guideHovered, setGuideHovered] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [guideEditForm, setGuideEditForm] = useState<CartableGuide>(DEFAULT_GUIDE);
  const [savingGuide, setSavingGuide] = useState(false);

  // Category & Auto-referral Matrix Modal State
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [categoryListEdit, setCategoryListEdit] = useState<CartableCategoryItem[]>(DEFAULT_CATEGORIES);
  const [savingCategories, setSavingCategories] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatOfficialRole, setNewCatOfficialRole] = useState(OFFICIAL_ROLES_LIST[2].role);

  // Fetch Cartable Config from MySQL on Mount
  useEffect(() => {
    let isMounted = true;
    api
      .getCartableConfig()
      .then(cfg => {
        if (!isMounted || !cfg) return;
        if (Array.isArray(cfg.categories) && cfg.categories.length > 0) {
          setCategories(cfg.categories);
          setCategoryListEdit(cfg.categories);
        }
        if (cfg.guide) {
          setGuide(cfg.guide);
          setGuideEditForm(cfg.guide);
        }
        if (Array.isArray(cfg.officials) && cfg.officials.length > 0) {
          setOfficials(cfg.officials);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Selection & Navigation State
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

  // Supervisor View Mode: 'applicants' (گروه‌بندی متقاضیان) or 'all_requests' (کل درخواست‌ها)
  const [viewMode, setViewMode] = useState<'applicants' | 'all_requests'>(
    isOfficial ? 'applicants' : 'all_requests'
  );

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);

  // New Request Form State (defaults to first available category)
  const [newCategoryKey, setNewCategoryKey] = useState<string>(
    DEFAULT_CATEGORIES[0].key
  );
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<RequestPriority>('normal');
  const [newDescription, setNewDescription] = useState('');

  // Reply Box State
  const [replyText, setReplyText] = useState('');

  // BOLA & Role-based Visibility Filter
  const myRequests = cartableRequests.filter(req => {
    if (!isOfficial && req.applicantId !== currentUser?.id) {
      return false; // BOLA Check
    }
    return true;
  });

  // Automatically select initial request
  useEffect(() => {
    if (!selectedReqId && myRequests.length > 0) {
      setSelectedReqId(myRequests[0].id);
    }
  }, [myRequests, selectedReqId]);

  // Selected Request details
  const selectedRequest = cartableRequests.find(r => r.id === selectedReqId);

  // Mark request as read when selected
  useEffect(() => {
    if (selectedReqId && selectedRequest) {
      const needsRead = isOfficial
        ? selectedRequest.hasUnreadSupervisor
        : selectedRequest.hasUnreadApplicant;
      if (needsRead) {
        markCartableAsRead(selectedReqId);
      }
    }
  }, [selectedReqId, selectedRequest, isOfficial, markCartableAsRead]);

  // Handle Form submission: Create new request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim() || !newDescription.trim()) return;

    const matchedCategory = categories.find(c => c.key === newCategoryKey) || categories[0];

    try {
      await createCartableRequest(
        {
          category: matchedCategory.key as CartableCategory,
          categoryTitle: matchedCategory.title,
          title: newTitle.trim(),
          description: newDescription.trim(),
          applicantId: currentUser.id,
          applicantName: currentUser.fullName,
          applicantRoleTitle: currentUser.roleTitle,
          priority: newPriority,
          status: 'pending',
        },
        newDescription.trim()
      );

      setNewTitle('');
      setNewDescription('');
      setNewRequestModalOpen(false);
    } catch {
      // Handled in AppContext
    }
  };

  // Form submission: Send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedRequest) return;
    if (selectedRequest.status === 'archived') return;

    try {
      await replyCartableRequest(selectedRequest.id, replyText.trim());
      setReplyText('');
    } catch {
      // Handled in AppContext
    }
  };

  // Guide Management: Save edits to Database
  const handleSaveGuide = async (updatedGuide: CartableGuide) => {
    setSavingGuide(true);
    try {
      const res = await api.updateCartableGuide(updatedGuide);
      if (res?.guide) {
        setGuide(res.guide);
        setGuideEditForm(res.guide);
      } else {
        setGuide(updatedGuide);
      }
      setIsEditingGuide(false);
    } catch (err: any) {
      alert(`خطا در ذخیره راهنما در دیتابیس: ${err.message || 'خطای سرور'}`);
    } finally {
      setSavingGuide(false);
    }
  };

  // Guide Management: Delete/Hide Guide
  const handleDeleteGuide = async () => {
    if (!confirm('آیا از حذف/غیرفعال‌سازی راهنمای ثبت درخواست اطمینان دارید؟')) return;
    const disabledGuide = { ...guide, enabled: false };
    await handleSaveGuide(disabledGuide);
  };

  // Category Matrix Management: Save to Database
  const handleSaveCategories = async (newList: CartableCategoryItem[]) => {
    setSavingCategories(true);
    try {
      const res = await api.updateCartableCategories(newList);
      if (res?.categories) {
        setCategories(res.categories);
        setCategoryListEdit(res.categories);
      } else {
        setCategories(newList);
      }
      setCategoriesModalOpen(false);
    } catch (err: any) {
      alert(`خطا در ذخیره دسته‌بندی‌ها در دیتابیس: ${err.message || 'خطای سرور'}`);
    } finally {
      setSavingCategories(false);
    }
  };

  // Helper for status badge styling and Persian label
  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'در انتظار پاسخ',
          color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'in_progress':
        return {
          label: 'در حال جریان',
          color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/30',
        };
      case 'need_info':
        return {
          label: 'نیازمند تکمیل مدارک',
          color:
            'text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/40 font-black',
        };
      case 'rejected':
        return {
          label: 'رد درخواست',
          color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
      case 'completed':
        return {
          label: 'انجام شد',
          color:
            'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'archived':
        return {
          label: 'مختومه‌شده',
          color: 'text-slate-500 dark:text-stone-400 bg-stone-500/10 border-stone-500/30',
        };
    }
  };

  // Metrics Counters
  const pendingCount = myRequests.filter(
    r => r.status === 'pending' || r.hasUnreadSupervisor
  ).length;
  const inProgressCount = myRequests.filter(r => r.status === 'in_progress').length;
  const unreadCount = myRequests.filter(r =>
    isOfficial ? r.hasUnreadSupervisor : r.hasUnreadApplicant
  ).length;
  const archivedCount = myRequests.filter(
    r => r.status === 'archived' || r.status === 'completed'
  ).length;

  // Group requests by applicant for Supervisor People-First View
  const applicantGroups = Array.from(new Set(myRequests.map(r => r.applicantId))).map(
    appId => {
      const appReqs = myRequests.filter(r => r.applicantId === appId);
      const applicantObj = users.find(u => u.id === appId) || {
        fullName: appReqs[0]?.applicantName || 'متقاضی محترم',
        roleTitle: appReqs[0]?.applicantRoleTitle || 'دانش‌آموخته',
      };

      const activeReqs = appReqs.filter(
        r => r.status !== 'archived' && r.status !== 'completed'
      );
      const closedReqs = appReqs.filter(
        r => r.status === 'archived' || r.status === 'completed'
      );
      const hasUnread = appReqs.some(r =>
        isOfficial ? r.hasUnreadSupervisor : r.hasUnreadApplicant
      );

      return {
        applicantId: appId,
        fullName: applicantObj.fullName,
        roleTitle: applicantObj.roleTitle,
        totalCount: appReqs.length,
        activeRequests: activeReqs,
        closedRequests: closedReqs,
        hasUnread,
      };
    }
  );

  // Filter visible requests for list
  const filteredRequestsList = myRequests.filter(req => {
    if (selectedApplicantId && req.applicantId !== selectedApplicantId) {
      return false;
    }
    if (categoryFilter !== 'all' && req.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && req.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(q) ||
        req.trackingNumber.toLowerCase().includes(q) ||
        req.applicantName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedCategoryObj = categories.find(c => c.key === newCategoryKey) || categories[0];

  return (
    <div className="space-y-6" dir="rtl">
      {/* 4 Metric Cards Overview conforming to Blueprint Section 9 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="درخواست‌های جدید / باز"
          value={pendingCount}
          periodLabel="نیازمند بررسی مسئول"
          unit="مورد"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          onClick={() => {
            setViewMode('all_requests');
            setStatusFilter('pending');
          }}
        />
        <ModernMetricCard
          title="در حال جریان"
          value={inProgressCount}
          periodLabel="پیگیری ارجاعات"
          unit="مورد"
          icon={<FolderKanban className="w-4 h-4 text-sky-500" />}
          onClick={() => {
            setViewMode('all_requests');
            setStatusFilter('in_progress');
          }}
        />
        <ModernMetricCard
          title="اعلان‌ها / پیام جدید"
          value={unreadCount}
          periodLabel="پاسخ‌های جدید گفت‌وگو"
          unit="پیام"
          icon={<BadgeAlert className="w-4 h-4 text-rose-500" />}
          onClick={() => {
            setViewMode('all_requests');
          }}
        />
        <ModernMetricCard
          title="پرونده‌های مختومه‌شده"
          value={archivedCount}
          periodLabel="بایگانی نهایی"
          unit="پرونده"
          icon={<Archive className="w-4 h-4 text-emerald-500" />}
          onClick={() => {
            setViewMode('all_requests');
            setStatusFilter('archived');
          }}
        />
      </div>

      {/* Main Header Bar */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                کارتابل خدمات اداری و آموزشی
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                درگاه ثبت درخواست‌های رسمی، استعلامات و گفت‌وگوی دوطرفه اعضا و مسئولین مرکز
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Switch View Mode for Supervisor */}
          {isOfficial && (
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl text-xs font-bold border border-slate-300/60 dark:border-slate-700/60">
              <button
                onClick={() => {
                  setViewMode('applicants');
                  setSelectedApplicantId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                  viewMode === 'applicants'
                    ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>به تفکیک متقاضیان</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('all_requests');
                  setSelectedApplicantId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                  viewMode === 'all_requests'
                    ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>کل درخواست‌ها</span>
              </button>
            </div>
          )}

          {/* Admin & Alumni Manager: Dynamic Categories & Routing Matrix Button */}
          {isAdminOrAlumniManager && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCategoryListEdit([...categories]);
                setCategoriesModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/70 dark:border-slate-700/70 text-xs font-black transition-all cursor-pointer shadow-sm"
              title="مدیریت دسته‌بندی‌ها و ارجاع خودکار"
            >
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">دسته‌بندی‌ها و ارجاع</span>
            </motion.button>
          )}

          {/* Guide Button with Hover Popover & Click Modal (اصلاح ۵) */}
          <div
            className="relative"
            onMouseEnter={() => setGuideHovered(true)}
            onMouseLeave={() => setGuideHovered(false)}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGuideModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500/15 to-amber-500/25 hover:from-amber-500/25 hover:to-amber-500/35 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>راهنمای ثبت درخواست</span>
            </motion.button>

            {/* Quick Preview Hover Popover */}
            <AnimatePresence>
              {guideHovered && !guideModalOpen && guide.enabled !== false && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute left-0 top-full mt-2 w-80 p-4 bg-slate-950/95 text-white backdrop-blur-xl border border-amber-500/40 rounded-2xl shadow-2xl z-50 text-right pointer-events-none"
                >
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-400">{guide.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3 line-clamp-3">
                    {guide.content}
                  </p>
                  <div className="space-y-1.5 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Check className="w-3 h-3" />
                      <span>ارجاع هوشمند بر اساس دسته‌بندی موضوعی</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Check className="w-3 h-3" />
                      <span>پیگیری بلادرنگ و گفت‌وگوی دوطرفه</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-400/80 mt-2.5 pt-2 border-t border-white/10 text-center font-bold">
                    برای مشاهده راهنمای تفصیلی کلیک کنید
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Request Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setNewRequestModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت درخواست جدید</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Applicants or Requests List (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col transition-colors shadow-lg">
          {/* Header Controls inside Left Column */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            {selectedApplicantId && (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-bold">
                <span>درخواست‌های متقاضی انتخاب‌شده</span>
                <button
                  onClick={() => setSelectedApplicantId(null)}
                  className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors text-slate-500 dark:text-slate-300"
                  title="نمایش همه متقاضیان"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در عنوان، کد پیگیری، متقاضی..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>

            {/* Category Filter Tabs (Dynamic from Categories List) */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl text-xs overflow-x-auto scrollbar-none">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                همه
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id || cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all ${
                    categoryFilter === cat.key
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Render APPLICANTS GROUPED VIEW for Supervisors */}
          {isOfficial && viewMode === 'applicants' && !selectedApplicantId ? (
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
              <div className="p-3 bg-slate-100 dark:bg-slate-900/80 text-[11px] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                لیست متقاضیان (جهت مشاهده درخواست‌های فعال و مختومه‌شده هر فرد کلیک کنید):
              </div>
              {applicantGroups.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto text-slate-400" />
                  <p>هیچ متقاضی یافت نشد.</p>
                </div>
              ) : (
                applicantGroups.map(group => (
                  <button
                    key={group.applicantId}
                    onClick={() => setSelectedApplicantId(group.applicantId)}
                    className="w-full p-4 text-right hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {group.fullName}
                          </h3>
                          {group.hasUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {group.roleTitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-left">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {toPersianNumbers(group.activeRequests.length)} فعال
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {toPersianNumbers(group.closedRequests.length)} مختومه‌شده
                        </span>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            /* ALL REQUESTS LIST VIEW (Zero Overlap Layout) */
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
              {filteredRequestsList.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p>هیچ درخواستی یافت نشد.</p>
                </div>
              ) : (
                filteredRequestsList.map(req => {
                  const isSelected = selectedReqId === req.id;
                  const statusMeta = getStatusText(req.status);
                  const isUnread = isOfficial
                    ? req.hasUnreadSupervisor
                    : req.hasUnreadApplicant;
                  const cleanTrackingCode = toPersianNumbers(
                    req.trackingNumber.replace('TRK-1403-', '').replace('TRK-', '')
                  );

                  return (
                    <button
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`w-full p-4 text-right transition-all flex flex-col gap-2.5 ${
                        isSelected
                          ? 'bg-slate-200/90 dark:bg-slate-800/90 border-r-4 border-emerald-500 shadow-xs'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Zero Overlap Header: Clean Inline Flex Box */}
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
                          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                            کد {cleanTrackingCode}
                          </span>
                          <span>·</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {req.categoryTitle ? req.categoryTitle.split(' ')[0] : 'خدمات'}
                          </span>
                        </div>

                        {/* Inline Badges Container (No Absolute Overlap) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUnread && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 text-[10px] font-black animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              <span>پاسخ جدید</span>
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                        {req.title}
                      </h3>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 font-medium">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {req.applicantName}
                        </span>
                        <span className="font-mono tabular-nums">
                          {toPersianNumbers(req.updatedAt)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Chat Canvas & Interactive Response Matrix (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col transition-colors shadow-xl min-h-[600px]">
          {selectedRequest ? (
            <>
              {/* Header Box */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {selectedRequest.categoryTitle}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-slate-400">
                        شماره پیگیری: {toPersianNumbers(selectedRequest.trackingNumber)}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                      {selectedRequest.title}
                    </h2>
                  </div>

                  <span
                    className={`text-xs font-black px-3 py-1.5 rounded-xl border shrink-0 ${
                      getStatusText(selectedRequest.status).color
                    }`}
                  >
                    {getStatusText(selectedRequest.status).label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 font-medium">
                  <span>
                    متقاضی:{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {selectedRequest.applicantName}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>سمت: {selectedRequest.applicantRoleTitle}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">
                    ثبت: {toPersianNumbers(selectedRequest.createdAt)}
                  </span>
                  {(selectedRequest as any).referredDepartment && (
                    <>
                      <span>·</span>
                      <span className="text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                        ارجاع شده به: {(selectedRequest as any).referredDepartment}
                      </span>
                    </>
                  )}
                </div>

                {/* Supervisor Status Action Matrix (دکمه‌های تغییر وضعیت مسئول) */}
                {isOfficial && (
                  <div className="pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 block">
                      اقدامات مدیریتی و تغییر وضعیت پرونده:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => updateCartableStatus(selectedRequest.id, 'in_progress')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedRequest.status === 'in_progress'
                            ? 'bg-sky-500 text-stone-950 border-sky-400 shadow-md font-black'
                            : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30'
                        }`}
                      >
                        در حال جریان
                      </button>

                      <button
                        onClick={() => updateCartableStatus(selectedRequest.id, 'need_info')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedRequest.status === 'need_info'
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-black'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        نیازمند تکمیل مدارک
                      </button>

                      <button
                        onClick={() => updateCartableStatus(selectedRequest.id, 'rejected')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedRequest.status === 'rejected'
                            ? 'bg-rose-500 text-stone-950 border-rose-400 shadow-md font-black'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        رد درخواست
                      </button>

                      <button
                        onClick={() => updateCartableStatus(selectedRequest.id, 'completed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedRequest.status === 'completed'
                            ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-md font-black'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        انجام شد
                      </button>

                      <button
                        onClick={() => updateCartableStatus(selectedRequest.id, 'archived')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedRequest.status === 'archived'
                            ? 'bg-stone-700 text-white border-stone-600 shadow-md font-black'
                            : 'bg-stone-500/10 hover:bg-stone-500/20 text-slate-700 dark:text-stone-300 border-stone-500/30'
                        }`}
                      >
                        مختومه کردن درخواست
                      </button>
                    </div>
                  </div>
                )}

                {/* مراحل پردازش (با گام «در حال پیگیری»)، شاخص زمان انتظار، پیوست در دیسک و ارجاع داخلی */}
                <CartableEnhancedTools
                  request={selectedRequest}
                  isOfficial={isOfficial}
                  onRequestUpdated={() => {
                    // Handled automatically via SSE and app state
                  }}
                />
              </div>

              {/* Chat Message Timeline (محیط گفت‌وگوی چت دو طرفه) */}
              <div className="p-6 flex-1 min-h-[350px] max-h-[460px] overflow-y-auto space-y-4 bg-slate-100/60 dark:bg-slate-950/60">
                {selectedRequest.messages.map(msg => {
                  const isFromMe = msg.senderId === currentUser?.id;
                  const isStaff =
                    msg.senderRole === 'admin' ||
                    msg.senderRole === 'supervisor' ||
                    msg.senderRole === 'alumni_manager' ||
                    msg.senderRole === 'admin_finance_officer';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isFromMe ? 'items-start' : 'items-end'}`}
                    >
                      {/* Message Sender Header */}
                      <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                        <div className="flex items-center gap-1.5">
                          {isStaff ? (
                            <Shield className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-sky-500" />
                          )}
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                            {msg.senderName}
                          </span>
                        </div>
                        {isStaff && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-extrabold text-[10px]">
                            پاسخ مسئول بخش
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-mono tabular-nums text-slate-400">
                          {toPersianNumbers(msg.timestamp)}
                        </span>
                      </div>

                      {/* Chat Bubble */}
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm transition-all ${
                          isStaff
                            ? 'bg-amber-500/10 dark:bg-amber-950/25 text-slate-900 dark:text-amber-100 border border-amber-500/30 rounded-tl-none shadow-amber-500/5'
                            : isFromMe
                            ? 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700/80 rounded-tr-none shadow-md'
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {/* Banner when request is Archived */}
                {selectedRequest.status === 'archived' && (
                  <div className="p-4 rounded-2xl bg-stone-500/15 border border-stone-500/30 text-slate-700 dark:text-stone-300 text-xs text-center flex items-center justify-center gap-2.5 font-bold my-4 shadow-xs">
                    <Lock className="w-5 h-5 text-stone-500 shrink-0" />
                    <span>
                      این درخواست توسط مسئول مربوطه به طور کامل مختومه و بایگانی شده است. امکان ارسال پیام جدید وجود ندارد.
                    </span>
                  </div>
                )}
              </div>

              {/* Reply Box or Closed Lock */}
              {selectedRequest.status !== 'archived' ? (
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex gap-2 items-center">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="متن پاسخ یا توضیحات جدید خود را بنویسید..."
                      className="flex-1 p-3.5 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-5 py-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 shrink-0 cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <span>ثبت پاسخ</span>
                      <Send className="w-4 h-4 rotate-180" />
                    </motion.button>
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
                  ارسال پیام برای این پرونده به دلیل مختومه بودن غیرفعال است.
                </div>
              )}
            </>
          ) : (
            <div className="p-20 text-center text-xs text-slate-400 space-y-3">
              <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                هیچ درخواستی انتخاب نشده است.
              </p>
              <p>لطفاً یک درخواست را از لیست سمت راست انتخاب نمایید.</p>
            </div>
          )}
        </div>
      </div>

      {/* NEW REQUEST MODAL (With Dynamic Categories & Auto-Referral Routing Info & Clean Priority) */}
      <AnimatePresence>
        {newRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    ثبت درخواست جدید در کارتابل خدمات
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    درخواست شما مستقیماً به مسئول مربوطه ارجاع داده شده و کد پیگیری یکتا دریافت می‌کنید.
                  </p>
                </div>
                <button
                  onClick={() => setNewRequestModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                {/* Dynamic Category Dropdown (اصلاح ۸ و ۹) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    دسته‌بندی موضوعی درخواست
                  </label>
                  <select
                    value={newCategoryKey}
                    onChange={e => setNewCategoryKey(e.target.value)}
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.id || cat.key} value={cat.key}>
                        {cat.title}
                      </option>
                    ))}
                  </select>

                  {/* Auto-referral indicator badge */}
                  {selectedCategoryObj && (
                    <div className="mt-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs flex items-center justify-between text-sky-700 dark:text-sky-300 font-medium">
                      <span>{selectedCategoryObj.description}</span>
                      <span className="font-bold text-[11px] bg-sky-500/20 px-2 py-0.5 rounded-md text-sky-800 dark:text-sky-200 shrink-0">
                        ارجاع خودکار به: {selectedCategoryObj.assignedOfficialTitle}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    عنوان درخواست
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="عنوان دقیق درخواست خود را بنویسید (مثال: تقاضای صدور گواهی فارغ‌التحصیلی)"
                    className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Priority Selection (اصلاح ۷: تبدیل به «عادی» خالص و حفظ عبارت پرانتزی «فوری») */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    اولویّت پاسخگویی
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewPriority('normal')}
                      className={`p-3 rounded-2xl text-xs font-black border transition-all text-center ${
                        newPriority === 'normal'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                      }`}
                    >
                      عادی
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewPriority('urgent')}
                      className={`p-3 rounded-2xl text-xs font-black border transition-all text-center ${
                        newPriority === 'urgent'
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/50 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-800'
                      }`}
                    >
                      فوری (نیازمند اقدام سریع / بررسی ظرف ۲۴ ساعت)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    شرح درخواست و توضیحات کامل
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="مشخصات کامل، دلایل و توضیحات درخواست خود را بنویسید..."
                    className="w-full p-4 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRequestModalOpen(false)}
                    className="px-5 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    ارسال درخواست
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GUIDE MODAL (اصلاح ۵: نمایش کامل، ویرایش و حذف توسط ادمین و مدیر دانش‌آموختگان) */}
      <AnimatePresence>
        {guideModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {isEditingGuide ? 'ویرایش راهنمای ثبت درخواست' : guide.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      راهنمای رسمی مراحل، ضوابط و رهگیری در کارتابل خدمات
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdminOrAlumniManager && !isEditingGuide && (
                    <button
                      onClick={() => setIsEditingGuide(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش راهنما</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setGuideModalOpen(false);
                      setIsEditingGuide(false);
                    }}
                    className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                {isEditingGuide ? (
                  /* EDITING FORM FOR ADMIN & ALUMNI MANAGER */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        عنوان راهنما
                      </label>
                      <input
                        type="text"
                        value={guideEditForm.title}
                        onChange={e =>
                          setGuideEditForm({ ...guideEditForm, title: e.target.value })
                        }
                        className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        متن اصلی راهنما
                      </label>
                      <textarea
                        rows={4}
                        value={guideEditForm.content}
                        onChange={e =>
                          setGuideEditForm({ ...guideEditForm, content: e.target.value })
                        }
                        className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        مراحل انجام کار (هر خط یک مرحله)
                      </label>
                      <textarea
                        rows={4}
                        value={guideEditForm.steps.join('\n')}
                        onChange={e =>
                          setGuideEditForm({
                            ...guideEditForm,
                            steps: e.target.value.split('\n').filter(s => s.trim().length > 0),
                          })
                        }
                        className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        نکات مهم و الزامات رسیدگی (هر خط یک نکته)
                      </label>
                      <textarea
                        rows={3}
                        value={guideEditForm.tips.join('\n')}
                        onChange={e =>
                          setGuideEditForm({
                            ...guideEditForm,
                            tips: e.target.value.split('\n').filter(t => t.trim().length > 0),
                          })
                        }
                        className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed font-mono text-xs"
                      />
                    </div>

                    {/* Actions in Edit Mode */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleDeleteGuide}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف / غیرفعال‌سازی راهنما</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingGuide(false)}
                          className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                        >
                          انصراف
                        </button>
                        <button
                          type="button"
                          disabled={savingGuide}
                          onClick={() => handleSaveGuide(guideEditForm)}
                          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                        >
                          {savingGuide ? 'در حال ذخیره...' : 'ذخیره در پایگاه داده'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* READ VIEW OF GUIDE */
                  <div className="space-y-6">
                    {/* Content */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-amber-100 leading-relaxed font-medium">
                      {guide.content}
                    </div>

                    {/* Steps */}
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>مراحل ثبت و پیگیری درخواست</span>
                      </h4>
                      <div className="space-y-2.5">
                        {guide.steps.map((st, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800"
                          >
                            <span className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                              {toPersianNumbers(i + 1)}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                              {st}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>نکات کلیدی و راهکارهای تسریع رسیدگی</span>
                      </h4>
                      <div className="space-y-2">
                        {guide.tips.map((tp, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 text-xs font-medium text-slate-600 dark:text-slate-300"
                          >
                            <Info className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>{tp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isEditingGuide && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {guide.updatedBy ? `آخرین بروزرسانی توسط: ${guide.updatedBy}` : 'مرکز خدمات اداری و دانش‌آموختگان'}
                  </span>
                  <button
                    onClick={() => {
                      setGuideModalOpen(false);
                      setNewRequestModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <span>شروع ثبت درخواست</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CATEGORIES & AUTO-REFERRAL ROUTING MODAL (اصلاح ۸ و ۹: مدیریت دسته‌بندی‌ها و ارجاع خودکار) */}
      <AnimatePresence>
        {categoriesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      مدیریت دسته‌بندی‌ها و ماتریس ارجاع خودکار
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      تعریف دسته‌ها، ویرایش عناوین و تعیین مسئول پیش‌فرض رسیدگی‌کننده
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCategoriesModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
                {/* Form to Add New Category */}
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/80 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-500" />
                    <span>افزودن دسته‌بندی جدید به کارتابل</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        عنوان فارسی دسته‌بندی
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: خدمات رفاهی و تسهیلات قرض‌الحسنه"
                        value={newCatTitle}
                        onChange={e => setNewCatTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        کلید سیستمی (انگلیسی یکتا)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: welfare"
                        value={newCatKey}
                        onChange={e =>
                          setNewCatKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                        }
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        مسئول پیش‌فرض رسیدگی (ارجاع خودکار)
                      </label>
                      <select
                        value={newCatOfficialRole}
                        onChange={e => setNewCatOfficialRole(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                      >
                        {officials.map(off => (
                          <option key={off.role} value={off.role}>
                            {off.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        شرح مختصر دسته
                      </label>
                      <input
                        type="text"
                        placeholder="توضیح جهت راهنمایی دانش‌آموخته هنگام انتخاب"
                        value={newCatDescription}
                        onChange={e => setNewCatDescription(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCatTitle.trim() || !newCatKey.trim()) {
                          alert('لطفاً عنوان و کلید سیستمی را وارد کنید.');
                          return;
                        }
                        const offObj = officials.find(o => o.role === newCatOfficialRole);
                        const newCatItem: CartableCategoryItem = {
                          id: `cat_${Date.now()}`,
                          key: newCatKey.trim(),
                          title: newCatTitle.trim(),
                          assignedRole: newCatOfficialRole,
                          assignedOfficialTitle: offObj?.title || 'مدیر دانش‌آموختگان',
                          description: newCatDescription.trim() || newCatTitle.trim(),
                        };
                        setCategoryListEdit([...categoryListEdit, newCatItem]);
                        setNewCatTitle('');
                        setNewCatKey('');
                        setNewCatDescription('');
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl font-black text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن به لیست دسته‌ها</span>
                    </button>
                  </div>
                </div>

                {/* List of Existing Categories */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-500" />
                    <span>فهرست دسته‌بندی‌های فعال و ماتریس ارجاع ({toPersianNumbers(categoryListEdit.length)} دسته)</span>
                  </h4>

                  <div className="space-y-2.5">
                    {categoryListEdit.map((cat, idx) => (
                      <div
                        key={cat.id || cat.key || idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                              {cat.title}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              {cat.key}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {cat.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
                          <div className="flex flex-col items-start md:items-end">
                            <span className="text-[10px] text-slate-400 font-bold">مسئول پیش‌فرض:</span>
                            <select
                              value={cat.assignedRole}
                              onChange={e => {
                                const newRole = e.target.value;
                                const off = officials.find(o => o.role === newRole);
                                const updated = categoryListEdit.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        assignedRole: newRole,
                                        assignedOfficialTitle: off?.title || item.assignedOfficialTitle,
                                      }
                                    : item
                                );
                                setCategoryListEdit(updated);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-sky-700 dark:text-sky-300"
                            >
                              {officials.map(off => (
                                <option key={off.role} value={off.role}>
                                  {off.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (categoryListEdit.length <= 1) {
                                alert('حداقل یک دسته‌بندی باید در کارتابل باقی بماند.');
                                return;
                              }
                              setCategoryListEdit(categoryListEdit.filter((_, i) => i !== idx));
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                            title="حذف دسته‌بندی"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoriesModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={savingCategories}
                  onClick={() => handleSaveCategories(categoryListEdit)}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingCategories ? 'در حال ثبت در دیتابیس...' : 'ذخیره تنظیمات در پایگاه داده'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

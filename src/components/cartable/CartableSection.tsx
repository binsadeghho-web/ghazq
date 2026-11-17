import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { RequestStatus } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { api } from '../../services/apiClient';
import { CartableEnhancedTools } from './CartableEnhancedTools';
import { CartableStatsCards } from './CartableStatsCards';
import { CartableApplicantInfoPanel } from './CartableApplicantInfoPanel';
import { CartableAttachmentList } from './CartableAttachmentList';
import { CartableFollowableTopicsModal } from './CartableFollowableTopicsModal';
import { CartableNewRequestModal } from './CartableNewRequestModal';
import { CartableCategoriesModal } from './CartableCategoriesModal';
import { CartableGuideModal } from './CartableGuideModal';
import {
  CARTABLE_FILE_ACCEPT,
  CartableCategoryItem,
  CartableFollowableTopic,
  CartableFollowableTopicsConfig,
  CartableGuide,
  DEFAULT_CATEGORIES,
  DEFAULT_FOLLOWABLE_TOPICS,
  DEFAULT_GUIDE,
  OFFICIAL_ROLES_LIST,
  isStaffRole,
  validateCartableClientFile,
} from './cartableTypes';
import {
  Inbox,
  Plus,
  Send,
  User,
  Shield,
  Search,
  X,
  FolderKanban,
  ChevronLeft,
  HelpCircle,
  BookOpen,
  Sliders,
  Lock,
  Check,
  Paperclip,
  Loader2,
  ClipboardList,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

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

  const isOfficial = isStaffRole(currentUser?.role);
  const isAdminOrAlumniManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'alumni_manager';

  // Server-backed Cartable Config State
  const [categories, setCategories] = useState<CartableCategoryItem[]>(DEFAULT_CATEGORIES);
  const [categoriesDisabled, setCategoriesDisabled] = useState<boolean>(false);
  const [guide, setGuide] = useState<CartableGuide>(DEFAULT_GUIDE);
  const [followableTopics, setFollowableTopics] = useState<CartableFollowableTopicsConfig>(
    DEFAULT_FOLLOWABLE_TOPICS
  );
  const [officials, setOfficials] = useState(OFFICIAL_ROLES_LIST);

  // Modals State
  const [guideHovered, setGuideHovered] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [followableModalOpen, setFollowableModalOpen] = useState(false);
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);
  const [prefillTopic, setPrefillTopic] = useState<{ title?: string; categoryKey?: string }>({});

  const fetchCartableConfig = async () => {
    try {
      const cfg = await api.getCartableConfig();
      if (!cfg) return;
      if (Array.isArray(cfg.categories) && cfg.categories.length > 0) {
        setCategories(cfg.categories);
      }
      if (typeof cfg.categoriesDisabled === 'boolean') {
        setCategoriesDisabled(cfg.categoriesDisabled);
      }
      if (cfg.guide) {
        setGuide(cfg.guide);
      }
      if (cfg.followableTopics) {
        setFollowableTopics(cfg.followableTopics);
      }
      if (Array.isArray(cfg.officials) && cfg.officials.length > 0) {
        setOfficials(cfg.officials);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCartableConfig();
    const handleConfigUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const data = detail?.data || detail;
      if (data?.categories) setCategories(data.categories);
      if (typeof data?.categoriesDisabled === 'boolean') {
        setCategoriesDisabled(data.categoriesDisabled);
      }
      if (data?.guide) setGuide(data.guide);
      if (data?.followableTopics) setFollowableTopics(data.followableTopics);
      if (!data?.categories && !data?.guide && !data?.followableTopics) {
        fetchCartableConfig();
      }
    };
    window.addEventListener('app:cartable_config_updated', handleConfigUpdate);
    return () => {
      window.removeEventListener('app:cartable_config_updated', handleConfigUpdate);
    };
  }, []);

  // Selection & Navigation State
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'applicants' | 'all_requests'>(
    isOfficial ? 'applicants' : 'all_requests'
  );

  useEffect(() => {
    setViewMode(isOfficial ? 'applicants' : 'all_requests');
    setSelectedApplicantId(null);
  }, [isOfficial]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Chat Reply & Reply Attachment State
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Array<{ url: string; name: string }>>([]);
  const [uploadingReplyFile, setUploadingReplyFile] = useState(false);
  const [replyFileError, setReplyFileError] = useState<string | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  // BOLA & Role-based Visibility Filter
  const myRequests = cartableRequests.filter(req => {
    if (!isOfficial && req.applicantId !== currentUser?.id) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (!selectedReqId && myRequests.length > 0) {
      setSelectedReqId(myRequests[0].id);
    }
  }, [myRequests, selectedReqId]);

  const selectedRequest = cartableRequests.find(r => r.id === selectedReqId);

  useEffect(() => {
    setReplyAttachments([]);
    setReplyFileError(null);
  }, [selectedReqId]);

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

  // Attach file directly inside chat reply (saved into separate folder: cartable_officials vs cartable_alumni)
  const handleSelectReplyFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setReplyFileError(null);
    setUploadingReplyFile(true);
    try {
      const targetCategory = isOfficial ? 'cartable_officials' : 'cartable_alumni';
      for (const file of files) {
        const validation = validateCartableClientFile(file);
        if (!validation.ok) {
          setReplyFileError(validation.error || 'فرمت فایل مجاز نیست.');
          continue;
        }
        const uploaded = await api.uploadFile(file, targetCategory);
        if (uploaded?.url) {
          setReplyAttachments(prev => [
            ...prev,
            { url: uploaded.url, name: uploaded.originalName || file.name },
          ]);
        }
      }
    } catch (err: any) {
      setReplyFileError(err?.message || 'خطا در بارگذاری فایل پیوست.');
    } finally {
      setUploadingReplyFile(false);
      if (replyFileInputRef.current) replyFileInputRef.current.value = '';
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || selectedRequest.status === 'archived' || sendingReply) return;
    if (!replyText.trim() && replyAttachments.length === 0) return;

    setSendingReply(true);
    try {
      const finalText =
        replyText.trim() ||
        (isOfficial ? 'ارسال فایل / گواهی رسمی از سوی مسئول' : 'ارسال مدرک پیوست توسط متقاضی');
      const urls = replyAttachments.map(a => a.url);
      await replyCartableRequest(
        selectedRequest.id,
        finalText,
        urls.length > 0 ? urls : undefined
      );
      setReplyText('');
      setReplyAttachments([]);
      setReplyFileError(null);
    } finally {
      setSendingReply(false);
    }
  };

  // Config Saves
  const handleSaveGuide = async (updatedGuide: CartableGuide) => {
    const res = await api.updateCartableGuide(updatedGuide);
    setGuide(res?.guide || updatedGuide);
  };

  const handleSaveCategories = async (
    nextList: CartableCategoryItem[],
    nextDisabled: boolean
  ) => {
    const res = await api.updateCartableCategories(nextList, nextDisabled);
    setCategories(res?.categories || nextList);
    setCategoriesDisabled(
      typeof res?.categoriesDisabled === 'boolean' ? res.categoriesDisabled : nextDisabled
    );
  };

  const handleSaveFollowableTopics = async (nextConfig: CartableFollowableTopicsConfig) => {
    const res = await api.updateCartableFollowableTopics(nextConfig);
    setFollowableTopics(res?.followableTopics || nextConfig);
  };

  const handleSelectTopicForNewRequest = (topic: CartableFollowableTopic) => {
    setFollowableModalOpen(false);
    setPrefillTopic({
      title: topic.title,
      categoryKey: topic.categoryKey,
    });
    setNewRequestModalOpen(true);
  };

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
  const applicantGroups = Array.from(new Set(myRequests.map(r => r.applicantId))).map(appId => {
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
  });

  const filteredRequestsList = myRequests.filter(req => {
    if (selectedApplicantId && req.applicantId !== selectedApplicantId) return false;
    if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
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

  const activeCategories = categories.filter(c => c.isActive !== false);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats Strip / Redesigned Alumni KPI Cards (اصلاح ۵) */}
      <CartableStatsCards
        isOfficial={isOfficial}
        totalCount={myRequests.length}
        pendingCount={pendingCount}
        inProgressCount={inProgressCount}
        unreadCount={unreadCount}
        archivedCount={archivedCount}
        statusFilter={statusFilter}
        onSelectFilter={(status, switchToAll) => {
          if (switchToAll) setViewMode('all_requests');
          setStatusFilter(status);
        }}
      />

      {/* Main Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              کارتابل خدمات اداری و آموزشی
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              درگاه ثبت درخواست‌های رسمی، استعلامات و گفت‌وگوی دوطرفه اعضا و مسئولین مرکز
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full xl:w-auto justify-start xl:justify-end">
          {/* Switch View Mode for Officials */}
          {isOfficial && (
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl text-xs font-bold border border-slate-300/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setViewMode('applicants');
                  setSelectedApplicantId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'applicants'
                    ? 'bg-emerald-500 text-stone-950 shadow-md font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>به تفکیک متقاضیان</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('all_requests');
                  setSelectedApplicantId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
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

          {/* Admin & Alumni Manager: Categories & Routing Matrix */}
          {isAdminOrAlumniManager && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setCategoriesModalOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-black transition-all cursor-pointer shadow-sm ${
                categoriesDisabled
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300/70 dark:border-slate-700/70'
              }`}
              title="مدیریت دسته‌بندی‌ها و ارجاع خودکار"
            >
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>{categoriesDisabled ? 'دسته‌بندی‌ها (خاموش)' : 'دسته‌بندی‌ها و ارجاع'}</span>
            </motion.button>
          )}

          {/* Followable Topics Button (اصلاحیه ۴: موارد قابل پیگیری از مرکز فقه و حقوق اسلامی) */}
          {(followableTopics.enabled !== false || isAdminOrAlumniManager) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFollowableModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-sky-500/12 hover:bg-sky-500/22 text-sky-700 dark:text-sky-300 border border-sky-500/30 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-sky-500 shrink-0" />
              <span>{followableTopics.buttonLabel || 'موارد قابل پیگیری از مرکز فقه و حقوق اسلامی'}</span>
            </motion.button>
          )}

          {/* Guide Button with Hover Preview */}
          <div
            className="relative"
            onMouseEnter={() => setGuideHovered(true)}
            onMouseLeave={() => setGuideHovered(false)}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setGuideModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-500/15 to-amber-500/25 hover:from-amber-500/25 hover:to-amber-500/35 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>راهنمای ثبت درخواست</span>
            </motion.button>

            <AnimatePresence>
              {guideHovered && !guideModalOpen && guide.enabled !== false && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="hidden sm:block absolute left-0 top-full mt-2 w-80 p-4 bg-slate-950/95 text-white backdrop-blur-xl border border-amber-500/40 rounded-2xl shadow-2xl z-50 text-right pointer-events-none"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Request Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => {
              setPrefillTopic({});
              setNewRequestModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت درخواست جدید</span>
          </motion.button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: Applicants or Requests List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-900/50">
            {selectedApplicantId && (
              <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-bold">
                <span>درخواست‌های متقاضی انتخاب‌شده</span>
                <button
                  type="button"
                  onClick={() => setSelectedApplicantId(null)}
                  className="p-1 hover:bg-emerald-500/20 rounded-lg transition-colors text-slate-500 dark:text-slate-300 cursor-pointer"
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

            {!categoriesDisabled && activeCategories.length > 0 && (
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl text-xs overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  همه
                </button>
                {activeCategories.map(cat => (
                  <button
                    type="button"
                    key={cat.id || cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all cursor-pointer ${
                      categoryFilter === cat.key
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                    type="button"
                    key={group.applicantId}
                    onClick={() => setSelectedApplicantId(group.applicantId)}
                    className="w-full p-4 text-right hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
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
                  const isUnread = isOfficial ? req.hasUnreadSupervisor : req.hasUnreadApplicant;
                  const cleanTrackingCode = toPersianNumbers(
                    req.trackingNumber.replace('TRK-1403-', '').replace('TRK-', '')
                  );

                  return (
                    <button
                      type="button"
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`w-full p-3.5 text-right transition-colors flex flex-col gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-inset ring-emerald-500/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 min-w-0">
                          <span className="text-[11px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                            #{cleanTrackingCode}
                          </span>
                          <span>·</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                            {req.categoryTitle ? req.categoryTitle.split(' ')[0] : 'خدمات'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUnread && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              <span>جدید</span>
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${statusMeta.color}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                        {req.title}
                      </h3>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
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

        {/* RIGHT COLUMN: Case Inspector & Interactive Chat Canvas */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors min-h-[620px]">
          {selectedRequest ? (
            <>
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-900/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {selectedRequest.categoryTitle}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        کد پیگیری: {toPersianNumbers(selectedRequest.trackingNumber)}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-slate-400">
                        {toPersianNumbers(selectedRequest.createdAt)}
                      </span>
                    </div>

                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                      {selectedRequest.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <span>
                        متقاضی:{' '}
                        <strong className="text-slate-900 dark:text-white font-bold">
                          {selectedRequest.applicantName}
                        </strong>
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {selectedRequest.applicantRoleTitle}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-lg border shrink-0 ${
                      getStatusText(selectedRequest.status).color
                    }`}
                  >
                    {getStatusText(selectedRequest.status).label}
                  </span>
                </div>

                {/* Applicant Details Inspector (اصلاح ۲: ویژه مسئول پاسخ‌دهنده) */}
                {isOfficial && (
                  <CartableApplicantInfoPanel request={selectedRequest} users={users} />
                )}

                {/* Compact Inline Status Switcher for Officials */}
                {isOfficial && (
                  <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      وضعیت پرونده:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { key: 'in_progress' as RequestStatus, label: 'در حال جریان', activeClass: 'bg-sky-500 text-stone-950 border-sky-500 font-black' },
                        { key: 'need_info' as RequestStatus, label: 'نیازمند مدارک', activeClass: 'bg-amber-500 text-stone-950 border-amber-500 font-black' },
                        { key: 'completed' as RequestStatus, label: 'انجام شد', activeClass: 'bg-emerald-500 text-stone-950 border-emerald-500 font-black' },
                        { key: 'rejected' as RequestStatus, label: 'رد درخواست', activeClass: 'bg-rose-500 text-white border-rose-500 font-black' },
                        { key: 'archived' as RequestStatus, label: 'مختومه', activeClass: 'bg-stone-700 text-white border-stone-700 font-black' },
                      ].map(st => {
                        const isActive = selectedRequest.status === st.key;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => updateCartableStatus(selectedRequest.id, st.key)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              isActive
                                ? st.activeClass
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <CartableEnhancedTools
                  request={selectedRequest}
                  isOfficial={isOfficial}
                  onRequestUpdated={() => {}}
                />
              </div>

              {/* Chat Message Timeline */}
              <div
                className={`p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/60 ${
                  isOfficial ? 'min-h-[380px] max-h-[520px]' : 'min-h-[350px] max-h-[460px]'
                }`}
              >
                {selectedRequest.messages.map(msg => {
                  const isFromMe = msg.senderId === currentUser?.id;
                  const isStaff = isStaffRole(msg.senderRole);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isFromMe ? 'items-start' : 'items-end'}`}
                    >
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

                      <div
                        className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all space-y-2.5 ${
                          isStaff
                            ? 'bg-amber-500/10 dark:bg-amber-950/25 text-slate-900 dark:text-amber-100 border border-amber-500/30 rounded-tl-none shadow-amber-500/5'
                            : isFromMe
                            ? 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700/80 rounded-tr-none shadow-md'
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-none shadow-sm'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                          <div className="pt-2 border-t border-black/10 dark:border-white/10">
                            <CartableAttachmentList attachments={msg.attachments} compact />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {selectedRequest.status === 'archived' && (
                  <div className="p-4 rounded-2xl bg-stone-500/15 border border-stone-500/30 text-slate-700 dark:text-stone-300 text-xs text-center flex items-center justify-center gap-2.5 font-bold my-4 shadow-xs">
                    <Lock className="w-5 h-5 text-stone-500 shrink-0" />
                    <span>
                      این درخواست توسط مسئول مربوطه به طور کامل مختومه و بایگانی شده است. امکان ارسال پیام جدید وجود ندارد.
                    </span>
                  </div>
                )}
              </div>

              {/* Reply Box with Secure Attachment Uploader (اصلاح ۱: پیوست گواهی/فایل در پاسخ مسئول و دانش‌آموخته) */}
              {selectedRequest.status !== 'archived' ? (
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
                >
                  <input
                    ref={replyFileInputRef}
                    type="file"
                    multiple
                    accept={CARTABLE_FILE_ACCEPT}
                    onChange={handleSelectReplyFiles}
                    className="hidden"
                  />

                  {replyFileError && (
                    <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{replyFileError}</span>
                    </div>
                  )}

                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {replyAttachments.map((att, idx) => (
                        <div
                          key={`${att.url}-${idx}`}
                          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                        >
                          <span className="truncate max-w-[160px]" dir="ltr">
                            {att.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyAttachments(prev => prev.filter((_, i) => i !== idx))
                            }
                            className="text-rose-500 hover:text-rose-600 cursor-pointer"
                            title="حذف پیوست"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <button
                      type="button"
                      disabled={uploadingReplyFile}
                      onClick={() => replyFileInputRef.current?.click()}
                      className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title={
                        isOfficial
                          ? 'پیوست گواهی یا نامه رسمی (تصویر، PDF، Word)'
                          : 'پیوست مدرک (تصویر، PDF، Word)'
                      }
                    >
                      {uploadingReplyFile ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      ) : (
                        <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </button>

                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder={
                        isOfficial
                          ? 'متن پاسخ مسئول را بنویسید یا فایل گواهی/نامه را پیوست کنید...'
                          : 'متن پاسخ یا توضیحات جدید خود را بنویسید...'
                      }
                      className="flex-1 p-3 text-xs sm:text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all"
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={
                        sendingReply ||
                        uploadingReplyFile ||
                        (!replyText.trim() && replyAttachments.length === 0)
                      }
                      className="px-4 sm:px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 shrink-0 cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <span>{sendingReply ? 'ارسال...' : 'ثبت پاسخ'}</span>
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

      {/* Modular Modals */}
      <AnimatePresence>
        {newRequestModalOpen && (
          <CartableNewRequestModal
            isOpen={newRequestModalOpen}
            currentUser={currentUser}
            categories={categories}
            categoriesDisabled={categoriesDisabled}
            followableButtonLabel={
              followableTopics.buttonLabel || 'موارد قابل پیگیری از مرکز فقه و حقوق اسلامی'
            }
            followableEnabled={followableTopics.enabled !== false}
            initialCategoryKey={prefillTopic.categoryKey}
            initialTitle={prefillTopic.title}
            onClose={() => setNewRequestModalOpen(false)}
            onOpenFollowableTopics={() => {
              setNewRequestModalOpen(false);
              setFollowableModalOpen(true);
            }}
            onSubmitRequest={createCartableRequest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {followableModalOpen && (
          <CartableFollowableTopicsModal
            isOpen={followableModalOpen}
            config={followableTopics}
            categories={categories}
            canEdit={isAdminOrAlumniManager}
            onClose={() => setFollowableModalOpen(false)}
            onSaveConfig={handleSaveFollowableTopics}
            onSelectTopicForNewRequest={handleSelectTopicForNewRequest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {guideModalOpen && (
          <CartableGuideModal
            isOpen={guideModalOpen}
            guide={guide}
            canEdit={isAdminOrAlumniManager}
            onClose={() => setGuideModalOpen(false)}
            onSaveGuide={handleSaveGuide}
            onStartNewRequest={() => {
              setGuideModalOpen(false);
              setNewRequestModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoriesModalOpen && (
          <CartableCategoriesModal
            isOpen={categoriesModalOpen}
            categories={categories}
            categoriesDisabled={categoriesDisabled}
            officials={officials}
            onClose={() => setCategoriesModalOpen(false)}
            onSave={handleSaveCategories}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

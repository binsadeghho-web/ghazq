import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CartableCategory, CartableRequest, RequestPriority, RequestStatus } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
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
  X
} from 'lucide-react';

export const CartableSection: React.FC = () => {
  const { currentUser, cartableRequests, createCartableRequest, replyCartableRequest, updateCartableStatus } = useApp();
  
  const [selectedReqId, setSelectedReqId] = useState<string | null>(cartableRequests[0]?.id || null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | CartableCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newRequestModalOpen, setNewRequestModalOpen] = useState(false);

  // New Request Form State
  const [newCategory, setNewCategory] = useState<CartableCategory>('career');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<RequestPriority>('normal');
  const [newDescription, setNewDescription] = useState('');

  // Reply Box State
  const [replyText, setReplyText] = useState('');

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Filter requests
  const visibleRequests = cartableRequests.filter(req => {
    if (!isOfficial && req.applicantId !== currentUser?.id) {
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

  const selectedRequest = cartableRequests.find(r => r.id === selectedReqId) || visibleRequests[0];

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    let catTitle = 'خدمات اداری';
    if (newCategory === 'career') catTitle = 'خدمات شغلی (جابه‌جایی و ارتقای رتبه)';
    if (newCategory === 'educational') catTitle = 'خدمات آموزشی (تطبیق و معرفی‌نامه)';

    createCartableRequest(
      {
        category: newCategory,
        categoryTitle: catTitle,
        title: newTitle,
        description: newDescription,
        applicantId: currentUser.id,
        applicantName: currentUser.fullName,
        applicantRoleTitle: currentUser.roleTitle,
        priority: newPriority,
        status: 'pending',
      },
      newDescription
    );

    setNewTitle('');
    setNewDescription('');
    setNewRequestModalOpen(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedRequest) return;
    replyCartableRequest(selectedRequest.id, replyText.trim());
    setReplyText('');
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'در حال بررسی', color: 'text-amber-600 dark:text-amber-400' };
      case 'in_progress':
        return { label: 'در دست اقدام', color: 'text-blue-600 dark:text-blue-400' };
      case 'need_info':
        return { label: 'نیازمند تکمیل مدارک', color: 'text-rose-600 dark:text-rose-400' };
      case 'completed':
        return { label: 'خاتمه‌یافته', color: 'text-emerald-600 dark:text-emerald-400' };
    }
  };

  const pendingCount = cartableRequests.filter(r => r.status === 'pending').length;
  const inProgressCount = cartableRequests.filter(r => r.status === 'in_progress').length;
  const needInfoCount = cartableRequests.filter(r => r.status === 'need_info').length;
  const completedCount = cartableRequests.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* 4 Metric Cards Overview conforming to Blueprint Section 9 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="درخواست‌های جدید"
          value={pendingCount}
          periodLabel="نیازمند بررسی اولیه"
          unit="مورد"
          icon={<Clock className="w-4 h-4" />}
          onClick={() => setStatusFilter('pending')}
        />
        <ModernMetricCard
          title="در دست اقدام"
          value={inProgressCount}
          periodLabel="ارجاع‌شده به شعب"
          unit="مورد"
          icon={<FileText className="w-4 h-4" />}
          onClick={() => setStatusFilter('in_progress')}
        />
        <ModernMetricCard
          title="نیاز به تکمیل مدارک"
          value={needInfoCount}
          periodLabel="منتظر پاسخ متقاضی"
          unit="مورد"
          icon={<AlertCircle className="w-4 h-4 text-rose-500" />}
          onClick={() => setStatusFilter('need_info')}
        />
        <ModernMetricCard
          title="پرونده‌های خاتمه‌یافته"
          value={completedCount}
          periodLabel="مختومه‌شده نهایی"
          unit="مورد"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          onClick={() => setStatusFilter('completed')}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            کارتابل خدمات اداری و آموزشی
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>ثبت و پیگیری مستقیم مطالبات شغلی، احکام و استعلامات آموزشی</span>
            <span aria-hidden="true">·</span>
            <span>گفت‌وگوی رفت‌وبرگشت تا خاتمه رسمی</span>
          </div>
        </div>

        <button
          onClick={() => setNewRequestModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت درخواست جدید</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Requests List Column (5 cols) */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden flex flex-col transition-colors">
          
          {/* Filters & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در عنوان، کد رهگیری، متقاضی..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Interactive Filter Controls (clean segmented control) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs overflow-x-auto">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setCategoryFilter('career')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  categoryFilter === 'career'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                شغلی
              </button>
              <button
                onClick={() => setCategoryFilter('administrative')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  categoryFilter === 'administrative'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                اداری
              </button>
              <button
                onClick={() => setCategoryFilter('educational')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  categoryFilter === 'educational'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                آموزشی
              </button>
            </div>
          </div>

          {/* List items (Zero-Pill formatting) */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
            {visibleRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>درخواستی با مشخصات انتخاب‌شده یافت نشد.</p>
              </div>
            ) : (
              visibleRequests.map(req => {
                const isSelected = selectedRequest?.id === req.id;
                const statusMeta = getStatusText(req.status);
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    className={`w-full p-4 text-right transition-colors flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-slate-100/70 dark:bg-slate-800/80'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Unboxed Metadata Header (Zero-Pill) */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500">{req.trackingNumber}</span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span>{req.categoryTitle.split(' ')[1] || req.categoryTitle}</span>
                      </div>
                      <span className={`font-semibold ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {req.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                      <span>{req.applicantName}</span>
                      <span className="font-mono tabular-nums">{req.updatedAt}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation & Action Column (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-slate-200/90 dark:border-white/10 overflow-hidden flex flex-col transition-colors">
          {selectedRequest ? (
            <>
              {/* Header (Single-Elevation, No Cards Inside Cards) */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {/* Unboxed metadata kicker */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRequest.categoryTitle}</span>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="font-mono tabular-nums">رهگیری: {selectedRequest.trackingNumber}</span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedRequest.title}
                    </h2>
                  </div>

                  <span className={`text-xs font-bold ${getStatusText(selectedRequest.status).color}`}>
                    {getStatusText(selectedRequest.status).label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>متقاضی: <strong className="text-slate-700 dark:text-slate-200">{selectedRequest.applicantName}</strong></span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span>سمت: {selectedRequest.applicantRoleTitle}</span>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="font-mono tabular-nums">ثبت: {selectedRequest.createdAt}</span>
                </div>

                {/* Supervisor Status Controls */}
                {isOfficial && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">اقدام مسئول:</span>
                    <button
                      onClick={() => updateCartableStatus(selectedRequest.id, 'in_progress')}
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        selectedRequest.status === 'in_progress'
                          ? 'bg-slate-900 text-white dark:bg-slate-700 border-transparent font-semibold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      در دست اقدام
                    </button>
                    <button
                      onClick={() => updateCartableStatus(selectedRequest.id, 'need_info')}
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        selectedRequest.status === 'need_info'
                          ? 'bg-slate-900 text-white dark:bg-slate-700 border-transparent font-semibold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      نیاز به تکمیل مدارک
                    </button>
                    <button
                      onClick={() => updateCartableStatus(selectedRequest.id, 'completed')}
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        selectedRequest.status === 'completed'
                          ? 'bg-slate-900 text-white dark:bg-slate-700 border-transparent font-semibold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      خاتمه قطعی گفت‌وگو
                    </button>
                  </div>
                )}
              </div>

              {/* Message Timeline */}
              <div className="p-5 flex-1 min-h-[300px] max-h-[440px] overflow-y-auto space-y-4">
                {selectedRequest.messages.map(msg => {
                  const isFromMe = msg.senderId === currentUser?.id;
                  const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'supervisor';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isFromMe ? 'items-start' : 'items-end'}`}
                    >
                      {/* Unboxed Metadata for message */}
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{msg.senderName}</span>
                        {isStaff && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500">پاسخ رسمی مسئول</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isFromMe
                            ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100'
                            : 'bg-slate-50 text-slate-800 dark:bg-slate-800/50 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {selectedRequest.status === 'completed' && (
                  <div className="p-3 text-center text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <CheckCheck className="w-4 h-4" />
                    <span>این پرونده به صورت رسمی خاتمه یافته و در سوابق الکترونیک بایگانی شده است.</span>
                  </div>
                )}
              </div>

              {/* Reply Box */}
              {selectedRequest.status !== 'completed' ? (
                <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="متن پاسخ یا توضیحات تکمیلی خود را بنویسید..."
                      className="flex-1 p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 active:scale-[0.98]"
                    >
                      <span>ارسال</span>
                      <Send className="w-4 h-4 text-amber-400 rotate-180" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
                  ارسال پیام برای پرونده‌های خاتمه‌یافته غیرفعال است.
                </div>
              )}
            </>
          ) : (
            <div className="p-16 text-center text-xs text-slate-400">
              یک درخواست را از لیست سمت راست انتخاب فرمایید.
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {newRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">ثبت درخواست جدید در کارتابل</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ارجاع مستقیم به معاونت مربوطه جهت رسیدگی و صدور احکام
                </p>
              </div>
              <button
                onClick={() => setNewRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نوع خدمت درخواستی:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategory('career')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                      newCategory === 'career'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>خدمات شغلی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategory('administrative')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                      newCategory === 'administrative'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>خدمات اداری</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategory('educational')}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                      newCategory === 'educational'
                        ? 'border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>خدمات آموزشی</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان درخواست:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: درخواست بررسی ارتقای رتبه قضایی به پایه ۹"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  اولویت رسیدگی:
                </label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as RequestPriority)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="normal">عادی (رسیدگی ظرف ۳ الی ۵ روز کاری)</option>
                  <option value="urgent">فوری (رسیدگی ظرف ۴۸ ساعت)</option>
                  <option value="instant">بسیار فوری (رسیدگی ظرف ۲۴ ساعت)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  متن تفصیلی درخواست:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="مشروح درخواست، سوابق قبلی، استنادات و مدارک لازم را مرقوم فرمایید..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewRequestModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold active:scale-[0.98]"
                >
                  ثبت قطعی در کارتابل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

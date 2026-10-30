import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SynergyPost } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import {
  Users2,
  Heart,
  Shield,
  MessageCircle,
  Plus,
  MapPin,
  Lock,
  Phone,
  Search,
  CheckCircle,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const SynergyWallSection: React.FC = () => {
  const { currentUser, synergyPosts, createSynergyPost, respondToSynergyPost } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'synergy' | 'empathy'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SynergyPost | null>(null);

  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCategory, setNewCategory] = useState<'administrative_help' | 'legal_consultation' | 'empathy_need'>('administrative_help');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [urgency, setUrgency] = useState<'عادی' | 'فوری'>('عادی');

  // Response Form State
  const [replyMessage, setReplyMessage] = useState('');
  const [isPrivateReply, setIsPrivateReply] = useState(false);
  const [contactShared, setContactShared] = useState('');

  // Metrics
  const totalPosts = synergyPosts.length;
  const synergyCount = synergyPosts.filter(p => !p.isEmpathy).length;
  const empathyCount = synergyPosts.filter(p => p.isEmpathy).length;
  const totalResponses = synergyPosts.reduce((acc, p) => acc + (p.responses?.length || 0), 0);

  const filteredPosts = synergyPosts.filter(p => {
    if (activeTab === 'synergy' && p.isEmpathy) return false;
    if (activeTab === 'empathy' && !p.isEmpathy) return false;
    if (selectedProvince !== 'all' && p.provinceOrCity !== selectedProvince) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchContent = p.content.toLowerCase().includes(q);
      const matchCity = p.provinceOrCity.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchCity) return false;
    }
    return true;
  });

  const provinces = ['all', ...Array.from(new Set(synergyPosts.map(p => p.provinceOrCity)))];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const randCode = Math.floor(100 + Math.random() * 899);
    const pseudonym = isAnonymous ? `همکار قضایی (کد پیگیری: ${randCode})` : currentUser.fullName;

    let catTitle = 'همکاری و استعلام اداری-قضایی';
    if (newCategory === 'legal_consultation') catTitle = 'مشورت حقوقی-فقهی در رویه قضایی';
    if (newCategory === 'empathy_need' || activeTab === 'empathy') catTitle = 'دیوار همدلی و مساعدت';

    createSynergyPost({
      authorId: currentUser.id,
      authorPseudonym: pseudonym,
      isAnonymous,
      title: newTitle,
      content: newContent,
      provinceOrCity: newCity || 'سراسری',
      category: activeTab === 'empathy' ? 'empathy_need' : newCategory,
      categoryTitle: catTitle,
      isEmpathy: activeTab === 'empathy' || newCategory === 'empathy_need',
      urgency,
      status: 'open',
    });

    setNewTitle('');
    setNewContent('');
    setNewCity('');
    setNewPostModalOpen(false);
  };

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyMessage.trim()) return;

    respondToSynergyPost(selectedPost.id, replyMessage.trim(), isPrivateReply, contactShared || undefined);
    setReplyMessage('');
    setContactShared('');
    setIsPrivateReply(false);
    setSelectedPost(null);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Users2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              دیوار هم‌افزایی شغلی و همدلی دانش‌آموختگان
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            شبکه ارتباطی مستقیم میان قضات و دانش‌آموختگان سراسر کشور جهت تبادل تجارب اداری، استعلام‌های رویه‌ای و پویش‌های همدلی با رعایت اصل صیانت از هویت و ناشناس‌ماندن اطلاعات فردی.
          </p>
        </div>

        <button
          onClick={() => setNewPostModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت درخواست یا فراخوان جدید</span>
        </button>
      </div>

      {/* 4 Standard Metric Cards (UX Blueprint Section 9) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ModernMetricCard
          title="کل درخواست‌ها"
          value={totalPosts}
          unit="مورد"
          periodLabel="سامانه فعال"
          icon={<Users2 className="w-4 h-4" />}
        />
        <ModernMetricCard
          title="هم‌افزایی اداری-قضایی"
          value={synergyCount}
          unit="پرونده/رویه"
          periodLabel="پیگیری همکاران"
          icon={<Lock className="w-4 h-4" />}
        />
        <ModernMetricCard
          title="فراخوان‌های همدلی"
          value={empathyCount}
          unit="پویش"
          periodLabel="مساعدت داوطلبانه"
          icon={<Heart className="w-4 h-4" />}
        />
        <ModernMetricCard
          title="پاسخ‌های ثبت‌شده"
          value={totalResponses}
          unit="مشارکت"
          periodLabel="نرخ پاسخ‌دهی بالا"
          icon={<MessageCircle className="w-4 h-4" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 transition-colors">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            همه موارد ({totalPosts})
          </button>
          <button
            onClick={() => setActiveTab('synergy')}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-colors ${
              activeTab === 'synergy'
                ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            هم‌افزایی شغلی ({synergyCount})
          </button>
          <button
            onClick={() => setActiveTab('empathy')}
            className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-colors ${
              activeTab === 'empathy'
                ? 'bg-rose-700 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            دیوار همدلی ({empathyCount})
          </button>
        </div>

        {/* Search & Location Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="جستجو در عنوان یا متن..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <select
            value={selectedProvince}
            onChange={e => setSelectedProvince(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">همه استان‌ها</option>
            {provinces.filter(p => p !== 'all').map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800">
            <Users2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400">موردی با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <article
              key={post.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 transition-colors flex flex-col justify-between space-y-4 text-right"
            >
              <div className="space-y-3">
                {/* Zero-Pill Unboxed Metadata Line */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {post.categoryTitle}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{post.provinceOrCity}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400">
                      {post.createdAt}
                    </span>
                  </div>

                  {post.urgency === 'فوری' && (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      فوری
                    </span>
                  )}
                </div>

                {/* Post Title */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {post.title}
                </h3>

                {/* Content Body */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Author Identity & Anonymity Status */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {post.authorPseudonym}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {post.isAnonymous ? '(شناسه ناشناس امن)' : '(هویت علنی)'}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-[11px] text-slate-400">
                    وضعیت: {post.status === 'open' ? 'در جریان' : 'پاسخ‌گرفته'}
                  </span>
                </div>
              </div>

              {/* Thread Responses */}
              <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>پاسخ‌ها و اعلام آمادگی‌ها</span>
                  <span className="font-mono tabular-nums text-slate-400">({post.responses?.length || 0})</span>
                </div>

                {post.responses && post.responses.length > 0 ? (
                  <div className="space-y-2">
                    {post.responses.map(resp => (
                      <div
                        key={resp.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {resp.responderPseudonym}
                          </span>
                          <span className="font-mono tabular-nums">{resp.timestamp}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {resp.message}
                        </p>
                        {resp.contactShared && (
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            <span>ارتباط مستقیم / داخلی: {resp.contactShared}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic py-1">
                    هنوز پاسخی برای این مورد ثبت نشده است. اولین نفری باشید که مشارکت می‌کند.
                  </p>
                )}

                {/* Reply Action */}
                <button
                  onClick={() => setSelectedPost(post)}
                  className="w-full mt-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{post.isEmpathy ? 'اعلام آمادگی و مشارکت در همدلی' : 'ارسال راهکار یا پاسخ امن'}</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Response Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 dark:bg-slate-800 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedPost.isEmpathy ? 'اعلام مساعدت در فراخوان همدلی' : 'ارسال پاسخ و راهکار به همکار'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 truncate max-w-sm">
                  موضوع: {selectedPost.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendResponse} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">خلاصه درخواست:</span>
                <p className="line-clamp-3">{selectedPost.content}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  متن پیام یا راهکار شما:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="نکات رویه‌ای، تجربیات اداری یا اعلام نحوه مشارکت خود را بنویسید..."
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شماره تماس مستقیم یا داخلی شعبه (اختیاری جهت پیگیری تلفنی):
                </label>
                <input
                  type="text"
                  placeholder="مثال: ۰۹۱۲... یا داخلی ۲۱۰ دادگاه تجدیدنظر"
                  value={contactShared}
                  onChange={e => setContactShared(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
                  dir="ltr"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivateReply}
                  onChange={e => setIsPrivateReply(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span>ارسال محرمانه (صرفاً برای ثبت‌کننده درخواست نمایش داده شود)</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  ثبت و ارسال پاسخ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {newPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 dark:bg-slate-800 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeTab === 'empathy' ? 'ثبت فراخوان در دیوار همدلی' : 'ثبت درخواست جدید در دیوار هم‌افزایی'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  ارتباط مستقیم میان اعضا با حفظ محرمانگی کامل اطلاعات
                </p>
              </div>
              <button
                onClick={() => setNewPostModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">عنوان درخواست:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: استعلام رویه شعب اجرای احکام در حوزه اسناد معارض"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">شهر / استان:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اصفهان، شیراز، تهران"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">درجه فوریت:</label>
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="عادی">عادی</option>
                    <option value="فوری">فوری (پاسخ ظرف ۲۴ ساعت)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">متن مشروح درخواست یا فراخوان:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="شرح مسئله، سابقه رویه یا نیاز به مساعدت را با دقت وارد فرمایید..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              {/* Anonymity Protection Checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    className="rounded text-slate-900 focus:ring-0"
                  />
                  <span>انتشار با شناسه مستعار (حفظ کامل محرمانگی نام و موقعیت شغلی)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mr-5 leading-relaxed">
                  نام حقیقی و شعبه قضایی شما برای سایر اعضا مخفی مانده و صرفاً شناسه تصادفی ثبت می‌گردد.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewPostModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                >
                  انتشار در دیوار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

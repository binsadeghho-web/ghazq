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
  Search,
  CheckCircle2,
  Send,
  MessageSquare,
  Sparkles,
  BookOpen,
  Filter,
  ThumbsUp,
  X,
  UserCheck,
  ShieldCheck,
  Lock as LockIcon,
  HelpCircle
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';

interface ExperienceItem {
  id: string;
  authorId: string;
  authorTitle: string; // e.g. "مستشار دادگاه تجدیدنظر"
  category: 'رویه قضایی' | 'چالش‌های شعبه' | 'پژوهش فقهی' | 'تعاملات اداری';
  title: string;
  summary: string;
  lessonsLearned: string[];
  likesCount: number;
  likedBy: string[];
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderTitle: string;
  text: string;
  timestamp: string;
  isMine: boolean;
}

export const SynergyWallSection: React.FC = () => {
  const { currentUser, synergyPosts, createSynergyPost, respondToSynergyPost } = useApp();

  // Main Section Tab: 'experiences' vs 'synergy'
  const [mainTab, setMainTab] = useState<'experiences' | 'synergy'>('synergy');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [experienceCategory, setExperienceCategory] = useState<string>('all');

  // Modals
  const [newSynergyModalOpen, setNewSynergyModalOpen] = useState(false);
  const [newExperienceModalOpen, setNewExperienceModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SynergyPost | null>(null);

  // Private Chat Drawer State
  const [privateChatOpen, setPrivateChatOpen] = useState(false);
  const [chatPartnerTitle, setChatPartnerTitle] = useState('');
  const [chatTopic, setChatTopic] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Initial Mock Experiences List
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      id: 'exp-1',
      authorId: 'usr-101',
      authorTitle: 'مستشار دادگاه تجدیدنظر - کد عضویتی ۱۰۴',
      category: 'رویه قضایی',
      title: 'رویه قضایی در نحوه استماع گواهی شهود در دعاوی ملکی پیچیده',
      summary: 'در رسیدگی به پرونده‌های تصرف عدوانی و خلع ید با شهادت شهود، عدم تطبیق دقیق زمان تصرف با مفاد استشهادیه موجب صدور آرای متعارض می‌شد. با استعلام دقیق زمان تصرف و ثبت تعارضات در صورتجلسه، نرخ تجدیدنظرخواهی مجدد تا ۴۰٪ کاهش یافت.',
      lessonsLearned: [
        'تفکیک منشأ تصرف از زمانی که شهدای ثبات گواهی می‌دهند',
        'استفاده از معاینه محلی همزمان با استماع گواهی شهود',
        'تنظیم صورتجلسه تفکیکی برای هر شاهد'
      ],
      likesCount: 28,
      likedBy: [],
      createdAt: '۱۴۰۳/۰۸/۱۰'
    },
    {
      id: 'exp-2',
      authorId: 'usr-102',
      authorTitle: 'قاضی شعبه ۵ دادگاه کیفری - کد عضویتی ۲۱۸',
      category: 'چالش‌های شعبه',
      title: 'تجارب عملی در نوبت‌دهی الکترونیک و کاهش اطاله دادرسی در شعب شلوغ',
      summary: 'با تفکیک ساعات حضور طرفین به بازه‌های ۱۵ دقیقه‌ای و ارسال پیامک یادآوری هوشمند، از تجمع متداعیین در راهروهای شعبه جلوگیری شد و میانگین زمان رسیدگی به هر پرونده از ۴۵ روز به ۲2 روز تقلیل یافت.',
      lessonsLearned: [
        'زمان‌بندی دقیق پرونده‌های نیازمند کارشناسی از پرونده‌های اداری',
        'اطلاع‌رسانی پیامکی به وکلا جهت حضور رأس ساعت مشخص'
      ],
      likesCount: 42,
      likedBy: [],
      createdAt: '۱۴۰۳/۰۸/۰۵'
    },
    {
      id: 'exp-3',
      authorId: 'usr-103',
      authorTitle: 'پژوهشگر فقه اقتصادی - کد عضویتی ۳۰۵',
      category: 'پژوهش فقهی',
      title: 'تحلیل فقهی حقوقی شرط تسعیف و وجه‌التزام در عقود بانکی نوظهور',
      summary: 'بررسی تطبیقی آراء دیوان عالی کشور و نظریات مشورتی اداره حقوقی نشان می‌دهد که تمایز میان جریمه تأخیر تادیه و خسارت عدم انجام تعهد در قراردادهای تسهیلات، نیازمند معیار فقهی واحد در تشخیص قصد طرفین است.',
      lessonsLearned: [
        'احراز عدم صوری بودن قصد متعاقدین در عقود مرابحه',
        'تطبیق شرط وجه‌التزام با اصل عدم ضرر و لزوم وفاء به عهد'
      ],
      likesCount: 35,
      likedBy: [],
      createdAt: '۱۴۰۳/۰۷/۲۸'
    }
  ]);

  // Form States
  const [newSynergyTitle, setNewSynergyTitle] = useState('');
  const [newSynergyContent, setNewSynergyContent] = useState('');
  const [newSynergyCity, setNewSynergyCity] = useState('');
  const [urgency, setUrgency] = useState<'عادی' | 'فوری'>('عادی');

  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCategory, setNewExpCategory] = useState<'رویه قضایی' | 'چالش‌های شعبه' | 'پژوهش فقهی' | 'تعاملات اداری'>('رویه قضایی');
  const [newExpSummary, setNewExpSummary] = useState('');
  const [newExpLessons, setNewExpLessons] = useState('');

  const [replyMessage, setReplyMessage] = useState('');

  // Filtering Synergy Posts
  const filteredSynergyPosts = synergyPosts.filter(p => {
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

  // Filtering Experiences
  const filteredExperiences = experiences.filter(e => {
    if (experienceCategory !== 'all' && e.category !== experienceCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchSummary = e.summary.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }
    return true;
  });

  const provinces = ['all', ...Array.from(new Set(synergyPosts.map(p => p.provinceOrCity)))];

  // Actions
  const handleCreateSynergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newSynergyTitle.trim() || !newSynergyContent.trim()) return;

    const randCode = Math.floor(100 + Math.random() * 899);
    const pseudonym = `${currentUser.roleTitle || 'عضو نخبه'} - کد عضویتی ${randCode}`;

    createSynergyPost({
      authorId: currentUser.id,
      authorPseudonym: pseudonym,
      isAnonymous: true,
      title: newSynergyTitle.trim(),
      content: newSynergyContent.trim(),
      provinceOrCity: newSynergyCity || 'سراسری',
      category: 'administrative_help',
      categoryTitle: 'هم‌افزایی اداری و استعلام شغلی',
      isEmpathy: false,
      urgency,
      status: 'open',
    });

    setNewSynergyTitle('');
    setNewSynergyContent('');
    setNewSynergyCity('');
    setNewSynergyModalOpen(false);
  };

  const handleCreateExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newExpTitle.trim() || !newExpSummary.trim()) return;

    const randCode = Math.floor(100 + Math.random() * 899);
    const pseudonym = `${currentUser.roleTitle || 'پژوهشگر فقه و قضا'} - کد عضویتی ${randCode}`;

    const lessonsList = newExpLessons
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      authorId: currentUser.id,
      authorTitle: pseudonym,
      category: newExpCategory,
      title: newExpTitle.trim(),
      summary: newExpSummary.trim(),
      lessonsLearned: lessonsList.length > 0 ? lessonsList : ['تطبیق رویه با موازین قانونی و صیانت از حقوق متداعیین'],
      likesCount: 1,
      likedBy: [currentUser.id],
      createdAt: 'امروز'
    };

    setExperiences(prev => [newExp, ...prev]);
    setNewExpTitle('');
    setNewExpSummary('');
    setNewExpLessons('');
    setNewExperienceModalOpen(false);
  };

  const handlePublicReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyMessage.trim()) return;

    respondToSynergyPost(selectedPost.id, replyMessage.trim(), false);
    setReplyMessage('');
    setSelectedPost(null);
  };

  const handleOpenPrivateChat = (partnerTitle: string, topic: string) => {
    setChatPartnerTitle(partnerTitle);
    setChatTopic(topic);
    setChatMessages([
      {
        id: 'msg-1',
        senderId: 'partner',
        senderTitle: partnerTitle,
        text: `سلام و احترام همکار گرامی. در خصوص درخواست «${topic}» آماده همکاری و تبادل تجارب هستم.`,
        timestamp: '۱۰:۱۵',
        isMine: false
      }
    ]);
    setPrivateChatOpen(true);
    setSelectedPost(null);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const myMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser?.id || 'me',
      senderTitle: currentUser?.roleTitle || 'عضو سامانه',
      text: newChatMessage.trim(),
      timestamp: 'هم‌اکنون',
      isMine: true
    };

    setChatMessages(prev => [...prev, myMsg]);
    setNewChatMessage('');

    // Simulate partner auto-reply
    setTimeout(() => {
      const autoReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        senderId: 'partner',
        senderTitle: chatPartnerTitle,
        text: 'پیام شما دریافت شد. جزئیات استعلام اداری/قضایی را بررسی و نتیجه را ارسال می‌کنم.',
        timestamp: 'هم‌اکنون',
        isMine: false
      };
      setChatMessages(prev => [...prev, autoReply]);
    }, 1200);
  };

  const handleLikeExperience = (id: string) => {
    setExperiences(prev =>
      prev.map(item => {
        if (item.id === id) {
          const isLiked = item.likedBy.includes(currentUser?.id || 'me');
          return {
            ...item,
            likesCount: isLiked ? item.likesCount - 1 : item.likesCount + 1,
            likedBy: isLiked
              ? item.likedBy.filter(uId => uId !== (currentUser?.id || 'me'))
              : [...item.likedBy, currentUser?.id || 'me']
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6 text-stone-900 font-sans" dir="rtl">
      {/* Editorial Header */}
      <div className="bg-[#FCFCFA] rounded-[32px] p-6 border border-stone-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200">
              <Users2 className="w-5 h-5 text-amber-700" />
            </span>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              درگاه تخصصی تجارب علمی و شبکه هم‌افزایی اعضا
            </h1>
          </div>
          <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
            محیطی امن، حرفه‌ای و محرمانه جهت اشتراک‌گذاری تجربیات قضایی-اداری و ثبت درخواست‌های شبکه هم‌افزایی. اطلاعات هویتی و شماره همراه اعضا کاملاً محفوظ باقی می‌ماند.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setNewExperienceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>+ ثبت تجربه کاربردی جدید</span>
          </button>

          <button
            onClick={() => setNewSynergyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ ثبت درخواست هم‌افزایی</span>
          </button>
        </div>
      </div>

      {/* Main Split Navigation Tabs (تجارب / هم‌افزایی) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#FCFCFA] rounded-2xl border border-stone-200/90 shadow-2xs">
        <button
          onClick={() => setMainTab('synergy')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'synergy'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>بخش هم‌افزایی و درخواست‌های شبکه اعضا ({toPersianNumbers(synergyPosts.length)})</span>
        </button>

        <button
          onClick={() => setMainTab('experiences')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'experiences'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>بخش تجارب علمی، قضایی و اداری ({toPersianNumbers(experiences.length)})</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ModernMetricCard
          title="تجارب ثبت‌شده"
          value={experiences.length}
          unit="مورد"
          periodLabel="بانک دانش"
          icon={<BookOpen className="w-4 h-4 text-emerald-700" />}
        />
        <ModernMetricCard
          title="درخواست‌های هم‌افزایی"
          value={synergyPosts.length}
          unit="استعلام"
          periodLabel="شبکه همکاری"
          icon={<Users2 className="w-4 h-4 text-amber-700" />}
        />
        <ModernMetricCard
          title="مشارکت‌ها و پاسخ‌ها"
          value={synergyPosts.reduce((acc, p) => acc + (p.responses?.length || 0), 0)}
          unit="پاسخ"
          periodLabel="نرخ همراهی بالا"
          icon={<MessageCircle className="w-4 h-4 text-teal-700" />}
        />
        <ModernMetricCard
          title="سطح محرمانگی هویت"
          value="۱۰۰٪"
          unit="امن"
          periodLabel="حفظ حریم خصوصی"
          icon={<ShieldCheck className="w-4 h-4 text-purple-700" />}
        />
      </div>

      {/* SECTION CONTENT 1: SYNERGY BOARD */}
      {mainTab === 'synergy' && (
        <div className="space-y-5">
          {/* Search & Location Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="جستجو در درخواست‌های هم‌افزایی، سازمان‌ها یا استان‌ها..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-emerald-600 font-medium"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            </div>

            <select
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 font-bold focus:outline-emerald-600 shrink-0"
            >
              <option value="all">همه استان‌ها و حوزه‌ها</option>
              {provinces.filter(p => p !== 'all').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Synergy Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSynergyPosts.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-500 text-xs">
                درخواستی با این مشخصات یافت نشد.
              </div>
            ) : (
              filteredSynergyPosts.map(post => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Line */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-[10px]">
                        {post.categoryTitle || 'هم‌افزایی اداری-شغلی'}
                      </span>

                      <div className="flex items-center gap-2 text-stone-500 font-medium text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{post.provinceOrCity}</span>
                        </span>
                        <span>·</span>
                        <span className="font-mono">{post.createdAt}</span>
                      </div>
                    </div>

                    <h3 className="font-black text-sm text-stone-900 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-stone-700 leading-relaxed bg-[#FCFCFA] p-3.5 rounded-2xl border border-stone-200/80">
                      {post.content}
                    </p>

                    {/* Anonymity Notice */}
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>{post.authorPseudonym}</span>
                      </div>
                      <span className="text-stone-400 font-medium">اطلاعات تماس محفوظ است</span>
                    </div>
                  </div>

                  {/* Public Responses & Action Buttons */}
                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    {post.responses && post.responses.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-extrabold text-stone-800 block">
                          پاسخ‌های ثبت‌شده ({toPersianNumbers(post.responses.length)}):
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {post.responses.map(resp => (
                            <div key={resp.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                              <div className="flex items-center justify-between font-bold text-stone-900 text-[11px]">
                                <span>{resp.responderPseudonym}</span>
                                <span className="text-[10px] text-stone-400 font-normal">{resp.timestamp}</span>
                              </div>
                              <p className="text-stone-700 leading-relaxed">{resp.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedPost(post)}
                        className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-stone-700" />
                        <span>ارسال پاسخ عمومی</span>
                      </button>

                      <button
                        onClick={() => handleOpenPrivateChat(post.authorPseudonym, post.title)}
                        className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <LockIcon className="w-3.5 h-3.5 text-amber-300" />
                        <span>درخواست مکالمه خصوصی</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION CONTENT 2: EXPERIENCES FEED */}
      {mainTab === 'experiences' && (
        <div className="space-y-5">
          {/* Experience Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="جستجو در تجارب قضایی، رویه‌ها و راهکارها..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:outline-emerald-600 font-medium"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            </div>

            <select
              value={experienceCategory}
              onChange={e => setExperienceCategory(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 font-bold focus:outline-emerald-600 shrink-0"
            >
              <option value="all">همه دسته‌بندی تجارب</option>
              <option value="رویه قضایی">رویه قضایی</option>
              <option value="چالش‌های شعبه">چالش‌های شعبه</option>
              <option value="پژوهش فقهی">پژوهش فقهی</option>
              <option value="تعاملات اداری">تعاملات اداری</option>
            </select>
          </div>

          {/* Experience Feed Cards */}
          <div className="space-y-4">
            {filteredExperiences.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-500 text-xs">
                تجربه‌ای در این دسته‌بندی یافت نشد.
              </div>
            ) : (
              filteredExperiences.map(exp => (
                <div key={exp.id} className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black">
                        {exp.category}
                      </span>
                      <span className="text-xs font-extrabold text-stone-800">
                        {exp.authorTitle}
                      </span>
                    </div>

                    <span className="text-xs text-stone-400 font-mono">{exp.createdAt}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-stone-900">{exp.title}</h3>
                    <p className="text-xs text-stone-700 leading-relaxed mt-2 bg-[#FCFCFA] p-4 rounded-2xl border border-stone-200/80">
                      {exp.summary}
                    </p>
                  </div>

                  {exp.lessonsLearned && exp.lessonsLearned.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>جمع‌بندی و آموزه‌های کلیدی این تجربه:</span>
                      </span>
                      <ul className="space-y-1 pr-2">
                        {exp.lessonsLearned.map((lesson, idx) => (
                          <li key={idx} className="text-xs text-stone-800 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span>{lesson}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => handleLikeExperience(exp.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        exp.likedBy.includes(currentUser?.id || 'me')
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>تأیید و استفاده کردم ({toPersianNumbers(exp.likesCount)})</span>
                    </button>

                    <button
                      onClick={() => handleOpenPrivateChat(exp.authorTitle, exp.title)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all cursor-pointer border border-stone-200"
                    >
                      <LockIcon className="w-3.5 h-3.5 text-emerald-700" />
                      <span>گفتگوی محرمانه با ارائه‌دهنده</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRIVATE 1-ON-1 DIRECT CHAT DRAWER */}
      {privateChatOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-[32px] w-full max-w-xl border border-stone-200 shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden">
            {/* Chat Drawer Header */}
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <LockIcon className="w-4 h-4 text-amber-300" />
                  <h4 className="font-extrabold text-sm text-white">{chatPartnerTitle}</h4>
                </div>
                <p className="text-[11px] text-emerald-200/90 mt-0.5 truncate max-w-sm">
                  موضوع گفتگو: {chatTopic}
                </p>
              </div>

              <button
                onClick={() => setPrivateChatOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Confidentiality Banner */}
            <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>فضای گفتگو کاملاً اختصاصی است · نام واقعی و تلفن طرفین برای یکدیگر مخفی می‌باشد</span>
            </div>

            {/* Chat Messages Feed */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-[#FCFCFA]">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[82%] ${
                    msg.isMine ? 'mr-auto items-end' : 'ml-auto items-start'
                  }`}
                >
                  <span className="text-[10px] text-stone-400 font-bold mb-1 px-1">
                    {msg.senderTitle} · {msg.timestamp}
                  </span>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.isMine
                        ? 'bg-emerald-800 text-white rounded-tl-none shadow-xs'
                        : 'bg-white text-stone-900 rounded-tr-none border border-stone-200 shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="پیام خود را بنویسید..."
                value={newChatMessage}
                onChange={e => setNewChatMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-stone-100 border border-stone-200 text-stone-900 focus:outline-emerald-600 font-medium"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>ارسال</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC REPLY MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h4 className="font-black text-sm text-stone-900">ارسال پاسخ و راهکار به درخواست هم‌افزایی</h4>
              <button onClick={() => setSelectedPost(null)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl text-xs space-y-1 border border-stone-200">
              <span className="font-bold text-stone-800 block">عنوان درخواست:</span>
              <p className="font-bold text-emerald-900">{selectedPost.title}</p>
              <p className="text-stone-600 mt-1 line-clamp-2">{selectedPost.content}</p>
            </div>

            <form onSubmit={handlePublicReply} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">متن راهکار یا پاسخ شما:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="راهکار، سوابق یا اعلام آمادگی همکاری خود را بنویسید..."
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-300 font-medium focus:outline-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md"
                >
                  ثبت پاسخ عمومی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW SYNERGY REQUEST MODAL */}
      {newSynergyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h4 className="font-black text-sm text-stone-900">ثبت درخواست جدید در شبکه هم‌افزایی</h4>
              <button onClick={() => setNewSynergyModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSynergy} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">عنوان درخواست یا سوال:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: استعلام از همکاران شاغل در آموزش و پرورش جهت حل چالش پرونده معلمین"
                  value={newSynergyTitle}
                  onChange={e => setNewSynergyTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">شهر / استان:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اصفهان، تهران، مشهد"
                    value={newSynergyCity}
                    onChange={e => setNewSynergyCity(e.target.value)}
                    className="w-full p-2 rounded-xl bg-stone-50 border border-stone-300 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">درجه فوریت:</label>
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-stone-50 border border-stone-300 font-bold"
                  >
                    <option value="عادی">عادی</option>
                    <option value="فوری">فوری (پاسخ ظرف ۲۴ ساعت)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">شرح مشروح مسئله یا درخواست استعلام:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="جزئیات مسئله، سازمان مربوطه و نوع همکاری مورد نیاز را بنویسید..."
                  value={newSynergyContent}
                  onChange={e => setNewSynergyContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-medium leading-relaxed focus:outline-emerald-600"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>هویت و مشخصات شما در سیستم با شناسه مستعار امن ثبت می‌گردد.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setNewSynergyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md"
                >
                  انتشار درخواست
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW EXPERIENCE MODAL */}
      {newExperienceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h4 className="font-black text-sm text-stone-900">ثبت تجربه علمی، قضایی یا اداری جدید</h4>
              <button onClick={() => setNewExperienceModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExperience} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">عنوان تجربه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: راهکارهای تسریع در رسیدگی به پرونده‌های دعاوی ملکی"
                  value={newExpTitle}
                  onChange={e => setNewExpTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-bold focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">دسته‌بندی تجربه:</label>
                <select
                  value={newExpCategory}
                  onChange={e => setNewExpCategory(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-stone-50 border border-stone-300 font-bold"
                >
                  <option value="رویه قضایی">رویه قضایی</option>
                  <option value="چالش‌های شعبه">چالش‌های شعبه</option>
                  <option value="پژوهش فقهی">پژوهش فقهی</option>
                  <option value="تعاملات اداری">تعاملات اداری</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">شرح تجربه و مسئله بررسی شده:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="شرح تجربه، چالش و اقدام انجام‌شده را ثبت نمایید..."
                  value={newExpSummary}
                  onChange={e => setNewExpSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-medium leading-relaxed focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">آموزه‌های کلیدی و جمع‌بندی (هر خط یک مورد):</label>
                <textarea
                  rows={2}
                  placeholder="آموزش ۱&#10;آموزش ۲"
                  value={newExpLessons}
                  onChange={e => setNewExpLessons(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setNewExperienceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black shadow-md"
                >
                  ثبت تجربه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

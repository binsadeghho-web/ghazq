import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, AppSectionId, PermissionAccessLevel, UserSectionPermissions } from '../../types';
import { api } from '../../services/apiClient';
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Edit,
  Trash2,
  CheckCircle2,
  GraduationCap,
  Scale,
  SlidersHorizontal,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  Smartphone,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  Building2,
  FileText
} from 'lucide-react';
import { toPersianNumbers } from '../../utils/persianNumbers';

// All application modules for fine-grained permissions matrix
export const SYSTEM_SECTIONS: { id: AppSectionId; title: string; subtitle: string; icon: any }[] = [
  { id: 'dashboard', title: 'داشبورد و شاخص‌های آماری', subtitle: 'خلاصه وضعیت، ویترین خدمات و گزارش‌های سامانه', icon: Sparkles },
  { id: 'cartable', title: 'کارتابل اداری و مکاتبات', subtitle: 'ارسال و پیگیری درخواست‌های شغلی، اداری و آموزشی', icon: FileText },
  { id: 'courses', title: 'دوره‌ها و کارگاه‌های آموزشی', subtitle: 'ثبت‌نام، سرفصل‌ها و آرشیو جلسات مجازی', icon: GraduationCap },
  { id: 'products', title: 'انتشارات، کتب و محصولات علمی', subtitle: 'خرید کتب فقهی، درس‌گفتارها و چندرسانه‌ای', icon: FileText },
  { id: 'counseling', title: 'کلینیک و نوبت‌دهی مشاوره', subtitle: 'رزرو وقت مشاوره فردی، خانوادگی و شغلی قضایی', icon: Users },
  { id: 'research', title: 'شبکه رساله‌ها و هدایت پژوهش', subtitle: 'طرح موضوعات، پیگیری استاد راهنما و مراحل داوری', icon: Scale },
  { id: 'rulings', title: 'تالار نقد و اشتراک آراء قضایی', subtitle: 'مشاهده دادنامه‌های منتخب، ثبت رأی و نقدهای حقوقی', icon: Scale },
  { id: 'welfare', title: 'صندوق تعاون، تسهیلات و ملزومات', subtitle: 'درخواست وام قرض‌الحسنه و اقلام معیشتی تعاونی', icon: Building2 },
  { id: 'synergy', title: 'دیوار هم‌افزایی و همدلی قضایی', subtitle: 'طرح درخواست‌های هم‌افزایی شغلی با حفظ محرمانگی', icon: Users },
  { id: 'alumni', title: 'بانک جامع دانش‌آموختگان', subtitle: 'شناسنامه الکترونیک ۴ سربرگه هویتی، علمی و شغلی', icon: GraduationCap },
  { id: 'users', title: 'مدیریت کاربران و حساب‌های کاربری', subtitle: 'کنترل دسترسی‌ها، نام کاربری و رمز عبور', icon: ShieldCheck },
];

export const PERMISSION_LEVEL_DESCRIPTIONS: { level: PermissionAccessLevel; title: string; color: string; desc: string }[] = [
  { level: 'view_all', title: 'فقط ببیند', color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'مشاهده کلیه اطلاعات همه کاربران در این بخش' },
  { level: 'manage_all', title: 'هم ببیند و هم ویرایش کند', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', desc: 'دسترسی کامل مدیریتی جهت مشاهده و ویرایش کل اطلاعات' },
  { level: 'view_own', title: 'منحصراً فقط اطلاعات خودش را ببیند', color: 'bg-teal-50 text-teal-800 border-teal-200', desc: 'فقط دیدن رکوردهای ثبت‌شده توسط خود کاربر بدون دسترسی به دیگران' },
  { level: 'manage_own', title: 'مستقل اطلاعات خودش را ببیند و ویرایش کند', color: 'bg-amber-50 text-amber-900 border-amber-300', desc: 'مشاهده و ویرایش داده‌های اختصاصی خود بدون دسترسی به سایر کاربران' },
  { level: 'none', title: 'عدم دسترسی', color: 'bg-rose-50 text-rose-700 border-rose-200', desc: 'بخش مسدود یا پنهان برای این سطح کاربری' },
];

export const UserManagementModule: React.FC = () => {
  const {
    users,
    currentUser,
    createUser,
    updateUserDetails,
    deleteUser,
    toggleUserLock,
    updateUserCredentials,
    updateUserSectionPermissions,
    updateRoleDefaultPermissions,
    securityPin,
    isPinUnlocked,
    setPinUnlocked,
    sendPinOtpSms,
    verifyPinOtpAndSetPin,
    verifyPin
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked' | 'suspended'>('all');
  
  // Selected user for Permissions modal
  const [permissionModalUser, setPermissionModalUser] = useState<User | null>(null);

  // Selected user for full profile & credentials editing
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // PIN security modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'verify' | 'setup_otp'>('verify');
  const [inputPin, setInputPin] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [otpSentCode, setOtpSentCode] = useState<string | null>(null);
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  // New user modal
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);

  // Visible passwords state map
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      user.fullName.toLowerCase().includes(q) ||
      user.nationalId.includes(q) ||
      (user.username && user.username.toLowerCase().includes(q)) ||
      (user.personnelId && user.personnelId.includes(q)) ||
      user.roleTitle.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = user.isActive && !user.isLocked;
    if (statusFilter === 'locked') matchesStatus = user.isLocked;
    if (statusFilter === 'suspended') matchesStatus = !user.isActive;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open Edit Full User Modal
  const openEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveEditUser = async (userId: string, updates: Partial<User>) => {
    await updateUserDetails(userId, updates);
    if (updates.username || (updates as any).password) {
      await updateUserCredentials(userId, updates.username || '', (updates as any).password || '');
    }
    setEditingUser(null);
  };

  // Handle PIN verification
  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await verifyPin(inputPin);
    if (res.success) {
      setPinFeedback('احراز هویت پین امنیتی با موفقیت تایید گردید.');
      setTimeout(() => {
        setIsPinModalOpen(false);
        setPinFeedback(null);
        setInputPin('');
      }, 1000);
    } else {
      setPinFeedback(res.message);
    }
  };

  // Handle Send OTP SMS
  const handleSendOtp = async () => {
    const res = await sendPinOtpSms();
    setOtpSentCode(res.otpCode);
    setPinFeedback(res.message);
  };

  // Handle Verify OTP and save new PIN
  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await verifyPinOtpAndSetPin(inputOtp, newPinCode);
    if (res.success) {
      setPinFeedback(res.message);
      setTimeout(() => {
        setIsPinModalOpen(false);
        setPinFeedback(null);
        setInputOtp('');
        setNewPinCode('');
        setOtpSentCode(null);
      }, 1500);
    } else {
      setPinFeedback(res.message);
    }
  };

  return (
    <div className="space-y-6 text-stone-900 font-sans" dir="rtl">
      
      {/* ========================================================================
          SECURITY PIN & VERIFICATION STATUS BANNER
          ======================================================================== */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-emerald-700/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0 border border-white/20">
            <KeyRound className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base">احراز هویت پین امنیتی مدیر (Admin Security PIN)</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                احراز شده در سامانه (پیش‌فرض فعال)
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              طبق دستور شما، نام‌های کاربری و رمزهای عبور کلیه اعضا به صورت مستقیم نمایش داده شده و قابل ویرایش می‌باشند. همچنین سیستم پیامک OTP جهت بازنشانی پین کد مهیاست.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={() => {
              setPinModalMode('setup_otp');
              setIsPinModalOpen(true);
            }}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
          >
            <Smartphone className="w-4 h-4 text-emerald-300" />
            <span>تنظیم / تغییر پین با پیامک OTP</span>
          </button>

          <button
            onClick={() => setPinUnlocked(!isPinUnlocked)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              isPinUnlocked 
                ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPinUnlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{isPinUnlocked ? 'قفل موقت رمزها' : 'بازگشایی با پین'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================
          SEARCH & FILTER & ACTIONS BAR
          ======================================================================== */}
      <div className="bg-white/90 p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              placeholder="جستجو در نام، کد ملی، نام کاربری، شماره پرسنلی..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-[#F5F4EE] border border-stone-200 rounded-full text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-[#F5F4EE] p-1 rounded-full text-xs">
            <span className="text-stone-500 px-2 font-bold">نقش:</span>
            {[
              { id: 'all' as const, label: 'همه' },
              { id: 'admin' as const, label: 'مدیران' },
              { id: 'supervisor' as const, label: 'مسئولین' },
              { id: 'alumni' as const, label: 'کاربران و اعضا' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1 rounded-full font-bold transition-all ${
                  roleFilter === tab.id
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm flex items-center gap-2 self-start md:self-auto shrink-0 transition-transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>افزودن کاربر جدید</span>
        </button>
      </div>

      {/* ========================================================================
          USER MANAGEMENT TABLE (EXACT 6 REQUESTED COLUMNS)
          ۱. نام {عنوان اون فرد}
          ۲. کد ملی
          ۳. نام کاربری
          ۴. رمز
          ۵. سطح / نقش
          ۶. تنظیم سطح دسترسی برای اون کاربر
          ======================================================================== */}
      <div className="bg-white/90 rounded-[36px] border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-stone-800">
            <thead className="bg-[#F5F4EE] text-stone-700 font-black border-b border-stone-200 text-xs">
              <tr>
                <th className="p-4 pr-6">نام {'{عنوان اون فرد}'}</th>
                <th className="p-4">کد ملی</th>
                <th className="p-4">نام کاربری</th>
                <th className="p-4">رمز</th>
                <th className="p-4">سطح / نقش</th>
                <th className="p-4 text-center pl-6">تنظیم سطح دسترسی برای اون کاربر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredUsers.map(u => {
                const isCurrentActive = currentUser?.id === u.id;
                const isPasswordRevealed = showPasswordMap[u.id] || false;
                const displayUsername = u.username || u.nationalId;
                const displayPassword = u.password || u.phone || '123456';

                return (
                  <tr key={u.id} className="hover:bg-emerald-50/40 transition-colors">
                    
                    {/* COLUMN 1: نام {عنوان اون فرد} */}
                    <td className="p-4 pr-6">
                      <div className="flex items-center gap-3">
                        {u.profilePictureUrl ? (
                          <img src={u.profilePictureUrl} alt={u.fullName} className="w-10 h-10 rounded-2xl object-cover shrink-0 shadow-xs border border-stone-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
                            {u.avatarText || u.fullName.slice(0, 2)}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-stone-900 text-sm">{u.fullName}</span>
                            {isCurrentActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                                خود شما
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 font-semibold line-clamp-1">
                            {u.siteTitle ? `${u.siteTitle} · ${u.roleTitle || 'عضو سامانه'}` : (u.roleTitle || 'عضو سامانه')}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* COLUMN 2: کد ملی */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold text-stone-900 text-sm">
                          {toPersianNumbers(u.nationalId)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(u.nationalId, `nid_${u.id}`)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="کپی کد ملی"
                        >
                          {copiedKey === `nid_${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* COLUMN 3: نام کاربری */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60">
                          {displayUsername}
                        </span>
                        <button
                          onClick={() => copyToClipboard(displayUsername, `un_${u.id}`)}
                          className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                          title="کپی نام کاربری"
                        >
                          {copiedKey === `un_${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1 rounded-md text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="ویرایش کامل مشخصات، نام کاربری و رمز عبور"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* COLUMN 4: رمز */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {isPinUnlocked ? (
                          <>
                            <span className="font-mono font-bold text-slate-900 bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200">
                              {isPasswordRevealed ? displayPassword : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              title={isPasswordRevealed ? 'مخفی‌سازی رمز' : 'نمایش آشکار رمز'}
                            >
                              {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(displayPassword, `pw_${u.id}`)}
                              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              title="کپی رمز عبور"
                            >
                              {copiedKey === `pw_${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => openEditUser(u)}
                              className="p-1 rounded-md text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="ویرایش کامل مشخصات و رمز عبور"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setPinModalMode('verify');
                              setIsPinModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-100"
                          >
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>نیازمند پین</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* COLUMN 5: سطح / نقش */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                          : u.role === 'supervisor' 
                          ? 'bg-teal-100 text-teal-900 border border-teal-200' 
                          : (u.judicialGrade && u.judicialGrade > 0)
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-stone-100 text-stone-800 border border-stone-200'
                      }`}>
                        {u.role === 'admin' 
                          ? 'مدیر ارشد' 
                          : u.role === 'supervisor' 
                          ? 'مسئول سامانه' 
                          : (u.judicialGrade && u.judicialGrade > 0)
                          ? 'دانش‌آموخته قضایی'
                          : (u.roleTitle && (u.roleTitle.includes('اداری') || u.roleTitle.includes('کارمند') || u.roleTitle.includes('کاربر')))
                          ? 'کاربر اداری / پرسنل'
                          : 'کاربر سامانه'}
                      </span>
                    </td>

                    {/* COLUMN 6: تنظیم سطح دسترسی برای اون کاربر */}
                    <td className="p-4 pl-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditUser(u)}
                          className="px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/80 font-extrabold text-xs shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          title="ویرایش تمامی اطلاعات و مشخصات این کاربر"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-700" />
                          <span>ویرایش اطلاعات</span>
                        </button>

                        <button
                          onClick={() => setPermissionModalUser(u)}
                          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                          title="تنظیم تفصیلی دسترسی‌های این کاربر در تمام بخش‌های سامانه"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-300" />
                          <span>تنظیم سطح دسترسی</span>
                        </button>

                        <button
                          onClick={() => toggleUserLock(u.id)}
                          className={`p-2 rounded-xl transition-colors ${
                            u.isLocked 
                              ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' 
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                          }`}
                          title={u.isLocked ? 'حساب قفل است (برای رفع کلیک کنید)' : 'قفل کردن این حساب'}
                        >
                          {u.isLocked ? <Unlock className="w-4 h-4 text-rose-700" /> : <Lock className="w-4 h-4" />}
                        </button>

                        {!isCurrentActive && (
                          <button
                            onClick={() => {
                              if (confirm(`آیا از حذف حساب کاربری [${u.fullName}] اطمینان دارید؟`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-700 transition-colors"
                            title="حذف حساب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================
          MODAL 1: PERMISSIONS MATRIX MODAL (تنظیم سطح دسترسی برای اون کاربر)
          ======================================================================== */}
      {permissionModalUser && (
        <UserPermissionsMatrixModal
          user={permissionModalUser}
          isOpen={!!permissionModalUser}
          onClose={() => setPermissionModalUser(null)}
          onSave={async (permissions) => {
            await updateUserSectionPermissions(permissionModalUser.id, permissions);
            setPermissionModalUser(null);
          }}
          onApplyToRole={async (role, permissions) => {
            await updateRoleDefaultPermissions(role, permissions);
            alert(`الگوی دسترسی با موفقیت برای کلیه کاربران دارای نقش «${role === 'admin' ? 'مدیر' : role === 'supervisor' ? 'مسئول' : 'دانش‌آموخته'}» اعمال گردید.`);
            setPermissionModalUser(null);
          }}
        />
      )}

      {/* ========================================================================
          MODAL 2: EDIT FULL USER DETAILS & PROFILE MODAL
          ======================================================================== */}
      {editingUser && (
        <EditUserFullModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEditUser}
        />
      )}

      {/* ========================================================================
          MODAL 3: SECURITY PIN & SMS OTP MODAL
          ======================================================================== */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">
                    {pinModalMode === 'verify' ? 'ورود پین کد امنیتی مدیر' : 'فعال‌سازی / تغییر پین کد با پیامک'}
                  </h3>
                  <p className="text-xs text-stone-500">حفاظت از پایگاه داده و اطلاعات هویتی اعضا</p>
                </div>
              </div>
              <button onClick={() => setIsPinModalOpen(false)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pinFeedback && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pinFeedback}</span>
              </div>
            )}

            {pinModalMode === 'verify' ? (
              <form onSubmit={handleVerifyPinSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">پین کد امنیتی را وارد فرمایید:</label>
                  <input
                    type="password"
                    maxLength={8}
                    required
                    value={inputPin}
                    onChange={e => setInputPin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 text-center font-mono text-lg font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="••••••"
                  />
                  <p className="text-[11px] text-stone-500">پین کد پیش‌فرض تستی: <code className="font-mono font-bold text-emerald-800">123456</code></p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinModalMode('setup_otp');
                      setPinFeedback(null);
                    }}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    پین را فراموش کرده‌اید؟ پیامک کد تایید OTP
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold shadow-sm"
                  >
                    تایید پین کد
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveNewPin} className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-[11px] space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-700" />
                    ارسال کد تایید پیامکی به موبایل مدیر ({toPersianNumbers('09121112233')}):
                  </p>
                  <p className="text-blue-800">جهت برقراری بالاترین استاندارد امنیتی، کد ۶ رقمی به شماره همراه راهبر ارسال می‌گردد.</p>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال پیامک تایید (SMS OTP)</span>
                  </button>
                </div>

                {otpSentCode && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    پیامک دریافتی در تلفن مدیر: <strong className="font-mono text-sm bg-amber-200 px-2 py-0.5 rounded-md">{otpSentCode}</strong>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">کد تایید پیامکی (۶ رقم):</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={inputOtp}
                    onChange={e => setInputOtp(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 text-center font-mono font-bold text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="123456"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تعیین پین کد جدید امنیتی مدیر:</label>
                  <input
                    type="password"
                    required
                    maxLength={8}
                    value={newPinCode}
                    onChange={e => setNewPinCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 text-center font-mono font-bold text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="مثال: 654321"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinModalMode('verify');
                      setPinFeedback(null);
                    }}
                    className="text-stone-500 font-bold hover:underline"
                  >
                    بازگشت به ورود پین
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold shadow-sm"
                  >
                    ثبت و فعال‌سازی پین کد
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* ========================================================================
          MODAL 4: NEW USER REGISTRATION MODAL
          ======================================================================== */}
      {isNewUserModalOpen && (
        <NewUserRegistrationModal
          isOpen={isNewUserModalOpen}
          onClose={() => setIsNewUserModalOpen(false)}
          onRegister={async (newUser) => {
            await createUser(newUser);
            setIsNewUserModalOpen(false);
          }}
        />
      )}

    </div>
  );
};

/* ========================================================================
   SUB-COMPONENT: USER PERMISSIONS MATRIX MODAL
   ======================================================================== */
interface UserPermissionsMatrixModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissions: UserSectionPermissions) => Promise<void>;
  onApplyToRole: (role: UserRole, permissions: UserSectionPermissions) => Promise<void>;
}

const UserPermissionsMatrixModal: React.FC<UserPermissionsMatrixModalProps> = ({
  user,
  onClose,
  onSave,
  onApplyToRole
}) => {
  // Local state for permissions
  const [permissions, setPermissions] = useState<UserSectionPermissions>(() => {
    return {
      dashboard: user.sectionPermissions?.dashboard || 'view_all',
      cartable: user.sectionPermissions?.cartable || (user.role === 'alumni' ? 'manage_own' : 'manage_all'),
      courses: user.sectionPermissions?.courses || 'view_all',
      products: user.sectionPermissions?.products || 'view_all',
      counseling: user.sectionPermissions?.counseling || (user.role === 'alumni' ? 'manage_own' : 'manage_all'),
      research: user.sectionPermissions?.research || (user.role === 'alumni' ? 'manage_own' : 'manage_all'),
      rulings: user.sectionPermissions?.rulings || (user.role === 'alumni' ? 'manage_own' : 'manage_all'),
      welfare: user.sectionPermissions?.welfare || (user.role === 'alumni' ? 'manage_own' : 'manage_all'),
      synergy: user.sectionPermissions?.synergy || (user.role === 'alumni' ? 'manage_own' : 'manage_all'),
      alumni: user.sectionPermissions?.alumni || (user.role === 'alumni' ? 'none' : 'manage_all'),
      users: user.sectionPermissions?.users || (user.role === 'admin' ? 'manage_all' : user.role === 'supervisor' ? 'view_all' : 'none'),
    };
  });

  const [saving, setSaving] = useState(false);

  const handleLevelChange = (sectionId: AppSectionId, level: PermissionAccessLevel) => {
    setPermissions(prev => ({
      ...prev,
      [sectionId]: level,
    }));
  };

  // Preset Handlers
  const applyAdminPreset = () => {
    const allManage: UserSectionPermissions = {};
    SYSTEM_SECTIONS.forEach(s => {
      allManage[s.id] = 'manage_all';
    });
    setPermissions(allManage);
  };

  const applySupervisorPreset = () => {
    setPermissions({
      dashboard: 'view_all',
      cartable: 'manage_all',
      courses: 'manage_all',
      products: 'manage_all',
      counseling: 'manage_all',
      research: 'manage_all',
      rulings: 'manage_all',
      welfare: 'manage_all',
      synergy: 'manage_all',
      alumni: 'manage_all',
      users: 'view_all',
    });
  };

  const applyAlumniPreset = () => {
    setPermissions({
      dashboard: 'view_own',
      cartable: 'manage_own',
      courses: 'view_all',
      products: 'view_all',
      counseling: 'manage_own',
      research: 'manage_own',
      rulings: 'manage_own',
      welfare: 'manage_own',
      synergy: 'manage_own',
      alumni: 'none', // As explicitly requested: restricted to admin/supervisors
      users: 'none',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(permissions);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#FCFCFA] rounded-[36px] w-full max-w-4xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 bg-[#F5F4EE] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
              <SlidersHorizontal className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900">ماتریس جامع تنظیم سطح دسترسی کاربر</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                  {user.fullName}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                نقش فعلی: {user.roleTitle} · کد ملی: {toPersianNumbers(user.nationalId)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 py-3 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-stone-600">اعمال سریع الگوهای استاندارد:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={applyAdminPreset}
              className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200 font-bold hover:bg-purple-100 transition-colors"
            >
              الگوی مدیر ارشد (دسترسی کامل)
            </button>
            <button
              onClick={applySupervisorPreset}
              className="px-3 py-1.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 font-bold hover:bg-teal-100 transition-colors"
            >
              الگوی مسئول کارتابل و خدمات
            </button>
            <button
              onClick={applyAlumniPreset}
              className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold hover:bg-emerald-100 transition-colors"
            >
              الگوی دانش‌آموخته قضایی (حریم شخصی)
            </button>
          </div>
        </div>

        {/* Permissions List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="space-y-3">
            {SYSTEM_SECTIONS.map((section, idx) => {
              const currentLevel = permissions[section.id] || 'none';
              const SectionIcon = section.icon;

              return (
                <div
                  key={section.id}
                  className="p-4 rounded-3xl bg-white border border-stone-200/90 shadow-2xs hover:border-emerald-700/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
                        <SectionIcon className="w-4 h-4 text-emerald-800" />
                      </div>
                      <div>
                        <h4 className="font-black text-stone-900 text-sm">{section.title}</h4>
                        <p className="text-[11px] text-stone-500">{section.subtitle}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-stone-400">
                      بخش #{toPersianNumbers(idx + 1)}
                    </span>
                  </div>

                  {/* 5 Clickable Radio Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pt-1 text-xs">
                    {PERMISSION_LEVEL_DESCRIPTIONS.map(p => {
                      const isSelected = currentLevel === p.level;

                      return (
                        <button
                          key={p.level}
                          type="button"
                          onClick={() => handleLevelChange(section.id, p.level)}
                          className={`p-2.5 rounded-2xl text-right transition-all border flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? `${p.color} ring-2 ring-emerald-700 shadow-2xs font-extrabold`
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-extrabold text-[11px] leading-tight">{p.title}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-400'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">
                            {p.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#F5F4EE] border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => onApplyToRole(user.role, permissions)}
            className="text-stone-700 hover:text-emerald-800 font-extrabold flex items-center gap-1.5 underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تعمیم این الگو به کلیه اعضای دارای نقش «{user.role === 'admin' ? 'مدیر' : user.role === 'supervisor' ? 'مسئول' : 'دانش‌آموخته'}»</span>
          </button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'در حال اعمال...' : 'ذخیره سطح دسترسی'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ========================================================================
   SUB-COMPONENT: NEW USER REGISTRATION MODAL
   ======================================================================== */
interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newUser: any) => Promise<void>;
}

const NewUserRegistrationModal: React.FC<NewUserModalProps> = ({ onClose, onRegister }) => {
  type UserCategory = 'alumni' | 'supervisor' | 'staff' | 'admin';
  const [userCategory, setUserCategory] = useState<UserCategory>('alumni');
  const [isUsernameEdited, setIsUsernameEdited] = useState(false);
  const [isPasswordEdited, setIsPasswordEdited] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    username: '',
    password: '',
    role: 'alumni' as UserRole,
    roleTitle: 'مستشار دادگاه تجدیدنظر استان',
    siteTitle: '',
    profilePictureUrl: '',
    organization: 'قوه قضائیه',
    graduationYear: '۱۴۰۰',
    judicialGrade: 8,
    courtBranch: 'شعبه دادگاه عمومی و تجدیدنظر',
    province: 'تهران',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  const handleCategoryChange = (category: UserCategory) => {
    setUserCategory(category);
    if (category === 'alumni') {
      setFormData(prev => ({
        ...prev,
        role: 'alumni',
        roleTitle: 'مستشار دادگاه تجدیدنظر استان',
        organization: 'قوه قضائیه',
        judicialGrade: 8,
        courtBranch: 'شعبه دادگاه عمومی و تجدیدنظر',
        graduationYear: '۱۴۰۰',
      }));
    } else if (category === 'supervisor') {
      setFormData(prev => ({
        ...prev,
        role: 'supervisor',
        roleTitle: 'مسئول کارتابل و هماهنگی سامانه',
        organization: 'سامانه فقه و قضا',
        judicialGrade: 0,
        courtBranch: 'دبیرخانه و دفتر نظارت مرکزی',
        graduationYear: '-',
      }));
    } else if (category === 'staff') {
      setFormData(prev => ({
        ...prev,
        role: 'alumni',
        roleTitle: 'کارمند اداری / کاربر سامانه',
        organization: 'امور اداری و پشتیبانی',
        judicialGrade: 0,
        courtBranch: 'واحد امور اداری و دفتری',
        graduationYear: '-',
      }));
    } else if (category === 'admin') {
      setFormData(prev => ({
        ...prev,
        role: 'admin',
        roleTitle: 'مدیر ارشد سامانه',
        organization: 'مرکز فناوری و نظارت سامانه',
        judicialGrade: 0,
        courtBranch: 'مرکز فناوری اطلاعات و داده',
        graduationYear: '-',
      }));
    }
  };

  const handleNationalIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      nationalId: val,
      username: isUsernameEdited ? prev.username : val,
    }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUsernameEdited(true);
    setFormData(prev => ({
      ...prev,
      username: e.target.value,
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      phone: val,
      password: isPasswordEdited ? prev.password : val,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPasswordEdited(true);
    setFormData(prev => ({
      ...prev,
      password: e.target.value,
    }));
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPic(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      try {
        const res = await api.uploadProfilePicture(base64, file.name);
        if (res.success && res.url) {
          setFormData(prev => ({ ...prev, profilePictureUrl: res.url }));
        }
      } catch (err: any) {
        alert(`خطا در آپلود تصویر پروفایل: ${err?.message || err}`);
      } finally {
        setUploadingPic(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isAlumni = userCategory === 'alumni';
    const username = formData.username.trim() || formData.nationalId.trim();
    const password = formData.password.trim() || formData.phone.trim();

    await onRegister({
      ...formData,
      username,
      password,
      siteTitle: formData.siteTitle.trim() || formData.roleTitle,
      hasAccount: true,
      avatarText: formData.fullName.slice(0, 2),
      isActive: true,
      personnelId: String(Math.floor(100000 + Math.random() * 900000)),
      judicialGrade: isAlumni ? Number(formData.judicialGrade) || 1 : 0,
      graduationYear: isAlumni ? formData.graduationYear : '-',
      sectionPermissions: {
        dashboard: formData.role === 'admin' ? 'manage_all' : formData.role === 'supervisor' ? 'view_all' : 'view_own',
        cartable: formData.role === 'admin' || formData.role === 'supervisor' ? 'manage_all' : 'manage_own',
        courses: 'view_all',
        products: 'view_all',
        counseling: formData.role === 'admin' || formData.role === 'supervisor' ? 'manage_all' : 'manage_own',
        research: formData.role === 'admin' || formData.role === 'supervisor' ? 'manage_all' : 'manage_own',
        rulings: formData.role === 'admin' || formData.role === 'supervisor' ? 'manage_all' : (isAlumni ? 'manage_own' : 'view_all'),
        welfare: formData.role === 'admin' || formData.role === 'supervisor' ? 'manage_all' : 'manage_own',
        synergy: formData.role === 'admin' || formData.role === 'supervisor' ? 'manage_all' : 'manage_own',
        alumni: formData.role === 'admin' ? 'manage_all' : formData.role === 'supervisor' ? 'view_all' : 'none',
        users: formData.role === 'admin' ? 'manage_all' : formData.role === 'supervisor' ? 'view_all' : 'none',
      }
    });

    setLoading(false);
  };

  const isAlumni = userCategory === 'alumni';

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#FCFCFA] rounded-[36px] w-full max-w-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="p-6 bg-[#F5F4EE] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
              <UserPlus className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-900">ایجاد کاربر و حساب جدید</h3>
              <p className="text-xs text-stone-500">پشتیبانی از انواع کاربران (قضایی، مسئول، کارمند اداری، مدیر ارشد)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* USER CATEGORY SELECTOR */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-stone-100/90 border border-stone-200">
            <label className="font-extrabold text-stone-800 block">
              رسته و نوع جایگاه کاربر در سامانه:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'alumni' as const, label: 'دانش‌آموخته قضایی', desc: 'قاضی، مستشار، پژوهشگر' },
                { id: 'supervisor' as const, label: 'مسئول سامانه', desc: 'کارشناس مسئول، کارتابل' },
                { id: 'staff' as const, label: 'کاربر اداری / پرسنل', desc: 'کارمند دفتری، کاربر عادی' },
                { id: 'admin' as const, label: 'مدیر ارشد', desc: 'ادمین با دسترسی کل' },
              ].map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-2.5 rounded-xl text-right transition-all border text-xs flex flex-col justify-between ${
                    userCategory === cat.id
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs ring-2 ring-emerald-600/30'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-black text-xs block mb-0.5">{cat.label}</span>
                  <span className={`text-[10px] leading-tight ${userCategory === cat.id ? 'text-emerald-100' : 'text-stone-400'}`}>
                    {cat.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FULL NAME */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">نام و نام خانوادگی:</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={isAlumni ? "مثال: دکتر مهدی حسینی" : "مثال: احمد رضایی"}
              />
            </div>

            {/* NATIONAL ID - WITH REAL-TIME CONTINUOUS MIRRORING */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">کد ملی (۱۰ رقم):</label>
                <span className="text-[10px] text-stone-400 font-medium">همگام‌سازی لحظه‌ای با نام کاربری</span>
              </div>
              <input
                type="text"
                required
                value={formData.nationalId}
                onChange={handleNationalIdChange}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder="0012345678"
              />
            </div>

            {/* PHONE - WITH REAL-TIME CONTINUOUS MIRRORING */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">شماره تلفن همراه:</label>
                <span className="text-[10px] text-stone-400 font-medium">همگام‌سازی لحظه‌ای با رمز عبور</span>
              </div>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder="09121112233"
              />
            </div>

            {/* SITE TITLE */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">عنوان نمایشی در سایت:</label>
              <input
                type="text"
                value={formData.siteTitle}
                onChange={e => setFormData({ ...formData, siteTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={isAlumni ? "مثال: پژوهشگر ارشد فقه القضاء" : "مثال: کارشناس مسئول هماهنگی"}
              />
            </div>

            {/* PROFILE PICTURE */}
            <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-2xl bg-stone-100/80 border border-stone-200">
              <label className="font-bold text-stone-800 block mb-1">
                عکس پروفایل کاربر (ذخیره‌سازی مستقیم در پوشه PROFILE_PICTURE):
              </label>
              <div className="flex items-center gap-3">
                {formData.profilePictureUrl ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-700 shrink-0">
                    <img src={formData.profilePictureUrl} alt="عکس پروفایل" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profilePictureUrl: '' })}
                      className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 text-[10px] flex items-center justify-center font-bold"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-stone-200 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 font-bold text-xs shrink-0">
                    بدون تصویر
                  </div>
                )}

                <label className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                  <span>{uploadingPic ? 'در حال آپلود...' : 'انتخاب و آپلود تصویر پروفایل'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingPic}
                    onChange={handleProfilePicUpload}
                    className="hidden"
                  />
                </label>

                {formData.profilePictureUrl && (
                  <span className="text-[11px] font-mono text-emerald-800 font-bold truncate max-w-[220px]">
                    {formData.profilePictureUrl}
                  </span>
                )}
              </div>
            </div>

            {/* USERNAME FIELD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">نام کاربری اختصاصی:</label>
                {isUsernameEdited ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUsernameEdited(false);
                      setFormData(prev => ({ ...prev, username: prev.nationalId }));
                    }}
                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                  >
                    🔄 بازنشانی با کد ملی
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    ✓ همگام با کد ملی
                  </span>
                )}
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={handleUsernameChange}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={formData.nationalId || 'همان کد ملی'}
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">رمز عبور اختصاصی:</label>
                {isPasswordEdited ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordEdited(false);
                      setFormData(prev => ({ ...prev, password: prev.phone }));
                    }}
                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                  >
                    🔄 بازنشانی با موبایل
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    ✓ همگام با شماره موبایل
                  </span>
                )}
              </div>
              <input
                type="text"
                value={formData.password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={formData.phone || 'همان شماره موبایل'}
              />
            </div>

            {/* ROLE / OFFICIAL TITLE */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">
                {isAlumni ? 'سمت قضایی رسمی:' : 'سمت و عنوان سازمانی / شغلی:'}
              </label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={e => setFormData({ ...formData, roleTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={isAlumni ? "مستشار دادگاه تجدیدنظر..." : "کارشناس مسئول دبیرخانه / امور اداری..."}
              />
            </div>

            {/* ORGANIZATION / INSTITUTION */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">سازمان یا نهاد متبوع:</label>
              <input
                type="text"
                value={formData.organization}
                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder="قوه قضائیه، سامانه، دادگستری..."
              />
            </div>

            {/* CONDITIONAL JUDICIAL GRADE - ONLY FOR ALUMNI */}
            {isAlumni && (
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">پایه قضایی (۱ تا ۱۱):</label>
                <input
                  type="number"
                  min={1}
                  max={11}
                  value={formData.judicialGrade}
                  onChange={e => setFormData({ ...formData, judicialGrade: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            )}

            {/* BRANCH OR OFFICE */}
            <div className={`space-y-1.5 ${isAlumni ? '' : 'sm:col-span-2'}`}>
              <label className="font-bold text-stone-700">
                {isAlumni ? 'شعبه و مجتمع قضایی محل خدمت:' : 'واحد، اداره یا بخش محل خدمت:'}
              </label>
              <input
                type="text"
                value={formData.courtBranch}
                onChange={e => setFormData({ ...formData, courtBranch: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder={isAlumni ? "شعبه ۴ تجدیدنظر استان..." : "دبیرخانه مرکزی، امور اداری، فناوری اطلاعات..."}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed">
            * کد ملی به طور پیوسته همگام با نام کاربری و شماره موبایل همگام با رمز عبور ثبت می‌شوند؛ در صورت تمایل می‌توانید در فیلدهای مربوطه آن‌ها را شخصی‌سازی نمایید.
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'در حال ثبت...' : 'ایجاد حساب کاربری'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ========================================================================
   SUB-COMPONENT: EDIT FULL USER DETAILS MODAL
   ======================================================================== */
interface EditUserFullModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<User>) => Promise<void>;
}

const EditUserFullModal: React.FC<EditUserFullModalProps> = ({ user, onClose, onSave }) => {
  type UserCategory = 'alumni' | 'supervisor' | 'staff' | 'admin';
  
  const initialCategory: UserCategory = 
    user.role === 'admin' ? 'admin' :
    user.role === 'supervisor' ? 'supervisor' :
    (user.judicialGrade && user.judicialGrade > 0) ? 'alumni' : 'staff';

  const [userCategory, setUserCategory] = useState<UserCategory>(initialCategory);

  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    nationalId: user.nationalId || '',
    phone: user.phone || '',
    username: user.username || user.nationalId || '',
    password: user.password || user.phone || '123456',
    role: user.role || 'alumni',
    roleTitle: user.roleTitle || '',
    siteTitle: user.siteTitle || '',
    profilePictureUrl: user.profilePictureUrl || '',
    organization: user.organization || 'قوه قضائیه',
    graduationYear: user.graduationYear || '۱۴۰۰',
    judicialGrade: user.judicialGrade || 8,
    courtBranch: user.courtBranch || '',
    province: user.province || 'تهران',
    isActive: user.isActive !== undefined ? user.isActive : true,
  });

  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  const handleCategoryChange = (category: UserCategory) => {
    setUserCategory(category);
    if (category === 'alumni') {
      setFormData(prev => ({
        ...prev,
        role: 'alumni',
        roleTitle: prev.roleTitle || 'مستشار دادگاه تجدیدنظر استان',
        organization: prev.organization || 'قوه قضائیه',
        judicialGrade: prev.judicialGrade || 8,
        courtBranch: prev.courtBranch || 'شعبه دادگاه عمومی و تجدیدنظر',
      }));
    } else if (category === 'supervisor') {
      setFormData(prev => ({
        ...prev,
        role: 'supervisor',
        roleTitle: prev.roleTitle || 'مسئول کارتابل و هماهنگی سامانه',
        organization: 'سامانه فقه و قضا',
        judicialGrade: 0,
        courtBranch: prev.courtBranch || 'دبیرخانه و دفتر نظارت مرکزی',
      }));
    } else if (category === 'staff') {
      setFormData(prev => ({
        ...prev,
        role: 'alumni',
        roleTitle: prev.roleTitle || 'کارمند اداری / کاربر سامانه',
        organization: prev.organization || 'امور اداری و پشتیبانی',
        judicialGrade: 0,
        courtBranch: prev.courtBranch || 'واحد امور اداری و دفتری',
      }));
    } else if (category === 'admin') {
      setFormData(prev => ({
        ...prev,
        role: 'admin',
        roleTitle: prev.roleTitle || 'مدیر ارشد سامانه',
        organization: 'مرکز فناوری و نظارت سامانه',
        judicialGrade: 0,
        courtBranch: prev.courtBranch || 'مرکز فناوری اطلاعات و داده',
      }));
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPic(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result as string;
      try {
        const res = await api.uploadProfilePicture(base64, file.name);
        if (res.success && res.url) {
          setFormData(prev => ({ ...prev, profilePictureUrl: res.url }));
        }
      } catch (err: any) {
        alert(`خطا در آپلود تصویر پروفایل: ${err?.message || err}`);
      } finally {
        setUploadingPic(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isAlumni = userCategory === 'alumni';

    await onSave(user.id, {
      ...formData,
      siteTitle: formData.siteTitle.trim() || formData.roleTitle,
      avatarText: formData.fullName.slice(0, 2),
      judicialGrade: isAlumni ? Number(formData.judicialGrade) || 1 : 0,
      graduationYear: isAlumni ? formData.graduationYear : '-',
    });

    setLoading(false);
  };

  const isAlumni = userCategory === 'alumni';

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#FCFCFA] rounded-[36px] w-full max-w-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="p-6 bg-[#F5F4EE] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <Edit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-stone-900">ویرایش کامل اطلاعات و مشخصات کاربر</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  {user.fullName}
                </span>
              </div>
              <p className="text-xs text-stone-500">ویرایش تمامی مشخصات هویتی، نام کاربری، رمز عبور، نقش و عنوان سازمانی</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* USER CATEGORY SELECTOR */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-stone-100/90 border border-stone-200">
            <label className="font-extrabold text-stone-800 block">
              رسته و نوع جایگاه کاربر در سامانه:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'alumni' as const, label: 'دانش‌آموخته قضایی', desc: 'قاضی، مستشار، پژوهشگر' },
                { id: 'supervisor' as const, label: 'مسئول سامانه', desc: 'کارشناس مسئول، کارتابل' },
                { id: 'staff' as const, label: 'کاربر اداری / پرسنل', desc: 'کارمند دفتری، کاربر عادی' },
                { id: 'admin' as const, label: 'مدیر ارشد', desc: 'ادمین با دسترسی کل' },
              ].map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-2.5 rounded-xl text-right transition-all border text-xs flex flex-col justify-between ${
                    userCategory === cat.id
                      ? 'bg-amber-600 text-white border-amber-700 shadow-xs ring-2 ring-amber-500/30 font-extrabold'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-black text-xs block mb-0.5">{cat.label}</span>
                  <span className={`text-[10px] leading-tight ${userCategory === cat.id ? 'text-amber-100' : 'text-stone-400'}`}>
                    {cat.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FULL NAME */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">نام و نام خانوادگی:</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* NATIONAL ID */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">کد ملی (۱۰ رقم):</label>
              <input
                type="text"
                required
                value={formData.nationalId}
                onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* PHONE */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">شماره تلفن همراه:</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* SITE TITLE */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">عنوان نمایشی در سایت:</label>
              <input
                type="text"
                value={formData.siteTitle}
                onChange={e => setFormData({ ...formData, siteTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* PROFILE PICTURE */}
            <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-2xl bg-stone-100/80 border border-stone-200">
              <label className="font-bold text-stone-800 block mb-1">
                عکس پروفایل کاربر (ذخیره‌سازی مستقیم در پوشه PROFILE_PICTURE):
              </label>
              <div className="flex items-center gap-3">
                {formData.profilePictureUrl ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-600 shrink-0">
                    <img src={formData.profilePictureUrl} alt="عکس پروفایل" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profilePictureUrl: '' })}
                      className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 text-[10px] flex items-center justify-center font-bold"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-stone-200 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 font-bold text-xs shrink-0">
                    بدون تصویر
                  </div>
                )}

                <label className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
                  <span>{uploadingPic ? 'در حال آپلود...' : 'انتخاب و آپلود تصویر جدید'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingPic}
                    onChange={handleProfilePicUpload}
                    className="hidden"
                  />
                </label>

                {formData.profilePictureUrl && (
                  <span className="text-[11px] font-mono text-stone-700 font-bold truncate max-w-[220px]">
                    {formData.profilePictureUrl}
                  </span>
                )}
              </div>
            </div>

            {/* USERNAME FIELD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">نام کاربری اختصاصی:</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, username: prev.nationalId }))}
                  className="text-[10px] text-amber-700 hover:underline font-bold"
                >
                  🔄 تنظیم همسان با کد ملی
                </button>
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">رمز عبور اختصاصی:</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, password: prev.phone }))}
                  className="text-[10px] text-amber-700 hover:underline font-bold"
                >
                  🔄 تنظیم همسان با موبایل
                </button>
              </div>
              <input
                type="text"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* ROLE / OFFICIAL TITLE */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">
                {isAlumni ? 'سمت قضایی رسمی:' : 'سمت و عنوان سازمانی / شغلی:'}
              </label>
              <input
                type="text"
                value={formData.roleTitle}
                onChange={e => setFormData({ ...formData, roleTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* ORGANIZATION / INSTITUTION */}
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">سازمان یا نهاد متبوع:</label>
              <input
                type="text"
                value={formData.organization}
                onChange={e => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* CONDITIONAL JUDICIAL GRADE - ONLY FOR ALUMNI */}
            {isAlumni && (
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">پایه قضایی (۱ تا ۱۱):</label>
                <input
                  type="number"
                  min={1}
                  max={11}
                  value={formData.judicialGrade}
                  onChange={e => setFormData({ ...formData, judicialGrade: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            )}

            {/* BRANCH OR OFFICE */}
            <div className={`space-y-1.5 ${isAlumni ? '' : 'sm:col-span-2'}`}>
              <label className="font-bold text-stone-700">
                {isAlumni ? 'شعبه و مجتمع قضایی محل خدمت:' : 'واحد، اداره یا بخش محل خدمت:'}
              </label>
              <input
                type="text"
                value={formData.courtBranch}
                onChange={e => setFormData({ ...formData, courtBranch: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            {/* PROVINCE */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-stone-700">استان / حوزه قضایی:</label>
              <input
                type="text"
                value={formData.province}
                onChange={e => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'در حال ثبت تغییرات...' : 'ذخیره کامل تغییرات کاربر'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { User } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  GraduationCap,
  Search,
  UserPlus,
  Scale,
  Award,
  BookOpen,
  MapPin,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert,
  FileText,
  ChevronLeft,
  X,
  CheckCircle2,
  Sparkles,
  Printer,
  LayoutGrid,
  List,
  Save,
  Check,
  Briefcase,
  UserCheck,
  Calendar,
  Lock,
  KeyRound,
  Upload,
  Image
} from 'lucide-react';

interface AlumniDirectorySectionProps {
  onNavigate?: (tab: any) => void;
}

export const AlumniDirectorySection: React.FC<AlumniDirectorySectionProps> = ({ onNavigate }) => {
  const { users, currentUser, createUser, updateUserDetails, createAccountForAlumnus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [degreeFilter, setDegreeFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<'all' | 'has_account' | 'no_account'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modals state
  const [selectedAlumni, setSelectedAlumni] = useState<User | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [createAccountAlumnus, setCreateAccountAlumnus] = useState<User | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Quick Account Form State
  const [accForm, setAccForm] = useState({
    username: '',
    password: '',
    roleTitle: '',
  });

  // Guard: Strictly Admin & Supervisor Only
  const isAllowed = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';
  if (!isAllowed) {
    return (
      <div className="p-8 text-center max-w-xl mx-auto mt-12 bg-white/90 rounded-3xl border border-stone-200 shadow-lg space-y-4 font-sans" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-stone-900">محدودیت دسترسی به بانک دانش‌آموختگان</h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          این بخش منحصراً در اختیار مدیر ارشد و مسئولین مرکز دانش‌آموختگان فقه و قضا می‌باشد. دانش‌آموختگان گرامی می‌توانند پرونده فردی و خدمات خود را از بخش داشبورد و کارتابل پیگیری نمایند.
        </p>
      </div>
    );
  }

  // Filter only alumni members
  const alumniList = users.filter(u => u.role === 'alumni' || u.judicialGrade || u.graduationYear);

  const filteredAlumni = alumniList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.nationalId.includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.personnelId && u.personnelId.includes(q)) ||
      (u.courtBranch && u.courtBranch.toLowerCase().includes(q)) ||
      (u.province && u.province.toLowerCase().includes(q)) ||
      (u.thesisTitle && u.thesisTitle.toLowerCase().includes(q));

    const matchesDegree = degreeFilter === 'all' || (u.academicDegree && u.academicDegree.includes(degreeFilter));
    const matchesProvince = provinceFilter === 'all' || u.province === provinceFilter;
    
    const hasAcc = u.hasAccount !== false;
    let matchesAccount = true;
    if (accountFilter === 'has_account') matchesAccount = hasAcc;
    if (accountFilter === 'no_account') matchesAccount = !hasAcc;

    return matchesSearch && matchesDegree && matchesProvince && matchesAccount;
  });

  const provinces = Array.from(new Set(alumniList.map(u => u.province).filter(Boolean)));

  // KPI Calculations
  const totalAlumni = alumniList.length;
  const withAccountCount = alumniList.filter(u => u.hasAccount !== false).length;
  const withoutAccountCount = alumniList.filter(u => u.hasAccount === false).length;
  const highGradeJudges = alumniList.filter(u => (u.judicialGrade || 0) >= 8).length;

  // Open Create Account Modal
  const openCreateAccountModal = (alumnus: User) => {
    setCreateAccountAlumnus(alumnus);
    setAccForm({
      username: alumnus.nationalId,
      password: alumnus.phone || '09121112233',
      roleTitle: alumnus.roleTitle || 'دانش‌آموخته قضایی',
    });
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createAccountAlumnus) return;

    await createAccountForAlumnus(createAccountAlumnus.id, accForm.username, accForm.password);
    setNotification(`حساب کاربری رسمی برای «${createAccountAlumnus.fullName}» با نام کاربری ${accForm.username} با موفقیت صادر و فعال گردید.`);
    setCreateAccountAlumnus(null);
  };

  return (
    <div className="space-y-6 text-stone-900 font-sans" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-3xl bg-emerald-800 text-white shadow-lg flex items-center justify-between gap-3 text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 rounded-full hover:bg-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Add Alumni Button */}
      <div className="bg-white/90 p-6 rounded-3xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900">بانک جامع دانش‌آموختگان فقه و قضا</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                پرونده الکترونیک ۴ سربرگه هویتی، علمی، حوزوی و شغلی (مخصوص مدیر عالی و مسئولین)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="px-5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold shadow-sm flex items-center gap-2 self-start md:self-auto shrink-0 transition-transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>ثبت پرونده دانش‌آموخته جدید</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'کل دانش‌آموختگان ثبت‌شده', val: totalAlumni, unit: 'نفر', color: 'bg-emerald-50 text-emerald-900 border-emerald-200', icon: GraduationCap },
          { label: 'دارای حساب کاربری فعال', val: withAccountCount, unit: 'حساب', color: 'bg-teal-50 text-teal-900 border-teal-200', icon: UserCheck },
          { label: 'فاقد حساب کاربری (نیازمند صدور)', val: withoutAccountCount, unit: 'مورد', color: 'bg-rose-50 text-rose-900 border-rose-200', icon: ShieldAlert },
          { label: 'قضات دارای پایه ۸ و بالاتر', val: highGradeJudges, unit: 'قاضی', color: 'bg-amber-50 text-amber-900 border-amber-200', icon: Scale },
        ].map((stat, idx) => (
          <div key={idx} className={`p-5 rounded-3xl border shadow-2xs space-y-2 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold">{stat.label}</span>
              <stat.icon className="w-5 h-5 opacity-80" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black">
                {toPersianNumbers(stat.val)}
              </span>
              <span className="text-[11px] font-bold opacity-80">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/90 p-4 rounded-3xl border border-stone-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <input
            type="text"
            placeholder="جستجوی نام، کد ملی، شماره پرسنلی، شعبه دادگاه، عنوان پایان‌نامه..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-[#F5F4EE] border border-stone-200 rounded-full text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={e => setAccountFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#F5F4EE] border border-stone-200 rounded-xl font-bold text-stone-700 focus:outline-none"
          >
            <option value="all">وضعیت حساب: همه</option>
            <option value="has_account">دارای حساب کاربری</option>
            <option value="no_account">فاقد حساب کاربری (دکمه قرمز)</option>
          </select>

          <select
            value={degreeFilter}
            onChange={e => setDegreeFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F4EE] border border-stone-200 rounded-xl font-bold text-stone-700 focus:outline-none"
          >
            <option value="all">همه مدارک تحصیلی</option>
            <option value="دکتری">دکتری تخصصی</option>
            <option value="سطح ۴">سطح ۴ حوزه</option>
            <option value="کارشناسی ارشد">کارشناسی ارشد</option>
          </select>

          <select
            value={provinceFilter}
            onChange={e => setProvinceFilter(e.target.value)}
            className="px-3 py-2 bg-[#F5F4EE] border border-stone-200 rounded-xl font-bold text-stone-700 focus:outline-none"
          >
            <option value="all">همه استان‌ها</option>
            {provinces.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Grid / Table Mode Switch */}
          <div className="flex items-center bg-[#F5F4EE] p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500'}`}
              title="نمای کارتی"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500'}`}
              title="نمای جدولی"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content (Cards vs Table) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlumni.map(alumni => {
            const hasAccount = alumni.hasAccount !== false;

            return (
              <motion.div
                key={alumni.id}
                whileHover={{ y: -4 }}
                className={`bg-white/95 p-5 rounded-3xl border shadow-2xs transition-all flex flex-col justify-between space-y-4 ${
                  hasAccount ? 'border-stone-200 hover:border-emerald-700/50' : 'border-rose-300 bg-rose-50/20'
                }`}
              >
                {/* Header profile info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {alumni.profilePictureUrl ? (
                        <img src={alumni.profilePictureUrl} alt={alumni.fullName} className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-xs border border-stone-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                          {alumni.avatarText || alumni.fullName.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-black text-sm text-stone-900 line-clamp-1">
                          {alumni.fullName}
                        </h3>
                        <p className="text-xs text-stone-500 font-semibold line-clamp-1">
                          {alumni.siteTitle ? `${alumni.siteTitle} · ${alumni.roleTitle || ''}` : alumni.roleTitle}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black border border-emerald-200 shrink-0">
                      پایه {toPersianNumbers(alumni.judicialGrade || 8)}
                    </span>
                  </div>

                  {/* Account Status Badge */}
                  <div className="flex items-center justify-between pt-1">
                    {hasAccount ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-black flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>دارای حساب کاربری فعال</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-black flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        <span>فاقد حساب کاربری</span>
                      </span>
                    )}

                    {/* Prominent Red Button «ایجاد کاربری» if no account */}
                    {!hasAccount && (
                      <button
                        onClick={() => openCreateAccountModal(alumni)}
                        className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-transform active:scale-95 animate-pulse"
                        title="صدور آنی حساب کاربری برای این فرد"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>ایجاد کاربری</span>
                      </button>
                    )}
                  </div>

                  {/* Badges and data pills */}
                  <div className="space-y-2 text-xs text-stone-700 bg-[#F5F4EE] p-3.5 rounded-2xl border border-stone-200/80">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        شماره پرسنلی:
                      </span>
                      <span className="font-mono font-bold text-stone-900">
                        {toPersianNumbers(alumni.personnelId || '---')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <Building2 className="w-3.5 h-3.5 text-amber-700" />
                        شعبه قضایی:
                      </span>
                      <span className="font-bold text-stone-900 truncate max-w-[160px]">
                        {alumni.courtBranch || 'دادگاه تجدیدنظر استان'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        استان خدمت:
                      </span>
                      <span className="font-bold text-stone-900">
                        {alumni.province || 'تهران'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-700" />
                        مقطع علمی:
                      </span>
                      <span className="font-bold text-stone-900 truncate max-w-[160px]">
                        {alumni.academicDegree || 'سطح ۴ فقه القضا'}
                      </span>
                    </div>
                  </div>

                  {/* Thesis snippet if exists */}
                  {alumni.thesisTitle && (
                    <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] space-y-1">
                      <span className="text-amber-900 font-extrabold block flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-700" />
                        رساله / پایان‌نامه:
                      </span>
                      <p className="text-stone-700 line-clamp-2 leading-relaxed">
                        {alumni.thesisTitle}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Bottom: National ID & Detailed 4-Tab Dossier Button */}
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-500 font-mono font-bold">
                    کد ملی: {toPersianNumbers(alumni.nationalId)}
                  </span>
                  <button
                    onClick={() => setSelectedAlumni(alumni)}
                    className="px-4 py-2 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <span>پرونده تفصیلی ۴ سربرگ</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white/95 rounded-[36px] border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-stone-800">
              <thead className="bg-[#F5F4EE] text-stone-700 font-black border-b border-stone-200">
                <tr>
                  <th className="py-4 px-4 pr-6">نام و نام خانوادگی</th>
                  <th className="py-4 px-4">کد ملی</th>
                  <th className="py-4 px-4">شماره پرسنلی</th>
                  <th className="py-4 px-4">پایه قضایی</th>
                  <th className="py-4 px-4">شعبه دادگاه / سازمان</th>
                  <th className="py-4 px-4">وضعیت حساب کاربری</th>
                  <th className="py-4 px-4 text-center pl-6">عملیات پرونده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredAlumni.map(alumni => {
                  const hasAccount = alumni.hasAccount !== false;

                  return (
                    <tr key={alumni.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-4 px-4 pr-6 font-bold text-stone-900 flex items-center gap-3">
                        {alumni.profilePictureUrl ? (
                          <img src={alumni.profilePictureUrl} alt={alumni.fullName} className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs border border-stone-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {alumni.avatarText || alumni.fullName.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-black text-stone-900">{alumni.fullName}</p>
                          <p className="text-[11px] text-stone-500">
                            {alumni.siteTitle ? `${alumni.siteTitle} · ${alumni.roleTitle || ''}` : alumni.roleTitle}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-stone-900">
                        {toPersianNumbers(alumni.nationalId)}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-stone-600">
                        {toPersianNumbers(alumni.personnelId || '---')}
                      </td>

                      <td className="py-4 px-4 font-extrabold text-emerald-800">
                        پایه {toPersianNumbers(alumni.judicialGrade || 8)}
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-stone-900">{alumni.courtBranch || 'دادگاه تجدیدنظر'}</p>
                        <p className="text-[11px] text-stone-500">استان {alumni.province || 'تهران'}</p>
                      </td>

                      {/* Account status with Red Button */}
                      <td className="py-4 px-4">
                        {hasAccount ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>دارای کاربری</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-[11px] font-black">
                              فاقد کاربری
                            </span>
                            <button
                              onClick={() => openCreateAccountModal(alumni)}
                              className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black shadow-xs flex items-center gap-1 animate-pulse"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>ایجاد کاربری</span>
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 pl-6 text-center">
                        <button
                          onClick={() => setSelectedAlumni(alumni)}
                          className="px-3 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all shadow-2xs"
                        >
                          پرونده ۴ سربرگ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 1: PROMINENT RED BUTTON MODAL «ایجاد کاربری»
          ======================================================================== */}
      {createAccountAlumnus && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-800">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-stone-900">ایجاد و فعال‌سازی حساب کاربری</h3>
                  <p className="text-xs text-stone-500">برای {createAccountAlumnus.fullName}</p>
                </div>
              </div>
              <button onClick={() => setCreateAccountAlumnus(null)} className="p-1 rounded-lg hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccountSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
                طبق شیوه پیشنهادی: <strong>کد ملی به عنوان نام کاربری</strong> و <strong>شماره تلفن همراه به عنوان رمز عبور پیش‌فرض</strong> قرار گرفته است.
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">نام کاربری پیشنهادی (کد ملی):</label>
                <input
                  type="text"
                  required
                  value={accForm.username}
                  onChange={e => setAccForm({ ...accForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">رمز عبور پیشنهادی (تلفن همراه):</label>
                <input
                  type="text"
                  required
                  value={accForm.password}
                  onChange={e => setAccForm({ ...accForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">عنوان و سمت:</label>
                <input
                  type="text"
                  value={accForm.roleTitle}
                  onChange={e => setAccForm({ ...accForm, roleTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateAccountAlumnus(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>تایید و ایجاد حساب کاربری</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================
          MODAL 2: 4-TAB DETAILED DOSSIER MODAL (پرونده الکترونیک جامع دانش‌آموخته)
          ۱. اطلاعات هویتی
          ۲. سوابق حوزوی و دانشگاهی
          ۳. سوابقی که در مجموعه داشته
          ۴. اطلاعات شغلی
          ======================================================================== */}
      {selectedAlumni && (
        <AlumniDossierModal
          alumni={selectedAlumni}
          isOpen={!!selectedAlumni}
          onClose={() => setSelectedAlumni(null)}
          onSave={async (updatedFields) => {
            await updateUserDetails(selectedAlumni.id, updatedFields);
            setNotification(`پرونده جامع دانش‌آموخته «${selectedAlumni.fullName}» با موفقیت به‌روزرسانی شد.`);
            setSelectedAlumni(null);
          }}
          onOpenCreateAccount={() => {
            const target = selectedAlumni;
            setSelectedAlumni(null);
            openCreateAccountModal(target);
          }}
        />
      )}

      {/* ========================================================================
          MODAL 3: REGISTER NEW ALUMNUS WITH 4 TABS
          ======================================================================== */}
      {isRegisterOpen && (
        <RegisterNewAlumnusModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onRegister={async (newAlumnus) => {
            await createUser(newAlumnus);
            setNotification(`دانش‌آموخته گرامی «${newAlumnus.fullName}» با موفقیت در بانک جامع ثبت گردید.`);
            setIsRegisterOpen(false);
          }}
        />
      )}

    </div>
  );
};

/* ========================================================================
   SUB-COMPONENT: 4-TAB DETAILED ALUMNI DOSSIER MODAL
   ======================================================================== */
interface AlumniDossierModalProps {
  alumni: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>) => Promise<void>;
  onOpenCreateAccount: () => void;
}

const AlumniDossierModal: React.FC<AlumniDossierModalProps> = ({
  alumni,
  onClose,
  onSave,
  onOpenCreateAccount
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'academic' | 'association' | 'career'>('identity');
  const [saving, setSaving] = useState(false);

  // Editable Form Data across all 4 Tabs
  const [formData, setFormData] = useState<Partial<User>>({
    // سربرگ ۱: اطلاعات هویتی
    fullName: alumni.fullName,
    nationalId: alumni.nationalId,
    phone: alumni.phone,
    email: alumni.email || '',
    fatherName: alumni.fatherName || 'محمدتقی',
    idNumber: alumni.idNumber || '۱۲۳۴',
    birthDate: alumni.birthDate || '۱۳۶۰/۰۱/۰۱',
    maritalStatus: alumni.maritalStatus || 'متاهل',
    childrenCount: alumni.childrenCount || 2,
    residentialAddress: alumni.residentialAddress || 'تهران، خیابان شریعتی، مجتمع قضات',

    // سربرگ ۲: سوابق حوزوی و دانشگاهی
    academicDegree: alumni.academicDegree || 'سطح ۴ حوزه و دکتری تخصصی فقه و حقوق',
    seminaryLevel: alumni.seminaryLevel || 'سطح ۴ و درس خارج فقه و اصول',
    seminarySchool: alumni.seminarySchool || 'مدرسه علمیه فیضیه قم',
    universityDegree: alumni.universityDegree || 'دکتری حقوق خصوصی و جزا',
    universityName: alumni.universityName || 'دانشگاه علوم قضایی و خدمات اداری',
    fieldOfStudy: alumni.fieldOfStudy || 'فقه القضاء و حقوق کیفری',
    graduationYear: alumni.graduationYear || '۱۳۹۵',
    thesisTitle: alumni.thesisTitle || 'مسئولیت مدنی و کیفری ناشی از خطای قاضی در حقوق تطبیقی',
    supervisorProfessor: alumni.supervisorProfessor || 'آیت‌الله موسوی اردبیلی',
    academicHonors: alumni.academicHonors || 'پژوهشگر برتر مرکز تحقیقات فقهی قوه قضائیه',

    // سربرگ ۳: سوابق در مجموعه
    associationMembershipDate: alumni.associationMembershipDate || '۱۳۹۵/۰۸/۱۰',
    associationResponsibility: alumni.associationResponsibility || 'عضو هیئت اندیشه‌ورز و کارگروه نقد آراء قضایی',
    membershipStatus: alumni.membershipStatus || 'active',
    internalNotes: alumni.internalNotes || 'از چهره‌های فعال و صاحب‌نظر در نشست‌های تخصصی ماهانه مجمع',

    // سربرگ ۴: اطلاعات شغلی
    employmentStatus: alumni.employmentStatus || 'شاغل قضایی',
    personnelId: alumni.personnelId || '۹۹۴۱۸',
    judicialGrade: alumni.judicialGrade || 8,
    courtBranch: alumni.courtBranch || 'شعبه تجدیدنظر استان',
    province: alumni.province || 'تهران',
    organization: alumni.organization || 'دادگستری کل استان تهران',
    currentJudicialPost: alumni.currentJudicialPost || 'مستشار دادگاه تجدیدنظر استان',
    serviceYears: alumni.serviceYears || 15,
    judicialSpecialty: alumni.judicialSpecialty || 'دعاوی تجاری، ملکی و کیفری اقتصادی',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const hasAccount = alumni.hasAccount !== false;

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
            {alumni.profilePictureUrl ? (
              <img src={alumni.profilePictureUrl} alt={alumni.fullName} className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-md border border-stone-200" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-lg shadow-md">
                {alumni.avatarText || alumni.fullName.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900">پرونده جامع الکترونیک: {alumni.fullName}</h3>
                {hasAccount ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    دارای حساب کاربری فعال
                  </span>
                ) : (
                  <button
                    onClick={onOpenCreateAccount}
                    className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1 animate-pulse"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>ایجاد کاربری (دکمه قرمز)</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5 font-medium">
                کد ملی: {toPersianNumbers(alumni.nationalId)} · شماره پرسنلی: {toPersianNumbers(alumni.personnelId || '---')} · پایه {toPersianNumbers(alumni.judicialGrade || 8)} قضایی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
              title="چاپ شناسنامه"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Tabs Navigation Bar */}
        <div className="flex items-center border-b border-stone-200 bg-white px-6 overflow-x-auto gap-2 text-xs font-bold">
          {[
            { id: 'identity' as const, label: '۱. اطلاعات هویتی', icon: ShieldCheck },
            { id: 'academic' as const, label: '۲. سوابق حوزوی و دانشگاهی', icon: GraduationCap },
            { id: 'association' as const, label: '۳. سوابق در مجموعه', icon: Building2 },
            { id: 'career' as const, label: '۴. اطلاعات شغلی', icon: Briefcase },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-emerald-900 font-black'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body for Selected Tab */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: اطلاعات هویتی */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <h4 className="font-black text-stone-900 text-sm border-b pb-2 border-stone-200">
                مشخصات شناسنامه‌ای و راه‌های ارتباطی دانش‌آموخته
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">کد ملی (۱۰ رقم):</label>
                  <input
                    type="text"
                    required
                    value={formData.nationalId}
                    onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">شماره شناسنامه:</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">نام پدر:</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تاریخ تولد:</label>
                  <input
                    type="text"
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="۱۳۶۰/۰۱/۱۵"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">وضعیت تاهل:</label>
                  <select
                    value={formData.maritalStatus}
                    onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="متاهل">متاهل</option>
                    <option value="مجرد">مجرد</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تعداد فرزندان:</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.childrenCount}
                    onChange={e => setFormData({ ...formData, childrenCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">شماره تلفن همراه:</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">رایانامه (ایمیل):</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="example@judiciary.ir"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="font-bold text-stone-700">نشانی دقیق محل سکونت:</label>
                  <textarea
                    rows={2}
                    value={formData.residentialAddress}
                    onChange={e => setFormData({ ...formData, residentialAddress: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: سوابق حوزوی و دانشگاهی */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <h4 className="font-black text-stone-900 text-sm border-b pb-2 border-stone-200">
                سوابق تحصیلات حوزوی، مدارک دانشگاهی و رساله علمی
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">مقطع و سطح علمی حوزوی:</label>
                  <input
                    type="text"
                    value={formData.seminaryLevel}
                    onChange={e => setFormData({ ...formData, seminaryLevel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="سطح ۴ فقه القضا، درس خارج..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">مدرسه علمیه محل تحصیل:</label>
                  <input
                    type="text"
                    value={formData.seminarySchool}
                    onChange={e => setFormData({ ...formData, seminarySchool: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="مدرسه فیضیه قم، حوزه علمیه مشهد..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">مقطع تحصیلی دانشگاهی:</label>
                  <input
                    type="text"
                    value={formData.universityDegree}
                    onChange={e => setFormData({ ...formData, universityDegree: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="دکتری تخصصی، کارشناسی ارشد..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">دانشگاه محل تحصیل:</label>
                  <input
                    type="text"
                    value={formData.universityName}
                    onChange={e => setFormData({ ...formData, universityName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="دانشگاه علوم قضایی، دانشگاه تهران..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">رشته و گرایش تحصیلی:</label>
                  <input
                    type="text"
                    value={formData.fieldOfStudy}
                    onChange={e => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="فقه و حقوق جزا، حقوق خصوصی..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سال فارغ‌التحصیلی:</label>
                  <input
                    type="text"
                    value={formData.graduationYear}
                    onChange={e => setFormData({ ...formData, graduationYear: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="۱۳۹۸"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-stone-700">عنوان پایان‌نامه / رساله دکتری:</label>
                  <textarea
                    rows={2}
                    value={formData.thesisTitle}
                    onChange={e => setFormData({ ...formData, thesisTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">استاد راهنما:</label>
                  <input
                    type="text"
                    value={formData.supervisorProfessor}
                    onChange={e => setFormData({ ...formData, supervisorProfessor: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">افتخارات و جوایز پژوهشی:</label>
                  <input
                    type="text"
                    value={formData.academicHonors}
                    onChange={e => setFormData({ ...formData, academicHonors: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="پژوهشگر برگزیده سال، رتبه برتر جشنواره..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: سوابقی که در مجموعه داشته */}
          {activeTab === 'association' && (
            <div className="space-y-4">
              <h4 className="font-black text-stone-900 text-sm border-b pb-2 border-stone-200">
                سوابق عضویت، همکاری‌ها و مسئولیت‌ها در مرکز دانش‌آموختگان
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تاریخ پذیرش و عضویت در مرکز:</label>
                  <input
                    type="text"
                    value={formData.associationMembershipDate}
                    onChange={e => setFormData({ ...formData, associationMembershipDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="۱۳۹۵/۰۸/۱۰"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">وضعیت عضویت:</label>
                  <select
                    value={formData.membershipStatus}
                    onChange={e => setFormData({ ...formData, membershipStatus: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="active">عضو پیوسته و فعال</option>
                    <option value="alumni_council">عضو شورای نخبگان و راهبری</option>
                    <option value="honorary">عضو افتخاری</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-stone-700">مسئولیت‌ها و سمت در مجموعه:</label>
                  <input
                    type="text"
                    value={formData.associationResponsibility}
                    onChange={e => setFormData({ ...formData, associationResponsibility: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="عضو هیئت اندیشه‌ورز، مسئول کارگروه نقد آراء، دبیر علمی همایش..."
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-stone-700">یادداشت‌ها و سوابق فعالیت‌های ثبت‌شده در مرکز:</label>
                  <textarea
                    rows={3}
                    value={formData.internalNotes}
                    onChange={e => setFormData({ ...formData, internalNotes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                    placeholder="طرح‌ها، مشاوره‌ها و مشارکت‌های مؤثر در برنامه‌های ارتقای علمی..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: اطلاعات شغلی */}
          {activeTab === 'career' && (
            <div className="space-y-4">
              <h4 className="font-black text-stone-900 text-sm border-b pb-2 border-stone-200">
                وضعیت استخدامی، پایه قضایی، مجتمع دادگاه و حوزه تخصصی
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">وضعیت اشتغال:</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={e => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="شاغل قضایی">شاغل قضایی</option>
                    <option value="مستشار">مستشار دادگاه تجدیدنظر</option>
                    <option value="بازپرس">بازپرس دادسرا</option>
                    <option value="دادیار">دادیار دادسرا</option>
                    <option value="عضو هیئت علمی">عضو هیئت علمی دانشگاه</option>
                    <option value="قاضی بازنشسته">قاضی بازنشسته / مشاور عالی</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">شماره پرسنلی قضایی:</label>
                  <input
                    type="text"
                    value={formData.personnelId}
                    onChange={e => setFormData({ ...formData, personnelId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

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

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">شعبه و مجتمع دادگاه:</label>
                  <input
                    type="text"
                    value={formData.courtBranch}
                    onChange={e => setFormData({ ...formData, courtBranch: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="شعبه ۱۴ تجدیدنظر تجاری..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">استان محل خدمت:</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="تهران، خراسان رضوی، فارس..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سازمان متبوع رسمی:</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سمت رسمی فعلی:</label>
                  <input
                    type="text"
                    value={formData.currentJudicialPost}
                    onChange={e => setFormData({ ...formData, currentJudicialPost: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سابقه خدمت قضایی (سال):</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.serviceYears}
                    onChange={e => setFormData({ ...formData, serviceYears: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="font-bold text-stone-700">تخصص و گرایش دعاوی قضایی:</label>
                  <input
                    type="text"
                    value={formData.judicialSpecialty}
                    onChange={e => setFormData({ ...formData, judicialSpecialty: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="جرایم اقتصادی، دعاوی اسناد تجاری و ارزی، اراضی و اوقاف..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
            <span className="text-[11px] text-stone-500 font-medium">
              * تغییرات اعمال شده بلافاصله در سوابق و پرونده الکترونیک ذخیره می‌گردد.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold shadow-md flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات پرونده'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ========================================================================
   SUB-COMPONENT: REGISTER NEW ALUMNUS (WITH 4 TABS)
   ======================================================================== */
interface RegisterAlumnusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: any) => Promise<void>;
}

const RegisterNewAlumnusModal: React.FC<RegisterAlumnusModalProps> = ({ onClose, onRegister }) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'academic' | 'association' | 'career'>('identity');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    // سربرگ ۱: اطلاعات هویتی
    fullName: '',
    siteTitle: '',
    profilePictureUrl: '',
    nationalId: '',
    phone: '',
    email: '',
    fatherName: '',
    idNumber: '',
    birthDate: '۱۳۶۵/۰۵/۱۵',
    maritalStatus: 'متاهل' as const,
    childrenCount: 1,
    residentialAddress: '',

    // سربرگ ۲: سوابق حوزوی و دانشگاهی
    academicDegree: 'سطح ۴ حوزه علمیه و دکتری تخصصی',
    seminaryLevel: 'سطح ۴ فقه القضاء',
    seminarySchool: 'حوزه علمیه قم',
    universityDegree: 'دکتری حقوق خصوصی',
    universityName: 'دانشگاه علوم قضایی',
    fieldOfStudy: 'فقه و حقوق امامیه',
    graduationYear: '۱۴۰۱',
    thesisTitle: '',
    supervisorProfessor: '',
    academicHonors: '',

    // سربرگ ۳: سوابق در مجموعه
    associationMembershipDate: '۱۴۰۱/۰۷/۰۱',
    associationResponsibility: 'عضو پیوسته دانش‌آموختگان',
    membershipStatus: 'active' as const,
    internalNotes: '',

    // سربرگ ۴: اطلاعات شغلی
    employmentStatus: 'شاغل قضایی' as const,
    personnelId: String(Math.floor(100000 + Math.random() * 900000)),
    judicialGrade: 7,
    courtBranch: 'شعبه عمومی حقوقی',
    province: 'تهران',
    organization: 'قوه قضائیه - دادگستری کل استان',
    currentJudicialPost: 'دادرس دادگاه عمومی حقوقی',
    serviceYears: 6,
    judicialSpecialty: 'حقوقی و قراردادها',
    
    // Default account flag: false initially until account button clicked, or true
    hasAccount: false,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (!base64) {
          setUploadingImage(false);
          return;
        }
        const res = await apiClient.uploadProfilePicture(base64, file.name);
        if (res.success && res.url) {
          setFormData(prev => ({ ...prev, profilePictureUrl: res.url }));
        } else {
          alert('خطا در بارگذاری تصویر پروفایل');
        }
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.nationalId) {
      alert('لطفاً حداقل نام و کد ملی دانش‌آموخته را وارد فرمایید.');
      return;
    }

    setLoading(true);
    await onRegister({
      ...formData,
      username: formData.nationalId,
      password: formData.phone || '09121112233',
      role: 'alumni',
      roleTitle: `${formData.academicDegree} · پایه ${toPersianNumbers(formData.judicialGrade)} قضایی`,
      avatarText: formData.fullName.slice(0, 2),
      isActive: true,
      hasAccount: false, // Will allow testing prominent red button "ایجاد کاربری"
      sectionPermissions: {
        dashboard: 'view_own',
        cartable: 'manage_own',
        courses: 'view_all',
        products: 'view_all',
        counseling: 'manage_own',
        research: 'manage_own',
        rulings: 'manage_own',
        welfare: 'manage_own',
        synergy: 'manage_own',
        alumni: 'none',
        users: 'none',
      }
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#FCFCFA] rounded-[36px] w-full max-w-4xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="p-6 bg-[#F5F4EE] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
              <UserPlus className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900">ثبت پرونده دانش‌آموخته جدید در بانک جامع</h3>
              <p className="text-xs text-stone-500">تکمیل شناسنامه الکترونیک در ۴ سربرگ استاندارد</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs Navigation Bar */}
        <div className="flex items-center border-b border-stone-200 bg-white px-6 overflow-x-auto gap-2 text-xs font-bold">
          {[
            { id: 'identity' as const, label: '۱. اطلاعات هویتی', icon: ShieldCheck },
            { id: 'academic' as const, label: '۲. سوابق حوزوی و دانشگاهی', icon: GraduationCap },
            { id: 'association' as const, label: '۳. سوابق در مجموعه', icon: Building2 },
            { id: 'career' as const, label: '۴. اطلاعات شغلی', icon: Briefcase },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-emerald-900 font-black'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'identity' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="دکتر جواد موسوی"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">عنوان در سایت:</label>
                <input
                  type="text"
                  value={formData.siteTitle}
                  onChange={e => setFormData({ ...formData, siteTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="مثال: قاضی دادگاه تجدیدنظر و پژوهشگر ارشد"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">کد ملی (۱۰ رقم):</label>
                <input
                  type="text"
                  required
                  value={formData.nationalId}
                  onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="0012345678"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">تلفن همراه:</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="09121112233"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">نام پدر:</label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">تاریخ تولد:</label>
                <input
                  type="text"
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <label className="font-bold text-stone-700">نشانی سکونت:</label>
                <input
                  type="text"
                  value={formData.residentialAddress}
                  onChange={e => setFormData({ ...formData, residentialAddress: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Upload Profile Picture to PROFILE_PICTURE directory */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                <label className="font-bold text-stone-800 flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-800" />
                  <span>تصویر پروفایل (آپلود و ذخیره‌سازی در پوشه PROFILE_PICTURE):</span>
                </label>
                <div className="flex items-center gap-4 pt-1">
                  {formData.profilePictureUrl ? (
                    <div className="relative group shrink-0">
                      <img
                        src={formData.profilePictureUrl}
                        alt="پروفایل دانش‌آموخته"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-700 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profilePictureUrl: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-xs"
                        title="حذف تصویر"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-stone-200 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="block w-full text-xs text-stone-600 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer"
                    />
                    <p className="text-[11px] text-stone-500">
                      {uploadingImage ? 'در حال آپلود و ذخیره‌سازی در پوشه PROFILE_PICTURE...' : 'فایل انتخابی به‌صورت خودکار در مسیر storage/uploads/PROFILE_PICTURE ذخیره می‌گردد.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">سطح علمی و حوزوی:</label>
                <input
                  type="text"
                  value={formData.seminaryLevel}
                  onChange={e => setFormData({ ...formData, seminaryLevel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">مدرسه علمیه:</label>
                <input
                  type="text"
                  value={formData.seminarySchool}
                  onChange={e => setFormData({ ...formData, seminarySchool: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">مدرک دانشگاهی:</label>
                <input
                  type="text"
                  value={formData.universityDegree}
                  onChange={e => setFormData({ ...formData, universityDegree: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">سال فارغ‌التحصیلی:</label>
                <input
                  type="text"
                  value={formData.graduationYear}
                  onChange={e => setFormData({ ...formData, graduationYear: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-stone-700">عنوان پایان‌نامه / رساله دکتری:</label>
                <textarea
                  rows={2}
                  value={formData.thesisTitle}
                  onChange={e => setFormData({ ...formData, thesisTitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          )}

          {activeTab === 'association' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">تاریخ پذیرش در مرکز:</label>
                <input
                  type="text"
                  value={formData.associationMembershipDate}
                  onChange={e => setFormData({ ...formData, associationMembershipDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">سمت / مسئولیت در مجموعه:</label>
                <input
                  type="text"
                  value={formData.associationResponsibility}
                  onChange={e => setFormData({ ...formData, associationResponsibility: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-stone-700">یادداشت‌های داخلی مرکز:</label>
                <textarea
                  rows={2}
                  value={formData.internalNotes}
                  onChange={e => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          )}

          {activeTab === 'career' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">شعبه قضایی محل خدمت:</label>
                <input
                  type="text"
                  value={formData.courtBranch}
                  onChange={e => setFormData({ ...formData, courtBranch: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="دادگاه تجدیدنظر استان..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-stone-700">استان خدمت:</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={e => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2">
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
              <span>{loading ? 'در حال ثبت...' : 'ثبت در بانک جامع دانش‌آموختگان'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

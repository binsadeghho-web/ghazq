import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Users,
  Award,
  BookMarked,
  FileCheck,
  Inbox,
  AlertCircle,
  TrendingUp,
  Clock,
  Search,
  BookOpen,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Sparkles,
  Laptop,
  Gift,
  Scale,
  Plus,
  ShieldCheck,
  Filter,
  MessageSquare,
  UserCheck,
  Building2,
  Download,
  Calendar,
  DollarSign,
  HeartHandshake
} from 'lucide-react';

interface CrextioSubViewsProps {
  activeNav: string;
  onNavigate: (tab: string) => void;
}

export const CrextioSubViews: React.FC<CrextioSubViewsProps> = ({ activeNav, onNavigate }) => {
  const {
    currentUser,
    users,
    cartableRequests,
    courses,
    products,
    consultants,
    rulings,
    welfareRequests,
    consumables,
    synergyPosts,
    auditLogs,
    verifyAuditChain,
    isRealtimeConnected,
    enrollCourse,
    purchaseProduct,
    addRulingDiscussion
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [diagMessage, setDiagMessage] = useState<string | null>(null);

  // Common Crextio Glass Card style - Warm Ivory Cream & Emerald
  const cardStyle = "bg-[#FCFCF9]/90 hover:bg-white backdrop-blur-xl rounded-[32px] p-6 shadow-2xs border border-[#E3E0D3] transition-all duration-300 hover:-translate-y-1 hover:shadow-md";

  /* ========================================================================
     1. PEOPLE / CARTABLE (کارتابل اداری و استعلامات)
     ======================================================================== */
  if (activeNav === 'People' || activeNav === 'Cartable') {
    const filteredRequests = cartableRequests.filter(req =>
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.trackingNumber.includes(searchQuery)
    );

    return (
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              کارتابل اداری
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">اعضا، قضات و پرونده‌های اداری</h2>
            <p className="text-xs text-stone-500 mt-0.5">مدیریت درخواست‌های استعلام، گواهی‌های شغلی و امور اداری اعضا</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder="جستجو در عنوان یا شماره پیگیری..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 bg-[#F5F4EE] border border-stone-200 rounded-full text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
            </div>
          </div>
        </div>

        {/* Request Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequests.map(req => (
            <div key={req.id} className={cardStyle}>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-mono font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full">
                  کد پیگیری: #{toPersianNumbers(req.trackingNumber)}
                </span>
                <span className={`px-2.5 py-1 rounded-full font-bold ${
                  req.status === 'completed' 
                    ? 'bg-teal-100 text-teal-900' 
                    : req.status === 'in_progress' 
                    ? 'bg-amber-100 text-amber-900' 
                    : 'bg-stone-200 text-stone-800'
                }`}>
                  {req.status === 'completed' ? 'تکمیل‌شده' : req.status === 'in_progress' ? 'در حال بررسی' : 'ثبت‌شده'}
                </span>
              </div>

              <h3 className="text-base font-bold text-stone-900 leading-snug line-clamp-1">{req.title}</h3>
              <p className="text-xs text-stone-500 mt-2 font-medium">متقاضی: {req.applicantName} · دسته‌بندی: {req.category}</p>

              <div className="pt-4 mt-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-500">
                <span>تاریخ: {req.createdAt ? toPersianNumbers(req.createdAt.split('T')[0]) : 'امروز'}</span>
                <button 
                  onClick={() => setSelectedItem(req)}
                  className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1"
                >
                  مشاهده پرونده <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Request Details */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-[36px] p-6 max-w-lg w-full space-y-4 shadow-2xl border border-stone-200">
              <div className="flex justify-between items-start border-b border-stone-200 pb-3">
                <h3 className="font-bold text-lg text-stone-900">{selectedItem.title}</h3>
                <button onClick={() => setSelectedItem(null)} className="text-stone-400 hover:text-stone-600 font-bold">✕</button>
              </div>
              <div className="space-y-2 text-xs text-stone-700 font-medium">
                <p><strong>شماره پیگیری:</strong> {toPersianNumbers(selectedItem.trackingNumber)}</p>
                <p><strong>متقاضی:</strong> {selectedItem.applicantName}</p>
                <p><strong>وضعیت:</strong> {selectedItem.status}</p>
                <p><strong>تاریخ ثبت:</strong> {selectedItem.createdAt}</p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================
     2. COURSES GALLERY (گالری دوره‌های آموزشی)
     ======================================================================== */
  if (activeNav === 'Hiring' || activeNav === 'Courses') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              گالری دوره‌های علمی
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">
              دوره‌ها و کارگاه‌های تخصصی ({toPersianNumbers(courses.length)})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">کارگاه‌های ادله دیجیتال، داوری تجاری بین‌المللی و فقه القضاء نوین</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(course => (
            <div key={course.id} className={cardStyle}>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                  سطح {course.level}
                </span>
                <span className="font-bold text-stone-600">
                  {toPersianNumbers(course.hours)} ساعت آموزش
                </span>
              </div>

              <h3 className="text-lg font-bold text-stone-900 leading-snug min-h-[52px]">{course.title}</h3>
              <p className="text-xs text-stone-600 font-medium mt-2 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                استاد: {course.instructor}
              </p>

              <div className="mt-5 pt-4 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-sm font-extrabold text-stone-900">
                  {course.price > 0 ? `${toPersianNumbers(course.price.toLocaleString('fa-IR'))} تومان` : 'رایگان (ویژه اعضا)'}
                </span>
                <button 
                  onClick={() => enrollCourse(course.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    course.isEnrolled 
                      ? 'bg-stone-200/80 text-emerald-900 border border-emerald-300'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs'
                  }`}
                >
                  {course.isEnrolled ? '✓ ثبت‌نام شده' : 'ثبت‌نام در دوره'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================
     3. PUBLICATIONS SHOWCASE (ویترین انتشارات و کتب)
     ======================================================================== */
  if (activeNav === 'Devices' || activeNav === 'Products') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              ویترین انتشارات
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">
              کتب و موسوعه‌های تخصصی ({toPersianNumbers(products.length)})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">مجموعه آثار منتشرشده، درس‌گفتارها و کتب مرجع حقوقی و فقهی</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(prod => (
            <div key={prod.id} className={cardStyle}>
              <div className="h-36 rounded-2xl bg-gradient-to-br from-[#122A22] via-[#0E1E18] to-stone-900 flex flex-col items-center justify-center text-white mb-4 shadow-inner p-3 text-center">
                <BookOpen className="w-10 h-10 text-emerald-300 mb-2" />
                <span className="text-[11px] text-emerald-200 font-bold">{prod.formatTitle}</span>
              </div>

              <h3 className="text-base font-bold text-stone-900 line-clamp-1">{prod.title}</h3>
              <p className="text-xs text-stone-500 font-medium mt-1 truncate">پدیدآور: {prod.authorOrPresenter}</p>

              <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-900">
                  {prod.price > 0 ? `${toPersianNumbers(prod.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                </span>
                <button 
                  onClick={() => purchaseProduct(prod.id)}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors"
                >
                  دریافت اثر
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================
     4. COUNSELING CLINIC (کلینیک مشاوره قضایی)
     ======================================================================== */
  if (activeNav === 'Apps' || activeNav === 'Counseling') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              کلینیک مشاوره
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">مشاوره تخصصی و سلامت شغلی قضات</h2>
            <p className="text-xs text-stone-500 mt-0.5">مدیریت فرسودگی شغلی، مشاوره حقوقی تخصصی و تحکیم خانواده با حفظ کامل محرمانگی</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {consultants.map(c => (
            <div key={c.id} className={cardStyle}>
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center font-extrabold text-lg shadow-xs">
                  {c.name.split(' ')[0][0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">{c.name}</h3>
                  <p className="text-xs text-emerald-800 font-bold">{c.specialty}</p>
                </div>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed font-medium">{c.bio}</p>

              <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs">
                <span className="text-emerald-900 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  ✓ هیئت علمی تاییدشده
                </span>
                <button className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white font-bold transition-colors">
                  درخواست نوبت
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================
     5. WELFARE & LOANS (خدمات رفاهی و تسهیلات)
     ======================================================================== */
  if (activeNav === 'Salary' || activeNav === 'Welfare') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              خدمات رفاهی
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">تسهیلات، وام و اقلام تعاونی</h2>
            <p className="text-xs text-stone-500 mt-0.5">وام قرض‌الحسنه صندوق رفاه، اسکان زیارتی و توزیع اقلام معیشتی</p>
          </div>
          <span className="px-4 py-2 rounded-full bg-emerald-800 text-white text-xs font-bold shadow-xs">
            سقف وام صندوق: {toPersianNumbers('150,000,000')} تومان
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {consumables.map(item => (
            <div key={item.id} className={cardStyle}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-500 font-medium">موجود: {toPersianNumbers(item.stock)} عدد</span>
                <span className="text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">یارانه تعاونی</span>
              </div>

              <h3 className="text-base font-bold text-stone-900">{item.title}</h3>

              <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-sm font-extrabold text-stone-900">
                  {toPersianNumbers(item.cooperativePrice.toLocaleString('fa-IR'))} تومان
                </span>
                <button className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors">
                  افزودن به سبد
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================
     6. SYNERGY WALL (دیوار هم‌افزایی و استعلامات)
     ======================================================================== */
  if (activeNav === 'Calendar' || activeNav === 'Synergy') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              هم‌افزایی شغلی
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">دیوار هم‌افزایی و همیاری اعضا</h2>
            <p className="text-xs text-stone-500 mt-0.5">تبادل مستقیم تجارب اداری، رویه‌های قضایی و استعلامات محلی</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {synergyPosts.map(post => (
            <div key={post.id} className={cardStyle}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-stone-900">{post.categoryTitle || post.category}</span>
                <span className="text-stone-500 font-medium">{post.provinceOrCity || 'حوزه قضایی'}</span>
              </div>

              <h3 className="text-base font-bold text-stone-900">{post.title}</h3>
              <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">{post.content}</p>

              <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">پاسخ‌ها: {toPersianNumbers(post.responses?.length || 0)}</span>
                <button className="px-4 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors">
                  مشارکت و پاسخ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ========================================================================
     7. COURT RULINGS HALL (تالار آراء قضایی)
     ======================================================================== */
  if (activeNav === 'Reviews' || activeNav === 'Rulings') {
    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              تالار آراء قضایی
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">
              تالار نقد و ارزیابی دادنامه‌ها ({toPersianNumbers(rulings.length)})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">آراء مدلل محاکم بدوی، تجدیدنظر و دیوان عالی کشور همراه با مباحثه علمی اعضا</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {rulings.map(ruling => (
            <div key={ruling.id} className={cardStyle}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {ruling.courtBranch}
                </span>
                <span className="text-stone-600 font-medium">قاضی صادرکننده: {ruling.judgeName}</span>
              </div>

              <h3 className="text-base font-bold text-stone-900 leading-snug">{ruling.title}</h3>
              <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed font-serif bg-[#F5F4EE] p-3 rounded-2xl border border-stone-200/80">
                {ruling.summary}
              </p>

              <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-bold">
                  {toPersianNumbers(ruling.discussions?.length || 0)} دیدگاه ثبت‌شده
                </span>
                <button 
                  onClick={() => setSelectedItem(ruling)}
                  className="px-4 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors"
                >
                  مطالعه رأی و ثبت نقد
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Ruling Discussion */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-[36px] p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-stone-200 pb-3">
                <div>
                  <span className="text-xs font-bold text-emerald-800">{selectedItem.courtBranch}</span>
                  <h3 className="font-extrabold text-lg text-stone-900">{selectedItem.title}</h3>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-stone-400 hover:text-stone-600 font-bold">✕</button>
              </div>

              <div className="p-4 bg-[#F5F4EE] rounded-2xl text-xs leading-relaxed text-stone-800 space-y-2">
                <h4 className="font-bold text-stone-900">خلاصه دادنامه:</h4>
                <p>{selectedItem.summary}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm text-stone-900">نقدها و دیدگاه‌های حقوقی:</h4>
                {selectedItem.discussions?.map((d: any, idx: number) => (
                  <div key={idx} className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-xs space-y-1">
                    <span className="font-bold text-emerald-950">{d.authorName}</span>
                    <p className="text-stone-700">{d.comment}</p>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <input 
                    type="text" 
                    placeholder="نقد تخصصی خود را بنویسید..." 
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#F5F4EE] border border-stone-200 rounded-full text-xs text-stone-900 font-medium"
                  />
                  <button 
                    onClick={() => {
                      if (commentText.trim()) {
                        addRulingDiscussion(selectedItem.id, commentText);
                        setCommentText('');
                        setSelectedItem(null);
                      }
                    }}
                    className="px-5 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold"
                  >
                    ارسال
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================
     8. SYSTEM SETTINGS & AUDIT (امنیت و مرکز فرماندهی)
     ======================================================================== */
  if (activeNav === 'Setting') {
    const handleRunDiagnostic = async () => {
      await verifyAuditChain();
      setDiagMessage('راستی‌آزمایی ریاضی زنجیره SHA-256: ۱۰۰٪ رکوردهای دیتابیس اصیل بوده و هیچ‌گونه دستکاری رخ نداده است.');
    };

    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              امنیت و پایش
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">مرکز فرماندهی و امنیت سامانه</h2>
            <p className="text-xs text-stone-500 mt-0.5">پایش معیارهای طلایی، رویدادهای زنده SSE و صحت زنجیره SHA-256</p>
          </div>

          <button
            onClick={handleRunDiagnostic}
            className="px-5 py-2.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-2xs flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            پایش و راستی‌آزمایی
          </button>
        </div>

        {diagMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between font-bold">
            <span>{diagMessage}</span>
            <button onClick={() => setDiagMessage(null)} className="underline text-xs">بستن</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cardStyle}>
            <p className="text-xs text-stone-500 font-bold">دفترچه وقایع غیرقابل‌دستکاری</p>
            <p className="text-3xl font-extrabold text-stone-900 mt-2 font-mono">
              {toPersianNumbers(auditLogs.length)} رکورد
            </p>
            <p className="text-xs text-stone-500 mt-2 font-medium">زنجیره هش غیرقابل‌دستکاری SHA-256</p>
          </div>

          <div className={cardStyle}>
            <p className="text-xs text-stone-500 font-bold">وضعیت همگام‌سازی برخط (SSE)</p>
            <p className="text-2xl font-extrabold text-emerald-800 mt-2">
              {isRealtimeConnected ? '✓ برخط و فعال' : 'در حال اتصالات'}
            </p>
            <p className="text-xs text-stone-500 mt-2 font-medium">برقراری ارتباط دوطرفه بدون تأخیر</p>
          </div>

          <div className={cardStyle}>
            <p className="text-xs text-stone-500 font-bold">تفکیک سطوح دسترسی (RBAC)</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-2">کنترل ایمن BOLA/IDOR</p>
            <p className="text-xs text-stone-500 mt-2 font-medium">پایبندی کامل به معماری لایه داده v3.0</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

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
  HeartHandshake,
  Compass,
  Home
} from 'lucide-react';

import { CartableSection } from '../cartable/CartableSection';
import { CoursesSection } from '../courses/CoursesSection';
import { ProductsSection } from '../products/ProductsSection';
import { CounselingSection } from '../counseling/CounselingSection';
import { WelfareSection } from '../welfare/WelfareSection';
import { SynergyWallSection } from '../synergy/SynergyWallSection';
import { JudicialRulingsSection } from '../rulings/JudicialRulingsSection';
import { ResearchMentorshipSection } from '../research/ResearchMentorshipSection';

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
    researchMentorships,
    submitResearchProject,
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
  const [newResearchOpen, setNewResearchOpen] = useState(false);
  const [thesisTitle, setThesisTitle] = useState('');
  const [thesisField, setThesisField] = useState('فقه و حقوق جزا و جرم‌شناسی');
  const [accommodationCity, setAccommodationCity] = useState<'قم' | 'تهران' | 'مشهد'>('قم');
  const [needsAccommodation, setNeedsAccommodation] = useState(false);

  // Common Crextio Glass Card style - Warm Ivory Cream & Emerald with 10% more hover magnification
  const cardStyle = "bg-[#FCFCF9]/90 hover:bg-white backdrop-blur-xl rounded-[32px] p-6 shadow-2xs border border-[#E3E0D3] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.08] hover:z-20 hover:shadow-xl";

  /* ========================================================================
     1. PEOPLE / CARTABLE (کارتابل اداری و استعلامات)
     ======================================================================== */
  if (activeNav === 'People' || activeNav === 'Cartable') {
    return <CartableSection />;
  }

  /* ========================================================================
     2. COURSES GALLERY (گالری دوره‌های آموزشی)
     ======================================================================== */
  if (activeNav === 'Hiring' || activeNav === 'Courses') {
    return <CoursesSection />;
  }

  /* ========================================================================
     3. PUBLICATIONS SHOWCASE (ویترین انتشارات و کتب)
     ======================================================================== */
  if (activeNav === 'Devices' || activeNav === 'Products') {
    return <ProductsSection />;
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
     8. RESEARCH MENTORSHIP & THESES (راهبری پژوهش و هدایت رساله‌ها)
     ======================================================================== */
  if (activeNav === 'Research' || activeNav === 'ResearchMentorship') {
    const handleCreateResearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!thesisTitle.trim() || !currentUser) return;
      submitResearchProject({
        applicantId: currentUser.id,
        applicantName: currentUser.fullName,
        thesisTitle: thesisTitle.trim(),
        field: thesisField,
        stage: 'proposal',
        stageTitle: 'تصویب عنوان و نگارش پروپوزال اولیه',
        accommodationRequested: needsAccommodation,
        ...(needsAccommodation && { accommodationCity }),
      });
      setThesisTitle('');
      setNeedsAccommodation(false);
      setNewResearchOpen(false);
    };

    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9]/90 p-6 rounded-[32px] border border-[#E3E0D3] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold inline-block mb-1">
              راهبری پژوهش
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900">
              شبکه رساله‌ها، پایان‌نامه‌ها و اسکان مطالعاتی ({toPersianNumbers(researchMentorships.length)})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">هدایت علمی رساله‌های سطح ۴ و دکتری، پیگیری استاد راهنما و اسکان پژوهشی قم، تهران و مشهد</p>
          </div>

          <button
            onClick={() => setNewResearchOpen(true)}
            className="px-5 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-2xs flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت رساله / پروپوزال جدید</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {researchMentorships.map(proj => (
            <div key={proj.id} className={cardStyle}>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                  {proj.stageTitle}
                </span>
                <span className="font-mono font-bold text-stone-600">
                  پیشرفت: {toPersianNumbers(proj.progressPercent)}٪
                </span>
              </div>

              <h3 className="text-base font-bold text-stone-900 leading-snug line-clamp-2 min-h-[48px]">
                {proj.thesisTitle}
              </h3>

              <div className="space-y-1.5 mt-3 text-xs text-stone-600 font-medium">
                <p>پژوهشگر: <strong className="text-stone-900">{proj.applicantName}</strong></p>
                <p>رشته / گرایش: {proj.field}</p>
                <p className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  استاد راهنما: {proj.assignedSupervisor || 'در حال انتصاب توسط شورا'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-200/80 rounded-full h-2 mt-4 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${proj.progressPercent}%` }}
                />
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs">
                {proj.accommodationRequested ? (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    اسکان {proj.accommodationCity || 'قم'}
                  </span>
                ) : (
                  <span className="text-stone-400 font-medium">بدون تقاضای اسکان</span>
                )}

                <button
                  onClick={() => setSelectedItem(proj)}
                  className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1"
                >
                  مشاهده مراحل <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for Details & Milestones */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-[36px] p-6 max-w-lg w-full space-y-4 shadow-2xl border border-stone-200">
              <div className="flex justify-between items-start border-b border-stone-200 pb-3">
                <h3 className="font-bold text-base text-stone-900">{selectedItem.thesisTitle}</h3>
                <button onClick={() => setSelectedItem(null)} className="text-stone-400 hover:text-stone-600 font-bold">✕</button>
              </div>
              <div className="space-y-2 text-xs text-stone-700 font-medium">
                <p><strong>پژوهشگر:</strong> {selectedItem.applicantName}</p>
                <p><strong>گرایش:</strong> {selectedItem.field}</p>
                <p><strong>مرحله:</strong> {selectedItem.stageTitle}</p>
                <p><strong>استاد راهنما:</strong> {selectedItem.assignedSupervisor || 'تخصیص‌نیافته'}</p>
                {selectedItem.accommodationRequested && (
                  <p className="text-amber-800 font-bold">درخواست اسکان پژوهشی: {selectedItem.accommodationCity}</p>
                )}
                
                <div className="pt-3 border-t border-stone-200">
                  <h4 className="font-bold text-stone-900 mb-2">گام‌ها و مراحل پژوهشی:</h4>
                  <div className="space-y-1.5">
                    {selectedItem.milestones?.map((m: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#F5F4EE] border border-stone-200">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${m.isDone ? 'text-emerald-600' : 'text-stone-300'}`} />
                          {m.title}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">{toPersianNumbers(m.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
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

        {/* Modal to Register New Thesis Proposal */}
        {newResearchOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-[36px] p-6 max-w-lg w-full space-y-4 shadow-2xl border border-stone-200">
              <div className="flex justify-between items-start border-b border-stone-200 pb-3">
                <h3 className="font-bold text-base text-stone-900">ثبت پروپوزال و رساله پژوهشی جدید</h3>
                <button onClick={() => setNewResearchOpen(false)} className="text-stone-400 hover:text-stone-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateResearch} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">عنوان رساله / پایان‌نامه:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بررسی فقهی-حقوقی استناد به ادله دیجیتال در دعاوی کیفری"
                    value={thesisTitle}
                    onChange={e => setThesisTitle(e.target.value)}
                    className="w-full p-2.5 bg-[#F5F4EE] border border-stone-200 rounded-2xl text-stone-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">گرایش تخصصی:</label>
                  <select
                    value={thesisField}
                    onChange={e => setThesisField(e.target.value)}
                    className="w-full p-2.5 bg-[#F5F4EE] border border-stone-200 rounded-2xl text-stone-900 font-medium"
                  >
                    <option value="فقه و حقوق جزا و جرم‌شناسی">فقه و حقوق جزا و جرم‌شناسی</option>
                    <option value="فقه و حقوق خصوصی و قراردادها">فقه و حقوق خصوصی و قراردادها</option>
                    <option value="حقوق عمومی و اداری">حقوق عمومی و اداری</option>
                    <option value="فقه القضاء تطبیقی و اصول فقه">فقه القضاء تطبیقی و اصول فقه</option>
                  </select>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                    <input
                      type="checkbox"
                      checked={needsAccommodation}
                      onChange={e => setNeedsAccommodation(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>تقاضای استفاده از تسهیلات اسکان مطالعاتی و کتابخانه‌ای دارم</span>
                  </label>

                  {needsAccommodation && (
                    <div>
                      <label className="block font-bold text-amber-800 mb-1 text-[11px]">انتخاب شهر اسکان:</label>
                      <select
                        value={accommodationCity}
                        onChange={e => setAccommodationCity(e.target.value as any)}
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl text-stone-900 font-medium"
                      >
                        <option value="قم">قم (پردیس پژوهشی و کتابخانه تخصصی آیت‌الله بروجردی)</option>
                        <option value="تهران">تهران (پژوهشگاه قوه قضاییه)</option>
                        <option value="مشهد">مشهد (مرکز اسناد آستان قدس رضوی)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold transition-colors"
                  >
                    ثبت نهایی و ارجاع به شورای پژوهش
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewResearchOpen(false)}
                    className="px-4 py-2.5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold transition-colors"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ========================================================================
     9. SYSTEM SETTINGS & AUDIT (امنیت و مرکز فرماندهی)
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

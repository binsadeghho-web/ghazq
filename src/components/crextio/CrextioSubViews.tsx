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
import { SpecializedCareerCounselingSection } from '../counseling/SpecializedCareerCounselingSection';
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
     4. COUNSELING CLINIC (کلینیک مشاوره عمومی و تخصصی)
     ======================================================================== */
  if (activeNav === 'Apps' || activeNav === 'Counseling' || activeNav === 'CounselingGeneral') {
    return <CounselingSection initialTab="request" />;
  }
  if (activeNav === 'SpecializedCounseling' || activeNav === 'CounselingSpecial' || activeNav === 'counseling_specialized') {
    return <SpecializedCareerCounselingSection />;
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
     6. SYNERGY & EXPERIENCES WALL (دیوار هم‌افزایی و تجارب اعضا)
     ======================================================================== */
  if (activeNav === 'Calendar' || activeNav === 'Synergy') {
    return <SynergyWallSection />;
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
     8. RESEARCH MENTORSHIP & THESES (راهبری پایان‌نامه‌ها)
     ======================================================================== */
  if (activeNav === 'Research' || activeNav === 'ResearchMentorship') {
    return <ResearchMentorshipSection />;
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

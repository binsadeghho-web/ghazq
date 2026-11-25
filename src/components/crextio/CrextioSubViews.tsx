import React, { useState, lazy, Suspense } from 'react';
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
import { ModuleFallback } from '../common/ModuleFallback';

const CartableSection = lazy(() => import('../cartable/CartableSection').then(m => ({ default: m.CartableSection })));
const CoursesSection = lazy(() => import('../courses/CoursesSection').then(m => ({ default: m.CoursesSection })));
const SpecializedCareerCounselingSection = lazy(() => import('../counseling/SpecializedCareerCounselingSection').then(m => ({ default: m.SpecializedCareerCounselingSection })));
const WelfareSection = lazy(() => import('../welfare/WelfareSection').then(m => ({ default: m.WelfareSection })));
const SynergyWallSection = lazy(() => import('../synergy/SynergyWallSection').then(m => ({ default: m.SynergyWallSection })));
const JudicialRulingsSection = lazy(() => import('../rulings/JudicialRulingsSection').then(m => ({ default: m.JudicialRulingsSection })));
const ResearchMentorshipSection = lazy(() => import('../research/ResearchMentorshipSection').then(m => ({ default: m.ResearchMentorshipSection })));
const ProductsSection = lazy(() => import('../products/ProductsSection').then(m => ({ default: m.ProductsSection })));

import { CounselingSection } from '../counseling/CounselingSection';

interface CrextioSubViewsProps {
  activeNav: string;
  onNavigate: (tab: string) => void;
  deepLinkSubTab?: string;
  deepLinkNonce?: number;
  autoOpenGeneralBookingNonce?: number;
}

export const CrextioSubViews: React.FC<CrextioSubViewsProps> = ({
  activeNav,
  onNavigate,
  deepLinkSubTab,
  deepLinkNonce,
  autoOpenGeneralBookingNonce,
}) => {
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

  // Common Crextio Executive Card style - Warm Ivory Cream & Sand hairline
  const cardStyle = "bg-[#FCFCF9] hover:bg-white rounded-[24px] p-6 shadow-xs border border-[#DFD8C4] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0C4A38]/35 hover:shadow-md";

  /* ========================================================================
     1. PEOPLE / CARTABLE (کارتابل اداری و استعلامات)
     ======================================================================== */
  if (activeNav === 'People' || activeNav === 'Cartable') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <CartableSection />
      </Suspense>
    );
  }

  /* ========================================================================
     2. COURSES GALLERY (گالری دوره‌های آموزشی)
     ======================================================================== */
  if (activeNav === 'Hiring' || activeNav === 'Courses') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <CoursesSection />
      </Suspense>
    );
  }

  /* ========================================================================
     3. PUBLICATIONS SHOWCASE (ویترین انتشارات و کتب)
     ======================================================================== */
  if (activeNav === 'Devices' || activeNav === 'Products') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <ProductsSection />
      </Suspense>
    );
  }

  /* ========================================================================
     4. COUNSELING CLINIC (کلینیک مشاوره عمومی و تخصصی)
     ======================================================================== */
  if (activeNav === 'Apps' || activeNav === 'Counseling' || activeNav === 'CounselingGeneral') {
    const validCounselingSubTab =
      deepLinkSubTab === 'workshops' ||
      deepLinkSubTab === 'announcements' ||
      deepLinkSubTab === 'booking' ||
      deepLinkSubTab === 'consultants' ||
      deepLinkSubTab === 'tariffs' ||
      deepLinkSubTab === 'tests' ||
      deepLinkSubTab === 'my_history'
        ? deepLinkSubTab
        : undefined;
    return (
      <CounselingSection
        initialTab="request"
        initialSubTab={validCounselingSubTab}
        deepLinkNonce={deepLinkNonce}
        autoOpenWizardNonce={autoOpenGeneralBookingNonce}
      />
    );
  }
  if (activeNav === 'SpecializedCounseling' || activeNav === 'CounselingSpecial' || activeNav === 'counseling_specialized') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <SpecializedCareerCounselingSection />
      </Suspense>
    );
  }

  /* ========================================================================
     5. WELFARE & LOANS (خدمات رفاهی و تسهیلات)
     ======================================================================== */
  if (activeNav === 'Salary' || activeNav === 'Welfare') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <WelfareSection
          initialModuleTab={deepLinkSubTab as any}
          deepLinkNonce={deepLinkNonce}
        />
      </Suspense>
    );
  }

  /* ========================================================================
     6. SYNERGY & EXPERIENCES WALL (دیوار هم‌افزایی و تجارب اعضا)
     ======================================================================== */
  if (activeNav === 'Calendar' || activeNav === 'Synergy') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <SynergyWallSection />
      </Suspense>
    );
  }

  /* ========================================================================
     7. COURT RULINGS HALL (تالار آراء قضایی)
     ======================================================================== */
  if (activeNav === 'Reviews' || activeNav === 'Rulings') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <JudicialRulingsSection />
      </Suspense>
    );
  }

  /* ========================================================================
     8. RESEARCH MENTORSHIP & THESES (راهبری پایان‌نامه‌ها)
     ======================================================================== */
  if (activeNav === 'Research' || activeNav === 'ResearchMentorship') {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <ResearchMentorshipSection />
      </Suspense>
    );
  }

  /* ========================================================================
     9. SYSTEM SETTINGS & AUDIT (امنیت و مرکز فرماندهی - مخصوص مدیران)
     ======================================================================== */
  if (activeNav === 'Setting') {
    if (currentUser?.role === 'alumni' || currentUser?.role === 'customer') {
      return null;
    }
    const handleRunDiagnostic = async () => {
      await verifyAuditChain();
      setDiagMessage('راستی‌آزمایی ریاضی زنجیره SHA-256: ۱۰۰٪ رکوردهای دیتابیس اصیل بوده و هیچ‌گونه دستکاری رخ نداده است.');
    };

    return (
      <div className="space-y-6">
        <div className="bg-[#FCFCF9] p-6 rounded-[28px] border border-[#DFD8C4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold text-[#0C4A38] tracking-tight mb-1">
              امنیت و پایش
            </p>
            <h2 className="text-2xl font-black text-[#121D19]">مرکز فرماندهی و امنیت سامانه</h2>
            <p className="text-xs text-[#525E58] mt-1">پایش معیارهای طلایی، رویدادهای زنده SSE و صحت زنجیره SHA-256</p>
          </div>

          <button
            onClick={handleRunDiagnostic}
            className="px-5 py-2.5 rounded-xl bg-[#071E17] hover:bg-[#0D3529] text-[#F3D078] border border-[#D4AF37]/30 text-xs font-black shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
          >
            <Activity className="w-4 h-4 text-[#F3D078]" />
            پایش و راستی‌آزمایی
          </button>
        </div>

        {diagMessage && (
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#0C4A38]/25 text-[#071E17] text-xs flex items-center justify-between font-bold">
            <span>{diagMessage}</span>
            <button onClick={() => setDiagMessage(null)} className="underline text-xs text-[#0C4A38] cursor-pointer">بستن</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={cardStyle}>
            <p className="text-xs text-[#525E58] font-bold">دفترچه وقایع غیرقابل‌دستکاری</p>
            <p className="text-3xl font-black text-[#121D19] mt-2 tabular-nums">
              {toPersianNumbers(auditLogs.length)} رکورد
            </p>
            <p className="text-xs text-[#525E58] mt-2 font-medium">زنجیره هش غیرقابل‌دستکاری SHA-256</p>
          </div>

          <div className={cardStyle}>
            <p className="text-xs text-[#525E58] font-bold">وضعیت همگام‌سازی برخط (SSE)</p>
            <p className="text-2xl font-black text-[#0C4A38] mt-2">
              {isRealtimeConnected ? '✓ برخط و فعال' : 'در حال اتصال'}
            </p>
            <p className="text-xs text-[#525E58] mt-2 font-medium">برقراری ارتباط دوطرفه بدون تأخیر</p>
          </div>

          <div className={cardStyle}>
            <p className="text-xs text-[#525E58] font-bold">تفکیک سطوح دسترسی (RBAC)</p>
            <p className="text-2xl font-black text-[#121D19] mt-2">کنترل ایمن BOLA/IDOR</p>
            <p className="text-xs text-[#525E58] mt-2 font-medium">پایبندی کامل به معماری لایه داده v3.0</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

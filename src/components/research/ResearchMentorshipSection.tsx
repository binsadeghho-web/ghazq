import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  ShieldCheck,
  Info,
  Settings,
  Layers,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ResearchMentorship } from '../../types';
import { ResearchLandingHero } from './subcomponents/ResearchLandingHero';
import { ResearchGuidanceModal } from './subcomponents/ResearchGuidanceModal';
import { ResearchWizardModal } from './subcomponents/ResearchWizardModal';
import { ResearchUserRequestsPanel } from './subcomponents/ResearchUserRequestsPanel';
import { ResearchAdminReviewPanel } from './subcomponents/ResearchAdminReviewPanel';
import { ResearchConfigEditorModal } from './subcomponents/ResearchConfigEditorModal';
import { getResearchStatusMeta } from './subcomponents/researchUiHelpers';

export const ResearchMentorshipSection: React.FC = () => {
  const {
    currentUser,
    crextioConfig,
    researchMentorships,
    researchPortalConfig,
    updateResearchPortalConfig,
    submitResearchProject,
    updateResearchProject,
    updateResearchStatus,
    addResearchMessage,
    deleteResearchProject,
  } = useApp();

  const isOfficial =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'alumni_manager' ||
    currentUser?.role === 'research_deputy' ||
    currentUser?.role === 'supervisor';

  const [activeTab, setActiveTab] = useState<'overview' | 'my_requests' | 'admin_control'>('overview');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ResearchMentorship | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [configEditorOpen, setConfigEditorOpen] = useState(false);

  const myRequests = researchMentorships.filter(r => r.applicantId === currentUser?.id);
  const pendingOrReviewCount = researchMentorships.filter(r => {
    const key = getResearchStatusMeta(r.status).key;
    return key === 'pending' || key === 'in_review';
  }).length;

  const handleOpenNewWizard = () => {
    setEditingRequest(null);
    setWizardOpen(true);
  };

  const handleOpenEditWizard = (req: ResearchMentorship) => {
    setEditingRequest(req);
    setWizardOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* MOBILE LUXURY RESEARCH HEADER (< sm) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sm:hidden relative rounded-[26px] overflow-hidden bg-gradient-to-br from-[#071E17] via-[#0B2A20] to-[#113D30] text-white p-4 shadow-xl border border-[#F3D078]/25"
      >
        <div className="absolute inset-0 luxury-lattice-bg opacity-45 pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F3D078]/70 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-[#F3D078]">
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>معاونت پژوهش مرکز فقه و حقوق اسلامی</span>
              </div>
              <h1 className="text-base font-black text-white mt-0.5 tracking-tight">
                {researchPortalConfig.sectionTitle}
              </h1>
            </div>
            {isOfficial && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setConfigEditorOpen(true)}
                className="p-2 rounded-xl bg-white/10 border border-[#F3D078]/30 text-[#F3D078] cursor-pointer shrink-0"
                title="تنظیمات بخش"
              >
                <Settings className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenNewWizard}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-gradient-to-l from-[#D4AF37] to-[#F3D078] text-[#071E17] text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{researchPortalConfig.ctaButtonLabel || 'ثبت درخواست راهبری'}</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => setGuidanceOpen(true)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Info className="w-4 h-4 text-[#F3D078]" />
              <span>توضیحات</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* DESKTOP Top Section Header */}
      <div className="hidden sm:flex glass-card rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/10 flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Compass className="w-4 h-4 shrink-0" />
            <span>خدمات پژوهشی مرکز فقه و حقوق اسلامی</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-slate-400">سطح ۳، سطح ۴، کارشناسی ارشد و دکتری</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {researchPortalConfig.sectionTitle}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {researchPortalConfig.sectionSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setGuidanceOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-4 h-4 text-amber-500" />
            <span>توضیحات</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewWizard}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{researchPortalConfig.ctaButtonLabel || 'ثبت درخواست راهبری'}</span>
          </button>

          {isOfficial && (
            <button
              type="button"
              onClick={() => setConfigEditorOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>تنظیمات بخش</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900/80 sm:glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto scrollbar-none shadow-xs sm:shadow-none">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 sm:px-4 min-h-[40px] py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#071E17] sm:bg-white sm:dark:bg-slate-800 text-[#F3D078] sm:text-slate-900 sm:dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-500" />
          <span>معرفی و ثبت درخواست</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('my_requests')}
          className={`px-3.5 sm:px-4 min-h-[40px] py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_requests'
              ? 'bg-[#071E17] sm:bg-white sm:dark:bg-slate-800 text-[#F3D078] sm:text-slate-900 sm:dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>پیگیری درخواست‌ها ({myRequests.length})</span>
        </motion.button>

        {isOfficial && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('admin_control')}
            className={`px-3.5 sm:px-4 min-h-[40px] py-2 rounded-xl font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'admin_control'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>کارتابل مدیریت ({pendingOrReviewCount} فعال)</span>
          </motion.button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ResearchLandingHero
          config={researchPortalConfig}
          imageOverrides={crextioConfig.showcaseImageOverrides}
          onStartWizard={handleOpenNewWizard}
          onOpenGuidance={() => setGuidanceOpen(true)}
          onViewMyRequests={() => setActiveTab('my_requests')}
          myRequestsCount={myRequests.length}
        />
      )}

      {activeTab === 'my_requests' && (
        <ResearchUserRequestsPanel
          requests={myRequests}
          onStartNew={handleOpenNewWizard}
          onEditPending={handleOpenEditWizard}
          onDeletePending={deleteResearchProject}
          onSendMessage={addResearchMessage}
          onOpenGuidance={() => setGuidanceOpen(true)}
        />
      )}

      {activeTab === 'admin_control' && isOfficial && (
        <ResearchAdminReviewPanel
          requests={researchMentorships}
          onUpdateStatus={updateResearchStatus}
          onSendMessage={addResearchMessage}
          onDeleteRequest={deleteResearchProject}
          onOpenConfigEditor={() => setConfigEditorOpen(true)}
        />
      )}

      {/* Interactive Modals */}
      <ResearchWizardModal
        isOpen={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          setEditingRequest(null);
        }}
        config={researchPortalConfig}
        currentUser={currentUser}
        editingRequest={editingRequest}
        onOpenGuidance={() => setGuidanceOpen(true)}
        onSubmitNew={submitResearchProject}
        onSubmitEdit={updateResearchProject}
        onDoneSuccess={() => {
          setWizardOpen(false);
          setEditingRequest(null);
          setActiveTab('my_requests');
        }}
      />

      <ResearchGuidanceModal
        isOpen={guidanceOpen}
        onClose={() => setGuidanceOpen(false)}
        config={researchPortalConfig}
      />

      {isOfficial && (
        <ResearchConfigEditorModal
          isOpen={configEditorOpen}
          onClose={() => setConfigEditorOpen(false)}
          config={researchPortalConfig}
          onSaveConfig={updateResearchPortalConfig}
        />
      )}
    </div>
  );
};

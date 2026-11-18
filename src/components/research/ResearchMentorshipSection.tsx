import React, { useState } from 'react';
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
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
      <div className="flex items-center gap-1.5 p-1.5 glass-panel rounded-2xl border border-slate-200/90 dark:border-white/10 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-500" />
          <span>معرفی خدمات و ثبت درخواست</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_requests')}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_requests'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>پیگیری درخواست‌ها و گفت‌وگو ({myRequests.length})</span>
        </button>

        {isOfficial && (
          <button
            type="button"
            onClick={() => setActiveTab('admin_control')}
            className={`px-4 py-2.5 rounded-xl font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'admin_control'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مدیریت و کارتابل درخواست‌ها ({pendingOrReviewCount} فعال)</span>
          </button>
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

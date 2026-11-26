import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CrextioDashboardConfig } from '../../types';
import { Theme3StudioPanel, Theme3StudioTab } from './Theme3StudioPanel';
import { CheckCircle2, Sliders, Sparkles, X } from 'lucide-react';

interface Theme3StudioDrawerProps {
  isOpen: boolean;
  initialTab?: Theme3StudioTab;
  onClose: () => void;
  onOpenAdvancedModal?: () => void;
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
}

export const Theme3StudioDrawer: React.FC<Theme3StudioDrawerProps> = ({
  isOpen,
  initialTab = 'layout',
  onClose,
  onOpenAdvancedModal,
  crextioConfig,
  updateCrextioConfig,
}) => {
  const [activeTab, setActiveTab] = useState<Theme3StudioTab>(initialTab);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const commit = (updates: Partial<CrextioDashboardConfig>) => {
    updateCrextioConfig(updates);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
          dir="rtl"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl h-[100dvh] bg-[#FAF8F2] text-stone-900 shadow-2xl border-r border-[#DFD8C4] flex flex-col overflow-hidden"
          >
            {/* Header Bar */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#071E17] text-white flex items-center justify-between gap-3 shrink-0 border-b border-[#F3D078]/25">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#F3D078]/15 text-[#F3D078] border border-[#F3D078]/35 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-black truncate">
                    استودیو تنظیمات اختصاصی تم ۳ (لپ‌تاپ)
                  </h2>
                  <p className="text-[11px] text-emerald-100/75 truncate">
                    تغییرات به‌صورت زنده اعمال و در پایگاه داده ذخیره می‌شوند (کاملاً مستقل از موبایل و تم ۲)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {savedToast && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ذخیره شد</span>
                  </span>
                )}
                {onOpenAdvancedModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdvancedModal();
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F3D078] border border-[#F3D078]/30 text-[11px] font-bold cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>افتخارات و تنظیمات پایه</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="بستن"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-stone-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <Theme3StudioPanel
                crextioConfig={crextioConfig}
                commit={commit}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

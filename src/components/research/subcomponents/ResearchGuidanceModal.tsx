import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, Phone, Clock, MapPin, MessageSquare } from 'lucide-react';
import { ResearchPortalConfig } from '../../../types';

interface ResearchGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ResearchPortalConfig;
}

export const ResearchGuidanceModal: React.FC<ResearchGuidanceModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="research-guidance-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="research-guidance-title" className="text-base font-black text-slate-900 dark:text-white">
                    {config.guidanceNotesTitle || 'توضیحات و راهنمای راهبری پژوهش'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {config.sectionTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                aria-label="بستن توضیحات"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2.5">
              {(config.guidanceNotesBody || '').split('\n').filter(Boolean).map((line, idx) => (
                <p key={idx} className="text-xs sm:text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {line}
                </p>
              ))}
            </div>

            {/* Contact Reference Strip inside Guidance */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5 text-xs">
              <div className="font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{config.contactCenterTitle}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono tabular-nums font-bold">{config.contactPhone}</span>
                  {config.contactExtension && (
                    <span className="text-slate-500 dark:text-slate-400">({config.contactExtension})</span>
                  )}
                </div>
                {config.contactMobileOrMessenger && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{config.contactMobileOrMessenger}</span>
                  </div>
                )}
                {config.contactHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{config.contactHours}</span>
                  </div>
                )}
                {config.contactAddress && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{config.contactAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-black transition-colors cursor-pointer"
              >
                متوجه شدم
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

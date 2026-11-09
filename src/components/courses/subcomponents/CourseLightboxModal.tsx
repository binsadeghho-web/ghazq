import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Download, X } from 'lucide-react';

interface CourseLightboxModalProps {
  image: { url: string; title: string; subtitle?: string } | null;
  onClose: () => void;
}

export const CourseLightboxModal: React.FC<CourseLightboxModalProps> = ({
  image,
  onClose,
}) => {
  if (!image) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          {/* Lightbox Controls Top Bar */}
          <div className="w-full flex items-center justify-between p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white mb-2 border border-white/10 text-xs font-bold">
            <div className="flex items-center gap-2 truncate">
              <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{image.title}</span>
              {image.subtitle && (
                <span className="text-slate-400 font-normal hidden sm:inline">({image.subtitle})</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={image.url}
                target="_blank"
                rel="noreferrer"
                download
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="دانلود یا باز کردن در زبانه جدید"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                title="بستن پنجره"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Full Image */}
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center max-h-[80vh]">
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-contain max-h-[78vh]"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

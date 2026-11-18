import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../../services/apiClient';
import { Image as ImageIcon, Download, X, Loader2 } from 'lucide-react';

interface CourseLightboxModalProps {
  image: { url: string; title: string; subtitle?: string } | null;
  onClose: () => void;
}

export const CourseLightboxModal: React.FC<CourseLightboxModalProps> = ({
  image,
  onClose,
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!image?.url) {
      setResolvedUrl('');
      return;
    }

    if (image.url.startsWith('/api/storage/private/')) {
      setLoading(true);
      api
        .fetchPrivateFileBlob(image.url)
        .then(res => {
          if (!active) return;
          objectUrl = URL.createObjectURL(res.blob);
          setResolvedUrl(objectUrl);
        })
        .catch(() => {
          if (active) setResolvedUrl('');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      setResolvedUrl(image.url);
    }

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

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
              {resolvedUrl && (
                <a
                  href={resolvedUrl}
                  download={image.title || 'course-image'}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="دانلود تصویر"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}
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
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center min-h-[260px] max-h-[80vh]">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            ) : resolvedUrl ? (
              <img
                src={resolvedUrl}
                alt={image.title}
                className="w-full h-full object-contain max-h-[78vh]"
              />
            ) : (
              <span className="text-xs text-slate-400">امکان نمایش تصویر وجود ندارد.</span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

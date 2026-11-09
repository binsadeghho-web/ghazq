import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ProductLightboxModalProps {
  image: { url: string; title: string; subtitle?: string } | null;
  onClose: () => void;
}

export const ProductLightboxModal: React.FC<ProductLightboxModalProps> = ({
  image,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {image && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between p-3 bg-black/60 rounded-2xl text-white mb-2 text-xs font-bold">
              <span className="truncate">{image.title}</span>
              <button
                onClick={onClose}
                className="p-1 rounded-xl bg-white/10 hover:bg-rose-500 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[80vh]">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-contain max-h-[78vh]"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useRef } from 'react';
import { CrextioDashboardConfig } from '../../../types';
import { api } from '../../../services/apiClient';
import {
  SHOWCASE_IMAGE_LABELS,
  resolveShowcaseImageUrl,
} from '../../../data/showcaseImages';
import { Image as ImageIcon, Upload, RotateCcw, Loader2 } from 'lucide-react';

interface ShowcaseImagesStudioPanelProps {
  crextioConfig: CrextioDashboardConfig;
  updateCrextioConfig: (updates: Partial<CrextioDashboardConfig>) => void;
  triggerSuccess?: () => void;
}

export const ShowcaseImagesStudioPanel: React.FC<ShowcaseImagesStudioPanelProps> = ({
  crextioConfig,
  updateCrextioConfig,
  triggerSuccess,
}) => {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetKeyRef = useRef<string | null>(null);

  const overrides = crextioConfig.showcaseImageOverrides || {};

  const setImageForKey = (key: string, url?: string) => {
    const nextOverrides = { ...overrides };
    if (!url) {
      delete nextOverrides[key];
    } else {
      nextOverrides[key] = url;
    }

    const extra: Partial<CrextioDashboardConfig> = {};
    if (key === 'research_promo') {
      extra.researchPromoBgImage = url || '';
    } else if (key === 'rulings_showcase') {
      extra.rulingsShowcaseBgImage = url || '';
    }

    updateCrextioConfig({
      showcaseImageOverrides: nextOverrides,
      ...extra,
    });
    triggerSuccess?.();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = targetKeyRef.current;
    if (!file || !key) return;
    setUploadingKey(key);
    try {
      const res = await api.uploadFile(file, 'misc');
      if (res?.url) {
        setImageForKey(key, res.url);
      }
    } catch (err: any) {
      alert(`خطا در آپلود تصویر: ${err.message || 'خطای سرور'}`);
    } finally {
      setUploadingKey(null);
      targetKeyRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 rounded-3xl bg-stone-50 border border-stone-200 space-y-3" dir="rtl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-800" />
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
              مدیریت متمرکز تصاویر تمام ویترین‌های سایت
            </h4>
            <p className="text-[11px] text-stone-500">
              تغییر و آپلود اختصاصی تصویر برای تک‌تک ویترین‌ها (بنر خوش‌آمد، نمایشگاه جامع، آراء، پژوهش، دوره‌ها، مشاوره، رفاهیات، کتب و...)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SHOWCASE_IMAGE_LABELS.map(item => {
          const currentUrl =
            item.key === 'research_promo'
              ? crextioConfig.researchPromoBgImage || resolveShowcaseImageUrl(item.key, overrides)
              : item.key === 'rulings_showcase'
              ? crextioConfig.rulingsShowcaseBgImage || resolveShowcaseImageUrl(item.key, overrides)
              : resolveShowcaseImageUrl(item.key, overrides);
          const hasOverride = Boolean(overrides[item.key]);

          return (
            <div
              key={item.key}
              className="p-3 rounded-2xl bg-white border border-stone-200 flex items-start gap-3"
            >
              <div className="w-20 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                {currentUrl && (
                  <img
                    src={currentUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <div className="text-xs font-black text-stone-900 truncate">{item.title}</div>
                  <div className="text-[10px] text-stone-500 line-clamp-1">{item.desc}</div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={uploadingKey === item.key}
                    onClick={() => {
                      targetKeyRef.current = item.key;
                      fileInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingKey === item.key ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    <span>آپلود عکس</span>
                  </button>

                  {hasOverride && (
                    <button
                      type="button"
                      onClick={() => setImageForKey(item.key, undefined)}
                      className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>پیش‌فرض</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

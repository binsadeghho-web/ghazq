import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Sliders,
  X,
  RotateCcw,
  Check,
  Eye,
  Type,
  BarChart3,
  Layers,
  Sparkles,
  ShieldCheck,
  Save
} from 'lucide-react';

interface MizanStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MizanStudioModal: React.FC<MizanStudioModalProps> = ({ isOpen, onClose }) => {
  const { mizanConfig, updateMizanConfig, resetMizanConfig } = useApp();
  const [activeTab, setActiveTab] = useState<'hero' | 'impact' | 'visibility'>('hero');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = (field: keyof typeof mizanConfig, value: any) => {
    updateMizanConfig({ [field]: value });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl border border-[#D5E5DE] shadow-2xl max-w-2xl w-full overflow-hidden text-right flex flex-col max-h-[85vh]"
        dir="rtl"
      >
        {/* هدر مودال استودیو */}
        <div className="p-6 bg-gradient-to-r from-[#011C11] to-[#073424] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DBB155]/20 border border-[#DBB155]/30 flex items-center justify-center text-[#DBB155]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>استودیو سفارشی‌سازی تم ۳ «میزان»</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#DBB155]/20 text-[#DBB155]">
                  پنل مدیریت
                </span>
              </h3>
              <p className="text-xs text-[#99C5B4] mt-0.5">
                تنظیم برخط متون هدر، آمار استنادی ویترین تأثیر و کنترل ماژول‌های فعال
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* نوار تب‌های استودیو */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#E5EFEA] bg-[#FAFDFB] shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('hero')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'hero'
                ? 'border-[#158561] text-[#158561]'
                : 'border-transparent text-[#628778] hover:text-[#0D3829]'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>متون سربرگ جزیره مرکب (Hero)</span>
          </button>

          <button
            onClick={() => setActiveTab('impact')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'impact'
                ? 'border-[#158561] text-[#158561]'
                : 'border-transparent text-[#628778] hover:text-[#0D3829]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>آمار ویترین تأثیر (Our Impact)</span>
          </button>

          <button
            onClick={() => setActiveTab('visibility')}
            className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'visibility'
                ? 'border-[#158561] text-[#158561]'
                : 'border-transparent text-[#628778] hover:text-[#0D3829]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>نمایش یا مخفی‌سازی بخش‌ها</span>
          </button>
        </div>

        {/* محتوای تب‌ها (اسکرول‌شونده) */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#2C5747]">
          {activeTab === 'hero' && (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-[#0D3829] mb-1.5">نشان و برچسب هدر (Seal Badge)</label>
                <input
                  type="text"
                  value={mizanConfig.heroSealBadge || ''}
                  onChange={e => handleUpdate('heroSealBadge', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0DFD9] bg-white text-xs focus:ring-2 focus:ring-[#158561] focus:outline-none"
                  placeholder="مثال: پرتال رسمی ارتباطی، اداری، پژوهشی و رفاهی قضات"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0D3829] mb-1.5">عنوان اصلی سامانه در هدر</label>
                <input
                  type="text"
                  value={mizanConfig.heroTitle || ''}
                  onChange={e => handleUpdate('heroTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0DFD9] bg-white text-xs focus:ring-2 focus:ring-[#158561] focus:outline-none"
                  placeholder="مثال: مجمع دانش‌آموختگان فقه و حقوق قضایی"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0D3829] mb-1.5">زیرعنوان و شعار هدر</label>
                <textarea
                  rows={2}
                  value={mizanConfig.heroSubtitle || ''}
                  onChange={e => handleUpdate('heroSubtitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0DFD9] bg-white text-xs focus:ring-2 focus:ring-[#158561] focus:outline-none"
                  placeholder="توضیح کوتاه درباره ماهیت پرتال و خدمات ارائه شده"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0D3829] mb-1.5">پیام خیرمقدم پیش‌فرض</label>
                <input
                  type="text"
                  value={mizanConfig.heroGreeting || ''}
                  onChange={e => handleUpdate('heroGreeting', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D0DFD9] bg-white text-xs focus:ring-2 focus:ring-[#158561] focus:outline-none"
                  placeholder="مثال: درود بر شما، جناب قاضی محترم"
                />
              </div>
            </div>
          )}

          {activeTab === 'impact' && (
            <div className="space-y-5">
              <p className="text-[11px] text-[#557B6C] bg-[#F2F8F5] p-3 rounded-xl border border-[#DEEBE5]">
                مطابق استانداردهای شفافیت طرح میزان، هر کارت آماری علاوه بر عدد باید دارای <strong>منبع مستند رسمی و تاریخ راستی‌آزمایی</strong> باشد.
              </p>

              {/* کارت ۱: دانش‌آموختگان */}
              <div className="p-4 rounded-2xl border border-[#E3ECE8] bg-[#FAFDFB] space-y-3">
                <h4 className="font-bold text-[#0D3829] text-xs">۱. آمار دانش‌آموختگان و قضات عضو</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1">تعداد نمایش داده‌شده</label>
                    <input
                      type="text"
                      value={mizanConfig.impactAlumniCount || ''}
                      onChange={e => handleUpdate('impactAlumniCount', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="۱,۰۴۲"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">منبع استناد رسمی</label>
                    <input
                      type="text"
                      value={mizanConfig.impactAlumniSource || ''}
                      onChange={e => handleUpdate('impactAlumniSource', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="دبیرخانه مجمع - آبان ۱۴۰۳"
                    />
                  </div>
                </div>
              </div>

              {/* کارت ۲: دوره‌ها */}
              <div className="p-4 rounded-2xl border border-[#E3ECE8] bg-[#FAFDFB] space-y-3">
                <h4 className="font-bold text-[#0D3829] text-xs">۲. آمار دوره‌ها و کارگاه‌های عالی</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1">تعداد نمایش داده‌شده</label>
                    <input
                      type="text"
                      value={mizanConfig.impactCoursesCount || ''}
                      onChange={e => handleUpdate('impactCoursesCount', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="۴۸"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">منبع استناد رسمی</label>
                    <input
                      type="text"
                      value={mizanConfig.impactCoursesSource || ''}
                      onChange={e => handleUpdate('impactCoursesSource', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="معاونت آموزش‌های تخصصی و کاربردی"
                    />
                  </div>
                </div>
              </div>

              {/* کارت ۳: دادنامه‌ها */}
              <div className="p-4 rounded-2xl border border-[#E3ECE8] bg-[#FAFDFB] space-y-3">
                <h4 className="font-bold text-[#0D3829] text-xs">۳. آمار دادنامه‌های بررسی و نقدشده</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1">تعداد نمایش داده‌شده</label>
                    <input
                      type="text"
                      value={mizanConfig.impactRulingsCount || ''}
                      onChange={e => handleUpdate('impactRulingsCount', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="۳۲۰"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">منبع استناد رسمی</label>
                    <input
                      type="text"
                      value={mizanConfig.impactRulingsSource || ''}
                      onChange={e => handleUpdate('impactRulingsSource', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="کمیسیون علمی نقد و داوری احکام"
                    />
                  </div>
                </div>
              </div>

              {/* کارت ۴: رضایت‌مندی */}
              <div className="p-4 rounded-2xl border border-[#E3ECE8] bg-[#FAFDFB] space-y-3">
                <h4 className="font-bold text-[#0D3829] text-xs">۴. درصد رضایت‌مندی اعضا</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1">درصد رضایت</label>
                    <input
                      type="text"
                      value={mizanConfig.impactSatisfactionRate || ''}
                      onChange={e => handleUpdate('impactSatisfactionRate', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="۹۹.۴٪"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1">منبع استناد رسمی</label>
                    <input
                      type="text"
                      value={mizanConfig.impactSatisfactionSource || ''}
                      onChange={e => handleUpdate('impactSatisfactionSource', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#D0DFD9] bg-white text-xs"
                      placeholder="نظرسنجی ادواری خدمات و بازخورد اعضا"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="space-y-3">
              {[
                { key: 'showHeroSeal', label: 'جزیره سربرگ مرکب و مهر هویتی (Hero)', desc: 'نمایش کارت رتبه قضایی، وضعیت مدارک و تراز اقدامات فوری' },
                { key: 'showStoriesSlider', label: 'اسلایدر رویدادها، وبینارها و فراخوان‌ها', desc: 'نمایش کارگاه‌های برخط و رویدادهای زنده با قابلیت ثبت‌نام' },
                { key: 'showBentoGrid', label: 'شبکه هوشمند خدمات ۸‌گانه (Bento Grid)', desc: 'دسترسی سریع به ماژول‌های پرکاربرد سامانه' },
                { key: 'showRulingsShelf', label: 'ویترین منتخب دادنامه‌ها و تالار نقد آراء', desc: 'نمایش خلاصه آخرین دادنامه‌های محاکم و نقد قضات' },
                { key: 'showImpactSection', label: 'بخش ویترین تأثیر و شاخص‌های آماری مستند', desc: 'نمایش کارت‌های آماری شفاف با قابلیت رهگیری منابع' }
              ].map(item => {
                const isChecked = (mizanConfig as any)[item.key] !== false;
                return (
                  <div
                    key={item.key}
                    onClick={() => handleUpdate(item.key as any, !isChecked)}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-[#E3ECE8] bg-[#FAFDFB] hover:bg-[#F2F8F5] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0D3829]">{item.label}</div>
                      <div className="text-[11px] text-[#698F81]">{item.desc}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-[#158561] border-[#158561] text-white'
                          : 'border-[#CADBD3] bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* فوتر مودال */}
        <div className="p-4 px-6 bg-[#FAFDFB] border-t border-[#E5EFEA] flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (window.confirm('آیا مایل به بازنشانی کلیه تنظیمات تم میزان به حالت پیش‌فرض هستید؟')) {
                resetMizanConfig();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-[#9E3E28] hover:text-[#7A2A17] font-semibold px-3 py-2 rounded-xl hover:bg-[#FDF2F0] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-[11px] text-[#158561] font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>ذخیره شد</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#158561] hover:bg-[#0E6A4C] shadow-md hover:shadow-lg transition-all"
            >
              بستن و اعمال
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

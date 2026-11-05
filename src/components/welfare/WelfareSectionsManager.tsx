import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WelfareSectionConfig } from '../../types/welfare';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Layers,
  CreditCard,
  Home,
  ShoppingBag,
  Heart,
  Gift,
  Building2,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Sliders,
  Eye,
  EyeOff,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CreditCard,
  Home,
  ShoppingBag,
  Heart,
  Gift,
  Building2,
  ShieldCheck,
};

export const WelfareSectionsManager: React.FC = () => {
  const { welfareSectionsConfig, updateWelfareSectionsConfig } = useApp();
  const [sections, setSections] = useState<WelfareSectionConfig[]>(welfareSectionsConfig);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WelfareSectionConfig>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New section modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSection, setNewSection] = useState<Partial<WelfareSectionConfig>>({
    title: '',
    subtitle: '',
    icon: 'Gift',
    badge: 'طرح جدید',
    isEnabled: true,
    description: '',
  });

  const handleToggle = (id: string) => {
    const updated = sections.map(s => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
    setSections(updated);
    updateWelfareSectionsConfig(updated);
    triggerSuccess();
  };

  const handleStartEdit = (section: WelfareSectionConfig) => {
    setEditingSectionId(section.id);
    setEditForm({ ...section });
  };

  const handleSaveEdit = () => {
    if (!editingSectionId) return;
    const updated = sections.map(s => (s.id === editingSectionId ? { ...s, ...editForm } as WelfareSectionConfig : s));
    setSections(updated);
    updateWelfareSectionsConfig(updated);
    setEditingSectionId(null);
    triggerSuccess();
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSection.title) return;
    const item: WelfareSectionConfig = {
      id: `welf_sec_${Date.now()}`,
      title: newSection.title,
      subtitle: newSection.subtitle || 'تسهیلات ویژه اعضا',
      icon: newSection.icon || 'Gift',
      badge: newSection.badge || 'ویژه',
      isEnabled: true,
      displayOrder: sections.length + 1,
      description: newSection.description || '',
    };
    const updated = [...sections, item];
    setSections(updated);
    updateWelfareSectionsConfig(updated);
    setIsAddOpen(false);
    setNewSection({ title: '', subtitle: '', icon: 'Gift', badge: 'طرح جدید', isEnabled: true, description: '' });
    triggerSuccess();
  };

  const handleDeleteCustom = (id: string) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    updateWelfareSectionsConfig(updated);
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-teal-950 to-stone-900 text-white shadow-md border border-teal-800/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="font-black text-base">تقسیم‌بندی و مدیریت بخش‌های متنوع رفاهیات</h3>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            فعال/غیرفعال‌سازی نمایش بخش‌های مالی، اسکان، اقلام تعاونی یا افزودن دسته‌بندی‌های جدید به همراه ویرایش عناوین
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              تغییرات ذخیره شد
            </span>
          )}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن بخش رفاهی جدید</span>
          </button>
        </div>
      </div>

      {/* Sections Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(sec => {
          const IconComponent = ICON_MAP[sec.icon] || Gift;
          const isEditing = editingSectionId === sec.id;

          return (
            <div
              key={sec.id}
              className={`rounded-2xl p-5 border transition-all ${
                sec.isEnabled
                  ? 'bg-white border-stone-200/90 shadow-2xs hover:border-teal-500/40'
                  : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <span className="text-xs font-black text-teal-800">ویرایش مشخصات بخش رفاهی</span>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      انصراف
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">عنوان بخش:</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">زیرعنوان و شعار:</label>
                    <input
                      type="text"
                      value={editForm.subtitle || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full p-2 text-xs rounded-xl border border-stone-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">برچسب برجسته:</label>
                      <input
                        type="text"
                        value={editForm.badge || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, badge: e.target.value }))}
                        className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 block mb-1">آیکون:</label>
                      <select
                        value={editForm.icon || 'Gift'}
                        onChange={e => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                        className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold"
                      >
                        <option value="CreditCard">کارت اعتباری / وام</option>
                        <option value="Home">اقامتگاه / مسکن</option>
                        <option value="ShoppingBag">فروشگاه تعاونی</option>
                        <option value="Heart">سلامت و بیمه</option>
                        <option value="Building2">سازمان و مهمان‌سرا</option>
                        <option value="ShieldCheck">بیمه و ضمانت</option>
                        <option value="Gift">تسهیلات عمومی</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-1">توضیحات تکمیلی:</label>
                    <textarea
                      rows={2}
                      value={editForm.description || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 text-xs rounded-xl border border-stone-300 leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleSaveEdit}
                    className="w-full py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>ذخیره تغییرات بخش</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs ${
                          sec.isEnabled
                            ? 'bg-teal-50 text-teal-800 border-teal-200'
                            : 'bg-stone-200 text-stone-500 border-stone-300'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-stone-900">{sec.title}</h4>
                          {sec.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black">
                              {sec.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{sec.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(sec.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          sec.isEnabled
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                        }`}
                        title={sec.isEnabled ? 'غیرفعال‌سازی نمایش برای کاربران' : 'فعال‌سازی نمایش برای کاربران'}
                      >
                        {sec.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleStartEdit(sec)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-all cursor-pointer"
                        title="ویرایش عنوان و مشخصات"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {sec.id.startsWith('welf_sec_') && (
                        <button
                          onClick={() => handleDeleteCustom(sec.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                          title="حذف بخش سفارشی"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {sec.description && (
                    <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100 leading-relaxed font-sans">
                      {sec.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="flex items-center gap-1.5 font-bold">
                      <span className={`w-2 h-2 rounded-full ${sec.isEnabled ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      {sec.isEnabled ? 'نمایش فعال در پنل دانش‌آموختگان' : 'مخفی شده از دید دانش‌آموختگان'}
                    </span>
                    <span className="font-mono">کد: {sec.id}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add New Welfare Section */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-base text-stone-900">تعریف بخش رفاهی جدید در سامانه</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNew} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">عنوان بخش رفاهی *:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بیمه تکمیلی طلایی، کمک‌هزینه عمره، خدمات دندانپزشکی"
                  value={newSection.title || ''}
                  onChange={e => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">زیرعنوان و توضیح کوتاه:</label>
                <input
                  type="text"
                  placeholder="توضیح خلاصه سقف خدمت و شرایط"
                  value={newSection.subtitle || ''}
                  onChange={e => setNewSection(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">برچسب برجسته:</label>
                  <input
                    type="text"
                    value={newSection.badge || ''}
                    onChange={e => setNewSection(prev => ({ ...prev, badge: e.target.value }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">آیکون:</label>
                  <select
                    value={newSection.icon || 'Gift'}
                    onChange={e => setNewSection(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                  >
                    <option value="CreditCard">کارت اعتباری / وام</option>
                    <option value="Home">اقامتگاه / مسکن</option>
                    <option value="ShoppingBag">فروشگاه تعاونی</option>
                    <option value="Heart">سلامت و بیمه</option>
                    <option value="Building2">مهمان‌سرا</option>
                    <option value="ShieldCheck">ضمانت و بیمه</option>
                    <option value="Gift">هدیه و تسهیلات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">شرح کامل ضوابط بخش:</label>
                <textarea
                  rows={3}
                  placeholder="توضیحات تکمیلی پیرامون جامعه هدف و نحوه استفاده اعضا..."
                  value={newSection.description || ''}
                  onChange={e => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  ایجاد و افزودن به رفاهیات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

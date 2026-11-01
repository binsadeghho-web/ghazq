import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Consultant } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Users,
  Scale,
  HeartHandshake,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  DollarSign,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Upload,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';

export const ConsultantManagementModule: React.FC = () => {
  const { consultants, addConsultant, updateConsultant, deleteConsultant } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'specialized_career' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);

  // Bulk Tariff preset state for rapid fee configuration
  const [showTariffPresetModal, setShowTariffPresetModal] = useState(false);
  const [bulkSpecializedFee, setBulkSpecializedFee] = useState<number>(1200000);
  const [bulkSpecializedSubsidy, setBulkSpecializedSubsidy] = useState<string>('۷۰٪ یارانه پرداختی مرکز دانش‌آموختگان');
  const [bulkGeneralFee, setBulkGeneralFee] = useState<number>(450000);
  const [bulkGeneralSubsidy, setBulkGeneralSubsidy] = useState<string>('۶۰٪ یارانه حمایتی مرکز');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<Consultant>>({
    name: '',
    title: '',
    specialty: '',
    specialties: [],
    bio: '',
    experienceYears: 15,
    availability: 'روزهای زوج - ساعت ۱۶ الی ۲۰',
    academicRank: 'پایه ۱۰ قضایی / دکتری تخصصی',
    counselingType: 'specialized_career',
    fee: 1200000,
    subsidyNotice: '۷۰٪ یارانه پرداختی مرکز دانش‌آموختگان',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&q=80',
    resumeDetails: ['مستشار دادگاه تجدیدنظر', 'مدرس دوره‌های عالی فقه القضا']
  });

  const [specialtyInput, setSpecialtyInput] = useState('');
  const [resumeInput, setResumeInput] = useState('');

  // Counts & Analytics
  const specializedConsultants = consultants.filter(c => c.counselingType === 'specialized_career');
  const generalConsultants = consultants.filter(c => c.counselingType !== 'specialized_career');
  const activeCount = consultants.filter(c => c.isActive !== false).length;

  const filteredConsultants = consultants.filter(c => {
    // Type Filter
    if (activeTabFilter === 'specialized_career' && c.counselingType !== 'specialized_career') return false;
    if (activeTabFilter === 'general' && c.counselingType === 'specialized_career') return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(q);
      const titleMatch = c.title.toLowerCase().includes(q);
      const specMatch = c.specialty.toLowerCase().includes(q);
      const rankMatch = (c.academicRank || '').toLowerCase().includes(q);
      return nameMatch || titleMatch || specMatch || rankMatch;
    }

    return true;
  });

  const handleOpenAddModal = () => {
    setEditingConsultant(null);
    setFormData({
      name: '',
      title: 'مستشار و قاضی پیشکسوت',
      specialty: 'حقوق جزا، ارتقا و آزمون‌های قضایی',
      specialties: ['ارتقا و تنزل پایه قضایی', 'مصاحبه و اختبار دیوان عالی'],
      bio: 'عضو هیئت اندیشه‌ورز مرکز دانش‌آموختگان با بیش از ۲۰ سال سابقه خدمت قضایی.',
      experienceYears: 20,
      availability: 'روزهای زوج - ساعت ۱۶ الی ۲۰',
      academicRank: 'مستشار دیوان عالی کشور',
      counselingType: 'specialized_career',
      fee: 1200000,
      subsidyNotice: '۷۰٪ یارانه پرداختی مرکز دانش‌آموختگان',
      isActive: true,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop&q=80',
      resumeDetails: ['قاضی دادگاه تجدیدنظر استان', 'مدرس خارج فقه القضا']
    });
    setSpecialtyInput('');
    setResumeInput('');
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (consultant: Consultant) => {
    setEditingConsultant(consultant);
    setFormData({
      ...consultant,
      specialties: consultant.specialties || [consultant.specialty],
      resumeDetails: consultant.resumeDetails || [consultant.bio]
    });
    setSpecialtyInput('');
    setResumeInput('');
    setIsAddEditModalOpen(true);
  };

  const handleSaveConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('لطفاً نام و نام خانوادگی مشاور را وارد نمایید.');
      return;
    }

    const payload: Omit<Consultant, 'id'> = {
      name: formData.name.trim(),
      title: formData.title || 'مشاور مرکز',
      specialty: formData.specialty || 'مشاوره تخصصی',
      specialties: formData.specialties && formData.specialties.length > 0 ? formData.specialties : [formData.specialty || 'مشاوره'],
      bio: formData.bio || '',
      experienceYears: Number(formData.experienceYears || 10),
      availability: formData.availability || 'با هماهنگی دبیرخانه',
      academicRank: formData.academicRank || 'استاد مرکز',
      counselingType: formData.counselingType || 'general',
      fee: Number(formData.fee || 0),
      subsidyNotice: formData.subsidyNotice || '',
      isActive: formData.isActive !== false,
      avatarUrl: formData.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop&q=80',
      resumeDetails: formData.resumeDetails || []
    };

    if (editingConsultant) {
      updateConsultant(editingConsultant.id, payload);
      alert(`اطلاعات استاد/مشاور «${payload.name}» با موفقیت به‌روزرسانی شد.`);
    } else {
      addConsultant(payload);
      alert(`استاد/مشاور جدید «${payload.name}» با موفقیت در فهرست ثبت گردید.`);
    }

    setIsAddEditModalOpen(false);
  };

  const handleDeleteConsultant = (consultant: Consultant) => {
    if (confirm(`آیا از حذف مشاور «${consultant.name}» اطمینان دارید؟`)) {
      deleteConsultant(consultant.id);
      alert(`مشاور «${consultant.name}» از سامانه حذف گردید.`);
    }
  };

  const handleApplyBulkTariffs = (e: React.FormEvent) => {
    e.preventDefault();
    consultants.forEach(c => {
      if (c.counselingType === 'specialized_career') {
        updateConsultant(c.id, {
          fee: bulkSpecializedFee,
          subsidyNotice: bulkSpecializedSubsidy
        });
      } else {
        updateConsultant(c.id, {
          fee: bulkGeneralFee,
          subsidyNotice: bulkGeneralSubsidy
        });
      }
    });
    setShowTariffPresetModal(false);
    alert('تعرفه‌ها و نرخ‌های جدید حق‌المشاوره با موفقیت روی کلیه مشاوران اعمال گردید.');
  };

  const handleAddSpecialtyTag = () => {
    if (!specialtyInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      specialties: [...(prev.specialties || []), specialtyInput.trim()]
    }));
    setSpecialtyInput('');
  };

  const handleRemoveSpecialtyTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: (prev.specialties || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddResumeBullet = () => {
    if (!resumeInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      resumeDetails: [...(prev.resumeDetails || []), resumeInput.trim()]
    }));
    setResumeInput('');
  };

  const handleRemoveResumeBullet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      resumeDetails: (prev.resumeDetails || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white dark:bg-[#182622] p-6 rounded-3xl border border-slate-800 dark:border-[#2A423B] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black">پنل اختصاصی مدیریت مشاوران و تعیین حق‌المشاوره</h2>
          </div>
          <p className="text-xs text-slate-300 dark:text-stone-300 leading-relaxed max-w-3xl">
            مدیریت کامل اساتید و مشاوران، تنظیم نرخ جلسات، و **جداسازی ساختاری مشاوران تخصصی تحصیلی-شغلی قضا** از مشاوران مشاوره عمومی.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowTariffPresetModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <DollarSign className="w-4 h-4" />
            <span>تنظیم همگانی نرخ و تعرفه‌ها</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن مشاور جدید</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <span>کل مشاوران مرکز</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {toPersianNumbers(consultants.length)} نفر
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {toPersianNumbers(activeCount)} مشاور فعال در سامانه
          </div>
        </div>

        <div className="bg-amber-500/10 dark:bg-amber-500/15 p-5 rounded-2xl border border-amber-500/30 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300 mb-2">
            <span>مشاوران تخصصی شغلی قضا</span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-950 dark:text-amber-200 tabular-nums">
            {toPersianNumbers(specializedConsultants.length)} استاد / قاضی
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
            مستشاران دیوان عالی و اساتید ارشد
          </div>
        </div>

        <div className="bg-rose-500/10 dark:bg-rose-500/15 p-5 rounded-2xl border border-rose-500/30 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-900 dark:text-rose-300 mb-2">
            <span>مشاوران عمومی و سلامت</span>
            <HeartHandshake className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-950 dark:text-rose-200 tabular-nums">
            {toPersianNumbers(generalConsultants.length)} روان‌شناس
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold mt-1">
            فردی، خانواده، پیش از ازدواج و شخصیت
          </div>
        </div>

        <div className="bg-emerald-500/10 dark:bg-emerald-500/15 p-5 rounded-2xl border border-emerald-500/30 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-2">
            <span>میانگین یارانه حمایتی</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200 tabular-nums">
            {toPersianNumbers('70%')}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
            تامین از محل اعتبارات صندوق مرکز
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Type Segregation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              activeTabFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            همه مشاوران ({toPersianNumbers(consultants.length)})
          </button>

          <button
            onClick={() => setActiveTabFilter('specialized_career')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTabFilter === 'specialized_career'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>مشاوران تخصصی شغلی-تحصیلی ({toPersianNumbers(specializedConsultants.length)})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('general')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTabFilter === 'general'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-500/10'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>مشاوران عمومی و روان‌شناختی ({toPersianNumbers(generalConsultants.length)})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو با نام، سمت یا حوزه تخصص..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
      </div>

      {/* Consultants Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredConsultants.map(consultant => {
          const isSpecialized = consultant.counselingType === 'specialized_career';
          const isActive = consultant.isActive !== false;

          return (
            <div
              key={consultant.id}
              className={`rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-xl ${
                isSpecialized
                  ? 'bg-amber-500/5 border-amber-500/30 dark:bg-[#233832]/80 dark:border-[#34544B]'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs ${
                      isSpecialized
                        ? 'bg-amber-500 text-slate-950 border border-amber-400'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isSpecialized ? <Scale className="w-3.5 h-3.5" /> : <HeartHandshake className="w-3.5 h-3.5" />}
                    <span>{isSpecialized ? 'مشاوره تخصصی شغلی قضا' : 'مشاوره عمومی'}</span>
                  </span>

                  <button
                    onClick={() => updateConsultant(consultant.id, { isActive: !isActive })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{isActive ? 'فعال و دردسترس' : 'غیرفعال'}</span>
                  </button>
                </div>

                {/* Profile Avatar & Details */}
                <div className="flex items-start gap-3 pt-1">
                  <img
                    src={consultant.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop&q=80'}
                    alt={consultant.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                      {consultant.name}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                      {consultant.academicRank || consultant.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                      {consultant.specialty}
                    </p>
                  </div>
                </div>

                {/* Bio / Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  {consultant.bio}
                </p>

                {/* Specialties Tags */}
                {consultant.specialties && consultant.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {consultant.specialties.slice(0, 3).map((spec, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Fee & Actions Bar */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="p-3 bg-amber-500/10 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">نرخ حق‌المشاوره جلسه:</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                      {consultant.fee ? `${toPersianNumbers(consultant.fee.toLocaleString('fa-IR'))} تومان` : 'رایگان (حمایتی)'}
                    </span>
                  </div>
                  {consultant.subsidyNotice && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                      {consultant.subsidyNotice}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(consultant)}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>ویرایش شناسه</span>
                  </button>

                  <button
                    onClick={() => handleDeleteConsultant(consultant)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors"
                    title="حذف مشاور"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: ADD / EDIT CONSULTANT */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#182622] rounded-[36px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-[#2A423B] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A423B]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingConsultant ? `ویرایش اطلاعات: ${editingConsultant.name}` : 'افزودن مشاور/قاضی جدید به سامانه'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConsultant} className="space-y-4 text-xs">
              {/* Type Selection Radio Segment */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  تفکیک بخش مشاوره (نوع فعالیت):
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, counselingType: 'specialized_career' }))}
                    className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 text-xs transition-all ${
                      formData.counselingType === 'specialized_career'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>مشاوره تخصصی شغلی-تحصیلی قضا</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, counselingType: 'general' }))}
                    className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 text-xs transition-all ${
                      formData.counselingType === 'general'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>خدمات مشاوره عمومی و سلامت</span>
                  </button>
                </div>
              </div>

              {/* Main Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مانند: آیت‌الله دکتر سید محمدرضا علوی"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">سمت و عنوان رسمی:</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مانند: قاضی پیشکسوت دیوان عالی کشور"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">رتبه علمی / پایه قضایی:</label>
                  <input
                    type="text"
                    value={formData.academicRank || ''}
                    onChange={e => setFormData(prev => ({ ...prev, academicRank: e.target.value }))}
                    placeholder="مانند: پایه ۱۱ قضایی / دانشیار حوزه و دانشگاه"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">حوزه اصلی تخصص:</label>
                  <input
                    type="text"
                    value={formData.specialty || ''}
                    onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                    placeholder="مانند: حقوق جزا، ارتقای پایه قضایی و اختبار"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Fee & Subsidies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-500/10 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900 dark:text-white">نرخ حق‌المشاوره جلسه (تومان):</label>
                  <input
                    type="number"
                    value={formData.fee || 0}
                    onChange={e => setFormData(prev => ({ ...prev, fee: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl font-bold text-slate-900 dark:text-amber-300 tabular-nums"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 dark:text-white">توضیح یارانه مرکز:</label>
                  <input
                    type="text"
                    value={formData.subsidyNotice || ''}
                    onChange={e => setFormData(prev => ({ ...prev, subsidyNotice: e.target.value }))}
                    placeholder="مانند: ۷۰٪ یارانه پرداختی مرکز دانش‌آموختگان"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Availability & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">روزها و ساعات حضور:</label>
                  <input
                    type="text"
                    value={formData.availability || ''}
                    onChange={e => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                    placeholder="مانند: دوشنبه‌ها و چهارشنبه‌ها - ساعت ۱۶ الی ۲۰"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">آدرس عکس تصویر مشاور:</label>
                  <input
                    type="text"
                    value={formData.avatarUrl || ''}
                    onChange={e => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                    placeholder="آدرس URL یا مسیر فایل تصویر"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">شرح بیوگرافی و معرفی کوتاه:</label>
                <textarea
                  rows={2}
                  value={formData.bio || ''}
                  onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="شرح مختصر از سوابق علمی و قضایی مشاور..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Specialties Tag Generator */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">برچسب‌های موضوعی تخصصی:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specialtyInput}
                    onChange={e => setSpecialtyInput(e.target.value)}
                    placeholder="مانند: اختبار قضایی دیوان عالی"
                    className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialtyTag}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                  >
                    افزودن
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.specialties?.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                      <span>{tag}</span>
                      <button type="button" onClick={() => handleRemoveSpecialtyTag(idx)} className="text-rose-500 font-black">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive !== false}
                  onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="isActiveCheck" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  مشاور فعال است و در لیست انتخاب کاربران نمایش داده می‌شود.
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-[#2A423B]">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
                >
                  {editingConsultant ? 'ذخیره تغییرات' : 'افزودن مشاور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK TARIFF & FEE SETTINGS */}
      {showTariffPresetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#182622] rounded-[36px] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-[#2A423B]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2A423B]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  تنظیم هماهنگ تعرفه‌ها و یارانه‌های حق‌المشاوره
                </h3>
              </div>
              <button
                onClick={() => setShowTariffPresetModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyBulkTariffs} className="space-y-4 text-xs">
              <div className="p-4 bg-amber-500/10 dark:bg-amber-500/10 rounded-2xl border border-amber-500/30 space-y-3">
                <h4 className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-500" />
                  <span>تعرفه مشاوران تخصصی تحصیلی-شغلی قضا:</span>
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">نرخ حق‌المشاوره (تومان):</label>
                    <input
                      type="number"
                      value={bulkSpecializedFee}
                      onChange={e => setBulkSpecializedFee(Number(e.target.value))}
                      className="w-full px-3.5 py-2 mt-1 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl font-bold tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">عنوان یارانه مرکز:</label>
                    <input
                      type="text"
                      value={bulkSpecializedSubsidy}
                      onChange={e => setBulkSpecializedSubsidy(e.target.value)}
                      className="w-full px-3.5 py-2 mt-1 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-rose-500/10 dark:bg-rose-500/10 rounded-2xl border border-rose-500/30 space-y-3">
                <h4 className="font-extrabold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-rose-500" />
                  <span>تعرفه مشاوران خدمات عمومی و روان‌شناختی:</span>
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">نرخ حق‌المشاوره (تومان):</label>
                    <input
                      type="number"
                      value={bulkGeneralFee}
                      onChange={e => setBulkGeneralFee(Number(e.target.value))}
                      className="w-full px-3.5 py-2 mt-1 bg-white dark:bg-slate-900 border border-rose-500/40 rounded-xl font-bold tabular-nums text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">عنوان یارانه مرکز:</label>
                    <input
                      type="text"
                      value={bulkGeneralSubsidy}
                      onChange={e => setBulkGeneralSubsidy(e.target.value)}
                      className="w-full px-3.5 py-2 mt-1 bg-white dark:bg-slate-900 border border-rose-500/40 rounded-xl font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-[#2A423B]">
                <button
                  type="button"
                  onClick={() => setShowTariffPresetModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg"
                >
                  اعمال همگانی تعرفه‌ها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

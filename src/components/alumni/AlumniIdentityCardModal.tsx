import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { computeProfileCompletion } from '../../utils/profileCompletion';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { api } from '../../services/apiClient';
import {
  IdCard,
  Lock,
  ShieldCheck,
  GraduationCap,
  Building2,
  Briefcase,
  CheckCircle2,
  X,
  Save,
  Sparkles,
  Upload,
  AlertTriangle,
} from 'lucide-react';

interface AlumniIdentityCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlumniIdentityCardModal: React.FC<AlumniIdentityCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, alumniProfileSettings, updateMyIdentity, refreshAlumniProfileSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'identity' | 'academic' | 'association' | 'career'>('identity');
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (isOpen && currentUser) {
      refreshAlumniProfileSettings();
      setFormData({
        siteTitle: currentUser.siteTitle || '',
        profilePictureUrl: currentUser.profilePictureUrl || '',
        fatherName: currentUser.fatherName || '',
        idNumber: currentUser.idNumber || '',
        birthDate: currentUser.birthDate || '',
        maritalStatus: currentUser.maritalStatus || 'متاهل',
        childrenCount: currentUser.childrenCount ?? 0,
        email: currentUser.email || '',
        residentialAddress: currentUser.residentialAddress || '',
        academicDegree: currentUser.academicDegree || '',
        seminaryLevel: currentUser.seminaryLevel || '',
        seminarySchool: currentUser.seminarySchool || '',
        universityDegree: currentUser.universityDegree || '',
        universityName: currentUser.universityName || '',
        fieldOfStudy: currentUser.fieldOfStudy || '',
        graduationYear: currentUser.graduationYear || '',
        thesisTitle: currentUser.thesisTitle || '',
        supervisorProfessor: currentUser.supervisorProfessor || '',
        academicHonors: currentUser.academicHonors || '',
        associationMembershipDate: currentUser.associationMembershipDate || '',
        associationResponsibility: currentUser.associationResponsibility || '',
        employmentStatus: currentUser.employmentStatus || 'شاغل قضایی',
        personnelId: currentUser.personnelId || '',
        judicialGrade: currentUser.judicialGrade ?? 8,
        courtBranch: currentUser.courtBranch || '',
        province: currentUser.province || '',
        organization: currentUser.organization || '',
        currentJudicialPost: currentUser.currentJudicialPost || '',
        serviceYears: currentUser.serviceYears ?? 0,
        judicialSpecialty: currentUser.judicialSpecialty || '',
      });
      setFeedback(null);
    }
  }, [isOpen, currentUser, refreshAlumniProfileSettings]);

  if (!isOpen || !currentUser) return null;

  const isStaff =
    currentUser.role !== 'alumni' &&
    currentUser.role !== 'customer';
  const isEditingAllowed = isStaff || alumniProfileSettings.allowAlumniProfileCompletion !== false;

  const previewUser: User = {
    ...currentUser,
    ...formData,
  };
  const report = computeProfileCompletion(previewUser);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isEditingAllowed) return;

    setUploadingPic(true);
    const reader = new FileReader();
    reader.onload = async evt => {
      const base64 = evt.target?.result as string;
      try {
        const res = await api.uploadProfilePicture(base64, file.name);
        if (res.success && res.url) {
          setFormData(prev => ({ ...prev, profilePictureUrl: res.url }));
          setFeedback({ type: 'success', message: 'تصویر نمایه بارگذاری شد. جهت ثبت نهایی دکمه ذخیره را بزنید.' });
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: err?.message || 'خطا در بارگذاری تصویر نمایه' });
      } finally {
        setUploadingPic(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingAllowed) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateMyIdentity(formData);
      setFeedback({
        type: 'success',
        message: 'اطلاعات کارت هویتی شما با موفقیت در پایگاه داده MySQL ذخیره و همگام‌سازی گردید.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'خطا در ذخیره تغییرات کارت اطلاعات هویتی',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-[#FCFCFA] rounded-[36px] w-full max-w-4xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-stone-900"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 bg-[#F5F4EE] border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {formData.profilePictureUrl || currentUser.profilePictureUrl ? (
                <img
                  src={formData.profilePictureUrl || currentUser.profilePictureUrl}
                  alt={currentUser.fullName}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-md border-2 border-emerald-700"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-amber-300 flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  <IdCard className="w-7 h-7" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-stone-900">
                    کارت اطلاعات هویتی من
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    کد مرکز: {toPersianNumbers(currentUser.centerCode || 'ثبت‌نشده')}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                  پرونده الکترونیک ۴ سربرگه دانش‌آموخته · نسخه رکورد دیتابیس: v{toPersianNumbers(currentUser.version || 1)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-left">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-bold text-stone-500">درصد تکمیل پرونده:</span>
                  <span className="text-sm font-black text-emerald-800 tabular-nums">
                    {toPersianNumbers(report.percent)}٪
                  </span>
                </div>
                <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                    style={{ width: `${report.percent}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Admin Completion Toggle Notice / Warning Banner */}
          <div className="px-6 pt-4 space-y-2.5">
            {!isEditingAllowed ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black">ویرایش اطلاعات هویتی در حال حاضر توسط مدیر دانش‌آموختگان غیرفعال است.</p>
                  <p className="text-[11px] text-rose-700">
                    شما می‌توانید مشخصات ثبت‌شده خود را مشاهده فرمایید. در صورت نیاز به اصلاح اطلاعات، از طریق کارتابل درخواست خود را ارسال نمایید.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  {alumniProfileSettings.noticeText ||
                    'امکان تکمیل و به‌روزرسانی اطلاعات تکمیلی توسط دانش‌آموختگان فعال است. چهار مشخصه پایه هویتی (نام، کد ملی، تلفن همراه و کد مرکز) ثابت و غیرقابل ویرایش هستند.'}
                </span>
              </div>
            )}

            {feedback && (
              <div
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-800 text-white border-emerald-700'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="text-[11px] underline opacity-80 hover:opacity-100"
                >
                  بستن
                </button>
              </div>
            )}

            {/* 4 CORE LOCKED FIELDS BOX (Reform 56 Requirement) */}
            <div className="p-4 rounded-2xl bg-[#F5F4EE] border border-stone-300/90 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>مشخصات پایه هویتی و کد مرکز (ثابت و غیرقابل تغییر توسط دانش‌آموخته)</span>
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  تغییر صرفاً توسط مدیر دانش‌آموختگان
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-stone-200/70 border border-stone-300/80">
                  <span className="text-[10px] font-bold text-stone-500 block">نام و نام خانوادگی:</span>
                  <span className="font-black text-stone-900 mt-0.5 block truncate">
                    {currentUser.fullName}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-200/70 border border-stone-300/80">
                  <span className="text-[10px] font-bold text-stone-500 block">کد ملی (شناسه یکتا):</span>
                  <span className="font-mono font-black text-stone-900 mt-0.5 block">
                    {toPersianNumbers(currentUser.nationalId)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-200/70 border border-stone-300/80">
                  <span className="text-[10px] font-bold text-stone-500 block">شماره همراه رسمی:</span>
                  <span className="font-mono font-black text-stone-900 mt-0.5 block">
                    {toPersianNumbers(currentUser.phone || '---')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300/90">
                  <span className="text-[10px] font-bold text-amber-800 block">کد مرکز دانش‌آموختگان:</span>
                  <span className="font-mono font-black text-amber-950 mt-0.5 block">
                    {toPersianNumbers(currentUser.centerCode || 'تخصیص نیافته')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Tabs Navigation */}
          <div className="flex items-center border-b border-stone-200 bg-white px-6 mt-3 overflow-x-auto gap-2 text-xs font-bold shrink-0">
            {[
              { id: 'identity' as const, label: '۱. اطلاعات هویتی و سکونتی', icon: ShieldCheck },
              { id: 'academic' as const, label: '۲. سوابق علمی و حوزوی', icon: GraduationCap },
              { id: 'association' as const, label: '۳. سوابق در مرکز', icon: Building2 },
              { id: 'career' as const, label: '۴. اطلاعات شغلی و قضایی', icon: Briefcase },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-800 text-emerald-900 font-black'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {activeTab === 'identity' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">عنوان نمایشی در پرتال:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.siteTitle || ''}
                    onChange={e => setFormData({ ...formData, siteTitle: e.target.value })}
                    placeholder="مثال: پژوهشگر ارشد فقه القضاء"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">نام پدر:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.fatherName || ''}
                    onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">شماره شناسنامه:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.idNumber || ''}
                    onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تاریخ تولد (شمسی):</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.birthDate || ''}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    placeholder="۱۳۶۵/۰۱/۰۱"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">وضعیت تأهل:</label>
                  <select
                    disabled={!isEditingAllowed}
                    value={formData.maritalStatus || 'متاهل'}
                    onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  >
                    <option value="متاهل">متاهل</option>
                    <option value="مجرد">مجرد</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تعداد فرزندان:</label>
                  <input
                    type="number"
                    min={0}
                    disabled={!isEditingAllowed}
                    value={formData.childrenCount ?? 0}
                    onChange={e => setFormData({ ...formData, childrenCount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">رایانامه (ایمیل):</label>
                  <input
                    type="email"
                    disabled={!isEditingAllowed}
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.ir"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                {isEditingAllowed && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-bold text-stone-700">تصویر نمایه شخصی:</label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingPic ? 'در حال بارگذاری...' : 'انتخاب تصویر جدید'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingPic}
                          onChange={handleProfilePicUpload}
                          className="hidden"
                        />
                      </label>
                      {formData.profilePictureUrl && (
                        <span className="text-[11px] text-emerald-800 font-bold">تصویر آماده ذخیره است</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <label className="font-bold text-stone-700">نشانی دقیق محل سکونت:</label>
                  <textarea
                    rows={2}
                    disabled={!isEditingAllowed}
                    value={formData.residentialAddress || ''}
                    onChange={e => setFormData({ ...formData, residentialAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">مقطع علمی جامع (حوزوی / دانشگاهی):</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.academicDegree || ''}
                    onChange={e => setFormData({ ...formData, academicDegree: e.target.value })}
                    placeholder="سطح ۴ حوزه و دکتری تخصصی..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سطح علمی حوزوی:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.seminaryLevel || ''}
                    onChange={e => setFormData({ ...formData, seminaryLevel: e.target.value })}
                    placeholder="سطح ۴ فقه القضاء، درس خارج..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">مدرسه یا حوزه علمیه محل تحصیل:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.seminarySchool || ''}
                    onChange={e => setFormData({ ...formData, seminarySchool: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">مقطع تحصیلی دانشگاهی:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.universityDegree || ''}
                    onChange={e => setFormData({ ...formData, universityDegree: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">دانشگاه محل تحصیل:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.universityName || ''}
                    onChange={e => setFormData({ ...formData, universityName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">رشته و گرایش تخصصی:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.fieldOfStudy || ''}
                    onChange={e => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سال دانش‌آموختگی:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.graduationYear || ''}
                    onChange={e => setFormData({ ...formData, graduationYear: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">استاد راهنما:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.supervisorProfessor || ''}
                    onChange={e => setFormData({ ...formData, supervisorProfessor: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-stone-700">عنوان رساله یا پایان‌نامه:</label>
                  <textarea
                    rows={2}
                    disabled={!isEditingAllowed}
                    value={formData.thesisTitle || ''}
                    onChange={e => setFormData({ ...formData, thesisTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-medium text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-stone-700">افتخارات علمی و تالیفات:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.academicHonors || ''}
                    onChange={e => setFormData({ ...formData, academicHonors: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {activeTab === 'association' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تاریخ پذیرش و عضویت در مرکز:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.associationMembershipDate || ''}
                    onChange={e => setFormData({ ...formData, associationMembershipDate: e.target.value })}
                    placeholder="۱۳۹۸/۰۷/۰۱"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">مسئولیت، کارگروه یا نوع همکاری در مرکز:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.associationResponsibility || ''}
                    onChange={e => setFormData({ ...formData, associationResponsibility: e.target.value })}
                    placeholder="عضو کارگروه نقد آراء، عضو پیوسته..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {activeTab === 'career' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">وضعیت اشتغال قضایی:</label>
                  <select
                    disabled={!isEditingAllowed}
                    value={formData.employmentStatus || 'شاغل قضایی'}
                    onChange={e => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  >
                    <option value="شاغل قضایی">شاغل قضایی</option>
                    <option value="مستشار">مستشار دادگاه تجدیدنظر</option>
                    <option value="بازپرس">بازپرس دادسرا</option>
                    <option value="دادیار">دادیار دادسرا</option>
                    <option value="عضو هیئت علمی">عضو هیئت علمی دانشگاه</option>
                    <option value="قاضی بازنشسته">قاضی بازنشسته / مشاور عالی</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سمت قضایی یا اجرایی فعلی:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.currentJudicialPost || ''}
                    onChange={e => setFormData({ ...formData, currentJudicialPost: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">پایه قضایی (۱ تا ۱۱):</label>
                  <input
                    type="number"
                    min={1}
                    max={11}
                    disabled={!isEditingAllowed}
                    value={formData.judicialGrade ?? 8}
                    onChange={e => setFormData({ ...formData, judicialGrade: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">شماره پرسنلی قضایی:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.personnelId || ''}
                    onChange={e => setFormData({ ...formData, personnelId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-mono font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">شعبه و مجتمع دادگاه:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.courtBranch || ''}
                    onChange={e => setFormData({ ...formData, courtBranch: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">استان محل خدمت:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.province || ''}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سازمان متبوع:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.organization || ''}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">سابقه خدمت قضایی (سال):</label>
                  <input
                    type="number"
                    min={0}
                    disabled={!isEditingAllowed}
                    value={formData.serviceYears ?? 0}
                    onChange={e => setFormData({ ...formData, serviceYears: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-stone-700">تخصص و گرایش دعاوی قضایی:</label>
                  <input
                    type="text"
                    disabled={!isEditingAllowed}
                    value={formData.judicialSpecialty || ''}
                    onChange={e => setFormData({ ...formData, judicialSpecialty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F5F4EE] border border-stone-200 font-bold text-stone-900 disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500 font-medium">
                {isEditingAllowed
                  ? '* کلیه اطلاعات تکمیلی پس از تایید، با کنترل هم‌زمانی (Strict OCC) در پایگاه داده ذخیره می‌شود.'
                  : '* کارت هویتی در حالت فقط خواندنی قرار دارد.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 font-bold cursor-pointer"
                >
                  بستن
                </button>
                {isEditingAllowed && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات در پایگاه داده'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

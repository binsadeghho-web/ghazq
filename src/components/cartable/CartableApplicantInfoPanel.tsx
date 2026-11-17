import React, { useState } from 'react';
import { CartableRequest, User } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  UserCheck,
  Phone,
  CreditCard,
  Building2,
  MapPin,
  GraduationCap,
  Scale,
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

interface CartableApplicantInfoPanelProps {
  request: CartableRequest;
  users: User[];
}

export const CartableApplicantInfoPanel: React.FC<CartableApplicantInfoPanelProps> = ({
  request,
  users,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const matchedUser = users.find(u => u.id === request.applicantId);
  const profile = {
    fullName: request.applicantProfile?.fullName || matchedUser?.fullName || request.applicantName,
    nationalId: request.applicantProfile?.nationalId || matchedUser?.nationalId || '—',
    phone: request.applicantProfile?.phone || matchedUser?.phone || '—',
    roleTitle: request.applicantProfile?.roleTitle || matchedUser?.roleTitle || request.applicantRoleTitle,
    organization: request.applicantProfile?.organization || matchedUser?.organization || '—',
    province: request.applicantProfile?.province || matchedUser?.province || '—',
    graduationYear: request.applicantProfile?.graduationYear || matchedUser?.graduationYear || '—',
    academicDegree: request.applicantProfile?.academicDegree || matchedUser?.academicDegree || '',
    currentJudicialPost: request.applicantProfile?.currentJudicialPost || matchedUser?.currentJudicialPost || '',
    email: request.applicantProfile?.email || matchedUser?.email || '',
    personnelId: request.applicantProfile?.personnelId || matchedUser?.personnelId || '',
  };

  const handleCopy = (val: string, field: string) => {
    if (!val || val === '—') return;
    navigator.clipboard?.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-black border flex items-center gap-1.5 transition-colors cursor-pointer ${
            expanded
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>مشخصات کامل متقاضی (تلفن، کد ملی و سوابق)</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {profile.phone !== '—' && (
          <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono tabular-nums" dir="ltr">
              {toPersianNumbers(profile.phone)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
              کد ملی: {toPersianNumbers(profile.nationalId)}
            </span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-bold">نام و نام خانوادگی</div>
              <div className="font-extrabold text-slate-900 dark:text-white truncate">{profile.fullName}</div>
            </div>
            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-bold">تلفن همراه</div>
              <div className="font-mono font-extrabold text-slate-900 dark:text-white tabular-nums" dir="ltr">
                {toPersianNumbers(profile.phone)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(profile.phone, 'phone')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              title="کپی شماره تماس"
            >
              {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-bold">کد ملی</div>
              <div className="font-mono font-extrabold text-slate-900 dark:text-white tabular-nums" dir="ltr">
                {toPersianNumbers(profile.nationalId)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(profile.nationalId, 'nationalId')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
              title="کپی کد ملی"
            >
              {copiedField === 'nationalId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <CreditCard className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-bold">سازمان / محل خدمت</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{profile.organization}</div>
            </div>
            <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-bold">استان / سال فراغت</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {profile.province} · {toPersianNumbers(profile.graduationYear)}
              </div>
            </div>
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 font-bold">سمت و مقطع تحصیلی</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {profile.currentJudicialPost || profile.roleTitle}
                {profile.academicDegree ? ` (${profile.academicDegree})` : ''}
              </div>
            </div>
            {profile.currentJudicialPost ? (
              <Scale className="w-4 h-4 text-indigo-500 shrink-0" />
            ) : (
              <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
          </div>

          {(profile.email || profile.personnelId) && (
            <div className="sm:col-span-2 lg:col-span-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px]">
              {profile.email && (
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span dir="ltr">{profile.email}</span>
                </span>
              )}
              {profile.personnelId && (
                <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                  کد پرسنلی: {toPersianNumbers(profile.personnelId)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

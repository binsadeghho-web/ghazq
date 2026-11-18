import { User } from '../types';

export interface ProfileFieldMetric {
  key: keyof User;
  label: string;
  section: 'core' | 'identity' | 'academic' | 'association' | 'career';
  sectionTitle: string;
  isCoreLocked?: boolean;
  filled: boolean;
}

export interface ProfileCompletionReport {
  percent: number;
  percentage: number;
  filledCount: number;
  totalCount: number;
  coreFilledCount: number;
  coreTotalCount: number;
  missingLabels: string[];
  sections: Array<{
    id: 'core' | 'identity' | 'academic' | 'association' | 'career';
    title: string;
    filledCount: number;
    totalCount: number;
    percent: number;
  }>;
  fields: ProfileFieldMetric[];
}

function isFieldFilled(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'number') return !Number.isNaN(val) && val > 0;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 && trimmed !== '---' && trimmed !== '-';
  }
  if (Array.isArray(val)) return val.length > 0;
  return Boolean(val);
}

const PROFILE_FIELDS_DEFINITION: Array<{
  key: keyof User;
  label: string;
  section: 'core' | 'identity' | 'academic' | 'association' | 'career';
  sectionTitle: string;
  isCoreLocked?: boolean;
}> = [
  // Core 4 Locked Identity Fields
  { key: 'fullName', label: 'نام و نام خانوادگی', section: 'core', sectionTitle: 'مشخصات پایه هویتی (ثابت)', isCoreLocked: true },
  { key: 'nationalId', label: 'کد ملی', section: 'core', sectionTitle: 'مشخصات پایه هویتی (ثابت)', isCoreLocked: true },
  { key: 'phone', label: 'شماره تلفن همراه', section: 'core', sectionTitle: 'مشخصات پایه هویتی (ثابت)', isCoreLocked: true },
  { key: 'centerCode', label: 'کد مرکز', section: 'core', sectionTitle: 'مشخصات پایه هویتی (ثابت)', isCoreLocked: true },

  // Tab 1: Identity & Contact
  { key: 'fatherName', label: 'نام پدر', section: 'identity', sectionTitle: 'اطلاعات شناسنامه‌ای و سکونتی' },
  { key: 'idNumber', label: 'شماره شناسنامه', section: 'identity', sectionTitle: 'اطلاعات شناسنامه‌ای و سکونتی' },
  { key: 'birthDate', label: 'تاریخ تولد', section: 'identity', sectionTitle: 'اطلاعات شناسنامه‌ای و سکونتی' },
  { key: 'maritalStatus', label: 'وضعیت تأهل', section: 'identity', sectionTitle: 'اطلاعات شناسنامه‌ای و سکونتی' },
  { key: 'email', label: 'رایانامه (ایمیل)', section: 'identity', sectionTitle: 'اطلاعات شناسنامه‌ای و سکونتی' },
  { key: 'residentialAddress', label: 'نشانی محل سکونت', section: 'identity', sectionTitle: 'اطلاعات شناسنامه‌ای و سکونتی' },

  // Tab 2: Academic & Seminary
  { key: 'academicDegree', label: 'مقطع علمی حوزوی/دانشگاهی', section: 'academic', sectionTitle: 'سوابق علمی و حوزوی' },
  { key: 'seminaryLevel', label: 'سطح حوزوی', section: 'academic', sectionTitle: 'سوابق علمی و حوزوی' },
  { key: 'seminarySchool', label: 'مدرسه یا حوزه علمیه', section: 'academic', sectionTitle: 'سوابق علمی و حوزوی' },
  { key: 'universityDegree', label: 'مدرک دانشگاهی', section: 'academic', sectionTitle: 'سوابق علمی و حوزوی' },
  { key: 'fieldOfStudy', label: 'رشته و گرایش تخصصی', section: 'academic', sectionTitle: 'سوابق علمی و حوزوی' },
  { key: 'graduationYear', label: 'سال دانش‌آموختگی', section: 'academic', sectionTitle: 'سوابق علمی و حوزوی' },
  { key: 'thesisTitle', label: 'عنوان رساله / پایان‌نامه', section: 'academic', sectionTitle: 'سوابق علمی و حوزوی' },

  // Tab 3: Center / Association History
  { key: 'associationMembershipDate', label: 'تاریخ عضویت در مرکز', section: 'association', sectionTitle: 'سوابق در مرکز دانش‌آموختگان' },
  { key: 'associationResponsibility', label: 'سمت یا کارگروه در مرکز', section: 'association', sectionTitle: 'سوابق در مرکز دانش‌آموختگان' },

  // Tab 4: Career & Judicial Info
  { key: 'employmentStatus', label: 'وضعیت اشتغال قضایی', section: 'career', sectionTitle: 'اطلاعات شغلی و قضایی' },
  { key: 'currentJudicialPost', label: 'سمت قضایی فعلی', section: 'career', sectionTitle: 'اطلاعات شغلی و قضایی' },
  { key: 'judicialGrade', label: 'پایه قضایی', section: 'career', sectionTitle: 'اطلاعات شغلی و قضایی' },
  { key: 'courtBranch', label: 'شعبه یا مجتمع قضایی', section: 'career', sectionTitle: 'اطلاعات شغلی و قضایی' },
  { key: 'province', label: 'استان محل خدمت', section: 'career', sectionTitle: 'اطلاعات شغلی و قضایی' },
  { key: 'organization', label: 'سازمان متبوع', section: 'career', sectionTitle: 'اطلاعات شغلی و قضایی' },
];

export function computeProfileCompletion(user: User | null | undefined): ProfileCompletionReport {
  if (!user) {
    return {
      percent: 0,
      percentage: 0,
      filledCount: 0,
      totalCount: PROFILE_FIELDS_DEFINITION.length,
      coreFilledCount: 0,
      coreTotalCount: 4,
      missingLabels: PROFILE_FIELDS_DEFINITION.map(f => f.label),
      sections: [],
      fields: [],
    };
  }

  const fields: ProfileFieldMetric[] = PROFILE_FIELDS_DEFINITION.map(def => ({
    ...def,
    filled: isFieldFilled(user[def.key]),
  }));

  const totalCount = fields.length;
  const filledCount = fields.filter(f => f.filled).length;
  const percent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  const coreFields = fields.filter(f => f.isCoreLocked);
  const coreFilledCount = coreFields.filter(f => f.filled).length;

  const sectionOrder: Array<{ id: ProfileFieldMetric['section']; title: string }> = [
    { id: 'core', title: 'مشخصات پایه هویتی (ثابت)' },
    { id: 'identity', title: 'اطلاعات شناسنامه‌ای و سکونتی' },
    { id: 'academic', title: 'سوابق علمی و حوزوی' },
    { id: 'association', title: 'سوابق در مرکز دانش‌آموختگان' },
    { id: 'career', title: 'اطلاعات شغلی و قضایی' },
  ];

  const sections = sectionOrder.map(sec => {
    const secFields = fields.filter(f => f.section === sec.id);
    const secFilled = secFields.filter(f => f.filled).length;
    const secTotal = secFields.length;
    return {
      id: sec.id,
      title: sec.title,
      filledCount: secFilled,
      totalCount: secTotal,
      percent: secTotal > 0 ? Math.round((secFilled / secTotal) * 100) : 100,
    };
  });

  const missingLabels = fields
    .filter(f => !f.filled && !f.isCoreLocked)
    .map(f => f.label);

  return {
    percent,
    percentage: percent,
    filledCount,
    totalCount,
    coreFilledCount,
    coreTotalCount: coreFields.length,
    missingLabels,
    sections,
    fields,
  };
}

export const calculateProfileCompletion = computeProfileCompletion;

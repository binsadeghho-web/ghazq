import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WelfareLoanTermsAndRules } from '../../types/welfare';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  FileText,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  AlertCircle,
  Shield,
  Coins,
  Calendar,
  UserCheck,
  Check,
  Edit2,
  Scale
} from 'lucide-react';

export const WelfareLoanRulesEditor: React.FC = () => {
  const { loanTermsAndRules, updateLoanTermsAndRules } = useApp();
  const [formData, setFormData] = useState<WelfareLoanTermsAndRules>({ ...loanTermsAndRules });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New eligibility criterion input
  const [newCriterion, setNewCriterion] = useState('');
  // New document requirement input
  const [newDocument, setNewDocument] = useState('');

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateLoanTermsAndRules(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setFormData(prev => ({
      ...prev,
      eligibilityCriteria: [...prev.eligibilityCriteria, newCriterion.trim()]
    }));
    setNewCriterion('');
  };

  const handleRemoveCriterion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eligibilityCriteria: prev.eligibilityCriteria.filter((_, i) => i !== index)
    }));
  };

  const handleAddDocument = () => {
    if (!newDocument.trim()) return;
    setFormData(prev => ({
      ...prev,
      requiredDocuments: [...prev.requiredDocuments, newDocument.trim()]
    }));
    setNewDocument('');
  };

  const handleRemoveDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: prev.requiredDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateTier = (id: string, field: 'amount' | 'installments' | 'targetGroup', value: string) => {
    setFormData(prev => ({
      ...prev,
      specialLoanTiers: prev.specialLoanTiers.map(t => (t.id === id ? { ...t, [field]: value } : t))
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white shadow-md border border-amber-800/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Scale className="w-4 h-4" />
            </span>
            <h3 className="font-black text-base">تدوین و ویرایش ۱۰۰٪ ضوابط، آیین‌نامه و شرایط تسهیلات صندوق</h3>
          </div>
          <p className="text-xs text-stone-300 mt-1">
            تعیین سقف مبالغ، کارمزد، شرایط احراز اعضا، مدارک الزامی، دوره تنفس بازپرداخت و متن رسمی اساسنامه مصوب هیئت امنا
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" />
              ضوابط ذخیره و اعمال شد
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره کلیه ضوابط و آیین‌نامه</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Loan Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-2">
          <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-700" />
            سقف تسهیلات قرض‌الحسنه اصلی (تومان):
          </label>
          <input
            type="number"
            value={formData.maxLoanAmount}
            onChange={e => {
              const val = Number(e.target.value) || 0;
              setFormData(prev => ({
                ...prev,
                maxLoanAmount: val,
                maxLoanAmountDisplay: `${val.toLocaleString('fa-IR')} تومان`
              }));
            }}
            className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold font-mono"
          />
          <p className="text-[11px] text-stone-500">
            نمایش فعلی به اعضا: <span className="font-bold text-amber-800">{formData.maxLoanAmountDisplay}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-2">
          <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-teal-700" />
            حداکثر تعداد اقساط ماهانه:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">تعداد ماه‌ها:</span>
              <input
                type="number"
                value={formData.maxInstallments}
                onChange={e => setFormData(prev => ({ ...prev, maxInstallments: Number(e.target.value) || 36 }))}
                className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">دوره تنفس (ماه):</span>
              <input
                type="number"
                value={formData.installmentGracePeriodMonths}
                onChange={e => setFormData(prev => ({ ...prev, installmentGracePeriodMonths: Number(e.target.value) || 0 }))}
                className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-2">
          <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            کارمزد و تعداد ضامن الزامی:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">کارمزد سالیانه (٪):</span>
              <input
                type="number"
                value={formData.loanCommissionRate}
                onChange={e => setFormData(prev => ({ ...prev, loanCommissionRate: Number(e.target.value) || 0 }))}
                className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block mb-1">تعداد ضامنین:</span>
              <input
                type="number"
                value={formData.guarantorsRequired}
                onChange={e => setFormData(prev => ({ ...prev, guarantorsRequired: Number(e.target.value) || 1 }))}
                className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Guarantor Details Input */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-2">
        <label className="text-xs font-black text-stone-800">شرایط دقیق پذیرش ضامن و تضامین معتبر:</label>
        <input
          type="text"
          value={formData.guarantorConditionText}
          onChange={e => setFormData(prev => ({ ...prev, guarantorConditionText: e.target.value }))}
          className="w-full p-2.5 text-xs rounded-xl border border-stone-300"
          placeholder="مثلاً: یک نفر همکار قضایی شاغل یا ارائه چک صیادی بنفش با کسر از حقوق"
        />
      </div>

      {/* Two Column: Eligibility Criteria & Required Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ELIGIBILITY CRITERIA */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              شرایط احراز دریافت وام ({toPersianNumbers(formData.eligibilityCriteria.length)} بند)
            </h4>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {formData.eligibilityCriteria.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <span className="text-stone-800 leading-relaxed">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCriterion(idx)}
                  className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                  title="حذف این بند"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-stone-100">
            <input
              type="text"
              placeholder="افزودن بند شرط احراز جدید..."
              value={newCriterion}
              onChange={e => setNewCriterion(e.target.value)}
              className="flex-1 p-2 text-xs rounded-xl border border-stone-300"
            />
            <button
              type="button"
              onClick={handleAddCriterion}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              افزودن
            </button>
          </div>
        </div>

        {/* REQUIRED DOCUMENTS */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
            <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              مدارک و مستندات الزامی پرونده ({toPersianNumbers(formData.requiredDocuments.length)} مورد)
            </h4>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {formData.requiredDocuments.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {toPersianNumbers(idx + 1)}
                  </span>
                  <span className="text-stone-800 leading-relaxed">{item}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(idx)}
                  className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                  title="حذف این مدرک"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-stone-100">
            <input
              type="text"
              placeholder="افزودن مدرک مورد نیاز جدید..."
              value={newDocument}
              onChange={e => setNewDocument(e.target.value)}
              className="flex-1 p-2 text-xs rounded-xl border border-stone-300"
            />
            <button
              type="button"
              onClick={handleAddDocument}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              افزودن
            </button>
          </div>
        </div>
      </div>

      {/* SPECIAL LOAN TIERS (مسکن، ازدواج، اضطراری) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
        <h4 className="font-black text-xs text-stone-900 flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-teal-800" />
          بسته‌های اختصاصی تسهیلات هدفمند (ودیعه مسکن، ازدواج، اضطراری درمان)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {formData.specialLoanTiers.map(tier => (
            <div key={tier.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
              <span className="text-xs font-black text-teal-900 block">{tier.title}</span>
              <div>
                <label className="text-[10px] font-bold text-stone-500 block">مبلغ مصوب:</label>
                <input
                  type="text"
                  value={tier.amount}
                  onChange={e => handleUpdateTier(tier.id, 'amount', e.target.value)}
                  className="w-full p-1.5 text-xs rounded-lg border border-stone-300 font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 block">شرایط اقساط:</label>
                <input
                  type="text"
                  value={tier.installments}
                  onChange={e => handleUpdateTier(tier.id, 'installments', e.target.value)}
                  className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 block">جامعه هدف:</label>
                <input
                  type="text"
                  value={tier.targetGroup}
                  onChange={e => handleUpdateTier(tier.id, 'targetGroup', e.target.value)}
                  className="w-full p-1.5 text-xs rounded-lg border border-stone-300 bg-white text-stone-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OFFICIAL CHARTER FULL TEXT */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-stone-600" />
            متن کامل اساسنامه و ضوابط مصوب هیئت امنای صندوق قرض‌الحسنه:
          </label>
          <span className="text-[11px] text-stone-400">نمایش رسمی در تب آیین‌نامه برای اعضا</span>
        </div>
        <textarea
          rows={5}
          value={formData.officialCharterText}
          onChange={e => setFormData(prev => ({ ...prev, officialCharterText: e.target.value }))}
          className="w-full p-3 text-xs rounded-xl border border-stone-300 leading-relaxed font-sans"
        />
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-teal-850 bg-teal-900 hover:bg-teal-950 text-white text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4 text-amber-400" />
          <span>ثبت قطعی تغییرات و بروزرسانی ضوابط وام</span>
        </button>
      </div>
    </form>
  );
};

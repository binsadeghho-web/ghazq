import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WelfareRequest } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Home,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  Users,
  Search,
  Filter,
  FileCheck,
  Send,
  Building,
  Key,
  ShieldCheck,
  X
} from 'lucide-react';

export const WelfareAccommodationsManager: React.FC = () => {
  const { welfareRequests, updateWelfareStatus } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WelfareRequest['status']>('all');
  const [selectedStay, setSelectedStay] = useState<WelfareRequest | null>(null);

  // Approval Modal Form
  const [stayApprovalForm, setStayApprovalForm] = useState({
    assignedSuite: 'سوئیت شماره ۳۰۲ (ویژه اساتید و قضات)',
    voucherCode: `STAY-${Math.floor(100000 + Math.random() * 900000)}`,
    adminNote: 'معرفی‌نامه اسکان صادر شد. کلید سوئیت در محل به همراه کارت شناسایی تحویل پژوهشگر می‌گردد.'
  });

  const stayRequests = welfareRequests.filter(r => r.type === 'accommodation');

  const filteredRequests = stayRequests.filter(r => {
    const matchesSearch =
      (r.applicantName || '').includes(searchQuery) ||
      (r.title || '').includes(searchQuery) ||
      (r.requestedValue || '').includes(searchQuery) ||
      (r.description || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = stayRequests.filter(r => r.status === 'pending').length;
  const approvedCount = stayRequests.filter(r => r.status === 'approved' || r.status === 'disbursed').length;

  const handleApprove = () => {
    if (!selectedStay) return;
    const fullNote = `${stayApprovalForm.adminNote} [${stayApprovalForm.assignedSuite} - کد رهگیری: ${stayApprovalForm.voucherCode}]`;
    updateWelfareStatus(selectedStay.id, 'approved', fullNote);
    setSelectedStay(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-1">
          <span className="text-stone-500 text-xs">کل درخواست‌های اسکان زیارتی:</span>
          <p className="text-xl font-black text-stone-900 font-mono">{toPersianNumbers(stayRequests.length)} فقره</p>
          <p className="text-[11px] text-teal-800 font-bold">مشهد مقدس و شهر مقدس قم</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-1">
          <span className="text-stone-500 text-xs">در انتظار تایید و تخصیص سوئیت:</span>
          <p className="text-xl font-black text-amber-700 font-mono">{toPersianNumbers(pendingCount)} درخواست</p>
          <p className="text-[11px] text-amber-800 font-bold">بررسی ظرفیت مهمان‌سرا</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-1">
          <span className="text-stone-500 text-xs">معرفی‌نامه‌های صادرشده:</span>
          <p className="text-xl font-black text-emerald-800 font-mono">{toPersianNumbers(approvedCount)} مجوز</p>
          <p className="text-[11px] text-emerald-700 font-bold">اسکان قطعی با کلید دیجیتال</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو در نام متقاضی، شهر یا مشخصات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
            <span className="text-xs font-bold text-stone-500 shrink-0">فیلتر:</span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st === 'all'
                  ? 'همه درخواست‌ها'
                  : st === 'pending'
                  ? 'در انتظار بررسی'
                  : st === 'approved'
                  ? 'تصویب‌شده'
                  : 'رد شده'}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const isApproved = req.status === 'approved' || req.status === 'disbursed';
            const isPending = req.status === 'pending';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className="p-5 rounded-2xl border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-xs text-stone-900">{req.applicantName}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                      {req.requestedValue}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isApproved ? 'مجوز اسکان صادر شد' : isPending ? 'در انتظار تایید' : 'عدم موافقت'}
                    </span>
                  </div>

                  <h4 className="font-black text-xs text-stone-800">{req.title}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans max-w-2xl">{req.description}</p>

                  {req.adminNote && (
                    <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200/60 text-xs text-teal-900 font-medium">
                      <span className="font-bold">یادداشت اداری / کد رهگیری:</span> {req.adminNote}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  {isPending && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedStay(req);
                          setStayApprovalForm({
                            assignedSuite: 'سوئیت شماره ۳۰۲ (ویژه اساتید و قضات)',
                            voucherCode: `STAY-${Math.floor(100000 + Math.random() * 900000)}`,
                            adminNote: 'معرفی‌نامه اسکان صادر شد. کلید سوئیت در محل به همراه کارت شناسایی تحویل پژوهشگر می‌گردد.'
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>صدور معرفی‌نامه و تخصیص سوئیت</span>
                      </button>

                      <button
                        onClick={() => {
                          const reason = prompt('لطفاً دلیل عدم موافقت با اسکان را وارد نمایید:');
                          if (reason) {
                            updateWelfareStatus(req.id, 'rejected', reason);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold cursor-pointer"
                      >
                        رد درخواست
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* APPROVAL MODAL */}
      {selectedStay && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-base text-stone-900">صدور معرفی‌نامه رسمی اقامتگاه</h3>
              <button
                onClick={() => setSelectedStay(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
              <p>
                متقاضی: <span className="font-bold text-stone-900">{selectedStay.applicantName}</span>
              </p>
              <p>
                مدت درخواست: <span className="font-bold text-teal-800">{selectedStay.requestedValue}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">واحد و شماره سوئیت تخصیصی:</label>
                <input
                  type="text"
                  value={stayApprovalForm.assignedSuite}
                  onChange={e => setStayApprovalForm(prev => ({ ...prev, assignedSuite: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">کد رهگیری معرفی‌نامه رسمی:</label>
                <input
                  type="text"
                  value={stayApprovalForm.voucherCode}
                  onChange={e => setStayApprovalForm(prev => ({ ...prev, voucherCode: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">توضیحات و راهنمای تحویل کلید:</label>
                <textarea
                  rows={2}
                  value={stayApprovalForm.adminNote}
                  onChange={e => setStayApprovalForm(prev => ({ ...prev, adminNote: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 leading-relaxed text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setSelectedStay(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                صدور و ارسال معرفی‌نامه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

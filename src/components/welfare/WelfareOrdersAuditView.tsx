import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsumableOrder, ConsumableItem } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  FileText,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Sparkles,
  BarChart3,
  MapPin,
  Calendar,
  X
} from 'lucide-react';

export const WelfareOrdersAuditView: React.FC = () => {
  const { consumables, consumableOrders, updateConsumableOrderStatus } = useApp();

  const [activeTab, setActiveTab] = useState<'item_by_item' | 'unified_ledger' | 'financial_audit'>('item_by_item');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(consumables[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ConsumableOrder['status']>('all');
  const [inspectOrder, setInspectOrder] = useState<ConsumableOrder | null>(null);

  // Status mapping
  const STATUS_LABELS: Record<ConsumableOrder['status'], { label: string; bg: string; text: string }> = {
    registered: { label: 'ثبت اولیه', bg: 'bg-amber-100', text: 'text-amber-800' },
    prepared: { label: 'در حال بسته‌بندی و آماده‌سازی', bg: 'bg-blue-100', text: 'text-blue-800' },
    dispatched: { label: 'تحویل به پست / پیک سازمانی', bg: 'bg-indigo-100', text: 'text-indigo-800' },
    delivered: { label: 'تحویل نهایی به دانش‌آموخته', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    cancelled: { label: 'لغو شده', bg: 'bg-rose-100', text: 'text-rose-800' }
  };

  /* =========================================================================
     FINANCIAL AUDIT CALCULATIONS
     ========================================================================= */
  const totalCooperativeSales = consumableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Estimate total market price value and subsidy
  let totalMarketValue = 0;
  let totalUnitsSold = 0;

  consumableOrders.forEach(order => {
    order.items?.forEach(orderItem => {
      totalUnitsSold += orderItem.quantity;
      const matched = consumables.find(c => c.id === orderItem.itemId);
      const mktPrice = matched ? matched.marketPrice : (orderItem.unitPrice * 1.35);
      totalMarketValue += mktPrice * orderItem.quantity;
    });
  });

  const totalSubsidyGiven = Math.max(0, totalMarketValue - totalCooperativeSales);
  const averageDiscountPercent = totalMarketValue > 0 ? Math.round((totalSubsidyGiven / totalMarketValue) * 100) : 0;

  /* =========================================================================
     ITEM-BY-ITEM DATA AGGREGATION
     ========================================================================= */
  const itemStats = consumables.map(item => {
    // Find all orders that bought this item
    const buyers: Array<{
      orderId: string;
      applicantName: string;
      quantity: number;
      unitPrice: number;
      totalItemAmount: number;
      orderDate: string;
      orderStatus: ConsumableOrder['status'];
      deliveryAddress: string;
    }> = [];

    let totalSold = 0;

    consumableOrders.forEach(order => {
      const match = order.items?.find(it => it.itemId === item.id);
      if (match) {
        totalSold += match.quantity;
        buyers.push({
          orderId: order.id,
          applicantName: order.applicantName,
          quantity: match.quantity,
          unitPrice: match.unitPrice,
          totalItemAmount: match.quantity * match.unitPrice,
          orderDate: order.createdAt,
          orderStatus: order.status,
          deliveryAddress: order.deliveryAddress
        });
      }
    });

    return {
      item,
      totalSold,
      totalIncome: totalSold * (item.cooperativePrice || item.memberPrice || 0),
      buyers
    };
  });

  const selectedItemData = itemStats.find(s => s.item.id === selectedItemId) || itemStats[0];

  /* =========================================================================
     UNIFIED ORDERS FILTERING
     ========================================================================= */
  const filteredOrders = consumableOrders.filter(order => {
    const matchesSearch =
      (order.applicantName || '').includes(searchQuery) ||
      (order.id || '').includes(searchQuery) ||
      (order.deliveryAddress || '').includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 4 FINANCIAL AUDIT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>گردش مالی کل تعاونی:</span>
            <DollarSign className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-lg font-black text-stone-900 font-mono">
            {toPersianNumbers(totalCooperativeSales.toLocaleString('fa-IR'))} <span className="text-xs font-sans">تومان</span>
          </p>
          <p className="text-[11px] text-teal-800 font-bold">مجموع فاکتورهای پرداخت‌شده اعضا</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>ارزش سوبسید و تخفیف مرکز:</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-black text-amber-900 font-mono">
            {toPersianNumbers(totalSubsidyGiven.toLocaleString('fa-IR'))} <span className="text-xs font-sans">تومان</span>
          </p>
          <p className="text-[11px] text-amber-800 font-bold">یارانه حمایتی پرداخت‌شده توسط کانون</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>درصد صرفه‌جویی اعضا:</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-lg font-black text-emerald-800 font-mono">
            ٪{toPersianNumbers(averageDiscountPercent)} <span className="text-xs font-sans">نسبت به بازار آزاد</span>
          </p>
          <p className="text-[11px] text-emerald-700 font-bold">ضریب صرفه‌جویی معیشتی خانوار</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>تعداد کل سفارشات و اقلام:</span>
            <Package className="w-4 h-4 text-stone-700" />
          </div>
          <p className="text-lg font-black text-stone-900 font-mono">
            {toPersianNumbers(consumableOrders.length)} <span className="text-xs font-sans">فاکتور</span> ({toPersianNumbers(totalUnitsSold)} قلم)
          </p>
          <p className="text-[11px] text-stone-500 font-bold">توزیع‌شده میان دانش‌آموختگان</p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200">
        <button
          onClick={() => setActiveTab('item_by_item')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'item_by_item'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>سوابق سفارش‌ها به تفکیک هر محصول ({toPersianNumbers(consumables.length)} کالا)</span>
        </button>

        <button
          onClick={() => setActiveTab('unified_ledger')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === 'unified_ledger'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سوابق غیر تفکیک‌شده (لیست کل فاکتورها - {toPersianNumbers(consumableOrders.length)})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ITEM-BY-ITEM ANALYTICS
          ========================================================================= */}
      {activeTab === 'item_by_item' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Sidebar List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-stone-700 px-1 mb-2">انتخاب کالا جهت مشاهده آمار و خریداران:</h4>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {itemStats.map(stat => {
                const isSelected = selectedItemId === stat.item.id;
                return (
                  <button
                    key={stat.item.id}
                    onClick={() => setSelectedItemId(stat.item.id)}
                    className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-900 text-white border-teal-950 shadow-md'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200/90'
                    }`}
                  >
                    <img
                      src={stat.item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                      alt={stat.item.name || stat.item.title}
                      className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs truncate">{stat.item.title || stat.item.name}</h5>
                      <div className="flex items-center justify-between text-[11px] mt-1 opacity-90">
                        <span>فروش: {toPersianNumbers(stat.totalSold)} {stat.item.unit}</span>
                        <span className="font-mono">{toPersianNumbers(stat.buyers.length)} سفارش</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details & Buyers of Selected Item */}
          <div className="lg:col-span-2 space-y-4">
            {selectedItemData && (
              <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-5">
                {/* Product Summary Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedItemData.item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                      alt={selectedItemData.item.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shrink-0"
                    />
                    <div>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                        {selectedItemData.item.category}
                      </span>
                      <h3 className="font-black text-sm text-stone-900 mt-1">{selectedItemData.item.title}</h3>
                      <p className="text-xs text-stone-500 font-bold">{selectedItemData.item.brand}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs">
                    <div>
                      <span className="text-stone-500 block text-[10px]">مجموع فروش:</span>
                      <span className="font-black text-teal-900 font-mono">
                        {toPersianNumbers(selectedItemData.totalSold)} {selectedItemData.item.unit}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-stone-200" />
                    <div>
                      <span className="text-stone-500 block text-[10px]">درآمد ریالی کالا:</span>
                      <span className="font-black text-stone-900 font-mono">
                        {toPersianNumbers(selectedItemData.totalIncome.toLocaleString('fa-IR'))} ت
                      </span>
                    </div>
                    <div className="w-px h-8 bg-stone-200" />
                    <div>
                      <span className="text-stone-500 block text-[10px]">موجودی انبار:</span>
                      <span className="font-black text-emerald-800 font-mono">
                        {toPersianNumbers(selectedItemData.item.stock)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buyers Table */}
                <div className="space-y-3">
                  <h4 className="font-black text-xs text-stone-800 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-teal-700" />
                    ریز سوابق سفارش‌دهندگان و خریداران این محصول:
                  </h4>

                  {selectedItemData.buyers.length === 0 ? (
                    <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-100 text-stone-400 text-xs">
                      هنوز سفارشی روی این محصول ثبت نگردیده است.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-400 font-bold">
                            <th className="pb-2">کد فاکتور</th>
                            <th className="pb-2">دانش‌آموخته خریدار</th>
                            <th className="pb-2">تعداد</th>
                            <th className="pb-2">مبلغ پرداختی</th>
                            <th className="pb-2">تاریخ</th>
                            <th className="pb-2">وضعیت</th>
                            <th className="pb-2">نشانی تحویل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {selectedItemData.buyers.map((b, idx) => {
                            const st = STATUS_LABELS[b.orderStatus] || STATUS_LABELS.registered;
                            return (
                              <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                                <td className="py-3 font-mono font-bold text-teal-900">{b.orderId}</td>
                                <td className="py-3 font-bold text-stone-900">{b.applicantName}</td>
                                <td className="py-3 font-black text-stone-800 font-mono">
                                  {toPersianNumbers(b.quantity)} عدد
                                </td>
                                <td className="py-3 font-mono text-stone-900">
                                  {toPersianNumbers(b.totalItemAmount.toLocaleString('fa-IR'))} ت
                                </td>
                                <td className="py-3 text-stone-500 font-mono">{b.orderDate}</td>
                                <td className="py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} ${st.text}`}>
                                    {st.label}
                                  </span>
                                </td>
                                <td className="py-3 text-[11px] text-stone-500 max-w-[180px] truncate" title={b.deliveryAddress}>
                                  {b.deliveryAddress}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: UNIFIED ORDERS LEDGER (فاکتورهای کلی غیرتفکیک‌شده)
          ========================================================================= */}
      {activeTab === 'unified_ledger' && (
        <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در کد فاکتور، نام خریدار، آدرس..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-500 shrink-0">فیلتر وضعیت:</span>
              {(['all', 'registered', 'prepared', 'dispatched', 'delivered'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-teal-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st === 'all' ? 'همه سفارشات' : STATUS_LABELS[st].label}
                </button>
              ))}
            </div>
          </div>

          {/* Unified Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold">
                  <th className="pb-2.5">شماره فاکتور</th>
                  <th className="pb-2.5">دانش‌آموخته متقاضی</th>
                  <th className="pb-2.5">اقلام خریداری‌شده</th>
                  <th className="pb-2.5">مبلغ کل فاکتور</th>
                  <th className="pb-2.5">تاریخ ثبت</th>
                  <th className="pb-2.5">وضعیت پردازش</th>
                  <th className="pb-2.5">عملیات ادمین</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map(order => {
                  const st = STATUS_LABELS[order.status] || STATUS_LABELS.registered;
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 font-mono font-black text-teal-900">{order.id}</td>
                      <td className="py-3 font-bold text-stone-900">{order.applicantName}</td>
                      <td className="py-3">
                        <div className="space-y-0.5">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-stone-700 font-medium">
                              • {it.title} ({toPersianNumbers(it.quantity)} عدد)
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 font-mono font-black text-stone-900">
                        {toPersianNumbers((order.totalAmount || 0).toLocaleString('fa-IR'))} تومان
                      </td>
                      <td className="py-3 text-stone-500 font-mono">{order.createdAt}</td>
                      <td className="py-3">
                        <select
                          value={order.status}
                          onChange={e =>
                            updateConsumableOrderStatus(order.id, e.target.value as ConsumableOrder['status'])
                          }
                          className={`p-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${st.bg} ${st.text}`}
                        >
                          <option value="registered">ثبت اولیه</option>
                          <option value="prepared">در حال آماده‌سازی</option>
                          <option value="dispatched">ارسال شد (پست/پیک)</option>
                          <option value="delivered">تحویل به دانش‌آموخته</option>
                          <option value="cancelled">لغو سفارش</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => setInspectOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>فاکتور</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECT ORDER MODAL (OFFICIAL INVOICE) */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <span className="text-[10px] text-stone-400 font-mono">فاکتور رسمی تعاونی دانش‌آموختگان</span>
                <h3 className="font-black text-base text-stone-900">سفارش شماره {inspectOrder.id}</h3>
              </div>
              <button
                onClick={() => setInspectOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-500">نام متقاضی:</span>
                <span className="font-bold text-stone-900">{inspectOrder.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">تاریخ ثبت:</span>
                <span className="font-mono text-stone-700">{inspectOrder.createdAt}</span>
              </div>
              <div className="flex justify-between items-start gap-2 pt-1 border-t border-stone-200">
                <span className="text-stone-500 shrink-0">نشانی تحویل:</span>
                <span className="text-stone-800 text-left font-medium leading-relaxed">{inspectOrder.deliveryAddress}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2">
              <h5 className="font-black text-xs text-stone-800">اقلام سفارش:</h5>
              <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-3 bg-white space-y-2">
                {inspectOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                    <div>
                      <span className="font-bold text-stone-900">{it.title}</span>
                      <span className="text-[11px] text-stone-500 block">
                        {toPersianNumbers(it.quantity)} عدد × {toPersianNumbers(it.unitPrice.toLocaleString('fa-IR'))} ت
                      </span>
                    </div>
                    <span className="font-black font-mono text-teal-900">
                      {toPersianNumbers((it.quantity * it.unitPrice).toLocaleString('fa-IR'))} تومان
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 flex justify-between items-center text-xs font-black">
              <span className="text-teal-950">مبلغ کل قابل پرداخت (با سوبسید):</span>
              <span className="text-base text-teal-900 font-mono">
                {toPersianNumbers(inspectOrder.totalAmount.toLocaleString('fa-IR'))} تومان
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectOrder(null)}
                className="px-5 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold cursor-pointer"
              >
                بستن فاکتور
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

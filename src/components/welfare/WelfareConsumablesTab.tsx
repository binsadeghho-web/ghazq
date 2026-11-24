import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  ShoppingCart,
  Truck,
  Store,
  Send,
  CheckCircle2,
  AlertCircle,
  Package,
  Search,
  History,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConsumableItem, DeliveryMethodType } from '../../types';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { formatIsoToJalali } from '../../utils/jalaliDate';

const DELIVERY_LABELS: Record<DeliveryMethodType, string> = {
  in_person: 'تحویل حضوری در دفتر مجتمع',
  post: 'ارسال پستی (پیشتاز)',
  courier: 'ارسال با پیک اختصاصی',
};

export const WelfareConsumablesTab: React.FC = () => {
  const {
    currentUser,
    consumables: rawConsumables,
    consumableOrders,
    welfarePortalConfig,
    placeConsumableOrder,
  } = useApp();

  const consumables = useMemo(
    () =>
      rawConsumables.filter((item) => {
        if (item.isActive === false) return false;
        if (currentUser?.role === 'customer' && item.visibleToCustomer === false) return false;
        return true;
      }),
    [rawConsumables, currentUser]
  );

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodType>('post');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    (currentUser as any)?.residentialAddress || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(consumables.map((c) => c.category).filter(Boolean)))],
    [consumables]
  );

  const filteredItems = useMemo(
    () =>
      consumables.filter((item) => {
        const matchSearch =
          !searchQuery.trim() ||
          (item.title || '').includes(searchQuery) ||
          (item.description || '').includes(searchQuery);
        const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
        return matchSearch && matchCat;
      }),
    [consumables, searchQuery, selectedCategory]
  );

  const cartItems = useMemo(() => {
    return Object.entries(cartQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = consumables.find((c) => c.id === itemId);
        return item ? { item, qty } : null;
      })
      .filter(Boolean) as Array<{ item: ConsumableItem; qty: number }>;
  }, [cartQuantities, consumables]);

  const allowedMethods = useMemo<DeliveryMethodType[]>(() => {
    const allMethods: DeliveryMethodType[] = ['in_person', 'post', 'courier'];
    if (cartItems.length === 0) return allMethods;
    return allMethods.filter((method) =>
      cartItems.every((ci) => {
        const list = ci.item.allowedDeliveryMethods;
        return !list || list.length === 0 || list.includes(method);
      })
    );
  }, [cartItems]);

  const effectiveDeliveryMethod: DeliveryMethodType = allowedMethods.includes(deliveryMethod)
    ? deliveryMethod
    : allowedMethods[0] || 'post';

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, { item, qty }) => sum + Number(item.cooperativePrice || item.memberPrice || 0) * qty,
        0
      ),
    [cartItems]
  );

  const updateQty = (item: ConsumableItem, delta: number) => {
    const isSoldOut = Boolean(item.showAsSoldOutInShowcase) || item.stock <= 0;
    if (isSoldOut && delta > 0) return;
    setCartQuantities((prev) => {
      const next = Math.max(0, Math.min(item.stock, (prev[item.id] || 0) + delta));
      const copy = { ...prev };
      if (next === 0) delete copy[item.id];
      else copy[item.id] = next;
      return copy;
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    const addr =
      effectiveDeliveryMethod === 'in_person'
        ? deliveryAddress.trim() ||
          welfarePortalConfig.contactsConfig?.address ||
          'تحویل حضوری در دفتر امور رفاهی مجتمع'
        : deliveryAddress.trim();

    if (!addr) {
      setFeedback({ type: 'error', text: 'لطفاً نشانی دقیق تحویل را وارد نمایید.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await placeConsumableOrder(
        cartItems.map(({ item, qty }) => ({
          itemId: item.id,
          title: item.title || item.name || 'کالا',
          quantity: qty,
          unitPrice: Number(item.cooperativePrice || item.memberPrice || 0),
        })),
        addr,
        effectiveDeliveryMethod
      );
      setCartQuantities({});
      setActiveSubTab('orders');
      setFeedback({
        type: 'success',
        text: 'سفارش اقلام مصرفی شما با موفقیت ثبت و ذخیره شد.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'خطا در ثبت سفارش کالا.' });
    } finally {
      setSubmitting(false);
    }
  };

  const myOrders = useMemo(
    () =>
      consumableOrders.filter(
        (o) => !currentUser || o.applicantId === currentUser.id
      ),
    [consumableOrders, currentUser]
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header + Sub-tabs */}
      <div className="rounded-3xl bg-gradient-to-l from-[#071E17] via-[#0B2C22] to-[#0D3327] text-white p-5 sm:p-6 shadow-md border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#F3D078]" />
            <h2 className="text-base sm:text-lg font-black">
              {welfarePortalConfig.modulesConfig.consumables.title}
            </h2>
          </div>
          <p className="text-xs text-stone-200 leading-relaxed max-w-2xl">
            {welfarePortalConfig.modulesConfig.consumables.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/10 border border-white/15 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'catalog'
                ? 'bg-[#F3D078] text-[#071E17]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>فهرست کالاها</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
              activeSubTab === 'orders'
                ? 'bg-[#F3D078] text-[#071E17]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
            <span>سفارش‌های من ({toPersianNumbers(myOrders.length)})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {activeSubTab === 'catalog' ? (
        <div className="space-y-5">
          {/* Search & Category Filter */}
          <div className="rounded-2xl border border-stone-200 bg-white p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی کالا..."
                className="w-full min-h-[40px] pr-9 pl-3 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#071E17] text-[#F3D078]'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat === 'all' ? 'همه کالاها' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white py-12 text-center text-stone-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold">در حال حاضر کالایی در این بخش عرضه نشده است.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isSoldOut = Boolean(item.showAsSoldOutInShowcase) || item.stock <= 0;
                const price = Number(item.cooperativePrice || item.memberPrice || 0);
                const mkt = Number(item.marketPrice || price);
                const qty = cartQuantities[item.id] || 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl border bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3 transition-all ${
                      isSoldOut ? 'border-stone-200 opacity-85' : 'border-stone-200/90 hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/70">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-70' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Package className="w-12 h-12" />
                          </div>
                        )}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-stone-950/45 flex items-center justify-center">
                            <span className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-sm font-black shadow-lg">
                              تمام شد
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-[#071E17]/85 text-[#F3D078] text-[10px] font-bold">
                          {item.category}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-[#071E17] line-clamp-1">{item.title}</h3>
                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description || 'کالای عرضه شده با نرخ تعاونی ویژه اعضا'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[10px] text-stone-400 line-through tabular-nums">
                            {mkt > price ? `${toPersianNumbers(mkt.toLocaleString('fa-IR'))} تومان` : ''}
                          </div>
                          <div className="text-sm font-black text-[#071E17] tabular-nums">
                            {toPersianNumbers(price.toLocaleString('fa-IR'))} تومان
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-stone-500 tabular-nums">
                          {isSoldOut
                            ? 'ناموجود'
                            : `موجودی: ${toPersianNumbers(item.stock)} ${item.unit || 'عدد'}`}
                        </span>
                      </div>

                      {isSoldOut ? (
                        <button
                          type="button"
                          disabled
                          className="w-full min-h-[44px] rounded-xl bg-stone-100 text-stone-400 text-xs font-black cursor-not-allowed"
                        >
                          تمام شد
                        </button>
                      ) : qty > 0 ? (
                        <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item, -1)}
                            className="min-h-[40px] min-w-[40px] rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-800 cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-black text-[#071E17] tabular-nums">
                            {toPersianNumbers(qty)} {item.unit || 'عدد'} در سبد
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(item, 1)}
                            className="min-h-[40px] min-w-[40px] rounded-lg bg-[#071E17] text-[#F3D078] flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQty(item, 1)}
                          className="w-full min-h-[44px] rounded-xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>افزودن به سبد خرید</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Checkout Form when Cart has items */}
          {cartItems.length > 0 && (
            <form
              onSubmit={handleCheckout}
              className="rounded-3xl border-2 border-[#071E17] bg-[#FCFCF9] p-5 sm:p-6 shadow-lg space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#071E17]" />
                  <h3 className="text-sm font-black text-[#071E17]">تکمیل سفارش و انتخاب روش تحویل</h3>
                </div>
                <span className="text-sm font-black text-emerald-900 tabular-nums">
                  جمع کل: {toPersianNumbers(cartTotal.toLocaleString('fa-IR'))} تومان
                </span>
              </div>

              {/* Delivery Method Picker */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-800 block">
                  انتخاب روش دریافت کالا:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['in_person', 'post', 'courier'] as DeliveryMethodType[]).map((method) => {
                    const isAllowed = allowedMethods.includes(method);
                    return (
                      <button
                        key={method}
                        type="button"
                        disabled={!isAllowed}
                        onClick={() => setDeliveryMethod(method)}
                        className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                          !isAllowed
                            ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                            : effectiveDeliveryMethod === method
                            ? 'bg-[#071E17] text-[#F3D078] border-[#071E17] shadow-xs cursor-pointer'
                            : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50 cursor-pointer'
                        }`}
                      >
                        {method === 'in_person' ? (
                          <Store className="w-4 h-4" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                        <span>{DELIVERY_LABELS[method]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {effectiveDeliveryMethod === 'in_person' ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-bold">
                  نشانی تحویل حضوری:{' '}
                  {welfarePortalConfig.contactsConfig?.address ||
                    'قم، مجتمع فقه و حقوق اسلامی، واحد امور رفاهی'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-800 block">
                    نشانی دقیق تحویل و کد پستی <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="استان، شهر، خیابان، پلاک، واحد و شماره تماس گیرنده..."
                    className="w-full p-3 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[46px] px-7 py-2.5 rounded-2xl bg-[#071E17] hover:bg-[#0B2C22] text-[#F3D078] text-xs font-black flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'در حال ثبت سفارش...' : 'ثبت قطعی سفارش'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-[#071E17] border-b border-stone-100 pb-3">
            سوابق سفارش‌های اقلام مصرفی من
          </h3>

          {myOrders.length === 0 ? (
            <div className="py-10 text-center text-stone-400 text-xs font-bold">
              تاکنون سفارشی ثبت نکرده‌اید.
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl border border-stone-200/80 bg-[#FCFCF9] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm font-black text-[#071E17] tabular-nums">
                      سفارش {ord.trackingCode || ord.id.slice(0, 8)} ·{' '}
                      {toPersianNumbers(ord.totalAmount.toLocaleString('fa-IR'))} تومان
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-black">
                      {ord.shippingStatus ||
                        (ord.status === 'delivered'
                          ? 'تحویل داده شد'
                          : ord.status === 'dispatched'
                          ? 'ارسال شده'
                          : 'در حال آماده‌سازی')}
                    </span>
                  </div>

                  <div className="text-xs text-stone-600">
                    اقلام:{' '}
                    {(ord.items || [])
                      .map((it) => `${it.title} (${toPersianNumbers(it.quantity)})`)
                      .join(' · ')}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-1 border-t border-stone-200/60 tabular-nums">
                    <span>
                      روش تحویل: {DELIVERY_LABELS[(ord.deliveryMethod as DeliveryMethodType) || 'post']}
                    </span>
                    <span>تاریخ: {formatIsoToJalali(ord.createdAt)}</span>
                    {ord.postalTrackingCode && (
                      <span className="font-black text-[#071E17]">
                        کد رهگیری مرسوله: {ord.postalTrackingCode}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

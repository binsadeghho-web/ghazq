import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductOrder, ProductsStoreConfig, User } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import { api } from '../../../services/apiClient';
import { resolveProductCoverUrl } from '../../../data/showcaseImages';
import {
  DELIVERY_METHOD_LABELS,
  formatTomans,
  getEffectiveDeliveryOptions,
} from './productUiHelpers';
import {
  X,
  Truck,
  Building2,
  Send,
  FileDown,
  Package,
  UploadCloud,
  CreditCard,
  CheckCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

interface ProductCheckoutModalProps {
  product: Product | null;
  currentUser: User | null;
  storeConfig: ProductsStoreConfig;
  onClose: () => void;
  onSubmitPurchase: (payload: {
    purchaseFormat: 'digital' | 'physical';
    deliveryMethod?: 'complex_pickup' | 'postal' | 'courier' | 'digital_instant';
    paymentMethod: 'online_gateway' | 'bank_receipt';
    gatewayId?: string;
    shippingAddress?: string;
    receiptFileUrl?: string;
    receiptBankName?: string;
    receiptTrackingCode?: string;
  }) => Promise<{ product: Product; order: ProductOrder }>;
}

export const ProductCheckoutModal: React.FC<ProductCheckoutModalProps> = ({
  product,
  currentUser,
  storeConfig,
  onClose,
  onSubmitPurchase,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [purchaseFormat, setPurchaseFormat] = useState<'digital' | 'physical'>('digital');
  const [deliveryMethod, setDeliveryMethod] = useState<'complex_pickup' | 'postal' | 'courier'>('postal');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online_gateway' | 'bank_receipt'>('online_gateway');
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');
  const [receiptBankName, setReceiptBankName] = useState('');
  const [receiptFileUrl, setReceiptFileUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<ProductOrder | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;
    setStep(1);
    setErrorMsg(null);
    setCompletedOrder(null);
    setReceiptFileUrl('');
    setReceiptFileName('');

    const defaultFmt: 'digital' | 'physical' =
      product.supportsDigital !== false ? 'digital' : 'physical';
    setPurchaseFormat(defaultFmt);

    const effDelivery = getEffectiveDeliveryOptions(product, storeConfig.defaultDeliveryOptions);
    if (effDelivery.postal.enabled) setDeliveryMethod('postal');
    else if (effDelivery.complexPickup.enabled) setDeliveryMethod('complex_pickup');
    else setDeliveryMethod('courier');

    setShippingAddress(currentUser?.residentialAddress || '');

    const policy = product.allowedPaymentMethod || 'both';
    setPaymentMethod(policy === 'receipt_only' ? 'bank_receipt' : 'online_gateway');

    const activeGws = (storeConfig.gateways || []).filter(g => g.isActive);
    setSelectedGatewayId(activeGws[0]?.id || '');
    setReceiptBankName(storeConfig.bankName || 'بانک ملی ایران');
  }, [product, currentUser?.residentialAddress, storeConfig]);

  if (!product) return null;

  const hasDigital = product.supportsDigital !== false;
  const hasPhysical = Boolean(product.supportsPhysical);
  const effDelivery = getEffectiveDeliveryOptions(product, storeConfig.defaultDeliveryOptions);
  const activeGateways = (storeConfig.gateways || []).filter(g => g.isActive);
  const paymentPolicy = product.allowedPaymentMethod || 'both';

  const basePrice =
    purchaseFormat === 'digital'
      ? Math.max(0, Number(product.digitalPrice ?? product.price ?? 0))
      : Math.max(0, Number(product.physicalPrice ?? product.price ?? 0));

  const selectedDeliveryOpt =
    deliveryMethod === 'complex_pickup'
      ? effDelivery.complexPickup
      : deliveryMethod === 'courier'
      ? effDelivery.courier
      : effDelivery.postal;

  const shippingFee = purchaseFormat === 'physical' ? Math.max(0, Number(selectedDeliveryOpt.fee || 0)) : 0;
  const grandTotal = basePrice + shippingFee;

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingReceipt(true);
      setErrorMsg(null);
      const res = await api.uploadFile(file, 'product_receipt');
      setReceiptFileUrl(res.url);
      setReceiptFileName(file.name);
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در بارگذاری تصویر فیش بانکی');
    } finally {
      setUploadingReceipt(false);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  const handleNextToStep2 = () => {
    setErrorMsg(null);
    if (purchaseFormat === 'physical' && (deliveryMethod === 'postal' || deliveryMethod === 'courier')) {
      if (shippingAddress.trim().length < 6) {
        setErrorMsg('برای ارسال پستی یا پیک، وارد کردن نشانی دقیق دریافت‌کننده الزامی است.');
        return;
      }
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setErrorMsg(null);
    if (paymentMethod === 'bank_receipt' && !receiptFileUrl) {
      setErrorMsg('لطفاً ابتدا تصویر فیش واریزی را بارگذاری نمایید.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await onSubmitPurchase({
        purchaseFormat,
        deliveryMethod: purchaseFormat === 'digital' ? 'digital_instant' : deliveryMethod,
        paymentMethod,
        gatewayId: paymentMethod === 'online_gateway' ? selectedGatewayId : undefined,
        shippingAddress:
          purchaseFormat === 'physical' && (deliveryMethod === 'postal' || deliveryMethod === 'courier')
            ? shippingAddress.trim()
            : undefined,
        receiptFileUrl: paymentMethod === 'bank_receipt' ? receiptFileUrl : undefined,
        receiptBankName: paymentMethod === 'bank_receipt' ? receiptBankName.trim() : undefined,
      });
      setCompletedOrder(res.order);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err?.message || 'خطا در ثبت نهایی سفارش');
    } finally {
      setSubmitting(false);
    }
  };

  const coverUrl = resolveProductCoverUrl(product.coverImage, product.format);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        dir="rtl"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[11px] text-amber-400 font-bold block">
                مرحله {toPersianNumbers(step)} از ۳ ·{' '}
                {step === 1
                  ? 'انتخاب نوع نسخه، روش تحویل و تایید مبلغ'
                  : step === 2
                  ? 'بازبینی مشخصات خریدار و پرداخت از درگاه یا فیش'
                  : 'تایید نهایی و دریافت کد رهگیری سفارش'}
              </span>
              <h3 className="text-base font-black text-white truncate">{product.title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img src={coverUrl} alt={product.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <strong className="text-sm font-black text-slate-900 dark:text-white block truncate">
                      {product.title}
                    </strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {product.authorOrPresenter}
                    </span>
                  </div>
                </div>

                {/* Digital vs Physical Selection */}
                <div className="space-y-2.5">
                  <label className="block font-black text-slate-900 dark:text-white text-xs">
                    ۱. انتخاب نوع دریافت و خرید اثر:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hasDigital && (
                      <button
                        type="button"
                        onClick={() => setPurchaseFormat('digital')}
                        className={`text-right p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          purchaseFormat === 'digital'
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileDown className="w-4 h-4 text-emerald-500" />
                            <span>نسخه دیجیتال (PDF / فایل)</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {product.digitalFormatLabel || 'دانلود و دسترسی آنی'}
                        </span>
                        <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums block mt-2">
                          {formatTomans(product.digitalPrice ?? product.price)}
                        </strong>
                      </button>
                    )}

                    {hasPhysical && (
                      <button
                        type="button"
                        onClick={() => setPurchaseFormat('physical')}
                        className={`text-right p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          purchaseFormat === 'physical'
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-amber-500" />
                            <span>نسخه فیزیکی</span>
                          </span>
                          <span className="text-[10px] text-slate-500 tabular-nums">
                            موجودی: {toPersianNumbers(product.stock ?? 0)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {product.physicalFormatLabel || 'ارسال فیزیکی / تحویل حضوری'}
                        </span>
                        <strong className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums block mt-2">
                          {formatTomans(product.physicalPrice ?? product.price)}
                        </strong>
                      </button>
                    )}
                  </div>
                </div>

                {/* Physical Delivery Choices */}
                {purchaseFormat === 'physical' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="block font-black text-slate-900 dark:text-white">
                      ۲. انتخاب شیوه تحویل نسخه فیزیکی (هزینه ارسال به مبلغ کل اضافه می‌شود):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          key: 'complex_pickup' as const,
                          opt: effDelivery.complexPickup,
                          icon: <Building2 className="w-4 h-4 text-emerald-500" />,
                        },
                        {
                          key: 'postal' as const,
                          opt: effDelivery.postal,
                          icon: <Truck className="w-4 h-4 text-amber-500" />,
                        },
                        {
                          key: 'courier' as const,
                          opt: effDelivery.courier,
                          icon: <Send className="w-4 h-4 text-sky-500" />,
                        },
                      ]
                        .filter(item => item.opt.enabled)
                        .map(item => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setDeliveryMethod(item.key)}
                            className={`text-right p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              deliveryMethod === item.key
                                ? 'border-amber-500 bg-white dark:bg-slate-900 shadow-xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                              {item.icon}
                              <span>{item.opt.label || DELIVERY_METHOD_LABELS[item.key]}</span>
                            </div>
                            <strong className="block mt-1.5 text-amber-600 dark:text-amber-400 font-black tabular-nums">
                              {item.opt.fee === 0 ? 'رایگان' : `+ ${formatTomans(item.opt.fee)}`}
                            </strong>
                            {item.opt.notice && (
                              <span className="block mt-1 text-[10px] text-slate-500 leading-relaxed">
                                {item.opt.notice}
                              </span>
                            )}
                          </button>
                        ))}
                    </div>

                    {(deliveryMethod === 'postal' || deliveryMethod === 'courier') && (
                      <div className="pt-2">
                        <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                          نشانی دقیق پستی / آدرس تحویل مرسوله:
                        </label>
                        <textarea
                          rows={2}
                          value={shippingAddress}
                          onChange={e => setShippingAddress(e.target.value)}
                          placeholder="استان، شهر، خیابان، کوچه، پلاک، کد پستی..."
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Total Price Box */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block">
                      مبلغ تاییدشده جهت پرداخت:
                    </span>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
                      قیمت اثر: {formatTomans(basePrice)}
                      {shippingFee > 0 ? ` + هزینه ارسال: ${formatTomans(shippingFee)}` : ''}
                    </div>
                  </div>
                  <strong className="text-lg font-black text-amber-700 dark:text-amber-400 tabular-nums">
                    {formatTomans(grandTotal)}
                  </strong>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-5">
                {/* User Profile Review */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>مشخصات ثبت‌شده شما برای صدور فاکتور و رهگیری:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block">نام و نام خانوادگی:</span>
                      <strong className="text-slate-900 dark:text-white">{currentUser?.fullName || 'کاربر سامانه'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">کد ملی / شناسه:</span>
                      <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                        {toPersianNumbers(currentUser?.nationalId || '—')}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">شماره تماس:</span>
                      <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                        {toPersianNumbers(currentUser?.phone || '—')}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">
                      انتخاب شما: <strong>{purchaseFormat === 'digital' ? 'نسخه دیجیتال' : 'نسخه فیزیکی'}</strong>
                      {purchaseFormat === 'physical' ? ` (${DELIVERY_METHOD_LABELS[deliveryMethod]})` : ''}
                    </span>
                    <strong className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      جمع کل قابل پرداخت: {formatTomans(grandTotal)}
                    </strong>
                  </div>
                </div>

                {/* Payment Method & Gateways */}
                <div className="space-y-3">
                  <label className="block font-black text-slate-900 dark:text-white">
                    انتخاب درگاه پرداخت یا بارگذاری فیش بانکی:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(paymentPolicy === 'both' || paymentPolicy === 'gateway_only') && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('online_gateway')}
                        className={`text-right p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'online_gateway'
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-500 mb-1" />
                        <strong className="block text-slate-900 dark:text-white">پرداخت از طریق درگاه سیستم</strong>
                        <span className="text-[11px] text-slate-500">تایید آنی و صدور فوری کد رهگیری</span>
                      </button>
                    )}

                    {(paymentPolicy === 'both' || paymentPolicy === 'receipt_only') && (
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_receipt')}
                        className={`text-right p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'bank_receipt'
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4 text-amber-500 mb-1" />
                        <strong className="block text-slate-900 dark:text-white">بارگذاری تصویر فیش بانکی</strong>
                        <span className="text-[11px] text-slate-500">واریز به حساب مرکز و تایید واحد مالی</span>
                      </button>
                    )}
                  </div>

                  {paymentMethod === 'online_gateway' ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        درگاه پرداخت مورد نظر را انتخاب کنید:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeGateways.map(gw => (
                          <button
                            key={gw.id}
                            type="button"
                            onClick={() => setSelectedGatewayId(gw.id)}
                            className={`text-right p-3 rounded-xl border-2 cursor-pointer ${
                              selectedGatewayId === gw.id
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <strong className="block text-slate-900 dark:text-white">{gw.name}</strong>
                            {gw.description && (
                              <span className="text-[10px] text-slate-500 block mt-0.5">{gw.description}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
                        <strong className="text-amber-900 dark:text-amber-300 block">
                          مشخصات حساب بانکی جهت واریز وجه:
                        </strong>
                        <div>
                          شماره کارت: <span className="font-mono font-black">{storeConfig.bankCardNumber}</span> ·{' '}
                          {storeConfig.bankAccountHolder}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          نام بانک مبدا / شرح واریز:
                        </label>
                        <input
                          type="text"
                          value={receiptBankName}
                          onChange={e => setReceiptBankName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                      </div>

                      <input
                        ref={receiptInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleUploadReceipt}
                        className="hidden"
                      />
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between gap-2">
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {receiptFileName || 'هنوز فیش واریزی بارگذاری نشده است'}
                        </span>
                        <button
                          type="button"
                          disabled={uploadingReceipt}
                          onClick={() => receiptInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-black cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {uploadingReceipt ? 'در حال آپلود...' : 'انتخاب و آپلود فیش'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && completedOrder && (
              <div className="py-4 space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCheck className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    سفارش شما با موفقیت در سیستم ثبت گردید
                  </h4>
                  <p className="text-xs text-slate-500">
                    تراکنش با کد رهگیری یکتا ذخیره شد و از بخش «سفارش‌ها و رهگیری» قابل پیگیری است.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-right space-y-2 max-w-md mx-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">کد رهگیری سفارش:</span>
                    <strong className="font-mono text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                      {toPersianNumbers(completedOrder.trackingCode)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">نوع نسخه:</span>
                    <strong>{completedOrder.purchaseFormat === 'physical' ? 'نسخه فیزیکی' : 'نسخه دیجیتال'}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">نحوه تحویل:</span>
                    <strong>{DELIVERY_METHOD_LABELS[completedOrder.deliveryMethod || 'digital_instant']}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">مبلغ کل تراکنش:</span>
                    <strong className="font-black tabular-nums">{formatTomans(completedOrder.amountPaid)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">وضعیت تایید:</span>
                    <strong>
                      {completedOrder.paymentStatus === 'confirmed'
                        ? 'پرداخت تاییدشده'
                        : 'در انتظار تایید فیش بانکی'}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                بازگشت به مرحله قبل
              </button>
            ) : (
              <div />
            )}

            <div>
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNextToStep2}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md cursor-pointer"
                >
                  تایید نوع و مبلغ، ادامه به مشخصات و درگاه
                </button>
              )}
              {step === 2 && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting
                    ? 'در حال ثبت تراکنش...'
                    : paymentMethod === 'online_gateway'
                    ? 'پرداخت از درگاه و صدور کد رهگیری'
                    : 'ثبت سفارش با فیش و صدور کد رهگیری'}
                </button>
              )}
              {step === 3 && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black cursor-pointer"
                >
                  بستن و مشاهده کتابخانه / سفارش‌ها
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

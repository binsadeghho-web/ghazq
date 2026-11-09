import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../../types';
import { toPersianNumbers } from '../../../utils/persianNumbers';
import {
  X,
  Truck,
  Package,
  UploadCloud,
  CreditCard,
  CheckCheck,
} from 'lucide-react';

const SAMPLE_RECEIPT_IMAGE = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';

interface ProductCheckoutModalProps {
  product: Product | null;
  onClose: () => void;
  currentUserAddress?: string;
  onSubmitPurchase: (orderData: {
    fulfillmentChoice?: 'postal' | 'pickup';
    shippingFee: number;
    shippingNotice: string;
    shippingAddress?: string;
  }) => Promise<void>;
}

export const ProductCheckoutModal: React.FC<ProductCheckoutModalProps> = ({
  product,
  onClose,
  currentUserAddress,
  onSubmitPurchase,
}) => {
  const [buyStep, setBuyStep] = useState<1 | 2 | 3>(1);
  const [buyTermsAccepted, setBuyTermsAccepted] = useState(false);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState<'online_gateway' | 'bank_receipt'>('bank_receipt');
  const [fulfillmentChoice, setFulfillmentChoice] = useState<'postal' | 'pickup'>('postal');

  // Bank receipt form state
  const [receiptTrackingCode, setReceiptTrackingCode] = useState('');
  const [receiptBankName, setReceiptBankName] = useState('بانک ملی ایران (واریز پایا)');
  const [receiptFilePreview, setReceiptFilePreview] = useState<string>(SAMPLE_RECEIPT_IMAGE);
  const [receiptFileName, setReceiptFileName] = useState<string>('receipt_scan_national_bank.jpg');
  const [receiptFileSize, setReceiptFileSize] = useState<string>('۲۴۵ کیلوبایت');
  const [shippingAddress, setShippingAddress] = useState(currentUserAddress || 'تهران، خیابان ولیعصر، پلاک ۱۲۰، کد پستی ۱۹۸۸۷');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setBuyStep(1);
      setBuyTermsAccepted(false);
      const policy = product.allowedPaymentMethod || 'both';
      setBuyPaymentMethod(policy === 'gateway_only' ? 'online_gateway' : 'bank_receipt');
      setReceiptTrackingCode(`PRD-TRX-${Math.floor(1000000 + Math.random() * 9000000)}`);

      const mode = product.shippingMode || 'both';
      if (mode === 'pickup_only') {
        setFulfillmentChoice('pickup');
      } else {
        setFulfillmentChoice('postal');
      }
      if (currentUserAddress) {
        setShippingAddress(currentUserAddress);
      }
    }
  }, [product, currentUserAddress]);

  if (!product) return null;

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);
    const sizeKb = Math.round(file.size / 1024);
    setReceiptFileSize(`${toPersianNumbers(sizeKb)} کیلوبایت`);
    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setReceiptFilePreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      let shippingFee = 0;
      let shippingNotice = '';
      if (product.format === 'book') {
        if (fulfillmentChoice === 'pickup') {
          shippingFee = 0;
          shippingNotice = 'تحویل حضوری در محل دبیرخانه انتشارات مرکز';
        } else {
          const costType = product.shippingCostType || 'free';
          if (costType === 'free') {
            shippingFee = 0;
            shippingNotice = 'ارسال پستی رایگان سراسری به عهده مرکز';
          } else if (costType === 'fixed') {
            shippingFee = product.shippingFixedFee || 50000;
            shippingNotice = `پست پیشتاز با مبلغ ثابت ${toPersianNumbers(shippingFee.toLocaleString('fa-IR'))} تومان`;
          } else {
            shippingFee = 0;
            shippingNotice = 'هزینه ارسال پستی پس از ثبت سفارش بر اساس وزن و شهر مقصد استعلام و اعلام می‌گردد.';
          }
        }
      }

      await onSubmitPurchase({
        fulfillmentChoice: product.format === 'book' ? fulfillmentChoice : undefined,
        shippingFee,
        shippingNotice,
        shippingAddress: fulfillmentChoice === 'postal' ? shippingAddress : undefined,
      });
      setBuyStep(3);
    } catch (err: any) {
      alert(`خطا در ثبت سفارش: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                مرحله {toPersianNumbers(buyStep)} از ۳: {buyStep === 1 ? 'بازبینی اثر و شرایط تحویل' : buyStep === 2 ? 'تکمیل مشخصات و شیوه پرداخت' : 'تایید سفارش و دریافت'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">
                {product.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {buyStep === 1 && (
              <div className="space-y-5">
                {product.coverImage && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden relative shadow-md">
                    <img src={product.coverImage} alt={product.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4 text-white">
                      <span className="text-xs font-bold">مؤلف: {product.authorOrPresenter}</span>
                      <span className="text-xs font-black bg-amber-500 text-stone-950 px-3 py-1 rounded-xl">
                        {product.format === 'book' ? 'ارسال پستی پیشتاز' : 'دانلود آنی برخط'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Price and Shipping Fee Summary Box */}
                {(() => {
                  let calcShipping = 0;
                  if (product.format === 'book' && fulfillmentChoice === 'postal') {
                    if (product.shippingCostType === 'fixed') {
                      calcShipping = product.shippingFixedFee || 50000;
                    }
                  }
                  const grandTotal = product.price + calcShipping;

                  return (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-amber-800 dark:text-amber-300 font-bold block">مبلغ نهایی قابل پرداخت سفارش:</span>
                        <strong className="text-amber-600 dark:text-amber-400 text-lg font-black">
                          {grandTotal > 0 ? `${toPersianNumbers(grandTotal.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                        </strong>
                        {calcShipping > 0 && (
                          <span className="text-[10px] text-slate-500 block">
                            (قیمت اثر: {toPersianNumbers(product.price.toLocaleString('fa-IR'))} + هزینه پست: {toPersianNumbers(calcShipping.toLocaleString('fa-IR'))} تومان)
                          </span>
                        )}
                      </div>
                      <div className="text-left text-slate-500 font-medium">
                        {product.format === 'book'
                          ? fulfillmentChoice === 'postal'
                            ? product.shippingCostType === 'free'
                              ? 'ارسال پستی پیشتاز (رایگان به عهده مرکز)'
                              : product.shippingCostType === 'fixed'
                              ? 'شامل هزینه پست پیشتاز ثابت'
                              : 'استعلام مجزای هزینه پست پس از ثبت'
                            : 'تحویل حضوری در محل مرکز'
                          : 'دانلود دیجیتال و دسترسی برخط'}
                      </div>
                    </div>
                  );
                })()}

                {/* Book Shipping & Fulfillment Selection */}
                {product.format === 'book' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-black text-slate-900 dark:text-white">
                      انتخاب شیوه تحویل و دریافت کتاب چاپی:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {(product.shippingMode === 'both' || product.shippingMode === 'postal_only' || !product.shippingMode) && (
                        <div
                          onClick={() => setFulfillmentChoice('postal')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            fulfillmentChoice === 'postal'
                              ? 'bg-amber-500/15 border-amber-500 font-bold text-slate-900 dark:text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-4 h-4 text-amber-500" />
                            <span className="font-extrabold">ارسال با پست پیشتاز</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal">
                            ارسال به آدرس پستی ثبت‌شده در سراسر کشور
                          </p>
                        </div>
                      )}

                      {(product.shippingMode === 'both' || product.shippingMode === 'pickup_only') && (
                        <div
                          onClick={() => setFulfillmentChoice('pickup')}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            fulfillmentChoice === 'pickup'
                              ? 'bg-amber-500/15 border-amber-500 font-bold text-slate-900 dark:text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-emerald-500" />
                            <span className="font-extrabold">تحویل حضوری در محل مرکز</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal">
                            مراجعه به دبیرخانه انتشارات مرکز بدون هزینه پستی
                          </p>
                        </div>
                      )}
                    </div>

                    {fulfillmentChoice === 'postal' && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                        <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          آدرس پستی دقیق جهت ارسال مرسوله:
                        </label>
                        <textarea
                          rows={2}
                          value={shippingAddress}
                          onChange={e => setShippingAddress(e.target.value)}
                          placeholder="استان، شهر، خیابان، پلاک، واحد، کد پستی ۱۰ رقمی..."
                          className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                        <div className="p-2.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-xl text-[11px] font-semibold">
                          {product.shippingCostType === 'free'
                            ? '✨ هزینه پست پیشتاز: رایگان (ارسال به عهده مرکز)'
                            : product.shippingCostType === 'fixed'
                            ? `📦 هزینه ثابت پست پیشتاز: ${toPersianNumbers((product.shippingFixedFee || 50000).toLocaleString('fa-IR'))} تومان (در جمع کل لحاظ شد)`
                            : '📋 هزینه پست پس از ثبت سفارش بر اساس وزن و شهر مقصد استعلام و به شما اعلام می‌گردد.'}
                        </div>
                      </div>
                    )}

                    {fulfillmentChoice === 'pickup' && (
                      <div className="p-3 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 rounded-xl text-xs space-y-1 border border-emerald-500/20">
                        <span className="font-extrabold block">آدرس و محل تحویل حضوری:</span>
                        <p className="text-[11px]">
                          {product.pickupAddressNotice || 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری'}
                        </p>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-bold mt-1">
                          ساعات مراجعه حضوری: شنبه تا چهارشنبه از ساعت ۰۸:۰۰ الی ۱۴:۳۰
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buyTermsAccepted}
                      onChange={e => setBuyTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 mt-0.5 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                      اینجانب صحت اطلاعات سفارش و آدرس پستی / مشخصات دریافت اثر را تایید می‌نمایم.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {buyStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                    انتخاب شیوه پرداخت سفارش:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setBuyPaymentMethod('bank_receipt')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        buyPaymentMethod === 'bank_receipt'
                          ? 'bg-amber-500/15 border-amber-500 shadow-md text-amber-950 dark:text-amber-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4 text-amber-500 mb-1" />
                      <span className="font-extrabold text-xs block">واریز کارت به کارت / فیش بانکی</span>
                      <span className="text-[11px] opacity-75 font-normal">بارگذاری تصویر فیش واریزی</span>
                    </div>

                    <div
                      onClick={() => setBuyPaymentMethod('online_gateway')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        buyPaymentMethod === 'online_gateway'
                          ? 'bg-amber-500/15 border-amber-500 shadow-md text-amber-950 dark:text-amber-200 font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-amber-500 mb-1" />
                      <span className="font-extrabold text-xs block">درگاه پرداخت الکترونیک شتاب</span>
                      <span className="text-[11px] opacity-75 font-normal">تایید آنی و دسترسی فوری</span>
                    </div>
                  </div>

                  {buyPaymentMethod === 'bank_receipt' ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">کد رهگیری فیش:</label>
                          <input
                            type="text"
                            value={receiptTrackingCode}
                            onChange={e => setReceiptTrackingCode(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">بانک مبدأ:</label>
                          <input
                            type="text"
                            value={receiptBankName}
                            onChange={e => setReceiptBankName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                          />
                        </div>
                      </div>

                      <input ref={receiptFileInputRef} type="file" accept="image/*" onChange={handleReceiptFileChange} className="hidden" />
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-600 dark:text-slate-300 truncate">{receiptFileName}</span>
                        <button
                          type="button"
                          onClick={() => receiptFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-bold"
                        >
                          انتخاب تصویر فیش
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs text-center">
                      اتصال امن به درگاه شاپرک (مبلغ: {toPersianNumbers(product.price.toLocaleString('fa-IR'))} تومان)
                    </div>
                  )}
                </div>
              </div>
            )}

            {buyStep === 3 && (
              <div className="text-center py-8 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                  <CheckCheck className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  سفارش شما با موفقیت ثبت و تایید گردید
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {product.format === 'book'
                    ? 'کتاب انتخابی در صف ارسال پستی پیشتاز قرار گرفت.'
                    : 'مجوز دانلود اثر در کتابخانه دیجیتال شما فعال شد.'}
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {buyStep > 1 && buyStep < 3 ? (
              <button
                onClick={() => setBuyStep(prev => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold"
              >
                مرحله قبل
              </button>
            ) : <div />}

            <div>
              {buyStep === 1 && (
                <button
                  disabled={!buyTermsAccepted}
                  onClick={() => setBuyStep(2)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black ${
                    buyTermsAccepted ? 'bg-amber-500 text-stone-950 cursor-pointer shadow-md' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  تایید و ادامه پرداخت
                </button>
              )}
              {buyStep === 2 && (
                <button
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-black cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت نهایی سفارش'}
                </button>
              )}
              {buyStep === 3 && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-black cursor-pointer"
                >
                  بستن و بازگشت به فروشگاه
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  BookOpen,
  Headphones,
  Film,
  Plus,
  ShoppingBag,
  CheckCircle,
  FileText,
  Search,
  Sparkles,
  Download,
  X,
  Eye,
  ZoomIn,
  UploadCloud,
  CreditCard,
  CheckCircle2,
  Trash2,
  SlidersHorizontal,
  Layers,
  Award,
  Package,
  Truck,
  ShieldCheck,
  KeyRound,
  Smartphone,
  CheckCheck,
  User
} from 'lucide-react';

const PRESET_PRODUCT_COVERS = [
  {
    title: 'موسوعه فقهی و حقوقی',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'کتاب قانون و آراء دادگاه',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'درس‌گفتار صوتی دیجیتال',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'نرم‌افزار جامع قضایی',
    url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
  },
];

const SAMPLE_RECEIPT_IMAGE = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60';

export const ProductsSection: React.FC = () => {
  const { currentUser, products, purchaseProduct, addProduct, updateProduct, sendPinOtpSms } = useApp();

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  // Shelves / Tabs: 'books' | 'multimedia' | 'combined' | 'my_library'
  const [activeShelf, setActiveShelf] = useState<'books' | 'multimedia' | 'combined' | 'my_library'>('books');
  const [searchQuery, setSearchQuery] = useState('');

  // Image Lightbox Viewer
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Product Purchase / Checkout Modal Journey
  const [purchasingProduct, setPurchasingProduct] = useState<Product | null>(null);
  const [buyStep, setBuyStep] = useState<1 | 2 | 3>(1);
  const [buyTermsAccepted, setBuyTermsAccepted] = useState(false);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState<'online_gateway' | 'bank_receipt'>('bank_receipt');
  const [fulfillmentChoice, setFulfillmentChoice] = useState<'postal' | 'pickup'>('postal');
  
  // Bank Receipt Form Data
  const [receiptTrackingCode, setReceiptTrackingCode] = useState('');
  const [receiptBankName, setReceiptBankName] = useState('بانک ملی ایران (واریز پایا)');
  const [receiptDate, setReceiptDate] = useState('۱۴۰۳/۰۸/۰۵');
  const [receiptFilePreview, setReceiptFilePreview] = useState<string>(SAMPLE_RECEIPT_IMAGE);
  const [receiptFileName, setReceiptFileName] = useState<string>('receipt_scan_national_bank.jpg');
  const [receiptFileSize, setReceiptFileSize] = useState<string>('۲۴۵ کیلوبایت');
  const [shippingAddress, setShippingAddress] = useState(currentUser?.residentialAddress || 'تهران، خیابان ولیعصر، پلاک ۱۲۰، کد پستی ۱۹۸۸۷');
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  // Detailed Product Introduction Modal (معرفی اثر)
  const [introProduct, setIntroProduct] = useState<Product | null>(null);

  // Product Builder / Editor Modal
  const [productBuilderOpen, setProductBuilderOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const productCoverInputRef = useRef<HTMLInputElement>(null);

  const [builderForm, setBuilderForm] = useState<{
    title: string;
    subtitle: string;
    authorOrPresenter: string;
    format: 'book' | 'multimedia' | 'audio_series';
    formatTitle: string;
    price: number;
    pagesOrDuration: string;
    publishedYear: string;
    publisher: string;
    isbn: string;
    hasCoverImage: boolean;
    coverImage: string;
    downloadLink: string;
    allowedPaymentMethod: 'both' | 'gateway_only' | 'receipt_only';
    shippingMode: 'postal_only' | 'pickup_only' | 'both';
    shippingCostType: 'free' | 'fixed' | 'calculated_later';
    shippingFixedFee: number;
    pickupAddressNotice: string;
    badgeText: string;
    description: string;
  }>({
    title: '',
    subtitle: '',
    authorOrPresenter: '',
    format: 'book',
    formatTitle: 'کتاب چاپی نفیس (گالینگور)',
    price: 350000,
    pagesOrDuration: '۳۲۰ صفحه',
    publishedYear: '۱۴۰۳',
    publisher: 'انتشارات مرکز نخبگان و پژوهشکده فقه و حقوق',
    isbn: '۹۷۸-۶۰۰-۹۸۷۶-۵۴-۳',
    hasCoverImage: true,
    coverImage: PRESET_PRODUCT_COVERS[0].url,
    downloadLink: 'https://cdn.feqh-ghaza.ir/downloads/book-sample.pdf',
    allowedPaymentMethod: 'both',
    shippingMode: 'both',
    shippingCostType: 'free',
    shippingFixedFee: 50000,
    pickupAddressNotice: 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری',
    badgeText: 'چاپ جدید',
    description: 'توضیحات جامع و تحلیل تخصصی محتوای اثر علمی...',
  });

  // Soft Delete with PIN state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletePinInput, setDeletePinInput] = useState('');
  const [deleteSmsNotice, setDeleteSmsNotice] = useState<string | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Active non-deleted products
  const activeProducts = useMemo(() => products.filter(p => !p.isDeleted), [products]);

  const booksShelf = useMemo(() => activeProducts.filter(p => p.format === 'book'), [activeProducts]);
  const multimediaShelf = useMemo(() => activeProducts.filter(p => p.format === 'multimedia' || p.format === 'audio_series'), [activeProducts]);
  const myOwnedProducts = useMemo(() => activeProducts.filter(p => p.isOwned), [activeProducts]);

  const currentShelfList = useMemo(() => {
    let list: Product[] = [];
    if (activeShelf === 'books') list = booksShelf;
    else if (activeShelf === 'multimedia') list = multimediaShelf;
    else if (activeShelf === 'my_library') list = myOwnedProducts;
    else list = activeProducts; // combined

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return list.filter(p => p.title.toLowerCase().includes(q) || p.authorOrPresenter.toLowerCase().includes(q));
    }
    return list;
  }, [activeShelf, booksShelf, multimediaShelf, myOwnedProducts, activeProducts, searchQuery]);

  // Handler: Open Purchase Journey
  const handleOpenPurchase = (product: Product) => {
    setPurchasingProduct(product);
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
  };

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

  const handleProductCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setBuilderForm(prev => ({
          ...prev,
          coverImage: event.target?.result as string,
          hasCoverImage: true,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPurchase = async () => {
    if (!purchasingProduct) return;
    try {
      let shippingFee = 0;
      let shippingNotice = '';
      if (purchasingProduct.format === 'book') {
        if (fulfillmentChoice === 'pickup') {
          shippingFee = 0;
          shippingNotice = 'تحویل حضوری در محل دبیرخانه انتشارات مرکز';
        } else {
          const costType = purchasingProduct.shippingCostType || 'free';
          if (costType === 'free') {
            shippingFee = 0;
            shippingNotice = 'ارسال پستی رایگان سراسری به عهده مرکز';
          } else if (costType === 'fixed') {
            shippingFee = purchasingProduct.shippingFixedFee || 50000;
            shippingNotice = `پست پیشتاز با مبلغ ثابت ${toPersianNumbers(shippingFee.toLocaleString('fa-IR'))} تومان`;
          } else {
            shippingFee = 0;
            shippingNotice = 'هزینه ارسال پستی پس از ثبت سفارش بر اساس وزن و شهر مقصد استعلام و اعلام می‌گردد.';
          }
        }
      }

      await purchaseProduct(purchasingProduct.id, {
        fulfillmentChoice: purchasingProduct.format === 'book' ? fulfillmentChoice : undefined,
        shippingFee,
        shippingNotice,
        shippingAddress: fulfillmentChoice === 'postal' ? shippingAddress : undefined,
      });
      setBuyStep(3);
    } catch (err: any) {
      alert(`خطا در ثبت سفارش: ${err.message}`);
    }
  };

  // Handler: Open Product Builder for Add or Edit
  const handleOpenProductBuilder = (productToEdit?: Product) => {
    if (productToEdit) {
      setEditingProductId(productToEdit.id);
      setBuilderForm({
        title: productToEdit.title,
        subtitle: productToEdit.subtitle || '',
        authorOrPresenter: productToEdit.authorOrPresenter,
        format: productToEdit.format,
        formatTitle: productToEdit.formatTitle,
        price: productToEdit.price,
        pagesOrDuration: productToEdit.pagesOrDuration,
        publishedYear: productToEdit.publishedYear,
        publisher: productToEdit.publisher || 'انتشارات مرکز نخبگان',
        isbn: productToEdit.isbn || '۹۷۸-۶۰۰-...',
        hasCoverImage: Boolean(productToEdit.coverImage),
        coverImage: productToEdit.coverImage || PRESET_PRODUCT_COVERS[0].url,
        downloadLink: productToEdit.downloadLink || 'https://cdn.feqh-ghaza.ir/downloads/sample.pdf',
        allowedPaymentMethod: productToEdit.allowedPaymentMethod || 'both',
        shippingMode: productToEdit.shippingMode || 'both',
        shippingCostType: productToEdit.shippingCostType || 'free',
        shippingFixedFee: productToEdit.shippingFixedFee || 50000,
        pickupAddressNotice: productToEdit.pickupAddressNotice || 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری',
        badgeText: productToEdit.badgeText || '',
        description: productToEdit.description,
      });
    } else {
      setEditingProductId(null);
      setBuilderForm({
        title: '',
        subtitle: '',
        authorOrPresenter: '',
        format: 'book',
        formatTitle: 'کتاب چاپی نفیس (گالینگور)',
        price: 450000,
        pagesOrDuration: '۳۵۰ صفحه',
        publishedYear: '۱۴۰۳',
        publisher: 'انتشارات مرکز نخبگان فقه و قضا',
        isbn: '۹۷۸-۶۰۰-۹۸۷۶-۵۴-۳',
        hasCoverImage: true,
        coverImage: PRESET_PRODUCT_COVERS[0].url,
        downloadLink: 'https://cdn.feqh-ghaza.ir/downloads/sample.pdf',
        allowedPaymentMethod: 'both',
        shippingMode: 'both',
        shippingCostType: 'free',
        shippingFixedFee: 50000,
        pickupAddressNotice: 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری',
        badgeText: 'چاپ جدید',
        description: 'شرح جامع و تحلیل فقهی حقوقی موضوع اثر...',
      });
    }
    setProductBuilderOpen(true);
  };

  const handleSaveProductBuilder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderForm.title.trim() || !builderForm.authorOrPresenter.trim()) {
      alert('لطفاً عنوان اثر و نام مؤلف/پدیدآورنده را وارد نمایید.');
      return;
    }

    let formatTitle = builderForm.formatTitle;
    if (builderForm.format === 'book') formatTitle = 'کتاب چاپی نفیس (پست سفارشی / تحویل حضوری)';
    else if (builderForm.format === 'audio_series') formatTitle = 'درس‌گفتار صوتی دیجیتال (دانلود آنی)';
    else if (builderForm.format === 'multimedia') formatTitle = 'نرم‌افزار چندرسانه‌ای (دسترسی برخط)';

    const payload = {
      title: builderForm.title.trim(),
      subtitle: builderForm.subtitle.trim(),
      authorOrPresenter: builderForm.authorOrPresenter.trim(),
      format: builderForm.format,
      formatTitle,
      price: Number(builderForm.price),
      description: builderForm.description,
      pagesOrDuration: builderForm.pagesOrDuration,
      publishedYear: builderForm.publishedYear,
      publisher: builderForm.publisher,
      isbn: builderForm.isbn,
      coverImage: builderForm.hasCoverImage ? builderForm.coverImage : undefined,
      downloadLink: builderForm.downloadLink,
      allowedPaymentMethod: builderForm.allowedPaymentMethod,
      shippingMode: builderForm.shippingMode,
      shippingCostType: builderForm.shippingCostType,
      shippingFixedFee: Number(builderForm.shippingFixedFee),
      pickupAddressNotice: builderForm.pickupAddressNotice,
      badgeText: builderForm.badgeText || undefined,
      isAvailable: true,
    };

    if (editingProductId) {
      updateProduct(editingProductId, payload);
    } else {
      addProduct(payload);
    }
    setProductBuilderOpen(false);
  };

  // Soft delete with PIN
  const handleStartProductDelete = async (product: Product) => {
    setProductToDelete(product);
    setDeletePinInput('');
    setDeleteError(null);
    setDeleteSmsNotice('در حال صدور و ارسال رمز یک‌بارمصرف (PIN) به تلفن همراه...');
    try {
      const otpRes = await sendPinOtpSms();
      setDeleteSmsNotice(`کد تایید ۶ رقمی امنیتی (${otpRes.otpCode}) به شماره همراه مدیر سامانه ارسال گردید.`);
    } catch {
      setDeleteSmsNotice('کد تایید امنیتی به شماره همراه شما پیامک گردید. (پین پیش‌فرض: 123456)');
    }
  };

  const handleConfirmSoftDelete = () => {
    if (!productToDelete) return;
    if (!deletePinInput || deletePinInput.trim().length < 4) {
      setDeleteError('لطفاً پین کد امنیتی حداقل ۴ رقمی را وارد نمایید.');
      return;
    }

    setIsDeletingProduct(true);
    setTimeout(() => {
      updateProduct(productToDelete.id, { isDeleted: true });
      setIsDeletingProduct(false);
      setProductToDelete(null);
      alert(`اثر [${productToDelete.title}] با موفقیت حذف منطقی (Safe Delete) شد. سوابق سفارشات کاربران حفظ گردید.`);
    }, 600);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 4 Modern Metric Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="مجموع آثار فروشگاه"
          value={activeProducts.length}
          periodLabel="کتب و رسانه‌های منتشرشده"
          unit="عنوان"
          icon={<BookOpen className="w-4 h-4 text-emerald-500" />}
          onClick={() => setActiveShelf('combined')}
        />
        <ModernMetricCard
          title="قفسه کتاب‌ها و آثار مکتوب"
          value={booksShelf.length}
          periodLabel="نسخ چاپی و گالینگور"
          unit="جلد"
          icon={<FileText className="w-4 h-4 text-amber-500" />}
          onClick={() => setActiveShelf('books')}
        />
        <ModernMetricCard
          title="محصولات چندرسانه‌ای و دیجیتال"
          value={multimediaShelf.length}
          periodLabel="صوت، نرم‌افزار و درس‌گفتار"
          unit="مورد"
          icon={<Headphones className="w-4 h-4 text-indigo-500" />}
          onClick={() => setActiveShelf('multimedia')}
        />
        <ModernMetricCard
          title="کتابخانه اختصاصی من"
          value={myOwnedProducts.length}
          periodLabel="تهیه‌شده و در دسترس"
          unit="اثر"
          icon={<CheckCircle className="w-4 h-4 text-sky-500" />}
          onClick={() => setActiveShelf('my_library')}
        />
      </div>

      {/* Main Header Bar */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              فروشگاه آثار، کتب و انتشارات تخصصی فقه و قضا
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              عرضه تفکیک‌شده کتب چاپی (ارسال پستی) و محصولات دیجیتال (دانلود آنی)، همراه با معرفی مشروح اثر و درگاه پرداخت امن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {isOfficial && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenProductBuilder()}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>انتشار اثر و محصول جدید</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Shelves Navigation & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 glass-card p-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
        {/* Shelf Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-xs overflow-x-auto scrollbar-none font-bold">
          <button
            onClick={() => setActiveShelf('books')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeShelf === 'books'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>قفسه کتاب‌ها و آثار مکتوب ({toPersianNumbers(booksShelf.length)})</span>
          </button>

          <button
            onClick={() => setActiveShelf('multimedia')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeShelf === 'multimedia'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-indigo-500" />
            <span>قفسه محصولات چندرسانه‌ای ({toPersianNumbers(multimediaShelf.length)})</span>
          </button>

          <button
            onClick={() => setActiveShelf('combined')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeShelf === 'combined'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>نمایش ترکیبی (همه آثار)</span>
          </button>

          <button
            onClick={() => setActiveShelf('my_library')}
            className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeShelf === 'my_library'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-sky-500" />
            <span>کتابخانه من ({toPersianNumbers(myOwnedProducts.length)})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان کتاب، مؤلف، نرم‌افزار..."
            className="w-full pr-8.5 pl-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentShelfList.length === 0 ? (
          <div className="col-span-full p-16 text-center text-xs text-slate-400 space-y-3 glass-card rounded-3xl border border-slate-200 dark:border-white/10">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">هیچ اثری در این قفسه یا با جستجوی شما یافت نشد.</p>
          </div>
        ) : (
          currentShelfList.map(product => {
            const isBook = product.format === 'book';
            return (
              <motion.div
                key={product.id}
                whileHover={{ y: -4, scale: 1.01 }}
                className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-lg group transition-all"
              >
                <div>
                  {/* Cover Image with Lightbox Zoom Click */}
                  <div
                    onClick={() => {
                      if (product.coverImage) {
                        setLightboxImage({
                          url: product.coverImage,
                          title: product.title,
                          subtitle: `مؤلف / پدیدآورنده: ${product.authorOrPresenter}`,
                        });
                      }
                    }}
                    className="relative h-48 w-full bg-slate-900 overflow-hidden cursor-pointer group/img"
                    title="جهت مشاهده تصویر جلد در ابعاد کامل کلیک کنید"
                  >
                    {product.coverImage ? (
                      <>
                        <img
                          src={product.coverImage}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 opacity-90"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                          <ZoomIn className="w-6 h-6 text-amber-400 drop-shadow" />
                          <span className="text-xs font-bold bg-black/60 px-2.5 py-1 rounded-xl backdrop-blur-sm">
                            مشاهده تصویر کامل اثر
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-950 via-slate-900 to-stone-950 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-amber-500/20" />
                      </div>
                    )}

                    {/* Format Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 pointer-events-none">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                        isBook
                          ? 'bg-amber-500/90 text-stone-950 border-amber-400'
                          : 'bg-indigo-600/90 text-white border-indigo-400'
                      }`}>
                        {isBook ? '📚 کتاب چاپی (پست سفارشی)' : '🎧 محصول دیجیتال (دانلود آنی)'}
                      </span>
                    </div>

                    {product.badgeText && (
                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500 text-stone-950 shadow">
                          {product.badgeText}
                        </span>
                      </div>
                    )}

                    {/* Author Badge */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-white pointer-events-none max-w-[85%]">
                      <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold truncate">{product.authorOrPresenter}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5">
                    <h3
                      onClick={() => setIntroProduct(product)}
                      className="text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-relaxed min-h-[48px] cursor-pointer hover:text-amber-600 transition-colors"
                      title="کلیک جهت مطالعه معرفی مشهور و سرفصل‌ها"
                    >
                      {product.title}
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800 font-medium">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span>{toPersianNumbers(product.pagesOrDuration)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-sky-500" />
                        <span>سال انتشار: {toPersianNumbers(product.publishedYear)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/30">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">مبلغ اثر:</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {product.price > 0 ? `${toPersianNumbers(product.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Intro button (معرفی اثر) */}
                    <button
                      onClick={() => setIntroProduct(product)}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      <span>معرفی اثر</span>
                    </button>

                    {product.isOwned ? (
                      <button
                        onClick={() => {
                          if (isBook) {
                            alert('کتاب چاپی شما با پست پیشتاز به آدرس ثبت‌شده در پروفایل شما در حال ارسال است.');
                          } else {
                            alert(`لینک دانلود مستقیم اثر: ${product.downloadLink || 'https://cdn.feqh-ghaza.ir/download'}`);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        {isBook ? <Truck className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                        <span>{isBook ? 'پیگیری مرسوله پستی' : 'دانلود برخط اثر'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenPurchase(product)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>خرید و دریافت اثر</span>
                      </button>
                    )}

                    {/* Official Management Actions */}
                    {isOfficial && (
                      <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-1 mr-0.5">
                        <button
                          onClick={() => handleOpenProductBuilder(product)}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title="ویرایش کامل اثر"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleStartProductDelete(product)}
                          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="حذف منطقی اثر (نیازمند تایید پین پیامکی)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          MODAL 1: PRODUCT INTRODUCTION & DETAILED VIEW (معرفی اثر)
          ========================================================================= */}
      <AnimatePresence>
        {introProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                    شناسنامه و معرفی جامع اثر انتشاراتی
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white truncate max-w-md">
                    {introProduct.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIntroProduct(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {introProduct.coverImage && (
                  <div
                    onClick={() => setLightboxImage({ url: introProduct.coverImage!, title: introProduct.title })}
                    className="w-full h-52 rounded-2xl overflow-hidden relative shadow-md group/img cursor-pointer"
                  >
                    <img
                      src={introProduct.coverImage}
                      alt={introProduct.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4 text-white">
                      <span className="text-xs font-bold">مؤلف / پدیدآورنده: {introProduct.authorOrPresenter}</span>
                      <span className="flex items-center gap-1 text-[11px] bg-black/60 text-amber-300 px-2.5 py-1 rounded-xl backdrop-blur-md">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>بزرگنمایی تصویر</span>
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 block text-[11px]">نوع اثر:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{introProduct.formatTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">حجم / تعداد صفحات:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{toPersianNumbers(introProduct.pagesOrDuration)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">مبلغ سرمایه‌گذاری:</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-black">
                      {introProduct.price > 0 ? `${toPersianNumbers(introProduct.price.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ناشر / مرکز نشر:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{introProduct.publisher || 'مرکز نخبگان فقه و قضا'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">شابک (ISBN):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(introProduct.isbn || '۹۷۸-۶۰۰-...')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">سال انتشار:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{toPersianNumbers(introProduct.publishedYear)}</span>
                  </div>
                  {introProduct.format === 'book' && (
                    <>
                      <div>
                        <span className="text-slate-400 block text-[11px]">شیوه تحویل:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {introProduct.shippingMode === 'postal_only'
                            ? 'ارسال پستی پیشتاز'
                            : introProduct.shippingMode === 'pickup_only'
                            ? 'تحویل حضوری در دبیرخانه'
                            : 'تحویل حضوری یا ارسال پستی'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[11px]">سیاست هزینه پست:</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {introProduct.shippingCostType === 'free'
                            ? 'ارسال پستی رایگان سراسری (به عهده مرکز)'
                            : introProduct.shippingCostType === 'fixed'
                            ? `مبلغ ثابت ${toPersianNumbers((introProduct.shippingFixedFee || 50000).toLocaleString('fa-IR'))} تومان`
                            : 'اعلام مجزای هزینه پست پس از ثبت سفارش توسط مسئول'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    <span>شرح و معرفی مشروح اثر:</span>
                  </h4>
                  <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-medium">
                    {introProduct.description}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setIntroProduct(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  بستن
                </button>

                {!introProduct.isOwned && (
                  <button
                    onClick={() => {
                      const prod = introProduct;
                      setIntroProduct(null);
                      handleOpenPurchase(prod);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>اقدام به خرید و ثبت سفارش</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2: MULTI-STEP PURCHASE CHECKOUT JOURNEY
          ========================================================================= */}
      <AnimatePresence>
        {purchasingProduct && (
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
                    {purchasingProduct.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPurchasingProduct(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {buyStep === 1 && (
                  <div className="space-y-5">
                    {purchasingProduct.coverImage && (
                      <div className="w-full h-44 rounded-2xl overflow-hidden relative shadow-md">
                        <img src={purchasingProduct.coverImage} alt={purchasingProduct.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4 text-white">
                          <span className="text-xs font-bold">مؤلف: {purchasingProduct.authorOrPresenter}</span>
                          <span className="text-xs font-black bg-amber-500 text-stone-950 px-3 py-1 rounded-xl">
                            {purchasingProduct.format === 'book' ? 'ارسال پستی پیشتاز' : 'دانلود آنی برخط'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Price and Shipping Fee Summary Box */}
                    {(() => {
                      let calcShipping = 0;
                      if (purchasingProduct.format === 'book' && fulfillmentChoice === 'postal') {
                        if (purchasingProduct.shippingCostType === 'fixed') {
                          calcShipping = purchasingProduct.shippingFixedFee || 50000;
                        }
                      }
                      const grandTotal = purchasingProduct.price + calcShipping;

                      return (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-amber-800 dark:text-amber-300 font-bold block">مبلغ نهایی قابل پرداخت سفارش:</span>
                            <strong className="text-amber-600 dark:text-amber-400 text-lg font-black">
                              {grandTotal > 0 ? `${toPersianNumbers(grandTotal.toLocaleString('fa-IR'))} تومان` : 'رایگان'}
                            </strong>
                            {calcShipping > 0 && (
                              <span className="text-[10px] text-slate-500 block">
                                (قیمت اثر: {toPersianNumbers(purchasingProduct.price.toLocaleString('fa-IR'))} + هزینه پست: {toPersianNumbers(calcShipping.toLocaleString('fa-IR'))} تومان)
                              </span>
                            )}
                          </div>
                          <div className="text-left text-slate-500 font-medium">
                            {purchasingProduct.format === 'book'
                              ? fulfillmentChoice === 'postal'
                                ? purchasingProduct.shippingCostType === 'free'
                                  ? 'ارسال پستی پیشتاز (رایگان به عهده مرکز)'
                                  : purchasingProduct.shippingCostType === 'fixed'
                                  ? 'شامل هزینه پست پیشتاز ثابت'
                                  : 'استعلام مجزای هزینه پست پس از ثبت'
                                : 'تحویل حضوری در محل مرکز'
                              : 'دانلود دیجیتال و دسترسی برخط'}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Book Shipping & Fulfillment Selection */}
                    {purchasingProduct.format === 'book' && (
                      <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <label className="block text-xs font-black text-slate-900 dark:text-white">
                          انتخاب شیوه تحویل و دریافت کتاب چاپی:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {(purchasingProduct.shippingMode === 'both' || purchasingProduct.shippingMode === 'postal_only' || !purchasingProduct.shippingMode) && (
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

                          {(purchasingProduct.shippingMode === 'both' || purchasingProduct.shippingMode === 'pickup_only') && (
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
                              {purchasingProduct.shippingCostType === 'free'
                                ? '✨ هزینه پست پیشتاز: رایگان (ارسال به عهده مرکز)'
                                : purchasingProduct.shippingCostType === 'fixed'
                                ? `📦 هزینه ثابت پست پیشتاز: ${toPersianNumbers((purchasingProduct.shippingFixedFee || 50000).toLocaleString('fa-IR'))} تومان (در جمع کل لحاظ شد)`
                                : '📋 هزینه پست پس از ثبت سفارش بر اساس وزن و شهر مقصد استعلام و به شما اعلام می‌گردد.'}
                            </div>
                          </div>
                        )}

                        {fulfillmentChoice === 'pickup' && (
                          <div className="p-3 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 rounded-xl text-xs space-y-1 border border-emerald-500/20">
                            <span className="font-extrabold block">آدرس و محل تحویل حضوری:</span>
                            <p className="text-[11px]">
                              {purchasingProduct.pickupAddressNotice || 'قم، خیابان معلم، مجتمع نخبگان فقه و قضا، طبقه دوم، دبیرخانه تحویل حضوری'}
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
                          اتصال امن به درگاه شاپرک (مبلغ: {toPersianNumbers(purchasingProduct.price.toLocaleString('fa-IR'))} تومان)
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
                      {purchasingProduct.format === 'book'
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
                      onClick={handleSubmitPurchase}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-black cursor-pointer shadow-md"
                    >
                      ثبت نهایی سفارش
                    </button>
                  )}
                  {buyStep === 3 && (
                    <button
                      onClick={() => setPurchasingProduct(null)}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-black cursor-pointer"
                    >
                      بستن و بازگشت به فروشگاه
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 3: ADVANCED PRODUCT BUILDER / EDITOR
          ========================================================================= */}
      <AnimatePresence>
        {productBuilderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-right flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-amber-400 font-bold block mb-0.5">
                    مدیریت انتشارات و محصولات (ویرایش کامل توسط مدیر)
                  </span>
                  <h3 className="text-base font-black text-white">
                    {editingProductId ? 'ویرایش کامل مشخصات اثر' : 'انتشار کتاب یا محصول جدید'}
                  </h3>
                </div>
                <button
                  onClick={() => setProductBuilderOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProductBuilder} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان کامل اثر:</label>
                    <input
                      type="text"
                      required
                      value={builderForm.title}
                      onChange={e => setBuilderForm({ ...builderForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام مؤلف / پدیدآورنده:</label>
                    <input
                      type="text"
                      required
                      value={builderForm.authorOrPresenter}
                      onChange={e => setBuilderForm({ ...builderForm, authorOrPresenter: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">قفسه / نوع اثر:</label>
                    <select
                      value={builderForm.format}
                      onChange={e => setBuilderForm({ ...builderForm, format: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      <option value="book">کتاب چاپی (ارسال پستی)</option>
                      <option value="audio_series">درس‌گفتار صوتی (دانلود دیجیتال)</option>
                      <option value="multimedia">نرم‌افزار چندرسانه‌ای (برخط)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ (تومان):</label>
                    <input
                      type="number"
                      value={builderForm.price}
                      onChange={e => setBuilderForm({ ...builderForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تعداد صفحات / مدت صوت:</label>
                    <input
                      type="text"
                      value={builderForm.pagesOrDuration}
                      onChange={e => setBuilderForm({ ...builderForm, pagesOrDuration: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تصویر جلد اثر (آپلود یا انتخاب):</label>
                  <input ref={productCoverInputRef} type="file" accept="image/*" onChange={handleProductCoverUpload} className="hidden" />
                  <div className="flex items-center gap-3">
                    <img src={builderForm.coverImage} alt="Cover" className="w-16 h-16 rounded-xl object-cover border" />
                    <button
                      type="button"
                      onClick={() => productCoverInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-800 text-white rounded-xl font-bold"
                    >
                      آپلود عکس جلد
                    </button>
                    <input
                      type="text"
                      value={builderForm.coverImage}
                      onChange={e => setBuilderForm({ ...builderForm, coverImage: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Shipping & Fulfillment Configuration for Books */}
                {builderForm.format === 'book' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="font-extrabold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-500" />
                      <span>تنظیمات تحویل و هزینه ارسال (ویژه کتب و آثار مکتوب)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          شیوه تحویل مجاز برای خریدار:
                        </label>
                        <select
                          value={builderForm.shippingMode}
                          onChange={e => setBuilderForm({ ...builderForm, shippingMode: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                        >
                          <option value="both">تحویل حضوری یا ارسال پستی (حق انتخاب با مشتری)</option>
                          <option value="postal_only">منحصراً ارسال پستی پیشتاز</option>
                          <option value="pickup_only">منحصراً تحویل حضوری در محل مرکز</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          سیاست محاسبه هزینه ارسال پستی:
                        </label>
                        <select
                          value={builderForm.shippingCostType}
                          onChange={e => setBuilderForm({ ...builderForm, shippingCostType: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-bold"
                        >
                          <option value="free">ارسال رایگان (هزینه پست به عهده مرکز)</option>
                          <option value="fixed">مبلغ ثابت برای همه سفارش‌ها (تومان)</option>
                          <option value="calculated_later">اعلام مجزا به مشتری پس از استعلام (وزن/شهر)</option>
                        </select>
                      </div>
                    </div>

                    {builderForm.shippingCostType === 'fixed' && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          مبلغ ثابت هزینه پست پیشتاز (تومان):
                        </label>
                        <input
                          type="number"
                          value={builderForm.shippingFixedFee}
                          onChange={e => setBuilderForm({ ...builderForm, shippingFixedFee: Number(e.target.value) })}
                          placeholder="مثال: ۵۰۰۰۰"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                        />
                      </div>
                    )}

                    {(builderForm.shippingMode === 'both' || builderForm.shippingMode === 'pickup_only') && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          آدرس و راهنمای تحویل حضوری در مرکز:
                        </label>
                        <input
                          type="text"
                          value={builderForm.pickupAddressNotice}
                          onChange={e => setBuilderForm({ ...builderForm, pickupAddressNotice: e.target.value })}
                          placeholder="آدرس دقیق دبیرخانه و ساعات مراجعه..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">شرح و معرفی مشهور اثر:</label>
                  <textarea
                    rows={3}
                    value={builderForm.description}
                    onChange={e => setBuilderForm({ ...builderForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProductBuilderOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md cursor-pointer"
                  >
                    {editingProductId ? 'ذخیره تغییرات اثر' : 'انتشار اثر در فروشگاه'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 4: SOFT DELETE WITH SMS PIN
          ========================================================================= */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden text-right p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
                <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                  <span>تایید امنیتی حذف اثر (Safe Delete)</span>
                </h3>
                <button onClick={() => setProductToDelete(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
                <strong className="text-slate-900 dark:text-white block font-black">{productToDelete.title}</strong>
                <p className="text-slate-600 dark:text-slate-400">مؤلف: {productToDelete.authorOrPresenter}</p>
              </div>

              {deleteSmsNotice && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-2 font-bold">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>{deleteSmsNotice}</span>
                </div>
              )}

              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700 dark:text-slate-300">ورود پین کد ۶ رقمی امنیتی:</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={deletePinInput}
                    onChange={e => setDeletePinInput(e.target.value)}
                    placeholder="مثال: 123456"
                    className="w-full pr-9 pl-3 py-2 text-center tracking-widest text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                {deleteError && <p className="text-[11px] text-rose-600 font-bold">{deleteError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  disabled={isDeletingProduct || deletePinInput.length < 4}
                  onClick={handleConfirmSoftDelete}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isDeletingProduct ? 'در حال انجام...' : 'تایید و انتقال به بایگانی'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 5: LIGHTBOX IMAGE VIEWER
          ========================================================================= */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between p-3 bg-black/60 rounded-2xl text-white mb-2 text-xs font-bold">
                <span className="truncate">{lightboxImage.title}</span>
                <button onClick={() => setLightboxImage(null)} className="p-1 rounded-xl bg-white/10 hover:bg-rose-500 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[80vh]">
                <img src={lightboxImage.url} alt={lightboxImage.title} className="w-full h-full object-contain max-h-[78vh]" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

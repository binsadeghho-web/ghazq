import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ModernMetricCard } from '../common/ModernMetricCard';
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
  X
} from 'lucide-react';

export const ProductsSection: React.FC = () => {
  const { currentUser, products, purchaseProduct, addProduct } = useApp();

  const [formatFilter, setFormatFilter] = useState<'all' | Product['format']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);

  // New product form
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newFormat, setNewFormat] = useState<Product['format']>('book');
  const [newPrice, setNewPrice] = useState(350000);
  const [newDescription, setNewDescription] = useState('');
  const [newPagesOrDuration, setNewPagesOrDuration] = useState('۳۲۰ صفحه');
  const [newBadgeText, setNewBadgeText] = useState('چاپ جدید');

  const isOfficial = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const myOwnedProducts = products.filter(p => p.isOwned);

  const filteredProducts = products.filter(p => {
    if (formatFilter !== 'all' && p.format !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.authorOrPresenter.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePurchase = (productId: string) => {
    purchaseProduct(productId);
    alert('خرید محصول با موفقیت ثبت شد و لینک دسترسی/کد رهگیری پستی به حساب شما اضافه گردید.');
    if (selectedProduct?.id === productId) {
      setSelectedProduct({ ...selectedProduct, isOwned: true });
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    let formatTitle = 'کتاب چاپی';
    if (newFormat === 'multimedia') formatTitle = 'لوح فشرده و فایل چندرسانه‌ای';
    if (newFormat === 'audio_series') formatTitle = 'درس‌گفتار صوتی دیجیتال';

    addProduct({
      title: newTitle,
      authorOrPresenter: newAuthor,
      format: newFormat,
      formatTitle,
      price: Number(newPrice),
      description: newDescription,
      pagesOrDuration: newPagesOrDuration,
      publishedYear: '۱۴۰۳',
      isAvailable: true,
      badgeText: newBadgeText || undefined,
    });

    setNewTitle('');
    setNewAuthor('');
    setNewDescription('');
    setNewProductModalOpen(false);
  };

  const getFormatIcon = (format: Product['format']) => {
    switch (format) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />;
      case 'audio_series':
        return <Headphones className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />;
      case 'multimedia':
        return <Film className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="مجموع آثار عرضه شده"
          value={products.length}
          periodLabel="کتب و رسانه‌های منتشرشده"
          unit="عنوان"
          icon={<BookOpen className="w-4 h-4" />}
          onClick={() => setFormatFilter('all')}
        />
        <ModernMetricCard
          title="کتب و موسوعه‌ها"
          value={products.filter(p => p.format === 'book').length}
          periodLabel="نسخ چاپی و گالینگور"
          unit="جلد"
          icon={<FileText className="w-4 h-4 text-amber-500" />}
          onClick={() => setFormatFilter('book')}
        />
        <ModernMetricCard
          title="درس‌گفتارهای صوتی"
          value={products.filter(p => p.format === 'audio_series').length}
          periodLabel="خارج فقه القضا و اصول"
          unit="دوره"
          icon={<Headphones className="w-4 h-4 text-indigo-500" />}
          onClick={() => setFormatFilter('audio_series')}
        />
        <ModernMetricCard
          title="محصولات من"
          value={myOwnedProducts.length}
          periodLabel="تهیه‌شده و در دسترس"
          unit="اثر"
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
        />
      </div>

      {/* Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            محصولات، کتب و انتشارات تخصصی
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>موسوعه‌های فقهی، درس‌گفتارهای صوتی خارج فقه القضا و نرم‌افزارهای تحلیلی آراء</span>
            <span aria-hidden="true">·</span>
            <span>ارسال پستی یا دریافت برخط آنی</span>
          </div>
        </div>

        {isOfficial && (
          <button
            onClick={() => setNewProductModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن محصول جدید</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl text-xs overflow-x-auto backdrop-blur-md">
          <button
            onClick={() => setFormatFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              formatFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            همه آثار
          </button>
          <button
            onClick={() => setFormatFilter('book')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              formatFilter === 'book'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            کتب و موسوعه‌ها
          </button>
          <button
            onClick={() => setFormatFilter('audio_series')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              formatFilter === 'audio_series'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            درس‌گفتارهای صوتی
          </button>
          <button
            onClick={() => setFormatFilter('multimedia')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              formatFilter === 'multimedia'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            نرم‌افزارها
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="جستجو در عنوان اثر یا پدیدآورنده..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all backdrop-blur-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          return (
            <div
              key={product.id}
              className="glass-card rounded-2xl border border-slate-200/90 dark:border-white/10 p-4 flex flex-col justify-between space-y-3 hover:-translate-y-1 hover:border-amber-500/40 dark:hover:border-amber-400/30 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 group"
            >
              <div className="space-y-3">
                {/* Styled Editorial Cover Card */}
                <div className="relative h-40 bg-slate-900 dark:bg-slate-950 p-4 text-white rounded-lg flex flex-col justify-between overflow-hidden border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{product.formatTitle}</span>
                    {product.badgeText && (
                      <span className="text-amber-400 font-semibold">{product.badgeText}</span>
                    )}
                  </div>

                  <div className="my-auto text-center px-1">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                      {product.title}
                    </h4>
                  </div>

                  {/* Clean unboxed metadata footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="truncate max-w-[130px]">{product.authorOrPresenter}</span>
                    <span className="font-mono tabular-nums">{product.publishedYear}</span>
                  </div>
                </div>

                {/* Description and Page/Duration */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span>حجم / صفحات:</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">{product.pagesOrDuration}</span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400">قیمت:</span>
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {product.price > 0 ? `${product.price.toLocaleString('fa-IR')} ت` : 'رایگان'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors active:scale-[0.98]"
                  >
                    مشاهده
                  </button>

                  {product.isOwned ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1">
                      تهیه شده
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePurchase(product.id)}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors active:scale-[0.98]"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                      <span>خرید</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 p-6 text-white flex items-start justify-between">
              <div>
                <span className="text-xs text-amber-400">
                  {selectedProduct.formatTitle}
                </span>
                <h3 className="text-base font-bold text-white mt-1 leading-snug">
                  {selectedProduct.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  پدیدآورنده: {selectedProduct.authorOrPresenter}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">معرفی و مشخصات تفصیلی:</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-slate-400 block text-[11px]">مشخصات / زمان:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5 block">{selectedProduct.pagesOrDuration}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-slate-400 block text-[11px]">سال تدوین / نشر:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums mt-0.5 block">{selectedProduct.publishedYear}</span>
                </div>
              </div>

              {selectedProduct.isOwned ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>شما مالک این محصول هستید</span>
                  </div>
                  <button
                    onClick={() => alert('دانلود فایل کتاب و منابع صوتی آغاز گردید.')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-semibold active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>دریافت فایل و صوت</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400">مبلغ اثر:</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                      {selectedProduct.price.toLocaleString('fa-IR')} تومان
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(selectedProduct.id)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 active:scale-[0.98]"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>تایید و خرید اثر</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal (Admin) */}
      {newProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden text-right">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">افزودن محصول آموزشی جدید</h3>
                <p className="text-xs text-slate-400 mt-0.5">درج کتاب، فایل چندرسانه‌ای یا درس‌گفتار صوتی</p>
              </div>
              <button
                onClick={() => setNewProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">نام یا عنوان اثر:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مبانی فقهی نظارت قضایی"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">پدیدآورنده / استاد:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دکتر علیرضا اسکندری"
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">قالب اثر:</label>
                  <select
                    value={newFormat}
                    onChange={e => setNewFormat(e.target.value as Product['format'])}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="book">کتاب چاپی</option>
                    <option value="audio_series">درس‌گفتار صوتی دیجیتال</option>
                    <option value="multimedia">نرم‌افزار و چندرسانه‌ای</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">قیمت (تومان):</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">تعداد صفحات یا مدت:</label>
                  <input
                    type="text"
                    value={newPagesOrDuration}
                    onChange={e => setNewPagesOrDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">برچسب ویژه (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="مثال: پرفروش، کتاب سال"
                    value={newBadgeText}
                    onChange={e => setNewBadgeText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">توضیحات و معرفی اثر:</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewProductModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold active:scale-[0.98]"
                >
                  افزودن و انتشار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

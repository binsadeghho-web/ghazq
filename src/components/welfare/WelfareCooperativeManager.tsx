import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConsumableItem } from '../../types';
import { CooperativeSectionInfo } from '../../types/welfare';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Image,
  Tag,
  DollarSign,
  Package,
  Check,
  Search,
  Sparkles,
  Sliders,
  ExternalLink,
  Save
} from 'lucide-react';

const READY_PHOTO_PRESETS = [
  { label: 'برنج طارم', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
  { label: 'روغن زیتون', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
  { label: 'گردوی تویسرکان', url: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80' },
  { label: 'عسل طبیعی', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80' },
  { label: 'چای بهاره گیلان', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
  { label: 'خرمای پیارم', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80' },
  { label: 'بسته خواربار کامل', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80' },
  { label: 'زعفران قائنات', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80' },
  { label: 'پسته رفسنجان', url: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=600&q=80' },
  { label: 'پروتئین و گوشت سالم', url: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80' }
];

export const WelfareCooperativeManager: React.FC = () => {
  const {
    consumables,
    updateConsumableItem,
    addConsumableItem,
    deleteConsumableItem,
    updateConsumableStock,
    cooperativeSectionInfo,
    updateCooperativeSectionInfo
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<ConsumableItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditingSectionHeader, setIsEditingSectionHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState<CooperativeSectionInfo>({ ...cooperativeSectionInfo });
  const [saveBanner, setSaveBanner] = useState(false);

  // Form for Add / Edit product
  const [productForm, setProductForm] = useState<Partial<ConsumableItem>>({
    title: '',
    name: '',
    brand: '',
    category: 'غلات و برنج',
    cooperativePrice: 100000,
    memberPrice: 100000,
    marketPrice: 150000,
    discountPercent: 33,
    unit: 'بسته',
    stock: 50,
    description: '',
    imageUrl: READY_PHOTO_PRESETS[0].url
  });

  const categories = ['all', ...Array.from(new Set(consumables.map(c => c.category)))];

  const filteredConsumables = consumables.filter(item => {
    const matchesSearch =
      (item.title || '').includes(searchQuery) ||
      (item.name || '').includes(searchQuery) ||
      (item.brand || '').includes(searchQuery) ||
      (item.description || '').includes(searchQuery);
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleStartEdit = (item: ConsumableItem) => {
    setEditingItem(item);
    setProductForm({
      ...item,
      imageUrl: item.imageUrl || READY_PHOTO_PRESETS[0].url
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const coopPrice = Number(productForm.cooperativePrice) || 0;
    const mktPrice = Number(productForm.marketPrice) || coopPrice;
    const discount = mktPrice > 0 ? Math.round(((mktPrice - coopPrice) / mktPrice) * 100) : 0;

    const payload: Partial<ConsumableItem> = {
      title: productForm.title || productForm.name || 'کالای تعاونی',
      name: productForm.name || productForm.title || 'کالای تعاونی',
      brand: productForm.brand || 'تعاونی مرکز',
      category: productForm.category || 'خواربار',
      cooperativePrice: coopPrice,
      memberPrice: coopPrice,
      marketPrice: mktPrice,
      discountPercent: discount,
      unit: productForm.unit || 'بسته',
      stock: Number(productForm.stock) || 0,
      description: productForm.description || '',
      imageUrl: productForm.imageUrl || READY_PHOTO_PRESETS[0].url
    };

    if (editingItem) {
      updateConsumableItem(editingItem.id, payload);
      setEditingItem(null);
    } else {
      addConsumableItem(payload as Omit<ConsumableItem, 'id'>);
      setIsAddModalOpen(false);
    }

    triggerNotice();
  };

  const handleSaveHeader = () => {
    updateCooperativeSectionInfo(headerForm);
    setIsEditingSectionHeader(false);
    triggerNotice();
  };

  const triggerNotice = () => {
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER EDIT BAR */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-stone-900">{cooperativeSectionInfo.title}</h3>
              <p className="text-xs text-stone-500">{cooperativeSectionInfo.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveBanner && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
                تغییرات ثبت شد
              </span>
            )}
            <button
              onClick={() => setIsEditingSectionHeader(!isEditingSectionHeader)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایش عنوان و شعار تعاونی</span>
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setProductForm({
                  title: '',
                  name: '',
                  brand: 'تعاونی مرکز',
                  category: 'غلات و برنج',
                  cooperativePrice: 200000,
                  memberPrice: 200000,
                  marketPrice: 300000,
                  discountPercent: 33,
                  unit: 'بسته',
                  stock: 50,
                  description: '',
                  imageUrl: READY_PHOTO_PRESETS[0].url
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کالای یارانه‌ای جدید</span>
            </button>
          </div>
        </div>

        {/* Inline Section Header Editor */}
        {isEditingSectionHeader && (
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">عنوان اصلی بخش تعاونی:</label>
                <input
                  type="text"
                  value={headerForm.title}
                  onChange={e => setHeaderForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 text-xs rounded-xl border border-stone-300 font-bold bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">زیرعنوان و توضیحات کوتاه:</label>
                <input
                  type="text"
                  value={headerForm.subtitle}
                  onChange={e => setHeaderForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">پیام اطلاع‌رسانی سوبسید و ارسال به اعضا:</label>
              <input
                type="text"
                value={headerForm.notice}
                onChange={e => setHeaderForm(prev => ({ ...prev, notice: e.target.value }))}
                className="w-full p-2 text-xs rounded-xl border border-stone-300 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsEditingSectionHeader(false)}
                className="px-3.5 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-xs font-bold"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveHeader}
                className="px-4 py-1.5 rounded-lg bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره عنوان بخش</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو در نام محصول، برند، توضیحات..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat === 'all' ? 'همه کالاها' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConsumables.map(item => {
          const mkt = item.marketPrice || item.cooperativePrice;
          const coop = item.cooperativePrice || item.memberPrice || 0;
          const discount = item.discountPercent || Math.round(((mkt - coop) / (mkt || 1)) * 100);

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-2xs">
                    <img
                      src={item.imageUrl || READY_PHOTO_PRESETS[0].url}
                      alt={item.name || item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-stone-900/80 text-white text-[9px] font-mono">
                      {item.unit}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {toPersianNumbers(discount)}٪ تخفیف اعضا
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-stone-900 mt-1 line-clamp-1 leading-snug">
                      {item.title || item.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 font-bold mt-0.5">{item.brand || 'تعاونی مرکز'}</p>
                  </div>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  {item.description}
                </p>

                {/* Price Breakdown */}
                <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 text-[11px]">قیمت بازار آزاد:</span>
                    <span className="line-through text-stone-400 font-mono">
                      {toPersianNumbers(mkt.toLocaleString('fa-IR'))} تومان
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-stone-800">قیمت یارانه‌ای تعاونی:</span>
                    <span className="text-teal-900 font-black text-sm font-mono">
                      {toPersianNumbers(coop.toLocaleString('fa-IR'))} تومان
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-stone-200 text-[11px]">
                    <span className="text-stone-600 font-bold">موجودی انبار:</span>
                    <span className="font-bold text-emerald-800 font-mono">
                      {toPersianNumbers(item.stock)} {item.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Actions */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateConsumableStock(item.id, item.stock + 10)}
                    className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                    title="افزایش ۱۰ عدد موجودی انبار"
                  >
                    +۱۰ شارژ
                  </button>
                  <button
                    onClick={() => updateConsumableStock(item.id, Math.max(0, item.stock - 5))}
                    className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                    title="کسر ۵ عدد از انبار"
                  >
                    -۵
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ویرایش کامل</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`آیا از حذف محصول «${item.title || item.name}» از تعاونی اطمینان دارید؟`)) {
                        deleteConsumableItem(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                    title="حذف کالا"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL FOR ADDING OR EDITING PRODUCT (WITH PHOTO CHANGER) */}
      {(editingItem || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="font-black text-base text-stone-900">
                  {editingItem ? `ویرایش کامل کالای تعاونی: ${editingItem.title}` : 'افزودن کالای یارانه‌ای جدید به تعاونی'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">نام و عنوان کالا *:</label>
                  <input
                    type="text"
                    required
                    value={productForm.title || productForm.name || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, title: e.target.value, name: e.target.value }))}
                    placeholder="مثال: برنج طارم هاشمی مازندران"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">برند / تولیدکننده:</label>
                  <input
                    type="text"
                    value={productForm.brand || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="مثال: تعاونی کشاورزان دابودشت"
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">دسته‌بندی:</label>
                  <input
                    type="text"
                    value={productForm.category || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="غلات، روغن، خشکبار، لبنیات..."
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">واحد بسته‌بندی:</label>
                  <input
                    type="text"
                    value={productForm.unit || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="کیسه ۱۰ کیلویی، بطری ۱ لیتری..."
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">موجودی انبار:</label>
                  <input
                    type="number"
                    value={productForm.stock ?? 50}
                    onChange={e => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) || 0 }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Price Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">قیمت بازار آزاد (تومان):</label>
                  <input
                    type="number"
                    value={productForm.marketPrice ?? 150000}
                    onChange={e => setProductForm(prev => ({ ...prev, marketPrice: Number(e.target.value) || 0 }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-stone-300 font-bold font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-teal-800 block mb-1">قیمت یارانه‌ای تعاونی سهم اعضا (تومان) *:</label>
                  <input
                    type="number"
                    required
                    value={productForm.cooperativePrice ?? 100000}
                    onChange={e =>
                      setProductForm(prev => ({
                        ...prev,
                        cooperativePrice: Number(e.target.value) || 0,
                        memberPrice: Number(e.target.value) || 0
                      }))
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-teal-400 font-black font-mono bg-white text-teal-900"
                  />
                </div>
              </div>

              {/* PHOTO SELECTION & LIVE PREVIEW */}
              <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-teal-800" />
                  تصویر و عکس محصول:
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-teal-600 bg-white shadow-xs shrink-0">
                    <img
                      src={productForm.imageUrl || READY_PHOTO_PRESETS[0].url}
                      alt="پیش‌نمایش عکس"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      placeholder="لینک آدرس اینترنتی مستقیم عکس (URL)..."
                      value={productForm.imageUrl || ''}
                      onChange={e => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full p-2 text-xs rounded-xl border border-stone-300 font-mono bg-white"
                    />
                    <div className="text-[11px] text-stone-500 font-bold">
                      یا انتخاب سریع از گالری تصاویر استاندارد ارزاق و محصولات:
                    </div>
                  </div>
                </div>

                {/* Preset image buttons */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 pb-1">
                  {READY_PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setProductForm(prev => ({ ...prev, imageUrl: preset.url }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all shrink-0 cursor-pointer ${
                        productForm.imageUrl === preset.url
                          ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-4 h-4 rounded-full object-cover" />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">توضیحات و مشخصات کیفی کالا:</label>
                <textarea
                  rows={2}
                  value={productForm.description || ''}
                  onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="توضیحات پیرامون منشا تولید، درجه کیفی، نشان استاندارد و شرایط نگهداری..."
                  className="w-full p-2.5 text-xs rounded-xl border border-stone-300 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-850 bg-teal-900 hover:bg-teal-950 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingItem ? 'ثبت و اعمال تغییرات محصول' : 'افزودن قطعی به تعاونی'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

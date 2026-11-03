import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  BookOpen,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  Percent,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';

interface ProductsMiniShowcaseProps {
  onNavigateToProducts?: () => void;
}

export const ProductsMiniShowcase: React.FC<ProductsMiniShowcaseProps> = ({
  onNavigateToProducts
}) => {
  const { products, consumables } = useApp();

  // Combine first 2 scientific books and first 2 cooperative consumables for a vibrant mix
  const featuredBooks = products.slice(0, 2);
  const featuredConsumables = consumables.slice(0, 2);

  return (
    <div className="w-full relative overflow-hidden rounded-[32px] bg-white/95 border border-[#E3E0D3] shadow-md p-5 sm:p-6 text-stone-900 space-y-4">
      {/* Decorative Aura */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-500/10 blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm sm:text-base font-black text-stone-900">
                ویترین آثار، انتشارات و محصولات تعاونی
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                تخفیف اعضا
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              کتب مرجع قضایی، درس‌گفتارها و سبدهای مصرفی اختصاصی اعضای کانون دانش‌آموختگان
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToProducts}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition-all cursor-pointer"
        >
          <span>مشاهده همه محصولات</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Product Grid (4 items) */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {featuredBooks.map(book => (
          <div
            key={book.id}
            onClick={onNavigateToProducts}
            className="group p-3.5 rounded-2xl bg-stone-50 hover:bg-purple-50/50 border border-stone-200/90 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs"
          >
            <div className="space-y-2">
              <div className="relative h-28 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-900/80 backdrop-blur-md text-purple-100 text-[10px] font-black border border-purple-400/40">
                  کتاب تخصصی
                </span>
              </div>

              <div>
                <h5 className="font-bold text-xs text-stone-900 group-hover:text-purple-900 transition-colors line-clamp-1">
                  {book.title}
                </h5>
                <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                  پدیدآور: {book.authorOrPresenter}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-700">
                  {toPersianNumbers(Math.round(book.price * 0.8).toLocaleString('fa-IR'))}
                </span>
                <span className="text-[10px] text-stone-500 mr-1">تومان</span>
              </div>
              <span className="text-[10px] text-emerald-800 font-bold flex items-center gap-0.5">
                سفارش <ChevronLeft className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}

        {featuredConsumables.map(item => (
          <div
            key={item.id}
            onClick={onNavigateToProducts}
            className="group p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200/90 hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs"
          >
            <div className="space-y-2">
              <div className="relative h-28 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center p-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-1">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-900/80 backdrop-blur-md text-emerald-100 text-[10px] font-black border border-emerald-400/40">
                  تعاونی اعضا
                </span>
              </div>

              <div>
                <h5 className="font-bold text-xs text-stone-900 group-hover:text-emerald-900 transition-colors line-clamp-1">
                  {item.title}
                </h5>
                <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">
                  دسته‌بندی: {item.category}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-800">
                  {toPersianNumbers(item.cooperativePrice.toLocaleString('fa-IR'))}
                </span>
                <span className="text-[10px] text-stone-500 mr-1">تومان</span>
              </div>
              <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                تخفیف ویژه <ChevronLeft className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

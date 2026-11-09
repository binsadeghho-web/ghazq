import React from 'react';
import { motion } from 'motion/react';
import { ModernMetricCard } from '../../common/ModernMetricCard';
import { BookOpen, FileText, Headphones, CheckCircle, ShoppingBag, Plus } from 'lucide-react';

interface ProductStatsHeaderProps {
  activeProductsCount: number;
  booksCount: number;
  multimediaCount: number;
  myOwnedCount: number;
  onSelectShelf: (shelf: 'books' | 'multimedia' | 'combined' | 'my_library') => void;
  isOfficial: boolean;
  onOpenAddProduct: () => void;
}

export const ProductStatsHeader: React.FC<ProductStatsHeaderProps> = ({
  activeProductsCount,
  booksCount,
  multimediaCount,
  myOwnedCount,
  onSelectShelf,
  isOfficial,
  onOpenAddProduct,
}) => {
  return (
    <>
      {/* 4 Modern Metric Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModernMetricCard
          title="مجموع آثار فروشگاه"
          value={activeProductsCount}
          periodLabel="کتب و رسانه‌های منتشرشده"
          unit="عنوان"
          icon={<BookOpen className="w-4 h-4 text-emerald-500" />}
          onClick={() => onSelectShelf('combined')}
        />
        <ModernMetricCard
          title="قفسه کتاب‌ها و آثار مکتوب"
          value={booksCount}
          periodLabel="نسخ چاپی و گالینگور"
          unit="جلد"
          icon={<FileText className="w-4 h-4 text-amber-500" />}
          onClick={() => onSelectShelf('books')}
        />
        <ModernMetricCard
          title="محصولات چندرسانه‌ای و دیجیتال"
          value={multimediaCount}
          periodLabel="صوت، نرم‌افزار و درس‌گفتار"
          unit="مورد"
          icon={<Headphones className="w-4 h-4 text-indigo-500" />}
          onClick={() => onSelectShelf('multimedia')}
        />
        <ModernMetricCard
          title="کتابخانه اختصاصی من"
          value={myOwnedCount}
          periodLabel="تهیه‌شده و در دسترس"
          unit="اثر"
          icon={<CheckCircle className="w-4 h-4 text-sky-500" />}
          onClick={() => onSelectShelf('my_library')}
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
              onClick={onOpenAddProduct}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-2xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>انتشار اثر و محصول جدید</span>
            </motion.button>
          )}
        </div>
      </div>
    </>
  );
};

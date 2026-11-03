import React from 'react';
import { useApp } from '../../context/AppContext';
import { MizanHeroSeal } from './MizanHeroSeal';
import { MizanStoriesSlider } from './MizanStoriesSlider';
import { MizanBentoGrid } from './MizanBentoGrid';
import { MizanRulingsShelf } from './MizanRulingsShelf';
import { MizanImpactSection } from './MizanImpactSection';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { BookOpen, ArrowLeft, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';

interface MizanDashboardProps {
  onNavigate: (tabId: string) => void;
  onOpenNewRequestModal?: () => void;
}

export const MizanDashboard: React.FC<MizanDashboardProps> = ({ onNavigate, onOpenNewRequestModal }) => {
  const { products, mizanConfig } = useApp();

  const featuredBooks = products.slice(0, 4);

  return (
    <div className="space-y-7 pb-12 max-w-7xl mx-auto">
      {/* ۱. جزیره مرکب سربرگ و مهر هویتی */}
      {mizanConfig.showHeroSeal !== false && (
        <MizanHeroSeal onNavigate={onNavigate} onOpenNewRequestModal={onOpenNewRequestModal} />
      )}

      {/* ۲. اسلایدر رویدادها، وبینارها و فراخوان‌ها */}
      <MizanStoriesSlider onNavigate={onNavigate} />

      {/* ۳. شبکه هوشمند خدمات هشت‌گانه سامانه (بنتو گرید مجهز به زیرخدمات در هاور) */}
      {mizanConfig.showBentoGrid !== false && (
        <MizanBentoGrid onNavigate={onNavigate} />
      )}

      {/* ۴. تالار منتخب دادنامه‌ها و آراء قضایی */}
      <MizanRulingsShelf onNavigate={onNavigate} />

      {/* ۵. ویترین تأثیر و شاخص‌های آماری مستند */}
      <MizanImpactSection />

      {/* ۶. بخش منشورات و کتب تازه فقهی-حقوقی */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F2ECFA] text-[#5C3882] flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4 text-[#5C3882]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0D3829]">تازه‌های نشر و منشورات علمی مجمع</h3>
              <p className="text-xs text-[#527768]">کتب، درس‌گفتارها و آثار فقهی-قضایی اساتید و پژوهشگران</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-[#158561] hover:text-[#0C583F] flex items-center gap-1 transition-colors group"
          >
            <span>ورود به فروشگاه منشورات</span>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredBooks.map(book => (
            <div
              key={book.id}
              onClick={() => onNavigate('products')}
              className="group cursor-pointer rounded-2xl bg-white border border-[#E3ECE8] p-4 shadow-sm hover:shadow-md hover:border-[#158561]/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F0F5F2] relative">
                  <img
                    src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                    {book.formatTitle || 'کتاب حقوقی'}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#143D2D] line-clamp-1 group-hover:text-[#158561] transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-[11px] text-[#698F81] mt-0.5">
                    {book.authorOrPresenter}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#EDF3F0] flex items-center justify-between">
                <span className="text-xs font-bold text-[#0D3829]">
                  {toPersianNumbers(book.price.toLocaleString())} تومان
                </span>
                <span className="text-[11px] font-semibold text-[#158561] group-hover:underline flex items-center gap-1">
                  <span>سفارش</span>
                  <ShoppingBag className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

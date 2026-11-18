import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { MizanHeroSeal } from './MizanHeroSeal';
import { MizanStoriesSlider } from './MizanStoriesSlider';
import { MizanBentoGrid } from './MizanBentoGrid';
import { MizanRulingsShelf } from './MizanRulingsShelf';
import { MizanImpactSection } from './MizanImpactSection';
import { resolveProductCoverUrl } from '../../data/showcaseImages';
import { toPersianNumbers } from '../../utils/persianNumbers';
import { canManageAllInSection, useRbacPolicies } from '../../utils/rbacPolicy';
import { BookOpen, ArrowLeft, ShoppingBag } from 'lucide-react';

interface MizanDashboardProps {
  onNavigate: (tabId: string) => void;
  onOpenNewRequestModal?: () => void;
}

const FORMAT_LABELS: Record<Product['format'], string> = {
  book: 'کتاب',
  multimedia: 'چندرسانه‌ای',
  audio_series: 'صوت',
};

export const MizanDashboard: React.FC<MizanDashboardProps> = ({ onNavigate, onOpenNewRequestModal }) => {
  const { products, productsStoreConfig, mizanConfig, currentUser } = useApp();
  const { rolePolicies } = useRbacPolicies();
  const isOfficial = canManageAllInSection(currentUser, 'products', rolePolicies);
  const [catFilter, setCatFilter] = useState<'all' | Product['format']>('all');

  const showProductsShelf = isOfficial || productsStoreConfig.isStoreEnabled;

  const featuredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (p.isDeleted) return false;
        if (!isOfficial && productsStoreConfig.enabledCategories?.[p.format] === false) return false;
        if (catFilter !== 'all' && p.format !== catFilter) return false;
        return true;
      })
      .slice(0, 4);
  }, [products, isOfficial, productsStoreConfig.enabledCategories, catFilter]);

  return (
    <div className="space-y-7 pb-12 max-w-7xl mx-auto">
      {mizanConfig.showHeroSeal !== false && (
        <MizanHeroSeal onNavigate={onNavigate} onOpenNewRequestModal={onOpenNewRequestModal} />
      )}

      <MizanStoriesSlider onNavigate={onNavigate} />

      {mizanConfig.showBentoGrid !== false && (
        <MizanBentoGrid onNavigate={onNavigate} />
      )}

      <MizanRulingsShelf onNavigate={onNavigate} />

      <MizanImpactSection />

      {showProductsShelf && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F2ECFA] text-[#5C3882] flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4 text-[#5C3882]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D3829]">کتاب و محصولات چند رسانه‌ای</h3>
                <p className="text-xs text-[#527768]">
                  کتب مرجع، بسته‌های چندرسانه‌ای و درس‌گفتارهای صوتی با نسخه دیجیتال و فیزیکی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E3ECE8] text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCatFilter('all')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    catFilter === 'all' ? 'bg-[#158561] text-white' : 'text-[#527768]'
                  }`}
                >
                  همه
                </button>
                {(['book', 'multimedia', 'audio_series'] as const)
                  .filter(c => isOfficial || productsStoreConfig.enabledCategories?.[c] !== false)
                  .map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                        catFilter === cat ? 'bg-[#158561] text-white' : 'text-[#527768]'
                      }`}
                    >
                      {FORMAT_LABELS[cat]}
                    </button>
                  ))}
              </div>

              <button
                type="button"
                onClick={() => onNavigate('products')}
                className="text-xs font-semibold text-[#158561] hover:text-[#0C583F] flex items-center gap-1 transition-colors group cursor-pointer"
              >
                <span>ورود به کتاب و محصولات چند رسانه‌ای</span>
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onNavigate('products')}
                className="group cursor-pointer rounded-2xl bg-white border border-[#E3ECE8] p-4 shadow-sm hover:shadow-md hover:border-[#158561]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F0F5F2] relative">
                    <img
                      src={resolveProductCoverUrl(item.coverImage, item.format, idx)}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white">
                      {FORMAT_LABELS[item.format]}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#143D2D] line-clamp-1 group-hover:text-[#158561] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#698F81] mt-0.5 line-clamp-1">
                      {item.authorOrPresenter}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#EDF3F0] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0D3829] tabular-nums">
                    {toPersianNumbers(Number(item.digitalPrice ?? item.price ?? 0).toLocaleString('fa-IR'))} تومان
                  </span>
                  <span className="text-[11px] font-semibold text-[#158561] group-hover:underline flex items-center gap-1">
                    <span>خرید و دریافت</span>
                    <ShoppingBag className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

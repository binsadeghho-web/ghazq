import React from 'react';
import {
  Layers,
  Scale,
  Sparkles,
  GraduationCap,
  HeartHandshake,
  Gift,
  BookOpen,
  Video,
  Home,
  Edit3,
  Sliders,
  Layout,
  Palette,
  Award
} from 'lucide-react';
import { CustomizerTab } from '../ThemeCustomizerModal';

interface CustomizerTabBarProps {
  activeTab: CustomizerTab;
  onSelectTab: (tab: CustomizerTab) => void;
}

export const CustomizerTabBar: React.FC<CustomizerTabBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="flex items-center gap-1.5 px-6 pt-3 border-b border-stone-200 overflow-x-auto scrollbar-none bg-stone-50/50">
      <button
        onClick={() => onSelectTab('modules')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'modules'
            ? 'border-emerald-700 text-emerald-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>ماژول‌ها و بخش‌های فعال</span>
      </button>

      <button
        onClick={() => onSelectTab('rulings')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'rulings'
            ? 'border-amber-700 text-amber-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Scale className="w-4 h-4 text-amber-700" />
        <span>ویترین تالار آراء قضایی</span>
      </button>

      <button
        onClick={() => onSelectTab('research')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'research'
            ? 'border-emerald-700 text-emerald-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Sparkles className="w-4 h-4 text-emerald-700" />
        <span>ویترین راهبری پژوهش (ترغیبی)</span>
      </button>

      <button
        onClick={() => onSelectTab('courses')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'courses'
            ? 'border-cyan-700 text-cyan-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <GraduationCap className="w-4 h-4 text-cyan-700" />
        <span>ویترین دوره‌ها و کارگاه‌ها</span>
      </button>

      <button
        onClick={() => onSelectTab('counseling')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'counseling'
            ? 'border-rose-700 text-rose-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <HeartHandshake className="w-4 h-4 text-rose-700" />
        <span>ویترین خدمات مشاوره نخبگان</span>
      </button>

      <button
        onClick={() => onSelectTab('welfare')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'welfare'
            ? 'border-teal-700 text-teal-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Gift className="w-4 h-4 text-teal-700" />
        <span>ویترین رفاهیات و اقامتگاه‌ها</span>
      </button>

      <button
        onClick={() => onSelectTab('books')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'books'
            ? 'border-purple-700 text-purple-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <BookOpen className="w-4 h-4 text-purple-700" />
        <span>ویترین کتب و انتشارات</span>
      </button>

      <button
        onClick={() => onSelectTab('multimedia')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'multimedia'
            ? 'border-blue-700 text-blue-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Video className="w-4 h-4 text-blue-700" />
        <span>ویترین درس‌گفتارها و چندرسانه‌ای</span>
      </button>

      <button
        onClick={() => onSelectTab('hero')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'hero'
            ? 'border-amber-700 text-amber-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Home className="w-4 h-4 text-amber-700" />
        <span>بنر هیرو و خوش‌آمدگویی</span>
      </button>

      <button
        onClick={() => onSelectTab('fonts')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'fonts'
            ? 'border-teal-700 text-teal-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Edit3 className="w-4 h-4 text-teal-700" />
        <span>سایز فونت ویترین‌ها (تفکیکی)</span>
      </button>

      <button
        onClick={() => onSelectTab('cards')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'cards'
            ? 'border-emerald-700 text-emerald-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Sliders className="w-4 h-4 text-emerald-700" />
        <span>چیدمان و اندازه کارت‌ها (Bento Grid)</span>
      </button>

      <button
        onClick={() => onSelectTab('modes')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'modes'
            ? 'border-emerald-700 text-emerald-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Layout className="w-4 h-4" />
        <span>نوع نمایش و حالت گالری‌ها</span>
      </button>

      <button
        onClick={() => onSelectTab('styling')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'styling'
            ? 'border-emerald-700 text-emerald-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Palette className="w-4 h-4" />
        <span>رنگ‌بندی بوم و عناوین</span>
      </button>

      <button
        onClick={() => onSelectTab('stats')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'stats'
            ? 'border-emerald-700 text-emerald-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Sliders className="w-4 h-4 text-amber-600" />
        <span>آمار ۴‌گانه بنر دانش‌آموختگان</span>
      </button>

      <button
        onClick={() => onSelectTab('showcase')}
        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
          activeTab === 'showcase'
            ? 'border-emerald-700 text-emerald-900'
            : 'border-transparent text-stone-500 hover:text-stone-900'
        }`}
      >
        <Award className="w-4 h-4" />
        <span>ویترین گزارش و آمار خدمات</span>
      </button>
    </div>
  );
};

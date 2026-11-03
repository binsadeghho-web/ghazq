import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Command,
  ArrowRight,
  Inbox,
  GraduationCap,
  Scale,
  Compass,
  HeartHandshake,
  Gift,
  Users2,
  BookOpen,
  FilePlus,
  Shield,
  Settings,
  Sparkles,
  X
} from 'lucide-react';

interface MizanCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  onOpenNewRequestModal?: () => void;
}

export const MizanCommandPalette: React.FC<MizanCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewRequestModal
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useApp();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const allItems = [
    {
      id: 'nav-cartable',
      title: 'کارتابل اداری و گردش اسناد',
      subtitle: 'ثبت استعلام، دریافت گواهی و پیگیری نامه‌های قضایی',
      category: 'بخش‌های سامانه',
      icon: Inbox,
      color: '#158561',
      action: () => { onNavigate('cartable'); onClose(); }
    },
    {
      id: 'act-new-request',
      title: 'ثبت درخواست استعلام جدید',
      subtitle: 'ارسال فوری تقاضا به دبیرخانه مجمع',
      category: 'عملیات سریع',
      icon: FilePlus,
      color: '#158561',
      action: () => {
        onClose();
        if (onOpenNewRequestModal) onOpenNewRequestModal();
        else onNavigate('cartable');
      }
    },
    {
      id: 'nav-counseling-specialized',
      title: 'مشاوره تخصصی شغلی و تحصیلی',
      subtitle: 'هدایت مسیر قضایی، مصاحبه‌های استخدامی و ارتقای رتبه',
      category: 'خدمات مشاوره',
      icon: Compass,
      color: '#006042',
      action: () => { onNavigate('counseling_specialized'); onClose(); }
    },
    {
      id: 'nav-counseling-general',
      title: 'خدمات مشاوره عمومی و فردی',
      subtitle: 'روان‌شناختی، خانواده، زوج‌درمانی و مدیریت اضطراب',
      category: 'خدمات مشاوره',
      icon: HeartHandshake,
      color: '#BF2C43',
      action: () => { onNavigate('counseling'); onClose(); }
    },
    {
      id: 'nav-courses',
      title: 'دوره‌ها و کارگاه‌های تخصصی',
      subtitle: 'مشاهده دوره‌های فعال، وبینارها و ثبت‌نام در کارگاه‌ها',
      category: 'آموزش و پژوهش',
      icon: GraduationCap,
      color: '#00848B',
      action: () => { onNavigate('courses'); onClose(); }
    },
    {
      id: 'nav-research',
      title: 'راهبری پایان‌نامه‌ها و رساله‌ها',
      subtitle: 'داوری، ثبت درخواست راهبری و مشاوره اساتید عالی',
      category: 'آموزش و پژوهش',
      icon: BookOpen,
      color: '#A06316',
      action: () => { onNavigate('research'); onClose(); }
    },
    {
      id: 'nav-rulings',
      title: 'تالار نقد آراء و دادنامه‌ها',
      subtitle: 'نقد تحلیلی آراء شعب محاکم، تبادل نظر و آراء وحدت رویه',
      category: 'قضاوت و رویه',
      icon: Scale,
      color: '#9A6418',
      action: () => { onNavigate('rulings'); onClose(); }
    },
    {
      id: 'nav-products',
      title: 'فروشگاه کتب و منشورات حقوقی',
      subtitle: 'سفارش آنلاین جدیدترین کتاب‌ها و متون فقهی-قضایی',
      category: 'خدمات رفاهی',
      icon: BookOpen,
      color: '#5C3882',
      action: () => { onNavigate('products'); onClose(); }
    },
    {
      id: 'nav-welfare',
      title: 'تسهیلات، اقامتگاه‌ها و هدایا',
      subtitle: 'رزرو اماکن اقامتی، بن‌های رفاهی و تسهیلات همکاران',
      category: 'خدمات رفاهی',
      icon: Gift,
      color: '#B23A00',
      action: () => { onNavigate('welfare'); onClose(); }
    },
    {
      id: 'nav-synergy',
      title: 'دیوار هم‌افزایی و تبادل آراء',
      subtitle: 'اشتراک تجربیات شعب، پرسش و پاسخ همکاران قضایی',
      category: 'جامعه نخبگانی',
      icon: Users2,
      color: '#3463A6',
      action: () => { onNavigate('synergy'); onClose(); }
    },
    {
      id: 'nav-alumni',
      title: 'فهرست دانش‌آموختگان و قضات',
      subtitle: 'جستجوی همکاران بر اساس دوره، استان و سمت قضایی',
      category: 'جامعه نخبگانی',
      icon: Users2,
      color: '#158561',
      action: () => { onNavigate('alumni'); onClose(); }
    }
  ];

  if (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') {
    allItems.push(
      {
        id: 'nav-admin',
        title: 'پنل مدیریت و تنظیمات دبیرخانه',
        subtitle: 'مدیریت کاربران، صدور تاییدیه‌ها و دسترسی‌ها',
        category: 'مدیریت سامانه',
        icon: Shield,
        color: '#A06316',
        action: () => { onNavigate('admin'); onClose(); }
      },
      {
        id: 'nav-users',
        title: 'مدیریت اعضا و دانش‌آموختگان',
        subtitle: 'تایید مدارک، ویرایش نقش‌ها و اطلاعات اعضا',
        category: 'مدیریت سامانه',
        icon: Settings,
        color: '#0D3829',
        action: () => { onNavigate('users'); onClose(); }
      }
    );
  }

  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            className="bg-white rounded-2xl border border-[#D5E5DE] shadow-2xl max-w-xl w-full overflow-hidden text-right"
            dir="rtl"
            onKeyDown={handleKeyDown}
          >
            {/* نوار جستجوی بالا */}
            <div className="p-3.5 border-b border-[#E5EFEA] flex items-center gap-3 bg-[#FAFDFB]">
              <Search className="w-5 h-5 text-[#158561]" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="جستجو در بخش‌ها، خدمات، دوره‌ها یا عملیات سریع..."
                className="w-full bg-transparent text-sm font-medium text-[#0D3829] placeholder-[#799D8F] focus:outline-none"
              />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EBF4F0] text-[#527768]">ESC</span>
            </div>

            {/* لیست نتایج دسته‌بندی‌شده */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#F1F6F3]">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#799D8F]">
                  موردی مطابق با جستجوی شما پیدا نشد.
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const IconComp = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#EBF7F1] text-[#0D3829]'
                          : 'hover:bg-[#F6FAF8] text-[#2C5747]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isSelected ? '#158561' : '#E8F5EF',
                            color: isSelected ? '#FFFFFF' : item.color
                          }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{item.title}</div>
                          <div className="text-[11px] text-[#698F81]">{item.subtitle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAFDFB] border border-[#DEEBE5] text-[#527768]">
                          {item.category}
                        </span>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#158561] rotate-180" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* فوتر راهنما */}
            <div className="px-4 py-2.5 bg-[#F6FAF8] border-t border-[#E5EFEA] flex items-center justify-between text-[11px] text-[#719688]">
              <div className="flex items-center gap-3">
                <span>↑↓ پیمایش گزینه‌ها</span>
                <span>↵ انتخاب و ورود</span>
              </div>
              <span className="font-medium text-[#158561]">طرح میزان · هویت فاخر حقوقی</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { toPersianNumbers } from '../../utils/persianNumbers';
import {
  Gift,
  ArrowUpRight,
  ChevronLeft,
  Edit3,
  X,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Building2,
  Heart,
  Briefcase,
  ShieldCheck,
  Award,
  Scale,
  Car,
  Home,
  Flame,
  Coins,
  Coffee,
  GraduationCap,
  Compass,
  BookOpen
} from 'lucide-react';

interface WelfareAndLoansShowcaseProps {
  onNavigateToWelfare?: () => void;
}

const AVAILABLE_ICONS = [
  { id: 'CreditCard', name: 'کارت اعتباری / وام', icon: CreditCard },
  { id: 'Building2', name: 'هتل و اسکان زیارتی', icon: Building2 },
  { id: 'Heart', name: 'سلامت و درمان', icon: Heart },
  { id: 'ShoppingBag', name: 'سبد خرید و تعاونی', icon: ShoppingBag },
  { id: 'Gift', name: 'هدیه و تسهیلات', icon: Gift },
  { id: 'Coins', name: 'سکه و پاداش', icon: Coins },
  { id: 'Car', name: 'خودرو و حمل و نقل', icon: Car },
  { id: 'Home', name: 'مسکن و خدمات رفاهی', icon: Home },
  { id: 'ShieldCheck', name: 'بیمه و ضمانت', icon: ShieldCheck },
  { id: 'Briefcase', name: 'اشتغال و رفاه شغلی', icon: Briefcase },
  { id: 'Award', name: 'نشان افتخار', icon: Award },
  { id: 'Flame', name: 'پیشنهاد داغ', icon: Flame },
  { id: 'Coffee', name: 'خدمات پذیرایی و اوقات فراغت', icon: Coffee },
  { id: 'GraduationCap', name: 'کمک‌هزینه تحصیلی', icon: GraduationCap }
];

const getIconComponent = (iconId: string) => {
  const found = AVAILABLE_ICONS.find(i => i.id === iconId);
  return found ? found.icon : Gift;
};

export const WelfareAndLoansShowcase: React.FC<WelfareAndLoansShowcaseProps> = ({
  onNavigateToWelfare
}) => {
  const { consumables, currentUser, crextioConfig, updateCrextioConfig } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'supervisor';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const title = crextioConfig.welfareShowcaseTitle || 'ویترین خدمات رفاهی، تسهیلات و مساعدت‌های اعضا';
  const subtitle = crextioConfig.welfareShowcaseSubtitle || 'اعطای وام‌های قرض‌الحسنه، اسکان در اقامتگاه‌های مشهد و قم، کمک‌هزینه درمان و اقلام تعاونی اعضا';

  const [editTitle, setEditTitle] = useState(title);
  const [editSubtitle, setEditSubtitle] = useState(subtitle);

  const defaultWelfareCards = [
    {
      id: 'welf-1',
      title: 'وام قرض‌الحسنه حمایت قضایی',
      amount: '۱۰۰,۰۰۰,۰۰۰ تومان',
      subtext: 'اقساط ۳۶ ماهه بدون کارمزد با تسریع در صدور',
      tag: 'تسهیلات مالی',
      iconId: 'CreditCard',
      accent: '#059669',
      bgClass: 'bg-emerald-50/60 border-emerald-200'
    },
    {
      id: 'welf-2',
      title: 'اسکان زیارتی مشهد و قم',
      amount: 'تخفیف ۷۰٪ اعضا',
      subtext: 'رزرو آنلاین هتل‌های ۵ ستاره طرف قرارداد کانون',
      tag: 'سفر و اقامت',
      iconId: 'Building2',
      accent: '#D97706',
      bgClass: 'bg-amber-50/60 border-amber-200'
    },
    {
      id: 'welf-3',
      title: 'کمک‌هزینه درمان و سلامت خانواده',
      amount: 'پوشش تا ۵۰ میلیون',
      subtext: 'صندوق حمایت از بیماران خاص و زوج‌درمانی',
      tag: 'سلامت',
      iconId: 'Heart',
      accent: '#E11D48',
      bgClass: 'bg-rose-50/60 border-rose-200'
    },
    {
      id: 'welf-4',
      title: 'سبد معیشتی تعاونی اعضا',
      amount: 'تخفیف ویژه ۳۵٪',
      subtext: 'عرضه مستقیم اقلام خوراکی و استراتژیک خانوار',
      tag: 'تعاونی اعضا',
      iconId: 'ShoppingBag',
      accent: '#2563EB',
      bgClass: 'bg-blue-50/60 border-blue-200'
    }
  ];

  const [welfareCards, setWelfareCards] = useState(defaultWelfareCards);

  const handleUpdateCard = (id: string, field: string, val: any) => {
    setWelfareCards(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const handleAddCard = () => {
    const newCard = {
      id: `welf-${Date.now()}`,
      title: 'خدمت رفاهی جدید',
      amount: 'تخفیف ویژه ۵۰٪',
      subtext: 'توضیحات کوتاه خدمت جدید',
      tag: 'تسهیلات ویژه',
      iconId: 'Gift',
      accent: '#0D9488',
      bgClass: 'bg-teal-50/60 border-teal-200'
    };
    setWelfareCards(prev => [...prev, newCard]);
  };

  const handleRemoveCard = (id: string) => {
    if (welfareCards.length <= 1) return;
    setWelfareCards(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    updateCrextioConfig({
      welfareShowcaseTitle: editTitle,
      welfareShowcaseSubtitle: editSubtitle
    });
    setIsEditModalOpen(false);
  };

  return (
    <div className="w-full relative overflow-hidden rounded-[32px] bg-[#FCFCFA] border border-stone-200/90 shadow-sm p-5 sm:p-7 text-stone-900 space-y-5">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shadow-2xs">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-stone-900">{title}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 text-[10px] font-extrabold">
                رفاهیات و وام‌ها
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {isAdmin && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>ویرایش ویترین و استیکرها</span>
            </button>
          )}

          <button
            onClick={onNavigateToWelfare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>ورود به سامانه رفاهیات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Welfare Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {welfareCards.map(item => {
          const Icon = getIconComponent(item.iconId);

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              onClick={onNavigateToWelfare}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md ${item.bgClass}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs"
                    style={{ backgroundColor: `${item.accent}20`, color: item.accent }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-800">
                    {item.tag}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-stone-900 line-clamp-1">{item.title}</h4>
                  <span className="text-xs font-black text-emerald-800 mt-1 block">
                    {item.amount}
                  </span>
                  <p className="text-[11px] text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                    {item.subtext}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs font-bold text-teal-800">
                <span>ثبت درخواست آنلاین</span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Admin Edit Modal with Icon / Sticker Selector & Card Add/Delete */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl border border-stone-200 shadow-2xl p-6 text-stone-900 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-teal-700" />
                  <h4 className="font-black text-sm text-stone-900">
                    ویرایش ویترین رفاهیات، تغییر نمادها (استیکرها) و افزودن/حذف کارت‌ها
                  </h4>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">عنوان ویترین:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">توضیح کوتاه ویترین:</label>
                  <textarea
                    rows={2}
                    value={editSubtitle}
                    onChange={e => setEditSubtitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-300"
                  />
                </div>
              </div>

              {/* Cards Management */}
              <div className="space-y-3 pt-2 border-t border-stone-200 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h5 className="font-black text-xs text-stone-900">مدیریت کارت‌های ویترین رفاهی:</h5>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        const selectedItem = consumables.find(c => c.id === e.target.value);
                        if (selectedItem) {
                          setWelfareCards(prev => [
                            ...prev,
                            {
                              id: `welf-${Date.now()}`,
                              title: selectedItem.title,
                              amount: `قیمت تعاونی: ${selectedItem.cooperativePrice.toLocaleString('fa-IR')} تومان`,
                              subtext: `${selectedItem.description} (بازار: ${selectedItem.marketPrice.toLocaleString('fa-IR')} تومان)`,
                              tag: selectedItem.category || 'کالای تعاونی',
                              iconId: 'ShoppingBag',
                              accent: '#2563EB',
                              bgClass: 'bg-blue-50/60 border-blue-200'
                            }
                          ]);
                        }
                        e.target.value = '';
                      }}
                      className="p-1.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-bold text-stone-800"
                    >
                      <option value="">+ انتخاب مستقیم از اقلام تعاونی اعضا...</option>
                      {consumables.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.cooperativePrice.toLocaleString('fa-IR')} تومان)
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddCard}
                      className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن کارت دستی</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {welfareCards.map(item => {
                    const CurrentIcon = getIconComponent(item.iconId);

                    return (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          <div>
                            <label className="text-[10px] text-stone-500 block">عنوان خدمت:</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={e => handleUpdateCard(item.id, 'title', e.target.value)}
                              className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block">مبلغ / تخفیف / سقف:</label>
                            <input
                              type="text"
                              value={item.amount}
                              onChange={e => handleUpdateCard(item.id, 'amount', e.target.value)}
                              className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300 text-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block">انتخاب نماد / استیکر آیکون:</label>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
                                <CurrentIcon className="w-4 h-4" />
                              </div>
                              <select
                                value={item.iconId}
                                onChange={e => handleUpdateCard(item.id, 'iconId', e.target.value)}
                                className="w-full p-1.5 text-xs font-bold bg-white rounded-lg border border-stone-300"
                              >
                                {AVAILABLE_ICONS.map(i => (
                                  <option key={i.id} value={i.id}>
                                    {i.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block">توضیح کامل خدمت:</label>
                            <input
                              type="text"
                              value={item.subtext}
                              onChange={e => handleUpdateCard(item.id, 'subtext', e.target.value)}
                              className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-500 block">برچسب / دسته‌بندی:</label>
                            <input
                              type="text"
                              value={item.tag}
                              onChange={e => handleUpdateCard(item.id, 'tag', e.target.value)}
                              className="w-full p-1.5 text-xs bg-white rounded-lg border border-stone-300"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(item.id)}
                            className="text-red-600 hover:text-red-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف این کارت</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  ذخیره تغییرات و نمادها
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Client-only image registry importing local high-resolution assets generated for the platform.
// Note: Keep `.jpg` imports exclusively inside client modules (never import in server.ts or mockData.ts).

import honorsJudicialAppointmentImg from '../assets/images/honors_judicial_appointment_1794827977403.jpg';
import honorsAcademicAwardImg from '../assets/images/honors_academic_award_1794827976987.jpg';
import showcaseResearchLibraryImg from '../assets/images/showcase_research_library_1794827977676.jpg';
import showcaseCoursesLectureImg from '../assets/images/showcase_courses_lecture_1794827976457.jpg';
import showcaseRulingsJusticeImg from '../assets/images/showcase_rulings_justice_1794827978567.jpg';
import showcaseCounselingDialogueImg from '../assets/images/showcase_counseling_dialogue_1794827978359.jpg';
import showcaseWelfareHospitalityImg from '../assets/images/showcase_welfare_hospitality_1794827978552.jpg';
import showcaseBooksArchiveImg from '../assets/images/showcase_books_archive_1794827978868.jpg';
import productBookJurisprudenceImg from '../assets/images/product_book_jurisprudence_1795010201935.jpg';
import productMultimediaSoftwareImg from '../assets/images/product_multimedia_software_1795010204743.jpg';
import productAudioLecturesImg from '../assets/images/product_audio_lectures_1795010203811.jpg';
import productBookMonographImg from '../assets/images/product_book_monograph_1795010203427.jpg';

export const PRODUCT_STUDIO_IMAGES = {
  book_jurisprudence: productBookJurisprudenceImg,
  book_monograph: productBookMonographImg,
  multimedia_software: productMultimediaSoftwareImg,
  audio_lectures: productAudioLecturesImg,
};

export function resolveProductCoverUrl(
  url?: string,
  format: 'book' | 'multimedia' | 'audio_series' = 'book',
  index = 0
): string {
  if (url && url.trim() && !url.includes('unsplash.com')) {
    return url;
  }
  if (format === 'multimedia') return productMultimediaSoftwareImg;
  if (format === 'audio_series') return productAudioLecturesImg;
  return index % 2 === 0 ? productBookJurisprudenceImg : productBookMonographImg;
}

export const DEFAULT_SHOWCASE_IMAGES: Record<string, string> = {
  hero_portrait: showcaseCounselingDialogueImg,
  unified_showcase: showcaseResearchLibraryImg,
  honors_showcase: honorsJudicialAppointmentImg,
  rulings_showcase: showcaseRulingsJusticeImg,
  research_promo: showcaseResearchLibraryImg,
  course_showcase: showcaseCoursesLectureImg,
  counseling_promo: showcaseCounselingDialogueImg,
  welfare_showcase: showcaseWelfareHospitalityImg,
  multimedia_showcase: productAudioLecturesImg,
  books_showcase: productBookJurisprudenceImg,
};

export const SHOWCASE_IMAGE_LABELS: Array<{ key: string; title: string; desc: string }> = [
  { key: 'hero_portrait', title: 'تصویر / پرتره بنر خوش‌آمدگویی', desc: 'تصویر کنار بنر خوش‌آمد بالای داشبورد در تم ۲ و تم ۳' },
  { key: 'unified_showcase', title: 'تصویر پیش‌فرض نمایشگاه جامع', desc: 'تصویر کلی قاب نمایشگاه جامع خدمات' },
  { key: 'honors_showcase', title: 'تصویر پیش‌فرض افتخارات و انتصابات', desc: 'بنر پیش‌فرض تبریک انتصابات و رتبه‌های برتر' },
  { key: 'rulings_showcase', title: 'تصویر ویترین تالار آراء قضایی', desc: 'پوستر و پس‌زمینه ویترین آراء در حالت ساده و کاروسل' },
  { key: 'research_promo', title: 'تصویر ویترین راهبری پژوهش', desc: 'تصویر پس‌زمینه باشگاه راهبری پژوهش و رساله‌ها' },
  { key: 'course_showcase', title: 'تصویر ویترین دوره‌های علمی', desc: 'پوستر ویترین دوره‌ها و کارگاه‌های فقه القضا' },
  { key: 'counseling_promo', title: 'تصویر ویترین مشاوره نخبگان', desc: 'پوستر خدمات مشاوره تخصصی و عمومی' },
  { key: 'welfare_showcase', title: 'تصویر ویترین رفاهیات و تسهیلات', desc: 'تصویر خدمات رفاهی، وام و اقامتگاه‌ها' },
  { key: 'multimedia_showcase', title: 'تصویر ویترین درس‌گفتارها و چندرسانه‌ای', desc: 'پوستر آرشیو صوت و تصویر جلسات' },
  { key: 'books_showcase', title: 'تصویر ویترین کتاب و محصولات چند رسانه‌ای', desc: 'تصویر موسوعه‌ها، چندرسانه‌ای و صوت تخصصی' },
];

export const BUILTIN_HONOR_IMAGES: Record<string, string> = {
  'builtin:judicial_appointment': honorsJudicialAppointmentImg,
  'builtin:academic_award': honorsAcademicAwardImg,
  'builtin:research_library': showcaseResearchLibraryImg,
  'builtin:rulings_justice': showcaseRulingsJusticeImg,
};

export function resolveHonorImageUrl(url?: string, fallbackIndex = 0): string {
  if (!url) {
    return fallbackIndex % 2 === 0 ? honorsJudicialAppointmentImg : honorsAcademicAwardImg;
  }
  if (BUILTIN_HONOR_IMAGES[url]) {
    return BUILTIN_HONOR_IMAGES[url];
  }
  return url;
}

export function resolveShowcaseImageUrl(
  sectionKey: string,
  overrides?: Record<string, string>
): string | undefined {
  if (overrides && overrides[sectionKey]) {
    return overrides[sectionKey];
  }
  return DEFAULT_SHOWCASE_IMAGES[sectionKey];
}

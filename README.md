# سامانه جامع دانش‌آموختگان فقه و قضا (Enterprise Portal v3.0)

پورتال سازمانی و تک‌صفحه‌ای (SPA + Express Full-Stack) ویژه مدیریت امور اداری، آموزشی، پژوهشی، مشاوره‌ای، رفاهی و قضایی دانش‌آموختگان و مسئولان مرکز فقه و قضا، مبتنی بر **React 19 + TypeScript + Vite 8 + Express + MySQL 8**.

---

## فهرست مستندات فنی (Developer Documentation Map)

برای تسلط سریع و کامل هر برنامه‌نویس جدید روی معماری، دیتابیس، ماژول‌ها و استقرار، مستندات به ۵ سند تخصصی تقسیم شده است:

| سند | موضوع و کاربرد | مسیر فایل |
| :--- | :--- | :--- |
| **۰. راهنمای اصلی (همین فایل)** | معرفی سریع، پشته فنی، دستورات اجرا، ساختار پوشه‌ها و نقشه کلی سامانه | [`README.md`](./README.md) |
| **۱. معماری پلتفرم و جریان داده** | ساختار Backend/Frontend، پایپ‌لاین Middleware، مدیریت خطای RFC 9457، Idempotency، Outbox/SSE، قفل هم‌زمانی (OCC) و کانتکست‌های React | [`docs/01-ARCHITECTURE-AND-PLATFORM.md`](./docs/01-ARCHITECTURE-AND-PLATFORM.md) |
| **۲. پایگاه داده MySQL 8 و مهاجرت‌ها** | اتصال دیتابیس، الگوی UUIDv7 (`BINARY(16)`)، جداول پایه (`schema.sql`) و مهاجرت‌های خودکار (`domainTablesSetup.ts`) | [`docs/02-DATABASE-SCHEMA.md`](./docs/02-DATABASE-SCHEMA.md) |
| **۳. ماژول‌های دامنه و مرجع کامل API** | توضیح ۱۴ ماژول بک‌اند و کامپوننت‌های فرانت‌اند متناظر، لیست کامل Endpointها و منطق کسب‌وکار هر بخش | [`docs/03-MODULES-AND-API-REFERENCE.md`](./docs/03-MODULES-AND-API-REFERENCE.md) |
| **۴. امنیت، RBAC، فایل‌ها و استقرار** | چرخه JWT و Refresh Token Rotation، ۱۱ نقش و ماتریس دسترسی، آپلود امن (Magic Bytes)، استقرار Docker / Runflare | [`docs/04-SECURITY-RBAC-AND-DEPLOYMENT.md`](./docs/04-SECURITY-RBAC-AND-DEPLOYMENT.md) |

---

## ۱. پشته فنی (Tech Stack)

- **Frontend:**
  - React `19.0.1` + TypeScript `7.0.2`
  - Vite `8.3.0` (`@vitejs/plugin-react`)
  - Tailwind CSS `v4` (`@tailwindcss/vite`, `@import "tailwindcss";` در `src/index.css`)
  - `motion` (`motion/react`) برای انیمیشن‌ها، `lucide-react` برای آیکون‌ها، `@fontsource/vazirmatn` برای فونت فارسی
- **Backend (`server.ts`):**
  - Node.js + Express `4.21.2` (در حالت Dev میدل‌ور `vite.middlewares` را مونت می‌کند؛ در Production باندل `dist/` را سرو می‌کند)
  - `mysql2/promise` برای اتصال مستقیم Pool به MySQL 8 (بدون ORM سنگین، با کوئری‌های پارامتریک و کنترل تایم‌اوت)
  - `bcryptjs` برای هش رمز عبور، `crypto` بومی Node برای HMAC-SHA256 JWT و زنجیره Audit
- **Real-Time & Persistence:**
  - Server-Sent Events (`GET /api/events`) با تیکت یک‌بارمصرف (`POST /api/events/ticket`) و الگوی Transactional Outbox
  - ذخیره‌سازی فایل‌ها روی دیسک (`storage/` در لوکال یا `/MYDISK` در رانفلر) با تفکیک پوشه‌های عمومی و خصوصی

---

## ۲. راه‌اندازی سریع برای برنامه‌نویسان (Quick Start)

### پیش‌نیازها
- Node.js 20+
- دسترسی به سرور MySQL 8 (متغیرهای نمونه در `.env.example` موجود است)

### دستورات کلیدی (`package.json`)

```bash
# ۱. نصب وابستگی‌ها
npm install

# ۲. راه‌اندازی اولیه جداول و تریگرهای پایگاه داده (Idempotent)
npm run db:init

# ۳. ایجاد کاربران اولیه پایه (در صورت نیاز)
npm run db:seed

# ۴. اجرای سرور توسعه (Express + Vite روی پورت 3000)
npm run dev

# ۵. بررسی TypeScript بدون خروجی بیلد
npm run lint

# ۶. بیلد نهایی تولید (Vite build -> dist/ + esbuild server.ts -> dist/server.js)
npm run build

# ۷. اجرای نسخه تولید
npm run start
```

### سایر اسکریپت‌های عملیاتی و تست (`/scripts`)
- `npm run db:backup` ← پشتیبان‌گیری JSON/SQL از پایگاه داده در مسیر `backups`
- `npm run admin:reset-2fa` ← ریست احراز هویت دوعاملی ادمین
- اسکریپت‌های تست فنی در پوشه `scripts/`: `testRealHttpSuite.ts`, `testConcurrency.ts`, `testOutboxAndIdempotency.ts`, `testRealtimeSSE.ts`, `testAuthAndPersian.ts`, `testUserLifecycleSuite.ts` و ...

---

## ۳. نقشه ساختار پوشه‌های پروژه (Directory Layout)

```text
/
├── server.ts                    # نقطه ورود سرور Express + میدل‌ورهای امنیتی و اتصال Vite/Static
├── index.html                   # پوسته HTML (RTL، عنوان و متا تگ‌ها)
├── metadata.json                # متادیتای برنامه و قابلیت‌ها
├── package.json                 # اسکریپت‌ها و پکیج‌ها
├── Dockerfile                   # بیلد چندمرحله‌ای (Multi-stage) برای استقرار ابری
├── .env.example                 # الگوی متغیرهای محیطی (DB, STORAGE_PATH, AUDIT_HMAC_KEY, ...)
├── database/
│   └── schema.sql               # DDL پایه و اولیه جداول MySQL 8 + تریگرهای Audit
├── scripts/                     # اسکریپت‌های راه‌اندازی DB، بکاپ، سید و تست‌های تخصصی
├── storage/                     # مسیر پیش‌فرض ذخیره‌سازی محلی فایل‌ها (در تولید: STORAGE_PATH=/MYDISK)
├── docs/                        # مستندات جامع معماری، دیتابیس، API و امنیت
└── src/
    ├── main.tsx                 # نقطه مونت React
    ├── App.tsx                  # روتر تب‌های اصلی + گیت اجباری لاگین + انتخاب تم‌ها
    ├── index.css                # استایل سراسری Tailwind v4 و متغیرهای RTL/فونت
    ├── types/index.ts           # تمام Interfaceها و Enumهای تایپ‌اسکریپت مشترک فرانت و بک‌اند
    ├── services/apiClient.ts    # کلاینت HTTP مرکزی (Bearer JWT، Silent Refresh، If-Match، Idempotency-Key، SSE)
    ├── utils/                   # ابزارهای کمکی (اعداد فارسی، مبالغ، RBAC کلاینت، آفلاین و درصد تکمیل پروفایل)
    ├── context/                 # AppContext (تجمیع‌کننده) + ۹ کانتکست تخصصی دامنه‌ها
    ├── components/              # کامپوننت‌های رابط کاربری تفکیک‌شده بر اساس بخش و تم
    │   ├── admin/               # پنل مدیریت، مدیریت کاربران، نقش‌ها، گزارش‌های مالی و عملیات
    │   ├── alumni/              # بانک اطلاعات دانش‌آموختگان، کارت هویت، ویجت درصد تکمیل
    │   ├── auth/                # صفحه تمام‌صفحه لاگین، مودال لاگین، مدیریت نشست‌ها
    │   ├── cartable/            # کارتابل اداری و ارجاع بین‌بخشی
    │   ├── common/              # Toast، مودال تعارض هم‌زمانی (409)، شمارنده و کارت‌های عمومی
    │   ├── counseling/          # مشاوره عمومی (روان‌شناسان/تست‌ها/نرخ‌نامه) و مشاوره تخصصی شغلی/تحصیلی
    │   ├── courses/             # دوره‌های آموزشی، اقساط، کدهای تخفیف، حضوروغیاب، گواهی‌ها
    │   ├── crextio/             # تم ۲ (پیش‌فرض سیستم: Crextio زمردی/عاجی + شوکیس‌ها)
    │   ├── dashboard/           # داشبورد تم ۱ و ویجت‌های بنر/تقویم
    │   ├── finance/             # امور مالی و تراز درآمدها
    │   ├── layout/              # Navbar، Sidebar، MobileBottomNav
    │   ├── minimal/             # تم ۳ (طراحی مینیمال)
    │   ├── mizan/               # چیدمان میزان
    │   ├── products/            # فروشگاه آثار و کتاب‌ها + سفارش‌ها و فیش‌های واریزی
    │   ├── research/            # راهبری پژوهش، مراحل پویا و فرم‌ساز پژوهشی
    │   ├── rulings/             # تالار آراء قضایی، نقد، هایلایت و تگ‌ها
    │   ├── synergy/             # دیوار هم‌افزایی و همدلی + پیام‌های خصوصی
    │   └── welfare/             # خدمات رفاهی (وام، اقامتگاه، تعاونی مصرف، پیگیری پستی)
    └── server/
        ├── routes.ts            # روتر مرکزی `/api`، آپلود/دانلود امن فایل خصوصی، SSE و `/api/metrics`
        ├── platform/            # زیرساخت مشترک بک‌اند (DB Pool، Auth، RBAC، Audit، Outbox، Storage، Errors)
        └── modules/             # ۱۴ ماژول مستقل دامنه‌های کسب‌وکار (Controller/Service/Router)
```

---

## ۴. اصول کلیدی معماری که باید پیش از کدنویسی بدانید

1. **گیت اجباری احراز هویت (Login-First Architecture):**
   - طبق اصلاحیه ۵۵، در `src/App.tsx` هر بازدیدکننده پیش از دریافت `currentUser` مستقیماً صفحه `ModernLoginPage` را می‌بیند. هیچ توکن نمایشی یا هدر جعلی `x-user-*` پذیرفته نمی‌شود.
2. **پایگاه داده دو-لایه (Schema + Self-Healing Migrations):**
   - جداول اصلی در `database/schema.sql` تعریف شده‌اند و تکامل‌های بعدی (ستون‌های جدید، جداول جدید دوره‌ها، مشاوره، تخفیف‌ها، تست‌های روان‌شناسی، بنرها و RBAC) در `src/server/platform/domainTablesSetup.ts` به‌صورت Idempotent اجرا می‌شوند.
3. **شناسه‌های UUIDv7 باینری (`BINARY(16)`):**
   - همه کلیدهای اصلی و خارجی در MySQL به شکل `BINARY(16)` ذخیره و از طریق توابع `toIdBuffer()` و `fromIdBuffer()` در `src/server/platform/uuidv7.ts` به رشته UUID تبدیل می‌شوند.
4. **کنترل هم‌زمانی خوش‌بینانه (OCC):**
   - رکوردهای قابل ویرایش دارای ستون `version` هستند. کلاینت (`apiClient.ts`) هدر `If-Match` یا فیلد `expectedVersion` را می‌فرستد و سرور هنگام `UPDATE ... WHERE version = ?` در صورت مغایرت خطای HTTP `409 Conflict` برمی‌گرداند.
5. **جداسازی کامل بخش‌های مشاوره عمومی و تخصصی:**
   - هرچند هر دو بخش روی روتر `/api/counseling` قرار دارند، داده‌های آن‌ها کاملاً از هم جدا و با فیلد `counselingType: 'general' | 'specialized_career'` تفکیک می‌شوند (ویزارد مرحله‌به‌مرحله قابل ساخت ۱۰۰٪ توسط ادمین، زمینه‌های مشاوره مجزا، نرخ‌نامه و تست‌های روان‌شناسی مخصوص مشاوره عمومی).
6. **نرمال‌سازی خودکار حروف و ارقام فارسی (`persianNormalizerMiddleware`):**
   - تمام ورودی‌های متنی درخواست‌ها (به‌جز رمز عبور و فیلدهای حساس) پیش از ورود به ماژول‌ها، ارقام فارسی/عربی (`۰-۹`, `٠-٩`) را به انگلیسی (`0-9`) و حروف عربی (`ي`, `ك`) را به فارسی استاندارد (`ی`, `ک`) تبدیل می‌کنند.

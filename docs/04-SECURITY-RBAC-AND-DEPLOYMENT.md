# ۴. امنیت، ماتریس RBAC، ذخیره‌سازی و راهنمای استقرار

این سند جزئیات امنیتی، مدل دسترسی ۱۱ نقش سامانه، ساختار فایل‌ها و نکات استقرار در محیط تولید (Docker / Runflare Cloud) را شرح می‌دهد.

---

## ۱. احراز هویت و حفاظت نشست‌ها

### چرخه ورود (`authModule.ts`)
1. کاربر می‌تواند با `national_id`، `username`، `phone` یا **`center_code`** وارد شود.
2. پیش از بررسی رمز عبور، محدودیت نرخ تلاش ورود (`auth_rate_limits`) بررسی می‌شود.
3. رمز عبور با `bcryptjs` (`compareSync`) مقایسه می‌شود. در صورت خطای متوالی، ستون `failed_attempts` افزایش یافته و مطابق سیاست امنیتی، حساب موقتاً قفل (`is_locked`, `locked_until`) می‌شود.
4. در صورت موفقیت:
   - در جدول `user_sessions` یک رکورد نشست با `family_id` یکتا ثبت می‌شود.
   - یک **Access Token (JWT HS256 - ۱۵ دقیقه)** حاوی `sub`, `role`, `sid`, `tv` (`token_version`), `jti` صادر می‌گردد.
   - یک **Refresh Token** هش‌شده (`SHA-256`) در جدول `refresh_tokens` ذخیره می‌شود.
5. **چرخش توکن و تشخیص سرقت (Refresh Token Rotation & Reuse Detection):**
   - هر بار که `POST /api/auth/refresh` صدا زده شود، توکن قبلی باطل و توکن جدید در همان `family_id` صادر می‌شود.
   - اگر توکن باطل‌شده دوباره استفاده شود (نشانه سرقت توکن)، کل خانواده (`family_id`) و نشست‌های مرتبط فوراً باطل می‌شوند.

### الزامات امنیتی حیاتی برای توسعه‌دهندگان
- هرگز هدرهای سمت کلاینت مثل `x-user-id` یا `x-user-role` را اعتماد نکنید (`sessionAuthMiddleware` آن‌ها را پاک می‌کند). همواره از `getCurrentUser(req)` استفاده کنید.
- برای عملیات مدیریتی هم از `rbacEnforcementMiddleware` و هم در سطح سرویس از `AuthorizationPolicy.requireRole(...)` استفاده کنید.
- برای تمام منابع خصوصی متعلق به کاربر، حتماً با `AuthorizationPolicy.assertOwnership(...)` از حملات IDOR/BOLA جلوگیری کنید.

---

## ۲. ماتریس نقش‌ها و سطوح دسترسی (RBAC)

موجودیت نقش‌ها در `src/types/index.ts` و سیاست پیش‌فرض در `src/utils/rbacPolicy.ts` و `src/server/modules/rbac/rbacModule.ts` تعریف شده است:

### نقش‌های سازمانی (Organizational Roles)
1. `admin` و `super_admin`: دسترسی کامل و نامحدود (`manage_all`) به تمام ۱۴ بخش.
2. `general_observer` (ناظر کل سامانه): مشاهده کامل تمام بخش‌ها (`view_all`)؛ در میدل‌ور RBAC تمامی درخواست‌های غیر-GET (`POST`, `PUT`, `PATCH`, `DELETE`) برای این نقش با HTTP `403 SECTION_READ_ONLY` مسدود می‌شوند.
3. `alumni_manager` (مدیر امور دانش‌آموختگان): مدیریت دانش‌آموختگان، کاربران، کارتابل و پیگیری‌ها.
4. `admin_finance_officer` (مسئول اداری و مالی): مدیریت امور مالی، فروشگاه، رفاهی و تایید پرداخت‌ها.
5. `education_deputy` (معاونت آموزش): مدیریت دوره‌ها، اقساط، گواهی‌ها و تخفیف‌ها.
6. `cultural_educational_officer` (مسئول فرهنگی و آموزشی / مشاوره): مدیریت مشاوره و امور فرهنگی.
7. `research_deputy` (معاونت پژوهش): مدیریت راهبری پژوهش و تالار آراء.
8. `supervisor` (ناظر/پشتیبان سازمانی): سازگاری با نقش مدیر عملیاتی بخش‌ها.

### نقش‌های کاربری بیرونی و دانش‌آموختگان
9. `alumni` (دانش‌آموخته): دسترسی فقط به داده‌های خود (`manage_own` / `view_own`) در بخش‌های مجاز. طبق **اصلاحیه ۵۷**، بخش‌های «مدیریت کاربران (`users`)»، «تنظیمات/مدیریت سایت (`admin`)» و «بانک دانش‌آموختگان (`alumni`)» از منو، داشبورد و مسیرهای دسترس‌پذیر پنل دانش‌آموختگان حذف و مسدود شده‌اند.
10. `customer` (مشتری/کاربر آزاد): دسترسی محدودشده و کنترل‌پذیر از طریق `RoleAndCustomerAccessCenter` (از جمله قابلیت مخفی‌سازی آیتم‌های خاص فروشگاه یا دوره).

### سطوح دسترسی هر بخش (`AppSectionId`)
هر یک از ۱۴ بخش (`dashboard`, `cartable`, `courses`, `products`, `counseling`, `specialized_counseling`, `research`, `rulings`, `welfare`, `synergy`, `alumni`, `users`, `finance`, `admin`) می‌تواند یکی از مقادیر زیر را بگیرد:
- `none`: پنهان در UI و مسدود (`403`) در API
- `view_all` / `view_own`: فقط خواندنی
- `manage_all` / `manage_own`: مشاهده + ایجاد/ویرایش/حذف (در محدوده کل یا فقط داده‌های خود)

---

## ۳. سیستم آپلود و ذخیره‌سازی فایل‌ها (`storage.ts` & `uploadSecurity.ts`)

مسیر ریشه از `process.env.STORAGE_PATH` (در تولید `/MYDISK`) یا `./storage` در توسعه خوانده می‌شود و شامل ساختار زیر است:

| دسته (`UploadCategory`) | مسیر روی دیسک | نوع دسترسی | کاربرد |
| :--- | :--- | :--- | :--- |
| `avatar` | `uploads/avatars` | عمومی (`/uploads/avatars/...`) | تصویر پروفایل کاربران |
| `product` | `uploads/products` | عمومی | تصاویر محصولات فروشگاه |
| `course` | `uploads/courses` | عمومی | کاور و منابع عمومی دوره‌ها |
| `misc` | `uploads/misc` | عمومی | سایر فایل‌های عمومی |
| `consultation` | `uploads/consultations` | **خصوصی** (`/api/storage/private/...`) | پیوست‌های مشاوره |
| `research` | `uploads/research` | **خصوصی** | فایل‌های راهبری پژوهش |
| `verdict` | `uploads/verdicts` | **خصوصی + گارد انتشار** | پیوست‌های آراء قضایی |
| `cartable_alumni` | `uploads/cartable_alumni` | **خصوصی + گارد مالکیت** | پیوست ارسالی دانش‌آموخته در کارتابل |
| `cartable_officials` | `uploads/cartable_officials` | **خصوصی + گارد نقش/مالکیت** | پیوست ارسالی مسئول در کارتابل |
| `product_receipt` | `uploads/product_receipts` | **خصوصی + گارد مالکیت** | تصویر فیش خرید محصول |
| `course_receipt` | `uploads/course_receipts` | **خصوصی + گارد مالکیت** | تصویر فیش ثبت‌نام و اقساط دوره |
| `course_certificate` | `uploads/course_certificates/course_<id>` | **خصوصی + فقط مدیر در آپلود + گارد مالکیت در دانلود** | گواهی‌های پایان هر دوره در پوشه اختصاصی همان دوره |

---

## ۴. راهنمای استقرار و متغیرهای محیطی (Deployment)

### متغیرهای ضروری (`.env.example`)
- `NODE_ENV`: در تولید `production`
- `PORT`: `3000` (الزامی برای محیط کانتینر و پروکسی)
- `HOST`: `0.0.0.0`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: اطلاعات اتصال MySQL 8 (در رانفلر استفاده از آدرس سرویس داخلی با پورت `3306` بسیار سریع‌تر است)
- `STORAGE_PATH`: مسیر مونت دیسک ماندگار (در رانفلر `/MYDISK`)
- `JWT_SECRET`: کلید امضای توکن‌های دسترسی JWT
- `AUDIT_HMAC_KEY`: کلید امضای زنجیره حسابرسی `audit_logs`
- `METRICS_SECRET`: توکن دسترسی به اندپوینت `/api/metrics`

### نکات بیلد و اجرا در سرور ابری (Runflare / Docker)
- فایل `Dockerfile` از بیلد دو مرحله‌ای (Node 20 Alpine) استفاده می‌کند:
  1. مرحله `builder`: اجرای `npm run build` (کامپایل Vite به `dist/` و باندل `server.ts` با `esbuild` به `dist/server.js`).
  2. مرحله `runner`: نصب فقط `dependencies` و اجرا با `CMD ["node", "dist/server.js"]`.
- **نکته مهم پیش از تغییر کد:** در اجرای توسعه در AI Studio/Vite، متغیر `DISABLE_HMR=true` باعث غیرفعال شدن HMR و Watch می‌شود؛ پس پس از تغییرات بک‌اند یا فرانت‌اند در محیط توسعه نیاز به Restart سرور توسعه است.
- اگر جداول جدیدی به پروژه اضافه کردید، یا آن‌ها را در `domainTablesSetup.ts` قرار دهید یا با `npm run db:init` همگام‌سازی کنید تا سرور روی دیتابیس جدید یا موجود با خطای `ER_NO_SUCH_TABLE` یا `ER_BAD_FIELD_ERROR` مواجه نشود.

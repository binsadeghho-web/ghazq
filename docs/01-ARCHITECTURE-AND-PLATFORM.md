# ۱. معماری پلتفرم و جریان داده (Architecture & Platform)

این سند ساختار لایه‌های زیرساختی سرور (`server.ts` و `src/server/platform/`) و معماری مدیریت وضعیت کلاینت (`src/services/` و `src/context/`) را تشریح می‌کند.

---

## بخش الف: چرخه عمر درخواست در سرور (`server.ts`)

سرور روی فریم‌ورک Express در پورت پیش‌فرض `3000` (یا `process.env.PORT`) با هاست `0.0.0.0` بالا می‌آید و میدل‌ورها دقیقاً به ترتیب زیر اجرا می‌شوند:

1. **`express.json({ limit: '15mb' })`**: پشتیبانی از بدنه JSON و آپلود فایل‌های Base64 تا سقف ۱۵ مگابایت.
2. **`persianNormalizerMiddleware`** (`src/server/platform/persianNormalizer.ts`):
   - تبدیل خودکار `ي -> ی`، `ك -> ک` و ارقام فارسی/عربی به لاتین در `req.body` و `req.query`.
   - فیلدهای حساس (`password`, `currentPassword`, `newPassword`, `password_hash`, `token`, `refreshToken`, `totpCode`, `base64Data`, `dataUrl`) از این تبدیل مستثنی هستند تا رمز عبور یا داده باینری دست‌کاری نشود.
3. **هدرهای ضد-کش (Zero-Stale Cache):** برای مسیرهای `/`، `*.html` و `/api/*` هدرهای `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0` و `Surrogate-Control: no-store` تنظیم می‌شوند.
4. **بودجه زمانی درخواست (Request Timeout - 15s):** هر درخواست HTTP (به‌جز استریم طولانی‌مدت `GET /api/events`) پس از ۱۵ ثانیه در صورت عدم پاسخ با خطای `504 REQUEST_TIMEOUT` بسته می‌شود.
5. **هدرهای امنیتی پایه:** `X-Content-Type-Options: nosniff`، `X-Frame-Options: SAMEORIGIN`، `Referrer-Policy: strict-origin-when-cross-origin`.
6. **Request ID و متریک‌های Golden Signals:** تولید یا دریافت `X-Request-Id` با UUIDv7، ثبت لاگ ساخت‌یافته با `logger.ts` و محاسبه تاخیرها در `metricsStore` برای `/api/metrics`.
7. **پروب‌های سلامت و دیسک:** `/livez` (`/health`, `/healthz`) و `/readyz` (همواره با پاسخ 200 برای پایداری Healthcheck رانفلر، شامل وضعیت اتصال MySQL و سلامت دیسک `storageConfig`).
8. **محافظت از مسیرهای خصوصی `/uploads/...`:** دسترسی مستقیم استاتیک به پوشه‌های خصوصی (`consultations`, `research`, `cartable_alumni`, `cartable_officials`, `verdicts`, `product_receipts`) با HTTP `403` مسدود است. فایل‌های عمومی (`avatars`, `products`, `courses`, `misc`) از طریق `express.static` سرو می‌شوند.
9. **میدل‌ورهای زنجیره `/api`:**
   - `rateLimitMiddleware()` (`src/server/platform/rateLimiter.ts`): محدودیت نرخ درخواست روی API.
   - `idempotencyMiddleware()` (`src/server/platform/idempotency.ts`): ذخیره و بازپخش پاسخ برای درخواست‌های تکراری دارای هدر `Idempotency-Key`.
   - `sessionAuthMiddleware` (`src/server/platform/sessionAuth.ts`): حذف هدرهای جعلی کلاینت (`x-user-id`, `x-user-role`, `x-user-name`)، اعتبارسنجی توکن JWT Bearer یا نشست، بررسی ابطال سشن و کنترل وضعیت `mustChangePassword`.
   - `rbacEnforcementMiddleware` (`src/server/modules/rbac/rbacModule.ts`): اعمال دسترسی مبتنی بر بخش (`AppSectionId`) و جلوگیری از هرگونه Mutation توسط نقش `general_observer`.
   - `ipBlockEnforcementMiddleware` و `maintenanceEnforcementMiddleware` (`src/server/modules/ops/opsModule.ts`): انسداد IPهای مسدودشده و اعمال حالت تعمیر سراسری یا ماژولی.
10. **`createMasterRouter()`** (`src/server/routes.ts`): مونت کردن ۱۴ روتر دامنه + `/upload/:category` + `/storage/private/...` + `/events/ticket` + `/events` + `/metrics`.
11. **`rfc9457ErrorHandler`** (`src/server/platform/errors.ts`): تبدیل `AppError` و خطاهای پیش‌بینی‌نشده به قالب استاندارد `ProblemDetails` (RFC 9457).
12. **سرو فرانت‌اند:** در `development` از `vite.middlewares` (با `appType: 'spa'`) و در `production` از `dist/` استفاده می‌کند. پس از `app.listen()` پوشه‌های ذخیره‌سازی به‌صورت غیرمسدودکننده (`initStorageDirectories`) مقداردهی می‌شوند.

---

## بخش ب: اجزای کلیدی زیرساخت بک‌اند (`src/server/platform/`)

| فایل | مسئولیت فنی |
| :--- | :--- |
| `mysqlDatabase.ts` | مدیریت `mysql.createPool`، تنظیم `timezone: 'Z'` و `charset: 'utf8mb4'`، `decimalNumbers: false` (جلوگیری از خطای اعشار مالی)، `acquireConnection` با گارد ضد-لیک، `selectWithTimeout` با `MAX_EXECUTION_TIME` و تراکنش `withTx()`. |
| `uuidv7.ts` و `database.ts` | تولید UUIDv7 مرتب‌شونده بر اساس زمان (`generateUUIDv7()`) و تبدیل دوطرفه رشته 36 کاراکتری <-> بافر 16 بایتی (`toIdBuffer()`, `fromIdBuffer()`). |
| `domainTablesSetup.ts` | ایجاد و مهاجرت ایمن جداول جدید و ستون‌های تکمیلی روی MySQL (`ensureDomainTablesAndIndexes()`). |
| `errors.ts` | کلاس `AppError` با متدهای کارخانه‌ای (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `internal`, ...) و خروجی استاندارد RFC 9457 (`type`, `title`, `status`, `detail`, `code`, `invalidParams`, `requestId`). |
| `httpUtils.ts` | تابع `extractExpectedVersion(req, required)` برای استخراج شماره نسخه OCC از هدر `If-Match` یا بدنه `expectedVersion`/`version`. |
| `idempotency.ts` | جلوگیری از ثبت تکراری روی `POST`/`PATCH` در صورت ارسال `Idempotency-Key` با مقایسه هش بدنه (`request_hash`) و بازگرداندن پاسخ کش‌شده. |
| `outbox.ts` | الگوی Transactional Outbox؛ رویدادهای دامنه با `outbox.enqueue(topic, payload)` در جدول `outbox` و حافظه منتشر شده و بلافاصله به کلاینت‌های SSE ارسال می‌شوند. |
| `auditChain.ts` | ثبت رخدادهای امنیتی در جدول `audit_logs` و فایل آرشیو؛ هر رکورد دارای `prev_hash` و `entry_hash` (مهرشده با `AUDIT_HMAC_KEY`) است تا هرگونه دستکاری قابل کشف (`verifyChain`) باشد. |
| `jwtService.ts` | صدور و اعتبارسنجی Access Token با امضای HS256 (مدت پیش‌فرض ۱۵ دقیقه) و Refresh Token با چرخش (Rotation) و تشخیص استفاده مجدد از توکن لو رفته (Reuse Detection -> ابطال کل خانواده نشست). |
| `sessionAuth.ts` | میدل‌ور استخراج کاربر جاری از JWT/Session + تابع کمکی `getCurrentUser(req)` و `requireAuth` / `requireRole`. |
| `authorization.ts` | `AuthorizationPolicy` برای بررسی نقش (`requireRole`), مالکیت منبع BOLA/IDOR (`assertOwnership`), دسترسی بخش (`assertSectionAccess`) و زیربخش رفاهی (`assertWelfareSubSection`). |
| `storage.ts` & `storageAdapter.ts` | مدیریت مسیر دیسک (`STORAGE_PATH` یا `./storage`)، دسته‌بندی ۱۲ نوع فایل و پشتیبانی از زیرپوشه (مثلاً `course_<courseId>` برای گواهی‌های هر دوره). |
| `uploadSecurity.ts` | بررسی امضای باینری فایل (Magic Bytes) برای جلوگیری از آپلود فایل‌های اجرایی یا جعلی با پسوند عوض‌شده و تحمیل پسوند استاندارد (`canonicalExt`). |
| `singleFlight.ts` | جلوگیری از Cache Stampede برای خواندن‌های تکراری هم‌زمان. |
| `rateLimiter.ts` | محدودیت نرخ درخواست روی مسیرهای حساس. |
| `logger.ts` | لاگر ساختاریافته JSON با سطوح استاندارد. |

---

## بخش ج: جریان بلادرنگ (Real-Time SSE & Delta Patching)

1. کلاینت در `apiClient.ts` پس از لاگین موفق یک بلیت موقت ۳۰ ثانیه‌ای از `POST /api/events/ticket` دریافت می‌کند.
2. سپس اتصال `EventSource('/api/events?ticket=...')` را برقرار می‌نماید (تا توکن دائمی JWT هرگز در URL یا لاگ پروکسی قرار نگیرد).
3. سرور حداکثر **۳ اتصال هم‌زمان SSE** به ازای هر کاربر نگه می‌دارد (`MAX_SSE_PER_USER = 3`).
4. رویدادها از `outbox` با کنترل دسترسی و جلوگیری از نشت اطلاعات (Leak Prevention) فیلتر می‌شوند:
   - رویدادهای خصوصی (`cartable.*`, `private_msg.*`, `research.*` به‌جز کانفیگ، و `counseling.requested/updated/...`) فقط به مالک رکورد یا نقش‌های سازمانی مجاز ارسال می‌شوند.
   - رویدادهای `rulings.*` برای کاربران غیرسازمانی از فیلدهای محرمانه (`adminTags`, `internalReviewNote`) پاک‌سازی می‌شوند و آراء منتشرنشده ارسال نمی‌شوند.
   - رویدادهای `auth.session_revoked`, `auth.token_version_bumped`, `user.suspended` بلافاصله اتصال SSE کاربر را با پیام `session_terminated` می‌بندند.
5. هر ۱۵ ثانیه یک `: heartbeat` برای زنده نگه داشتن اتصال در پشت Nginx / Cloud Run / Runflare ارسال می‌شود.

---

## بخش د: معماری فرانت‌اند (`src/services/` و `src/context/`)

### کلاینت مرکزی API (`src/services/apiClient.ts`)
کلاس `ApiClient` (نمونه یکتای `api`؛ فایل `src/services/api.ts` فقط برای سازگاری مجدداً export شده است):
- تزریق خودکار `Authorization: Bearer <accessToken>`
- افزودن `Cache-Control: no-cache` و `cache: 'no-store'` روی `GET`ها
- تولید خودکار هدر `Idempotency-Key` (UUID) روی `POST` و `PATCH`
- تزریق خودکار هدر `If-Match: "<version>"` روی `PUT` و `PATCH` در صورت وجود `expectedVersion` یا `version`
- **Silent Refresh Interceptor:** در صورت دریافت HTTP `401` (به‌جز مسیرهای `/auth/login` و `/auth/refresh`)، به‌صورت خودکار `POST /api/auth/refresh` را صدا زده، توکن جدید را در `localStorage` (`feqh_access_token`, `feqh_refresh_token`) ذخیره و درخواست اصلی را یک بار تکرار می‌کند.
- پخش رویداد سراسری `app:concurrent_conflict` در خطای `409` تا مودال `ConcurrentConflictModal` به کاربر نمایش داده شود.

### معماری Contextها (`src/context/`)
به جای یک فایل غول‌پیکر، وضعیت به ۹ Provider دامنه‌ای شکسته شده و `AppContext.tsx` نقش Facade/تجمیع‌کننده برای هوک `useApp()` را دارد:

1. `ThemeContext`: حالت تاریک/روشن (`theme`) و انتخاب پوسته طراحی (`designTheme`: `'crextio' | 'portal' | 'minimal' | 'mizan'`).
2. `SecurityAndOpsContext`: لاگ‌های حسابرسی، تنظیمات امنیتی، وضعیت تعمیر، خطاها، هشدارهای امنیتی و IPهای مسدود.
3. `AuthContext`: کاربر جاری (`currentUser`)، وضعیت بررسی نشست (`isAuthLoading`)، لیست کاربران (برای مدیران)، تنظیمات تکمیل پروفایل هویتی (`alumniProfileSettings`) و متدهای ورود/خروج/مدیریت نشست.
4. `CartableContext`: درخواست‌های کارتابل، دسته‌بندی‌ها، راهنما و موضوعات قابل پیگیری.
5. `CoursesContext`: دوره‌ها، ثبت‌نام‌ها، اقساط شخصی و مدیریتی، کدهای تخفیف، حضوروغیاب، لیست انتظار و گواهی‌های هر دوره.
6. `ProductsContext`: محصولات فروشگاه، سفارش‌ها و تنظیمات فروشگاه.
7. `CounselingContext`: مشاوران، درخواست‌های مشاوره (هر دو بخش عمومی و تخصصی)، تنظیمات و مراحل پویا فرم‌ساز (`specializedConfig`, `generalConfig`)، زمینه‌های مشاوره (`counselingFields`)، تعرفه‌ها (`counselingTariffs`) و آزمون‌های روان‌شناسی (`psychologicalTests`, `testAssignments`, `testResults`).
8. `WelfareContext`: درخواست‌های وام و اسکان، اقلام و سفارش‌های تعاونی مصرف، پیشنهادات محصول و قوانین وام.
9. `ResearchAndRulingsContext`: پرونده‌های راهبری پژوهش + تنظیمات فرم‌ساز پژوهشی و تالار آراء قضایی + تنظیمات ویترین آراء.

### نکته مهم درباره مودال‌ها و ویزاردهای چندمرحله‌ای
چون رویدادهای SSE یا همگام‌سازی‌های پس‌زمینه می‌توانند رفرنس آرایه‌های Context (مانند `counselingFields` یا `wizardSteps`) را تغییر دهند، کامپوننت‌های ویزارد (مانند `CounselingDynamicWizardModal` و `CounselingFormBuilderTab`) نباید در هر تغییر رفرنس propها وضعیت داخلی (`stepIndex`, `responses`, `draft`) را ریست کنند؛ برای این کار از `wasOpenRef` یا وابستگی به `version` استفاده شده است.

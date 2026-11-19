# ۳. ماژول‌های دامنه و مرجع کامل API (Modules & API Reference)

تمامی Endpointهای سرور با پیشوند `/api` در `src/server/routes.ts` مونت می‌شوند. در این سند، کاربرد تجاری، کامپوننت‌های فرانت‌اند متناظر و کلیه مسیرهای API هر ۱۴ ماژول مستند شده‌اند.

---

## ۱. احراز هویت و نشست‌ها (`/api/auth`)
- **بک‌اند:** `src/server/modules/auth/authModule.ts`, `totpService.ts`
- **فرانت‌اند:** `ModernLoginPage.tsx`, `LoginModal.tsx`, `SessionManagerModal.tsx`, `AuthContext.tsx`
- **منطق کلیدی:** ورود با نام کاربری / کد ملی / شماره موبایل یا **کد مرکز (`center_code`)** با رمز عبور هش‌شده (`bcrypt`)، قفل حساب پس از خطاهای متوالی (`failed_attempts`), پشتیبانی از تغییر رمز اجباری در اولین ورود (`mustChangePassword`)، صدور JWT (۱۵ دقیقه) + Refresh Token (چرخشی) و احراز هویت دوعاملی TOTP.

| متد و مسیر | توضیح |
| :--- | :--- |
| `POST /api/auth/login` | ورود با `identifier` (یا `nationalId`) و `password` و در صورت نیاز `totpCode` |
| `POST /api/auth/refresh` | تمدید نشست با Refresh Token (دارای Rotation و Reuse Detection) |
| `POST /api/auth/change-password` | تغییر رمز عبور (و رفع اجبار `mustChangePassword`) |
| `GET /api/auth/me` | دریافت اطلاعات کاربر احراز هویت‌شده فعلی از دیتابیس |
| `POST /api/auth/logout` | خروج و ابطال نشست فعلی |
| `POST /api/auth/global-logout` | خروج از تمام دستگاه‌ها و افزایش `token_version` |
| `GET /api/auth/sessions` | لیست نشست‌های فعال کاربر |
| `DELETE /api/auth/sessions/:sessionId` | ابطال یک نشست خاص |
| `POST /api/auth/setup-2fa` | تولید Secret و QR احراز هویت دوعاملی |
| `POST /api/auth/verify-2fa` | تایید و فعال‌سازی 2FA |

---

## ۲. پروفایل هویتی دانش‌آموختگان (`/api/users`)
- **بک‌اند:** `src/server/modules/user/userRoutes.ts`, `userRepository.ts`
- **فرانت‌اند:** `AlumniIdentityCardModal.tsx`, `AlumniProfileCompletionWidget.tsx`, `utils/profileCompletion.ts`
- **قانون کسب‌وکار (اصلاحیه ۵۶):**
  - مدیر دانش‌آموختگان می‌تواند قابلیت تکمیل اطلاعات توسط دانش‌آموختگان را فعال/غیرفعال کند.
  - ۴ فیلد پایه (**نام و نام خانوادگی، کد ملی، شماره همراه و کد مرکز**) برای دانش‌آموخته **همواره فقط خواندنی** هستند و فقط توسط ادمین ویرایش می‌شوند؛ سایر فیلدهای هویتی/علمی/شغلی توسط خود دانش‌آموخته قابل تکمیل هستند.
  - ویجت درصد تکمیل اطلاعات (`AlumniProfileCompletionWidget`) درصد تکمیل را بر اساس فیلدهای پرشده محاسبه می‌کند.

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/users/alumni-profile-settings` | دریافت تنظیمات تکمیل اطلاعات هویتی دانش‌آموختگان |
| `PUT /api/users/alumni-profile-settings` | فعال/غیرفعال کردن تکمیل اطلاعات از پنل مدیر |
| `GET /api/users/me/identity` | دریافت اطلاعات کارت هویتی من |
| `PUT /api/users/me/identity` | ذخیره تغییرات مجاز پروفایل هویتی توسط دانش‌آموخته |

---

## ۳. سطوح دسترسی و نقش‌ها (`/api/rbac`)
- **بک‌اند:** `src/server/modules/rbac/rbacModule.ts`
- **فرانت‌اند:** `RoleAndCustomerAccessCenter.tsx`, `utils/rbacPolicy.ts`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/rbac/policies` | دریافت ماتریس سیاست دسترسی تمام نقش‌ها |
| `PUT /api/rbac/policies/:roleId` | به‌روزرسانی دسترسی بخش‌ها و زیربخش‌های یک نقش (با OCC) |
| `PATCH /api/rbac/customer-item-visibility` | کنترل نمایش تک‌تک آیتم‌ها (دوره/محصول) برای نقش مشتری (`customer`) |
| `POST /api/rbac/bulk-assign-role` | انتساب گروهی نقش به کاربران |
| `POST /api/rbac/register-customer` | ثبت‌نام مشتری بیرونی |

---

## ۴. داشبورد و ویترین‌ها (`/api/dashboard`)
- **بک‌اند:** `src/server/modules/dashboard/dashboardModule.ts`
- **فرانت‌اند:** `DashboardSection.tsx`, `DashboardWidgetsSuite.tsx`, `crextio/CrextioDashboard.tsx`, `mizan/MizanDashboard.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/dashboard/widgets-data` | دریافت بنرهای فعال، رویدادهای تقویم و وضعیت نمایش ویجت‌ها |
| `PUT /api/dashboard/widget-toggles` | روشن/خاموش کردن ویجت‌های داشبورد (ادمین) |
| `POST/PUT/DELETE /api/dashboard/banners(/:id)` | مدیریت کامل بنرهای اطلاع‌رسانی |
| `POST/PUT/DELETE /api/dashboard/events(/:id)` | مدیریت کامل رویدادهای تقویم مرکز |

---

## ۵. کارتابل اداری و آموزشی (`/api/cartable`)
- **بک‌اند:** `cartableModule.ts`, `cartableReferralAndAttachmentsRoutes.ts`
- **فرانت‌اند:** `CartableSection.tsx`, `CartableNewRequestModal.tsx`, `CartableCategoriesModal.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/cartable` و `GET /api/cartable/:id` | لیست و جزئیات درخواست‌های کارتابل (با فیلتر مالکیت برای دانش‌آموخته) |
| `POST /api/cartable` | ثبت درخواست جدید با شماره رهگیری یکتا |
| `POST /api/cartable/:id/reply` | ارسال پیام پاسخ داخل پرونده |
| `POST /api/cartable/:id/read` | علامت‌گذاری خوانده‌شدن پیام‌ها |
| `PATCH /api/cartable/:id/status` | تغییر وضعیت پرونده (`pending`, `in_progress`, `need_info`, `rejected`, `completed`, `archived`) |
| `PUT /api/cartable/:id` | ویرایش مشخصات پرونده |
| `PATCH /api/cartable/:id/referral` | ارجاع بین‌بخشی و تخصیص مسئول پیگیری و یادداشت محرمانه داخلی |
| `POST /api/cartable/:id/attachments` | افزودن پیوست (تفکیک پوشه دانش‌آموختگان و مسئولین) |
| `GET /api/cartable/config` | دریافت راهنما، دسته‌بندی‌ها و موضوعات قابل پیگیری |
| `PUT /api/cartable/config/guide` / `categories` / `followable-topics` | ویرایش پیکربندی بخش کارتابل توسط مدیر |

---

## ۶. دوره‌های تخصصی، کدهای تخفیف، اقساط و گواهی‌ها (`/api/courses`)
- **بک‌اند:** `coursesModule.ts`, `courseDiscountsRoutes.ts`, `courseInstallmentsRoutes.ts`, `courseOperationsRoutes.ts`
- **فرانت‌اند:** `CoursesSection.tsx`, `CourseAdminPanelModal.tsx`, `CoursesContext.tsx`
- **قابلیت‌های ویژه:**
  - **کدهای تخفیف چندگانه (`courseDiscountsRoutes.ts`):** پشتیبانی از تخفیف درصدی، مبلغ ثابت، تک‌دوره، چنددوره، همگانی، بر اساس مخاطب، ویژه کدملی خاص و ثبت‌نام زودهنگام + گزارش کامل تاریخچه استفاده‌کنندگان (`GET /api/courses/discounts/:id/details`).
  - **گواهی اختصاصی هر دوره:** فایل‌های گواهی در پوشه مجزا به نام هر دوره (`storage/uploads/course_certificates/course_<courseId>/`) ذخیره می‌شوند و فقط صاحب گواهی یا مدیران قادر به دانلود آن هستند.
  - **توجه مهم (قید کاربر):** «بخش ۶» در ساختار دوره‌ها طبق دستور صریح کاربر نباید تغییر داده شود یا پیاده‌سازی مازاد روی آن انجام گیرد.

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/courses` و `POST/PUT/DELETE /api/courses(/:id)` | دریافت لیست و مدیریت کامل دوره‌ها (با Soft Delete و بازیابی `POST /:id/restore`) |
| `GET /api/courses/enrollments` و `POST /api/courses/:id/enroll` | لیست ثبت‌نام‌ها و ثبت‌نام کاربر (با اعمال کد تخفیف و انتخاب پرداخت نقدی یا قسطی) |
| `PATCH /api/courses/enrollments/:id/status` | تایید یا رد فیش واریزی ثبت‌نام توسط مدیر |
| `POST /api/courses/:id/sms` | ارسال پیامک اطلاع‌رسانی به فراگیران دوره |
| `GET /api/courses/:courseId/operations` و `PATCH .../operations-settings` | وضعیت لیست انتظار، حضوروغیاب و گواهی‌های دوره |
| `POST /api/courses/:courseId/attendance` | ثبت حضوروغیاب جلسه‌ای |
| `POST /api/courses/:courseId/waitlist` و `PATCH .../waitlist/:waitlistId` | مدیریت صف انتظار |
| `POST /api/courses/:courseId/certificates` و `DELETE .../:certId` | صدور/بارگذاری و حذف گواهی دوره |
| `GET /api/courses/installments/my` و `/installments/admin` | مشاهده اقساط کاربر و کارتابل مدیریتی اقساط |
| `POST /api/courses/installments/:installmentId/pay` و `PATCH .../review` | پرداخت قسط و بررسی مدیر |
| `GET/POST/PUT/DELETE /api/courses/discounts(/:id)` | تعریف و مدیریت انواع کدهای تخفیف |
| `GET /api/courses/discounts/:id/details` | نمایش کامل مشخصات و لیست استفاده‌کنندگان کد تخفیف به ادمین |
| `POST /api/courses/discounts/validate` | اعتبارسنجی لحظه‌ای کد تخفیف قبل از پرداخت کاربر |

---

## ۷. فروشگاه آثار و کتب (`/api/products`)
- **بک‌اند:** `productsModule.ts`, `productHelpers.ts`
- **فرانت‌اند:** `ProductsSection.tsx`, `ProductsContext.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/products` و `GET /api/products/:id` | لیست و جزئیات آثار |
| `POST/PUT/DELETE /api/products(/:id)` و `PUT /api/products/reorder` | مدیریت محصولات و ترتیب نمایش آن‌ها |
| `POST /api/products/:id/purchase` | ثبت سفارش خرید (با کسر موجودی امن تراکنشی و ثبت فیش) |
| `GET /api/products/orders` و `PATCH /api/products/orders/:orderId/status` | مدیریت سفارش‌های مشتریان |
| `GET/PUT /api/products/store-config` | تنظیمات فروشگاه |

---

## ۸. مشاوره عمومی (روان‌شناسان مرکز) و مشاوره تخصصی شغلی/تحصیلی (`/api/counseling`)
- **بک‌اند:** `counselingModule.ts`, `counselingConfigRoutes.ts`, `counselingDossierRoutes.ts`, `counselingTestsRoutes.ts`
- **فرانت‌اند:**
  - بخش عمومی: `CounselingSection.tsx`, `AdminCounselingGeneralSuite.tsx`, `GeneralCounselingTariffsTab.tsx`, `PsychologicalTestsTab.tsx`
  - بخش تخصصی: `SpecializedCareerCounselingSection.tsx`, `AdminSpecializedCounselingSuite.tsx`
  - کامپوننت‌های مشترک تفکیک‌شده با `counselingType`: `CounselingLandingHero.tsx`, `CounselingDynamicWizardModal.tsx`, `CounselingFormBuilderTab.tsx`, `CounselingFieldsManager.tsx`, `CounselingFieldsShowcase.tsx`, `CounselingCalendarAndDossierSuite.tsx`
- **معماری اصلاحیه‌ها ۴۵ الی ۵۴:**
  - **تفکیک کامل:** هر بخش دارای تنظیمات، فرم‌ساز ۱۰۰٪ پویا (مراحل و فیلدها توسط مدیر ساخته می‌شود)، لیست مشاوران، زمینه‌های مشاوره و درخواست‌های مجزاست.
  - **الگوی ورود (Landing First):** دانش‌آموخته ابتدا صفحه معرفی، زمینه‌های مشاوره، رزومه مشاوران (در صورت فعال بودن نمایش برای دانش‌آموخته) و دکمه «توضیحات» را می‌بیند؛ سپس با کلیک روی CTA وارد ویزارد گام‌به‌گام (`CounselingDynamicWizardModal`) می‌شود. دکمه «توضیحات» در تمام مراحل ویزارد نیز در دسترس است.
  - **نرخ‌نامه و تست‌ها (ویژه مشاوره عمومی):** امکان نمایش نرخ‌نامه در سربرگ مجزا و در انتهای ویزارد (دکمه «اطلاع از نرخ نامه مشاوره مرکز»)، و قابلیت طراحی تست روان‌شناسی و باز کردن آن برای دانش‌آموخته مشخص + مشاهده نتایج و ثبت تحلیل توسط روان‌شناس.

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/counseling/config/:type` و `PUT .../config/:type` | دریافت و ویرایش ساختار کامل صفحه و فرم‌ساز پویا (`general` یا `specialized_career`) |
| `GET/POST/PUT/DELETE /api/counseling/fields(/:id)` | مدیریت «زمینه‌های مشاوره» هر بخش |
| `GET/POST/PUT/DELETE /api/counseling/consultants(/:id)` | مدیریت مشاوران/روان‌شناسان و رزومه آن‌ها |
| `PUT /api/counseling/consultants/:id/schedule` | تقویم نوبت‌ها و اسلات‌های حضور مشاور |
| `GET/POST/PUT /api/counseling/requests(/:id)` و `PATCH .../:id/status` | ثبت درخواست از ویزارد، پیگیری، زمان‌بندی جلسه و تغییر وضعیت |
| `PATCH /api/counseling/requests/:id/identity-visibility` | مخفی‌سازی/آشکارسازی هویت متقاضی برای حفظ محرمانگی |
| `GET/POST /api/counseling/dossiers` | پرونده سوابق جلسات مشاوره |
| `GET/POST/PUT/DELETE /api/counseling/tariffs(/:id)` | مدیریت نرخ‌نامه مشاوره عمومی مرکز |
| `GET/POST/PUT/DELETE /api/counseling/tests(/:id)` | بانک تست‌های روان‌شناختی |
| `GET/POST /api/counseling/test-assignments` و `POST .../:id/submit` | باز کردن تست برای دانش‌آموخته و ثبت پاسخ تست |
| `GET /api/counseling/test-results` و `PATCH .../:id/review` | مشاهده و تحلیل نتایج تست توسط روان‌شناس |

---

## ۹. راهبری پژوهش و مقاله (`/api/research`)
- **بک‌اند:** `researchModule.ts`, `researchHelpers.ts`
- **فرانت‌اند:** `ResearchMentorshipSection.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET/PUT /api/research/config` | پیکربندی و فرم‌ساز مرحله‌به‌مرحله بخش راهبری پژوهش |
| `GET /api/research` و `GET /api/research/:id` | لیست و جزئیات پرونده‌های پژوهشی |
| `POST /api/research` و `PUT /api/research/:id` | ثبت و ویرایش طرح پژوهشی |
| `PATCH /api/research/:id/status` و `PATCH /api/research/:id/progress` | تغییر وضعیت و درصد پیشرفت پژوهش |
| `POST /api/research/:id/messages` و `DELETE /api/research/:id` | پیام‌های راهبر علمی و حذف نرم پرونده |

---

## ۱۰. تالار نقد و بررسی آراء قضایی (`/api/rulings`)
- **بک‌اند:** `rulingsModule.ts`, `rulingHelpers.ts`, `rulingAdminAndInteractionsRoutes.ts`, `rulingHighlightsAndPinRoutes.ts`
- **فرانت‌اند:** `JudicialRulingsSection.tsx`, `RulingAdminReviewPanel.tsx`, `RulingDetailReader.tsx`, `RulingUploadModal.tsx`, `RulingPortalDesignerModal.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET/PUT /api/rulings/portal-config` | تنظیمات ویترین، تگ‌های عمومی و برچسب‌های داخلی مدیران |
| `GET/POST/PUT /api/rulings(/:id)` و `PUT /api/rulings/reorder` | لیست، ثبت، ویرایش و مرتب‌سازی آراء |
| `POST /api/rulings/:id/approve` | تایید، انتخاب برگزیده سیستم و تنظیم قابلیت نمایش به دانش‌آموختگان |
| `POST /api/rulings/:id/like` و `POST /api/rulings/:id/dislike` | تعامل (پسند/عدم پسند) |
| `POST /api/rulings/:id/discussion` (و `/critique`), `PATCH/DELETE .../discussions/:discussionId` | ثبت، ویرایش و حذف نقد و مباحثه |
| `PATCH /api/rulings/:id/discussions/:discussionId/feature` | برجسته‌سازی (پین) نظر برگزیده |
| `PUT /api/rulings/:id/highlights` | ذخیره هایلایت‌های متنی روی رأی |

---

## ۱۱. خدمات رفاهی، اسکان و تعاونی مصرف (`/api/welfare`)
- **بک‌اند:** `welfareModule.ts`, `welfareInventoryAndPostalRoutes.ts`
- **فرانت‌اند:** `WelfareSection.tsx`, `AdminWelfareSuite.tsx`, `WelfareCalculatorAndPostalSuite.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET/POST /api/welfare/requests` و `GET/PUT /api/welfare/requests/:id` | درخواست‌های وام قرض‌الحسنه و اسکان زیارتی |
| `GET/POST/PUT/DELETE /api/welfare/consumables(/:id)` و `PATCH .../:id/inventory` | مدیریت کالاها و موجودی تعاونی مصرف |
| `GET/POST /api/welfare/orders` و `PATCH /api/welfare/orders/:id/status` / `postal-tracking` | سفارش‌های تعاونی و کد رهگیری مرسوله پستی |
| `GET/POST /api/welfare/proposals` | پیشنهادات محصول اعضا |
| `GET/PUT /api/welfare/sections-config`, `/loan-rules`, `/cooperative-info` | تنظیمات زیربخش‌ها، ماشین‌حساب و قوانین وام و اطلاعات تعاونی |

---

## ۱۲. دیوار هم‌افزایی و همدلی (`/api/synergy`)
- **بک‌اند:** `synergyModule.ts`, `wallIdentityRepository.ts`, `wallOwnershipRepository.ts`
- **فرانت‌اند:** `SynergyWallSection.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/synergy`, `GET /api/synergy/my-posts`, `GET /api/synergy/:id` | دریافت پست‌ها، پست‌های من و جزئیات پست |
| `POST /api/synergy` و `PUT /api/synergy/:id` | انتشار و ویرایش پست (با قابلیت ناشناس‌سازی هویت) |
| `POST /api/synergy/:id/respond` و `PATCH /api/synergy/:id/resolve` | ثبت پاسخ تخصصی و بستن موضوع |

---

## ۱۳. مدیریت کاربران، تنظیمات و امور مالی (`/api/admin`)
- **بک‌اند:** `adminModule.ts`, `adminSettingsRepository.ts`, `alumniPrivacyAndFinanceRoutes.ts`
- **فرانت‌اند:** `UserManagementModule.tsx`, `AlumniDirectorySection.tsx`, `FinanceSection.tsx`, `FinancialAuditLedgerModule.tsx`, `AdminControlCenter.tsx`, `ThemeCustomizerModal.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET/POST/PUT/DELETE /api/admin/users(/:id)` | CRUD کامل کاربران و دانش‌آموختگان (شامل تنظیم `centerCode`) |
| `POST /api/admin/users/bulk-import` | ورود دسته‌جمعی لیست دانش‌آموختگان |
| `POST /api/admin/users/:id/unlock` و `toggle-active` و `PUT .../credentials` | باز کردن قفل حساب، فعال/غیرفعال‌سازی و تغییر نام کاربری/رمز |
| `GET/PATCH /api/admin/security-config` | تنظیمات امنیتی کل سامانه (سیاست رمز، قفل، نشست) |
| `GET /api/admin/audit-logs` و `POST /api/admin/audit-logs/verify` | مشاهده و راستی‌آزمایی رمزنگاری زنجیره لاگ‌های حسابرسی |
| `GET/PUT /api/admin/dashboard-config` و `/theme-config` | تنظیمات داشبورد و پوسته ظاهری |
| `GET/PUT /api/admin/privacy-settings(/:sectionId)` | کنترل محرمانگی اطلاعات دانش‌آموختگان |
| `GET /api/admin/financial-balance` | تراز مالی تجمیعی دوره‌ها، فروشگاه و رفاه |
| `POST /api/admin/run-migration` | اجرای دستی همگام‌سازی جداول و ایندکس‌ها |

---

## ۱۴. عملیات، مانیتورینگ و نگهداری سیستم (`/api/ops`)
- **بک‌اند:** `opsModule.ts`
- **فرانت‌اند:** `CommandCenterSection.tsx`, `AnalyticsReportsModule.tsx`, `SecurityAndOpsContext.tsx`

| متد و مسیر | توضیح |
| :--- | :--- |
| `GET /api/ops/health` و `POST /api/ops/database/ping` | وضعیت سلامت سیستم و پینگ دیتابیس |
| `GET /api/ops/sessions` و `POST /api/ops/sessions/:id/revoke` | مانیتورینگ و ابطال نشست‌های فعال |
| `GET /api/ops/error-logs`, `POST .../:id/resolve`, `DELETE .../resolved` | مشاهده و رفع خطاهای ثبت‌شده سیستم |
| `POST /api/ops/audit-logs/:id/rollback` | بازگردانی عملیات حسابرسی (در صورت پشتیبانی) |
| `GET /api/ops/security-alerts` و `POST .../:id/toggle-monitor` | هشدارهای امنیتی |
| `GET /api/ops/maintenance`, `POST .../maintenance/global` / `module` | حالت تعمیرات کل سایت یا ماژول خاص |
| `GET/POST /api/ops/backups(/create)` | تهیه و لیست بکاپ‌های دیتابیس |
| `GET/POST/DELETE /api/ops/blocked-ips(/:ip)` | مسدودسازی و رفع انسداد IPها |
| `GET /api/ops/secrets-check`, `POST /api/ops/jobs/run`, `GET /api/ops/weekly-digest`, `POST /api/ops/send-emergency-sms` | بررسی سلامت کلیدها، اجرای جاب‌ها، خلاصه هفتگی و پیامک اضطراری |

---

## ۱۵. اندپوینت‌های فایل، متریک و SSE (`src/server/routes.ts`)

| متد و مسیر | توضیح |
| :--- | :--- |
| `POST /api/upload/:category` | آپلود Base64 با اعتبارسنجی Magic-Bytes. برای `course_certificate` اگر `courseId` ارسال شود در زیرپوشه `course_<courseId>` ذخیره می‌شود. |
| `GET /api/storage/private/:category/:subFolderOrFilename/:maybeFilename?` | دانلود امن فایل خصوصی با بررسی مالکیت (BOLA) برای پیوست کارتابل، آراء، فیش خرید، فیش دوره و گواهی دوره + هدرهای `Content-Security-Policy: sandbox` و `nosniff`. |
| `POST /api/events/ticket` و `GET /api/events` | دریافت بلیت ۳۰ ثانیه‌ای و برقراری جریان SSE |
| `GET /api/metrics` | شاخص‌های Golden Signals (با نشست ادمین یا `METRICS_SECRET`) |

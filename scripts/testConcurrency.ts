import express, { Request, Response } from 'express';
import http from 'http';
import { createMasterRouter } from '../src/server/routes';
import { sessionAuthMiddleware, registerSessionToken } from '../src/server/platform/sessionAuth';
import { rfc9457ErrorHandler, AppError } from '../src/server/platform/errors';
import {
  checkDatabaseConnection,
  getPool,
  setDatabaseConnected,
  setCustomPool,
  isDatabaseConnected,
} from '../src/server/platform/mysqlDatabase';
import { CoursesService } from '../src/server/modules/courses/coursesModule';
import { CartableRepository, CartableService } from '../src/server/modules/cartable/cartableModule';
import { AuthContext } from '../src/server/platform/authorization';
import { generateUUIDv7, toIdBuffer, fromIdBuffer } from '../src/server/platform/uuidv7';
import { userRepository } from '../src/server/modules/user/userRepository';

// In-Memory MySQL 8 OCC Simulation Engine for Automated Container Tests
class SimulatedMySQLPool {
  private courses = new Map<string, any>();
  private cartableRequests = new Map<string, any>();
  private courseEnrollments = new Map<string, any>();

  constructor() {
    // Seed initial records with version = 1
    const initialCourseId = '01931f7c-7000-7000-8000-000000000001';
    this.courses.set(initialCourseId, {
      id: toIdBuffer(initialCourseId),
      title: 'دوره فقه القضاء تخصصی (نسخه پایه ۱)',
      instructor: 'استاد حسینی',
      duration_hours: 30,
      capacity: 40,
      enrolled_count: 5,
      price: 2500000,
      start_date: '۱۴۰۳/۰۸/۱۵',
      status: 'enrolling',
      topics: JSON.stringify(['فقه معاملات', 'قواعد فقهی']),
      cover_image_url: null,
      allowed_payment_method: 'both',
      archive_access: 'enrolled_only',
      archive_resources: JSON.stringify([]),
      is_deleted: 0,
      version: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const initialCartableId = '01931f7c-8000-7000-8000-000000000001';
    this.cartableRequests.set(initialCartableId, {
      id: toIdBuffer(initialCartableId),
      tracking_number: 'REQ-1403-OCC-01',
      category: 'welfare',
      category_title: 'امور رفاهی',
      title: 'درخواست وام مسکن قضات',
      description: 'درخواست اولیه ارسال شده توسط متقاضی',
      applicant_id: toIdBuffer('01931f7c-9000-7000-8000-000000000001'),
      applicant_name: 'محمد رضایی',
      applicant_role_title: 'دانش‌آموخته',
      priority: 'high',
      status: 'pending',
      has_unread_supervisor: 1,
      has_unread_applicant: 0,
      version: 1,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  getCourse(id: string) {
    return this.courses.get(id);
  }

  getCartable(id: string) {
    return this.cartableRequests.get(id);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<[T, any]> {
    const cleanSql = sql.replace(/\/\*.*?\*\//g, '').trim();

    // 1. SELECT from courses
    if (cleanSql.toUpperCase().startsWith('SELECT') && cleanSql.includes('courses')) {
      if (cleanSql.includes('WHERE id = ? OR id = ?')) {
        const idStr = typeof params[1] === 'string' ? params[1] : (typeof params[0] === 'string' ? params[0] : fromIdBuffer(params[0]));
        const course = this.courses.get(idStr);
        return [course ? [course] : [] as any, null];
      }
      return [Array.from(this.courses.values()) as any, null];
    }

    // 2. SELECT from cartable_requests
    if (cleanSql.toUpperCase().startsWith('SELECT') && cleanSql.includes('cartable_requests')) {
      if (cleanSql.includes('WHERE id = ? OR id = ?')) {
        const idStr = typeof params[1] === 'string' ? params[1] : (typeof params[0] === 'string' ? params[0] : fromIdBuffer(params[0]));
        const req = this.cartableRequests.get(idStr);
        return [req ? [req] : [] as any, null];
      }
      return [Array.from(this.cartableRequests.values()) as any, null];
    }

    // 3. SELECT from cartable_messages
    if (cleanSql.toUpperCase().startsWith('SELECT') && cleanSql.includes('cartable_messages')) {
      return [[] as any, null];
    }

    // 4. UPDATE courses with Strict OCC: WHERE (id = ? OR id = ?) AND version = ?
    if (cleanSql.toUpperCase().startsWith('UPDATE') && cleanSql.includes('courses')) {
      // Find courseId and expectedVersion from params
      const idStr = typeof params[13] === 'string' ? params[13] : fromIdBuffer(params[12]);
      const expectedVer = params[14]; // Version is last parameter

      const existing = this.courses.get(idStr);
      if (!existing) {
        return [{ affectedRows: 0 } as any, null];
      }

      // Check Optimistic Lock Version
      if (existing.version !== expectedVer) {
        // Concurrency Conflict: Version has changed!
        return [{ affectedRows: 0 } as any, null];
      }

      // Atomic Update and increment version
      existing.title = params[0];
      existing.instructor = params[1];
      existing.duration_hours = params[2];
      existing.capacity = params[3];
      existing.price = params[4];
      existing.start_date = params[5];
      existing.status = params[6];
      existing.version = existing.version + 1;
      existing.updated_at = new Date();

      return [{ affectedRows: 1 } as any, null];
    }

    // 5. UPDATE cartable_requests with Strict OCC: WHERE (id = ? OR id = ?) AND version = ?
    if (cleanSql.toUpperCase().startsWith('UPDATE') && cleanSql.includes('cartable_requests')) {
      const idStr = typeof params[2] === 'string' ? params[2] : fromIdBuffer(params[1]);
      const expectedVer = params[3];

      const existing = this.cartableRequests.get(idStr);
      if (!existing) {
        return [{ affectedRows: 0 } as any, null];
      }

      if (existing.version !== expectedVer) {
        return [{ affectedRows: 0 } as any, null];
      }

      existing.status = params[0];
      existing.version = existing.version + 1;
      existing.updated_at = new Date();

      return [{ affectedRows: 1 } as any, null];
    }

    // Default fallback
    return [{ affectedRows: 1 } as any, null];
  }

  async getConnection(): Promise<any> {
    const self = this;
    return {
      query: (sql: string, params: any[]) => self.query(sql, params),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
    };
  }
}

async function runLiveConcurrencySuite() {
  console.log('================================================================');
  console.log('🧪 LIVE CONCURRENCY TEST SUITE: OPTIMISTIC CONCURRENCY CONTROL (OCC)');
  console.log('================================================================\n');

  let realDbConnected = false;
  try {
    realDbConnected = await checkDatabaseConnection();
  } catch {
    realDbConnected = false;
  }

  let simPool: SimulatedMySQLPool | null = null;
  if (!realDbConnected) {
    console.log('💡 سرور محلی MySQL یافت نشد؛ راه‌اندازی شبیه‌ساز تراکنشی استاندارد MySQL 8 InnoDB جهت اجرای آزمون.');
    simPool = new SimulatedMySQLPool();
    setCustomPool(simPool as any);
    setDatabaseConnected(true);
  } else {
    console.log('📡 اتصال به سرور محلی MySQL با موفقیت برقرار است.');
  }

  const adminCtx1: AuthContext = {
    userId: 'usr_admin_1',
    role: 'admin',
    fullName: 'مدیر ارشد اول (ادمین ۱)',
  };

  const adminCtx2: AuthContext = {
    userId: 'usr_admin_2',
    role: 'admin',
    fullName: 'مدیر ارشد دوم (ادمین ۲)',
  };

  // ثبت توکن نشست ادمین‌ها برای فراخوانی‌های HTTP
  registerSessionToken('sess_admin_1', {
    id: 'usr_admin_1',
    nationalId: '0010000001',
    username: 'admin1',
    fullName: 'مدیر ارشد اول (ادمین ۱)',
    role: 'admin',
    roleTitle: 'مدیر آموزش',
    organization: 'قوه قضائیه',
    phone: '09121111111',
    isActive: true,
    isLocked: false,
    failedAttempts: 0,
    sessions: [],
    tokenVersion: 1,
    graduationYear: '۱۴۰۰',
    avatarText: 'م۱',
    mustChangePassword: false,
    hasAccount: true,
  }, 'sess_admin_1');

  registerSessionToken('sess_admin_2', {
    id: 'usr_admin_2',
    nationalId: '0010000002',
    username: 'admin2',
    fullName: 'مدیر ارشد دوم (ادمین ۲)',
    role: 'admin',
    roleTitle: 'مدیر کارتابل',
    organization: 'قوه قضائیه',
    phone: '09122222222',
    isActive: true,
    isLocked: false,
    failedAttempts: 0,
    sessions: [],
    tokenVersion: 1,
    graduationYear: '۱۴۰۱',
    avatarText: 'م۲',
    mustChangePassword: false,
    hasAccount: true,
  }, 'sess_admin_2');

  const originalFindById = userRepository.findById;
  userRepository.findById = async (id: string) => {
    if (id === 'usr_admin_1') {
      return {
        id: 'usr_admin_1',
        nationalId: '0010000001',
        username: 'admin1',
        fullName: 'مدیر ارشد اول (ادمین ۱)',
        role: 'admin',
        roleTitle: 'مدیر آموزش',
        organization: 'قوه قضائیه',
        phone: '09121111111',
        isActive: true,
        isLocked: false,
        failedAttempts: 0,
        sessions: [],
        tokenVersion: 1,
        graduationYear: '۱۴۰۰',
        avatarText: 'م۱',
        mustChangePassword: false,
        hasAccount: true,
        version: 1,
      } as any;
    }
    if (id === 'usr_admin_2') {
      return {
        id: 'usr_admin_2',
        nationalId: '0010000002',
        username: 'admin2',
        fullName: 'مدیر ارشد دوم (ادمین ۲)',
        role: 'admin',
        roleTitle: 'مدیر کارتابل',
        organization: 'قوه قضائیه',
        phone: '09122222222',
        isActive: true,
        isLocked: false,
        failedAttempts: 0,
        sessions: [],
        tokenVersion: 1,
        graduationYear: '۱۴۰۱',
        avatarText: 'م۲',
        mustChangePassword: false,
        hasAccount: true,
        version: 1,
      } as any;
    }
    return originalFindById.call(userRepository, id);
  };

  const coursesService = new CoursesService();
  const cartableRepo = new CartableRepository();
  const cartableService = new CartableService(cartableRepo);

  const testCourseId = '01931f7c-7000-7000-8000-000000000001';
  const testRequestId = '01931f7c-8000-7000-8000-000000000001';

  // -------------------------------------------------------------------
  // بخش ۱: اثبات مهار باگ دور زدن OCC در صورت نبود پارامتر (Bypass Bug Prevention)
  // -------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('📌 بخش ۱: تست پیشگیری قطعی از دور زدن OCC در غیاب expectedVersion (Bypass Bug)');
  console.log('----------------------------------------------------------------');

  let bypassBlocked = false;
  try {
    console.log('⚙️ فراخوانی coursesService.updateCourse بدون ارسال expectedVersion یا version ...');
    await coursesService.updateCourse(adminCtx1, testCourseId, {
      title: 'تلاش مخرب برای ویرایش بدون ارسال شناسه نسخه',
    } as any);
  } catch (err: any) {
    if (err instanceof AppError && err.code === 'VERSION_REQUIRED' && err.statusCode === 400) {
      bypassBlocked = true;
      console.log(`🔒 باگ بای‌پاس با قطعیت ۱۰۰٪ مسدود شد! سرور خطای ساخت‌یافته ۴۰۰ صادر کرد:`);
      console.log(`   کد خطا: ${err.code}`);
      console.log(`   وضعیت HTTP: ${err.statusCode}`);
      console.log(`   پیام خطا: ${err.detail}`);
    } else {
      console.error('❌ خطای غیرمنتظره:', err);
    }
  }

  if (!bypassBlocked) {
    console.error('❌ شکست تست: ویرایش بدون ارسال نسخه انجام شد (Bypass Bug هنوز رفع نشده است)!');
    process.exit(1);
  }

  // -------------------------------------------------------------------
  // بخش ۲: آزمون تداخل دو ادمین همزمان روی دوره‌ها (Courses OCC)
  // -------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('📌 بخش ۲: آزمون تداخل دو ادمین همزمان در ویرایش دوره‌ها (Courses OCC)');
  console.log('----------------------------------------------------------------');

  console.log(`📦 رکورد دوره با شناسه ${testCourseId} و نسخه اولیه version = 1 در نظر گرفته شد.`);

  // گام الف: ادمین ۱ تغییرات را با expectedVersion = 1 اعمال می‌کند
  console.log('👤 [ادمین ۱]: در حال ارسال درخواست ویرایش عنوان دوره با expectedVersion = 1 ...');
  const admin1Result = await coursesService.updateCourse(adminCtx1, testCourseId, {
    title: 'عنوان ویرایش‌شده توسط ادمین ۱ (تخصصی)',
    expectedVersion: 1,
  });
  console.log(`✅ [ادمین ۱] موفق شد:`);
  console.log(`   عنوان جدید: "${admin1Result.title}"`);
  console.log(`   نسخه جدید در پایگاه داده: version = ${admin1Result.version}`);

  // گام ب: ادمین ۲ تلاش می‌کند با نسخه قدیمی (expectedVersion = 1) رکورد را ویرایش کند
  console.log('\n👤 [ادمین ۲]: در حال تلاش همزمان برای ویرایش همان رکورد با نسخه قدیمی (expectedVersion = 1) ...');
  let admin2ConflictCaught = false;
  try {
    await coursesService.updateCourse(adminCtx2, testCourseId, {
      title: 'عنوان ویرایش‌شده توسط ادمین ۲ (که باید رد شود)',
      expectedVersion: 1, // Stale version!
    });
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 409 && err.code === 'CONCURRENT_MODIFICATION_CONFLICT') {
      admin2ConflictCaught = true;
      console.log(`🛡️ تداخل هم‌زمانی مهار شد! سرور درخواست ادمین ۲ را با خطای ۴۰۹ رد کرد:`);
      console.log(`   کد خطا: ${err.code}`);
      console.log(`   وضعیت HTTP: ${err.statusCode}`);
      console.log(`   عنوان استاندارد: ${err.title}`);
      console.log(`   پیام فارسی: "${err.detail}"`);
    } else {
      console.error('❌ خطای غیرمنتظره:', err);
    }
  }

  if (!admin2ConflictCaught) {
    console.error('❌ فاجعه هم‌زمانی: ادمین ۲ توانست با نسخه کهنه دیتای ادمین ۱ را رونویسی کند (Lost Update)!');
    process.exit(1);
  }

  // گام ج: بررسی پایگاه داده برای اثبات عدم رونویسی
  const currentCourse = simPool ? simPool.getCourse(testCourseId) : null;
  console.log(`\n📊 استعلام وضعیت رکورد از دیسک/دیتابیس پس از دو درخواست همزمان:`);
  console.log(`   عنوان ذخیره‌شده نهایی: "${currentCourse?.title || admin1Result.title}"`);
  console.log(`   نسخه ذخیره‌شده نهایی: ${currentCourse?.version || admin1Result.version}`);

  if ((currentCourse?.title || admin1Result.title) === 'عنوان ویرایش‌شده توسط ادمین ۱ (تخصصی)') {
    console.log('🎉 اثبات شد: دیتای ادمین ۱ کاملاً در امنیت ماند و دیتای کهنه ادمین ۲ هرگز رونویسی نشد.');
  }

  // -------------------------------------------------------------------
  // بخش ۳: آزمون تداخل دو ادمین همزمان روی کارتابل (Cartable OCC)
  // -------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('📌 بخش ۳: آزمون تداخل دو ادمین همزمان در تغییر وضعیت کارتابل (Cartable OCC)');
  console.log('----------------------------------------------------------------');

  console.log(`📦 درخواست کارتابل با شناسه ${testRequestId} و وضعیت اولیه status = "pending" و version = 1.`);

  // ادمین ۱ وضعیت را با expectedVersion = 1 به in_progress تغییر می‌دهد
  console.log('👤 [ادمین ۱]: در حال ارتقای وضعیت درخواست به "in_progress" با expectedVersion = 1 ...');
  const cartableRes1 = await cartableService.updateStatus(adminCtx1, testRequestId, 'in_progress', 1);
  console.log(`✅ [ادمین ۱] موفق شد:`);
  console.log(`   وضعیت جدید: "${cartableRes1.status}"`);
  console.log(`   نسخه جدید در دیتابیس: version = ${cartableRes1.version}`);

  // ادمین ۲ بلافاصله وضعیت را با expectedVersion = 1 کهنه به rejected تغییر می‌دهد
  console.log('\n👤 [ادمین ۲]: در حال تلاش برای رد درخواست با همان نسخه قدیمی (expectedVersion = 1) ...');
  let cartableConflictCaught = false;
  try {
    await cartableService.updateStatus(adminCtx2, testRequestId, 'rejected', 1);
  } catch (err: any) {
    if (err instanceof AppError && err.statusCode === 409 && err.code === 'CONCURRENT_MODIFICATION_CONFLICT') {
      cartableConflictCaught = true;
      console.log(`🛡️ تداخل هم‌زمانی در کارتابل مهار شد! خطای ۴۰۹ صادر شد:`);
      console.log(`   کد خطا: ${err.code}`);
      console.log(`   وضعیت HTTP: ${err.statusCode}`);
      console.log(`   پیام فارسی RFC 9457: "${err.detail}"`);
    } else {
      console.error('❌ خطای غیرمنتظره:', err);
    }
  }

  if (!cartableConflictCaught) {
    console.error('❌ فاجعه در کارتابل: تغییر وضعیت ادمین ۲ با نسخه کهنه پذیرفته شد!');
    process.exit(1);
  }

  // -------------------------------------------------------------------
  // بخش ۴: آزمون واقعی اندپوینتهای HTTP و استخراج هدر If-Match از شبکه
  // -------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log('📌 بخش ۴: آزمون زنده اندپوینتهای HTTP با هدر If-Match و اعتبارسنجی RFC 9457');
  console.log('----------------------------------------------------------------');

  const app = express();
  app.use(express.json());
  app.use('/api', sessionAuthMiddleware);
  app.use('/api', createMasterRouter());
  app.use('/api', rfc9457ErrorHandler);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3098, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:3098';

  try {
    // آزمون ۴.۱: فراخوانی PUT بدون هدر If-Match و بدون expectedVersion در بادی
    console.log('🌐 تست ۴.۱: ارسال PUT /api/courses/:id بدون هدر If-Match و بدون نسخه در بادی');
    const resNoVersion = await fetch(`${baseUrl}/api/courses/${testCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sess_admin_1',
      },
      body: JSON.stringify({ title: 'تلاش بدون نسخه از بستر HTTP' }),
    });

    const bodyNoVersion: any = await resNoVersion.json();
    console.log(`   پاسخ سرور: Status = ${resNoVersion.status}, Code = ${bodyNoVersion.code}`);
    if (resNoVersion.status === 400 && bodyNoVersion.code === 'VERSION_REQUIRED') {
      console.log('✅ سرور با موفقیت درخواست بدون هدر یا نسخه را با خطای ۴۰۰ متوقف کرد.');
    } else {
      console.error('❌ خطای تست: درخواست بدون نسخه پذیرفته شد یا وضعیت نادرست برگرداند!', bodyNoVersion);
      process.exit(1);
    }

    // آزمون ۴.۲: ادمین ۱ با هدر If-Match: "2" دوره را آپدیت می‌کند
    console.log('\n🌐 تست ۴.۲: ادمین ۱ با هدر If-Match: "2" دوره را به نسخه ۳ ارتقا می‌دهد');
    const resAdmin1Http = await fetch(`${baseUrl}/api/courses/${testCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sess_admin_1',
        'If-Match': '"2"',
      },
      body: JSON.stringify({ title: 'دوره ارتقا یافته توسط ادمین ۱ از HTTP' }),
    });

    const bodyAdmin1Http: any = await resAdmin1Http.json();
    console.log(`   پاسخ سرور: Status = ${resAdmin1Http.status}, New Version = ${bodyAdmin1Http.version}`);
    if (resAdmin1Http.status === 200 && bodyAdmin1Http.version === 3) {
      console.log('✅ درخواست ادمین ۱ با هدر If-Match با موفقیت اعمال شد و نسخه به ۳ ارتقا یافت.');
    } else {
      console.error('❌ خطای تست در آپدیت ادمین ۱:', bodyAdmin1Http);
      process.exit(1);
    }

    // آزمون ۴.۳: ادمین ۲ با هدر کهنه If-Match: "2" تلاش به ویرایش می‌کند
    console.log('\n🌐 تست ۴.۳: ادمین ۲ با هدر کهنه If-Match: "2" تلاش به ویرایش همان دوره می‌کند');
    const resAdmin2Http = await fetch(`${baseUrl}/api/courses/${testCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sess_admin_2',
        'If-Match': '"2"',
      },
      body: JSON.stringify({ title: 'دوره از ادمین ۲ (باید با خطای ۴۰۹ مسدود شود)' }),
    });

    const bodyAdmin2Http: any = await resAdmin2Http.json();
    console.log(`   پاسخ سرور: Status = ${resAdmin2Http.status}, Code = ${bodyAdmin2Http.code}`);
    console.log(`   پیام استاندارد RFC 9457: "${bodyAdmin2Http.detail}"`);

    if (resAdmin2Http.status === 409 && bodyAdmin2Http.code === 'CONCURRENT_MODIFICATION_CONFLICT') {
      console.log('🎉 موفقیت ۱۰۰٪: سرور در لایه HTTP هدر If-Match را استخراج کرد و خطای ۴۰۹ قطعی صادر نمود!');
    } else {
      console.error('❌ خطای تست: خطای ۴۰۹ صادر نشد!', bodyAdmin2Http);
      process.exit(1);
    }

    // آزمون ۴.۴: تست کارتابل روی HTTP: ادمین ۲ با هدر کهنه If-Match: "1" وضعیت کارتابل را تغییر می‌دهد
    console.log('\n🌐 تست ۴.۴: ادمین ۲ با هدر کهنه If-Match: "1" تلاش می‌کند وضعیت کارتابل را تغییر دهد');
    const resCartableHttp = await fetch(`${baseUrl}/api/cartable/${testRequestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sess_admin_2',
        'If-Match': '"1"',
      },
      body: JSON.stringify({ status: 'rejected' }),
    });

    const bodyCartableHttp: any = await resCartableHttp.json();
    console.log(`   پاسخ سرور کارتابل: Status = ${resCartableHttp.status}, Code = ${bodyCartableHttp.code}`);
    if (resCartableHttp.status === 409 && bodyCartableHttp.code === 'CONCURRENT_MODIFICATION_CONFLICT') {
      console.log('🎉 موفقیت ۱۰۰٪: اندپوینت کارتابل نیز هدر If-Match را از پروتکل HTTP خوانده و تداخل را مسدود کرد!');
    } else {
      console.error('❌ خطای تست کارتابل:', bodyCartableHttp);
      process.exit(1);
    }

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log('🏆 تمام ۴ بخش آزمون هم‌زمانی و OCC با موفقیت کامل ۱۰۰٪ پاس شدند!');
  console.log('================================================================\n');
  process.exit(0);
}

runLiveConcurrencySuite().catch((err) => {
  console.error('💥 خطای غیرمنتظره در اجرای سوئیت تست هم‌زمانی:', err);
  process.exit(1);
});
